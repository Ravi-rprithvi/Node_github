var constantObj = sails.config.constants;
var commonServiceObj = require('../services/commonService.js');
var pushService = require('../services/PushService.js');
var moment = require('moment')
/**
 * FieldTransactionsController
 *
 * @description :: Server-side logic for managing bids
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var ObjectId = require('mongodb').ObjectID;

module.exports = {
	assignLogisticAndDeliveryTimeForTransaction: function (req, res) {
		return API(FieldTransactionsService.assignLogisticAndDeliveryTimeForTransaction, req, res);
	},
	addRequirement: function (req, res) {
		API(FieldTransactionsService.addRequirement, req, res);
	},

	updateRequirement: function (req, res) {
		API(FieldTransactionsService.updateRequirement, req, res);
	},

	approve: function (req, res) {
		API(FieldTransactionsService.approve, req, res);
	},

	fulfillWithAdvance: function (req, res) {
		API(FieldTransactionsService.fulfillWithAdvance, req, res);
	},

	fulfill: function (req, res) {
		API(FieldTransactionsService.fulfill, req, res);
	},

	fulfillAfterAdvance: function (req, res) {
		API(FieldTransactionsService.fulfillAfterAdvance, req, res);
	},

	cancel: function (req, res) {
		API(FieldTransactionsService.cancel, req, res);
	},

	receive: function (req, res) {
		API(FieldTransactionsService.receive, req, res);
	},

	list: function (req, res) {
		API(FieldTransactionsService.list, req, res);
	},

	get: function (req, res) {
		API(FieldTransactionsService.get, req, res);
	},

	receiveBuyerPayment: function (req, res) {
		API(FieldTransactionsService.receiveBuyerPayment, req, res);
	},

	receiveSellerPayment: function (req, res) {
		API(FieldTransactionsService.receiveSellerPayment, req, res);
	},

	receiveLogisticPayment: function (req, res) {
		API(FieldTransactionsService.receiveLogisticPayment, req, res);
	},

	changestakeholders: function (req, res) {
		API(FieldTransactionsService.changestakeholders, req, res);
	},

	complete: function (req, res) {
		API(FieldTransactionsService.complete, req, res);
	},

	createchild: function (req, res) {
		API(FieldTransactionsService.createchild, req, res);
	},

	sellerAmountModify: function (req, res) {
		API(FieldTransactionsService.sellerAmountModify, req, res);
	},

	addFranchiseeLogistics: function (req, res) {
		API(FieldTransactionsService.addFranchiseeLogistics, req, res);
	},

	addFarmxLogistics: function (req, res) {
		API(FieldTransactionsService.addFarmxLogistics, req, res);
	},

	updateGRN: function (req, res) {
		API(FieldTransactionsService.updateGRN, req, res);
	},

	verifyBuyerPayment: function (req, res) {
		API(FieldTransactionsService.verifyBuyerPayment, req, res);
	},

	deleteTransaction: function (req, res) {
		API(FieldTransactionsService.deleteTransaction, req, res);
	},

	transactionlogisticConfirmedDashboard: function (req, res) {
		var qry = {};

		qry.$and = [{
			createdAt: {
				$gte: new Date(req.param('from'))
			}
		}, {
			createdAt: {
				$lte: new Date(req.param('to'))
			}
		}]
		qry.$or = [{status:'Approved'}, {status: 'Dispatched'}]
		qry.farmxFinalisedTransportation = {$ne:'Buyer'}
		qry.seller = { $exists: true, $ne: null }

		console.log(qry, 'query====confirm dashboard')
		FieldTransactions.native(function (err, fieldTransactions) {
			fieldTransactions.aggregate([
				{
					$match: qry
				},

				{
					'$project': {
						'assign': {
							'$or': [
								{ '$eq': ['$logisticId', null] },
								{ '$gt': ['$logisticId', null] },
							]
						},
					}
				},

				{
					$group: {
						_id: "$assign",
						// totalAssign: { "$sum": { "$cond": [{ "$exists": ["$logisticId", true] }, 1, 0] } },
						// notAssign: { "$sum": { "$cond": [{ "$exists": ["$logisticId", false] }, 1, 0] } },

						count: {
							$sum: 1
						}
					}
				},

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

	transactionlLogisticDashboardConfirmedListings: function (req, res) {

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
				qry.logisticId = { $exists: false }
			} else {
				qry.logisticId = { $exists: true, $ne: null }
			}
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
		

		if (req.param('pincode')) {
			var pincode = JSON.parse(req.param('pincode'));
			if (pincode.length > 0) {
				qry.pickupAddressPincode = {
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

		qry.$or = [{status:'Approved'}, {status: 'Dispatched'}]
		qry.farmxFinalisedTransportation = {$ne:'Buyer'}
		qry.seller = { $exists: true, $ne: null }

		FieldTransactions.native(function (err, fieldtransactions) {
			fieldtransactions.aggregate([

				{
					$lookup: {
						from: 'users',
						localField: 'seller',
						foreignField: '_id',
						as: "sellers"
					}
				},
				{
					$unwind: { path: '$sellers', preserveNullAndEmptyArrays: true }
				},

				{
					$lookup: {
						from: 'users',
						localField: 'buyer',
						foreignField: '_id',
						as: "buyers"
					}
				},
				{
					$unwind: { path: '$buyers', preserveNullAndEmptyArrays: true }
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
						farmxFinalisedTransportation: "$farmxFinalisedTransportation",

						// type: "$type",
						// name: "$name",
						// depositedOn: "$depositedOn",

						ETD: "$ETD",
						ETA: "$ETA",
						status: "$status",
						deliveryTime: "$deliveryTime",
						dropAddress: "$buyerAddress",
						pickupAddress: "$sellerAddress",
						pickupAddressCity: "$sellers.city",
						pickupAddressDistrict: "$sellers.disctrict",
						pickupAddressState: "$sellers.state",
						pickupAddressPincode: "$sellers.pincode",
						createdAt: "$createdAt",
						tripId: "$trip._id",
						tripCode: "$trip.code",
						logisticId: "$logisticId"

					}
				},
				{
					$match: qry
				}
			], function (err, totalresults) {
				fieldtransactions.aggregate([

					{
						$lookup: {
							from: 'users',
							localField: 'seller',
							foreignField: '_id',
							as: "sellers"
						}
					},
					{
						$unwind: { path: '$sellers', preserveNullAndEmptyArrays: true }
					},

					{
						$lookup: {
							from: 'users',
							localField: 'buyer',
							foreignField: '_id',
							as: "buyers"
						}
					},
					{
						$unwind: { path: '$buyers', preserveNullAndEmptyArrays: true }
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
							from: 'lpartners',
							localField: 'logisticId',
							foreignField: '_id',
							as: "lpartners"
						}
					},
					{
						$unwind: {
							path: "$lpartners",
							preserveNullAndEmptyArrays: true
						}
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
							farmxFinalisedTransportation: "$farmxFinalisedTransportation",
							status: "$status",
							// type: "$type",
							// name: "$name",
							// depositedOn: "$depositedOn",

							ETD: "$ETD",
							ETA: "$ETA",
							deliveryTime: "$deliveryTime",
							dropAddress: "$buyerAddress",
							pickupAddress: "$sellerAddress",
							pickupAddressCity: "$sellers.city",
							pickupAddressDistrict: "$sellers.disctrict",
							pickupAddressState: "$sellers.state",
							pickupAddressPincode: "$sellers.pincode",
							createdAt: "$createdAt",
							tripId: "$trip._id",
							tripCode: "$trip.code",
							logisticPartner: "$lpartners.companyName",
							logisticId: "$logisticId"
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
					// console.log(results, 'results====')
					if (err) {
						return res.status(400).jsonx({
							success: false,
							error: err
						});
					} else {
						async.each(results, function (bid, callback) {
							if (bid && bid.logisticId != "nulll" && bid.logisticId != undefined) {
								var lpqry = bid.logisticId.toString()
								Lpartners.findOne(lpqry).then(function (lp) {
									bid.logisticPartner = lp.companyName
									callback()
								}).fail(function (err) {
									callback()
								});
							} else {
								// bid.logisticPartner = '';
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

	transactionlogisticEnrouteDashboard: function (req, res) {
		var qry = {};
		qry.status = "Dispatched";
		qry.farmxFinalisedTransportation = {$ne:'Buyer'}
		qry.logisticId = { $exists: true, $ne: null }
		qry.tripId = { $exists: true, $ne: null }

		if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
			var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
			var userId = ObjectId(req.param('buyerId'))

			qry.buyer = userId
		}

		if (req.param('sellerId') && req.param('sellerId') != undefined && req.param('sellerId') != 'undefined') {
			var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
			var userId = ObjectId(req.param('sellerId'))

			qry.seller = userId
		}

		FieldTransactions.native(function (err, fieldTransactions) {
			fieldTransactions.aggregate([
				{
					$project: {
						status: "$status",
						farmxFinalisedTransportation: "$farmxFinalisedTransportation",
						logisticId: "$logisticId",
						tripId: "$tripId"
					}
				},
				{
					$match: qry
				},
				{
					$group: {
						_id: "null",
						count: { $sum: 1 }
					}
				},

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

	transactionlogisticDashboardEnrouteListings: function (req, res) {

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
		qry.farmxFinalisedTransportation = {$ne:'Buyer'}
		qry.logisticId = { $exists: true, $ne: null }
		qry.tripId = { $exists: true, $ne: null }

		
		if (req.param('pincode')) {
			var pincode = JSON.parse(req.param('pincode'));
			if (pincode.length > 0) {
				qry.pickupAddressPincode = {
					"$in": pincode
				}
			}
		}

		console.log(qry, 'qry==')
		FieldTransactions.native(function (err, fieldTransactions) {
			fieldTransactions.aggregate([
				// {
				//     $lookup: {
				//         from: 'crops',
				//         localField: 'crop',
				//         foreignField: '_id',
				//         as: "crop"
				//     }
				// },
				// {
				//     $unwind: '$crop'
				// },
				{
					$lookup: {
						from: 'users',
						localField: 'seller',
						foreignField: '_id',
						as: "sellers"
					}
				},
				{
					$unwind: { path: '$sellers', preserveNullAndEmptyArrays: true }
				},
				{
					$lookup: {
						from: 'users',
						localField: 'buyer',
						foreignField: '_id',
						as: "buyers"
					}
				},
				{
					$unwind: { path: '$buyers', preserveNullAndEmptyArrays: true }
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
					$unwind: { path: '$lpartner', preserveNullAndEmptyArrays: true }
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
						farmxFinalisedTransportation: "$farmxFinalisedTransportation",
						logisticsOption: "$logisticsOption",
						cropCode: "$crop.code",
						cropId: "$crop._id",
						logisticId: "$logisticId",
						tripId: "$tripId",
						logisticPartner: "$lpartner.companyName",
						ETD: "$ETD",
						ETA: "$ETA",
						ATD: "$ATD",
						deliveryTime: "$deliveryTime",
						dropAddress: "$buyerAddress",
						pickupAddress: "$sellerAddress",
						pickupAddressCity: "$sellers.city",
						pickupAddressDistrict: "$sellers.disctrict",
						pickupAddressState: "$sellers.state",
						pickupAddressPincode: "$sellerPincode"
					}
				},
				{
					$match: qry
				}
			], function (err, totalresults) {

				fieldTransactions.aggregate([
					//     {
					//     $lookup: {
					//         from: 'crops',
					//         localField: 'crop',
					//         foreignField: '_id',
					//         as: "crop"
					//     }
					// },
					// {
					//     $unwind: '$crop'
					// },
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
							localField: 'seller',
							foreignField: '_id',
							as: "sellers"
						}
					},
					{
						$unwind: { path: '$sellers', preserveNullAndEmptyArrays: true }
					},
					{
						$lookup: {
							from: 'users',
							localField: 'buyer',
							foreignField: '_id',
							as: "buyers"
						}
					},
					{
						$unwind: { path: '$buyers', preserveNullAndEmptyArrays: true }
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
						$unwind: { path: '$lpartner', preserveNullAndEmptyArrays: true }
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
							farmxFinalisedTransportation: "$farmxFinalisedTransportation",
							logisticsOption: "$logisticsOption",
							cropCode: "$crop.code",
							cropId: "$crop._id",
							logisticId: "$logisticId",
							tripId: "$tripId",
							logisticPartner: "$lpartner.companyName",
							ETD: "$ETD",
							ETA: "$ETA",
							ATD: "$ATD",
							deliveryTime: "$deliveryTime",
							dropAddress: "$buyerAddress",
							pickupAddress: "$sellerAddress",
							pickupAddressCity: "$sellers.city",
							pickupAddressDistrict: "$sellers.disctrict",
							pickupAddressState: "$sellers.state",
							pickupAddressPincode: "$sellerPincode",
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

	transactionlogisticCompletedDashboard: function (req, res) {
		var qry = {};
		qry.farmxFinalisedTransportation = {$ne:'Buyer'}
		
		qry.$or = [{
			status: "Completed"
		}, {
			status: "Received"
		}]
		qry.logisticId = { $exists: true, $ne: null }
		qry.tripId = { $exists: true, $ne: null }

		if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
			var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
			var userId = ObjectId(req.param('buyerId'))

			qry.buyer = userId
		}

		if (req.param('sellerId') && req.param('sellerId') != undefined && req.param('sellerId') != 'undefined') {
			var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
			var userId = ObjectId(req.param('sellerId'))

			qry.seller = userId
		}

		qry.$and = [{ ATA: { $gte: new Date(req.param('from')) } }, { ATA: { $lte: new Date(req.param('to')) } }]


		FieldTransactions.native(function (err, fieldtransaction) {
			fieldtransaction.aggregate([

				{
					$match: qry
				},
				{
					$project: {
						buyer: "$buyer",
						seller: "$seller",
						logisticId: "$logisticId",
						tripId: "$tripId",						
						status: "$status",
						farmxFinalisedTransportation: "$farmxFinalisedTransportation",
						ATA: "$ATA",
						ETA: "$ETA",
						comp: {
							$cmp: ["$ETA", "$ATA"]
						}
					}
				},
				{
					$group: {
						_id: "$cmp",
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

	transactionlogisticDashboardCompletedListings: function (req, res) {

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
			status: "Delivered"
		}, {
			status: "Received"
		}]
		qry.farmxFinalisedTransportation = {$ne:'Buyer'}
		qry.logisticId = { $exists: true, $ne: null }
		qry.tripId = { $exists: true, $ne: null }
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

		FieldTransactions.native(function (err, fieldTransactions) {
			fieldTransactions.aggregate([
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
						from: 'users',
						localField: 'buyer',
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
						status: "$status",
						logisticsOption: "$logisticsOption",
						cropCode: "$crop.code",
						cropId: "$crop._id",
						logisticId: "$logisticId",
						tripId: "$tripId",						
						logisticPartner: "$lpartner.companyName",
						farmxFinalisedTransportation: "$farmxFinalisedTransportation",
						ETD: "$ETD",
						ETA: "$ETA",
						ATD: "$ATD",
						ATA: "$ATA",
						receivedDate: "$receivedDate",
						deliveryTime: "$deliveryTime",
						dropAddress: "$buyerAddress",
						pickupAddress: "$sellerAddress",
						pickupAddressCity: "$sellers.city",
						pickupAddressDistrict: "$sellers.disctrict",
						pickupAddressState: "$sellers.state",
						pickupAddressPincode: "$sellerPincode",
						compare: {
							$cmp: ["$ETA", "$ATA"]
						}
					}
				},
				{
					$match: qry
				}
			], function (err, totalresults) {

				fieldTransactions.aggregate([
					//     {
					//     $lookup: {
					//         from: 'crops',
					//         localField: 'crop',
					//         foreignField: '_id',
					//         as: "crop"
					//     }
					// },
					// {
					//     $unwind: '$crop'
					// },
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
							from: 'users',
							localField: 'buyer',
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
							status: "$status",
							logisticsOption: "$logisticsOption",
							cropCode: "$crop.code",
							cropId: "$crop._id",
							logisticId: "$logisticId",
							tripId: "$tripId",						
							logisticPartner: "$lpartner.companyName",
							farmxFinalisedTransportation: "$farmxFinalisedTransportation",
							ETD: "$ETD",
							ETA: "$ETA",
							ATD: "$ATD",
							ATA: "$ATA",
							receivedDate: "$receivedDate",
							deliveryTime: "$deliveryTime",
							dropAddress: "$buyerAddress",
							pickupAddress: "$sellerAddress",
							pickupAddressCity: "$sellers.city",
							pickupAddressDistrict: "$sellers.disctrict",
							pickupAddressState: "$sellers.state",
							pickupAddressPincode: "$sellerPincode",
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

	transactionlogisticActiveDashboard: function (req, res) {
		var qry = {};
		qry.status = "Approved"
		qry.farmxFinalisedTransportation = 'Farmx';
		if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
			var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
			var userId = ObjectId(req.param('buyerId'))

			qry.buyer = userId
		}

		if (req.param('sellerId') && req.param('sellerId') != undefined && req.param('sellerId') != 'undefined') {
			var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
			var userId = ObjectId(req.param('sellerId'))

			qry.seller = userId
		}
		console.log("query==", qry)
		FieldTransactions.native(function (err, fieldTransactions) {
			fieldTransactions.aggregate([

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
	transactionlogisticDashboardActiveListings: function (req, res) {

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
		// if (req.param('approvedByBuyer')) {
		//     if (req.param('approvedByBuyer') == 'true') {
		//         qry.approvedByBuyer = true
		//     } else if (req.param('apfprovedByBuyer') == 'false') {
		//         qry.approvedByBuyer = false
		//     }
		// }

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

		qry.status = "Approved"
		qry.farmxFinalisedTransportation = 'Farmx'
		if (req.param('pincode')) {
			var pincode = JSON.parse(req.param('pincode'));
			if (pincode.length > 0) {
				qry.pickupAddressPincode = {
					"$in": pincode
				}
			}
		}

		// qry.popId = {
		//     "$exists": true
		// }
		console.log(qry, '+++++++++')
		FieldTransactions.native(function (err, fieldTransactions) {
			fieldTransactions.aggregate([


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
						from: 'users',
						localField: 'buyer',
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
						bidStatus: "$status",
						status: "$status",
						logisticsOption: "$logisticsOption",
						cropCode: "$crop.code",
						cropId: "$crop._id",
						farmxFinalisedTransportation: "$farmxFinalisedTransportation",
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
						approvedByBuyer: "$pop.allApprovedByBuyer"
						// approvedByQC: "$pop.allApprovedByQC"
					}
				},
				{
					$match: qry
				}
			], function (err, totalresults) {

				fieldTransactions.aggregate([
					// {
					//     $lookup: {
					//         from: 'proofofproduct',
					//         localField: 'popId',
					//         foreignField: '_id',
					//         as: "pop"
					//     }
					// },
					// {
					//     $unwind: '$pop'
					// },
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
					// {
					//     $lookup: {
					//         from: 'crops',
					//         localField: 'crop',
					//         foreignField: '_id',
					//         as: "crop"
					//     }
					// },
					// {
					//     $unwind: '$crop'
					// },
					{
						$lookup: {
							from: 'users',
							localField: 'seller',
							foreignField: '_id',
							as: "sellers"
						}
					},
					{
						$unwind: {
							path: "$sellers",
							preserveNullAndEmptyArrays: true
						}
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
						$unwind: {
							path: "$buyers",
							preserveNullAndEmptyArrays: true
						}
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
							status: "$status",
							farmxFinalisedTransportation: "$farmxFinalisedTransportation",
							logisticsOption: "$logisticsOption",
							cropCode: "$crop.code",
							cropId: "$crop._id",
							logisticId: {
								$ifNull: ["$logisticId", "nulll"]
							},
							ETD: "$ETD",
							ETA: "$ETA",
							deliveryTime: "$deliveryTime",
							dropAddress: "$buyerAddress",
							pickupAddress: "$sellerAddress",
							pickupAddressCity: "$sellers.city",
							pickupAddressDistrict: "$sellers.disctrict",
							pickupAddressState: "$sellers.state",
							pickupAddressPincode: "$sellerPincode",
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
}