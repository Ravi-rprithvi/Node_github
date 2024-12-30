/**
 * InputpaymentsController
 *
 * @description :: Server-side logic for managing inputs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var ObjectId = require('mongodb').ObjectID;
var constantObj = sails.config.constants;
var commonServiceObj = require('./../services/commonService');

module.exports = {

    inputBidAssignETD: function (req, res) {
        return API(InputService.inputAssignETD, req, res);
    },
    inputBidDispatched: function (req, res) {
        return API(InputService.inputDispatchBid, req, res);
    },
    inputBidRecieved: function (req, res) {
        return API(InputService.inputReceivedBid, req, res);
    },
    inputDeliverBid: function (req, res) {
        return API(InputService.inputDeliverBid, req, res);
    },
    initiateInputRefund: function (req, res) {
        return API(InputService.updateInitiate, req, res);
    },
    getBidInfo: function (req, res) {

        let data = {};
        data["id"] = req.param('id');

        Bids.findOne(data.id).populate("input").populate("user").then(function (bidInfo) {

            return res.status(200).jsonx({
                success: true,
                code: 200,
                data: {
                    bid: bidInfo
                },
            });
        }).fail(function (err) {

            return res.status(400).jsonx({
                success: false,
                error: {
                    code: 400,
                    message: err
                },
            });

        });
    },
    bidsInputsTransactions: function (req, res) {
        let id = req.param("id");
        Transactions.find({
            input: id
        }).populate("buyerId").populate("sellerId")
            .populate("input").populate("bidId")
            .then(function (bidTransactions) {
                return res.status(200).jsonx({
                    success: true,
                    data: bidTransactions,
                });
            });
    },
    assignLogisticAndDeliveryTimeBid: function (req, res) {
        let data = req.body;
        data["id"] = req.param('id');
        console.log("data**********", data);
        Bids.findOne({ id: data.id }).then(function (bid) {
            console.log("bid**********", bid);
            if (bid) {
                var message = 'Logistic assigned'
                if (bid.logisticId) {
                    message = 'Logistic changed'
                }
                if (bid.ETD) {
                    var availObj = bid.ETD;
                    var availableRange = parseInt(data.deliveryTime);
                    var dateChanged = new Date(availObj);
                    dateChanged.setDate(dateChanged.getDate() + availableRange);
                    data.ETA = dateChanged
                }
                // return bidCheckPost(updateBid,data,context, message);
                var message = 'Bid Updated'
                if (data.historyComment) {
                    message = data.historyComment

                    delete data.historyComment
                }

                console.log("data update**********", data);

                Bids.update({ id: data.id }, data).then(function (bidinfo) {
                    // var callFunction = createBidHistory(data,bid[0], message)


                    console.log("bidinfo**********", bidinfo);
                    var history = {};
                    history.bid = bidinfo[0].id;
                    history.amount = bidinfo[0].amount;
                    history.input = bidinfo[0].input;
                    history.bidBy = bidinfo[0].user;
                    history.bidStatus = bidinfo[0].status;
                    history.quantity = bidinfo[0].quantity;
                    history.quantityUnit = bidinfo[0].quantityUnit;
                    history.bidRejectReason = bidinfo[0].reason == undefined ? "" : bidinfo[0].reason;
                    if (message) {
                        history.comment = message
                    } else {
                        history.comment = "Bid Updated"
                    }

                    console.log("history**********", history);

                    Bidshistory.create(history).then(function (historyRes) {

                        console.log("historyRes**********", historyRes);

                        return res.status(200).jsonx({
                            success: true,
                            code: 200,
                            data: {
                                bid: bidinfo[0],
                                message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                key: 'SUCCESSFULLY_UPDATED_BID',
                            },
                        });

                    }).fail(function (error) {
                        return res.status(200).jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: error
                            },
                        });
                    });
                }).fail(function (error) {
                    return res.status(200).jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: error
                        },
                    });
                });
            } else {
                return res.status(200).jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: "Unknow Error Occurred"
                    },
                });
            }
        }).fail(function (error) {
            return res.status(200).jsonx({
                success: false,
                error: {
                    code: 400,
                    message: error
                },
            });
        });
    },
    refundInputBidAmount: function (req, res) {
        // this is used for admin Section
        var request = require('request');
        let merchantKey = constantObj.payu.KEY;
        var envPaytm = req.param('env') // "development" "production";
        let paymentId;
        let refundAmount;
        let id = req.param("id");
        let transactionData = {};
        let bidData = {};
        let history = {};
        let refundBy = req.identity.id;

        Bids.findOne({
            id: id
        }).then(function (bidInfo) {
            var findTransactionQry = {}
            findTransactionQry.bidId = bidInfo.id
            findTransactionQry.paymentType = "PayTm"
            findTransactionQry.processStatus = 'TXN_SUCCESS'

            Transactions.findOne(findTransactionQry).then(function (bidTransactions) {

                let REFUNDCode = commonServiceObj.getRefundCode("REFID");
                var paramlist = {};

                paramlist['MID'] = bidTransactions.paymentjson.MID;
                paramlist['TXNID'] = bidTransactions.paymentjson.TXNID;
                paramlist['ORDERID'] = bidTransactions.paymentjson.ORDERID;
                paramlist['REFUNDAMOUNT'] = bidTransactions.paymentjson.TXNAMOUNT;
                paramlist['TXNTYPE'] = "REFUND";
                paramlist["REFID"] = REFUNDCode;

                let paytm_key = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;

                Payments.genchecksumforrefund(paramlist, paytm_key, function (err, JsonData) {
                    console.log("result of refund", JsonData)

                    let jsONDST = JSON.stringify(JsonData);
                    let refundApiPayTmUrl = constantObj.paytm_config[envPaytm].REFUND_URL + "?JsonData=" + jsONDST
                    console.log("refundApiPayTmUrl", refundApiPayTmUrl)

                    var options = {
                        url: refundApiPayTmUrl,
                        method: 'GET',
                        headers: {
                            "Pragma": "no-cache",
                            "Cache-Control": "no-cache",
                            "Expires": 0
                        }
                    };

                    function callback(error, response, body) {

                        if (!error && response.statusCode == 200) {
                            var info = JSON.parse(body);
                            //
                            if (info.STATUS == 'TXN_SUCCESS') {
                                transactionData.processedBy = refundBy;
                                transactionData.status = 'RF';
                                transactionData.transactionType = 'DebitEscrow';
                                transactionData.processStatus = info.RESPMSG
                                transactionData.payTmRefundId = info.REFUNDID;
                                transactionData.refundjson = info;

                                var date = new Date();
                                bidData.processedBy = refundBy;
                                bidData.status = "Refund";
                                bidData.refundDate = date;

                                history.bid = bidTransactions.bidId;
                                history.amount = bidTransactions.amount;
                                history.input = bidTransactions.input;
                                history.bidBy = bidTransactions.buyerId;
                                history.quantity = bidInfo.quantity;
                                history.quantityUnit = bidInfo.quantityUnit;
                                history.bidStatus = "Refund";
                                history.comment = "Refund Successful."

                                Bids.update({
                                    id: id
                                }, bidData).then(function (response) {
                                    Bidshistory.create(history).then(function (historyRes) {
                                        Transactions.update({
                                            id: transactionData.id
                                        }, transactionData).then(function (paymentsData) {
                                            return res.status(200).jsonx({
                                                data: paymentsData,
                                                success: true,
                                                message: constantObj.bids.Refund_Payment
                                            });
                                        });
                                    });
                                });
                            } else {
                                return res.status(200).jsonx({
                                    success: true,
                                    message: info.RESPMSG
                                });
                            }
                        }
                    } // callback here 
                    request(options, callback);
                });
            });
        });
    },
    inputBidReject: function (req, res) {
        var request = require('request-promise');
        var data = {};
        var envPaytm = req.param('env') // "development" "production";

        data.id = req.param("id");
        data.status = 'Rejected';
        data.rejectedAt = new Date();
        data.comment = req.body.comment ? req.body.comment : "";
        data.reason = req.body.reason ? req.body.reason : "";
        let refundBy = req.identity.id

        var findTransactionQry = {}
        findTransactionQry.bidId = data.id
        findTransactionQry.paymentType = "PayTm"
        findTransactionQry.processStatus = "TXN_SUCCESS"

        Transactions.findOne(findTransactionQry).then(function (bidTransactions) {
            if (bidTransactions == undefined) {
                return res.status(200).jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: err
                    },
                });
            }

            let REFUNDCode = commonServiceObj.getRefundCode("REFID");
            var paramlist = {};

            paramlist['MID'] = bidTransactions.paymentjson.MID;
            paramlist['TXNID'] = bidTransactions.paymentjson.TXNID;
            paramlist['ORDERID'] = bidTransactions.paymentjson.ORDERID;
            paramlist['REFUNDAMOUNT'] = bidTransactions.paymentjson.TXNAMOUNT;
            paramlist['TXNTYPE'] = "REFUND";
            paramlist["REFID"] = REFUNDCode;
            let paytm_key = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;

            // console.log("paramlist *------------------", paramlist) ;

            Payments.genchecksumforrefund(paramlist, paytm_key,
                (err, JsonData) => {

                    let jsONDST = JSON.stringify(JsonData);
                    // console.log("jsONDST *------------------", jsONDST) ;

                    let refundApiPayTmUrl = constantObj.paytm_config[envPaytm].REFUND_URL + "?JsonData=" + jsONDST
                    var options = {
                        url: refundApiPayTmUrl,
                        method: 'GET',
                        headers: {
                            "Pragma": "no-cache",
                            "Cache-Control": "no-cache",
                            "Expires": 0
                        }
                    };

                    // console.log("options *------------------", options) ;

                    request(options).then(function (body) {

                        console.log("request response body Paytm+++++++++", body);
                        var info = JSON.parse(body);


                        if (info.STATUS == 'TXN_SUCCESS' || info.STATUS == 'PENDING') {

                            let transactionData = {};
                            transactionData.processedBy = refundBy;
                            transactionData.status = 'RF';
                            transactionData.transactionType = 'DebitEscrow';
                            transactionData.processStatus = info.RESPMSG;
                            transactionData.payTmRefundId = info.REFUNDID;
                            transactionData.refundjson = info;

                            Transactions.update({
                                id: bidTransactions.id
                            }, transactionData).then(function (paymentsData) {
                                console.log("paymentsData************", paymentsData);
                                Bids.update({
                                    id: data.id
                                }, data).then(function (bid) {
                                    createBidHistory(data, bid[0], "Bid Rejected").then(function (notin) {
                                        Bidspayment.destroy({
                                            bidId: data.id
                                        }).then(function (destroyResp) {

                                            console.log("destroyRespdestroyResp ======", destroyResp);

                                            var msg = "Bid (" + bid[0].code + ") is rejected by Seller. ";

                                            var notificationData = {};
                                            notificationData.productId = bid[0].input;
                                            notificationData.input = bid[0].input;
                                            notificationData.user = bid[0].user;
                                            notificationData.buyerId = bid[0].user;
                                            notificationData.productType = "input";
                                            //notificationData.transactionOwner = u[0].id;
                                            notificationData.message = msg;
                                            notificationData.messageKey = "BID_REJECTED_NOTIFICATION"
                                            notificationData.readBy = [];

                                            Notifications.create(notificationData).then(function (notificationResponse) {
                                                if (notificationResponse) {
                                                    commonService.notifyUsersFromNotification(notificationResponse, undefined)
                                                }

                                                var userID = bid[0].user;
                                                Users.findOne(userID).then(function (user) {
                                                    // push notification by rohitk
                                                    console.log("user push notify", user);
                                                    if (user && user.deviceToken) {
                                                        let pushObj = {};
                                                        pushObj.device_token = user.deviceToken;
                                                        pushObj.device_type = user.device_type;
                                                        pushObj.message = msg;
                                                        pushService.sendPush(pushObj);
                                                    }
                                                    return res.status(200).jsonx({
                                                        success: true,
                                                        code: 200,
                                                        data: {
                                                            bid: bid[0],
                                                            message: constantObj.bids.SUCCESSFULLY_REJECTED_BID,
                                                            key: 'SUCCESSFULLY_REJECTED_BID',
                                                        },
                                                    });

                                                });

                                            })
                                        })
                                    })
                                }).fail(function (error) {
                                    return res.status(200).jsonx({
                                        success: false,
                                        error: {
                                            code: 400,
                                            message: error
                                        },
                                    });
                                });
                            });
                        } else {
                            return res.status(200).jsonx({
                                success: false,
                                error: {
                                    code: 400,
                                    message: info.RESPMSG
                                },
                            });
                        }

                    }).catch(function (err) {
                        return {
                            success: false,
                            error: err
                        }
                    });
                });
        });
    },

    inputFranchiseeDeliveryBids: function (req, res) {
        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";
        var bidStatus = req.param('bidStatus')

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


        if (bidStatus) {
            query.bidStatus = bidStatus
        } else {
            query.$or = [{
                bidStatus: 'Accepted'
            }, {
                bidStatus: 'Dispatched'
            }, {
                bidStatus: 'Delivered'
            }, {
                bidStatus: 'Received'
            }]
        }

        query.productType = "input";
        // query.logisticsOption = 'efarmx'
        // if (req.param('pincode')) {
        //     var pincodes = JSON.parse(req.param('pincode'));
        //     if (pincodes.length > 0) {
        //         query.pincode = {
        //             "$in": pincodes
        //         }
        //     }
        // }
        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        query.sellerId = ObjectId(req.identity.id)
        if (search) {
            query.$or = [{
                bidcode: parseFloat(search)
            },
            {
                inputCode: parseFloat(search)
            },
            {
                buyerName: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                sellerName: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                inputName: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                amount: parseFloat(search)
            },
            {
                bidQuantity: parseFloat(search)
            },
            {
                bidRate: parseFloat(search)
            },
            {
                bidAmount: parseFloat(search)
            },
            {
                bidStatus: {
                    $regex: search,
                    '$options': 'i'
                }
            }
            ]
        }
        console.log("dddd", query);

        Bids.native(function (error, bidslist) {
            bidslist.aggregate([{
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: "buyer"
                }
            },
            {
                $unwind: '$buyer'
            },
            {
                $lookup: {
                    from: 'inputs',
                    localField: 'input',
                    foreignField: '_id',
                    as: "inputs"
                }
            },
            {
                $unwind: '$inputs'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'inputs.user',
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
                    buyerName: "$buyer.fullName",
                    buyerId: "$user",
                    sellerName: "$sellers.fullName",
                    sellerId: "$sellers._id",
                    inputId: "$inputs._id",
                    inputCode: "$inputs.code",
                    pincode: "$inputs.pincode",
                    inputName: "$inputs.name",
                    bidcode: "$code",
                    productType: "$productType",
                    bidQuantity: "$quantity",
                    bidRate: "$bidRate",
                    bidAmount: "$amount",
                    bidDate: "$createdAt",
                    bidAcceptedAt: "$acceptedAt",
                    bidStatus: "$status",
                    bidTotalAmount: "$totalAmount",
                    quantityUnit: "$quantityUnit",
                    logisticsOption: "$logisticsOption",
                    ETD: "$ETD",
                    ETA: "$ETA",
                    ATD: "$ATD",
                    ATA: "$ATA",
                    deliveryTime: "$deliveryTime"
                }
            },
            {
                $match: query
            },
            {
                $sort: sortquery
            }
            ], function (err, totalresults) {
                bidslist.aggregate([{
                    $lookup: {
                        from: 'users',
                        localField: 'user',
                        foreignField: '_id',
                        as: "buyer"
                    }
                },
                {
                    $unwind: '$buyer'
                },
                {
                    $lookup: {
                        from: 'inputs',
                        localField: 'input',
                        foreignField: '_id',
                        as: "inputs"
                    }
                },
                {
                    $unwind: '$inputs'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'inputs.user',
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
                        buyerName: "$buyer.fullName",
                        buyerId: "$user",
                        sellerName: "$sellers.fullName",
                        sellerId: "$sellers._id",
                        inputId: "$inputs._id",
                        inputCode: "$inputs.code",
                        pincode: "$inputs.pincode",
                        inputName: "$inputs.name",
                        bidcode: "$code",
                        productType: "$productType",
                        bidQuantity: "$quantity",
                        bidRate: "$bidRate",
                        bidAmount: "$amount",
                        bidDate: "$createdAt",
                        bidAcceptedAt: "$acceptedAt",
                        bidStatus: "$status",
                        bidTotalAmount: "$totalAmount",
                        quantityUnit: "$quantityUnit",
                        logisticsOption: "$logisticsOption",
                        ETD: "$ETD",
                        ETA: "$ETA",
                        ATD: "$ATD",
                        ATA: "$ATA",
                        deliveryTime: "$deliveryTime",
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

                        async.each(results, function (bid, callback) {
                            let bidId = bid.id
                            let paymentquery = {};
                            paymentquery.bidId = bidId.toString()
                            if (bid.bidStatus == 'Dispatched' || bid.bidStatus == 'Delivered' || bid.bidStatus == 'Received') {
                                bid.currentStatus = bid.bidStatus
                                callback();
                            } else {
                                Bidspayment.count(paymentquery).then(function (bidPaymentCounts) {
                                    if (bidPaymentCounts > 0) {
                                        paymentquery.status = 'Verified'
                                        Bidspayment.count(paymentquery).then(function (verifiedPaymentCounts) {
                                            if (verifiedPaymentCounts != bidPaymentCounts) {
                                                paymentquery.status = 'Paid'
                                                Bidspayment.count(paymentquery).then(function (paidPaymentCounts) {
                                                    if (verifiedPaymentCounts + paidPaymentCounts == bidPaymentCounts) {
                                                        bid.currentStatus = "Paid"
                                                        callback();
                                                    } else if (parseInt(bidPaymentCounts - verifiedPaymentCounts) == 1) {
                                                        bid.currentStatus = "DepositsPaid"
                                                        callback();
                                                    } else {
                                                        bid.currentStatus = "Pending"
                                                        callback();
                                                    }
                                                }).fail(function (err) {
                                                    bid.currentStatus = "Error payment"
                                                    callback();
                                                })
                                            } else {
                                                if (parseInt(verifiedPaymentCounts) == parseInt(bidPaymentCounts)) {
                                                    bid.currentStatus = "Payments completed"
                                                    callback();
                                                } else {
                                                    bid.currentStatus = "Add ETD"
                                                    callback();
                                                }
                                            }
                                        }).fail(function (err) {
                                            bid.currentStatus = "Error payment"
                                            callback();
                                        })
                                    } else {
                                        bid.currentStatus = "Unexisted payment"
                                        callback();
                                    }
                                }).fail(function (err) {
                                    bid.currentStatus = "Error payment"
                                    callback();
                                })
                            }
                        }, function (asyncError) {
                            if (asyncError) {
                                return res.status(400).jsonx({
                                    success: false,
                                    error: error,
                                });
                            } else {
                                return res.jsonx({
                                    success: true,
                                    data: {
                                        bids: results,
                                        total: totalresults.length
                                    }
                                });
                            }
                        });
                    }
                });
            });
        });
    },

    //LOGISTICS DASHBOARD APIs
    inputLogisticAllDashboard: function (req, res) {
        var qry = {};
        qry.$or = [{
            bidStatus: "Accepted"
        }, {
            bidStatus: "Dispatched"
        }, {
            bidStatus: "Delivered"
        }, {
            bidStatus: "Received"
        }]
        qry.productType = 'input';
        qry.logisticsOption = 'efarmx';
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }
        if (req.param('from') && req.param('to')) {

            qry.$and = [{
                acceptedAt: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                acceptedAt: {
                    $lte: new Date(req.param('to'))
                }
            }]
        }

        console.log("dddd", qry);

        Bids.native(function (err, bidlist) {
            bidlist.aggregate([{
                $lookup: {
                    from: 'inputs',
                    localField: 'input',
                    foreignField: '_id',
                    as: "input"
                }
            },
            {
                $unwind: '$input'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'input.user',
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
                    localField: 'user',
                    foreignField: '_id',
                    as: "buyers"
                }
            },
            {
                $unwind: '$buyers'
            },
            {
                $project: {
                    sellerId: "$sellers._id",
                    seller: "$sellers.fullName",
                    sellerContact: "$seller.mobile",
                    buyerId: "$buyers._id",
                    buyer: "$buyers.fullName",
                    buyerContact: "$buyers.mobile",
                    pincode: "$input.pincode",
                    bidStatus: "$status",
                    logisticsOption: "$logisticsOption",
                    bidcode: "$code",
                    quantity: "$quantity",
                    quantityUnit: "$quantityUnit",
                    logisticPayment: "$logisticPayment",
                    dropAddress: "$address",
                    acceptedAt: "$acceptedAt",
                    productType: '$productType',
                    ETA: "$ETA",
                    ETD: "$ETD",
                    ATA: "$ATA",
                    ATD: "$ATD",
                    deliveryTime: "$deliveryTime",
                    logisticId: "$logisticId",
                    vehicleId: "$vehicleId"
                }
            },
            {
                $match: qry
            }
            ], function (err, allVerified) {
                console.log("allVerifiedallVerifiedallVerified", allVerified);
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    var confirmedCount = 0
                    var activeCount = 0
                    var enrouteCount = 0
                    var completedCount = 0
                    async.each(allVerified, function (bid, callback) {
                        if ((bid.bidStatus == "Delivered") || (bid.bidStatus == "Received")) {
                            completedCount = completedCount + 1
                            callback()
                        } else if (bid.bidStatus == "Dispatched") {
                            enrouteCount = enrouteCount + 1
                            callback()
                        } else {
                            var getConfirmedQuery = {}
                            getConfirmedQuery.bidId = bid._id.toString()
                            getConfirmedQuery.type = 'Final'
                            getConfirmedQuery.status = 'Verified'
                            console.log("getConfirmedQuerygetConfirmedQuery", getConfirmedQuery);
                            Bidspayment.findOne(getConfirmedQuery).then(function (bp) {
                                if (bp) {
                                    confirmedCount = confirmedCount + 1
                                }
                                callback()
                            }).fail(function (bperr) {
                                callback()
                            });

                        }
                    }, function (asyncError) {
                        if (asyncError) {
                            return res.status(400).jsonx({
                                success: false,
                                error: asyncError
                            });
                        } else {
                            var result = {}
                            result.confirmed = confirmedCount
                            result.active = activeCount
                            result.enroute = enrouteCount
                            result.completed = completedCount

                            return res.status(200).jsonx({
                                success: true,
                                data: result
                            });
                        }
                    });
                }
            });
        })
    },

    inputLogisticConfirmedDashboard: function (req, res) {
        var qry = {};
        qry.bidStatus = "Accepted";
        qry.logisticsOption = 'efarmx';
        qry.productType = 'input';
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }
        qry.type = 'Final';
        qry.ETD = { $exists: false };
        // qry.$or = [{status:'Paid'}, {status:'Verified'}]
        // qry.status = 'Verified'

        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('buyerId'))

            qry.buyerId = userId
        }

        if (req.param('sellerId') && req.param('sellerId') != undefined && req.param('sellerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('sellerId'))

            qry.sellerId = userId
        }

        // if(req.param('from') && req.param('to')){
        //     qry.$and = [{
        //         depositedOn: {
        //             $gte: new Date(req.param('from'))
        //         }
        //     }, {
        //         depositedOn: {
        //             $lte: new Date(req.param('to'))
        //         }
        //     }]
        // }

        console.log("qryqryqryqry", qry);
        Bidspayment.native(function (err, bidlist) {
            bidlist.aggregate([{
                $lookup: {
                    from: 'bids',
                    localField: 'bidId',
                    foreignField: '_id',
                    as: "bid"
                }
            },
            {
                $unwind: '$bid'
            },
            {
                $project: {
                    buyerId: "$buyerId",
                    sellerId: "$sellerId",
                    bidcode: "$bid.code",
                    bidId: "$bid._id",
                    ETD: "$bid.ETD",
                    bidStatus: "$bid.status",
                    logisticsOption: "$bid.logisticsOption",
                    status: "$status",
                    type: "$type",
                    productType: "$productType",
                    pincode: "$pincode",
                    depositedOn: "$depositedOn",
                    logisticAssigned: {
                        $cond: [{
                            $not: ["$bid.logisticId"]
                        }, false, true]
                    }
                }
            },
            {
                $match: qry
            },
            {
                $group: {
                    _id: {
                        bidId: "$bidId",
                        logisticAssigned: "$logisticAssigned"
                    },
                }
            },
            {
                $group: {
                    _id: "$_id.logisticAssigned",
                    count: {
                        $sum: 1
                    }
                }
            }
            ], function (err, allVerified) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: allVerified
                    });
                }
            });
        })
    },
    inputLogisticEnrouteDashboard: function (req, res) {
        var qry = {};
        qry.bidStatus = "Dispatched"
        qry.logisticsOption = 'efarmx'
        qry.productType = 'input';
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }

        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('buyerId'))

            qry.user = userId
        }

        if (req.param('sellerId') && req.param('sellerId') != undefined && req.param('sellerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('sellerId'))

            qry.seller = userId
        }
        console.log("qryqryqryqry", qry);
        Bids.native(function (err, bidlist) {
            bidlist.aggregate([{
                $lookup: {
                    from: 'inputs',
                    localField: 'input',
                    foreignField: '_id',
                    as: "input"
                }
            },
            {
                $unwind: '$input'
            },
            {
                $project: {
                    user: "$user",
                    seller: "$input.user",
                    bidStatus: "$status",
                    productType: "$productType",
                    logisticsOption: "$logisticsOption",
                    pincode: "$input.pincode"
                }
            },
            {
                $match: qry
            }
            ], function (err, allVerified) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: allVerified.length
                    });
                }
            });
        })
    },
    inputLogisticCompletedDashboard: function (req, res) {
        var qry = {};
        qry.$or = [{
            bidStatus: "Delivered"
        }, {
            bidStatus: "Received"
        }]
        qry.logisticsOption = 'efarmx'
        qry.productType = 'input';
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }

        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('buyerId'))

            qry.user = userId
        }

        if (req.param('sellerId') && req.param('sellerId') != undefined && req.param('sellerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('sellerId'))

            qry.seller = userId
        }

        // qry.$and = [{ATA: {$gte: new Date(req.param('from'))}}, {ATA: {$lte: new Date(req.param('to'))}}]
        if (req.param('from') && req.param('to')) {
            qry.$or = [{
                $and: [{
                    ATA: {
                        $gte: new Date(req.param('from'))
                    }
                }, {
                    ATA: {
                        $lte: new Date(req.param('to'))
                    }
                }]
            },
            {
                $and: [{
                    receivedDate: {
                        $gte: new Date(req.param('from'))
                    }
                }, {
                    receivedDate: {
                        $lte: new Date(req.param('to'))
                    }
                }]
            }
            ]
        }
        console.log("qryqryqryqry", qry);
        Bids.native(function (err, bidlist) {
            bidlist.aggregate([{
                $lookup: {
                    from: 'inputs',
                    localField: 'input',
                    foreignField: '_id',
                    as: "input"
                }
            },
            {
                $unwind: '$input'
            },
            {
                $project: {
                    user: "$user",
                    seller: "$input.user",
                    bidcode: "$code",
                    bidId: "$id",
                    bidStatus: "$status",
                    productType: "$productType",
                    logisticsOption: "$logisticsOption",
                    pincode: "$input.pincode",
                    ATA: "$ATA",
                    receivedDate: "$receivedDate",
                    comp: {
                        $cmp: ["$ETA", "$ATA"]
                    }
                }
            },
            {
                $match: qry
            },
            {
                $group: {
                    _id: "$comp",
                    count: {
                        $sum: 1
                    }
                }
            }
            ], function (err, allVerified) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: allVerified
                    });
                }
            });
        })
    },
    inputLogisticActiveDashboard: function (req, res) {
        var qry = {};
        qry.bidStatus = "Accepted";
        qry.logisticsOption = 'efarmx';
        qry.ETD = { $exists: true };

        qry.productType = 'input';
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }

        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('buyerId'))

            qry.user = userId
        }

        if (req.param('sellerId') && req.param('sellerId') != undefined && req.param('sellerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('sellerId'))

            qry.seller = userId
        }

        Bids.native(function (err, bidlist) {
            bidlist.aggregate([
                {
                    $lookup: {
                        from: 'inputs',
                        localField: 'input',
                        foreignField: '_id',
                        as: "input"
                    }
                },
                {
                    $unwind: '$input'
                },
                {
                    $project: {
                        user: "$user",
                        seller: "$input.user",
                        bidStatus: "$status",
                        productType: "$productType",
                        ETD: "$ETD",
                        logisticsOption: "$logisticsOption",
                        pincode: "$input.pincode",
                    }
                },
                {
                    $match: qry
                },
                {
                    $group: {
                        _id: "$approvedByBuyer",
                        count: {
                            $sum: 1
                        }
                    }
                }
            ], function (err, allVerified) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: allVerified
                    });
                }
            });
        })
    },
    inputLogisticDashboardConfirmedListings: function (req, res) {

        var qry = {};

        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";
        // var bidStatus = req.param('bidStatus')

        if (req.param('sortBy')) {
            sortBy = req.param('sortBy')
        }

        if (req.param('logisticId')) {
            if (req.param('logisticId') == "nulll") {
                qry.logisticId = "nulll"
            } else {
                qry.logisticId = {
                    $ne: "nulll"
                }
            }
        }

        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('buyerId'))

            qry.buyerId = userId
        }

        if (req.param('sellerId') && req.param('sellerId') != undefined && req.param('sellerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('sellerId'))

            qry.sellerId = userId
        }

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }
        var sortquery = {};
        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        if (search) {
            qry.$or = [{
                bidcode: parseFloat(search)
            },
            {
                buyer: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                seller: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressPincode: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressState: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressDistrict: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressCity: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddress: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                dropAddress: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                bidQuantity: parseFloat(search)
            }
            ]
        }

        qry.bidStatus = "Accepted"
        qry.logisticsOption = 'efarmx'
        qry.productType = "input"

        qry.ETD = { $exists: false };

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pickupAddressPincode = {
                    "$in": pincode
                }
            }
        }

        qry.type = 'Final'
        // qry.status = 'Verified'

        // if(req.param('from') && req.param('to')){
        //     qry.$and = [{
        //         depositedOn: {
        //             $gte: new Date(req.param('from'))
        //         }
        //     }, {
        //         depositedOn: {
        //             $lte: new Date(req.param('to'))
        //         }
        //     }]
        // }

        console.log("ssssssssssssssssdsdsd", JSON.stringify(qry));
        Bidspayment.native(function (err, bidlist) {
            bidlist.aggregate([{
                $lookup: {
                    from: 'bids',
                    localField: 'bidId',
                    foreignField: '_id',
                    as: "bid"
                }
            },
            {
                $unwind: '$bid'
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
                    from: 'inputs',
                    localField: 'input',
                    foreignField: '_id',
                    as: "input"
                }
            },
            {
                $unwind: '$input'
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
                $project: {
                    sellerId: "$sellers._id",
                    seller: "$sellers.fullName",
                    sellerContact: "$seller.mobile",
                    buyerId: "$buyers._id",
                    buyer: "$buyers.fullName",
                    buyerContact: "$buyers.mobile",
                    bidcode: "$bid.code",
                    bidId: "$bid._id",
                    bidStatus: "$bid.status",
                    ETD: "$bid.ETD",
                    logisticsOption: "$bid.logisticsOption",
                    status: "$status",
                    productType: "$productType",
                    type: "$type",
                    depositedOn: "$depositedOn",
                    logisticId: {
                        $ifNull: ["$bid.logisticId", "nulll"]
                    },
                    ETD: "$ETD",
                    ETA: "$ETA",
                    deliveryTime: "$deliveryTime",
                    dropAddress: "$bid.address",
                    pickupAddress: "$input.address",
                    pickupAddressCity: "$input.city",
                    pickupAddressDistrict: "$input.disctrict",
                    pickupAddressState: "$input.state",
                    pickupAddressPincode: "$input.pincode"
                }
            },
            {
                $match: qry
            }
            ], function (err, totalresults) {
                bidlist.aggregate([{
                    $lookup: {
                        from: 'bids',
                        localField: 'bidId',
                        foreignField: '_id',
                        as: "bid"
                    }
                },
                {
                    $unwind: '$bid'
                },
                {
                    $lookup: {
                        from: 'inputs',
                        localField: 'input',
                        foreignField: '_id',
                        as: "input"
                    }
                },
                {
                    $unwind: '$input'
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
                    $project: {
                        sellerId: "$sellers._id",
                        seller: "$sellers.fullName",
                        sellerContact: "$seller.mobile",
                        buyerId: "$buyers._id",
                        buyer: "$buyers.fullName",
                        buyerContact: "$buyers.mobile",
                        bidcode: "$bid.code",
                        ETD: "$bid.ETD",
                        bidId: "$bid._id",
                        bidStatus: "$bid.status",
                        logisticsOption: "$bid.logisticsOption",
                        status: "$status",
                        productType: "$productType",
                        type: "$type",
                        depositedOn: "$depositedOn",
                        logisticId: {
                            $ifNull: ["$bid.logisticId", "nulll"]
                        },
                        ETD: "$ETD",
                        ETA: "$ETA",
                        deliveryTime: "$deliveryTime",
                        dropAddress: "$bid.address",
                        pickupAddress: "$input.address",
                        pickupAddressCity: "$input.city",
                        pickupAddressDistrict: "$input.disctrict",
                        pickupAddressState: "$input.state",
                        pickupAddressPincode: "$input.pincode",
                        createdAt: "$createdAt"
                    }
                },
                {
                    $match: qry
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
                    // console.log("results",results);
                    if (err) {
                        return res.status(400).jsonx({
                            success: false,
                            error: err
                        });
                    } else {
                        async.each(results, function (bid, callback) {
                            if (bid.logisticId != "nulll") {
                                var lpqry = bid.logisticId.toString()
                                Lpartners.findOne(lpqry).then(function (lp) {
                                    bid.logisticPartner = lp.companyName
                                    callback()
                                }).fail(function (err) {
                                    callback()
                                });
                            } else {
                                callback()
                            }
                        }, function (asyncError) {
                            if (asyncError) {
                                return res.status(400).jsonx({
                                    success: false,
                                    error: asyncError
                                });
                            } else {
                                return res.status(200).jsonx({
                                    success: true,
                                    data: {
                                        bids: results,
                                        total: totalresults.length
                                    }
                                });
                            }
                        });
                    }
                });
            });
        })
    },
    logisticInputDashboardActiveListings: function (req, res) {

        var qry = {};

        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";

        if (req.param('sortBy')) {
            sortBy = req.param('sortBy')
        }

        if (req.param('logisticId')) {
            if (req.param('logisticId') == "nulll") {
                qry.logisticId = "nulll"
            } else {
                qry.logisticId = {
                    $ne: "nulll"
                }
            }
        }

        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('buyerId'))

            qry.buyerId = userId
        }

        if (req.param('sellerId') && req.param('sellerId') != undefined && req.param('sellerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('sellerId'))

            qry.sellerId = userId
        }

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }
        var sortquery = {};
        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        if (search) {
            qry.$or = [{
                bidcode: parseFloat(search)
            },
            {
                buyer: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                seller: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressPincode: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressState: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressDistrict: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressCity: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddress: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                dropAddress: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                bidQuantity: parseFloat(search)
            }
            ]
        }

        qry.bidStatus = "Accepted";
        qry.logisticsOption = 'efarmx';
        qry.productType = "input";
        qry.ETD = { $exists: true };

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pickupAddressPincode = {
                    "$in": pincode
                }
            }
        }

        console.log("qryqryqry", qry);

        Bids.native(function (err, bidlist) {
            bidlist.aggregate([
                {
                    $lookup: {
                        from: 'inputs',
                        localField: 'input',
                        foreignField: '_id',
                        as: "input"
                    }
                },
                {
                    $unwind: '$input'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'input.user',
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
                        localField: 'user',
                        foreignField: '_id',
                        as: "buyers"
                    }
                },
                {
                    $unwind: '$buyers'
                },
                {
                    $project: {
                        sellerId: "$sellers._id",
                        seller: "$sellers.fullName",
                        sellerContact: "$seller.mobile",
                        buyerId: "$buyers._id",
                        buyer: "$buyers.fullName",
                        buyerContact: "$buyers.mobile",
                        bidcode: "$code",
                        ETD: "$ETD",
                        bidStatus: "$status",
                        productType: "$productType",
                        logisticsOption: "$logisticsOption",
                        inputCode: "$input.code",
                        inputId: "$input._id",
                        logisticId: {
                            $ifNull: ["$logisticId", "nulll"]
                        },
                        ETD: "$ETD",
                        ETA: "$ETA",
                        deliveryTime: "$deliveryTime",
                        dropAddress: "$address",
                        pickupAddress: "$input.address",
                        pickupAddressCity: "$input.city",
                        pickupAddressDistrict: "$input.disctrict",
                        pickupAddressState: "$input.state",
                        pickupAddressPincode: "$input.pincode",
                    }
                },
                {
                    $match: qry
                }
            ], function (err, totalresults) {
                bidlist.aggregate([
                    {
                        $lookup: {
                            from: 'inputs',
                            localField: 'input',
                            foreignField: '_id',
                            as: "input"
                        }
                    },
                    {
                        $unwind: '$input'
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'input.user',
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
                            localField: 'user',
                            foreignField: '_id',
                            as: "buyers"
                        }
                    },
                    {
                        $unwind: '$buyers'
                    },
                    {
                        $project: {
                            sellerId: "$sellers._id",
                            seller: "$sellers.fullName",
                            sellerContact: "$seller.mobile",
                            buyerId: "$buyers._id",
                            buyer: "$buyers.fullName",
                            buyerContact: "$buyers.mobile",
                            bidcode: "$code",
                            ETD: "$ETD",
                            bidId: "$_id",
                            bidStatus: "$status",
                            productType: "$productType",
                            logisticsOption: "$logisticsOption",
                            inputCode: "$input.code",
                            inputId: "$input._id",
                            logisticId: {
                                $ifNull: ["$logisticId", "nulll"]
                            },
                            ETD: "$ETD",
                            ETA: "$ETA",
                            deliveryTime: "$deliveryTime",
                            dropAddress: "$address",
                            pickupAddress: "$input.address",
                            pickupAddressCity: "$input.city",
                            pickupAddressDistrict: "$input.disctrict",
                            pickupAddressState: "$input.state",
                            pickupAddressPincode: "$input.pincode",
                            createdAt: "$createdAt"
                        }
                    },
                    {
                        $match: qry
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
                        async.each(results, function (bid, callback) {
                            if (bid.logisticId != "nulll") {
                                var lpqry = bid.logisticId.toString()
                                Lpartners.findOne(lpqry).then(function (lp) {
                                    bid.logisticPartner = lp.companyName
                                    callback()
                                }).fail(function (err) {
                                    callback()
                                });
                            } else {
                                callback()
                            }
                        }, function (asyncError) {
                            if (asyncError) {
                                return res.status(400).jsonx({
                                    success: false,
                                    error: asyncError
                                });
                            } else {
                                return res.status(200).jsonx({
                                    success: true,
                                    data: {
                                        bids: results,
                                        total: totalresults.length
                                    }
                                });
                            }
                        });
                    }
                });
            });
        })
    },
    inputLogisticDashboardEnrouteListings: function (req, res) {

        var qry = {};

        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";

        if (req.param('sortBy')) {
            sortBy = req.param('sortBy')
        }

        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('buyerId'))

            qry.buyerId = userId
        }

        if (req.param('sellerId') && req.param('sellerId') != undefined && req.param('sellerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('sellerId'))

            qry.sellerId = userId
        }

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }
        var sortquery = {};
        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        if (search) {
            qry.$or = [{
                bidcode: parseFloat(search)
            },
            {
                buyer: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                seller: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressPincode: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressState: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressDistrict: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressCity: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddress: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                dropAddress: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                logisticPartner: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                bidQuantity: parseFloat(search)
            }
            ]
        }

        qry.bidStatus = "Dispatched"
        qry.logisticsOption = 'efarmx'
        qry.productType = "input"
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pickupAddressPincode = {
                    "$in": pincode
                }
            }
        }
        console.log("qryqry", qry)
        Bids.native(function (err, bidlist) {
            bidlist.aggregate([{
                $lookup: {
                    from: 'inputs',
                    localField: 'input',
                    foreignField: '_id',
                    as: "input"
                }
            },
            {
                $unwind: '$input'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'input.user',
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
                    localField: 'user',
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
                    localField: 'logisticId',
                    foreignField: '_id',
                    as: "lpartner"
                }
            },
            {
                $unwind: '$lpartner'
            },
            {
                $project: {
                    sellerId: "$sellers._id",
                    seller: "$sellers.fullName",
                    sellerContact: "$seller.mobile",
                    buyerId: "$buyers._id",
                    buyer: "$buyers.fullName",
                    buyerContact: "$buyers.mobile",
                    bidcode: "$code",
                    bidStatus: "$status",
                    productType: "$productType",
                    logisticsOption: "$logisticsOption",
                    inputCode: "$input.code",
                    inputId: "$input._id",
                    logisticId: "$logisticId",
                    logisticPartner: "$lpartner.companyName",
                    ETD: "$ETD",
                    ETA: "$ETA",
                    ATD: "$ATD",
                    deliveryTime: "$deliveryTime",
                    dropAddress: "$address",
                    pickupAddress: "$input.address",
                    pickupAddressCity: "$input.city",
                    pickupAddressDistrict: "$input.disctrict",
                    pickupAddressState: "$input.state",
                    pickupAddressPincode: "$input.pincode"
                }
            },
            {
                $match: qry
            }
            ], function (err, totalresults) {

                bidlist.aggregate([{
                    $lookup: {
                        from: 'inputs',
                        localField: 'input',
                        foreignField: '_id',
                        as: "input"
                    }
                },
                {
                    $unwind: '$input'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'input.user',
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
                        localField: 'user',
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
                        localField: 'logisticId',
                        foreignField: '_id',
                        as: "lpartner"
                    }
                },
                {
                    $unwind: '$lpartner'
                },
                {
                    $project: {
                        sellerId: "$sellers._id",
                        seller: "$sellers.fullName",
                        sellerContact: "$seller.mobile",
                        buyerId: "$buyers._id",
                        buyer: "$buyers.fullName",
                        buyerContact: "$buyers.mobile",
                        bidcode: "$code",
                        bidStatus: "$status",
                        productType: "$productType",
                        logisticsOption: "$logisticsOption",
                        inputCode: "$input.code",
                        inputId: "$input._id",
                        logisticId: "$logisticId",
                        logisticPartner: "$lpartner.companyName",
                        ETD: "$ETD",
                        ETA: "$ETA",
                        ATD: "$ATD",
                        deliveryTime: "$deliveryTime",
                        dropAddress: "$address",
                        pickupAddress: "$input.address",
                        pickupAddressCity: "$input.city",
                        pickupAddressDistrict: "$input.disctrict",
                        pickupAddressState: "$input.state",
                        pickupAddressPincode: "$input.pincode",
                        createdAt: "$createdAt"
                    }
                },
                {
                    $match: qry
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
                        return res.status(200).jsonx({
                            success: true,
                            data: {
                                bids: results,
                                total: totalresults.length
                            }
                        });
                    }
                });
            });
        })
    },
    inputLogisticDashboardCompletedListings: function (req, res) {

        var qry = {};

        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";

        if (req.param('sortBy')) {
            sortBy = req.param('sortBy')
        }

        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('buyerId'))

            qry.buyerId = userId
        }

        if (req.param('sellerId') && req.param('sellerId') != undefined && req.param('sellerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('sellerId'))

            qry.sellerId = userId
        }

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }
        var sortquery = {};
        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        if (search) {
            qry.$or = [{
                bidcode: parseFloat(search)
            },
            {
                buyer: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                seller: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressPincode: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressState: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressDistrict: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressCity: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddress: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                dropAddress: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                logisticPartner: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                bidQuantity: parseFloat(search)
            }
            ]
        }

        qry.$or = [{
            bidStatus: "Delivered"
        }, {
            bidStatus: "Received"
        }]
        qry.logisticsOption = 'efarmx'
        qry.productType = 'input'

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pickupAddressPincode = {
                    "$in": pincode
                }
            }
        }

        if (req.param('compare')) {
            qry.compare = parseInt(req.param('compare'));
        }

        qry.$or = [{
            $and: [{
                ATA: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                ATA: {
                    $lte: new Date(req.param('to'))
                }
            }]
        },
        {
            $and: [{
                receivedDate: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                receivedDate: {
                    $lte: new Date(req.param('to'))
                }
            }]
        }
        ]

        Bids.native(function (err, bidlist) {
            bidlist.aggregate([{
                $lookup: {
                    from: 'inputs',
                    localField: 'input',
                    foreignField: '_id',
                    as: "input"
                }
            },
            {
                $unwind: '$input'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'input.user',
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
                    localField: 'user',
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
                    localField: 'logisticId',
                    foreignField: '_id',
                    as: "lpartner"
                }
            },
            {
                $unwind: '$lpartner'
            },
            {
                $project: {
                    sellerId: "$sellers._id",
                    seller: "$sellers.fullName",
                    sellerContact: "$seller.mobile",
                    buyerId: "$buyers._id",
                    buyer: "$buyers.fullName",
                    buyerContact: "$buyers.mobile",
                    bidcode: "$code",
                    productType: '$productType',
                    bidStatus: "$status",
                    logisticsOption: "$logisticsOption",
                    inputCode: "$input.code",
                    inputId: "$input._id",
                    logisticId: "$logisticId",
                    logisticPartner: "$lpartner.companyName",
                    ETD: "$ETD",
                    ETA: "$ETA",
                    ATD: "$ATD",
                    ATA: "$ATA",
                    receivedDate: "$receivedDate",
                    deliveryTime: "$deliveryTime",
                    dropAddress: "$address",
                    pickupAddress: "$input.address",
                    pickupAddressCity: "$input.city",
                    pickupAddressDistrict: "$input.disctrict",
                    pickupAddressState: "$input.state",
                    pickupAddressPincode: "$input.pincode",
                    compare: {
                        $cmp: ["$ETA", "$ATA"]
                    }
                }
            },
            {
                $match: qry
            }
            ], function (err, totalresults) {

                bidlist.aggregate([{
                    $lookup: {
                        from: 'inputs',
                        localField: 'input',
                        foreignField: '_id',
                        as: "input"
                    }
                },
                {
                    $unwind: '$input'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'input.user',
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
                        localField: 'user',
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
                        localField: 'logisticId',
                        foreignField: '_id',
                        as: "lpartner"
                    }
                },
                {
                    $unwind: '$lpartner'
                },
                {
                    $project: {
                        sellerId: "$sellers._id",
                        seller: "$sellers.fullName",
                        sellerContact: "$seller.mobile",
                        buyerId: "$buyers._id",
                        buyer: "$buyers.fullName",
                        buyerContact: "$buyers.mobile",
                        bidcode: "$code",
                        bidStatus: "$status",
                        productType: '$productType',
                        logisticsOption: "$logisticsOption",
                        inputCode: "$input.code",
                        inputId: "$input._id",
                        logisticId: "$logisticId",
                        logisticPartner: "$lpartner.companyName",
                        ETD: "$ETD",
                        ETA: "$ETA",
                        ATD: "$ATD",
                        ATA: "$ATA",
                        receivedDate: "$receivedDate",
                        deliveryTime: "$deliveryTime",
                        dropAddress: "$address",
                        pickupAddress: "$input.address",
                        pickupAddressCity: "$input.city",
                        pickupAddressDistrict: "$input.disctrict",
                        pickupAddressState: "$input.state",
                        pickupAddressPincode: "$input.pincode",
                        compare: {
                            $cmp: ["$ETA", "$ATA"]
                        },
                        createdAt: "$createdAt"
                    }
                },
                {
                    $match: qry
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
                        return res.status(200).jsonx({
                            success: true,
                            data: {
                                bids: results,
                                total: totalresults.length
                            }
                        });
                    }
                });
            });
        })
    },
    inputFranchiseeMoneyList: function (req, res) {

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

        /*if(req.param('pincode')){
            var pincode = JSON.parse(req.param('pincode'));
            if(pincode.length > 0){
                query.pincode = {"$in" : pincode };
            }
        }*/

        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

        query.franchiseeUserId = ObjectId(req.identity.id)
        var std = new Date();
        //console.log("getTimezoneOffset",std.getTimezoneOffset(),std)
        if (req.param('status')) {
            if (req.param('status') == 'Made') {
                query.$or = [{
                    status: 'Paid'
                }, {
                    status: 'Verified'
                }]
            } else {
                query.status = req.param('status');
            }
        }
        if (req.param('from')) {
            query.$and = [{
                paymentDueDate: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                paymentDueDate: {
                    $lte: new Date(req.param('to'))
                }
            }]
        }

        // if (req.param('status') == 'Made' || req.param('status') == 'Paid' || req.param('status') == 'Verified') {
        //     query.$and = [{depositedOn: {$gte: new Date(req.param('from'))}}, {depositedOn: {$lte: new Date(req.param('to'))}}]
        // } else {
        //     query.$and = [{paymentDueDate: {$gte: new Date(req.param('from'))}}, {paymentDueDate: {$lte: new Date(req.param('to'))}}]
        // }

        if (search) {
            query.$or = [{
                bidcode: parseFloat(search)
            },
            {
                inputcode: parseFloat(search)
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
                paymentBy: {
                    $regex: search,
                    '$options': 'i'
                }
            }
            ]
        }
        let media = req.param('media');
        console.log("query is", query)
        FranchiseePayments.native(function (err, sellerpaymentlist) {
            sellerpaymentlist.aggregate([{
                $lookup: {
                    from: "inputs",
                    localField: "inputId",
                    foreignField: "_id",
                    as: "inputs"
                }
            },
            {
                $unwind: '$inputs'
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
                    from: 'users',
                    localField: 'franchiseeUserId',
                    foreignField: '_id',
                    as: "franchiseeUser"
                }
            },
            {
                $unwind: '$franchiseeUser'
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
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: (media == "order") ? 'orderedcarts' : 'bids',
                    localField: (media == "order") ? 'suborder' : 'bidId',
                    foreignField: '_id',
                    as: (media == "order") ? 'suborder' : 'bids',
                }
            },
            {
                $unwind: (media == "order") ? '$suborder' : '$bids',
            },
            {
                $lookup: {
                    from: (media == "order") ? 'orders' : 'bids',
                    localField: (media == "order") ? 'order' : 'bidId',
                    foreignField: '_id',
                    as: (media == "order") ? 'order' : 'bidDetails',
                }
            },
            {
                $unwind: (media == "order") ? '$order' : '$bidDetails',
            },
            {
                $project: {
                    id: "$_id",
                    Id: (media == "order") ? "$suborder._id" : "$bids._id",
                    code: (media == "order") ? "$suborder.code" : "$bids.code",
                    orderCode: (media == "order") ? "$order.code" : "$bidDetails.code",
                    sellerId: "$sellers._id",
                    seller: "$sellers.fullName",
                    buyerId: "$buyers._id",
                    buyer: "$buyers.fullName",
                    franchiseeUserId: "$franchiseeUser._id",
                    franchiseeUser: "$franchiseeUser.fullName",
                    inputcode: "$inputs.code",
                    depositedOn: "$depositedOn",
                    paymentDueDate: "$paymentDueDate",
                    logisticsOption: "$suborder.logisticsOption",
                    status: "$status",
                    paymentMode: "$paymentMode",
                    amount: "$amount",
                    inputId: "$inputs._id",
                    paymentBy: "$paymentUser.fullName",
                    paymentById: "$paymentUser._id",
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

                    sellerpaymentlist.aggregate([{
                        $lookup: {
                            from: "inputs",
                            localField: "inputId",
                            foreignField: "_id",
                            as: "inputs"
                        }
                    },
                    {
                        $unwind: '$inputs'
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
                            from: 'users',
                            localField: 'franchiseeUserId',
                            foreignField: '_id',
                            as: "franchiseeUser"
                        }
                    },
                    {
                        $unwind: '$franchiseeUser'
                    },
                    {
                        $lookup: {
                            from: (media == "order") ? 'orderedcarts' : 'bids',
                            localField: (media == "order") ? 'suborder' : 'bidId',
                            foreignField: '_id',
                            as: (media == "order") ? 'suborder' : 'bids',
                        }
                    },
                    {
                        $unwind: (media == "order") ? '$suborder' : '$bids',
                    },
                    {
                        $lookup: {
                            from: (media == "order") ? 'orders' : 'bids',
                            localField: (media == "order") ? 'order' : 'bidId',
                            foreignField: '_id',
                            as: (media == "order") ? 'order' : 'bidDetails',
                        }
                    },
                    {
                        $unwind: (media == "order") ? '$order' : '$bidDetails',
                    },
                    {
                        $project: {
                            id: "$_id",
                            Id: (media == "order") ? "$suborder._id" : "$bids._id",
                            code: (media == "order") ? "$suborder.code" : "$bids.code",
                            orderCode: (media == "order") ? "$order.code" : "$bidDetails.code",
                            sellerId: "$sellers._id",
                            seller: "$sellers.fullName",
                            buyerId: "$buyers._id",
                            buyer: "$buyers.fullName",
                            franchiseeUserId: "$franchiseeUser._id",
                            franchiseeUser: "$franchiseeUser.fullName",
                            logisticsOption: "$suborder.logisticsOption",
                            inputcode: "$inputs.code",
                            depositedOn: "$depositedOn",
                            paymentDueDate: "$paymentDueDate",
                            status: "$status",
                            paymentMode: "$paymentMode",
                            amount: "$amount",
                            inputId: "$inputs._id",
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
                            return res.jsonx({
                                success: true,
                                data: {
                                    franchiseepaymentlist: results,
                                    total: totalresults.length
                                },
                            });
                        }
                    });
                }
            });
        })
    },

    inputSellerMoneyStatus: (req, res) => {
        let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        let loggedIn = { sellerId: ObjectId(req.identity.id), productType: "input" };
        console.log(loggedIn);
        Sellerpayment.native(function (error, sellerpaymentlist) {
            sellerpaymentlist.aggregate([
                { $match: loggedIn },
                {
                    "$group": {
                        "_id": {
                            status: "$status",
                        },
                        "count": {
                            "$sum": "$amount"
                        }
                    },

                },
                {
                    $project: {
                        '_id': 0,
                        status: "$_id.status",
                        count: "$count",

                    }

                }

            ], function (err, results) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    let res1 = {}
                    let due = 0;
                    let refund = 0;
                    let paid = 0;
                    for (i = 0; i < results.length; i++) {
                        if (results[i].status == "Due" || results[i].status == "Overdue") {
                            //res1.status = "Due";
                            due = Number(due) + Number(results[i].count.toFixed(2));
                            res1.Due = due
                        }
                        if (results[i].status == "Paid" || results[i].status == "Verified") {
                            // res1.status = "Paid";
                            paid = Number(paid) + Number(results[i].count.toFixed(2))
                            res1.Paid = paid
                        }
                        if (results[i].status == "Refund" || results[i].status == "RefundVerified") {
                            // res1.status = "Refund";
                            refund = Number(refund) + Number(results[i].count.toFixed(2))
                            res1.Refund = refund
                        }
                    }
                    console.log(res1)
                    return res.jsonx({
                        success: true,
                        data: res1
                    });
                }
            });
        });


    },

    inputSellerMoneyListStatusWise: (req, res) => {
        let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

        let status = req.param('status')
        if (status == "Paid") {
            status = ['Paid', 'Verified']
        } else if (status == "Due") {
            status = ['Due', 'Overdue']
        }
        else if (status == "Refund") {
            status = ['Refund', 'RefundVerified']
        }
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;

        count = parseInt(count);

        let qry = {
            sellerId: req.identity.id, productType: "input", status: { "$in": status }
        };
        
        if (status != undefined && status != null) {
            Sellerpayment.count(qry).exec(function (err, total) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    Sellerpayment.find(qry)
                    .populate("suborder", {select:['code', 'paymentMethod', 'market']})
                    .populate("input", {select:['code', 'name']})
                    .skip(skipNo)
                    .limit(count)
                    .sort('createdAt DESC')
                    .then(function (result) {
                        let cartsSelectedMarkets = []
                        for (var i = 0; i < result.length; i++) {
                            // console.log(result[i].suborder.market, 'market')
                            if (result[i]["suborder"] && result[i]["suborder"]["market"]) {
                                cartsSelectedMarkets.push(ObjectId(result[i]["suborder"]["market"]))
                            }

                        }

                        cartsSelectedMarkets = _.uniq(cartsSelectedMarkets);
                        // console.log(cartsSelectedMarkets, "cartsSelectedMarkets");

                        var marketList = Market.find({ id: { "$in": cartsSelectedMarkets } }, { select: ['GM', 'name'] }).then(function (marketlist) {
                            return marketlist
                        })
                        /* var user = Users.find({ id: _.pluck(cartsSelectedMarkets, 'GM'), select: ['fullName', 'address', 'city', 'district', 'state', 'pincode'] }).then(function (marketGM) {

                             return marketGM
                         });

                         console.log(cartsSelectedMarkets, "user");*/
                        return [result, total, marketList]
                    }).spread(function (result, total, marketList) {
                        marketList = _.indexBy(marketList, 'id');
                        // console.log(marketList, '=====');
                        var i = 0;


                        result = _.map(result, function (mrt) {
                            //console.log("address", marketList[i].id);
                            if (result[i]["suborder"] && result[i]["suborder"]["market"]) {
                                mrt.suborder.franchiseeName = marketList[result[i]["suborder"]["market"]].name
                            }
                            i++
                            return mrt
                        });


                        return res.jsonx({
                            success: true,
                            data: {
                                result: result,
                                total: total
                            }
                        });
                    })
                }
            })
        }
        else {
            return res.status(400).jsonx({
                success: false,
                error: "status not defined"
            });
        }
    },
    
    inputFranchiseeMoneyStatus: (req, res) => {
        let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        let loggedIn = { franchiseeUserId: ObjectId(req.identity.id) };
        console.log(loggedIn)
        FranchiseePayments.native(function (err, franchiseepayments) {
            franchiseepayments.aggregate([
                { $match: loggedIn },
                {

                    "$group": {
                        "_id": {
                            status: "$status",
                            // seller:"$sellerId"

                        },

                        "count": {
                            "$sum": "$amount"
                        }
                    }


                },
                {
                    $project: {
                        '_id': 0,
                        status: "$_id.status",
                        count: "$count",

                    }

                }

            ], function (err, result) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    let res1 = {}
                    let due = 0;
                    let refund = 0;
                    let paid = 0;
                    for (i = 0; i < results.length; i++) {
                        if (results[i].status == "Due" || results[i].status == "Overdue") {
                            res1.status = "Due";
                            due = Number(due) + Number(results[i].count.toFixed(2));
                            res1.count = due
                        }
                        if (results[i].status == "Paid" || results[i].status == "Verified") {
                            res1.status = "Paid";
                            paid = Number(paid) + Number(results[i].count.toFixed(2))
                            res1.count = paid
                        }
                        if (results[i].status == "Refund" || results[i].status == "RefundVerified") {
                            res1.status = "Refund";
                            refund = Number(refund) + Number(results[i].count.toFixed(2))
                            res1.count = refund
                        }
                    }
                    return res.jsonx({
                        success: true,
                        data: res1,
                    });
                }
            })
        })
    },
    inputFranchiseeMoneyListStatusWise: (req, res) => {

        //let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

        if (req.param('status')) {
            let status = req.param('status')
            if (status == "Paid") {
                status = ['Paid', 'Verified']
            } else if (status == "Due") {
                status = ['Due', 'Overdue']
            }
            else if (status == "Refund") {
                status = ['Refund', 'RefundVerified']
            }
            var page = req.param('page');
            var count = req.param('count');
            var skipNo = (page - 1) * count;

            count = parseInt(count);
            let qry = { franchiseeUserId: req.identity.id, status: { "$in": status } };

            console.log(qry)
            FranchiseePayments.count(qry).exec(function (err, total) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    FranchiseePayments.find(qry)
                        .populate("suborder")
                        .populate("inputId")
                        .populate("franchiseeUserId", { select: ['fullName'] })
                        .skip(skipNo).limit(count).sort('createdAt DESC')
                        .then(function (result) {
                            return res.jsonx({
                                success: true,
                                data: {
                                    result: result,
                                    total: total
                                },
                            });
                        })
                }
            })
        } else {
            return res.status(400).jsonx({
                success: false,
                error: "status not defined"
            });
        }


    },









};