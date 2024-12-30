var Promise = require('bluebird'),
    promisify = Promise.promisify;
var constantObj = sails.config.constants;
var commonServiceObj = require('./commonService');
var pushService = require('./PushService');
let payments = {};
let sellerData = {};
var NodeGeocoder = require('node-geocoder');
var sortByDistance = require('sort-by-distance');
const fs = require('fs');

let calculatelogistic = function (value) {
    payments.logictic = value * 5 / 100;
};

let bidTransectionCreate = function (reqData) {

    // reqData.transectionId
    // reqData.amount
    // reqData.paymentType
    // reqData.status

    if (!reqData.transectionId & !reqData.status) {
        return true;
    } else {
        return Transactions.create(reqData).then(function (res) {
            return res;
        });
    }
};

let bidTransectionUpdate = function (tId, reqData) {
    console.log("bidTransectionUpdate******", tId, reqData);
    return Transactions.update({ id: tId }, reqData).then(function (res) {

        console.log("bidTransectionUpdate res******", res);
        return res[0];
    });
};

let getSeller = function (cropId) {

    return Crops.findOne({ id: cropId }).then(function (res) {

        return res;
    });
};

var updateUserBuyerType = function (sellerId, indo) {

    return Users.update({ id: sellerId }, { userType: indo }).then(function (res) {
        return res;
    });
};

module.exports = {

    saveBid: function (data, context) {
        return bidCheckPost(saveBid, data, context, null);
    },

    saveBidManually: function (data, context) {
        return bidCheckPost(saveBidManually, data, context, null);
    },

    updateBid: function (data, context) {
        return bidCheckPost(updateBid, data, context, null);
    },

    updateInitiate: function (data, context) {
        return bidCheckPost(updateInitiate, data, context, null);
    },

    assignETD: function (data, context) {
        return bidCheckPost(updateETA, data, context, null);
    },

    assignLogisticAndDeliveryTime: function (data, context, req, res) {
        return assignLogisticAndDeliveryTime(data, context, req, res)
    },

    findOTTC: function (data, context) {
        return OTTC()
    },

    acceptBidCrop: function (data, context, req, res) {
        data.status = 'Accepted';
        data.acceptedAt = new Date();
        return acceptCropBid(data, context, req, res)
    },

    rejectBid: function (data, context) {
        data.status = 'Rejected'
        data.rejectedAt = new Date()
        return bidCheckPost(rejectBidFunction, data, context, null);
    },

    withdrawBid: function (data, context) {
        data.status = 'Withdrawal'
        data.withdrawalAt = new Date()
        return bidCheckPost(withdrawalBid, data, context, null);
    },

    failedBid: function (data, context) {
        data.status = 'Failed'
        data.withdrawalAt = new Date()
        return bidCheckPost(failedBid, data, context, null);
    },

    dispatchBid: function (data, context) {
        data.status = 'Dispatched'
        data.ATD = new Date()
        return bidCheckPost(dispatchBid, data, context, null);
    },

    deliverBid: function (data, context) {
        data.status = 'Delivered'
        data.ATA = new Date()
        return bidCheckPost(deliverBid, data, context, null);
    },

    receivedBid: function (data, context) {
        data.status = 'Received'
        data.receivedDate = new Date()
        return bidCheckPost(receiveBid, data, context, null);
    },

    uploadDocuments: function (data, context) {
        var query = {}
        query.id = data.id
        return Bids.findOne(query).then(function (bid) {
            var documents = bid.documents
            for (var i = 0; i < data.documents.length; i++) {
                documents.push(data.documents[i])
            }
            bid.documents = documents
            return bidCheckPost(updateBid, bid, context, 'documents uploaded');
        }).fail(function (err) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: err
                }
            }
        })
    },

    sendQuantityReceiveApprovalSMS: function (bid) {
        Bids.findOne({ id: bid.id }).populate('crop').populate('user').then(function (fbid) {
            let buyersmsInfo = {}

            buyersmsInfo.numbers = [fbid.user.mobile]
            buyersmsInfo.variables = { "{#AA#}": "" + fbid.receivedQuantity + "QTL" }
            buyersmsInfo.templateId = "21726"

            commonService.sendGeneralSMS(buyersmsInfo)

            Market.findOne({ id: fbid.crop.market }).populate('GM').then(function (market) {
                if (market.GM != undefined && market.GM.mobile != undefined) {
                    let franchiseesmsInfo = {}

                    franchiseesmsInfo.numbers = [market.GM.mobile]
                    franchiseesmsInfo.variables = { "{#BB#}": fbid.crop.name, "{#CC#}": fbid.crop.code, "{#DD#}": fbid.code }
                    franchiseesmsInfo.templateId = "21727"

                    commonService.sendGeneralSMS(franchiseesmsInfo)
                }

                Users.findOne({ id: fbid.crop.seller }).then(function (seller) {
                    if (seller != undefined && seller.mobile != undefined) {

                        let sellersmsInfo = {}

                        sellersmsInfo.numbers = [seller.mobile]
                        sellersmsInfo.variables = { "{#CC#}": fbid.crop.name, "{#BB#}": fbid.crop.code }
                        sellersmsInfo.templateId = "21730"

                        commonService.sendGeneralSMS(sellersmsInfo)
                    }
                })
            })
        })
    },

    // approveBuyerReceivedQuantity: function(data,context) {
    //     return Bids.findOne(data.id).populate("receivedQuantityApprovedBy").populate("crop").then(function(bidInfo) {
    //         if (receivedQuantityStatus == "FullReceive") {
    //             return {
    //                 success: false,
    //                 error: {
    //                     code: 400,
    //                     message: "Buyer received full quantity, so approval is not required."
    //                 }
    //             };
    //         } else if (receivedQuantityStatus == "Approved") {
    //             if (bidInfo.receivedQuantityApprovedBy != undefined) {
    //                 return {
    //                     success: false,
    //                     error: {
    //                         code: 400,
    //                         message: "Already approved by " + bidInfo.receivedQuantityApprovedBy.fullName + " on " + commonService.longDateFormat((new Date(bidInfo.receivedQuantityApprovalTime)))
    //                     },
    //                 };
    //             } else {
    //                return {
    //                     success: false,
    //                     error: {
    //                         code: 400,
    //                         message: "Already approved by " + bidInfo.receivedQuantityApprovedBy.fullName
    //                     },
    //                 }; 
    //             }
    //         } else {
    //             data.receivedQuantityApprovedBy = context.identity.id        
    //             data.receivedQuantityApprovalTime = new Date()
    //             data.receivedQuantityStatus = "Approved"

    //             let newAmount = bidInfo.receivedQuantity * bidInfo.bidRate
    //             let newFacilitationCharges = newAmount * bidInfo.facilitationPercent
    //             let newTaxes = newAmount * bidInfo.taxPercent

    //             let newTotalAmount = newAmount + newFacilitationCharges + newTaxes
    //             if (bidInfo.logisticsOption == "efarmx") {
    //                 newTotalAmount = newTotalAmount + bidInfo.logisticPayment + bidInfo.insurancePayment
    //             }

    //             let sellerPayDifference = bidInfo.amount - newAmount

    //             data.amount = newAmount
    //             data.facilitationCharges = newFacilitationCharges
    //             data.taxAmount = newTaxes
    //             data.totalAmount = newTotalAmount

    //             data.originalAmount = bidInfo.amount
    //             data.originalFacilitationCharges = bidInfo.facilitationCharges
    //             data.originalTaxAmount = bidInfo.taxAmount
    //             data.originalTotalAmount = bidInfo.totalAmount

    //             return Bids.update({id:data.id}, data).then(function(bids) {
    //                 let bid = bids[0]
    //                 let findPendingPeyments = {}
    //                 findPendingPeyments.bidId = data.id
    //                 findPendingPeyments.$or = [{status:"Due"},{status:"Overdue"}]                

    //                 let totalAmountToRefund = bid.originalTotalAmount - bid.totalAmount
    //                 let amountRefunded = totalAmountToRefund

    //                 return Bidspayment.find(findPendingPeyments).sort('createdAt DESC').then(function(payments) {
    //                     async.each(payments, function(payment, callback) {
    //                         if (amountRefunded > 0) {
    //                             let finalPayment = payment.amount - amountRefunded
    //                             let paymentUpdate = {}
    //                             if (finalPayment < 0) {
    //                                 finalPayment = 0
    //                                 paymentUpdate.paymentMode = 'AutoAdjusted'
    //                                 paymentUpdate.status = 'Verified'
    //                             }
    //                             paymentUpdate.originalAmount = payment.amount
    //                             paymentUpdate.amount = finalPayment
    //                             Bidspayment.update({id:payment.id}, paymentUpdate).then(function(updatedPayment) {
    //                                 if (updatedPayment) {
    //                                     if (amountRefunded > updatedPayment.originalAmount) {                                
    //                                         amountRefunded = amountRefunded - updatedPayment.originalAmount
    //                                     } else {
    //                                         amountRefunded = 0
    //                                     }
    //                                 }
    //                                 callback()
    //                             })
    //                         } else {
    //                             callback()
    //                         }
    //                     }, function(asyncError) {
    //                         if (amountRefunded > 0) {
    //                             var refundPayment = {};
    //                             refundPayment.cropId = bid.crop;
    //                             refundPayment.bidId = bid.id;
    //                             refundPayment.sellerId = bidInfo.crop.sellerId;
    //                             refundPayment.buyerId = bid.user;
    //                             refundPayment.amount = amountRefunded;
    //                             refundPayment.type = "Final";                                
    //                             refundPayment.status = 'Refund';
    //                             let today = new Date()
    //                             refundPayment.paymentDueDate = today.getDate() + 7
    //                             return Bidspayment.create(refundPayment).then(function(refundPayment) {

    //                                 let findPendingSellerPeyments = {}
    //                                 findPendingSellerPeyments.bidId = data.id
    //                                 findPendingSellerPeyments.$or = [{status:"Due"},{status:"Overdue"}]                

    //                                 let totalAmountToRefund = bid.originalTotalAmount - bid.totalAmount
    //                                 let selleramountAdjusted = sellerPayDifference

    //                                 return Sellerpayment.find(findPendingSellerPeyments).sort('createdAt DESC').then(function(spayments) {
    //                                     async.each(spayments, function(spayment, callback) {
    //                                         if (selleramountAdjusted > 0) {
    //                                             let finalPayment = spayment.amount - selleramountAdjusted
    //                                             let paymentUpdate = {}
    //                                             if (finalPayment < 0) {
    //                                                 finalPayment = 0
    //                                                 paymentUpdate.paymentMode = 'AutoAdjusted'
    //                                                 paymentUpdate.status = 'Verified'
    //                                             }
    //                                             paymentUpdate.originalAmount = spayment.amount
    //                                             paymentUpdate.amount = finalPayment
    //                                             Sellerpayment.update({id:spayment.id}, paymentUpdate).then(function(updatedPayment) {
    //                                                 if (updatedPayment) {
    //                                                     if (selleramountAdjusted > updatedPayment.originalAmount) {                                
    //                                                         selleramountAdjusted = selleramountAdjusted - updatedPayment.originalAmount
    //                                                     } else {
    //                                                         amountRefunded = 0
    //                                                     }
    //                                                 }
    //                                                 callback()
    //                                             })
    //                                         } else {
    //                                             callback()
    //                                         }
    //                                     }, function(asyncError) {
    //                                         if (selleramountAdjusted > 0) {
    //                                             let today = new Date()
    //                                             var refundPayment = {
    //                                                 cropId :bid.crop,
    //                                                 bidId :bid.id,
    //                                                 sellerId :bidInfo.crop.sellerId,
    //                                                 buyerId : bid.user,
    //                                                 depositLabel : "Final",
    //                                                 pincode : bidInfo.crop.pincode,
    //                                                 paymentDueDate: today.getDate() + 7,
    //                                                 type:"Final",
    //                                                 status : "Refund",
    //                                                 amount : selleramountAdjusted
    //                                             };
    //                                             return Sellerpayment.create(refundPayment).then(function(refundPayment) {
    //                                                 return FranchiseePayments.findOne({bidId:bid.id}).then(function(fp) {
    //                                                     if (fp) {
    //                                                         let newFPAmount = parseFloat(bid.amount) * parseFloat(bidInfo.crop.franchiseePercentage/100)
    //                                                         if (fp.status == 'Paid' || fp.status == 'Verified') {
    //                                                             let fprefundpayment = fp
    //                                                             delete fprefundpayment.id
    //                                                             fprefundpayment.status = "Refund"
    //                                                             fprefundpayment.amount = fp.amount - newFPAmount
    //                                                             return FranchiseePayments.create(fprefundpayment).then(function(fpUpdated) {
    //                                                                 return {
    //                                                                     success: true,
    //                                                                     code: 200,
    //                                                                     data: {
    //                                                                         message: "Successfully approved received quantity and payments are adjusted."
    //                                                                     }
    //                                                                 };
    //                                                             })
    //                                                         } else {
    //                                                             let fpupdate = {}
    //                                                             fpupdate.amount = newFPAmount
    //                                                             fpupdate.originalAmount = fp.amount

    //                                                             return FranchiseePayments.update({id:fp.id},fpupdate).then(function(fpUpdated) {
    //                                                                 return {
    //                                                                     success: true,
    //                                                                     code: 200,
    //                                                                     data: {
    //                                                                         message: "Successfully approved received quantity and payments are adjusted.",                                            
    //                                                                     }
    //                                                                 };
    //                                                             })
    //                                                         }
    //                                                     } else {
    //                                                         return {
    //                                                             success: true,
    //                                                             code: 200,
    //                                                             data: {
    //                                                                 message: "Successfully approved received quantity and payments are adjusted.",                                            
    //                                                             }
    //                                                         };
    //                                                     }
    //                                                 }).fail(function(er) {
    //                                                     return {
    //                                                         success: true,
    //                                                         code: 200,
    //                                                         data: {
    //                                                             message: "Successfully approved received quantity and payments are adjusted.",                                            
    //                                                         }
    //                                                     };
    //                                                 })                                                
    //                                             })
    //                                         } else {
    //                                             return FranchiseePayments.findOne({bidId:bid.id}).then(function(fp) {
    //                                                 if (fp) {
    //                                                     let newFPAmount = parseFloat(bid.amount) * parseFloat(bidInfo.crop.franchiseePercentage/100)
    //                                                     if (fp.status == 'Paid' || fp.status == 'Verified') {
    //                                                         let fprefundpayment = fp
    //                                                         delete fprefundpayment.id
    //                                                         fprefundpayment.status = "Refund"
    //                                                         fprefundpayment.amount = fp.amount - newFPAmount
    //                                                         return FranchiseePayments.create(fprefundpayment).then(function(fpUpdated) {
    //                                                             return {
    //                                                                 success: true,
    //                                                                 code: 200,
    //                                                                 data: {
    //                                                                     message: "Successfully approved received quantity and payments are adjusted."
    //                                                                 }
    //                                                             };
    //                                                         })
    //                                                     } else {
    //                                                         let fpupdate = {}
    //                                                         fpupdate.amount = newFPAmount
    //                                                         fpupdate.originalAmount = fp.amount

    //                                                         return FranchiseePayments.update({id:fp.id},fpupdate).then(function(fpUpdated) {
    //                                                             return {
    //                                                                 success: true,
    //                                                                 code: 200,
    //                                                                 data: {
    //                                                                     message: "Successfully approved received quantity and payments are adjusted.",                                            
    //                                                                 }
    //                                                             };
    //                                                         })
    //                                                     }
    //                                                 } else {
    //                                                     return {
    //                                                         success: true,
    //                                                         code: 200,
    //                                                         data: {
    //                                                             message: "Successfully approved received quantity and payments are adjusted.",                                            
    //                                                         }
    //                                                     };
    //                                                 }
    //                                             }).fail(function(er) {
    //                                                 return {
    //                                                     success: true,
    //                                                     code: 200,
    //                                                     data: {
    //                                                         message: "Successfully approved received quantity and payments are adjusted.",                                            
    //                                                     }
    //                                                 };
    //                                             })
    //                                         }
    //                                     });
    //                                 })                                
    //                             })
    //                         } else {
    //                             let findPendingSellerPeyments = {}
    //                             findPendingSellerPeyments.bidId = data.id
    //                             findPendingSellerPeyments.$or = [{status:"Due"},{status:"Overdue"}]                

    //                             let totalAmountToRefund = bid.originalTotalAmount - bid.totalAmount
    //                             let selleramountAdjusted = sellerPayDifference

    //                             return Sellerpayment.find(findPendingSellerPeyments).sort('createdAt DESC').then(function(spayments) {
    //                                 async.each(spayments, function(spayment, callback) {
    //                                     if (selleramountAdjusted > 0) {
    //                                         let finalPayment = spayment.amount - selleramountAdjusted
    //                                         let paymentUpdate = {}
    //                                         if (finalPayment < 0) {
    //                                             finalPayment = 0
    //                                             paymentUpdate.paymentMode = 'AutoAdjusted'
    //                                             paymentUpdate.status = 'Verified'
    //                                         }
    //                                         paymentUpdate.originalAmount = spayment.amount
    //                                         paymentUpdate.amount = finalPayment
    //                                         Sellerpayment.update({id:spayment.id}, paymentUpdate).then(function(updatedPayment) {
    //                                             if (updatedPayment) {
    //                                                 if (selleramountAdjusted > updatedPayment.originalAmount) {                                
    //                                                     selleramountAdjusted = selleramountAdjusted - updatedPayment.originalAmount
    //                                                 } else {
    //                                                     amountRefunded = 0
    //                                                 }
    //                                             }
    //                                             callback()
    //                                         })
    //                                     } else {
    //                                         callback()
    //                                     }
    //                                 }, function(asyncError) {
    //                                     if (selleramountAdjusted > 0) {
    //                                         let today = new Date()
    //                                         var refundPayment = {
    //                                             cropId :bid.crop,
    //                                             bidId :bid.id,
    //                                             sellerId :bidInfo.crop.sellerId,
    //                                             buyerId : bid.user,
    //                                             depositLabel : "Final",
    //                                             pincode : bidInfo.crop.pincode,
    //                                             paymentDueDate: today.getDate() + 7,
    //                                             type:"Final",
    //                                             status : "Refund",
    //                                             amount : selleramountAdjusted
    //                                         };
    //                                         return Sellerpayment.create(refundPayment).then(function(refundPayment) {
    //                                             return FranchiseePayments.findOne({bidId:bid.id}).then(function(fp) {
    //                                                 if (fp) {
    //                                                     let newFPAmount = parseFloat(bid.amount) * parseFloat(bidInfo.crop.franchiseePercentage/100)
    //                                                     if (fp.status == 'Paid' || fp.status == 'Verified') {
    //                                                         let fprefundpayment = fp
    //                                                         delete fprefundpayment.id
    //                                                         fprefundpayment.status = "Refund"
    //                                                         fprefundpayment.amount = fp.amount - newFPAmount
    //                                                         return FranchiseePayments.create(fprefundpayment).then(function(fpUpdated) {
    //                                                             return {
    //                                                                 success: true,
    //                                                                 code: 200,
    //                                                                 data: {
    //                                                                     message: "Successfully approved received quantity and payments are adjusted."
    //                                                                 }
    //                                                             };
    //                                                         })
    //                                                     } else {
    //                                                         let fpupdate = {}
    //                                                         fpupdate.amount = newFPAmount
    //                                                         fpupdate.originalAmount = fp.amount

    //                                                         return FranchiseePayments.update({id:fp.id},fpupdate).then(function(fpUpdated) {
    //                                                             return {
    //                                                                 success: true,
    //                                                                 code: 200,
    //                                                                 data: {
    //                                                                     message: "Successfully approved received quantity and payments are adjusted.",                                            
    //                                                                 }
    //                                                             };
    //                                                         })
    //                                                     }
    //                                                 } else {
    //                                                     return {
    //                                                         success: true,
    //                                                         code: 200,
    //                                                         data: {
    //                                                             message: "Successfully approved received quantity and payments are adjusted.",                                            
    //                                                         }
    //                                                     };
    //                                                 }
    //                                             }).fail(function(er) {
    //                                                 return {
    //                                                     success: true,
    //                                                     code: 200,
    //                                                     data: {
    //                                                         message: "Successfully approved received quantity and payments are adjusted.",                                            
    //                                                     }
    //                                                 };
    //                                             })                                                
    //                                         })
    //                                     } else {
    //                                         return FranchiseePayments.findOne({bidId:bid.id}).then(function(fp) {
    //                                             if (fp) {
    //                                                 let newFPAmount = parseFloat(bid.amount) * parseFloat(bidInfo.crop.franchiseePercentage/100)
    //                                                 if (fp.status == 'Paid' || fp.status == 'Verified') {
    //                                                     let fprefundpayment = fp
    //                                                     delete fprefundpayment.id
    //                                                     fprefundpayment.status = "Refund"
    //                                                     fprefundpayment.amount = fp.amount - newFPAmount
    //                                                     return FranchiseePayments.create(fprefundpayment).then(function(fpUpdated) {
    //                                                         return {
    //                                                             success: true,
    //                                                             code: 200,
    //                                                             data: {
    //                                                                 message: "Successfully approved received quantity and payments are adjusted."
    //                                                             }
    //                                                         };
    //                                                     })
    //                                                 } else {
    //                                                     let fpupdate = {}
    //                                                     fpupdate.amount = newFPAmount
    //                                                     fpupdate.originalAmount = fp.amount

    //                                                     return FranchiseePayments.update({id:fp.id},fpupdate).then(function(fpUpdated) {
    //                                                         return {
    //                                                             success: true,
    //                                                             code: 200,
    //                                                             data: {
    //                                                                 message: "Successfully approved received quantity and payments are adjusted.",                                            
    //                                                             }
    //                                                         };
    //                                                     })
    //                                                 }
    //                                             } else {
    //                                                 return {
    //                                                     success: true,
    //                                                     code: 200,
    //                                                     data: {
    //                                                         message: "Successfully approved received quantity and payments are adjusted.",                                            
    //                                                     }
    //                                                 };
    //                                             }
    //                                         }).fail(function(er) {
    //                                             return {
    //                                                 success: true,
    //                                                 code: 200,
    //                                                 data: {
    //                                                     message: "Successfully approved received quantity and payments are adjusted.",                                            
    //                                                 }
    //                                             };
    //                                         })
    //                                         // if (asyncError) {
    //                                         //     return {
    //                                         //         success: false,
    //                                         //         error: {
    //                                         //             code: 400,
    //                                         //             message: asyncError
    //                                         //         },
    //                                         //     };
    //                                         // } else {
    //                                         //     return {
    //                                         //         success: true,
    //                                         //         code: 200,
    //                                         //         data: {
    //                                         //             message: "Successfully approved received quantity and payments are adjusted.",                                            
    //                                         //         }
    //                                         //     };
    //                                         // }
    //                                     }
    //                                 });
    //                             })                                
    //                         }                           
    //                     });
    //                 })
    //             })
    //         }
    //     }).fail(function(err){
    //         return {
    //             success: false,
    //             error: {
    //                 code: 400,
    //                 message: err
    //             },
    //         };
    //     });
    // },

    putBid: function (data, context) {

        var history = {};
        let bidData = {};
        let transactionData = {};

        var transactionSatus = data.transactionSatus; // 'EA', 'UA', 'LA', 'BA', 'FA'
        var transactionId = data.transactionId;
        var transactionAmount = data.transactionAmount;
        var paymentType = data.paymentType;  // DD, Wire
        var historyComment = "Bid Updated"
        if (data.historyComment) {
            historyComment = data.historyComment
        }

        delete data.transactionSatus;
        delete data.transactionId;
        delete data.transactionAmount;
        delete data.paymentType;
        delete data.historyComment

        return Bids.update({ id: data.id }, data).then(function (bid) {

            return Bids.findOne({ id: data.id }).populate("user").populate("crop")
                .then(function (bidInfo) {

                    let cropId = bidInfo.crop.id;
                    let bidAmount = bidInfo.amount;
                    let bidReason = bidInfo.reason == undefined ? "" : bidInfo.reason;
                    let buyer = bidInfo.user.username;

                    transactionData.buyerId = bidInfo.user.id;
                    transactionData.crop = bidInfo.crop.id;
                    transactionData.bidId = bidInfo.id;
                    transactionData.transactionId = transactionId;
                    transactionData.amount = transactionAmount;
                    transactionData.paymentType = paymentType;
                    transactionData.status = transactionSatus;
                    transactionData.sellerId = bidInfo.crop.seller;

                    return bidTransectionCreate(transactionData).then(function (paymentsData) {

                        history.bid = bidInfo.id;
                        history.amount = bidInfo.amount;
                        history.crop = bidInfo.crop;
                        history.bidBy = bidInfo.user;
                        history.bidStatus = bidInfo.status;
                        history.quantity = bidInfo.quantity;
                        history.quantityUnit = bidInfo.quantityUnit;
                        history.bidRejectReason = bidInfo.reason == undefined ? "" : bidInfo.reason;

                        if (historyComment) {
                            history.comment = historyComment
                        }

                        return Bidshistory.create(history).then(function (res) {

                            /*return Crops.findOne({ id:cropId }).populate("category").populate("seller").then(function(cropInfo){
                
                                if (bidInfo.status == "Accepted") {
                            	
                                    var username = buyer;
                                    var mobile =bidInfo.user.mobile;
                                    var message = 'Hi';
                                    message += '<br/><br/>';
                                    message += 'Your bid of Rs."'+bidAmount+'" for "'+bidInfo.crop.name+'" is accepted by the farmer. You have to pay upfront amount of 10% to book this crop. You either need to wire transfer the money to account with details on eFarmx wep application link or need to contact at efarmx local office or number for collection of Demand Draft at your door step. ';
                                    message += 'Demand Draft will be on the name of eFarmX. For more details contact sller of crop.' ;
                                    message += '<br/><br/>';
                                    message += '<br/><br/>';
                                    message += 'Regards';
                                    message += '<br/><br/>';
                                    message += 'eFarmX Team';
                                    var SMS = ' You bid is accepted for "'+bidInfo.crop.name+'"  Proceed soon with further step to acquire this crop. For more details contacts at efarmx local office or number';
                                    //commonServiceObj.notifyCropUser(username, mobile, message, SMS );
                                }
                
                                if (bidInfo.status == "Rejected") {
                
                                    var username = buyer;
                                    var mobile = bidInfo.user.mobile;
                                    var message = 'Hi';
                                    message += '<br/><br/>';
                                    message += 'Your bid of Rs.."'+bidAmount+'" for "'+bidInfo.crop.name+'" is rejected by the eFarmX due to following Reason.';
                                    message += '<br/><br/>';
                                    message +=  bidReason;
                                    message += '<br/><br/>';
                                    message += '<br/><br/>';
                                    message += 'Regards';
                                    message += '<br/><br/>';
                                    message += 'eFarmX Team';
                                    var SMS = ' You bid is accepted for "'+bidInfo.crop.name+'". Proceed soon with further step to acquire this crop. For more details contacts at efarmx local office or number';
                                    //commonServiceObj.notifyCropUser(username, mobile, message, SMS );
                                }
                
                                if (bidInfo.status == "Delivered") {
                
                                    let amountDeliver = cropInfo.name - bidAmount;
                            	
                                    var message = 'Hi';
                                    message += '<br/><br/>';
                                    message += 'Your need to deliver "'+amountDeliver+'" of your crop "'+bidInfo.crop.name+'" to "'+bidInfo.user.firstName+'" at "'+bidInfo.user.address+'". He has opted for {name of logistic partner} logistic.';
                                    message += '<br/><br/>';
                                    message +=  bidReason;
                                    message += '<br/><br/>';
                                    message += '<br/><br/>';
                                    message += 'Regards';
                                    message += '<br/><br/>';
                                    message += 'eFarmX Team';
                                    var SMS = ' You bid is accepted for "'+cropInfo.name+'"  consisting of "'+cropInfo.category.name+'". Proceed soon with further step to acquire this crop. For more details contacts at efarmx local office or number';
                                    //commonServiceObj.notifyCropUser(username, mobile, message, SMS );
                                }
                            });	*/

                            return {
                                success: true,
                                code: 200,
                                data: {
                                    bid: bid[0],
                                    message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                    key: 'SUCCESSFULLY_UPDATED_BID',
                                },
                            };

                        }); // Create bid history

                    }); // Create transection bids

                });// bid info query
        }).fail(function (err) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: err
                },
            };
        });
    },

    transectionCreate: function (reqData, context) {

        return Transactions.create(reqData).then(function (res) {

            return res;

        });
    },

    getBidInfo: function (data, context) {

        return Bids.findOne(data.id).populate("crop").populate("user")/*.populate("lpartner")*/.then(function (bidInfo) {

            return {
                success: true,
                code: 200,
                data: {
                    bid: bidInfo
                },
            };

        }).fail(function (err) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: err
                },
            };
        });
    },

    bidHistory: function (data, context) {

        return Bidshistory.find({ bid: data.id }).sort("createdAt DESC").populate("bid").populate("bidBy").populate("crop").then(function (history) {

            return {
                success: true,
                code: 200,
                data: {
                    history: history
                },
            };

        }).fail(function (err) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: err
                },
            };
        });
    },

    bidHistoryByUserIdAndCropId: function (data, context) {

        return Bidshistory.find({ crop: data.cropid, bidBy: data.userid }).sort("createdAt DESC").populate("bid").populate("bidBy").populate("crop").then(function (history) {
            return {
                success: true,
                code: 200,
                data: {
                    history: history
                },
            };

        }).fail(function (err) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: err
                },
            };
        });
    },

    inputBidHistoryByUserIdAndCropId: function (data, context) {

        return Bidshistory.find({ input: data.inputid, bidBy: data.userid })
            .sort("createdAt DESC")
            .populate("bid")
            .populate("bidBy")
            .populate("input")
            .then(function (history) {
                return {
                    success: true,
                    code: 200,
                    data: {
                        history: history
                    },
                };

            }).fail(function (err) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: err
                    },
                };
            });
    },

    logisticAdd: function (data) {
        return Bids.update({ id: data.id }, data).then(function (bid) {
            return {
                success: true,
                code: 200,
                data: {
                    bid: bid,
                    message: constantObj.bids.SUCCESSFULLY_LOGISTIC_SAVE,
                    key: 'SUCCESSFULLY_LOGISTIC_SAVE',
                },
            };
        }).fail(function (err) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: err
                },
            };
        });
    },

    paymentslist: function (data, context) {
        if (data.productType == 'land') {
            return Bidspayment.find({ landInterestId: data.id }).populate("landId", { select: ['code'] }).populate("landInterestId", { select: ['code', 'title', 'dealType', 'displayPrice', 'status'] }).sort({ sequenceNumber: 1 }).then(function (bidPaymentsList) {
                return { success: true, code: 200, data: bidPaymentsList }
            }).fail(function (error) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: error
                    }
                }
            });
        } else {
            return Bidspayment.find({ bidId: data.id }).populate("cropId").populate("input").sort({ sequenceNumber: 1 }).then(function (bidPaymentsList) {
                return { success: true, code: 200, data: bidPaymentsList }
            }).fail(function (error) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: error
                    }
                }
            });
        }
    },

    bidPaymentApproval: function (data, context) {
        return Transactions.update({ id: data.id }, data).then(function (transactionData) {
            return {
                success: true,
                code: 200,
                data: {
                    bid: bid,
                    message: constantObj.bids.PAYMENT_APPROVE,
                    key: 'PAYMENT_APPROVE',
                },
            };
        })
    },

    getSellerPaymentInfo: function (data, context) {
        return Sellerpayment.findOne(data.id)
            .populate('sellerId')
            .populate('suborder')
            .populate('bidId')
            .populate('landInterestId')
            .populate('buyerId')
            .then(function (sellerInfo) {

                return {
                    success: true,
                    code: 200,
                    data: {
                        sellerinfo: sellerInfo
                    },
                };

            }).fail(function (err) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: err
                    },
                };
            });
    },

    getBuyerPaymentInfo: function (data, context) {
        return Bidspayment.findOne(data.id).populate('sellerId').populate('suborder').populate('bidId').populate('landInterestId').populate('buyerId').then(function (buyerInfo) {
            return {
                success: true,
                code: 200,
                data: {
                    buyerInfo: buyerInfo
                },
            };

        }).fail(function (err) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: err
                },
            };
        });
    },

    getFranchiseePaymentInfo: function (data, context) {
        return FranchiseePayments.findOne(data.id).populate('sellerId').populate('paymentBy').populate('franchiseeUserId').populate('bidId').populate('landInterestId').populate('buyerId').then(function (franchiseeinfo) {
            return {
                success: true,
                code: 200,
                data: {
                    franchiseeinfo: franchiseeinfo
                },
            };

        }).fail(function (err) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: err
                },
            };
        });
    },

    getLogisticPaymentInfo: function (data, context) {
        return LogisticPayment.findOne(data.id).populate('sellerId')
            .populate('paymentBy')
            .populate('logisticPartner')
            .populate('bidId')
            .populate('order')
            .populate('suborder')
            .populate('buyerId')
            .then(function (franchiseeinfo) {
                return {
                    success: true,
                    code: 200,
                    data: {
                        logisticinfo: franchiseeinfo
                    },
                };
            }).fail(function (err) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: err
                    },
                };
            });
    },

    updateDepositInfo: function (data, context) {
        if (data.depositedOn) {
            data.depositedOn = new Date(data.depositedOn)
            data.paymentDate = new Date();
        }
        return Bidspayment.update({ id: data.id }, data).then(function (bidpayment) {
            return {
                success: true,
                code: 200,
                data: {
                    bid: bidpayment,
                    message: constantObj.bids.DEPOSIT_PAYMENT,
                    key: 'DEPOSIT_PAYMENT',
                },
            };
        })
    },

    updateLogisticPaymentInfo: function (data, context) {
        data.depositedOn = new Date(data.depositedOn)
        data.paymentBy = context.identity.id

        return LogisticPayment.findOne({ id: data.id }).then(function (logpay) {
            return LogisticPayment.update({ id: data.id }, data).then(function (logpayment) {
                if (logpay.status == 'Due' && logpayment.status == 'Made') {
                    var code = commonServiceObj.getUniqueCode();
                    var transactionData = {};
                    transactionData.buyerId = logpayment[0].buyerId;
                    transactionData.sellerId = logpayment[0].sellerId;
                    transactionData.crop = logpayment[0].cropId;
                    transactionData.bidId = logpayment[0].bidId;
                    transactionData.bidsPaymentId = logpayment[0].id;

                    transactionData.transactionId = code;
                    transactionData.amount = logpayment[0].amount;
                    transactionData.paymentType = logpayment[0].paymentMode;
                    transactionData.processStatus = "TXN_SUCCESS";
                    transactionData.transactionType = 'Debit';

                    transactionData.status = 'LP';

                    return Transactions.create(transactionData).then(function (newTransactionEntry) {
                        if (newTransactionEntry) {
                            var qry = {};
                            qry.transactionId = newTransactionEntry.id
                            return LogisticPayment.update({ id: logpayment.id }, qry).then(function (sellerpaymentStatus) {
                                return {
                                    success: true,
                                    code: 200,
                                    data: {
                                        logisticpayment: logpayment[0],
                                        message: constantObj.bids.DEPOSIT_PAYMENT,
                                        key: 'DEPOSIT_PAYMENT',
                                    },
                                };
                            })
                        } else {
                            return {
                                success: true,
                                code: 200,
                                data: {
                                    logisticpayment: logpayment[0],
                                    message: constantObj.bids.DEPOSIT_PAYMENT,
                                    key: 'DEPOSIT_PAYMENT',
                                },
                            };
                        }
                    });
                } else {
                    return {
                        success: true,
                        code: 200,
                        data: {
                            logisticpayment: logpayment[0],
                            message: constantObj.bids.DEPOSIT_PAYMENT,
                            key: 'DEPOSIT_PAYMENT',
                        },
                    };
                }
            })
        }).fail(function (err) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: err
                }
            };
        })
    },

    updateLogisticPaymentRemark: function (data, context) {

        return LogisticPayment.update({ id: data.id }, data)
            .then(function (logipayment) {

                return {
                    success: true,
                    code: 200,
                    data: {
                        logisticpayment: logipayment[0],
                        message: constantObj.bids.DEPOSIT_PAYMENT,
                        key: 'DEPOSIT_PAYMENT',
                    },
                };
            }).fail(function (err) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: err
                    }
                };
            })


    },

    updateSellerDepositInfo: function (data, context) {

        console.log("data == ", data)

        if (data.depositedOn) {
            data.depositedOn = new Date(data.depositedOn)
            data.paymentBy = context.identity.id
        } else if (data.status == "RefundVerified") {
            data.verifiedBy = context.identity.id
            data.verifyDate = new Date()
        }
        return Sellerpayment.update({ id: data.id }, data).then(function (sellerpayment) {
            // console.log("sellerpayment===",sellerpayment) ;
            // return false ;
            // console.log("rrrrrrrrrrr") ;
            // let code = seller_payment.bidId.

            return Sellerpayment.findOne({ id: data.id })
                .populate("bidId")
                .populate("suborder")
                .populate("landInterestId")
                .then(function (seller_payment) {
                    let code = ''
                    var msg = ''
                    if (seller_payment.landInterestId) {
                        msg = seller_payment.depositLabel + " consisting of ₹ " + seller_payment.amount + 'for land deal id ' + seller_payment.landInterestId.code + "  is paid via (" + seller_payment.paymentMode + ") ";
                    } else {
                        code = (seller_payment.bidId) ? " for bid id (" + seller_payment.bidId.code + ")" : "for order id (" + seller_payment.suborder.code + ")";

                        //var msg = seller_payment.depositLabel + " consisting of ₹ " + seller_payment.amount + " for bid id (" + seller_payment.bidId.code + ") is paid on via (" + seller_payment.paymentMode + ") on " + commonService.longDateFormat((new Date(seller_payment.depositedOn))) + ". ";
                        msg = seller_payment.depositLabel + " consisting of ₹ " + seller_payment.amount + code + "  is paid on via (" + seller_payment.paymentMode + ") ";
                    }

                    var notificationData = {};
                    notificationData.productId = seller_payment.cropId;
                    notificationData.crop = seller_payment.cropId;
                    notificationData.user = seller_payment.sellerId;
                    notificationData.sellerId = seller_payment.sellerId;
                    notificationData.productType = "crops";

                    notificationData.message = msg;
                    notificationData.messageKey = "SELLER_PAID_NOTIFICATION"
                    notificationData.readBy = [];
                    notificationData.messageTitle = "Bid refunded"
                    let pushnotreceiver = [seller_payment.sellerId]

                    return Notifications.create(notificationData).then(function (notificationResponse) {
                        if (notificationResponse) {
                            commonService.notifyUsersFromNotification(notificationResponse, undefined)
                            pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                        }
                        return {
                            success: true,
                            code: 200,
                            data: {
                                sellerpayment: seller_payment,
                                message: constantObj.bids.DEPOSIT_PAYMENT,
                                key: 'DEPOSIT_PAYMENT',
                            },
                        };
                    }).fail(function (err) {
                        return {
                            success: true,
                            code: 200,
                            data: {
                                sellerpayment: seller_payment,
                                message: constantObj.bids.DEPOSIT_PAYMENT,
                                key: 'DEPOSIT_PAYMENT',
                            },
                        };
                    });
                });
        });
    },

    updateBuyerDepositInfo: function (data, context) {
        if (data.depositedOn) {
            data.depositedOn = new Date(data.depositedOn)
        }
        if (data.paymentDate) {
            data.paymentDate = new Date(data.paymentDate)
        } else {
            data.paymentDate = new Date()
        }

        data.refundBy = context.identity.id
        // console.log(data, 'dataupdate======')
        return Bidspayment.update({ id: data.id }, data).then(function (buyerrefund) {
            return Bidspayment.findOne({ id: data.id }).populate("bidId").populate('buyerId').populate('order').then(function (buyer_refund) {
                console.log("testhiere222", buyer_refund);
                let code = 0
                if (buyer_refund.bidId) {
                    code = " for bid id (" + buyer_refund.bidId.code + ")";
                }
                if (buyer_refund.order) {
                    code = " for bid id (" + buyer_refund.order.code + ")";
                }

                //var msg = buyer_refund.depositLabel + " consisting of ₹ " + buyer_refund.amount + " for bid id (" + buyer_refund.bidId.code + ") is paid on via (" + buyer_refund.paymentMode + ") on " + commonService.longDateFormat((new Date(buyer_refund.depositedOn))) + ". ";
                var msg = "Refund consisting of ₹ " + parseFloat((buyer_refund.amount).toFixed(2)) + code + "  is refunded via (" + buyer_refund.paymentMode + ") ";

                var notificationData = {};
                notificationData.productId = buyer_refund.cropId;
                notificationData.crop = buyer_refund.cropId;
                notificationData.user = buyer_refund.buyerId.id;
                // notificationData.sellerId = buyer_refund.sellerId;
                notificationData.buyerId = buyer_refund.buyerId.id;

                notificationData.productType = "crops";

                notificationData.message = msg;
                notificationData.messageKey = "BUYER_REFUND_NOTIFICATION"
                notificationData.readBy = [];
                notificationData.messageTitle = "Amount refunded"
                let pushnotreceiver = [buyer_refund.buyerId.id]

                if (buyer_refund.status == 'Refunded') {
                    let buyersmsInfo = {}

                    buyersmsInfo.numbers = [buyer_refund.buyerId.mobile]
                    buyersmsInfo.variables = {}
                    buyersmsInfo.templateId = "21732"

                    commonService.sendGeneralSMS(buyersmsInfo)
                }

                return Notifications.create(notificationData).then(function (notificationResponse) {
                    if (notificationResponse) {
                        commonService.notifyUsersFromNotification(notificationResponse, undefined)
                        pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                    }
                    return {
                        success: true,
                        code: 200,
                        data: {
                            buyerrefund: buyer_refund,
                            message: constantObj.bids.REFUND_PAYMENT,
                            key: 'REFUND_PAYMENT',
                        },
                    };
                }).fail(function (err) {
                    return {
                        success: true,
                        code: 200,
                        data: {
                            buyerrefund: buyer_refund,
                            message: constantObj.bids.REFUND_PAYMENT,
                            key: 'REFUND_PAYMENT',
                        },
                    };
                });
            });
        });
    },

    updateFranchiseeDepositInfo: function (data, context) {
        if (data.depositedOn) {
            data.depositedOn = new Date(data.depositedOn)
        } else {
            data.depositedOn = new Date()
        }
        data.paymentBy = context.identity.id
        return FranchiseePayments.update({ id: data.id }, data).then(function (fp) {
            return {
                success: true,
                code: 200,
                data: {
                    franchiseepayment: fp,
                    message: constantObj.bids.DEPOSIT_PAYMENT,
                    key: 'DEPOSIT_PAYMENT',
                },
            };
        })
    },

    farmerPayment: function (data, context) {
        let code = commonServiceObj.getUniqueCode();
        data.code = code;

        return FarmerPayment.create(data).then(function (farmerData) {
            return {
                success: true,
                code: 200,
                data: {
                    farmerData: farmerData,
                    message: constantObj.bids.STEPS_ADDED,
                    key: 'STEPS_ADDED',
                }
            };
        })
    },

    farmerPaymentApprove: function (data, context) {

        return Transactions.update({ id: data.id }, data).then(function (transactionData) {
            return {
                success: true,
                code: 200,
                data: {
                    bid: bid,
                    message: constantObj.bids.PAYMENT_APPROVE,
                    key: 'PAYMENT_APPROVE',
                },
            };

        })
    },

    paymentListDetail: function (data, context) {
        let query = {};

        if (data.pincode) {
            var pincode = JSON.parse(data.pincode);
            query.pincode = { "$in": pincode };
        }

        query.type = data.type;

        if (data.status == 'Received') {
            query.$or = [{ status: 'Paid' }, { status: 'Verified' }]

        } else {
            query.status = data.status;
        }

        if (data.status == 'Received' || data.status == 'Paid' || data.status == 'Verified') {
            query.$and = [{ depositedOn: { $gte: new Date(data.from) } }, { depositedOn: { $lte: new Date(data.to) } }]
        } else {
            query.$and = [{ paymentDueDate: { $gte: new Date(data.from) } }, { paymentDueDate: { $lte: new Date(data.to) } }]
        }
        // query.$and = [{
        // 	paymentDueDate:{ 
        //             	$gte: new Date(data.from),
        //             	$lt: new Date(data.to)
        //           }
        //             	/*$gte: new Date("2017-12-15T00:00:00.645Z"),
        //             	$lt: new Date("2017-12-26T23:59:59.645Z")*/
        //       }]

        return Bidspayment.find(query).then(function (paymentDetailList) {
            return { success: true, code: 200, data: paymentDetailList }
        })
            .fail(function (error) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: error
                    }
                }
            });
    },

    saveProofOfProduct: function (data, context) {
        if (data.id) {
            return Proofofproduct.update({ id: data.id }, data).then(function (proofOfProduct) {
                return Bids.findOne({ id: proofOfProduct[0].bidId }).then(function (bid) {
                    return createBidHistory(data, bid, "Product Proof Updated").then(function (notin) {
                        return Users.findOne({ id: bid.user }).then(function (buyer) {
                            let buyersmsInfo = {}

                            buyersmsInfo.numbers = [buyer.mobile]
                            buyersmsInfo.variables = {}
                            buyersmsInfo.templateId = "21710"

                            commonService.sendGeneralSMS(buyersmsInfo)


                            var msg = "Image of product under bid id " + bid.code + " is updated as proof of product. Need approval.";
                            var notificationData = {};
                            notificationData.productId = bid.crop;
                            notificationData.crop = bid.crop;
                            notificationData.user = context.identity.id;
                            notificationData.buyerId = buyer.id;
                            notificationData.productType = "crops";
                            //notificationData.transactionOwner = u[0].id;
                            // notificationData.transactionOwner = crop.transactionOwner;
                            notificationData.message = msg;
                            notificationData.messageKey = "POP_ADDED_NOTIFICATION"
                            notificationData.readBy = [];
                            notificationData.messageTitle = 'Check product images'
                            let pushnotreceiver = [buyer.id]

                            return Notifications.create(notificationData).then(function (notificationResponse) {

                                if (notificationResponse) {
                                    pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)

                                }
                                return {
                                    success: true,
                                    code: 200,
                                    data: {
                                        proofOfProduct: proofOfProduct,
                                        message: constantObj.proofOfProduct.SUCCESSFULLY_SAVED_POP,
                                        key: "SUCCESSFULLY_SAVED_POP"
                                    }
                                };
                            })
                        })
                    })
                })
            });
        } else {
            var query = {}
            query.bidId = data.bidId
            return Proofofproduct.findOne(query).then(function (existedpop) {
                if (existedpop) {
                    return {
                        success: false,
                        error: {
                            code: 400,
                            message: constantObj.proofOfProduct.ALREADY_EXIST_POP,
                            key: "ALREADY_EXIST_POP"
                        }
                    };
                } else {
                    let code = commonServiceObj.getUniqueCode();
                    data.code = code;
                    data.addedBy = context.identity.id;
                    return Proofofproduct.create(data).then(function (pop) {

                        var bidUpdateQuery = {}
                        bidUpdateQuery.id = data.bidId

                        var bidUpdateData = {}
                        bidUpdateData.popId = pop.id
                        return Bids.update(bidUpdateQuery, bidUpdateData).then(function (bid) {
                            return createBidHistory(data, bid[0], "Product Proof Added").then(function (notin) {
                                return Users.findOne({ id: bid[0].user }).then(function (buyer) {
                                    let buyersmsInfo = {}

                                    buyersmsInfo.numbers = [buyer.mobile]
                                    buyersmsInfo.variables = {}
                                    buyersmsInfo.templateId = "21710"

                                    commonService.sendGeneralSMS(buyersmsInfo)

                                    var msg = "Image of product under bid id " + bid[0].code + " is added as proof of product. Need approval.";
                                    var notificationData = {};
                                    notificationData.productId = bid[0].crop;
                                    notificationData.crop = bid[0].crop;
                                    notificationData.user = context.identity.id;
                                    notificationData.buyerId = buyer.id;
                                    notificationData.productType = "crops";
                                    //notificationData.transactionOwner = u[0].id;
                                    // notificationData.transactionOwner = crop.transactionOwner;
                                    notificationData.message = msg;
                                    notificationData.messageKey = "POP_ADDED_NOTIFICATION"
                                    notificationData.readBy = [];
                                    notificationData.messageTitle = 'Check product images'
                                    let pushnotreceiver = [buyer.id]

                                    return Notifications.create(notificationData).then(function (notificationResponse) {

                                        if (notificationResponse) {
                                            pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                        }
                                        return {
                                            success: true,
                                            code: 200,
                                            data: {
                                                proofOfProduct: pop,
                                                message: constantObj.proofOfProduct.SUCCESSFULLY_SAVED_POP,
                                                key: "SUCCESSFULLY_SAVED_POP"
                                            }
                                        };
                                    })
                                })
                            })
                        })
                    }).fail(function (error) {
                        return {
                            success: false,
                            error: {
                                code: 400,
                                message: error
                            }
                        };
                    });
                }
            }).fail(function (error) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: error
                    }
                };
            });
        }
    },

    getProofofproduct: function (data, context) {
        var query = {}
        query.bidId = data.bidId
        return Proofofproduct.findOne(query).populate('addedBy').populate('cropId').then(function (pop) {
            return {
                success: true,
                code: 200,
                data: {
                    proofOfProduct: pop
                }
            };
        }).fail(function (error) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: error
                }
            };
        });
    },

    verifyProofOfProduct: function (data, context) {

        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

        // var allApprovedByQC = true
        var allApprovedByBuyer = true

        if (data.images) {
            data.images.forEach((obj, i) => {
    			/*if (data.by == "QC") {
    				if (obj.approvedByQC == true && (!(obj.QCApprovedBy) || (obj.QCApprovedBy == null) || (obj.QCApprovedBy == undefined))) {
    					obj.QCApprovedBy = ObjectId(context.identity.id)
    					obj.QCApprovedDate = new Date()
    				} else if (obj.approvedByQC == false) {
    					allApprovedByQC = false
    					obj.QCApprovedBy = null
    					obj.QCApprovedDate = null
    				}
    			} else*/ if (data.by == "Buyer") {
                    if (obj.approvedByBuyer == true || obj.approvedByBuyer == "true") {
                        obj.BuyerApprovedBy = ObjectId(context.identity.id)
                        // obj.approvedByBuyer = true
                        obj.BuyerApprovedDate = new Date()
                    } else {
                        allApprovedByBuyer = false
                        // obj.approvedByBuyer = false
                        obj.BuyerApprovedBy = null
                        obj.BuyerApprovedDate = null
                    }
                }
            })
        }

        if (data.videos) {
            data.videos.forEach((obj, i) => {
    			/*if (data.by == "QC") {
    				if (obj.approvedByQC == true && (!(obj.QCApprovedBy) || (obj.QCApprovedBy == null) || (obj.QCApprovedBy == undefined))) {
    					obj.QCApprovedBy = ObjectId(context.identity.id)
    					obj.QCApprovedDate = new Date()
    				} else if (obj.approvedByQC == false) {
    					allApprovedByQC = false
    					obj.QCApprovedBy = null
    					obj.QCApprovedDate = null
    				}
    			} else*/ if (data.by == "Buyer") {
                    if (obj.approvedByBuyer == true || obj.approvedByBuyer == "true") {
                        obj.BuyerApprovedBy = ObjectId(context.identity.id)
                        // obj.approvedByBuyer = true
                        obj.BuyerApprovedDate = new Date()
                    } else {
                        allApprovedByBuyer = false
                        // obj.approvedByBuyer = false
                        obj.BuyerApprovedBy = null
                        obj.BuyerApprovedDate = null
                    }
                }
            })
        }

        delete data.by

        // data.allApprovedByQC = allApprovedByQC

        data.allApprovedByBuyer = allApprovedByBuyer

        var historyMessage = 'Product Proof Not Approved'

        if (allApprovedByBuyer == true) {
            historyMessage = 'Product Proof Approved'
        }

        return Proofofproduct.update({ id: data.id }, data).then(function (pop) {
            return Bids.findOne({ id: pop[0].bidId }).then(function (bid) {
                return createBidHistory(data, bid, historyMessage).then(function (notin) {
                    return Crops.findOne({ id: bid.crop }).populate('market').then(function (crop) {


                        var msg = "Proof of product for bid id " + bid.code + " for crop " + crop.name + "under crop id" + crop.code + " approved Successfully. ";
                        if (allApprovedByBuyer == false) {
                            msg = "Proof of product for bid id " + bid.code + " for crop " + crop.name + "under crop id" + crop.code + " is not approved by buyer. Please look into it to replace product.";
                        }

                        var notificationData = {};
                        notificationData.productId = bid.crop;
                        notificationData.crop = bid.crop;
                        notificationData.user = bid.user;
                        //notificationData.buyerId = bid.user;
                        notificationData.productType = "crops";
                        //notificationData.transactionOwner = u[0].id;
                        notificationData.message = msg;
                        notificationData.messageKey = "POP_DISAPPROVED_NOTIFICATION"
                        notificationData.readBy = [];
                        notificationData.messageTitle = 'Proof of product approved'
                        if (allApprovedByBuyer == false) {
                            notificationData.messageTitle = 'Proof of product disapproved'
                        }
                        let pushnotreceiver = []
                        if (crop.market && crop.market.GM) {
                            pushnotreceiver.push(crop.market.GM)
                        }


                        return Notifications.create(notificationData).then(function (notificationResponse) {

                            if (notificationResponse) {

                                pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                            }


                            return {
                                success: true,
                                message: constantObj.proofOfProduct.VARIFIED_SUCCESSFULLY,
                                key: "VARIFIED_SUCCESSFULLY"
                            }
                        })
                    })
                })
            })
        }).fail(function (error) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: error
                }
            };
        });
    },

    completeBidDetails: function (data, context) {
        var bidId = data.id

        var query = {}
        query.id = bidId

        return Bids.findOne(query)
            .populate('user', { select: ['firstName', 'lastName', 'fullName', 'code', 'sellerCode', 'userUniqueId'] }).populate('popId')
            .populate('logisticId').populate('crop', {
                select: ['code', 'market', 'seller', 'aggregations', 'aggregatedCrops', 'efarmxLogisticPercentage',
                    'name', 'category', 'variety', 'quantity', 'quantitiesPart', 'quantityUnit', 'taxRate', 'efarmxComission', 'bidQuantityUnit', 'grade',
                    'grades', 'rejectedAt', 'acceptedAt', 'status', 'totalBids', 'aggregatedBy']
            })
            .populate('receivedQuantityApprovedBy', { select: ['firstName', 'lastName', 'fullName', 'code', 'sellerCode', 'userUniqueId'] })
            .populate('packaging')
            .populate('tripId', { select: ['code'] })
            .populate('packagingSelectedBy', { select: ['firstName', 'lastName', 'fullName'] })
            .then(function (response) {
                // console.log("!===")
                response.buyer = response.user

                delete response.user
                delete response.crop.bids
                delete response.crop.allbids
                // packaging information get sizes
                if (response.packaging) {
                    console.log(response.packaging, 'response.packaging')
                    for (var i = 0; i < response.packaging.sizes.length; i++) {
                        if (response.packaging.sizes[i]._id == response.packagingSize) {
                            response.packagingSize = response.packaging.sizes[i]
                        }
                    }
                }
                //end of packaging information sizes
                // console.log(response,'complet bid details')   
                if (response.popId) {
                    var findpopUserQry = {}
                    findpopUserQry.id = response.popId.addedBy
                    return Users.findOne(findpopUserQry).then(function (popUser) {
                        if (popUser != undefined) {
                            response.popId.addedBy = popUser
                        }

                        var paymentquery = {}
                        paymentquery.bidId = bidId
                        return Bidspayment.find(paymentquery).populate('sellerId', { select: ['firstName', 'lastName', 'fullName', 'code', 'sellerCode', 'userUniqueId'] }).then(function (buyerPayments) {
                            let payPayments = 0
                            let takePayments = 0
                            if (buyerPayments) {
                                response.buyerPayments = buyerPayments
                                if (buyerPayments.length > 0) {
                                    response.seller = buyerPayments[0].sellerId


                                    for (var i = 0; i < buyerPayments.length; i++) {
                                        let bp = buyerPayments[i]
                                        if (bp.status == 'Due' || bp.status == 'Paid' || bp.status == 'Verified' || bp.status == 'Overdue') {
                                            takePayments = takePayments + bp.amount
                                        } else {
                                            payPayments = payPayments + bp.amount
                                        }
                                    }
                                }
                            }

                            response.finalBuyerPaymentAmount = parseFloat((takePayments - payPayments).toFixed(2));

                            return Sellerpayment.find(paymentquery).populate('paymentBy').populate('sellerId', { select: ['firstName', 'lastName', 'fullName', 'code', 'sellerCode', 'userUniqueId'] }).then(function (sellerPayments) {
                                let paySPayments = 0
                                let takeSPayments = 0

                                if (sellerPayments) {
                                    response.sellerPayments = sellerPayments
                                    let allsellers = []

                                    for (var i = 0; i < sellerPayments.length; i++) {
                                        let sp = sellerPayments[i]
                                        if (sp.status == 'Due' || sp.status == 'Paid' || sp.status == 'Verified' || sp.status == 'Overdue') {
                                            paySPayments = paySPayments + sp.amount
                                        } else {
                                            takeSPayments = takeSPayments + sp.amount
                                        }


                                        allsellers.push(sp.sellerId)
                                    }



                                    let sellerPaymentsGrouped = _.groupBy(sellerPayments, 'sellerId.id');
                                    response.sellerPayments = sellerPaymentsGrouped
                                    response.sellers = allsellers

                                    var sellerWiseAmountTotal = {}


                                    Object.keys(sellerPaymentsGrouped).forEach((slrid, index) => {
                                        let csellpaySPayments = 0
                                        let cselltakeSPayments = 0
                                        let csellallpays = sellerPaymentsGrouped[slrid]

                                        for (var j = 0; j < csellallpays.length; j++) {
                                            let sp = csellallpays[j]
                                            if (sp.status == 'Due' || sp.status == 'Paid' || sp.status == 'Verified' || sp.status == 'Overdue') {
                                                csellpaySPayments = csellpaySPayments + sp.amount
                                            } else {
                                                cselltakeSPayments = cselltakeSPayments + sp.amount
                                            }
                                        }
                                        sellerWiseAmountTotal[slrid] = parseFloat((csellpaySPayments - cselltakeSPayments).toFixed(2));
                                    })


                                    response.sellerWiseAmountTotal = sellerWiseAmountTotal
                                }

                                response.finalSellerPaymentAmount = parseFloat((paySPayments - takeSPayments).toFixed(2));

                                return FranchiseePayments.find(paymentquery).populate('paymentBy').populate('franchiseeUserId', { select: ['firstName', 'lastName', 'fullName', 'code', 'sellerCode', 'userUniqueId'] }).then(function (franchiseePayments) {
                                    let payFPayments = 0
                                    let takeFPayments = 0

                                    if (franchiseePayments) {
                                        response.franchiseePayments = franchiseePayments

                                        for (var i = 0; i < franchiseePayments.length; i++) {
                                            let fp = franchiseePayments[i]
                                            if (fp.status == 'Due' || fp.status == 'Paid' || fp.status == 'Verified' || fp.status == 'Overdue') {
                                                payFPayments = payFPayments + fp.amount
                                            } else {
                                                takeFPayments = takeFPayments + fp.amount
                                            }
                                        }
                                    }

                                    response.finalFranchiseePaymentAmount = parseFloat((payFPayments - takeFPayments).toFixed(2));

                                    if (response.crop.market) {
                                        return Market.findOne({ id: response.crop.market }).populate('GM', { select: ['firstName', 'lastName', 'fullName', 'code', 'sellerCode', 'userUniqueId'] }).then(function (market) {
                                            if (market) {
                                                response.market = market
                                            }
                                            if (!(response.seller)) {
                                                return Users.findOne({ id: response.crop.seller }).then(function (seller) {
                                                    response.seller = seller
                                                    return {
                                                        code: 200,
                                                        data: response,
                                                        success: true,
                                                    };
                                                }).fail(function (err) {
                                                    return {
                                                        code: 200,
                                                        data: response,
                                                        success: true,
                                                    };
                                                })
                                            } else {
                                                return {
                                                    code: 200,
                                                    data: response,
                                                    success: true,
                                                };
                                            }
                                        }).fail(function (err) {
                                            return {
                                                code: 200,
                                                data: response,
                                                success: true,
                                            };
                                        })
                                    } else {

                                        return {
                                            code: 200,
                                            data: response,
                                            success: true,
                                        };
                                    }
                                }).fail(function (err) {
                                    return {
                                        code: 200,
                                        data: response,
                                        success: true,
                                    };
                                })
                            }).fail(function (err) {
                                return {
                                    code: 200,
                                    data: response,
                                    success: true,
                                };
                            })
                        }).fail(function (err) {
                            return {
                                data: response,
                                success: true,
                                code: 200
                            };
                        })
                    }).fail(function (err) {
                        return {
                            code: 200,
                            data: response,
                            success: true,
                        };
                    })
                } else {
                    var paymentquery = {}
                    paymentquery.bidId = bidId
                    return Bidspayment.find(paymentquery).populate('sellerId', { select: ['firstName', 'lastName', 'fullName', 'code', 'sellerCode', 'userUniqueId'] }).then(function (buyerPayments) {
                        let payPayments = 0
                        let takePayments = 0
                        if (buyerPayments) {
                            response.buyerPayments = buyerPayments
                            if (buyerPayments.length > 0) {
                                response.seller = buyerPayments[0].sellerId


                                for (var i = 0; i < buyerPayments.length; i++) {
                                    let bp = buyerPayments[i]
                                    if (bp.status == 'Due' || bp.status == 'Paid' || bp.status == 'Verified' || bp.status == 'Overdue') {
                                        takePayments = takePayments + bp.amount
                                    } else {
                                        payPayments = payPayments + bp.amount
                                    }
                                }
                            }
                        }

                        response.finalBuyerPaymentAmount = parseFloat((takePayments - payPayments).toFixed(2));

                        return Sellerpayment.find(paymentquery).populate('paymentBy').populate('sellerId', { select: ['fullName'] }).then(function (sellerPayments) {
                            let paySPayments = 0
                            let takeSPayments = 0

                            if (sellerPayments) {
                                response.sellerPayments = sellerPayments

                                let allsellers = []

                                for (var i = 0; i < sellerPayments.length; i++) {
                                    let sp = sellerPayments[i]
                                    if (sp.status == 'Due' || sp.status == 'Paid' || sp.status == 'Verified' || sp.status == 'Overdue') {
                                        paySPayments = paySPayments + sp.amount
                                    } else {
                                        takeSPayments = takeSPayments + sp.amount
                                    }


                                    allsellers.push(sp.sellerId)
                                }


                                let sellerPaymentsGrouped = _.groupBy(sellerPayments, 'sellerId.id');
                                response.sellerPayments = sellerPaymentsGrouped
                                response.sellers = allsellers

                                let sellerWiseAmountTotal = {}

                                Object.keys(sellerPaymentsGrouped).forEach((slrid, index) => {
                                    let csellpaySPayments = 0
                                    let cselltakeSPayments = 0
                                    let csellallpays = sellerPaymentsGrouped[slrid]
                                    for (var i = 0; i < csellallpays.length; i++) {
                                        let sp = csellallpays[i]
                                        if (sp.status == 'Due' || sp.status == 'Paid' || sp.status == 'Verified' || sp.status == 'Overdue') {
                                            csellpaySPayments = csellpaySPayments + sp.amount
                                        } else {
                                            cselltakeSPayments = cselltakeSPayments + sp.amount
                                        }
                                    }
                                    sellerWiseAmountTotal[slrid] = parseFloat((csellpaySPayments - cselltakeSPayments).toFixed(2));
                                })

                                response.sellerWiseAmountTotal = sellerWiseAmountTotal

                            }

                            response.finalSellerPaymentAmount = parseFloat((paySPayments - takeSPayments).toFixed(2));

                            return FranchiseePayments.find(paymentquery).populate('paymentBy').populate('franchiseeUserId', { select: ['firstName', 'lastName', 'fullName', 'code', 'sellerCode', 'userUniqueId'] }).then(function (franchiseePayments) {
                                let payFPayments = 0
                                let takeFPayments = 0

                                if (franchiseePayments) {
                                    response.franchiseePayments = franchiseePayments

                                    for (var i = 0; i < franchiseePayments.length; i++) {
                                        let fp = franchiseePayments[i]
                                        if (fp.status == 'Due' || fp.status == 'Paid' || fp.status == 'Verified' || fp.status == 'Overdue') {
                                            payFPayments = payFPayments + fp.amount
                                        } else {
                                            takeFPayments = takeFPayments + fp.amount
                                        }
                                    }
                                }

                                response.finalFranchiseePaymentAmount = parseFloat((payFPayments - takeFPayments).toFixed(2));


                                if (response.crop.market) {
                                    return Market.findOne({ id: response.crop.market }).populate('GM', { select: ['firstName', 'lastName', 'fullName', 'code', 'sellerCode', 'userUniqueId'] }).then(function (market) {
                                        if (market) {
                                            response.market = market
                                        }
                                        if (!(response.seller)) {
                                            return Users.findOne({ id: response.crop.seller }).then(function (seller) {
                                                response.seller = seller
                                                return {
                                                    code: 200,
                                                    data: response,
                                                    success: true,
                                                };
                                            }).fail(function (err) {
                                                return {
                                                    code: 200,
                                                    data: response,
                                                    success: true,
                                                };
                                            })
                                        } else {
                                            return {
                                                code: 200,
                                                data: response,
                                                success: true,
                                            };
                                        }
                                    }).fail(function (err) {
                                        return {
                                            code: 200,
                                            data: response,
                                            success: true,
                                        };
                                    })
                                } else {
                                    return {
                                        code: 200,
                                        data: response,
                                        success: true,
                                    };
                                }
                            }).fail(function (err) {
                                return {
                                    code: 200,
                                    data: response,
                                    success: true,
                                };
                            })
                        }).fail(function (err) {
                            return {
                                code: 200,
                                data: response,
                                success: true,
                            };
                        })
                    }).fail(function (err) {
                        return {
                            data: response,
                            success: true,
                            code: 200
                        };
                    })
                }
            }).fail(function (error) {
                return {
                    code: 400,
                    success: false,
                    error: error
                };
            });
    }
};

bidCheckPost = function (callBackPipe, data, context, message) {
    if (message) {
        data.historyComment = message
    }
    return callBackPipe(data, context);

    /*if(data.quantity && callBackPipe == "saveBid"){
        return Bids.find({crop:data.crop,status : "Accepted"}).populate("crop").then(function(bidInfo){
                 let sum = 0;
                // bidInfo.forEach(function(row){
                // 	sum = sum+row.quantity
                // });

            return Crops.findOne(data.crop).then(function(cropInfo){
                let finalQuantity = cropInfo.quantity - sum;
                if (finalQuantity < data.quantity) {
                    return {
                        success: true,
                        code:200,
                        data: {
                            message: constantObj.bids.BID_STOPPED
                        },
                    };
                }
                else{
                    return callBackPipe(data,context);
                }
            }).fail(function(err){
                return {
                        success: false,
                        error: {
                        code: 400,
                        message: err
                    },
                    };
            });
        }).fail(function(err){
            return {
                    success: false,
                    error: {
                    code: 400,
                    message: err
                },
                };
        });
    } else {
        return callBackPipe(data,context);
    }*/
},

    saveBid = function (data, context) {
        let code = commonServiceObj.getUniqueCode();
        data.code = code;
        let bidData = {};
        let history = {};
        let transactionData = {};
        var bidpayment = {};
        let transactionSatus = data.transactionSatus;
        let Id = data.transactionId;
        var payments;
        var context = context.identity;

        if (typeof data.payments == 'string') {
            payments = JSON.parse(data.payments);
        } else {
            payments = JSON.parse(JSON.stringify(data.payments));
        }

        if (data.bidRate == undefined) {
            data.bidRate = parseFloat((data.amount / data.quantity).toFixed(2));
            //data.bidRate = br.toFixed(2)
        }

        delete data.transactionId;
        delete data.transactionSatus;
        delete data.payments;

        return Transactions.findOne({ id: Id }).then(function (td) {
            if (td.bidId) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: "This transection is already processed. Can not place bid"
                    },
                };
            }
            else if (td != undefined && td.paymentjson != undefined && td.paymentjson.status != undefined && td.paymentjson.status != "TXN_SUCCESS") {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: "This transection is failed. You can not place bid for this transaction"
                    },
                };
            }
            else {
                // return getSeller(data.crop).then(function (sellerData) {            
                return Crops.findOne({ id: data.crop }).populate("seller").then(function (cropInfo) {

                    if (cropInfo.aggregatedCrops) {
                        let aggregatedCropQuantities = {}
                        Object.keys(cropInfo.leftAfterAcceptanceQuantitiesParts).forEach((crpId, index) => {
                            let share = (cropInfo.leftAfterAcceptanceQuantitiesParts[crpId] / cropInfo.leftAfterAcceptanceQuantity) * data.quantity
                            aggregatedCropQuantities[crpId] = parseFloat((share).toFixed(3))
                        })
                        data.aggregatedCropQuantities = aggregatedCropQuantities
                    } else {
                        let aggregatedCropQuantities = {}
                        aggregatedCropQuantities[cropInfo.id] = data.quantity
                        data.aggregatedCropQuantities = aggregatedCropQuantities
                    }

                    return Bids.create(data).then(function (bid) {

                        transactionData.buyerId = bid.user;
                        transactionData.crop = bid.crop;
                        transactionData.bidId = bid.id;
                        transactionData.amount = data.earnestAmount;
                        // transactionData.status = transactionSatus ;
                        transactionData.sellerId = cropInfo.seller.id;
                        transactionData.paymentType = "PayTm";

                        return Transactions.update({ id: Id }, transactionData)
                            .then(function (paymentsData) {

                                bidpayment.cropId = paymentsData[0].crop;
                                bidpayment.bidId = bid.id;
                                bidpayment.sellerId = paymentsData[0].sellerId;
                                bidpayment.buyerId = paymentsData[0].buyerId;
                                bidpayment.transactionId = paymentsData[0].id;
                                bidpayment.amount = paymentsData[0].amount;
                                bidpayment.type = "Earnest";
                                bidpayment.paymentDate = paymentsData[0].createdAt;
                                bidpayment.status = 'Verified';
                                bidpayment.depositedOn = paymentsData[0].createdAt;
                                bidpayment.amountPercent = data.amountPercent;
                                bidpayment.paymentMode = "PayTm";
                                bidpayment.paymentDueDate = new Date()
                                bidpayment.sequenceNumber = 0;
                                bidpayment.isVerified = true;

                                return Bidspayment.create(bidpayment).then(function (bidpayments) {

                                    if (payments) {
                                        if (payments[0]['type'] == "Earnest") {
                                            //console.log("Payments",payments[0].type)

                                            var bidQuery = {};
                                            bidQuery.cropId = bidpayments.cropId;
                                            bidQuery.type = "Earnest";
                                            bidQuery.buyerId = context.id;

                                            var dataQuery = {};
                                            dataQuery.pincode = payments[0].pincode;
                                            dataQuery.percentage = payments[0].percentage;
                                            dataQuery.name = payments[0].name;
                                            dataQuery.days = payments[0].days;

                                            return Bidspayment.update(bidQuery, dataQuery).then(function (updatep) {
                                                delete payments[0];
                                                payments.forEach((obj, i) => {
                                                    payments[i]['bidId'] = bid.id;
                                                    payments[i]['buyerId'] = bid.user;
                                                    payments[i]['sellerId'] = cropInfo.seller.id;
                                                    payments[i]['sequenceNumber'] = i + 1;
                                                })
                                                return Bidspayment.create(payments).then(function (response) {
                                                    history.bid = bid.id;
                                                    history.amount = bid.amount;
                                                    history.crop = bid.crop;
                                                    history.bidBy = bid.user;
                                                    history.bidStatus = bid.status;
                                                    history.quantity = bid.quantity;
                                                    history.quantityUnit = bid.quantityUnit;
                                                    history.bidRejectReason = bid.reason == undefined ? "" : bid.reason;
                                                    history.bidsPayment = payments;
                                                    history.pincode = bid.pincode;
                                                    history.comment = "Bid placed"

                                                    return Bidshistory.create(history).then(function (res) {


                                                        var cropQry = {};
                                                        cropQry.totalBids = cropInfo.totalBids + 1;

                                                        // if (bid.status == 'Accepted') {
                                                        // 	cropInfo.leftOver
                                                        // }

                                                        if (cropInfo.highestBid < bid.bidRate) {
                                                            cropQry.highestBid = bid.bidRate;
                                                        }

                                                        return Crops.update({ id: bid.crop }, cropQry).then(function (updatedCrop) {
                                                            sails.sockets.blast('bid_placed', bid);

                                                            var msg = "A bid (" + bid.code + ") is placed on " + updatedCrop[0].name + " (" + updatedCrop[0].code + "). ";

                                                            var notificationData = {};
                                                            notificationData.productId = updatedCrop[0].id;
                                                            notificationData.crop = updatedCrop[0].id;
                                                            notificationData.sellerId = updatedCrop[0].seller;
                                                            notificationData.user = bid.user;
                                                            notificationData.buyerId = bid.user;
                                                            notificationData.productType = "crops";
                                                            notificationData.message = msg;
                                                            notificationData.messageKey = "BID_PLACED_NOTIFICATION"
                                                            notificationData.readBy = [];
                                                            notificationData.messageTitle = 'Bid placed'
                                                            let pushnotreceiver = [cropInfo.seller.id]

                                                            return Notifications.create(notificationData).then(function (notificationResponse) {
                                                                if (notificationResponse) {
                                                                    commonService.notifyUsersFromNotification(notificationResponse, updatedCrop[0])

                                                                    // pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                                                }

                                                                if (cropInfo.seller && cropInfo.seller.deviceToken) {
                                                                    let pushObj = {};
                                                                    pushObj.device_token = cropInfo.seller.deviceToken;
                                                                    pushObj.device_type = cropInfo.seller.device_type;
                                                                    pushObj.message = msg;
                                                                    pushService.sendPush(pushObj);
                                                                }

                                                                return Market.findOne({ id: cropInfo.market }).populate('GM').then(function (market) {
                                                                    if (market.GM != undefined && market.GM.mobile != undefined) {
                                                                        pushnotreceiver.push(market.GM.id)
                                                                        let franchiseesmsInfo = {}

                                                                        franchiseesmsInfo.numbers = [market.GM.mobile]
                                                                        franchiseesmsInfo.variables = { "{#CC#}": cropInfo.name, "{#BB#}": cropInfo.code, "{#DD#}": code, "{#EE#}": bid.bidRate, "{#AA#}": bid.quantity }
                                                                        franchiseesmsInfo.templateId = "21667"

                                                                        commonService.sendGeneralSMS(franchiseesmsInfo)
                                                                    }

                                                                    let sellersmsInfo = {}

                                                                    sellersmsInfo.numbers = [cropInfo.seller.mobile]
                                                                    sellersmsInfo.variables = { "{#DD#}": cropInfo.name, "{#BB#}": cropInfo.code, "{#CC#}": code, "{#EE#}": bid.bidRate, "{#AA#}": bid.quantity }
                                                                    sellersmsInfo.templateId = "21668"

                                                                    commonService.sendGeneralSMS(sellersmsInfo)
                                                                    if (notificationResponse) {
                                                                        pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                                                    }

                                                                    return Users.findOne({ id: data.user, roles: 'U' }).then(function (checkSellerCropAlready) {
                                                                        let needtoupdateusertype = true;
                                                                        let usertype = 'cropbuyer'
                                                                        if (checkSellerCropAlready.userType != undefined) {
                                                                            if (checkSellerCropAlready.userType == 'cropbuyer' || checkSellerCropAlready.userType == 'both') {
                                                                                needtoupdateusertype = false;
                                                                            } else if (checkSellerCropAlready.userType == 'farmer') {
                                                                                needtoupdateusertype = true;
                                                                                usertype = 'both'
                                                                            }
                                                                        } else {
                                                                            needtoupdateusertype = true;
                                                                        }

                                                                        if (needtoupdateusertype) {
                                                                            updateUserBuyerType(data.user, usertype);
                                                                        }
                                                                        bid.userType = usertype;

                                                                        return {
                                                                            success: true,
                                                                            code: 200,
                                                                            data: {
                                                                                bid: bid,
                                                                                message: constantObj.bids.SUCCESSFULLY_SAVED_BID,
                                                                                key: 'SUCCESSFULLY_SAVED_BID',
                                                                            }
                                                                        };
                                                                    })

                                                                })
                                                            })
                                                        })
                                                    });
                                                }).fail(function (error) {
                                                    return {
                                                        success: false,
                                                        error: {
                                                            code: 400,
                                                            message: error
                                                        },
                                                    };
                                                });
                                            })
                                        }
                                    }
                                });
                            });
                    }).fail(function (err) {
                        return {
                            success: false,
                            error: {
                                code: 400,
                                message: err
                            },
                        };
                    });
                })
                // });
            }
        })
    },

    saveBidManually = function (data, context) {
        let code = commonServiceObj.getUniqueCode();
        data.code = code;
        data.addedBy = context.identity.id

        // if (data.bidRate == undefined) {
        //     data.bidRate = parseFloat((data.amount / data.quantity).toFixed(2));
        //     //data.bidRate = br.toFixed(2)
        // }
        if (data.amount == undefined) {
            data.amount = parseFloat((data.bidRate * data.quantity).toFixed(2));
        }


        return Crops.findOne({ id: data.crop }).populate("seller").then(function (cropInfo) {
            if (cropInfo.isApproved == true && cropInfo.isExpired == false && cropInfo.isDeleted == false && cropInfo.leftAfterAcceptanceQuantity > data.quantity) {
                data.facilitationCharges = parseFloat((data.amount * cropInfo.efarmxComission / 100).toFixed(2));
                data.taxAmount = parseFloat((data.facilitationCharges * cropInfo.taxRate / 100).toFixed(2));
                if (data.insurancePayment == undefined) {
                    data.insurancePayment = 0
                }
                if (data.logisticPayment == undefined) {
                    data.logisticPayment = 0
                }
                if (data.totalAmount == undefined) {
                    data.totalAmount = parseFloat((data.amount + data.facilitationCharges + data.taxAmount + data.logisticPayment + data.insurancePayment).toFixed(2));
                }
                if (data.facilitationPercent == undefined) {
                    data.facilitationPercent = cropInfo.efarmxComission
                }
                data.taxPercent = cropInfo.taxRate
                data.status = 'Pending'
                data.time = new Date()

                if (cropInfo.aggregatedCrops) {
                    let aggregatedCropQuantities = {}
                    Object.keys(cropInfo.leftAfterAcceptanceQuantitiesParts).forEach((crpId, index) => {
                        let share = (cropInfo.leftAfterAcceptanceQuantitiesParts[crpId] / cropInfo.leftAfterAcceptanceQuantity) * data.quantity
                        aggregatedCropQuantities[crpId] = parseFloat((share).toFixed(3))
                    })
                    data.aggregatedCropQuantities = aggregatedCropQuantities
                } else {
                    let aggregatedCropQuantities = {}
                    aggregatedCropQuantities[cropInfo.id] = data.quantity
                    data.aggregatedCropQuantities = aggregatedCropQuantities
                }

                return Bids.create(data).then(function (bid) {
                    var buyerPayments = [];
                    var sequenceNumber = 0;
                    let days = 0
                    let percentage = 0
                    cropInfo.depositPayment.forEach((obj, i) => {
                        let number = ++sequenceNumber;
                        days = days + cropInfo.depositPayment[i].days
                        percentage = percentage + cropInfo.depositPayment[i].percentage
                        let object = {
                            cropId: cropInfo.id,
                            bidId: bid.id,
                            sellerId: cropInfo.seller.id,
                            buyerId: bid.user,
                            depositPercentage: cropInfo.depositPayment[i].percentage,
                            percentage: cropInfo.depositPayment[i].percentage,
                            name: cropInfo.depositPayment[i].label,
                            depositLabel: cropInfo.depositPayment[i].label,
                            depositDays: cropInfo.depositPayment[i].days,
                            days: days,
                            pincode: cropInfo.pincode,
                            type: "Deposit",
                            status: "Due",
                            sequenceNumber: number,
                            amount: parseFloat(bid.totalAmount * parseFloat(obj.percentage / 100)),
                            bidStatus: 'Placed'
                        }
                        buyerPayments.push(object);
                    })

                    days = days + cropInfo.finalPaymentDays
                    let SequenceNumber = ++sequenceNumber;
                    let finalObject = {
                        cropId: cropInfo.id,
                        bidId: bid.id,
                        sellerId: cropInfo.seller.id,
                        buyerId: bid.user,
                        depositPercentage: 100 - percentage,
                        percentage: 100 - percentage,
                        name: "Final",
                        depositLabel: "Final",
                        depositDays: cropInfo.finalPaymentDays,
                        days: days,
                        pincode: cropInfo.pincode,
                        type: "Final",
                        status: "Due",
                        sequenceNumber: SequenceNumber,
                        amount: parseFloat(bid.totalAmount * parseFloat((100 - percentage) / 100)),
                        bidStatus: 'Placed'
                    }
                    buyerPayments.push(finalObject);

                    for (var i = 0; i < buyerPayments.length; i++) {
                        if (buyerPayments[i].amount < 1) {
                            buyerPayments[i].amount = 0
                            buyerPayments[i].paymentMode = 'AutoAdjusted'
                            buyerPayments[i].status = 'Verified'
                            buyerPayments[i].isVerified = true
                            buyerPayments[i].depositedOn = new Date()
                        }
                    }


                    return Bidspayment.create(buyerPayments).then(function (bidpayments) {
                        let history = {};
                        history.bid = bid.id;
                        history.amount = bid.amount;
                        history.crop = bid.crop;
                        history.bidBy = bid.user;
                        history.bidStatus = bid.status;
                        history.quantity = bid.quantity;
                        history.quantityUnit = bid.quantityUnit;
                        history.bidRejectReason = bid.reason == undefined ? "" : bid.reason;
                        history.bidsPayment = payments;
                        history.pincode = bid.pincode;
                        history.comment = "Bid Created"

                        return Bidshistory.create(history).then(function (res) {
                            var cropQry = {};
                            cropQry.totalBids = cropInfo.totalBids + 1;

                            if (cropInfo.highestBid < bid.bidRate) {
                                cropQry.highestBid = bid.bidRate;
                            }

                            return Crops.update({ id: bid.crop }, cropQry).then(function (updatedCrop) {
                                sails.sockets.blast('bid_placed', bid);

                                var msg = "A bid (" + bid.code + ") is placed on " + updatedCrop[0].name + " (" + updatedCrop[0].code + ") on behalf of buyer by FarmX. ";

                                var notificationData = {};
                                notificationData.productId = updatedCrop[0].id;
                                notificationData.crop = updatedCrop[0].id;
                                notificationData.sellerId = updatedCrop[0].seller;
                                notificationData.user = bid.user;
                                notificationData.buyerId = bid.user;
                                notificationData.productType = "crops";
                                notificationData.message = msg;
                                notificationData.messageKey = "BID_PLACED_NOTIFICATION"
                                notificationData.readBy = [];
                                notificationData.messageTitle = 'Bid placed'
                                let pushnotreceiver = [bid.user, updatedCrop[0].seller]

                                return Notifications.create(notificationData).then(function (notificationResponse) {
                                    if (notificationResponse) {
                                        commonService.notifyUsersFromNotification(notificationResponse, updatedCrop[0])
                                    }
                                    // push notification by rohitk

                                    if (cropInfo.seller && cropInfo.seller.deviceToken) {
                                        let pushObj = {};
                                        pushObj.device_token = cropInfo.seller.deviceToken;
                                        pushObj.device_type = cropInfo.seller.device_type;
                                        pushObj.message = msg;
                                        pushService.sendPush(pushObj);
                                    }

                                    return Market.findOne({ id: cropInfo.market }).populate('GM').then(function (market) {
                                        if (market.GM != undefined && market.GM.mobile != undefined) {
                                            pushnotreceiver.push(market.GM)

                                            let franchiseesmsInfo = {}

                                            franchiseesmsInfo.numbers = [market.GM.mobile]
                                            franchiseesmsInfo.variables = { "{#CC#}": cropInfo.name, "{#BB#}": cropInfo.code, "{#DD#}": code, "{#EE#}": bid.bidRate, "{#AA#}": bid.quantity }
                                            franchiseesmsInfo.templateId = "21667"

                                            commonService.sendGeneralSMS(franchiseesmsInfo)
                                        }

                                        let sellersmsInfo = {}

                                        sellersmsInfo.numbers = [cropInfo.seller.mobile]
                                        sellersmsInfo.variables = { "{#DD#}": cropInfo.name, "{#BB#}": cropInfo.code, "{#CC#}": code, "{#EE#}": bid.bidRate, "{#AA#}": bid.quantity }
                                        sellersmsInfo.templateId = "21668"

                                        commonService.sendGeneralSMS(sellersmsInfo)

                                        if (notificationResponse) {
                                            pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                        }

                                        return Users.findOne({ id: data.user, roles: 'U' }, { fields: ['userType'] }).then(function (checkSellerCropAlready) {
                                            let needtoupdateusertype = true;
                                            let usertype = 'cropbuyer'
                                            if (checkSellerCropAlready.userType != undefined) {
                                                if (checkSellerCropAlready.userType == 'cropbuyer' || checkSellerCropAlready.userType == 'both') {
                                                    needtoupdateusertype = false;
                                                } else if (checkSellerCropAlready.userType == 'farmer') {
                                                    needtoupdateusertype = true;
                                                    usertype = 'both'
                                                }
                                            } else {
                                                needtoupdateusertype = true;
                                            }

                                            if (needtoupdateusertype) {
                                                updateUserBuyerType(data.user, usertype);
                                            }
                                            return {
                                                success: true,
                                                code: 200,
                                                data: {
                                                    bid: bid,
                                                    message: constantObj.bids.SUCCESSFULLY_SAVED_BID,
                                                    key: 'SUCCESSFULLY_SAVED_BID',
                                                }
                                            };
                                        })
                                    })
                                })
                            })
                        });
                    });
                }).fail(function (err) {
                    return {
                        success: false,
                        error: {
                            code: 400,
                            message: err
                        },
                    };
                });
            } else {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: "Crop is either not approved or quantity is not available"
                    },
                };
            }
        })
    },

    rejectBidFunction = function (data, context) {

        let refundBy = context.identity.id

        // var request = require('request');
        var request = require('request-promise');

        var findTransactionQry = {}
        findTransactionQry.bidId = data.id
        findTransactionQry.paymentType = "PayTm"
        findTransactionQry.processStatus = "TXN_SUCCESS"

        return Transactions.findOne(findTransactionQry).then(function (bidTransactions) {

            if (bidTransactions == undefined) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: err
                    },
                };
            }

            var paramlist = {};

            paramlist['MID'] = bidTransactions.paymentjson.MID;
            paramlist['TXNID'] = bidTransactions.paymentjson.TXNID;
            paramlist['ORDER_ID'] = bidTransactions.paymentjson.ORDERID;
            paramlist['REFUNDAMOUNT'] = bidTransactions.paymentjson.TXNAMOUNT;
            paramlist['TXNTYPE'] = "REFUND";

            Payments.genchecksumforrefund(paramlist, constantObj.paytm_config.PAYTM_MERCHANT_KEY, function (err, JsonData) {

                let jsONDST = JSON.stringify(JsonData);
                let refundApiPayTmUrl = constantObj.paytm_config.REFUND_URL + "?JsonData=" + jsONDST

                var options = {
                    url: refundApiPayTmUrl,
                    method: 'GET',
                    headers: {}
                };

                return request(options).then(function (body) {
                    var info = JSON.parse(body);

                    //if (info.status == 0 && info.message == "Refund Initiated") {
                    if (info.STATUS == 'TXN_SUCCESS' && info.RESPMSG == "Refund Successful." && info.REFUNDID != "") {

                        let transactionData = {};

                        transactionData.processedBy = refundBy;
                        transactionData.status = 'RF';
                        transactionData.transactionType = 'DebitEscrow';
                        transactionData.processStatus = info.RESPMSG;
                        transactionData.payTmRefundId = info.REFUNDID;
                        transactionData.refundjson = info;

                        return Transactions.update({ id: bidTransactions.id }, transactionData).then(function (paymentsData) {

                            return Bids.update({ id: data.id }, data).then(function (bid) {
                                return createBidHistory(data, bid[0], "Bid Rejected").then(function (notin) {
                                    return Bidspayment.destroy({ bidId: data.id }).then(function () {

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
                                        notification.messageTitle = 'Bid Rejected'
                                        let pushnotreceiver = [bid[0].user]

                                        return Notifications.create(notificationData).then(function (notificationResponse) {
                                            if (notificationResponse) {
                                                commonService.notifyUsersFromNotification(notificationResponse, undefined)
                                                pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                                return {
                                                    success: true,
                                                    code: 200,
                                                    data: {
                                                        bid: bid[0],
                                                        message: constantObj.bids.SUCCESSFULLY_REJECTED_BID,
                                                        key: 'SUCCESSFULLY_REJECTED_BID',
                                                    },
                                                }
                                            }

                                        })
                                    })
                                })
                            }).fail(function (error) {
                                return {
                                    success: false,
                                    error: {
                                        code: 400,
                                        message: error
                                    },
                                };
                            });
                        });
                    } else {
                        return {
                            success: false,
                            error: {
                                code: 400,
                                message: info.message
                            },
                        };
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

    /*	withdrawalBid = function(data ,context){
    
            let refundBy = context.identity.id
    
            var request = require('request-promise');
    
            var findTransactionQry = {}
            findTransactionQry.bidId = data.id
            findTransactionQry.paymentType = "PayTm"
            findTransactionQry.processStatus = "TXN_SUCCESS"
    
            console.log("findTransactionQry",findTransactionQry)
    
            return Transactions.findOne(findTransactionQry).then(function(bidTransactions) {
    
                if (bidTransactions == undefined) {
                    return {
                        success: false,
                        error: {
                           code: 400,
                           message: "There is some issue with the withdraw bid. Please try again."        
                        },
                    };
                }
    
                var paramlist = {};
    
                paramlist['MID'] = bidTransactions.paymentjson.MID;
                paramlist['TXNID'] = bidTransactions.paymentjson.TXNID;
                paramlist['ORDER_ID'] = bidTransactions.paymentjson.ORDERID;
                paramlist['REFUNDAMOUNT'] = bidTransactions.paymentjson.TXNAMOUNT;
                paramlist['TXNTYPE'] = "REFUND";
    
                console.log("paramlist",paramlist)
                
                return Payments.genchecksumforrefund(paramlist,constantObj.paytm_config.PAYTM_MERCHANT_KEY,function (err,JsonData){
                    console.log("result for refund",JsonData)
    
                    //let merchantKey = constantObj.payu.KEY;
                    //let paymentId = bidTransactions.transactionId;
                    //let refundAmount = bidTransactions.amount;
                    //let refundApiPayuUrl = constantObj.payu.Refund_URL + "?merchantKey=" + merchantKey + "&paymentId=" + paymentId + "&refundAmount=" + refundAmount;
                    let jsONDST = JSON.stringify(JsonData);
                    //let refundApiPayTmUrl = constantObj.paytm_config.REFUND_URL+"?JsonData={MID:"+JsonData.MID+",TXNID:"+JsonData.TXNID+",ORDER_ID:"+JsonData.ORDER_ID+",REFUNDAMOUNT:"+JsonData.REFUNDAMOUNT+",TXNTYPE:"+JsonData.TXNTYPE+",CHECKSUM:"+JsonData.CHECKSUM
                    let refundApiPayTmUrl = constantObj.paytm_config.REFUND_URL+"?JsonData="+jsONDST
                    console.log("refundApiPayTmUrl",refundApiPayTmUrl)
                    
                    var options = {
                        url: refundApiPayTmUrl,
                        method: 'GET',
                        /*headers: {
                          "Authorization": constantObj.payu.Authorization
                        }*/
    /* headers:{}
 };
 
 request(options).then(function (body) {
     console.log("test body",body)

     var info = JSON.parse(body);

     console.log('----------------------------info',info);

     if (info.STATUS == 'TXN_SUCCESS' && info.RESPMSG == "Refund Successful." && info.REFUNDID != "") {

         console.log("in if condition")

         let transactionData = {};

         transactionData.processedBy = refundBy;
         transactionData.status = 'RF';
         transactionData.transactionType = 'DebitEscrow';
         transactionData.processStatus = info.RESPMSG;
         transactionData.payTmRefundId = info.REFUNDID;
         transactionData.refundjson = info;

         console.log("transactionData",transactionData);
     
         return Transactions.update({id:bidTransactions.id},transactionData).then(function(paymentsData) {

             return Bids.update({id:data.id}, data).then(function(bid) {
                 console.log("bid update data",bid);
                 return createBidHistory(data,bid[0], "Bid Withdrawal").then(function(notin) {
                     console.log("createBidHistory",notin);
                     return Bidspayment.destroy({bidId:data.id}).then(function() {
                         var msg = "Bid (" + bid[0].code + ") is withdrawal. ";

                         var notificationData = {};
                         notificationData.productId = bid[0].crop;
                         notificationData.crop = bid[0].crop;                                    
                         notificationData.user = bid[0].user;
                         notificationData.buyerId = bid[0].user;
                         notificationData.productType = "crops";
                         notificationData.message = msg;
                         notificationData.messageKey = "BID_WITHDRAWAL_NOTIFICATION"
                         notificationData.readBy = []; 
                   
                         return Notifications.create(notificationData).then(function(notificationResponse){
                             if (notificationResponse) {
                                 commonService.notifyUsersFromNotification(notificationResponse, undefined)                                   
                             }
                             console.log("In Notification",notificationResponse)
                         })						    		
                      })
                 })							
             }).fail(function(error) {
                 return {
                     success: false,
                     error: {
                        code: 400,
                        message: error        
                     },
                 };
             });
         });
         return {
             success: true,
             code:200,
             data: {                                    
                 bid: bid[0],
                 message: constantObj.bids.SUCCESSFULLY_WITHDRAWAL_BID,
                 key: 'SUCCESSFULLY_WITHDRAWAL_BID',
             },
         }   
     } else {
         return {
             success: false,
             error: {
                code: 400,
                message: info.message        
             },
         };
     }
 }).catch(function (err) {
     return {
         success: false,
         error: err
     }
 });
});
});
},*/

    failedBid = function (data, context) {

        let refundBy = context.identity.id

        var request = require('request-promise');

        var findTransactionQry = {}
        findTransactionQry.bidId = data.id
        findTransactionQry.paymentType = "PayTm"
        findTransactionQry.processStatus = "TXN_SUCCESS"

        return Transactions.findOne(findTransactionQry).then(function (bidTransactions) {

            if (bidTransactions == undefined) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: err
                    },
                };
            }

            var paramlist = {};

            paramlist['MID'] = bidTransactions.paymentjson.MID;
            paramlist['TXNID'] = bidTransactions.paymentjson.TXNID;
            paramlist['ORDER_ID'] = bidTransactions.paymentjson.ORDERID;
            paramlist['REFUNDAMOUNT'] = bidTransactions.paymentjson.TXNAMOUNT;
            paramlist['TXNTYPE'] = "REFUND";

            Payments.genchecksumforrefund(paramlist, constantObj.paytm_config.PAYTM_MERCHANT_KEY, function (err, JsonData) {
                console.log("result of refund", JsonData)

                let jsONDST = JSON.stringify(JsonData);
                let refundApiPayTmUrl = constantObj.paytm_config.REFUND_URL + "?JsonData=" + jsONDST
                console.log("refundApiPayTmUrl", refundApiPayTmUrl)

                var options = {
                    url: refundApiPayTmUrl,
                    method: 'GET',
                    headers: {}
                };

                return request(options).then(function (body) {
                    var info = JSON.parse(body);

                    if (info.status == 0 && info.message == "Refund Initiated") {

                        let transactionData = {};
                        transactionData.processedBy = refundBy;
                        transactionData.status = 'RF';
                        transactionData.transactionType = 'DebitEscrow';
                        transactionData.processStatus = info.RESPMSG
                        transactionData.payTmRefundId = info.REFUNDID;
                        transactionData.refundjson = info;

                        return Transactions.update({ id: bidTransactions.id }, transactionData).then(function (paymentsData) {
                            return Bids.update({ id: data.id }, data).then(function (bid) {
                                return createBidHistory(data, bid[0], "Bid Failed").then(function (notin) {
                                    return Bidspayment.destroy({ bidId: data.id }).then(function () {
                                        var msg = "Bid (" + bid[0].code + ") is Failed. ";

                                        var notificationData = {};
                                        notificationData.productId = bid[0].crop;
                                        notificationData.crop = bid[0].crop;
                                        notificationData.user = bid[0].user;
                                        notificationData.buyerId = bid[0].user;
                                        notificationData.productType = "crops";
                                        notificationData.message = msg;
                                        notificationData.messageKey = "BID_FAILED_NOTIFICATION"
                                        notificationData.readBy = [];

                                        return Notifications.create(notificationData).then(function (notificationResponse) {
                                            if (notificationResponse) {
                                                commonService.notifyUsersFromNotification(notificationResponse, undefined)
                                            }
                                            return {
                                                success: true,
                                                code: 200,
                                                data: {
                                                    bid: bid[0],
                                                    message: constantObj.bids.SUCCESSFULLY_WITHDRAWAL_BID,
                                                    key: 'SUCCESSFULLY_WITHDRAWAL_BID',
                                                },
                                            }
                                        })
                                    })
                                })
                            }).fail(function (error) {
                                return {
                                    success: false,
                                    error: {
                                        code: 400,
                                        message: error
                                    },
                                };
                            });
                        });
                    } else {
                        return {
                            success: false,
                            error: {
                                code: 400,
                                message: info.message
                            },
                        };
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

    updateBid = function (data, context) {
        var message = 'Bid Updated'
        if (data.historyComment) {
            message = data.historyComment

            delete data.historyComment
        }

        return Bids.update({ id: data.id }, data).then(function (bid) {
            var callFunction = BidService.createBidHistory(data, bid[0], message)
            if (callFunction) {
                return {
                    success: true,
                    code: 200,
                    data: {
                        bid: bid[0],
                        message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                        key: 'SUCCESSFULLY_UPDATED_BID',
                    },
                }
            } else {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: "Unknow Error Occurred"
                    },
                };
            }
        }).fail(function (error) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: error
                },
            };
        });
    },

    updateInitiate = function (data, context) {
        var paymentId = data.id;
        var buyerId = data.buyer;
        data.refundStatus = "Pending";
        data.paymentDate = new Date();

        delete data.id;
        delete data.buyer;
        //console.log("dat is",data);
        var message = 'Refund Initiated.'
        return Bidspayment.update({ id: paymentId }, data).then(function (refund) {

            var transactionQuery = {};
            transactionQuery.
                //return Transactions.findOne(transactionQuery).then(function(getTransaction) {

                //return Transactions.update({id:paymentId}, data).then(function(refundInTransaction) {            
                console.log("refund of bid", refund);
            if (refund) {
                return {
                    success: true,
                    code: 200,
                    data: {
                        refund: refund[0],
                        message: constantObj.bids.SUCCESSFULLY_REFUNDED_AMOUNT,
                        key: 'SUCCESSFULLY_REFUNDED_AMOUNT',
                    },
                }
            } else {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: "Unknow Error Occurred"
                    },
                };
            }
        }).fail(function (error) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: error
                },
            };
            //});
            //});
        });
    },

    updateETA = function (data, context) {
        return Bids.findOne({ id: data.id }).populate('user').populate('crop').then(function (bid) {
            if (bid) {
                var message = 'ETD assigned'
                if (bid.ETD) {
                    message = 'ETD Updated'
                }
                var dataToUpdate = {}
                dataToUpdate.id = data.id
                if (bid.deliveryTime) {
                    var availObj = data.ETD;
                    var availableRange = bid.deliveryTime;
                    var dateChanged = new Date(availObj);
                    dateChanged.setDate(dateChanged.getDate() + availableRange);
                    data.ETA = dateChanged
                    dataToUpdate.ETA = dateChanged
                }
                dataToUpdate.ETD = new Date(data.ETD)

                let buyersmsInfo = {}

                buyersmsInfo.numbers = [bid.user.mobile]
                buyersmsInfo.variables = { "{#BB#}": commonService.longDateFormat(new Date(data.ETD)), "{#CC#}": bid.crop.name, "{#DD#}": bid.crop.code }
                buyersmsInfo.templateId = "21713"

                commonService.sendGeneralSMS(buyersmsInfo)

                return bidCheckPost(updateBid, dataToUpdate, context, message);
            } else {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: "Unknow Error Occurred"
                    },
                };
            }
        }).fail(function (error) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: error
                },
            };
        });
    },

    assignLogisticAndDeliveryTime = function (data, context, req, res) {

        let bidData = {}
        bidData.id = data.id
        bidData.deliveryTime = data.deliveryTime
        bidData.logisticId = data.logisticId

        const googleMapsClient = require('@google/maps').createClient({
            key: constantObj.googlePlaces.key
        });
        Bids.findOne({ id: data.id }).populate('crop').populate('input').populate('tripId').then(function (bid) {
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
                    bidData.ETA = dateChanged
                }

                var findOngoingTrip = {}
                findOngoingTrip.vehicle = data.vehicleId
                findOngoingTrip.status = 'Created'

                if (bid.tripId) {
                    return res.jsonx({
                        success: false,
                        error: "Already assigned in trip " + String(bid.tripId.code) + ". Please remove order from there and then reassign."
                    });
                } else {
                    LogisticTrip.findOne(findOngoingTrip).populate('orders').then(function (trip) {
                        console.log("existing trip == ", trip)
                        let sourceAddress = ""

                        if (bid.productType == 'crop') {
                            sourceAddress = bid.crop.address + ", " + bid.crop.city + ", " + bid.crop.district + ", " + bid.crop.state
                        } else if (bid.productType == 'input') {
                            sourceAddress = bid.input.address + ", " + bid.input.city + ", " + bid.input.district + ", " + bid.input.state
                        }

                        let destinationAddress = bid.address

                        var tripOrderData = {}

                        if (bid.productType == 'crop') {
                            tripOrderData.seller = bid.crop.seller
                        } else if (bid.productType == 'input') {
                            tripOrderData.seller = bid.input.user
                        }

                        tripOrderData.buyer = bid.user
                        tripOrderData.sourceAddress = sourceAddress
                        tripOrderData.destinationAddress = destinationAddress

                        var geocoder = NodeGeocoder(constantObj.googlePlaces.options);

                        geocoder.geocode(sourceAddress).then(function (sourceAddressInfo) {
                            if (sourceAddressInfo) {
                                if (sourceAddressInfo.length > 0) {
                                    geocoder.geocode(destinationAddress).then(function (destinationAddressInfo) {
                                        if (destinationAddressInfo) {
                                            if (destinationAddressInfo.length > 0) {
                                                if (sourceAddressInfo[0].zipcode) {
                                                    tripOrderData.sourcePincode = sourceAddressInfo[0].zipcode
                                                } else {
                                                    if (bid.productType == 'crop') {
                                                        tripOrderData.sourcePincode = bid.crop.pincode
                                                    } else if (bid.productType == 'input') {
                                                        tripOrderData.sourcePincode = bid.input.pincode
                                                    }
                                                }

                                                tripOrderData.sourceCoordinates = { lat: sourceAddressInfo[0].latitude, lon: sourceAddressInfo[0].longitude }

                                                if (destinationAddressInfo[0].zipcode) {
                                                    tripOrderData.destinationPincode = destinationAddressInfo[0].zipcode
                                                }

                                                tripOrderData.destinationCoordinates = { lat: destinationAddressInfo[0].latitude, lon: destinationAddressInfo[0].longitude }

                                                tripOrderData.bidId = data.id

                                                if (trip) {
                                                    console.log("going inside existing == ")
                                                    tripOrderData.tripId = trip.id
                                                    bidData.tripId = trip.id
                                                    Triporder.create(tripOrderData).then(function (tripData) {
                                                        let orders = trip.orders
                                                        orders.push(tripData)

                                                        let addressSequence = []

                                                        let allCoordinates = []

                                                        for (var i = 0; i < orders.length; i++) {
                                                            allCoordinates.push({ address: orders[i].sourceAddress, lat: orders[i].sourceCoordinates.lat, lon: orders[i].sourceCoordinates.lon, type: "seller", orderId: orders[i].id })
                                                            allCoordinates.push({ address: orders[i].destinationAddress, lat: orders[i].destinationCoordinates.lat, lon: orders[i].destinationCoordinates.lon, type: "buyer", orderId: orders[i].id })
                                                        }

                                                        let opts = {
                                                            yName: "lon",
                                                            xName: "lat"
                                                        }

                                                        let origin = { lon: allCoordinates[0].lon, lat: allCoordinates[0].lat }

                                                        let sortedLocations = sortByDistance(origin, allCoordinates, opts)

                                                        let sequecenceOfDestinations = []


                                                        for (var i = 0; i < sortedLocations.length; i++) {
                                                            sequecenceOfDestinations.push({ address: sortedLocations[i].address, coord: { lat: sortedLocations[i].lat, lon: sortedLocations[i].lon }, type: sortedLocations[i].type, orderId: sortedLocations[i].orderId })
                                                        }

                                                        trip.destinationSequence = sequecenceOfDestinations
                                                        let waypoints = ""

                                                        for (var i = 1; i < sortedLocations.length - 1; i++) {
                                                            if (i > 1) {
                                                                waypoints = waypoints + "|"
                                                            }
                                                            waypoints = waypoints + "via:" + String(sortedLocations[i].lat) + "," + String(sortedLocations[i].lon)
                                                        }

                                                        googleMapsClient.directions({
                                                            origin: String(origin.lat) + "," + String(origin.lon),
                                                            destination: String(sortedLocations[sortedLocations.length - 1].lat) + "," + String(sortedLocations[sortedLocations.length - 1].lon),
                                                            waypoints: waypoints,
                                                            optimize: false
                                                        }, function (err, routeresponses) {
                                                            console.log("routeresponses == ", routeresponses)
                                                            let routeresponse = undefined
                                                            if (routeresponses && routeresponses.json) {
                                                                routeresponse = routeresponses.json
                                                            }
                                                            if (!err && routeresponse && routeresponse.status == 'OK' && routeresponse.routes && routeresponse.routes.length > 0) {
                                                                if (routeresponse.routes[0].legs && routeresponse.routes[0].legs.length > 0) {
                                                                    trip.totalDistanceToTravel = routeresponse.routes[0].legs[0].distance
                                                                    trip.totalTimeToBeTaken = routeresponse.routes[0].legs[0].duration
                                                                    trip.prescribedRoute = routeresponse.routes[0].legs[0].steps
                                                                }
                                                            }

                                                            var locJson = trip.prescribedRoute;

                                                            let tripToUpdate = trip

                                                            delete tripToUpdate.orders
                                                            delete tripToUpdate.prescribedRoute;
                                                            tripToUpdate.prescribedRoute = [];


                                                            LogisticTrip.update({ id: trip.id }, tripToUpdate).then(function (updatedTrip) {
                                                                Bids.update({ id: data.id }, bidData).then(function (bid) {
                                                                    sendAssignLogisticMessages(bid[0])
                                                                    let path1 = 'assets/location/prescriberoutes/' + trip.id + '.json';
                                                                    fs.writeFile(path1, JSON.stringify(locJson, null, 2), function (err) {
                                                                        if (err) throw err;

                                                                        return res.jsonx({
                                                                            success: true,
                                                                            code: 200,
                                                                            data: {
                                                                                bid: bid[0],
                                                                                trip: updatedTrip[0],
                                                                                message: "Successfully added order to trip",
                                                                            },
                                                                        })
                                                                    })                                                                    
                                                                })
                                                            }).fail(function (error) {
                                                                console.log("error == ", error)
                                                                return res.jsonx({
                                                                    success: false,
                                                                    error: {
                                                                        code: 400,
                                                                        message: error
                                                                    },
                                                                })
                                                            })
                                                        })
                                                    }).fail(function (err) {
                                                        return res.jsonx({
                                                            success: false,
                                                            error: {
                                                                code: 400,
                                                                message: err
                                                            },
                                                        })
                                                    })
                                                } else {
                                                    let logisticTrip = {}
                                                    TripCode().then(function (code) {
                                                        logisticTrip.code = code
                                                        logisticTrip.logisticPartner = data.logisticId
                                                        logisticTrip.vehicle = data.vehicleId
                                                        logisticTrip.driver = data.driverId
                                                        logisticTrip.destinationSequence = [{ address: sourceAddress, coord: tripOrderData.sourceCoordinates, type: 'seller' }, { address: destinationAddress, coord: tripOrderData.destinationCoordinates, type: 'buyer' }]
                                                        OTTC().then(function (ottc) {
                                                            logisticTrip.OTTC = ottc
                                                            logisticTrip.OTTCCreatedDate = new Date()

                                                            googleMapsClient.directions({
                                                                origin: String(tripOrderData.sourceCoordinates.lat) + "," + String(tripOrderData.sourceCoordinates.lon),
                                                                destination: String(tripOrderData.destinationCoordinates.lat) + "," + String(tripOrderData.destinationCoordinates.lon),
                                                            }, function (err, routeresponses) {
                                                                console.log("routeresponses == ", routeresponses)
                                                                let routeresponse = undefined
                                                                if (routeresponses && routeresponses.json) {
                                                                    routeresponse = routeresponses.json
                                                                }

                                                                if (!err && routeresponse && routeresponse.status == 'OK' && routeresponse.routes && routeresponse.routes.length > 0) {
                                                                    if (routeresponse.routes[0].legs && routeresponse.routes[0].legs.length > 0) {
                                                                        logisticTrip.totalDistanceToTravel = routeresponse.routes[0].legs[0].distance
                                                                        logisticTrip.totalTimeToBeTaken = routeresponse.routes[0].legs[0].duration
                                                                        logisticTrip.prescribedRoute = routeresponse.routes[0].legs[0].steps
                                                                    }
                                                                }

                                                                var locJson = logisticTrip.prescribedRoute;
                                                                delete logisticTrip.prescribedRoute;
                                                                logisticTrip.prescribedRoute = [];

                                                                LogisticTrip.create(logisticTrip).then(function (newtrip) {
                                                                    if (newtrip) {
                                                                        tripOrderData.tripId = newtrip.id
                                                                        bidData.tripId = newtrip.id

                                                                        Triporder.create(tripOrderData).then(function (tripData) {
                                                                            newtrip.destinationSequence = [{ address: sourceAddress, coord: tripOrderData.sourceCoordinates, type: "seller", orderId: tripData.id }, { address: destinationAddress, coord: tripOrderData.destinationCoordinates, type: "buyer", orderId: tripData.id }]
                                                                            delete newtrip.orders
                                                                            LogisticTrip.update({ id: newtrip.id }, newtrip).then(function (updatedTripInfo) {
                                                                                let smsInfo = {}
                                                                                smsInfo.tripcode = String(newtrip.code)
                                                                                smsInfo.OTTC = String(newtrip.OTTC)
                                                                                Lpartners.findOne({ id: data.logisticId }).populate('vehicles').populate('drivers').then(function (lpartner) {
                                                                                    console.log("lpartner == ", lpartner)
                                                                                    for (var i = 0; i < lpartner.vehicles.length; i++) {
                                                                                        let vehicle = lpartner.vehicles[i]
                                                                                        if (vehicle.id == data.vehicleId) {
                                                                                            smsInfo.vehiclenumber = vehicle.number
                                                                                            break
                                                                                        }
                                                                                    }
                                                                                    for (var i = 0; i < lpartner.drivers.length; i++) {
                                                                                        let vehicle = lpartner.drivers[i]
                                                                                        if (vehicle.id == data.driverId) {
                                                                                            if (vehicle.mobile) {
                                                                                                smsInfo.numbers = [lpartner.mobile, vehicle.mobile]
                                                                                            } else {
                                                                                                smsInfo.numbers = [lpartner.mobile]
                                                                                            }
                                                                                            break
                                                                                        }
                                                                                    }

                                                                                    if (!smsInfo.numbers) {
                                                                                        smsInfo.numbers = [lpartner.mobile]
                                                                                    }

                                                                                    commonService.sendOTTCSMS(smsInfo)


                                                                                    Bids.update({ id: data.id }, bidData).then(function (bid) {
                                                                                        sendAssignLogisticMessages(bid[0])

                                                                                        let path1 = 'assets/location/prescriberoutes/' + newtrip.id + '.json';
                                                                                        fs.writeFile(path1, JSON.stringify(locJson, null, 2), function (err) {
                                                                                            if (err) throw err;

                                                                                            return res.jsonx({
                                                                                                success: true,
                                                                                                code: 200,
                                                                                                data: {
                                                                                                    bid: bid[0],
                                                                                                    trip: updatedTripInfo[0],
                                                                                                    message: "Successfully created Trip"
                                                                                                },
                                                                                            })
                                                                                        })                                                                                        
                                                                                    })
                                                                                })
                                                                            }).fail(function (err) {
                                                                                return res.jsonx({
                                                                                    success: false,
                                                                                    error: {
                                                                                        code: 400,
                                                                                        message: err
                                                                                    },
                                                                                })
                                                                            })
                                                                        }).fail(function (err) {
                                                                            return res.jsonx({
                                                                                success: false,
                                                                                error: {
                                                                                    code: 400,
                                                                                    message: err
                                                                                },
                                                                            })
                                                                        })
                                                                    } else {
                                                                        return res.jsonx({
                                                                            success: false,
                                                                            error: {
                                                                                code: 400,
                                                                                message: "Unknow Error Occurred"
                                                                            },
                                                                        });
                                                                    }
                                                                }).fail(function (err) {
                                                                    return res.jsonx({
                                                                        success: false,
                                                                        error: {
                                                                            code: 400,
                                                                            message: err
                                                                        },
                                                                    });
                                                                });
                                                            })
                                                        })
                                                    })
                                                }
                                            } else {
                                                return res.jsonx({
                                                    success: false,
                                                    error: {
                                                        code: 400,
                                                        message: "Destination Address not valid"
                                                    },
                                                });
                                            }
                                        }
                                    });
                                } else {
                                    return res.jsonx({
                                        success: false,
                                        error: {
                                            code: 400,
                                            message: "Source Address not valid"
                                        },
                                    });
                                }
                            }
                        });
                    }).fail(function (error) {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: error
                            },
                        })
                    })
                }
            } else {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: "Unknow Error Occurred"
                    },
                });
            }
        }).fail(function (error) {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: error
                },
            });
        });
    },
    /*assignLogisticFieldTransactionAndDeliveryTime = function (data, context, req, res) {

        let bidData = {}
        bidData.id = data.id
        bidData.deliveryTime = data.deliveryTime
        bidData.logisticId = data.logisticId

        const googleMapsClient = require('@google/maps').createClient({
            key: constantObj.googlePlaces.key
        });
        FieldTransactions.findOne({ id: data.id }).populate('tripId').then(function (bid) {
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
                    bidData.ETA = dateChanged
                }

                var findOngoingTrip = {}
                findOngoingTrip.vehicle = data.vehicleId
                findOngoingTrip.status = 'Created'

                if (bid.tripId) {
                    return res.jsonx({
                        success: false,
                        error: "Already assigned in trip " + String(bid.tripId.code) + ". Please remove order from there and then reassign."
                    });
                } else {
                    LogisticTrip.findOne(findOngoingTrip).populate('orders').then(function (trip) {
                        console.log("existing trip == ", trip)
                        let sourceAddress = ""

                        if (bid.productType == 'crops') {
                            sourceAddress = bid.sellerAddress
                        } else if (bid.productType == 'input') {
                            sourceAddress = bid.sellerAddress
                        }

                        let destinationAddress = bid.buyerAddress

                        var tripOrderData = {}

                        if (bid.productType == 'crops') {
                            tripOrderData.seller = bid.seller
                        } else if (bid.productType == 'input') {
                            tripOrderData.seller = bid.buyer
                        }

                        tripOrderData.buyer = bid.user
                        tripOrderData.sourceAddress = sourceAddress
                        tripOrderData.destinationAddress = destinationAddress

                        var geocoder = NodeGeocoder(constantObj.googlePlaces.options);

                        geocoder.geocode(sourceAddress).then(function (sourceAddressInfo) {
                            if (sourceAddressInfo) {
                                if (sourceAddressInfo.length > 0) {
                                    geocoder.geocode(destinationAddress).then(function (destinationAddressInfo) {
                                        if (destinationAddressInfo) {
                                            if (destinationAddressInfo.length > 0) {
                                                if (sourceAddressInfo[0].zipcode) {
                                                    tripOrderData.sourcePincode = sourceAddressInfo[0].zipcode
                                                } else {
                                                    if (bid.productType == 'crops') {
                                                        tripOrderData.sourcePincode = bid.sellerPincode
                                                    } else if (bid.productType == 'input') {
                                                        tripOrderData.sourcePincode = bid.sellerPincode
                                                    }
                                                }

                                                tripOrderData.sourceCoordinates = { lat: sourceAddressInfo[0].latitude, lon: sourceAddressInfo[0].longitude }

                                                if (destinationAddressInfo[0].zipcode) {
                                                    tripOrderData.destinationPincode = destinationAddressInfo[0].zipcode
                                                }

                                                tripOrderData.destinationCoordinates = { lat: destinationAddressInfo[0].latitude, lon: destinationAddressInfo[0].longitude }

                                                tripOrderData.bidId = data.id

                                                if (trip) {
                                                    console.log("going inside existing == ")
                                                    tripOrderData.tripId = trip.id
                                                    bidData.tripId = trip.id;
                                                    tripOrderData.type = 'fieldTransaction';
                                                    Triporder.create(tripOrderData).then(function (tripData) {
                                                        let orders = trip.orders
                                                        orders.push(tripData)

                                                        let addressSequence = []

                                                        let allCoordinates = []

                                                        for (var i = 0; i < orders.length; i++) {
                                                            allCoordinates.push({ address: orders[i].sourceAddress, lat: orders[i].sourceCoordinates.lat, lon: orders[i].sourceCoordinates.lon, type: "seller", orderId: orders[i].id })
                                                            allCoordinates.push({ address: orders[i].destinationAddress, lat: orders[i].destinationCoordinates.lat, lon: orders[i].destinationCoordinates.lon, type: "buyer", orderId: orders[i].id })
                                                        }

                                                        let opts = {
                                                            yName: "lon",
                                                            xName: "lat"
                                                        }

                                                        let origin = { lon: allCoordinates[0].lon, lat: allCoordinates[0].lat }

                                                        let sortedLocations = sortByDistance(origin, allCoordinates, opts)

                                                        let sequecenceOfDestinations = []


                                                        for (var i = 0; i < sortedLocations.length; i++) {
                                                            sequecenceOfDestinations.push({ address: sortedLocations[i].address, coord: { lat: sortedLocations[i].lat, lon: sortedLocations[i].lon }, type: sortedLocations[i].type, orderId: sortedLocations[i].orderId })
                                                        }

                                                        trip.destinationSequence = sequecenceOfDestinations
                                                        let waypoints = ""

                                                        for (var i = 1; i < sortedLocations.length - 1; i++) {
                                                            if (i > 1) {
                                                                waypoints = waypoints + "|"
                                                            }
                                                            waypoints = waypoints + "via:" + String(sortedLocations[i].lat) + "," + String(sortedLocations[i].lon)
                                                        }

                                                        googleMapsClient.directions({
                                                            origin: String(origin.lat) + "," + String(origin.lon),
                                                            destination: String(sortedLocations[sortedLocations.length - 1].lat) + "," + String(sortedLocations[sortedLocations.length - 1].lon),
                                                            waypoints: waypoints,
                                                            optimize: false
                                                        }, function (err, routeresponses) {
                                                            console.log("routeresponses == ", routeresponses)
                                                            let routeresponse = undefined
                                                            if (routeresponses && routeresponses.json) {
                                                                routeresponse = routeresponses.json
                                                            }
                                                            if (!err && routeresponse && routeresponse.status == 'OK' && routeresponse.routes && routeresponse.routes.length > 0) {
                                                                if (routeresponse.routes[0].legs && routeresponse.routes[0].legs.length > 0) {
                                                                    trip.totalDistanceToTravel = routeresponse.routes[0].legs[0].distance
                                                                    trip.totalTimeToBeTaken = routeresponse.routes[0].legs[0].duration
                                                                    trip.prescribedRoute = routeresponse.routes[0].legs[0].steps
                                                                }
                                                            }

                                                            let tripToUpdate = trip

                                                            delete tripToUpdate.orders


                                                            LogisticTrip.update({ id: trip.id }, tripToUpdate).then(function (updatedTrip) {
                                                                FieldTransactions.update({ id: data.id }, bidData).then(function (bid) {
                                                                    sendAssignLogisticTransactionMessages(bid[0])
                                                                    return res.jsonx({
                                                                        success: true,
                                                                        code: 200,
                                                                        data: {
                                                                            bid: bid[0],
                                                                            trip: updatedTrip[0],
                                                                            message: "Successfully added order to trip",
                                                                        },
                                                                    })
                                                                })
                                                            }).fail(function (error) {
                                                                console.log("error == ", error)
                                                                return res.jsonx({
                                                                    success: false,
                                                                    error: {
                                                                        code: 400,
                                                                        message: error
                                                                    },
                                                                })
                                                            })
                                                        })
                                                    }).fail(function (err) {
                                                        return res.jsonx({
                                                            success: false,
                                                            error: {
                                                                code: 400,
                                                                message: err
                                                            },
                                                        })
                                                    })
                                                } else {
                                                    let logisticTrip = {}
                                                    TripCode().then(function (code) {
                                                        logisticTrip.code = code
                                                        logisticTrip.logisticPartner = data.logisticId
                                                        logisticTrip.vehicle = data.vehicleId
                                                        logisticTrip.driver = data.driverId
                                                        logisticTrip.destinationSequence = [{ address: sourceAddress, coord: tripOrderData.sourceCoordinates, type: 'seller' }, { address: destinationAddress, coord: tripOrderData.destinationCoordinates, type: 'buyer' }]
                                                        OTTC().then(function (ottc) {
                                                            logisticTrip.OTTC = ottc
                                                            logisticTrip.OTTCCreatedDate = new Date()

                                                            googleMapsClient.directions({
                                                                origin: String(tripOrderData.sourceCoordinates.lat) + "," + String(tripOrderData.sourceCoordinates.lon),
                                                                destination: String(tripOrderData.destinationCoordinates.lat) + "," + String(tripOrderData.destinationCoordinates.lon),
                                                            }, function (err, routeresponses) {
                                                                console.log("routeresponses == ", routeresponses)
                                                                let routeresponse = undefined
                                                                if (routeresponses && routeresponses.json) {
                                                                    routeresponse = routeresponses.json
                                                                }

                                                                if (!err && routeresponse && routeresponse.status == 'OK' && routeresponse.routes && routeresponse.routes.length > 0) {
                                                                    if (routeresponse.routes[0].legs && routeresponse.routes[0].legs.length > 0) {
                                                                        logisticTrip.totalDistanceToTravel = routeresponse.routes[0].legs[0].distance
                                                                        logisticTrip.totalTimeToBeTaken = routeresponse.routes[0].legs[0].duration
                                                                        logisticTrip.prescribedRoute = routeresponse.routes[0].legs[0].steps
                                                                    }
                                                                }

                                                                LogisticTrip.create(logisticTrip).then(function (newtrip) {
                                                                    if (newtrip) {
                                                                        tripOrderData.tripId = newtrip.id
                                                                        bidData.tripId = newtrip.id
                                                                        tripOrderData.type = 'fieldTransaction';
                                                                        Triporder.create(tripOrderData).then(function (tripData) {
                                                                            newtrip.destinationSequence = [{ address: sourceAddress, coord: tripOrderData.sourceCoordinates, type: "seller", orderId: tripData.id }, { address: destinationAddress, coord: tripOrderData.destinationCoordinates, type: "buyer", orderId: tripData.id }]
                                                                            delete newtrip.orders
                                                                            LogisticTrip.update({ id: newtrip.id }, newtrip).then(function (updatedTripInfo) {
                                                                                let smsInfo = {}
                                                                                smsInfo.tripcode = String(newtrip.code)
                                                                                smsInfo.OTTC = String(newtrip.OTTC)
                                                                                Lpartners.findOne({ id: data.logisticId }).populate('vehicles').populate('drivers').then(function (lpartner) {
                                                                                    console.log("lpartner == ", lpartner)
                                                                                    for (var i = 0; i < lpartner.vehicles.length; i++) {
                                                                                        let vehicle = lpartner.vehicles[i]
                                                                                        if (vehicle.id == data.vehicleId) {
                                                                                            smsInfo.vehiclenumber = vehicle.number
                                                                                            break
                                                                                        }
                                                                                    }
                                                                                    for (var i = 0; i < lpartner.drivers.length; i++) {
                                                                                        let vehicle = lpartner.drivers[i]
                                                                                        if (vehicle.id == data.driverId) {
                                                                                            if (vehicle.mobile) {
                                                                                                smsInfo.numbers = [lpartner.mobile, vehicle.mobile]
                                                                                            } else {
                                                                                                smsInfo.numbers = [lpartner.mobile]
                                                                                            }
                                                                                            break
                                                                                        }
                                                                                    }

                                                                                    if (!smsInfo.numbers) {
                                                                                        smsInfo.numbers = [lpartner.mobile]
                                                                                    }

                                                                                    commonService.sendOTTCSMS(smsInfo)


                                                                                    FieldTransactions.update({ id: data.id }, bidData).then(function (bid) {
                                                                                        sendAssignLogisticTransactionMessages(bid[0])
                                                                                        return res.jsonx({
                                                                                            success: true,
                                                                                            code: 200,
                                                                                            data: {
                                                                                                bid: bid[0],
                                                                                                trip: updatedTripInfo[0],
                                                                                                message: "Successfully created Trip"
                                                                                            },
                                                                                        })
                                                                                    })
                                                                                })
                                                                            }).fail(function (err) {
                                                                                return res.jsonx({
                                                                                    success: false,
                                                                                    error: {
                                                                                        code: 400,
                                                                                        message: err
                                                                                    },
                                                                                })
                                                                            })
                                                                        }).fail(function (err) {
                                                                            return res.jsonx({
                                                                                success: false,
                                                                                error: {
                                                                                    code: 400,
                                                                                    message: err
                                                                                },
                                                                            })
                                                                        })
                                                                    } else {
                                                                        return res.jsonx({
                                                                            success: false,
                                                                            error: {
                                                                                code: 400,
                                                                                message: "Unknow Error Occurred"
                                                                            },
                                                                        });
                                                                    }
                                                                }).fail(function (err) {
                                                                    return res.jsonx({
                                                                        success: false,
                                                                        error: {
                                                                            code: 400,
                                                                            message: err
                                                                        },
                                                                    });
                                                                });
                                                            })
                                                        })
                                                    })
                                                }
                                            } else {
                                                return res.jsonx({
                                                    success: false,
                                                    error: {
                                                        code: 400,
                                                        message: "Destination Address not valid"
                                                    },
                                                });
                                            }
                                        }
                                    });
                                } else {
                                    return res.jsonx({
                                        success: false,
                                        error: {
                                            code: 400,
                                            message: "Source Address not valid"
                                        },
                                    });
                                }
                            }
                        });
                    }).fail(function (error) {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: error
                            },
                        })
                    })
                }
            } else {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: "Unknow Error Occurred"
                    },
                });
            }
        }).fail(function (error) {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: error
                },
            });
        });
    },*/


    OTTC = function () {
        let newOTTC = Math.floor(Math.random() * 90000) + 10000;

        return LogisticTrip.count({ OTTC: newOTTC, OTTCStatus: "Valid" }).then(function (codeExists) {
            if (codeExists > 0) {
                OTTC()
            } else {
                return newOTTC
            }
        })
    },

    TripCode = function () {
        let tc = Math.floor(Math.random() * 900000) + 100000;

        return LogisticTrip.count({ code: tc }).then(function (codeExists) {
            if (codeExists > 0) {
                return TripCode()
            } else {
                return tc
            }
        })
    },

    sendAssignLogisticMessages = function (bid) {
        Bids.findOne({ id: bid.id }).populate('tripId').populate('crop').populate('user').then(function (fbid) {
            Vehicles.findOne({ id: fbid.tripId.vehicleId }).then(function (vehicleassigned) {
                let buyersmsInfo = {}

                buyersmsInfo.numbers = [fbid.user.mobile]
                buyersmsInfo.variables = { "{#CC#}": vehicleassigned.number }
                buyersmsInfo.templateId = "21714"

                commonService.sendGeneralSMS(buyersmsInfo)

                Market.findOne({ id: fbid.crop.market.id }).populate('GM').then(function (market) {
                    if (market.GM != undefined && market.GM.mobile != undefined) {
                        let franchiseesmsInfo = {}

                        franchiseesmsInfo.numbers = [market.GM.mobile]
                        franchiseesmsInfo.variables = { "{#DD#}": vehicleassigned.number, "{#BB#}": fbid.crop.code, "{#EE#}": commonService.longDateFormat(fbid.ETD) }
                        franchiseesmsInfo.templateId = "21715"

                        commonService.sendGeneralSMS(franchiseesmsInfo)
                    }

                    Users.findOne({ id: fbid.crop.seller }).then(function (slr) {
                        let sellersmsInfo = {}

                        sellersmsInfo.numbers = [fbid.user.mobile]
                        sellersmsInfo.variables = { "{#CC#}": vehicleassigned.number, "{#DD#}": fbid.crop.name, "{#BB#}": fbid.crop.code }
                        sellersmsInfo.templateId = "21716"

                        commonService.sendGeneralSMS(sellersmsInfo)
                    })
                })
            })
        })
    },
    sendAssignLogisticTransactionMessages = function (bid) {
        FieldTransactions.findOne({ id: bid.id }).populate('tripId').populate('buyer').then(function (fbid) {
            Vehicles.findOne({ id: fbid.tripId.vehicleId }).then(function (vehicleassigned) {
                let buyersmsInfo = {}

                buyersmsInfo.numbers = [fbid.buyerMobile]
                if (vehicleassigned && vehicleassigned.number != "undefined") {
                    buyersmsInfo.variables = { "{#CC#}": vehicleassigned.number }
                }
                buyersmsInfo.templateId = "21714"

                commonService.sendGeneralSMS(buyersmsInfo)

                Market.findOne({ GM: fbid.franchisee }).populate('GM').then(function (market) {
                    if (market.GM != undefined && market.GM.mobile != undefined) {
                        let franchiseesmsInfo = {}

                        franchiseesmsInfo.numbers = [market.GM.mobile]
                        franchiseesmsInfo.variables = { "{#DD#}": vehicleassigned.number, "{#BB#}": fbid.code, "{#EE#}": commonService.longDateFormat(fbid.ETD) }
                        franchiseesmsInfo.templateId = "21715"

                        commonService.sendGeneralSMS(franchiseesmsInfo)
                    }

                    Users.findOne({ id: fbid.seller }).then(function (slr) {
                        let sellersmsInfo = {}

                        sellersmsInfo.numbers = [fbid.sellerMobile]
                        if (vehicleassigned && vehicleassigned.number != "undefined") {
                            sellersmsInfo.variables = { "{#CC#}": vehicleassigned.number, "{#DD#}": fbid.code, "{#BB#}": fbid.code }
                        }
                        sellersmsInfo.templateId = "21716"

                        commonService.sendGeneralSMS(sellersmsInfo)
                    })
                })
            })
        })
    },
    dispatchBid = function (data, context) {
        return Bids.update({ id: data.id }, data).then(function (bid) {
            var callFunction = createBidHistory(data, bid[0], 'Order dispatched')
            if (callFunction) {
                var findCropQuery = {}
                findCropQuery.id = bid[0].crop

                return Crops.findOne(findCropQuery).then(function (crop) {
                    var cropUpdateQry = {}
                    cropUpdateQry.leftAfterDeliveryQuantity = crop.leftAfterDeliveryQuantity - bid[0].quantity
                    return Crops.update(findCropQuery, cropUpdateQry).then(function (updatedCrop) {
                        var msg = "Product " + crop.name + "subject to bid (" + bid[0].code + ") is dispatched.";

                        var notificationData = {};
                        notificationData.productId = bid[0].crop;
                        notificationData.crop = bid[0].crop;
                        notificationData.user = bid[0].user;
                        notificationData.buyerId = bid[0].user;
                        notificationData.sellerId = crop.seller
                        notificationData.productType = "crops";
                        notificationData.message = msg;
                        notificationData.messageKey = "BID_DISPATCHED_NOTIFICATION"
                        notificationData.readBy = [];
                        notificationData.messageTitle = 'Product dispatched'
                        let pushnotreceiver = [bid[0].user, crop.seller]

                        return Users.findOne({ id: bid[0].user }).then(function (buyer) {
                            let buyersmsInfo = {}

                            buyersmsInfo.numbers = [buyer.mobile]
                            buyersmsInfo.variables = {}
                            buyersmsInfo.templateId = "21717"

                            commonService.sendGeneralSMS(buyersmsInfo)

                            return Notifications.create(notificationData).then(function (notificationResponse) {
                                if (notificationResponse) {
                                    pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                }
                                return {
                                    success: true,
                                    code: 200,
                                    data: {
                                        bid: bid[0],
                                        message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                        key: 'SUCCESSFULLY_UPDATED_BID',
                                    },
                                }
                            })
                        })
                    })
                })
            } else {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: "Unknow Error Occurred"
                    },
                };
            }
        }).fail(function (error) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: error
                },
            };
        });
    },

    deliverBid = function (data, context) {
        var d = new Date();
        var month = d.getMonth();
        var year = d.getFullYear();

        var yrStore = ""
        if (month < 3) {
            yrStore = (year - 1).toString().substr(-2) + "-" + year.toString().substr(-2)
        } else {
            yrStore = year.toString().substr(-2) + "-" + (year + 1).toString().substr(-2)
        }

        return Invoice.find({ financialYear: yrStore, type: { $ne: "fieldtransaction" } }).sort('number DESC').then(function (invoices) {
            let numberToAssign = 1
            if (invoices.length > 0) {
                let invoice = invoices[0]
                numberToAssign = invoice.number + 1
            }

            let createInvoiceData = {}
            createInvoiceData.type = "bid"
            createInvoiceData.bidId = data.id
            createInvoiceData.number = numberToAssign
            createInvoiceData.financialYear = yrStore

            return Invoice.create(createInvoiceData).then(function (createdInvoice) {
                data.invoice = createdInvoice.id

                return Bids.update({ id: data.id }, data).then(function (bid) {
                    var callFunction = createBidHistory(data, bid[0], "Order Delivered")
                    if (callFunction) {
                        var findCropQuery = {}
                        findCropQuery.id = bid[0].crop

                        return Crops.findOne(findCropQuery).populate('market').then(function (crop) {
                            var msg = "Product " + crop.name + " under bid (" + bid[0].code + ") is delivered. ";

                            var notificationData = {};
                            notificationData.productId = bid[0].crop;
                            notificationData.crop = bid[0].crop;
                            notificationData.user = bid[0].user;
                            notificationData.buyerId = bid[0].user;
                            notificationData.productType = "crops";
                            notificationData.message = msg;
                            notificationData.messageKey = "BID_DELIVERED_NOTIFICATION"
                            notificationData.readBy = [];
                            notificationData.messageTitle = "Product delivered"
                            let pushnotreceiver = [bid[0].user, crop.seller]
                            if (crop.market && crop.market.GM) {
                                pushnotreceiver.push(crop.market.GM)
                            }

                            return Notifications.create(notificationData).then(function (notificationResponse) {
                                if (notificationResponse) {
                                    pushnotreceiver.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                }
                                if (crop.efarmxLogisticPercentage >= 0) {
                                    var lpQuery = {}
                                    lpQuery.cropId = bid[0].crop
                                    lpQuery.bidId = bid[0].id
                                    lpQuery.sellerId = crop.seller
                                    lpQuery.buyerId = bid[0].user
                                    lpQuery.amount = parseFloat(bid[0].logisticPayment) * parseFloat((100 - crop.efarmxLogisticPercentage) / 100)
                                    lpQuery.pincode = crop.pincode
                                    lpQuery.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString()
                                    lpQuery.logisticPartner = bid[0].logisticId
                                    lpQuery.status = 'Due'
                                    return LogisticPayment.create(lpQuery).then(function (fp) {
                                        return {
                                            success: true,
                                            code: 200,
                                            data: {
                                                bid: bid[0],
                                                message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                                key: 'SUCCESSFULLY_UPDATED_BID',
                                            },
                                        }
                                    }).fail(function (error) {
                                        return {
                                            success: true,
                                            code: 200,
                                            data: {
                                                bid: bid[0],
                                                message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                                key: 'SUCCESSFULLY_UPDATED_BID',
                                            },
                                        }
                                    })
                                } else {
                                    return {
                                        success: true,
                                        code: 200,
                                        data: {
                                            bid: bid[0],
                                            message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                            key: 'SUCCESSFULLY_UPDATED_BID',
                                        },
                                    }
                                }
                            })
                        })
                    } else {
                        return {
                            success: false,
                            error: {
                                code: 400,
                                message: "Unknow Error Occurred"
                            },
                        };
                    }
                }).fail(function (error) {
                    return {
                        success: false,
                        error: {
                            code: 400,
                            message: error
                        },
                    };
                });
            })
        })
    },

    receiveBid = function (data, context) {

        let ratings = undefined
        if (data.rating != undefined) {
            ratings = data.rating
            ratings.reviewer = context.identity.id
            ratings.rateOnModal = "bids"
            ratings.modalId = data.id
            delete data.rating
        }

        return Bids.findOne({ id: data.id }).then(function (findBid) {

            if (findBid && findBid.status != 'Received') {

                let receiveProduct = true
                if (data.askedReceivedQuantity != undefined) {
                    if (data.askedReceivedQuantity > findBid.quantity) {
                        receiveProduct = false
                        return {
                            success: false,
                            error: {
                                code: 400,
                                message: "Received quantity can not be more than asked quantity"
                            },
                        };
                    } else if (data.askedReceivedQuantity == findBid.quantity) {
                        data.receivedQuantityStatus = "FullReceive"
                    } else {
                        data.receivedQuantityStatus = "Pending"
                    }
                } else {
                    data.receivedQuantityStatus = "FullReceive"
                }



                if (receiveProduct) {

                    return Bids.update({ id: data.id }, data).then(function (bid) {

                        var callFunction = createBidHistory(data, bid[0], "Order Received")
                        if (callFunction) {
                            var findCropQuery = {}
                            findCropQuery.id = bid[0].crop

                            return Crops.findOne(findCropQuery).populate('market').then(function (crop) {
                                return Market.findOne({ id: crop.market.id }).populate('GM').then(function (market) {
                                    if (market.GM != undefined && market.GM.mobile != undefined) {
                                        let franchiseesmsInfo = {}

                                        franchiseesmsInfo.numbers = [market.GM.mobile]
                                        franchiseesmsInfo.variables = { "{#CC#}": crop.name, "{#BB#}": crop.code, "{#DD#}": commonService.longDateFormat(new Date()) }
                                        franchiseesmsInfo.templateId = "21718"

                                        commonService.sendGeneralSMS(franchiseesmsInfo)

                                        if (data.receivedQuantityStatus != undefined && data.receivedQuantityStatus == "Pending") {
                                            let franchiseesmsInfo = {}

                                            franchiseesmsInfo.numbers = [market.GM.mobile]
                                            franchiseesmsInfo.variables = { "{#BB#}": findBid.code }
                                            franchiseesmsInfo.templateId = "21721"

                                            commonService.sendGeneralSMS(franchiseesmsInfo)


                                        }
                                    }

                                    let sellersmsInfo = {}

                                    sellersmsInfo.numbers = [findBid.user.mobile]
                                    sellersmsInfo.variables = {}
                                    sellersmsInfo.templateId = "21720"

                                    commonService.sendGeneralSMS(sellersmsInfo)

                                    if (data.receivedQuantityStatus != undefined && data.receivedQuantityStatus == "Pending") {
                                        let sellersmsInfo = {}

                                        sellersmsInfo.numbers = [findBid.user.mobile]
                                        sellersmsInfo.variables = { "{#CC#}": crop.name, "{#BB#}": findBid.code }
                                        sellersmsInfo.templateId = "21722"

                                        commonService.sendGeneralSMS(sellersmsInfo)
                                    }

                                    var fpQuery = {}
                                    fpQuery.cropId = bid[0].crop
                                    fpQuery.bidId = bid[0].id
                                    fpQuery.sellerId = crop.seller
                                    fpQuery.buyerId = bid[0].user
                                    fpQuery.amount = parseFloat(bid[0].amount) * parseFloat(crop.franchiseePercentage / 100)
                                    fpQuery.pincode = crop.pincode
                                    fpQuery.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString()
                                    fpQuery.status = 'Due'
                                    if (crop.market.id) {
                                        fpQuery.marketId = crop.market.id
                                    } else if (crop.market._id) {
                                        fpQuery.marketId = crop.market._id
                                    }
                                    fpQuery.franchiseeUserId = crop.market.GM
                                    fpQuery.productType = 'crop';
                                    return FranchiseePayments.create(fpQuery).then(function (fp) {
                                        var msg = "Product " + crop.name + " under bid (" + bid[0].code + ") is Received. ";
                                        if (data.receivedQuantityStatus == "Pending") {
                                            msg = "Product " + crop.name + " under bid (" + bid[0].code + ") is Received. Received quantity is claimed as less. It will be verified soon and accordingly financial adjustments will be done.";
                                        }

                                        var notificationData = {};
                                        notificationData.productId = bid[0].crop;
                                        notificationData.crop = bid[0].crop;
                                        notificationData.user = bid[0].user;
                                        notificationData.buyerId = bid[0].user;
                                        notificationData.productType = "crops";
                                        //notificationData.transactionOwner = u[0].id;
                                        notificationData.message = msg;
                                        notificationData.messageKey = "BID_RECEIVED_NOTIFICATION"
                                        notificationData.readBy = [];
                                        notificationData.messageTitle = 'Product received'
                                        let pushnotreceiver = [bid[0].user, crop.seller, crop.market.GM]

                                        if (ratings != undefined) {
                                            return Rating.create(ratings).then(function (rating) {
                                                if (rating) {
                                                    return Users.findOne({ id: rating.user }).then(function (success) {
                                                        let query = {};
                                                        let numberOfUsersRated = 0;
                                                        if (success.ratedUsersCount != undefined) {
                                                            numberOfUsersRated = success.ratedUsersCount
                                                        }
                                                        let averageRating = success.avgRating

                                                        query.ratedUsersCount = numberOfUsersRated + 1;
                                                        query.avgRating = parseFloat(((numberOfUsersRated * averageRating) + rating.star) / (numberOfUsersRated + 1))

                                                        return Users.update({ id: success.id }, query).then(function (updsuccess) {
                                                            return Notifications.create(notificationData).then(function (notificationResponse) {
                                                                if (notificationResponse) {
                                                                    commonService.notifyUsersFromNotification(notificationResponse, crop)
                                                                    pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                                                }

                                                                if (data.receivedQuantityStatus == "Pending") {
                                                                    return {
                                                                        success: true,
                                                                        code: 200,
                                                                        data: {
                                                                            bid: bid[0],
                                                                            message: "Received quantity is noted. It will be verified soon and accordingly financial adjustments will be done."
                                                                        },
                                                                    }
                                                                } else {
                                                                    return {
                                                                        success: true,
                                                                        code: 200,
                                                                        data: {
                                                                            bid: bid[0],
                                                                            message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                                                            key: 'SUCCESSFULLY_UPDATED_BID',
                                                                        },
                                                                    }
                                                                }
                                                            })
                                                        })
                                                    })
                                                } else {
                                                    return Notifications.create(notificationData).then(function (notificationResponse) {
                                                        if (notificationResponse) {
                                                            commonService.notifyUsersFromNotification(notificationResponse, crop)
                                                            pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                                        }
                                                        if (data.receivedQuantityStatus == "Pending") {
                                                            return {
                                                                success: true,
                                                                code: 200,
                                                                data: {
                                                                    bid: bid[0],
                                                                    message: "Received quantity is noted. It will be verified soon and accordingly financial adjustments will be done."
                                                                },
                                                            }
                                                        } else {
                                                            return {
                                                                success: true,
                                                                code: 200,
                                                                data: {
                                                                    bid: bid[0],
                                                                    message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                                                    key: 'SUCCESSFULLY_UPDATED_BID',
                                                                },
                                                            }
                                                        }

                                                    })
                                                }
                                            }).fail(function (err) {
                                                return Notifications.create(notificationData).then(function (notificationResponse) {
                                                    if (notificationResponse) {
                                                        commonService.notifyUsersFromNotification(notificationResponse, crop)
                                                        pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                                    }
                                                    if (data.receivedQuantityStatus == "Pending") {
                                                        return {
                                                            success: true,
                                                            code: 200,
                                                            data: {
                                                                bid: bid[0],
                                                                message: "Received quantity is noted. It will be verified soon and accordingly financial adjustments will be done."
                                                            },
                                                        }
                                                    } else {
                                                        return {
                                                            success: true,
                                                            code: 200,
                                                            data: {
                                                                bid: bid[0],
                                                                message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                                                key: 'SUCCESSFULLY_UPDATED_BID',
                                                            },
                                                        }
                                                    }
                                                })
                                            })
                                        } else {
                                            return Notifications.create(notificationData).then(function (notificationResponse) {
                                                if (notificationResponse) {
                                                    commonService.notifyUsersFromNotification(notificationResponse, crop)
                                                    pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                                }
                                                if (data.receivedQuantityStatus == "Pending") {
                                                    return {
                                                        success: true,
                                                        code: 200,
                                                        data: {
                                                            bid: bid[0],
                                                            message: "Received quantity is noted. It will be verified soon and accordingly financial adjustments will be done."
                                                        },
                                                    }
                                                } else {
                                                    return {
                                                        success: true,
                                                        code: 200,
                                                        data: {
                                                            bid: bid[0],
                                                            message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                                            key: 'SUCCESSFULLY_UPDATED_BID',
                                                        },
                                                    }
                                                }
                                            })
                                        }
                                    }).fail(function (error) {
                                        return {
                                            success: false,
                                            error: {
                                                code: 400,
                                                message: error
                                            },
                                        };
                                    })
                                })
                            })
                        } else {
                            return {
                                success: false,
                                error: {
                                    code: 400,
                                    message: "Unknow Error Occurred"
                                },
                            };
                        }
                    }).fail(function (error) {
                        return {
                            success: false,
                            error: {
                                code: 400,
                                message: error
                            },
                        };
                    });
                }
            } else {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: "Order already received."
                    }
                }
            }
        }).fail(function (error) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: error
                },
            };
        });
    },

    acceptCropBid = function (data, context, req, res) {

        let bidData = {};

        Bids.findOne({ id: data.id }).populate('user').then(function (findBid) {
            if (findBid) {
                if (findBid.status == 'Pending') {
                    var cropFindQry = {}
                    cropFindQry.id = findBid.crop
                    Crops.findOne(cropFindQry).then(function (crop) {
                        if (crop) {
                            data.acceptedAt = new Date();

                            if (!(findBid.quantity > crop.leftAfterAcceptanceQuantity)) {
                                Bids.update({ id: data.id }, data).then(function (bid) {

                                    let reqqry = {}
                                    let now = new Date()
                                    reqqry.$and = [{ $or: [{ status: 'Suggested' }, { status: 'Pending' }] },
                                    { $or: [{ variety: undefined }, { variety: null }, { variety: crop.variety }] },
                                    { $or: [{ user: findBid.user.id }, { mobile: findBid.user.mobile }] }]
                                    reqqry.requiredOn = { $gte: now }
                                    reqqry.category = crop.category

                                    BuyerRequirement.update(reqqry, { status: 'Fulfilled' }).then(function (fr) {
                                        Bidspayment.find({ bidId: data.id, type: { "$ne": "Earnest" } }).then(function (bidpayDetail) {

                                            var count = 0;
                                            _.each(bidpayDetail, function (bidpay, index) {

                                                var query = {};
                                                query.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + bidpay.days)).toISOString();
                                                query.bidStatus = 'Accepted';
                                                Bidspayment.update({ id: bidpay.id }, query).then(function (bidpaymentStatus) {
                                                    if (bidpaymentStatus) {
                                                        if (count == bidpayDetail.length - 1) {
                                                            var callFunction = updateBidMore(data, bid)
                                                            if (callFunction) {
                                                                // return {
                                                                //     data: {
                                                                //         bid: bid[0]
                                                                //     },
                                                                //     success: true,
                                                                //     code: 200,
                                                                //     message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                                                //     key: 'SUCCESSFULLY_UPDATED_BID'
                                                                // }
                                                            }

                                                        }
                                                    }
                                                    count++;
                                                })
                                            })

                                            var msg = "Bid (" + bid[0].code + ") is accepted by seller. ";

                                            var notificationData = {};
                                            notificationData.productId = bid[0].crop;
                                            notificationData.crop = bid[0].crop;
                                            notificationData.user = bid[0].user;
                                            notificationData.buyerId = bid[0].user;
                                            notificationData.productType = "crops";
                                            //notificationData.transactionOwner = u[0].id;
                                            notificationData.message = msg;
                                            notificationData.messageKey = "BID_ACCEPTED_NOTIFICATION"
                                            notificationData.readBy = [];
                                            notificationData.messageTitle = 'Bid Accepted'
                                            let pushnotreceiver = [bid[0].user]

                                            Notifications.create(notificationData).then(function (notificationResponse) {
                                                if (notificationResponse) {
                                                    commonService.notifyUsersFromNotification(notificationResponse, crop)
                                                    pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                                }

                                                let marketId = crop.market
                                                let cropcode = "" + crop.code

                                                Market.findOne({ id: marketId }).populate('GM').then(function (market) {
                                                    if (market.GM != undefined && market.GM.mobile != undefined) {
                                                        let franchiseesmsInfo = {}

                                                        franchiseesmsInfo.numbers = [market.GM.mobile]
                                                        franchiseesmsInfo.variables = { "{#BB#}": findBid.code, "{#CC#}": cropcode, "{#EE#}": findBid.bidRate, "{#DD#}": commonService.longDateFormat(new Date()) }
                                                        franchiseesmsInfo.templateId = "21707"

                                                        commonService.sendGeneralSMS(franchiseesmsInfo)
                                                    }

                                                    let buyersmsInfo = {}

                                                    buyersmsInfo.numbers = [findBid.user.mobile]
                                                    buyersmsInfo.variables = { "{#BB#}": findBid.code, "{#CC#}": findBid.bidRate, "{#AA#}": findBid.quantity }
                                                    buyersmsInfo.templateId = "21706"

                                                    commonService.sendGeneralSMS(buyersmsInfo)


                                                    if (crop.aggregatedCrops && crop.aggregatedCrops.length > 0) {
                                                        let query = { id: { $in: crop.aggregatedCrops } }

                                                        let selectedFields = ['leftAfterAcceptanceQuantity']

                                                        let partSold = findBid.quantity / crop.leftAfterAcceptanceQuantity

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
                                                                                                        cropUpdateQry.leftAfterAcceptanceQuantity = parseFloat((crop.leftAfterAcceptanceQuantity - bid[0].quantity).toFixed(3))
                                                                                                        cropUpdateQry.leftAfterAcceptanceQuantitiesParts = leftAfterAcceptanceQuantitiesParts

                                                                                                        Crops.update(cropFindQry, cropUpdateQry).then(function (crop) {
                                                                                                            return res.jsonx({
                                                                                                                data: {
                                                                                                                    bid: bid[0]
                                                                                                                },
                                                                                                                success: true,
                                                                                                                code: 200,
                                                                                                                message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                                                                                                key: 'SUCCESSFULLY_UPDATED_BID'
                                                                                                            })
                                                                                                        })
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                            supercropCount++;
                                                                                        })
                                                                                    } else {
                                                                                        if (subcropCount == allcrops.length - 1) {
                                                                                            var cropUpdateQry = {}
                                                                                            cropUpdateQry.leftAfterAcceptanceQuantity = parseFloat((crop.leftAfterAcceptanceQuantity - bid[0].quantity).toFixed(3))
                                                                                            cropUpdateQry.leftAfterAcceptanceQuantitiesParts = leftAfterAcceptanceQuantitiesParts
                                                                                            Crops.update(cropFindQry, cropUpdateQry).then(function (crop) {
                                                                                                return res.jsonx({
                                                                                                    data: {
                                                                                                        bid: bid[0]
                                                                                                    },
                                                                                                    success: true,
                                                                                                    code: 200,
                                                                                                    message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                                                                                    key: 'SUCCESSFULLY_UPDATED_BID'
                                                                                                })
                                                                                            })
                                                                                        }
                                                                                    }
                                                                                })
                                                                            })
                                                                        } else {
                                                                            if (subcropCount == allcrops.length - 1) {
                                                                                var cropUpdateQry = {}
                                                                                cropUpdateQry.leftAfterAcceptanceQuantity = parseFloat((crop.leftAfterAcceptanceQuantity - bid[0].quantity).toFixed(3))
                                                                                cropUpdateQry.leftAfterAcceptanceQuantitiesParts = leftAfterAcceptanceQuantitiesParts

                                                                                Crops.update(cropFindQry, cropUpdateQry).then(function (crop) {
                                                                                    return res.jsonx({
                                                                                        data: {
                                                                                            bid: bid[0]
                                                                                        },
                                                                                        success: true,
                                                                                        code: 200,
                                                                                        message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                                                                        key: 'SUCCESSFULLY_UPDATED_BID'
                                                                                    })
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

                                                                    let quantityPartOfCrop = Math.min(Math.max(0, crop.leftAfterAcceptanceQuantity - bid[0].quantity), Math.max(0, supercrop.leftAfterAcceptanceQuantitiesParts[crop.id]))

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
                                                                                cropUpdateQry.leftAfterAcceptanceQuantity = parseFloat((crop.leftAfterAcceptanceQuantity - bid[0].quantity).toFixed(3))
                                                                                Crops.update(cropFindQry, cropUpdateQry).then(function (crop) {
                                                                                    return res.jsonx({
                                                                                        data: {
                                                                                            bid: bid[0]
                                                                                        },
                                                                                        success: true,
                                                                                        code: 200,
                                                                                        message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                                                                        key: 'SUCCESSFULLY_UPDATED_BID'
                                                                                    })
                                                                                })
                                                                            }
                                                                        }
                                                                        subcropCount++;
                                                                    })
                                                                } else {
                                                                    var cropUpdateQry = {}
                                                                    cropUpdateQry.leftAfterAcceptanceQuantity = parseFloat((crop.leftAfterAcceptanceQuantity - bid[0].quantity).toFixed(3))
                                                                    Crops.update(cropFindQry, cropUpdateQry).then(function (crop) {
                                                                        return res.jsonx({
                                                                            data: {
                                                                                bid: bid[0]
                                                                            },
                                                                            success: true,
                                                                            code: 200,
                                                                            message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                                                            key: 'SUCCESSFULLY_UPDATED_BID'
                                                                        })
                                                                    })
                                                                }
                                                            })
                                                        })
                                                    } else {
                                                        var cropUpdateQry = {}
                                                        cropUpdateQry.leftAfterAcceptanceQuantity = parseFloat((crop.leftAfterAcceptanceQuantity - bid[0].quantity).toFixed(3))
                                                        Crops.update(cropFindQry, cropUpdateQry).then(function (crop) {
                                                            return res.jsonx({
                                                                data: {
                                                                    bid: bid[0]
                                                                },
                                                                success: true,
                                                                code: 200,
                                                                message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                                                key: 'SUCCESSFULLY_UPDATED_BID'
                                                            })
                                                        })
                                                    }
                                                })
                                            })
                                        })
                                    })

                                }).fail(function (error) {
                                    return res.jsonx({
                                        success: false,
                                        error: {
                                            code: 400,
                                            message: error
                                        }
                                    })
                                })
                            } else {
                                return res.jsonx({
                                    success: false,
                                    error: {
                                        code: 400,
                                        message: "You have less quantity of crop left then the asked quantity",
                                        key: 'Crop_Not_Available'
                                    }
                                })
                            }

                        } else {
                            return res.jsonx({
                                success: false,
                                error: {
                                    code: 400,
                                    message: constantObj.bids.ERROR_FINDING_CROP,
                                    key: 'Crop_Not_Available'
                                }
                            })
                        }
                    })
                } else if (findBid.status == 'Accepted') {
                    return res.jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: "Bid is already accepted",
                            key: 'BID_ALREADY_ACCEPTED'
                        }
                    })
                } else if (findBid.status == 'Rejected') {
                    return res.jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: "Bid is already rejected. So can not be accepted now.",
                            key: 'BID_ALREADY_REJECTED'
                        }
                    })
                } else {
                    return res.jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: "Bid is not in placed state",
                            key: 'BID_ALREADY_REJECTED'
                        }
                    })
                }
            } else {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: "Bid could not be found.",
                        key: 'BID_NOT_FOUND'
                    }
                })
            }
        }).fail(function (err) {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: err
                }
            })
        })
    },

    updateBidMore = function (data, bid) {
        var history = {};

        return Bids.findOne({ id: data.id }).populate("user").populate("crop").then(function (bidInfo) {

            let cropId = bidInfo.crop.id;
            let bidAmount = bidInfo.amount;
            let bidReason = bidInfo.reason == undefined ? "" : bidInfo.reason;
            let buyer = bidInfo.user.username;

            history.bid = bidInfo.id;
            history.amount = bidInfo.amount;
            history.crop = bidInfo.crop;
            history.bidBy = bidInfo.user;
            history.bidStatus = bidInfo.status;
            history.quantity = bidInfo.quantity;
            history.quantityUnit = bidInfo.quantityUnit;
            history.bidRejectReason = bidInfo.reason == undefined ? "" : bidInfo.reason;
            history.comment = "Bid Accepted"

            return Bidshistory.create(history).then(function (res) {
                let cropQuery = {};

                /*return {
                    success: true,
                    code:200,
                    data: {
                        message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                        key: 'SUCCESSFULLY_UPDATED_BID'
                    },
                };*/

                return Crops.findOne({ id: bidInfo.crop.id }).then(function (cropinfo) {

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
                                    bidId: bidInfo.id,
                                    sellerId: allcrops[i].seller,
                                    buyerId: bidInfo.user.id,
                                    depositPercentage: cropinfo.sellerUpfrontPercentage,
                                    depositLabel: "Upfront",
                                    depositDays: cropinfo.sellerUpfrontDays,
                                    pincode: cropinfo.pincode,
                                    paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
                                    type: "Upfront",
                                    status: "Due",
                                    sequenceNumber: sequenceNumber,
                                    amount: parseFloat((shareOfCrop * (bidInfo.amount * parseFloat(cropinfo.sellerUpfrontPercentage / 100))).toFixed(2))
                                }
                                sellerPayments.push(upfrontObject)

                                for (var n = 0; n < cropinfo.sellerDepositPayment.length; n++) {
                                    let number = ++sequenceNumber;

                                    days = days + cropinfo.sellerDepositPayment[n].days

                                    let object = {
                                        cropId: cropinfo.id,
                                        baseCropId: allcrops[i].id,
                                        bidId: bidInfo.id,
                                        sellerId: allcrops[i].seller,
                                        buyerId: bidInfo.user.id,
                                        depositPercentage: cropinfo.sellerDepositPayment[n].percentage,
                                        depositLabel: cropinfo.sellerDepositPayment[n].label,
                                        depositDays: cropinfo.sellerDepositPayment[n].days,
                                        pincode: cropinfo.pincode,
                                        paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
                                        type: "Deposit",
                                        status: "Due",
                                        sequenceNumber: number,
                                        amount: parseFloat((shareOfCrop * (bidInfo.amount * parseFloat(cropinfo.sellerDepositPayment[n].percentage / 100))).toFixed(2))
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
                                    bidId: bidInfo.id,
                                    sellerId: allcrops[i].seller,
                                    buyerId: bidInfo.user.id,
                                    depositPercentage: cropinfo.sellerFinalPercentage,
                                    depositLabel: "Final",
                                    depositDays: cropinfo.sellerFinalDays,
                                    pincode: cropinfo.pincode,
                                    paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
                                    type: "Final",
                                    status: "Due",
                                    sequenceNumber: SequenceNumber,
                                    amount: parseFloat((shareOfCrop * (bidInfo.amount * parseFloat(cropinfo.sellerFinalPercentage / 100))).toFixed(2))
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
                            bidId: bidInfo.id,
                            sellerId: cropinfo.seller,
                            buyerId: bidInfo.user.id,
                            depositPercentage: cropinfo.sellerUpfrontPercentage,
                            depositLabel: "Upfront",
                            depositDays: cropinfo.sellerUpfrontDays,
                            pincode: cropinfo.pincode,
                            paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
                            type: "Upfront",
                            status: "Due",
                            sequenceNumber: sequenceNumber,
                            amount: parseFloat(bidInfo.amount * parseFloat(cropinfo.sellerUpfrontPercentage / 100))
                        }
                        sellerPayments.push(upfrontObject)

                        cropinfo.sellerDepositPayment.forEach((obj, i) => {
                            days = days + cropinfo.sellerDepositPayment[i].days
                            let number = ++sequenceNumber;
                            let object = {
                                cropId: cropinfo.id,
                                baseCropId: cropinfo.id,
                                bidId: bidInfo.id,
                                sellerId: cropinfo.seller,
                                buyerId: bidInfo.user.id,
                                depositPercentage: cropinfo.sellerDepositPayment[i].percentage,
                                depositLabel: cropinfo.sellerDepositPayment[i].label,
                                depositDays: cropinfo.sellerDepositPayment[i].days,
                                pincode: cropinfo.pincode,
                                paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
                                type: "Deposit",
                                status: "Due",
                                sequenceNumber: number,
                                amount: parseFloat(bidInfo.amount * parseFloat(obj.percentage / 100))
                            }
                            sellerPayments.push(object);
                        })

                        days = days + cropinfo.sellerFinalDays
                        let SequenceNumber = ++sequenceNumber;
                        let finalObject = {
                            cropId: cropinfo.id,
                            baseCropId: cropinfo.id,
                            bidId: bidInfo.id,
                            sellerId: cropinfo.seller,
                            buyerId: bidInfo.user.id,
                            depositPercentage: cropinfo.sellerFinalPercentage,
                            depositLabel: "Final",
                            depositDays: cropinfo.sellerFinalDays,
                            pincode: cropinfo.pincode,
                            paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
                            type: "Final",
                            status: "Due",
                            sequenceNumber: SequenceNumber,
                            amount: parseFloat(bidInfo.amount * parseFloat(cropinfo.sellerFinalPercentage / 100))
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

                        return Sellerpayment.create(sellerPayments).then(function (responseSellerPayment) {
                        })
                    }

                    /*return Crops.update({id:bidInfo.crop.id},cropQuery).then(function(updateInfo) {
                        return {
                            success: true,
                            code:200,
                            data: {
                                bid: bid[0],
                                message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                key: 'SUCCESSFULLY_UPDATED_BID',
                            },
                        };
                    })*/
                })
            }); // Create bid history
        });
    },

    createBidHistory = function (data, bid, message) {
        return Bids.findOne({ id: bid.id }).populate("user").populate("crop").then(function (bidInfo) {
            var history = {};
            let cropId = bidInfo.crop.id;
            let bidAmount = bidInfo.amount;
            let bidReason = bidInfo.reason == undefined ? "" : bidInfo.reason;
            let buyer = bidInfo.user.username;

            history.bid = bidInfo.id;
            history.amount = bidInfo.amount;
            history.crop = bidInfo.crop;
            history.bidBy = bidInfo.user;
            history.bidStatus = bidInfo.status;
            history.quantity = bidInfo.quantity;
            history.quantityUnit = bidInfo.quantityUnit;
            history.bidRejectReason = bidInfo.reason == undefined ? "" : bidInfo.reason;
            if (message) {
                history.comment = message
            } else {
                history.comment = "Bid Updated"
            }

            return Bidshistory.create(history).then(function (res) {
                return true
            }).fail(function (error) {
                return false
            });
        }).fail(function (error) {
            return false
        });
    },

    updatePendingBid = function (data, context) {

        let code = commonServiceObj.getUniqueCode();
        data.code = code;
        let bidData = {};
        let history = {};
        let transactionData = {};
        var bidpayment = {};
        let transactionSatus = data.transactionSatus;
        let Id = data.transactionId;
        var payments;
        var context = context.identity;

        if (typeof data.payments == 'string') {
            payments = JSON.parse(data.payments);
        } else {
            payments = JSON.parse(JSON.stringify(data.payments));
        }

        data.bidRate = parseFloat((data.amount / data.quantity).toFixed(2));

        delete data.transactionId;
        delete data.transactionSatus;
        delete data.payments;

        return getSeller(data.crop).then(function (sellerData) {

            return Bids.create(data).then(function (bid) {

                transactionData.buyerId = bid.user;
                transactionData.crop = bid.crop;
                transactionData.bidId = bid.id;
                transactionData.amount = data.earnestAmount;
                transactionData.status = transactionSatus;
                transactionData.sellerId = sellerData.seller;
                transactionData.paymentType = "PayTm";

                return bidTransectionUpdate(Id, transactionData).then(function (paymentsData) {
                    bidpayment.cropId = paymentsData.crop;
                    bidpayment.bidId = bid.id;
                    bidpayment.sellerId = paymentsData.sellerId;
                    bidpayment.buyerId = paymentsData.buyerId;
                    bidpayment.transactionId = paymentsData.id;
                    bidpayment.amount = paymentsData.amount;
                    bidpayment.type = "Earnest";
                    bidpayment.paymentDate = paymentsData.createdAt;
                    bidpayment.status = 'Verified';
                    bidpayment.depositedOn = paymentsData.createdAt;
                    bidpayment.amountPercent = data.amountPercent;
                    bidpayment.paymentMode = "PayTm";
                    bidpayment.paymentDueDate = new Date()
                    bidpayment.sequenceNumber = 0;
                    bidpayment.isVerified = true;

                    return Bidspayment.create(bidpayment).then(function (bidpayments) {

                        console.log("Payments+++++", typeof payments)
                        console.log("payments[0].type123456", payments[0])
                        if (payments) {
                            //console.log("payments[0].type",typeof payments[0]['type'])
                            if (payments[0]['type'] == "Earnest") {
                                //console.log("Payments",payments[0].type)

                                var bidQuery = {};
                                bidQuery.cropId = bidpayments.cropId;
                                bidQuery.type = "Earnest";
                                bidQuery.buyerId = context.id;

                                var dataQuery = {};
                                dataQuery.pincode = payments[0].pincode;
                                dataQuery.percentage = payments[0].percentage;
                                dataQuery.name = payments[0].name;
                                dataQuery.days = payments[0].days;

                                return Bidspayment.update(bidQuery, dataQuery).then(function () {
                                    delete payments[0];
                                    payments.forEach((obj, i) => {
                                        payments[i]['bidId'] = bid.id;
                                        //payments[i]['buyerId'] = paymentsData.buyerId;
                                        //payments[i]['sellerId'] = paymentsData.sellerId;
                                        payments[i]['buyerId'] = bid.user;
                                        payments[i]['sellerId'] = sellerData.seller;
                                        payments[i]['sequenceNumber'] = i + 1;
                                    })
                                    return Bidspayment.create(payments).then(function (response) {
                                        history.bid = bid.id;
                                        history.amount = bid.amount;
                                        history.crop = bid.crop;
                                        history.bidBy = bid.user;
                                        history.bidStatus = bid.status;
                                        history.quantity = bid.quantity;
                                        history.quantityUnit = bid.quantityUnit;
                                        history.bidRejectReason = bid.reason == undefined ? "" : bid.reason;
                                        history.bidsPayment = payments;
                                        history.pincode = bid.pincode;
                                        history.comment = "Bid placed"

                                        return Bidshistory.create(history).then(function (res) {

                                            return Crops.findOne({ id: bid.crop }).populate('market').then(function (cropInfo) {
                                                var cropQry = {};

                                                if (cropInfo.highestBid < bid.bidRate) {
                                                    cropQry.highestBid = bid.bidRate;
                                                }

                                                return Crops.update({ id: bid.crop }, cropQry).then(function (updatedCrop) {
                                                    sails.sockets.blast('bid_placed', bid);

                                                    var msg = "A bid (" + bid.code + ") is placed on " + updatedCrop[0].name + " (" + updatedCrop[0].code + "). ";

                                                    var notificationData = {};
                                                    notificationData.productId = updatedCrop[0].id;
                                                    notificationData.crop = updatedCrop[0].id;
                                                    notificationData.sellerId = updatedCrop[0].seller;
                                                    notificationData.user = bid.user;
                                                    notificationData.buyerId = bid.user;
                                                    notificationData.productType = "crops";
                                                    notificationData.message = msg;
                                                    notificationData.messageKey = "BID_PLACED_NOTIFICATION"
                                                    notificationData.readBy = [];
                                                    notificationData.messageTitle = 'Bid placed'
                                                    let pushnotreceiver = [bid.user, updatedCrop[0].seller]
                                                    if (cropInfo.market && cropInfo.market.GM) {
                                                        pushnotreceiver.push(cropInfo.market.GM)
                                                    }

                                                    return Notifications.create(notificationData).then(function (notificationResponse) {
                                                        if (notificationResponse) {
                                                            commonService.notifyUsersFromNotification(notificationResponse, updatedCrop[0])
                                                            pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                                        }

                                                        return {
                                                            success: true,
                                                            code: 200,
                                                            data: {
                                                                bid: bid,
                                                                message: constantObj.bids.SUCCESSFULLY_SAVED_BID,
                                                                key: 'SUCCESSFULLY_SAVED_BID',
                                                            }
                                                        };
                                                    })
                                                })
                                            })
                                        });
                                    }).fail(function (error) {
                                        return {
                                            success: false,
                                            error: {
                                                code: 400,
                                                message: error
                                            },
                                        };
                                    });
                                })
                            }
                        }
                    });
                });
            }).fail(function (err) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: err
                    },
                };
            });
        });
    }