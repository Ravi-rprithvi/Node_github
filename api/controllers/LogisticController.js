/**
 * LogisticController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var pushService = require('../services/PushService.js');
module.exports = {
  
  	 verifyPayments: function(req, res) {

        var ids = [];
        //if(req.body.id) ids = JSON.parse(req.body.id);
        if (req.body.id) {

            ids = req.body.id;
        }

        var query = {};
        query.isVerified = "true";
        query.status = "Verified";
        query.verifiedBy = req.identity.id
        query.verifyDate = new Date()
        code = commonServiceObj.getUniqueCode();

        async.each(ids, function(paymentid, callback) {


            Bidspayment.findOne({
                id: paymentid
            }).populate("order").then(function(bidspaymentDetail) {

                if (bidspaymentDetail.status != 'Verified' && typeof bidspaymentDetail.transactionId == 'undefined') {

                    Bidspayment.update({
                        id: paymentid
                    }, query).then(function(bidpaymentStatus) {
                    
                        if (bidpaymentStatus) {

                            var transactionData = {};
                            transactionData.buyerId = bidspaymentDetail.buyerId;
                            transactionData.sellerId = bidspaymentDetail.sellerId;
                            transactionData.crop = bidspaymentDetail.cropId;
                            transactionData.order = bidspaymentDetail.order.id;
                            transactionData.bidsPaymentId = bidspaymentDetail.id;

                            transactionData.transactionId = code;
                            transactionData.amount = bidspaymentDetail.amount;
                            transactionData.paymentType = bidspaymentDetail.paymentMode;
                            transactionData.processStatus = "TXN_SUCCESS";
                            transactionData.transactionType = 'Credit';

                            if (bidspaymentDetail.type == "Deposit") {
                                transactionData.status = 'DA';
                            } else if (bidspaymentDetail.type == "Final") {
                                transactionData.status = 'FA';
                            }

                            Transactions.create(transactionData).then(function(newTransactionEntry) {
                                if (newTransactionEntry) {
                                    qry = {};
                                    qry.transactionId = newTransactionEntry.id
                                    Bidspayment.update({
                                        id: paymentid
                                    }, qry).then(function(bidpaymentStatus) {

                                        var msg = bidspaymentDetail.name + " consisting of ₹ " + bidspaymentDetail.amount + "for bid id (" +bidspaymentDetail.order.code+ ") paid on via (" + bidspaymentDetail.paymentMode + ") is verified. ";

                                        var notificationData = {};
                                        notificationData.productId = bidspaymentDetail.cropId;
                                        notificationData.crop = bidspaymentDetail.cropId;
                                        notificationData.user = bidspaymentDetail.buyerId;
                                        notificationData.buyerId = bidspaymentDetail.buyerId;
                                        notificationData.productType = "crops";

                                        notificationData.message = msg;
                                        notificationData.messageKey = "PAYMENT_VERIFIED_NOTIFICATION"
                                        notificationData.readBy = [];
                                        notificationData.messageTitle = "Payment verified"
                                        let pushnotreceiver = [bid[0].user]

                                        Notifications.create(notificationData).then(function(notificationResponse) {
                                            if (notificationResponse) {
                                                commonService.notifyUsersFromNotification(notificationResponse, undefined)
                                                pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                            }
                                    
                                            callback()

                                        }).fail(function(err) {
                                            callback()
                                        })
                                    })
                                } else {
                                    callback()
                                }
                            });
                            //callback();
                        }
                    })
                } else {
                    callback()
                }
                callback();
            })


        }, function(error) {
            if (error) {

            } else {
                return res.jsonx({
                    success: true,
                    data: {
                        message: constantObj.bids.SUCCESSFULLY_VERIFIED,
                        key: 'SUCCESSFULLY_VERIFIED',
                    },
                });
            }
        });
    },

    paymentLogisticListDetail: function(req, res) {

        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var search = req.param('search');
        var sortBy = req.param('sortBy');
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

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                query.pincode = {
                    "$in": pincode
                };
            }
        }

        if (req.param('status')) {
            query.status = req.param('status');
        }

        if (req.param('from') && req.param('to')) {
            query.$and = [{
                createdAt: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                createdAt: {
                    $lte: new Date(req.param('to'))
                }
            }]
        }

        if (search) {
            query.$or = [{
                    bidcode: parseFloat(search)
                },
                {
                    cropcode: parseFloat(search)
                },
                {
                    buyer: {
                        $regex: search,
                        '$options': 'i'
                    }
                },
                {
                    paymentMode: {
                        $regex: search,
                        '$options': 'i'
                    }
                },
                {
                    amount: parseFloat(search)
                },
                {
                    logisticPartner: {
                        $regex: search,
                        '$options': 'i'
                    }
                },
                {
                    paymentBy: {
                        $regex: search,
                        '$options': 'i'
                    }
                }
            ]
        }

		query.logisticPartner = req.identity.id ;
        let media = req.param('media') ;
        console.log ("sdfasdasd", query) ;
        LogisticPayment.native(function(err, paymentlist) {
            paymentlist.aggregate([{
                    $lookup: {
                        from: "crops",
                        localField: "cropId",
                        foreignField: "_id",
                        as: "crops"
                    }
                },
                {
                    $unwind: '$crops'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'sellerId',
                        foreignField: '_id',
                        as: "sellers"
                    }
                },
                {
                    $unwind: '$sellers'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'buyerId',
                        foreignField: '_id',
                        as: "buyers"
                    }
                },
                {
                    $unwind: '$buyers'
                },
                {
                    $lookup: {
                        from: 'lpartners',
                        localField: 'logisticPartner',
                        foreignField: '_id',
                        as: "logisticPartner"
                    }
                },
                {
                    $unwind: '$logisticPartner'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'paymentBy',
                        foreignField: '_id',
                        as: "paymentUser"
                    }
                },
                {
                    $unwind: {
                        path: "$paymentUser",
                        //preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: (media == "order") ? 'orderedcarts'  : 'bids',
                        localField: (media == "order") ? 'suborder'  : 'bidId',
                        foreignField: '_id',
                        as: (media == "order") ? 'order'  : 'bids',
                    }
                },
                {
                    $unwind: (media == "order") ? '$order'  : '$bids',
                },
                {
                    $project: {
                        id: "$_id",
                        Id: (media == "order") ? "$order._id"  : "$bids._id",
                        code: (media == "order") ? "$order.code"  : "$bids.code",
                        sellerId: "$sellers._id",
                        seller: "$sellers.fullName",
                        buyerId: "$buyers._id",
                        buyer: "$buyers.fullName",
                        logisticPartner: "$logisticPartner._id",
                        logisticPartnerName: "$logisticPartner.companyName",
                        cropcode: "$crops.code",
                        depositedOn: "$depositedOn",
                        paymentDueDate: "$paymentDueDate",
                        status: "$status",
                        paymentMode: "$paymentMode",
                        amount: "$amount",
                        cropId: "$crops._id",
                        paymentBy: "$paymentUser.fullName",
                        paymentById: "$paymentUser._id",
                        createdAt: "$createdAt",
                        pincode: "$pincode"
                    }
                },
                {
                    $match: query
                }
            ], function(err, totalresults) {
                if (err) {

                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {

                    paymentlist.aggregate([{
                            $lookup: {
                                from: "crops",
                                localField: "cropId",
                                foreignField: "_id",
                                as: "crops"
                            }
                        },
                        {
                            $unwind: '$crops'
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'sellerId',
                                foreignField: '_id',
                                as: "sellers"
                            }
                        },
                        {
                            $unwind: '$sellers'
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'buyerId',
                                foreignField: '_id',
                                as: "buyers"
                            }
                        },
                        {
                            $unwind: '$buyers'
                        },
                        {
                            $lookup: {
                                from: 'lpartners',
                                localField: 'logisticPartner',
                                foreignField: '_id',
                                as: "logisticPartner"
                            }
                        },
                        {
                            $unwind: '$logisticPartner'
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'paymentBy',
                                foreignField: '_id',
                                as: "paymentUser"
                            }
                        },
                        {
                            $unwind: {
                                path: "$paymentUser",
                                // preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: (media == "order") ? 'orderedcarts'  : 'bids',
                                localField: (media == "order") ? 'suborder'  : 'bidId',
                                foreignField: '_id',
                                as: (media == "order") ? 'order'  : 'bids',
                            }
                        },
                            {
                            $unwind: (media == "order") ? '$order'  : '$bids',
                        },
                        {
                            $project: {
                                id: "$_id",
                                Id: (media == "order") ? "$order._id"  : "$bids._id",
                                code: (media == "order") ? "$order.code"  : "$bids.code",
                                sellerId: "$sellers._id",
                                seller: "$sellers.fullName",
                                buyerId: "$buyers._id",
                                buyer: "$buyers.fullName",
                                logisticPartner: "$logisticPartner._id",
                        		logisticPartnerName: "$logisticPartner.companyName",
                                cropcode: "$crops.code",
                                depositedOn: "$depositedOn",
                                paymentDueDate: "$paymentDueDate",
                                status: "$status",
                                paymentMode: "$paymentMode",
                                amount: "$amount",
                                cropId: "$crops._id",
                                createdAt: "$createdAt",
                                paymentBy: "$paymentUser.fullName",
                                paymentById: "$paymentUser._id",
                                image: "$image",
                                payableAt: "$payableAt",
                                payeeName: "$payeeName",
                                draftNumber: "$draftNumber",
                                draftBankName: "$draftBankName",
                                draftdate: "$draftdate",
                                depositDate: "$depositDate",
                                depositedOn: "$depositedOn",
                                depositedbranch: "$depositedbranch",
                                otherDetails: "$otherDetails",
                                chequeNumber: "$chequeNumber",
                                chequeBankBranch: "$chequeBankBranch",
                                chequeDate: "$chequeDate",
                                wireTransferMode: "$wireTransferMode",
                                wireTransferReferenceId: "$wireTransferReferenceId",
                                createdAt: "$createdAt",
                                pincode: "$pincode"
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
                    ], function(err, results) {

                        if (err) {
                            return res.status(400).jsonx({
                                success: false,
                                error: err
                            });
                        } else {
                            return res.jsonx({
                                success: true,
                                data: {
                                    logisticpaymentlist: results,
                                    total: totalresults.length
                                },
                            });
                        }
                    });
                }
            });
        })
    },

};

