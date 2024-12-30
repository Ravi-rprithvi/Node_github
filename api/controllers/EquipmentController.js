var Promise = require('q');
var path = require('path');
var constantObj = sails.config.constants;
var smtpTransport = require('nodemailer-smtp-transport');
var nodemailer = require('nodemailer');
//var socketIOClient = require('socket.io-client');
//var sailsIOClient = require('sails.io.js');

//var io = sailsIOClient(socketIOClient);
/**
 * EquipmentController
 *
 * @description :: Server-side logic for managing equipment
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	save: function (req, res) {
		API(EquipmentService.newequipment, req, res);
	},

	update: function (req, res) {
		API(EquipmentService.update, req, res);
	},

	approveEquipment: function (req, res) {
		API(EquipmentService.approve, req, res);
	},

	verifyEquipment: function (req, res) {
		API(EquipmentService.verify, req, res);
	},

	getAllEquipments: function (req, res, next) {
		var list = req.param('list');
		var search = req.param('search');
		var page = req.param('page');
		var count = req.param('count');
		var skipNo = (page - 1) * count;
		var sortBy = req.param('sortBy');
		var user = req.param('user');
		var markets = JSON.parse(req.param('markets'));
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


		if (search) {
			query.$or = [
				{ code: parseFloat(search) },
				{ name: { $regex: search, '$options': 'i' } },
				{ user: { $regex: search, '$options': 'i' } },
				{ district: { $regex: search, '$options': 'i' } },
				{ type: { $regex: search, '$options': 'i' } },
				{ modelyear: parseInt(search) },
				{ quantity: parseFloat(search) },
				{ rentSell: { $regex: search, '$options': 'i' } },
				{ totalPrice: parseFloat(search) },
				{ soldOut: { $regex: search, '$options': 'i' } }
			]
		}
		/*if(user){
			query.user = user;
		}

		if(user && list == "guest"){
			query.user = {'!' : user };
		}
		*/

		if (markets != undefined && markets.length > 0) {
			query.pincode = { "$in": markets };
		}

		Equipment.native(function (err, equipmentlist) {
			equipmentlist.aggregate([
				{
					$lookup: {
						from: "category",
						localField: "category",
						foreignField: "_id",
						as: "category"
					}
				},
				{
					$unwind: {
						path: '$category',
						preserveNullAndEmptyArrays: true
					},
				},
				{
					$lookup: {
						from: 'users',
						localField: 'user',
						foreignField: '_id',
						as: "supplier"
					}
				},
				{
					$unwind: '$supplier'
				},
				{
					$lookup: {
						from: 'manufacturer',
						localField: 'manufacturer',
						foreignField: '_id',
						as: "manufacturer"
					}
				},
				{
					$unwind: {
						path: '$manufacturer',
						preserveNullAndEmptyArrays: true
					},

				},
				{
					$project: {
						id: "$_id",
						code: "$code",
						capex: "$capex",
						name: "$name",
						user: "$supplier.fullName",
						userId: "$supplier._id",
						mobile: "$supplier.mobile",
						district: "$district",
						type: "$type",
						modelyear: "$modelYear",
						quantity: "$quantity",
						category: "$category.name",
						manufacturer: "$manufacturer.name",
						price: "$price",
						totalPrice: "$totalPrice",
						pincode: "$pincode",
						efarmxComission: "$efarmxComission",
						taxRate: "$taxRate",
						priceUnit: "$priceUnit",
						variety: "$variety",
						images: "$images",
						isVerified: "$isVerified",
						isDeleted: "$isDeleted",
						isApproved: "$isApproved",
						createdAt: "$createdAt",
						soldOut: "$soldOut"
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

					equipmentlist.aggregate([
						{
							$lookup: {
								from: "category",
								localField: "category",
								foreignField: "_id",
								as: "category"
							}
						},
						{
							$unwind: {
								path: '$category',
								preserveNullAndEmptyArrays: true
							},
						},
						{
							$lookup: {
								from: 'users',
								localField: 'user',
								foreignField: '_id',
								as: "supplier"
							}
						},
						{
							$unwind: '$supplier'
						},
						{
							$lookup: {
								from: 'manufacturer',
								localField: 'manufacturer',
								foreignField: '_id',
								as: "manufacturer"
							}
						},
						{
							$unwind: {
								path: '$manufacturer',
								preserveNullAndEmptyArrays: true
							},
						},
						{
							$project: {
								id: "$_id",
								code: "$code",
								capex: "$capex",
								name: "$name",
								user: "$supplier.fullName",
								userId: "$supplier._id",
								mobile: "$supplier.mobile",
								district: "$district",
								type: "$type",
								modelyear: "$modelYear",
								quantity: "$quantity",
								isVerified: "$isVerified",
								category: "$category.name",
								manufacturer: "$manufacturer.name",
								price: "$price",
								totalPrice: "$totalPrice",
								pincode: "$pincode",
								efarmxComission: "$efarmxComission",
								taxRate: "$taxRate",
								priceUnit: "$priceUnit",
								variety: "$variety",
								images: "$images",
								isDeleted: "$isDeleted",
								isApproved: "$isApproved",
								createdAt: "$createdAt",
								soldOut: "$soldOut"
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
									equipments: results,
									total: totalresults.length
								},
							});
						}
					});
				}
			});

		})
	},
	myEquipments: function (req, res) {
		var search = req.param('search');
		var page = req.param('page');
		var count = req.param('count');
		var skipNo = (page - 1) * count;
		var sortBy = req.param('sortBy');
		var user = req.param('user');

		var query = {};

		if (sortBy) {
			sortBy = sortBy.toString();
		} else {
			sortBy = 'createdAt desc';
		}

		query.user = user;
		query.isDeleted = false;
		query.soldOut = false;

		Equipment.find(query).populate('ddPayment').populate('category').populate('orderId').populate('user').populate('manufacturer').populate('logisticsPreference').populate('paymentId').populate('equipmentLogisticId').populate('logisticPayment').sort(sortBy).skip(skipNo).limit(count).exec(function (err, response) {
			if (err) {
				return res.status(400).jsonx({
					success: false,
					error: err
				});
			} else {
				Equipment.count(query).populate('ddPayment').populate('category').populate('orderId').populate('user').populate('manufacturer').populate('logisticsPreference').populate('paymentId').populate('equipmentLogisticId').populate('logisticPayment').exec(function (equiperr, equiptotal) {
					if (equiperr) {
						return res.status(400).jsonx({
							success: false,
							error: error
						});
					} else {
						return res.jsonx({
							success: true,
							data: {
								equipments: response,
								total: equiptotal
							},
						});
					}
				})
			}
		})
	},

	expire: function (req, res) {
		API(EquipmentService.makeExpire, req, res);
	},

	expiredEquipments: function (req, res) {
		var search = req.param('search');
		var page = req.param('page');
		var count = req.param('count');
		var skipNo = (page - 1) * count;
		var sortBy = req.param('sortBy');
		var user = req.param('user');

		var query = {};

		query.user = user;
		query.isDeleted = false;
		query.soldOut = true;

		Equipment.find(query).populate('ddPayment').populate('category').populate('orderId').populate('user').populate('manufacturer').populate('logisticsPreference').populate('paymentId').populate('equipmentLogisticId').populate('logisticPayment').sort(sortBy).skip(skipNo).limit(count).exec(function (err, response) {
			if (err) {
				return res.status(400).jsonx({
					success: false,
					error: err
				});
			} else {
				Equipment.count(query).populate('ddPayment').populate('category').populate('orderId').populate('user').populate('manufacturer').populate('logisticsPreference').populate('paymentId').populate('equipmentLogisticId').populate('logisticPayment').sort(sortBy).skip(skipNo).limit(count).exec(function (equiperr, equiptotal) {
					if (equiperr) {
						return res.status(400).jsonx({
							success: false,
							error: error
						});
					} else {
						return res.jsonx({
							success: true,
							data: {
								equipments: response,
								total: equiptotal
							},
						});
					}

				})

			}
		})
	},

	payHigh: function (req, res) {
		let data = {};
		let eqdata = {};
		let query = {};

		data.productId = req.body.equipment;
		data.equipment = req.body.equipment;
		data.sellerId = req.body.user;
		data.productType = "equipment";
		data.amount = req.body.amount;
		data.paymentStatus = true;
		data.capex = "high";

		query.productId = req.body.equipment
		query.equipment = req.body.equipment
		query.sellerId = req.body.user;
		query.paymentStatus = true;
		query.capex = "high";

		if (!req.body.buyer) {
			query.equipmentInterestsId = { $exists: false };
			Payments.findOne(query).exec(function (err, paymentdetail) {

				if (paymentdetail != undefined) {
					var paymentdetailquery = {};
					paymentdetailquery.isApproved = "true";
					paymentdetailquery.paymentStatus = "true";
					paymentdetailquery.paymentId = paymentdetail.id
					paymentdetailquery.id = req.body.equipment;

					Equipment.findOne(paymentdetailquery).exec(function (err, equipmentdetail) {
						if (equipmentdetail) {
							return res.jsonx({
								success: false,
								error: "You have already paid for this equipment."
							});
						}
					})

				} else {

					Payments.create(data).then(function (response) {
						if (response) {
							eqdata.paymentStatus = "true";
							eqdata.paymentId = response.id;
							eqdata.isApproved = "true";

							Equipment.update({ id: response.productId }, eqdata).exec(function (err, resdata) {
								if (resdata) {
									return res.jsonx({
										success: true,
										data: {
											resdata: resdata
										},
									});
								} else {
									return res.status(400).jsonx({
										success: false,
										error: err
									});
								}
							})
						}
					})
				}
			});
		} else {
			eqdata.buyerId = req.body.buyer;
			eqdata.equipmentId = req.body.equipment;

			let paymentfound = {};
			paymentfound.equipmentInterestsId = { "$exists": true };
			paymentfound.productId = req.body.equipment;
			paymentfound.equipment = req.body.equipment;
			paymentfound.buyerId = req.body.buyer;
			paymentfound.paymentStatus = true;
			paymentfound.capex = "high";


			Payments.findOne(paymentfound).exec(function (statuserr, paymentstatus) {
				if (paymentstatus) {
					if (paymentstatus.equipmentInterestsId) {
						return res.jsonx({
							success: false,
							error: "You have already paid for this interest."
						});
					}
				} else {
					Equipmentinterests.findOne(eqdata).exec(function (err, interest) {
						if (interest) {
							let interestId = interest.id;
							let paymentData = {};
							paymentData.productId = req.body.equipment;
							paymentData.equipment = req.body.equipment;
							paymentData.sellerId = req.body.user;
							paymentData.productType = "equipment";
							paymentData.capex = "high";
							paymentData.amount = req.body.amount;
							paymentData.paymentStatus = true;
							paymentData.equipmentInterestsId = interestId;
							paymentData.buyerId = req.body.buyer;

							Payments.create(paymentData).exec(function (errpay, response) {
								if (response) {
									let data = {};
									data.paymentId = response.id;
									data.paymentStatus = "true";
									Equipmentinterests.update({ id: response.equipmentInterestsId }, data).exec(function (updateerr, updatesuccess) {
										if (updateerr) {
											return res.jsonx({
												success: false,
												error: "There is some issue with the update."
											});
										} else {
											return res.jsonx({
												success: true,
												data: {
													updatesuccess: updatesuccess
												}
											});
										}
									})

								} else {
									return res.jsonx({
										success: false,
										error: "There is some issue with the payment. We are unable to process the payment. Please try again."
									});
								}
							})
						}
					});
				}
			})
		}
	},

	frontequipments: function (req, res, next) {

		const { ObjectId } = require('mongodb');

		var list = req.param('list');
		var search = req.param('search');
		var page = req.param('page');
		var count = req.param('count');
		var skipNo = (page - 1) * count;
		var sortBy = req.param('sortBy');
		var user = req.param('user');
		//var catgIds = req.param('categories');
		var district = req.param('district');
		var state = req.param('state');
		var verified = req.param('verified');
		var minprice = req.param('minPrice');
		var maxprice = req.param('maxPrice');
		var type = req.param('type');
		var catgIds;
		var districtName;
		let categories = [];
		if (req.param('categoryIds')) catgIds = JSON.parse(req.param('categoryIds'));
		if (req.param('district')) districtName = JSON.parse(req.param('district'));


		var query = {};
		var sortquery = {};

		if (sortBy) {
			var typeArr = new Array();
			typeArr = sortBy.split(" ");
			var sortType = typeArr[1];
			var field = typeArr[0];

			sortquery[field ? field : field] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

		} else {
			sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;
		}
		count = parseInt(count);

		query.isDeleted = false;
		query.isApproved = true;
		query.soldOut = false;
		query.paymentId = null;

		if (search) {
			query.$or = [
				{ name: { $regex: search, '$options': 'i' } },
				{ user: { $regex: search, '$options': 'i' } },
				{ category: { $regex: search, '$options': 'i' } },
				{ district: { $regex: search, '$options': 'i' } },
				{ type: { $regex: search, '$options': 'i' } },
				{ modelyear: { $regex: search, '$options': 'i' } },
				{ quantity: parseFloat(search) },
				{ rentSell: { $regex: search, '$options': 'i' } },
				{ price: parseFloat(search) }
			]
		}

		// Filter on Category

		if (catgIds != undefined && catgIds.length > 0) {
			query.categoryId = { "$in": catgIds };   //['hskhfs','hsflh']
		}

		if (districtName != undefined && districtName.length > 0) {
			//query.district = {"$in" : JSON.parse(JSON.stringify(district))};  
			query.district = { "$in": districtName }; //['hskhfs','hsflh']  
		}

		if (state != undefined && state != '') { //state  != '' added by Rahul sharma
			query.state = state
		}

		if (verified == 'yes') {
			query.isVerified = true;
		} // in case of else both true and false data is showing at frontend. 

		if (minprice != '' && maxprice != '') {
			query.totalPrice = { $gte: parseFloat(minprice), $lte: parseFloat(maxprice) };
		}

		if (minprice != '' && maxprice == '') {
			query.totalPrice = { $gte: parseFloat(minprice) };
		}

		if (maxprice != '' && minprice == '') {
			query.totalPrice = { $lte: parseFloat(maxprice) };
		}

		if (type != '') {
			query.type = type;
		}
		console.log("hookTimeout:", sails.config.hookTimeout)

		Equipment.native(function (err, equipmentlist) {
			equipmentlist.aggregate([
				{
					$lookup: {
						from: "category",
						localField: "category",
						foreignField: "_id",
						as: "category"
					}
				},
				{
					$unwind: {
						path: '$category',
						preserveNullAndEmptyArrays: true
					},
				},
				{
					$lookup: {
						from: 'users',
						localField: 'user',
						foreignField: '_id',
						as: "supplier"
					}
				},
				{
					$unwind: '$supplier'
				},
				{
					$lookup: {
						from: 'manufacturer',
						localField: 'manufacturer',
						foreignField: '_id',
						as: "manufacturer"
					}
				},
				{
					$unwind: {
						path: '$manufacturer',
						preserveNullAndEmptyArrays: true
					},
				},
				{
					$project: {
						id: "$_id",
						name: "$name",
						user: "$supplier.fullName",
						userId: "$supplier._id",
						district: "$district",
						state: "$state",
						address: "$address",
						city: "$city",
						pincode: "$pincode",
						type: "$type",
						modelyear: "$modelyear",
						quantity: "$quantity",
						isVerified: "$isVerified",
						category: "$category.name",
						categoryId: "$categoryId",
						manufacturer: "$manufacturer.name",
						price: "$price",
						totalPrice: "$totalPrice",
						priceUnit: "$priceUnit",
						variety: "$variety",
						images: "$images",
						isDeleted: "$isDeleted",
						isApproved: "$isApproved",
						soldOut: "$soldOut",
						//paymentId: "$paymentId",/*commented by Rahul sharma*/
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

					equipmentlist.aggregate([
						{
							$lookup: {
								from: "category",
								localField: "category",
								foreignField: "_id",
								as: "category"
							}
						},
						{
							$unwind: {
								path: '$category',
								preserveNullAndEmptyArrays: true
							},
						},
						{
							$lookup: {
								from: 'users',
								localField: 'user',
								foreignField: '_id',
								as: "supplier"
							}
						},
						{
							$unwind: '$supplier'
						},
						{
							$lookup: {
								from: 'manufacturer',
								localField: 'manufacturer',
								foreignField: '_id',
								as: "manufacturer"
							}
						},
						{
							$unwind: {
								path: '$manufacturer',
								preserveNullAndEmptyArrays: true
							},
						},
						{
							$project: {
								id: "$_id",
								name: "$name",
								user: "$supplier.fullName",
								userId: "$supplier._id",
								district: "$district",
								state: "$state",
								address: "$address",
								city: "$city",
								pincode: "$pincode",
								type: "$type",
								modelyear: "$modelyear",
								quantity: "$quantity",
								isVerified: "$isVerified",
								category: "$category.name",
								categoryId: "$categoryId",
								manufacturer: "$manufacturer.name",
								price: "$price",
								totalPrice: "$totalPrice",
								priceUnit: "$priceUnit",
								variety: "$variety",
								images: "$images",
								isDeleted: "$isDeleted",
								isApproved: "$isApproved",
								soldOut: "$soldOut",
								//paymentId: "$paymentId",/*commented by Rahul sharma*/
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
									equipments: results,
									total: totalresults.length
								},
							});
						}
					});
				}
			});

		})
	},

	minterested: function (req, res) {
		Settings.find({}, {})
			.then(function (response) {
				let interestedShare = response[0].interestEquipmentShare;

				let data = {};
				data.equipmentId = req.body.equipmentId;
				data.buyerId = req.body.buyerId;
				data.user = req.body.sellerId
				data.sharePercent = interestedShare;

				Equipmentinterests.findOne({ equipmentId: req.body.equipmentId, buyerId: req.body.buyerId, user: req.body.sellerId }).exec(function (usrreqerr, usrreqresponse) {

					if (usrreqresponse != undefined) {
						return res.jsonx({
							success: false,
							error: {
								code: 400,
								message: constantObj.equipment.ALREADY_REQUESTED,
								key: 'ALREADY_REQUESTED'
							}
						});
					} else {

						let commissioncal = req.body.price * (interestedShare / 100);
						data.amountPaidBySeller = parseFloat(commissioncal)


						Equipmentinterests.create(data).exec(function (err, response) {

							if (err) {
								return res.jsonx({
									success: false,
									error: err
								});
							}
							if (response) {
								data.id = req.body.equipmentId;
								EquipmentService.sendmailtoseller(data, function (error, success) {
									/*if(!err){
										return res.jsonx({
											success: true,
											data: {
												success: success
											}
										});
									} else {
										return res.jsonx({
											success: false,
											error: error
										});
									}*/
								})
								return res.jsonx({
									success: true
								});
							}
						})
					}
				});
			});
	},

	interestedBuyers: function (req, res) {

		let data = {};
		data.equipmentId = req.param("equipmentId");
		data.user = req.param("sellerId");
		//data.paymentStatus = "true";
		Equipmentinterests.find(data).populate('buyerId').populate('user').exec(function (intrsterr, intrstresponse) {

			if (intrsterr) {
				return res.jsonx({
					success: false,
					error: intrsterr
				});
			} else {
				return res.jsonx({
					success: true,
					data: intrstresponse

				});
			}
		});
	},

	requestedBuyers: function (req, res) {
		let data = {};
		data.equipmentId = req.param("equipmentId");
		data.user = req.param("sellerId");
		data.paymentType = 'initial';

		Orders.find(data).populate('buyerId').exec(function (err, response) {
			if (err) {
				return res.jsonx({
					success: false,
					error: err
				});
			} else if (response.length == 0) {
				return res.jsonx({
					success: false,
					error: "No data"

				});
			} else {
				return res.jsonx({
					success: true,
					data: response

				});
			}
		});
	},

	approveEquipment: function (req, res) {
		API(EquipmentService.approve, req, res);
	},

	verifyEquipment: function (req, res) {
		API(EquipmentService.verify, req, res);
	},

	mybookings: function (req, res) {
		let data = {};
		let orderQuery = {};
		data.buyerId = req.param('buyerId');
		orderQuery.buyerId = req.param('buyerId');
		orderQuery.capex = 'low';

		Promise.all([
			Equipmentinterests.find(data).populate('equipmentId').then(),
			Orders.find(orderQuery).populate('equipment').then(),
			Rentequipment.find(data).populate('equipmentId').then()
		]).spread(function (Equipmentinterests, Orders, Rentequipment) {
			return res.jsonx({
				success: true,
				data: {
					equipmentInterests: Equipmentinterests,
					orders: Orders,
					rentEquipments: Rentequipment
				}
			})
		}).fail(function (err) {
			return res, jsonx({
				success: false,
				error: err
			})
		})
	},

	lastpayment: function (req, res) {

		var query = {
			equipment_id: req.body.equipment_id,
			seller_id: req.body.seller_id,
			buyer_id: req.buyer_id,
			interestEquipmentShare: req.body.interestEquipmentShare,
			full_amount: req.body.full_amount,
			payment_status: req.body.payment_status
		};

		let code = commonService.getUniqueCode();
		query.code = code;

		Orders.create(query).exec(function (err, data) {

			if (err) {
				return res.jsonx({
					success: false,
					error: err
				})
			} else {
				return res.jsonx({
					success: true,
					data: data
				})
			}
		})
	},

	buyNowLowCapex: function (req, res) {

		let data = {};
		data.equipment = req.body.equipmentId;
		//data.buyerId = req.body.buyerId;
		data.sellerId = req.body.sellerId
		data.paymentType = 'commission';

		//Lowcapexsell.findOne(data).exec(function(capexerr,capexresponse){
		Orders.findOne(data).exec(function (capexerr, capexresponse) {

			if (capexresponse) {
				return res.jsonx({
					success: false,
					error: {
						code: 400,
						message: constantObj.crops.ALREADY_PAID,
						key: 'ALREADY_PAID'
					}
				});
			} else {
				let code = commonService.getUniqueCode();
				data.code = code;

				data.productId = req.body.equipmentId;
				data.buyerId = req.body.buyerId;
				data.address = req.body.address;
				data.logisticType = req.body.logisticType;
				data.productType = 'equipment';
				data.capex = 'low';
				data.amount = req.body.farmxShare;

				Orders.create(data).exec(function (err, response) {

					if (err) {
						return res.jsonx({
							success: false,
							error: error
						});
					} else {
						return res.jsonx({
							success: true,
							data: response
						});
					}
				})
			}
		});
	},

	payLow: function (req, res) {
		let data = {};

		let query = {};

		data.productId = req.body.equipmentId;
		data.equipment = req.body.equipmentId;
		data.sellerId = req.body.user;
		data.buyerId = req.body.buyerId;
		data.productType = "equipment";
		data.paymentType = req.body.paymentType;
		data.paymentStatus = true;
		//data.equipmentInterestsId = {$exists:false};
		Payments.findOne(data).exec(function (err, paymentdetail) {

			if (paymentdetail !== undefined) {

				return res.jsonx({
					success: false,
					error: "You have already paid for this equipment.",
					lowcapexdetail: lowcapexdetail
				});

			} else {
				data.orderId = req.body.orderId;
				data.amount = req.body.amount;
				data.payment = req.body.payment;

				Payments.create(data).then(function (response) {

					if (response) {

						let eqdata = {};
						eqdata.paymentStatus = "true";
						eqdata.paymentId = response.id;
						eqdata.orderId = response.orderId;
						//eqdata.soldOut = "true";

						Equipment.update({ id: data.productId }, eqdata).exec(function (err, resdata) {
							if (err) {
								return res.status(400).jsonx({
									success: false,
									error: err
								});
							} else {
								let updatecapex = {};
								updatecapex.paymentId = response.id;
								updatecapex.paymentStatus = true;
								Orders.update({ id: response.orderId }, updatecapex).exec(function (updateerr, updatedata) {
									if (updateerr) {
										return res.status(400).jsonx({
											success: false,
											error: updateerr
										});
									} else {

										return res.status(200).jsonx({
											success: true,
											data: {
												updatedata: updatedata
											}
										});
									}
								})
							}
						})
					}
				})
			}
		});
	},

	payLogisticPayment: function (req, res) {
		let data = {};

		let query = {};

		data.productId = req.body.equipmentId;
		data.equipment = req.body.equipmentId;
		data.sellerId = req.body.user;
		data.buyerId = req.body.buyerId;
		data.productType = "equipment";
		data.paymentStatus = true;
		data.paymentType = req.body.paymentType;
		//data.equipmentInterestsId = {$exists:false};
		Payments.findOne(data).exec(function (err, paymentdetail) {

			if (paymentdetail !== undefined) {

				return res.jsonx({
					success: false,
					error: {
						code: 400,
						message: constantObj.crops.ALREADY_PAID,
						key: 'ALREADY_PAID'
					}
				});

			} else {

				let eqdata = {};
				let code = commonService.getUniqueCode();
				eqdata.code = code;

				eqdata.productId = req.body.equipmentId;
				eqdata.equipment = req.body.equipmentId;
				eqdata.sellerId = req.body.user;
				eqdata.buyerId = req.body.buyerId;
				eqdata.productType = "equipment";
				eqdata.paymentType = req.body.paymentType;
				eqdata.amount = req.body.amount;
				eqdata.contactPerson = req.body.logisticId;

				Orders.create(eqdata).exec(function (cpxerr, cpxdetail) {

					if (cpxdetail) {

						data.amount = req.body.amount
						data.orderId = cpxdetail.id
						data.payment = req.body.payment

						Payments.create(data).then(function (response) {

							if (response) {

								let paymentdata = {};
								paymentdata.paymentStatus = "true";
								paymentdata.logisticPayment = response.id;

								Equipment.update({ id: data.productId }, paymentdata).exec(function (err, resdata) {
									if (err) {
										return res.status(400).jsonx({
											success: false,
											error: err
										});
									} else {
										let updatecapex = {};
										updatecapex.paymentId = response.id;
										updatecapex.paymentStatus = true;
										Orders.update({ id: cpxdetail.id }, updatecapex).exec(function (updateerr, updatedata) {
											if (updateerr) {
												return res.status(400).jsonx({
													success: false,
													error: updateerr
												});
											} else {

												return res.status(200).jsonx({
													success: true,
													data: updatedata[0]

												});
											}
										})
									}
								})
							}
						})
					}
				});
			}
		});
	},

	soldOutEquipment: function (req, res) {
		let query = {};
		query.soldOut = "true";

		Equipment.update({ id: req.body.equipmentId }, query).exec(function (updateerr, updatedata) {

			if (updateerr) {
				return res.status(400).jsonx({
					success: false,
					error: updateerr
				});
			} else {
				let updatecapex = {}
				let filtercriteria = {}
				filtercriteria.equipment = req.body.equipmentId;
				filtercriteria.buyerId = req.body.buyerId;
				filtercriteria.sellerId = req.body.sellerId;
				updatecapex.prouductAmount = req.body.amount;

				Orders.findOne(filtercriteria).exec(function (finderr, finddata) {

					if (finddata) {
						Lowcapexsell.update({ id: finddata.id }, updatecapex).exec(function (err, response) {

							if (err) {
								return res.status(400).jsonx({
									success: false,
									error: err
								});
							} else {
								return res.status(200).jsonx({
									success: true,
									data: {
										response: response
									}
								});
							}
						})
					}
				});
			}
		})
	},

	buyNowUserDetail: function (req, res) {
		let query = {};
		query.equipment = req.param('equipmentId');

		Orders.findOne(query).populate('buyerId').exec(function (usererr, userdata) {
			if (userdata) {
				return res.status(200).jsonx({
					success: true,
					data: {
						userdata: userdata
					}
				});
			}
		})
	},

	equipmentSearch: function (req, res) {

		var search = req.param('search');
		var minprice = req.param('minprice');
		var maxprice = req.param('maxprice');
		/* var minquantity = req.param('minquantity');
		 var maxquantity = req.param('maxquantity');*/
		var quality = req.param('quality');
		var page = req.param('page');
		var count = req.param('count');
		var skipNo = (page - 1) * count;
		var sortBy = req.param('sortBy');
		var equipmentId = req.param('equipmentId');

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
		if (equipmentId) {
			qry.id = { "$nin": [ObjectId(equipmentId)] };
		}


		var sortquery = {};

		if (sortBy) {
			var typeArr = new Array();
			typeArr = sortBy.split(" ");
			var sortType = typeArr[1];
			var field = typeArr[0];
			/* if (field == 'userRating') {
				 field = 'sellers.avgRating'
			 }*/
		}

		sortquery[field ? field : "createdAt"] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

		var qryArray = []

		if (search) {
			qryArray.push({ name: { $regex: search, '$options': 'i' } })
			qryArray.push({ parentcategory: { $regex: search, '$options': 'i' } })
			qryArray.push({ category: { $regex: search, '$options': 'i' } })
			qryArray.push({ variety: { $regex: search, '$options': 'i' } })
		}

		if (minprice != undefined && minprice != "" && maxprice != undefined && maxprice != "") {
			qry.price = { $gte: parseFloat(minprice), $lte: parseFloat(maxprice) };
		}

		if (minquantity != undefined && maxquantity != undefined && minquantity != "" && maxquantity != "") {
			qry.$and = [{ quantity: { $gte: parseFloat(minquantity) } }, { quantity: { $lte: parseFloat(maxquantity) } }];
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


		Equipment.native(function (err, equipmentlist) {
			equipmentlist.aggregate([

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
						localField: 'user',
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
						variety: "$variety",
						type: "$type",
						totalPrice: "$totalPrice",
						taxRate: "$taxRate",
						state: "$state",
						soldOut: "$soldOut",
						quantity: "$quantity",
						priceUnit: "$priceUnit",
						price: "$price",
						paymentStatus: "$paymentStatus",
						name: "$name",
						modelYear: "$modelYear",
						model: "$model",
						isVerified: "$isVerified",
						isDeleted: "$isDeleted",
						isApproved: "$isApproved",
						images: "$images",
						endDate: "$endDate",
						efarmxComission: "$efarmxComission",
						district: "$district",
						description: "$description",
						createdAt: "$createdAt",
						code: "$code",
						city: "$city",
						state: "$state",
						category: "$category.name",
						categoryId: "$category._id",
						capex: "$capex",
						availableUnit: "$availableUnit",
						availablePeriod: "$availablePeriod",
						availableFrom: "$availableFrom",
						address: "$address",
						userFullname: "$sellers.fullName",
						userFirstname: "$sellers.firsname",
						userImage: "$sellers.image",
						userId: "$sellers._id",
						userEmail: "$sellers.username",
						userState: "$sellers.state",
						userCity: "$sellers.city",
						userDistricts: "$sellers.district",
						userRating: "$sellers.avgRating",
						userPincode: "$sellers.pincode"

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
							localField: 'user',
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
							variety: "$variety",
							type: "$type",
							totalPrice: "$totalPrice",
							taxRate: "$taxRate",
							state: "$state",
							soldOut: "$soldOut",
							quantity: "$quantity",
							priceUnit: "$priceUnit",
							price: "$price",
							paymentStatus: "$paymentStatus",
							name: "$name",
							modelYear: "$modelYear",
							model: "$model",
							isVerified: "$isVerified",
							isDeleted: "$isDeleted",
							isApproved: "$isApproved",
							images: "$images",
							endDate: "$endDate",
							efarmxComission: "$efarmxComission",
							district: "$district",
							description: "$description",
							createdAt: "$createdAt",
							code: "$code",
							city: "$city",
							state: "$state",
							category: "$category.name",
							categoryId: "$category._id",
							capex: "$capex",
							availableUnit: "$availableUnit",
							availablePeriod: "$availablePeriod",
							availableFrom: "$availableFrom",
							address: "$address",
							userFullname: "$sellers.fullName",
							userFirstname: "$sellers.firsname",
							userImage: "$sellers.image",
							userId: "$sellers._id",
							userEmail: "$sellers.username",
							userState: "$sellers.state",
							userCity: "$sellers.city",
							userDistricts: "$sellers.district",
							userRating: "$sellers.avgRating",
							userPincode: "$sellers.pincode"
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
						return res.status(200).jsonx({
							success: true,
							data: {
								equipments: results,
								total: totalresults.length
							}
						});
					}
				});
			})
		})
	},

	rentEquipment: function (req, res) {
		//Settings.find({},{})
		Equipment.findOne({ id: req.body.equipmentId })
			.then(function (response) {

				let data = {};
				// data.equipmentId = req.body.equipmentId;
				// data.buyerId = req.body.buyerId;
				// data.user = req.body.sellerId

				let rentquery = {
					equipmentId: req.body.equipmentId,
					buyerId: req.body.buyerId,
					user: req.body.sellerId,
					startDateTime: { $gte: req.body.startDateTime },
					endDateTime: { $lte: req.body.endDateTime }
				}

				Rentequipment.find({ where: rentquery }).exec(function (finderr, finddata) {

					if (!_.isEmpty(finddata)) {
						return res.jsonx({
							success: false,
							message: "Equipment already rented"
						})
					} else {
						data.equipmentId = req.body.equipmentId;
						data.buyerId = req.body.buyerId;
						data.user = req.body.sellerId
						data.rentPrice = req.body.rentPrice;
						data.startDateTime = req.body.startDateTime;
						data.endDateTime = req.body.endDateTime;

						Rentequipment.create(data).exec(function (err, response) {
							if (err) {
								return res.jsonx({
									success: false,
									error: err
								});
							}
							if (response) {
								return res.jsonx({
									success: true,
									data: {
										message: constantObj.equipment.RENT_REQUEST_SUCCESS,
										key: 'RENT_REQUEST_SUCCESS'
									}
								});
							}
						});
					}

					/*if(finddata != undefined){
						return res.jsonx({
							success: false,
							error:{
								code: 400,
								message: constantObj.equipment.ALREADY_REQUESTED,
								key: 'ALREADY_REQUESTED'
							}
						});
					} else {*/
					//if(finddata == undefined || finddata){


					//}
				});
			});
	},

	listRentRequests: function (req, res) {
		let data = {};
		data.equipmentId = req.param('equipmentId');
		data.user = req.param('sellerId');

		Rentequipment.find(data).populate("buyerId").exec(function (finderr, finddata) {
			if (finderr) {
				return res.jsonx({
					success: false,
					error: finderr
				});
			} else {
				return res.jsonx({
					success: true,
					data: finddata

				});
			}
		});
	},

	acceptRentEquipmentRequests: function (req, res) {
		let query = {};
		query.id = req.param('rentId');

		Rentequipment.findOne(query).populate('buyerId').populate('equipmentId').exec(function (finderr, finddata) {

			if (finddata != undefined) {
				let data = {};
				data.selectForPayment = "true";

				Rentequipment.update({ id: finddata.id }, data).exec(function (err, response) {

					if (response) {
						let orderInput = {}
						orderInput.productId = finddata.equipmentId.id;
						orderInput.equipment = finddata.equipmentId.id;
						orderInput.sellerId = finddata.user;
						orderInput.buyerId = finddata.buyerId.id;
						orderInput.productType = "equipment";
						orderInput.rentId = finddata.id;
						orderInput.paymentType = "rentCommission";

						let commissioncal = finddata.rentPrice * (finddata.equipmentId.efarmxComission / 100);
						let taxcal = finddata.rentPrice * (finddata.equipmentId.taxRate / 100);
						let totalPrice = parseFloat(commissioncal) + parseFloat(taxcal);

						orderInput.amount = totalPrice;

						let code = commonService.getUniqueCode();
						orderInput.code = code;


						Orders.create(orderInput).then(function (orderresponse) {

							if (orderresponse) {

								let updateRentEquipment = {};
								updateRentEquipment.orderId = orderresponse.id;

								Rentequipment.update({ id: orderresponse.rentId }, updateRentEquipment).exec(function (err, response) {
									if (response) {

										let msg = constantObj.messages.RENT_SELECTED_BUYER_NOTIFICATION + " " + finddata.equipmentId.name + " " + constantObj.messages.RENT_SELECTED_BUYER_NOTIFICATION_PART;
										let email = '';

										if (!finddata.buyerId.email) {
											email = finddata.buyerId.username;
										} else {
											email = finddata.buyerId.email;
										}

										var transport = nodemailer.createTransport(smtpTransport({
											host: sails.config.appSMTP.host,
											port: sails.config.appSMTP.port,
											debug: sails.config.appSMTP.debug,
											auth: {
												user: sails.config.appSMTP.auth.user, //access using /congig/appSMTP.js
												pass: sails.config.appSMTP.auth.pass
											}
										}));

										message = 'Hello ' + finddata.buyerId.fullName;
										message += '<br/><br/>';
										message += msg
										message += '<br/><br/><br/>';
										message += 'Thanks';
										message += '<br/>';
										message += 'eFarmX Team';

										transport.sendMail({
											from: sails.config.appSMTP.auth.user,
											to: finddata.buyerId.email,
											subject: 'Rent Notification ' + finddata.equipmentId.name,
											html: message
										}, function (err, info) {
											if (err) {
												// return res.jsonx({
												//     success: false,
												//     code: 404,
												//     message: constantObj.messages.SEND_MAIL_ISSUE,
												//     key: 'SEND_MAIL_ISSUE'
												// });

											} else {
												// return res.jsonx({
												//     success: true,
												//     code: 200,
												//     message: constantObj.messages.MAIL_SENT,
												//     key: 'MAIL_SENT',
												//     data : orderresponse
												// });
											}
										});

										return res.jsonx({
											success: true,
											code: 200,
											message: constantObj.messages.MAIL_SENT,
											key: 'MAIL_SENT',
											data: orderresponse
										})
									} else {
										return res.jsonx({
											success: false,
											error: {
												code: 400,
												message: constantObj.equipment.EQUIPMENT_NOT_FOUND,
												key: 'EQUIPMENT_NOT_FOUND'
											}
										})
									}

								})
							}
						});
					} else {
						return res.jsonx({
							success: false,
							error: {
								code: 400,
								message: constantObj.equipment.EQUIPMENT_NOT_FOUND,
								key: 'EQUIPMENT_NOT_FOUND'
							}
						})
					}
				});
			} else {
				return res.jsonx({
					success: false,
					error: {
						code: 400,
						message: constantObj.equipment.EQUIPMENT_NOT_FOUND,
						key: 'EQUIPMENT_NOT_FOUND'
					}
				})
			}
		});
	},

	myrentbookings: function (req, res) {
		let data = {};
		data.equipmentId = req.param('equipmentId');
		data.buyerId = req.param('buyerId');

		Rentequipment.find(data).populate("orderId").populate("paymentId").exec(function (err, response) {

			if (err) {
				return res.jsonx({
					success: false,
					code: 400,
					error: {
						message: constantObj.equipment.EQUIPMENT_NOT_FOUND,
						key: 'EQUIPMENT_NOT_FOUND'
					}
				})
			} else {
				return res.jsonx({
					success: true,
					code: 200,
					data: response
				})
			}
		});
	},

	payRent: function (req, res) {
		let query = {}
		query.productId = req.body.equipmentId;
		query.equipment = req.body.equipmentId;
		query.sellerId = req.body.user;
		query.buyerId = req.body.buyerId;
		query.amount = req.body.amount;
		query.orderId = req.body.orderId;
		query.productType = "equipment";
		query.paymentStatus = true;

		Payments.find(query).then(function (findata) {
			if (_.isEmpty(findata) || findata == undefined) {

				Payments.create(query).then(function (createdata) {

					if (!_.isEmpty(createdata)) {

						let query = { id: createdata.orderId };
						let record = { paymentId: createdata.id };

						Orders.update(query, record).then(function (order) {

							if (!_.isEmpty(order)) {

								let query = { id: order[0].rentId };
								let record = { paymentId: order[0].paymentId };

								Rentequipment.update(query, record).then(function (rent) {
									if (!_.isEmpty(rent)) {
										let result = { success: true, data: createdata };
										return res.jsonx(result);
									} else {
										let result = { success: "false1" };
										return res.jsonx(result);
									}
								})

							} else {
								let result = { success: false };
								return res.jsonx(result);
							}
						})
					}
				})
			} else {
				let result = { success: false, message: "Record already exist" };
				return res.jsonx(result);
			}
		})
	},

	lowCapexBuyerInfo: function (req, res) {

		let query = { equipment: req.param('equipmentId') };

		Orders.findOne(query).populate("buyerId").exec(function (err, response) {

			if (response != undefined || response == undefined) {
				return res.jsonx({
					success: true,
					data: response
				})
			} else {
				return res.jsonx({
					success: false,
					message: "Not Found"
				})
			}
		})
	},


	ordernow: function (req, res) {
		let query = {}
		var equipmentId = req.body.equipmentId;
		Orders.find({ equipmentId: equipmentId }).exec(function (err, data) {
			if (data.length == 0) {
				query.equipmentId = req.body.equipmentId;
				query.paymentId = req.body.paymentId;
				query.productId = req.body.equipmentId;
				query.sellerId = req.body.user;
				query.buyerId = req.body.buyerId;
				query.amount = req.body.amount;
				query.productType = "equipment";
				query.paymentType = "rest payment";
				query.paymentStatus = false;
				Orders.create(query).exec(function (err, result) {
					if (err) {
						return res.jsonx({
							success: false,
							message: "error to add your order"
						})
					}
					else {
						return res.jsonx({
							success: true,
							message: "successfully done your order",
							data: result
						})
					}
				})

			}
			else {
				return res.jsonx({
					success: false,
					message: "order alreday done"
				})
			}
		})
	},

	markApp: function (req, res) {
		let query = {}
		var equipmentId = req.body.equipmentId;
		Payments.find({ equipmentId: equipmentId }).exec(function (err, data) {
			if (data.length == 0) {
				let query = {}
				query.productId = req.body.equipmentId;
				query.equipmentId = req.body.equipmentId;
				query.sellerId = req.body.user;
				query.buyerId = req.body.buyerId;
				query.amount = req.body.amount;
				query.orderId = req.body.orderId;
				query.productType = "equipment";
				query.paymentStatus = true;
				Payments.create(query).exec(function (err, result) {
					if (err) {
						return res.jsonx({
							success: false,
							message: "Error"
						})
					}
					else {
						let record = {};
						record.paymentId = result.id;
						record.productId = result.equipmentId;
						record.equipment = result.equipmentId;
						record.sellerId = result.user;
						record.buyerId = result.buyerId;
						record.amount = result.amount;
						record.productType = "equipment";
						record.paymentType = "rest payment";
						record.paymentStatus = true;
						Orders.create(record).exec(function (err, record) {
							if (err) {
								return res.jsonx({
									success: false,
									message: "payment error"
								})
							}
							else {
								Orders.update({ productId: record.productId }, { paymentId: record.paymentId }).then(function (result1) {
									if (result1) {
										return res.jsonx({
											success: true,
											message: "payment completed",
											data: result
										})
									}
									else {
										return res.jsonx({
											success: false,
											message: "error"
										})
									}
								}).fail(function (error) {
									return res.jsonx({
										success: false,
										message: "Server Error"
									})
								})
							}
						})
					}
				})

			}
			else {
				return res.jsonx({
					success: false,
					message: "payment already done"
				})
			}
		})
	},

	transactionDetails: function (req, res) {
		let query = { equipment: req.param('equipmentId') };

		Orders.find(query).populate("paymentId").populate("buyerId").populate("sellerId").exec(function (err, response) {
			if (!_.isEmpty(response)) {
				return res.jsonx({
					success: true,
					data: response
				})
			} else {
				return res.jsonx({
					success: false,
					message: "Not Found"
				})
			}
		})
	},

	payUhash: function (req, res) {
		var sha512 = require('sha512')
		var crypto = require('crypto');
		var key = req.body.key;
		var txnid = req.body.txnid;
		var price = req.body.amount; var amount = parseFloat(price);
		var productinfo = req.body.productinfo;
		var firstname = req.body.firstname;
		var email = req.body.email;
		var mobile = req.body.phone; var phone = parseInt(mobile);
		var surl = req.body.surl;
		var furl = req.body.furl;
		var service_provider = req.body.service_provider;

		var hash = sha512(key | txnid | "2000" | productinfo | firstname | email | surl | furl | service_provider);
		// var sha5121 = crypto.createHash('sha512').update(key+'|'+txnid).digest("hex");
	},

	logistic: function (req, res) {
		let query = { equipment: req.body.equipmentId, sellerId: req.body.sellerId, paymentType: 'commission' };

		Orders.findOne(query).populate('buyerId').then(function (order) {

			if (!_.isEmpty(order)) {
				req.body.buyerId = order.buyerId
				req.body.companyName = req.body.companyName;
				let logistic = req.body;


				Equipmentlogistic.create(logistic).then(function (elogistic) {

					if (!_.isEmpty(elogistic)) {
						let query = { id: elogistic.equipmentId };
						let data = { equipmentLogisticId: elogistic.id };

						Equipment.update(query, data).then(function (equipmentdetail) {
							equipmentdetail.buyerId = elogistic.buyerId;

							if (!_.isEmpty(equipmentdetail)) {
								var transport = nodemailer.createTransport(smtpTransport({
									host: sails.config.appSMTP.host,
									port: sails.config.appSMTP.port,
									debug: sails.config.appSMTP.debug,
									auth: {
										user: sails.config.appSMTP.auth.user,
										pass: sails.config.appSMTP.auth.pass
									}
								}));

								message = 'Hello ' + order.buyerId.fullName;
								message += '<br/><br/>';
								message += 'msg'
								message += '<br/><br/><br/>';
								message += 'Thanks';
								message += '<br/>';
								message += 'eFarmX Team';

								transport.sendMail({
									from: sails.config.appSMTP.auth.user,
									to: order.buyerId.email,
									subject: 'Logistic Notification',
									html: message
								}, function (err, info) {
									if (err) {
										return res.jsonx({
											success: false,
											code: 404,
											message: constantObj.messages.SEND_MAIL_ISSUE,
											key: 'SEND_MAIL_ISSUE'
										});

									} else {
										return res.jsonx({
											success: true,
											code: 200,
											message: constantObj.messages.MAIL_SENT,
											key: 'MAIL_SENT',
											data: equipmentdetail
										});
									}
								});
							}
						}).fail(function (error) {
							return res.jsonx({
								error2: error
							})
						})
					} else {
						return res.jsonx({
							success: false,
							message: "NOT_FOUND"
						})
					}
				}).fail(function (error) {
					return res.jsonx({
						error3: error
					})
				})
			} else {
				return res.jsonx({
					success: false,
					message: "Not Found"
				})
			}
		}).fail(function (error) {
			return res.jsonx({
				error1: error
			})
		})
	},

	financeManagement: function (req, res) {
		let data = req.body;
		data.productType = 'equipment'
		data.paymentStatus = true;

		Orders.create(data).then(function (order) {
			if (!_.isEmpty(order)) {
				data.orderId = order.id

				Payments.create(data).then(function (payment) {
					if (!_.isEmpty(payment)) {
						let query = { id: payment.orderId }
						let orderdata = { paymentId: payment.id, paymentStatus: true };

						Orders.update(query, orderdata).then(function (orderdetail) {
							if (!_.isEmpty(orderdetail)) {
								let query = { id: data.equipment };
								let equipmentdata = { ddPayment: payment.id };

								Equipment.update(query, equipmentdata).then(function (equipmentdetail) {

									if (!_.isEmpty(equipmentdetail)) {
										return res.jsonx({
											success: true,
											data: payment
										})
									} else {
										return res.jsonx({
											success: false,
											message: "Not Found"
										})
									}
								}).fail(function (error) {

									return res.jsonx({
										error: error
									})
								})
							}
						}).fail(function (error) {
							return res.jsonx({
								error: error
							})
						})
					}
				}).fail(function (error) {
					return res.jsonx({
						error: error
					})
				})
			}
		}).fail(function (error) {
			return res.jsonx({
				error: error
			})
		})
	},

	deleteOrder: function (req, res) {
		let orderid = { id: req.param('id') };

		Orders.destroy(orderid).then(function (result) {

			if (!_.isEmpty(result)) {
				return res.jsonx({
					success: true,
					message: "order_deleted",
					key: "order_deleted"
				})
			} else {
				return res.jsonx({
					success: false,
					error: {
						code: 404,
						message: constantObj.messages.NOT_FOUND,
						key: 'NOT_FOUND'
					},
				})
			}
		}).fail(function (error) {

			return res.jsonx({
				error: { error: error }
			})
		})
	},

	logisticPreference: function (req, res) {
		let data = req.body

		Logisticpreference.create(data).then(function (preference) {
			if (!_.isEmpty(preference)) {

				Equipment.update({ id: req.body.equipmentId }, { logisticsPreference: preference.id }).then(function (logistic) {
					if (!_.isEmpty(logistic)) {
						return res.jsonx({
							success: true,
							data: preference
						})
					} else {
						return res.jsonx({
							success: false,
							error: {
								code: 404,
								message: constantObj.messages.NOT_FOUND,
								key: 'NOT_FOUND'
							},
						})
					}
				}).fail(function (error) {
					return res.jsonx({
						error: error
					})
				})

			} else {
				return res.jsonx({
					success: false,
					error: {
						code: 404,
						message: constantObj.messages.NOT_FOUND,
						key: 'NOT_FOUND'
					},
				})
			}
		}).fail(function (error) {
			return res.jsonx({
				error: error
			})
		})
	},

	getEquipmentDetail: function (req, res) {

		let Id = req.param('id')

		Equipment.findOne(Id).populate('user').populate('orderId').populate('paymentId').populate('manufacturer').populate('category').populate('equipmentLogisticId').populate('logisticsPreference').populate('logisticPayment').populate('ddPayment').then(function (data) {
			if (data) {

				//console.log("data of equipment",data)
				let query = {};

				let totalEquipment = {};
				totalEquipment.isDeleted = false;
				totalEquipment.isApproved = true;
				totalEquipment.user = data.user.id;

				Equipment.count(totalEquipment).exec(function (equiperr, postedTotal) {
					data.postedTotal = postedTotal;
					if (equiperr) {
						return res.jsonx({
							success: false,
							code: 400,
							error: equiperr
						});
					} else {
						if (data.paymentId != undefined) {
							query.id = data.paymentId.buyerId;

							Users.findOne(query).exec(function (err, userdata) {
								if (userdata) {
									data.buyerId = userdata;
								} else {
									data.buyerId = data.paymentId.buyerId;
								}
								return res.jsonx({
									success: true,
									data: data
								})
							})
						} else {
							return res.jsonx({
								success: true,
								data: data
							})
						}
					}
				})
			}
		})
	},

	show: function (req, res) {
		let Id = req.param('id');
		var count = 0;

		Lands.findOne(Id).populate('user').then(function (landInfo) {

			let totalLand = {};

			totalLand.isDeleted = false;
			//totalLand.isVerified = true;
			totalLand.isApproved = true;
			totalLand.user = landInfo.user.id;

			Lands.count(totalLand).exec(function (landerr, postedTotal) {
				landInfo.postedTotal = postedTotal;
				if (landerr) {
					return res.jsonx({
						success: false,
						code: 400,
						error: landerr
					});
				} else {
					return res.jsonx({
						success: true,
						code: 200,
						data: landInfo
					});
				}
			})
		});
	},


	// lol: function(req, res){
	// 	Orders.findOne({id:'59a80b878127578d1fcc2e84'}).then(function(date){
	// 		// var minutes = 1000 * 60;
	// 		// var hours = minutes * 60;
	// 		// var a = pastdate.setDate(pastdate.getHours() - 1);
	// 		var pastdate = new Date(date.createdAt);
	// 		var currentdate = new Date();
	// 		var newdate = new Date(currentdate.valueOf() - 1000*60*60*5);

	// 		let query = {
	// 			createdAt: { $lt : newdate }
	// 		}

	// 		Orders.find({where: query}).exec(function(finderr,finddata){
	// 			return res.jsonx({
	// 				date: finddata
	// 			})
	// 		})
	// 	}).fail(function(err){
	// 		return res.jsonx({
	// 			error: error
	// 		})
	// 	})
	// }}

	cpexpaymentstatus: function (req, res) {

		let itemID = req.body.udf1;
		let referer = req.body.udf2;
		let amount = req.body.net_amount_debit;

		let data = {};
		data.productId = req.body.udf1;
		data.equipment = req.body.udf1;
		data.productType = "equipment";
		data.capex = "high";

		if (req.body.udf3 == '' || req.body.udf3 == 'undefined') { //checking if buyer id is null
			data.equipmentInterestsId = { $exists: false };

			Users.findOne({ username: req.body.email }).then(function (userinfo) {
				if (userinfo) {
					data.sellerId = userinfo.id
					Payments.findOne(data).then(function (paymentdetail) {
						if (paymentdetail != undefined) {
							return res.jsonx({
								success: false,
								error: "You have already paid for this equipment."
							});
						} else {
							if (req.body.status == 'success') {
								delete data.equipmentInterestsId;
								data.amount = req.body.amount;
								data.payment = req.body;

								Payments.create(data).then(function (response) {
									if (response) {
										data.paymentId = response.id;
										Orders.create(data).then(function (orderresponse) {
											let eqdata = {};
											eqdata.paymentStatus = "true";
											eqdata.paymentId = response.id;
											eqdata.isApproved = true;

											Equipment.update({ id: orderresponse.equipment }, eqdata).exec(function (err, resdata) {

												if (resdata) {
													var itemID = req.body.udf1;
													var url = constantObj.appUrls.FRONT_WEB_URL + '/#/payments/equipmentCapex/' + itemID + '/' + amount + '/success';
													var msg = constantObj.equipment.ACCESS_ON_FRONTEND

													var data = {};
													var pdfData = {};
													data.user = resdata[0].user;
													data.message = msg;
													let notificationData = {}

													notificationData.productId = resdata.id;
													notificationData.equipment = resdata.id;
													notificationData.sellerId = resdata.user;
													notificationData.productType = "equipment";
													notificationData.message = msg;
													notificationData.readBy = [];

													var style = "<style>td{min-width:85px;};th{text-align:left;};</style>";
													var rate_breakdown_table = '<table style=" border: 1px solid black;">';
													rate_breakdown_table += '<tr>'
													rate_breakdown_table += '<th> </th>'
													rate_breakdown_table += '<th>Equipment</th>'
													rate_breakdown_table += '<th>Product Type</th>'
													rate_breakdown_table += '<th>Mode</th>'
													rate_breakdown_table += '<th>Transaction Number</th>'
													rate_breakdown_table += '<th>Date</th>'
													rate_breakdown_table += '<th>Amount</th>';
													rate_breakdown_table += '</tr>'

													rate_breakdown_table += '<tr>'
													rate_breakdown_table += '<td></td>'
													rate_breakdown_table += '<td>' + resdata.name + '</td>'
													rate_breakdown_table += '<td>' + resdata.capex + ' capex </td>'
													rate_breakdown_table += '<td>' + response.payment.mode + '</td>';
													rate_breakdown_table += '<td>' + response.payment.txnid + '</td>'
													rate_breakdown_table += '<td>' + response.payment.addedon + '</td>'
													rate_breakdown_table += '<td> ' + response.payment.amount + '</td>';
													rate_breakdown_table += '</tr>'

													rate_breakdown_table += '<tr style="padding-top:100px">'
													rate_breakdown_table += '<td colspan="6"></td>'
													rate_breakdown_table += '<td> ₹' + response.payment.amount + '</td>';
													rate_breakdown_table += '</tr>'
													rate_breakdown_table += '</table>'
													rate_breakdown_table += style;


													pdfData.mailBody = rate_breakdown_table
													pdfData.email = userinfo.username;
													pdfData.subject = "Payment Notification";
													pdfData.message = msg;

													smsData = {};
													smsData.mobile = userinfo.mobile;
													smsData.message = msg;

													Notifications.create(notificationData).then(function (notificationResponse) {
														if (notificationResponse) {
															commonService.sendSaveNotification(data, function (err, response) { })
															commonService.createPDF(pdfData, function (err, response) { })
															commonService.sendSMS(smsData, function (err, response) { })

															sails.sockets.blast('Showing product at frontend', notificationResponse);

															res.redirect(url);
														}

													})


												} else {
													return res.status(400).jsonx({
														success: false,
														error: err
													});
												}
											})
										});
									}
								}).fail(function (error) {
									return res.jsonx({
										success: false,
										error: {
											code: 404,
											message: constantObj.equipment.UNABLE_TO_SAVE_PAYMENT,
											key: 'UNABLE_TO_SAVE_PAYMENT',
											error: error
										},
									});

								});
							} else {
								let url = constantObj.appUrls.FRONT_WEB_URL + '/#/payments/equipmentCapex/' + itemID + '/' + amount + '/failure';
								res.redirect(url);
							}
						}
					})
				}
			})
		} else { // Payment process for checking the buyer detail. Buyer id will exist in this condition.
			data.equipmentInterestsId = { $exists: true };
			Users.findOne({ username: req.body.email }).then(function (userinfo) {
				if (userinfo) {
					data.sellerId = userinfo.id;
					data.buyerId = req.body.udf3;

					Payments.findOne(data).then(function (forbuyerpayment) {
						if (forbuyerpayment != undefined) {
							return res.jsonx({
								success: false,
								error: "You have already paid for this buyer."
							});
						} else {
							if (req.body.status == 'success') {
								delete data.equipmentInterestsId;
								data.amount = req.body.amount;
								data.payment = req.body;

								Payments.create(data).then(function (response) {
									if (response) {
										data.paymentId = response.id;
										Orders.create(data).then(function (orderresponse) {
											let eqdata = {};
											eqdata.paymentStatus = "true";
											eqdata.paymentId = response.id;
											eqdata.isApproved = true;
											eqdata.payment = req.body;

											let interestData = {};
											interestData.equipmentId = response.equipment;
											interestData.buyerId = response.buyerId;


											Equipmentinterests.findOne(interestData).exec(function (intrsterr, interest) {
												if (interest) {
													Equipmentinterests.update({ id: interest.id }, eqdata).exec(function (err, resdata) {

														if (resdata) {
															var itemID = req.body.udf1;
															var buyerId = req.body.udf3;
															var url = constantObj.appUrls.FRONT_WEB_URL + '/#/payments/equipmentCapex/' + itemID + '/' + amount + '/success/' + buyerId;
															var msg = constantObj.equipment.VIEW_BUYER_REQ

															var data = {};
															var pdfData = {};
															data.user = resdata[0].user;
															data.message = msg;
															let notificationData = {}

															notificationData.productId = orderresponse.productId;
															notificationData.equipment = orderresponse.equipment;
															notificationData.sellerId = userinfo.id;
															notificationData.productType = "equipment";
															notificationData.message = msg;
															notificationData.readBy = [];

															var style = "<style>td{min-width:85px;};th{text-align:left;};</style>";
															var rate_breakdown_table = '<table style=" border: 1px solid black;">';
															rate_breakdown_table += '<tr>'
															rate_breakdown_table += '<th> </th>'
															rate_breakdown_table += '<th>Equipment</th>'
															rate_breakdown_table += '<th>Product Type</th>'
															rate_breakdown_table += '<th>Mode</th>'
															rate_breakdown_table += '<th>Transaction Number</th>'
															rate_breakdown_table += '<th>Date</th>'
															rate_breakdown_table += '<th>Amount</th>';
															rate_breakdown_table += '</tr>'

															rate_breakdown_table += '<tr>'
															rate_breakdown_table += '<td></td>'
															rate_breakdown_table += '<td>' + resdata.name + '</td>'
															rate_breakdown_table += '<td>' + resdata.capex + ' capex </td>'
															rate_breakdown_table += '<td>' + response.payment.mode + '</td>';
															rate_breakdown_table += '<td>' + response.payment.txnid + '</td>'
															rate_breakdown_table += '<td>' + response.payment.addedon + '</td>'
															rate_breakdown_table += '<td> ' + response.payment.amount + '</td>';
															rate_breakdown_table += '</tr>'

															rate_breakdown_table += '<tr style="padding-top:100px">'
															rate_breakdown_table += '<td colspan="6"></td>'
															rate_breakdown_table += '<td> ₹' + response.payment.amount + '</td>';
															rate_breakdown_table += '</tr>'
															rate_breakdown_table += '</table>'
															rate_breakdown_table += style;


															pdfData.mailBody = rate_breakdown_table
															pdfData.email = userinfo.username;
															pdfData.subject = "Payment Notification";
															pdfData.message = msg;

															smsData = {};
															smsData.mobile = userinfo.mobile;
															smsData.message = msg;

															Notifications.create(notificationData).then(function (notificationResponse) {
																if (notificationResponse) {
																	commonService.sendSaveNotification(data, function (err, response) { })
																	commonService.createPDF(pdfData, function (err, response) { })
																	commonService.sendSMS(smsData, function (err, response) { })
																	sails.sockets.blast('Showing product at frontend', notificationResponse);

																	res.redirect(url);
																}

															})


														} else {
															return res.status(400).jsonx({
																success: false,
																error: err
															});
														}
													})
												}
											})
										});
									}
								}).fail(function (error) {
									return res.jsonx({
										success: false,
										error: {
											code: 404,
											message: constantObj.equipment.UNABLE_TO_SAVE_PAYMENT,
											key: 'UNABLE_TO_SAVE_PAYMENT',
											error: error
										},
									});

								});
							} else {
								let url = constantObj.appUrls.FRONT_WEB_URL + '/#/payments/equipmentCapex/' + itemID + '/' + amount + '/failure';
								res.redirect(url);
							}
						}
					})
				}
			})

		}
	},

	markDeliveredByBuyer: function (req, res) {
		let equipmentId = req.body.equipmentId;
		let data = {};

		Equipment.update({ id: equipmentId }, { soldOut: true }).exec(function (err, resdata) {
			if (resdata) {
				let message = "Your Equipment " + resdata[0].code + " has been delivered successfully.";

				var transport = nodemailer.createTransport(smtpTransport({
					host: sails.config.appSMTP.host,
					port: sails.config.appSMTP.port,
					debug: sails.config.appSMTP.debug,
					auth: {
						user: sails.config.appSMTP.auth.user, //access using /congig/appSMTP.js
						pass: sails.config.appSMTP.auth.pass
					}
				}));

				message = 'Hello';
				message += '<br/><br/>';
				message += message
				message += '<br/><br/><br/>';
				message += 'Thanks';
				message += '<br/>';
				message += 'eFarmX Team';

				transport.sendMail({
					from: req.body.buyerEmail,
					to: req.body.sellerEmail,
					subject: 'Delivery Confirmation',
					html: message
				}, function (err, info) {
					if (err) {

					} else {

					}
				});
				return res.jsonx({
					success: true
				});
			} else {
				return res.status(400).jsonx({
					success: false,
					error: err
				});
			}

		})
	},
	getEquipmentFilters: function (req, res) {

		let query = {};
		query.type = "equipments";
		query.isDeleted = false;
		query.status = "active";
		var filters = {};

		Category.find(query).exec(function (err, categories) {

			if (categories) {
				States.find().exec(function (staeterr, states) {
					filters.state = states;
					filters.categories = categories;
					filters.prices = constantObj.filter.price;
					filters.type = constantObj.filter.type;
					return res.jsonx(filters);
				})

			}
		});
	}
};