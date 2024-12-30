/**
 * RatingController
 *
 * @description :: Server-side logic for managing payments
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var constantObj = sails.config.constants;

module.exports = {

	saveRating: function (req, res) {
		var data = req.body;

		if (data.reviewer == undefined || data.reviewer == null) {
			data.reviewer = req.identity.id
		}

		Rating.create(data).then(function (rating) {
			if (rating) {
				Users.findOne({ id: rating.user }).exec(function (err, success) {

					if (success) {
						let query = {};
						let numberOfUsersRated = success.ratedUsersCount;
						let averageRating = success.avgRating

						query.ratedUsersCount = numberOfUsersRated + 1;
						query.avgRating = parseFloat(((numberOfUsersRated * averageRating) + rating.star) / (numberOfUsersRated + 1))

						Users.update({ id: success.id }, query).exec(function (upderr, updsuccess) {
							if (updsuccess) {


								return res.status(200).jsonx({
									success: true,
									code: 200,
									data: {
										rating: rating,
										message: constantObj.rating.SAVED_RATING,
										key: 'SAVED_RATING',
									},
								});
							} else {
								return res.status(200).jsonx({
									success: true,
									code: 200,
									data: {
										rating: rating,
										message: constantObj.rating.SAVED_RATING,
										key: 'SAVED_RATING',
									},
								});
							}

						})

					} else {
						return res.status(200).jsonx({
							success: true,
							code: 200,
							data: {
								rating: rating,
								message: constantObj.rating.SAVED_RATING,
								key: 'SAVED_RATING',
							},
						});
					}
				})
			}
		}).fail(function (err) {
			return res.status(400).jsonx({
				success: false,
				error: {
					code: 400,
					message: err
				},
			});
		})
	},


	saveInputRating: function (req, res) {
		var data = req.body;

		if (data.reviewer == undefined || data.reviewer == null) {
			data.reviewer = req.identity.id
		}

		Rating.create(data).then(function (rating) {

			if (rating) {
				let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
				Inputs.findOne({ id: ObjectId(rating.modalId) }).exec(function (err, success) {

					if (success) {
						let query = {};
						let numberOfUsersRated = success.ratedUsersCount;
						let averageRating = success.averageRating

						query.ratedUsersCount = numberOfUsersRated + 1;
						query.averageRating = parseFloat(((numberOfUsersRated * averageRating) + rating.star) / (numberOfUsersRated + 1))

						//input start rating
						if (rating.rateOnModal == "inputs") {
							let updateQuery = { id: ObjectId(rating.modalId) }
							// console.log("hi", success)
							Inputs.update(updateQuery, query).then(function (input) {
								if (input) {
									return res.status(200).jsonx({
										success: true,
										code: 200,
										data: {
											rating: rating,
											message: constantObj.rating.SAVED_RATING,
											key: 'SAVED_RATING',
										},
									});
								}

							})
						}
						//end input rating


					} else {
						return res.status(200).jsonx({
							success: true,
							code: 200,
							data: {
								rating: rating,
								message: constantObj.rating.SAVED_RATING,
								key: 'SAVED_RATING',
							},
						});
					}

				})

			} else {
				return res.status(200).jsonx({
					success: true,
					code: 200,
					data: {
						rating: rating,
						message: constantObj.rating.SAVED_RATING,
						key: 'SAVED_RATING',
					},
				});
			}
		})


	},

	/* as discussed with Mr. Rahul Sharma*/
	/*updateRating: function(req, res) {
		var data = req.body;
		
		Rating.update({id:data.id}, dataRating.update({id:data.id}, data).then(function(cart) {
		
					return res.status(200).jsonx({
						success: true,
						code:200,
						data: {
							cart: cart,
							message: constantObj.rating.UPDATED_RATING,
							key: 'UPDATED_RATING',
						},
					});
		})).then(function(cart) {
		
					return res.status(200).jsonx({
						success: true,
						code:200,
						data: {
							cart: cart,
							message: constantObj.rating.UPDATED_RATING,
							key: 'UPDATED_RATING',
						},
					});
		})
		.fail(function(err){
					return res.status(400).jsonx({
						  success: false,
						  error: {
							code: 400,
							message: err
						  },
					  });   
		});
	},*/

	getRatingOnModal: function (req, res) {
		var userId = req.identity.id

		if (req.param("reviewer")) {
			userId = req.param("reviewer")
		}

		var query = {}
		query.reviewer = userId
		query.rateOnModal = req.param("rateOnModal")
		query.modalId = req.param('modalId')

		Rating.findOne(query).exec(function (err, rating) {
			if (err) {
				return res.status(400).jsonx({
					success: false,
					error: {
						code: 400,
						message: err
					},
				});
			} else {
				if (rating) {
					return res.status(200).jsonx({
						success: true,
						data: rating
					});
				} else {
					return res.status(400).jsonx({
						success: false,
						error: {
							code: 400,
							message: "No Rating Exists",
							key: "RATING_NOT_EXISTS"
						},
					});
				}
			}
		})
	},

	getInputRatingOnModal: (req, res) => {
		var userId = req.identity.id

		if (req.param("reviewer")) {
			userId = req.param("reviewer")
		}
		var sortBy = req.param('sortBy');

		if (sortBy) {
			sortBy = sortBy.toString();
		} else {
			sortBy = 'star desc';
		}
		var query = {}
		//query.reviewer = userId
		query.rateOnModal = req.param("rateOnModal")
		query.modalId = req.param('modalId')
		console.log(query, 'query')
		Rating.count(query).exec(function (err, total) {
			if (err) {
				return res.status(400).jsonx({
					success: false,
					error: err
				});
			} else {
				Rating.find(query).sort(sortBy).populate("user", { select: ['fullName'] }).exec(function (err, rating) {
					if (err) {
						return res.status(400).jsonx({
							success: false,
							error: {
								code: 400,
								message: err
							},
						});
					} else {

						return res.status(200).jsonx({
							success: true,
							data: {
								rating: rating,
								total: total
							},
						});

					}
				})
			}
		})
	},

	getRatingOnModalToUser: function (req, res) {
		if (req.param("user") != undefined && req.param("rateOnModal") != undefined && req.param('modalId') != undefined) {
			var userId = req.param("user")
			var query = {}
			query.user = userId
			query.rateOnModal = req.param("rateOnModal")
			query.modalId = req.param('modalId')

			Rating.findOne(query).exec(function (err, rating) {
				if (err) {
					return res.status(400).jsonx({
						success: false,
						error: {
							code: 400,
							message: err
						},
					});
				} else {
					if (rating) {
						return res.status(200).jsonx({
							success: true,
							data: rating
						});
					} else {
						return res.status(400).jsonx({
							success: false,
							error: {
								code: 400,
								message: "No Rating Exists",
								key: "RATING_NOT_EXISTS"
							},
						});
					}
				}
			})
		} else {
			return res.status(400).jsonx({
				success: false,
				error: {
					code: 400,
					message: "User id, modal type and modal id are required."
				},
			});
		}
	},

	getAverageUserRating: function (req, res) {

		let userId = req.param("id");

		if (!userId) {
			return res.status(400).jsonx({
				success: false,
				error: {
					code: 400,
					message: constantObj.rating.PARAM_ISSUE,
					key: 'PARAM_ISSUE',
				},
			});
		}

		commonService.getAverageRating(userId).then(function (response) {

			return res.status(200).jsonx({
				success: true,
				code: 200,
				data: response
				/*data: {
					average: response
				},*/
			});
		});


	},

	getAllRatings: function (req, res) {

		var page = req.param('page');
		var count = req.param('count');
		var skipNo = (page - 1) * count;
		var search = req.param('search');
		var query = {};

		var sortBy = req.param('sortBy');

		if (sortBy) {
			sortBy = sortBy.toString();
		} else {
			sortBy = 'createdAt desc';
		}

		if (search) {
			query.$or = [{
				name: {
					'like': '%' + search + '%'
				}
			}
			]
		}

		Rating.count(query).exec(function (err, total) {
			if (err) {
				return res.status(400).jsonx({
					success: false,
					error: err
				});
			} else {
				Rating.find(query).sort(sortBy).populate('user').skip(skipNo).limit(count).exec(function (err, market) {
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

	getMyRatings: function (req, res) {

		var page = req.param('page');
		var count = req.param('count');
		var skipNo = (page - 1) * count;
		var query = {};
		query.user = req.identity.id

		var sortBy = 'createdAt desc';

		Rating.count(query).exec(function (err, total) {
			if (err) {
				return res.status(400).jsonx({
					success: false,
					error: err
				});
			} else {
				Rating.find(query).sort(sortBy).populate('reviewer').skip(skipNo).limit(count).exec(function (err, market) {
					if (err) {
						return res.status(400).jsonx({
							success: false,
							error: err
						});
					} else {
						return res.jsonx({
							success: true,
							data: {
								ratings: market,
								total: total
							},
						});
					}
				})
			}
		})
	},
};

