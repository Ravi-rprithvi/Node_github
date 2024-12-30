var constantObj = sails.config.constants;
var commonServiceObj = require('../services/commonService.js');
var moment = require('moment')
/**
 * InvoiceController
 *
 * @description :: Server-side logic for managing bids
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var ObjectId = require('mongodb').ObjectID;

module.exports = {
	fieldtransactionpaymentInvoice: function (req, res) {
		let invioceData = {};
		var bidId = req.param('id');
		FieldTransactions.findOne({ id: bidId }).populate('invoice').then(function (invioce) {
			if (invioce.receivedQuantityStatus == undefined) {
				invioce.receivedQuantityStatus = null
			}
			invioceData = invioce;
			if (invioceData.invoice == undefined) {
				let createInvoiceData = {}
				createInvoiceData.type = 'transaction'
				createInvoiceData.bidId = invioceData.id
				createInvoiceData.number = invioceData.code
				var d = new Date(invioce.createdAt);
				var month = d.getMonth();
				var year = d.getFullYear();

				var yrStore = ""
				if (month < 3) {
					yrStore = (year - 1).toString().substr(-2) + "-" + year.toString().substr(-2)
				} else {
					yrStore = year.toString().substr(-2) + "-" + (year + 1).toString().substr(-2)
				}
				createInvoiceData.financialYear = yrStore
				createInvoiceData.createdAt = invioceData.createdAt
				invioceData.invoice = createInvoiceData
			}

			return res.jsonx({
				success: true,
				data: invioceData
			});
		})
	},
	paymentOrderInvoice: function (req, res) {
		let invioceData = {};
		var bidId = req.param('id');
		Orderedcarts.findOne({ id: bidId }).populate("crop", { select: ['seller', 'name', 'state', 'district', 'address', 'city', 'pincode'] })
			.populate("user", { select: ['fullName', 'state', 'district', 'address', 'city', 'pincode'] })
			.populate('logisticId')
			.populate('order', { select: ['code'] })
			.populate('buyerPayments')
			.populate('invoice')
			.then(function (invioce) {

				if (invioce.receivedQuantityStatus == undefined) {
					invioce.receivedQuantityStatus = null
				}
				invioceData = invioce;
				if (invioceData.invoice == undefined) {
					let createInvoiceData = {}
					createInvoiceData.type = 'order'
					createInvoiceData.suborder = invioceData.id
					createInvoiceData.orderId = invioceData.order
					createInvoiceData.number = invioceData.code
					var d = new Date(invioce.createdAt);
					var month = d.getMonth();
					var year = d.getFullYear();

					var yrStore = ""
					if (month < 3) {
						yrStore = (year - 1).toString().substr(-2) + "-" + year.toString().substr(-2)
					} else {
						yrStore = year.toString().substr(-2) + "-" + (year + 1).toString().substr(-2)
					}

					createInvoiceData.financialYear = yrStore
					createInvoiceData.createdAt = invioceData.createdAt
					invioceData.invoice = createInvoiceData
				}

				Users.findOne({ id: invioceData.crop.seller }).then(function (sellerData) {
					invioceData["sellerInfo"] = sellerData;
					return res.jsonx({
						success: true,
						data: invioceData
					});
				});

			})
	},
	paymentLandDeaInvoice: function (req, res) {
		let invioceData = {};
		var bidId = req.param('id');
		Landinterests.findOne({ id: bidId }).populate("landId", { select: ['user', 'code', 'state', 'district', 'address', 'city', 'pincode'] })
			.populate("buyerId", { select: ['fullName', 'state', 'district', 'address', 'city', 'pincode'] })
			.populate("sellerId", { select: ['fullName', 'state', 'district', 'address', 'city', 'pincode'] })
			.populate('buyerPayment')
			.populate('invoice')
			.then(function (invioce) {

				invioceData = invioce;
				if (invioceData.invoice == undefined) {
					let createInvoiceData = {}
					createInvoiceData.type = 'landinterest'
					createInvoiceData.landdeal = invioceData.id
					createInvoiceData.number = invioceData.code
					var d = new Date(invioce.createdAt);
					var month = d.getMonth();
					var year = d.getFullYear();

					var yrStore = ""
					if (month < 3) {
						yrStore = (year - 1).toString().substr(-2) + "-" + year.toString().substr(-2)
					} else {
						yrStore = year.toString().substr(-2) + "-" + (year + 1).toString().substr(-2)
					}
					createInvoiceData.financialYear = yrStore
					createInvoiceData.createdAt = invioceData.createdAt
					invioceData.invoice = createInvoiceData
				}

				invioceData["sellerInfo"] = invioceData.sellerId;
				delete invioceData.sellerId
				return res.jsonx({
					success: true,
					data: invioceData
				});
			})
	},


	paymentInvoice: function (req, res) {
		let invioceData = {};
		var bidId = req.param('id');
		Bids.findOne({ id: bidId }).populate("crop", { select: ['seller', 'name', 'state', 'district', 'address', 'city', 'pincode'] })
			.populate("user", { select: ['fullName', 'state', 'district', 'address', 'city', 'pincode'] })
			.populate('logisticId')
			.populate('buyerpayments')
			.populate('invoice')
			.then(function (invioce) {

				if (invioce.receivedQuantityStatus == undefined) {
					invioce.receivedQuantityStatus = null
				}
				invioceData = invioce;
				if (invioceData.invoice == undefined) {
					let createInvoiceData = {}
					createInvoiceData.type = 'bid'
					createInvoiceData.bidId = invioceData.id
					createInvoiceData.number = invioceData.code
					createInvoiceData.financialYear = "u19-20"
					createInvoiceData.createdAt = invioceData.createdAt
					invioceData.invoice = createInvoiceData
				}

				Users.findOne({ id: invioceData.crop.seller }).then(function (sellerData) {
					invioceData["sellerInfo"] = sellerData;
					return res.jsonx({
						success: true,
						data: invioceData
					});
				});

			})
	},

	orderInvoice: function (req, res) {
		let invioceData = {};
		var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
		var orderId = req.param('id');
		console.log(orderId, "order")
		Orderedcarts.findOne({ id: orderId })
			.populate("input", { select: ['seller', 'code', 'name', 'state', 'district', 'address', 'city', 'pincode'] })
			.populate("user", { select: ['fullName', 'state', 'district', 'address', 'city', 'pincode'] })
			.populate("market", { select: ['name', 'GM'] })
			//.populate('logisticId')
			.populate('buyerPayments')
			.populate('invoice')
			.populate('seller', { select: ['fullName', 'state', 'district', 'address', 'city', 'pincode'] })

			.then(function (invioce) {
				// console.log(invioce, "orderinvoice");
				// return 1;
				if (invioce.receivedQuantityStatus == undefined) {
					invioce.receivedQuantityStatus = null
				}
				invioceData = invioce;
				if (invioceData.invoice == undefined) {
					let createInvoiceData = {}
					createInvoiceData.type = 'input'
					createInvoiceData.id = invioceData.id
					createInvoiceData.number = invioceData.code
					createInvoiceData.financialYear = "u20-21"
					createInvoiceData.createdAt = invioceData.createdAt
					invioceData.invoice = createInvoiceData
				}

				Users.findOne({ id: invioceData.input.seller }).then(function (sellerData) {
					invioceData["sellerInfo"] = sellerData;

					let cartsSelectedMarkets = []
					cartsSelectedMarkets.push(invioce.market)
					cartsSelectedMarkets = _.indexBy(cartsSelectedMarkets, 'GM');
					//console.log(cartsSelectedMarkets, "cartsSelectedMarkets");
					var user = Users.findOne({ id: _.pluck(cartsSelectedMarkets, 'GM'), select: ['fullName', 'address', 'city', 'district', 'state', 'pincode'] }).then(function (marketGM) {

						return marketGM
					});

					return [invioceData, user]

				}).spread(function (invioceData, user) {
					invioceData.market.GM = user
					return res.jsonx({
						success: true,
						data: invioceData
					});
				})

			})
	}

}
