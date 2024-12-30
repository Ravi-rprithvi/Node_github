/**
 * PaymentController
 *
 * @description :: Server-side logic for managing payments
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var constantObj = sails.config.constants;
var commonServiceObj = require('./../services/commonService');
var checkPost = function (callback, req, res) {
    callback(req, res);
};

module.exports = {
    inputOrderRefund: (req, res) => {
        return API(OrderService.orderRefundAmount, req, res);
    },
    getMyCarts: function (req, res) {
        return API(CartService.myCart, req, res);
    },

    getUserCarts: function (req, res) {
        return API(CartService.userCart, req, res);
    },
    franchiseePaymentDashboard: function (req, res) {
        var query = {}
        query.franchiseeUserId = req.identity.id

        if (req.param('from') && req.param('to')) {
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

        FranchiseePayments.native(function (error, franchiseepaymentlist) {
            franchiseepaymentlist.aggregate(
                [
                    {
                        $match: query
                    },
                    {
                        $group: {
                            _id: "$status",
                            count: {
                                $sum: 1
                            },
                            amount: {
                                $sum: '$amount'
                            }
                        }
                    }
                ], function (err, results) {
                    if (err) {
                        return res.status(400).jsonx({
                            success: false,
                            error: err
                        });
                    } else {
                        var duecount = 0
                        var dueAmount = 0

                        var paidcount = 0
                        var paidAmount = 0

                        var refundcount = 0
                        var refundAmount = 0

                        var refundedcount = 0
                        var refundedAmount = 0

                        for (var i = 0; i < results.length; i++) {
                            let status = results[i]._id
                            if (status == 'Due', 'Paid' || status == 'Overdue') {
                                duecount = duecount + results[i].count
                                dueAmount = dueAmount + results[i].amount
                            } else if (status == 'Paid' || status == 'Verified') {
                                paidcount = paidcount + results[i].count
                                paidAmount = paidAmount + results[i].amount
                            } else if (status == 'Refund' || status == 'OverdueRefund') {
                                refundcount = refundcount + results[i].count
                                refundAmount = refundAmount + results[i].amount
                            } else if (status == 'Refunded' || status == 'RefundVerified') {
                                refundedcount = refundedcount + results[i].count
                                refundedAmount = refundedAmount + results[i].amount
                            }
                        }

                        var result = {}
                        result.due = { count: duecount, amount: dueAmount }
                        result.paid = { count: paidcount, amount: paidAmount }
                        result.refund = { count: refundcount, amount: refundAmount }
                        result.refunded = { count: refundedcount, amount: refundedAmount }

                        var farmxquery = {}
                        farmxquery.franchiseeId = req.identity.id
                        farmxquery.payer = req.identity.id
                        farmxquery.payerType = "Franchisee"
                        farmxquery.payTo = "Farmx"

                        FarmxPayment.native(function (error, farmxpaymentlist) {
                            farmxpaymentlist.aggregate(
                                [
                                    {
                                        $match: farmxquery
                                    },
                                    {
                                        $group: {
                                            _id: "$status",
                                            count: {
                                                $sum: 1
                                            },
                                            amount: {
                                                $sum: '$amount'
                                            }
                                        }
                                    }
                                ], function (err, farmxresults) {
                                    if (err) {
                                        return res.status(400).jsonx({
                                            success: false,
                                            error: err
                                        });
                                    } else {
                                        var duefcount = 0
                                        var duefAmount = 0

                                        var paidfcount = 0
                                        var paidfAmount = 0

                                        var refundfcount = 0
                                        var refundfAmount = 0

                                        var refundedfcount = 0
                                        var refundedfAmount = 0

                                        for (var i = 0; i < farmxresults.length; i++) {
                                            let status = farmxresults[i]._id
                                            if (status == 'Due', 'Paid' || status == 'Overdue') {
                                                duefcount = duefcount + farmxresults[i].count
                                                duefAmount = duefAmount + farmxresults[i].amount
                                            } else if (status == 'Paid' || status == 'Verified') {
                                                paidfcount = paidfcount + farmxresults[i].count
                                                paidfAmount = paidfAmount + farmxresults[i].amount
                                            } else if (status == 'Refund' || status == 'OverdueRefund') {
                                                refundfcount = refundfcount + farmxresults[i].count
                                                refundfAmount = refundfAmount + farmxresults[i].amount
                                            } else if (status == 'Refunded' || status == 'RefundVerified') {
                                                refundedfcount = refundedfcount + farmxresults[i].count
                                                refundedfAmount = refundedfAmount + farmxresults[i].amount
                                            }
                                        }

                                        var farxresult = {}
                                        farxresult.due = { count: duefcount, amount: duefAmount }
                                        farxresult.paid = { count: paidfcount, amount: paidfAmount }
                                        farxresult.refund = { count: refundfcount, amount: refundfAmount }
                                        farxresult.refunded = { count: refundedfcount, amount: refundedfAmount }

                                        let finalResult = { franchisee: result, farmx: farxresult }

                                        return res.jsonx({
                                            success: true,
                                            data: finalResult
                                        });
                                    }
                                });
                        });
                    }
                });
        });
    },
    updateSelectedMarket: function (req, res) {
        let cartId = req.param('cartId')
        let selectedMarket = req.param('market')
        let user = req.identity.id

        if (cartId == undefined) {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: "Please specify the cart item."
                }
            });
        } else {
            Carts.findOne({ id: cartId, productType: 'INPUT', user: user }).populate('input', { select: ['availableForFranchisees'] }).then(function (cart) {
                if (cart == undefined) {
                    console.log("1")
                    return res.jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: "Product does not find in cart"
                        }
                    });
                } else {
                    if (cart.selectedMarket === selectedMarket) {
                        return res.jsonx({
                            success: true,
                            data: {
                                message: 'Product market changed'
                            }
                        });
                    } else {
                        if (cart.input != undefined && cart.input.availableForFranchisees != undefined && cart.input.availableForFranchisees.length > 0) {
                            if (cart.input.availableForFranchisees.includes(selectedMarket)) {
                                ProductMarketPrice.findOne({ input: cart.input.id, market: selectedMarket }).then(function (price) {
                                    let dataToUpdate = {}
                                    dataToUpdate.selectedMarket = selectedMarket
                                    if (price) {
                                        dataToUpdate.amountDuringUpdation = price.price
                                    }

                                    Carts.update({ id: cartId }, dataToUpdate).then(function (updatedCart) {
                                        if (updatedCart) {
                                            return res.jsonx({
                                                success: true,
                                                data: {
                                                    message: 'Product market changed'
                                                }
                                            });
                                        } else {
                                            return res.jsonx({
                                                success: false,
                                                error: {
                                                    code: 400,
                                                    message: "UNKNOWN ERROR OCCURRED"
                                                }
                                            });
                                        }
                                    }).fail(function (err) {
                                        return res.jsonx({
                                            success: false,
                                            error: {
                                                code: 400,
                                                message: err
                                            }
                                        });
                                    })
                                })
                            } else {
                                return res.jsonx({
                                    success: false,
                                    error: {
                                        code: 400,
                                        message: "Product not availaible in selected market"
                                    }
                                });
                            }
                        } else {
                            console.log("2")
                            return res.jsonx({
                                success: false,
                                error: {
                                    code: 400,
                                    message: "Product does not find in cart"
                                }
                            });
                        }
                    }
                }
            })
        }
    },
    updatemultipleCrop: function (req, res) {
        Orderedcarts.find({ order: "5b45a7f4cd416e501e4f00dd" }).populate("crop")
            .then(function (orderdetails) {

                let cropIds = [];
                let cropUpdateQry = [];
                orderdetails.forEach((obj, i) => {
                    console.log("ccccc", obj.crop.leftAfterAcceptanceQuantity, obj.quantity)
                    cropIds.push(obj.crop.id);
                    let leftQyt = (obj.crop.leftAfterAcceptanceQuantity - obj.quantity);
                    cropUpdateQry.push(leftQyt);
                });

                console.log("cropIds==", cropIds);
                console.log("fffffffffffffeee", cropUpdateQry);

                Crops.update({ id: cropIds }, { leftAfterAcceptanceQuantity: cropUpdateQry })
                    .then(function (updatedCrop) {
                        console.log("fffffffffffffeee", updatedCrop);
                    });
            });
    },


    CancelOrderPayments: function (req, res) {

        let postArr = req.body;
        let userId = req.identity.id;
        let subOrderId = req.param("suborderId");
        console.log("postArrpostArr", userId, subOrderId, postArr);
        if (!subOrderId) {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: "Something Error in URL!"
                }
            });
        } else {

            Orderedcarts.update({
                id: subOrderId,
                user: userId
            },
                {
                    isCanceled: true,
                    reasonCancellation: postArr.reason
                })
                .then(function (suborderArr) {

                    return res.jsonx({
                        success: true,
                        code: 200,
                        data: {
                            message: constantObj.cart.UPDATED_CART,
                            key: 'UPDATED_CART',
                        },
                    });

                }).fail(function (error) {
                    return res.jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: error
                        }
                    });
                });

        }
    },
    refundOrderAmount: function (req, res) {
        // this is used for admin Section
        var request = require('request');
        let merchantKey = constantObj.payu.KEY;
        var envPaytm = req.param('env') // "development" "production";
        let paymentId;
        let refundAmount;
        let id = req.param("id");
        let transactionData = {};
        let suborderData = {};
        let history = {};
        let refundBy = req.identity.id;
        let paymentBuyerData = {};

        Orderedcarts.findOne({
            id: id
        }).then(function (subOrderInfo) {

            var findTransactionQry = {}
            findTransactionQry.order = subOrderInfo.order;
            // findTransactionQry.paymentType = "PayTm" ;
            findTransactionQry.processStatus = 'TXN_SUCCESS';

            console.log("findTransactionQry", findTransactionQry);

            Transactions.findOne(findTransactionQry)
                .then(function (suborderTransactions) {

                    console.log("suborderTransactions", suborderTransactions);
                    let REFUNDCode = commonServiceObj.getRefundCode("REFID");
                    var paramlist = {};
                    let refundAmountExect = suborderTransactions.paymentjson.TXNAMOUNT;

                    paramlist['MID'] = suborderTransactions.paymentjson.MID;
                    paramlist['TXNID'] = suborderTransactions.paymentjson.TXNID;
                    paramlist['ORDERID'] = suborderTransactions.paymentjson.ORDERID;
                    paramlist['REFUNDAMOUNT'] = suborderTransactions.paymentjson.TXNAMOUNT;
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

                                console.log("infoinfoinfo", info);

                                if (info.STATUS == 'TXN_SUCCESS') {

                                    var date = new Date();
                                    suborderData.processedBy = refundBy;
                                    suborderData.status = "Refund";
                                    suborderData.refundDate = date;
                                    Orderedcarts.update({
                                        id: id
                                    }, suborderData).then(function (responseOrder) {

                                        paymentBuyerData.refundMode = "PayTm";
                                        paymentBuyerData.refundBy = refundBy;
                                        paymentBuyerData.refundStatus = "Success";
                                        paymentBuyerData.refundAmount = refundAmountExect;
                                        paymentBuyerData.refundDescription = "Refund amount by user canceling order and now procceded to paytm for refund money";
                                        status = "Refund"

                                        Bidspayment.update({
                                            suborder: id,
                                            type: "Earnest"
                                        }, paymentBuyerData).then(function (response) {

                                            history.order = suborderTransactions.order;
                                            history.amount = suborderTransactions.amount;
                                            if (suborderTransactions.input) {
                                                history.input = suborderTransactions.input;
                                            } else if (suborderTransactions.crop) {
                                                history.input = suborderTransactions.input;
                                            }
                                            history.updatedBy = suborderTransactions.buyerId;
                                            history.quantity = subOrderInfo.quantity;
                                            history.quantityUnit = subOrderInfo.quantityUnit;
                                            history.status = "Refund";
                                            history.comment = "Refund Successful."

                                            Ordershistory.create(history)
                                                .then(function (historyRes) {

                                                    transactionData.processedBy = refundBy;
                                                    transactionData.status = 'RF';
                                                    transactionData.transactionType = 'DebitEscrow';
                                                    transactionData.processStatus = info.RESPMSG
                                                    transactionData.payTmRefundId = info.REFUNDID;
                                                    transactionData.refundjson = info;
                                                    transactionData.refundAmount = info.REFUNDAMOUNT;

                                                    Transactions.update({
                                                        id: transactionData.id
                                                    }, transactionData)
                                                        .then(function (paymentsData) {

                                                            return res.status(200).jsonx({
                                                                data: response,
                                                                success: true,
                                                                message: constantObj.bids.Refund_Payment
                                                            });

                                                        }).fail(function (error) {
                                                            console.log("Transactions update query err", error)
                                                            return res.jsonx({
                                                                success: false,
                                                                error: {
                                                                    code: 400,
                                                                    message: error
                                                                }
                                                            });
                                                        });
                                                }).fail(function (error) {
                                                    console.log("BidsPayment create query err", error)
                                                    return res.jsonx({
                                                        success: false,
                                                        error: {
                                                            code: 400,
                                                            message: error
                                                        }
                                                    });
                                                });

                                            //// 
                                        }).fail(function (error) {
                                            console.log("Orderedcarts query err", error)
                                            return res.jsonx({
                                                success: false,
                                                error: {
                                                    code: 400,
                                                    message: error
                                                }
                                            });
                                        });
                                    }).fail(function (error) {
                                        console.log("Orderedcarts query err", error)
                                        return res.jsonx({
                                            success: false,
                                            error: {
                                                code: 400,
                                                message: error
                                            }
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
                }).fail(function (error) {
                    return res.jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: error
                        }
                    });
                });
        }).fail(function (error) {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: error
                }
            });
        });
    },
    orderPlaceResponse: function (req, res) {
        return orderPlace(req, res);
    },
    orderTransectionResponse: function (req, res) {
        return mobileOrderTransections(req, res);
    },

    saveBulk: function (req, res) {
        let postArr = [];
        postArr = req.body.cartArray;

        console.log("sssssss bulk", postArr);

        if (postArr.length <= 0) {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: "Please select Cart"
                }
            });
        }
        async.each(postArr, function (item, callback) {

            Carts.findOne({ crop: item.crop, user: item.user })
                .then(function (cartinfo) {

                    if (!cartinfo || cartinfo == undefined) {
                        Carts.create(item).then(function (cart) {
                            callback();
                        }).fail(function (err) {
                            callback(err);
                        });
                    } else {
                        Carts.update({ id: cartinfo.id }, item)
                            .then(function (cart) {
                                callback();
                            }).fail(function (err) {
                                callback(err);
                            });
                    }
                });

        }, function (error) {
            if (error) {
                return res.status(400).jsonx({
                    success: false,
                    error: error
                });;
            } else {
                return res.status(200).jsonx({
                    success: true,
                    data: {
                        message: constantObj.cart.SAVED_CART,
                        key: 'SAVED_CART'
                    }
                });
            }
        });



    },
    saveCart: function (req, res) {
        return checkPost(save, req, res);
    },
    updateCart: function (req, res) {
        return checkPost(update, req, res);
    },
    deletCarts: function (req, res) {
        let Ids = req.body.ids;
        console.log(Ids);
        Carts.destroy({
            id: [Ids]
        }).exec(function (err) {
            if (err) {
                return res.negotiate(err);
            }
            res.jsonx({
                success: true,
                code: 200,
                data: {
                    message: constantObj.cart.DELETED_CART,
                    key: 'DELETED_CART',
                },
            });
        });
    },
    buyerCartPayments: function (req, res) {
        let order = req.param("order");
        let qry = {};
        // qry.order = order;
        qry.suborder = order;
        qry.paymentMedia = "Cart";
        // qry.buyerId = req.identity.id;
        // .sort({sequenceNumber:1})
        // console.log(qry, '===')
        Bidspayment.find(qry)
            .populate('cropId')
            .populate('input')
            .populate('order')
            .populate('suborder')
            .populate('buyerId')
            .sort({ sequenceNumber: 1 })
            .then(function (buyerPaymentsList) {

                return res.jsonx({ success: true, code: 200, data: buyerPaymentsList });
            })
            .fail(function (error) {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: error
                    }
                });
            });
    },
    updateBuyerCartPayments: function (req, res) {
        let id = req.param("id");
        let postData = req.body;
        console.log("eeeeeeeeeeeee", postData.order);

        let orderId = postData.order.id;
        let suborderId = postData.suborder.id;

        console.log("eeeeeeeeeeeee", orderId, suborderId);

        Bidspayment.update({
            id: id
        }, postData).then(function (payment) {

            res.jsonx({
                success: true,
                code: 200,
                data: {
                    payment: payment,
                    message: constantObj.bids.DEPOSIT_PAYMENT,
                    key: 'DEPOSIT_PAYMENT'
                }
            });

            // let orderQry = {};
            // orderQry.status = "Processing";
            // orderQry.paymentStatus = 1;
            // Orders.update({
            //     id: orderId
            // }, orderQry).then((orderUpdate) => {

            //     let suborderQry = {};
            //     suborderQry.status = "Processing";

            //     Orderedcarts.update({
            //         id: suborderId
            //     }, suborderQry).then((suborderUpdate) => {



            //         res.jsonx({
            //             success: true,
            //             code: 200,
            //             data: {
            //                 payment: payment,
            //                 message: constantObj.bids.DEPOSIT_PAYMENT,
            //                 key: 'DEPOSIT_PAYMENT'
            //             }
            //         });


            //     }).fail(function (err) {
            //         console.log("errerrv", err);
            //         res.jsonx({
            //             success: false,
            //             error: {
            //                 code: 400,
            //                 message: err
            //             }
            //         });
            //     });

            // }).fail(function (err) {
            //     console.log("errerrv", err);
            //     res.jsonx({
            //         success: false,
            //         error: {
            //             code: 400,
            //             message: err
            //         }
            //     });
            // });

        }).fail(function (err) {
            console.log("errerrv", err);
            res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: err
                }
            });
        });
    },
    // getUserCarts: function (req, res) {

    //     let loggedIn = req.identity.id;
    //     Carts.find({
    //         user: loggedIn
    //     }).sort('id DESC')
    //         // .populate('crop')
    //         .then(function (carts) {

    //             async.each(carts, function (item, callback) {

    //                 Crops.findOne({ id: item.productId }).populate('seller')
    //                     .then(function (cropinfo) {
    //                         if (cropinfo) {
    //                             item["crop"] = cropinfo;
    //                         }
    //                         Inputs.findOne({ id: item.productId }).populate('dealer').populate('market')
    //                             .then(function (inputinfo) {
    //                                 if (inputinfo) {
    //                                     item["input"] = inputinfo;
    //                                 }
    //                                 callback();

    //                             });
    //                     });

    //             }, function (error) {
    //                 if (error) {
    //                     return false;
    //                 } else {
    //                     return res.status(200).jsonx({
    //                         success: true,
    //                         data: carts,
    //                     });
    //                 }
    //             });

    //         }).fail(function (err) {
    //             return {
    //                 success: false,
    //                 error: {
    //                     code: 400,
    //                     message: constantObj.messages.UNKNOW_ERROR_OCCURRED,
    //                     key: "UNKNOW_ERROR_OCCURRED"

    //                 },
    //             };
    //         });

    // },
    transaction: function (req, res) {
        return API(TransactionService.transaction, req, res);
    },

    createOrder: function (req, res) {
        API(CartService.createorder, req, res);
        // let postData = req.body;
        // let orderCode = commonServiceObj.getOrderCode("ORD");
        // postData.code = orderCode;
        // postData.buyer = req.identity.id;
        // // console.log("dddddd",postData);

        // console.log("request", postData);
        // async.each(postData.orderItems, function (item, callback) {
        //     let suborderCode = commonServiceObj.getOrderCode("FRX");
        //     console.log("item", item);
        //     item["code"] = suborderCode;
        //     if (item.productType == "CROP") {
        //         item["crop"] = item.productId;
        //     } else if (item.productType == "INPUT") {
        //         item["input"] = item.productId;
        //     }
        //     Crops.findOne({
        //         id: item.productId
        //     }).then(function (cropinfo) {
        //         console.log("cropinfo", cropinfo);
        //         if (cropinfo) {
        //             if (parseFloat(cropinfo.leftAfterAcceptanceQuantity) < parseFloat(item.quantity)) {

        //                 console.log(cropinfo.leftAfterAcceptanceQuantity, "==", item.quantity);
        //                 let messageerror = cropinfo.name + " crop should be less than or equat to " + cropinfo.leftAfterAcceptanceQuantity
        //                 return res.jsonx({
        //                     success: false,
        //                     code: 200,
        //                     data: {
        //                         subOrder: item,
        //                         message: messageerror
        //                     },
        //                 });
        //             }
        //             callback();
        //         } else {

        //             Inputs.findOne({
        //                 id: item.productId
        //             }).then(function (inputinfo) {

        //                 console.log("inputinfo========", inputinfo);
        //                 if (parseFloat(inputinfo.leftAfterAcceptanceQuantity) <= parseFloat(item.quantity)) {

        //                     console.log(inputinfo.leftAfterAcceptanceQuantity, "==", item.quantity);
        //                     let messageerrorr = inputinfo.name + " input should be less than or equat to " + cropinfo.leftAfterAcceptanceQuantity
        //                     return res.jsonx({
        //                         success: false,
        //                         code: 200,
        //                         data: {
        //                             subOrder: item,
        //                             message: messageerrorr
        //                         },
        //                     });
        //                 }
        //                 callback();
        //             });
        //         }

        //     });

        // }, function (error) {
        //     if (error) {
        //         return false;
        //     } else {

        //         let suborders = postData.orderItems;
        //         delete postData.orderItems;


        //         console.log("postData", postData);

        //         console.log("suborders", suborders);

        //         Orders.create(postData).then(function (orderResponse) {
        //             let orderId = orderResponse.id;

        //             suborders.forEach((obj, i) => {
        //                 obj.order = orderId;
        //             })
        //             console.log("order creating", orderResponse);
        //             Orderedcarts.create(suborders).exec(function (err, finn) {
        //                 if (err) { return res.serverError(err); }
        //                 console.log("sub order creating", finn);
        //                 return res.jsonx({
        //                     success: true,
        //                     code: 200,
        //                     data: {
        //                         order: orderResponse,
        //                         message: constantObj.order.SAVED_ORDER,
        //                         key: 'SAVED_ORDER',
        //                     },
        //                 });

        //             });



        //         }).fail(function (err) {
        //             return res.jsonx({
        //                 success: false,
        //                 error: {
        //                     code: 400,
        //                     message: err,
        //                     key: "UNKNOW_ERROR_OCCURRED"
        //                 }
        //             });
        //         });


        //     }
        // });
    },
    paytmHash: function (req, res) {
        const reqHOst = req.headers.origin;

        var paramlist = req.body;


        var paramarray = new Array();
        // var code = commonService.getUniqueCode();
        // code = "ORD_" + code;
        if (req.body.ENV == "" && req.body.ENV == undefined) {
            return res.json({
                success: false,
                msg: "ENV is required"
            });
        }

        let envPaytm = req.body.ENV;

        paramlist['CUST_ID'] = req.identity.id;
        paramlist['INDUSTRY_TYPE_ID'] = constantObj.paytm_config[envPaytm].INDUSTRY_TYPE_ID;
        //paramlist['PAYTM_MERCHANT_KEY'] = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;
        paramlist['MID'] = constantObj.paytm_config[envPaytm].MID;
        paramlist['MOBILE_NO'] = constantObj.paytm_config[envPaytm].PAYTM_MOBILE;
        paramlist['EMAIL'] = constantObj.paytm_config[envPaytm].PAYTM_EMAIL;

        var itemId = paramlist['ITEM_ID'];
        delete paramlist['ITEM_ID'];
        delete paramlist['ENV'];

        var paramArray = {};
        for (name in paramlist) {
            console.log("name", name)
            if (name == 'PAYTM_MERCHANT_KEY') {
                var PAYTM_MERCHANT_KEY = paramlist[name];
            } else {
                paramarray[name] = paramlist[name];
            }
            paramArray[name] = paramlist[name];
        }
        let queryStarig = '?origin=' + reqHOst + '&env=' + envPaytm + '&oid=' + itemId;
        if (paramlist['CHANNEL_ID'] == 'WEB') {
            paramarray['CALLBACK_URL'] = sails.config.PAYTM_API_URL + '/response-paytm-payment/' + req.identity.id + queryStarig; // in case if you want to send callback
        } else {

            if (envPaytm == "production") {
                paramarray['CALLBACK_URL'] = "https://securegw.paytm.in/theia/paytmCallback?ORDER_ID=" + code;
            } else {
                paramarray['CALLBACK_URL'] = "https://pguat.paytm.com/paytmchecksum/paytmCallback.jsp";
            }
            //paramarray['CALLBACK_URL'] = "https://pguat.paytm.com/paytmchecksum/paytmCallback.jsp"; // in case if you want to send callback
        }
        console.log("hashing for genchecksum creating", paramarray);

        let paytm_key = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;

        Payments.genchecksum(paramarray, paramArray, paytm_key, function (err, result) {
            console.log("genchecksum", result)

            return res.json({
                success: true,
                data: result.paramArray
            });
        });
    },
    paytmHashInput: function (req, res) {
        CartService.usercartAmountToPay(req.identity.id).then(function (amtToPay) {
            console.log("amountToPay", amtToPay);
            if (amtToPay.amountToPay == 0) {
                return res.json({
                    success: false,
                    message: "Amount to be paid should be greater then zero "
                });
            }
            else {

                const reqHOst = req.headers.origin;
                var paramlist = req.body;
                var paramarray = new Array();
                var code = commonService.getUniqueCodeString();
                code = "ORD_" + code;
                if (req.body.ENV == "" && req.body.ENV == undefined) {
                    return res.json({
                        success: false,
                        msg: "ENV is required"
                    });
                }

                let envPaytm = req.body.ENV;
                paramlist['ORDER_ID'] = code;
                paramlist['CUST_ID'] = req.identity.id;
                paramlist['INDUSTRY_TYPE_ID'] = constantObj.paytm_config[envPaytm].INDUSTRY_TYPE_ID;
                //paramlist['PAYTM_MERCHANT_KEY'] = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;
                paramlist['MID'] = constantObj.paytm_config[envPaytm].MID;

                if (paramlist['CHANNEL_ID'] == 'WEB') {
                    paramlist['MOBILE_NO'] = constantObj.paytm_config[envPaytm].PAYTM_MOBILE;
                    paramlist['EMAIL'] = constantObj.paytm_config[envPaytm].PAYTM_EMAIL;
                }
                // paramlist['TXNAMOUNT'] = amountToPay

                delete paramlist['ENV'];

                var paramArray = {};
                for (name in paramlist) {
                    console.log("name", name)
                    if (name == 'PAYTM_MERCHANT_KEY') {
                        var PAYTM_MERCHANT_KEY = paramlist[name];
                    } else {
                        paramarray[name] = paramlist[name];
                    }
                    paramArray[name] = paramlist[name];
                }

                let queryStarig = '?origin=' + reqHOst + '&env=' + envPaytm + '&oid=' + code;
                if (paramlist['CHANNEL_ID'] == 'WEB') {
                    paramarray['CALLBACK_URL'] = sails.config.PAYTM_API_URL + '/response-paytm-payment/' + req.identity.id + queryStarig; // in case if you want to send callback
                } else {
                    if (envPaytm == "production") {
                        paramarray['CALLBACK_URL'] = "https://securegw.paytm.in/theia/paytmCallback?ORDER_ID=" + code;
                    } else {
                        paramarray['CALLBACK_URL'] = "https://securegw-stage.paytm.in/theia/paytmCallback?ORDER_ID=" + code;
                    }
                }

                let paytm_key = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;

                Payments.genchecksum(paramarray, paramArray, paytm_key, function (err, result) {
                    return res.json({
                        success: true,
                        data: result.paramArray
                    });
                });
            }
        })
    },

    updatebuyerpaymentstatus: function (req, res) {
        let id = req.param('id');
        let data = req.body;
        console.log(data, 'buyer data')
        if (id) {
            Bidspayment.update({ id: id }, data).then(function (bidsp) {
                if (bidsp) {
                    return res.jsonx({
                        success: true,
                        data: bidsp,
                        message: 'Buyer Payment status updated successfylly'
                    })
                } else {
                    return res.jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: constantObj.messages.UNKNOW_ERROR_OCCURRED,
                            key: "UNKNOW_ERROR_OCCURRED"
                        }
                    });

                }
            })
        }
    },
    updatesellerpaymentstatus: function (req, res) {
        let id = req.param('id');
        let data = req.body;
        if (id) {
            Sellerpayment.update({ id: id }, data).then(function (bidsp) {
                if (bidsp) {
                    return res.jsonx({
                        success: true,
                        data: bidsp,
                        message: 'Seller Payment status updated successfylly'
                    })
                } else {
                    return res.jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: constantObj.messages.UNKNOW_ERROR_OCCURRED,
                            key: "UNKNOW_ERROR_OCCURRED"
                        }
                    });

                }
            })
        }
    },

};
// End module.exports 

/**
* @save cart to database for user 
* save()
* Params: crops details and qty.
*/
var save = function (req, res) {
    req.body.user = req.identity.id;
    let postData = req.body;
    postData.user = req.identity.id;
    let pincode = JSON.parse(postData.pincode);
    if (postData.productType == "CROP") {
        postData.crop = postData.productId;
    } else if (postData.productType == "INPUT") {
        postData.input = postData.productId;
    } /*else if (postData.productType == "EQUIPMENT") {
        postData.equipment = postData.productId;
    }*/

    getCart(req, res, (resp) => {

        if (resp === true) {
            Market.find({ select: ['id'], where: { pincode: { "$in": [pincode] } } }).then(function (markesId) {
                // return 1;
                if (markesId.length > 0) {
                    let markets = []
                    // let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
                    for (var i = 0; i < markesId.length; i++) {
                        markets.push(markesId[i].id)
                    }
                    let pricesAtMarketPopQury = { select: ['price', 'market'], limit: 1, sort: 'price ASC' }
                    var inputQry = {}
                    inputQry.id = postData.productId

                    if (postData.selectedMarket) {
                        inputQry.availableForFranchisees = { "$in": [postData.selectedMarket] }
                        pricesAtMarketPopQury.where = { market: postData.selectedMarket }
                    } else {
                        inputQry.availableForFranchisees = { "$in": markets }
                        pricesAtMarketPopQury.where = { market: markets }
                    }

                    Inputs.findOne(inputQry).populate('pricesAtMarkets', pricesAtMarketPopQury).then(function (input) {
                        if (input) {
                            if (input.isActive == false || input.isDeleted == true || input.isApproved == false || input.isExpired == true || postData.quantity > input.availableQuantity) {
                                res.jsonx({
                                    success: false,
                                    error: {
                                        code: 400,
                                        message: "Sorry this product is not available now."
                                    }
                                });
                            } else if (postData.quantity > input.availableQuantity) {
                                res.jsonx({
                                    success: false,
                                    error: {
                                        code: 400,
                                        message: "Can not add more quantity than " + input.availableQuantity + input.workingUnit + "."
                                    }
                                });
                            } else {

                                if (input.pricesAtMarkets.length > 0) {
                                    postData.amountDuringUpdation = input.pricesAtMarkets[0].price
                                    postData.selectedMarket = input.pricesAtMarkets[0].market
                                }


                                postData.quantityUnit = input.workingUnit
                                Carts.create(postData).exec(function (err, cart) {
                                    if (err) {
                                        res.jsonx({
                                            success: false,
                                            error: {
                                                code: 400,
                                                message: err
                                            }
                                        });
                                    } else {
                                        return res.jsonx({
                                            success: true,
                                            code: 200,
                                            data: {
                                                cart: cart,
                                                message: constantObj.cart.SAVED_CART,
                                                key: 'SAVED_CART'
                                            }
                                        });
                                    }
                                })
                            }
                        } else {
                            res.jsonx({
                                success: false,
                                error: {
                                    code: 400,
                                    message: "This product is not available at the given pincode."
                                }
                            });
                        }
                    })
                } else {
                    res.jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: "This product is not available at the given pincode."
                        }
                    });
                }
            })
            /* Carts.create(postData).exec(function (err, cart) {
                 return res.jsonx({
                     success: true,
                     code: 200,
                     data: {
                         cart: cart,
                         message: constantObj.cart.SAVED_CART,
                         key: 'SAVED_CART'
                     }
                 });
             });*/
        } else {
            if (postData.productType == "CROP") {

                Carts.findOne({
                    crop: postData.crop
                }).then(function (cropcart) {
                    if (cropcart) {
                        postData.quantity = (cropcart.quantity + parseFloat(postData.quantity));
                    } else {
                        postData.quantity = (parseFloat(postData.quantity));
                    }

                    Carts.update({
                        crop: postData.crop
                    }, postData).then(function (cart) {
                        res.jsonx({
                            success: true,
                            code: 200,
                            data: {
                                cart: cart,
                                message: constantObj.cart.UPDATED_CART,
                                key: 'UPDATED_CART'
                            }
                        });
                    }).fail(function (err) {
                        res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: err
                            }
                        });
                    });
                });

            } else if (postData.productType == "INPUT") {
                var cropcart = resp
                //console.log("arun")
                Market.find({ select: ['id'], where: { pincode: { "$in": [pincode] } } }).then(function (markesId) {
                    if (markesId.length > 0) {
                        let markets = []
                        // let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
                        for (var i = 0; i < markesId.length; i++) {
                            markets.push(markesId[i].id)
                        }

                        let pricesAtMarketPopQury = { select: ['price', 'market'], limit: 1, sort: 'price ASC' }

                        var inputQry = {}
                        inputQry.id = cropcart.input
                        if (postData.selectedMarket) {
                            inputQry.availableForFranchisees = { "$in": [postData.selectedMarket] }
                            pricesAtMarketPopQury.where = { market: postData.selectedMarket }
                        } else {
                            inputQry.availableForFranchisees = { "$in": markets }
                            pricesAtMarketPopQury.where = { market: markets }
                        }

                        Inputs.findOne(inputQry).populate('pricesAtMarkets', pricesAtMarketPopQury).then(function (input) {

                            if (input) {
                                if (input.isActive == false || input.isDeleted == true || input.isApproved == false || input.isExpired == true || postData.quantity > input.availableQuantity) {
                                    res.jsonx({
                                        success: false,
                                        error: {
                                            code: 400,
                                            message: "Sorry this product is not available now."
                                        }
                                    });
                                } else if (postData.quantity > input.availableQuantity) {
                                    res.jsonx({
                                        success: false,
                                        error: {
                                            code: 400,
                                            message: "Can not add more quantity than " + input.availableQuantity + input.workingUnit + "."
                                        }
                                    });
                                } else {
                                    if (cropcart) {
                                        postData.quantity = (cropcart.quantity + parseFloat(postData.quantity));
                                    } else {
                                        postData.quantity = (parseFloat(postData.quantity));
                                    }
                                    if (input.pricesAtMarkets.length > 0) {
                                        postData.amountDuringUpdation = input.pricesAtMarkets[0].price
                                        postData.selectedMarket = input.pricesAtMarkets[0].market
                                    }

                                    postData.quantityUnit = input.workingUnit


                                    Carts.update({
                                        id: cropcart.id
                                    }, postData).then(function (cart) {
                                        res.jsonx({
                                            success: true,
                                            code: 200,
                                            data: {
                                                cart: cart,
                                                message: constantObj.cart.UPDATED_CART,
                                                key: 'UPDATED_CART'
                                            }
                                        });
                                    }).fail(function (err) {
                                        res.jsonx({
                                            success: false,
                                            error: {
                                                code: 400,
                                                message: err
                                            }
                                        });
                                    });
                                }
                            } else {
                                res.jsonx({
                                    success: false,
                                    error: {
                                        code: 400,
                                        message: "This product is not available at the given pincode."
                                    }
                                });
                            }
                        })
                    } else {
                        res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: "This product is not available at the given pincode."
                            }
                        });
                    }
                })
            }
        }
    });
};
/**
* @update cart to database for user 
* update()
* Params: input details and qty.
*/
var update = function (req, res) {
    let id = req.param("id");
    let postData = req.body;

    Carts.update({
        id: id
    }, postData).then(function (cart) {
        res.jsonx({
            success: true,
            code: 200,
            data: {
                cart: cart,
                message: constantObj.cart.UPDATED_CART,
                key: 'UPDATED_CART'
            }
        });
    }).fail(function (err) {
        res.jsonx({
            success: false,
            error: {
                code: 400,
                message: err
            }
        });
    });
};

var getCart = function (req, res, returning) {
    let userId = req.body.user;
    let productId = req.body.productId;
    Carts.findOne({
        user: userId,
        productId: productId
    })
        .then(function (cart) {
            if (cart) {
                returning(cart);
            } else {
                returning(true);
            }
        });
};






var orderPlace = function (req, res) {

    return API(OrderService.createorderAfterPaytm, req, res);
};


var mobileOrderTransections = function (req, res) {


    var paramlist = req.body;
    var userId = paramlist.user;
    var orderId = paramlist.order;
    var transactId = paramlist.TXNID;
    var paramArray = {};
    let userCatrs = [];

    var transactionData = {};
    transactionData.buyerId = userId;
    transactionData.order = orderId;
    transactionData.transactionId = transactId;
    transactionData.paymentjson = paramlist;
    transactionData.processStatus = paramlist.STATUS;

    if (paramlist.STATUS == 'TXN_SUCCESS') {

        Transactions.create(transactionData).then(function (paymentsData) {

            Orders.update({
                id: orderId
            }, { paymentStatus: 1, status: "Completed" })
                .then(function (orderUpdateArr) {

                    Carts.destroy({ user: userId }).exec(function (err) {
                        if (err) { return res.negotiate(err); }

                        Orderedcarts.find({ order: orderId }).populate("crop")
                            .then(function (orderdetails) {

                                // Seller payment for order
                                let cropIds = [];
                                let cropUpdateQry = [];
                                let cartSellerPayment = [];
                                let buyerPayment = [];
                                orderdetails.forEach((obj, i) => {
                                    // Buyer payment for order
                                    let cartBuyerPayment = [];
                                    let paymentMode;
                                    for (j = 0; j < 2; j++) {

                                        paymentMode = "PayTm";
                                        let name = "Earnest";
                                        let paymentType = "Earnest";
                                        let amount = obj.earnestAmount;
                                        let status = 'Verified';
                                        if (j == 1) {

                                            paymentType = "Final";
                                            name = "Final";
                                            status = "Due"
                                            let full_amount = (obj.amount * obj.quantity) + obj.facilitationCharges + obj.taxAmount + obj.insuranceCharges + obj.deliveryCharges;
                                            amount = full_amount - obj.earnestAmount;
                                        }
                                        let buyerPmtObt = {
                                            "cropId": obj.crop.id,
                                            "order": obj.order,
                                            "suborder": obj.id,
                                            "buyerId": obj.user,
                                            "amount": amount,
                                            "type": paymentType,
                                            "paymentDate": new Date(),
                                            "status": status,
                                            "name": name,
                                            "paymentDueDate": new Date(new Date().setDate(new Date().getDate() + obj.cartFinalPaymentDays)).toISOString(),
                                            "sequenceNumber": (j + 1),
                                            "isVerified": true,
                                            "paymentMedia": "Cart"
                                        };
                                        if (j != 1) {
                                            buyerPmtObt["paymentMode"] = paymentMode;
                                            buyerPmtObt["depositedOn"] = new Date();
                                        }

                                        cartBuyerPayment.push(buyerPmtObt);

                                    }

                                    let paymentType = "Final";
                                    let status = "Due";
                                    let full_amount = (obj.amount * obj.quantity);
                                    let sPercentage = parseFloat(obj.crop.sellerFinalPercentage) + parseFloat(obj.crop.sellerUpfrontPercentage);
                                    obj.crop.sellerDepositPayment.forEach((row) => {
                                        sPercentage += row.percentage;
                                    });
                                    let amount = parseFloat(full_amount * parseFloat(sPercentage / 100));

                                    let sellerPmtObt = {
                                        "cropId": obj.crop.id,
                                        "order": obj.order,
                                        "suborder": obj.id,
                                        "sellerId": obj.seller,
                                        "buyerId": obj.user,
                                        // "depositPercentage" : obj.sellerFinalPercentage,
                                        "depositDays": obj.cartFinalPaymentDays,
                                        "depositLabel": paymentType,
                                        "pincode": obj.pincode,
                                        "paymentDueDate": new Date(new Date().setDate(new Date().getDate() + obj.cartFinalPaymentDays)).toISOString(),
                                        "type": paymentType,
                                        "status": status,
                                        "sequenceNumber": (i + 1),
                                        "amount": amount,
                                        "paymentMedia": "Cart"
                                    };

                                    cropIds.push(obj.crop.id);
                                    let leftQyt = (obj.crop.leftAfterAcceptanceQuantity - obj.quantity);
                                    cropUpdateQry.push(leftQyt);
                                    cartSellerPayment.push(sellerPmtObt);
                                    // console.log("cartBuyerPayment--", i, cartBuyerPayment)  ;
                                    buyerPayment = buyerPayment.concat(cartBuyerPayment);

                                }); //End forEach 3
                                // console.log("Crops update --", Crops)  ;
                                Bidspayment.create(buyerPayment)
                                    .then(function (createdBuyerPayment) {

                                        Sellerpayment.create(cartSellerPayment)
                                            .then(function (responseSellerPayment) {

                                                Crops.update({ id: cropIds }, { leftAfterAcceptanceQuantity: cropUpdateQry })
                                                    .then(function (updatedCrop) {

                                                        return res.jsonx({
                                                            success: true,
                                                            code: 200,
                                                            data: {
                                                                message: constantObj.order.SAVED_ORDER,
                                                                key: "SAVED_ORDER"
                                                            }
                                                        });

                                                    }).fail(function (err) {
                                                        res.jsonx({
                                                            success: false,
                                                            error: {
                                                                code: 400,
                                                                message: "Crops leftAfterAcceptanceQuantity query error"
                                                            }
                                                        });
                                                    });

                                            }).fail(function (err) {
                                                res.jsonx({
                                                    success: false,
                                                    error: {
                                                        code: 400,
                                                        message: "Seller payment query error"
                                                    }
                                                });
                                            });

                                    }).fail(function (err) {
                                        res.jsonx({
                                            success: false,
                                            error: {
                                                code: 400,
                                                message: "Buyer Bidspayment query error"
                                            }
                                        });
                                    });

                            }).fail(function (err) {
                                res.jsonx({
                                    success: false,
                                    error: {
                                        code: 400,
                                        message: "Fetching sub order query error"
                                    }
                                });
                            });

                    }); // Cart deleting query error

                }); // Order update query error
        }); //Transection query error

    } else {

        Orders.update({
            id: orderId
        }, { paymentStatus: 0, status: "Failed" }).then(function (orderUpdateArr) {
            Orderedcarts.update({
                order: { $in: [orderId] }
            }, { status: "Failed" }).then(function (suborderArr) {

                Carts.destroy({
                    user: userId
                }).exec(function (err) {
                    if (err) { return res.negotiate(err); }

                    res.jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: "Payment Failed Now"
                        }
                    });
                });
            });
        });
    }


};