var constantObj = sails.config.constants;
var commonServiceObj = require('../services/commonService.js');
var pushService = require('../services/PushService.js');
var moment = require('moment');
/**
 * BidsController
 *
 * @description :: Server-side logic for managing bids
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */


var vm = this;

module.exports = {

    add: function (req, res) {
        return API(BidService.saveBid, req, res);
    },

    addManually: function (req, res) {
        return API(BidService.saveBidManually, req, res);
    },

    payment: function (req, res) {
        return API(BidService.paymentBid, req, res);
    },

    bidUpdate: function (req, res) {
        return API(BidService.updateBid, req, res);
    },

    initiateRefund: function (req, res) {
        return API(BidService.updateInitiate, req, res);
    },

    bidAssignETD: function (req, res) {
        return API(BidService.assignETD, req, res);
    },

    bidAssignLogistic: function (req, res) {
        return API(BidService.assignLogisticAndDeliveryTime, req, res);
    },

    bidAccept: function (req, res) {
        return API(BidService.acceptBidCrop, req, res);
    },

    createTransaction: function (req, res) {
        return API(BidService.transectionCreate, req, res);
    },

    bidDispatched: function (req, res) {
        return API(BidService.dispatchBid, req, res);
    },

    bidDelivered: function (req, res) {
        return API(BidService.deliverBid, req, res);
    },

    bidUpdatePending: function (req, res) {
        return API(BidService.updatePendingBid, req, res);
    },

    bidRecieved: function (req, res) {
        return API(BidService.receivedBid, req, res);
    },

    putBid: function (req, res) {
        return API(BidService.putBid, req, res);
    },

    getBid: function (req, res) {
        return API(BidService.getBidInfo, req, res);
    },

    getBidsHistory: function (req, res) {
        return API(BidService.bidHistory, req, res);
    },

    getBidsHistoryAll: function (req, res) {
        return API(BidService.bidHistoryByUserIdAndCropId, req, res);
    },

    getInputBidsHistoryAll: function (req, res) {
        return API(BidService.inputBidHistoryByUserIdAndCropId, req, res);
    },

    saveLogistic: function (req, res) {
        return API(BidService.logisticAdd, req, res);
    },

    uploadDocuments: function (req, res) {
        return API(BidService.uploadDocuments, req, res);
    },

    updateDeposit: function (req, res) {
        return API(BidService.updateDepositInfo, req, res);
    },

    updateSellerDeposit: function (req, res) {
        return API(BidService.updateSellerDepositInfo, req, res);
    },

    updateBuyerDeposit: function (req, res) {
        return API(BidService.updateBuyerDepositInfo, req, res);
    },

    updateLogisticPayment: function (req, res) {
        return API(BidService.updateLogisticPaymentInfo, req, res);
    },
    updateRemarkLogisticPayment: function (req, res) {
        // romy
        return API(BidService.updateLogisticPaymentRemark, req, res);
    },

    updateFranchiseDeposit: function (req, res) {
        return API(BidService.updateFranchiseeDepositInfo, req, res);
    },

    paymentApproval: function (req, res) {
        return API(BidService.bidPaymentApproval, req, res);
    },

    paymentsList: function (req, res) {
        //
        return API(BidService.paymentslist, req, res);
    },

    farmerBidPayment: function (req, res) {
        return API(BidService.farmerPayment, req, res);
    },

    getSellerPayment: function (req, res) {
        return API(BidService.getSellerPaymentInfo, req, res);
    },

    getBuyerPayment: function (req, res) {
        return API(BidService.getBuyerPaymentInfo, req, res);
    },

    getFranchiseePayment: function (req, res) {
        return API(BidService.getFranchiseePaymentInfo, req, res);
    },

    getLogisticPayment: function (req, res) {
        return API(BidService.getLogisticPaymentInfo, req, res);
    },

    farmerApprovePayment: function (req, res) {
        return API(BidService.farmerPaymentApprove, req, res);
    },

    getCompleteBidDetails: function (req, res) {
        return API(BidService.completeBidDetails, req, res)
    },
    
    inputPaymentFranchiseeListDetail: (req, res) => {

        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var search = req.param('search');
        var sortBy = req.param('sortBy');
        var query = {};

        query.productType = 'input'

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

        query.$and = [{
            createdAt: {
                $gte: new Date(req.param('from'))
            }
        }, {
            createdAt: {
                $lte: new Date(req.param('to'))
            }
        }]

        // if (req.param('status') == 'Made' || req.param('status') == 'Paid' || req.param('status') == 'Verified') {
        //     query.$and = [{depositedOn: {$gte: new Date(req.param('from'))}}, {depositedOn: {$lte: new Date(req.param('to'))}}]
        // } else {
        //     query.$and = [{paymentDueDate: {$gte: new Date(req.param('from'))}}, {paymentDueDate: {$lte: new Date(req.param('to'))}}]
        // }

        if (search) {
            query.$or = [
            {
                code: {
                    $regex: search,
                    '$options': 'i'
                },
            },
            {
                orderCode: {
                    $regex: search,
                    '$options': 'i'
                },
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
                franchiseeUser: {
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

        FranchiseePayments.native(function (err, sellerpaymentlist) {
            sellerpaymentlist.aggregate([
            {
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
                    from: 'orderedcarts',
                    localField: 'suborder',
                    foreignField: '_id',
                    as: 'suborder',
                }
            },
            {
                $unwind: '$suborder',
            },
            {
                $lookup: {
                    from: 'orders',
                    localField: 'order',
                    foreignField: '_id',
                    as: 'order',
                }
            },
            {
                $unwind: '$order',
            },
            {
                $project: {
                    id: "$_id",
                    Id: "$suborder._id",
                    code: "$suborder.code",
                    orderCode:"$order.code" ,
                    inputcode:"$inputs.code",
                    inputId:"$inputs._id",
                    sellerId: "$sellers._id",
                    seller: "$sellers.fullName",
                    sellerCode: "$sellers.sellerCode",
                    buyerId: "$buyers._id",
                    buyer: "$buyers.fullName",
                    franchiseeUserId: "$franchiseeUser._id",
                    franchiseeUser: "$franchiseeUser.fullName",
                    depositedOn: "$depositedOn",
                    paymentDueDate: "$paymentDueDate",
                    status: "$status",
                    paymentMode: "$paymentMode",
                    amount: "$amount",
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
                    productType: "$productType"

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

                    var finalResult = totalresults.slice(skipNo, skipNo + count)
                            
                    return res.jsonx({
                        success: true,
                        data: {
                            franchiseepaymentlist: finalResult,
                            total: totalresults.length
                        },
                    });                   
                }
            });
        })
    },

    updatepackagingsize: function (req, res) {
        console.log(req.param("id"));
        let id = req.param("id");
        let data = {}
        data.packagingSize = req.param("packagingSize")
        if (req.param("packaging")) {
            data.packaging = req.param("packaging")
        }
        if (req.identity.id) {
            data.packagingSelectedBy = req.identity.id
        }
        Bids.update({ id: id }, data).then(function (bid) {
            if (bid) {
                return res.status(200).jsonx({
                    success: true,
                    message: "Packaing Size updated",
                    data: bid
                });
            }
            return res.status(400).jsonx({
                success: false,
                error: "Something Wrong"
            });
        })
    },

    changeReceiveQuantityStatus: function (req, res) {
        // approveBuyerReceivedQuantity: function(req, res) {

        let data = req.body

        data.receivedQuantityStatus = "Approved"

        if (data.receivedQuantityStatus == "Approved") {
            Bids.findOne(data.id).populate("receivedQuantityApprovedBy").populate("crop").then(function (bidInfo) {
                if (bidInfo.receivedQuantityStatus == "FullReceive") {
                    return res.status(400).jsonx({
                        success: false,
                        error: "Buyer received full quantity, so approval is not required."
                    });
                } else if (bidInfo.receivedQuantityStatus == "Approved") {
                    if (bidInfo.receivedQuantityApprovedBy != undefined) {
                        return res.status(400).jsonx({
                            success: false,
                            error: "Already approved by " + bidInfo.receivedQuantityApprovedBy.fullName + " on " + commonService.longDateFormat((new Date(bidInfo.receivedQuantityApprovalTime)))
                        });
                    } else {
                        return res.status(400).jsonx({
                            success: false,
                            error: "Already approved by " + bidInfo.receivedQuantityApprovedBy.fullName
                        });
                    }
                } else {

                    if (data.receivedQuantity == undefined) {
                        return res.status(400).jsonx({
                            success: false,
                            error: "Please enter the quantity received by buyer."
                        });
                    } else if (data.receivedQuantity > bidInfo.quantity) {
                        return res.status(400).jsonx({
                            success: false,
                            error: "Received quantity can not be more than bid quantity."
                        });
                    } else if (data.receivedQuantity < bidInfo.askedReceivedQuantity) {
                        return res.status(400).jsonx({
                            success: false,
                            error: "Received quantity can not be less than what buyer claimed as quantity received by him."
                        });
                    } else {
                        bidInfo.receivedQuantity = data.receivedQuantity

                        data.receivedQuantityApprovedBy = req.identity.id
                        data.receivedQuantityApprovalTime = new Date()
                        data.receivedQuantityStatus = "Approved"

                        let newAmount = bidInfo.receivedQuantity * bidInfo.bidRate
                        let newFacilitationCharges = newAmount * (bidInfo.facilitationPercent / 100)
                        let newTaxes = newFacilitationCharges * (bidInfo.taxPercent / 100)

                        let newTotalAmount = newAmount + newFacilitationCharges + newTaxes
                        if (bidInfo.logisticsOption == "efarmx") {
                            newTotalAmount = newTotalAmount + bidInfo.logisticPayment + bidInfo.insurancePayment
                        }

                        let sellerPayDifference = bidInfo.amount - newAmount

                        data.amount = newAmount
                        data.facilitationCharges = newFacilitationCharges
                        data.taxAmount = newTaxes
                        data.totalAmount = newTotalAmount

                        data.originalAmount = bidInfo.amount
                        data.originalFacilitationCharges = bidInfo.facilitationCharges
                        data.originalTaxAmount = bidInfo.taxAmount
                        data.originalTotalAmount = bidInfo.totalAmount

                        Bids.update({ id: data.id }, data).then(function (bids) {
                            let bid = bids[0]

                            BidService.sendQuantityReceiveApprovalSMS(bid)

                            let findPendingPeyments = {}
                            findPendingPeyments.bidId = data.id
                            findPendingPeyments.$or = [{ status: "Due" }, { status: "Overdue" }]

                            let totalAmountToRefund = bid.originalTotalAmount - bid.totalAmount
                            let amountRefunded = totalAmountToRefund

                            var msg = String(bid.receivedQuantity) + " QTL quantity is approved as received for Bid Id (" + bid.code + "). Final adjustments of the payment is reflected in your payments. It will be paid soon.";

                            var notificationData = {};
                            notificationData.productId = bid.crop;
                            notificationData.crop = bid.crop;
                            notificationData.user = bid.user;
                            notificationData.sellerId = bidInfo.crop.seller;
                            notificationData.buyerId = bid.user;
                            notificationData.productType = "crops";
                            notificationData.message = msg;
                            notificationData.messageKey = "BID_RECEIVED_NOTIFICATION"
                            notificationData.readBy = [];
                            notificationData.messageTitle = "Product received quantity approval"
                            let pushnotreceiver = [bid.user, bidInfo.crop.seller]

                            let crop = bidInfo.crop

                            Bidspayment.find(findPendingPeyments).sort('createdAt DESC').then(function (payments) {
                                async.each(payments, function (payment, callback) {
                                    if (amountRefunded > 0) {
                                        let finalPayment = payment.amount - amountRefunded
                                        let paymentUpdate = {}
                                        if (finalPayment < 0 || finalPayment == 0) {
                                            finalPayment = 0
                                            paymentUpdate.paymentMode = 'AutoAdjusted'
                                            paymentUpdate.status = 'Verified'
                                            paymentUpdate.isVerified = true
                                            paymentUpdate.depositedOn = new Date()
                                        }
                                        paymentUpdate.originalAmount = payment.amount
                                        paymentUpdate.amount = finalPayment
                                        if (amountRefunded > paymentUpdate.originalAmount) {
                                            amountRefunded = amountRefunded - paymentUpdate.originalAmount
                                        } else {
                                            amountRefunded = 0
                                        }
                                        Bidspayment.update({ id: payment.id }, paymentUpdate).then(function (updatedPayments) {
                                            // let updatedPayment = updatedPayments[0]
                                            // if (updatedPayment) {
                                            //     if (amountRefunded > updatedPayment.originalAmount) {                                
                                            //         amountRefunded = amountRefunded - updatedPayment.originalAmount
                                            //     } else {
                                            //         amountRefunded = 0
                                            //     }
                                            // }

                                            callback()
                                        })
                                    } else {
                                        callback()
                                    }
                                }, function (asyncError) {
                                    if (amountRefunded > 0) {
                                        var refundPayment = {};
                                        refundPayment.cropId = bid.crop;
                                        refundPayment.bidId = bid.id;
                                        refundPayment.sellerId = bidInfo.crop.seller;
                                        refundPayment.buyerId = bid.user;
                                        refundPayment.amount = amountRefunded;
                                        refundPayment.type = "Final";
                                        refundPayment.status = 'Refund';
                                        refundPayment.name = "Refund"
                                        let today = new Date()
                                        refundPayment.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString()
                                        // refundPayment.paymentDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString()
                                        Bidspayment.create(refundPayment).then(function (refundPayment) {
                                            let findPendingSellerPeyments = {}
                                            findPendingSellerPeyments.bidId = data.id
                                            // findPendingSellerPeyments.$or = [{ status: "Due" }, { status: "Overdue" }]
                                            findPendingSellerPeyments.$or = [{ status: "Due" }, { status: "Overdue" }, { status: "Paid" }, { status: "Verified" }]


                                            let totalAmountToRefund = sellerPayDifference//bid.originalTotalAmount - bid.totalAmount
                                            var selleramountAdjusted = sellerPayDifference
                                            Sellerpayment.find(findPendingSellerPeyments).sort('createdAt DESC').then(function (allspayments) {


                                                let sellerPaymentsGrouped = _.groupBy(allspayments, 'sellerId');
                                                let totalPayment = 0

                                                let spayments = []
                                                let shareOfEachSeller = {}
                                                let baseCropOfEachSeller = {}


                                                for (var i = 0; i < allspayments.length; i++) {
                                                    let sp = allspayments[i]
                                                    // if (sp.status == 'Due' || sp.status == 'Paid' || sp.status == 'Verified' || sp.status == 'Overdue') {
                                                    totalPayment = totalPayment + sp.amount
                                                    // } else {
                                                    //     takeSPayments = takeSPayments + sp.amount
                                                    // }

                                                    if (sp.status == 'Due' || sp.status == 'Overdue') {
                                                        spayments.push(sp)
                                                    }
                                                    if (shareOfEachSeller[sp.sellerId] == undefined) {
                                                        shareOfEachSeller[sp.sellerId] = sp.amount
                                                    } else {
                                                        shareOfEachSeller[sp.sellerId] = shareOfEachSeller[sp.sellerId] + sp.amount
                                                    }
                                                    if (sp.baseCropId) {
                                                        baseCropOfEachSeller[sp.sellerId] = sp.baseCropId
                                                    }
                                                }

                                                let toBePaidSellerPaymentsGrouped = _.groupBy(spayments, 'sellerId');


                                                let sellerWiseAmountToBeRefunded = {}
                                                let sellerWiseAmountAdjusted = {}

                                                Object.keys(shareOfEachSeller).forEach((key, index) => {
                                                    sellerWiseAmountToBeRefunded[key] = (shareOfEachSeller[key] * totalAmountToRefund) / totalPayment
                                                    sellerWiseAmountAdjusted[key] = (shareOfEachSeller[key] * totalAmountToRefund) / totalPayment
                                                })
                                                // async.each(spayments, function (spayment, callback) {
                                                async.each(Object.keys(sellerWiseAmountToBeRefunded), function (sellerId, cb) {
                                                    async.each(toBePaidSellerPaymentsGrouped[sellerId], function (spayment, callback) {
                                                        if (sellerWiseAmountAdjusted[sellerId] > 0) {
                                                            let finalPayment = spayment.amount - sellerWiseAmountAdjusted[sellerId]
                                                            let paymentUpdate = {}
                                                            if (finalPayment < 0 || finalPayment == 0) {
                                                                finalPayment = 0
                                                                paymentUpdate.paymentMode = 'AutoAdjusted'
                                                                paymentUpdate.status = 'Verified'
                                                                paymentUpdate.isVerified = true
                                                                paymentUpdate.depositedOn = new Date()
                                                            }
                                                            paymentUpdate.originalAmount = spayment.amount
                                                            paymentUpdate.amount = finalPayment
                                                            if (sellerWiseAmountAdjusted[sellerId] > paymentUpdate.originalAmount) {
                                                                sellerWiseAmountAdjusted[sellerId] = sellerWiseAmountAdjusted[sellerId] - paymentUpdate.originalAmount
                                                            } else {
                                                                sellerWiseAmountAdjusted[sellerId] = 0
                                                            }


                                                            Sellerpayment.update({ id: spayment.id }, paymentUpdate).then(function (updatedPayments) {
                                                                // let updatedPayment = updatedPayments[0]

                                                                // if (updatedPayment) {
                                                                //     if (selleramountAdjusted > updatedPayment.originalAmount) {                                
                                                                //         selleramountAdjusted = selleramountAdjusted - updatedPayment.originalAmount
                                                                //     } else {
                                                                //         selleramountAdjusted = 0
                                                                //     }
                                                                // }

                                                                callback()
                                                            })
                                                        } else {
                                                            callback()
                                                        }
                                                    }, function (asyncError) {
                                                        if (sellerWiseAmountAdjusted[sellerId] > 0) {
                                                            let today = new Date()
                                                            var refundPayment = {
                                                                cropId: bid.crop,
                                                                bidId: bid.id,
                                                                sellerId: sellerId,
                                                                buyerId: bid.user,
                                                                depositLabel: "Final",
                                                                pincode: bidInfo.crop.pincode,
                                                                paymentDueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
                                                                type: "Final",
                                                                status: "Refund",
                                                                name: "Refund",
                                                                amount: sellerWiseAmountAdjusted[sellerId]
                                                            };
                                                            if (baseCropOfEachSeller[sellerId]) {
                                                                refundPayment.baseCropId = baseCropOfEachSeller[sellerId]
                                                            }

                                                            Sellerpayment.create(refundPayment).then(function (refundPayment) {
                                                                cb()
                                                            })
                                                        } else {
                                                            cb()
                                                        }
                                                    })
                                                }, function (asyncError) {
                                                    FranchiseePayments.findOne({ bidId: bid.id }).then(function (fp) {
                                                        if (fp) {
                                                            pushnotreceiver.push(fp.franchiseeUserId)
                                                            let newFPAmount = parseFloat(bid.amount) * parseFloat(bidInfo.crop.franchiseePercentage / 100)
                                                            if (fp.status == 'Paid' || fp.status == 'Verified') {
                                                                let fprefundpayment = fp
                                                                delete fprefundpayment.id
                                                                fprefundpayment.status = "Refund"
                                                                fprefundpayment.amount = fp.amount - newFPAmount
                                                                FranchiseePayments.create(fprefundpayment).then(function (fpUpdated) {
                                                                    Notifications.create(notificationData).then(function (notificationResponse) {
                                                                        if (notificationResponse) {
                                                                            commonService.notifyUsersFromNotification(notificationResponse, crop)
                                                                            pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                                                        }

                                                                        return res.jsonx({
                                                                            success: true,
                                                                            code: 200,
                                                                            data: {
                                                                                message: "Successfully approved received quantity and payments are adjusted."
                                                                            }
                                                                        });
                                                                    })
                                                                })
                                                            } else {
                                                                let fpupdate = {}
                                                                fpupdate.amount = newFPAmount
                                                                fpupdate.originalAmount = fp.amount
                                                                FranchiseePayments.update({ id: fp.id }, fpupdate).then(function (fpUpdated) {
                                                                    Notifications.create(notificationData).then(function (notificationResponse) {
                                                                        if (notificationResponse) {
                                                                            commonService.notifyUsersFromNotification(notificationResponse, crop)
                                                                            pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                                                        }

                                                                        return res.jsonx({
                                                                            success: true,
                                                                            code: 200,
                                                                            data: {
                                                                                message: "Successfully approved received quantity and payments are adjusted."
                                                                            }
                                                                        });
                                                                    })
                                                                })
                                                            }
                                                        } else {
                                                            Notifications.create(notificationData).then(function (notificationResponse) {
                                                                if (notificationResponse) {
                                                                    commonService.notifyUsersFromNotification(notificationResponse, crop)
                                                                    pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                                                }

                                                                return res.jsonx({
                                                                    success: true,
                                                                    code: 200,
                                                                    data: {
                                                                        message: "Successfully approved received quantity and payments are adjusted."
                                                                    }
                                                                });
                                                            })
                                                        }
                                                    }).fail(function (er) {
                                                        Notifications.create(notificationData).then(function (notificationResponse) {
                                                            if (notificationResponse) {
                                                                commonService.notifyUsersFromNotification(notificationResponse, crop)
                                                                pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                                            }

                                                            return res.jsonx({
                                                                success: true,
                                                                code: 200,
                                                                data: {
                                                                    message: "Successfully approved received quantity and payments are adjusted."
                                                                }
                                                            });
                                                        })
                                                    })
                                                })
                                                /*} else {
                                                    FranchiseePayments.findOne({ bidId: bid.id }).then(function (fp) {
                                                        if (fp) {
                                                            let newFPAmount = parseFloat(bid.amount) * parseFloat(bidInfo.crop.franchiseePercentage / 100)
                                                            if (fp.status == 'Paid' || fp.status == 'Verified') {
                                                                let fprefundpayment = fp
                                                                delete fprefundpayment.id
                                                                fprefundpayment.status = "Refund"
                                                                fprefundpayment.amount = fp.amount - newFPAmount
                                                                FranchiseePayments.create(fprefundpayment).then(function (fpUpdated) {
                                                                    Notifications.create(notificationData).then(function (notificationResponse) {
                                                                        if (notificationResponse) {
                                                                            commonService.notifyUsersFromNotification(notificationResponse, crop)
                                                                        }

                                                                        return res.jsonx({
                                                                            success: true,
                                                                            code: 200,
                                                                            data: {
                                                                                message: "Successfully approved received quantity and payments are adjusted."
                                                                            }
                                                                        });
                                                                    })
                                                                })
                                                            } else {
                                                                let fpupdate = {}
                                                                fpupdate.amount = newFPAmount
                                                                fpupdate.originalAmount = fp.amount
                                                                FranchiseePayments.update({ id: fp.id }, fpupdate).then(function (fpUpdated) {
                                                                    Notifications.create(notificationData).then(function (notificationResponse) {
                                                                        if (notificationResponse) {
                                                                            commonService.notifyUsersFromNotification(notificationResponse, crop)
                                                                        }

                                                                        return res.jsonx({
                                                                            success: true,
                                                                            code: 200,
                                                                            data: {
                                                                                message: "Successfully approved received quantity and payments are adjusted."
                                                                            }
                                                                        });
                                                                    })
                                                                })
                                                            }
                                                        } else {
                                                            Notifications.create(notificationData).then(function (notificationResponse) {
                                                                if (notificationResponse) {
                                                                    commonService.notifyUsersFromNotification(notificationResponse, crop)
                                                                }

                                                                return res.jsonx({
                                                                    success: true,
                                                                    code: 200,
                                                                    data: {
                                                                        message: "Successfully approved received quantity and payments are adjusted."
                                                                    }
                                                                });
                                                            })
                                                        }
                                                    }).fail(function (er) {
                                                        Notifications.create(notificationData).then(function (notificationResponse) {
                                                            if (notificationResponse) {
                                                                commonService.notifyUsersFromNotification(notificationResponse, crop)
                                                            }

                                                            return res.jsonx({
                                                                success: true,
                                                                code: 200,
                                                                data: {
                                                                    message: "Successfully approved received quantity and payments are adjusted."
                                                                }
                                                            });
                                                        })
                                                    })
                                                }*/
                                            });
                                        })
                                    } else {
                                        let findPendingSellerPeyments = {}
                                        findPendingSellerPeyments.bidId = data.id
                                        // findPendingSellerPeyments.$or = [{ status: "Due" }, { status: "Overdue" }]
                                        findPendingSellerPeyments.$or = [{ status: "Due" }, { status: "Overdue" }, { status: "Paid" }, { status: "Verified" }]

                                        let totalAmountToRefund = sellerPayDifference//bid.originalTotalAmount - bid.totalAmount
                                        var selleramountAdjusted = sellerPayDifference
                                        Sellerpayment.find(findPendingSellerPeyments).sort('createdAt DESC').then(function (allspayments) {


                                            let sellerPaymentsGrouped = _.groupBy(allspayments, 'sellerId');
                                            let totalPayment = 0

                                            let spayments = []
                                            let shareOfEachSeller = {}
                                            let baseCropOfEachSeller = {}

                                            for (var i = 0; i < allspayments.length; i++) {
                                                let sp = allspayments[i]
                                                // if (sp.status == 'Due' || sp.status == 'Paid' || sp.status == 'Verified' || sp.status == 'Overdue') {
                                                totalPayment = totalPayment + sp.amount
                                                // } else {
                                                //     takeSPayments = takeSPayments + sp.amount
                                                // }

                                                if (sp.status == 'Due' || sp.status == 'Overdue') {
                                                    spayments.push(sp)
                                                }
                                                if (shareOfEachSeller[sp.sellerId] == undefined) {
                                                    shareOfEachSeller[sp.sellerId] = sp.amount
                                                } else {
                                                    shareOfEachSeller[sp.sellerId] = shareOfEachSeller[sp.sellerId] + sp.amount
                                                }
                                                if (sp.baseCropId) {
                                                    baseCropOfEachSeller[sp.sellerId] = sp.baseCropId
                                                }
                                            }

                                            let toBePaidSellerPaymentsGrouped = _.groupBy(spayments, 'sellerId');


                                            let sellerWiseAmountToBeRefunded = {}
                                            let sellerWiseAmountAdjusted = {}

                                            Object.keys(shareOfEachSeller).forEach((key, index) => {
                                                sellerWiseAmountToBeRefunded[key] = (shareOfEachSeller[key] * totalAmountToRefund) / totalPayment
                                                sellerWiseAmountAdjusted[key] = (shareOfEachSeller[key] * totalAmountToRefund) / totalPayment
                                            })
                                            // async.each(spayments, function (spayment, callback) {

                                            async.each(Object.keys(sellerWiseAmountToBeRefunded), function (sellerId, cb) {

                                                async.each(toBePaidSellerPaymentsGrouped[sellerId], function (spayment, callback) {
                                                    if (sellerWiseAmountAdjusted[sellerId] > 0) {
                                                        let finalPayment = spayment.amount - sellerWiseAmountAdjusted[sellerId]
                                                        let paymentUpdate = {}
                                                        if (finalPayment < 0 || finalPayment == 0) {
                                                            finalPayment = 0
                                                            paymentUpdate.paymentMode = 'AutoAdjusted'
                                                            paymentUpdate.status = 'Verified'
                                                            paymentUpdate.isVerified = true
                                                            paymentUpdate.depositedOn = new Date()
                                                        }
                                                        paymentUpdate.originalAmount = spayment.amount
                                                        paymentUpdate.amount = finalPayment
                                                        if (sellerWiseAmountAdjusted[sellerId] > paymentUpdate.originalAmount) {
                                                            sellerWiseAmountAdjusted[sellerId] = sellerWiseAmountAdjusted[sellerId] - paymentUpdate.originalAmount
                                                        } else {
                                                            sellerWiseAmountAdjusted[sellerId] = 0
                                                        }


                                                        Sellerpayment.update({ id: spayment.id }, paymentUpdate).then(function (updatedPayments) {
                                                            // let updatedPayment = updatedPayments[0]

                                                            // if (updatedPayment) {
                                                            //     if (selleramountAdjusted > updatedPayment.originalAmount) {                                
                                                            //         selleramountAdjusted = selleramountAdjusted - updatedPayment.originalAmount
                                                            //     } else {
                                                            //         selleramountAdjusted = 0
                                                            //     }
                                                            // }
                                                            callback()
                                                        })
                                                    } else {
                                                        callback()
                                                    }
                                                }, function (asyncError) {
                                                    if (sellerWiseAmountAdjusted[sellerId] > 0) {
                                                        let today = new Date()
                                                        var refundPayment = {
                                                            cropId: bid.crop,
                                                            bidId: bid.id,
                                                            sellerId: sellerId,
                                                            buyerId: bid.user,
                                                            depositLabel: "Final",
                                                            pincode: bidInfo.crop.pincode,
                                                            paymentDueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
                                                            type: "Final",
                                                            status: "Refund",
                                                            name: "Refund",
                                                            amount: sellerWiseAmountAdjusted[sellerId]
                                                        };
                                                        if (baseCropOfEachSeller[sellerId]) {
                                                            refundPayment.baseCropId = baseCropOfEachSeller[sellerId]
                                                        }
                                                        Sellerpayment.create(refundPayment).then(function (refundPayment) {
                                                            cb()
                                                        })
                                                    } else {
                                                        cb()
                                                    }
                                                })
                                            }, function (asyncError) {
                                                FranchiseePayments.findOne({ bidId: bid.id }).then(function (fp) {
                                                    if (fp) {
                                                        pushnotreceiver.push(fp.franchiseeUserId)
                                                        let newFPAmount = parseFloat(bid.amount) * parseFloat(bidInfo.crop.franchiseePercentage / 100)
                                                        if (fp.status == 'Paid' || fp.status == 'Verified') {
                                                            let fprefundpayment = fp
                                                            delete fprefundpayment.id
                                                            fprefundpayment.status = "Refund"
                                                            fprefundpayment.amount = fp.amount - newFPAmount
                                                            FranchiseePayments.create(fprefundpayment).then(function (fpUpdated) {
                                                                Notifications.create(notificationData).then(function (notificationResponse) {
                                                                    if (notificationResponse) {
                                                                        commonService.notifyUsersFromNotification(notificationResponse, crop)
                                                                        pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                                                    }

                                                                    return res.jsonx({
                                                                        success: true,
                                                                        code: 200,
                                                                        data: {
                                                                            message: "Successfully approved received quantity and payments are adjusted."
                                                                        }
                                                                    });
                                                                })
                                                            })
                                                        } else {
                                                            let fpupdate = {}
                                                            fpupdate.amount = newFPAmount
                                                            fpupdate.originalAmount = fp.amount
                                                            FranchiseePayments.update({ id: fp.id }, fpupdate).then(function (fpUpdated) {
                                                                Notifications.create(notificationData).then(function (notificationResponse) {
                                                                    if (notificationResponse) {
                                                                        commonService.notifyUsersFromNotification(notificationResponse, crop)
                                                                        pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                                                    }

                                                                    return res.jsonx({
                                                                        success: true,
                                                                        code: 200,
                                                                        data: {
                                                                            message: "Successfully approved received quantity and payments are adjusted."
                                                                        }
                                                                    });
                                                                })
                                                            })
                                                        }
                                                    } else {
                                                        Notifications.create(notificationData).then(function (notificationResponse) {
                                                            if (notificationResponse) {
                                                                commonService.notifyUsersFromNotification(notificationResponse, crop)
                                                                pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                                            }

                                                            return res.jsonx({
                                                                success: true,
                                                                code: 200,
                                                                data: {
                                                                    message: "Successfully approved received quantity and payments are adjusted."
                                                                }
                                                            });
                                                        })
                                                    }
                                                }).fail(function (er) {
                                                    Notifications.create(notificationData).then(function (notificationResponse) {
                                                        if (notificationResponse) {
                                                            commonService.notifyUsersFromNotification(notificationResponse, crop)
                                                            pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                                        }

                                                        return res.jsonx({
                                                            success: true,
                                                            code: 200,
                                                            data: {
                                                                message: "Successfully approved received quantity and payments are adjusted."
                                                            }
                                                        });
                                                    })
                                                })
                                            })
                                        });
                                    }
                                });
                            })
                        })
                    }
                }
            }).fail(function (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            });
        } else if (data.receivedQuantityStatus == "Unapproved") {
            Bids.findOne(data.id).populate("receivedQuantityApprovedBy").populate("crop").then(function (bidInfo) {
                if (bidInfo.receivedQuantityStatus == "FullReceive") {
                    return res.status(400).jsonx({
                        success: false,
                        error: "Buyer received full quantity, so approval is not required."
                    });
                } else if (bidInfo.receivedQuantityStatus == "Unapproved") {
                    if (bidInfo.receivedQuantityApprovedBy != undefined) {
                        return res.status(400).jsonx({
                            success: false,
                            error: "Already unapproved by " + bidInfo.receivedQuantityApprovedBy.fullName + " on " + commonService.longDateFormat((new Date(bidInfo.receivedQuantityApprovalTime)))
                        });
                    } else {
                        return res.status(400).jsonx({
                            success: false,
                            error: "Already unapproved by " + bidInfo.receivedQuantityApprovedBy.fullName
                        });
                    }
                } else if (bidInfo.receivedQuantityStatus == "Approved") {

                    if (bidInfo.receivedQuantityApprovedBy != undefined) {
                        return res.status(400).jsonx({
                            success: false,
                            error: "Already approved by " + bidInfo.receivedQuantityApprovedBy.fullName + " on " + commonService.longDateFormat((new Date(bidInfo.receivedQuantityApprovalTime)))
                        });
                    } else {
                        return res.status(400).jsonx({
                            success: false,
                            error: "Already approved by " + bidInfo.receivedQuantityApprovedBy.fullName
                        });
                    }
                    // let previousAdjustedAmount = bidInfo.originalTotalAmount - bidInfo.totalAmount

                    // data.amount = bidInfo.originalAmount
                    // data.facilitationCharges = bidInfo.originalFacilitationCharges
                    // data.taxAmount = bidInfo.originalTaxAmount
                    // data.totalAmount = bidInfo.originalTotalAmount

                    // data.originalAmount = null
                    // data.originalFacilitationCharges = null
                    // data.originalTaxAmount = null
                    // data.originalTotalAmount = null

                    // Bids.update({id:data.id}, data).then(function(bids) {
                    //     let bid = bids[0]
                    //     let findPendingPeyments = {}
                    //     findPendingPeyments.bidId = data.id
                    //     findPendingPeyments.type = {$ne:'Earnest'}

                    // })
                } else {
                    data.receivedQuantityApprovedBy = req.identity.id
                    data.receivedQuantityApprovalTime = new Date()
                    data.receivedQuantityStatus = "Unapproved"
                    data.receivedQuantityUnapprovedReason = data.receivedQuantityApprovedReason
                    delete data.receivedQuantityApprovedReason

                    Bids.update({ id: data.id }, data).then(function (bids) {
                        return res.jsonx({
                            success: true,
                            data: {
                                message: "Received quantity is unapproved by you.",
                                key: 'SUCCESSFULLY_VERIFIED'
                            },
                        });
                    })
                }
            }).fail(function (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            });
        } else {
            return res.status(400).jsonx({
                success: false,
                error: "No status received. Either approve or unapprove the received quantity"
            });
        }
    },

    unapproveBuyerReceivedQuantity: function (req, res) {
        let data = req.body

        Bids.findOne(data.id).populate("receivedQuantityApprovedBy").populate("crop").then(function (bidInfo) {
            if (receivedQuantityStatus == "FullReceive") {
                return res.status(400).jsonx({
                    success: false,
                    error: "Buyer received full quantity, so approval is not required."
                });
            } else if (receivedQuantityStatus == "Unapproved") {
                if (bidInfo.receivedQuantityApprovedBy != undefined) {
                    return res.status(400).jsonx({
                        success: false,
                        error: "Already unapproved by " + bidInfo.receivedQuantityApprovedBy.fullName + " on " + commonService.longDateFormat((new Date(bidInfo.receivedQuantityApprovalTime)))
                    });
                } else {
                    return res.status(400).jsonx({
                        success: false,
                        error: "Already unapproved by " + bidInfo.receivedQuantityApprovedBy.fullName
                    });
                }
            } else if (receivedQuantityStatus == "Approved") {

                if (bidInfo.receivedQuantityApprovedBy != undefined) {
                    return res.status(400).jsonx({
                        success: false,
                        error: "Already approved by " + bidInfo.receivedQuantityApprovedBy.fullName + " on " + commonService.longDateFormat((new Date(bidInfo.receivedQuantityApprovalTime)))
                    });
                } else {
                    return res.status(400).jsonx({
                        success: false,
                        error: "Already approved by " + bidInfo.receivedQuantityApprovedBy.fullName
                    });
                }
                // let previousAdjustedAmount = bidInfo.originalTotalAmount - bidInfo.totalAmount

                // data.amount = bidInfo.originalAmount
                // data.facilitationCharges = bidInfo.originalFacilitationCharges
                // data.taxAmount = bidInfo.originalTaxAmount
                // data.totalAmount = bidInfo.originalTotalAmount

                // data.originalAmount = null
                // data.originalFacilitationCharges = null
                // data.originalTaxAmount = null
                // data.originalTotalAmount = null

                // Bids.update({id:data.id}, data).then(function(bids) {
                //     let bid = bids[0]
                //     let findPendingPeyments = {}
                //     findPendingPeyments.bidId = data.id
                //     findPendingPeyments.type = {$ne:'Earnest'}

                // })
            } else {
                data.receivedQuantityApprovedBy = req.identity.id
                data.receivedQuantityApprovalTime = new Date()
                data.receivedQuantityStatus = "Unapproved"

                Bids.update({ id: data.id }, data).then(function (bids) {
                    return res.jsonx({
                        success: true,
                        data: {
                            message: "Received quantity is unapproved by you.",
                            key: 'SUCCESSFULLY_VERIFIED'
                        },
                    });
                })
            }
        }).fail(function (err) {
            return res.status(400).jsonx({
                success: false,
                error: err
            });
        });
    },

    verifyPayments: function (req, res) {

        var ids = [];
        //if(req.body.id) ids = JSON.parse(req.body.id);
        if (req.body.id) {

            ids = req.body.id;
        }

        // console.log(ids);
        // return
        var query = {};
        query.isVerified = true;
        query.status = "Verified";
        query.verifiedBy = req.identity.id
        query.verifyDate = new Date()
        let code = commonServiceObj.getUniqueCode();

        async.each(ids, function (paymentid, callback) {

            Bidspayment.findOne({
                id: paymentid
            }).populate("bidId").populate("suborder").populate("landInterestId").then(function (bidspaymentDetail) {

                if (bidspaymentDetail.status != 'Verified' && bidspaymentDetail.transactionId == undefined) {

                    Bidspayment.update({
                        id: paymentid
                    }, query).then(function (bidpaymentStatus) {

                        //     return false ;
                        // console.log("fffffffffff") ;
                        if (bidpaymentStatus) {

                            var transactionData = {};
                            transactionData.buyerId = bidspaymentDetail.buyerId;
                            transactionData.sellerId = bidspaymentDetail.sellerId;
                            if (bidspaymentDetail.bidId) {
                                transactionData.bidId = bidspaymentDetail.bidId.id;
                                transactionData.crop = bidspaymentDetail.cropId;
                            } else if (bidspaymentDetail.suborder) {
                                transactionData.suborder = bidspaymentDetail.suborder.id;
                                transactionData.order = bidspaymentDetail.suborder.order;
                                transactionData.crop = bidspaymentDetail.cropId;
                            } else if (bidspaymentDetail.landInterestId) {
                                transactionData.landInterestId = bidspaymentDetail.landInterestId.id;
                                transactionData.land = bidspaymentDetail.landId;
                            }

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

                            Transactions.create(transactionData).then(function (newTransactionEntry) {
                                if (newTransactionEntry) {
                                    qry = {};
                                    qry.transactionId = newTransactionEntry.id
                                    Bidspayment.update({
                                        id: paymentid
                                    }, qry).then(function (bidpaymentStatus) {
                                        var msg = ''
                                        if (bidspaymentDetail.bidId != undefined) {
                                            msg = bidspaymentDetail.name + " consisting of ₹ " + bidspaymentDetail.amount + "for bid id (" + bidspaymentDetail.bidId.code + ") paid on via (" + bidspaymentDetail.paymentMode + ") is verified.";
                                        } else if (bidspaymentDetail.suborder != undefined) {
                                            msg = bidspaymentDetail.name + " consisting of ₹ " + bidspaymentDetail.amount + "for order id (" + bidspaymentDetail.suborder.code + ") paid on via (" + bidspaymentDetail.paymentMode + ") is verified.";
                                        } else if (bidspaymentDetail.landInterestId != undefined) {
                                            msg = bidspaymentDetail.name + " consisting of ₹ " + bidspaymentDetail.amount + "for land deal id (" + bidspaymentDetail.landInterestId.code + ") paid on via (" + bidspaymentDetail.paymentMode + ") is verified.";
                                        }

                                        var notificationData = {};
                                        notificationData.crop = bidspaymentDetail.cropId;
                                        notificationData.land = bidspaymentDetail.landId;
                                        notificationData.user = bidspaymentDetail.buyerId;
                                        notificationData.buyerId = bidspaymentDetail.buyerId;
                                        if (bidspaymentDetail.landInterestId != undefined) {
                                            notificationData.productType = "lands";
                                            notificationData.productId = bidspaymentDetail.landId;
                                        } else {
                                            notificationData.productType = "crops";
                                            notificationData.productId = bidspaymentDetail.cropId;
                                        }

                                        notificationData.message = msg;
                                        notificationData.messageKey = "PAYMENT_VERIFIED_NOTIFICATION"
                                        notificationData.readBy = [];
                                        notificationData.messageTitle = "Payment verified"
                                        let pushnotreceiver = [bidspaymentDetail.buyerId]

                                        Notifications.create(notificationData).then(function (notificationResponse) {
                                            if (notificationResponse) {
                                                commonService.notifyUsersFromNotification(notificationResponse, undefined)
                                                pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                            }

                                            if (bidspaymentDetail.landInterestId != undefined) {
                                                if (bidspaymentDetail.landInterestId.status == 'canceled' || bidspaymentDetail.landInterestId.status == 'failed' || bidspaymentDetail.landInterestId.status == 'transferred') {
                                                    callback()
                                                } else {
                                                    let landpaymentfinderqry = {}
                                                    landpaymentfinderqry.$or = [{ status: 'Paid' }, { status: 'Due' }, { status: 'Overdue' }]
                                                    landpaymentfinderqry.landInterestId = bidspaymentDetail.landInterestId.id
                                                    Bidspayment.count(landpaymentfinderqry).then(function (pendinpaymentscount) {
                                                        if (pendinpaymentscount > 0) {
                                                            callback()
                                                        } else {
                                                            let landId = bidspaymentDetail.landInterestId.landId;

                                                            Lands.findOne({ id: landId }).then(function (landInfo) {
                                                                var sellerPayments = [];
                                                                var sequenceNumber = 1;

                                                                var days = 0
                                                                days = days + landInfo.sellerUpfrontDays

                                                                let upfrontObject = {
                                                                    landId: landInfo.id,
                                                                    baseLandId: landInfo.id,
                                                                    landInterestId: bidspaymentDetail.landInterestId.id,
                                                                    sellerId: landInfo.user,
                                                                    buyerId: bidspaymentDetail.landInterestId.buyerId,
                                                                    depositPercentage: landInfo.sellerUpfrontPercentage,
                                                                    depositLabel: "Upfront",
                                                                    depositDays: landInfo.sellerUpfrontDays,
                                                                    pincode: landInfo.pincode,
                                                                    paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
                                                                    type: "Upfront",
                                                                    status: "Due",
                                                                    productType: 'land',
                                                                    sequenceNumber: sequenceNumber,
                                                                    paymentMedia: 'landinterest',
                                                                    amount: parseFloat(bidspaymentDetail.landInterestId.sellerAmountByFarmX)
                                                                }
                                                                sellerPayments.push(upfrontObject)

                                                                for (var i = 0; i < sellerPayments.length; i++) {
                                                                    if (sellerPayments[i].amount < 1) {
                                                                        sellerPayments[i].amount = 0
                                                                        sellerPayments[i].paymentMode = 'AutoAdjusted'
                                                                        sellerPayments[i].status = 'Verified'
                                                                        sellerPayments[i].isVerified = true
                                                                        sellerPayments[i].depositedOn = new Date()
                                                                    }
                                                                }
                                                                Sellerpayment.create(sellerPayments).then(function (responseSellerPayment) {
                                                                    if (responseSellerPayment) {
                                                                        let fndQry1 = {}
                                                                        fndQry1.id = bidspaymentDetail.landInterestId.id;
                                                                        let updateData = {};
                                                                        updateData.status = 'payments_done'
                                                                        // console.log('=====', updateData);
                                                                        Landinterests.update(fndQry1, updateData).then(function (lndInterestUpdae) {

                                                                            Lands.update({ id: landInfo.id }, { availableArea: landInfo.availableArea - bidspaymentDetail.landInterestId.area }).then(function (updatedland) {

                                                                                var msg = "All payments of land deal id (" + bidspaymentDetail.landInterestId.code + ") are done.";

                                                                                var notificationData = {};
                                                                                notificationData.land = bidspaymentDetail.landId;
                                                                                notificationData.user = bidspaymentDetail.landInterestId.franchiseeId;
                                                                                notificationData.productType = "lands";
                                                                                notificationData.productId = bidspaymentDetail.landId;

                                                                                notificationData.message = msg;
                                                                                notificationData.messageKey = "ALL_PAYMENTS_DONE_NOTIFICATION"
                                                                                notificationData.readBy = [];
                                                                                notificationData.messageTitle = "Payments done"

                                                                                let pushnotreceiver = [bidspaymentDetail.landInterestId.franchiseeId, bidspaymentDetail.landInterestId.coordinator]

                                                                                Notifications.create(notificationData).then(function (notificationResponse) {
                                                                                    if (notificationResponse) {
                                                                                        commonService.notifyUsersFromNotification(notificationResponse, undefined)
                                                                                        pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                                                                    }

                                                                                    callback()
                                                                                })
                                                                            })
                                                                        })
                                                                    }
                                                                }).fail(function (error) {
                                                                    console.log(error)
                                                                    return (error)
                                                                })
                                                            })
                                                        }
                                                    })
                                                }
                                            } else {
                                                callback()
                                            }

                                        }).fail(function (err) {
                                            callback()
                                        })
                                    })
                                } else {
                                    callback()
                                }
                            });
                        }
                    })
                } else {
                    callback()
                }
            })
        }, function (error) {
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

    verifySellerPayments: function (req, res) {

        var ids = [];
        //if(req.body.id) ids = JSON.parse(req.body.id);
        if (req.body.id) {

            ids = req.body.id;
        }

        var query = {};
        query.isVerified = true;
        query.status = "Verified";
        query.verifyDate = new Date()
        code = commonServiceObj.getUniqueCode();

        async.each(ids, function (paymentid, callback) {


            Sellerpayment.findOne({
                id: paymentid
            }).then(function (sellerpaymentDetail) {

                if (sellerpaymentDetail.status != 'Verified' && typeof sellerpaymentDetail.transactionId == 'undefined') {

                    Sellerpayment.update({
                        id: paymentid
                    }, query).then(function (sellerpaymentStatus) {
                        if (sellerpaymentStatus) {
                            var transactionData = {};
                            transactionData.buyerId = sellerpaymentStatus[0].buyerId;
                            transactionData.sellerId = sellerpaymentStatus[0].sellerId;
                            if (sellerpaymentStatus[0].cropId) {
                                transactionData.crop = sellerpaymentStatus[0].cropId;
                            }
                            if (sellerpaymentStatus[0].bidId) {
                                transactionData.bidId = sellerpaymentStatus[0].bidId;
                            }
                            if (sellerpaymentStatus[0].landInterestId) {
                                transactionData.landInterestId = sellerpaymentStatus[0].landInterestId;
                            }
                            if (sellerpaymentStatus[0].landId) {
                                transactionData.land = sellerpaymentStatus[0].landId;
                            }
                            transactionData.bidsPaymentId = sellerpaymentStatus[0].id;

                            transactionData.transactionId = code;
                            transactionData.amount = sellerpaymentStatus[0].amount;
                            transactionData.paymentType = sellerpaymentStatus[0].paymentMode;
                            transactionData.processStatus = "TXN_SUCCESS";
                            transactionData.transactionType = 'Debit';

                            if (sellerpaymentStatus[0].type == "Deposit") {
                                transactionData.status = 'DA';
                            } else if (sellerpaymentStatus[0].type == "Final") {
                                transactionData.status = 'FA';
                            } else if (sellerpaymentStatus[0].type == "Upfront") {
                                transactionData.status = 'UA';
                            }

                            Transactions.create(transactionData).then(function (newTransactionEntry) {
                                if (newTransactionEntry) {
                                    qry = {};
                                    qry.transactionId = newTransactionEntry.id
                                    Sellerpayment.update({
                                        id: paymentid
                                    }, qry).then(function (sellerpaymentStatus) {
                                        callback()
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
        }, function (error) {
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

    verifyFranchiseePayments: function (req, res) {

        var ids = [];
        if (req.body.id) {
            ids = req.body.id;
        }

        var query = {};
        query.isVerified = true;
        query.status = "Verified";
        query.verifyDate = new Date()

        async.each(ids, function (paymentid, callback) {

            FranchiseePayments.findOne({
                id: paymentid
            }).then(function (sellerpaymentDetail) {
                if (sellerpaymentDetail.status != 'Verified' && typeof sellerpaymentDetail.transactionId == 'undefined') {
                    FranchiseePayments.update({
                        id: paymentid
                    }, query).then(function (sellerpaymentStatus) {
                        if (sellerpaymentStatus) {

                            var code = commonServiceObj.getUniqueCode();
                            var transactionData = {};
                            transactionData.buyerId = sellerpaymentStatus[0].buyerId;
                            transactionData.sellerId = sellerpaymentStatus[0].sellerId;
                            if (sellerpaymentStatus[0].cropId) {
                                transactionData.crop = sellerpaymentStatus[0].cropId;
                            }
                            if (sellerpaymentStatus[0].bidId) {
                                transactionData.bidId = sellerpaymentStatus[0].bidId;
                            }
                            if (sellerpaymentStatus[0].landInterestId) {
                                transactionData.landInterestId = sellerpaymentStatus[0].landInterestId;
                            }
                            if (sellerpaymentStatus[0].landId) {
                                transactionData.land = sellerpaymentStatus[0].landId;
                            }
                            transactionData.bidsPaymentId = sellerpaymentStatus[0].id;

                            transactionData.transactionId = code;
                            transactionData.amount = sellerpaymentStatus[0].amount;
                            transactionData.paymentType = sellerpaymentStatus[0].paymentMode;
                            transactionData.processStatus = "TXN_SUCCESS";
                            transactionData.transactionType = 'Debit';

                            transactionData.status = 'FP';

                            Transactions.create(transactionData).then(function (newTransactionEntry) {
                                if (newTransactionEntry) {
                                    qry = {};
                                    qry.transactionId = newTransactionEntry.id
                                    FranchiseePayments.update({
                                        id: paymentid
                                    }, qry).then(function (sellerpaymentStatus) {
                                        callback()
                                    })
                                }
                            });
                        }
                    })
                } else {
                    callback()
                }
                callback();
            })
        }, function (error) {
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

    receivedDifferentQuantityList: function (req, res) {

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

        sortquery[field ? field : 'receivedDate'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;
        query.status = "Received"
        query.$and = [{ askedReceivedQuantity: { $ne: undefined } }, { askedReceivedQuantity: { $ne: null } }]

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                query.pincode = {
                    "$in": pincode
                };
            }
        }

        if (req.param('receivedQuantityStatus')) {
            if (req.param('receivedQuantityStatus') == 'Approved' || req.param('receivedQuantityStatus') == 'Unapproved' || req.param('receivedQuantityStatus') == 'Pending') {
                console.log("req.param('receivedQuantityStatus') == ", req.param('receivedQuantityStatus'))
                query.receivedQuantityStatus = req.param('receivedQuantityStatus');
            } else {
                query.$and = [{ receivedQuantityStatus: { $ne: undefined } }, { receivedQuantityStatus: { $ne: "FullReceive" } }]
            }
        } else {
            query.$and = [{ receivedQuantityStatus: { $ne: undefined } }, { receivedQuantityStatus: { $ne: "FullReceive" } }]
        }

        if (search) {
            query.$or = [
                {
                    code: parseFloat(search)
                },
                {
                    cropCode: parseFloat(search)
                },
                {
                    buyerName: { $regex: search, '$options': 'i' }
                },
                {
                    cropName: { $regex: search, '$options': 'i' }
                },

                {
                    amount: parseFloat(search)
                },
                {
                    quantity: parseFloat(search)
                },
                {
                    receivedQuantity: parseFloat(search)
                }
            ];
        }

        Bids.native(function (err, bids) {
            bids.aggregate([
                {
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
                        from: 'crops',
                        localField: 'crop',
                        foreignField: '_id',
                        as: "crops"
                    }
                },
                {
                    $unwind: '$crops'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'crops.seller',
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
                        code: "$code",
                        buyerName: "$buyer.fullName",
                        buyerId: "$user",
                        sellerName: "$sellers.fullName",
                        sellerId: "$sellers._id",
                        cropId: "$crops._id",
                        cropCode: "$crops.code",
                        pincode: "$buyer.pincode",
                        cropName: "$crops.name",
                        bidcode: "$code",
                        bidQuantity: "$quantity",
                        bidRate: "$bidRate",
                        bidAmount: "$amount",
                        bidDate: "$createdAt",
                        bidTotalAmount: "$totalAmount",
                        quantityUnit: "$quantityUnit",
                        status: "$status",
                        receivedQuantityStatus: "$receivedQuantityStatus",
                        receivedQuantity: "$receivedQuantity",
                        askedReceivedQuantity: "$askedReceivedQuantity",
                        receivedQuantityReason: "$receivedQuantityReason"
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

                    bids.aggregate([
                        {
                            $sort: sortquery
                        },
                        {
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
                                from: 'crops',
                                localField: 'crop',
                                foreignField: '_id',
                                as: "crops"
                            }
                        },
                        {
                            $unwind: '$crops'
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'crops.seller',
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
                                code: "$code",
                                buyerName: "$buyer.fullName",
                                buyerId: "$user",
                                sellerName: "$sellers.fullName",
                                sellerId: "$sellers._id",
                                cropId: "$crops._id",
                                cropCode: "$crops.code",
                                pincode: "$buyer.pincode",
                                cropName: "$crops.name",
                                bidcode: "$code",
                                bidQuantity: "$quantity",
                                bidRate: "$bidRate",
                                bidAmount: "$amount",
                                bidDate: "$createdAt",
                                bidTotalAmount: "$totalAmount",
                                quantityUnit: "$quantityUnit",
                                status: "$status",
                                receivedQuantityStatus: "$receivedQuantityStatus",
                                receivedQuantity: "$receivedQuantity",
                                askedReceivedQuantity: "$askedReceivedQuantity",
                                receivedQuantityReason: "$receivedQuantityReason"
                            }
                        },
                        {
                            $match: query
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
                                    bids: results,
                                    total: totalresults.length
                                },
                            });
                        }
                    });
                }
            });
        })
    },

    paymentListDetail: function (req, res) {

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

        if (req.param('type')) {
            query.type = req.param('type');
        }

        if (req.param('productType')) {
            query.productType = req.param('productType');
        } else {
            query.productType = 'crop';
        }

        if (req.param('status') == 'Received') {
            query.$or = [{
                status: 'Paid'
            }, {
                status: 'Verified'
            }]
        } else {
            query.status = req.param('status');
        }

        if (req.param('status') == 'Received' || req.param('status') == 'Paid' || req.param('status') == 'Verified') {
            query.$and = [{
                depositedOn: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                depositedOn: {
                    $lte: new Date(req.param('to'))
                }
            }]
        } else {
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

        let media = req.param('media');

        if (search) {
            query.$or = [{
                code: parseFloat(search)
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
                type: {
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
                verifiedby: {
                    $regex: search,
                    '$options': 'i'
                }
            }
            ];

            if (media == "order") {
                query.$or.push();
            } else {
                query.$or.push();
            }

        }

        Bidspayment.native(function (err, bidpaymentlist) {
            bidpaymentlist.aggregate([{
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
                    localField: 'verifiedBy',
                    foreignField: '_id',
                    as: "verifiedUser"
                }
            },
            {
                $unwind: {
                    path: '$verifiedUser',
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
                    buyer: "$buyers.fullName",
                    cropcode: "$crops.code",
                    depositedOn: "$depositedOn",
                    paymentDueDate: "$paymentDueDate",
                    type: "$type",
                    status: "$status",
                    paymentMode: "$paymentMode",
                    amount: "$amount",
                    cropId: "$crops._id",
                    buyerId: "$buyers._id",
                    verifiedBy: "$verifiedUser.fullName",
                    verifiedbyId: "$verifiedUser._id",
                    pincode: "$pincode",
                    productType: '$productType'
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

                    bidpaymentlist.aggregate([
                        {
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
                                localField: 'verifiedBy',
                                foreignField: '_id',
                                as: "verifiedUser"
                            }
                        },
                        {
                            $unwind: {
                                path: '$verifiedUser',
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
                                buyer: "$buyers.fullName",
                                cropcode: "$crops.code",
                                depositedOn: "$depositedOn",
                                paymentDueDate: "$paymentDueDate",
                                type: "$type",
                                status: "$status",
                                paymentMode: "$paymentMode",
                                amount: "$amount",
                                cropId: "$crops._id",
                                buyerId: "$buyers._id",
                                createdAt: "$createdAt",
                                verifiedBy: "$verifiedUser.fullName",
                                verifiedbyId: "$verifiedUser._id",
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
                                pincode: "$pincode",
                                productType: '$productType'
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
                                    bidPaymentList: results,
                                    total: totalresults.length
                                },
                            });
                        }
                    });
                }
            });
        })
    },

    paymentListDetailLand: function (req, res) {

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

        if (req.param('type')) {
            query.type = req.param('type');
        }

        if (req.param('productType')) {
            query.productType = req.param('productType');
        } else {
            query.productType = 'land';
        }

        if (req.param('status') == 'Received') {
            query.$or = [{
                status: 'Paid'
            }, {
                status: 'Verified'
            }]
        } else {
            query.status = req.param('status');
        }

        if (req.param('status') == 'Received' || req.param('status') == 'Paid' || req.param('status') == 'Verified') {
            query.$and = [{
                depositedOn: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                depositedOn: {
                    $lte: new Date(req.param('to'))
                }
            }]
        } else {
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

        if (search) {
            query.$or = [{
                code: parseFloat(search)
            },
            {
                landcode: parseFloat(search)
            },
            {
                buyer: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                type: {
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
                verifiedby: {
                    $regex: search,
                    '$options': 'i'
                }
            }
            ];

        }

        Bidspayment.native(function (err, bidpaymentlist) {
            bidpaymentlist.aggregate([
                {
                    $lookup: {
                        from: "lands",
                        localField: "landId",
                        foreignField: "_id",
                        as: "lands"
                    }
                },
                {
                    $unwind: '$lands'
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
                        localField: 'verifiedBy',
                        foreignField: '_id',
                        as: "verifiedUser"
                    }
                },
                {
                    $unwind: {
                        path: '$verifiedUser',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'landinterests',
                        localField: 'landInterestId',
                        foreignField: '_id',
                        as: 'landinterests',
                    }
                },
                {
                    $unwind: '$landinterests',
                },
                {
                    $project: {
                        id: "$_id",
                        Id: "$landinterests._id",
                        code: "$landinterests.code",
                        buyer: "$buyers.fullName",
                        landcode: "$lands.code",
                        depositedOn: "$depositedOn",
                        paymentDueDate: "$paymentDueDate",
                        type: "$type",
                        status: "$status",
                        paymentMode: "$paymentMode",
                        amount: "$amount",
                        landId: "$lands._id",
                        buyerId: "$buyers._id",
                        verifiedBy: "$verifiedUser.fullName",
                        verifiedbyId: "$verifiedUser._id",
                        pincode: "$pincode",
                        productType: '$productType'
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

                    bidpaymentlist.aggregate([
                        {
                            $lookup: {
                                from: "lands",
                                localField: "landId",
                                foreignField: "_id",
                                as: "lands"
                            }
                        },
                        {
                            $unwind: '$lands'
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
                                localField: 'verifiedBy',
                                foreignField: '_id',
                                as: "verifiedUser"
                            }
                        },
                        {
                            $unwind: {
                                path: '$verifiedUser',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: 'landinterests',
                                localField: 'landInterestId',
                                foreignField: '_id',
                                as: 'landinterests',
                            }
                        },
                        {
                            $unwind: '$landinterests',
                        },
                        {
                            $project: {
                                id: "$_id",
                                Id: "$landinterests._id",
                                code: "$landinterests.code",
                                buyer: "$buyers.fullName",
                                landcode: "$lands.code",
                                depositedOn: "$depositedOn",
                                paymentDueDate: "$paymentDueDate",
                                type: "$type",
                                status: "$status",
                                paymentMode: "$paymentMode",
                                amount: "$amount",
                                landId: "$lands._id",
                                buyerId: "$buyers._id",
                                createdAt: "$createdAt",
                                verifiedBy: "$verifiedUser.fullName",
                                verifiedbyId: "$verifiedUser._id",
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
                                pincode: "$pincode",
                                productType: '$productType'
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
                                    dealPaymentList: results,
                                    total: totalresults.length
                                },
                            });
                        }
                    });
                }
            });
        })
    },

    refundListDetail: function (req, res) {

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

        sortquery[field ? field : 'paymentDueDate'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;


        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                query.pincode = {
                    "$in": pincode
                };
            }
        }

        // if (req.param('type')) {
        //     query.type = req.param('type');
        // }

        if (req.param('productType')) {
            query.productType = req.param('productType');
        } else {
            query.productType = 'crop';
        }

        if (req.param('status')) {
            query.status = req.param('status');
            query.$and = [{
                paymentDueDate: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                paymentDueDate: {
                    $lte: new Date(req.param('to'))
                }
            }]
        } else {
            query.$or = [{ status: "Refund" }, { status: "OverdueRefund" }, { status: "Refunded" }, { status: "RefundVerified" }]
        }

        let media = req.param('media');

        if (search) {
            query.$or = [{
                code: parseFloat(search)
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
                type: {
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
                refundBy: {
                    $regex: search,
                    '$options': 'i'
                }
            }
            ];

            if (media == "order") {
                query.$or.push();
            } else {
                query.$or.push();
            }

        }

        Bidspayment.native(function (err, bidpaymentlist) {
            bidpaymentlist.aggregate([
                {
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
                        localField: 'refundBy',
                        foreignField: '_id',
                        as: "refundedBy"
                    }
                },
                {
                    $unwind: {
                        path: '$refundedBy',
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
                        buyer: "$buyers.fullName",
                        cropcode: "$crops.code",
                        depositedOn: "$depositedOn",
                        paymentDueDate: "$paymentDueDate",
                        paymentDate: "$paymentDate",
                        paymentMode: "$paymentMode",
                        type: "$type",
                        status: "$status",
                        paymentMode: "$paymentMode",
                        amount: "$amount",
                        cropId: "$crops._id",
                        buyerId: "$buyers._id",
                        // refundStatus:"$refundStatus",
                        refundBy: "$refundedBy.fullName",
                        pincode: "$pincode",
                        productType: '$productType'
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

                    bidpaymentlist.aggregate([
                        {
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
                                localField: 'verifiedBy',
                                foreignField: '_id',
                                as: "verifiedUser"
                            }
                        },
                        {
                            $unwind: {
                                path: '$verifiedUser',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'refundBy',
                                foreignField: '_id',
                                as: "refundedBy"
                            }
                        },
                        {
                            $unwind: {
                                path: '$refundedBy',
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
                                cropcode: "$crops.code",
                                depositedOn: "$depositedOn",
                                paymentDueDate: "$paymentDueDate",
                                paymentDate: "$paymentDate",
                                type: "$type",
                                status: "$status",
                                // refundStatus:"$refundStatus",
                                paymentMode: "$paymentMode",
                                amount: "$amount",
                                cropId: "$crops._id",
                                buyer: "$buyers.fullName",
                                buyerId: "$buyers._id",
                                createdAt: "$createdAt",
                                verifiedBy: "$verifiedUser.fullName",
                                refundBy: "$refundedBy.fullName",
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
                                pincode: "$pincode",
                                productType: '$productType'
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
                                    bidPaymentList: results,
                                    total: totalresults.length
                                },
                            });
                        }
                    });
                }
            });
        })
    },


    refundListDetailLand: function (req, res) {

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

        sortquery[field ? field : 'paymentDueDate'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;


        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                query.pincode = {
                    "$in": pincode
                };
            }
        }

        // if (req.param('type')) {
        //     query.type = req.param('type');
        // }

        if (req.param('productType')) {
            query.productType = req.param('productType');
        } else {
            query.productType = 'land';
        }

        if (req.param('status')) {
            query.status = req.param('status');
            query.$and = [{
                paymentDueDate: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                paymentDueDate: {
                    $lte: new Date(req.param('to'))
                }
            }]
        } else {
            query.$or = [{ status: "Refund" }, { status: "OverdueRefund" }, { status: "Refunded" }, { status: "RefundVerified" }]
        }

        if (search) {
            query.$or = [{
                code: parseFloat(search)
            },
            {
                landcode: parseFloat(search)
            },
            {
                buyer: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                type: {
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
                refundBy: {
                    $regex: search,
                    '$options': 'i'
                }
            }
            ];
        }

        Bidspayment.native(function (err, bidpaymentlist) {
            bidpaymentlist.aggregate([
                {
                    $lookup: {
                        from: "lands",
                        localField: "landId",
                        foreignField: "_id",
                        as: "lands"
                    }
                },
                {
                    $unwind: '$lands'
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
                        localField: 'refundBy',
                        foreignField: '_id',
                        as: "refundedBy"
                    }
                },
                {
                    $unwind: {
                        path: '$refundedBy',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'landinterests',
                        localField: 'landInterestId',
                        foreignField: '_id',
                        as: 'landinterests',
                    }
                },
                {
                    $unwind: '$landinterests',
                },
                {
                    $project: {
                        id: "$_id",
                        Id: "$landinterests._id",
                        code: "$landinterests.code",
                        buyer: "$buyers.fullName",
                        landcode: "$lands.code",
                        depositedOn: "$depositedOn",
                        paymentDueDate: "$paymentDueDate",
                        paymentDate: "$paymentDate",
                        paymentMode: "$paymentMode",
                        type: "$type",
                        status: "$status",
                        paymentMode: "$paymentMode",
                        amount: "$amount",
                        landId: "$lands._id",
                        buyerId: "$buyers._id",
                        // refundStatus:"$refundStatus",
                        refundBy: "$refundedBy.fullName",
                        pincode: "$pincode",
                        productType: '$productType'
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

                    bidpaymentlist.aggregate([
                        {
                            $lookup: {
                                from: "lands",
                                localField: "landId",
                                foreignField: "_id",
                                as: "lands"
                            }
                        },
                        {
                            $unwind: '$lands'
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
                                localField: 'verifiedBy',
                                foreignField: '_id',
                                as: "verifiedUser"
                            }
                        },
                        {
                            $unwind: {
                                path: '$verifiedUser',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'refundBy',
                                foreignField: '_id',
                                as: "refundedBy"
                            }
                        },
                        {
                            $unwind: {
                                path: '$refundedBy',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: 'landinterests',
                                localField: 'landInterestId',
                                foreignField: '_id',
                                as: 'landinterests',
                            }
                        },
                        {
                            $unwind: '$landinterests',
                        },
                        {
                            $project: {
                                id: "$_id",
                                Id: "$landinterests._id",
                                code: "$landinterests.code",
                                landcode: "$lands.code",
                                depositedOn: "$depositedOn",
                                paymentDueDate: "$paymentDueDate",
                                paymentDate: "$paymentDate",
                                type: "$type",
                                status: "$status",
                                // refundStatus:"$refundStatus",
                                paymentMode: "$paymentMode",
                                amount: "$amount",
                                landId: "$lands._id",
                                buyer: "$buyers.fullName",
                                buyerId: "$buyers._id",
                                createdAt: "$createdAt",
                                verifiedBy: "$verifiedUser.fullName",
                                refundBy: "$refundedBy.fullName",
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
                                pincode: "$pincode",
                                productType: '$productType'
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
                                    bidPaymentList: results,
                                    total: totalresults.length
                                },
                            });
                        }
                    });
                }
            });
        })
    },

    sellerRefundList: function (req, res) {

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

        sortquery[field ? field : 'paymentDueDate'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;


        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                query.pincode = {
                    "$in": pincode
                };
            }
        }

        // if (req.param('type')) {
        //     query.type = req.param('type');
        // }

        if (req.param('status')) {
            query.status = req.param('status');
            query.$and = [{
                paymentDueDate: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                paymentDueDate: {
                    $lte: new Date(req.param('to'))
                }
            }]
        } else {
            query.$or = [{ status: "Refund" }, { status: "OverdueRefund" }, { status: "Refunded" }, { status: "RefundVerified" }]
        }

        let media = req.param('media');

        if (req.param('productType')) {
            query.productType = req.param('productType');
        } else {
            query.productType = 'crop';
        }

        if (search) {
            query.$or = [{
                code: parseFloat(search)
            },
            {
                cropcode: parseFloat(search)
            },
            {
                seller: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                type: {
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
                verifiedby: {
                    $regex: search,
                    '$options': 'i'
                }
            }
            ];

            if (media == "order") {
                query.$or.push();
            } else {
                query.$or.push();
            }

        }

        Sellerpayment.native(function (err, bidpaymentlist) {
            bidpaymentlist.aggregate([
                {
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
                        as: "seller"
                    }
                },
                {
                    $unwind: '$seller'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'verifiedBy',
                        foreignField: '_id',
                        as: "verifiedUser"
                    }
                },
                {
                    $unwind: {
                        path: '$verifiedUser',
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
                        seller: "$seller.fullName",
                        cropcode: "$crops.code",
                        depositedOn: "$depositedOn",
                        paymentDueDate: "$paymentDueDate",
                        depositedOn: "$depositedOn",
                        type: "$type",
                        status: "$status",
                        paymentMode: "$paymentMode",
                        amount: "$amount",
                        cropId: "$crops._id",
                        sellerId: "$seller._id",
                        verifiedBy: "$verifiedUser.fullName",
                        verifiedbyId: "$verifiedUser._id",
                        pincode: "$pincode",
                        productType: '$productType'
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

                    bidpaymentlist.aggregate([
                        {
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
                                as: "seller"
                            }
                        },
                        {
                            $unwind: '$seller'
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'verifiedBy',
                                foreignField: '_id',
                                as: "verifiedUser"
                            }
                        },
                        {
                            $unwind: {
                                path: '$verifiedUser',
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
                                cropcode: "$crops.code",
                                depositedOn: "$depositedOn",
                                paymentDueDate: "$paymentDueDate",
                                depositedOn: "$depositedOn",
                                type: "$type",
                                status: "$status",
                                // refundStatus:"$refundStatus",
                                paymentMode: "$paymentMode",
                                amount: "$amount",
                                cropId: "$crops._id",
                                sellerId: "$seller._id",
                                createdAt: "$createdAt",
                                verifiedBy: "$verifiedUser.fullName",
                                verifiedbyId: "$verifiedUser._id",
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
                                pincode: "$pincode",
                                seller: "$seller.fullName",
                                productType: '$productType'
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
                                    sellerPaymentList: results,
                                    total: totalresults.length
                                },
                            });
                        }
                    });
                }
            });
        })
    },

    sellerRefundListLand: function (req, res) {

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

        sortquery[field ? field : 'paymentDueDate'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;


        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                query.pincode = {
                    "$in": pincode
                };
            }
        }

        // if (req.param('type')) {
        //     query.type = req.param('type');
        // }

        if (req.param('status')) {
            query.status = req.param('status');
            query.$and = [{
                paymentDueDate: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                paymentDueDate: {
                    $lte: new Date(req.param('to'))
                }
            }]
        } else {
            query.$or = [{ status: "Refund" }, { status: "OverdueRefund" }, { status: "Refunded" }, { status: "RefundVerified" }]
        }

        if (req.param('productType')) {
            query.productType = req.param('productType');
        } else {
            query.productType = 'land';
        }

        if (search) {
            query.$or = [{
                code: parseFloat(search)
            },
            {
                landcode: parseFloat(search)
            },
            {
                seller: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                type: {
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
                verifiedby: {
                    $regex: search,
                    '$options': 'i'
                }
            }
            ];

        }

        Sellerpayment.native(function (err, bidpaymentlist) {
            bidpaymentlist.aggregate([
                {
                    $lookup: {
                        from: "lands",
                        localField: "landId",
                        foreignField: "_id",
                        as: "lands"
                    }
                },
                {
                    $unwind: '$lands'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'sellerId',
                        foreignField: '_id',
                        as: "seller"
                    }
                },
                {
                    $unwind: '$seller'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'verifiedBy',
                        foreignField: '_id',
                        as: "verifiedUser"
                    }
                },
                {
                    $unwind: {
                        path: '$verifiedUser',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'landinterests',
                        localField: 'landInterestId',
                        foreignField: '_id',
                        as: 'landinterests',
                    }
                },
                {
                    $unwind: '$landinterests',
                },
                {
                    $project: {
                        id: "$_id",
                        Id: "$landinterests._id",
                        code: "$landinterests.code",
                        seller: "$seller.fullName",
                        landcode: "$lands.code",
                        depositedOn: "$depositedOn",
                        paymentDueDate: "$paymentDueDate",
                        depositedOn: "$depositedOn",
                        type: "$type",
                        status: "$status",
                        paymentMode: "$paymentMode",
                        amount: "$amount",
                        landId: "$lands._id",
                        sellerId: "$seller._id",
                        verifiedBy: "$verifiedUser.fullName",
                        verifiedbyId: "$verifiedUser._id",
                        pincode: "$pincode",
                        productType: '$productType'
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

                    bidpaymentlist.aggregate([
                        {
                            $lookup: {
                                from: "lands",
                                localField: "landId",
                                foreignField: "_id",
                                as: "lands"
                            }
                        },
                        {
                            $unwind: '$lands'
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'sellerId',
                                foreignField: '_id',
                                as: "seller"
                            }
                        },
                        {
                            $unwind: '$seller'
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'verifiedBy',
                                foreignField: '_id',
                                as: "verifiedUser"
                            }
                        },
                        {
                            $unwind: {
                                path: '$verifiedUser',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: 'landinterests',
                                localField: 'landInterestId',
                                foreignField: '_id',
                                as: 'landinterests',
                            }
                        },
                        {
                            $unwind: '$landinterests',
                        },
                        {
                            $project: {
                                id: "$_id",
                                Id: "$landinterests._id",
                                code: "$landinterests.code",
                                landcode: "$lands.code",
                                depositedOn: "$depositedOn",
                                paymentDueDate: "$paymentDueDate",
                                depositedOn: "$depositedOn",
                                type: "$type",
                                status: "$status",
                                // refundStatus:"$refundStatus",
                                paymentMode: "$paymentMode",
                                amount: "$amount",
                                landId: "$lands._id",
                                sellerId: "$seller._id",
                                createdAt: "$createdAt",
                                verifiedBy: "$verifiedUser.fullName",
                                verifiedbyId: "$verifiedUser._id",
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
                                pincode: "$pincode",
                                seller: "$seller.fullName",
                                productType: '$productType'
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
                                    sellerPaymentList: results,
                                    total: totalresults.length
                                },
                            });
                        }
                    });
                }
            });
        })
    },

    paymentSellerListDetail: function (req, res) {

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
        sortquery["BidId"] = 1;

        if (req.param('productType')) {
            query.productType = req.param('productType');
        } else {
            query.productType = 'crop';
        }

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                query.pincode = {
                    "$in": pincode
                };
            }
        }

        if (req.param('type')) {
            query.type = req.param('type');
        }

        if (req.param('status') == 'Made' || req.param('status') == 'Received') {
            query.$or = [{
                status: 'Paid'
            }, {
                status: 'Verified'
            }]
        } else {
            query.status = req.param('status');
        }

        if (req.param('status') == 'Made' || req.param('status') == 'Paid' || req.param('status') == 'Verified' || req.param('status') == 'Received') {
            query.$and = [{
                depositedOn: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                depositedOn: {
                    $lte: new Date(req.param('to'))
                }
            }]
        } else {


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

        if (search) {
            query.$or = [{
                code: parseFloat(search)
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
                type: {
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



        Sellerpayment.native(function (err, sellerpaymentlist) {
            sellerpaymentlist.aggregate([{
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
                    as: "buyer"
                }
            },
            {
                $unwind: '$buyer'
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
                    seller: "$sellers.fullName",
                    buyer: "$buyer.fullName",
                    cropcode: "$crops.code",
                    depositedOn: "$depositedOn",
                    paymentDueDate: "$paymentDueDate",
                    type: "$type",
                    status: "$status",
                    paymentMode: "$paymentMode",
                    amount: "$amount",
                    cropId: "$crops._id",
                    sellerId: "$sellers._id",
                    paymentBy: "$paymentUser.fullName",
                    paymentById: "$paymentUser._id",
                    pincode: "$pincode",
                    productType: '$productType'
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
                            as: "buyer"
                        }
                    },
                    {
                        $unwind: '$buyer'
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
                            seller: "$sellers.fullName",
                            buyer: "$buyer.fullName",
                            cropcode: "$crops.code",
                            depositedOn: "$depositedOn",
                            paymentDueDate: "$paymentDueDate",
                            type: "$type",
                            status: "$status",
                            paymentMode: "$paymentMode",
                            amount: "$amount",
                            cropId: "$crops._id",
                            sellerId: "$sellers._id",
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
                            pincode: "$pincode",
                            productType: '$productType'
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
                                    sellerpaymentlist: results,
                                    total: totalresults.length
                                },
                            });
                        }
                    });
                }
            });
        })
    },

    paymentSellerListDetailLand: function (req, res) {

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
        sortquery["BidId"] = 1;

        if (req.param('productType')) {
            query.productType = req.param('productType');
        } else {
            query.productType = 'land';
        }

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                query.pincode = {
                    "$in": pincode
                };
            }
        }

        if (req.param('type')) {
            query.type = req.param('type');
        }

        if (req.param('status') == 'Made' || req.param('status') == 'Received') {
            query.$or = [{
                status: 'Paid'
            }, {
                status: 'Verified'
            }]
        } else {
            query.status = req.param('status');
        }

        if (req.param('status') == 'Made' || req.param('status') == 'Paid' || req.param('status') == 'Verified' || req.param('status') == 'Received') {
            query.$and = [{
                depositedOn: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                depositedOn: {
                    $lte: new Date(req.param('to'))
                }
            }]
        } else {


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

        if (search) {
            query.$or = [{
                code: parseFloat(search)
            },
            {
                landcode: parseFloat(search)
            },
            {
                buyer: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                type: {
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



        Sellerpayment.native(function (err, sellerpaymentlist) {
            sellerpaymentlist.aggregate([
                {
                    $lookup: {
                        from: "lands",
                        localField: "landId",
                        foreignField: "_id",
                        as: "lands"
                    }
                },
                {
                    $unwind: '$lands'
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
                        as: "buyer"
                    }
                },
                {
                    $unwind: '$buyer'
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
                        from: 'landinterests',
                        localField: 'landInterestId',
                        foreignField: '_id',
                        as: 'landinterests',
                    }
                },
                {
                    $unwind: '$landinterests',
                },
                {
                    $project: {
                        id: "$_id",
                        Id: "$landinterests._id",
                        code: "$landinterests.code",
                        seller: "$sellers.fullName",
                        buyer: "$buyer.fullName",
                        landcode: "$lands.code",
                        depositedOn: "$depositedOn",
                        paymentDueDate: "$paymentDueDate",
                        type: "$type",
                        status: "$status",
                        paymentMode: "$paymentMode",
                        amount: "$amount",
                        landId: "$lands._id",
                        sellerId: "$sellers._id",
                        paymentBy: "$paymentUser.fullName",
                        paymentById: "$paymentUser._id",
                        pincode: "$pincode",
                        productType: '$productType'
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

                    sellerpaymentlist.aggregate([
                        {
                            $lookup: {
                                from: "lands",
                                localField: "landId",
                                foreignField: "_id",
                                as: "lands"
                            }
                        },
                        {
                            $unwind: '$lands'
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
                                as: "buyer"
                            }
                        },
                        {
                            $unwind: '$buyer'
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
                                from: 'landinterests',
                                localField: 'landInterestId',
                                foreignField: '_id',
                                as: 'landinterests',
                            }
                        },
                        {
                            $unwind: '$landinterests',
                        },
                        {
                            $project: {
                                id: "$_id",
                                Id: "$landinterests._id",
                                code: "$landinterests.code",
                                seller: "$sellers.fullName",
                                buyer: "$buyer.fullName",
                                landcode: "$lands.code",
                                depositedOn: "$depositedOn",
                                paymentDueDate: "$paymentDueDate",
                                type: "$type",
                                status: "$status",
                                paymentMode: "$paymentMode",
                                amount: "$amount",
                                landId: "$lands._id",
                                sellerId: "$sellers._id",
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
                                pincode: "$pincode",
                                productType: '$productType'
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
                                    sellerpaymentlist: results,
                                    total: totalresults.length
                                },
                            });
                        }
                    });
                }
            });
        })
    },

    paymentLogisticListDetail: function (req, res) {

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

        let media = req.param('media');

        LogisticPayment.native(function (err, sellerpaymentlist) {
            sellerpaymentlist.aggregate([{
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
                    as: "logisticParter"
                }
            },
            {
                $unwind: '$logisticParter'
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
                    logisticParterId: "$logisticParter._id",
                    logisticParter: "$logisticParter.companyName",
                    cropcode: "$crops.code",
                    depositedOn: "$depositedOn",
                    paymentDueDate: "$paymentDueDate",
                    status: "$status",
                    paymentMode: "$paymentMode",
                    amount: "$amount",
                    cropId: "$crops._id",
                    remark: "$remark",
                    paymentBy: "$paymentUser.fullName",
                    paymentById: "$paymentUser._id",
                    createdAt: "$createdAt",
                    pincode: "$pincode"
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
                            as: "logisticParter"
                        }
                    },
                    {
                        $unwind: '$logisticParter'
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
                            logisticPartnerId: "$logisticParter._id",
                            logisticPartner: "$logisticParter.companyName",
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
                            remark: "$remark",
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





    paymentFranchiseeListDetail: function (req, res) {

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

        if (req.param('productType')) {
            query.productType = req.param('productType');
            query.$and = [{
                createdAt: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                createdAt: {
                    $lte: new Date(req.param('to'))
                }
            }]
        } else {
             query.$and = [{
                createdAt: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                createdAt: {
                    $lte: new Date(req.param('to'))
                }
            }, {$or:[{productType:'crop'},{productType:undefined}]}]
        }

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
                franchiseeUser: {
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

        let media = req.param('media');

        FranchiseePayments.native(function (err, sellerpaymentlist) {
            sellerpaymentlist.aggregate([{
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
                    sellerCode: "$sellers.userUniqueId",
                    sellerUniqueId: "$sellers.userUniqueId",
                    buyerId: "$buyers._id",
                    buyer: "$buyers.fullName",
                    franchiseeUserId: "$franchiseeUser._id",
                    franchiseeUser: "$franchiseeUser.fullName",
                    cropcode: "$crops.code",
                    depositedOn: "$depositedOn",
                    paymentDueDate: "$paymentDueDate",
                    status: "$status",
                    paymentMode: "$paymentMode",
                    amount: "$amount",
                    cropId: "$crops._id",
                    paymentBy: "$paymentUser.fullName",
                    paymentById: "$paymentUser._id",
                    pincode: "$crops.pincode",
                    createdAt: "$createdAt",
                    productType: '$productType'
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
                            sellerCode: "$sellers.userUniqueId",
                            sellerUniqueId: "$sellers.userUniqueId",
                            buyerId: "$buyers._id",
                            buyer: "$buyers.fullName",
                            franchiseeUserId: "$franchiseeUser._id",
                            franchiseeUser: "$franchiseeUser.fullName",
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
                            pincode: "$crops.pincode",
                            productType: '$productType'
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

    paymentFranchiseeListDetailLand: function (req, res) {

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

        if (req.param('productType')) {
            query.productType = req.param('productType');
        } else {
            query.productType = 'land';
        }

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

        query.$and = [{
            createdAt: {
                $gte: new Date(req.param('from'))
            }
        }, {
            createdAt: {
                $lte: new Date(req.param('to'))
            }
        }]

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
                franchiseeUser: {
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

        FranchiseePayments.native(function (err, sellerpaymentlist) {
            sellerpaymentlist.aggregate([
                {
                    $lookup: {
                        from: "lands",
                        localField: "landId",
                        foreignField: "_id",
                        as: "lands"
                    }
                },
                {
                    $unwind: '$lands'
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
                        from: 'landinterests',
                        localField: 'landInterestId',
                        foreignField: '_id',
                        as: 'landinterests',
                    }
                },
                {
                    $unwind: '$landinterests',
                },
                {
                    $project: {
                        id: "$_id",
                        Id: "$landinterests._id",
                        code: "$landinterests.code",
                        sellerId: "$sellers._id",
                        seller: "$sellers.fullName",
                        sellerCode: "$sellers.userUniqueId",
                        sellerUniqueId: "$sellers.userUniqueId",
                        buyerId: "$buyers._id",
                        buyer: "$buyers.fullName",
                        franchiseeUserId: "$franchiseeUser._id",
                        franchiseeUser: "$franchiseeUser.fullName",
                        landcode: "$lands.code",
                        depositedOn: "$depositedOn",
                        paymentDueDate: "$paymentDueDate",
                        status: "$status",
                        paymentMode: "$paymentMode",
                        amount: "$amount",
                        landId: "$lands._id",
                        paymentBy: "$paymentUser.fullName",
                        paymentById: "$paymentUser._id",
                        pincode: "$lands.pincode",
                        createdAt: "$createdAt",
                        productType: '$productType'
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

                    sellerpaymentlist.aggregate([
                        {
                            $lookup: {
                                from: "lands",
                                localField: "landId",
                                foreignField: "_id",
                                as: "lands"
                            }
                        },
                        {
                            $unwind: '$lands'
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
                                from: 'landinterests',
                                localField: 'landInterestId',
                                foreignField: '_id',
                                as: 'landinterests',
                            }
                        },
                        {
                            $unwind: '$landinterests',
                        },
                        {
                            $project: {
                                id: "$_id",
                                Id: "$landinterests._id",
                                code: "$landinterests.code",
                                sellerId: "$sellers._id",
                                seller: "$sellers.fullName",
                                sellerCode: "$sellers.userUniqueId",
                                sellerUniqueId: "$sellers.userUniqueId",
                                buyerId: "$buyers._id",
                                buyer: "$buyers.fullName",
                                franchiseeUserId: "$franchiseeUser._id",
                                franchiseeUser: "$franchiseeUser.fullName",
                                landcode: "$lands.code",
                                depositedOn: "$depositedOn",
                                paymentDueDate: "$paymentDueDate",
                                status: "$status",
                                paymentMode: "$paymentMode",
                                amount: "$amount",
                                landId: "$lands._id",
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
                                pincode: "$lands.pincode",
                                productType: '$productType'
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

    franchiseeMoneyList: function (req, res) {

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
        //
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
                paymentBy: {
                    $regex: search,
                    '$options': 'i'
                }
            }
            ]
        }
        let media = req.param('media');

        FranchiseePayments.native(function (err, sellerpaymentlist) {
            sellerpaymentlist.aggregate([
                {
                    $lookup: {
                        from: (media == "landDeals") ? 'lands' : "crops",
                        localField: (media == "landDeals") ? 'landId' : "cropId",
                        foreignField: "_id",
                        as: (media == "landDeals") ? 'lands' : "crops"
                    }
                },
                {
                    $unwind: (media == "landDeals") ? '$lands' : "$crops",
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
                        from: (media == "order") ? 'orderedcarts' : (media == "landDeals") ? 'landinterests' : 'bids',
                        localField: (media == "order") ? 'suborder' : (media == "landDeals") ? 'landInterestId' : 'bidId',
                        foreignField: '_id',
                        as: (media == "order") ? 'suborder' : (media == "landDeals") ? 'landInterests' : 'bids',
                    }
                },
                {
                    $unwind: (media == "order") ? '$suborder' : (media == "landDeals") ? '$landInterests' : '$bids',
                },
                {
                    $lookup: {
                        from: (media == "order") ? 'orders' : (media == "landDeals") ? 'landinterests' : 'bids',
                        localField: (media == "order") ? 'order' : (media == "landDeals") ? 'landInterestId' : 'bidId',
                        foreignField: '_id',
                        as: (media == "order") ? 'order' : (media == "landDeals") ? 'landInterestsdetails' : 'bidDetails',
                    }
                },
                {
                    $unwind: (media == "order") ? '$order' : (media == "landDeals") ? '$landInterestsdetails' : '$bidDetails',
                },
                {
                    $project: {
                        id: "$_id",
                        Id: (media == "order") ? "$suborder._id" : (media == "landDeals") ? '$landInterests._id' : "$bids._id",
                        code: (media == "order") ? "$suborder.code" : (media == "landDeals") ? '$landInterests.code' : "$bids.code",
                        orderCode: (media == "order") ? "$order.code" : (media == "landDeals") ? '$landInterestsdetails.code' : "$bidDetails.code",
                        sellerId: "$sellers._id",
                        seller: "$sellers.fullName",
                        buyerId: "$buyers._id",
                        buyer: "$buyers.fullName",
                        franchiseeUserId: "$franchiseeUser._id",
                        franchiseeUser: "$franchiseeUser.fullName",
                        cropcode: (media == "landDeals") ? '$lands.code' : "$crops.code",
                        landcode: (media == "landDeals") ? '$lands.code' : "$crops.code",
                        depositedOn: "$depositedOn",
                        paymentDueDate: "$paymentDueDate",
                        logisticsOption: "$suborder.logisticsOption",
                        status: "$status",
                        paymentMode: "$paymentMode",
                        amount: "$amount",
                        cropId: (media == "landDeals") ? '$lands._id' : "$crops._id",
                        landId: (media == "landDeals") ? '$lands._id' : "$crops._id",
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

                    sellerpaymentlist.aggregate([
                        {
                            $lookup: {
                                from: (media == "landDeals") ? 'lands' : "crops",
                                localField: (media == "landDeals") ? 'landId' : "cropId",
                                foreignField: "_id",
                                as: (media == "landDeals") ? 'lands' : "crops"
                            }
                        },
                        {
                            $unwind: (media == "landDeals") ? '$lands' : "$crops",
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
                                from: (media == "order") ? 'orderedcarts' : (media == "landDeals") ? 'landinterests' : 'bids',
                                localField: (media == "order") ? 'suborder' : (media == "landDeals") ? 'landInterestId' : 'bidId',
                                foreignField: '_id',
                                as: (media == "order") ? 'suborder' : (media == "landDeals") ? 'landInterests' : 'bids',
                            }
                        },
                        {
                            $unwind: (media == "order") ? '$suborder' : (media == "landDeals") ? '$landInterests' : '$bids',
                        },
                        {
                            $lookup: {
                                from: (media == "order") ? 'orders' : (media == "landDeals") ? 'landinterests' : 'bids',
                                localField: (media == "order") ? 'order' : (media == "landDeals") ? 'landInterestId' : 'bidId',
                                foreignField: '_id',
                                as: (media == "order") ? 'order' : (media == "landDeals") ? 'landInterestsdetails' : 'bidDetails',
                            }
                        },
                        {
                            $unwind: (media == "order") ? '$order' : (media == "landDeals") ? '$landInterestsdetails' : '$bidDetails',
                        },
                        {
                            $project: {
                                id: "$_id",
                                Id: (media == "order") ? "$suborder._id" : (media == "landDeals") ? '$landInterests._id' : "$bids._id",
                                code: (media == "order") ? "$suborder.code" : (media == "landDeals") ? '$landInterests.code' : "$bids.code",
                                orderCode: (media == "order") ? "$order.code" : (media == "landDeals") ? '$landInterestsdetails.code' : "$bidDetails.code",
                                sellerId: "$sellers._id",
                                seller: "$sellers.fullName",
                                buyerId: "$buyers._id",
                                buyer: "$buyers.fullName",
                                franchiseeUserId: "$franchiseeUser._id",
                                franchiseeUser: "$franchiseeUser.fullName",
                                logisticsOption: "$suborder.logisticsOption",
                                cropcode: (media == "landDeals") ? '$lands.code' : "$crops.code",
                                landcode: (media == "landDeals") ? '$lands.code' : "$crops.code",
                                depositedOn: "$depositedOn",
                                paymentDueDate: "$paymentDueDate",
                                status: "$status",
                                paymentMode: "$paymentMode",
                                amount: "$amount",
                                cropId: (media == "landDeals") ? '$lands._id' : "$crops._id",
                                landId: (media == "landDeals") ? '$lands._id' : "$crops._id",
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

    bidsTransactions: function (req, res) {
        let id = req.param("id");
        Transactions.find({
            crop: id
        }).populate("buyerId").populate("sellerId")
            .populate("crop").populate("bidId")
            .then(function (bidTransactions) {
                return res.status(200).jsonx({
                    success: true,
                    data: bidTransactions,
                });
            });
    },

    refundBidAmount: function (req, res) {
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


                    let jsONDST = JSON.stringify(JsonData);
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
                                bidData.paymentDate = date;

                                history.bid = bidTransactions.bidId;
                                history.amount = bidTransactions.amount;
                                history.crop = bidTransactions.crop;
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

    myBids: function (req, res) {
        let user = req.identity.id

        let page = req.param('page');
        let count = parseInt(req.param('count'));
        let skipNo = (page - 1) * count;
        let tab = parseInt(req.param('tab'));

        let type = req.param('type');

        let mybidsqry = {}
        mybidsqry.user = user
        if (type) {
            mybidsqry.type = type
        }

        let tabName = ''
        if (tab == 2) {    //delivered
            mybidsqry.$or = [{ status: 'Delivered' }, { status: 'Received' }, { $and: [{ status: 'Dispatched' }, { logisticsOption: 'self' }] }]
            tabName = 'Delivered'
        } else if (tab == 3) { //failed
            mybidsqry.$or = [{ status: 'Withdrawal' }, { status: 'Refund' }, { status: 'Failed' }, { status: 'Rejected' }]
            tabName = 'Failed'
        } else { //active
            mybidsqry.$or = [{ status: 'Pending' }, { status: 'Accepted' }, { $and: [{ status: 'Dispatched' }, { logisticsOption: 'efarmx' }] }]
            tabName = 'Active'
        }

        Bids.count(mybidsqry).exec(function (cerr, counttotal) {
            if (cerr) {
                return res.status(400).jsonx({
                    success: false,
                    error: cerr,
                });
            } else {
                Bids.find(mybidsqry).sort('createdAt DESC')
                    .populate('crop')
                    .populate('popId')
                    .populate('logisticId')
                    .populate('buyerpayments', { status: 'Due', type: "Final" })
                    .skip(skipNo).limit(count).exec(function (err, bids) {
                        if (err) {
                            return res.status(400).jsonx({
                                success: false,
                                error: err,
                            });
                        } else {
                            async.each(bids, function (bid, callback) {
                                if (bid.crop && bid.crop.category) {
                                    let query = {};
                                    query.id = bid.crop.category;
                                    Category.findOne(query).then(function (categoty) {
                                        bid.crop.category = categoty;

                                        if (bid.status == 'Withdrawal') {
                                            bid.tab = tabName
                                            if (bid.withdrawalAt) {
                                                bid.currentcomment = 'You have withdrawal your bid on ' + commonService.longDateFormat((new Date(bid.withdrawalAt)))
                                            } else {
                                                bid.currentcomment = 'You have withdrawal your bid'
                                            }
                                            bid.commentIn = 'Red'
                                        } else if (bid.status == 'Failed') {
                                            bid.tab = tabName
                                            bid.currentcomment = 'Your bid was failed.'
                                            bid.commentIn = 'Red'
                                        } else if (bid.status == 'Pending') {
                                            bid.tab = tabName
                                            bid.currentcomment = 'Your bid is successfully placed. Waiting for seller to accept it.'
                                            bid.commentIn = 'Yellow'
                                        } else if (bid.status == 'Rejected') {
                                            bid.tab = tabName
                                            if (bid.rejectedAt) {
                                                bid.currentcomment = 'Your bid is Rejected on ' + commonService.longDateFormat((new Date(bid.rejectedAt)))
                                            } else {
                                                bid.currentcomment = 'Your bid is Rejected'
                                            }
                                            bid.commentIn = 'Red'
                                        } else if (bid.status == 'Accepted') {
                                            bid.tab = tabName
                                            var acceptComment = ''

                                            var payqry = {}
                                            payqry.bidId = bid.id
                                            payqry.type = {
                                                $ne: 'Earnest'
                                            }

                                            Bidspayment.find(payqry).sort('sequenceNumber ASC')
                                                .then(function (payments) {
                                                    var commentsecondpart = ''
                                                    var toAdd = false
                                                    var breakLoop = false
                                                    payments.forEach((payment, i) => {
                                                        if (breakLoop == false) {
                                                            if (toAdd == false) {
                                                                commentsecondpart = ''
                                                            } else {
                                                                commentsecondpart = commentsecondpart + ' '
                                                            }
                                                            if (payment.status == 'Verified') {
                                                                toAdd = true
                                                                commentsecondpart = commentsecondpart + 'Your ' + payment.name + ' is Verified.'

                                                                if (i == payments.length - 1) {
                                                                    if (bid.popId) {
                                                                        if (bid.popId.allApprovedByBuyer == false) {
                                                                            commentsecondpart = 'All your payments are verified. Please look into acceptance of your product.'
                                                                            bid.commentIn = 'Yellow'
                                                                        } else {
                                                                            if (bid.ETD) {
                                                                                commentsecondpart = 'All your process is done. Estimate date for dispatch of your product is ' + commonService.longDateFormat((new Date(bid.ETD)))
                                                                                bid.commentIn = 'Green'
                                                                                if (bid.ETA) {
                                                                                    commentsecondpart = commentsecondpart + ' and estimate time for arrival of your product is ' + commonService.longDateFormat((new Date(bid.ETA)))
                                                                                }
                                                                            } else {
                                                                                bid.commentIn = 'Green'
                                                                                commentsecondpart = 'All your process is done. We will dispatch your product soon.'
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            } else if (payment.status == 'Overdue') {
                                                                toAdd = false
                                                                commentsecondpart = commentsecondpart + 'Your ' + payment.name + ' is Overdue. Please pay it soon to avoid cancellation of bid.'
                                                                bid.commentIn = 'Red'

                                                                breakLoop = true

                                                            } else if (payment.status == 'Paid') {
                                                                toAdd = true
                                                                commentsecondpart = commentsecondpart + 'Thank You for paying ' + payment.name + '. We will verify this soon.'
                                                                bid.commentIn = 'Green'
                                                            } else if (payment.status == 'Due') {

                                                                toAdd = false
                                                                if (i == 0) {
                                                                    acceptComment = 'Congratulations! Your bid is Accepted by farmer on ' + commonService.longDateFormat((new Date(bid.acceptedAt)))
                                                                }

                                                                if (payment.type == "Deposit") {

                                                                    if (payment.paymentDueDate) {
                                                                        commentsecondpart = commentsecondpart + 'Your ' + payment.name + ' consisting of ₹' + parseFloat((payment.amount).toFixed(2)) + ' is Due on ' + commonService.longDateFormat((new Date(payment.paymentDueDate)))
                                                                        breakLoop = true;
                                                                    } else {
                                                                        commentsecondpart = commentsecondpart + " Your product is ready to dispatch and you will be informed once its dispatched";
                                                                        breakLoop = true;
                                                                    }
                                                                } else if (payment.type == "Final") {

                                                                    if (payment.paymentDueDate) {
                                                                        commentsecondpart = commentsecondpart + 'Your ' + payment.name + ' consisting of ₹' + parseFloat((payment.amount).toFixed(2)) + ' is Due on ' + commonService.longDateFormat((new Date(payment.paymentDueDate)))
                                                                    }
                                                                }
                                                                // commentsecondpart = commentsecondpart + 'Your ' + payment.name + ' consisting of ₹' + payment.amount + ' is Due on ' + commonService.longDateFormat((new Date(payment.paymentDueDate)))
                                                                bid.commentIn = 'Green'

                                                                // breakLoop = true
                                                            }
                                                        }
                                                    })
                                                    if (acceptComment.length > 0) {
                                                        acceptComment = acceptComment + ". "
                                                    }
                                                    acceptComment = acceptComment + commentsecondpart
                                                    bid.currentcomment = acceptComment
                                                    callback()
                                                }).fail(function (err) {
                                                    callback()
                                                })
                                        } else if (bid.status == 'Dispatched') {
                                            bid.tab = tabName
                                            if (bid.ATD) {
                                                bid.currentcomment = 'Your crop order is Dispatched on ' + commonService.longDateFormat((new Date(bid.ATD))) + "."
                                            } else {
                                                bid.currentcomment = 'Your crop order is Dispatched.'
                                            }

                                            if (bid.logisticsOption == 'self') {
                                                bid.currentcomment = bid.currentcomment + ' Please accept it within 48 hours or else it will be considered as Received.'
                                            }
                                            bid.commentIn = 'Green'
                                        } else if (bid.status == 'Delivered') {
                                            bid.tab = tabName
                                            if (bid.ATA) {
                                                bid.currentcomment = 'Your crop order is Delivered on ' + commonService.longDateFormat((new Date(bid.ATA))) + '. Please accept it within 48 hours or else it will be considered as Received.'
                                            } else {
                                                bid.currentcomment = 'Your crop order is Delivered' + '. Please accept it within 48 hours or else it will be considered as Received.'
                                            }
                                            bid.commentIn = 'Green'
                                        } else if (bid.status == 'Received') {
                                            bid.tab = tabName
                                            if (bid.receivedDate) {
                                                bid.currentcomment = 'You received your crop on ' + commonService.longDateFormat((new Date(bid.receivedDate))) + ". "
                                            } else {
                                                bid.currentcomment = 'You have received your crop' + ". "
                                            }

                                            if (bid.receivedQuantityStatus != undefined && bid.receivedQuantityStatus == "Pending") {
                                                let bidsInputpaymentsReceived = bid.buyerpayments;
                                                bid.currentcomment = bid.currentcomment + "Received quantity is noted. It will be verified soon and accordingly financial adjustments will be done."

                                                bid.commentIn = 'Yellow'
                                            } else {
                                                if (bid.buyerpayments.length > 0) {
                                                    if (bid.receivedQuantityStatus == "Pending") {
                                                        let bidsInputpaymentsReceived = bid.buyerpayments;
                                                        bid.currentcomment = "Received quantity is noted. It will be verified soon and accordingly financial adjustments will be done."

                                                        bid.commentIn = 'Yellow'
                                                    } else if (bid.receivedQuantityStatus == "FullReceive") {
                                                        let bidsInputpaymentsReceived = bid.buyerpayments;
                                                        bid.currentcomment = bid.currentcomment + ' Your ' + bidsInputpaymentsReceived[0].name + ' payment is ' + bidsInputpaymentsReceived[0].status + ' amount ' + parseFloat((bidsInputpaymentsReceived[0].amount).toFixed(2)) + '.';
                                                        bid.currentcomment = bid.currentcomment + 'Please pay on time.';

                                                        bid.commentIn = 'Green'

                                                    } else {
                                                        let bidsInputpaymentsReceived = bid.buyerpayments;
                                                        bid.currentcomment = bid.currentcomment + bid.receivedQuantity + ' QTL is approved by FarmX as your receivedQuantity.' + ' Your ' + bidsInputpaymentsReceived[0].name + ' payment is now ' + bidsInputpaymentsReceived[0].status + ' for amount ' + parseFloat((bidsInputpaymentsReceived[0].amount).toFixed(2)) + '.';
                                                        if (bidsInputpaymentsReceived[0].amount > 0) {
                                                            bid.currentcomment = bid.currentcomment + 'Please pay on time.';
                                                        }

                                                        bid.commentIn = 'Green'
                                                    }
                                                }
                                            }
                                        } else {
                                            bid.tab = tabName
                                            bid.currentcomment = ' '
                                            bid.commentIn = 'Red'
                                        }
                                        if (bid.tab == 'Failed') {
                                            var findTransactionQry = {}
                                            findTransactionQry.bidId = bid.id
                                            findTransactionQry.paymentType = "PayTm"
                                            Transactions.findOne(findTransactionQry).then(function (bidTransactions) {
                                                if (bidTransactions) {
                                                    bid.transactionStatus = bidTransactions
                                                }
                                                callback();
                                            }).fail(function (transErr) {
                                                callback();
                                            })
                                        } else if (bid.status != 'Accepted') {
                                            callback();
                                        }
                                    }).fail(function (error) {
                                        callback(error);
                                    });
                                } else {
                                    callback();
                                }
                            }, function (error) {
                                if (error) {
                                    return res.status(400).jsonx({
                                        success: false,
                                        error: error,
                                    });
                                } else {
                                    return res.status(200).jsonx({
                                        success: true,
                                        data: bids,
                                        total: counttotal
                                    });
                                }
                            });
                        }
                    })
            }
        })
    },

    sellerBids: function (req, res) {
        var Id = req.param('id');
        Bids.find({
            user: Id,
            type: 'CROP'
        }).sort('createdAt DESC')
            .populate('crop')
            .populate('popId')
            .populate('logisticId')
            .populate('buyerpayments', { status: 'Due', type: "Final" })

            .then(function (bids) {
                async.each(bids, function (bid, callback) {
                    if (bid.crop && bid.crop.category) {
                        let query = {};
                        query.id = bid.crop.category;
                        Category.findOne(query).then(function (categoty) {
                            bid.crop.category = categoty;

                            if (bid.status == 'Withdrawal') {
                                bid.tab = 'Failed'
                                if (bid.withdrawalAt) {
                                    bid.currentcomment = 'You have withdrawal your bid on ' + commonService.longDateFormat((new Date(bid.withdrawalAt)))
                                } else {
                                    bid.currentcomment = 'You have withdrawal your bid'
                                }
                                bid.commentIn = 'Red'
                            } else if (bid.status == 'Failed') {
                                bid.tab = 'Failed'
                                bid.currentcomment = 'Your bid was failed.'
                                bid.commentIn = 'Red'
                            } else if (bid.status == 'Pending') {
                                bid.tab = 'Active'
                                bid.currentcomment = 'Your bid is successfully placed. Waiting for seller to accept it.'
                                bid.commentIn = 'Yellow'
                            } else if (bid.status == 'Rejected') {
                                bid.tab = 'Failed'
                                if (bid.rejectedAt) {
                                    bid.currentcomment = 'Your bid is Rejected on ' + commonService.longDateFormat((new Date(bid.rejectedAt)))
                                } else {
                                    bid.currentcomment = 'Your bid is Rejected'
                                }
                                bid.commentIn = 'Red'
                            } else if (bid.status == 'Accepted') {
                                bid.tab = 'Active'
                                var acceptComment = ''

                                var payqry = {}
                                payqry.bidId = bid.id
                                payqry.type = {
                                    $ne: 'Earnest'
                                }

                                Bidspayment.find(payqry).sort('sequenceNumber ASC')
                                    .then(function (payments) {
                                        var commentsecondpart = ''
                                        var toAdd = false
                                        var breakLoop = false
                                        payments.forEach((payment, i) => {
                                            if (breakLoop == false) {
                                                if (toAdd == false) {
                                                    commentsecondpart = ''
                                                } else {
                                                    commentsecondpart = commentsecondpart + ' '
                                                }
                                                if (payment.status == 'Verified') {
                                                    toAdd = true
                                                    commentsecondpart = commentsecondpart + 'Your ' + payment.name + ' is Verified.'

                                                    if (i == payments.length - 1) {
                                                        if (bid.popId) {
                                                            if (bid.popId.allApprovedByBuyer == false) {
                                                                commentsecondpart = 'All your payments are verified. Please look into acceptance of your product.'
                                                                bid.commentIn = 'Yellow'
                                                            } else {
                                                                if (bid.ETD) {
                                                                    commentsecondpart = 'All your process is done. Estimate date for dispatch of your product is ' + commonService.longDateFormat((new Date(bid.ETD)))
                                                                    bid.commentIn = 'Green'
                                                                    if (bid.ETA) {
                                                                        commentsecondpart = commentsecondpart + ' and estimate time for arrival of your product is ' + commonService.longDateFormat((new Date(bid.ETA)))
                                                                    }
                                                                } else {
                                                                    bid.commentIn = 'Green'
                                                                    commentsecondpart = 'All your process is done. We will dispatch your product soon.'
                                                                }
                                                            }
                                                        }
                                                    }
                                                } else if (payment.status == 'Overdue') {
                                                    toAdd = false
                                                    commentsecondpart = commentsecondpart + 'Your ' + payment.name + ' is Overdue. Please pay it soon to avoid cancellation of bid.'
                                                    bid.commentIn = 'Red'

                                                    breakLoop = true

                                                } else if (payment.status == 'Paid') {
                                                    toAdd = true
                                                    commentsecondpart = commentsecondpart + 'Thank You for paying ' + payment.name + '. We will verify this soon.'
                                                    bid.commentIn = 'Green'
                                                } else if (payment.status == 'Due') {

                                                    toAdd = false
                                                    if (i == 0) {
                                                        acceptComment = 'Congratulations! Your bid is Accepted by farmer on ' + commonService.longDateFormat((new Date(bid.acceptedAt)))
                                                    }

                                                    if (payment.type == "Deposit") {

                                                        if (payment.paymentDueDate) {
                                                            commentsecondpart = commentsecondpart + 'Your ' + payment.name + ' consisting of ₹' + parseFloat((payment.amount).toFixed(2)) + ' is Due on ' + commonService.longDateFormat((new Date(payment.paymentDueDate)))
                                                            breakLoop = true;
                                                        } else {
                                                            commentsecondpart = commentsecondpart + " Your product is ready to dispatch and you will be informed once its dispatched";
                                                            breakLoop = true;
                                                        }
                                                    } else if (payment.type == "Final") {

                                                        if (payment.paymentDueDate) {
                                                            commentsecondpart = commentsecondpart + 'Your ' + payment.name + ' consisting of ₹' + parseFloat((payment.amount).toFixed(2)) + ' is Due on ' + commonService.longDateFormat((new Date(payment.paymentDueDate)))
                                                        }
                                                    }
                                                    // commentsecondpart = commentsecondpart + 'Your ' + payment.name + ' consisting of ₹' + payment.amount + ' is Due on ' + commonService.longDateFormat((new Date(payment.paymentDueDate)))
                                                    bid.commentIn = 'Green'

                                                    // breakLoop = true
                                                }
                                            }
                                        })
                                        if (acceptComment.length > 0) {
                                            acceptComment = acceptComment + ". "
                                        }
                                        acceptComment = acceptComment + commentsecondpart
                                        bid.currentcomment = acceptComment
                                        callback()
                                    }).fail(function (err) {
                                        callback()
                                    })
                            } else if (bid.status == 'Dispatched') {
                                bid.tab = 'Active'
                                if (bid.ATD) {
                                    bid.currentcomment = 'Your crop order is Dispatched on ' + commonService.longDateFormat((new Date(bid.ATD))) + "."
                                } else {
                                    bid.currentcomment = 'Your crop order is Dispatched.'
                                }

                                if (bid.logisticsOption == 'self') {
                                    bid.currentcomment = bid.currentcomment + ' Please accept it within 48 hours or else it will be considered as Received.'
                                }
                                bid.commentIn = 'Green'
                            } else if (bid.status == 'Delivered') {
                                bid.tab = 'Delivered'
                                if (bid.ATA) {
                                    bid.currentcomment = 'Your crop order is Delivered on ' + commonService.longDateFormat((new Date(bid.ATA))) + '. Please accept it within 48 hours or else it will be considered as Received.'
                                } else {
                                    bid.currentcomment = 'Your crop order is Delivered' + '. Please accept it within 48 hours or else it will be considered as Received.'
                                }
                                bid.commentIn = 'Green'
                            } else if (bid.status == 'Received') {
                                bid.tab = 'Delivered'
                                if (bid.receivedDate) {
                                    bid.currentcomment = 'You received your crop on ' + commonService.longDateFormat((new Date(bid.receivedDate))) + ". "
                                } else {
                                    bid.currentcomment = 'You have received your crop' + ". "
                                }

                                if (bid.receivedQuantityStatus != undefined && bid.receivedQuantityStatus == "Pending") {
                                    let bidsInputpaymentsReceived = bid.buyerpayments;
                                    bid.currentcomment = bid.currentcomment + "Received quantity is noted. It will be verified soon and accordingly financial adjustments will be done."

                                    bid.commentIn = 'Yellow'
                                } else {
                                    if (bid.buyerpayments.length > 0) {
                                        if (bid.receivedQuantityStatus == "Pending") {
                                            let bidsInputpaymentsReceived = bid.buyerpayments;
                                            bid.currentcomment = "Received quantity is noted. It will be verified soon and accordingly financial adjustments will be done."

                                            bid.commentIn = 'Yellow'
                                        } else if (bid.receivedQuantityStatus == "FullReceive") {
                                            let bidsInputpaymentsReceived = bid.buyerpayments;
                                            bid.currentcomment = bid.currentcomment + ' Your ' + bidsInputpaymentsReceived[0].name + ' payment is ' + bidsInputpaymentsReceived[0].status + ' amount ' + parseFloat((bidsInputpaymentsReceived[0].amount).toFixed(2)) + '.';
                                            bid.currentcomment = bid.currentcomment + 'Please pay on time.';

                                            bid.commentIn = 'Green'

                                        } else {
                                            let bidsInputpaymentsReceived = bid.buyerpayments;
                                            bid.currentcomment = bid.currentcomment + bid.receivedQuantity + ' QTL is approved by FarmX as your receivedQuantity.' + ' Your ' + bidsInputpaymentsReceived[0].name + ' payment is now ' + bidsInputpaymentsReceived[0].status + ' for amount ' + parseFloat((bidsInputpaymentsReceived[0].amount).toFixed(2)) + '.';
                                            if (bidsInputpaymentsReceived[0].amount > 0) {
                                                bid.currentcomment = bid.currentcomment + 'Please pay on time.';
                                            }

                                            bid.commentIn = 'Green'
                                        }
                                    }
                                }
                            } else {
                                bid.tab = 'Failed'
                                bid.currentcomment = ' '
                                bid.commentIn = 'Red'
                            }
                            if (bid.tab == 'Failed') {
                                var findTransactionQry = {}
                                findTransactionQry.bidId = bid.id
                                findTransactionQry.paymentType = "PayTm"
                                Transactions.findOne(findTransactionQry).then(function (bidTransactions) {
                                    if (bidTransactions) {
                                        bid.transactionStatus = bidTransactions
                                    }
                                    callback();
                                }).fail(function (transErr) {
                                    callback();
                                })
                            } else if (bid.status != 'Accepted') {
                                callback();
                            }
                        }).fail(function (error) {
                            callback(error);
                        });
                    } else {
                        callback();
                    }
                }, function (error) {
                    if (error) {
                        return res.status(400).jsonx({
                            success: false,
                            error: error,
                        });
                    } else {
                        return res.status(200).jsonx({
                            success: true,
                            data: bids,
                        });
                    }
                });
            }).fail(function (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            });
    },

    financeDashboard: function (req, res) {
        /*var today = moment();
        var daystart  = moment().startOf('day')*/

        var qry = {};
        //qry.paymentMedia = { $ne: "Cart" }
        // qry.$and = [ { 
        //               productType: { $ne: "input"
        //             },{ productType:"crop"}
        //           ];

        /*if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            qry.pincode = { "$in": pincode };
        }*/

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                };
            }
        }

        if (req.param('productType')) {
            qry.productType = req.param('productType')
        } else {
            qry.productType = 'crop'
        }

        if (req.param('status') == 'Received') {
            qry.$or = [{
                status: 'Paid'
            }, {
                status: 'Verified'
            }]
            datakey = 'depositedOn';
            qry.$and = [{
                depositedOn: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                depositedOn: {
                    $lte: new Date(req.param('to'))
                }
            }]
        } else if (req.param('status') == 'Due') {
            qry.status = req.param('status');
            qry.$and = [{
                paymentDueDate: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                paymentDueDate: {
                    $lte: new Date(req.param('to'))
                }
            }]
        } else if (req.param('status') == 'Overdue') {
            qry.status = req.param('status');
            qry.$and = [{
                paymentDueDate: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                paymentDueDate: {
                    $lte: new Date(req.param('to'))
                }
            }]
        }

        Bidspayment.native(function (err, bidlist) {
            bidlist.aggregate([{
                $match: qry
            },
            {
                $project: {
                    type: "$type",
                    status: "$status",
                    amount: "$amount"
                }
            },
            {
                $group: {
                    _id: {
                        type: "$type",
                        status: "$status"
                    },
                    'amount': {
                        $sum: "$amount"
                    },
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.status",
                    'status': {
                        $push: {
                            status: "$_id.type",
                            count: "$count",
                            amount: "$amount"
                        }
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

    financeSellerDashboard: function (req, res) {
        var qry = {};
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }
        if (req.param('status') == 'Made') {
            qry.$or = [{
                status: 'Paid'
            }, {
                status: 'Verified'
            }]
            qry.$and = [{
                depositedOn: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                depositedOn: {
                    $lte: new Date(req.param('to'))
                }
            }]
        } else if (req.param('status') == 'Due') {
            qry.status = req.param('status');
            qry.$and = [{
                paymentDueDate: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                paymentDueDate: {
                    $lte: new Date(req.param('to'))
                }
            }]
        } else if (req.param('status') == 'Overdue') {
            qry.status = req.param('status');
            qry.$and = [{
                paymentDueDate: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                paymentDueDate: {
                    $lte: new Date(req.param('to'))
                }
            }]
        }

        if (req.param('productType')) {
            qry.productType = req.param('productType')
        } else {
            qry.productType = 'crop'
        }

        Sellerpayment.native(function (err, bidlist) {
            bidlist.aggregate([{
                $match: qry
            },
            {
                $project: {
                    type: "$type",
                    status: "$status",
                    amount: "$amount"
                }
            },
            {
                $group: {
                    _id: {
                        type: "$type",
                        status: "$status"
                    },
                    'amount': {
                        $sum: "$amount"
                    },
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.status",
                    'status': {
                        $push: {
                            status: "$_id.type",
                            count: "$count",
                            amount: "$amount"
                        }
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

    financeLogisticDashboard: function (req, res) {
        var qry = {};
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }

        qry.$and = [{
            createdAt: {
                $gte: new Date(req.param('from'))
            }
        }, {
            createdAt: {
                $lte: new Date(req.param('to'))
            }
        }]

        LogisticPayment.native(function (err, bidlist) {
            bidlist.aggregate([{
                $match: qry
            },
            {
                $project: {
                    status: "$status",
                    amount: "$amount"
                }
            },
            {
                $group: {
                    _id: "$status",
                    'amount': {
                        $sum: "$amount"
                    },
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

    financeFranchiseeDashboard: function (req, res) {
        var qry = {};
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }

        qry.$and = [{
            createdAt: {
                $gte: new Date(req.param('from'))
            }
        }, {
            createdAt: {
                $lte: new Date(req.param('to'))
            }
        }]

        if (req.param('productType')) {
            qry.productType = req.param('productType')
            if (req.param('productType') == 'land') {
                qry.landInterestId = { $ne: undefined }
            }
        } else {
            qry.productType = 'crop'
        }

        FranchiseePayments.native(function (err, bidlist) {
            bidlist.aggregate([{
                $match: qry
            },
            {
                $project: {
                    status: "$status",
                    amount: "$amount"
                }
            },
            {
                $group: {
                    _id: "$status",
                    'amount': {
                        $sum: "$amount"
                    },
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

    financeLogistic: function (req, res) {

        var qry = {};
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            qry.pincode = {
                "$in": pincode
            };
        }
        qry.type = "Final"

        Bidspayment.native(function (err, bidlist) {
            bidlist.aggregate([{
                $match: {
                    $and: [{
                        createdAt: {
                            $gte: new Date(req.param('from')),
                            $lt: new Date(req.param('to'))
                            /*$gte: new Date("2017-12-15T00:00:00.645Z"),
                            $lt: new Date("2017-12-26T23:59:59.645Z")*/
                        }
                    },
                        qry
                    ]
                }
            },

            {
                $project: {
                    type: "$type",
                    status: "$status",
                    amount: "$amount"
                }
            },
            {
                $group: {
                    _id: {
                        type: "$type",
                        status: "$status"
                    },
                    'amount': {
                        $sum: "$amount"
                    },
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.status",
                    'status': {
                        $push: {
                            status: "$_id.type",
                            count: "$count",
                            amount: "$amount"
                        }
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

    sellerBidPayments: function (req, res) {

        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

        var cropId = ObjectId(req.param('cropId'))

        var query = {}

        query.cropId = cropId
        query.$and = [{ $or: [{ suborder: undefined }, { suborder: null }] }, { bidId: { $ne: undefined } }, { bidId: { $ne: null } }]
        query.paymentMedia = 'Bid'
        //console.log(query, 'query====')
        Sellerpayment.native(function (error, sellerpaymentlist) {
            sellerpaymentlist.aggregate([
                {
                    $match: query
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'buyerId',
                        foreignField: '_id',
                        as: "buyer"
                    }
                },
                {
                    $unwind: '$buyer'
                },
                {
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
                        from: 'crops',
                        localField: 'cropId',
                        foreignField: '_id',
                        as: "crops"
                    }
                },
                {
                    $unwind: '$crops'
                },
                {
                    $project: {
                        id: "$_id",
                        buyerId: "$buyer.fullName",
                        bidcode: "$bid.code",
                        bidAmount: "$bid.amount",
                        bidDate: "$bid.createdAt",
                        bidAcceptedAt: "$bid.acceptedAt",
                        depositedOn: "$depositedOn",
                        paymentDueDate: "$paymentDueDate",
                        paymentDate: "$verifyDate",
                        type: "$type",
                        depositLabel: "$depositLabel",
                        status: "$status",
                        paymentMode: "$paymentMode",
                        amount: "$amount",
                        cropId: "$crops._id"

                    }
                },
                {
                    //$sort:{'paymentDueDate':1}
                    $sort: {
                        'sequenceNumber': 1
                    }
                },
                {
                    $group: {
                        _id: "$bidcode",
                        'payments': {
                            $push: {
                                _id: "$_id",
                                id: "$_id",
                                buyerName: "$buyerId",
                                bidcode: "$bidcode",
                                bidAmount: "$bidAmount",
                                bidDate: "$bidDate",
                                bidAcceptedAt: "$bidAcceptedAt",
                                depositedOn: "$depositedOn",
                                paymentDueDate: "$paymentDueDate",
                                paymentDate: "$paymentDate",
                                type: "$type",
                                depositLabel: "$depositLabel",
                                status: "$status",
                                paymentMode: "$paymentMode",
                                amount: "$amount"
                            }
                        }
                    }
                }
            ], function (err, results) {
                // console.log(results, 'result====');
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
        });
    },

    sellerBidPaymentsAggregatedCrops: function (req, res) {

        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        let cid = req.param('cropId')

        var cropId = ObjectId(cid)

        var query = {}

        Crops.findOne({ id: cid }).exec(function (err, cropInfo) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                let cropIds = []
                if (cropInfo.aggregations) {
                    for (var i = 0; i < cropInfo.aggregations.length; i++) {
                        if (cropInfo.aggregations[i] != null) {
                            cropIds.push(ObjectId(cropInfo.aggregations[i]))
                        }
                    }
                }

                Crops.find({ aggregatedCrops: { $in: [cid] } }, { fields: ['code'] }).exec(function (error, allAggregatedCrrops) {
                    if (allAggregatedCrrops && allAggregatedCrrops.length > 0) {
                        for (var i = 0; i < allAggregatedCrrops.length; i++) {
                            if (cropIds.indexOf(allAggregatedCrrops[i].id) !== -1) {

                            } else {
                                cropIds.push(ObjectId(allAggregatedCrrops[i].id))
                            }
                        }
                    }

                    query.$or = [{ "cropId": { "$in": cropIds } }, { "baseCropId": cropId }]
                    query.cropId = { "$ne": cropId }

                    query.sellerId = ObjectId(req.identity.id)
                    query.$and = [{ $or: [{ suborder: undefined }, { suborder: null }] }, { bidId: { $ne: undefined } }, { bidId: { $ne: null } }]
                    query.paymentMedia = 'Bid'

                    Sellerpayment.native(function (error, sellerpaymentlist) {
                        sellerpaymentlist.aggregate([
                            {
                                $match: query
                            },
                            {
                                $lookup: {
                                    from: 'users',
                                    localField: 'buyerId',
                                    foreignField: '_id',
                                    as: "buyer"
                                }
                            },
                            {
                                $unwind: '$buyer'
                            },
                            {
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
                                    from: 'crops',
                                    localField: 'cropId',
                                    foreignField: '_id',
                                    as: "crops"
                                }
                            },
                            {
                                $unwind: '$crops'
                            },
                            {
                                $project: {
                                    id: "$_id",
                                    buyerId: "$buyer.fullName",
                                    bidcode: "$bid.code",
                                    bidAmount: "$bid.amount",
                                    bidDate: "$bid.createdAt",
                                    bidAcceptedAt: "$bid.acceptedAt",
                                    depositedOn: "$depositedOn",
                                    paymentDueDate: "$paymentDueDate",
                                    type: "$type",
                                    depositLabel: "$depositLabel",
                                    status: "$status",
                                    paymentMode: "$paymentMode",
                                    amount: "$amount",
                                    cropId: "$crops._id",
                                    cropCode: "$crops.code",
                                    bidQuantity: "$bid.quantity",
                                    netamount: {
                                        "$cond": [{
                                            "$or": [
                                                { "$eq": ["$status", "Due"] },
                                                { "$eq": ["$status", "Paid"] },
                                                { "$eq": ["$status", "Verified"] },
                                                { "$eq": ["$status", "Overdue"] }
                                            ]
                                        }, "$amount", { $multiply: ["$amount", -1] }
                                        ]
                                    }
                                }
                            },
                            {
                                //$sort:{'paymentDueDate':1}
                                $sort: {
                                    'sequenceNumber': 1
                                }
                            },
                            {
                                $group: {
                                    _id: {
                                        bidcode: "$bidcode",
                                        bidAmount: "$bidAmount",
                                        quantity: "$bidQuantity",
                                        cropCode: "$cropCode",
                                        cropId: "$cropId",
                                        buyerName: "$buyerId",
                                    },
                                    'payments': {
                                        $push: {
                                            _id: "$_id",
                                            id: "$_id",
                                            buyerName: "$buyerId",
                                            bidcode: "$bidcode",
                                            bidAmount: "$bidAmount",
                                            bidDate: "$bidDate",
                                            bidAcceptedAt: "$bidAcceptedAt",
                                            depositedOn: "$depositedOn",
                                            paymentDueDate: "$paymentDueDate",
                                            type: "$type",
                                            depositLabel: "$depositLabel",
                                            status: "$status",
                                            paymentMode: "$paymentMode",
                                            amount: "$amount",
                                            cropId: "$cropId",
                                            cropCode: "$cropCode"
                                        }
                                    },
                                    totalAmount: {
                                        "$sum": "$netamount"
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: "$_id.bidcode",
                                    cropCode: "$_id.cropCode",
                                    payments: '$payments',
                                    quantity: { $multiply: ["$_id.quantity", { $divide: ["$totalAmount", "$_id.bidAmount"] }] },
                                    amount: '$totalAmount',
                                    cropId: "$_id.cropId",
                                    buyerName: "$_id.buyerName"

                                }
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
                                    data: results
                                });
                            }
                        });
                    });
                })
            }
        })
    },

    addProofOfProduct: function (req, res) {
        return API(BidService.saveProofOfProduct, req, res)
    },

    getProofOfProduct: function (req, res) {
        return API(BidService.getProofofproduct, req, res)
    },

    verifyProofOfProduct: function (req, res) {
        return API(BidService.verifyProofOfProduct, req, res)
    },

    franchiseeBids: function (req, res) {
        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";

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

        // if (req.param('pincode')) {
        //     var pincodes = JSON.parse(req.param('pincode'));
        //     if (pincodes.length > 0) {
        //         query.pincode = {
        //             "$in": pincodes
        //         }
        //     }
        // }
        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

        query.GM = ObjectId(req.identity.id)

        if (search) {
            query.$or = [{
                bidcode: parseFloat(search)
            },
            {
                cropCode: parseFloat(search)
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
                cropName: {
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
            },
            ]
        }

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
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crops"
                }
            },
            {
                $unwind: '$crops'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'crops.seller',
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
                    localField: 'crops.category',
                    foreignField: '_id',
                    as: "categorytbl"
                }
            },
            { $unwind: '$categorytbl' },
            {
                $lookup: {
                    from: 'market',
                    localField: 'crops.market',
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
                    buyerName: "$buyer.fullName",
                    buyerId: "$user",
                    sellerName: "$sellers.fullName",
                    sellerId: "$sellers._id",
                    cropId: "$crops._id",
                    category: "$crops.category",
                    cropCode: "$crops.code",
                    pincode: "$crops.pincode",
                    cropName: "$crops.name",
                    bidcode: "$code",
                    bidQuantity: "$quantity",
                    bidRate: "$bidRate",
                    bidAmount: "$amount",
                    packaging: '$packaging',
                    categorypackaging: '$categorytbl.packaging',
                    bidDate: "$createdAt",
                    bidAcceptedAt: "$acceptedAt",
                    bidStatus: "$status",
                    bidTotalAmount: "$totalAmount",
                    quantityUnit: "$quantityUnit",
                    reason: "$reason",
                    comment: "$comment",
                    receivedQuantityStatus: "$receivedQuantityStatus",
                    receivedQuantity: "$receivedQuantity",
                    askedReceivedQuantity: "$askedReceivedQuantity",
                    receivedQuantityReason: "$receivedQuantityReason",
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
                            from: 'crops',
                            localField: 'crop',
                            foreignField: '_id',
                            as: "crops"
                        }
                    },
                    {
                        $unwind: '$crops'
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'crops.seller',
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
                            localField: 'crops.category',
                            foreignField: '_id',
                            as: "categorytbl"
                        }
                    },
                    { $unwind: '$categorytbl' },
                    {
                        $lookup: {
                            from: 'market',
                            localField: 'crops.market',
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
                            buyerName: "$buyer.fullName",
                            packaging: '$packaging',
                            categorypackaging: '$categorytbl.packaging',
                            buyerId: "$user",
                            sellerName: "$sellers.fullName",
                            sellerId: "$sellers._id",
                            cropId: "$crops._id",
                            category: "$crops.category",
                            cropCode: "$crops.code",
                            pincode: "$crops.pincode",
                            cropName: "$crops.name",
                            bidcode: "$code",
                            bidQuantity: "$quantity",
                            bidRate: "$bidRate",
                            bidAmount: "$amount",
                            bidDate: "$createdAt",
                            bidAcceptedAt: "$acceptedAt",
                            bidStatus: "$status",
                            bidTotalAmount: "$totalAmount",
                            quantityUnit: "$quantityUnit",
                            reason: "$reason",
                            comment: "$comment",
                            createdAt: "$createdAt",
                            receivedQuantityStatus: "$receivedQuantityStatus",
                            receivedQuantity: "$receivedQuantity",
                            askedReceivedQuantity: "$askedReceivedQuantity",
                            receivedQuantityReason: "$receivedQuantityReason",
                            GM: "$market.GM"
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
                            async.each(results, function (bid, callback) {
                                let bidId = bid.id
                                let paymentquery = {};
                                paymentquery.bidId = bidId.toString()

                                Bidspayment.count(paymentquery).then(function (buyerPaymentsTotal) {
                                    bid.totalBuyerPayment = buyerPaymentsTotal
                                    Sellerpayment.count(paymentquery).then(function (sellerPaymentsTotal) {
                                        bid.totalSellerPayment = sellerPaymentsTotal
                                        paymentquery.$or = [{
                                            status: 'Paid'
                                        }, {
                                            status: 'Verified'
                                        }]
                                        Bidspayment.count(paymentquery).then(function (buyerPaidPayments) {
                                            bid.paidBuyerPayments = buyerPaidPayments
                                            Sellerpayment.count(paymentquery).then(function (sellerPaidPayments) {
                                                bid.paidSellerPayments = sellerPaidPayments
                                                callback();
                                            }).fail(function (error) {
                                                callback();
                                            })
                                        }).fail(function (error) {
                                            callback();
                                        })
                                    }).fail(function (error) {
                                        callback();
                                    })
                                }).fail(function (error) {
                                    callback(error);
                                });
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
                }
            });
        });
    },

    canAddProofOfProduct: function (req, res) {
        var query = {}
        query.bidId = req.param('bidId');

        Bidspayment.count(query).then(function (bidPaymentCounts) {
            if (bidPaymentCounts > 0) {
                query.status = 'Verified'
                Bidspayment.count(query).then(function (verifiedPaymentCounts) {
                    if (verifiedPaymentCounts == bidPaymentCounts) {
                        return res.status(200).jsonx({
                            canAdd: true
                        });
                    } else {
                        return res.status(400).jsonx({
                            canAdd: false
                        });
                    }
                });
            } else {
                return res.status(400).jsonx({
                    canAdd: false
                });
            }
        });
    },

    addedProofOfProduct: function (req, res) {
        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";

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
        query.popId = {
            "$exists": true
        }
        query.bidStatus = "Accepted"

        if (req.param('pincode')) {
            var pincodes = JSON.parse(req.param('pincode'));
            if (pincodes.length > 0) {
                query.pincode = {
                    "$in": pincodes
                }
            }
        }

        if (search) {
            query.$or = [{
                bidcode: parseFloat(search)
            },
            {
                cropCode: parseFloat(search)
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
                cropName: {
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
            },
            ]
        }

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
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crops"
                }
            },
            {
                $unwind: '$crops'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'crops.seller',
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
                    cropId: "$crops._id",
                    cropCode: "$crops.code",
                    pincode: "$crops.pincode",
                    cropName: "$crops.name",
                    bidcode: "$code",
                    bidQuantity: "$quantity",
                    bidRate: "$bidRate",
                    bidAmount: "$amount",
                    bidDate: "$createdAt",
                    bidAcceptedAt: "$acceptedAt",
                    bidStatus: "$status",
                    bidTotalAmount: "$totalAmount",
                    popId: "$popId",
                    quantityUnit: "$quantityUnit"
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
                            from: 'crops',
                            localField: 'crop',
                            foreignField: '_id',
                            as: "crops"
                        }
                    },
                    {
                        $unwind: '$crops'
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'crops.seller',
                            foreignField: '_id',
                            as: "sellers"
                        }
                    },
                    {
                        $unwind: '$sellers'
                    },
                    {
                        $lookup: {
                            from: 'proofofproduct',
                            localField: 'popId',
                            foreignField: '_id',
                            as: "pop"
                        }
                    },
                    {
                        $unwind: '$pop'
                    },
                    {
                        $project: {
                            id: "$_id",
                            buyerName: "$buyer.fullName",
                            buyerId: "$user",
                            sellerName: "$sellers.fullName",
                            sellerId: "$sellers._id",
                            cropId: "$crops._id",
                            cropCode: "$crops.code",
                            pincode: "$crops.pincode",
                            cropName: "$crops.name",
                            bidcode: "$code",
                            bidQuantity: "$quantity",
                            bidRate: "$bidRate",
                            bidAmount: "$amount",
                            bidDate: "$createdAt",
                            bidAcceptedAt: "$acceptedAt",
                            bidStatus: "$status",
                            bidTotalAmount: "$totalAmount",
                            popId: "$popId",
                            popCode: "$pop.code",
                            // popApprovedByQC: "$pop.allApprovedByQC",
                            popApprovedByBuyer: "$pop.allApprovedByBuyer",
                            quantityUnit: "$quantityUnit",
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
                                    bids: results,
                                    total: totalresults.length
                                }
                            });
                        }
                    });
                }
            });
        });
    },

    bidsToAddProofOfProduct: function (req, res) {
        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";

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
        query.popId = {
            "$exists": false
        }
        query.bidStatus = "Accepted"

        if (req.param('pincode')) {
            var pincodes = JSON.parse(req.param('pincode'));
            if (pincodes.length > 0) {
                query.pincode = {
                    "$in": pincodes
                }
            }
        }

        if (search) {
            query.$or = [{
                bidcode: parseFloat(search)
            },
            {
                cropCode: parseFloat(search)
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
                cropName: {
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
            },
            ]
        }

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
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crops"
                }
            },
            {
                $unwind: '$crops'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'crops.seller',
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
                    cropId: "$crops._id",
                    cropCode: "$crops.code",
                    pincode: "$crops.pincode",
                    cropName: "$crops.name",
                    bidcode: "$code",
                    bidQuantity: "$quantity",
                    bidRate: "$bidRate",
                    bidAmount: "$amount",
                    bidDate: "$createdAt",
                    bidAcceptedAt: "$acceptedAt",
                    bidStatus: "$status",
                    bidTotalAmount: "$totalAmount",
                    popId: "$popId",
                    quantityUnit: "$quantityUnit",
                    createdAt: "$createdAt"
                }
            },
            {
                $match: query
            },
            {
                $sort: sortquery
            }
            ], function (err, totalresults) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    var bidsForProofOfProduct = [];
                    async.each(totalresults, function (bid, callback) {
                        let bidId = bid.id
                        let paymentquery = {};
                        paymentquery.bidId = bidId.toString()

                        Bidspayment.count(paymentquery).then(function (bidPaymentCounts) {
                            if (bidPaymentCounts > 0) {
                                paymentquery.status = 'Verified'
                                Bidspayment.count(paymentquery).then(function (verifiedPaymentCounts) {
                                    if (verifiedPaymentCounts == bidPaymentCounts) {
                                        bidsForProofOfProduct.push(bid);
                                        callback();
                                    } else {
                                        callback();
                                    }
                                }).fail(function (err) {
                                    callback();
                                })
                            } else {
                                callback();
                            }
                        }).fail(function (err) {
                            callback();
                        })
                    }, function (asyncError) {
                        if (asyncError) {
                            return res.status(400).jsonx({
                                success: false,
                                error: error,
                            });
                        } else {
                            var bidsToPost = [];
                            if (count && page) {
                                if (bidsForProofOfProduct.length > 0) {
                                    var fromIndex = skipNo;
                                    var toIndex = 0;
                                    if (skipNo >= bidsForProofOfProduct.length) {
                                        toIndex = bidsForProofOfProduct.length - 1
                                    } else {
                                        if ((skipNo + count) > bidsForProofOfProduct.length) {
                                            toIndex = bidsForProofOfProduct.length - 1
                                        } else {
                                            toIndex = skipNo + count - 1
                                        }
                                    }

                                    if (fromIndex == NaN || toIndex == NaN) {
                                        bidsToPost = bidsForProofOfProduct
                                    } else if (fromIndex == toIndex) {
                                        bidsToPost.push(bidsForProofOfProduct[fromIndex])
                                    } else if (fromIndex > toIndex) {
                                        for (var i = fromIndex; i >= toIndex; i++) {
                                            bidsToPost.push(bidsForProofOfProduct[i])
                                        }
                                    }

                                }
                            } else {
                                bidsToPost = bidsForProofOfProduct
                            }

                            return res.jsonx({
                                success: true,
                                data: {
                                    bids: bidsToPost,
                                    total: bidsForProofOfProduct.length
                                }
                            });
                        }
                    });
                }
            });
        });
    },

    franchiseeDeliveryBids: function (req, res) {
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

        // query.logisticsOption = 'efarmx'
        if (req.param('pincode')) {
            var pincodes = JSON.parse(req.param('pincode'));
            if (pincodes.length > 0) {
                query.pincode = {
                    "$in": pincodes
                }
            }
        }
        // var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        // query.GM = ObjectId(req.identity.id)
        if (search) {
            query.$or = [{
                bidcode: parseFloat(search)
            },
            {
                cropCode: parseFloat(search)
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
                cropName: {
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
        // console.log(query, 'query===')
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
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crops"
                }
            },
            {
                $unwind: '$crops'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'crops.seller',
                    foreignField: '_id',
                    as: "sellers"
                }
            },
            {
                $unwind: '$sellers'
            },
            // {
            //     $lookup: {
            //         from: 'market',
            //         localField: 'crops.market',
            //         foreignField: '_id',
            //         as: "market"
            //     }
            // },
            // {
            //     $unwind: {
            //         path:'$market',
            //         preserveNullAndEmptyArrays:true
            //     }
            // },
            {
                $project: {
                    id: "$_id",
                    buyerName: "$buyer.fullName",
                    buyerId: "$user",
                    sellerName: "$sellers.fullName",
                    sellerId: "$sellers._id",
                    cropId: "$crops._id",
                    cropCode: "$crops.code",
                    pincode: "$crops.pincode",
                    cropName: "$crops.name",
                    bidcode: "$code",
                    bidQuantity: "$quantity",
                    bidRate: "$bidRate",
                    bidAmount: "$amount",
                    bidDate: "$createdAt",
                    bidAcceptedAt: "$acceptedAt",
                    bidStatus: "$status",
                    bidTotalAmount: "$totalAmount",
                    popId: "$popId",
                    quantityUnit: "$quantityUnit",
                    logisticsOption: "$logisticsOption",
                    packaging: '$packaging',
                    ETD: "$ETD",
                    ETA: "$ETA",
                    ATD: "$ATD",
                    ATA: "$ATA",
                    deliveryTime: "$deliveryTime",
                    receivedQuantityStatus: "$receivedQuantityStatus",
                    receivedQuantity: "$receivedQuantity",
                    askedReceivedQuantity: "$askedReceivedQuantity",
                    receivedQuantityReason: "$receivedQuantityReason"
                    // GM: "$market.GM"
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
                        from: 'crops',
                        localField: 'crop',
                        foreignField: '_id',
                        as: "crops"
                    }
                },
                {
                    $unwind: '$crops'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'crops.seller',
                        foreignField: '_id',
                        as: "sellers"
                    }
                },
                {
                    $unwind: '$sellers'
                },
                // {
                //     $lookup: {
                //         from: 'market',
                //         localField: 'crops.market',
                //         foreignField: '_id',
                //         as: "market"
                //     }
                // },
                // {
                //     $unwind: {
                //         path:'$market',
                //         preserveNullAndEmptyArrays:true
                //     }
                // },
                {
                    $project: {
                        id: "$_id",
                        buyerName: "$buyer.fullName",
                        buyerId: "$user",
                        sellerName: "$sellers.fullName",
                        sellerId: "$sellers._id",
                        cropId: "$crops._id",
                        cropCode: "$crops.code",
                        pincode: "$crops.pincode",
                        cropName: "$crops.name",
                        bidcode: "$code",
                        bidQuantity: "$quantity",
                        bidRate: "$bidRate",
                        bidAmount: "$amount",
                        bidDate: "$createdAt",
                        bidAcceptedAt: "$acceptedAt",
                        bidStatus: "$status",
                        bidTotalAmount: "$totalAmount",
                        popId: "$popId",
                        quantityUnit: "$quantityUnit",
                        logisticsOption: "$logisticsOption",
                        logisticId: "$logisticId",
                        packaging: '$packaging',
                        ETD: "$ETD",
                        ETA: "$ETA",
                        ATD: "$ATD",
                        ATA: "$ATA",
                        deliveryTime: "$deliveryTime",
                        createdAt: "$createdAt",
                        receivedQuantityStatus: "$receivedQuantityStatus",
                        receivedQuantity: "$receivedQuantity",
                        askedReceivedQuantity: "$askedReceivedQuantity",
                        receivedQuantityReason: "$receivedQuantityReason"
                        // GM: "$market.GM"                        
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
                                bid.currentStatus = /*"Already " +*/ bid.bidStatus
                                callback();
                            } else if (bid.popId) {
                                Proofofproduct.findOne(paymentquery).then(function (pop) {
                                    /*if (pop.allApprovedByQC == false) {
                                        bid.currentStatus = "QCUnapproved proofofproduct"
                                    } else*/
                                    if (pop.allApprovedByBuyer == false) {
                                        bid.currentStatus = "BuyerUnapproved proofofproduct"
                                    } else {
                                        bid.currentStatus = "Approved proofofproduct"
                                    }
                                    callback();
                                }).fail(function (popErr) {
                                    bid.currentStatus = "Error proofofproduct"
                                    callback();
                                })
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
                                                        bid.currentStatus = "Add proofofproduct"
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
                                                bid.currentStatus = "Add proofofproduct"
                                                callback();
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

    logisticAllDashboard: function (req, res) {
        var qry = {};
        qry.$or = [{
            bidStatus: "Accepted"
        }, {
            bidStatus: "Dispatched"
        }, {
            bidStatus: "Delivered"
        }, , {
            bidStatus: "Received"
        }]
        qry.logisticsOption = 'efarmx'
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }

        qry.$and = [{
            acceptedAt: {
                $gte: new Date(req.param('from'))
            }
        }, {
            acceptedAt: {
                $lte: new Date(req.param('to'))
            }
        }]

        Bids.native(function (err, bidlist) {
            bidlist.aggregate([{
                $lookup: {
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crop"
                }
            },
            {
                $unwind: '$crop'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'crop.seller',
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
                    pincode: "$crop.pincode",
                    bidStatus: "$status",
                    logisticsOption: "$logisticsOption",
                    bidcode: "$code",
                    quantity: "$quantity",
                    quantityUnit: "$quantityUnit",
                    logisticPayment: "$logisticPayment",
                    dropAddress: "$address",
                    acceptedAt: "$acceptedAt",
                    popId: "$popId",
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
                            if (bid.popId) {
                                activeCount = activeCount + 1
                                callback()
                            } else {
                                var getConfirmedQuery = {}
                                getConfirmedQuery.bidId = bid._id.toString()
                                getConfirmedQuery.type = 'Final'
                                getConfirmedQuery.status = 'Verified'
                                Bidspayment.findOne(getConfirmedQuery).then(function (bp) {
                                    if (bp) {
                                        confirmedCount = confirmedCount + 1
                                    }
                                    callback()
                                }).fail(function (bperr) {
                                    callback()
                                });
                            }
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

    /*logisticDashboardAllListings: function(req, res) {
        var qry = {};
        if (req.param('type') == "enroute") {
    
        } else {
    
        }
        qry.$or = [{bidStatus:"Accepted"}, {bidStatus:"Dispatched"}, {bidStatus:"Delivered"}]
        qry.logisticsOption = 'efarmx'
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if(pincode.length > 0){
              qry.pincode = { "$in": pincode}
            }
        }
    
        qry.$and = [{acceptedAt: {$gte: new Date(req.param('from'))}}, {acceptedAt: {$lte: new Date(req.param('to'))}}]
    
        Bids.native(function(err, bidlist) {
            bidlist.aggregate([
            {
                $lookup: {
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crop"
                }
            },
            {
                $unwind: '$crop'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'crop.seller',
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
                    pincode: "$crop.pincode",
                    bidStatus: "$status",
                    logisticsOption: "$logisticsOption",
                    bidcode: "$code",
                    quantity: "$quantity",
                    quantityUnit: "$quantityUnit",
                    logisticPayment: "$logisticPayment",
                    dropAddress: "$address",
                    acceptedAt: "$acceptedAt",
                    popId: "$popId",
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
            ], function(err, allVerified) {
                
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error:err
                    });
                } else {
                    var confirmedCount = 0
                    var activeCount = 0
                    var enrouteCount = 0
                    var completedCount = 0
                    async.each(allVerified, function(bid,callback) {
                        if(bid.bidStatus == "Delivered") {
                            completedCount = completedCount + 1
                            callback()
                        } else if(bid.bidStatus == "Dispatched") {
                            enrouteCount = enrouteCount + 1
                            callback()
                        } else {
                            if (bid.popId) {
                                activeCount = activeCount + 1
                                callback()
                            } else {
                                var getConfirmedQuery = {}
                                getConfirmedQuery.bidId = bid._id.toString()
                                getConfirmedQuery.type = 'Final'
                                getConfirmedQuery.status = 'Verified'
                                Bidspayment.findOne(getConfirmedQuery).then(function(bp) {
                                    if (bp) {
                                        confirmedCount = confirmedCount + 1
                                    }
                                    callback()
                                }).fail(function(bperr) {
                                    callback()
                                });
                            }
                        }
                    }, function(asyncError) {
                        if (asyncError) {
                            return res.status(400).jsonx({
                                success: false,
                                error:asyncError
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
    },*/

    logisticConfirmedDashboard: function (req, res) {
        var qry = {};
        qry.bidStatus = "Accepted"
        qry.logisticsOption = 'efarmx'
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }
        qry.name = 'Deposit 1'
        qry.type = 'Deposit'
        // qry.$or = [{status:'Paid'}, {status:'Verified'}]
        qry.status = 'Verified'
        qry.popId = {
            "$exists": false
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

        qry.$and = [{
            depositedOn: {
                $gte: new Date(req.param('from'))
            }
        }, {
            depositedOn: {
                $lte: new Date(req.param('to'))
            }
        }]

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
                    bidStatus: "$bid.status",
                    logisticsOption: "$bid.logisticsOption",
                    popId: "$bid.popId",
                    status: "$status",
                    type: "$type",
                    name: "$name",
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

    logisticDashboardConfirmedListings: function (req, res) {

        var qry = {};

        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";
        var bidStatus = req.param('bidStatus')

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
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pickupAddressPincode = {
                    "$in": pincode
                }
            }
        }

        qry.type = 'Deposit'
        qry.name = 'Deposit 1'
        qry.status = 'Verified'
        qry.$and = [{
            depositedOn: {
                $gte: new Date(req.param('from'))
            }
        }, {
            depositedOn: {
                $lte: new Date(req.param('to'))
            }
        }]
        qry.popId = {
            "$exists": false
        }

        Bidspayment.native(function (err, bidlist) {
            bidlist.aggregate([
                {
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
                        from: 'crops',
                        localField: 'cropId',
                        foreignField: '_id',
                        as: "crop"
                    }
                },
                {
                    $unwind: '$crop'
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
                        bidId: "$bid._id",
                        bidStatus: "$bid.status",
                        logisticsOption: "$bid.logisticsOption",
                        popId: "$bid.popId",
                        status: "$status",
                        type: "$type",
                        name: "$name",
                        depositedOn: "$depositedOn",
                        logisticId: {
                            $ifNull: ["$bid.logisticId", "nulll"]
                        },
                        ETD: "$ETD",
                        ETA: "$ETA",
                        deliveryTime: "$deliveryTime",
                        dropAddress: "$bid.address",
                        pickupAddress: "$crop.address",
                        pickupAddressCity: "$crop.city",
                        pickupAddressDistrict: "$crop.disctrict",
                        pickupAddressState: "$crop.state",
                        pickupAddressPincode: "$crop.pincode",
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
                        from: 'logistictrip',
                        localField: 'bid.tripId',
                        foreignField: '_id',
                        as: "trip"
                    }
                },
                {
                    $unwind: {
                        path: "$trip",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'crops',
                        localField: 'cropId',
                        foreignField: '_id',
                        as: "crop"
                    }
                },
                {
                    $unwind: '$crop'
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
                        bidId: "$bid._id",
                        bidStatus: "$bid.status",
                        logisticsOption: "$bid.logisticsOption",
                        popId: "$bid.popId",
                        status: "$status",
                        type: "$type",
                        name: "$name",
                        depositedOn: "$depositedOn",
                        logisticId: {
                            $ifNull: ["$bid.logisticId", "nulll"]
                        },
                        ETD: "$ETD",
                        ETA: "$ETA",
                        deliveryTime: "$deliveryTime",
                        dropAddress: "$bid.address",
                        pickupAddress: "$crop.address",
                        pickupAddressCity: "$crop.city",
                        pickupAddressDistrict: "$crop.disctrict",
                        pickupAddressState: "$crop.state",
                        pickupAddressPincode: "$crop.pincode",
                        createdAt: "$createdAt",
                        tripId: "$trip._id",
                        tripCode: "$trip.code",
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

    logisticActiveDashboard: function (req, res) {
        var qry = {};
        qry.bidStatus = "Accepted"
        qry.logisticsOption = 'efarmx'
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

        qry.popId = {
            "$exists": true
        }

        Bids.native(function (err, bidlist) {
            bidlist.aggregate([{
                $lookup: {
                    from: 'proofofproduct',
                    localField: 'popId',
                    foreignField: '_id',
                    as: "pop"
                }
            },
            {
                $unwind: '$pop'
            },
            {
                $lookup: {
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crop"
                }
            },
            {
                $unwind: '$crop'
            },
            {
                $project: {
                    user: "$user",
                    seller: "$crop.seller",
                    bidStatus: "$status",
                    logisticsOption: "$logisticsOption",
                    pincode: "$crop.pincode",
                    popId: "$popId",
                    approvedByBuyer: "$pop.allApprovedByBuyer",
                    // approvedByQC: "$pop.allApprovedByQC"
                }
            },
            {
                $match: qry
            },
            {
                $group: {
                    _id: "$approvedByBuyer",
                    /*_id: {
                        approvedByBuyer: "$approvedByBuyer",
                        approvedByQC: "$approvedByQC"
                    },*/
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

    logisticDashboardActiveListings: function (req, res) {

        var qry = {};

        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";
        var bidStatus = req.param('bidStatus')

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

        /*        if (req.param('approvedByQC')) {
                    if (req.param('approvedByQC') == 'true') {
                       qry.approvedByQC = true
                    } else if (req.param('approvedByQC') == 'false') {
                       qry.approvedByQC = false
                    }
                }
        */
        if (req.param('approvedByBuyer')) {
            if (req.param('approvedByBuyer') == 'true') {
                qry.approvedByBuyer = true
            } else if (req.param('approvedByBuyer') == 'false') {
                qry.approvedByBuyer = false
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
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pickupAddressPincode = {
                    "$in": pincode
                }
            }
        }

        qry.popId = {
            "$exists": true
        }

        Bids.native(function (err, bidlist) {
            bidlist.aggregate([
                {
                    $lookup: {
                        from: 'proofofproduct',
                        localField: 'popId',
                        foreignField: '_id',
                        as: "pop"
                    }
                },
                {
                    $unwind: '$pop'
                },
                {
                    $lookup: {
                        from: 'crops',
                        localField: 'crop',
                        foreignField: '_id',
                        as: "crop"
                    }
                },
                {
                    $unwind: '$crop'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'crop.seller',
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
                        bidId: "$_id",
                        bidStatus: "$status",
                        logisticsOption: "$logisticsOption",
                        cropCode: "$crop.code",
                        cropId: "$crop._id",
                        logisticId: {
                            $ifNull: ["$logisticId", "nulll"]
                        },
                        ETD: "$ETD",
                        ETA: "$ETA",
                        deliveryTime: "$deliveryTime",
                        dropAddress: "$address",
                        pickupAddress: "$crop.address",
                        pickupAddressCity: "$crop.city",
                        pickupAddressDistrict: "$crop.disctrict",
                        pickupAddressState: "$crop.state",
                        pickupAddressPincode: "$crop.pincode",
                        popId: "$popId",
                        approvedByBuyer: "$pop.allApprovedByBuyer",
                        // approvedByQC: "$pop.allApprovedByQC",
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
            ], function (err, totalresults) {

                bidlist.aggregate([
                    {
                        $lookup: {
                            from: 'proofofproduct',
                            localField: 'popId',
                            foreignField: '_id',
                            as: "pop"
                        }
                    },
                    {
                        $unwind: '$pop'
                    },
                    {
                        $lookup: {
                            from: 'logistictrip',
                            localField: 'tripId',
                            foreignField: '_id',
                            as: "trip"
                        }
                    },
                    {
                        $unwind: {
                            path: "$trip",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $lookup: {
                            from: 'crops',
                            localField: 'crop',
                            foreignField: '_id',
                            as: "crop"
                        }
                    },
                    {
                        $unwind: '$crop'
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'crop.seller',
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
                            bidId: "$_id",
                            bidStatus: "$status",
                            logisticsOption: "$logisticsOption",
                            cropCode: "$crop.code",
                            cropId: "$crop._id",
                            logisticId: {
                                $ifNull: ["$logisticId", "nulll"]
                            },
                            ETD: "$ETD",
                            ETA: "$ETA",
                            deliveryTime: "$deliveryTime",
                            dropAddress: "$address",
                            pickupAddress: "$crop.address",
                            pickupAddressCity: "$crop.city",
                            pickupAddressDistrict: "$crop.disctrict",
                            pickupAddressState: "$crop.state",
                            pickupAddressPincode: "$crop.pincode",
                            popId: "$popId",
                            approvedByBuyer: "$pop.allApprovedByBuyer",
                            // approvedByQC: "$pop.allApprovedByQC",
                            createdAt: "$createdAt",
                            tripId: "$trip._id",
                            tripCode: "$trip.code",
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

    logisticEnrouteDashboard: function (req, res) {
        var qry = {};
        qry.bidStatus = "Dispatched"
        qry.logisticsOption = 'efarmx'
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
            bidlist.aggregate([{
                $lookup: {
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crop"
                }
            },
            {
                $unwind: '$crop'
            },
            {
                $project: {
                    user: "$user",
                    seller: "$crop.seller",
                    bidStatus: "$status",
                    logisticsOption: "$logisticsOption",
                    pincode: "$crop.pincode"
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

    logisticDashboardEnrouteListings: function (req, res) {

        console.log('id == ', req.identity.id)
        console.log('identity == ', req.authorization.token.access_token)

        var qry = {};

        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";
        var bidStatus = req.param('bidStatus')

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

        qry.status = "Dispatched"
        qry.logisticsOption = 'efarmx'
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pickupAddressPincode = {
                    "$in": pincode
                }
            }
        }


        Bids.native(function (err, bidlist) {
            bidlist.aggregate([{
                $lookup: {
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crop"
                }
            },
            {
                $unwind: '$crop'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'crop.seller',
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
                    status: "$status",
                    logisticsOption: "$logisticsOption",
                    cropCode: "$crop.code",
                    cropId: "$crop._id",
                    logisticId: "$logisticId",
                    logisticPartner: "$lpartner.companyName",
                    ETD: "$ETD",
                    ETA: "$ETA",
                    ATD: "$ATD",
                    deliveryTime: "$deliveryTime",
                    dropAddress: "$address",
                    pickupAddress: "$crop.address",
                    pickupAddressCity: "$crop.city",
                    pickupAddressDistrict: "$crop.disctrict",
                    pickupAddressState: "$crop.state",
                    pickupAddressPincode: "$crop.pincode"
                }
            },
            {
                $match: qry
            }
            ], function (err, totalresults) {

                bidlist.aggregate([{
                    $lookup: {
                        from: 'crops',
                        localField: 'crop',
                        foreignField: '_id',
                        as: "crop"
                    }
                },
                {
                    $unwind: '$crop'
                },
                {
                    $lookup: {
                        from: 'logistictrip',
                        localField: 'tripId',
                        foreignField: '_id',
                        as: "trip"
                    }
                },
                {
                    $unwind: {
                        path: "$trip",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'crop.seller',
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
                        status: "$status",
                        logisticsOption: "$logisticsOption",
                        cropCode: "$crop.code",
                        cropId: "$crop._id",
                        logisticId: "$logisticId",
                        logisticPartner: "$lpartner.companyName",
                        ETD: "$ETD",
                        ETA: "$ETA",
                        ATD: "$ATD",
                        deliveryTime: "$deliveryTime",
                        dropAddress: "$address",
                        pickupAddress: "$crop.address",
                        pickupAddressCity: "$crop.city",
                        pickupAddressDistrict: "$crop.disctrict",
                        pickupAddressState: "$crop.state",
                        pickupAddressPincode: "$crop.pincode",
                        createdAt: "$createdAt",
                        tripId: "$trip._id",
                        tripCode: "$trip.code"
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

    logisticCompletedDashboard: function (req, res) {
        var qry = {};
        // qry.bidStatus = "Delivered"
        qry.$or = [{
            bidStatus: "Delivered"
        }, {
            bidStatus: "Received"
        }]
        qry.logisticsOption = 'efarmx'
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
            bidlist.aggregate([
                {
                    $lookup: {
                        from: 'crops',
                        localField: 'crop',
                        foreignField: '_id',
                        as: "crop"
                    }
                },
                {
                    $unwind: '$crop'
                },
                {
                    $project: {
                        user: "$user",
                        seller: "$crop.seller",
                        bidcode: "$code",
                        bidId: "$id",
                        bidStatus: "$status",
                        logisticsOption: "$logisticsOption",
                        pincode: "$crop.pincode",
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

    logisticDashboardCompletedListings: function (req, res) {

        var qry = {};

        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";
        var bidStatus = req.param('bidStatus')

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

        // qry.bidStatus = "Delivered"
        qry.$or = [{
            bidStatus: "Delivered"
        }, {
            bidStatus: "Received"
        }]
        qry.logisticsOption = 'efarmx'
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
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crop"
                }
            },
            {
                $unwind: '$crop'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'crop.seller',
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
                    logisticsOption: "$logisticsOption",
                    cropCode: "$crop.code",
                    cropId: "$crop._id",
                    logisticId: "$logisticId",
                    logisticPartner: "$lpartner.companyName",
                    ETD: "$ETD",
                    ETA: "$ETA",
                    ATD: "$ATD",
                    ATA: "$ATA",
                    receivedDate: "$receivedDate",
                    deliveryTime: "$deliveryTime",
                    dropAddress: "$address",
                    pickupAddress: "$crop.address",
                    pickupAddressCity: "$crop.city",
                    pickupAddressDistrict: "$crop.disctrict",
                    pickupAddressState: "$crop.state",
                    pickupAddressPincode: "$crop.pincode",
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
                        from: 'crops',
                        localField: 'crop',
                        foreignField: '_id',
                        as: "crop"
                    }
                },
                {
                    $unwind: '$crop'
                },
                {
                    $lookup: {
                        from: 'logistictrip',
                        localField: 'tripId',
                        foreignField: '_id',
                        as: "trip"
                    }
                },
                {
                    $unwind: {
                        path: "$trip",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'crop.seller',
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
                        logisticsOption: "$logisticsOption",
                        cropCode: "$crop.code",
                        cropId: "$crop._id",
                        logisticId: "$logisticId",
                        logisticPartner: "$lpartner.companyName",
                        ETD: "$ETD",
                        ETA: "$ETA",
                        ATD: "$ATD",
                        ATA: "$ATA",
                        receivedDate: "$receivedDate",
                        deliveryTime: "$deliveryTime",
                        dropAddress: "$address",
                        pickupAddress: "$crop.address",
                        pickupAddressCity: "$crop.city",
                        pickupAddressDistrict: "$crop.disctrict",
                        pickupAddressState: "$crop.state",
                        pickupAddressPincode: "$crop.pincode",
                        compare: {
                            $cmp: ["$ETA", "$ATA"]
                        },
                        createdAt: "$createdAt",
                        tripId: "$trip._id",
                        tripCode: "$trip.code",
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

    //FIELD OFFICER DASHBOARD check on 22 AUG 2018 by rohitk.kumar
    fieldOfficerBidAllDashboard: function (req, res) {
        var qry = {}

        let user = req.identity.id

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }

        if (req.param('userId') && req.param('userId') != undefined && req.param('userId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('userId'))

            qry.seller = userId
        }

        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('buyerId'))

            qry.user = userId
        }

        // qry.isDeleted = false

        qry.$and = [{
            createdAt: {
                $gte: new Date(req.param('from'))
            }
        }, {
            createdAt: {
                $lte: new Date(req.param('to'))
            }
        }]

        Bids.native(function (err, bidlist) {
            bidlist.aggregate([{
                $lookup: {
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crop"
                }
            },
            {
                $unwind: '$crop'
            },
            {
                $project: {
                    pincode: "$crop.pincode",
                    seller: "$crop.seller",
                    user: "$user",
                    isDeleted: "$crop.isDeleted",
                    bidId: "$_id",
                    status: "$status",
                    createdAt: "$createdAt",
                    popId: "$popId"
                }
            },
            {
                $match: qry
            },
            {
                $group: {
                    _id: "$status",
                    count: {
                        $sum: 1
                    }
                }
            }
            ], function (err, result) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: result
                    });

                }
            });
        })
    },

    //FIELD OFFICER DASHBOARD check on 22 AUG 2018 by rohitk.kumar
    fieldOfficerBidCropDashboard: function (req, res) {
        var qry = {}

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }

        if (req.param('userId') && req.param('userId') != undefined && req.param('userId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('userId'))

            qry.seller = userId
        }

        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('buyerId'))

            qry.user = userId
        }
        qry.isDeleted = false

        qry.$and = [{
            createdAt: {
                $gte: new Date(req.param('from'))
            }
        }, {
            createdAt: {
                $lte: new Date(req.param('to'))
            }
        }]

        Bids.native(function (err, bidlist) {
            bidlist.aggregate([{
                $lookup: {
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crop"
                }
            },
            {
                $unwind: '$crop'
            },
            {
                $lookup: {
                    from: 'category',
                    localField: 'crop.category',
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
                    user: "$user",
                    pincode: "$crop.pincode",
                    seller: "$crop.seller",
                    isDeleted: "$crop.isDeleted",
                    bidId: "$id",
                    createdAt: "$createdAt",
                    category: "$category.name",
                    categoryID: "$category._id",
                    parentCategory: "$parentCategory.name"
                }
            },
            {
                $match: qry
            },
            {
                $group: {
                    _id: {
                        parentCategory: "$parentCategory",
                        category: "$category",
                        categoryID: "$categoryID"
                    },
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.parentCategory",
                    'total': {
                        $sum: "$count"
                    },
                    'categories': {
                        $push: {
                            category: "$_id.category",
                            categoryID: "$_id.categoryID",
                            count: "$count"
                        }
                    }
                }
            }
            ], function (err, result) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: result
                    });
                }
            });
        })
    },

    //get data by fpo or other resources
    publicFieldOfficerBids: function (req, res) {
        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";
        var status = req.param('status')

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

        if (status) {
            query.bidStatus = status

        }
        query.userType = 'fpo';
        if (req.param('mobile')) {
            query.mobile = req.param('mobile');
        }

        if (search) {
            query.$or = [{
                bidcode: parseFloat(search)
            },
            {
                cropCode: parseFloat(search)
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
                cropName: {
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


        if (req.param('from') && req.param('to')) {
            query.$and = [{
                bidDate: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                bidDate: {
                    $lte: new Date(req.param('to'))
                }
            }]
        }


        // console.log(query, '===q')
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
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crops"
                }
            },
            {
                $unwind: '$crops'
            },
            {
                $lookup: {
                    from: 'category',
                    localField: 'crops.category',
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
                    as: "parentcategory"
                }
            },
            {
                $unwind: '$parentcategory'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'crops.seller',
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
                    userType: "$sellers.userType",
                    mobile: "$sellers.mobile",
                    cropId: "$crops._id",
                    cropCode: "$crops.code",
                    cropCategory: "$crops.category",
                    cropCategoryName: "$category.name",
                    cropParentCategory: "$parentcategory._id",
                    cropParentCategoryName: "$parentcategory.name",
                    pincode: "$crops.pincode",
                    cropName: "$crops.name",
                    isDeleted: "$crops.isDeleted",
                    bidcode: "$code",
                    bidQuantity: "$quantity",
                    bidRate: "$bidRate",
                    bidAmount: "$amount",
                    bidDate: "$createdAt",
                    createdAt: "$createdAt",
                    bidAcceptedAt: "$acceptedAt",
                    bidStatus: "$status",
                    bidTotalAmount: "$totalAmount",
                    popId: "$popId",
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
                        from: 'crops',
                        localField: 'crop',
                        foreignField: '_id',
                        as: "crops"
                    }
                },
                {
                    $unwind: '$crops'
                },
                {
                    $lookup: {
                        from: 'category',
                        localField: 'crops.category',
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
                        as: "parentcategory"
                    }
                },
                {
                    $unwind: '$parentcategory'
                },
                {
                    $lookup: {
                        from: 'market',
                        localField: 'crops.market',
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
                    $lookup: {
                        from: 'users',
                        localField: 'market.GM',
                        foreignField: '_id',
                        as: "franchisee"
                    }
                },
                {
                    $unwind: {
                        path: '$franchisee',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'crops.seller',
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
                        userType: "$sellers.userType",
                        mobile: "$sellers.mobile",
                        cropId: "$crops._id",
                        cropCode: "$crops.code",
                        cropCategory: "$crops.category",
                        cropCategoryName: "$category.name",
                        cropParentCategory: "$parentcategory._id",
                        cropParentCategoryName: "$parentcategory.name",
                        pincode: "$crops.pincode",
                        market: "$crops.market",
                        marketName: "$market.name",
                        franchisee: "$franchisee._id",
                        franchiseeName: "$franchisee.fullName",
                        cropName: "$crops.name",
                        isDeleted: "$crops.isDeleted",
                        bidcode: "$code",
                        bidQuantity: "$quantity",
                        bidRate: "$bidRate",
                        bidAmount: "$amount",
                        bidDate: "$createdAt",
                        createdAt: "$createdAt",
                        bidAcceptedAt: "$acceptedAt",
                        bidStatus: "$status",
                        bidTotalAmount: "$totalAmount",
                        popId: "$popId",
                        quantityUnit: "$quantityUnit",
                        logisticsOption: "$logisticsOption",
                        ETD: "$ETD",
                        ETA: "$ETA",
                        ATD: "$ATD",
                        ATA: "$ATA",
                        deliveryTime: "$deliveryTime",
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
                    }
                    else {
                        //console.log(results, 'withoutroles')

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
        });
    },

    // new requirement for dashboard listing for fieldOfficer on 21 AUG 2018 by rohitk.kumar
    fieldOfficerBids: function (req, res) {
        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";
        var status = req.param('status')
        var category = req.param('category')
        var parentcategory = req.param('parentcategory')

        var role = req.param('role')
        var requestedPincode = req.param('pincode')

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

        if (status) {
            query.bidStatus = status
        } else {
            query.$or = [{
                bidStatus: 'Accepted'
            }, {
                bidStatus: 'Dispatched'
            }, {
                bidStatus: 'Delivered'
            }, {
                bidStatus: 'Received'
            }, {
                bidStatus: 'Pending'
            }]
            // } else {
            //     query.$or = [{
            //         bidStatus: 'Accepted'
            //     }, {
            //         bidStatus: 'Dispatched'
            //     }, {
            //         bidStatus: 'Delivered'
            //     }, {
            //         bidStatus: 'Received'
            //     }, {
            //         bidStatus: 'Pending'
            //     }]
        }


        if (search) {
            query.$or = [{
                bidcode: parseFloat(search)
            },
            {
                cropCode: parseFloat(search)
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
                cropName: {
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

        if (category) {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var categoryId = ObjectId(category)
            query.cropParentCategory = categoryId;
        }
        if (parentcategory) {

            query.cropParentCategory = ObjectId(parentcategory);
        }


        query.$and = [{
            bidDate: {
                $gte: new Date(req.param('from'))
            }
        }, {
            bidDate: {
                $lte: new Date(req.param('to'))
            }
        }]

        if (requestedPincode) {
            var pincodes = JSON.parse(requestedPincode);
            if (pincodes.length > 0) {
                query.pincode = { "$in": pincodes }
            }
        }
        // console.log(categoryId, 'categoryId')
        // Category.find({ parentId: categoryId }).then(function (subcategory) {
        //     if (subcategory && categoryId) {
        //         let ids = _.pluck(subcategory, 'id')

        // console.log(ids, 'ids===', categoryId)
        // query.cropParentCategory = categoryId;
        // console.log(query, '=====')
        // }
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
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crops"
                }
            },
            {
                $unwind: '$crops'
            },
            {
                $lookup: {
                    from: 'category',
                    localField: 'crops.category',
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
                    as: "parentcategory"
                }
            },
            {
                $unwind: '$parentcategory'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'crops.seller',
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
                    cropId: "$crops._id",
                    cropCode: "$crops.code",
                    cropCategory: "$crops.category",
                    cropCategoryName: "$category.name",
                    cropParentCategory: "$parentcategory._id",
                    cropParentCategoryName: "$parentcategory.name",
                    pincode: "$crops.pincode",
                    cropName: "$crops.name",
                    isDeleted: "$crops.isDeleted",
                    bidcode: "$code",
                    bidQuantity: "$quantity",
                    bidRate: "$bidRate",
                    bidAmount: "$amount",
                    bidDate: "$createdAt",
                    createdAt: "$createdAt",
                    bidAcceptedAt: "$acceptedAt",
                    bidStatus: "$status",
                    bidTotalAmount: "$totalAmount",
                    popId: "$popId",
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
                        from: 'crops',
                        localField: 'crop',
                        foreignField: '_id',
                        as: "crops"
                    }
                },
                {
                    $unwind: '$crops'
                },
                {
                    $lookup: {
                        from: 'category',
                        localField: 'crops.category',
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
                        as: "parentcategory"
                    }
                },
                {
                    $unwind: '$parentcategory'
                },
                {
                    $lookup: {
                        from: 'market',
                        localField: 'crops.market',
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
                    $lookup: {
                        from: 'users',
                        localField: 'market.GM',
                        foreignField: '_id',
                        as: "franchisee"
                    }
                },
                {
                    $unwind: {
                        path: '$franchisee',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'crops.seller',
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
                        cropId: "$crops._id",
                        cropCode: "$crops.code",
                        cropCategory: "$crops.category",
                        cropCategoryName: "$category.name",
                        cropParentCategory: "$parentcategory._id",
                        cropParentCategoryName: "$parentcategory.name",
                        pincode: "$crops.pincode",
                        market: "$crops.market",
                        marketName: "$market.name",
                        franchisee: "$franchisee._id",
                        franchiseeName: "$franchisee.fullName",
                        cropName: "$crops.name",
                        isDeleted: "$crops.isDeleted",
                        bidcode: "$code",
                        bidQuantity: "$quantity",
                        bidRate: "$bidRate",
                        bidAmount: "$amount",
                        bidDate: "$createdAt",
                        createdAt: "$createdAt",
                        bidAcceptedAt: "$acceptedAt",
                        bidStatus: "$status",
                        bidTotalAmount: "$totalAmount",
                        popId: "$popId",
                        quantityUnit: "$quantityUnit",
                        logisticsOption: "$logisticsOption",
                        ETD: "$ETD",
                        ETA: "$ETA",
                        ATD: "$ATD",
                        ATA: "$ATA",
                        deliveryTime: "$deliveryTime",
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
                    }
                    else {
                        //console.log(results, 'withoutroles')
                        if (role) {

                            async.each(results, function (bid, callback) {
                                let roleQuery = {}
                                roleQuery.roleId = role
                                roleQuery.markets = { $in: [String(bid.market)] }
                                roleQuery.roles = "A"

                                Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {
                                    if (adminsWithRoles.length > 0) {
                                        bid.adminUser = adminsWithRoles[0]

                                        callback()
                                    } else if (bid.pincode) {
                                        // var pincodes = JSON.parse(bid.pincode);
                                        // if (pincodes.length > 0) {
                                        let mktqry = {}
                                        mktqry.pincode = { "$in": [bid.pincode] }
                                        Market.find(mktqry).then(function (franchisees) {
                                            if (franchisees.length > 0) {
                                                var marketIds = [];

                                                franchisees.forEach(function (item) {
                                                    marketIds.push(item.id);
                                                });
                                                roleQuery.markets = { $in: marketIds }
                                                Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
                                                    if (adminsWithRolesNew.length > 0) {
                                                        bid.adminUser = adminsWithRolesNew[0]
                                                    }
                                                    callback()
                                                })
                                            } else {
                                                callback()
                                            }
                                        })
                                    } else {
                                        callback()
                                    }
                                })
                            }, function (error) {
                                return res.status(200).jsonx({
                                    success: true,
                                    data: {
                                        bids: results,
                                        total: totalresults.length
                                    }
                                });
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
                    }
                });
            });
        });
        // });
    },
    // new requirement for bid order listing download csv file date 15 March 2021
    fieldOfficerBidsDownloadIntoXls: function (req, res) {

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
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crops"
                }
            },
            {
                $unwind: '$crops'
            },
            {
                $lookup: {
                    from: 'category',
                    localField: 'crops.category',
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
                    as: "parentcategory"
                }
            },
            {
                $unwind: '$parentcategory'
            },
            {
                $lookup: {
                    from: 'market',
                    localField: 'crops.market',
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
                $lookup: {
                    from: 'users',
                    localField: 'market.GM',
                    foreignField: '_id',
                    as: "franchisee"
                }
            },
            {
                $unwind: {
                    path: '$franchisee',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'crops.seller',
                    foreignField: '_id',
                    as: "sellers"
                }
            },
            {
                $unwind: '$sellers'
            },
            {
                $project: {
                    _id: 0,
                    buyerName: "$buyer.fullName",
                    buyerAddress: "$buyer.address",
                    buyerCity: "$buyer.city",
                    buyerState: "$buyer.state",
                    buyerPincode: "$buyer.pincode",
                    buyerId: "$user",
                    sellerName: "$sellers.fullName",
                    //sellerId: "$sellers._id",
                    // cropId: "$crops._id",
                    cropCode: "$crops.code",
                    cropCategory: "$crops.category",
                    cropCategoryName: "$category.name",
                    cropParentCategory: "$parentcategory._id",
                    cropParentCategoryName: "$parentcategory.name",
                    pincode: "$crops.pincode",
                    market: "$crops.market",
                    marketName: "$market.name",
                    //franchisee: "$franchisee._id",
                    franchiseeName: "$franchisee.fullName",
                    franchiseeAddress: "$franchisee.address",
                    franchiseeCity: "$franchisee.city",
                    franchiseeState: "$franchisee.state",
                    franchiseePincode: "$franchisee.pincode",
                    cropName: "$crops.name",
                    isDeleted: "$crops.isDeleted",
                    bidcode: "$code",
                    bidQuantity: "$quantity",
                    bidRate: "$bidRate",
                    bidAmount: "$amount",
                    bidDate: "$createdAt",
                    createdAt: "$createdAt",
                    bidAcceptedAt: "$acceptedAt",
                    bidStatus: "$status",
                    bidTotalAmount: "$totalAmount",
                    popId: "$popId",
                    quantityUnit: "$quantityUnit",
                    logisticsOption: "$logisticsOption",
                    ETD: "$ETD",
                    ETA: "$ETA",
                    ATD: "$ATD",
                    ATA: "$ATA",
                    deliveryTime: "$deliveryTime",
                }
            },

            ], function (err, results) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                }
                else {

                    let x = downloadBidOrderFile(results)
                    if (x) {
                        return res.jsonx({
                            message: "Data downloaded successfully"
                        })
                    }

                }
            });
        });

    },

    fieldOfficerPaymentsBuyerDashboard: function (req, res) {

        var query = {};

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                query.pincode = {
                    "$in": pincode
                };
            }
        }

        if (req.param('userId') && req.param('userId') != undefined && req.param('userId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('userId'))

            // var userId = req.param('userId')
            query.sellerId = userId
        }

        query.type = {
            $ne: "Earnest"
        }
        query.paymentDueDate = {
            $exists: true
        }

        /*if (req.param('status') == 'Received') {
            qry.$or = [{ status: 'Paid' }, { status: 'Verified' }]
            datakey = 'depositedOn';
            qry.$and = [{ depositedOn: { $gte: new Date(req.param('from')) } }, { depositedOn: { $lte: new Date(req.param('to')) } }]
        } else if (req.param('status') == 'Due') {
            qry.status = req.param('status');
            qry.$and = [{ paymentDueDate: { $gte: new Date(req.param('from')) } }, { paymentDueDate: { $lte: new Date(req.param('to')) } }]
        } else if (req.param('status') == 'Overdue') {
            qry.status = req.param('status');
            qry.$and = [{ paymentDueDate: { $gte: new Date(req.param('from')) } }, { paymentDueDate: { $lte: new Date(req.param('to')) } }]
        }*/

        query.$and = [{
            createdAt: {
                $gte: new Date(req.param('from'))
            }
        }, {
            createdAt: {
                $lte: new Date(req.param('to'))
            }
        }]

        Bidspayment.native(function (err, bidlist) {
            bidlist.aggregate([{
                $match: query
            },
            {
                $project: {
                    type: "$type",
                    status: "$status",
                    amount: "$amount"
                }
            },
            {
                $group: {
                    _id: {
                        type: "$type",
                        status: "$status"
                    },
                    'amount': {
                        $sum: "$amount"
                    },
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.type",
                    'status': {
                        $push: {
                            status: "$_id.status",
                            count: "$count",
                            amount: "$amount"
                        }
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

    fieldOfficerPaymentsSellerDashboard: function (req, res) {

        var query = {};

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                query.pincode = {
                    "$in": pincode
                };
            }
        }

        if (req.param('userId') && req.param('userId') != undefined && req.param('userId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('userId'))

            query.sellerId = userId
        }

        /*if (req.param('status') == 'Received') {
            qry.$or = [{ status: 'Paid' }, { status: 'Verified' }]
            datakey = 'depositedOn';
            qry.$and = [{ depositedOn: { $gte: new Date(req.param('from')) } }, { depositedOn: { $lte: new Date(req.param('to')) } }]
        } else if (req.param('status') == 'Due') {
            qry.status = req.param('status');
            qry.$and = [{ paymentDueDate: { $gte: new Date(req.param('from')) } }, { paymentDueDate: { $lte: new Date(req.param('to')) } }]
        } else if (req.param('status') == 'Overdue') {
            qry.status = req.param('status');
            qry.$and = [{ paymentDueDate: { $gte: new Date(req.param('from')) } }, { paymentDueDate: { $lte: new Date(req.param('to')) } }]
        }*/

        query.$and = [{
            createdAt: {
                $gte: new Date(req.param('from'))
            }
        }, {
            createdAt: {
                $lte: new Date(req.param('to'))
            }
        }]

        Sellerpayment.native(function (err, bidlist) {
            bidlist.aggregate([{
                $lookup: {
                    from: 'bids',
                    localField: 'bidId',
                    foreignField: '_id',
                    as: "bids"
                }
            },
            {
                $unwind: '$bids'
            },
            {
                $project: {
                    status: "$status",
                    sellerId: "$sellerId",
                    pincode: "$pincode",
                    createdAt: "$bids.createdAt",
                    amount: "$amount"
                }
            },
            {
                $match: query
            },
            {
                $group: {
                    _id: "$status",
                    'amount': {
                        $sum: "$amount"
                    },
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

    //BUYER DASHBOARD
    buyerBidDashboard: function (req, res) {
        var qry = {}

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }

        if (req.param('userId') && req.param('userId') != undefined && req.param('userId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('userId'))

            qry.user = userId
        }

        // qry.isDeleted = false

        qry.$and = [{
            createdAt: {
                $gte: new Date(req.param('from'))
            }
        }, {
            createdAt: {
                $lte: new Date(req.param('to'))
            }
        }]

        Bids.native(function (err, bidlist) {
            bidlist.aggregate([{
                $lookup: {
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crop"
                }
            },
            {
                $unwind: '$crop'
            },
            {
                $project: {
                    pincode: "$crop.pincode",
                    user: "$user",
                    status: "$status",
                    createdAt: "$createdAt",
                }
            },
            {
                $match: qry
            },
            {
                $group: {
                    _id: "$status",
                    count: {
                        $sum: 1
                    }
                }
            }
            ], function (err, result) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: result
                    });
                }
            });
        })
    },

    buyerPaymentsBuyerDashboard: function (req, res) {

        var query = {};

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                query.pincode = {
                    "$in": pincode
                };
            }
        }

        if (req.param('userId') && req.param('userId') != undefined && req.param('userId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('userId'))

            query.buyerId = userId
        }

        query.paymentDueDate = {
            $exists: true
        }

        query.$and = [{
            createdAt: {
                $gte: new Date(req.param('from'))
            }
        }, {
            createdAt: {
                $lte: new Date(req.param('to'))
            }
        }]

        Bidspayment.native(function (err, bidlist) {
            bidlist.aggregate([{
                $match: query
            },
            {
                $group: {
                    _id: {
                        type: "$type",
                        status: "$status"
                    },
                    'amount': {
                        $sum: "$amount"
                    },
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.type",
                    'status': {
                        $push: {
                            status: "$_id.status",
                            count: "$count",
                            amount: "$amount"
                        }
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

    buyerVerificationDashboard: function (req, res) {
        var qry = {}

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }

        if (req.param('userId') && req.param('userId') != undefined && req.param('userId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('userId'))

            qry.user = userId
        }

        qry.$and = [{
            createdAt: {
                $gte: new Date(req.param('from'))
            }
        }, {
            createdAt: {
                $lte: new Date(req.param('to'))
            }
        }]

        qry.$or = [{
            status: 'Accepted'
        }, {
            status: 'Dispatched'
        }, {
            status: 'Delivered'
        }, {
            status: 'Received'
        }]

        Bids.native(function (err, bidlist) {
            bidlist.aggregate([{
                $lookup: {
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crop"
                }
            },
            {
                $unwind: '$crop'
            },
            {
                $project: {
                    pincode: "$crop.pincode",
                    user: "$user",
                    status: "$status",
                    createdAt: "$createdAt",
                    popId: {
                        $ifNull: ["$popId", null]
                    }
                }
            },
            {
                $match: qry
            },
            {
                $lookup: {
                    from: 'proofofproduct',
                    localField: 'popId',
                    foreignField: '_id',
                    as: "pop"
                }
            },
            {
                $unwind: {
                    path: "$pop",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    popStatus: {
                        $cond: [{
                            $eq: ["$popId", null]
                        }, "Proof Not-Added", {
                            $cond: [{
                                $eq: ["$pop.allApprovedByBuyer", false]
                            }, "Proof Not-Accepted", {
                                $cond: [{
                                    $eq: ["$status", "Received"]
                                }, "Order Accepted", {
                                    $cond: [{
                                        $eq: ["$status", "Delivered"]
                                    }, "Order Delivered", {
                                        $cond: [{
                                            $eq: ["$status", "Dispatched"]
                                        }, "Order Dispatched", "Proof Accepted"]
                                    }]
                                }]
                            }]
                        }]
                    }
                }
            },
            {
                $group: {
                    _id: "$popStatus",
                    count: {
                        $sum: 1
                    }
                }
            }
            ], function (err, result) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: result
                    });
                }
            });
        })
    },

    /*
    * withdrawalBid by buyer in buyer dashboard on 27 AUG 2018
    */
    withdrawalBid: function (req, res) {

        var envPaytm = req.param('env') // "development" "production";

        var data = {};
        data.id = req.param("id");
        data.status = 'Withdrawal'
        data.withdrawalAt = new Date()


        let refundBy = req.identity.id

        var request = require('request-promise');

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
                        message: "There is some issue with the withdraw bid. Please try again."
                    },
                });
            }

            var paramlist = {};
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

                let jsONDST = JSON.stringify(JsonData);

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

                request(options).then(function (body) {

                    var info = JSON.parse(body);


                    if (info.STATUS == 'TXN_SUCCESS') {


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



                            Bids.update({
                                id: data.id
                            }, data).then(function (bid) {


                                createBidHistory(data, bid[0], "Bid Withdrawal")
                                    .then(function (notin) {



                                        Bidspayment.destroy({
                                            bidId: data.id
                                        }).then(function (destroyResp) {

                                            Crops.findOne({ id: bid[0].crop }).populate('market').then(function (crp) {


                                                var msg = "Bid (" + bid[0].code + ") is withdrawan. ";

                                                var notificationData = {};
                                                notificationData.productId = bid[0].crop;
                                                notificationData.crop = bid[0].crop;
                                                notificationData.user = bid[0].user;
                                                notificationData.sellerId = crp.seller
                                                notificationData.buyerId = bid[0].user;
                                                notificationData.productType = "crops";
                                                notificationData.message = msg;
                                                notificationData.messageKey = "BID_WITHDRAWAL_NOTIFICATION"
                                                notificationData.readBy = [];
                                                notificationData.messageTitle = "Bid withdrawan"
                                                let pushnotreceiver = [crp.seller]
                                                if (crp.market.GM) {
                                                    pushnotreceiver.push(crp.market.GM)
                                                }

                                                Notifications.create(notificationData)
                                                    .then(function (notificationResponse) {
                                                        if (notificationResponse) {
                                                            commonService.notifyUsersFromNotification(notificationResponse, undefined)
                                                            pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                                        }
                                                        return res.status(200).jsonx({
                                                            success: true,
                                                            code: 200,
                                                            data: {
                                                                bid: bid[0],
                                                                message: constantObj.bids.SUCCESSFULLY_WITHDRAWAL_BID,
                                                                key: 'SUCCESSFULLY_WITHDRAWAL_BID',
                                                            },
                                                        });

                                                    })
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

    bidReject: function (req, res) {

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
            // console.log("Bid Transactions table data 9+++++++++", bidTransactions) ;
            if (bidTransactions == undefined) {
                return res.status(200).jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: 'Something Wrong'
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
                                            notificationData.productId = bid[0].crop;
                                            notificationData.crop = bid[0].crop;
                                            notificationData.user = bid[0].user;
                                            notificationData.buyerId = bid[0].user;
                                            notificationData.productType = "crops";
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

    refundByFinance: function (req, res) {

        var data = {};
        data.id = req.param("id");
        data.refundStatus = 'Success'
        data.paymentDate = new Date()
        data.environment = req.body.environment
        console.log("environment is", data.environment)

        console.log("req.body is", data)
        let refundBy = req.identity.id

        var request = require('request-promise');
        //var request = require('request');

        var findTransactionQry = {}
        findTransactionQry.bidId = data.id
        findTransactionQry.paymentType = "PayTm"
        findTransactionQry.processStatus = "TXN_SUCCESS"

        Transactions.findOne(findTransactionQry).then(function (bidTransactions) {

            console.log("bidTransactions", refundBy, bidTransactions)

            if (bidTransactions == undefined) {
                return res.status(200).jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: "There is some issue with the refund. Please try again."
                    },
                });
            }

            var paramlist = {};

            paramlist['MID'] = bidTransactions.paymentjson.MID;
            paramlist['TXNID'] = bidTransactions.paymentjson.TXNID;
            paramlist['ORDERID'] = bidTransactions.paymentjson.ORDERID;
            paramlist['REFUNDAMOUNT'] = bidTransactions.paymentjson.TXNAMOUNT;
            paramlist['TXNTYPE'] = "REFUND";

            console.log("paramlist", paramlist)

            Payments.genchecksumforrefund(paramlist, constantObj.paytm_config[data.environment].PAYTM_MERCHANT_KEY, function (err, JsonData) {
                console.log("result for refund", JsonData)
                let jsONDST = JSON.stringify(JsonData);
                let refundApiPayTmUrl = constantObj.paytm_config[data.environment].REFUND_URL + "?JsonData=" + jsONDST
                console.log("refundApiPayTmUrl", refundApiPayTmUrl)

                var options = {
                    url: refundApiPayTmUrl,
                    method: 'GET',
                    headers: {}
                };

                request(options).then(function (body) {
                    console.log("test body", body)
                    var info = JSON.parse(body);
                    console.log('----------------------------info', info);

                    if (info.STATUS == 'TXN_SUCCESS' && info.RESPMSG == "Refund Successful." && info.REFUNDID != "") {
                        console.log("in if condition")

                        let transactionData = {};

                        transactionData.processedBy = refundBy;
                        transactionData.status = 'RF';
                        transactionData.transactionType = 'DebitEscrow';
                        transactionData.processStatus = info.RESPMSG;
                        transactionData.payTmRefundId = info.REFUNDID;
                        transactionData.refundjson = info;

                        console.log("transactionData", transactionData);

                        Transactions.update({
                            id: bidTransactions.id
                        }, transactionData).then(function (paymentsData) {

                            Bids.update({
                                id: data.id
                            }, data).then(function (bid) {
                                createBidHistory(data, bid[0], "Bid Refund by Finance").then(function (notin) {
                                    Bidspayment.destroy({
                                        bidId: data.id
                                    }).then(function () {
                                        var msg = "Bid (" + bid[0].code + ") is refunded. ";

                                        var notificationData = {};
                                        notificationData.productId = bid[0].crop;
                                        notificationData.crop = bid[0].crop;
                                        notificationData.user = bid[0].user;
                                        notificationData.buyerId = bid[0].user;
                                        notificationData.productType = "crops";
                                        notificationData.message = msg;
                                        notificationData.messageKey = "BID_REFUND_NOTIFICATION"
                                        notificationData.readBy = [];
                                        notificationData.messageTitle = "Bid refunded"
                                        let pushnotreceiver = [bid[0].user]

                                        Notifications.create(notificationData).then(function (notificationResponse) {
                                            if (notificationResponse) {
                                                commonService.notifyUsersFromNotification(notificationResponse, undefined)
                                                pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                            }
                                            console.log("In Notification", notificationResponse)

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
                                                        message: constantObj.bids.SUCCESSFULLY_REFUNDED_BID,
                                                        key: 'SUCCESSFULLY_REFUNDED_BID',
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
                                message: info.message
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

    putBidUpdate: function (req, res) {
        let bidId = req.param("id");
        let body = req.body;
        let bidUpdateData = {};
        bidUpdateData.amount = body.amount;
        bidUpdateData.quantity = body.quantity;
        bidUpdateData.quantityUnit = body.quantityUnit;
        bidUpdateData.logisticPayment = body.logisticPayment;
        bidUpdateData.earnestAmount = body.earnestAmount;
        bidUpdateData.taxAmount = body.taxAmount;
        bidUpdateData.address = body.address;
        bidUpdateData.totalDistance = body.totalDistance;
        bidUpdateData.deliveryCharges = body.deliveryCharges;
        // bidUpdateData.payments = body.payments;
        // bidUpdateData.transactionId = body.transactionId;
        bidUpdateData.logisticsOption = body.logisticsOption;
        if (body.logisticsOption !== 'self') {
            bidUpdateData.insurancePayment = body.insurancePayment;
        }
        bidUpdateData.totalAmount = body.totalAmount;
        bidUpdateData.taxPercent = body.taxPercent;
        bidUpdateData.facilitationPercent = body.facilitationPercent;
        bidUpdateData.facilitationCharges = body.facilitationCharges;
        bidUpdateData.status = body.status;
        bidUpdateData.type = body.type;
        bidUpdateData.packaging = body.packaging;
        bidUpdateData.packagingSize = body.packagingSize;
        bidUpdateData.finalPaymentDays = body.finalPaymentDays;

        // console.log("body*******====", body, body.depositPayment.length ) ;
        let amount = (body.totalAmount - body.earnestAmount);
        if (body.bidRate) {
            bidUpdateData.bidRate = body.bidRate
        } else {
            bidUpdateData.bidRate = parseFloat((body.amount / body.quantity).toFixed(2));
        }
        Bids.update({
            id: bidId
        }, bidUpdateData).then(function (resData) {

            if (resData) {
                let finalPaymentPercentage = 100;
                let depositPayments = body.depositPayment;
                depositPayments.forEach((obj) => {
                    finalPaymentPercentage = finalPaymentPercentage - obj.percentage;
                })
                if (body.depositPayment.length > 0) {

                    async.each(depositPayments, function (payment, callback) {
                        let pt = payment;
                        //console.log("payment************",pt.label);
                        let bidPaymentObj = {};
                        bidPaymentObj.amount = ((amount * pt.percentage) / 100);
                        bidPaymentObj.percentage = pt.percentage;
                        bidPaymentObj.days = pt.days;
                        bidPaymentObj.logisticPayment = body.logisticPayment;

                        console.log("pppppppppppaaa", bidPaymentObj);

                        Bidspayment.update({
                            bidId: bidId,
                            name: pt.label
                        }, bidPaymentObj).then(function (bidspaymentsResult) {
                            callback();
                        }).fail(function (err) {
                            return res.status(400).jsonx({
                                success: false,
                                error: err
                            });
                        });

                    }, function (error) {
                        if (error) {
                            return res.jsonx({
                                success: false,
                                error: error
                            });
                        } else {

                            if (finalPaymentPercentage > 0) {
                                let bidPaymentObj = {};
                                bidPaymentObj.amount = ((amount * finalPaymentPercentage) / 100);
                                bidPaymentObj.percentage = finalPaymentPercentage;
                                bidPaymentObj.days = body.finalPaymentDays;
                                bidPaymentObj.logisticPayment = body.logisticPayment;

                                Bidspayment.update({
                                    bidId: bidId,
                                    type: 'Final'
                                }, bidPaymentObj).then(function (bidspaymentsResult) {
                                    return res.jsonx({
                                        success: true,
                                        data: {
                                            message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                            key: 'SUCCESSFULLY_UPDATED_BID',
                                            bid: resData[0]
                                        }
                                    });
                                }).fail(function (err) {
                                    return res.status(400).jsonx({
                                        success: false,
                                        error: err
                                    });
                                });

                            } else {
                                return res.jsonx({
                                    success: true,
                                    data: {
                                        message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                        key: 'SUCCESSFULLY_UPDATED_BID',
                                        bid: resData[0]
                                    }
                                });
                            }
                        }
                    });
                } else {
                    let bidPaymentObj = {};
                    bidPaymentObj.amount = ((amount * finalPaymentPercentage) / 100);
                    bidPaymentObj.percentage = finalPaymentPercentage;
                    bidPaymentObj.days = body.finalPaymentDays;
                    bidPaymentObj.logisticPayment = body.logisticPayment;

                    Bidspayment.update({
                        bidId: bidId,
                        type: 'Final'
                    }, bidPaymentObj).then(function (bidspaymentsResult) {
                        return res.jsonx({
                            success: true,
                            data: {
                                message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                key: 'SUCCESSFULLY_UPDATED_BID',
                                bid: resData[0]
                            }
                        });
                    }).fail(function (err) {
                        return res.status(400).jsonx({
                            success: false,
                            error: err
                        });
                    });

                }

            }
        }).fail(function (err) {
            return res.status(400).jsonx({
                success: false,
                error: err
            });
        });
    },

    financeRefundDashboard: function (req, res) {
        var qry = {};
        //qry.paymentMedia = { $ne: "Cart" }
        if (req.param('productType')) {
            qry.productType = req.param('productType')
        }
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                };
            }
        }
        qry.$and = [{
            paymentDueDate: {
                $gte: new Date(req.param('from'))
            }
        }, {
            paymentDueDate: {
                $lte: new Date(req.param('to'))
            }
        }]

        qry.$or = [{ status: "Refund" }, { status: "OverdueRefund" }, { status: "Refunded" }, { status: "RefundVerified" }]

        if (req.param('productType')) {
            qry.productType = req.param('productType')
        } else {
            qry.productType = 'crop'
        }

        Bidspayment.native(function (err, cartlist) {
            cartlist.aggregate([{
                $match: qry
            },
            {
                $project: {
                    type: "$type",
                    refundStatus: "$status",
                    amount: "$amount"
                }
            },
            {
                $group: {
                    _id: {
                        type: "$type",
                        refundStatus: "$refundStatus"
                    },
                    'amount': {
                        $sum: "$amount"
                    },
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.refundStatus",
                    'status': {
                        $push: {
                            status: "$_id.type",
                            count: "$count",
                            amount: "$amount"
                        }
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

    financeSellerRefundDashboard: function (req, res) {
        var qry = {};
        //qry.paymentMedia = { $ne: "Cart" }

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                };
            }
        }
        qry.$and = [{
            paymentDueDate: {
                $gte: new Date(req.param('from'))
            }
        }, {
            paymentDueDate: {
                $lte: new Date(req.param('to'))
            }
        }]

        qry.$or = [{ status: "Refund" }, { status: "OverdueRefund" }, { status: "Refunded" }, { status: "RefundVerified" }]

        if (req.param('productType')) {
            qry.productType = req.param('productType')
        } else {
            qry.productType = 'crop'
        }

        Sellerpayment.native(function (err, cartlist) {
            cartlist.aggregate([{
                $match: qry
            },
            {
                $project: {
                    type: "$type",
                    refundStatus: "$status",
                    refundAmount: "$amount"
                }
            },
            {
                $group: {
                    _id: {
                        type: "$type",
                        refundStatus: "$refundStatus"
                    },
                    'amount': {
                        $sum: "$refundAmount"
                    },
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.refundStatus",
                    'status': {
                        $push: {
                            status: "$_id.type",
                            count: "$count",
                            amount: "$amount"
                        }
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
    }
};

var downloadBidOrderFile = function (data) {
    // console.log(data, 'data====')

    var fileName = "bid_order_info.xlsx";
    //console.log(results, 'result===');
    var json2xls = require('json2xls');
    var fs = require('fs');

    var json = data;
    var xls = json2xls(json);
    //console.log(fileName, '----', xls, '======')
    fs.writeFileSync('./csvs/' + fileName, xls, 'binary')
    return true;
}