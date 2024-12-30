/**
 * CategoryController
 *
 * @description :: Server-side logic for managing categories
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var _request = require('request');
var ObjectId = require('mongodb').ObjectID;

module.exports = {
    save: function (req, res) {
        API(CategoryService.saveCategory, req, res);
    },

    update: function (req, res) {
        API(CategoryService.updateCategory, req, res);
    },

    delete: function (req, res) {
        API(CategoryService.delete, req, res);
    },

    allCategories: function (req, res, next) {

        var query = {};
        if (req.param('type')) {
            query.type = req.param('type');
        }
        query.parentId = { $not: { $eq: null } };
        query.isDeleted = false
        query.status = 'active'

        Category.find(query).sort("name ASC").populate('parentId', { select: ['isDeleted', 'status'] }).exec(function (err, categories) {
            var cats = []
            if (categories) {
                for (var i = 0; i < categories.length; i++) {
                    if (categories[i].parentId != undefined && categories[i].parentId.isDeleted == false && categories[i].parentId.status == 'active') {
                        let thisCat = categories[i]

                        thisCat.parentId = thisCat.parentId.id

                        cats.push(thisCat)
                    }
                }
            }

            return res.jsonx({
                success: true,
                data: cats
            });
        });
    },

    categorieslist: function (req, res, next) {

        var query = {};

        query.isDeleted = false;
        query.status = "active";


        Category.find(query).exec(function (err, categories) {
            //
            async.each(categories, function (category, callback) {
                let qry = {};
                qry.categoryId = category.id;
                qry.isDeleted = false;
                qry.isApproved = true;
                qry.isExpired = false;

                //

                Crops.native(function (err, croplist) {
                    croplist.aggregate([{
                        "$match": qry
                    },
                    {
                        "$group": {
                            "_id": null,
                            "max": { "$max": "$price" },
                            "min": { "$min": "$price" },
                            "images": { "$first": "$images" },
                            "coverImage": "$coverImage",
                            "totalCrops": { "$sum": 1 }
                        }
                    }
                    ], function (err, totalresults) {

                        if (err) {
                            return res.status(400).jsonx({
                                success: false,
                                error: err
                            });
                        } else {
                            category['crop'] = totalresults ? totalresults[0] : {};
                            callback();
                        }
                    });
                })
            }, function (error) {
                if (error) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.jsonx({
                        success: true,
                        data: categories
                    });
                }
            });

        });
    },

    categories: function (req, res) {

        var sortBy = req.param('sortBy');
        var query = {};

        if (sortBy) {
            sortBy = sortBy.toString();
        } else {
            sortBy = 'createdAt desc';
        }


        query.isDeleted = 'false';
        query.type = req.param('type');
        query.status = "active";
        var search = req.param('search');
        if (search) {
            query.$or = [{
                name: {
                    'like': '%' + search + '%'
                }
            }, {
                type: {
                    'like': '%' + search + '%'
                }
            }

            ]
        }

        Category.find(query).sort(sortBy).exec(function (err, category) {

            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                return res.jsonx({
                    success: true,
                    data: category
                });
            }
        })
    },

    getAllCategory: function (req, res, next) {

        var search = req.param('search');
        var sortBy = req.param('sortBy');
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var query = {};

        if (sortBy) {
            sortBy = sortBy.toString();
        } else {
            sortBy = 'createdAt desc';
        }

        query.isDeleted = 'false';

        if (search) {
            query.$or = [{
                name: {
                    'like': '%' + search + '%'
                }
            }, {
                type: {
                    'like': '%' + search + '%'
                }
            }

            ]
        }


        Category.count(query).exec(function (err, total) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                Category.find(query)
                    .populate("parentId")
                    .sort(sortBy)
                    .skip(skipNo)
                    .limit(count)
                    .exec(function (err, category) {
                        if (err) {
                            return res.status(400).jsonx({
                                success: false,
                                error: err
                            });
                        } else {
                            return res.jsonx({
                                success: true,
                                data: {
                                    category: category,
                                    total: total
                                },
                            });
                        }
                    })
            }
        })
    },

    parentCategories: function (req, res) {


        var query = {};
        var sortBy = 'name ASC';

        query.isDeleted = false;
        query.status = "active";
        if (req.param('type') && req.param('type') != 'null') {
            query.type = req.param('type')
        }
        //query.parentId= {$exists:false}
        query.parentId = null;
        Category.find(query).sort(sortBy).exec(function (err, parentcat) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                return res.jsonx({
                    success: true,
                    data: parentcat
                });
            }
        })
    },

    subCategories: function (req, res) {

        var categoryId = {};
        var sortBy = 'name ASC';

        categoryId.parentId = req.param('id');
        categoryId.isDeleted = 'false';
        categoryId.status = "active";

        Category.find(categoryId).populate('parentId').sort(sortBy).exec(function (err, subcatlist) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                return res.jsonx({
                    success: true,
                    data: subcatlist
                });
            }
        })
    },

    subCategoriesbyid: function (req, res) {

        var categoryId = {};
        var sortBy = 'name ASC';

        categoryId.id = req.param('id');
        categoryId.isDeleted = 'false';
        categoryId.status = "active";

        Category.find(categoryId).populate('parentId').sort(sortBy).exec(function (err, subcatlist) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                return res.jsonx({
                    success: true,
                    data: subcatlist
                });
            }
        })
    },

    frontFilterCategory: function (req, res) {

        var query = {};
        var sortBy = 'name ASC';

        query.isDeleted = 'false';
        query.status = "active";
        query.parentId = null;
        query.type = req.param('type')

        Category.find(query).sort(sortBy).exec(function (err, parentcats) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                var qry = {};
                var count = 0;

                async.each(parentcats, function (parentcat, callback) {
                    qry.parentId = parentcat.id;
                    qry.isDeleted = false;

                    Category.find(qry).sort(sortBy).then(function (childCategory) {

                        parentcat['subCategories'] = childCategory;
                        let i = 0;
                        async.each(childCategory, function (chCategory, cb) {
                            let cropQuery = {}
                            cropQuery.category = chCategory.id;
                            cropQuery.isExpired = false;
                            cropQuery.isDeleted = false;
                            cropQuery.isApproved = true;
                            //console.log(cropQuery, 'cropquery====')
                            Crops.count(cropQuery).then(function (total) {
                                // console.log(total, 'total')
                                parentcat['subCategories'][i]["total"] = total;
                                i = i + 1;
                                cb();
                            }).fail(function (error) {
                                cb(error);
                            })
                        }, function (error) {
                            if (error) {

                            } else {
                                return res.jsonx({
                                    success: true,
                                    data: parentcats
                                });
                            }
                        })
                        callback();
                    })
                        .fail(function (error) {
                            callback(error);
                        })
                }
                    //     , function (error) {
                    //     if (error) {

                    //     } else {
                    //         return res.jsonx({
                    //             success: true,
                    //             data: parentcats
                    //         });
                    //     }
                    // }
                );
            }
        })
    },

    homepagecategory: function (req, res) {

        var query = {};
        var sortBy = 'name ASC';

        query.isDeleted = 'false';
        query.status = "active";
        query.parentId = null;
        if (req.param('type')) {
            query.type = req.param('type')
        }

        Category.find(query, { fields: ['secondaryColor', 'name', 'image'] }).sort(sortBy).exec(function (err, parentcats) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                var qry = {};

                async.each(parentcats, function (parentcat, callback) {
                    qry.parentId = parentcat.id;
                    qry.isDeleted = false;
                    qry.status = "active";

                    Category.find(qry, { fields: ['name', 'iconImage'] }).sort(sortBy).exec(function (err, childCategory) {
                        parentcat['subCategories'] = childCategory;
                        callback();
                    })
                }, function (error) {
                    return res.jsonx({
                        success: true,
                        data: parentcats
                    });
                });
            }
        })
    },


    categoryInformationWithProducts: function (req, res) {
        let catid = req.param('id')
        if (catid == undefined || catid == null) {
            return res.status(400).jsonx({
                success: false,
                error: "Please send category id"
            });
        }

        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

        let variety = req.param('variety')
        let productType = req.param('productType')

        let pincode = req.param('pincode')

        let cropcount = parseInt(req.param('cropscount'))
        let croppage = parseInt(req.param('cropspage'))
        var cropskipNo = (croppage - 1) * cropcount;

        let pricescount = -1
        if (req.param('pricescount')) {
            pricescount = parseInt(req.param('pricescount'))
        }
        let pricespage = req.param('pricespage')
        var pricesskipNo = 0
        if (pricescount > -1 && pricespage) {
            pricespage = parseInt(req.param('pricespage'))
            pricesskipNo = (pricespage - 1) * pricescount;
        }

        let priceFrom = req.param('priceFrom')
        let priceTo = req.param('priceTo')
        let market = req.param('market')

        var sortBy = req.param('cropsSortBy');

        var sortquery = {};

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];

            //sortquery[field?field:field] = sortType?(sortType=='desc'?1:-1):-1;
        }

        sortquery[field ? field : "createdAt"] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;


        Category.findOne({ id: catid, isDeleted: false }).populate('parentId', { select: ['name', 'variety', 'image', 'bannerImage', 'iconImage', 'primaryColor', 'secondaryColor'] }).exec(function (err, category) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else if (category == undefined || category == null) {
                return res.status(400).jsonx({
                    success: false,
                    error: "No valid category at given id"
                });
            } else {
                Category.find({ parentId: category.id, isDeleted: false }, { fields: ['name', 'variety', 'image', 'bannerImage', 'iconImage', 'primaryColor', 'secondaryColor'] }).sort('name asc').exec(function (err, subcategory) {
                    if (subcategory) {
                        category.subcategories = subcategory
                    }

                    if (category.type == 'inputs') {
                        if (pincode) {
                            Market.find({ select: ['id'], where: { pincode: { "$in": [JSON.parse(pincode)] } } }).then(function (markesId) {
                                if (markesId.length > 0) {
                                    let markets = []
                                    // let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
                                    for (var i = 0; i < markesId.length; i++) {
                                        markets.push(markesId[i].id)
                                    }
                                    InputService.categoryBased(markets, category, req, res)
                                } else {
                                    InputService.categoryBased([], category, req, res)
                                }
                            })
                        } else {
                            InputService.categoryBased([], category, req, res)
                        }

                    } else {
                        let initquery = {}
                        initquery.isApproved = true
                        initquery.isDeleted = false
                        initquery.isExpired = false
                        initquery.bidEndDate = { "$gt": new Date() }
                        let initpriceqry = {}
                        initpriceqry.verified = true

                        let query = {}
                        let pricequery = {}

                        if (category.parentId == undefined || category.parentId == null) {
                            query.parentCategoryId = ObjectId(category.id)
                            pricequery.parentCategoryId = ObjectId(category.id)
                        } else {
                            initquery.category = ObjectId(category.id)
                            query.categoryId = ObjectId(category.id)
                            pricequery.categoryId = ObjectId(category.id)
                        }
                        if (variety) {
                            initquery.$or = [{ variety: undefined }, { variety: null }, { variety: variety }]
                            query.$or = [{ variety: undefined }, { variety: null }, { variety: variety }]

                            initpriceqry.$or = [{ variety: undefined }, { variety: null }, { variety: variety }]
                            pricequery.$or = [{ variety: undefined }, { variety: null }, { variety: variety }]
                        }
                        if (priceFrom) {
                            initpriceqry.createdAt = { $gte: new Date(priceFrom) }
                        }
                        if (priceTo) {
                            initpriceqry.createdAt = { $lte: new Date(priceTo) }
                        }
                        if (market) {
                            pricequery.marketId = ObjectId(market)
                        }


                        Prices.native(function (err, allprices) {
                            allprices.aggregate([
                                {
                                    $match: initpriceqry
                                },
                                {
                                    $sort: { 'createdAt': -1 }
                                },
                                {
                                    $lookup: {
                                        from: 'category',
                                        localField: 'category',
                                        foreignField: '_id',
                                        as: "category"
                                    }
                                },
                                {
                                    $unwind: '$category'
                                },
                                {
                                    $lookup: {
                                        from: 'category',
                                        localField: 'category.parentId',
                                        foreignField: '_id',
                                        as: "parentCategory"
                                    }
                                },
                                {
                                    $unwind: '$parentCategory'
                                },
                                {
                                    $lookup: {
                                        from: 'market',
                                        localField: 'market',
                                        foreignField: '_id',
                                        as: "market"
                                    }
                                },
                                {
                                    $unwind: '$market'
                                },
                                {
                                    $project: {
                                        category: "$category.name",
                                        parentCategory: "$parentCategory.name",
                                        parentCategoryId: "$parentCategory._id",
                                        categoryId: "$category._id",
                                        price: "$price",
                                        createdAt: "$createdAt",
                                        marketId: "$market._id",
                                        marketName: "$market.name",
                                        variety: "$variety"
                                    }
                                },
                                {
                                    $match: pricequery
                                }
                            ], function (err, prices) {
                                if (err) {

                                    return res.status(200).jsonx({
                                        success: true,
                                        data: category
                                    });
                                } else {
                                    var finalPricesResult = prices

                                    if (pricescount > -1) {
                                        finalPricesResult = prices.slice(pricesskipNo, pricesskipNo + pricescount)
                                    }

                                    category.prices = finalPricesResult
                                    category.totalPrices = prices.length
                                    query.leftAfterAcceptanceQuantity = { $gt: 0 }
                                    Crops.native(function (err, allcrops) {
                                        allcrops.aggregate([
                                            {
                                                $match: initquery
                                            },
                                            {
                                                $sort: sortquery
                                            },
                                            {
                                                $lookup: {
                                                    from: 'category',
                                                    localField: 'category',
                                                    foreignField: '_id',
                                                    as: "category"
                                                }
                                            },
                                            {
                                                $unwind: '$category'
                                            },
                                            {
                                                $lookup: {
                                                    from: 'category',
                                                    localField: 'category.parentId',
                                                    foreignField: '_id',
                                                    as: "parentCategory"
                                                }
                                            },
                                            {
                                                $unwind: '$parentCategory'
                                            },
                                            {
                                                $project: {
                                                    category: "$category.name",
                                                    parentCategory: "$parentCategory.name",
                                                    parentCategoryId: "$parentCategory._id",
                                                    categoryId: "$category._id",
                                                    code: "$code",
                                                    name: "$name",
                                                    price: "$price",
                                                    quantityUnit: "$quantityUnit",
                                                    images: "$images",
                                                    coverImage: "$coverImage",
                                                    bidEndDate: "$bidEndDate",
                                                    variety: "$variety",
                                                    leftAfterAcceptanceQuantity: "$leftAfterAcceptanceQuantity",
                                                    quantity: "$quantity",
                                                    pincode: "$pincode",
                                                    market: "$market",
                                                    efarmxComission: "$efarmxComission",
                                                    taxRate: "$taxRate",
                                                    district: "$district",
                                                }
                                            },
                                            {
                                                $match: query
                                            }
                                        ], function (err, crops) {
                                            if (err) {
                                                return res.status(200).jsonx({
                                                    success: true,
                                                    data: category
                                                });
                                            } else {
                                                var finalResult = crops.slice(cropskipNo, cropskipNo + cropcount)

                                                if (pincode) {
                                                    async.each(finalResult, function (crop, callback) {
                                                        Market.findOne({ id: crop.market }).populate('GM', { select: ['pincode'] }).then(function (market) {
                                                            let sourceP = crop.pincode
                                                            if (market && market.GM && market.GM.pincode) {
                                                                sourceP = market.GM.pincode
                                                            }
                                                            let qry = {}
                                                            qry.isDeleted = false
                                                            let category = String(crop.categoryId)

                                                            qry.destination = parseInt(pincode)
                                                            qry.category = category
                                                            qry.source = sourceP

                                                            let now = new Date()

                                                            qry.$or = [{ validUpto: null }, { validUpto: undefined }, { validUpto: { $gt: now } }]

                                                            Logisticprice.find(qry).sort('load desc').then(function (lprices) {
                                                                if (lprices.length > 0) {
                                                                    let lastPrice = 0
                                                                    let lastLoad = 1
                                                                    for (var i = 0; i < lprices.length; i++) {
                                                                        if (lprices[i].load > crop.leftAfterAcceptanceQuantity || i == 0 || lprices[i].load == crop.leftAfterAcceptanceQuantity) {
                                                                            lastPrice = lprices[i].price
                                                                            lastLoad = lprices[i].load
                                                                        } else {
                                                                            break
                                                                        }
                                                                    }
                                                                    // let landingPrice = crop.price + ((crop.efarmxComission/100 * crop.price) * (1 + crop.taxRate/100)) + (lastPrice/lastLoad)
                                                                    let landingPrice = crop.price + ((crop.efarmxComission / 100 * crop.price) * (1 + crop.taxRate / 100)) + (lastPrice / crop.leftAfterAcceptanceQuantity)
                                                                    crop.landingPrice = parseFloat((landingPrice).toFixed(2));
                                                                }

                                                                delete crop.pincode
                                                                delete crop.market
                                                                delete crop.efarmxComission
                                                                delete crop.taxRate

                                                                callback()
                                                            }).fail(function (err) {

                                                                delete crop.pincode
                                                                delete crop.market
                                                                delete crop.efarmxComission
                                                                delete crop.taxRate

                                                                callback()
                                                            })
                                                        })
                                                    }, function (asyncError) {
                                                        category.crops = finalResult
                                                        category.totalCrops = crops.length
                                                        return res.status(200).jsonx({
                                                            success: true,
                                                            data: category
                                                        });
                                                    })
                                                } else {
                                                    category.crops = finalResult
                                                    category.totalCrops = crops.length
                                                    return res.status(200).jsonx({
                                                        success: true,
                                                        data: category
                                                    });
                                                }
                                            }
                                        });
                                    })
                                }
                            });
                        })
                    }
                })
            }
        })
    }
};

