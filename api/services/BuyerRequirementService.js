var Promise = require('bluebird'),
	promisify = Promise.promisify;
var constantObj = sails.config.constants;
var commonServiceObj = require('./commonService');
var pushService = require('./PushService');
var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

module.exports = {
	update: function (data, context) {

		let qry = {};
		qry.id = data.id;
		return BuyerRequirement.findOne(qry).then(function (requirement) {
			if (requirement) {
				return BuyerRequirement.update({ id: requirement.id }, data).then(function (BuyerRequirement) {
					return {
						success: true,
						data: BuyerRequirement,
						message: 'requirement updated successfully'
					};
				})
			} else {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please select valid requirement"
					},
				};
			}
		})
	},

	save: function (data, context) {
		// console.log(req, 'contet==');
		if (data.category == undefined) {
			return {
				success: false,
				error: {
					code: 400,
					message: "Please select the product"
				},
			};
		}

		if (data.mobile == undefined && data.user == undefined) {
			return {
				success: false,
				error: {
					code: 400,
					message: "Please send user info who want product"
				},
			};
		}

		if (data.quantity == undefined) {
			return {
				success: false,
				error: {
					code: 400,
					message: "How much quantity of product is required?"
				},
			};
		}

		if (data.requiredOn == undefined) {
			return {
				success: false,
				error: {
					code: 400,
					message: "When you require this product?"
				},
			};
		}

		if (data.pincode == undefined || data.pincode.length < 6 || data.pincode.length > 6) {
			return {
				success: false,
				error: {
					code: 400,
					message: "Please send the valid location where the requirement is"
				},
			};
		}




		let qry = {}
		qry.category = data.category
		if (data.mobile && data.mobile != null && data.mobile != 'null') {
			qry.mobile = data.mobile
		}
		if (data.user) {
			qry.user = data.user
		}
		if (data.variety) {
			qry.variety = data.variety
		}
		qry.pincode = parseInt(data.pincode)

		let requiredOnDate = new Date(data.requiredOn)

		qry.requiredOn = { $gte: requiredOnDate }
		qry.status = 'Pending'

		data.pincode = parseInt(data.pincode)

		let session = false
		if (data.session && data.session == true) {
			session = true
		}
		// console.log(context, 'contet==');
		if (data.userId) {
			data.staff = true;
			data.requirementSource = 'admin';
			data.nameOfCP = data.nameOfCP;
		}

		return BuyerRequirement.findOne(qry).then(function (requirement) {
			if (requirement) {
				return {
					success: false,
					error: {
						code: 404,
						message: "Your requirement is already taken and requirement code is " + requirement.code + ". Please check your requirement status."
					}
				};
			} else {
				var d = new Date();
				var n = d.getTime();
				let code = Math.floor(1000 + Math.random() * 9000);;
				data.code = 'BR-' + n + "-" + code;

				var mktquery = {};
				mktquery.pincode = { "$in": [data.pincode] };

				return commonServiceObj.getDataFromPincode(data.pincode).then(function (pincodeInfo) {
					let pincodeData = pincodeInfo;
					if (pincodeData == 'error') {
						return {
							success: false,
							error: {
								code: 400,
								message: 'please enter valid pincode.'
							}
						};
					}

					if (pincodeData) {

						data["state"] = pincodeData["statename"];
						data["district"] = pincodeData["Districtname"]
						data["city"] = pincodeData["Taluk"];
						data["location"] = pincodeData["Taluk"] + ", " + pincodeData["Districtname"] + ", " + pincodeData["statename"] + ", " + data.pincode;

					}
					let city = data['city'];
					let district = data['district'];
					let state = data['state'];


					return Market.find(mktquery).then(function (m) {
						let marketName = "" + data.pincode
						if (m && m.length > 0) {
							let maxLength = 0
							let mktId = ''
							for (var i = 0; i < m.length; i++) {
								if (maxLength < m[i].pincode.length) {
									maxLength = m[i].pincode.length
									data.market = m[i].id
									marketName = m[i].name
								}
							}
						}


						if (data.mobile && data.mobile != null && data.mobile != 'null') {
							let usrqry = {}
							usrqry.$and = [{ mobile: parseInt(data.mobile) }, { $or: [{ 'roles': 'U' }, { 'roles': 'CP' }] }];
							return Users.findOne(usrqry).then(function (usr) {

								var OTP = Math.floor(1000 + Math.random() * 9000);
								data.otp = OTP;
								data.subscribe = false

								if (usr) {
									data.user = usr.id
								}

								data.productType = 'crops'

								return BuyerRequirement.create(data).then(function (fc) {
									return Category.findOne({ id: fc.category }, { fields: ['name'] }).then(function (cat) {

										let responseMessage = "Your requirement is taken. We will get back to you soon to fulfill it."
										let otpresponsevalue = false

										if (session == false) {
											let buyersmsInfo = {}

											buyersmsInfo.numbers = [data.mobile]
											buyersmsInfo.variables = { "{#AA#}": "" + OTP, "{#EE#}": cat.name }
											buyersmsInfo.templateId = "32741"

											commonService.sendGeneralSMS(buyersmsInfo)

											responseMessage = "Your requirement is taken. We will get back to you soon to fulfill it. Please fill the OTP to subscribe to messsages."
											otpresponsevalue = true
										}


										let findCropQry = {}
										findCropQry.category = data.category
										findCropQry.isApproved = true
										findCropQry.isDeleted = false
										findCropQry.isExpired = false
										findCropQry.quantity = { $gte: 10 }

										if (data.variety) {
											findCropQry.variety = data.variety
										}

										return Crops.find(findCropQry, { fields: ['name', 'code'] }).then(function (suugestedcrops) {
											let findPreviousFranchiseeFarmer = {}
											findPreviousFranchiseeFarmer.category = data.category
											findPreviousFranchiseeFarmer.isApproved = true
											if (data.variety) {
												findPreviousFranchiseeFarmer.variety = data.variety
											}

											return Crops.find(findPreviousFranchiseeFarmer, { fields: ['market', 'seller', 'category'] }).populate('market', { select: ['GM'] }).populate('category', { select: ['name'] }).populate('seller', { select: ['mobile'] }).then(function (previoussellers) {

												let fgmsfarmersid = []

												let numbers = []

												let onlyFGMs = []

												for (var i = 0; i < previoussellers.length; i++) {
													if (previoussellers[i].seller != undefined) {
														let indexOfSeller = fgmsfarmersid.indexOf(previoussellers[i].seller.id);
														if (indexOfSeller === -1) {
															fgmsfarmersid.push(previoussellers[i].seller.id)
															numbers.push(previoussellers[i].seller.mobile)
														}
														if (previoussellers[i].market && previoussellers[i].market != undefined && previoussellers[i].market.GM != undefined) {
															let indexOfFGM = fgmsfarmersid.indexOf(previoussellers[i].market.GM);
															if (indexOfFGM === -1) {
																fgmsfarmersid.push(previoussellers[i].market.GM)
																onlyFGMs.push(previoussellers[i].market.GM)
															}
														}
													}
												}
												// console.log("arun===")
												if (numbers.length > 0) {

													let sellersmsInfo = {}

													sellersmsInfo.numbers = numbers
													let vrty = ""
													if (data.variety) {
														vrty = data.variety
													}
													sellersmsInfo.variables = { "{#DD#}": previoussellers[0].category.name, "{#EE#}": vrty }
													sellersmsInfo.templateId = "33294"

													commonService.sendGeneralSMS(sellersmsInfo)
												}

												if (onlyFGMs.length > 0) {
													let catnm = previoussellers[0].category.name
													let vrty = ""
													if (data.variety) {
														vrty = data.variety
													}
													Users.find({ id: { $in: onlyFGMs } }, { fields: ['mobile'] }).then(function (allFgmsMobileNos) {
														let fgmsMobileN = []
														for (var i = 0; i < allFgmsMobileNos.length; i++) {
															if (allFgmsMobileNos[i].mobile) {
																fgmsMobileN.push(allFgmsMobileNos[i].mobile)
															}
														}

														if (fgmsMobileN.length > 0) {

															let sellersmsInfo = {}

															sellersmsInfo.numbers = fgmsMobileN

															sellersmsInfo.variables = { "{#DD#}": previoussellers[0].category.name, "{#EE#}": vrty }
															sellersmsInfo.templateId = "33295"

															commonService.sendGeneralSMS(sellersmsInfo)
														}
													})
												}

												if (fgmsfarmersid.length > 0) {
													var msg = "There is requirement of " + data.quantity + " QTL of " + previoussellers[0].category.name + " in " + city + ", " + district + ", " + state + ". If you have crop, upload quickly to get instant buyer.";

													var notificationData = {};
													notificationData.requirement = fc.id;
													notificationData.user = data.user;
													notificationData.productType = "crops";
													notificationData.message = msg;
													notificationData.messageKey = "CROP_REQUIREMENT_NOTIFICATION"
													notificationData.readBy = [];
													notificationData.sentTo = fgmsfarmersid
													notificationData.messageTitle = 'Product required'
													let pushnotreceiver = fgmsfarmersid

													return Notifications.create(notificationData).then(function (notificationResponse) {
														sails.sockets.blast("general_notification", { message: msg, messageKey: notificationData.messageKey, users: fgmsfarmersid });
														if (notificationResponse) {
															pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
														}
														if (usr) {
															var msg = "You have created a requirement for " + data.quantity + " QTL of " + cat.name + " in " + city + ", " + district + ", " + state + ". We have get back to you soon to fulfill this.";

															var buyernotificationData = {};
															buyernotificationData.requirement = fc.id;
															buyernotificationData.user = data.user;
															buyernotificationData.productType = "crops";
															buyernotificationData.message = msg;
															buyernotificationData.messageKey = "CROP_REQUIREMENT_NOTIFICATION"
															buyernotificationData.readBy = [];
															buyernotificationData.sentTo = [data.user]

															return Notifications.create(buyernotificationData).then(function (notificationResponse) {
																sails.sockets.blast("general_notification", { message: msg, messageKey: buyernotificationData.messageKey, users: [data.user] });

																if (suugestedcrops && suugestedcrops.length > 0) {
																	return BuyerRequirement.update({ id: fc.id }, { status: 'Suggested' }).then(function (rqm) {
																		return {
																			success: true,
																			code: 200,
																			message: responseMessage,
																			key: "REQUIREMENTS_TAKEN",
																			suggestedcrops: suugestedcrops.length,
																			data: fc.id,
																			otp: otpresponsevalue
																		}
																	})
																} else {
																	return {
																		success: true,
																		code: 200,
																		message: responseMessage,
																		key: "REQUIREMENTS_TAKEN",
																		data: fc.id,
																		otp: otpresponsevalue
																	}
																}
															})
														} else {
															if (suugestedcrops && suugestedcrops.length > 0) {
																return BuyerRequirement.update({ id: fc.id }, { status: 'Suggested' }).then(function (rqm) {
																	return {
																		success: true,
																		code: 200,
																		message: responseMessage,
																		key: "REQUIREMENTS_TAKEN",
																		suggestedcrops: suugestedcrops.length,
																		data: fc.id,
																		otp: otpresponsevalue
																	}
																})
															} else {
																return {
																	success: true,
																	code: 200,
																	message: responseMessage,
																	key: "REQUIREMENTS_TAKEN",
																	data: fc.id,
																	otp: otpresponsevalue
																}
															}
														}
													});
												} else {

													if (usr) {
														var msg = "You have created a requirement for " + data.quantity + " QTL of " + cat.name + " in " + city + ", " + district + ", " + state + ". We have get back to you soon to fulfill this.";

														var buyernotificationData = {};
														buyernotificationData.requirement = fc.id;
														buyernotificationData.user = data.user;
														buyernotificationData.productType = "crops";
														buyernotificationData.message = msg;
														buyernotificationData.messageKey = "CROP_REQUIREMENT_NOTIFICATION"
														buyernotificationData.readBy = [];
														buyernotificationData.sentTo = [data.user]

														return Notifications.create(buyernotificationData).then(function (notificationResponse) {
															sails.sockets.blast("general_notification", { message: msg, messageKey: buyernotificationData.messageKey, users: [data.user] });

															if (suugestedcrops && suugestedcrops.length > 0) {
																return BuyerRequirement.update({ id: fc.id }, { status: 'Suggested' }).then(function (rqm) {
																	return {
																		success: true,
																		code: 200,
																		message: responseMessage,
																		key: "REQUIREMENTS_TAKEN",
																		suggestedcrops: suugestedcrops.length,
																		data: fc.id,
																		otp: otpresponsevalue
																	}
																})
															} else {
																return {
																	success: true,
																	code: 200,
																	message: responseMessage,
																	key: "REQUIREMENTS_TAKEN",
																	data: fc.id,
																	otp: otpresponsevalue
																}
															}
														})
													} else {
														if (suugestedcrops && suugestedcrops.length > 0) {
															return BuyerRequirement.update({ id: fc.id }, { status: 'Suggested' }).then(function (rqm) {
																return {
																	success: true,
																	code: 200,
																	message: responseMessage,
																	key: "REQUIREMENTS_TAKEN",
																	suggestedcrops: suugestedcrops.length,
																	data: fc.id,
																	otp: otpresponsevalue
																}
															})
														} else {
															return {
																success: true,
																code: 200,
																message: responseMessage,
																key: "REQUIREMENTS_TAKEN",
																data: fc.id,
																otp: otpresponsevalue
															}
														}
													}
												}
											})
										})
									})
								}).fail(function (error) {
									return {
										success: false,
										error: {
											code: 404,
											message: error
										}
									};
								})
							})
						} else if (data.user) {
							data.subscribe = true
							return Users.findOne({ id: data.user }, { fields: ['mobile', 'pincode'] }).then(function (usr) {
								if (usr) {
									data.mobile = usr.mobile
									return BuyerRequirement.create(data).then(function (fc) {
										return Category.findOne({ id: fc.category }, { fields: ['name'] }).then(function (cat) {

											let findCropQry = {}
											findCropQry.category = data.category
											findCropQry.isApproved = true
											findCropQry.isDeleted = false
											findCropQry.isExpired = false
											findCropQry.quantity = { $gte: 10 }

											if (data.variety) {
												findCropQry.variety = data.variety
											}

											return Crops.find(findCropQry, { fields: ['name', 'code'] }).then(function (suugestedcrops) {
												let findPreviousFranchiseeFarmer = {}
												findPreviousFranchiseeFarmer.category = data.category
												findPreviousFranchiseeFarmer.isApproved = true
												if (data.variety) {
													findPreviousFranchiseeFarmer.variety = data.variety
												}

												return Crops.find(findPreviousFranchiseeFarmer, { fields: ['market', 'seller', 'category'] }).populate('market', { select: ['GM'] }).populate('category', { select: ['name'] }).populate('seller', { select: ['mobile'] }).then(function (previoussellers) {

													let fgmsfarmersid = []

													let numbers = []

													let onlyFGMs = []

													for (var i = 0; i < previoussellers.length; i++) {
														let indexOfSeller = fgmsfarmersid.indexOf(previoussellers[i].seller.id);
														if (indexOfSeller === -1) {
															fgmsfarmersid.push(previoussellers[i].seller.id)
															numbers.push(previoussellers[i].seller.mobile)
														}
														if (previoussellers[i].market && previoussellers[i].market.GM != undefined) {
															let indexOfFGM = fgmsfarmersid.indexOf(previoussellers[i].market.GM);
															if (indexOfFGM === -1) {
																fgmsfarmersid.push(previoussellers[i].market.GM)
																onlyFGMs.push(previoussellers[i].market.GM)
															}
														}
													}

													if (numbers.length > 0) {

														let sellersmsInfo = {}

														sellersmsInfo.numbers = numbers
														let vrty = ""
														if (data.variety) {
															vrty = data.variety
														}
														sellersmsInfo.variables = { "{#DD#}": previoussellers[0].category.name, "{#EE#}": vrty }
														sellersmsInfo.templateId = "33294"

														commonService.sendGeneralSMS(sellersmsInfo)
													}

													if (onlyFGMs.length > 0) {
														let catnm = previoussellers[0].category.name
														let vrty = ""
														if (data.variety) {
															vrty = data.variety
														}
														Users.find({ id: { $in: onlyFGMs } }, { fields: ['mobile'] }).then(function (allFgmsMobileNos) {
															let fgmsMobileN = []
															for (var i = 0; i < allFgmsMobileNos.length; i++) {
																if (allFgmsMobileNos[i].mobile) {
																	fgmsMobileN.push(allFgmsMobileNos[i].mobile)
																}
															}

															if (fgmsMobileN.length > 0) {

																let sellersmsInfo = {}

																sellersmsInfo.numbers = fgmsMobileN

																sellersmsInfo.variables = { "{#DD#}": previoussellers[0].category.name, "{#EE#}": vrty }
																sellersmsInfo.templateId = "33295"

																commonService.sendGeneralSMS(sellersmsInfo)
															}
														})
													}

													if (fgmsfarmersid.length > 0) {
														var msg = "There is requirement of " + data.quantity + " QTL of " + cat.name + " in " + city + ", " + district + ", " + state + ". If you have crop, upload quickly to get instant buyer.";

														var notificationData = {};
														notificationData.requirement = fc.id;
														notificationData.user = data.user;
														notificationData.productType = "crops";
														notificationData.message = msg;
														notificationData.messageKey = "CROP_REQUIREMENT_NOTIFICATION"
														notificationData.readBy = [];
														notificationData.sentTo = fgmsfarmersid
														notificationData.messageTitle = 'Product required'
														let pushnotreceiver = fgmsfarmersid

														return Notifications.create(notificationData).then(function (notificationResponse) {
															if (notificationResponse) {
																pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
															}
															sails.sockets.blast("general_notification", { message: msg, messageKey: notificationData.messageKey, users: fgmsfarmersid });

															var msg = "You have created a requirement for " + data.quantity + " QTL of " + cat.name + " in " + city + ", " + district + ", " + state + ". We have get back to you soon to fulfill this.";

															var buyernotificationData = {};
															buyernotificationData.requirement = fc.id;
															buyernotificationData.user = data.user;
															buyernotificationData.productType = "crops";
															buyernotificationData.message = msg;
															buyernotificationData.messageKey = "CROP_REQUIREMENT_NOTIFICATION"
															buyernotificationData.readBy = [];
															buyernotificationData.sentTo = [data.user]

															return Notifications.create(buyernotificationData).then(function (notificationResponse) {
																sails.sockets.blast("general_notification", { message: msg, messageKey: buyernotificationData.messageKey, users: [data.user] });

																if (suugestedcrops && suugestedcrops.length > 0) {
																	return BuyerRequirement.update({ id: fc.id }, { status: 'Suggested' }).then(function (rqm) {
																		return {
																			success: true,
																			code: 200,
																			message: "Your requirement is taken. We will get back to you soon to fulfill it.",
																			key: "REQUIREMENTS_TAKEN",
																			suggestedcrops: suugestedcrops.length,
																			data: fc.id,
																			otp: false
																		}
																	})
																} else {
																	return {
																		success: true,
																		code: 200,
																		message: "Your requirement is taken. We will get back to you soon to fulfill it.",
																		key: "REQUIREMENTS_TAKEN",
																		data: fc.id,
																		otp: false
																	}
																}
															})

														});
													} else {
														var msg = "You have created a requirement for " + data.quantity + " QTL of " + cat.name + " in " + city + ", " + district + ", " + state + ". We have get back to you soon to fulfill this.";

														var buyernotificationData = {};
														buyernotificationData.requirement = fc.id;
														buyernotificationData.user = data.user;
														buyernotificationData.productType = "crops";
														buyernotificationData.message = msg;
														buyernotificationData.messageKey = "CROP_REQUIREMENT_NOTIFICATION"
														buyernotificationData.readBy = [];
														buyernotificationData.sentTo = [data.user]

														return Notifications.create(buyernotificationData).then(function (notificationResponse) {
															sails.sockets.blast("general_notification", { message: msg, messageKey: buyernotificationData.messageKey, users: [data.user] });

															if (suugestedcrops && suugestedcrops.length > 0) {
																return BuyerRequirement.update({ id: fc.id }, { status: 'Suggested' }).then(function (rqm) {
																	return {
																		success: true,
																		code: 200,
																		message: "Your requirement is taken. We will get back to you soon to fulfill it.",
																		key: "REQUIREMENTS_TAKEN",
																		suggestedcrops: suugestedcrops.length,
																		data: fc.id,
																		otp: false
																	}
																})
															} else {
																return {
																	success: true,
																	code: 200,
																	message: "Your requirement is taken. We will get back to you soon to fulfill it.",
																	key: "REQUIREMENTS_TAKEN",
																	data: fc.id,
																	otp: false
																}
															}
														})
													}
												})
											})
										})
									}).fail(function (error) {
										return {
											success: false,
											error: {
												code: 404,
												message: error
											}
										};
									})
								} else {
									return {
										success: false,
										error: {
											code: 404,
											message: "Invalid user information given"
										}
									};
								}
							})
						} else {
							return {
								success: false,
								error: {
									code: 404,
									message: "Either give your mobile number or login to give your requirements."
								}
							};
						}
					})
				})
			}
		})
	},

	saveLandRequirement: function (data, context) {
		if (data.state == undefined) {
			return {
				success: false,
				error: {
					code: 400,
					message: "Please select the state"
				},
			};
		}
		if (data.district == undefined) {
			return {
				success: false,
				error: {
					code: 400,
					message: "Please select the district/locality"
				},
			};
		}

		if (data.mobile == undefined && data.user == undefined) {
			return {
				success: false,
				error: {
					code: 400,
					message: "Please send user info who want product"
				},
			};
		}

		if (data.area == undefined) {
			return {
				success: false,
				error: {
					code: 400,
					message: "What size of land you are looking for?"
				},
			};
		}

		if (data.requiredOn == undefined) {
			return {
				success: false,
				error: {
					code: 400,
					message: "When you require this land?"
				},
			};
		}


		if (data.landFor == undefined) {
			return {
				success: false,
				error: {
					code: 400,
					message: "You need land for lease or to buy?"
				},
			};
		}

		let qry = {}
		qry.state = data.state
		qry.district = data.district
		if (data.mobile && data.mobile != null && data.mobile != 'null') {
			qry.mobile = data.mobile
		}
		if (data.user) {
			qry.user = data.user
		}
		qry.landFor = data.landFor

		let requiredOnDate = new Date(data.requiredOn)

		qry.requiredOn = { $gte: requiredOnDate }
		qry.status = 'Pending'

		let session = false
		if (data.user) {
			session = true
		}

		return BuyerRequirement.findOne(qry).then(function (requirement) {
			if (requirement) {
				return {
					success: false,
					error: {
						code: 404,
						message: "Your requirement is already taken and requirement code is " + requirement.code + ". Please check your requirement status."
					}
				};
			} else {
				var d = new Date();
				var n = d.getTime();
				let code = Math.floor(1000 + Math.random() * 9000);;
				data.code = 'BR-' + n + "-" + code;

				let usrqry = {}
				if (data.mobile && data.mobile != null && data.mobile != 'null') {
					usrqry.$and = [{ mobile: parseInt(data.mobile) }, { $or: [{ 'roles': 'U' }, { 'roles': 'CP' }] }];
					data.subscribe = session
					var OTP = Math.floor(1000 + Math.random() * 9000);
					data.otp = OTP;
				} else if (data.user) {
					data.subscribe = true
					usrqry.id = data.user
				} else {
					return {
						success: false,
						error: {
							code: 404,
							message: "Either give your mobile number or login to give your requirements."
						}
					};
				}
				return Users.findOne(usrqry).then(function (usr) {

					if (usr) {
						if (data.user) {
							data.mobile = usr.mobile
						} else {
							data.user = usr.id
						}
					}

					data.productType = 'lands'

					return BuyerRequirement.create(data).then(function (fc) {
						let matchingland = {}
						matchingland.state = data.state
						matchingland.district = data.district
						if (data.landFor == 'landLease') {
							matchingland.forLease = true
						} else {
							matchingland.forSell = true
							let today = new Date()
							matchingland.availableFrom = { $lte: today }
							matchingland.availableTill = { $gte: today }
						}

						matchingland.isDeleted = false
						matchingland.isExpired = false
						matchingland.approvalStatus = 'Admin_Approved';
						matchingland.availableArea = { $gt: 0 }

						return Lands.find(matchingland).then(function (suugestedlands) {

							let responseMessage = "Your requirement is taken. We will get back to you soon to fulfill it."
							let otpresponsevalue = false

							if (session == false) {
								let buyersmsInfo = {}

								buyersmsInfo.numbers = [data.mobile]
								buyersmsInfo.variables = { "{#AA#}": "" + OTP, "{#EE#}": "" }
								buyersmsInfo.templateId = "32741"

								commonService.sendGeneralSMS(buyersmsInfo)

								responseMessage = "Your requirement is taken. We will get back to you soon to fulfill it. Please fill the OTP to subscribe to messsages."
								otpresponsevalue = true
							}


							if (suugestedlands && suugestedlands.length > 0) {
								return BuyerRequirement.update({ id: fc.id }, { status: 'Suggested' }).then(function (rqm) {
									return {
										success: true,
										code: 200,
										message: responseMessage,
										key: "REQUIREMENTS_TAKEN",
										suggestedlands: suugestedlands.length,
										data: fc.id,
										otp: otpresponsevalue
									}
								}).fail(function (error) {
									console.log("error5 == ", error)
									return {
										success: false,
										error: {
											code: 404,
											message: error
										}
									};
								})
							} else {
								return {
									success: true,
									code: 200,
									message: responseMessage,
									key: "REQUIREMENTS_TAKEN",
									data: fc.id,
									otp: otpresponsevalue
								}
							}
						}).fail(function (error) {
							console.log("error4 == ", error)
							return {
								success: false,
								error: {
									code: 404,
									message: error
								}
							};
						})
					}).fail(function (error) {
						console.log("error3 == ", error)
						return {
							success: false,
							error: {
								code: 404,
								message: error
							}
						};
					})
				}).fail(function (error) {
					console.log("error2 == ", error)
					return {
						success: false,
						error: {
							code: 400,
							message: error
						}
					};
				})
			}
		}).fail(function (error) {
			console.log("error == ", error)
			return {
				success: false,
				error: {
					code: 400,
					message: error
				}
			};
		})
	},

	submitOTPToSubscribe: function (data, context) {
		if (data.otp == undefined) {
			return {
				success: false,
				error: {
					code: 400,
					message: "Please send otp"
				},
			};
		}
		if (data.id == undefined) {
			return {
				success: false,
				error: {
					code: 400,
					message: "Please send id of requirement"
				},
			};
		}

		return BuyerRequirement.findOne({ id: data.id }).then(function (requirement) {
			if (requirement) {
				if (requirement.otp != parseInt(data.otp)) {
					return {
						success: false,
						error: {
							code: 400,
							message: "OTP does not match"
						},
					};
				} else {

					return BuyerRequirement.update({ id: data.id }, { subscribe: true }).then(function (rq) {
						if (rq[0].productType && rq[0].productType == 'lands') {
							let matchingland = {}
							matchingland.state = rq[0].state
							matchingland.district = rq[0].district
							if (rq[0].landFor == 'landLease') {
								matchingland.forLease = true
							} else {
								matchingland.forSell = true
								let today = new Date()
								matchingland.availableFrom = { $lte: today }
								matchingland.availableTill = { $gte: today }
							}

							matchingland.isDeleted = false
							matchingland.isExpired = false
							matchingland.approvalStatus = 'Admin_Approved';
							matchingland.availableArea = { $gt: 0 }

							return Lands.find(matchingland).then(function (suugestedlands) {
								if (suugestedlands && suugestedlands.length > 0) {
									return BuyerRequirement.update({ id: rq[0].id }, { status: 'Suggested' }).then(function (rqm) {
										return {
											success: true,
											code: 200,
											message: "Successfully subscribed to given requirement. We will get back to you soon to fulfill it.",
											key: "REQUIREMENTS_TAKEN",
											suggestedlands: suugestedlands.length,
											data: rq.id
										}
									})
								} else {
									return {
										success: true,
										code: 200,
										message: "Successfully subscribed to given requirement. We will get back to you soon to fulfill it.",
										key: "REQUIREMENTS_TAKEN",
										data: rq.id,
									}
								}
							})
						} else {
							let findCropQry = {}
							findCropQry.category = requirement.category
							findCropQry.isApproved = true
							findCropQry.isDeleted = false
							findCropQry.isExpired = false
							findCropQry.quantity = { $gte: 10 }

							if (data.variety) {
								findCropQry.variety = data.variety
							}

							return Crops.find(findCropQry, { fields: ['name', 'code'] }).then(function (suugestedcrops) {
								if (suugestedcrops && suugestedcrops.length > 0) {
									return BuyerRequirement.update({ id: rq[0].id }, { status: 'Suggested' }).then(function (rqm) {
										return {
											success: true,
											code: 200,
											message: "Successfully subscribed to given requirement. We will get back to you soon to fulfill it.",
											key: "REMOVED_CROP",
											suggestedcrops: suugestedcrops.length,
											data: rq.id,
										}
									})
								} else {
									return {
										success: true,
										code: 200,
										message: "Successfully subscribed to given requirement. We will get back to you soon to fulfill it.",
										key: "REMOVED_CROP",
										data: rq.id,
									}
								}
							})
						}
					})
				}
			} else {
				return {
					success: false,
					error: {
						code: 400,
						message: "Requirement not found with given id"
					},
				};
			}
		})
	},

	updateSubscribe: function (data, context) {
		if (data.id == undefined) {
			return {
				success: false,
				error: {
					code: 400,
					message: "Please send id of requirement"
				},
			};
		}

		return BuyerRequirement.findOne({ id: data.id }).then(function (requirement) {
			if (requirement) {
				return BuyerRequirement.update({ id: data.id }, { subscribe: !(requirement.subscribe) }).then(function (rq) {
					if (rq[0].subscribe) {
						return {
							success: true,
							code: 200,
							message: "You have subscribed for this requirement. We will send messages to track your requirement.",
						}
					} else {
						return {
							success: true,
							code: 200,
							message: "You have now unsubscribed for this requirement. We will not send message to you for this requirement.",
						}
					}
				})
			} else {
				return {
					success: false,
					error: {
						code: 400,
						message: "Requirement not found with given id"
					},
				};
			}
		})
	},

	list: function (data, context, req, res) {

		let page = req.param('page');
		let search = req.param('search');
		let count = parseInt(req.param('count'));
		let skipNo = (page - 1) * count;

		let query = {}

		let user = req.param('user')
		if (user) {
			query.user = user
		}

		let mobile = req.param('mobile')
		if (mobile) {
			query.mobile = mobile
		}

		let category = req.param('category')
		if (category) {
			query.category = category
		}

		let productType = req.param('productType')
		if (productType) {
			query.productType = productType
		}

		let market = req.param('market')
		if (market) {
			query.market = market
		}

		let to = req.param('to')
		let from = req.param('from')
		if (to && from) {
			query.$and = [{
				requiredOn: {
					$gte: new Date(from)
				}
			}, {
				requiredOn: {
					$lte: new Date(to)
				}
			}]
		} else if (to) {
			query.requiredOn = {
				$lte: new Date(to)
			}
		} else if (from) {
			query.requiredOn = {
				$gte: new Date(from)
			}
		}

		let selectedFields = req.param('fields')
		if (selectedFields) {
			selectedFields = JSON.parse(selectedFields)
		} else {
			// selectedFields = ['code', 'market', 'pincode', 'user', 'mobile', 'category', 'variety', 'quantity', 'quantityUnit', 'price', 'requiredOn', 'grade', 'status', 'placedBid', 'subscribe', 'productType', 'state', 'district', 'landFor', 'landSuitables', "landArea", "area", "landAreaUnit", "requirementDescription", 'city', 'district', 'state', 'location', 'createdAt']
		}

		if (search) {
			query.$or = [{
				code: {
					'like': '%' + search + '%'
				}
			}, {
				variety: {
					'like': '%' + search + '%'
				}
			},
			{ mobile: parseFloat(search) },
			{ price: parseFloat(search) },
			{ quantity: parseFloat(search) }

			]
			console.log(query, 'query===')
		}

		if (page) {
			BuyerRequirement.find(query).populate('category')
				.populate('user', { select: ['fullName', 'email', 'mobile', 'code', 'sellerCode', 'userUniqueId'] })
				.populate('market', { select: ['name'] })
				.skip(skipNo).limit(count).sort('createdAt desc').exec(function (err, result) {
					if (err) {
						return res.jsonx({
							success: false,
							error: err
						});
					}
					BuyerRequirement.count(query).exec((cer, count) => {
						if (cer) {
							return res.jsonx({
								success: false,
								error: cer
							});
						}

						async.each(result, function (requ, callback) {
							if (requ.landSuitables && requ.landSuitables.length > 0) {
								Category.find({ id: { $in: requ.landSuitables } }, { fields: ['name'] }).then(function (categories) {
									requ.landSuitables = categories
									callback()
								})
							} else {
								callback()
							}
						}, function (asyncError) {

							return res.jsonx({
								success: true,
								data: {
									requirements: result,
									total: count
								}
							});
						})
					})
				})
		} else {
			BuyerRequirement.find(query).populate('category')
				.populate('user', { select: ['fullName', 'email', 'mobile', 'code', 'sellerCode', 'userUniqueId'] })
				.populate('market', { select: ['name'] }).sort('createdAt desc')
				.exec(function (err, result) {
					if (err) {
						return res.jsonx({
							success: false,
							error: err
						});
					}

					async.each(result, function (requ, callback) {
						if (requ.landSuitables && requ.landSuitables.length > 0) {
							Category.find({ id: { $in: requ.landSuitables } }, { fields: ['name'] }).then(function (categories) {
								requ.landSuitables = categories
								callback()
							})
						} else {
							callback()
						}
					}, function (asyncError) {
						return res.jsonx({
							success: true,
							data: {
								requirements: result,
								total: result.length
							}
						});
					})

				})
		}
	},

	/*listWithSearch: function (data, context, req, res) {
		
		let page = req.param('page');
		let count = parseInt(req.param('count'));
		let skipNo = (page - 1) * count;

		let query = {}

		let user = req.param('user')
		if (user) {
			query.user = user
		}

		let mobile = req.param('mobile')
		if (mobile) {
			query.mobile = mobile
		}
		
		let category = req.param('category')
		if (category) {
			query.category = category
		}

		let market = req.param('market')
		if (market) {
			query.market = market
		}

		let selectedFields = req.param('fields')
		if (selectedFields) {
			selectedFields = JSON.parse(selectedFields)
		} else {
			  selectedFields = ['code', 'market', 'pincode', 'user', 'mobile', 'category', 'variety', 'quantity', 'quantityUnit', 'price', 'requiredOn', 'grade', 'status', 'placedBid', 'subscribe']
		}

		if (search) {
			query.$or = [
				{ code: { $regex: search, '$options': 'i' } },
				{ name: { $regex: search, '$options': 'i' } },
				{ category: { $regex: search, '$options': 'i' } },
				{ market: { $regex: search, '$options': 'i' } },
			]
		}

		if (page) {
			BuyerRequirement.native(function (err, croplist) {
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
						from: 'users',
						localField: 'user',
						foreignField: '_id',
						as: "user"
					}
				},
				{
					$unwind: 'user'
				},
				{
					$lookup: {
						from: 'users',
						localField: 'user',
						foreignField: '_id',
						as: "user"
					}
				},
				{
					$unwind: 'user'
				},
				{
					$project: {
						id: "$_id",
						name: "$name",
						category: "$category.name",
						categoryId: "$categoryId",
						price: "$price",
						endDate: "$endDate",
						quantity: "$quantity",
						bidEndDate: "$bidEndDate",
						quantityUnit: "$quantityUnit",
						district: "$district",
						availableFrom: "$availableFrom",
						images: "$images",
						seller: "$sellers.fullName",
						sellerId: "$sellers._id",
						cropState: "$state",
						status: "$status",
						sellerstate: "$sellers.state",
						isDeleted: "$isDeleted",
						isApproved: "$isApproved",
						isExpired: "$isExpired",
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
							$project: {
								id: "$_id",
								name: "$name",
								category: "$category.name",
								categoryId: "$categoryId",
								price: "$price",
								endDate: "$endDate",
								quantity: "$quantity",
								quantityUnit: "$quantityUnit",
								bidEndDate: "$bidEndDate",
								verified: "$verified",
								district: "$district",
								availableFrom: "$availableFrom",
								images: "$images",
								seller: "$sellers.fullName",
								sellerId: "$sellers._id",
								cropState: "$state",
								status: "$status",
								sellerstate: "$sellers.state",
								isDeleted: "$isDeleted",
								isApproved: "$isApproved",
								isExpired: "$isExpired",
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
							var rateQuery= {};
							async.each(results, function(result, callback) {
								rateQuery.user = result.sellerId;

								Rating.count(rateQuery)
								.then(function(totalUsers){
									role.totalUsers = totalUsers;
									callback();
								})
								.fail(function(error){
									callback(error);
								})

							})
							return res.jsonx({
								success: true,
								data: {
									crops: results,
									total: totalresults.length
								},
							});
						}
					});
				}
			});

		})
		} else {
			BuyerRequirement.find(query, { fields: selectedFields }).populate('category')
			.populate('user', {select: ['fullName', 'email', 'mobile', 'code','sellerCode', 'userUniqueId']})
			.populate('market', {select: ['name']})
			.exec(function(err, result) {
				if (err) {
					return res.jsonx({
						success: false,
						error: err
					});
				}

				return res.jsonx({
					success: true,
					data: {
						testimonials: result,
						total: result.length
					}
				});
			})
		}
	},*/

	sendOTPToVerifyUser: function (data, context) {

		if (data.mobile == undefined || data.mobile == null) {
			return {
				success: false,
				error: {
					code: 400,
					message: "Please send mobile number"
				},
			};
		}

		var OTP = Math.floor(1000 + Math.random() * 9000);

		let buyersmsInfo = {}

		buyersmsInfo.numbers = [data.mobile]
		buyersmsInfo.variables = { "{#AA#}": "" + OTP }
		buyersmsInfo.templateId = "33297"

		commonService.sendGeneralSMS(buyersmsInfo)

		return {
			success: true,
			code: 200,
			otp: OTP
		}
	},

	get: function (data, context) {

		return BuyerRequirement.findOne({ id: data.id }).populate('category')
			.populate('user', { select: ['fullName', 'email', 'mobile', 'code', 'sellerCode', 'userUniqueId'] })
			.populate('market', { select: ['name'] })
			.then(function (updatedfc) {
				if (updatedfc) {
					return {
						success: true,
						data: updatedfc
					}
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "No data found"
						}
					};
				}
			}).fail(function (error) {
				return {
					success: false,
					error: {
						code: 400,
						message: error
					}
				};
			})
	},
	LandRequirements: function (data, context, req, res) {

		let qry = {};
		qry.requiredOn = { $gte: new Date() }
		qry.status = { $ne: 'Fulfilled' }
		qry.productType = 'lands';
		let category = data.category;
		if (category) {
			qry.landSuitables = { "$in": JSON.parse(data.category) };
		}
		let page = req.param('page');
		let count = req.param('count');
		let skipNo = 0
		if (page && count) {
			count = parseInt(count)
			skipNo = (page - 1) * count;
		}
		console.log(qry);
		BuyerRequirement.native(function (err, requirement) {
			requirement.aggregate(
				[
					{ $match: qry },

					{
						$sort: { 'area': -1 }
					},
				], function (err, result) {
					if (err) {
						return res.json({
							success: false,
							error: err
						});
					} else {
						var finalResult = result
						async.each(finalResult, function (requ, callback) {
							if (requ.landSuitables && requ.landSuitables.length > 0) {
								Category.find({ id: { $in: requ.landSuitables } }, { fields: ['name'] }).then(function (categories) {
									requ.category = categories
									callback()
								})
							} else {
								callback()
							}
						}, function (asyncError) {
							if (page && count) {
								finalResult = result.slice(skipNo, skipNo + count)
							}
							return res.jsonx({
								success: true,
								data: {
									requirements: finalResult,
									total: result.length
								}
							});
						})
						// if (page && count) {
						// 	finalResult = result.slice(skipNo, skipNo + count)
						// }

						// return res.jsonx({
						// 	success: true,
						// 	data: {
						// 		requirements: finalResult,
						// 		total: result.length
						// 	}
						// });
					}
				}
			);
		})
	},
	categoryWiseRequirements: function (data, context, req, res) {

		let qry = {};
		qry.requiredOn = { $gte: new Date() }
		qry.status = { $ne: 'Fulfilled' }
		let category = req.param('category');

		let parentcategoryqry = {}
		if (category) {
			// qry.category = ObjectId(category)
			parentcategoryqry.$or = [{ "cat.parentId": ObjectId(category) }, { "cat._id": ObjectId(category) }]
		}

		let variety = req.param('variety')
		if (variety) {
			qry.variety = variety
		}

		let page = req.param('page');
		let count = req.param('count');
		let skipNo = 0
		if (page && count) {
			count = parseInt(count)
			skipNo = (page - 1) * count;
		}
		// console.log(qry);
		BuyerRequirement.native(function (err, requirement) {
			requirement.aggregate(
				[
					{ $match: qry },
					{
						$lookup: {
							from: "category",
							localField: "category",
							foreignField: "_id",
							as: "cat"
						}
					},
					{
						$unwind: "$cat"
					},
					{ $match: parentcategoryqry },
					{
						$group: {
							_id: {
								"category": '$cat._id',
								"state": '$state',
								"name": "$cat.name",
								"image": "$cat.image"
							},
							'quantity': {
								$sum: "$quantity"
							},
							'quantityUnit': { "$first": "$quantityUnit" }
						},
					},
					{
						$group: {
							_id: "$_id.category",
							'states': {
								$push: {
									stateName: "$_id.state",
									quantity: "$quantity",
									quantityUnit: "$quantityUnit"
								}
							},
							'totalQuantity': {
								$sum: "$quantity"
							},
							'quantityUnit': { "$first": "$quantityUnit" },
							"name": { "$first": "$_id.name" },
							"image": { "$first": "$_id.image" }
						}
					},
					{
						$sort: { 'totalQuantity': -1 }
					},
				], function (err, result) {
					if (err) {
						return res.json({
							success: false,
							error: err
						});
					} else {
						var finalResult = result
						if (page && count) {
							finalResult = result.slice(skipNo, skipNo + count)
						}

						return res.jsonx({
							success: true,
							data: {
								requirements: finalResult,
								total: result.length
							}
						});
					}
				}
			);
		})
	},

	statesWiseRequirements: function (data, context, req, res) {

		let qry = {};
		qry.requiredOn = { $gte: new Date() }
		qry.status = { $ne: 'Fulfilled' }

		let category = req.param('category')

		let variety = req.param('variety')
		if (variety) {
			qry.variety = variety
		}

		let page = req.param('page');
		let count = req.param('count');
		let skipNo = 0
		if (page && count) {
			count = parseInt(count)
			skipNo = (page - 1) * count;
		}
		selectedFields = ['code', 'category', 'variety', 'requiredOn', 'state', 'district', 'city', 'quantityUnit', 'quantity', 'quantityUnit', 'price']
		return Category.find({ parentId: category, isDeleted: false, status: 'active' }, { fields: [] }).then(function (allChildCategories) {
			if (category != undefined && category != null && category != "") {
				if (allChildCategories && allChildCategories.length > 0) {
					let childCategoriesIds = []
					for (var i = 0; i < allChildCategories.length; i++) {
						childCategoriesIds.push(allChildCategories[i].id)
					}
					qry.category = { $in: childCategoriesIds }
				} else {
					qry.category = category
				}
			}
			return BuyerRequirement.find(qry, { fields: selectedFields }).populate('category', { select: ['name', 'image'] }).then(function (updatedfc) {
				if (updatedfc) {
					return {
						success: true,
						data: updatedfc,
						total: updatedfc.length,
					}
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "No data found"
						}
					};
				}
			}).fail(function (error) {
				return {
					success: false,
					error: {
						code: 400,
						message: error
					}
				};
			})
		})
	},

	search: function (data, context, req, res) {

		var search = req.param('search');
		var minprice = req.param('minprice');
		var maxprice = req.param('maxprice');
		var minquantity = req.param('minquantity');
		var maxquantity = req.param('maxquantity');
		var quality = req.param('quality');
		var page = req.param('page');
		var count = req.param('count');
		var skipNo = (page - 1) * count;
		var sortBy = req.param('sortBy');

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
		qry.$or = [{ status: "Pending" }, { status: 'Suggested' }];
		let requiredOnDate = new Date()
		qry.requiredOn = { $gte: requiredOnDate }

		var sortquery = {};

		if (quality) {
			if (quality = 'A ') {
				quality = "A+";
			}
			qry.grade = quality
		}

		if (sortBy) {
			var typeArr = new Array();
			typeArr = sortBy.split(" ");
			var sortType = typeArr[1];
			var field = typeArr[0];

			//sortquery[field?field:field] = sortType?(sortType=='desc'?1:-1):-1;
		}
		sortquery[field ? field : "createdAt"] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

		var qryArray = []

		if (search) {
			// qryArray.push({ code: parseInt(search) })
			// qryArray.push({ name: { $regex: search, '$options': 'i' } })
			qryArray.push({ parentcategory: { $regex: search, '$options': 'i' } })
			qryArray.push({ category: { $regex: search, '$options': 'i' } })
			qryArray.push({ variety: { $regex: search, '$options': 'i' } })
		}

		if (minprice != undefined && minprice != "" && maxprice != undefined && maxprice != "") {
			qry.price = { $gte: parseFloat(minprice), $lte: parseFloat(maxprice) };
		}

		if (minquantity != undefined && maxquantity != undefined && minquantity != "" && maxquantity != "") {
			qry.$and = [{ quantity: { $gte: parseFloat(minquantity) } }, { quantity: { $lte: parseFloat(maxquantity) } }];
		} else if (minquantity != undefined && minquantity != "") {
			qry.quantity = { $gte: parseFloat(minquantity) }
		} else if (maxquantity != undefined && maxquantity != "") {
			qry.quantity = { $lte: parseFloat(maxquantity) }
		} else {
			// qry.leftAfterAcceptanceQuantity = { $gte: 10.0 }
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

		BuyerRequirement.native(function (err, croplist) {
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
						as: 'buyers'
					}
				},
				{
					$unwind: {
						path: '$buyers',
						preserveNullAndEmptyArrays: true
					}
				},
				{
					$project: {
						id: "$_id",
						variety: "$variety",
						state: "$state",
						userFullname: "$buyers.fullName",
						userFirstname: "$buyers.firsname",
						userImage: "$buyers.image",
						userId: "$buyers._id",
						userEmail: "$buyers.username",
						userState: "$buyers.state",
						userCity: "$buyers.city",
						userDistricts: "$buyers.district",
						userRating: "$buyers.avgRating",
						userPincode: "$buyers.pincode",
						quantityUnit: "$quantityUnit",
						quantity: "$quantity",
						requiredOn: "$requiredOn",
						price: "$price",
						grade: "$grade",
						category: "$category.name",
						categoryId: "$category._id",
						City: "$city",
						State: "$state",
						District: "$district",
						image: "$category.image",
						bannerImage: "$category.bannerImage",
						iconImage: "$category.iconImage",
						status: "$status",
						isDeleted: "$isDeleted",
						createdAt: "$createdAt",
						parentcategory: "$parentcategory.name",
						parentcategoryId: "$parentcategory._id",
						parentCatImage: "$parentcategory.image",
						parentCatBannerImage: "$parentcategory.bannerImage",
						parentCatBconImage: "$parentcategory.iconImage",
					}
				},
				{
					$match: qry
				}
			], function (err, totalresults) {
				if (err) {
					return res.status(400).jsonx({
						success: false,
						error: err
					});
				} else {

					var finalResult = totalresults
					if (page && count) {
						finalResult = totalresults.slice(skipNo, skipNo + count)
					}

					return res.status(200).jsonx({
						success: true,
						data: {
							requirements: finalResult,
							total: totalresults.length
						}
					});
				}
			})
		})
	},
};