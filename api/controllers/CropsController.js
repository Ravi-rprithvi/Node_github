

var Promise = require('q');
var path = require('path');
var constantObj = sails.config.constants;
var ObjectId = require('mongodb').ObjectID;
// var mongoose = require("mongoose");
// mongoose.connect( 'mongodb://devfarmx:devfarmx2780@52.34.207.5:27017/devfarmx' );
// var db = mongoose.connection.db
var commonServiceObj = require('./../services/commonService');
var smtpTransport = require('nodemailer-smtp-transport');
var nodemailer = require('nodemailer');


var transport = nodemailer.createTransport(smtpTransport({
    host: sails.config.appSMTP.host,
    port: sails.config.appSMTP.port,
    debug: sails.config.appSMTP.debug,
    auth: {
        user: sails.config.appSMTP.auth.user, //access using /congig/appSMTP.js
        pass: sails.config.appSMTP.auth.pass
    }
}));
/**
 * CropsController
 *
 * @description :: Server-side logic for managing crops
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    bulkUploadProduct: function (req, res) {
        API(CropService.bulkUploadProduct, req, res);
    },
    getPublicCrops: function () {
        API(CropService.getPublicCrops, req, res);
    },
    readOrderEmails: function (req, res) {
        API(commonService.readOrderEmail, req, res);
    },
    add: function (req, res) {
        API(CropService.save, req, res);
    },
    listing: function (req, res) {
        API(CropService.list, req, res);
    },
    expiredCrops: function (req, res) {
        API(CropService.cropExpired, req, res);
    },
    edit: function (req, res) {
        API(CropService.update, req, res);
    },

    cropBids: function (req, res) {
        return API(CropService.cropBids, req, res)
    },

    delete: function (req, res) {
        API(CropService.delete, req, res);
    },

    aggregateFromCropId: function (req, res) {
        return API(CropService.startAggregation, req, res)
    },

    sugggestedCropForAggregation: function (req, res) {
        return API(CropService.aggreggationSuggestion, req, res)
    },

    addCropAggregation: function (req, res) {
        return API(CropService.aggreggationaddition, req, res)
    },

    publishAggregation: function (req, res) {
        return API(CropService.publishAggregation, req, res)
    },

    removeAggreationCrop: function (req, res) {
        return API(CropService.removeAggreationCrop, req, res)
    },

    disapprove: function (req, res) {
        return API(CropService.disapproveCrop, req, res)
    },

    cropsInAggregation: function (req, res) {
        return API(CropService.cropsInAggregation, req, res)
    },

    adminCropDetail: function (req, res) {
        return API(CropService.adminCropDetail, req, res)
    },

    deleteOrderItem: function (req, res) {
        let orderId = req.param("id");
        Orders.findOne({ id: orderId }).populate("buyer").then(function (orderData) {
            Orderedcarts.destroy({ order: orderId }).then(function (orderCart) {
                if (orderCart) {
                    Orders.destroy({ id: orderId }).then(function (order) {
                        console.log(orderData.buyer, 'buery')
                        cancelOrderEmail(orderData.buyer);
                        Sellerpayment.destroy({ order: orderId }).then(function (seller) {

                        })
                        Bidspayment.destroy({ order: orderId }).then(function (bid) {

                        })
                        Moderntraderpreorder.destroy({ order: orderId }).then(function (bid) {

                        })


                    })
                }
            })
        })
    },

    topCategoriesAndProducts: function (req, res) {
        var query = {}
        query.isDeleted = false
        query.isApproved = true
        query.isExpired = false
        // query.leftAfterAcceptanceQuantity = { $gte: 10 }

        let catcount = parseInt(req.param('categoryCount'));
        let cropcount = parseInt(req.param('cropCount'));

        let pincode = req.param('pincode')

        Crops.native(function (error, cropsList) {
            cropsList.aggregate([
                {
                    $match: query
                },
                {
                    $lookup: {
                        from: "category",
                        localField: "category",
                        foreignField: "_id",
                        as: "category"
                    }
                },
                {
                    $unwind: "$category"
                },
                {
                    $lookup: {
                        from: "category",
                        localField: "category.parentId",
                        foreignField: "_id",
                        as: "parentCategory"
                    }
                },
                {
                    $unwind: '$parentCategory'
                },
                {
                    $project: {
                        parentcategory: "$parentCategory.name",
                        parentcategoryId: "$parentCategory._id",
                        categoryName: "$category.name",
                        categoryId: "$category._id",
                        categoryimage: "$category.image",
                        categorybannerImage: "$category.bannerImage",
                        categoryiconImage: "$category.iconImage",
                        parentCategoryimage: "$parentCategory.image",
                        parentCategorybannerImage: "$parentCategory.bannerImage",
                        parentCategoryiconImage: "$parentCategory.iconImage",
                        parentCategoryprimaryColor: "$parentCategory.primaryColor",
                        parentCategorysecondaryColor: "$parentCategory.secondaryColor",
                        categoryprimaryColor: "$category.primaryColor",
                        categorysecondaryColor: "$category.secondaryColor",
                        id: "$_id",
                        price: "$price",
                        name: "$name",
                        code: "$code",
                        endDate: "$endDate",
                        quantity: "$quantity",
                        quantityUnit: "$quantityUnit",
                        district: "$district",
                        availableFrom: "$availableFrom",
                        leftAfterAcceptanceQuantity: "$leftAfterAcceptanceQuantity",
                        leftAfterDeliveryQuantity: "$leftAfterDeliveryQuantity",
                        images: "$images",
                        coverImage: "$coverImage",
                        bidEndDate: "$bidEndDate",
                        isFeatured: "$isFeatured",
                        variety: "$variety"
                    }
                },
                {
                    $sort: { 'price': 1 }
                },
                {
                    $group: {
                        _id: {
                            parentcategory: "$parentcategory",
                            parentcategoryId: "$parentcategoryId",
                            categoryName: "$categoryName",
                            categoryId: "$categoryId",
                            categoryimage: "$categoryimage",
                            categorybannerImage: "$categorybannerImage",
                            categoryiconImage: "$categoryiconImage",
                            parentCategoryimage: "$parentCategoryimage",
                            parentCategorybannerImage: "$parentCategorybannerImage",
                            parentCategoryiconImage: "$parentCategoryiconImage",
                            parentCategoryprimaryColor: "$parentCategoryprimaryColor",
                            parentCategorysecondaryColor: "$parentCategorysecondaryColor",
                            categoryprimaryColor: "$categoryprimaryColor",
                            categorysecondaryColor: "$categorysecondaryColor"
                        },
                        totalAvailableQuantity: {
                            $sum: "$leftAfterAcceptanceQuantity"
                        },
                        crops: {
                            $push: {
                                $cond: [
                                    { $ne: ['$isFeatured', false] },
                                    {
                                        id: "$id",
                                        price: "$price",
                                        name: "$name",
                                        categoryId: "$categoryId",
                                        categoryimage: "$categoryimage",
                                        categoryName: "$categoryName",
                                        code: "$code",
                                        endDate: "$endDate",
                                        quantity: "$quantity",
                                        quantityUnit: "$quantityUnit",
                                        district: "$district",
                                        availableFrom: "$availableFrom",
                                        leftAfterAcceptanceQuantity: "$leftAfterAcceptanceQuantity",
                                        leftAfterDeliveryQuantity: "$leftAfterDeliveryQuantity",
                                        images: "$images",
                                        coverImage: "$coverImage",
                                        bidEndDate: "$bidEndDate",
                                        isFeatured: "$isFeatured",
                                        variety: "$variety"
                                    },
                                    null
                                ]
                            }
                        },
                        unfeaturedCrops: {
                            $push: {
                                $cond: [
                                    { $ne: ['$isFeatured', false] },
                                    null,
                                    {
                                        id: "$id",
                                        price: "$price",
                                        name: "$name",
                                        categoryId: "$categoryId",
                                        categoryimage: "$categoryimage",
                                        categoryName: "$categoryName",
                                        code: "$code",
                                        endDate: "$endDate",
                                        quantity: "$quantity",
                                        quantityUnit: "$quantityUnit",
                                        district: "$district",
                                        availableFrom: "$availableFrom",
                                        leftAfterAcceptanceQuantity: "$leftAfterAcceptanceQuantity",
                                        leftAfterDeliveryQuantity: "$leftAfterDeliveryQuantity",
                                        images: "$images",
                                        coverImage: "$coverImage",
                                        bidEndDate: "$bidEndDate",
                                        isFeatured: "$isFeatured",
                                        pincode: "$pincode",
                                        market: "$market",
                                        efarmxComission: "$efarmxComission",
                                        taxRate: "$taxRate",
                                        variety: "$variety"
                                    }
                                ]
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: "$_id",
                        totalAvailableQuantity: '$totalAvailableQuantity',
                        crops: { "$setDifference": ["$crops", [null]] },
                        unfeaturedCrops: { "$setDifference": ["$unfeaturedCrops", [null]] },
                        cropsCount: { $size: "$crops" }
                    }
                },
                {
                    $sort: { 'cropsCount': -1 }
                },
                {
                    $group: {
                        _id: {
                            parentcategory: "$_id.parentcategory",
                            parentcategoryId: "$_id.parentcategoryId",
                            parentCategoryimage: "$_id.parentCategoryimage",
                            parentCategorybannerImage: "$_id.parentCategorybannerImage",
                            parentCategoryiconImage: "$_id.parentCategoryiconImage",
                            parentCategoryprimaryColor: "$_id.parentCategoryprimaryColor",
                            parentCategorysecondaryColor: "$_id.parentCategorysecondaryColor"
                        },
                        subcategories: {
                            $push: {
                                categoryName: "$_id.categoryName",
                                categoryId: "$_id.categoryId",
                                categoryimage: "$_id.categoryimage",
                                categorybannerImage: "$_id.categorybannerImage",
                                categoryiconImage: "$_id.categoryiconImage",
                                cropsCount: "$cropsCount",
                                categoryprimaryColor: "$_id.categoryprimaryColor",
                                categorysecondaryColor: "$_id.categorysecondaryColor",
                                totalAvailableQuantity: '$totalAvailableQuantity'
                            }
                        },
                        featuredCropCount: { $sum: { $size: "$crops" } },
                        crops: {
                            $push: "$crops"
                        },
                        unfeaturedCrops: {
                            $push: "$unfeaturedCrops"
                        },
                        totalCrops: { $sum: "$cropsCount" }
                    }
                },
                {
                    $project: {
                        parentcategory: "$_id.parentcategory",
                        parentcategoryId: "$_id.parentcategoryId",
                        parentCategoryimage: "$_id.parentCategoryimage",
                        parentCategorybannerImage: "$_id.parentCategorybannerImage",
                        parentCategoryiconImage: "$_id.parentCategoryiconImage",
                        parentCategoryprimaryColor: "$_id.parentCategoryprimaryColor",
                        parentCategorysecondaryColor: "$_id.parentCategorysecondaryColor",
                        _id: 0,
                        categories: { $slice: ["$subcategories", 0, catcount] },
                        categoriesCount: { $size: "$subcategories" },

                        crops: {
                            $slice: [{
                                $reduce: {
                                    input: "$crops",
                                    initialValue: {
                                        $cond: [{ $lt: ["$featuredCropCount", cropcount] }, /*{ $slice: [*/{
                                            $reduce: {
                                                input: "$unfeaturedCrops",
                                                initialValue: [],
                                                in: { $concatArrays: ["$$value", "$$this"] }
                                            }
                                        }/*, 0, cropcount - "$featuredCropCount"] }*/, []]
                                    },
                                    in: { $concatArrays: ["$$this", "$$value"] }
                                }
                            }, 0, cropcount]
                        },
                        featuredCropCount: "$featuredCropCount",
                        totalCrops: "$totalCrops"
                    }
                },
                {
                    $sort: { 'categoriesCount': -1 }
                },
            ], function (err, data) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    let qry = {};
                    qry.requiredOn = { $gte: new Date() }
                    qry.status = { $ne: 'Fulfilled' }
                    // console.log(qry);
                    BuyerRequirement.native(function (err, requirement) {
                        requirement.aggregate(
                            [
                                {
                                    $match: qry
                                },
                                {
                                    $lookup: {
                                        from: "category",
                                        localField: "category",
                                        foreignField: "_id",
                                        as: "category"
                                    }
                                },
                                {
                                    $unwind: "$category"
                                },
                                {
                                    $group: {
                                        _id: {
                                            categoryName: "$category.name",
                                            categoryId: "$category._id",
                                            categoryimage: "$category.image",
                                            categorybannerImage: "$category.bannerImage",
                                            categoryiconImage: "$category.iconImage",
                                            categoryprimaryColor: "$category.primaryColor",
                                            categorysecondaryColor: "$category.secondaryColor",
                                            categoryParentId: '$category.parentId'
                                        },
                                        'quantity': {
                                            $sum: "$quantity"
                                        },
                                        'quantityUnit': { "$first": "$quantityUnit" },
                                        totalRequirements: { $sum: 1 }

                                    },
                                },
                                {
                                    $sort: { 'quantity': -1 }
                                },
                                {
                                    $group: {
                                        _id: "$_id.categoryParentId",
                                        totalRequirements: { $sum: "$totalRequirements" },
                                        categories: {
                                            $push: {
                                                categoryName: "$_id.categoryName",
                                                categoryId: "$_id.categoryId",
                                                categoryimage: "$_id.categoryimage",
                                                categorybannerImage: "$_id.categorybannerImage",
                                                categoryiconImage: "$_id.categoryiconImage",
                                                requirementsCount: "$totalRequirements",
                                                categoryprimaryColor: "$_id.categoryprimaryColor",
                                                categorysecondaryColor: "$_id.categorysecondaryColor",
                                                totalRequiredQuantity: '$quantity'
                                            }
                                        }
                                    },
                                }
                            ], function (err, result) {

                                for (var i = 0; i < data.length; i++) {
                                    data[i].totalRequirements = 0
                                    if (result && result.length) {
                                        for (var j = 0; j < result.length; j++) {
                                            data[i].totalRequirements = result[j].totalRequirements
                                            if ((result[j]._id).toString() == (data[i].parentcategoryId).toString()) {
                                                let requirementCategories = result[j].categories
                                                for (var k = 0; k < requirementCategories.length; k++) {
                                                    let categoryAvailable = false
                                                    let dataCategories = data[i].categories
                                                    for (var l = 0; l < dataCategories.length; l++) {
                                                        if ((dataCategories[l].categoryId).toString() == (requirementCategories[k].categoryId).toString()) {
                                                            categoryAvailable = true
                                                            data[i].categories[l].requirementsCount = requirementCategories[k].requirementsCount
                                                            data[i].categories[l].totalRequiredQuantity = requirementCategories[k].totalRequiredQuantity
                                                        }
                                                    }

                                                    if (categoryAvailable == false && dataCategories.length < catcount) {
                                                        data[i].categories.push(requirementCategories[k])
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                if (pincode) {
                                    async.each(data, function (categorydata, callbackM) {
                                        async.each(categorydata.crops, function (crop, callback) {
                                            Market.findOne({ id: crop.market }).populate('GM', { select: ['pincode'] }).then(function (market) {
                                                let sourceP = crop.pincode
                                                if (market && market.GM && market.GM.pincode) {
                                                    sourceP = market.GM.pincode
                                                }
                                                let qry = {}
                                                qry.isDeleted = false
                                                let category = crop.categoryId

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
                                            callbackM()
                                        })
                                    }, function (asyncErrorM) {
                                        return res.status(200).jsonx({
                                            success: true,
                                            data: data
                                        });
                                    })
                                } else {
                                    async.each(data, function (categorydata, callbackM) {
                                        async.each(categorydata.crops, function (crop, callback) {
                                            delete crop.pincode
                                            delete crop.market
                                            delete crop.efarmxComission
                                            delete crop.taxRate
                                            callback()
                                        }, function (asyncError) {
                                            callbackM()
                                        })
                                    }, function (asyncErrorM) {
                                        return res.status(200).jsonx({
                                            success: true,
                                            data: data
                                        });
                                    })
                                }
                            }
                        );
                    })
                }
            });
        })
    },

    cropChangeStatus: function (req, res) {

        var itemId = req.param('id');
        var updated_status = req.param('status');

        let query = {};
        query.id = itemId;

        // if(req.identity.roles == 'A' || req.identity.roles == 'SA' || req.identity.roles == 'U'){

        Crops.findOne(query).exec(function (err, data) {
            if (err) {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: constantObj.messages.DATABASE_ISSUE
                    }
                });
            } else {

                Crops.update({
                    id: itemId
                }, {
                    status: updated_status
                }, function (err, response) {
                    if (err) {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: constantObj.messages.DATABASE_ISSUE
                            }
                        });

                    } else {

                        return res.jsonx({
                            success: true,
                            data: {
                                message: constantObj.messages.STATUS_CHANGED
                            }
                        });

                    }

                });
            }
        })
        // }else{
        // return res.jsonx({
        //             success: false,
        //             error: {
        //                 code: 400,
        //                 message: "User can not access server."
        //             }
        //         });            
        // }

    },
    verify: function (req, res) {
        API(CropService.makeVerifyCrop, req, res);
    },

    approve: function (req, res) {
        API(CropService.makeApproveCrop, req, res);
    },

    getConditions: function (req, res) {
        Crops.findOne({ id: req.param("id"), select: ['terms', 'paymentTerms', 'logisticsTerms'] }).exec(function (err, crop) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                })
            } else {
                return res.status(200).jsonx({
                    success: true,
                    code: 200,
                    data: crop
                });
            }
        })
    },

    expire: function (req, res) {
        var request = require('request-promise');

        Bids.find({ crop: req.param("id"), status: 'Pending' }).then(function (bidsInfo) {

            let merchantKey = constantObj.payu.KEY;

            var transactionsArray = []

            var refundBy = req.identity.id

            async.each(bidsInfo, function (bid, callback) {
                var findTransactionQry = {}
                findTransactionQry.bidId = bid.id
                findTransactionQry.paymentType = "PayTm"
                findTransactionQry.processStatus = 'TXN_SUCCESS'

                Transactions.findOne(findTransactionQry).then(function (bidTransactions) {

                    var paramlist = {};

                    paramlist['MID'] = bidTransactions.paymentjson.MID;
                    paramlist['TXNID'] = bidTransactions.paymentjson.TXNID;
                    paramlist['ORDER_ID'] = bidTransactions.paymentjson.ORDERID;
                    paramlist['REFUNDAMOUNT'] = bidTransactions.paymentjson.TXNAMOUNT;
                    paramlist['TXNTYPE'] = "REFUND";

                    if (bidTransactions != undefined) {

                        Payments.genchecksumforrefund(paramlist, constantObj.paytm_config.PAYTM_MERCHANT_KEY, function (err, JsonData) {

                            console.log("result of refund", JsonData)

                            let jsONDST = JSON.stringify(JsonData);
                            let refundApiPayTmUrl = constantObj.paytm_config.REFUND_URL + "?JsonData=" + jsONDST
                            console.log("refundApiPayTmUrl", refundApiPayTmUrl)

                            var options = {
                                url: refundApiPayTmUrl,
                                method: 'GET',
                                /*headers: {
                                  "Authorization": constantObj.payu.Authorization
                                }*/
                                headers: {}
                            };

                            request(options).then(function (body) {
                                var info = JSON.parse(body);

                                //if ((info.status == 0 && info.message == "Refund Initiated") || (info.status == -1 && info.message == "Refund for this payment already done")) {
                                if (info.STATUS == 'TXN_SUCCESS' && info.RESPMSG == "Refund Successful." && info.REFUNDID != "") {
                                    var transactionData = {};
                                    transactionData.id = bidTransactions.id
                                    transactionData.processedBy = refundBy;
                                    transactionData.status = 'RF';
                                    transactionData.transactionType = 'DebitEscrow';
                                    transactionData.processStatus = info.RESPMSG
                                    transactionData.payTmRefundId = info.REFUNDID;
                                    transactionData.refundjson = info;

                                    Transactions.update({ id: bidTransactions.id }, transactionData).then(function (paymentData) {
                                        Bids.update({ id: bid.id }, { status: "Refund" }).then(function (updatebid) {
                                            Bidspayment.destroy({ bidId: bid.id }).then(function () {
                                                let updatedbid = updatebid[0]
                                                var history = {};
                                                history.bid = updatedbid.id;
                                                history.amount = updatedbid.amount;
                                                history.crop = updatedbid.crop;
                                                history.bidBy = updatedbid.user;
                                                history.bidStatus = updatedbid.status;
                                                history.quantity = updatedbid.quantity;
                                                history.quantityUnit = updatedbid.quantityUnit;
                                                history.comment = "Crop Closed Bid Refunded"
                                                Bidshistory.create(history).then(function (history) {
                                                    transactionsArray.push(transactionData)
                                                    callback()
                                                })
                                            })
                                        })
                                    }).fail(function (err) {
                                        callback(err)
                                    });
                                } else {
                                    callback(info.message)
                                }
                            }).catch(function (err) {
                                callback(err)
                            });
                        })
                    } else {
                        Bids.update({ id: bid.id }, { status: "Refund" }).then(function (updatebid) {
                            Bidspayment.destroy({ bidId: bid.id }).then(function () {
                                Bidspayment.destroy({ bidId: bid.id }).then(function () {
                                    let updatedbid = updatebid[0]
                                    var history = {};
                                    history.bid = updatedbid.id;
                                    history.amount = updatedbid.amount;
                                    history.crop = updatedbid.crop;
                                    history.bidBy = updatedbid.user;
                                    history.bidStatus = updatedbid.status;
                                    history.quantity = updatedbid.quantity;
                                    history.quantityUnit = updatedbid.quantityUnit;
                                    history.comment = "Crop Closed Bid Refunded"
                                    Bidshistory.create(history).then(function (history) {
                                        transactionsArray.push(history)
                                        callback()
                                    })
                                })

                            })
                        })
                    }
                })
            }, function (error) {
                if (error) {
                    return res.status(400).jsonx({
                        success: false,
                        error: error
                    });
                } else {
                    if (transactionsArray.length == bidsInfo.length) {
                        Crops.update({ id: req.param("id") }, { isExpired: true }).then(function (crop) {
                            return res.status(200).jsonx({
                                success: true,
                                code: 200,
                                data: {
                                    message: constantObj.crops.EXPIRED_CROP
                                }
                            });
                            /*return Users.findOne(crop[0].seller).then(function (userinfo) {

                               // let fieldOfficerContact = context.identity.mobile;

                               var message = userinfo.firstName;
                               message += '<br/><br/>';
                               message += 'Your crop "'+crop[0].name+'" is closed by the eFarmX. Thanks,';
                               message += '<br/><br/>';
                               message += '<br/><br/>';
                               message += 'Regards';
                               message += '<br/><br/>';
                               message += 'eFarmX Team';
                               var SMS = ' Your crop "'+crop[0].name+'" is closed by the eFarmX. Please visir again manage your crop.';

                               var sendObj = commonServiceObj.notifyCropUser(userinfo.username, userinfo.mobile, message, SMS );
                               
                               return {
                                   success: true,
                                   code: 200,
                                   data: {
                                       message: constantObj.crops.EXPIRED_CROP
                                   }
                               };
                           });*/

                        }).fail(function (err) {
                            return res.status(400).jsonx({
                                success: false,
                                error: err
                            });
                        });
                    } else {
                        return res.status(400).jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: "Some payments are not refunded so could not close the crop"
                            }
                        });
                    }
                }
            });
        }).fail(function (err) {
            return res.status(400).jsonx({
                success: false,
                error: err
            });
        });
    },

    logisticCharges: function (req, res) {
        //API(commonService.getLogisticCharges, req, res);
        //
        commonService.getLogisticCharges(req.params, function (error, success) {

            if (error) {
                return res.status(400).jsonx({
                    success: false,
                    error: error,
                });
            } else {
                return res.status(200).jsonx({
                    data: {
                        success: true,
                        rate: success,
                    }
                });
            }
        });

    },
    getFilters: function (req, res) {

        let query = {};
        query.type = "crops";
        query.isDeleted = false;
        query.status = "active";

        Category.find(query).then(function (categories) {

            var filters = constantObj.filter;

            filters.categories = categories;
            return res.jsonx(filters);
        });

    },

    getAllCrops: function (req, res, next) {

        var list = req.param('list');
        var search = req.param('search');
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var sortBy = req.param('sortBy');
        var seller = req.param('seller');
        var markets;
        var assign = req.param('assign');
        var close = req.param('close');
        var approve = req.param('approve');

        if (req.param('markets')) markets = JSON.parse(req.param('markets'));

        var query = {};
        var sortquery = {};

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }

        count = parseInt(count);

        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        query.isDeleted = false;
        if (approve == 'true') {
            query.isApproved = true;
            query.isExpired = false;
        } else if (approve == 'false') {
            query.isApproved = false;
            query.isExpired = false;
        }

        if (close == 'true') {
            query.isExpired = true;
        }

        if (assign == 'true') {
            query.transactionOwner = ObjectId(req.identity.id);
            //query.transactionOwner = String(query.transactionOwner);
            query.isExpired = false
        }

        if (markets != undefined && markets.length > 0) {
            query.pincode = { "$in": markets };
        }

        if (req.param('bidFrom') && req.param('bidTo')) {
            query.$and = [{
                bidEndDate: {
                    $gte: new Date(req.param('bidFrom'))
                }
            }, {
                bidEndDate: {
                    $lte: new Date(req.param('bidTo'))
                }
            }]
        }


        if (req.param('createdAtFrom') && req.param('createdAtTo')) {
            query.$and = [{
                createdAt: {
                    $gte: new Date(req.param('createdAtFrom'))
                }
            }, {
                createdAt: {
                    $lte: new Date(req.param('createdAtTo'))
                }
            }]
        }

        if (search) {
            query.$or = [
                { code: parseInt(search) },
                { name: { $regex: search, '$options': 'i' } },
                { transactionOwner: { $regex: search, '$options': 'i' } },
                { category: { $regex: search, '$options': 'i' } },
                { parentCategory: { $regex: search, '$options': 'i' } },
                { price: parseFloat(search) },
                { quantity: parseFloat(search) },
                { verified: { $regex: search, '$options': 'i' } },
                { district: { $regex: search, '$options': 'i' } },
                { seller: { $regex: search, '$options': 'i' } },
                { sellerCode: { $regex: search, '$options': 'i' } },
                { userUniqueId: { $regex: search, '$options': 'i' } }

            ]
        }

        Crops.native(function (err, croplist) {
            croplist.aggregate([
                {
                    $lookup: {
                        from: "category",
                        localField: "category",
                        foreignField: "_id",
                        as: "category"
                    }
                },
                {
                    $unwind: '$category'
                },
                {
                    $lookup: {
                        from: "category",
                        localField: "category.parentId",
                        foreignField: "_id",
                        as: "parentCategory"
                    }
                },
                {
                    $unwind: '$parentCategory'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'seller',
                        foreignField: '_id',
                        as: "sellers"
                    }
                },
                {
                    $unwind: '$sellers'
                },
                {
                    $project: {
                        id: "$_id",
                        name: "$name",
                        code: "$code",
                        category: "$category.name",
                        parentCategory: "$parentCategory.name",
                        price: "$price",
                        pincode: "$pincode",
                        endDate: "$endDate",
                        quantity: "$quantity",
                        quantityUnit: "$quantityUnit",
                        district: "$district",
                        availableFrom: "$availableFrom",
                        leftAfterAcceptanceQuantity: "$leftAfterAcceptanceQuantity",
                        leftAfterDeliveryQuantity: "$leftAfterDeliveryQuantity",
                        images: "$images",
                        coverImage: "$coverImage",
                        bidEndDate: "$bidEndDate",
                        seller: "$sellers.fullName",
                        sellerId: "$sellers._id",
                        sellerMobile: "$sellers.mobile",
                        sellerstate: "$sellers.state",
                        sellerCode: "$sellers.userUniqueId",
                        userUniqueId: "$sellers.userUniqueId",
                        transactionOwner: "$transactionOwner",
                        isDeleted: "$isDeleted",
                        status: "$status",
                        isApproved: "$isApproved",
                        isExpired: "$isExpired",
                        createdAt: "$createdAt",
                        aggregatedCrops: "$aggregatedCrops",
                        variety: "$variety"
                    }
                },
                {
                    $match: query
                }
            ], function (err, totalresults) {
                if (err) {

                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {

                    croplist.aggregate([
                        {
                            $lookup: {
                                from: "category",
                                localField: "category",
                                foreignField: "_id",
                                as: "category"
                            }
                        },
                        {
                            $unwind: '$category'
                        },
                        {
                            $lookup: {
                                from: "category",
                                localField: "category.parentId",
                                foreignField: "_id",
                                as: "parentCategory"
                            }
                        },
                        {
                            $unwind: '$parentCategory'
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'seller',
                                foreignField: '_id',
                                as: "sellers"
                            }
                        },
                        {
                            $unwind: '$sellers'
                        },
                        {
                            $project: {
                                id: "$_id",
                                name: "$name",
                                code: "$code",
                                category: "$category.name",
                                parentCategory: "$parentCategory.name",
                                price: "$price",
                                pincode: "$pincode",
                                endDate: "$endDate",
                                quantity: "$quantity",
                                quantityUnit: "$quantityUnit",
                                verified: "$verified",
                                district: "$district",
                                availableFrom: "$availableFrom",
                                leftAfterAcceptanceQuantity: "$leftAfterAcceptanceQuantity",
                                leftAfterDeliveryQuantity: "$leftAfterDeliveryQuantity",
                                images: "$images",
                                coverImage: "$coverImage",
                                bidEndDate: "$bidEndDate",
                                transactionOwner: "$transactionOwner",
                                seller: "$sellers.fullName",
                                sellerId: "$sellers._id",
                                sellerMobile: "$sellers.mobile",
                                sellerstate: "$sellers.state",
                                sellerCode: "$sellers.userUniqueId",
                                userUniqueId: "$sellers.userUniqueId",
                                isDeleted: "$isDeleted",
                                status: "$status",
                                isApproved: "$isApproved",
                                isExpired: "$isExpired",
                                createdAt: "$createdAt",
                                aggregatedCrops: "$aggregatedCrops",
                                variety: "$variety"
                            }
                        },
                        {
                            $match: query
                        },
                        {
                            $sort: sortquery
                        },
                        {
                            $skip: skipNo
                        },
                        {
                            $limit: count
                        }
                    ], function (err, results) {


                        if (err) {
                            return res.status(400).jsonx({
                                success: false,
                                error: err
                            });
                        } else {

                            async.each(results, function (crop, callback) {

                                let query = {};
                                query = { crop: { $in: [crop.id] } };
                                let tId = crop.transactionOwner;
                                let userId = tId ? tId.toString() : "";
                                //
                                Users.findOne(userId).then(function (user) {
                                    //
                                    crop.transactionOwnerId = user != undefined ? user.id : "";
                                    crop.transactionfullName = user != undefined ? user.fullName : "";

                                    Bids.find(query).then(function (bids) {
                                        crop.bids = bids;
                                        Orderedcarts.find(query).then(function (suborders) {
                                            crop["subOrdersCount"] = suborders.length;
                                            callback();

                                        }).fail(function (error) {

                                            callback(error);
                                        });

                                    }).fail(function (error) {

                                        callback(error);
                                    });
                                }).fail(function (error) {

                                    callback(error);
                                });
                            }, function (error) {
                                if (error) {

                                    return res.status(400).jsonx({
                                        success: false,
                                        error: error,
                                    });
                                } else {
                                    return res.jsonx({
                                        success: true,
                                        data: {
                                            crops: results,
                                            total: totalresults.length
                                        },
                                    });
                                }
                            });
                        }
                    });
                }
            });

        })
    },


    getCrops: function (req, res, next) {

        var list = req.param('list');
        var search = req.param('search');
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var sortBy = req.param('sortBy');
        var seller = req.param('seller');
        var close = req.param('close');
        var minprice = req.param('minprice');
        var maxprice = req.param('maxprice');
        var category = req.param('category');
        var minquantity = req.param('minquantity');
        var maxquantity = req.param('maxquantity');
        var catgIds;
        let categories = [];
        if (req.param('categoryIds')) catgIds = JSON.parse(req.param('categoryIds')); //["597c6602b7415e233aa98b65", "597c629c769e1ca441f37b3e"] // array of category ids


        /****** Start Filter parameters for filter crops listing ***********
            minprice , maxprice
            minquantity , maxquantity
            categoryIds // array of category ids
        ******* End Filter parameters for filter crops listing *************/

        var query = {};
        var sortquery = {};

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }
        count = parseInt(count);

        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        query.isDeleted = false;
        query.isApproved = true;
        query.isExpired = false;

        if (search) {
            query.$or = [
                { name: { $regex: search, '$options': 'i' } },
                { category: { $regex: search, '$options': 'i' } },
                { paymentPreference: { $regex: search, '$options': 'i' } },
                { quantity: parseFloat(search) },
                { verified: { $regex: search, '$options': 'i' } },
                { district: { $regex: search, '$options': 'i' } },
                { seller: { $regex: search, '$options': 'i' } },
                { price: parseFloat(search) }
            ]
        }

        if (seller) {

            query.seller = seller;
        }

        query.status = "Active";

        if (seller && list == "guest") {

            query.seller = { '!': seller };
        }

        var _date = new Date();
        // query.endDate =  { "$gte" :  _date  };

        // Filter on Category
        if (catgIds != undefined && catgIds.length > 0) {
            query.categoryId = { "$in": catgIds };
        }


        if (category) {
            query.categoryId = category;
        }

        if (minprice != undefined && minprice != "" && maxprice != undefined && maxprice != "") {
            // Filter on Price range { b : { $gt :  4, $lt : 6}}
            query.price = { $gt: parseFloat(minprice), $lte: parseFloat(maxprice) };
        }
        //Filter on Location:
        if (minquantity != undefined && maxquantity != undefined && minquantity != "" && maxquantity != "") {
            //Filter on Quantity:
            query.quantity = { $gt: parseFloat(minquantity), $lte: parseFloat(maxquantity) };
        }


        if (close == 'true') {
            query.isExpired = true;
        }



        Crops.native(function (err, croplist) {
            croplist.aggregate([
                {
                    $lookup: {
                        from: "category",
                        localField: "category",
                        foreignField: "_id",
                        as: "category"
                    }
                },
                {
                    $unwind: '$category'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'seller',
                        foreignField: '_id',
                        as: "sellers"
                    }
                },
                {
                    $unwind: '$sellers'
                },
                {
                    $project: {
                        id: "$_id",
                        name: "$name",
                        category: "$category.name",
                        categoryId: "$categoryId",
                        price: "$price",
                        endDate: "$endDate",
                        quantity: "$quantity",
                        bidEndDate: "$bidEndDate",
                        quantityUnit: "$quantityUnit",
                        district: "$district",
                        availableFrom: "$availableFrom",
                        images: "$images",
                        coverImage: "$coverImage",
                        seller: "$sellers.fullName",
                        sellerId: "$sellers._id",
                        cropState: "$state",
                        status: "$status",
                        sellerstate: "$sellers.state",
                        isDeleted: "$isDeleted",
                        isApproved: "$isApproved",
                        isExpired: "$isExpired",
                        createdAt: "$createdAt"
                    }
                },
                {
                    $match: query
                }
            ], function (err, totalresults) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {

                    croplist.aggregate([
                        {
                            $lookup: {
                                from: "category",
                                localField: "category",
                                foreignField: "_id",
                                as: "category"
                            }
                        },
                        {
                            $unwind: '$category'
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'seller',
                                foreignField: '_id',
                                as: "sellers"
                            }
                        },
                        {
                            $unwind: '$sellers'
                        },
                        {
                            $project: {
                                id: "$_id",
                                name: "$name",
                                category: "$category.name",
                                categoryId: "$categoryId",
                                price: "$price",
                                endDate: "$endDate",
                                quantity: "$quantity",
                                quantityUnit: "$quantityUnit",
                                bidEndDate: "$bidEndDate",
                                verified: "$verified",
                                district: "$district",
                                availableFrom: "$availableFrom",
                                images: "$images",
                                coverImage: "$coverImage",
                                seller: "$sellers.fullName",
                                sellerId: "$sellers._id",
                                cropState: "$state",
                                status: "$status",
                                sellerstate: "$sellers.state",
                                isDeleted: "$isDeleted",
                                isApproved: "$isApproved",
                                isExpired: "$isExpired",
                                createdAt: "$createdAt"
                            }
                        },
                        {
                            $match: query
                        },
                        {
                            $sort: sortquery
                        },
                        {
                            $skip: skipNo
                        },
                        {
                            $limit: count
                        }
                    ], function (err, results) {
                        if (err) {
                            return res.status(400).jsonx({
                                success: false,
                                error: err
                            });
                        } else {
                            /*var rateQuery= {};
                            async.each(results, function(result, callback) {
                                rateQuery.user = result.sellerId;

                                Rating.count(rateQuery)
                                .then(function(totalUsers){
                                    role.totalUsers = totalUsers;
                                    callback();
                                })
                                .fail(function(error){
                                    callback(error);
                                })

                            })*/
                            return res.jsonx({
                                success: true,
                                data: {
                                    crops: results,
                                    total: totalresults.length
                                },
                            });
                        }
                    });
                }
            });

        })
    },

    getPricesOfAllCrops: function (req, res) {
        var query = {}
        query.isDeleted = false
        query.isApproved = true
        query.isExpired = false
        Crops.native(function (error, cropsList) {
            cropsList.aggregate([
                {
                    $lookup: {
                        from: "category",
                        localField: "category",
                        foreignField: "_id",
                        as: "categories"
                    }
                },
                {
                    $unwind: "$categories"
                },
                {
                    $match: query
                },
                {
                    $project: {
                        categoryName: "$categories.name",
                        price: "$price"
                    }
                },
                {
                    $sort: { 'price': 1 }
                },
                {
                    $group: {
                        _id: "$categoryName",
                        prices: {
                            $push: "$price"
                        }
                    }
                }
            ], function (err, allPrices) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: allPrices
                    });
                }
            });
        })
    },

    myCrops: function (req, res) {

        var search = req.param('search');
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var sortBy = req.param('sortBy');
        var seller = req.param('seller');
        var isExpired = req.param('expire');

        var query = {};

        if (sortBy == undefined) {
            sortBy = "updatedAt DESC"
        }

        query.seller = seller;
        query.isDeleted = false;
        if (isExpired == "yes") {
            query.isExpired = true;
        } else if (isExpired == "no") {
            query.isExpired = false;
        }

        Crops.find(query)
            .populate('croppayments', {
                where: { status: 'Paid', paymentMedia: 'Bid' },
                select: ['cropId', 'sellerId', 'bidId', 'status']
            })
            .populate('cropOrderpayments', {
                where: { status: 'Paid', paymentMedia: 'Cart' },
                select: ['cropId', 'sellerId', 'order', 'suborder', 'status']
            })
            .populate('myOrders', {
                select: ['crop', 'seller', 'order', 'status']
            })
            .populate('category').populate('seller').sort(sortBy).skip(skipNo).limit(count).exec(function (err, cropresponse) {
                //console.log(cropresponse, 'cropresponse=====');
                async.each(cropresponse, function (crop, callback) {
                    let query = {};
                    query.crop = crop.id;

                    Bids.find(query)
                        .then(function (bid) {
                            if (bid.length > 0) {
                                crop.bids = bid;
                            } else {
                                crop.bids = [];
                            }
                            callback();
                        })
                        .fail(function (error) {

                            callback(error);
                        });
                }, function (error) {
                    if (error) {

                        return res.status(400).jsonx({
                            success: false,
                            error: error,
                        });
                    } else {
                        if (err) {

                            return res.status(400).jsonx({
                                success: false,
                                error: err
                            });
                        } else {
                            Crops.count(query).populate('category').populate('seller').sort(sortBy).skip(skipNo).limit(count).exec(function (croperr, croptotal) {
                                if (croperr) {
                                    return res.status(400).jsonx({
                                        success: false,
                                        error: error
                                    });
                                } else {

                                    var i = 0;
                                    for (let value of cropresponse) {
                                        cropresponse[i]["sellerVerifiedPayments"] = value.croppayments.length;
                                        cropresponse[i]["sellerVerifiedOrderPayments"] = value.cropOrderpayments.length;
                                        cropresponse[i]["myOrdersCount"] = value.myOrders.length;

                                        i++;
                                    }

                                    return res.jsonx({
                                        success: true,
                                        data: {
                                            crops: cropresponse,
                                            total: croptotal
                                        },
                                    });
                                }
                            });
                        }
                    }
                });
            })

        /* Crops.find(query).sort("createdAt DESC")
             .populate('croppayments',{
                         where: { status: 'Paid' },
                         select: ['cropId','sellerId','bidId','status']
                     })
             //.populate('bids')
             .populate('category')
             .populate('seller')
             .sort(sortBy)
             .skip(skipNo)
             .limit(count)
             .exec(function(err, cropresponse) {
 
                if (err) {                    
                     return res.status(400).jsonx({
                        success: false,
                        error: err
                     });
                 } else {
 
             var i = 0;
             for (let value of cropresponse) {
                 cropresponse[i]["sellerVerifiedPayments"] = value.croppayments.length;
             i++;
             }
 
 
                     Crops.count(query)
                         .populate('category')
                         .populate('seller')
                         .sort(sortBy)
                         .skip(skipNo)
                         .limit(count)
                         .exec(function(croperr, croptotal){
 
                         if(croperr){
                            return res.status(400).jsonx({
                                 success: false,
                                 error: error
                             });  
                         } else {
                             return res.jsonx({
                                 success: true,
                                 data: {
                                     crops: cropresponse,
                                     total: croptotal
                                 },
                             });
                         }
                     });
                 }
        })*/
    },
    sellerPosetdCrops: function (req, res) {

        // Seller posted crops list
        let page = req.param('page');
        let count = req.param('count');
        let skipNo = (page - 1) * count;
        let sortBy = req.param('sortBy');
        let seller = req.param('seller');
        let open = req.param('open');

        let query = {};

        query.isDeleted = false;
        query.isExpired = false;
        query.isApproved = true;
        query.id = { "$nin": [open] };
        query.seller = seller;

        //
        Crops.find(query, { fields: ['name', 'seller', 'images', 'coverImage', 'bidEndDate', 'price', 'leftAfterAcceptanceQuantity'] }).sort(sortBy).skip(skipNo).limit(count).exec(function (err, cropresponse) {

            if (err) {

                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                Crops.count(query).sort(sortBy).skip(skipNo).limit(count).exec(function (croperr, croptotal) {
                    if (croperr) {
                        return res.status(400).jsonx({
                            success: false,
                            error: error
                        });
                    } else {
                        return res.jsonx({
                            success: true,
                            data: {
                                crops: cropresponse,
                                total: croptotal
                            },
                        });
                    }
                });
            }
        })
    },

    categoryOtherCrops: function (req, res) {
        // Category other crop list
        let page = req.param('page');
        let count = req.param('count');
        let skipNo = (page - 1) * count;
        let sortBy = req.param('sortBy');
        let category = req.param('categoryID');
        let variety = req.param('variety');
        let open = req.param('open');

        if (variety) {
            sortBy = variety;
        }

        let query = {};
        query.isDeleted = false;
        query.isExpired = false;
        query.isApproved = true;
        query.id = { "$nin": [open] };
        query.category = category;

        let pincode = req.param('pincode')

        Crops.find(query, { fields: ['name', 'category', 'price', 'quantityUnit', 'images', 'coverImage', 'bidEndDate', 'variety', 'leftAfterAcceptanceQuantity', 'quantity', 'pincode', 'market', 'efarmxComission', 'taxRate'] })
            .sort(sortBy)
            .skip(skipNo)
            .limit(count).exec(function (err, allcrops) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    Crops.count(query).sort(sortBy).skip(skipNo).limit(count).exec(function (croperr, croptotal) {
                        if (croperr) {
                            return res.status(400).jsonx({
                                success: false,
                                error: error
                            });
                        } else {
                            if (pincode) {
                                async.each(allcrops, function (crop, callback) {
                                    Market.findOne({ id: crop.market }).populate('GM', { select: ['pincode'] }).then(function (market) {
                                        let sourceP = crop.pincode
                                        if (market && market.GM && market.GM.pincode) {
                                            sourceP = market.GM.pincode
                                        }
                                        let qry = {}
                                        qry.isDeleted = false
                                        let category = crop.category.id

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
                                    return res.jsonx({
                                        success: true,
                                        data: {
                                            crops: allcrops,
                                            total: croptotal
                                        },
                                    });
                                })
                            } else {
                                return res.jsonx({
                                    success: true,
                                    data: {
                                        crops: allcrops,
                                        total: croptotal
                                    },
                                });
                            }
                        }
                    });
                }
            })
    },

    show: function (req, res) {
        let Id = req.param('id');
        let user = req.param('user');
        let pincode = req.param('pincode');
        if (user) {
            Bids.findOne({ crop: Id, user: user, status: 'Pending' })
                .populate('user', { select: ['firstName', 'lastName', /*'mobile', 'username', 'city', 'district', 'state', 'pincode', 'address',*/ 'userUniqueId', 'code', /*'avgRating', 'sellerCode',*/ 'billingAddress', 'shippingAddress', 'fullName'] })
                .then(function (userBid) {
                    Users.findOne({ id: user }).then(function (usr) {
                        let findfcQry = {}
                        findfcQry.productId = Id
                        findfcQry.productType = 'CROPS'

                        if (usr.email) {
                            findfcQry.$or = [{ user: user }, { userGivenInfo: String(usr.mobile) }, { userGivenInfo: usr.email }]
                        } else {
                            findfcQry.$or = [{ user: user }, { userGivenInfo: String(usr.mobile) }]
                        }

                        FacilitationCharges.find(findfcQry).sort({ facilitationPercentage: 1 }).then(function (fc) {
                            if (fc.length > 0) {
                                let now = new Date()
                                let fcAllotted = false

                                for (var i = 0; i < fc.length; i++) {
                                    if (fc[i].validTill != undefined && fc[i].validTill != null) {
                                        if (fc[i].validTill > now) {
                                            CropService.showWithFacilitationCharges(fc[i].facilitationPercentage, userBid, req, res)
                                            fcAllotted = true
                                            break
                                        }
                                    } else {
                                        CropService.showWithFacilitationCharges(fc[i].facilitationPercentage, userBid, req, res)
                                        fcAllotted = true
                                        break
                                    }
                                }
                                if (!fcAllotted) {
                                    if (pincode) {
                                        CropService.showInPincode(usr.pincode, pincode, userBid, req, res)
                                    } else {
                                        CropService.showInPincode(null, usr.pincode, userBid, req, res)
                                    }
                                }
                            } else {
                                if (pincode) {
                                    CropService.showInPincode(usr.pincode, pincode, userBid, req, res)
                                } else {
                                    CropService.showInPincode(null, usr.pincode, userBid, req, res)
                                }
                            }
                        })
                    })
                })
        } else if (pincode) {
            CropService.showInPincode(null, pincode, null, req, res)
        } else {
            CropService.showWithFacilitationCharges(null, null, req, res)
        }
    },

    cropLanding: function (req, res) {
        let mostviewed = {};
        mostviewed.viewed = { "$gt": 0 };
        mostviewed.isDeleted = false;
        mostviewed.isApproved = true;
        mostviewed.isExpired = false;

        let featured = {};
        featured.isFeatured = true;
        featured.isDeleted = false;
        featured.isApproved = true;
        featured.isExpired = false;

        var page = 1
        var count = 10
        var skip = 0

        if (req.param('page') != undefined) {
            page = req.param('page')
        }
        if (req.param('count') != undefined) {
            count = req.param('count')
        }

        var skipNo = (page - 1) * count;

        let pincode = req.param('pincode')

        let selectedFields = ['code', 'name', 'category', 'price', 'quantityUnit', 'images', 'coverImage', 'bidEndDate', 'variety', 'leftAfterAcceptanceQuantity', 'quantity', 'pincode', 'market', 'efarmxComission', 'taxRate', 'district']


        Crops.find({ isDeleted: false, isApproved: true, isExpired: false }, { fields: selectedFields }).populate('category', { select: ['name'] }).sort('totalBids DESC').skip(skipNo).limit(count).exec(function (err, crops) {
            Crops.count({ isDeleted: false, isApproved: true, isExpired: false }).then(function (cropsCount) {
                Crops.find(mostviewed, { fields: selectedFields }).populate('category', { select: ['name'] }).sort('viewed DESC').skip(skipNo).limit(count).then(function (mostlyViewed) {
                    Crops.count(mostviewed).then(function (mostlyViewedCount) {
                        Crops.find(featured, { fields: selectedFields }).populate('category', { select: ['name'] }).sort('createdAt DESC').skip(skipNo).limit(count).then(function (feature) {
                            Crops.count(featured).then(function (featureCount) {
                                let allCropsTotal = {
                                    mostlyViewed: mostlyViewedCount,
                                    feature: featureCount,
                                    crops: cropsCount
                                }
                                if (pincode) {
                                    let calculatedCrops = []
                                    let landingPrices = {}
                                    let allCrops = {
                                        mostlyViewed: mostlyViewed,
                                        feature: feature,
                                        crops: crops
                                    }
                                    async.each(Object.keys(allCrops), function (typ, callbackM) {
                                        async.each(allCrops[typ], function (crop, callback) {
                                            if (calculatedCrops.includes(crop.id)) {
                                                if (landingPrices[crop.id] != undefined) {
                                                    crop.landingPrice = landingPrices[crop.id]
                                                    delete crop.pincode
                                                    delete crop.market
                                                    delete crop.efarmxComission
                                                    delete crop.taxRate
                                                }
                                                callback()
                                            } else {
                                                calculatedCrops.push(crop.id)
                                                Market.findOne({ id: crop.market }).populate('GM', { select: ['pincode'] }).then(function (market) {
                                                    sourceP = crop.pincode
                                                    if (market && market.GM && market.GM.pincode) {
                                                        sourceP = market.GM.pincode
                                                    }

                                                    let qry = {}
                                                    qry.isDeleted = false
                                                    let category = crop.category.id

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
                                                            landingPrices[crop.id] = crop.landingPrice
                                                        }
                                                        // delete crop.pincode
                                                        delete crop.market
                                                        delete crop.efarmxComission
                                                        delete crop.taxRate
                                                        callback()
                                                    }).fail(function (err) {
                                                        // delete crop.pincode
                                                        delete crop.market
                                                        delete crop.efarmxComission
                                                        delete crop.taxRate
                                                        callback()
                                                    })
                                                })
                                            }
                                        }, function (asyncError) {
                                            callbackM()
                                        })
                                    }, function (asyncErrorM) {
                                        return res.jsonx({
                                            success: true,
                                            data: allCrops,
                                            total: allCropsTotal
                                        });
                                    })

                                    /*async.each(mostlyViewed, function(crop, callback) {
                                        calculatedCrops.push(crop.id)
                                        Market.findOne({id:crop.market}).populate('GM', {select:['pincode']}).then(function(market) {
                                            let sourceP = crop.pincode
                                            if (market && market.GM && market.GM.pincode) {
                                                sourceP = market.GM.pincode
                                            }
            
                                            let qry = {}
                                            let category = crop.category.id
                                            
                                            qry.destination = parseInt(pincode)
                                            qry.category = category
                                            qry.source = sourceP
            
                                            let now = new Date()
            
                                            qry.$or = [{validUpto:null},{validUpto:undefined},{validUpto:{$gt:now}}]
            
                                            Logisticprice.find(qry).sort('load desc').then(function(lprices) {
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
                                                    let landingPrice = crop.price + ((crop.efarmxComission/100 * crop.price) * (1 + crop.taxRate/100)) + (lastPrice/lastLoad)
                                                    crop.landingPrice = parseFloat((landingPrice).toFixed(2));
                                                    landingPrices[crop.id] = crop.landingPrice
                                                }
                                                callback()
                                            }).fail(function(err) {
                                                callback()
                                            })
                                        })
                                    }, function(asyncError){
                                        async.each(feature, function(crop, callback) {
                                            if (calculatedCrops.includes(crop.id)) {
                                                if (landingPrices[crop.id] != undefined) {
                                                    crop.landingPrice = landingPrices[crop.id]
                                                }
                                                callback() 
                                            } else {
                                                calculatedCrops.push(crop.id)
                                                Market.findOne({id:crop.market}).populate('GM', {select:['pincode']}).then(function(market) {
                                                    sourceP = crop.pincode
                                                    if (market && market.GM && market.GM.pincode) {
                                                        sourceP = market.GM.pincode
                                                    }
            
                                                    let qry = {}
                                                    let category = crop.category.id
                                                    
                                                    qry.destination = parseInt(pincode)
                                                    qry.category = category
                                                    qry.source = sourceP
            
                                                    let now = new Date()
            
                                                    qry.$or = [{validUpto:null},{validUpto:undefined},{validUpto:{$gt:now}}]
            
                                                    Logisticprice.find(qry).sort('load desc').then(function(lprices) {
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
                                                            let landingPrice = crop.price + ((crop.efarmxComission/100 * crop.price) * (1 + crop.taxRate/100)) + (lastPrice/lastLoad)
                                                            crop.landingPrice = parseFloat((landingPrice).toFixed(2));
                                                        }
                                                        callback()
                                                    }).fail(function(err) {
                                                        callback()
                                                    })
                                                })
                                            }
                                        }, function(asyncError){
                                            async.each(crops, function(crop, callback) {
                                                if (calculatedCrops.includes(crop.id)) {
                                                    if (landingPrices[crop.id] != undefined) {
                                                        crop.landingPrice = landingPrices[crop.id]
                                                    }
                                                    callback() 
                                                } else {
                                                    calculatedCrops.push(crop.id)
                                                    Market.findOne({id:crop.market}).populate('GM', {select:['pincode']}).then(function(market) {
                                                       sourceP = crop.pincode
                                                        if (market && market.GM && market.GM.pincode) {
                                                            sourceP = market.GM.pincode
                                                        }
            
                                                        let qry = {}
                                                        let category = crop.category.id
                                                        
                                                        qry.destination = parseInt(pincode)
                                                        qry.category = category
                                                        qry.source = sourceP
            
                                                        let now = new Date()
            
                                                        qry.$or = [{validUpto:null},{validUpto:undefined},{validUpto:{$gt:now}}]
            
                                                        Logisticprice.find(qry).sort('load desc').then(function(lprices) {
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
                                                                let landingPrice = crop.price + ((crop.efarmxComission/100 * crop.price) * (1 + crop.taxRate/100)) + (lastPrice/lastLoad)
                                                                crop.landingPrice = parseFloat((landingPrice).toFixed(2));
                                                            }
                                                            callback()
                                                        }).fail(function(err) {
                                                            callback()
                                                        })
                                                    })
                                                }
                                            }, function(asyncError){
                                                return res.jsonx({
                                                    success: true,
                                                    data: {
                                                        crops: crops,
                                                        mostlyViewed:mostlyViewed,
                                                        feature:feature
                                                    },
                                                });
                                            })
                                        })
                                    })*/
                                } else {
                                    return res.jsonx({
                                        success: true,
                                        data: {
                                            crops: crops,
                                            mostlyViewed: mostlyViewed,
                                            feature: feature
                                        },
                                        total: allCropsTotal
                                    });
                                }
                            })
                        })
                    })
                })
            })
        })
    },

    cropsFromPastOrder: function (req, res) {
        var page = req.param('page');
        var count = req.param('count');
        var pincode = req.param('pincode');
        var skipNo = (page - 1) * count;
        let query = { user: req.identity.id }

        Bids.find(query, { fields: ['crop'] }).populate('crop', { select: ['category'] }).then(function (bids) {
            Orderedcarts.find(query, { fields: ['crop'] }).populate('crop', { select: ['category'] }).then(function (orders) {
                let allcats = new Set()
                for (var i = 0; i < bids.length; i++) {
                    if (bids[i].crop && bids[i].crop.category) {
                        let catid = bids[i].crop.category
                        allcats.add(catid)
                    }

                }

                for (var j = 0; j < orders.length; j++) {
                    if (orders[j].crop && orders[j].crop.category) {
                        let catid = orders[j].crop.category
                        allcats.add(catid)
                    }
                }

                let allcatsArr = Array.from(allcats)
                if (allcatsArr.length > 0) {
                    let cropsQuery = {}
                    cropsQuery.isDeleted = false
                    cropsQuery.isApproved = true
                    cropsQuery.isExpired = false
                    // cropsQuery.leftAfterAcceptanceQuantity = { $gte: 10 }
                    cropsQuery.category = { $in: allcatsArr }

                    Crops.count(cropsQuery).then(function (totalCrops) {
                        let selectedFields = ['code', 'name', 'category', 'price', 'quantityUnit', 'images', 'coverImage', 'bidEndDate', 'variety', 'leftAfterAcceptanceQuantity', 'quantity', 'pincode', 'market', 'efarmxComission', 'taxRate', 'district']

                        Crops.find(cropsQuery, { fields: selectedFields }).populate('category', { select: ['name', 'qualities', 'image', 'iconImage'] }).skip(skipNo).limit(count).then(function (crops) {
                            if (crops.length > 0) {
                                if (pincode) {
                                    async.each(crops, function (crop, callback) {
                                        Market.findOne({ id: crop.market }).populate('GM', { select: ['pincode'] }).then(function (market) {
                                            let sourceP = crop.pincode
                                            if (market && market.GM && market.GM.pincode) {
                                                sourceP = market.GM.pincode
                                            }
                                            let qry = {}
                                            qry.isDeleted = false
                                            let category = crop.category.id

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
                                        return res.jsonx({
                                            success: true,
                                            data: {
                                                crops: crops,
                                                total: totalCrops
                                            },
                                        });
                                    })
                                } else {
                                    return res.jsonx({
                                        success: true,
                                        data: {
                                            crops: crops,
                                            total: totalCrops
                                        },
                                    });
                                }
                            } else {
                                return res.jsonx({
                                    success: true,
                                    message: "Crops not found"
                                });
                            }
                        })
                    })
                } else {
                    return res.jsonx({
                        success: true,
                        data: [],
                    });
                }
            })
        })
    },

    featuredCrop: function (req, res) {

        let featured = {};
        featured.isFeatured = true;
        featured.isDeleted = false;
        featured.isApproved = true;
        featured.isExpired = false;
        // featured.leftAfterAcceptanceQuantity = { $gte: 10 }

        var page = 1
        var count = 10
        var skipNo = 0

        if (req.param('page') != undefined) {
            page = req.param('page')
        }
        if (req.param('count') != undefined) {
            count = req.param('count')
        }

        var skipNo = (page - 1) * count;

        let pincode = req.param('pincode')
        let selectedFields = ['code', 'name', 'category', 'price', 'quantityUnit', 'images', 'coverImage', 'bidEndDate', 'variety', 'leftAfterAcceptanceQuantity', 'quantity', 'pincode', 'market', 'efarmxComission', 'taxRate', 'district']

        Crops.find(featured, { fields: selectedFields }).populate('category').sort('createdAt DESC').skip(skipNo).limit(count)
            .then(function (feature) {
                if (feature.length > 0) {
                    if (pincode) {
                        async.each(feature, function (crop, callback) {
                            Market.findOne({ id: crop.market }).populate('GM', { select: ['pincode'] }).then(function (market) {
                                let sourceP = crop.pincode
                                if (market && market.GM && market.GM.pincode) {
                                    sourceP = market.GM.pincode
                                }
                                let qry = {}
                                qry.isDeleted = false
                                let category = crop.category.id

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
                            return res.jsonx({
                                success: true,
                                data: {
                                    feature: feature
                                },
                            });
                        })
                    } else {
                        return res.jsonx({
                            success: true,
                            data: {
                                feature: feature
                            },
                        });
                    }
                } else {
                    query = {};
                    query.isDeleted = false;
                    query.isApproved = true;
                    query.isExpired = false;

                    Crops.find(query, { fields: selectedFields }).populate('category')
                        .sort('createdAt DESC').skip(skipNo)
                        .then(function (normalCrops) {
                            if (pincode) {
                                async.each(normalCrops, function (crop, callback) {
                                    Market.findOne({ id: crop.market }).populate('GM', { select: ['pincode'] }).then(function (market) {
                                        let sourceP = crop.pincode
                                        if (market && market.GM && market.GM.pincode) {
                                            sourceP = market.GM.pincode
                                        }
                                        let qry = {}
                                        qry.isDeleted = false
                                        let category = crop.category.id

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
                                    if (normalCrops) {
                                        return res.jsonx({
                                            success: true,
                                            data: {
                                                feature: normalCrops
                                            }
                                        });

                                    } else {
                                        return res.jsonx({
                                            success: false,
                                            err: "There are no crops."
                                        });
                                    }
                                })
                            } else {
                                if (normalCrops) {
                                    return res.jsonx({
                                        success: true,
                                        data: {
                                            feature: normalCrops
                                        }
                                    });
                                } else {
                                    return res.jsonx({
                                        success: false,
                                        err: "There are no crops."
                                    });
                                }
                            }

                        })
                }
            })
    },

    cropSearch: function (req, res) {

        let pincode = req.param('pincode')

        var search = req.param('search');
        var minprice = req.param('minprice');
        var maxprice = req.param('maxprice');
        var minquantity = req.param('minquantity');
        var maxquantity = req.param('maxquantity');
        var quality = req.param('quality');
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var sortBy = req.param('sortBy');
        var cropId = req.param('cropId');

        count = parseInt(count);
        var catgIds;
        var varieties;

        let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        if (req.param('categoryIds')) {
            let parsedcatgIds = JSON.parse(req.param('categoryIds'));
            catgIds = []

            parsedcatgIds.forEach((obj, i) => {
                catgIds.push(ObjectId(obj))
            })
        }
        if (req.param('variety')) {
            varieties = JSON.parse(req.param('variety'));
        }

        var qry = {};
        qry.isDeleted = false;
        qry.isApproved = true;
        qry.isExpired = false;
        qry.$or = [{ status: "Active" }, { status: null }];
        if (cropId) {
            qry.id = { "$nin": [ObjectId(cropId)] };
        }

        var sortquery = {};

        if (quality) {
            if (quality = 'A ') {
                quality = "A+";
            }
            qry.grade = quality
        }

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
            if (field == 'userRating') {
                field = 'sellers.avgRating'
            }

            //sortquery[field?field:field] = sortType?(sortType=='desc'?1:-1):-1;
        }
        sortquery[field ? field : "createdAt"] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        var qryArray = []

        if (search) {
            qryArray.push({ code: parseInt(search) })
            qryArray.push({ name: { $regex: search, '$options': 'i' } })
            qryArray.push({ parentcategory: { $regex: search, '$options': 'i' } })
            qryArray.push({ category: { $regex: search, '$options': 'i' } })
            qryArray.push({ variety: { $regex: search, '$options': 'i' } })
        }

        if (minprice != undefined && minprice != "" && maxprice != undefined && maxprice != "") {
            qry.price = { $gte: parseFloat(minprice), $lte: parseFloat(maxprice) };
        }

        if (minquantity != undefined && maxquantity != undefined && minquantity != "" && maxquantity != "") {
            qry.$and = [{ leftAfterAcceptanceQuantity: { $gte: parseFloat(minquantity) } }, { leftAfterAcceptanceQuantity: { $lte: parseFloat(maxquantity) } }];
        } else if (minquantity != undefined && minquantity != "") {
            qry.leftAfterAcceptanceQuantity = { $gte: parseFloat(minquantity) }
        } else if (maxquantity != undefined && maxquantity != "") {
            qry.leftAfterAcceptanceQuantity = { $lte: parseFloat(maxquantity) }
        } else {
            // qry.leftAfterAcceptanceQuantity = { $gte: 10.0 }
        }

        if (catgIds != undefined && catgIds.length > 0) {
            qryArray.push({ categoryId: { "$in": catgIds } });
            qryArray.push({ parentcategoryId: { "$in": catgIds } });
        }
        if (varieties != undefined && varieties.length > 0) {
            qryArray.push({ variety: { "$in": varieties } })
        }

        if (qryArray.length > 0) {
            qry.$or = qryArray
        }

        Crops.native(function (err, croplist) {
            croplist.aggregate([
                {
                    $lookup: {
                        from: "category",
                        localField: "category",
                        foreignField: "_id",
                        as: "category"
                    }
                },
                {
                    $unwind: '$category'
                },
                {
                    $lookup: {
                        from: "category",
                        localField: "category.parentId",
                        foreignField: "_id",
                        as: "parentcategory"
                    }
                },
                {
                    $unwind: '$parentcategory'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'seller',
                        foreignField: '_id',
                        as: 'sellers'
                    }
                },
                {
                    $unwind: '$sellers'
                },
                {
                    $project: {
                        id: "$_id",
                        viewed: "$viewed",
                        verified: "$verified",
                        variety: "$variety",
                        upfrontPercent: "$upfrontPercent",
                        taxRate: "$taxRate",
                        state: "$state",
                        userFullname: "$sellers.fullName",
                        userFirstname: "$sellers.firsname",
                        userImage: "$sellers.image",
                        userId: "$sellers._id",
                        userEmail: "$sellers.username",
                        userState: "$sellers.state",
                        userCity: "$sellers.city",
                        userDistricts: "$sellers.district",
                        userRating: "$sellers.avgRating",
                        userPincode: "$sellers.pincode",
                        quantityUnit: "$quantityUnit",
                        quantity: "$quantity",
                        leftAfterAcceptanceQuantity: "$leftAfterAcceptanceQuantity",
                        leftAfterDeliveryQuantity: "$leftAfterDeliveryQuantity",
                        price: "$price",
                        highestBid: "$highestBid",
                        grade: "$grade",
                        name: "$name",
                        category: "$category.name",
                        categoryId: "$category._id",
                        City: "$city",
                        State: "$state",
                        District: "$district",
                        Address: "$address",
                        bidEndDate: "$bidEndDate",
                        images: "$images",
                        coverImage: "$coverImage",
                        status: "$status",
                        isDeleted: "$isDeleted",
                        isExpired: "$isExpired",
                        isApproved: "$isApproved",
                        createdAt: "$createdAt",
                        soldOut: "$soldOut",
                        parentcategory: "$parentcategory.name",
                        parentcategoryId: "$parentcategory._id"
                    }
                },
                {
                    $match: qry
                }
            ], function (err, totalresults) {
                croplist.aggregate([
                    {
                        $lookup: {
                            from: "category",
                            localField: "category",
                            foreignField: "_id",
                            as: "category"
                        }
                    },
                    {
                        $unwind: '$category'
                    },
                    {
                        $lookup: {
                            from: "category",
                            localField: "category.parentId",
                            foreignField: "_id",
                            as: "parentcategory"
                        }
                    },
                    {
                        $unwind: '$parentcategory'
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'seller',
                            foreignField: '_id',
                            as: 'sellers'
                        }
                    },
                    {
                        $unwind: '$sellers'
                    },
                    {
                        $sort: sortquery
                    },
                    {
                        $project: {
                            id: "$_id",
                            viewed: "$viewed",
                            verified: "$verified",
                            variety: "$variety",
                            upfrontPercent: "$upfrontPercent",
                            categoryQualities: "$category.qualities",
                            taxRate: "$taxRate",
                            state: "$state",
                            userFullname: "$sellers.fullName",
                            userFirstname: "$sellers.firsname",
                            userImage: "$sellers.image",
                            userId: "$sellers._id",
                            userEmail: "$sellers.username",
                            userState: "$sellers.state",
                            userCity: "$sellers.city",
                            userDistricts: "$sellers.district",
                            userRating: "$sellers.avgRating",
                            userPincode: "$sellers.pincode",
                            quantityUnit: "$quantityUnit",
                            quantity: "$quantity",
                            leftAfterAcceptanceQuantity: "$leftAfterAcceptanceQuantity",
                            leftAfterDeliveryQuantity: "$leftAfterDeliveryQuantity",
                            price: "$price",
                            highestBid: "$highestBid",
                            grade: "$grade",
                            name: "$name",
                            category: "$category.name",
                            categoryId: "$category._id",
                            City: "$city",
                            State: "$state",
                            District: "$district",
                            Address: "$address",
                            bidEndDate: "$bidEndDate",
                            images: "$images",
                            coverImage: "$coverImage",
                            status: "$status",
                            isDeleted: "$isDeleted",
                            isExpired: "$isExpired",
                            isApproved: "$isApproved",
                            createdAt: "$createdAt",
                            soldOut: "$soldOut",
                            parentcategory: "$parentcategory.name",
                            parentcategoryId: "$parentcategory._id",
                            market: "$market",
                            pincode: "$pincode",
                            efarmxComission: "$efarmxComission",
                            code: "$code"
                        }
                    },
                    {
                        $match: qry
                    },
                    {
                        $skip: skipNo
                    },
                    {
                        $limit: count
                    }
                ], function (err, results) {
                    if (err) {
                        return res.status(400).jsonx({
                            success: false,
                            error: err
                        });
                    } else {
                        if (pincode) {
                            async.each(results, function (crop, callback) {
                                Market.findOne({ id: String(crop.market) }).populate('GM', { select: ['pincode'] }).then(function (mkt) {
                                    let sourceP = crop.pincode
                                    if (mkt && mkt.GM && mkt.GM.pincode) {
                                        sourceP = mkt.GM.pincode
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
                                            //let landingPrice = crop.price + ((crop.efarmxComission/100 * crop.price) * (1 + crop.taxRate/100)) + (lastPrice/lastLoad)
                                            let landingPrice = crop.price + ((crop.efarmxComission / 100 * crop.price) * (1 + crop.taxRate / 100)) + (lastPrice / crop.leftAfterAcceptanceQuantity)
                                            crop.landingPrice = parseFloat((landingPrice).toFixed(2));
                                        }

                                        delete crop.pincode
                                        delete crop.market
                                        delete crop.efarmxComission

                                        callback()
                                    }).fail(function (err) {
                                        delete crop.pincode
                                        delete crop.market
                                        delete crop.efarmxComission

                                        callback()
                                    })
                                })
                            }, function (asyncError) {
                                return res.status(200).jsonx({
                                    success: true,
                                    data: {
                                        crops: results,
                                        total: totalresults.length
                                    }
                                });
                            })
                        } else {
                            return res.status(200).jsonx({
                                success: true,
                                data: {
                                    crops: results,
                                    total: totalresults.length
                                }
                            });
                        }
                    }
                });
            })
        })
    },

    cropSuggestion: function (req, res) {
        var search = req.param('search');

        var searchQry = {}

        searchQry.name = { $regex: search/*, "$options" : "i"*/ }

        Category.find(searchQry).exec(function (err, resp) {
            return res.status(200).jsonx({
                success: true,
                data: { 'resp': resp, 'err': err }
            });
        })

    },
    othersellers: function (req, res) {

        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var sortBy = req.param('sortBy');
        var category = req.param('categoryID');
        var variety = req.param('variety');
        var cropId = req.param('cropId');
        count = parseInt(count);
        //,"_id" : {$nin : ["5a0141e7cd3b44a3770ab8ef"]}

        var query = {};
        var sortquery = {};

        query.isDeleted = false;
        query.isExpired = false;
        query.isApproved = true;
        query.id = { "$nin": [cropId] };
        query.categoryId = category;
        query.variety = variety;

        //

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];


            //sortquery[field?field:field] = sortType?(sortType=='desc'?1:-1):-1;

        }
        sortquery[field ? field : "createdAt"] = sortType ? (sortType == 'desc' ? 1 : -1) : -1;


        Crops.native(function (err, croplist) {
            croplist.aggregate([
                /*{"$ne" : {"$_id":cropId}},*/

                {
                    $lookup: {
                        from: "category",
                        localField: "category",
                        foreignField: "_id",
                        as: "category"
                    }
                },

                {
                    $unwind: '$category'
                },

                {
                    $lookup: {
                        from: 'users',
                        localField: 'seller',
                        foreignField: '_id',
                        as: 'sellers'
                    }
                },

                {
                    $unwind: '$sellers'
                },

                {
                    $match: query
                },
                {
                    $sort: sortquery
                },
                {
                    $skip: skipNo
                },
                {
                    $limit: count
                },
                {
                    $project: {
                        id: "$_id",
                        viewed: "$viewed",
                        verified: "$verified",
                        variety: "$variety",
                        upfrontPercent: "$upfrontPercent",
                        taxRate: "$taxRate",
                        state: "$state",
                        userFullname: "$sellers.fullName",
                        userFirstname: "$sellers.firsname",
                        userId: "$sellers._id",
                        userEmail: "$sellers.username",
                        userState: "$sellers.state",
                        userCity: "$sellers.city",
                        userDistricts: "$sellers.district",
                        userRating: "$sellers.avgRating",
                        userPincode: "$sellers.pincode",
                        quantityUnit: "$quantityUnit",
                        quantity: "$quantity",
                        price: "$price",
                        grade: "$grade",
                        name: "$name",
                        category: "$category.name",
                        categoryId: "$category._id",
                        City: "$city",
                        State: "$state",
                        District: "$district",
                        Address: "$address",
                        bidEndDate: "$bidEndDate",
                        images: "$images",
                        coverImage: "$coverImage",
                        isDeleted: "$isDeleted",
                        isApproved: "$isApproved",
                        createdAt: "$createdAt",
                        soldOut: "$soldOut"
                    }
                },
                {
                    $group: {
                        _id: "$userId",
                        crop: { $push: "$$ROOT" }
                    }
                },
                {
                    $project: {
                        crops: "$crop"
                    }
                }

            ], function (err, totalresults) {

                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: totalresults
                    });
                }
            });
        })
    },

    farmersSoldCrops: function (req, res) {

        var query = {};

        query.isApproved = true;
        query.isDeleted = false;
        query.isExpired = true;
        query.seller = req.param('seller');

        Crops.count(query).then(function (croptotal) {
            if (croptotal) {
                return res.jsonx({
                    success: true,
                    data: croptotal
                });
            } else {
                return res.jsonx({
                    success: true,
                    data: 0
                });
            }
        }).fail(function (error) {
            return res.jsonx({
                success: false,
                data: 0
            });
        })
    },

    franchiseeCrops: function (req, res) {
        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";
        var isExpired = req.param('expire');

        if (req.param('sortBy')) {
            sortBy = req.param('sortBy')
        }

        var typeArr = new Array();
        typeArr = sortBy.split(" ");
        var sortType = typeArr[1];
        var field = typeArr[0];
        var sortquery = {};
        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        var query = {};
        query.isDeleted = false

        if (isExpired == "yes") {
            query.isExpired = true;
        } else if (isExpired == "no") {
            query.isExpired = false;
        }

        // if (req.param('pincode')) {
        //     var pincodes = JSON.parse(req.param('pincode'));
        //     if (pincodes.length > 0) {
        //         query.pincode = { "$in": pincodes }
        //     }
        // }
        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        query.GM = ObjectId(req.identity.id)

        if (search) {
            query.$or = [
                { code: parseInt(search) },
                { name: { $regex: search, '$options': 'i' } },
                { category: { $regex: search, '$options': 'i' } },
                { askingPrice: parseFloat(search) },
                { quantity: parseFloat(search) },
                { seller: { $regex: search, '$options': 'i' } },
                { city: { $regex: search, '$options': 'i' } }
            ]
        }

        Crops.native(function (error, cropslist) {
            cropslist.aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'seller',
                        foreignField: '_id',
                        as: "sellers"
                    }
                },
                {
                    $unwind: '$sellers'
                },
                {
                    $lookup: {
                        from: 'category',
                        localField: 'category',
                        foreignField: '_id',
                        as: "categorys"
                    }
                },
                {
                    $unwind: '$categorys'
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
                    $unwind: {
                        path: '$market',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        id: "$_id",
                        seller: "$sellers.fullName",
                        sellerId: "$sellers._id",
                        category: "$categorys.name",
                        categoryId: "$categorys._id",
                        pincode: "$pincode",
                        cropCode: "$code",
                        packaging: "$packaging",
                        cropName: "$name",
                        city: "$city",
                        askingPrice: "$price",
                        quantity: "$quantity",
                        quantityUnit: "$quantityUnit",
                        leftAfterAcceptanceQuantity: "$leftAfterAcceptanceQuantity",
                        createdAt: "$createdAt",
                        approvedAt: "$approvedOn",
                        bidsEndIn: "$bidEndDate",
                        isExpired: "$isExpired",
                        isDeleted: "$isDeleted",
                        numberOfBids: "$totalBids",
                        GM: "$market.GM"
                    }
                },
                {
                    $match: query
                }
            ], function (err, totalresults) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    cropslist.aggregate([
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'seller',
                                foreignField: '_id',
                                as: "sellers"
                            }
                        },
                        {
                            $unwind: '$sellers'
                        },
                        {
                            $lookup: {
                                from: 'category',
                                localField: 'category',
                                foreignField: '_id',
                                as: "categorys"
                            }
                        },
                        {
                            $unwind: '$categorys'
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
                            $unwind: {
                                path: '$market',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $project: {
                                id: "$_id",
                                seller: "$sellers.fullName",
                                sellerId: "$sellers._id",
                                category: "$categorys.name",
                                categoryId: "$categorys._id",
                                pincode: "$pincode",
                                cropCode: "$code",
                                cropName: "$name",
                                packaging: "$packaging",
                                city: "$city",
                                askingPrice: "$price",
                                quantity: "$quantity",
                                quantityUnit: "$quantityUnit",
                                leftAfterAcceptanceQuantity: "$leftAfterAcceptanceQuantity",
                                createdAt: "$createdAt",
                                approvedAt: "$approvedOn",
                                bidsEndIn: "$bidEndDate",
                                isExpired: "$isExpired",
                                isDeleted: "$isDeleted",
                                numberOfBids: "$totalBids",
                                createdAt: "$createdAt",
                                GM: "$market.GM",
                                aggregatedCrops: "$aggregatedCrops",
                                totalBids: "$totalBids",
                                isApproved: "$isApproved"
                            }
                        },
                        {
                            $match: query
                        },
                        {
                            $sort: sortquery
                        },
                        {
                            $skip: skipNo
                        },
                        {
                            $limit: count
                        }
                    ], function (error, results) {
                        if (error) {
                            return res.status(400).jsonx({
                                success: false,
                                error: err
                            });
                        } else {
                            return res.jsonx({
                                success: true,
                                data: {
                                    crops: results,
                                    total: totalresults.length
                                }
                            });
                            /*async.each(results, function(crop, callback) {
                                let cropId = crop.id
                                let bidQuery = {};
                                bidQuery.crop = cropId.toString()
                        
                                Bids.count(bidQuery).then(function(totalBids) {
                                    crop.numberOfBids = totalBids
                                    callback();
                                }).fail(function(error) {
                                    callback(error);
                                });
                            }, function(asyncError){
                                if(asyncError){
                                    return res.status(400).jsonx({ 
                                        success: false,
                                        error: error,
                                    });
                                } else {
                                    return res.jsonx({
                                        success: true,
                                        data: {
                                            crops: results,
                                            total: totalresults.length
                                        }
                                    });
                                }
                            });*/
                        }
                    });
                }
            });
        });
    },

    approvedDashboard: function (req, res) {
        var qry = {};
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = { "$in": pincode }
            }
        }

        if (req.param('userId') && req.param('userId') != undefined && req.param('userId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('userId'))

            qry.seller = userId
        }

        qry.$and = [{ createdAt: { $gte: new Date(req.param('from')) } }, { createdAt: { $lte: new Date(req.param('to')) } }]
        qry.isDeleted = false
        qry.isExpired = false

        Crops.native(function (err, allcrops) {
            allcrops.aggregate([
                {
                    $match: qry
                },
                {
                    $project: {
                        approvestatus: {
                            $cond: [{ $eq: ["$verified", "Yes"] }, "Verified", {
                                $cond: [{ $eq: ["$isApproved", true] }, "Approved", "Not Approved"]
                            }]
                        }
                    }
                },
                {
                    $group: {
                        _id: "$approvestatus",
                        count: { $sum: 1 }
                    }
                }
            ], function (err, crops) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: crops
                    });
                }
            });
        })
    },

    statusDashboard: function (req, res) {
        var qry = {};
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = { "$in": pincode }
            }
        }

        if (req.param('userId') && req.param('userId') != undefined && req.param('userId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('userId'))

            qry.seller = userId
        }

        qry.$and = [{ createdAt: { $gte: new Date(req.param('from')) } }, { createdAt: { $lte: new Date(req.param('to')) } }]
        qry.isDeleted = false

        Crops.native(function (err, allcrops) {
            allcrops.aggregate([
                {
                    $match: qry
                },
                {
                    $project: {
                        currentstatus: {
                            $cond: [{ $eq: ["$leftAfterAcceptanceQuantity", 0] }, "SoldOut", {
                                $cond: [{ $eq: ["$isExpired", false] }, "Active", {
                                    $cond: [{ $eq: ["$leftAfterAcceptanceQuantity", 0] }, "SoldOut", "Expired"]
                                }]
                            }]
                        },
                    }
                },
                {
                    $group: {
                        _id: "$currentstatus",
                        count: { $sum: 1 }
                    }
                }
            ], function (err, crops) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: crops
                    });
                }
            });
        })
    },

    categoryDashboard: function (req, res) {
        var qry = {};
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = { "$in": pincode }
            }
        }

        if (req.param('userId') && req.param('userId') != undefined && req.param('userId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('userId'))

            qry.seller = userId
        }

        qry.$and = [{ createdAt: { $gte: new Date(req.param('from')) } }, { createdAt: { $lte: new Date(req.param('to')) } }]
        qry.isDeleted = false;
        qry.isExpired = false;

        Crops.native(function (err, allcrops) {
            allcrops.aggregate([
                {
                    $match: qry
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
                        /*currentstatus: {
                            $cond:[{$eq: ["$leftAfterAcceptanceQuantity", 0]}, "SoldOut", {
                                $cond:[{$eq: ["$isExpired", false]}, "Active", {
                                    $cond:[{$eq: ["$leftAfterAcceptanceQuantity", 0]}, "SoldOut", "Expired"]
                                }]
                            }]
                        },*/
                        category: "$category.name",
                        parentCategory: "$parentCategory.name"
                    }
                },
                {
                    $group: {
                        _id: {
                            parentCategory: "$parentCategory",
                            category: "$category"
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: "$_id.parentCategory",
                        'total': { $sum: "$count" },
                        'categories': {
                            $push: {
                                category: "$_id.category",
                                count: "$count"
                            }
                        }
                    }
                }
            ], function (err, crops) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: crops
                    });
                }
            });
        })
    },

    verificationDashboard: function (req, res) {
        var qry = {};
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = { "$in": pincode }
            }
        }

        if (req.param('userId') && req.param('userId') != undefined && req.param('userId') != 'undefined') {
            qry.seller = req.param('userId')
        }

        qry.$and = [{ createdAt: { $gte: new Date(req.param('from')) } }, { createdAt: { $lte: new Date(req.param('to')) } }]
        qry.isDeleted = false;
        qry.isExpired = false;

        Crops.find(qry).then(function (crops) {

            var QC = 0;
            var franchisee = 0;
            async.each(crops, function (crop, callback) {
                var qualitycheckQuery = {}
                qualitycheckQuery.cropId = crop.id
                qualitycheckQuery.userType = 'Admin'
                Qualitycheck.count(qualitycheckQuery).then(function (adminQualityCheckCount) {
                    if (adminQualityCheckCount == 0) {
                        qualitycheckQuery.userType = 'Franchisee'
                        Qualitycheck.count(qualitycheckQuery).then(function (franchiseeQualityCheckCount) {
                            if (franchiseeQualityCheckCount > 0) {
                                franchisee = franchisee + 1
                            }
                            callback()
                        }).fail(function (err) {
                            callback()
                        })
                    } else {
                        QC = QC + 1
                        callback()
                    }
                }).fail(function (err) {
                    callback()
                })
            }, function (error) {
                if (error) {
                    return res.status(400).jsonx({
                        success: false,
                        error: error
                    });
                } else {
                    var result = { 'Verification 1': (crops.length - (QC + franchisee)), 'Verification 2': franchisee, 'Verification 3': QC }
                    return res.status(200).jsonx({
                        success: true,
                        data: result
                    });
                }
            });
        }).fail(function (error) {
            return res.status(400).jsonx({
                success: false,
                error: error
            });
        })
    },

    cropModernationOrders: function (req, res) {
        // console.log('crop controller')
        var search = req.param('search');
        var sortBy = req.param('sortBy');
        var roles = req.param('roles');
        var superRoles = req.param('superRole');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var status = req.param('status');
        var state = req.param('state');
        var modernationStatus = req.param('modernationStatus');
        var skipNo = (page - 1) * count;
        var query = {};

        if (modernationStatus) {
            query.status = 'active';
            query.isModerntrader = true;
            query.roles = 'U';
        }
        if (search) {
            query.$or = [
                {
                    firstName: {
                        '$regex': search
                    }
                },
                {
                    lastName: {
                        '$regex': search
                    }
                },
                {
                    fullName: {
                        '$regex': search
                    }
                },
                {
                    email: {
                        '$regex': search
                    }
                },
                {
                    username: {
                        '$regex': search
                    }
                },
                {
                    address: {
                        '$regex': search
                    }
                },
                {
                    city: {
                        '$regex': search
                    }
                },
                {
                    district: {
                        '$regex': search
                    }
                },
                {
                    state: {
                        '$regex': search
                    }
                },
                {
                    mobile: parseInt(search)
                },
                {
                    pincode: parseInt(search)
                }

            ]
        }
        //  console.log("====", JSON.stringify(query))
        Users.native(function (err, userslist) {
            userslist.aggregate([
                {
                    "$lookup": {
                        from: "orders",
                        localField: "_id",
                        foreignField: "buyer",
                        as: "order"
                    }

                },

                // {
                //     "$lookup": {
                //         from: "moderntraderpreorder",
                //         localField: "_id",
                //         foreignField: "userid",
                //         as: "moderntraderpreorder"
                //     }

                // },
                { $match: query },
                // {
                //     $sort: sortquery
                // },
                {
                    $skip: skipNo
                },
                {
                    $limit: count
                }
            ], function (err, Usersdata) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    Users.count(query).then(function (total) {

                        for (let i = 0; i < Usersdata.length; i++) {
                            if (Usersdata[i].order.length > 0) {
                                let pre = 0;
                                let nooffullfill = 0;
                                for (let j = 0; j < Usersdata[i].order.length; j++) {
                                    if (Usersdata[i].order[j].placedStatus == false) {
                                        pre = pre + 1;
                                        Usersdata[i].preorder = pre;
                                    } else {
                                        nooffullfill = nooffullfill + 1;
                                        Usersdata[i].fullfillorder = nooffullfill;

                                    }
                                }
                            } else {
                                Usersdata[i].order = 0
                                Usersdata[i].fullfillorder = 0;
                            }

                        }                        // console.log(Usersdata1)
                        return res.status(200).jsonx({
                            success: true,
                            data: {
                                users: Usersdata,
                                total: total,

                            },
                        });


                    })

                }
            }
            );
        })

    },
    croporder: function (req, res) {
        var search = req.param('search');
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var sortBy = req.param('sortBy');
        count = parseInt(count);
        var sortquery = {};
        // var modernationStatus = req.param('modernationStatus');
        var qry = {};
        qry.buyer = req.param('id');
        qry.isModerntrader = true;
        qry.placedStatus = false;
        count = parseInt(count);
        var sortquery = {};

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }
        sortquery[field ? field : "createdAt"] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        console.log(qry, '=====')
        Orders.find(qry)
            // .populate("crop")
            //.populate("seller")
            .populate("buyer")
            .sort(sortquery)
            .then(function (subOrders) {
                Orders.count(qry).then(function (total) {
                    return res.jsonx({
                        success: true,
                        code: 200,
                        data: subOrders,
                        total: total

                    });
                })



            }).fail(function (err) {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: constantObj.messages.UNKNOW_ERROR_OCCURRED,
                        key: "UNKNOW_ERROR_OCCURRED"

                    },
                });
            });
    },
    croporderitemnotfound: function (req, res) {
        var qry = {};
        qry.order = req.param('id');
        qry.userid = req.param('userid');
        qry.isAvailbe = false
        // console.log(qry, '====????')
        Moderntraderpreorder.find(qry).exec(function (err, data1) {
            if (err) {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: "something wrong"

                    },
                });
            } else {
                return res.jsonx({
                    success: true,
                    code: 200,
                    data: data1
                });
            }

        })
    },
    croporderitem: function (req, res) {
        var search = req.param('search');
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var sortBy = req.param('sortBy');
        count = parseInt(count);
        var sortquery = {};

        var qry = {};
        qry.order = req.param('id');
        qry.user = req.param('userid');
        count = parseInt(count);
        var sortquery = {};

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }
        sortquery[field ? field : "createdAt"] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        console.log(qry, '=====')
        Orderedcarts.find(qry)
            .populate("order")
            .populate("crop")

            //.populate("seller")
            //.populate("user")
            .skip(skipNo).limit(count).sort(sortquery)
            .then(function (subOrders) {


                return res.jsonx({
                    success: true,
                    code: 200,
                    data: subOrders
                });


            }).fail(function (err) {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: constantObj.messages.UNKNOW_ERROR_OCCURRED,
                        key: "UNKNOW_ERROR_OCCURRED"

                    },
                });
            });
    },

    relatedItems: function (req, res) {
        let category = req.param('cat');
        let variety = req.param('variety');
        let qty = parseInt(req.param('qty'))
        if (category && variety) {
            let query = {}
            query.isDeleted = false;
            query.isExpired = false;
            query.isApproved = true;
            query.category = category;
            query.variety = variety;
            query.quantity = { $gte: qty }
            // console.log(query, '====')
            Crops.find(query).exec(function (err, crop) {
                if (err) {
                    return res.jsonx({
                        success: false,
                        error: err,
                    });
                } else {
                    return res.jsonx({
                        success: true,
                        code: 200,
                        data: crop
                    });
                }
            })
        }
    },

    relatedItemsnotfound: function (req, res) {

        let query = {};
        query.name = { $regex: new RegExp(req.param('cat'), 'i') }
        query.variety = { $regex: new RegExp(req.param('variety'), 'i') }
        Category.findOne(query).then(function (categoryData) {

            // console.log(categoryData, 'categoryData------------')
            if (categoryData) {

                let qry = {};
                qry.category = categoryData.id;
                let arr = categoryData.variety;
                let searchCat = item.variety;
                let searchVariety = arr.filter(function (pattern) {
                    return new RegExp(pattern).test(searchCat);
                })
                //console.log(matches);
                qry.variety = searchVariety;

                qry.leftAfterAcceptanceQuantity = { $gte: req.param('qty') }
                // qry.price = { $gte: req.param('price') }
                qry.isExpired = false;
                qry.isDeleted = false;
                qry.isApproved = true,
                    console.log(qry, ' query===========')
                Crops.find(qry).sort({ price: 1 }).populate("seller").then(function (cropData) {

                    // console.log(cropData, 'cropData------------')
                    if (cropData.length > 0) {
                        return res.jsonx({
                            success: true,
                            code: 200,
                            data: cropData
                        });

                    } else {
                        return res.jsonx({
                            success: false,
                            error: "Not Found",
                        });
                    }

                })
                //callback();
            } else {
                return res.jsonx({
                    success: false,
                    error: "Not Found",
                });
            }
        })
    },

    updateOrderItem: function (req, res) {
        let id = req.param('id');
        let data = req.body;
        Orderedcarts.findOne({ id: id }).then(function (orderCrop) {
            Crops.findOne({ id: data.crop }).then(function (cropData) {
                let postData = {}
                postData.amount = cropData.price;
                postData.crop = data.crop;
                postData.productId = data.productId;
                postData.quantity = data.quantity;
                postData.seller = cropData.seller;

                postData.taxPercent = cropData.taxRate
                postData.facilitationPercent = cropData.efarmxComission
                postData.facilitationCharges = ((cropData.price * data.quantity * cropData.efarmxComission) / 100);
                postData.taxAmount = ((postData.facilitationCharges * cropData.taxRate) / 100);
                postData.insurancePercent = cropData.insurancePercent;
                postData.insuranceCharges = 0//(((data.price * data.quantity) / 100) * data.insurancePercent) / 100;
                // postData.facilitationCharges = ((cropData.price * cropData.quantity * cropData.facilitationPercent) / 100);
                // postData.taxAmount = (((cropData.price * cropData.quantity * cropData.taxPercent) / 100) * cropData.taxPercent) / 100;
                postData.totalAmount = (postData.amount * postData.quantity) + postData.facilitationCharges + postData.taxAmount + postData.insuranceCharges + orderCrop.logisticPayment
                postData.market = cropData.market;
                postData.pincode = cropData.pincode;
                postData.logisticsOption = 'efarmx'
                postData.status = 'Processing'

                //console.log(cropData, 'data====', postData)
                Orderedcarts.update({ id: id }, postData).exec(function (err, updateorder) {
                    if (err) {
                        return res.jsonx({
                            success: false,
                            error: err,
                        });
                    }
                    let suborder = updateorder[0];

                    // Sellerpayment.destroy({
                    //     crop: orderCrop.crop, order: orderCrop.order,
                    //     suborder: orderCrop.id,
                    // }).then(function (responseSellerPayment) {
                    //     Bidspayment.destroy({
                    //         crop: orderCrop.crop, order: orderCrop.order,
                    //         suborder: orderCrop.id,
                    //     }).then(function (responseBidsPayment) {
                    //         createSellerPaymentForMT(data.crop, suborder).then(function () {
                    //         })
                    //         createMTPayment(data.crop, suborder).then(function () {
                    //         })
                    //     })
                    // })

                    return res.jsonx({
                        success: true,
                        code: 200,
                        data: suborder
                    });
                })
            })


        })


    },

    saveOrderItem: function (req, res) {
        var distance = require('google-distance-matrix');

        let data = req.body;
        let modernId = data.modernId
        delete data.modernId;
        Users.findOne({ id: data.user }).then(function (user) {

            Crops.findOne({ id: data.crop }).then(function (cropData) {
                // console.log(data, 'ddd===')
                let postData = {};
                postData.productId = cropData.id;
                postData.productType = 'CROP';
                postData.amount = cropData.price;
                postData.quantity = data.quantity;
                postData.quantityUnit = cropData.quantityUnit;
                postData.crop = cropData.id;
                postData.user = data.user;
                postData.seller = cropData.seller;

                postData.order = data.order;
                postData.taxPercent = cropData.taxRate
                postData.facilitationPercent = cropData.efarmxComission
                postData.facilitationCharges = ((cropData.price * data.quantity * cropData.efarmxComission) / 100);
                postData.taxAmount = ((postData.facilitationCharges * cropData.taxRate) / 100);
                postData.insurancePercent = cropData.insurancePercent;
                postData.insuranceCharges = 0
                postData.market = cropData.market;
                postData.pincode = cropData.pincode;
                postData.logisticsOption = 'efarmx'
                postData.status = 'Processing'

                // console.log(postData, '=======postdata');
                let suborderCode = commonServiceObj.getOrderCode("ORD");
                postData.code = suborderCode;

                // let req = {}
                // req.body = {
                //     destinationPincode: user.pincode, cropId: cropData.id, quantity: data.quantity, origin: cropData.pincode,// destination: user.pincode 
                // }
                // console.log(req, 'req')
                let origin = cropData.pincode;
                let destination = user.pincode;

                let origins = [origin];
                let destinations = [destination];

                let googleApiKey = constantObj.googlePlaces.key;


                distance.key(googleApiKey);
                distance.units('metric');

                let dist = '';
                let errorMessage = "Input address not valid";
                let errorFlag = false;
                console.log(origins, destinations, 'origon === destination')
                distance.matrix(origins, destinations, function (err, distances) {

                    if (!distances) {
                        // return 
                        errorFlag = true;
                        return res.json({
                            success: 'false',
                            message: errorMessage
                        });
                    }

                    if (distances == 'undefined') {
                        errorFlag = true;
                        return res.json({
                            success: 'false',
                            message: errorMessage
                        });
                    }

                    if (distances.status == 'OK') {
                        //console.log(distances, '++++')
                        for (var i = 0; i < origins.length; i++) {
                            for (var j = 0; j < destinations.length; j++) {
                                var origin = distances.origin_addresses[i];
                                var destination = distances.destination_addresses[j];
                                if (distances.rows[0].elements[j].status == 'OK') {
                                    // dist = distances.rows[i].elements[j].distance.text;
                                    dist = distances.rows[i].elements[j];
                                    errorFlag = false;
                                    break;
                                } else {
                                    errorFlag = true;
                                }
                            }
                        }

                        if (!errorFlag) {
                            let distancesss = (dist.distance.value / 1000);

                            Settings.find({}).then(function (settings) {
                                if (settings.length > 0) {
                                    let setting = settings[0]
                                    var logisticPricePerKM = setting.crop.logisticCharges
                                    if (!logisticPricePerKM) {
                                        logisticPricePerKM = 15.5
                                    }

                                    let itemRate = (distancesss * logisticPricePerKM);
                                    dist['rate'] = itemRate;
                                    // console.log(dist, 'dist++++')
                                    postData.logisticPayment = dist['rate'];


                                    postData.totalAmount = (postData.amount * postData.quantity) + postData.facilitationCharges + postData.taxAmount + postData.insuranceCharges + postData.logisticPayment;
                                    Moderntraderpreorder.update({ id: modernId }, { isAvailbe: true }).then(function (modern) {
                                        postData.emailData = modern[0];
                                        // console.log(postData, 'postData=====')
                                        Orderedcarts.create(postData).exec(function (err, updateorder) {
                                            // Sellerpayment.destroy({
                                            //     crop: cropData.id, order: updateorder.order,
                                            //     suborder: updateorder.id,
                                            // }).then(function (responseSellerPayment) {
                                            //     Bidspayment.destroy({
                                            //         crop: cropData.id, order: updateorder.order,
                                            //         suborder: updateorder.id,
                                            //     }).then(function (responseBidsPayment) {
                                            //         createSellerPaymentForMT(cropData.id, updateorder).then(function () {
                                            //         })
                                            //         createMTPayment(cropData.id, updateorder).then(function () {
                                            //         })
                                            //     })
                                            // })
                                            return res.json({
                                                success: 'true',
                                                data: dist
                                            });
                                        })
                                    })

                                } else {
                                    return res.json({
                                        success: 'false',
                                        message: "Unknown Error Occurred"
                                    });
                                }
                            }).fail(function (err) {
                                return res.json({
                                    success: 'false',
                                    message: err
                                });
                            })
                        } else {
                            return res.json({
                                success: 'false',
                                message: errorMessage
                            });
                        }
                    } else {

                        return res.json({
                            success: 'false',
                            message: errorMessage
                        });
                    }
                })
                /* cropsroutepricecalculate(req).then(function (lg) {
                     console.log(lg, 'lgdata')
                     postData.logisticPayment = lg.data.rate;
 
 
                     postData.totalAmount = postData.amount + postData.facilitationCharges + postData.taxAmount + postData.insuranceCharges + postData1.logisticPayment;
                     postData.emailData = modern[0];
                     console.log(postData, "postData1====")
 
                     Orderedcarts.create(postData).exec(function (err, updateorder) {
                         createSellerPaymentForMT(cropData.id, updateorder).then(function () {
                         })
                         createMTPayment(cropData.id, updateorder).then(function () {
                         })
                         // console.log(updateorder)
                         if (err) {
                             return res.jsonx({
                                 success: false,
                                 error: err,
                             });
                         } else {
                             Moderntraderpreorder.update({ id: modernId }, { isAvailbe: true }).then(function (modern) {
 
 
                             })
 
                         }
                     })
 
 
 
                 })*/


            })


        })


    },
    modernTraderPlacedStatus: function (req, res) {
        let id = req.param("id");
        if (id) {
            let cropId = [];
            let updateQty = [];
            let totalAmount = 0;
            let totalFacilitationPercent = 0;
            let totalFacilitationCharges = 0;
            let totalTaxPercent = 0;
            let totalTaxAmount = 0;
            let deliveryCharges = 0
            let itemTotal = 0;
            let shippingAddress = {}
            let address = '';
            let pincode = 0;
            Orders.update({ id: id }, { placedStatus: true, status: 'Processing' }).then(function (orders) {
                let order = orders[0];
                Users.findOne({ id: order.buyer }).then(function (user) {
                    // console.log(id, 'id====', order)
                    user.order = id;
                    user.ordercode = order.code;
                    let cropData = [];
                    let users = []
                    shippingAddress = user.shippingAddress[0];
                    address = user.address;
                    pincode = user.pincode;
                    Sellerpayment.destroy({ order: id }).then(function () {
                        Bidspayment.destroy({ order: id }).then(function () {


                            Orderedcarts.find({ user: user.id, order: id }).then(function (cropInfo) {
                                for (let i = 0; i < cropInfo.length; i++) {
                                    cropId.push(cropInfo[i].productId);
                                    users.push({ order: order.id, cropid: cropInfo[i].productId, name: user.fullName, email: user.email, qty: cropInfo[i].quantity, id: user.id, ordercode: order.code })
                                    // console.log(i, 'i==================')
                                    totalAmount = cropInfo[i].amount + totalAmount;
                                    totalFacilitationPercent = cropInfo[i].facilitationPercent + totalFacilitationPercent
                                    totalFacilitationCharges = cropInfo[i].facilitationCharges + totalFacilitationCharges
                                    totalTaxPercent = cropInfo[i].taxPercent + totalTaxPercent
                                    totalTaxAmount = cropInfo[i].taxAmount + totalTaxAmount;
                                    deliveryCharges = cropInfo[i].logisticPayment + deliveryCharges;
                                    itemTotal = itemTotal + 1


                                    Sellerpayment.destroy({
                                        crop: cropInfo[i].productId, order: cropInfo[i].order,
                                        suborder: cropInfo[i].id
                                    }).then(function (responseSellerPayment) {
                                        Bidspayment.destroy({
                                            crop: cropInfo[i].productId, order: cropInfo[i].order,
                                            suborder: cropInfo[i].id
                                        }).then(function (responseBidsPayment) {
                                            createSellerPaymentForMT(cropInfo[i].productId, cropInfo[i]).then(function () {
                                            })
                                            createMTPayment(cropInfo[i].productId, cropInfo[i]).then(function () {
                                            })
                                        })
                                    })

                                }

                                Crops.find({ id: { $in: cropId } }).then(function (cropData) {
                                    let arr = _.groupBy(users, 'order')
                                    // console.log(arr, '===ss')
                                    let orderIds = [];
                                    let cropInfo = []
                                    let userInfo = {};
                                    _.each(arr, function (data, idx) {
                                        for (let i = 0; i < data.length; i++) {
                                            for (let j = 0; j < cropData.length; j++) {
                                                if (cropData[j].id == data[i].cropid) {
                                                    cropInfo.push({ id: cropData[j].id, name: cropData[j].name, variety: cropData[j].variety, price: cropData[j].price, quantity: data[i].qty })
                                                    userInfo.firstName = data[i].name;
                                                    userInfo.username = data[i].email;
                                                    userInfo.order = data[i].order;
                                                    userInfo.ordercode = data[i].ordercode;

                                                    let crop = cropData[j]

                                                    var cropFindQry = {}
                                                    cropFindQry.id = cropData[j].id
                                                    if (crop.aggregatedCrops && crop.aggregatedCrops.length > 0) {
                                                        let query = { id: { $in: crop.aggregatedCrops } }

                                                        let selectedFields = ['leftAfterAcceptanceQuantity']

                                                        let partSold = data[i].qty / crop.leftAfterAcceptanceQuantity

                                                        Crops.find(query, { fields: selectedFields }).then(function (allcrops) {
                                                            let subcropCount = 0
                                                            let leftAfterAcceptanceQuantitiesParts = {}

                                                            _.each(allcrops, function (subcrop, index) {


                                                                let quantityOfSubcropSold = crop.leftAfterAcceptanceQuantitiesParts[subcrop.id] * partSold


                                                                var updateSubCrop = {};
                                                                let laaq = Math.max(0, subcrop.leftAfterAcceptanceQuantity - quantityOfSubcropSold)
                                                                updateSubCrop.leftAfterAcceptanceQuantity = parseFloat((laaq).toFixed(3))//Math.max(0, subcrop.leftAfterAcceptanceQuantity - quantityOfSubcropSold)
                                                                leftAfterAcceptanceQuantitiesParts[subcrop.id] = parseFloat((crop.leftAfterAcceptanceQuantitiesParts[subcrop.id] - quantityOfSubcropSold).toFixed(3))//updateSubCrop.leftAfterAcceptanceQuantity


                                                                Crops.update({ id: subcrop.id }, updateSubCrop).then(function (subcropUpdate) {
                                                                    if (subcropUpdate) {
                                                                        if (subcropUpdate[0].aggregations && subcropUpdate[0].aggregations.length > 1) {
                                                                            let otherAggs = subcropUpdate[0].aggregations
                                                                            const indexOfCurrentAggcrop = otherAggs.indexOf(crop.id);
                                                                            if (indexOfCurrentAggcrop > -1) {
                                                                                otherAggs.splice(indexOfCurrentAggcrop, 1);
                                                                            }
                                                                            let findAggregationsQuery = { id: { $in: otherAggs } }

                                                                            let selectedFieldsAggregations = ['leftAfterAcceptanceQuantity', 'leftAfterDeliveryQuantity', 'quantity', 'price', 'grade', 'quantitiesPart', 'leftAfterAcceptanceQuantitiesParts']

                                                                            Crops.find(findAggregationsQuery, { fields: selectedFieldsAggregations }).then(function (allotheraggregatedcrops) {
                                                                                let supercropCount = 0
                                                                                _.each(allotheraggregatedcrops, function (supercrop, idx) {
                                                                                    if (supercrop.leftAfterAcceptanceQuantitiesParts[subcropUpdate[0].id]) {
                                                                                        let lastQuantity = supercrop.leftAfterAcceptanceQuantitiesParts[subcropUpdate[0].id]
                                                                                        let quantityPartOfCrop = Math.min(Math.max(0, subcropUpdate[0].leftAfterAcceptanceQuantity), Math.max(0, supercrop.leftAfterAcceptanceQuantitiesParts[subcropUpdate[0].id]))

                                                                                        let quantityDifference = parseFloat((lastQuantity - quantityPartOfCrop).toFixed(3))

                                                                                        let newLeftAfterAcceptanceQuantitiesParts = supercrop.leftAfterAcceptanceQuantitiesParts
                                                                                        newLeftAfterAcceptanceQuantitiesParts[subcropUpdate[0].id] = parseFloat((quantityPartOfCrop).toFixed(3))

                                                                                        var updateSuperCrop = {};
                                                                                        updateSuperCrop.leftAfterAcceptanceQuantitiesParts = newLeftAfterAcceptanceQuantitiesParts
                                                                                        updateSuperCrop.leftAfterAcceptanceQuantity = parseFloat((supercrop.leftAfterAcceptanceQuantity - quantityDifference).toFixed(3))
                                                                                        updateSuperCrop.leftAfterDeliveryQuantity = parseFloat((supercrop.leftAfterDeliveryQuantity - quantityDifference).toFixed(3))


                                                                                        Crops.update({ id: supercrop.id }, updateSuperCrop).then(function (supercropUpdate) {
                                                                                            if (supercropUpdate) {
                                                                                                if (supercropCount == allotheraggregatedcrops.length - 1) {
                                                                                                    if (subcropCount == allcrops.length) {
                                                                                                        var cropUpdateQry = {}
                                                                                                        cropUpdateQry.leftAfterAcceptanceQuantity = parseFloat((crop.leftAfterAcceptanceQuantity - data[i].qty).toFixed(3))
                                                                                                        cropUpdateQry.leftAfterAcceptanceQuantitiesParts = leftAfterAcceptanceQuantitiesParts

                                                                                                        Crops.update(cropFindQry, cropUpdateQry).then(function (crop) {

                                                                                                        })
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                            supercropCount++;
                                                                                        })
                                                                                    } else {
                                                                                        if (subcropCount == allcrops.length - 1) {
                                                                                            var cropUpdateQry = {}
                                                                                            cropUpdateQry.leftAfterAcceptanceQuantity = parseFloat((crop.leftAfterAcceptanceQuantity - data[i].qty).toFixed(3))
                                                                                            cropUpdateQry.leftAfterAcceptanceQuantitiesParts = leftAfterAcceptanceQuantitiesParts
                                                                                            Crops.update(cropFindQry, cropUpdateQry).then(function (crop) {

                                                                                            })
                                                                                        }
                                                                                    }
                                                                                })
                                                                            })
                                                                        } else {
                                                                            if (subcropCount == allcrops.length - 1) {
                                                                                var cropUpdateQry = {}
                                                                                cropUpdateQry.leftAfterAcceptanceQuantity = parseFloat((crop.leftAfterAcceptanceQuantity - data[i].qty).toFixed(3))
                                                                                cropUpdateQry.leftAfterAcceptanceQuantitiesParts = leftAfterAcceptanceQuantitiesParts

                                                                                Crops.update(cropFindQry, cropUpdateQry).then(function (crop) {

                                                                                })
                                                                            }
                                                                        }
                                                                    }
                                                                    subcropCount++;
                                                                })
                                                            })
                                                        })
                                                    } else if (crop.aggregations && crop.aggregations.length > 0) {
                                                        let findAggregationsQuery = { id: { $in: crop.aggregations } }

                                                        let selectedFieldsAggregations = ['leftAfterAcceptanceQuantity', 'leftAfterDeliveryQuantity', 'quantity', 'price', 'grade', 'quantitiesPart', 'leftAfterAcceptanceQuantitiesParts']

                                                        Crops.find(findAggregationsQuery, { fields: selectedFieldsAggregations }).then(function (allcrops) {
                                                            let subcropCount = 0
                                                            _.each(allcrops, function (supercrop, index) {
                                                                if (supercrop.leftAfterAcceptanceQuantitiesParts[crop.id]) {
                                                                    let lastQuantity = supercrop.leftAfterAcceptanceQuantitiesParts[crop.id]

                                                                    let quantityPartOfCrop = Math.min(Math.max(0, crop.leftAfterAcceptanceQuantity - data[i].qty), Math.max(0, supercrop.leftAfterAcceptanceQuantitiesParts[crop.id]))

                                                                    let quantityDifference = parseFloat((lastQuantity - quantityPartOfCrop).toFixed(3))

                                                                    let newLeftAfterAcceptanceQuantitiesParts = supercrop.leftAfterAcceptanceQuantitiesParts
                                                                    newLeftAfterAcceptanceQuantitiesParts[crop.id] = parseFloat((quantityPartOfCrop).toFixed(3))

                                                                    var updateSuperCrop = {};
                                                                    updateSuperCrop.leftAfterAcceptanceQuantitiesParts = newLeftAfterAcceptanceQuantitiesParts
                                                                    updateSuperCrop.leftAfterAcceptanceQuantity = parseFloat((supercrop.leftAfterAcceptanceQuantity - quantityDifference).toFixed(3))
                                                                    updateSuperCrop.leftAfterDeliveryQuantity = parseFloat((supercrop.leftAfterDeliveryQuantity - quantityDifference).toFixed(3))

                                                                    Crops.update({ id: supercrop.id }, updateSuperCrop).then(function (supercropUpdate) {
                                                                        if (supercropUpdate) {
                                                                            if (subcropCount == allcrops.length - 1) {
                                                                                var cropUpdateQry = {}
                                                                                cropUpdateQry.leftAfterAcceptanceQuantity = parseFloat((crop.leftAfterAcceptanceQuantity - data[i].qty).toFixed(3))
                                                                                Crops.update(cropFindQry, cropUpdateQry).then(function (crop) {

                                                                                })
                                                                            }
                                                                        }
                                                                        subcropCount++;
                                                                    })
                                                                } else {
                                                                    var cropUpdateQry = {}
                                                                    cropUpdateQry.leftAfterAcceptanceQuantity = parseFloat((crop.leftAfterAcceptanceQuantity - data[i].qty).toFixed(3))
                                                                    Crops.update(cropFindQry, cropUpdateQry).then(function (crop) {

                                                                    })
                                                                }
                                                            })
                                                        })
                                                    } else {
                                                        var cropUpdateQry = {}
                                                        cropUpdateQry.leftAfterAcceptanceQuantity = parseFloat((crop.leftAfterAcceptanceQuantity - data[i].qty).toFixed(3))
                                                        console.log(cropUpdateQry, 'updatequery======')
                                                        Crops.update(cropFindQry, cropUpdateQry).then(function (crop) {

                                                        })
                                                    }


                                                }



                                            }

                                            //console.log(cropInfo, '==cropinfounder')
                                        }
                                        //console.log(idx, 'order')

                                        let orderUpdate = {};
                                        orderUpdate.placedStatus = true;
                                        orderUpdate.status = 'Processing';
                                        orderUpdate.paymentStatus = 0;
                                        orderUpdate.totalAmount = totalAmount;
                                        orderUpdate.finalAmount = totalAmount
                                        orderUpdate.totalFacilitationPercent = totalFacilitationPercent
                                        orderUpdate.totalFacilitationCharges = totalFacilitationCharges
                                        orderUpdate.totalInsurancePercent = 0
                                        orderUpdate.totalInsuranceCharges = 0
                                        orderUpdate.totalTaxPercent = totalTaxPercent
                                        orderUpdate.totalTaxAmount = totalTaxAmount
                                        orderUpdate.deliveryCharges = deliveryCharges
                                        orderUpdate.logisticsOption = 'efarmx'
                                        orderUpdate.itemTotal = itemTotal
                                        orderUpdate.taxAmount = totalTaxAmount
                                        orderUpdate.shippingPrice = deliveryCharges
                                        orderUpdate.shippingAddress = shippingAddress
                                        orderUpdate.billingAddress = shippingAddress
                                        orderUpdate.address = address
                                        orderUpdate.pincode = pincode
                                        //console.log(orderUpdate, 'orderUpdate====query')
                                        Orders.update({ id: idx }, orderUpdate).then(function (orderupdata) {



                                            //console.log(orderupdata, 'orderupdate data====')
                                        });
                                        Moderntraderpreorder.find({ order: idx, isAvailbe: 'false' }).then(function (notFound) {
                                            sendEmailWithNotFound(cropInfo, userInfo, notFound)
                                        })
                                    })

                                    return ({
                                        success: true,
                                        code: 200,
                                        data: order,
                                        user: users
                                    });
                                })


                            })
                        })
                    })
                })

            })

            // 
        }
    },
    cropmodernationplacedorder: function (req, res) {
        var search = req.param('search');
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var sortBy = req.param('sortBy');
        count = parseInt(count);
        var sortquery = {};
        // var modernationStatus = req.param('modernationStatus');
        var qry = {};
        qry.buyer = req.param('id');
        qry.isModerntrader = true;
        qry.placedStatus = true;
        count = parseInt(count);
        var sortquery = {};

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }
        sortquery[field ? field : "createdAt"] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        console.log(qry, '=====')
        Orders.find(qry)
            .populate("orderedCarts")
            //.populate("seller")
            .populate("buyer").sort(sortquery)
            .then(function (subOrders) {
                Orders.count(qry).then(function (total) {

                    for (let i = 0; i < subOrders.length; i++) {
                        let status = false;
                        for (let j = 0; j < subOrders[i]["orderedCarts"].length; j++) {
                            if (subOrders[i]["orderedCarts"][j].status == "Delivered") {
                                status = true;
                            } else {
                                status = false;
                            }
                        }
                        if (status) {
                            subOrders[i].status = "Delivered";
                        }
                    }
                    return res.jsonx({
                        success: true,
                        code: 200,
                        data: subOrders,
                        total: total

                    });
                })



            }).fail(function (err) {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: constantObj.messages.UNKNOW_ERROR_OCCURRED,
                        key: "UNKNOW_ERROR_OCCURRED"

                    },
                });
            });
    },
    gerpremoderntraderoder: function (req, res) {

        // console.log('crop controller')
        var search = req.param('search');
        var sortBy = req.param('sortBy');
        var roles = req.param('roles');
        var superRoles = req.param('superRole');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var status = req.param('status');
        var state = req.param('state');
        var modernationStatus = req.param('modernationStatus');
        var skipNo = (page - 1) * count;
        var query = {};

        if (modernationStatus) {
            query.placedStatus = false;
            query.isModerntrader = true;
            // query.roles = 'U';
        }
        if (search) {
            query.$or = [
                {
                    firstName: {
                        '$regex': search
                    }
                },
                {
                    lastName: {
                        '$regex': search
                    }
                },
                {
                    fullName: {
                        '$regex': search
                    }
                },
                {
                    email: {
                        '$regex': search
                    }
                },
                {
                    username: {
                        '$regex': search
                    }
                },
                {
                    address: {
                        '$regex': search
                    }
                },
                {
                    city: {
                        '$regex': search
                    }
                },
                {
                    district: {
                        '$regex': search
                    }
                },
                {
                    state: {
                        '$regex': search
                    }
                },
                {
                    mobile: parseInt(search)
                },
                {
                    pincode: parseInt(search)
                }

            ]
        }
        //  console.log("====", JSON.stringify(query))
        Orders.native(function (err, orders) {
            orders.aggregate([
                {
                    "$lookup": {
                        from: "users",
                        localField: "buyer",
                        foreignField: "_id",
                        as: "users"
                    }

                },
                {
                    "$lookup": {
                        from: "moderntraderpreorder",
                        localField: "_id",
                        foreignField: "order",
                        as: "ordercart"
                    }

                },

                { $match: query },
                // {
                //     $sort: sortquery
                // },
                {
                    $skip: skipNo
                },
                {
                    $limit: count
                }
            ], function (err, Usersdata) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    Users.count({ isModerntrader: true, status: 'active', roles: 'U' }).then(function (total) {

                        // for (let i = 0; i < Usersdata.length; i++) {
                        //     if (Usersdata[i].order.length > 0) {
                        //         let pre = 0;
                        //         let nooffullfill = 0;
                        //         for (let j = 0; j < Usersdata[i].order.length; j++) {
                        //             if (Usersdata[i].order[j].placedStatus == false) {
                        //                 pre = pre + 1;
                        //                 Usersdata[i].preorder = pre;
                        //             } else {
                        //                 nooffullfill = nooffullfill + 1;
                        //                 Usersdata[i].fullfillorder = nooffullfill;

                        //             }
                        //         }
                        //     } else {
                        //         Usersdata[i].order = 0
                        //         Usersdata[i].fullfillorder = 0;
                        //     }

                        // }                        // console.log(Usersdata1)
                        return res.status(200).jsonx({
                            success: true,
                            data: Usersdata,
                            total: total


                        });


                    })

                }
            }
            );
        })

        // var search = req.param('search');
        // var page = req.param('page');
        // var count = parseInt(req.param('count'));
        // var skipNo = (page - 1) * count;
        // var sortBy = req.param('sortBy');

        // var sortquery = {};
        // // var modernationStatus = req.param('modernationStatus');

        // count = parseInt(count);
        // var sortquery = {};

        // if (sortBy) {
        //     var typeArr = new Array();
        //     typeArr = sortBy.split(" ");
        //     var sortType = typeArr[1];
        //     var field = typeArr[0];
        // }
        // sortquery[field ? field : "createdAt"] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;


        // var query = {};


        // query.status = 'active';
        // query.isModerntrader = true;
        // query.roles = 'U';


        // //  console.log("====", JSON.stringify(query))
        // Moderntraderpreorder.native(function (err, moderntraderpreorder) {
        //     moderntraderpreorder.aggregate([

        //         {
        //             "$lookup": {
        //                 from: "users",
        //                 localField: "userid",
        //                 foreignField: "_id",
        //                 as: "users"
        //             }

        //         },
        //         {
        //             "$lookup": {
        //                 from: "orders",
        //                 localField: "order",
        //                 foreignField: "_id",
        //                 as: "orders"
        //             }
        //         },
        //         //{ $match: query }
        //         {
        //             $sort: sortquery
        //         },
        //         {
        //             $skip: skipNo
        //         },
        //         {
        //             $limit: count
        //         }
        //     ], function (err, Users) {
        //         if (err) {
        //             return res.status(400).jsonx({
        //                 success: false,
        //                 error: err
        //             });
        //         } else {
        //             Moderntraderpreorder.count().then(function (total) {
        //                 return res.status(200).jsonx({
        //                     success: true,
        //                     data: Users,
        //                     total: total

        //                 });
        //             })

        //         }
        //     }
        //     );
        // })
    },
    getpreorderitems: function (req, res) {
        let order = req.param('id');
        if (order) {
            Moderntraderpreorder.find({ order: order }).then(function (order) {
                return res.status(200).jsonx({
                    success: true,
                    data: order
                });
            })
        }

    },
    getpreorderitemsuser: function (req, res) {
        let userid = req.param('id');
        if (userid) {
            Moderntraderpreorder.find({ userid: userid }).sort({ createdAt: -1 }).then(function (order) {
                return res.status(200).jsonx({
                    success: true,
                    data: order
                });
            })
        }
    },

    sendEmailAfterTwoHour: function (req, res) {

        var lastHour = new Date();
        lastHour.setHours(lastHour.getHours() - 2);

        Orders.find({ isModerntrader: 'true', placedStatus: 'false', "createdAt": { $gt: lastHour } })
            .populate("orderedCarts")
            .populate("buyer")
            .then(function (order) {

                let FoundCrop = []
                let users = []
                let newArray = [];
                for (let i = 0; i < order.length; i++) {

                    for (let j = 0; j < order[i].orderedCarts.length; j++) {
                        FoundCrop.push(order[i].orderedCarts[j].crop)
                        users.push({ order: order[i].id, cropid: order[i].orderedCarts[j].crop, name: order[i].buyer.fullName, email: order[i].buyer.email })

                        // users[order[i].id].push(order[i].orderedCarts[j].crop);
                    }
                    // if (newArray.length > 0) {
                    //     users.push(newArray)
                    // }

                    // users = _.indexBy(users, 'order');
                    //console.log(FoundCrop, '=====')
                }


                Crops.find({ id: { $in: FoundCrop } }).then(function (cropData) {
                    let arr = _.groupBy(users, 'order')
                    // console.log(arr, '===ss', arr.length)
                    let orderIds = [];
                    _.each(arr, function (data, idx) {
                        let cropInfo = []
                        let userInfo = {};
                        for (let i = 0; i < data.length; i++) {
                            for (let j = 0; j < cropData.length; j++) {
                                if (cropData[j].id == data[i].cropid) {
                                    cropInfo.push({ id: cropData[j].id, name: cropData[j].name })
                                    userInfo.firstName = data[i].name;
                                    userInfo.username = data[i].email;
                                    let qty = cropData[j].leftAfterAcceptanceQuantity - data[i].qty;
                                    Crops.update({ id: cropData[j].id }, { leftAfterAcceptanceQuantity: qty }).then(function (upcrop) {

                                    })
                                }

                            }

                            //console.log(cropInfo, '==cropinfounder')
                        }
                        console.log(idx, 'order')
                        Orders.update({ id: idx }, { placedStatus: 'true' }).then(function (orderupdata) {
                            //console.log(orderupdata, 'orderupdate data====')
                        });
                        sendEmail(cropInfo, userInfo)

                    })

                    return res.jsonx({
                        success: true,
                        code: 200,
                        data: order,
                        user: users
                    });
                })

            })


    }
};

createOR = function (fieldNames, keyword) {
    var query = [];
    fieldNames.forEach(function (item) {
        var temp = {};
        temp[item] = { $regex: '.*' + keyword + '.*' };
        query.push(temp);
    });
    if (query.length == 0) return false;
    return { $or: query };
},

    keys = function (collectionName) {
        mr = db.runCommand({
            'mapreduce': collectionName,
            'map': function () {
                for (var key in this) { emit(key, null); }
            },
            'reduce': function (key, stuff) { return null; },
            'out': 'my_collection' + '_keys'
        });
        return db[mr.result].distinct('_id');
    },

    findany = function (collection, keyword) {
        var query = createOR(keys(collection.getName()));
        if (query) {
            return collection.findOne(query, keyword);
        } else {
            return false;
        }
    },

    searchAll = function (keyword) {
        var all = ['crops', 'category']


        var results = [];
        all.forEach(function (collectionName) {
            print(collectionName);
            if (db[collectionName]) results.push(findany(db[collectionName], keyword));
        });
        return results;
    }

function cancelOrderEmail(user) {
    var email = user.username;
    var message = 'Hello ';
    message += user.fullName;
    message += ",";
    message += '<br/><br/>';
    message += '<strong>Your Order has been canceled:</strong><br/><br/>';
    message += 'Regards';
    message += '<br/>';
    message += 'eFarmX Support Team';
    transport.sendMail({
        from: sails.config.appSMTP.auth.user,
        to: email,
        subject: 'FarmX Order Cancellation',
        html: message
    }, function (err, info) {
        console.log("errro is ", err, info);
    });

    return { success: true, code: 200, data: { message: 'order placed successfully' } };

}

function sendEmail(cropData, user, notfound) {
    //console.log(cropData, 'cropdata=====', user, 'userdata==')
    //url = options.verifyURL,
    var email = user.username;
    var message = 'Hello ';
    message += user.firstName;
    message += ",";
    message += '<br/><br/>';
    let html = ""
    if (user.ordercode) {
        html += "<strong>This is the order id: " + user.ordercode + "</strong><br/><br/>"
    }

    html += '<strong>Products details are given below:</strong><br/><br/>';
    html += '<table style=" border: 1px solid black;">';
    html += '<tr><th>Sr. No</th><th>Name</th><th>Variety</th><th>Quantity</th><th>Price</th><th>Status</th><th>Url</th></tr>';
    let j = 1;
    for (i = 0; i < cropData.length; i++) {
        html += '<tr>'
        html += '<td>' + j + '</td>'
        html += '<td>' + cropData[i].name + '</td>'
        html += '<td>' + cropData[i].variety + '</td>'
        html += '<td>' + cropData[i].quantity + '</td>'
        html += '<td>' + cropData[i].price + '</td>'
        html += '<td>Placed</td>'
        if (cropData[i].id) {
            // html += '<td>' + constantObj.appUrls.FRONT_WEB_URL + '/#/crops/detail/' + cropData[i].id + '</td>'
            html += '<td>' + constantObj.appUrls.FRONT_WEB_URL + '/crops/detail/' + cropData[i].id + '</td>'
        } else {
            html += '<td></td>'
        }
        html += '</tr>'
        // message += 'Placed order item ' + cropData[i].name;
        // message += '<br/><br/>';
        // message += 'Product is or commodity: ' + constantObj.appUrls.FRONT_WEB_URL + '/#/crops/detail/' + cropData[i].id;
        // message += '<br/><br/>';
        j++;
    }
    if (notfound.length > 0) {
        for (let i = 0; i < notfound.length; i++) {
            html += '<tr>'
            html += '<td>' + j + '</td>'
            html += '<td>' + notfound[i].category + '</td>'
            html += '<td>' + notfound[i].variety + '</td>'
            html += '<td>' + notfound[i].quantity + '</td>'
            html += '<td>' + notfound[i].price + '</td>'
            html += '<td>Not Availble</td>'
            html += '<td></td>'
            html += '</tr>'
            j++;
        }
    }
    html += '</table><br/><br/>'

    message += html;

    message += 'Regards';
    message += '<br/>';
    message += 'eFarmX Support Team';

    transport.sendMail({
        from: sails.config.appSMTP.auth.user,
        to: email,
        subject: 'FarmX Order Items',
        html: message
    }, function (err, info) {
        console.log("errro is ", err, info);
    });

    return { success: true, code: 200, data: { message: 'order placed successfully' } };
}
function notFoundItem(cropData, user) {
    // console.log(item, 'notfound item=====')
    var email = user.username;
    var message = 'Hello ';
    message += user.firstName;
    message += ",";
    message += '<br/><br/>';
    let html = ""


    html += '<strong>Not Found Order Items</strong>';
    html += '<table style=" border: 1px solid black;">';
    html += '<tr><th>Sr. No</th><th>Name</th><th>Variety</th><th>Quantity</th><th>Price</th></tr>';
    let j = 1;
    for (i = 0; i < cropData.length; i++) {
        html += '<tr>'
        html += '<td>' + j + '</td>'
        html += '<td>' + cropData[i].category + '</td>'
        html += '<td>' + cropData[i].variety + '</td>'
        html += '<td>' + cropData[i].quantity + '</td>'
        html += '<td>' + cropData[i].price + '</td>'



        html += '</tr>'
        // message += 'Placed order item ' + cropData[i].name;
        // message += '<br/><br/>';
        // message += 'Product is or commodity: ' + constantObj.appUrls.FRONT_WEB_URL + '/#/crops/detail/' + cropData[i].id;
        // message += '<br/><br/>';
        j++;
    }
    html += '</table>'

    message += html;
    // for (i = 0; i < item.length > 0; i++) {
    //     message += item[i].category + " not found with us";
    //     message += '<br/><br/>';
    // }

    message += '<br/><br/>';
    message += 'Regards';
    message += '<br/>';
    message += 'eFarmX Support Team';

    transport.sendMail({
        from: sails.config.appSMTP.auth.user,
        to: email,
        subject: 'FarmX Not Found Products',
        html: message
    }, function (err, info) {
        console.log("errro is ", err, info);
    });
    return 1

}


function cropsroutepricecalculate(req) {
    var distance = require('google-distance-matrix');

    //console.log('oooo', req)
    let destinationPincode = req.body.destinationPincode
    let cropId = req.body.cropId
    let quantity = req.body.quantity
    let origin = req.body.origin
    let destination = req.body.destination
    if (destination) {
        destination = destination.replace("↵", ", ");
        destination = destination.replace("\n", ", ");
    }

    if (cropId && quantity && destinationPincode) {

        return Crops.findOne({ id: cropId }, { fields: ['category', 'market', 'pincode'] }).then(function (crop) {
            console.log(crop.market, 'market==')
            return Market.findOne({ id: String(crop.market) }).populate('GM', { select: ['pincode'] }).then(function (mkt) {

                //console.log(mkt.GM, 'gmdata====')
                let sourceP = crop.pincode
                if (mkt && mkt.GM && mkt.GM.pincode) {
                    sourceP = mkt.GM.pincode
                }
                origin = String(sourceP)
                let qry = {}
                qry.isDeleted = false
                let category = crop.category

                qry.destination = parseInt(destinationPincode)
                qry.category = category
                qry.source = sourceP

                let now = new Date()

                qry.$or = [{ validUpto: null }, { validUpto: undefined }, { validUpto: { $gte: now } }]
                return Logisticprice.find(qry).sort('load desc').then(function (lprices) {
                    if (lprices.length > 0) {
                        let lastPrice = 0
                        let lastLoad = 0
                        let idx = -1
                        for (var i = 0; i < lprices.length; i++) {
                            if (lprices[i].load > crop.quantity || i == 0 || lprices[i].load == crop.quantity) {
                                lastPrice = lprices[i].price
                                lastLoad = lprices[i].load
                                idx = i
                            } else {
                                break
                            }
                        }

                        if (idx > -1) {
                            let dist = {}
                            dist['rate'] = lastPrice;
                            if (lprices[idx].distanceInMeters != undefined) {
                                dist['distance'] = { 'value': lprices[idx].distanceInMeters, 'text': String(lprices[idx].distanceInMeters / 1000) + " km" }
                                if (lprices[idx].travelDurationInSec != undefined) {
                                    dist['duration'] = { 'value': lprices[idx].travelDurationInSec, 'text': String(lprices[idx].travelDurationInSec / 60) + " mins" }
                                } else {
                                    dist['duration'] = { 'value': 0, 'text': "Time Not available" }
                                }
                                console.log("2")
                                return ({
                                    success: 'true',
                                    data: dist
                                });
                            } else {
                                let origins = [origin];
                                let destinations = [destinationPincode];
                                if (destination) {
                                    destinations = [destination];
                                }

                                let googleApiKey = constantObj.googlePlaces.key;


                                distance.key(googleApiKey);
                                distance.units('metric');

                                let errorMessage = "Input address not valid";
                                let errorFlag = false;
                                return new Promise((resolve, reject) => {

                                    distance.matrix(origins, destinations, function (err, distances) {
                                        if (distances.status == 'OK') {
                                            for (var i = 0; i < origins.length; i++) {
                                                for (var j = 0; j < destinations.length; j++) {
                                                    var origin = distances.origin_addresses[i];
                                                    var destination = distances.destination_addresses[j];
                                                    if (distances.rows[0].elements[j].status == 'OK') {
                                                        // dist = distances.rows[i].elements[j].distance.text;
                                                        dist = distances.rows[i].elements[j];
                                                        errorFlag = false;
                                                        break;
                                                    } else {
                                                        errorFlag = true;
                                                    }
                                                }
                                            }

                                            if (!errorFlag) {
                                                dist['rate'] = parseFloat((lastPrice).toFixed(2));
                                                return ({
                                                    success: 'true',
                                                    data: dist
                                                });
                                            } else {
                                                dist['distance'] = { 'value': 0, 'text': "Distance not available" }
                                                dist['duration'] = { 'value': 0, 'text': "Time Not available" }
                                                dist['rate'] = parseFloat((lastPrice).toFixed(2));
                                                return ({
                                                    success: 'true',
                                                    data: dist
                                                });
                                            }
                                        }
                                    })
                                });
                            }
                        } else {
                            let origins = [origin];
                            let destinations = [destinationPincode];
                            if (destination) {
                                destinations = [destination];
                            }
                            let googleApiKey = constantObj.googlePlaces.key;


                            distance.key(googleApiKey);
                            distance.units('metric');

                            let dist = '';
                            let errorMessage = "Input address not valid";
                            let errorFlag = false;
                            console.log(origins, 'origins==', destinations, 'destinations===')
                            return new Promise((resolve, reject) => {


                                distance.matrix(origins, destinations, function (err, distances) {
                                    if (err) {
                                        // return 
                                        errorFlag = true;
                                        reject({
                                            success: 'false',
                                            message: errorMessage
                                        });
                                    }
                                    if (!distances) {
                                        // return 
                                        errorFlag = true;
                                        reject({
                                            success: 'false',
                                            message: errorMessage
                                        });
                                    }

                                    if (distances == 'undefined') {
                                        errorFlag = true;
                                        reject({
                                            success: 'false',
                                            message: errorMessage
                                        });
                                    }

                                    if (distances.status == 'OK') {
                                        for (var i = 0; i < origins.length; i++) {
                                            for (var j = 0; j < destinations.length; j++) {
                                                var origin = distances.origin_addresses[i];
                                                var destination = distances.destination_addresses[j];
                                                if (distances.rows[0].elements[j].status == 'OK') {
                                                    // dist = distances.rows[i].elements[j].distance.text;
                                                    dist = distances.rows[i].elements[j];
                                                    errorFlag = false;
                                                    break;
                                                } else {
                                                    errorFlag = true;
                                                }
                                            }
                                        }

                                        if (!errorFlag) {
                                            let distancesss = (dist.distance.value / 1000);
                                            Settings.find({}).then(function (settings) {
                                                if (settings.length > 0) {
                                                    let setting = settings[0]
                                                    var logisticPricePerKM = setting.crop.logisticCharges
                                                    if (!logisticPricePerKM) {
                                                        logisticPricePerKM = 15.5
                                                    }

                                                    let itemRate = (distancesss * logisticPricePerKM);
                                                    dist['rate'] = parseFloat((itemRate).toFixed(2));
                                                    resolve({
                                                        success: 'true',
                                                        data: dist
                                                    });
                                                } else {
                                                    reject({
                                                        success: 'false',
                                                        message: "Unknown Error Occurred"
                                                    });
                                                }
                                            }).fail(function (err) {
                                                reject({
                                                    success: 'false',
                                                    message: err
                                                });
                                            })
                                        } else {
                                            reject({
                                                success: 'false',
                                                message: errorMessage
                                            });
                                        }
                                    } else {

                                        reject({
                                            success: 'false',
                                            message: errorMessage
                                        });
                                    }
                                });
                            })
                        }
                    } else {
                        let origins = [origin];
                        let destinations = [destinationPincode];
                        if (destination) {
                            destinations = [destination];
                        }

                        let googleApiKey = constantObj.googlePlaces.key;


                        distance.key(googleApiKey);
                        distance.units('metric');

                        let dist = '';
                        let errorMessage = "Input address not valid";
                        let errorFlag = false;

                        console.log(origins, 'origins1==', destinations, 'destinations1arun===')

                        return new Promise((resolve, reject) => {
                            distance.matrix(origins, destinations, function (err, distances) {
                                console.log(distances, 'distances++++++')
                                if (err) {
                                    // return 
                                    errorFlag = true;
                                    reject({
                                        success: 'false',
                                        message: errorMessage
                                    });
                                }
                                if (!distances) {
                                    // return 
                                    errorFlag = true;
                                    reject({
                                        success: 'false',
                                        message: errorMessage
                                    });
                                }

                                if (distances == 'undefined') {
                                    errorFlag = true;
                                    reject({
                                        success: 'false',
                                        message: errorMessage
                                    });
                                }

                                if (distances.status == 'OK') {
                                    for (var i = 0; i < origins.length; i++) {
                                        for (var j = 0; j < destinations.length; j++) {
                                            var origin = distances.origin_addresses[i];
                                            var destination = distances.destination_addresses[j];
                                            if (distances.rows[0].elements[j].status == 'OK') {
                                                // dist = distances.rows[i].elements[j].distance.text;
                                                dist = distances.rows[i].elements[j];
                                                errorFlag = false;
                                                break;
                                            } else {
                                                errorFlag = true;
                                            }
                                        }
                                    }

                                    if (!errorFlag) {
                                        let distancesss = (dist.distance.value / 1000);
                                        return Settings.find({}).then(function (settings) {
                                            if (settings.length > 0) {
                                                let setting = settings[0]
                                                var logisticPricePerKM = setting.crop.logisticCharges
                                                if (!logisticPricePerKM) {
                                                    logisticPricePerKM = 15.5
                                                }

                                                let itemRate = (distancesss * logisticPricePerKM);
                                                dist['rate'] = parseFloat((itemRate).toFixed(2));
                                                console.log('distance===', dist)

                                                resolve({
                                                    success: 'true',
                                                    data: dist
                                                });
                                            } else {
                                                reject({
                                                    success: 'false',
                                                    message: "Unknown Error Occurred"
                                                });
                                            }
                                        })


                                    } else {
                                        reject({
                                            success: 'false',
                                            message: errorMessage
                                        });
                                    }
                                } else {

                                    reject({
                                        success: 'false',
                                        message: errorMessage
                                    });
                                }
                            })
                        })

                    }
                })
            })
        })
    }
}

function createSellerPaymentForMT(cropId, suborder) {
    //console.log('call method', cropId)
    return Crops.findOne({ id: cropId }).then(function (cropinfo) {

        //	console.log(cropinfo, 'cropinfo====')
        if (cropinfo.aggregatedCrops && cropinfo.aggregatedCrops.length > 0) {

            let query = { id: { $in: cropinfo.aggregatedCrops } }

            let selectedFields = ['seller', 'price', 'quantity', 'quantitiesPart', 'leftAfterAcceptanceQuantitiesParts']

            return Crops.find(query, { fields: selectedFields }).then(function (allcrops) {
                var sellerPayments = [];
                for (var i = 0; i < allcrops.length; i++) {

                    let shareOfCrop = cropinfo.leftAfterAcceptanceQuantitiesParts[allcrops[i].id] / cropinfo.leftAfterAcceptanceQuantity

                    let sequenceNumber = 1;

                    let days = 0
                    days = days + cropinfo.sellerUpfrontDays

                    let upfrontObject = {
                        cropId: cropinfo.id,
                        baseCropId: allcrops[i].id,
                        order: suborder.order,
                        suborder: suborder.id,
                        sellerId: allcrops[i].seller,
                        buyerId: suborder.user,
                        depositPercentage: cropinfo.sellerUpfrontPercentage,
                        depositLabel: "Upfront",
                        depositDays: cropinfo.sellerUpfrontDays,
                        pincode: cropinfo.pincode,
                        paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
                        type: "Upfront",
                        status: "Due",
                        paymentMedia: 'Cart',
                        sequenceNumber: sequenceNumber,
                        amount: parseFloat((shareOfCrop * (suborder.amount * suborder.quantity * parseFloat(cropinfo.sellerUpfrontPercentage / 100))).toFixed(2))
                    }
                    sellerPayments.push(upfrontObject)

                    for (var n = 0; n < cropinfo.sellerDepositPayment.length; n++) {
                        let number = ++sequenceNumber;

                        days = days + cropinfo.sellerDepositPayment[n].days

                        let object = {
                            cropId: cropinfo.id,
                            baseCropId: allcrops[i].id,
                            order: suborder.order,
                            suborder: suborder.id,
                            sellerId: allcrops[i].seller,
                            buyerId: suborder.user,
                            depositPercentage: cropinfo.sellerDepositPayment[n].percentage,
                            depositLabel: cropinfo.sellerDepositPayment[n].label,
                            depositDays: cropinfo.sellerDepositPayment[n].days,
                            pincode: cropinfo.pincode,
                            paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
                            type: "Deposit",
                            status: "Due",
                            paymentMedia: 'Cart',
                            sequenceNumber: number,
                            amount: parseFloat((shareOfCrop * ((suborder.amount * suborder.quantity) * parseFloat(cropinfo.sellerDepositPayment[n].percentage / 100))).toFixed(2))
                        }
                        sellerPayments.push(object);
                    }

                    /*cropinfo.sellerDepositPayment.forEach((obj, i) => {
                        days = days + cropinfo.sellerDepositPayment[i].days
                        let number = ++sequenceNumber;
                        let object = {
                            cropId: cropinfo.id,
                            bidId: bidInfo.id,
                            sellerId: allcrops[i].seller,
                            buyerId: bidInfo.user.id,
                            depositPercentage: cropinfo.sellerDepositPayment[i].percentage,
                            depositLabel: cropinfo.sellerDepositPayment[i].label,
                            depositDays: cropinfo.sellerDepositPayment[i].days,
                            pincode: cropinfo.pincode,
                            paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
                            type: "Deposit",
                            status: "Due",
                            sequenceNumber: number,
                            amount: parseFloat((shareOfCrop * (bidInfo.amount * parseFloat(obj.percentage / 100))).toFixed(2))
                        }
                        sellerPayments.push(object);
                    })*/

                    days = days + cropinfo.sellerFinalDays
                    let SequenceNumber = ++sequenceNumber;
                    let finalObject = {
                        cropId: cropinfo.id,
                        baseCropId: allcrops[i].id,
                        order: suborder.order,
                        suborder: suborder.id,
                        sellerId: allcrops[i].seller,
                        buyerId: suborder.user,
                        depositPercentage: cropinfo.sellerFinalPercentage,
                        depositLabel: "Final",
                        depositDays: cropinfo.sellerFinalDays,
                        pincode: cropinfo.pincode,
                        paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
                        type: "Final",
                        status: "Due",
                        paymentMedia: 'Cart',
                        sequenceNumber: SequenceNumber,
                        amount: parseFloat((shareOfCrop * ((suborder.amount * suborder.quantity) * parseFloat(cropinfo.sellerFinalPercentage / 100))).toFixed(2))
                    }
                    sellerPayments.push(finalObject);

                }

                for (var i = 0; i < sellerPayments.length; i++) {
                    if (sellerPayments[i].amount < 1) {
                        sellerPayments[i].amount = 0
                        sellerPayments[i].paymentMode = 'AutoAdjusted'
                        sellerPayments[i].status = 'Verified'
                        sellerPayments[i].isVerified = true
                        sellerPayments[i].depositedOn = new Date()
                    }
                }

                return Sellerpayment.create(sellerPayments).then(function (responseSellerPayment) {
                })

            })
        } else {
            var sellerPayments = [];
            var sequenceNumber = 1;

            var days = 0
            days = days + cropinfo.sellerUpfrontDays

            let upfrontObject = {
                cropId: cropinfo.id,
                baseCropId: cropinfo.id,
                order: suborder.order,
                suborder: suborder.id,
                sellerId: cropinfo.seller,
                buyerId: suborder.user,
                depositPercentage: cropinfo.sellerUpfrontPercentage,
                depositLabel: "Upfront",
                depositDays: cropinfo.sellerUpfrontDays,
                pincode: cropinfo.pincode,
                paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
                type: "Upfront",
                status: "Due",
                paymentMedia: 'Cart',
                sequenceNumber: sequenceNumber,
                amount: parseFloat((suborder.amount * suborder.quantity) * parseFloat(cropinfo.sellerUpfrontPercentage / 100))
            }
            sellerPayments.push(upfrontObject)

            cropinfo.sellerDepositPayment.forEach((obj, i) => {
                days = days + cropinfo.sellerDepositPayment[i].days
                let number = ++sequenceNumber;
                let object = {
                    cropId: cropinfo.id,
                    baseCropId: cropinfo.id,
                    order: suborder.order,
                    suborder: suborder.id,
                    sellerId: cropinfo.seller,
                    buyerId: suborder.user,
                    depositPercentage: cropinfo.sellerDepositPayment[i].percentage,
                    depositLabel: cropinfo.sellerDepositPayment[i].label,
                    depositDays: cropinfo.sellerDepositPayment[i].days,
                    pincode: cropinfo.pincode,
                    paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
                    type: "Deposit",
                    status: "Due",
                    paymentMedia: 'Cart',
                    sequenceNumber: number,
                    amount: parseFloat((suborder.amount * suborder.quantity) * parseFloat(obj.percentage / 100))
                }
                sellerPayments.push(object);
            })

            days = days + cropinfo.sellerFinalDays
            let SequenceNumber = ++sequenceNumber;
            let finalObject = {
                cropId: cropinfo.id,
                baseCropId: cropinfo.id,
                order: suborder.order,
                suborder: suborder.id,
                sellerId: cropinfo.seller,
                buyerId: suborder.user,
                depositPercentage: cropinfo.sellerFinalPercentage,
                depositLabel: "Final",
                depositDays: cropinfo.sellerFinalDays,
                pincode: cropinfo.pincode,
                paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
                type: "Final",
                status: "Due",
                paymentMedia: 'Cart',
                sequenceNumber: SequenceNumber,
                amount: parseFloat((suborder.amount * suborder.quantity) * parseFloat(cropinfo.sellerFinalPercentage / 100))
            }
            sellerPayments.push(finalObject);

            for (var i = 0; i < sellerPayments.length; i++) {
                if (sellerPayments[i].amount < 1) {
                    sellerPayments[i].amount = 0
                    sellerPayments[i].paymentMode = 'AutoAdjusted'
                    sellerPayments[i].status = 'Verified'
                    sellerPayments[i].isVerified = true
                    sellerPayments[i].depositedOn = new Date()
                }
            }
            //console.log(sellerPayments, 'sellerPayments=========')

            return Sellerpayment.create(sellerPayments).then(function (responseSellerPayment) {
            })


        }

    })

}
function createMTPayment(cropId, suborder) {
    return Crops.findOne({ id: cropId }).then(function (cropInfo) {
        let payments = [];
        // console.log(cropInfo, 'cropinfo===', cropId, 'cropid====')
        if (cropId) {
            let data = {
                'name': "Final",
                'percentage': 100,
                'days': 12,
                'amount': suborder.totalAmount,
                'pincode': cropInfo.pincode ? cropInfo.pincode : 0,
                'type': 'Final',
                'status': 'Due',
                'cropId': cropInfo.id,
                'order': suborder.order,
                'suborder': suborder.id,
                'buyerId': suborder.user,
                'sellerId': cropInfo.seller,
                'sequenceNumber': 1,
                'paymentDueDate': new Date(new Date().setDate(new Date().getDate() + 12)).toISOString(),
                'paymentMedia': 'Cart'
            }

            payments.push(data);

            return Bidspayment.create(payments).then(function (response) {

            })


        }
    })
}
function sendEmailWithNotFound(cropData, user, notfound) {
    //console.log(cropData, 'cropdata=====', user, 'userdata==')
    //url = options.verifyURL,
    var email = user.username;
    var message = 'Hello ';
    message += user.firstName;
    message += ",";
    message += '<br/><br/>';
    let html = ""
    if (user.ordercode) {
        html += "<strong>This is the order no: " + user.ordercode + "</strong><br/><br/>"
    }

    html += '<strong>Products details are given below:</strong><br/><br/>';
    html += '<table style=" border: 1px solid black;">';
    html += '<tr><th>Sr. No</th><th>Name</th><th>Variety</th><th>Quantity</th><th>Price</th><th>Status</th><th>Url</th></tr>';
    let j = 1;
    for (i = 0; i < cropData.length; i++) {
        html += '<tr>'
        html += '<td>' + j + '</td>'
        html += '<td>' + cropData[i].name + '</td>'
        html += '<td>' + cropData[i].variety + '</td>'
        html += '<td>' + cropData[i].quantity + '</td>'
        html += '<td>' + cropData[i].price + '</td>'
        html += '<td>Placed</td>'
        if (cropData[i].id) {
            // html += '<td>' + constantObj.appUrls.FRONT_WEB_URL + '/#/crops/detail/' + cropData[i].id + '</td>'
            html += '<td>' + constantObj.appUrls.FRONT_WEB_URL + '/crops/detail/' + cropData[i].id + '</td>'
        } else {
            html += '<td></td>'
        }
        html += '</tr>'
        // message += 'Placed order item ' + cropData[i].name;
        // message += '<br/><br/>';
        // message += 'Product is or commodity: ' + constantObj.appUrls.FRONT_WEB_URL + '/#/crops/detail/' + cropData[i].id;
        // message += '<br/><br/>';
        j++;
    }
    if (notfound.length > 0) {
        for (let i = 0; i < notfound.length; i++) {
            html += '<tr>'
            html += '<td>' + j + '</td>'
            html += '<td>' + notfound[i].category + '</td>'
            html += '<td>' + notfound[i].variety + '</td>'
            html += '<td>' + notfound[i].quantity + '</td>'
            html += '<td>' + notfound[i].price + '</td>'
            html += '<td>Not Availble</td>'
            html += '<td></td>'
            html += '</tr>'
            j++;
        }
    }
    html += '</table><br/><br/>'

    message += html;

    message += 'Regards';
    message += '<br/>';
    message += 'eFarmX Support Team';

    transport.sendMail({
        from: sails.config.appSMTP.auth.user,
        to: email,
        subject: 'FarmX Order Items',
        html: message
    }, function (err, info) {
        console.log("errro is ", err, info);
    });

    return { success: true, code: 200, data: { message: 'order placed successfully' } };
}