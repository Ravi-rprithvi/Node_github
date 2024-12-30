/**
 * MarketController
 *
 * @description :: Server-side logic for managing markets
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	addMarket: function (req, res) {
		return API(MarketService.saveMarket, req, res);
	},
	updateMarket: function (req, res) {
		return API(MarketService.updateMarket, req, res);
	},
	getAllMarket: function (req, res, next) {

		var page = req.param('page');
		var count = req.param('count');
		var skipNo = (page - 1) * count;
		var search = req.param('search');
		var query = {};

		var sortBy = req.param('sortBy');
		var marketLevel = req.param('marketLevel');

		if (sortBy) {
			sortBy = sortBy.toString();
		} else {
			sortBy = 'createdAt desc';
		}
		if (marketLevel) {
			query.marketLevel = marketLevel
		}

		if (search) {
			query.$or = [
				{
					name: {
						'like': '%' + search + '%'
					}
				},
				{
					pincode: { "$in": [parseInt(search)] }
				}
			]
		}

		Market.count(query).exec(function (err, total) {
			if (err) {
				return res.status(400).jsonx({
					success: false,
					error: err
				});
			} else {
				Market.find(query).populate('GM').populate('CP').sort(sortBy).skip(skipNo).limit(count).exec(function (err, market) {
					if (err) {
						return res.status(400).jsonx({
							success: false,
							error: err
						});
					} else {
						return res.jsonx({
							success: true,
							data: {
								market: market,
								total: total
							},
						});
					}
				})
			}
		})
	},

	franchiseesWithouGM: function (req, res) {
		var sortBy = 'createdAt desc';
		Market.find({ GM: null }).sort(sortBy).exec(function (error, franchisees) {
			if (error) {
				return res.status(400).jsonx({
					success: false,
					error: {
						code: 400,
						messsage: error
					}
				});
			} else {
				return res.status(200).jsonx({
					success: true,
					data: franchisees
				});
			}
		})
	},
	assignMarketLand: function (req, res) {

		let land = req.param('land');

		if (req.param('franchiseeId')) {
			let data = {};
			let franchiseesId = req.param('franchiseeId');
			data.market = franchiseesId;
			Lands.update({ id: land }, data).then(function (land) {
				Lands.findOne({ id: land }).populate("market").then(function (landinfo) {
					return res.status(200).jsonx({
						success: true,
						data: landinfo
					});
				})
			})
		} else {
			var qry = {}
			let pincode = JSON.parse(req.param('pincode'));

			qry.pincode = { "$in": [pincode] }
			Market.find(qry).then(function (franchisees) {

				if (franchisees.length == 0) {
					return res.status(200).jsonx({
						success: false,
						error: {
							code: 200,
							message: "Franchisees is not availabe"
						}
					});
				} else {

					let data = {};
					let franchiseesId = franchisees[0].id;
					data.market = franchiseesId;
					Lands.update({ id: land }, data).then(function (land) {
						Lands.findOne({ id: land }).populate("market").then(function (landinfo) {

							return res.status(200).jsonx({
								success: true,
								data: landinfo
							});
						})
					})
				}
			});
		}
	},
	franchiseesWithGM: function (req, res) {
		var sortBy = 'createdAt desc';
		Market.find({ GM: { "$ne": null } }).populate('GM').sort(sortBy).exec(function (error, franchisees) {
			if (error) {
				return res.status(400).jsonx({
					success: false,
					error: {
						code: 400,
						messsage: error
					}
				});
			} else {
				return res.status(200).jsonx({
					success: true,
					data: franchisees
				});
			}
		})
	},


	franchiseesWithouCP: function (req, res) {
		var sortBy = 'createdAt desc';
		Market.find({ CP: null }).sort(sortBy).exec(function (error, franchisees) {
			if (error) {
				return res.status(400).jsonx({
					success: false,
					error: {
						code: 400,
						messsage: error
					}
				});
			} else {
				return res.status(200).jsonx({
					success: true,
					data: franchisees
				});
			}
		})
	},

	marketContainingPincodes: function (req, res) {
		var qry = {}

		if (req.param('pincode')) {
			var pincode = JSON.parse(req.param('pincode'));
			if (pincode.length > 0) {
				qry.pincode = { "$in": pincode }
			}
		}

		Market.find(qry).exec(function (error, franchisees) {
			if (error) {
				return res.status(400).jsonx({
					success: false,
					error: {
						code: 400,
						messsage: error
					}
				});
			} else {
				return res.status(200).jsonx({
					success: true,
					data: franchisees
				});
			}
		})
	},

	marketContainingPincodesGM: function (req, res) {
		var qry = {}
		qry.$and = [{ GM: { $ne: undefined } }, { GM: { $ne: null } }]

		if (req.param('pincode')) {
			var pincode = JSON.parse(req.param('pincode'));
			if (pincode.length > 0) {
				qry.pincode = { "$in": pincode }
			}
		}

		Market.find(qry).exec(function (error, franchisees) {
			if (error) {
				return res.status(400).jsonx({
					success: false,
					error: {
						code: 400,
						messsage: error
					}
				});
			} else {
				return res.status(200).jsonx({
					success: true,
					data: franchisees
				});
			}
		})
	},

	assignMarketCrop: function (req, res) {

		let crop = req.param('crop');

		if (req.param('franchiseeId')) {
			let data = {};
			let franchiseesId = req.param('franchiseeId');
			data.market = franchiseesId;
			Crops.update({ id: crop }, data).then(function (crop) {
				Crops.findOne({ id: crop }).populate("market").then(function (cropinfo) {
					return res.status(200).jsonx({
						success: true,
						data: cropinfo
					});
				})
			})
		} else {
			var qry = {}
			let pincode = JSON.parse(req.param('pincode'));

			qry.pincode = { "$in": [pincode] }
			Market.find(qry).then(function (franchisees) {

				if (franchisees.length == 0) {
					return res.status(200).jsonx({
						success: false,
						error: {
							code: 200,
							message: "Franchisees is not availabe"
						}
					});
				} else {

					let data = {};
					let franchiseesId = franchisees[0].id;
					data.market = franchiseesId;
					Crops.update({ id: crop }, data).then(function (crop) {
						Crops.findOne({ id: crop }).populate("market").then(function (cropinfo) {

							return res.status(200).jsonx({
								success: true,
								data: cropinfo
							});
						})
					})
				}
			});
		}
	}

};

