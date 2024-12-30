var Promise = require('bluebird'),
    promisify = Promise.promisify;
var constantObj = sails.config.constants;
var commonServiceObj = require('./commonService');
var ObjectId = require('mongodb').ObjectID;


module.exports = {

    createorderAfterPaytm: function (data, context, req, res) {
        var request = require('request');
        var userId = req.param("id");
        var origin = req.query.origin;
        var envPaytm = req.query.env;
        var loggedIn = userId;
        var paramlist = req.body;
        var transactId = paramlist.TXNID;
        var paramArray = {};
        let userCatrs = [];
        var orderId = req.query.oid ? req.query.oid : paramlist["ORDERID"];
        paramArray["MID"] = paramlist["MID"];
        paramArray["ORDER_ID"] = paramlist["ORDERID"];
        let paytm_key = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;
        if (paramlist.STATUS == 'TXN_SUCCESS' && paramlist.TXNAMOUNT > 0) {
            var transactionData = {};
            transactionData.buyerId = userId;
            transactionData.productType = "input";
            transactionData.order = orderId;
            transactionData.transactionId = transactId;
            transactionData.paymentjson = paramlist;
            transactionData.processStatus = paramlist.STATUS;
            transactionData.paymentType = "PayTm"

            var amountToPay = paramlist.TXNAMOUNT;
            transactionData.amount = amountToPay;
            Transactions.create(transactionData).then(function (paymentsData) {

                let inputFields = ['dealer', 'finalPrice', 'depositPayment', 'finalPaymentPercentage', 'finalPaymentDays', 'taxRate', 'taxes', 'productTaxes', 'productTaxRate', 'efarmxComission', 'shippingPrice', 'franchiseePercentage', 'sellerUpfrontPercentage', 'sellerUpfrontDays', 'sellerFinalPercentage', 'sellerFinalDays', 'sellerDepositPayment', 'earnestPercent'];

                CartService.usercart(data, context, inputFields, loggedIn).then(function (carts) {
                    // start the order cart process
                    var carttotalAmount = 0
                    var carttotalTax = 0
                    var carttotalProductTax = 0
                    var carttotalFacilitationCharges = 0
                    var carttotalFacilitationPercentage = 0
                    var carttotalDistance = 0
                    var carttotalDeliveryCharges = 0
                    var carttotalTaxPercentage = 0
                    var carttotalProductTaxPercentage = 0

                    let inStockInput = carts.data.filter(cat => {
                        if (cat.inStock) {

                            let orderInfo = {}
                            orderInfo.code = commonServiceObj.getOrderCode("SORD");
                            orderInfo.user = cat.user
                            orderInfo.seller = cat.input.dealer
                            orderInfo.market = cat.selectedMarket
                            orderInfo.productId = cat.input.id
                            orderInfo.productType = "INPUT"
                            orderInfo.input = cat.input.id
                            orderInfo.amount = cat.totalAmount
                            orderInfo.taxPercent = cat.input.taxRate
                            orderInfo.taxAmount = cat.totalAmount * (cat.input.taxRate / 100)
                            orderInfo.taxes = cat.input.productTaxes
                            orderInfo.productTaxRate = cat.input.productTaxRate
                            orderInfo.productTaxes = cat.input.taxes
                            orderInfo.productTaxAmount = cat.totalAmount * (cat.input.productTaxRate / 100)
                            orderInfo.quantity = cat.quantity
                            orderInfo.quantityUnit = cat.quantityUnit
                            orderInfo.facilitationPercent = cat.input.efarmxComission
                            orderInfo.facilitationCharges = cat.totalAmount * (cat.input.efarmxComission / 100)
                            orderInfo.status = "Placed"
                            orderInfo.earnestAmount = cat.amountToBePaid
                            orderInfo.deliveryCharges = 0
                            orderInfo.buyingPrice = cat.selectedMarketPricing
                            for (var i = 0; i < cat.input.availableMarkets.length; i++) {
                                if (cat.input.availableMarkets[i].market.id == cat.selectedMarket.id) {
                                    if (cat.input.availableMarkets[i].marketDistanceInMeters) {
                                        orderInfo.distance = cat.input.availableMarkets[i].marketDistanceInMeters
                                        orderInfo.deliveryCharges = cat.input.shippingPrice * cat.quantity * (cat.input.availableMarkets[i].marketDistanceInMeters / 1000)
                                        carttotalDistance = carttotalDistance + orderInfo.distance
                                    }
                                    break
                                }
                            }
                            orderInfo.depositPercentage = 100 - (cat.input.finalPaymentPercentage + cat.input.earnestPercent)
                            orderInfo.insurancePercent = 0
                            orderInfo.insuranceCharges = 0
                            orderInfo.isCanceled = false
                            orderInfo.francshiseePercentage = cat.input.franchiseePercentage
                            orderInfo.franchiseePartPerQuantity = cat.input.price * cat.input.franchiseePercentage / 100
                            orderInfo.paymentMethod = cat.paymentMethod
                            cat.order = orderInfo

                            carttotalAmount = carttotalAmount + cat.totalAmount
                            carttotalTax = carttotalTax + orderInfo.taxAmount
                            carttotalProductTax = carttotalProductTax + orderInfo.productTaxRate
                            carttotalFacilitationCharges = carttotalFacilitationCharges + orderInfo.facilitationCharges
                            carttotalDeliveryCharges = carttotalDeliveryCharges + orderInfo.deliveryCharges
                            carttotalTaxPercentage = carttotalTaxPercentage + orderInfo.taxPercent
                            carttotalProductTaxPercentage = carttotalProductTaxPercentage + orderInfo.productTaxRate
                        }
                        return cat.inStock
                    })

                    if (inStockInput != undefined && inStockInput.length > 0) {
                        let orderData = {};
                        let orderCode = orderId;
                        orderData.code = orderCode
                        orderData.buyer = loggedIn
                        orderData.totalAmount = carttotalAmount
                        orderData.avgFacilitationPercent = (carttotalFacilitationCharges / carttotalAmount) * 100
                        orderData.totalFacilitationCharges = carttotalFacilitationCharges
                        orderData.avgInsurancePercent = 0
                        orderData.totalInsuranceCharges = 0
                        orderData.avgTaxPercent = carttotalTaxPercentage / inStockInput.length
                        orderData.totalTaxAmount = carttotalTax
                        orderData.totalDistance = carttotalDistance
                        orderData.totalDeliveryCharges = carttotalDeliveryCharges
                        // orderData.totalBidEarnestAmount = carts.amountToPay
                        orderData.totalBidEarnestAmount = amountToPay
                        orderData.paymentStatus = 1;
                        orderData.totalProductTaxAmount = carttotalProductTax

                        Orders.create(orderData).then(function (order) {
                            if (order) {

                                Transactions.update({ id: paymentsData.id }, { order: order.id }).then(function () {

                                    let allSuborders = []
                                    let allBuyerPayments = []
                                    let allSellerPayments = []
                                    let allFarmxPayments = []
                                    let removeCartIds = []
                                    for (var i = 0; i < inStockInput.length; i++) {
                                        let inStockproduct = inStockInput[i]
                                        let sorder = inStockproduct.order

                                        sorder.order = order.id


                                        let totalPercentageWithoutSeller = (inStockproduct.input.efarmxComission * (1 + (inStockproduct.input.taxRate / 100))) + inStockproduct.input.franchiseePercentage
                                        let totalProductPercentage = totalPercentageWithoutSeller + 100
                                        let sellerAmount = (inStockproduct.totalAmount * 100) / totalProductPercentage

                                        sorder.sellingPrice = sellerAmount


                                        allSuborders.push(sorder)
                                        removeCartIds.push(inStockproduct.id)

                                        if (inStockproduct.paymentMethod == 'STEP') {

                                            if (inStockproduct.amountToBePaid > 0) {
                                                let buyerEarnestInfo = {}

                                                buyerEarnestInfo.suborder = sorder.code
                                                buyerEarnestInfo.sellerId = inStockproduct.input.dealer
                                                buyerEarnestInfo.input = inStockproduct.input.id
                                                buyerEarnestInfo.productType = 'input'
                                                buyerEarnestInfo.order = order.id
                                                buyerEarnestInfo.buyerId = loggedIn
                                                buyerEarnestInfo.amount = inStockproduct.amountToBePaid
                                                buyerEarnestInfo.originalAmount = inStockproduct.amountToBePaid
                                                if (inStockproduct.pincode) {
                                                    buyerEarnestInfo.pincode = inStockproduct.pincode
                                                }
                                                buyerEarnestInfo.transactionId = paymentsData.id
                                                buyerEarnestInfo.type = 'Earnest'
                                                buyerEarnestInfo.sequenceNumber = 1
                                                buyerEarnestInfo.paymentDueDate = new Date()
                                                buyerEarnestInfo.paymentDate = new Date()
                                                buyerEarnestInfo.depositedOn = new Date()
                                                buyerEarnestInfo.paymentMode = "PayTm"
                                                buyerEarnestInfo.isVerified = true
                                                buyerEarnestInfo.name = 'Earnest'
                                                buyerEarnestInfo.status = 'Verified'
                                                buyerEarnestInfo.paymentMedia = 'Cart'

                                                allBuyerPayments.push(buyerEarnestInfo)

                                            }

                                            if (inStockproduct.input.depositPayment != undefined && inStockproduct.input.depositPayment.length
                                                > 0) {
                                                for (var j = 0; j < inStockproduct.input.depositPayment.length; j++) {
                                                    let deposit = inStockproduct.input.depositPayment[j]
                                                    let depositInfo = {}

                                                    depositInfo.suborder = sorder.code
                                                    depositInfo.sellerId = inStockproduct.input.dealer
                                                    depositInfo.input = inStockproduct.input.id
                                                    depositInfo.productType = 'input'
                                                    depositInfo.order = order.id
                                                    depositInfo.buyerId = loggedIn
                                                    depositInfo.amount = inStockproduct.totalAmount * (deposit.percentage / 100)
                                                    depositInfo.originalAmount = inStockproduct.totalAmount * (deposit.percentage / 100)
                                                    if (inStockproduct.pincode) {
                                                        depositInfo.pincode = inStockproduct.pincode
                                                    }

                                                    depositInfo.type = 'Deposit'
                                                    depositInfo.sequenceNumber = j + 1
                                                    depositInfo.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + deposit.days)).toISOString();
                                                    depositInfo.isVerified = false
                                                    depositInfo.name = deposit.label
                                                    depositInfo.status = 'Due'
                                                    depositInfo.paymentMedia = 'Cart'

                                                    allBuyerPayments.push(depositInfo)
                                                }
                                            }

                                            if (inStockproduct.input.finalPaymentPercentage != undefined) {

                                                let buyerFinalInfo = {}

                                                buyerFinalInfo.suborder = sorder.code
                                                buyerFinalInfo.sellerId = inStockproduct.input.dealer
                                                buyerFinalInfo.input = inStockproduct.input.id
                                                buyerFinalInfo.productType = 'input'
                                                buyerFinalInfo.order = order.id
                                                buyerFinalInfo.buyerId = loggedIn
                                                buyerFinalInfo.amount = inStockproduct.totalAmount * (inStockproduct.input.finalPaymentPercentage / 100)
                                                buyerFinalInfo.originalAmount = inStockproduct.totalAmount * (inStockproduct.input.finalPaymentPercentage / 100)
                                                if (inStockproduct.pincode) {
                                                    buyerFinalInfo.pincode = inStockproduct.pincode
                                                }

                                                buyerFinalInfo.type = 'Final'
                                                buyerFinalInfo.sequenceNumber = 1
                                                buyerFinalInfo.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + inStockproduct.input.finalPaymentDays)).toISOString();
                                                buyerFinalInfo.isVerified = false
                                                buyerFinalInfo.name = 'Final'
                                                buyerFinalInfo.status = 'Due'
                                                buyerFinalInfo.paymentMedia = 'Cart'

                                                allBuyerPayments.push(buyerFinalInfo)
                                            }
                                        } else if (inStockproduct.paymentMethod == 'COD') {
                                            let buyerFinalInfo = {}

                                            buyerFinalInfo.suborder = sorder.code
                                            buyerFinalInfo.sellerId = inStockproduct.input.dealer
                                            buyerFinalInfo.input = inStockproduct.input.id
                                            buyerFinalInfo.productType = 'input'
                                            buyerFinalInfo.order = order.id
                                            buyerFinalInfo.buyerId = loggedIn
                                            buyerFinalInfo.amount = inStockproduct.totalAmount
                                            buyerFinalInfo.originalAmount = inStockproduct.totalAmount
                                            if (inStockproduct.pincode) {
                                                buyerFinalInfo.pincode = inStockproduct.pincode
                                            }

                                            buyerFinalInfo.type = 'Final'
                                            buyerFinalInfo.sequenceNumber = 1
                                            buyerFinalInfo.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + inStockproduct.input.finalPaymentDays)).toISOString();
                                            buyerFinalInfo.isVerified = false
                                            buyerFinalInfo.name = 'Final'
                                            buyerFinalInfo.status = 'Due'
                                            buyerFinalInfo.paymentMedia = 'Cart'

                                            allBuyerPayments.push(buyerFinalInfo);


                                            let farmxFinalInfo = {}

                                            farmxFinalInfo.suborder = sorder.code
                                            farmxFinalInfo.sellerId = inStockproduct.input.dealer
                                            farmxFinalInfo.input = inStockproduct.input.id
                                            farmxFinalInfo.productType = 'input'
                                            farmxFinalInfo.order = order.id
                                            farmxFinalInfo.buyerId = loggedIn
                                            farmxFinalInfo.amount = inStockproduct.totalAmount
                                            farmxFinalInfo.originalAmount = inStockproduct.totalAmount
                                            if (inStockproduct.pincode) {
                                                farmxFinalInfo.pincode = inStockproduct.pincode
                                            }

                                            farmxFinalInfo.type = 'Final'
                                            farmxFinalInfo.sequenceNumber = 1
                                            farmxFinalInfo.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + inStockproduct.input.finalPaymentDays)).toISOString();
                                            farmxFinalInfo.isVerified = false
                                            farmxFinalInfo.name = 'Final'
                                            farmxFinalInfo.status = 'Due'
                                            farmxFinalInfo.paymentMedia = 'Cart'

                                            allFarmxPayments.push(farmxFinalInfo)

                                        } else if (inStockproduct.paymentMethod == 'ADVANCE') {
                                            let buyerFinalInfo = {}

                                            buyerFinalInfo.suborder = sorder.code
                                            buyerFinalInfo.sellerId = inStockproduct.input.dealer
                                            buyerFinalInfo.input = inStockproduct.input.id
                                            buyerFinalInfo.productType = 'input'
                                            buyerFinalInfo.order = order.id
                                            buyerFinalInfo.buyerId = loggedIn
                                            buyerFinalInfo.amount = inStockproduct.totalAmount
                                            buyerFinalInfo.originalAmount = inStockproduct.totalAmount
                                            if (inStockproduct.pincode) {
                                                buyerFinalInfo.pincode = inStockproduct.pincode
                                            }
                                            buyerFinalInfo.transactionId = paymentsData.id
                                            buyerFinalInfo.type = 'Final'
                                            buyerFinalInfo.sequenceNumber = 1
                                            buyerFinalInfo.paymentDueDate = new Date()
                                            buyerFinalInfo.paymentDate = new Date()
                                            buyerFinalInfo.depositedOn = new Date()
                                            buyerFinalInfo.paymentMode = "PayTm"
                                            buyerFinalInfo.isVerified = true
                                            buyerFinalInfo.name = 'Final'
                                            buyerFinalInfo.status = 'Verified'
                                            buyerFinalInfo.paymentMedia = 'Cart'

                                            allBuyerPayments.push(buyerFinalInfo)
                                        }


                                        if (inStockproduct.input.sellerUpfrontPercentage && inStockproduct.input.sellerUpfrontPercentage > 0) {
                                            let sellerUpfrontInfo = {}
                                            sellerUpfrontInfo.input = inStockproduct.input.id
                                            sellerUpfrontInfo.productType = 'input'
                                            sellerUpfrontInfo.order = order.id
                                            sellerUpfrontInfo.suborder = sorder.code
                                            sellerUpfrontInfo.sellerId = inStockproduct.input.dealer
                                            sellerUpfrontInfo.buyerId = loggedIn
                                            sellerUpfrontInfo.amount = parseFloat(sellerAmount * (inStockproduct.input.sellerUpfrontPercentage / 100)).toFixed(2)
                                            sellerUpfrontInfo.originalAmount = parseFloat(sellerAmount * (inStockproduct.input.sellerUpfrontPercentage / 100)).toFixed(2)
                                            if (inStockproduct.pincode) {
                                                sellerUpfrontInfo.pincode = inStockproduct.pincode
                                            }

                                            sellerUpfrontInfo.type = 'Upfront'
                                            sellerUpfrontInfo.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + inStockproduct.input.sellerUpfrontDays)).toISOString();
                                            sellerUpfrontInfo.isVerified = false
                                            sellerUpfrontInfo.sequenceNumber = 1
                                            sellerUpfrontInfo.status = 'Due'
                                            sellerUpfrontInfo.paymentMedia = 'Cart'

                                            allSellerPayments.push(sellerUpfrontInfo)
                                        }

                                        if (inStockproduct.input.sellerDepositPayment != undefined && inStockproduct.input.sellerDepositPayment.length
                                            > 0) {
                                            for (var j = 0; j < inStockproduct.input.sellerDepositPayment.length; j++) {
                                                let deposit = inStockproduct.input.sellerDepositPayment[j]

                                                let sellerUpfrontInfo = {}
                                                sellerUpfrontInfo.input = inStockproduct.input.id
                                                sellerUpfrontInfo.productType = 'input'
                                                sellerUpfrontInfo.order = order.id
                                                sellerUpfrontInfo.suborder = sorder.code
                                                sellerUpfrontInfo.sellerId = inStockproduct.input.dealer
                                                sellerUpfrontInfo.buyerId = loggedIn
                                                sellerUpfrontInfo.amount = parseFloat(sellerAmount * (deposit.percentage / 100)).toFixed(2)
                                                sellerUpfrontInfo.originalAmount = parseFloat(sellerAmount * (deposit.percentage / 100)).toFixed(2)
                                                if (inStockproduct.pincode) {
                                                    sellerUpfrontInfo.pincode = inStockproduct.pincode
                                                }

                                                sellerUpfrontInfo.type = 'Deposit'
                                                sellerUpfrontInfo.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + deposit.days)).toISOString();
                                                sellerUpfrontInfo.isVerified = false
                                                sellerUpfrontInfo.sequenceNumber = j + 2
                                                sellerUpfrontInfo.status = 'Due'
                                                sellerUpfrontInfo.paymentMedia = 'Cart'

                                                allSellerPayments.push(sellerUpfrontInfo)
                                            }
                                        }

                                        if (inStockproduct.input.sellerFinalPercentage && inStockproduct.input.sellerFinalPercentage > 0) {
                                            let sellerUpfrontInfo = {}
                                            sellerUpfrontInfo.input = inStockproduct.input.id
                                            sellerUpfrontInfo.productType = 'input'
                                            sellerUpfrontInfo.order = order.id
                                            sellerUpfrontInfo.suborder = sorder.code
                                            sellerUpfrontInfo.sellerId = inStockproduct.input.dealer
                                            sellerUpfrontInfo.buyerId = loggedIn
                                            sellerUpfrontInfo.amount = parseFloat(sellerAmount * (inStockproduct.input.sellerFinalPercentage / 100)).toFixed(2)
                                            sellerUpfrontInfo.originalAmount = parseFloat(sellerAmount * (inStockproduct.input.sellerFinalPercentage / 100)).toFixed(2)
                                            if (inStockproduct.pincode) {
                                                sellerUpfrontInfo.pincode = inStockproduct.pincode
                                            }

                                            sellerUpfrontInfo.type = 'Final'
                                            sellerUpfrontInfo.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + inStockproduct.input.sellerFinalDays)).toISOString();
                                            sellerUpfrontInfo.isVerified = false
                                            sellerUpfrontInfo.sequenceNumber = 5
                                            sellerUpfrontInfo.status = 'Due'
                                            sellerUpfrontInfo.paymentMedia = 'Cart'

                                            allSellerPayments.push(sellerUpfrontInfo);
                                        }

                                    }

                                    Orderedcarts.create(allSuborders).then(function (suborders) {


                                        suborders = _.indexBy(suborders, 'code');

                                        for (var i = 0; i < allBuyerPayments.length; i++) {
                                            allBuyerPayments[i].suborder = suborders[allBuyerPayments[i].suborder].id
                                        }

                                        for (var i = 0; i < allSellerPayments.length; i++) {
                                            allSellerPayments[i].suborder = suborders[allSellerPayments[i].suborder].id
                                        }

                                        for (var i = 0; i < allFarmxPayments.length; i++) {
                                            allFarmxPayments[i].suborder = suborders[allFarmxPayments[i].suborder].id
                                        }

                                        Bidspayment.create(allBuyerPayments).then(function (buyerPayments) {
                                            if (buyerPayments) {

                                                Sellerpayment.create(allSellerPayments).then(function (sellerPayments) {
                                                    // console.log("sellerPayments", sellerPayments);
                                                    if (sellerPayments) {
                                                        let framxP = new Promise(function (resolve, reject) {
                                                            let p = FarmxPayment.create(allFarmxPayments);
                                                            if (p) {
                                                                resolve(p);
                                                            } else {
                                                                reject({ error: 'something wrong' });
                                                            }
                                                        })
                                                        framxP.then(function (framxP) {
                                                            Carts.destroy({ id: removeCartIds }).then(function (destroy) {
                                                                //  update available and sold quantity
                                                                var i = 0;
                                                                async.each(suborders, function (item, callback) {
                                                                    let qty = item.quantity;
                                                                    let inputId = item.productId;
                                                                    var invoiceId = createInvoice(item, 'Order Placed');
                                                                    Inputs.findOne({ id: inputId }).then(function (input) {
                                                                        let data = {};
                                                                        data.availableQuantity = input.availableQuantity - qty;
                                                                        data.soldQuantity = input.soldQuantity + qty;
                                                                        console.log("quantity", data);
                                                                        Inputs.update({ id: input.id }, data).then(function (inputUpdate) {
                                                                            console.log("inputUpdate", inputUpdate);

                                                                            //start sms
                                                                            // seller sms integration
                                                                            if (item.paymentMode == "PayTm") {

                                                                                Users.findOne({ id: order.buyer }).then(function (buyeruser) {
                                                                                    let buyersmsInfo = {}
                                                                                    buyersmsInfo.numbers = [buyeruser.mobile]
                                                                                    buyersmsInfo.variables = variables = {
                                                                                        "{#AA#}": item.name, "{#BB#}": item.code, "{#CC#}": item.producutId, "{#EE#}": item.paymentsData.id
                                                                                        , "{#DD#}": item.amount
                                                                                    }
                                                                                    buyersmsInfo.templateId = "24503"

                                                                                    commonService.sendGeneralSMS(buyersmsInfo)

                                                                                    // franchisee sms integration
                                                                                    Market.findOne({ id: item.market })
                                                                                        .populate("GM").then(function (marketuser) {
                                                                                            let franchsmsInfo = {}
                                                                                            franchsmsInfo.numbers = [marketuser.GM.mobile]
                                                                                            franchsmsInfo.variables = {
                                                                                                "{#BB#}": item.code, "{#CC#}": item.name, "{#DD#}": item.producutId, "{#EE#}": item.paymentsData.id
                                                                                                , "{#FF#}": item.amount
                                                                                            }
                                                                                            franchsmsInfo.templateId = "24505"

                                                                                            commonService.sendGeneralSMS(franchsmsInfo);
                                                                                            callback();
                                                                                        })

                                                                                })

                                                                            }
                                                                            // end sms

                                                                            callback();
                                                                        })

                                                                    })


                                                                }, function (error) {
                                                                    if (error) {
                                                                        return false;
                                                                    } else {



                                                                        if (destroy) {
                                                                            if (origin) {                            
                                                                                let url = origin + '/payments/success/' + order.id + '/' + paymentsData.id + "?module=order&code=" + orderId;
                                                                                return res.redirect(url);
                                                                            } else {
                                                                                return res.jsonx({
                                                                                    success: true,
                                                                                    code: 200,
                                                                                    data: {
                                                                                        order: order
                                                                                    },
                                                                                });
                                                                            }
                                                                        } else {
                                                                            if (origin) {                            
                                                                                let url = origin + '/payments/success/' + order.id + '/' + paymentsData.id + "?module=order&code=" + orderId;
                                                                                return res.redirect(url);
                                                                            } else {
                                                                                return res.jsonx({
                                                                                    success: true,
                                                                                    code: 200,
                                                                                    data: {
                                                                                        order: order
                                                                                    },
                                                                                });
                                                                            }
                                                                        }
                                                                    }
                                                                });
                                                            })
                                                        })
                                                    } else {
                                                        if (origin) {                            
                                                            let url = origin + '/payments/success/' + order.id + '/' + paymentsData.id + "?module=order&code=" + orderId;
                                                            return res.redirect(url);
                                                        } else {
                                                            return res.jsonx({
                                                                success: true,
                                                                code: 200,
                                                                data: {
                                                                    order: order
                                                                },
                                                            });
                                                        }
                                                    }
                                                })
                                            } else {
                                                if (origin) {                            
                                                    let url = origin + '/payments/success/' + order.id + '/' + paymentsData.id + "?module=order&code=" + orderId;
                                                    return res.redirect(url);
                                                } else {
                                                    return res.jsonx({
                                                        success: true,
                                                        code: 200,
                                                        data: {
                                                            order: order
                                                        },
                                                    });
                                                }
                                            }
                                        })
                                    })
                                })
                            } else {
                                if (origin) {                            
                                    let url = origin + '/payments/failure/' + orderId + "?module=order&code=" + orderId
                                    return res.redirect(url);
                                } else {
                                    return res.jsonx({
                                        success: false,
                                        error: {
                                            code: 400,
                                            message: "Unsuccessful Transaction"
                                        },
                                    });
                                }
                            }
                        })
                    } else {
                        if (origin) {                            
                            let url = origin + '/payments/failure/' + orderId + "?module=order&code=" + orderId
                            return res.redirect(url);
                        } else {
                            return res.jsonx({
                                success: false,
                                error: {
                                    code: 400,
                                    message: "Unsuccessful Transaction"
                                },
                            });
                        }
                    }
                })
            }).fail(function (err) {
                if (origin) {                    
                    let url = origin + '/payments/failure/' + orderId + "?module=order&code=" + orderId
                    return res.redirect(url);
                } else {
                    return res.jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: "Unsuccessful Transaction"
                        },
                    });
                }
            });
        } else {
            if (origin) {                
                let url = origin + '/payments/failure/' + orderId + "?module=order&code=" + orderId
                return res.redirect(url);
            } else {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: "Unsuccessful Transaction"
                    },
                });
            }
            // Orders.update({
            //     code: orderId
            // }, { paymentStatus: 0, status: "Failed" }).then(function (orderUpdateArr) {
            //     let orderId = orderUpdateArr[0].id;
            //     Orderedcarts.update({
            //         order: { $in: [orderId] }
            //     }, { status: "Failed" }).then(function (suborderArr) {

            //         Carts.destroy({
            //             user: userId
            //         }).exec(function (err) {
            //             if (err) { return res.negotiate(err); }

            //             let url = origin + '/#/payments/failure/' + orderId
            //             return res.redirect(url);
            //         });

            //     });

            // });
        }

    },

    orderRefundAmount: (data, context, req, res) => {
        var request = require('request-promise');

        console.log("data = ", data)

        Orderedcarts.findOne({ id: data.id }).then(function (orderData) {
            console.log("orderData = ", orderData)
            var envPaytm = req.param('env') // "development" "production";
            var orderId = orderData.order// main order id
            data.id = req.param("id");// sub order id
            let refundBy = req.identity.id

            var findTransactionQry = {}
            findTransactionQry.order = orderId
            findTransactionQry.paymentType = "PayTm"
            findTransactionQry.processStatus = "TXN_SUCCESS"
            findTransactionQry.status = {$ne:'RF'};

            console.log("findTransactionQry == ", findTransactionQry)

            if (orderId != undefined && data.id != undefined) {
                Transactions.findOne(findTransactionQry).then(function (bidTransactions) {
                    if (bidTransactions) {                           
                        let paidAmountt = {}
                        paidAmountt.paymentMode = 'PayTm'
                        paidAmountt.status = 'Verified'
                        paidAmountt.suborder = data.id

                        Bidspayment.findOne(paidAmountt).then(function (paidAmount) {
                            if (paidAmount && paidAmount.amount > 0) {

                                let REFUNDCode = commonServiceObj.getRefundCode("REFID");
                                var paramlist = {};

                                paramlist['MID'] = bidTransactions.paymentjson.MID;
                                paramlist['TXNID'] = bidTransactions.paymentjson.TXNID;
                                paramlist['ORDERID'] = bidTransactions.paymentjson.ORDERID;
                                paramlist['REFUNDAMOUNT'] = paidAmount.amount;
                                paramlist['TXNTYPE'] = "REFUND";
                                paramlist["REFID"] = REFUNDCode;
                                let paytm_key = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;

                                Payments.genchecksumforrefund(paramlist, paytm_key, (err, JsonData) => {

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
                                            let transactionData = {}
                                            transactionData.order = orderId
                                            transactionData.suborder = data.id
                                            transactionData.processedBy = refundBy;
                                            transactionData.status = 'RF';
                                            transactionData.transactionType = 'DebitEscrow';
                                            transactionData.processStatus = info.RESPMSG;
                                            transactionData.payTmRefundId = info.REFUNDID;
                                            transactionData.refundjson = info;
                                            Transactions.create(transactionData).then(function (transaction) {
                                                let paidUpdate = paidAmount
                                                paidUpdate.status = 'RefundVerified'
                                                paidUpdate.isVerified = true                                                
                                                paidUpdate.refundBy = refundBy
                                                paidUpdate.paymentDate = new Date()
                                                paidUpdate.transactionId = transaction.id
                                                paidUpdate.payTo = 'Buyer'
                                                delete paidUpdate.id

                                                let duePayments = {}
                                                duePayments.$or = [{status:'Due'},{status:'Overdue'}]
                                                duePayments.suborder = data.id

                                                Bidspayment.destroy(duePayments).then(function () {
                                                    Sellerpayment.destroy(duePayments).then(function () {
                                                        let paidPayments = {}
                                                        paidPayments.suborder = data.id
                                                        paidPayments.paymentMode = {$ne:'PayTm'}
                                                        paidPayments.$or = [{status:'Paid'},{status:'Verified'}]

                                                        Bidspayment.update(paidPayments,{status:'Refund'}).then(function (refundPayments) {
                                                            Sellerpayment.update(paidPayments,{status:'Refund'}).then(function (refundPayments) {
                                                                Bidspayment.create(paidUpdate).then(function (pp) {
                                                                    let orderStatusHistory = {}
                                                                    orderStatusHistory.order = orderData.order;
                                                                    orderStatusHistory.suborder = orderData.id;
                                                                    orderStatusHistory.input = orderData.productId;
                                                                    orderStatusHistory.updatedBy = refundBy;
                                                                    orderStatusHistory.comment = "Rejected by Seller";
                                                                    console.log("orderStatusHistory == ", orderStatusHistory)
                                                                    
                                                                    Ordershistory.create(orderStatusHistory).then(function (orderhistory) {                                                                                                                                                                                                    
                                                                        let inputId = orderData.input;
                                                                        Inputs.findOne({ id: inputId }).then(function (input) {
                                                                            console.log("orderData == ", input)
                                                                            console.log("input == ", orderData.quantity)
                                                                            console.log("input == ", input.leftAfterAcceptanceQuantity)
                                                                            console.log("input == ", input.leftAfterDeliveryQuantity)

                                                                            let quantity = input.quantity + orderData.quantity;
                                                                            let soldQuantity = input.soldQuantity - orderData.quantity;
                                                                            let leftAfterAcceptanceQuantity = input.availableQuantity + parseFloat(orderData.quantity)
                                                                            console.log("leftAfterAcceptanceQuantity == ", leftAfterAcceptanceQuantity)

                                                                            Inputs.update({ id: input.id }, { quantity: quantity, soldQuantity: soldQuantity , availableQuantity: leftAfterAcceptanceQuantity}).then(function () {
                                                                                return res.jsonx({
                                                                                    success: true,
                                                                                    code: 200,
                                                                                    data: {
                                                                                        order: orderData,
                                                                                        message: "Your refund process successfully initiate",
                                                                                    },
                                                                                });
                                                                            })                                                                        
                                                                        })
                                                                    })
                                                                })
                                                            })
                                                        })
                                                    })
                                                })
                                            })
                                        } else {
                                            return res.jsonx({
                                                success: false,
                                                error: {
                                                    code: 400,
                                                    message: info.RESPMSG
                                                },
                                            });
                                        }
                                    }).catch(function (err) {
                                        return res.jsonx({
                                            success: false,
                                            error: err
                                        })
                                    });
                                });
                            } else {
                                return res.jsonx({
                                    success: false,
                                    error: {
                                        code: 400,
                                        message: "payment not found"
                                    },
                                });
                            }
                        });                        
                    } else {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: "transaction not found"
                            },
                        });
                    }
                })
            } else {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: "order not found"
                    },
                });
            }
        })
    }
};

createInvoice = function (order, message) {
    var d = new Date();
    var month = d.getMonth();
    var year = d.getFullYear();

    var yrStore = ""
    if (month < 3) {
        yrStore = (year - 1).toString().substr(-2) + "-" + year.toString().substr(-2)
    } else {
        yrStore = year.toString().substr(-2) + "-" + (year + 1).toString().substr(-2)
    }
    var data = {}

    return Invoice.findOne({ suborder: order.id }).sort('number DESC').then(function (invoices) {
        if (invoices) {
            if (invoices.length > 0) {
                let invoice = invoices[0]
                numberToAssign = invoice.number + 1
            }
            data.invoice = invoices.id
            data.number = numberToAssign
            return Orderedcarts.update({ id: order.id }, data).then(function (order) {
                return true;
            })
        } else {
            let numberToAssign = 1


            let createInvoiceData = {}
            createInvoiceData.type = "order"
            createInvoiceData.orderId = order.order
            createInvoiceData.suborder = order.id
            createInvoiceData.number = numberToAssign
            createInvoiceData.financialYear = yrStore
            return Invoice.create(createInvoiceData).then(function (createdInvoice) {
                data.invoice = createdInvoice.id
                if (data.invoice) {
                    return Orderedcarts.update({ id: order.id }, data).then(function (order) {
                        return true;
                    })
                } else {
                    return false;
                }
            })


        }
    })

}