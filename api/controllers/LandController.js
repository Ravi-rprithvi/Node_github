/**
 * LandController
 *
 * @description :: Server-side logic for managing lands
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var path = require('path');
var constantObj = sails.config.constants;
var smtpTransport = require('nodemailer-smtp-transport');
var nodemailer = require('nodemailer');
const exotelService = require('../services/exotelService');
var transport = nodemailer.createTransport(smtpTransport({
	host: sails.config.appSMTP.host,
	port: sails.config.appSMTP.port,
	debug: sails.config.appSMTP.debug,
	auth: {
		user: sails.config.appSMTP.auth.user, //access using /congig/appSMTP.js
		pass: sails.config.appSMTP.auth.pass
	}
}));
var pushService = require('../services/PushService.js');

emailGeneratedCode = function (options) { //email generated code 
	var url = options.verifyURL,
		email = options.email,
		//password = options.password;

		message = 'Hello!';
	message += '<br/>';
	message += 'Your payment link is';
	message += '<br/><br/>';
	message += '<a href="' + options.verifyURL + '" target="_blankh" >Click and pay</a>';
	message += '<br/>';
	// message += 'Password : ' + password;

	transport.sendMail({
		from: sails.config.appSMTP.auth.user,
		to: email,
		subject: 'Payment',
		html: message
	}, function (err, info) {
	});

	return {
		success: true,
		data: {
			"message": "Payment link has been sent to Email"
		}
	}
};
module.exports = {
	getMostPopularLand: function (req, res) {
		API(LandServices.getMostPopularLand, req, res);
	},
	getRecentViewLand: function (req, res) {
		API(LandServices.getRecentViewLand, req, res);
	},

	add: function (req, res) {
		API(LandServices.save, req, res);
	},
	updateBannerLand: function (req, res) {
		API(LandServices.updateBannerLand, req, res);
	},
	update: function (req, res) {
		API(LandServices.updateLand, req, res);
	},
	updateFinance: function (req, res) {
		API(LandServices.updateFinance, req, res);
	},
	delete: function (req, res) {
		API(LandServices.deleteLand, req, res);
	},
	getAll: function (req, res) {
		// console.log("arun===land")
		API(LandServices.getAllAdmin, req, res);
	},
	getVisibilityOfLands: function (req, res) {
		API(LandServices.getVisibilityOfLands, req, res);
	},
	getAllLands: function (req, res) {
		API(LandServices.getAllLands, req, res);
	},
	approveLand: function (req, res) {
		API(LandServices.approveLand, req, res);
	},
	frnRejectLand: function (req, res) {
		API(LandServices.frnRejectLand, req, res);
	},
	verifyLand: function (req, res) {
		API(LandServices.verify, req, res);
	},
	disapproveLand: function (req, res) {
		API(LandServices.disapproveLand, req, res);
	},
	landDetail: function (req, res) {
		API(LandServices.landFrontDetail, req, res);
	},
	show: function (req, res) {
		API(LandServices.show, req, res);
	},
	adminLandDetail: function (req, res) {
		API(LandServices.adminLandDetail, req, res);
	},
	getMyLands: function (req, res, next) {
		API(LandServices.getMyLands, req, res);
	},
	franchiseeLands: function (req, res) {
		API(LandServices.franchiseeLands, req, res);
	},
	frontLands: function (req, res, next) {
		API(LandServices.frontLands, req, res);
	},
	frontLandsFilter: function (req, res, next) {
		API(LandServices.frontLandsFilter, req, res);
	},
	landMail: function (req, res, next) {
		API(LandServices.landMail, req, res);
	},

	timeSlot: function (req, res) {
		API(LandServices.getTimeSlot, req, res);
	},

	franchiseeApprove: function (req, res) {
		API(LandServices.franchiseeApprove, req, res);
	},
	getFeaturedLand: function (req, res) {
		API(LandServices.getFeaturedLand, req, res);
	},
	getHomeLand: function (req, res) {
		API(LandServices.getHomeLand, req, res);
	},
	getHomeLandPastOrder: function (req, res) {
		API(LandServices.getHomeLandPastOrder, req, res);
	},
	relatedLand: function (req, res) {
		API(LandServices.relatedLand, req, res);
	},
	cancelTimeSlot: function (req, res) {
		API(LandServices.cancelTimeSlot, req, res);
	},
	compareLand: function (req, res) {
		API(LandServices.compareLand, req, res);
	},


	rentLand: function (req, res) {
		//Settings.find({},{})
		Lands.findOne({ id: req.body.landId })
			.then(function (response) {

				let data = {};

				let rentquery = {
					landId: req.body.landId,
					buyerId: req.body.buyerId,
					user: req.body.sellerId,
					startDateTime: { $gte: req.body.startDateTime },
					endDateTime: { $lte: req.body.endDateTime }
				}

				Rentland.find({ where: rentquery }).exec(function (finderr, finddata) {

					if (!_.isEmpty(finddata)) {
						return res.jsonx({
							success: false,
							message: "Land already rented"
						})
					} else {
						data.efarmxComission = response.efarmxComission;
						data.taxRate = response.taxRate;
						data.originalPrice = response.price;
						data.netPrice = req.body.netPrice;
						data.commissionPrice = req.body.commissionPrice;
						data.taxRatePrice = req.body.taxRatePrice;
						data.startDateTime = req.body.startDateTime;
						data.endDateTime = req.body.endDateTime;

						Rentland.create(data).exec(function (err, response) {
							if (err) {
								return res.jsonx({
									success: false,
									error: err
								});
							}
							if (response) {
								return res.jsonx({
									success: true,
									message: 'RENT_REQUEST_SUCCESS_LAND'
								});
							}
						});
					}
				});
			});
	},

	buyLand: function (req, res) {
		let data = {};
		data.landId = req.body.landId;
		data.buyerId = req.body.buyerId;
		data.user = req.body.sellerId

		Orders.findOne(data).exec(function (ordererr, response) {
			if (response) {
				return res.jsonx({
					success: false,
					error: {
						code: 400,
						message: constantObj.crops.ALREADY_PAID_LAND,
						key: 'ALREADY_PAID_LAND'
					}
				});
			} else {
				data.buyerId = req.body.buyerId;
				Orders.create(data).exec(function (err, response) {

					if (err) {
						return res.jsonx({
							success: false,
							error: error
						});
					} else {
						return res.jsonx({
							success: true,
							data: {
								response: response
							}
						});
					}
				})
			}
		});
	},

	landinterested: function (req, res) {
		Settings.find({}, {})
			.then(function (response) {
				let interestedShare = response[0].interestLandShare;

				let data = {};
				data.landId = req.body.landId;
				data.buyerId = req.body.buyerId;
				data.user = req.body.sellerId
				data.amountPaidBySeller = interestedShare;

				Landinterests.findOne({ landId: req.body.landId, buyerId: req.body.buyerId, user: req.body.sellerId }).exec(function (usrreqerr, usrreqresponse) {

					if (usrreqresponse != undefined) {
						return res.jsonx({
							success: false,
							error: {
								code: 400,
								message: constantObj.land.ALREADY_REQUESTED_LAND,
								key: 'ALREADY_REQUESTED_LAND'
							}
						});
					} else {
						Landinterests.create(data).exec(function (err, response) {
							if (err) {
								return res.jsonx({
									success: false,
									error: error
								});
							}
							if (response) {
								Lands.findOne({ id: data.landId, user: data.user }).populate('user').exec(function (err, success) {
									if (!err) {
										var mail = emailGeneratedCode({
											email: success.user.email,
											verifyURL: "http://172.24.2.247:4200/#/external/equipmentpay/" + success.user.id
										})

										return res.jsonx({
											success: true,
											code: 200,
											data: {
												mail: mail.message,
											}
										});
									} else {

										return res.jsonx({
											success: false,
											error: error
										});
									}
								})
							}
						})
					}
				});
			});
	},

	interestedBuyers: function (req, res) {

		let data = {};
		data.landId = req.param("landId");
		data.user = req.param("sellerId");
		//data.paymentStatus = "true";
		Landinterests.find(data).populate('buyerId').populate('user').exec(function (intrsterr, intrstresponse) {
			if (intrsterr) {
				return res.jsonx({
					success: false,
					error: intrsterr
				});
			} else if (intrstresponse.length == 0) {
				return res.jsonx({
					success: false,
					error: "No data"

				});
			} else {
				return res.jsonx({
					success: true,
					data: intrstresponse

				});
			}
		});
	},

	payNow: function (req, res) {
		let data = {};
		let result = {};
		let query = {};

		data.productId = req.body.landId;
		data.user = req.body.sellerId;
		data.buyerId = req.body.buyerId;
		data.amount = req.body.amount;
		data.productType = "land";
		data.paymentStatus = true;


		//data.equipmentInterestsId = {$exists:false};
		Payments.findOne(data).exec(function (err, paymentdetail) {

			if (paymentdetail !== undefined) {
				return res.jsonx({
					success: false,
					error: {
						code: 400,
						message: constantObj.land.ALREADY_REQUESTED_LAND,
						key: 'ALREADY_REQUESTED_LAND'
					}
				});

			} else {
				data.land = req.body.landId;

				Payments.create(data).then(function (response) {
					if (response) {
						Lands.findOne({ user: response.user }).populate('user').exec(function (err, data) {

							message = 'Hello!';
							message += '<br/>';
							message += 'Your product booked';
							message += '<br/><br/>';

							transport.sendMail({
								from: sails.config.appSMTP.auth.user,
								to: data.user.email,
								subject: 'orders',
								html: message
							}, function (err, info) {

							});

							result.productId = req.body.landId;
							result.sellerId = req.body.sellerId;
							result.buyerId = req.body.buyerId;

							Orders.update({ result }, { paymentId: response.id }).then(function (result) {

								if (result.length == 0) {
									return res.jsonx({
										success: false,
										error: {
											code: 400,
											message: "data not found"
										}
									});
								} else {
									return res.jsonx({
										success: true,
										code: 200,
										message: "successfully updated"
									});
								}
							})

						})
					}
					else {
						return res.jsonx({
							success: false,
							error: {
								code: 400,
								message: "some error occured"
							}
						});
					}
				})
			}
		});
	},

	soldOutLand: function (req, res) {
		let query = {};
		query.soldOut = "true";
		Lands.update({ id: req.body.landId }, query).exec(function (updateerr, updatedata) {

			if (updateerr) {
				return res.status(400).jsonx({
					success: false,
					error: updateerr
				});
			} else {
				let filtercriteria = {}
				filtercriteria.landId = req.body.landId;
				filtercriteria.buyerId = req.body.buyerId;
				filtercriteria.user = req.body.sellerId;
				//updatecapex.prouductAmount = req.body.amount;

				Orders.findOne(filtercriteria).exec(function (finderr, finddata) {

					if (finddata) {
						Orders.update({ id: finddata.id }).exec(function (err, response) {
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

	frontLands1: function (req, res, next) {

		var sortBy = req.param('sortBy');
		var page = req.param('page');
		var count = req.param('count');
		var search = req.param('search');
		var skipNo = (page - 1) * count;
		var query = {};

		//sortBy = sortBy.toString();
		if (sortBy) {
			sortBy = sortBy.toString();
		} else {
			sortBy = 'createdAt desc';
		}

		query.isDeleted = false;
		// query.isApproved = true;
		query.soldOut = false;
		query.approvalStatus = 'Admin_Approved'

		if (search) {
			query.$or = [
				{
					expected_price: {
						'like': '%' + search + '%'
					}
				},
				{
					district: {
						'like': '%' + search + '%'
					}
				},
				{
					area: {
						'like': '%' + search + '%'
					}
				},
				{
					rentSell: {
						'like': '%' + search + '%'
					}
				}

			]
		}

		Lands.count(query).exec(function (err, total) {
			if (err) {
				return res.status(400).jsonx({
					success: false,
					error: err
				});
			} else {
				Lands.find(query).populate('user').sort(sortBy).skip(skipNo).limit(count).then(function (lands) {
					return res.jsonx({
						success: true,
						data: {
							lands: lands,
							total: total
						},
					});
				}).fail(function (err) {
					return res.status(400).jsonx({
						success: false,
						error: err
					});
				})
			}
		})
	},

	landsInfoForMap: function (req, res) {
		let polygoncoordinatesjS = req.param('boundaries')
		let maxRecordCount = req.param('maxRecordCount')
		let polygoncoordinates = []
		if (polygoncoordinatesjS) {
			polygoncoordinates = JSON.parse(polygoncoordinatesjS)
			console.log("polygoncoordinates == ", polygoncoordinates)
		}
		if (maxRecordCount == undefined) {
			maxRecordCount = 200
		}
		if (polygoncoordinates == undefined || polygoncoordinates.length < 3) {
			return res.status(400).jsonx({
				success: false,
				error: {
					code: 400,
					message: 'please send boundaries in closed loop'
				}
			});
		} else {
			// {$geoWithin:{
			//  $geometry: {
			//      type: "Polygon",
			//      coordinates: [[[ 26.111, 78.100 ], [ 30.4714500, 78.500 ], [ 30.4714500, 80.065278 ], [ 27.4714500, 80.065278 ],[ 27.4714500, 78.500 ],[ 26.111, 78.100 ]
			//                        ]]}}}
			var query = {};

			let sort = 'leasePrice ASC'

			let type = req.param("type")
			if (type) {
				if (type == 'lease') {
					query.forLease = true
					sort = 'leasePrice ASC'
				} else {
					query.forSell = true
					sort = 'sellPrice ASC'
				}
			}


			query.isDeleted = false;
			// query.soldOut = false;
			query.approvalStatus = 'Admin_Approved'

			let geoWithin = {}
			geoWithin.$geometry = { type: "Polygon", coordinates: [polygoncoordinates] }
			query.coordinates = { $geoWithin: geoWithin }

			Lands.find(query, { fields: ['code', 'coordinates', 'leasePriceDisplay', 'sellPriceDisplay', 'forLease', 'forSell', 'city', 'district', 'state', 'leasePriceUnit', 'availableArea'] }).sort(sort)
				.exec(function (error, lands) {
					if (error) {
						return res.status(400).jsonx({
							success: false,
							error: error
						});
					} else {
						if (lands.length > maxRecordCount) {
							let landsgroupedWithCities = _.groupBy(lands, 'city');
							let cities = Object.keys(landsgroupedWithCities)
							if (cities.length > maxRecordCount) {
								let landsgroupedWithDistrict = _.groupBy(lands, 'district');
								let district = Object.keys(landsgroupedWithDistrict)
								if (district.length > maxRecordCount) {
									let landsgroupedWithstate = _.groupBy(lands, 'state');
									let state = Object.keys(landsgroupedWithstate)
									let groupedstate = []
									state.forEach((slrid, index) => {
										let citywise = {}
										citywise.name = slrid
										citywise.coordinates = landsgroupedWithstate[slrid][0].coordinates
										citywise.landsCount = landsgroupedWithstate[slrid].length
										citywise.leasePriceLowest = landsgroupedWithstate[slrid][0].leasePriceDisplay
										citywise.leasePriceHighest = landsgroupedWithstate[slrid][landsgroupedWithstate[slrid].length - 1].leasePriceDisplay
										citywise.sellPriceLowest = landsgroupedWithstate[slrid][0].sellPriceDisplay
										citywise.sellPriceighest = landsgroupedWithstate[slrid][landsgroupedWithstate[slrid].length - 1].sellPriceDisplay
										groupedstate.push(citywise)
									})

									return res.jsonx({
										success: true,
										data: {
											lands: groupedstate,
											grouped: true,
											groupType: 'state'
										},
									});
								} else {
									let groupeddistrict = []
									district.forEach((slrid, index) => {
										let citywise = {}
										citywise.name = slrid
										citywise.coordinates = landsgroupedWithDistrict[slrid][0].coordinates
										citywise.landsCount = landsgroupedWithDistrict[slrid].length
										citywise.leasePriceLowest = landsgroupedWithDistrict[slrid][0].leasePriceDisplay
										citywise.leasePriceHighest = landsgroupedWithDistrict[slrid][landsgroupedWithDistrict[slrid].length - 1].leasePriceDisplay
										citywise.sellPriceLowest = landsgroupedWithDistrict[slrid][0].sellPriceDisplay
										citywise.sellPriceighest = landsgroupedWithDistrict[slrid][landsgroupedWithDistrict[slrid].length - 1].sellPriceDisplay
										groupeddistrict.push(citywise)
									})

									return res.jsonx({
										success: true,
										data: {
											lands: groupeddistrict,
											grouped: true,
											groupType: 'district'
										},
									});
								}
							} else {
								let groupedcities = []
								cities.forEach((slrid, index) => {
									let citywise = {}
									citywise.name = slrid
									citywise.coordinates = landsgroupedWithCities[slrid][0].coordinates
									citywise.landsCount = landsgroupedWithCities[slrid].length
									citywise.leasePriceLowest = landsgroupedWithCities[slrid][0].leasePriceDisplay
									citywise.leasePriceHighest = landsgroupedWithCities[slrid][landsgroupedWithCities[slrid].length - 1].leasePriceDisplay
									citywise.sellPriceLowest = landsgroupedWithCities[slrid][0].sellPriceDisplay
									citywise.sellPriceighest = landsgroupedWithCities[slrid][landsgroupedWithCities[slrid].length - 1].sellPriceDisplay
									groupedcities.push(citywise)
								})

								return res.jsonx({
									success: true,
									data: {
										lands: groupedcities,
										grouped: true,
										groupType: 'cities'
									},
								});
							}
						} else {
							return res.jsonx({
								success: true,
								data: {
									lands: lands,
									grouped: false,
									groupType: 'land'
								},
							});
						}
					}
				})

		}
	}

};