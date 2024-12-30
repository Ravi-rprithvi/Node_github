var Promise = require('bluebird');
promisify = Promise.promisify;
var constantObj = sails.config.constants;

module.exports = {



    // prices api start
    //added by price list
    getaddedby: (data, context, req, res) => {

        Prices.find().populate('addedBy')
            .exec(function (err, data) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {

                    return res.jsonx({
                        success: true,
                        data: data
                    });
                }
            });
        // Prices.native(function (err, prices) {
        //     prices.aggregate([
        //     {
        //       $lookup: {
        //              from: "pricecollectors",
        //              localField: "price.addedBy",
        //              foreignField: "pricecollectors._id",
        //              as: "pc"
        //            }  
        //     },
        //     {$unwind: "$pc"},
        //     {
        //         $project: {
        //         addedByName:"$pc.name",
        //         id:"$pc._id"

        //     }

        //     }
        //     ],
        //     function (err, pc) {

        //         if (err) {
        //             return res.status(400).jsonx({
        //                 success: false,
        //                 error: err
        //             });
        //         } else {
        //             var uniq = {};
        //             return res.status(200).jsonx({
        //                 success: true,
        //                 data: {
        //                     prices: pc

        //                 },
        //             });
        //         }
        //     });

        // })
    },

    // ========================================== get price by id api
    getprice: (data, context, req, res) => {
        let query = { id: data.id };
        console.log(query);
        Prices.findOne(query).then(function (result) {
            if (result != undefined && result != null) {
                return res.jsonx({
                    success: true,
                    code: 200,
                    data: result,
                });
            } else {
                return res.jsonx({
                    success: false,
                    message: constantObj.price_collector.PRICE_COLLECTOR_NOT_FOUND
                });
            }
        }).fail(function (error) {
            return res.jsonx({
                success: false,
                error: error
            })
        });
    },


    availableCitiesForPrices: (data, context, req, res) => {

        let query = {}
        var category = req.param('category');
        var categories = req.param('categories');
        var fromDate = req.param('from');
        var toDate = req.param('to');
        if (fromDate != undefined && fromDate != null && toDate != undefined && toDate != null) {
            query.$and = [{ createdAt: { $gte: new Date(req.param('from')) } }, { createdAt: { $lte: new Date(req.param('to')) } }]
        }
        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        if (category) {
            query.category = ObjectId(category)
        }
        if (categories) {
            let cats = JSON.parse(categories)
            let objcats = []
            for (var i = 0; i < cats.length; i++) {
                objcats.push(ObjectId(cats[i]))
            }
            query.category = { $in: objcats }
        }
        query.verified = true

        Prices.native(function (err, prices) {
            prices.aggregate([
                {
                    $match: query
                },
                {
                    $sort: { 'createdAt': -1 }
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
                        marketName: "$market.name",
                        marketId: "$market._id",
                    }
                },
                {
                    $group: {
                        _id: {
                            marketName: "$marketName",
                            marketId: '$marketId'
                        },
                    }
                },
                {
                    $project: {
                        name: "$_id.marketName",
                        id: '$_id.marketId',
                        _id: 0,
                    }
                },
            ], function (err, results) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.jsonx({
                        success: true,
                        data: results
                    });
                }
            });
        })
    },



    //=================== price collector login ================================ 
    pclogin: (data, context, req, res) => {
        let query = { email: data.email, activated: true };
        query.select = ['name', 'email', 'mobile', 'markets'];
        Pricecollectors.findOne(query).exec((err, pcdata) => {
            if (pcdata != undefined && pcdata != null) {
                Market.find({ id: { $in: pcdata.markets }, select: ['id', 'name'] }).then(markets => {
                    if (markets != undefined && markets.length > 0) {
                        pcdata.markets = markets
                    }
                    return res.jsonx({
                        success: true,
                        data: pcdata,
                    });
                });
            } else {
                return res.jsonx({
                    success: false,
                    message: constantObj.messages.NOT_AUTHORIZED
                });
            }
        })
    },
    //===================end of price collector login ===============================




    //=================== save prices from app =======================================
    saveprice: (data, context, req, res) => {
        Prices.create(data).then((pricedata) => {
            return res.jsonx({
                success: true,
                data: {
                    message: constantObj.price_collector.PRICE_INFO_SAVED,
                    price: pricedata
                },
            })
        }).fail(function (error) {
            return res.jsonx({
                success: false,
                error: error
            });
        });
    },

    activeInactive: (data, context, req, res) => {
        let qry = {}
        qry.id = data.id

        let updateQry = {}
        if (data.activated == true || data.activated == 'true') {
            updateQry.activated = true
        } else {
            updateQry.activated = false
        }

        if (context.identity.id) {

            Prices.update(qry, updateQry).then((pricedata) => {
                return res.jsonx({
                    success: true,
                    data: {
                        message: "Status change successfully",
                        price: pricedata
                    },
                })
            }).fail(function (error) {
                return res.jsonx({
                    success: false,
                    error: error
                });
            });
        } else {
            return res.jsonx({
                success: false,
                error: "Please login before active or inactive."
            });
        }
    },

    verifyPrice: (data, context, req, res) => {
        let qry = {}
        qry.id = data.id

        let updateQry = {}
        updateQry.verified = true
        if (context.identity.id) {
            updateQry.verifiedBy = context.identity.id
            updateQry.verifiedOn = new Date()
            Prices.update(qry, updateQry).then((pricedata) => {
                return res.jsonx({
                    success: true,
                    data: {
                        message: "Price verified.",
                        price: pricedata
                    },
                })
            }).fail(function (error) {
                return res.jsonx({
                    success: false,
                    error: error
                });
            });
        } else {
            return res.jsonx({
                success: false,
                error: "Please login to verify."
            });
        }
    },

    //=================== end of save prices from app =======================================



    allprices: (data, context, req, res) => {
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;

        var query = {};
        var market = req.param('market');
        if (market != undefined && market != null && market.length > 0) {
            query.market = market
        }
        var sortBy = req.param('sortBy');

        if (sortBy) {
            sortBy = sortBy.toString();
        } else {
            sortBy = 'createdAt desc';
        }
        var subcategory = req.param('subcategory');
        var category = req.param('category');
        if (category != undefined && category != null && category.length > 0) {
            let qr = {}
            qr.parentId = category

            Category.find(qr).then(function (category) {
                let ids = _.pluck(category, 'id')
                //console.log(ids, "category1");
                let qs = {};
                qs.category = ids
                if (market != undefined && market != null && market.length > 0) {
                    qs.market = market
                }

                if (subcategory) {
                    qs.category = subcategory
                }

                Prices.find(qs)
                    .sort(sortBy)
                    .populate('addedBy', {
                        select: ['name', 'email']
                    })
                    .populate('category', {
                        select: ['name', 'image', 'qualities']
                    })
                    .populate('market', {
                        select: ['name']
                    }).skip(skipNo).limit(count)
                    .then(function (price) {
                        // console.log(price, "price")
                        return res.jsonx({
                            success: true,
                            data: {
                                prices: price,
                                total: price.length
                            }
                        });
                    })
            })
        } else {

            var addedByPC = req.param('addedBy');
            if (addedByPC != undefined && addedByPC != null && addedByPC.length > 0) {
                query.addedBy = addedByPC
            }

            var fromDate = req.param('from');
            //console.log(fromDate, '==')
            var toDate = req.param('to');

            if (fromDate != undefined && fromDate != null && fromDate != 0 && toDate != undefined && toDate != null && toDate != 0) {

                query.$and = [{ createdAt: { $gte: new Date(fromDate) } }, { createdAt: { $lte: new Date(toDate) } }]
                console.log(query, 'qr');
            }
            if (subcategory) {
                query.category = subcategory
            }

            Prices.find(query).sort(sortBy).populate('addedBy', {
                select: ['name', 'email']
            }).populate('category', {
                select: ['name', 'image', 'qualities']
            }).populate('market', {
                select: ['name']
            }).skip(skipNo).limit(count).exec((err, price) => {
                if (err) {
                    return res.jsonx({
                        success: false,
                        error: err
                    });
                }
                Prices.count(query).exec((cer, count) => {
                    if (cer) {
                        return res.jsonx({
                            success: false,
                            error: cer
                        });
                    }
                    return res.jsonx({
                        success: true,
                        data: {
                            prices: price,
                            total: count
                        }
                    });
                })
            })
        }


    },

    frontendpricelistCategoryWise: (data, context, req, res) => {
        // var page = req.param('page');
        // var count = req.param('count');
        // var skipNo = (page - 1) * count;
        // count = parseInt(count);

        var search = req.param('search');

        var sortBy = "createdAt desc";

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }
        var sortquery = {};
        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        var query = {};

        var category = req.param('category');
        if (category != undefined && category != null && category.length > 0) {
            query.category = category
        }

        var fromDate = req.param('from');
        var toDate = req.param('to');

        var category = req.param('category');
        var market = req.param('market');
        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        if (category) {
            query.categoryId = ObjectId(category)
        }
        if (market) {
            query.marketId = ObjectId(market)
        }

        var categories = req.param('categories');
        if (categories) {
            let cats = JSON.parse(categories)
            let objcats = []
            for (var i = 0; i < cats.length; i++) {
                objcats.push(ObjectId(cats[i]))
            }
            query.categoryId = { $in: objcats }
        }

        if (fromDate != undefined && fromDate != null && toDate != undefined && toDate != null) {
            query.$and = [{ createdAt: { $gte: new Date(req.param('from')) } }, { createdAt: { $lte: new Date(req.param('to')) } }]
        } else {
            var yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0);
            yesterday.setMinutes(0);
            yesterday.setSeconds(0);
            yesterday.setMilliseconds(1);
            query.createdAt = { $gte: yesterday }
        }

        if (search) {
            query.$or = [
                {
                    categoryName: { $regex: search, '$options': 'i' }
                },
                {
                    variety: { $regex: search, '$options': 'i' }
                },
                {
                    marketName: { $regex: search, '$options': 'i' }
                }
            ];
        }

        query.verified = true

        Prices.native(function (err, prices) {
            prices.aggregate([
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
                        categoryId: "$category._id",
                        categoryName: "$category.name",
                        image: "$category.image",
                        icon: "$category.iconImage",
                        variety: "$variety",
                        marketName: "$market.name",
                        marketId: "$market._id",
                        price: "$price",
                        quality: "$quality",
                        createdAt: "$createdAt",
                        verified: "$verified"
                    }
                },
                {
                    $match: query
                },
                {
                    $sort: { 'price': 1 }
                },
                {
                    $group: {
                        _id: {
                            categoryId: "$categoryId",
                            categoryName: "$categoryName",
                            banner: "$image",
                            iconimage: "$icon",
                            marketName: "$marketName",
                        },
                        prices: {
                            $push: {
                                variety: "$variety",
                                price: "$price",
                                quality: "$quality",
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            categoryId: "$_id.categoryId",
                            categoryName: "$_id.categoryName",
                            banner: "$_id.banner",
                            iconimage: "$_id.iconimage",
                        },
                        markets: {
                            $push: {
                                name: "$_id.marketName",
                                prices: "$prices",
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        categoryId: "$_id.categoryId",
                        categoryName: "$_id.categoryName",
                        image: "$_id.banner",
                        iconimage: "$_id.iconimage",
                        markets: "$markets"
                    }
                },
            ], function (err, results) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.jsonx({
                        success: true,
                        data: results
                    });
                }
            });
        })
    },

    frontendpricelistMarketWise: (data, context, req, res) => {

        var search = req.param('search');

        var sortBy = "createdAt desc";

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }
        var sortquery = {};
        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        var query = {};

        var fromDate = req.param('from');
        var toDate = req.param('to');
        if (fromDate != undefined && fromDate != null && toDate != undefined && toDate != null) {
            query.$and = [{ createdAt: { $gte: new Date(req.param('from')) } }, { createdAt: { $lte: new Date(req.param('to')) } }]
        } else {
            var yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0);
            yesterday.setMinutes(0);
            yesterday.setSeconds(0);
            yesterday.setMilliseconds(1);
            query.createdAt = { $gte: yesterday }
        }

        if (search) {
            query.$or = [
                {
                    categoryName: { $regex: search, '$options': 'i' }
                },
                {
                    variety: { $regex: search, '$options': 'i' }
                },
                {
                    marketName: { $regex: search, '$options': 'i' }
                }
            ];
        }

        query.verified = true

        Prices.native(function (err, prices) {
            prices.aggregate([
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
                        categoryId: "$category._id",
                        categoryName: "$category.name",
                        image: "$category.image",
                        icon: "$category.iconImage",
                        variety: "$variety",
                        marketName: "$market.name",
                        price: "$price",
                        quality: "$quality",
                        createdAt: "$createdAt",
                        verified: "$verified"
                    }
                },
                {
                    $match: query
                },
                {
                    $sort: { 'price': 1 }
                },
                {
                    $group: {
                        _id: {
                            categoryId: "$categoryId",
                            categoryName: "$categoryName",
                            image: "$image",
                            iconimage: "$icon",
                            marketName: "$marketName",
                        },
                        prices: {
                            $push: {
                                variety: "$variety",
                                price: "$price",
                                quality: "$quality",
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: "$_id.marketName",
                        categories: {
                            $push: {
                                categoryId: "$_id.categoryId",
                                name: "$_id.categoryName",
                                image: "$_id.image",
                                iconimage: "$_id.iconimage",
                                prices: "$prices",
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        marketName: "$_id",
                        categories: "$categories",
                    }
                },
            ], function (err, results) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.jsonx({
                        success: true,
                        data: results
                    });
                }
            });
        })
    },

    //======================================update price =============================================================
    updateprice: function (data, context, req, res) {
        let query = { id: data.id };
        Prices.findOne(query).then(function (result) {
            if (result != undefined && result != null) {
                return Prices.update({ id: data.id }, data).then(function (price) {
                    price = price[0];
                    return res.jsonx({
                        success: true,
                        code: 200,
                        data: {
                            price: price,
                            message: constantObj.price_collector.PRICE_UPDATED
                        },
                    });
                })
            } else {
                return res.jsonx({
                    success: false,
                    message: constantObj.price_collector.PRICE_NOT_FOUND
                })
            }
        }).fail(function (error) {
            return res.jsonx({
                success: false,
                error: error
            })
        })
    },
    //======================================end of update price =======================================================



    // getallsave: function (data, context, req, res) {
    //     Pricecollectors.find({}).then((data) => {
    //         const marketIds = [];
    //         data.forEach(pc => pc.markets.forEach(marketId => marketIds.push(marketId)));
    //         Market.find({ name: { $in: marketIds } }).then(markets => {
    //             return res.jsonx({ data: markets });
    //         });
    //     });
    // },


    // price collector api

    get: (data, context, req, res) => {
        let query = { id: data.id };
        Pricecollectors.findOne(query).then(function (result) {
            if (result != undefined && result != null) {
                Market.find({ id: { $in: result.markets }, select: ['id', 'name'] }).then(markets => {
                    if (markets != undefined && markets.length > 0) {
                        result.markets = markets
                    }
                    return res.jsonx({
                        success: true,
                        code: 200,
                        data: result,
                    });
                });
            } else {
                return res.jsonx({
                    success: false,
                    message: constantObj.price_collector.PRICE_COLLECTOR_NOT_FOUND
                });
            }
        }).fail(function (error) {
            return res.jsonx({
                success: false,
                error: error
            })
        });
    },

    //======================================save price collector=======================================================
    save: function (data, context, req, res) {
        data.added_by = context.identity.id
        if (data.email == undefined) {
            return res.jsonx({
                success: false,
                error: "Invalid email."
            });
        } else if (data.email.endsWith("@efarmexchange.com") == false && data.email.endsWith("@gmail.com") == false) {
            return res.jsonx({
                success: false,
                error: "Invalid email."
            });
        } else {
            Pricecollectors.create(data).then(function (data) {
                return res.jsonx({
                    success: true,
                    data: {
                        message: constantObj.price_collector.PRICE_COLLECTOR_INFO_SAVED
                    },
                })
            }).fail(function (error) {
                return res.jsonx({
                    success: false,
                    error: "Unknow error occurred. Please search if phone number of email already exists."
                });
            });
        }
        console.log(data.added_by);
        //return 1;
        Pricecollectors.create(data).then(function (data) {
            return res.jsonx({
                success: true,
                data: {
                    message: constantObj.price_collector.PRICE_COLLECTOR_INFO_SAVED
                },
            })
        }).fail(function (error) {
            return res.jsonx({
                success: false,
                error: error
            });
        });
    },
    //======================================end of save price collector=======================================================





    //======================================update price collector=============================================================
    update: function (data, context, req, res) {
        let query = { id: data.id };
        Pricecollectors.findOne(query).then(function (result) {
            if (result != undefined && result != null) {
                return Pricecollectors.update(data.id, data).then(function (pricecollector) {
                    pricecollector = pricecollector[0];
                    return res.jsonx({
                        success: true,
                        code: 200,
                        data: {
                            pricecollectorinfo: pricecollector,
                            message: constantObj.price_collector.PRICE_COLLECTOR_UPDATED
                        },
                    });
                })
            } else {
                return res.jsonx({
                    success: false,
                    message: constantObj.price_collector.PRICE_COLLECTOR_NOT_FOUND
                })
            }
        }).fail(function (error) {
            return res.jsonx({
                success: false,
                error: error
            })
        })
    },
    //======================================end of update price collector=======================================================



    list: function (data, context, req, res) {


        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var sortBy = req.param('sortBy');
        if (sortBy) {
            sortBy = sortBy.toString();
        } else {
            sortBy = 'createdAt desc';
        }
        var query = {};
        // var name = req.param('name');
        // if (name != undefined && name != null) {
        //     query.name = name
        // }

        // var email = req.param('email');
        // if (email != undefined && email != null) {
        //     query.email = email
        // }

        // var mobile = req.param('mobile');
        // if (mobile != undefined && mobile != null) {
        //     query.mobile = mobile
        // }
        var search = req.param('search');
        if (search) {
            query.$or = [
                {
                    name: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    mobile: parseInt(search)
                },
                {
                    email: {
                        'like': '%' + search + '%'
                    }
                }
            ]
        }
        Pricecollectors.find(query).sort(sortBy)
            // .populate('markets',{            
            //  select: ['name']
            //})
            .populate('added_by', {
                select: ['fullName']
            })
            .skip(skipNo).limit(count).exec((err, pc) => {
                if (err) {
                    return res.jsonx({
                        success: false,
                        error: err
                    });
                }

                Pricecollectors.count(query).exec((cer, count) => {
                    if (cer) {
                        return res.jsonx({
                            success: false,
                            error: cer
                        });
                    }
                    return res.jsonx({
                        success: true,
                        data: {
                            pricecollector: pc,
                            total: count
                        }
                    });
                })
            })

    },
    getAllMarket: function (data, context, req, res) {

        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var search = req.param('search');
        var query = {};

        var sortBy = req.param('sortBy');

        if (sortBy) {
            sortBy = sortBy.toString();
        } else {
            sortBy = 'createdAt desc';
        }

        if (search) {
            query.$or = [
                {
                    name: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    pincode: { "$in": [parseInt(search)] }
                }
            ]
        }

        Market.count(query).exec(function (err, total) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                Market.find(query).populate('GM').populate('CP').sort(sortBy).skip(skipNo).limit(count).exec(function (err, market) {
                    if (err) {
                        return res.status(400).jsonx({
                            success: false,
                            error: err
                        });
                    } else {
                        return res.jsonx({
                            success: true,
                            data: {
                                market: market,
                                total: total
                            },
                        });
                    }
                })
            }
        })
    },


}