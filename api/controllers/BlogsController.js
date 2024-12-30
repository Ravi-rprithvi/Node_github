/**
 * BlogsController
 *
 * @description :: Server-side logic for managing Blog
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const { reject } = require('bluebird');




module.exports = {

	save: function (req, res) {
		API(BlogService.saveBlog, req, res);

	},
	edit: function (req, res) {
		API(BlogService.updateBlog, req, res);

	},
	getAllBlog: function (req, res, next) {

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

		query.isDeleted = 'false';

		if (search) {
			query.$or = [{
				title: {
					'like': '%' + search + '%'
				}
			}, {
				description: {
					'like': '%' + search + '%'
				}
			}
			]
		}

		Blogs.count(query).exec(function (err, total) {
			if (err) {
				return res.status(400).jsonx({
					success: false,
					error: err
				});
			} else {
				Blogs.find(query).sort(sortBy).skip(skipNo).limit(count).exec(function (err, blog) {
					if (err) {
						return res.status(400).jsonx({
							success: false,
							error: err
						});
					} else {
						return res.jsonx({
							success: true,
							data: {
								blog: blog,
								total: total
							},
						});
					}
				})
			}
		})
	},

	updateUserType: function (req, res) {
		let userType = req.param('userType');
		let cropsUser = [];
		let bidUser = []
		if (userType == "farmer") {
			Crops.find({}).then(function (crops) {
				crops.forEach(function (crop) {
					cropsUser.push(crop.seller);
				})
				Bids.find({ user: { $nin: cropsUser } }).then(function (bids) {
					bids.forEach(function (bid) {
						bidUser.push(bid.user);
					})

					Users.find({ id: { $nin: bidUser }, roles: 'U' }).then(function (finalUser) {
						let finalUserUpdate = []
						finalUser.forEach(function (finalUse) {
							finalUserUpdate.push(finalUse.id);
						})

						Users.update({ id: finalUserUpdate }, { userType: userType }).then(function (updateUser) {
							return res.jsonx({
								data: updateUser,
								finalUserUpdate: finalUserUpdate
							});
						})

					})


				})

			})

		}
		else if (userType == "cropbuyer") {
			Bids.find({}).then(function (bids) {
				bids.forEach(function (bid) {

					bidUser.push(bid.user);
				})
				Crops.find({ seller: { $nin: bidUser } }).then(function (crops) {
					crops.forEach(function (crop) {
						cropsUser.push(crop.seller);
					})
					Users.update({ id: cropsUser }, { userType: userType }).then(function (updateUser) {
						return res.jsonx({
							data: updateUser,
						});
					})

				})
			})
		}
		else if (userType == "both") {
			Bids.find({}).then(function (bids) {
				bids.forEach(function (bid) {

					bidUser.push(bid.user);
				})
				Crops.find({ seller: { $in: bidUser } }).then(function (crops) {
					crops.forEach(function (crop) {
						cropsUser.push(crop.seller);
					})
					Users.update({ id: cropsUser }, { userType: userType }).then(function (updateUser) {
						return res.jsonx({
							data: updateUser,
						});
					})
					// return res.jsonx({
					// 	data: cropsUser,
					// 	count: cropsUser.length
					// });
				})
			})
		}
		else if (userType == "nothing") {
			let userData = []
			/*	Users.find({ roles: 'U' }).then(function (users) {
					users.forEach((user) => {
						if (user.userType == "") {
							userData.push(user.id)
						}
						Users.update({ id: userData }, { userType: 'farmer' }).then(function (updateUser) {
							return res.jsonx({
								data: updateUser,
							});
						})
					})
	
				})*/
		}

	},

	updateCode: function (req, res) {
		let roles = req.param('roles')
		if (roles == "FGM") {
			Users.find({ roles: roles }).then(function (users) {

				let userIds = []
				async.each(users, function (user, cb) {
					let sellerCode = Math.floor(Math.random() * 9999998) + 1000099;
					let updateData = {}
					updateData.sellerCode = "FGM_" + sellerCode;
					updateData.code = updateData.sellerCode;
					updateData.userUniqueId = updateData.sellerCode;
					// console.log(updateData, '==', user.id)
					Users.update({ id: user.id }, updateData).then(function (updateUser) {
						return cb();
					}).fail((err) => {
						return res.jsonx({
							data: err,
						});
					})

				}, function (err) {
					return res.jsonx({
						data: users,
					});
				})

			})
		}
		else if (roles == "CP") {
			Users.find({ roles: roles }).then(function (users) {

				let userIds = []
				async.each(users, function (user, cb) {
					let sellerCode = Math.floor(Math.random() * 9999998) + 1000099;
					let updateData = {}
					updateData.code = "CP_" + sellerCode;
					Users.update({ id: user.id }, updateData).then(function (updateUser) {
						return cb();
					}).fail((err) => {
						return res.jsonx({
							data: err,
						});
					})

				}, function (err) {
					return res.jsonx({
						data: users,
					});
				})

			})
		}
		else if (roles == "A") {
			Users.find({ roles: roles }).then(function (users) {

				let userIds = []
				async.each(users, function (user, cb) {
					let sellerCode = Math.floor(Math.random() * 9999998) + 1000099;
					let updateData = {}
					updateData.code = "A_" + sellerCode;
					Users.update({ id: user.id }, updateData).then(function (updateUser) {
						return cb();
					}).fail((err) => {
						return res.jsonx({
							data: err,
						});
					})

				}, function (err) {
					return res.jsonx({
						data: users,
					});
				})

			})
		}
		else if (roles == "SA") {
			Users.find({ roles: roles }).then(function (users) {

				let userIds = []
				async.each(users, function (user, cb) {
					let sellerCode = Math.floor(Math.random() * 9999998) + 1000099;
					let updateData = {}
					updateData.code = "SA_" + sellerCode;
					Users.update({ id: user.id }, updateData).then(function (updateUser) {
						return cb();
					}).fail((err) => {
						return res.jsonx({
							data: err,
						});
					})

				}, function (err) {
					return res.jsonx({
						data: users,
					});
				})

			})
		}
		else if (roles == "DLR") {
			Users.find({ roles: roles }).then(function (users) {

				let userIds = []
				async.each(users, function (user, cb) {
					let sellerCode = Math.floor(Math.random() * 9999998) + 1000099;
					let updateData = {}
					updateData.code = "DLR_" + sellerCode;
					Users.update({ id: user.id }, updateData).then(function (updateUser) {
						return cb();
					}).fail((err) => {
						return res.jsonx({
							data: err,
						});
					})

				}, function (err) {
					return res.jsonx({
						data: users,
					});
				})

			})
		}
		else if (roles == "UF") {
			Users.find({ roles: roles }).then(function (users) {

				let userIds = []
				async.each(users, function (user, cb) {
					let sellerCode = Math.floor(Math.random() * 9999998) + 1000099;
					let updateData = {}
					updateData.code = "UF_" + sellerCode;
					Users.update({ id: user.id }, updateData).then(function (updateUser) {
						return cb();
					}).fail((err) => {
						return res.jsonx({
							data: err,
						});
					})

				}, function (err) {
					return res.jsonx({
						data: users,
					});
				})

			})
		}
		else if (roles == "UCP") {
			Users.find({ roles: roles }).then(function (users) {

				let userIds = []
				async.each(users, function (user, cb) {
					let sellerCode = Math.floor(Math.random() * 9999998) + 1000099;
					let updateData = {}
					updateData.code = "UCP_" + sellerCode;
					Users.update({ id: user.id }, updateData).then(function (updateUser) {
						return cb();
					}).fail((err) => {
						return res.jsonx({
							data: err,
						});
					})

				}, function (err) {
					return res.jsonx({
						data: users,
					});
				})

			})
		}
		else if (roles == "UB") {
			Users.find({ roles: roles }).then(function (users) {

				let userIds = []
				async.each(users, function (user, cb) {
					let sellerCode = Math.floor(Math.random() * 9999998) + 1000099;
					let updateData = {}
					updateData.code = "UB_" + sellerCode;
					Users.update({ id: user.id }, updateData).then(function (updateUser) {
						return cb();
					}).fail((err) => {
						return res.jsonx({
							data: err,
						});
					})

				}, function (err) {
					return res.jsonx({
						data: users,
					});
				})

			})
		}


	},

	uploadFarmer: function (req, res) {
		// console.log("arun===")
		const xlsxFile = require('read-excel-file/node');
		var date = new Date();
		var currentDate = new Date();
		xlsxFile('assets/FarmX_Farmer_Details_live.xlsx').then((rows) => {
			// console.log(rows);
			let data = [];

			async.each(rows, function (user, cb) {
				console.log(user[2], 'user1', user[6], '===')
				if (user[4] != "") {
					Users.findOne({ mobile: user[3] }).then(function (userInfo) {
						// console.log(userInfo, 'userInfo')
						if (userInfo) {
							// console.log("match user====", userInfo)
							return cb();
						} else {
							let object = {}
							let names = user[2].split(" ");
							if (names.length > 1) {
								object.firstName = names[0]
								object.lastName = names[names.length - 1]
							} else if (names.length == 1) {
								object.firstName = names[0]
								object.lastName = ''
							} else {
								object.firstName = ''
								object.lastName = ''
							}
							object.fullName = user[2];
							object.mobile = user[3]
							object.roles = "U"
							object.userType = "farmer"
							object.status = "active";
							object.isVerified = "Y";
							//object.pincode = user[3];
							object.uploadBy = "Sheet";
							object.date_registered = currentDate;
							object.date_verified = currentDate;
							userUniqueId = commonService.getUniqueCode();
							object.userUniqueId = 'UF_' + userUniqueId;
							object.code = userUniqueId;
							console.log(object, 'object===upar');
							commonService.getDataFromPincode(user[4]).then(function (pincodeInfo) {
								let pincodeData = pincodeInfo;
								if (pincodeData == 'error') {
									// console.log("pincode error===", user[4], user[5], user[6], user[7])
									return cb();
								} else {

									object["state"] = pincodeData["statename"];
									object["district"] = pincodeData["Districtname"];
									object["city"] = pincodeData["Taluk"];
									object['pincode'] = pincodeData["pincode"];
									object['address'] = user[6] + ", " + object["district"] + ", " + object['pincode'];
									object['password'] = generatePassword();
									// data.push(object);
									console.log(object, 'object===');
									Users.create(object).then(function (u) {
										// console.log("u===", u)
										return cb();
									})

								}

							})
						}
						//	return cb();
					})
					//Registration.signupUser(object, res)
					// return cb();

				} else {
					return cb();
				}
			}
				// , function (error) {
				// 	console.log(data, 'data====')
				// 	// Users.create(data).then(function (user) {
				// 	// 	// return cb();
				// 	// }).fail(function (err) {
				// 	// 	console.log(err, 'err');
				// 	// 	// return cb();
				// 	// })
				// }
			)

		})
	},
	uploadFarmerWithoutPincode: function (req, res) {
		// console.log("arun===")
		const xlsxFile = require('read-excel-file/node');
		var date = new Date();
		var currentDate = new Date();
		xlsxFile('assets/FarmX_Farmer_Details_2.xlsx').then((rows) => {
			// console.log(rows);
			let data = [];

			async.each(rows, function (user, cb) {
				console.log(user[1], 'user1')
				if (user[2] != "" && user[2] != null && user[2] != undefined && user[2].length == 10 && user[5] != "" && user[6] != "" && user[7] != "") {
					Users.findOne({ mobile: user[2] }).then(function (userInfo) {
						// console.log(userInfo, 'userInfo')
						if (userInfo) {
							// console.log("match user====", userInfo)
							return cb();
						} else {
							let object = {}
							let names = user[1].split(" ");
							if (names.length > 1) {
								object.firstName = names[0]
								object.lastName = names[names.length - 1]
							} else if (names.length == 1) {
								object.firstName = names[0]
								object.lastName = ''
							} else {
								object.firstName = ''
								object.lastName = ''
							}
							object.fullName = user[1];
							object.mobile = user[2]
							object.roles = "U"
							object.userType = "farmer"
							object.status = "active";
							object.isVerified = "Y";
							//object.pincode = user[3];
							object.uploadBy = "Sheet";
							object.date_registered = currentDate;
							object.date_verified = currentDate;
							userUniqueId = commonService.getUniqueCode();
							object.userUniqueId = 'UF_' + userUniqueId;
							object.code = userUniqueId;
							commonService.getDataWithoutPincode(user[4], user[5], user[6], user[7]).then(function (pincodeInfo) {
								let pincodeData = pincodeInfo;
								if (pincodeData == 'error') {
									console.log("pincode error===", user[4], user[5], user[6], user[7])
									return cb();
								} else {

									object["state"] = pincodeData["statename"];
									object["district"] = pincodeData["Districtname"];
									object["city"] = pincodeData["Taluk"];
									object['pincode'] = pincodeData["pincode"];
									object['address'] = user[4] + ", " + object["city"] + ", " + object["district"] + ", " + object['pincode'];
									object['password'] = generatePassword();
									// data.push(object);
									// console.log(object, 'object===');
									Users.create(object).then(function (u) {
										// console.log("u===", u)
										return cb();
									})

								}

							})
						}
						//	return cb();
					})
					//Registration.signupUser(object, res)
					// return cb();

				}
			}
				// , function (error) {
				// 	console.log(data, 'data====')
				// 	// Users.create(data).then(function (user) {
				// 	// 	// return cb();
				// 	// }).fail(function (err) {
				// 	// 	console.log(err, 'err');
				// 	// 	// return cb();
				// 	// })
				// }
			)

		})
	}
};
generatePassword = function () { // action are perform to generate random password for user 
	var length = 8,
		charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-=+;:,.?",
		retVal = "";

	for (var i = 0, n = charset.length; i < length; ++i) {
		retVal += charset.charAt(Math.floor(Math.random() * n));
	}
	return retVal;
};