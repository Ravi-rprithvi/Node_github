var Promise = require('bluebird'),
	promisify = Promise.promisify;
var constantObj = sails.config.constants;
var commonServiceObj = require('./commonService');
var ObjectId = require('mongodb').ObjectID;

module.exports = {

	saveCart: function (data, context) {
		return checkPost(save, data);
	},

	updateCart: function (data, context) {
		return checkPost(update, data);
	},

	myCart: function (data, context) {
		let loggedIn = context.identity.id;
		console.log(loggedIn, '===');
		let inputFields = ['name', 'finalPrice', 'coverPageImage', 'depositPayment', 'finalPaymentPercentage', 'finalPaymentDays']
		return CartService.usercart(data, context, inputFields, loggedIn)
	},

	userCart: function (data, context) {
		console.log("data", data)
		if (data.userId) {
			let user = data.userId;
			let inputFields = ['name', 'finalPrice', 'coverPageImage', 'depositPayment', 'finalPaymentPercentage', 'finalPaymentDays']
			return CartService.usercart(data, context, inputFields, user)
		} else {
			return {
				success: false,
				error: {
					code: 400,
					message: 'Please send user id'
				},
			};
		}
	},

	usercart: function (data, context, extrainputFields, forUser) {
		let loggedIn = forUser;
		let requiredInputField = ['isDeleted', 'isApproved', 'isExpired', 'isActive', 'availableQuantity', 'earnestPercent', 'price', 'franchiseePercentage']
		var inputFields = extrainputFields.concat(requiredInputField);
		return Carts.find({ user: loggedIn, productType: 'INPUT' }).sort('createdAt ASC').populate('selectedMarket', { select: ['name', 'GM'] }).populate('input', { select: inputFields }).then(function (carts) {
			//console.log("carts", carts)
			if (carts === undefined) {
				return {
					success: true,
					code: 200,
					data: [],
					totalAmount: 0,
					amountToPay: 0
				};
			} else {
				let cartsSelectedMarkets = []
				let cartsInputIds = []
				for (var i = 0; i < carts.length; i++) {
					cartsSelectedMarkets.push(carts[i].selectedMarket)

					cartsInputIds.push({ id: carts[i].input.id })
				}

				var user = Users.find({ id: _.pluck(cartsSelectedMarkets, 'GM'), select: ['fullName', 'address', 'city', 'district', 'state', 'pincode'] }).then(function (marketGM) {
					return marketGM
				});

				var allPrices = ProductMarketPrice.find({ input: _.pluck(cartsInputIds, 'id'), productType: 'INPUT', select: ['market', 'price', 'input'] }).populate('market', { select: ['name', 'pincode', 'GM'] }).then(function (allPrices) {
					let allPricesMarkets = []
					for (var i = 0; i < allPrices.length; i++) {
						allPricesMarkets.push(allPrices[i].market)
					}
					var allPricesMarketsGM = Users.find({ id: _.pluck(allPricesMarkets, 'GM'), select: ['fullName', 'address', 'city', 'district', 'state', 'pincode'] }).then(function (allPricesMarketsGM) {
						return allPricesMarketsGM
					});
					return [allPrices, allPricesMarketsGM]
				}).spread(function (allPrices, allPricesMarketsGM) {
					allPricesMarketsGM = _.indexBy(allPricesMarketsGM, 'id');
					allPrices = _.map(allPrices, function (allPrice) {
						allPrice.market.GM = allPricesMarketsGM[allPrice.market.GM]
						return allPrice
					});
					return allPrices
				});

				var selectedPrice = ProductMarketPrice.find({ input: _.pluck(cartsInputIds, 'id'), productType: 'INPUT', market: _.pluck(cartsSelectedMarkets, 'id'), select: ['price', 'market', 'input'] }).then(function (selectedPrice) {
					return selectedPrice
				});
				return [carts, user, allPrices, selectedPrice]
			}
		}).spread(function (carts, user, allPrices, selectedPrice) {

			user = _.indexBy(user, 'id');
			selectedPrice = _.indexBy(selectedPrice, 'input');
			allPrices = _.groupBy(allPrices, 'input');

			let totalAmountOfCart = 0
			let amountToBePaid = 0
			carts = _.map(carts, function (cart) {
				if (user[cart.selectedMarket.GM] != undefined) {
					cart.selectedMarket.GM = user[cart.selectedMarket.GM]
				}

				cart.input.availableMarkets = allPrices[cart.input.id]
				cart.selectedMarketPricing = selectedPrice[cart.input.id].price
				cart.totalAmount = parseFloat((cart.selectedMarketPricing * cart.quantity).toFixed(2))
				if (cart.input.isDeleted == false && cart.input.isApproved == true && cart.input.isExpired == false && cart.input.isActive == true && cart.input.availableQuantity >= cart.quantity) {
					cart.input.inStock = true
					cart.inStock = true
					totalAmountOfCart = totalAmountOfCart + cart.totalAmount
					if (cart.paymentMethod == 'ADVANCE') {
						cart.amountToBePaid = cart.totalAmount
						amountToBePaid = amountToBePaid + cart.amountToBePaid
					} else if (cart.paymentMethod == 'STEP') {
						cart.amountToBePaid = parseFloat(((cart.input.earnestPercent / 100) * cart.totalAmount).toFixed(2))
						amountToBePaid = amountToBePaid + cart.amountToBePaid
					} else {
						cart.amountToBePaid = parseFloat(0.00)
					}
				} else {
					cart.input.inStock = false
					cart.inStock = false
				}

				return cart
			});

			return {
				success: true,
				code: 200,
				data: carts,
				totalAmount: parseFloat((totalAmountOfCart).toFixed(2)),
				amountToPay: parseFloat((amountToBePaid).toFixed(2))
			};
		})
	},

	usercartAmountToPay: function (forUser) {
		let loggedIn = forUser;
		let inputFields = ['isDeleted', 'isApproved', 'isExpired', 'isActive', 'availableQuantity', 'earnestPercent']

		return Carts.find({ user: loggedIn, productType: 'INPUT' }).sort('createdAt ASC').populate('selectedMarket', { select: ['name', 'GM'] }).populate('input', { select: inputFields }).then(function (carts) {
			console.log("carts ===", carts)
			if (carts === undefined) {
				return {
					amountToPay: 0
				};
			} else {
				let cartsSelectedMarkets = []
				let cartsInputIds = []
				for (var i = 0; i < carts.length; i++) {
					cartsSelectedMarkets.push(carts[i].selectedMarket)
					cartsInputIds.push({ id: carts[i].input.id })
				}

				var selectedPrice = ProductMarketPrice.find({ input: _.pluck(cartsInputIds, 'id'), productType: 'INPUT', market: _.pluck(cartsSelectedMarkets, 'id'), select: ['price', 'input'] }).then(function (selectedPrice) {
					return selectedPrice
				});
				return [carts, selectedPrice]
			}
		}).spread(function (carts, selectedPrice) {

			selectedPrice = _.indexBy(selectedPrice, 'input');

			let amountToBePaid = 0
			var totalAmountOfCart = 0
			carts = _.map(carts, function (cart) {
				cart.selectedMarketPricing = selectedPrice[cart.input.id].price
				cart.totalAmount = parseFloat((cart.selectedMarketPricing * cart.quantity).toFixed(2))
				if (cart.input.isDeleted == false && cart.input.isApproved == true && cart.input.isExpired == false && cart.input.isActive == true && cart.input.availableQuantity >= cart.quantity) {
					cart.input.inStock = true
					cart.inStock = true
					totalAmountOfCart = totalAmountOfCart + cart.totalAmount
					if (cart.paymentMethod == 'ADVANCE') {
						cart.amountToBePaid = cart.totalAmount
						amountToBePaid = amountToBePaid + cart.amountToBePaid
					} else if (cart.paymentMethod == 'STEP') {
						cart.amountToBePaid = parseFloat(((cart.input.earnestPercent / 100) * cart.totalAmount).toFixed(2))
						amountToBePaid = amountToBePaid + cart.amountToBePaid
					}
				}

				return cart
			});
			console.log("amountToBePaid---", amountToBePaid);

			return {
				amountToPay: parseFloat((amountToBePaid).toFixed(2))
			};
		})
	},

	createorder: function (data, context, req, res) {

		let loggedIn = context.identity.id;
		let inputFields = ['dealer', 'finalPrice', 'depositPayment', 'finalPaymentPercentage', 'finalPaymentDays', 'taxRate', 'taxes', 'productTaxes', 'productTaxRate', 'efarmxComission', 'shippingPrice', 'franchiseePercentage', 'sellerUpfrontPercentage', 'sellerUpfrontDays', 'sellerFinalPercentage', 'sellerFinalDays', 'sellerDepositPayment']

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
					orderInfo.buyer = loggedIn
					orderInfo.market = cat.selectedMarket;
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
				if (carts.amountToPay == 0) {
					let orderData = {};
					let orderCode = commonServiceObj.getUniqueCodeString();
					orderData.code = "ORD_" + orderCode
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
					orderData.totalBidEarnestAmount = carts.amountToPay
					orderData.totalProductTaxAmount = carttotalProductTax

					Orders.create(orderData).then(function (order) {
						if (order) {
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

									allBuyerPayments.push(buyerFinalInfo)

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
								}

								if (inStockproduct.input.sellerUpfrontPercentage && inStockproduct.input.sellerUpfrontPercentage > 0) {
									let sellerUpfrontInfo = {}
									sellerUpfrontInfo.input = inStockproduct.input.id
									sellerUpfrontInfo.productType = 'input'
									sellerUpfrontInfo.order = order.id
									sellerUpfrontInfo.suborder = sorder.code
									sellerUpfrontInfo.sellerId = inStockproduct.input.dealer
									sellerUpfrontInfo.buyerId = loggedIn
									sellerUpfrontInfo.amount = sellerAmount * (inStockproduct.input.sellerUpfrontPercentage / 100)
									sellerUpfrontInfo.originalAmount = sellerAmount * (inStockproduct.input.sellerUpfrontPercentage / 100)
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
										sellerUpfrontInfo.input = sorder.input.id
										sellerUpfrontInfo.productType = 'input'
										sellerUpfrontInfo.order = order.id
										sellerUpfrontInfo.suborder = sorder.code
										sellerUpfrontInfo.sellerId = inStockproduct.input.dealer
										sellerUpfrontInfo.buyerId = loggedIn
										sellerUpfrontInfo.amount = sellerAmount * (deposit.percentage / 100)
										sellerUpfrontInfo.originalAmount = sellerAmount * (deposit.percentage / 100)
										if (inStockproduct.pincode) {
											sellerUpfrontInfo.pincode = inStockproduct.pincode
										}

										sellerUpfrontInfo.type = 'Upfront'
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
									//console.log("sellerAmount", sellerAmount);
									sellerUpfrontInfo.amount = sellerAmount * (inStockproduct.input.sellerFinalPercentage / 100)
									sellerUpfrontInfo.originalAmount = sellerAmount * (inStockproduct.input.sellerFinalPercentage / 100)
									if (inStockproduct.pincode) {
										sellerUpfrontInfo.pincode = inStockproduct.pincode
									}

									sellerUpfrontInfo.type = 'Upfront'
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
												let framxP =
													new Promise(function (resolve, reject) {
														let p = FarmxPayment.create(allFarmxPayments);
														if (p) {
															resolve(p)
														} else {
															reject({ error: 'something wrong' });
														}
													})
												framxP.then(function (framxP) {
													Carts.destroy({ id: removeCartIds }).then(function (destroy) {

														//  update available and sold quantity
														async.each(suborders, function (item, callback) {
															var invoiceId = createInvoice(item, 'Order Placed');
															let qty = item.quantity;
															let inputId = item.productId;
															Inputs.findOne({ id: inputId }).then(function (input) {
																let data = {};
																data.availableQuantity = input.availableQuantity - qty;
																data.soldQuantity = input.soldQuantity + qty;
																console.log("quantity11", data);
																Inputs.update({ id: input.id }, data).then(function (inputUpdate) {
																	console.log("inputUpdateqty", inputUpdate);

																	//start sms
																	// seller sms integration
																	Users.findOne({ id: item.seller }).then(function (selleruser) {
																		let sellersmsInfo = {}
																		sellersmsInfo.numbers = [selleruser.mobile]
																		sellersmsInfo.variables = { "{#BB#}": item.code, "{#CC#}": item.productId, "{#DD#}": item.amount }
																		sellersmsInfo.templateId = "24488"

																		commonService.sendGeneralSMS(sellersmsInfo)

																		// franchisee sms integration
																		Market.findOne({ id: item.market })
																			.populate("GM").then(function (marketuser) {
																				let franchsmsInfo = {}
																				franchsmsInfo.numbers = [marketuser.GM.mobile]
																				franchsmsInfo.variables = { "{#BB#}": item.code, "{#CC#}": item.amount, "{#DD#}": item.producutId }
																				franchsmsInfo.templateId = "24502"

																				commonService.sendGeneralSMS(franchsmsInfo)
																				// end sms

																				callback();
																			})


																	})





																})

															})


														}, function (error) {
															if (error) {
																return false;
															} else {
																if (destroy) {
																	//for buyer sms inegration=============

																	Users.findOne({ id: order.buyer }).then(function (buyeruser) {
																		let buyersmsInfo = {}
																		buyersmsInfo.numbers = [buyeruser.mobile]
																		buyersmsInfo.variables = { "{#BB#}": order.code, "{#CC#}": order.totalAmount }
																		buyersmsInfo.templateId = "24501"

																		commonService.sendGeneralSMS(buyersmsInfo)

																		return res.jsonx({
																			success: true,
																			data: {
																				order: order,
																				message: "Order placed successfully"
																			},
																		});

																	})

																} else {
																	return res.jsonx({
																		success: true,
																		data: {
																			order: order,
																			message: "No item in cart"
																		},
																	});
																}
															}
														})
													})
												})



											} else {
												return res.jsonx({
													success: false,
													error: {
														code: 400,
														message: 'Error occured in payments'
													},
												});
											}
										})
									} else {
										return res.jsonx({
											success: false,
											error: {
												code: 400,
												message: 'Error occured in payments'
											},
										});
									}
								})
							})
						} else {
							return res.jsonx({
								success: false,
								error: {
									code: 400,
									message: 'Error occured while creating order'
								},
							});
						}
					})
				} else {
					return res.jsonx({
						success: false,
						error: {
							code: 400,
							message: 'Please pay your checkout amount'
						},
					});
				}
			} else {
				return res.jsonx({
					success: false,
					error: {
						code: 400,
						message: 'No object to order'
					},
				});
			}
		})
	},
}

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

},
	checkPost = function (callback, data) {
		var query = { user: data.user };
		if (!data.id) {
			if (data.productType == "INPUT") {
				data.input = data.product;
				query.input = data.product;
			}
			else if (data.productType == "EQUIPMENT") {
				data.equipment = data.product;
				query.equipment = data.product;
			}

			delete data.product;

			return Carts.findOne(query).then(function (cart) {

				if (cart) {

					data.id = cart.id;
					data.quantity = cart.quantity + 1;

					return update(data);

					/*return {
							success: false,
							error: {
							code: 400,
							message: constantObj.cart.CART_ALREADY_EXIST
						},
					};*/

				} else {
					return callback(data);
				}
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
			return callback(data);
		}
	},

	save = function (data) {

		return Carts.create(data).then(function (cart) {
			return {
				success: true,
				code: 200,
				data: {
					cart: cart,
					message: constantObj.cart.SAVED_CART,
					key: 'SAVED_CART',
				},
			};
		})
			.fail(function (err) {
				return {
					success: false,
					error: {
						code: 400,
						message: err
					},
				};
			});
	},

	update = function (data) {

		return Carts.update({ id: data.id }, data).then(function (cart) {

			return {
				success: true,
				code: 200,
				data: {
					cart: cart,
					message: constantObj.cart.UPDATED_CART,
					key: 'UPDATED_CART',
				},
			};
		})
			.fail(function (err) {
				return {
					success: false,
					error: {
						code: 400,
						message: err

					},
				};
			});
	}