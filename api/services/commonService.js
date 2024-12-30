var Promise = require('bluebird'),
	promisify = Promise.promisify;
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var bcrypt = require('bcrypt-nodejs');
var pushService = require('./PushService');
var ObjectId = require('mongodb').ObjectID;
var GeoPoint = require('geopoint');

var constantObj = sails.config.constants;
var commonService = require('./../services/commonService');


var transport = nodemailer.createTransport(smtpTransport({
	host: sails.config.appSMTP.host,
	port: sails.config.appSMTP.port,
	debug: sails.config.appSMTP.debug,
	auth: {
		user: sails.config.appSMTP.auth.user, //access using /congig/appSMTP.js
		pass: sails.config.appSMTP.auth.pass
	}
}));

var client = require('twilio')(constantObj.twillio.accountSid, constantObj.twillio.authToken);


var Imap = require('imap');
var fs = require('fs');
var stream = require('stream');
const inspect = require('util').inspect;

var imap = new Imap({
	user: "order@efarmexchange.com",
	password: "order@#123",
	host: "imap.gmail.com", //this may differ if you are using some other mail services like yahoo
	port: 993,
	tls: true,
	connTimeout: 10000, // Default by node-imap 
	authTimeout: 5000, // Default by node-imap, 
	debug: console.log, // Or your custom function with only one incoming argument. Default: null 
	tlsOptions: { rejectUnauthorized: false },
	mailbox: "INBOX", // mailbox to monitor 
	searchFilter: ["UNSEEN", "FLAGGED"], // the search filter being used after an IDLE notification has been retrieved 
	markSeen: true, // all fetched email willbe marked as seen and not fetched next time 
	fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`, 
	mailParserOptions: { streamAttachments: true }, // options to be passed to mailParser lib. 
	attachments: true, // download attachments as they are encountered to the project directory 
	attachmentOptions: { directory: "attachments/" } // specify a download directory for attachments 
});
var request = require('request');

module.exports = {

	longDateFormat: function (date) {
		var monthNames = [
			"Jan", "Feb", "Mar",
			"Apr", "May", "Jun", "Jul",
			"Aug", "Sept", "Oct",
			"Nov", "Dec"
		];

		var day = date.getDate();
		var monthIndex = date.getMonth();
		var year = date.getFullYear();

		return day + ' ' + monthNames[monthIndex] + ', ' + year;
	},

	longDateFormatWithTime: function (date) {
		var monthNames = [
			"Jan", "Feb", "Mar",
			"Apr", "May", "Jun", "Jul",
			"Aug", "Sept", "Oct",
			"Nov", "Dec"
		];

		var day = date.getDate();
		var monthIndex = date.getMonth();
		var year = date.getFullYear();
		var year = date.getFullYear();

		var hours = date.getHours();
		var minutes = date.getMinutes();
		var ampm = hours >= 12 ? 'pm' : 'am';
		hours = hours % 12;
		hours = hours ? hours : 12; // the hour '0' should be '12'
		minutes = minutes < 10 ? '0' + minutes : minutes;
		var strTime = hours + ':' + minutes + ' ' + ampm;

		return day + ' ' + monthNames[monthIndex] + ', ' + year + " " + strTime;
	},

	treatDateAsUTC: function (date) {
		console.log("Date == ", date)
		var result = new Date(date);
		result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
		return result;
		return day + ' ' + monthNames[monthIndex] + ', ' + year;
	},

	daysBetweenTwoDates: function (startDate, endDate) {
		var day_start = new Date(startDate);
		var day_end = new Date(endDate);
		var total_days = (day_end - day_start) / (1000 * 60 * 60 * 24);
		return total_days;
		//    var millisecondsPerDay = 24 * 60 * 60 * 1000;

		//    		console.log("startDate == ", startDate)
		// console.log("endDate == ", endDate)

		// let sd = startDate.setMinutes(startDate.getMinutes() - startDate.getTimezoneOffset());
		// let ed = endDate.setMinutes(endDate.getMinutes() - endDate.getTimezoneOffset());


		//    	    		console.log("ed == ", ed)
		// console.log("sd == ", sd)


		//    return Math.round((ed - sd) / millisecondsPerDay);

		// var second = 1000
		// var minute = second*60
		// var hour = minute*60
		// var day = hour*24
		// var week = day*7

		// let date1 = new Date(startDate);
		// let date2 = new Date(endDate);
		// var timediff = date2 - date1;
		// if (isNaN(timediff)) return NaN;
		// return Math.floor(timediff / day)
		// switch (interval) {
		//     case "years": return date2.getFullYear() - date1.getFullYear();
		//     case "months": return (
		//         ( date2.getFullYear() * 12 + date2.getMonth() )
		//         -
		//         ( date1.getFullYear() * 12 + date1.getMonth() )
		//     );
		//     case "weeks"  : return Math.floor(timediff / week);
		//     case "days"   : return Math.floor(timediff / day); 
		//     case "hours"  : return Math.floor(timediff / hour); 
		//     case "minutes": return Math.floor(timediff / minute);
		//     case "seconds": return Math.floor(timediff / second);
		//     default: return undefined;
		// }
	},

	notifyUsersFromNotification: function (notification, product) {
		if (notification) {
			if (notification.productType == 'crops') {
				var usersToSendNotification = []
				if (notification.sellerId) {
					usersToSendNotification.push(notification.sellerId)
				}
				if (notification.buyerId) {
					usersToSendNotification.push(notification.buyerId)
				}
				if (product != undefined) {
					// var query = {};
					// query.pincode = {"$in" : [product.pincode] };
					// Market.find(query).then(function(m) {
					//           var marketIds = [];

					//           m.forEach(function(item){
					//              marketIds.push(item.id);
					//           });
					//           var findUserQuery = {}
					//           findUserQuery.$or = [{markets: {"$in" : marketIds}}]
					if (product.market != undefined || product.market != null) {
						var findUserQuery = {}
						findUserQuery.$or = [{ "markets": { "$in": [product.market] } }, { "franchisee": product.market }]
						findUserQuery.id = { $nin: usersToSendNotification }

						Users.find(findUserQuery).then(function (u) {
							if (u) {
								u.forEach(function (usr) {
									usersToSendNotification.push(usr.id);
								});
							}

							if (usersToSendNotification.length > 0) {
								sails.sockets.blast("general_notification", { message: notification.message, messageKey: notification.messageKey, users: usersToSendNotification });
								updateNotificationSentTo(notification, usersToSendNotification)
							}
						});   // get user of markets         
					} else {
						if (usersToSendNotification.length > 0) {
							sails.sockets.blast("general_notification", { message: notification.message, messageKey: notification.messageKey, users: usersToSendNotification });
							updateNotificationSentTo(notification, usersToSendNotification)
						}
					}   // get user of markets         
					// }); // get markets for perticuler pincode
				} else {
					var findCropQuery = {}
					findCropQuery.id = notification.productId
					Crops.findOne(findCropQuery).then(function (crop) {
						if (crop) {
							// var query = {};
							// query.pincode = {"$in" : [product.pincode] };
							// Market.find(query).then(function(m) {
							//           var marketIds = [];

							//           m.forEach(function(item){
							//              marketIds.push(item.id);
							//           });
							//           var findUserQuery = {}
							//           findUserQuery.$or = [{markets: {"$in" : marketIds}}]

							if (crop.market != undefined || crop.market != null) {
								var findUserQuery = {}
								findUserQuery.$or = [{ "markets": { "$in": [crop.market] } }, { "franchisee": crop.market }]
								findUserQuery.id = { $nin: usersToSendNotification }


								Users.find(findUserQuery).then(function (u) {
									if (u) {
										u.forEach(function (usr) {
											usersToSendNotification.push(usr.id);
										});
									}

									if (usersToSendNotification.length > 0) {
										sails.sockets.blast("general_notification", { message: notification.message, messageKey: notification.messageKey, users: usersToSendNotification });
										updateNotificationSentTo(notification, usersToSendNotification)
									}
								});   // get user of markets         
							} else {
								if (usersToSendNotification.length > 0) {
									sails.sockets.blast("general_notification", { message: notification.message, messageKey: notification.messageKey, users: usersToSendNotification });
									updateNotificationSentTo(notification, usersToSendNotification)
								}
							}
							// }); // get markets for perticuler pincode
						}
					})
				}
			} else if (notification.productType == 'lands') {
				var usersToSendNotification = []
				if (notification.sellerId) {
					usersToSendNotification.push(notification.sellerId)
				}
				if (notification.buyerId) {
					usersToSendNotification.push(notification.buyerId)
				}
				if (product != undefined) {
					// var query = {};
					// query.pincode = {"$in" : [product.pincode] };
					// Market.find(query).then(function(m) {
					//           var marketIds = [];

					//           m.forEach(function(item){
					//              marketIds.push(item.id);
					//           });
					//           var findUserQuery = {}
					//           findUserQuery.$or = [{markets: {"$in" : marketIds}}]
					if (product.market != undefined || product.market != null) {
						var findUserQuery = {}
						findUserQuery.$or = [{ "markets": { "$in": [product.market] } }, { "franchisee": product.market }]
						findUserQuery.id = { $nin: usersToSendNotification }

						Users.find(findUserQuery).then(function (u) {
							if (u) {
								u.forEach(function (usr) {
									usersToSendNotification.push(usr.id);
								});
							}

							if (usersToSendNotification.length > 0) {
								sails.sockets.blast("general_notification", { message: notification.message, messageKey: notification.messageKey, users: usersToSendNotification });
								updateNotificationSentTo(notification, usersToSendNotification)
							}
						});   // get user of markets         
					} else {
						if (usersToSendNotification.length > 0) {
							sails.sockets.blast("general_notification", { message: notification.message, messageKey: notification.messageKey, users: usersToSendNotification });
							updateNotificationSentTo(notification, usersToSendNotification)
						}
					}   // get user of markets         
					// }); // get markets for perticuler pincode
				} else {
					var findCropQuery = {}
					findCropQuery.id = notification.productId
					Lands.findOne(findCropQuery).then(function (land) {
						if (land) {
							// var query = {};
							// query.pincode = {"$in" : [product.pincode] };
							// Market.find(query).then(function(m) {
							//           var marketIds = [];

							//           m.forEach(function(item){
							//              marketIds.push(item.id);
							//           });
							//           var findUserQuery = {}
							//           findUserQuery.$or = [{markets: {"$in" : marketIds}}]

							if (land.market != undefined || land.market != null) {
								var findUserQuery = {}
								findUserQuery.$or = [{ "markets": { "$in": [land.market] } }, { "franchisee": land.market }]
								findUserQuery.id = { $nin: usersToSendNotification }


								Users.find(findUserQuery).then(function (u) {
									if (u) {
										u.forEach(function (usr) {
											usersToSendNotification.push(usr.id);
										});
									}

									if (usersToSendNotification.length > 0) {
										sails.sockets.blast("general_notification", { message: notification.message, messageKey: notification.messageKey, users: usersToSendNotification });
										updateNotificationSentTo(notification, usersToSendNotification)
									}
								});   // get user of markets         
							} else {
								if (usersToSendNotification.length > 0) {
									sails.sockets.blast("general_notification", { message: notification.message, messageKey: notification.messageKey, users: usersToSendNotification });
									updateNotificationSentTo(notification, usersToSendNotification)
								}
							}
							// }); // get markets for perticuler pincode
						}
					})
				}
			}
			if (notification.productType == 'input') {

			}
		}
	},

	notifyUser: function (email, mobileNumber, messageText, SMSText, attachment) {


		/*		console.log(email);
				console.log(mobileNumber);
				console.log(messageText);
		*/
		/* transport.sendMail({
			 from: "osgroup.sdei@gmail.com",
 
		 transport.sendMail({
			 from: sails.config.appSMTP.auth.user,
 
			 to: email,
			 subject: 'eFarmX Notification',
			 html: messageText
		 }, function (err, info) {
			 console.log("errro is ",err, info);
		 });
		 
		 if(mobileNumber != ''){
			 client.messages.create({
				 to      :   constantObj.code.COUNTRY+""+mobileNumber,
				 from    :   constantObj.twillio.outboundPhoneNumber,
				 body    :   SMSText
			 });
		 }*/

		return true;
	},

	checkLandPaymentsStatus: function (paymentId) {
		Bidspayment.findOne({ id: paymentId }).populate("landInterestId").then(function (bidspaymentDetail) {
			if (bidspaymentDetail.landInterestId != undefined) {
				if (bidspaymentDetail.landInterestId.status == 'canceled' || bidspaymentDetail.landInterestId.status == 'failed' || bidspaymentDetail.landInterestId.status == 'transferred') {
				} else {
					let landpaymentfinderqry = {}
					landpaymentfinderqry.$or = [{ status: 'Paid' }, { status: 'Due' }, { status: 'Overdue' }]
					landpaymentfinderqry.landInterestId = bidspaymentDetail.landInterestId.id
					Bidspayment.count(landpaymentfinderqry).then(function (pendinpaymentscount) {
						if (pendinpaymentscount > 0) {
						} else {
							let landId = bidspaymentDetail.landInterestId.landId;

							Lands.findOne({ id: landId }).then(function (landInfo) {

								var sellerPayments = [];
								var sequenceNumber = 1;

								var days = 0
								days = days + landInfo.sellerUpfrontDays

								let upfrontObject = {
									landId: landInfo.id,
									baseLandId: landInfo.id,
									landInterestId: bidspaymentDetail.landInterestId.id,
									sellerId: landInfo.user,
									buyerId: bidspaymentDetail.landInterestId.buyerId,
									depositPercentage: landInfo.sellerUpfrontPercentage,
									depositLabel: "Upfront",
									depositDays: landInfo.sellerUpfrontDays,
									pincode: landInfo.pincode,
									paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
									type: "Upfront",
									status: "Due",
									productType: 'land',
									sequenceNumber: sequenceNumber,
									paymentMedia: 'landinterest',
									amount: parseFloat(bidspaymentDetail.landInterestId.sellerAmountByFarmX)
								}
								sellerPayments.push(upfrontObject)

								for (var i = 0; i < sellerPayments.length; i++) {
									if (sellerPayments[i].amount < 1) {
										sellerPayments[i].amount = 0
										sellerPayments[i].paymentMode = 'AutoAdjusted'
										sellerPayments[i].status = 'Verified'
										sellerPayments[i].isVerified = true
										sellerPayments[i].depositedOn = new Date()
									}
								}

								Sellerpayment.create(sellerPayments).then(function (responseSellerPayment) {
									if (responseSellerPayment) {
										let fndQry1 = {}
										fndQry1.id = bidspaymentDetail.landInterestId.id;
										let updateData = {};
										updateData.status = 'payments_done'

										Landinterests.update(fndQry1, updateData).then(function (lndInterestUpdae) {

											Lands.update({ id: landInfo.id }, { availableArea: landInfo.availableArea - bidspaymentDetail.landInterestId.area }).then(function (updatedland) {

												var msg = "All payments of land deal id (" + bidspaymentDetail.landInterestId.code + ") are done.";

												var notificationData = {};
												notificationData.land = bidspaymentDetail.landId;
												notificationData.user = bidspaymentDetail.landInterestId.franchiseeId;
												notificationData.productType = "lands";
												notificationData.productId = bidspaymentDetail.landId;

												notificationData.message = msg;
												notificationData.messageKey = "ALL_PAYMENTS_DONE_NOTIFICATION"
												notificationData.readBy = [];
												notificationData.messageTitle = "Payments done"

												let pushnotreceiver = [bidspaymentDetail.landInterestId.franchiseeId, bidspaymentDetail.landInterestId.coordinator]
												Notifications.create(notificationData).then(function (notificationResponse) {

													if (notificationResponse) {

														var usersToSendNotification = []
														if (notificationResponse.sellerId) {
															usersToSendNotification.push(notificationResponse.sellerId)
														}
														if (notificationResponse.buyerId) {
															usersToSendNotification.push(notificationResponse.buyerId)
														}
														let product = landInfo
														if (product != undefined) {

															// var query = {};
															// query.pincode = {"$in" : [product.pincode] };
															// Market.find(query).then(function(m) {
															//           var marketIds = [];

															//           m.forEach(function(item){
															//              marketIds.push(item.id);
															//           });
															//           var findUserQuery = {}
															//           findUserQuery.$or = [{markets: {"$in" : marketIds}}]
															if (product.market != undefined || product.market != null) {
																var findUserQuery = {}
																findUserQuery.$or = [{ "markets": { "$in": [product.market] } }, { "franchisee": product.market }]
																findUserQuery.id = { $nin: usersToSendNotification }

																Users.find(findUserQuery).then(function (u) {
																	if (u) {
																		u.forEach(function (usr) {
																			usersToSendNotification.push(usr.id);
																		});
																	}

																	if (usersToSendNotification.length > 0) {
																		sails.sockets.blast("general_notification", { message: notificationResponse.message, messageKey: notificationResponse.messageKey, users: usersToSendNotification });
																		updateNotificationSentTo(notificationResponse, usersToSendNotification)
																	}
																});   // get user of markets         
															} else {
																if (usersToSendNotification.length > 0) {
																	sails.sockets.blast("general_notification", { message: notificationResponse.message, messageKey: notificationResponse.messageKey, users: usersToSendNotification });
																	updateNotificationSentTo(notificationResponse, usersToSendNotification)
																}
															}   // get user of markets         
															// }); // get markets for perticuler pincode
														} else {

															if (landInfo.market != undefined || landInfo.market != null) {
																var findUserQuery = {}
																findUserQuery.$or = [{ "markets": { "$in": [landInfo.market] } }, { "franchisee": landInfo.market }]
																findUserQuery.id = { $nin: usersToSendNotification }


																Users.find(findUserQuery).then(function (u) {
																	if (u) {
																		u.forEach(function (usr) {
																			usersToSendNotification.push(usr.id);
																		});
																	}

																	if (usersToSendNotification.length > 0) {
																		sails.sockets.blast("general_notification", { message: notificationResponse.message, messageKey: notificationResponse.messageKey, users: usersToSendNotification });
																		updateNotificationSentTo(notificationResponse, usersToSendNotification)
																	}
																});   // get user of markets         
															} else {
																if (usersToSendNotification.length > 0) {
																	sails.sockets.blast("general_notification", { message: notificationResponse.message, messageKey: notificationResponse.messageKey, users: usersToSendNotification });
																	updateNotificationSentTo(notificationResponse, usersToSendNotification)
																}
															}
														}
														pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
													}
												})
											})
										})
									}
								}).fail(function (error) {
								})
							})
						}
					})
				}
			}
		})
	},

	sendOTTCSMS: function (smsInfo) {
		var request = require('request');

		let numbers = ""
		for (var i = 0; i < smsInfo.numbers.length; i++) {
			if (i != 0) {
				numbers += ","
			}
			numbers += smsInfo.numbers[i]

		}

		var options = {
			url: constantObj.fast2SMS.host + constantObj.fast2SMS.sendSMSPath,
			method: 'POST',
			headers: {
				"authorization": constantObj.fast2SMS.key
			},
			json: {
				"sender_id": constantObj.fast2SMS.sender_id,
				"language": "english",
				"route": "qt",
				"message": constantObj.fast2SMS.OTTC_TEMPLATED_ID,
				"numbers": numbers,
				"variables": "{#CC#}|{#DD#}|{#BB#}",
				"variables_values": smsInfo.tripcode + "|" + smsInfo.vehiclenumber + "|" + smsInfo.OTTC
			}
		}

		function callback(error, response, body) {
			console.log("body", body)
			if (!error && response.statusCode == 200) {
				return body
			} else {
				return {
					success: false,
					message: error
				};
			}
		}

		request(options, callback);

	},

	sendTripCancelledMessage: function (smsInfo) {
		var request = require('request');

		let numbers = ""
		for (var i = 0; i < smsInfo.numbers.length; i++) {
			if (i != 0) {
				numbers += ","
			}
			numbers += smsInfo.numbers[i]

		}

		var options = {
			url: constantObj.fast2SMS.host + constantObj.fast2SMS.sendSMSPath,
			method: 'POST',
			headers: {
				"authorization": constantObj.fast2SMS.key
			},
			json: {
				"sender_id": constantObj.fast2SMS.sender_id,
				"language": "english",
				"route": "qt",
				"message": constantObj.fast2SMS.TRIPCANCELED_TEMPLATED_ID,
				"numbers": numbers,
				"variables": "{#CC#}",
				"variables_values": smsInfo.tripcode
			}
		}

		function callback(error, response, body) {
			console.log("body", body)
			if (!error && response.statusCode == 200) {
				return body
			} else {
				return {
					success: false,
					message: error
				};
			}
		}

		request(options, callback);

	},

	sendNumberVerificationSMS: function (smsInfo) {
		var request = require('request');

		let numbers = ""
		for (var i = 0; i < smsInfo.numbers.length; i++) {
			if (i != 0) {
				numbers += ","
			}
			numbers += smsInfo.numbers[i]

		}

		var options = {
			url: constantObj.fast2SMS.host + constantObj.fast2SMS.sendSMSPath,
			method: 'POST',
			headers: {
				"authorization": constantObj.fast2SMS.key
			},
			json: {
				"sender_id": constantObj.fast2SMS.sender_id,
				"language": "english",
				"route": "qt",
				"message": constantObj.fast2SMS.VERIFYNUMBER_OTP_TEMPLATED_ID,
				"numbers": numbers,
				"variables": "{#BB#}|{#AA#}",
				"variables_values": smsInfo.otp + "|" + "30"
			}
		}

		function callback(error, response, body) {
			console.log("body", body)
			if (!error && response.statusCode == 200) {
				return body
			} else {
				return {
					success: false,
					message: error
				};
			}
		}

		request(options, callback);

	},

	sendLoginOTPSMS: function (smsInfo) {
		var request = require('request');

		let numbers = ""
		for (var i = 0; i < smsInfo.numbers.length; i++) {
			if (i != 0) {
				numbers += ","
			}
			numbers += smsInfo.numbers[i]

		}

		var options = {
			url: constantObj.fast2SMS.host + constantObj.fast2SMS.sendSMSPath,
			method: 'POST',
			headers: {
				"authorization": constantObj.fast2SMS.key
			},
			json: {
				"sender_id": constantObj.fast2SMS.sender_id,
				"language": "english",
				"route": "qt",
				"message": constantObj.fast2SMS.LOGIN_OTP_TEMPLATED_ID,
				"numbers": numbers,
				"variables": "{#BB#}|{#AA#}",
				"variables_values": smsInfo.otp + "|" + "30"
			}
		}

		function callback(error, response, body) {
			console.log("body", body)
			if (!error && response.statusCode == 200) {
				return body
			} else {
				return {
					success: false,
					message: error
				};
			}
		}

		request(options, callback);

	},

	sendGeneralSMSToUsersWithId: function (smsInfo, usersid) {
		Users.find({ id: { $in: usersid } }, { fields: ['mobile'] }).then(function (userss) {
			let allNumbers = []
			for (var i = 0; i < userss.length; i++) {

				if (userss[i].mobile) {
					allNumbers.push(userss[i].mobile)
				}
			}

			if (allNumbers.length > 0) {
				smsInfo.numbers = allNumbers
				var request = require('request');

				let numbers = ""
				for (var i = 0; i < smsInfo.numbers.length; i++) {
					if (i != 0) {
						numbers += ","
					}
					numbers += smsInfo.numbers[i]

				}

				let variables = ""
				let variableValues = ""
				if (smsInfo.variables) {
					let i = 0
					for (var key of Object.keys(smsInfo.variables)) {
						if (i != 0) {
							variables += "|"
							variableValues += "|"
						}

						variables += key
						variableValues += smsInfo.variables[key]

						i = i + 1
					}
				}

				var options = {
					url: constantObj.fast2SMS.host + constantObj.fast2SMS.sendSMSPath,
					method: 'POST',
					headers: {
						"authorization": constantObj.fast2SMS.key
					},
					json: {
						"sender_id": constantObj.fast2SMS.sender_id,
						"language": "english",
						"route": "qt",
						"message": smsInfo.templateId,
						"numbers": numbers,
						"variables": variables,
						"variables_values": variableValues
					}
				}

				function callback(error, response, body) {
					console.log("body", body)
					console.log("templateId == ", smsInfo.templateId)
					if (!error && response.statusCode == 200) {
						return body
					} else {
						return {
							success: false,
							message: error
						};
					}
				}

				request(options, callback);
			}
		})
	},

	//required keys {numbers:[Int], variables:{Object}, templateId:"String"}
	sendGeneralSMS: function (smsInfo) {
		var request = require('request');
		// console.log(smsInfo, 'smsinfo')
		let numbers = ""
		for (var i = 0; i < smsInfo.numbers.length; i++) {
			if (i != 0) {
				numbers += ","
			}
			numbers += smsInfo.numbers[i]

		}

		let variables = ""
		let variableValues = ""
		if (smsInfo.variables) {
			let i = 0
			for (var key of Object.keys(smsInfo.variables)) {
				if (i != 0) {
					variables += "|"
					variableValues += "|"
				}

				variables += key
				variableValues += smsInfo.variables[key]

				i = i + 1
			}
		}

		var options = {
			url: constantObj.fast2SMS.host + constantObj.fast2SMS.sendSMSPath,
			method: 'POST',
			headers: {
				"authorization": constantObj.fast2SMS.key
			},
			json: {
				"sender_id": constantObj.fast2SMS.sender_id,
				"language": "english",
				"route": "qt",
				"message": smsInfo.templateId,
				"numbers": numbers,
				"variables": variables,
				"variables_values": variableValues
			}
		}


		function callback(error, response, body) {
			//console.log("body", body)
			console.log("templateId == ", smsInfo.templateId)
			if (!error && response.statusCode == 200) {
				return body
			} else {
				return {
					success: false,
					message: error
				};
			}
		}

		request(options, callback);
	},

	closeCropByEndDate: function (data, cb) {

		let query = {};
		query.isExpired = false;
		query.endDate = { "$lte": new Date().toISOString() };

		Crops.find(query, { fields: ['name', 'endDate'] }).exec(function (err, croplist) {

			async.each(croplist, function (crop, callback) {

				/*let query1 = {};
				 query1.id = ObjectId( crop.id );*/

				Crops.update(
					crop.id,
					{ isExpired: true }
				)
					.exec(function (err, cropupdate) {

						callback();

					});

			}, function (error) {
				if (error) {
					return cb(error);
				} else {
					return cb(croplist);
				}
			});
		});
	},

	send: function (options, context, req, res) {

		transport.sendMail({
			from: options.from,
			to: options.to,
			subject: options.subject,
			html: options.message
		}, function (err, info) {

			if (err) {
				return res.jsonx({
					success: false,
					error: err
				});
			} else {
				return Webmail.create(options).exec(function (err, data) {
					if (err) {
						return res.jsonx({
							success: false,
							error: err
						});
					} else {
						return res.jsonx({
							success: true,
							data: {
								data: data,
								message: "Mail has been sent successfully."
							}
						});
					}

				})
			}
		});
	},

	highCapexPayment: function (data, context) {

	},

	getUserDetail: function (userId, cb) {

		Users.findOne({ id: userId }).exec(function (usrerr, usrresponse) {
			if (usrerr) {
				return cb(usrerr)
			} else {
				return cb(null, usrresponse)
			}
		});
	},
	getDataWithoutPincode: function (village, block, district, state) {
		// console.log(village, block, district, state)
		const prom = new Promise((resolve, reject) => {
			Pincodelist.findOne({
				"Related Suboffice": new RegExp(village, 'i'),
				Taluk: new RegExp(block, 'i'),
				Districtname: new RegExp(district, 'i'), statename: new RegExp(state, 'i')
			}).then(function (info) {
				if (info) {
					resolve(info);
				} else {
					// console.log("dddd")
					let qry1 = {};
					qry1 = { Taluk: new RegExp(block, 'i'), Districtname: new RegExp(district, 'i'), statename: new RegExp(state, 'i') };
					Pincodelist.findOne(qry1).then(function (info) {

						if (info) {
							resolve(info);
						} else {
							Pincodelist.findOne({
								//"Related Suboffice": new RegExp(block, 'i'),
								//Taluk: new RegExp(block, 'i'),
								Districtname: new RegExp(district, 'i'), statename: new RegExp(state, 'i')
							}).then(function (info) {
								if (info) {
									resolve(info);
								} else {
									reject('error');
								}
							})
						}
					})
					//reject('error');
				}
			})

		})
		return prom.then(function (success) {
			return success
		}).catch(function (err) {
			return err
		})
	},
	getDataFromPincode: function (pincode) {

		const prom = new Promise((resolve, reject) => {
			Pincodelist.findOne({ pincode: pincode }).then(function (info) {
				if (info) {
					resolve(info);
				} else {
					reject('error');
				}
			})
		})

		return prom.then(function (success) {
			return success
		}).catch(function (err) {
			return err
		})
	},
	getDistance: function (origin, destination) {
		var distance = require('google-distance-matrix');
		var origins = [origin];
		console.log(origins, 'origins')
		var destinations = [destination];
		let googleApiKey = constantObj.googlePlaces.key;
		distance.key(googleApiKey);
		distance.units('metric');
		//console.log(lantLong)
		var dist = {};
		return new Promise((resolve, reject) => {

			distance.matrix(origins, destinations, function (err, distances) {

				if (err) { reject('error'); }
				if (distances.status == 'OK') {
					for (var i = 0; i < origins.length; i++) {
						for (var j = 0; j < destinations.length; j++) {
							var origin = distances.origin_addresses[i];
							var destination = distances.destination_addresses[j];
							if (distances.rows[0].elements[j].status == 'OK') {
								var distance = distances.rows[i].elements[j].distance.text;
								var value = distances.rows[i].elements[j].distance.value;
								dist.text = distance;
								dist.value = value;
								//console.log('Distance from ' + origin + ' to ' + destination + ' is ' + distance, 'value', value);
							} else {
								console.log(destination + ' is not reachable by land from ' + origin);
							}
						}
					}
					console.log(dist, 'dist====')
					resolve(dist);

				}


			})
		})
	},
	getLatLong: function (address) {
		var NodeGeocoder = require('node-geocoder');
		var geocoder = NodeGeocoder(constantObj.googlePlaces.options);
		return new Promise((resolve, reject) => {
			geocoder.geocode(address, function (err, response) {
				if (err) {
					reject('error');
				} else {
					resolve(response);
				}
			});
		})
	},
	getUniqueCodeString: function () {
		var d = new Date();
		var n = d.getTime();
		let code = Math.floor(1000 + Math.random() * 9000);;
		return n + "-" + code;
	},
	getUniqueCode: function () {
		let code = Math.floor(Math.random() * 900001258) + 100009852;
		return code;
	},

	getOrderCode: function (strCode) {
		let codex = Math.floor(Math.random() * 999991258) + 100008833;
		codex = strCode + "_" + codex;
		return codex;
	},

	getRefundCode: function (strCode) {
		let codex = Math.floor(Math.random() * 99990) + 10009;
		codex = strCode + codex;
		return codex;
	},

	getalphanumeric_unique: function () {
		return Math.random().toString(36).split('').filter(function (value, index, self) {
			return self.indexOf(value) === index;
		}).join('').substr(2, 8);
	},

	getSettings: function (cb) {

		Settings.find({}).exec(function (err, data) {
			let firstRecord = data[0];

			if (data) {
				return cb(null, firstRecord);
			} else {
				return cb(err);
			}
		})
	},
	getLogisticCharges: function (data, cb) {

		let rangeRate = 0;
		let distance = parseFloat(data.distance);
		let quantities = parseFloat(data.quantities)
		let query = {};
		query.mt = { $lte: quantities };

		Logisticlimits.find(query).exec(function (err, result) {

			result.forEach(function (charges) {

				charges.range.forEach(function (item) {

					if (item.lower <= distance && item.higher >= distance) {
						rangeRate = (rangeRate + item.rate);
					}
				});
			});


			var totalLogisticRateForDistance = (rangeRate * distance);
			return cb(null, totalLogisticRateForDistance);

			/*rangeRate = result.range;
			rangeRate.forEach(function(item){
				
				if(item.lower < distance && item.higher >= distance){
					return cb(null, item.rate); 
				}
	
			});*/
		})
	},
	findLogisticCharges: function (data, context) {

		var distance = parseFloat(data.distance);
		var quantities = parseFloat(data.quantities);

		switch (true) {

			case (distance > 0):

				if (distance == 50) {
					break;
				}
			case (distance > 51):


				if (distance == 100) {
					break;
				}
			case (distance > 101):

				if (distance == 200) {

					break;
				}
			case (distance > 201):
				if (distance >= 200) {
					break;
				}
				break;
			//default:
		}

	},
	getAverageRating: function (user) {
		let finalAve = 0;
		let query = {};
		query.user = user;
		query.isFarmx = 'No';

		return Rating.find(query).then(function (rating) {
			let ave = 0;
			let totalRcd = rating.length;

			rating.forEach(function (row) {
				ave = row.star + ave;
			});

			finalAve = ave / totalRcd;


			delete query.isFarmx
			query.isFarmx = 'Yes';


			return Rating.find(query).then(function (farmxRating) {
				let avg = 0;
				let total = farmxRating.length;
				let finalAvg = 0;

				farmxRating.forEach(function (farmxRow) {
					avg = farmxRow.star + avg;
				});

				finalAvg = avg / total;

				let data = {
					"userRating": finalAve,
					"farmxRating": finalAvg,
					"rating": finalAve
				}

				return data;

			});
			//return { "rating": finalAve };
		});

	},

	sendSaveNotification: function (data, cb) {

		let query = {};
		query.user = data.user;
		query.device_type != "Web";

		return Userslogin.find(query)
			.then(function (userdevices) {

				async.each(userdevices, function (userdevice, callback) {
					if (userdevice) {
						userdevice.message = data.message;
					}

					pushService.sendPush(userdevice, function (err, succ) {
						if (err) return callback(err);
						return callback()
					});
				}, function (err) {
					// if any of the file processing produced an error, 
					// err would equal that error
					if (err) {
						return cb(err);
					} else {
						return cb(null, userdevices);
					}
				});

			})
			.catch(function (error) {
			})
	},

	createPDF: function (mailBody, cb) {
		var html5pdf = require('html5-to-pdf');
		var path = require('path');
		var rootPath = path.resolve(sails.config.appPath);

		var randomstring = require('randomstring');
		var randomstr = randomstring.generate(8);
		var fs = require('fs');
		var options = {
			"paperFormat": 'A3',
			"paperOrientation": "portrait",
			"paperBorder": "1cm",
		};
		var mailbody = "<html><head><style>body{padding:10px;}table{font-size:10px;}</style></head><body><div style=font-size:10px>" + mailBody.mailBody + "</div></body></html>";

		html5pdf(options).from.string(mailbody).to('./pdfs/attachment' + randomstr + '.pdf', function (err, res) {
			if (err) {
				return console.log("error in generation of html5-to-pdf", err);
			} else {
				transport.sendMail({
					from: 'eFarmX',
					to: mailBody.email,
					subject: mailBody.subject,
					html: mailBody.msg,
					attachments: [{
						filename: 'attachment.pdf',
						path: './pdfs/attachment' + randomstr + '.pdf',
						contentType: 'application/pdf'
					}]
				}, function (error, info) {
					if (error) {
					} else {
						fs.unlink('./pdfs/attachment' + randomstr + '.pdf', function (err, data) {
							if (err) console.log(err);
						})
						return true;
					}
				});
			}
		})
	},

	sendSMS: function (data, cb) {
		var client = require('twilio')(constantObj.twillio.accountSid, constantObj.twillio.authToken);

		client.messages.create({
			to: constantObj.code.COUNTRY + "" + data.mobile,
			from: constantObj.twillio.outboundPhoneNumber,
			body: data.message
		}, function (error, message) {
			if (error) {
				return cb(error)
			} else {
				return cb(null, message);
			}
		});
	},

	finalBidStatus: function (data, cb) {

		let query = {};
		//query.type = "Final" ;
		//query.paymentDueDate = { "$lt": new Date(new Date().setDate(new Date().getDate())).toISOString() } ;
		query.status = "Due"
		let date = new Date;
		date.setHours(0, 0, 0)

		query.paymentDueDate = { "$lt": date };

		Bidspayment.find(query).then(function (bidpaymentlist) {
			async.each(bidpaymentlist, function (paymentTypeList, callback) {
				Bidspayment.update(paymentTypeList.id, { status: "Overdue" }).then(function () {
					callback();
				});
			}, function (error) {
				if (error) {
					return cb(error);
				} else {
					return cb();
				}
			});
		});
	},

	sellerPaymentStatus: function (data, cb) {

		let query = {};
		//query.type = "Final" ;
		//query.paymentDueDate = { "$lt": new Date(new Date().setDate(new Date().getDate())).toISOString() } ;
		query.$or = [{ status: "Due" }, { status: "Refund" }]
		let date = new Date;
		date.setHours(0, 0, 0)

		query.paymentDueDate = { "$lt": date };

		Sellerpayment.find(query).then(function (sellerpaymentlist) {
			async.each(sellerpaymentlist, function (paymentTypeList, callback) {
				let toChangeStatus = "Overdue"
				if (paymentTypeList.status == "Refund") {
					toChangeStatus = "OverdueRefund"
				}
				Sellerpayment.update(paymentTypeList.id, { status: toChangeStatus }).then(function () {
					callback();
				});
			}, function (error) {
				if (error) {
					return cb(error);
				} else {
					return cb();
				}
			});
		});
	},

	franchiseePaymentStatus: function (data, cb) {
		let query = {};

		query.status = 'Due';

		let date = new Date;
		date.setHours(0, 0, 0)

		query.paymentDueDate = { "$lt": date };

		FranchiseePayments.find(query).then(function (franchiseePayments) {
			async.each(franchiseePayments, function (fp, callback) {
				var updateQuery = {}
				updateQuery.id = fp.id
				FranchiseePayments.update(updateQuery, { status: "Overdue" }).then(function () {
					callback();
				}).fail(function (error) {
					callback();
				});
			}, function (error) {
				if (error) {
					return cb(error);
				} else {
					return cb();
				}
			});
		});
	},

	buyerRefundedPaymentStatus: function (data, cb) {

		let query = {};

		query.status = "Refunded"
		let date = new Date;
		date.setDate(date.getDate() + 2);
		date.setHours(0, 0, 0)

		query.paymentDate = { "$lt": date };

		Bidspayment.find(query).then(function (sellerpaymentlist) {
			async.each(sellerpaymentlist, function (paymentTypeList, callback) {
				Bidspayment.update(paymentTypeList.id, { status: "RefundVerified" }).then(function () {
					callback();
				});
			}, function (error) {
				if (error) {
					return cb(error);
				} else {
					return cb();
				}
			});
		});
	},

	logisticPaymentStatus: function (data, cb) {
		let query = {};

		query.status = 'Due';

		let date = new Date;
		date.setHours(0, 0, 0)

		query.paymentDueDate = { "$lt": date };

		LogisticPayment.find(query).then(function (logPayments) {
			async.each(logPayments, function (lp, callback) {
				var updateQuery = {}
				updateQuery.id = lp.id
				LogisticPayment.update(updateQuery, { status: "Overdue" }).then(function () {
					callback();
				}).fail(function (error) {
					callback();
				});
			}, function (error) {
				if (error) {
					return cb(error);
				} else {
					return cb();
				}
			});
		});
	},

	inactiveUsers: function (data, cb) {
		var query = {};

		query.roles = 'U';
		query.status = 'active';

		var date = new Date();
		date.setDate(date.getDate() - 45);

		query.lastLogin = { "$lt": date };

		Users.find(query).then(function (users) {
			async.each(users, function (user, callback) {
				var updateQuery = {}
				updateQuery.id = user.id

				Users.update(updateQuery, { status: "inactive" }).then(function () {
					callback();
				}).fail(function (error) {
				});
			}, function (error) {
				if (error) {
					return cb(error);
				} else {
					return cb();
				}
			});
		});
	},

	makeDeliveredToReceivedStatus: function (data, cb) {
		var query = {};


		var date = new Date();
		date.setDate(date.getDate() - 2);

		query.$or = [{ $and: [{ status: 'Delivered' }, { logisticsOption: 'efarmx' }, { ATA: { "$lt": date } }] }, { $and: [{ status: 'Dispatched' }, { logisticsOption: 'self' }, { ATD: { "$lt": date } }] }];
		// query.ATA = {"$lt": date};


		return Bids.find(query).then(function (bids) {
			async.each(bids, function (bid, callback) {
				var updateQuery = {}
				updateQuery.id = bid.id

				var toupdate = {}
				toupdate.status = 'Received'
				toupdate.receivedDate = new Date()
				toupdate.receivedQuantityStatus = "FullReceive"

				Bids.update(updateQuery, toupdate).then(function (updatedBid) {

					var findCropQuery = {}
					findCropQuery.id = bid.crop
					Crops.findOne(findCropQuery).populate('market').then(function (crop) {
						var fpQuery = {}
						fpQuery.cropId = bid.crop
						fpQuery.bidId = bid.id
						fpQuery.sellerId = crop.seller
						fpQuery.buyerId = bid.user
						fpQuery.amount = parseFloat(bid.amount * parseFloat(crop.franchiseePercentage / 100))
						fpQuery.pincode = crop.pincode
						fpQuery.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString()
						fpQuery.status = 'Due'
						if (crop.market.id) {
							fpQuery.marketId = crop.market.id
						} else if (crop.market._id) {
							fpQuery.marketId = crop.market._id
						}
						fpQuery.franchiseeUserId = crop.market.GM
						FranchiseePayments.create(fpQuery).then(function (fp) {
							callback();
						}).fail(function (error) {
							callback();
						})
					}).fail(function (error) {
						callback();
					})
				}).fail(function (error) {
					callback();
				});
			}, function (error) {
				if (error) {
					return cb(error);
				} else {
					return cb();
				}
			});
		});
	},

	makeDeliveredToReceivedStatusOrders: function (data, cb) {
		var query = {};


		var date = new Date();
		date.setDate(date.getDate() - 1);

		query.$or = [{ $and: [{ status: 'Delivered' }, { logisticsOption: 'efarmx' }, { ATA: { "$lt": date } }] }, { $and: [{ status: 'Dispatched' }, { logisticsOption: 'self' }, { ATD: { "$lt": date } }] }];
		// query.ATA = {"$lt": date};


		return Orderedcarts.find(query).then(function (bids) {
			async.each(bids, function (bid, callback) {
				var updateQuery = {}
				updateQuery.id = bid.id

				var toupdate = {}
				toupdate.status = 'Received'
				toupdate.receivedDate = new Date()
				toupdate.receivedQuantityStatus = "FullReceive"

				Orderedcarts.update(updateQuery, toupdate).then(function (updatedBid) {

					var findCropQuery = {}
					findCropQuery.id = bid.crop
					Crops.findOne(findCropQuery).populate('market').then(function (crop) {
						var fpQuery = {}
						fpQuery.cropId = bid.crop
						fpQuery.order = bid.order
						fpQuery.suborder = bid.id
						fpQuery.sellerId = crop.seller
						fpQuery.buyerId = bid.user
						fpQuery.amount = parseFloat((parseFloat(suborder[0].amount * suborder[0].quantity) * parseFloat(crop.franchiseePercentage / 100)).toFixed(2))
						fpQuery.pincode = crop.pincode
						fpQuery.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString()
						fpQuery.status = 'Due'
						if (crop.market.id) {
							fpQuery.marketId = crop.market.id
						} else if (crop.market._id) {
							fpQuery.marketId = crop.market._id
						}
						fpQuery.franchiseeUserId = crop.market.GM
						FranchiseePayments.create(fpQuery).then(function (fp) {
							callback();
						}).fail(function (error) {
							callback();
						})
					}).fail(function (error) {
						callback();
					})
				}).fail(function (error) {
					callback();
				});
			}, function (error) {
				if (error) {
					return cb(error);
				} else {
					return cb();
				}
			});
		});
	},

	cropExpired: function (data, cb) {
		var query = {};
		var date = new Date;

		date.setHours(0, 0, 0)
		query.$or = [
			{
				bidEndDate: { "$lt": date }
			},
			{
				leftAfterAcceptanceQuantity: { "$lte": 0 }
			}
		]
		// query.endDate = {"$lt": date}            
		query.isExpired = false

		return Crops.find(query).populate('market').then(function (cropslist) {

			async.each(cropslist, function (crop, callback) {

				var updateCropQuery = {}
				updateCropQuery.id = crop.id

				Crops.update(updateCropQuery, { isExpired: true }).then(function (cropdata) {
					var msg = "Crop " + cropdata[0].name + " with id " + cropdata[0].code + " is expired. ";

					var notificationData = {};
					notificationData.productId = cropdata[0].id;
					notificationData.crop = cropdata[0].id;
					notificationData.sellerId = cropdata[0].seller;
					notificationData.user = cropdata[0].seller;
					notificationData.productType = "crops";
					//notificationData.transactionOwner = u[0].id;
					notificationData.transactionOwner = cropdata[0].transactionOwner;
					notificationData.message = msg;
					notificationData.messageKey = "CROP_EXPIRED_NOTIFICATION"
					notificationData.readBy = [];
					notificationData.messageTitle = "Crop expired"
					let pushnotreceiver = cropdata[0].seller
					if (crop.market && crop.market.GM) {
						pushnotreceiver.push(crop.market.GM)
					}

					Notifications.create(notificationData).then(function (notificationResponse) {
						if (notificationResponse) {
							pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
						}

						callback();
					}).fail(function (err) {
						callback();
					})
				});
			}, function (error) {
				if (error) {
					return cb(error);
				} else {
					return cb()
				}
			});
		});
	},
	landExpired: function (data, cb) {
		var query = {};
		var date = new Date;

		date.setHours(0, 0, 0)
		query.$or = [
			{
				availableTill: { "$lt": date }
			},
			{
				availableArea: { "$lte": 0 }
			}
		]
		// query.endDate = {"$lt": date}            
		query.isExpired = false

		return Lands.find(query).populate('market').then(function (landlist) {

			async.each(landlist, function (land, callback) {

				var updateLandQuery = {}
				updateLandQuery.id = land.id

				Lands.update(updateLandQuery, { isExpired: true }).then(function (landdata) {
					var msg = "Land " + landdata[0].title + " with id " + landdata[0].code + " is expired. ";

					var notificationData = {};
					notificationData.productId = landdata[0].id;
					notificationData.crop = landdata[0].id;
					notificationData.sellerId = landdata[0].user;
					notificationData.user = landdata[0].user;
					notificationData.productType = "lands";
					//notificationData.transactionOwner = u[0].id;
					//notificationData.transactionOwner = landdata[0].transactionOwner;
					notificationData.message = msg;
					notificationData.messageKey = "LAND_EXPIRED_NOTIFICATION"
					notificationData.readBy = [];
					notificationData.messageTitle = "Land expired"
					let pushnotreceiver = landdata[0].user
					if (land.market && land.market.GM) {
						pushnotreceiver.push(land.market.GM)
					}

					Notifications.create(notificationData).then(function (notificationResponse) {
						if (notificationResponse) {
							pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
						}

						callback();
					}).fail(function (err) {
						callback();
					})
				});
			}, function (error) {
				if (error) {
					return cb(error);
				} else {
					return cb()
				}
			});
		});
	},

	onGoingTripStatuses: function (data, cb) {

		let query = {};

		query.status = 'Tracking';

		LogisticTrip.find(query).then(function (trips) {

			async.each(trips, function (trip, callback) {

				var timeToBeTaken = 0

				let path1 = 'assets/location/prescriberoutes/' + trip.id + '.json';

	            fs.readFile(path1, function (err, content) {
                    var locJsonPR;

	            	if (content == undefined) {
	                    locJsonPR = [];
	                } else {
	                    locJsonPR = content.length > 0 ? JSON.parse(content) : [];
	                }
				 	
				 	trip.prescribedRoute = locJsonPR;


				 	let path = 'assets/location/triplocations/' + trip.id + '.json';

                    fs.readFile(path, function (err, content) {
	                    var locJsonPR;
                        if (content == undefined) {
                            locJson = [];
                        } else {
                            locJson = content.length > 0 ? JSON.parse(content) : [];
                        }

						trip.locations = locJson


		            	if (trip.prescribedRoute && trip.locations) {

							var lastLocationdistance = 0

							for (var i = 0; i < trip.prescribedRoute.length; i++) {
								let pointstartLocation = new GeoPoint(trip.prescribedRoute[i].start_location.lat, trip.prescribedRoute[i].start_location.lng);
								let lastLocationPoint = new GeoPoint(trip.locations[trip.locations.length - 1].coord.lat, trip.locations[trip.locations.length - 1].coord.lon);

								var distancestartLocation = pointstartLocation.distanceTo(lastLocationPoint, true)
								if (i == 0) {
									lastLocationdistance = distancestartLocation
									timeToBeTaken = 0
								} else {
									if (distancestartLocation < lastLocationdistance) {
										lastLocationdistance = distancestartLocation
										timeToBeTaken = 0
									} else {
										timeToBeTaken = timeToBeTaken + trip.prescribedRoute[i].duration.value
									}
								}

								let pointendlocation = new GeoPoint(trip.prescribedRoute[i].end_location.lat, trip.prescribedRoute[i].end_location.lng);

								var distanceEndLocation = pointendlocation.distanceTo(lastLocationPoint, true)

								if (distanceEndLocation < lastLocationdistance) {
									lastLocationdistance = distanceEndLocation
									timeToBeTaken = 0
								}
							}

							let totalTimePlanned = 0

							if (trip.totalTimeToBeTaken) {
								totalTimePlanned = trip.totalTimeToBeTaken.value * trip.logisticTimeFactor
							}

							let firstLocationTime = new Date(trip.locations[0].time)
							let expectedTimeToReach = new Date(firstLocationTime.getTime() + totalTimePlanned * 1000)

							let currentTime = new Date()
							let currentlyReachingTime = new Date(currentTime.getTime() + (timeToBeTaken * trip.logisticTimeFactor) * 1000)

							var delaySeconds = (currentlyReachingTime.getTime() - expectedTimeToReach.getTime()) / 1000;

							if (delaySeconds == NaN) {
								delaySeconds = 0
							}

							let status = 'OnTime'
							if (delaySeconds > totalTimePlanned * 0.1) {
								status = 'Late'
							}

							trip.runningStatus = status
							trip.delayTime = delaySeconds//Int(delaySeconds)

							delete trip.orders
							delete trip.prescribedRoute
							delete trip.locations

							trip.prescribedRoute = []
							trip.locations = []

							LogisticTrip.update({ id: trip.id }, trip).then(function (updatedTrip) {
								callback();
							}).fail(function (err) {
								callback();
							})
						} else {
							callback();
						}
					})
				})				
			}, function (error) {
				if (error) {
					return cb(error);
				} else {
					return cb();
				}
			});
		});
	},

	//INPUTS CRON JOBS

	expireInput: function (data, cb) {

		let query = {};
		query.isExpired = false;
		query.$or = [{ endDate: { "$lte": new Date().toISOString() } }, { availableQuantity: { "$lte": 0.0 } }];

		Inputs.update(query, { isExpired: true }).exec(function (error, inputlist) {
			if (error) {
				return cb(error);
			} else {
				return cb(croplist);
			}
		});
	},


	//======================= daily basis email sent to admin user ===========================
	sendEmailToAdminUsers: (data, cb) => {
		var datetime = new Date();
		// subtract one day from specified time                           
		datetime.setDate(datetime.getDate() - 1);
		var date = datetime.toISOString().slice(0, 10);
		var fileName = "user_info.xlsx";
		console.log(datetime);
		var json2xls = require('json2xls');
		var fs = require('fs');
		day = datetime.getDate();
		month = datetime.getMonth() + 1;
		year = datetime.getFullYear();
		if (day < 10) {
			day = '0' + day;
		}
		if (month < 10) {
			month = '0' + month;
		}
		finaldate = day + "-" + month + "-" + year;
		Userslogin.native(function (err, userslogin) {
			userslogin.aggregate([
				{
					$lookup: {
						from: 'users',
						localField: 'user',
						foreignField: '_id',
						as: "usr"
					}
				},
				{
					$unwind: '$usr'
				},
				{
					$project: {

						roles: "$usr.roles",
						Name: "$usr.fullName",
						Email: "$usr.email",
						Mobile: "$usr.mobile",
						City: "$usr.city",
						State: "$usr.state",
						createdAt: "$createdAt",
						device: "$device_type",

					}
				},
				{
					$match: {
						$or: [{ roles: "U" }, { roles: "CP" }],
						$and: [{ createdAt: { $gte: new Date(date + "T00:00:01+05:30") } }, { createdAt: { $lte: new Date(date + "T23:59:59+05:30") } }]
					}
				},
				{
					$sort: {
						"State": 1
					}
				},
				{
					$group: {
						_id: {
							roles: "$roles",
						},
						data: {
							$push: {
								Name: "$Name", Email: "$Email", Mobile: "$Mobile", City: "$City", State: "$State", CreatedAt: "$createdAt", Device: "$device"
							}
						},
						count: {
							$sum: 1
						}
					}
				},
				{ $unwind: "$data" }

			], function (err, results) {
				if (err) {
					console.log(err);
				}

				var userresult = results;
				if (userresult != undefined && userresult != null) {
					var results = results.map(function (obj) {
						return { Name: obj.data.Name, Email: obj.data.Email, Mobile: obj.data.Mobile, City: obj.data.City, State: obj.data.State, Device: obj.data.Device };
					});

					var json = results;
					var xls = json2xls(json);
					fs.writeFileSync('./csvs/' + fileName, xls, 'binary');
					// message = "Hi Team,";
					var message = '<br/><br/>';
					message += 'This mail is in regard to keep you informed about the total count of users that have been active on the FarmX panel.';
					message += '<br/><br/>';
					message += 'For <strong> ' + finaldate + ', Total Number of Active Users: ' + userresult[0].count + ' </strong>';
					message += '<br/><br/><br/>';
					message += 'Thanks';
					message += '<br> <strong> Team FarmX </strong>';
					var query = {};
					query.select = ['firstName', 'email'];
					query.or = [{ roles: "A" }, { roles: "SA" }]
					Users.find(query).exec((err, users) => {
						users.forEach(function (userlist) {
							let messageToSend = "Hi " + userlist.firstName + ", " + message
							let emailMessage = {
								from: sails.config.appSMTP.auth.user,
								to: userlist.email,
								subject: 'FarmX: Active Users - ' + finaldate,
								html: messageToSend,
								attachments: [{
									path: './csvs/' + fileName
								}]
							};

							transport.sendMail(emailMessage, function (err, info) {
								if (err) {
									return;
								} else {
									console.log('mail sent successfully');
								}
							});
						})

					})
				}

			});

		})



	},
	// daily placed bids report email
	dailyBidReports: () => {

		var datetime = new Date();
		datetime.setDate(datetime.getDate() - 1);
		var date = datetime.toISOString().slice(0, 10);
		Bids.native(function (err, bids) {

			bids.aggregate([
				{
					$match: {
						$and: [{ productType: 'crop' }],
						$and: [{ createdAt: { $gte: new Date(date + "T00:00:01+05:30") } }, { createdAt: { $lte: new Date(date + "T23:59:59+05:30") } }]
					}
				},
				{
					$lookup: {
						from: "crops",
						localField: "crop",
						foreignField: "_id",
						as: "crops"
					}
				},
				{ $unwind: "$crops" },
				{
					$lookup: {
						from: "category",
						localField: "crops.category",
						foreignField: "_id",
						as: "category"
					}
				},
				{ $unwind: "$category" },

				{
					$lookup: {
						from: "market",
						localField: "crops.market",
						foreignField: "_id",
						as: "market"
					}
				},
				{ $unwind: "$market" },

				{
					$lookup: {
						from: "users",
						localField: "market.GM",
						foreignField: "_id",
						as: "franchisee"
					}
				},
				{ $unwind: "$franchisee" },
				{
					$lookup: {
						from: "users",
						localField: "user",
						foreignField: "_id",
						as: "buyer"
					}
				},
				{ $unwind: "$buyer" },
				{
					$project: {
						_id: 0,
						Date: "$createdAt",
						BidId: "$code",
						//category: "$category._id",
						CategoryName: "$category.name",
						//market: "$market._id",
						MarketName: "$market.name",
						//franchisee: "$franchisee._id",
						FranchiseeName: "$franchisee.fullName",
						City: "$franchisee.city",
						District: "$franchisee.district",
						State: "$franchisee.state",
						CropId: "$crops.code",
						CropName: "$crops.name",
						pincode: "$crops.pincode",
						buyerName: "$buyer.fullName",
						Qunatity: "$quantity",
						QunatityUnit: "$quantityUnit",
						GMV: "$amount",
						Margin: "$facilitationCharges",
						FacilitationPercent: "$facilitationPercent",
						Status: "$status"
					}
				}

			], function (err, results) {
				if (err) {
					return err;
				}
				else {
					//let roleIds = {};
					Roles.findOne({ name: "FO" }).then(function (rolefo) {
						let roleIdOfFo = rolefo ? rolefo.id : '';
						Roles.findOne({ name: "TSM" }).then(function (roletsm) {
							let roleIdOfTSM = roletsm ? roletsm.id : '';
							Roles.findOne({ name: "Ops Head" }).then(function (roleops) {
								let roleIdOfOPS = roleops ? roleops.id : '';
								if (roleIdOfFo != "" || roleIdOfTSM != "" || roleIdOfOPS != "") {
									async.each(results, function (bid, callback) {
										//for (role in roleIds) {
										bid.role = "-";
										bid.zone = "-";

										// console.log(roleQuery, 'adminsWithRoles===');

										Market.find({ pincode: { $in: [bid.pincode] }, marketLevel: 'zone level' }, { fields: ['name'] }).then(function (zone) {

											//	console.log(zone[0], 'all=====')
											bid.zone = zone.length > 0 ? zone[0].name : '-';
											// only FO role
											if (roleIdOfFo != "") {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfFo
												roleQuery.markets = { $in: [String(bid.market)] }
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {
													// console.log(adminsWithRoles, 'adminsWithRoles===')
													if (adminsWithRoles.length > 0) {
														bid.FO = adminsWithRoles[0].fullName

														//callback()
													} else if (bid.pincode) {

														var pincodes = [bid.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid.FO = adminsWithRolesNew[0].fullName
																		}
																		//callback()
																	})
																}
															})

														}

													}
												})

											}
											// only tsm role
											if (roleIdOfTSM != "") {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfTSM
												roleQuery.markets = { $in: [String(bid.market)] }
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {
													// console.log(adminsWithRoles, 'adminsWithRoles===')
													if (adminsWithRoles.length > 0) {
														bid.TSM = adminsWithRoles[0].fullName

														//callback()
													} else if (bid.pincode) {
														var pincodes = [bid.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid.TSM = adminsWithRolesNew[0].fullName
																		}
																		//callback()
																	})
																}
															})

														}
													}

												})
											}
											//only for ops
											if (roleIdOfOPS != "") {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfOPS
												roleQuery.markets = { $in: [String(bid.market)] }
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {

													if (adminsWithRoles.length > 0) {
														bid['Ops Head'] = adminsWithRoles[0].fullName

														//callback()
													} else if (bid.pincode) {

														var pincodes = [bid.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid['Ops Head'] = adminsWithRolesNew[0].fullName
																		}
																		//callback()
																	})
																}
															})

														}

													}
												})
											}
											callback();
										})

										//}
									}, function (error) {
										//console.log(results, '===')
										sendEmailToDailyReports(results, 'Bid placed');
										// return res.jsonx({
										// 	success: true,
										// 	data: results
										// });
									})
								} else {
									sendEmailToDailyReports(results, 'Bid placed');
									// return res.jsonx({
									// 	success: true,
									// 	data: results
									// });
								}

							})

						})

					})


				}
			})
		})
	},
	// daily transaction placed bid status Accepted, Dispatched and Delivered report email
	dailyTransactionReports: () => {
		var datetime = new Date();
		datetime.setDate(datetime.getDate() - 1);
		var date = datetime.toISOString().slice(0, 10);
		Bids.native(function (err, bids) {
			bids.aggregate([
				{
					$match: {
						$or: [{ status: 'Accepted' }, { status: 'Dispatched' }, { status: 'Delivered' }, { status: 'Received' }],
						$and: [{ productType: 'crop' }],
						$and: [{ createdAt: { $gte: new Date(date + "T00:00:01+05:30") } }, { createdAt: { $lte: new Date(date + "T23:59:59+05:30") } }]
					}
				},
				{
					$lookup: {
						from: "crops",
						localField: "crop",
						foreignField: "_id",
						as: "crops"
					}
				},
				{ $unwind: "$crops" },
				{
					$lookup: {
						from: "category",
						localField: "crops.category",
						foreignField: "_id",
						as: "category"
					}
				},
				{ $unwind: "$category" },

				{
					$lookup: {
						from: "market",
						localField: "crops.market",
						foreignField: "_id",
						as: "market"
					}
				},
				{ $unwind: "$market" },

				{
					$lookup: {
						from: "users",
						localField: "market.GM",
						foreignField: "_id",
						as: "franchisee"
					}
				},
				{ $unwind: "$franchisee" },
				{
					$lookup: {
						from: "users",
						localField: "user",
						foreignField: "_id",
						as: "buyer"
					}
				},
				{ $unwind: "$buyer" },
				{
					$project: {
						_id: 0,
						Date: "$createdAt",
						BidId: "$code",
						//category: "$category._id",
						CategoryName: "$category.name",
						market: "$market._id",
						MarketName: "$market.name",
						//franchisee: "$franchisee._id",
						FranchiseeName: "$franchisee.fullName",
						City: "$franchisee.city",
						District: "$franchisee.district",
						State: "$franchisee.state",
						CropId: "$crops.code",
						CropName: "$crops.name",
						pincode: "$crops.pincode",
						buyerName: "$buyer.fullName",
						Qunatity: "$quantity",
						QunatityUnit: "$quantityUnit",
						GMV: "$amount",
						Margin: "$facilitationCharges",
						FacilitationPercent: "$facilitationPercent",
						Status: "$status"
					}
				}

			], function (err, results) {
				if (err) {
					return err;
				}
				else {
					//let roleIds = {};
					Roles.findOne({ name: "FO" }).then(function (rolefo) {
						let roleIdOfFo = rolefo ? rolefo.id : '';
						Roles.findOne({ name: "TSM" }).then(function (roletsm) {
							let roleIdOfTSM = roletsm ? roletsm.id : '';
							Roles.findOne({ name: "Ops Head" }).then(function (roleops) {
								let roleIdOfOPS = roleops ? roleops.id : '';
								if (roleIdOfFo != "" || roleIdOfTSM != "" || roleIdOfOPS != "") {
									async.each(results, function (bid, callback) {
										//for (role in roleIds) {
										//bid.role = "-";
										bid.zone = "-";

										// console.log(roleQuery, 'adminsWithRoles===');

										Market.find({ pincode: { $in: [bid.pincode] }, marketLevel: 'zone level' }, { fields: ['name'] }).then(function (zone) {
											//	console.log(zone[0], 'all=====')
											bid.zone = zone.length > 0 ? zone[0].name : '-';
											// only FO role
											if (roleIdOfFo) {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfFo
												roleQuery.markets = { $in: [String(bid.market)] }
												delete bid.market;
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {
													// console.log(adminsWithRoles, 'adminsWithRoles===')
													if (adminsWithRoles.length > 0) {
														bid.FO = adminsWithRoles[0].fullName

														//callback()
													} else if (bid.pincode) {

														var pincodes = [bid.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid.FO = adminsWithRolesNew[0].fullName
																		}
																		//callback()
																	})
																}
															})

														}

													}
												})

											}
											// only tsm role
											if (roleIdOfTSM) {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfTSM
												roleQuery.markets = { $in: [String(bid.market)] }
												delete bid.market;
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {
													// console.log(adminsWithRoles, 'adminsWithRoles===')
													if (adminsWithRoles.length > 0) {
														bid.TSM = adminsWithRoles[0].fullName

														//callback()
													} else if (bid.pincode) {

														var pincodes = [bid.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid.TSM = adminsWithRolesNew[0].fullName
																		}
																		//callback()
																	})
																}
															})

														}

													}
												})
											}
											//only for ops
											if (roleIdOfOPS) {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfOPS
												roleQuery.markets = { $in: [String(bid.market)] }
												delete bid.market;
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {

													if (adminsWithRoles.length > 0) {
														bid['Ops Head'] = adminsWithRoles[0].fullName

														//callback()
													} else if (bid.pincode) {

														var pincodes = [bid.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid['Ops Head'] = adminsWithRolesNew[0].fullName
																		}
																		//callback()
																	})
																}
															})

														}

													}
												})
											}
											callback();

										})

										//}
									}, function (error) {

										sendEmailToDailyReports(results, 'Daily Transaction');

										// return res.jsonx({
										// 	success: true,
										// 	data: results
										// });
									})
								} else {

									sendEmailToDailyReports(results, 'Daily Transaction');



									// return res.jsonx({
									// 	success: true,
									// 	data: results
									// });
								}

							})

						})

					})

				}
			})
		})
	},
	dailyRegisteredUsers: () => {
		var datetime = new Date();
		datetime.setDate(datetime.getDate() - 1);
		var date = datetime.toISOString().slice(0, 10);
		Users.native(function (err, users) {
			users.aggregate([
				{
					$match: {
						$or: [{ roles: 'U' }, { roles: 'CP' }, { roles: 'FGM' }],
						$and: [{ createdAt: { $gte: new Date(date + "T00:00:01+05:30") } }, { createdAt: { $lte: new Date(date + "T23:59:59+05:30") } }]
					}
				},
				{
					$project: {
						_id: 0,
						Name: "$fullName",
						MobileNo: "$mobile",
						EmailId: "$email",
						City: "$city",
						State: "$state",
						District: "$district",
						pincode: "$pincode",
						Role: "$roles",
						userType: "$userType",
						Date: "$createdAt",
						market: "$markets"
					}
				}

			], function (err, results) {
				if (err) {
					return err;
				}
				else {
					//console.log(results, '===');
					Roles.findOne({ name: "FO" }).then(function (rolefo) {
						let roleIdOfFo = rolefo ? rolefo.id : '';
						Roles.findOne({ name: "TSM" }).then(function (roletsm) {
							let roleIdOfTSM = roletsm ? roletsm.id : '';
							Roles.findOne({ name: "Ops Head" }).then(function (roleops) {
								let roleIdOfOPS = roleops ? roleops.id : '';
								if (roleIdOfFo != "" || roleIdOfTSM != "" || roleIdOfOPS != "") {
									async.each(results, function (bid, callback) {
										//for (role in roleIds) {
										bid.zone = "-";
										// console.log(roleQuery, 'adminsWithRoles===');
										if (bid.Role == "U") {
											bid.userType = bid.userType;
										} else {
											bid.userType = bid.Role;
										}
										delete bid.Role;



										Market.find({ pincode: { $in: [bid.pincode] }, marketLevel: 'zone level' }, { fields: ['name'] }).then(function (zone) {
											//	console.log(zone[0], 'all=====')
											bid.zone = zone.length > 0 ? zone[0].name : '-';
											// only FO role
											if (roleIdOfFo) {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfFo
												roleQuery.markets = { $in: bid.market }
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {
													// console.log(adminsWithRoles, 'adminsWithRoles===')
													if (adminsWithRoles.length > 0) {
														bid.FO = adminsWithRoles[0].fullName

														// callback()
													} else if (bid.pincode) {

														var pincodes = [bid.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid.FO = adminsWithRolesNew[0].fullName
																		}
																		// callback()
																	})
																}
															})

														}
													}
												})

											}
											// only tsm role
											if (roleIdOfTSM) {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfTSM
												roleQuery.markets = { $in: bid.market }
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {
													// console.log(adminsWithRoles, 'adminsWithRoles===')
													if (adminsWithRoles.length > 0) {
														bid.TSM = adminsWithRoles[0].fullName

														// callback()
													} else if (bid.pincode) {

														var pincodes = [bid.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid.TSM = adminsWithRolesNew[0].fullName
																		}
																		// callback()
																	})
																}
															})

														}

													}
												})
											}
											//only for ops
											if (roleIdOfOPS) {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfOPS
												roleQuery.markets = { $in: bid.market }
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {

													if (adminsWithRoles.length > 0) {
														bid['OPS'] = adminsWithRoles[0].fullName

														// callback()
													} else if (bid.pincode) {

														var pincodes = [bid.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid['OPS'] = adminsWithRolesNew[0].fullName
																		}
																		// callback()
																	})
																}
															})

														}

													}
												})
											}
											callback();

										})

										//}
									}, function (error) {
										sendEmailToDailyReports(results, 'User uploaded');
										// return res.jsonx({
										// 	success: true,
										// 	data: results
										// });
									})
								} else {
									sendEmailToDailyReports(results, 'User uploaded');

									// return res.jsonx({
									// 	success: true,
									// 	data: results
									// });
								}

							})

						})

					})

				}
			})
		})
	},
	//daily crop transaction report
	dailyUploadedCropDetails: (data, cb) => {
		var datetime = new Date();
		datetime.setDate(datetime.getDate() - 1);
		var date = datetime.toISOString().slice(0, 10);
		var fileName = "crop_info.xlsx";
		console.log(datetime);
		var json2xls = require('json2xls');
		var fs = require('fs');
		day = datetime.getDate();
		month = datetime.getMonth() + 1;
		year = datetime.getFullYear();
		if (day < 10) {
			day = '0' + day;
		}
		if (month < 10) {
			month = '0' + month;
		}
		finaldate = day + "-" + month + "-" + year;
		//=====
		Crops.native(function (err, crops) {
			crops.aggregate([
				{
					$lookup: {
						from: "category",
						localField: "category",
						foreignField: "_id",
						as: "cat"
					}
				},
				{ $unwind: "$cat" },

				// {
				// 	$lookup: {
				// 		from: "category",
				// 		localField: "category.parentId",
				// 		foreignField: "_id",
				// 		as: "parentCategory"
				// 	}
				// },
				// { $unwind: "$parentCategory" },

				{
					$lookup: {
						from: "users",
						localField: "seller",
						foreignField: "_id",
						as: "user"
					}
				},
				{ $unwind: "$user" },
				{
					$project: {

						CropName: "$name",
						CropId: "$code",
						Category: "$cat.name",
						Verity: "$variety",
						City: "$city",
						State: "$state",
						Pincode: "$pincode",
						Qty: "$quantity",
						Mobile: "$user.mobile",
						Name: "$user.fullName",
						Price: "$price",
						market: "$market",
						Value: {
							$multiply: ["$price", "$quantity"]
						},
						createdAt: "$createdAt"

					}
				},
				{
					$match: {
						$and: [{ createdAt: { $gte: new Date(date + "T00:00:01+05:30") } }, { createdAt: { $lte: new Date(date + "T23:59:59+05:30") } }]
					}
				},
				{
					$sort: {
						"Category": 1
					}
				},
				{
					$group: {
						_id: {
							_id: "$_id",
						},
						data: {
							$push: {
								CropName: "$CropName",
								CropId: "$CropId",
								Category: "$Category",
								Variety: "$Verity",
								City: "$City",
								State: "$State",
								pincode: "$Pincode",
								Qty: "$Qty",
								Mobile: "$Mobile",
								Name: "$Name",
								Price: "$Price",
								Value: "$Value",
								market: "$market"
							}
						},

					}
				},
				{
					$unwind: "$data"
				},
				{
					$group: {
						_id: null,
						totalPrice: { $sum: "$data.Value" },
						totalCrop: { $sum: 1 },
						cropsinfo: { $push: "$data" }
					}
				},

				{ $unwind: "$cropsinfo" },

			], function (err, results) {
				if (err) {
					console.log(err);
				}
				else {
					var cropresult = results;

					var results = results.map(function (obj) {
						return { CropName: obj.cropsinfo.CropName, CropId: obj.cropsinfo.CropId, Category: obj.cropsinfo.Category, Variety: obj.cropsinfo.Verity, City: obj.cropsinfo.City, State: obj.cropsinfo.State, pincode: obj.cropsinfo.Pincode, SellerMobile: obj.cropsinfo.Mobile, Seller: obj.cropsinfo.Name, Qty: obj.cropsinfo.Qty, Price: obj.cropsinfo.Price, Value: obj.cropsinfo.Value, CropId: obj.cropsinfo.CropId, market: obj.cropsinfo.market };
					});


					//console.log(results, '===');
					Roles.findOne({ name: "FO" }).then(function (rolefo) {
						let roleIdOfFo = rolefo ? rolefo.id : '';
						Roles.findOne({ name: "TSM" }).then(function (roletsm) {
							let roleIdOfTSM = roletsm ? roletsm.id : '';
							Roles.findOne({ name: "Ops Head" }).then(function (roleops) {
								let roleIdOfOPS = roleops ? roleops.id : '';
								if (roleIdOfFo != "" || roleIdOfTSM != "" || roleIdOfOPS != "") {
									async.each(results, function (bid, callback) {
										//for (role in roleIds) {
										bid.zone = "-";


										Market.find({ pincode: { $in: [bid.pincode] }, marketLevel: 'zone level' }, { fields: ['name'] }).then(function (zone) {
											//	console.log(zone[0], 'all=====')
											bid.zone = zone.length > 0 ? zone[0].name : '-';
											// only FO role
											if (roleIdOfFo) {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfFo
												roleQuery.markets = { $in: [String(bid.market)] }
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {
													// console.log(adminsWithRoles, 'adminsWithRoles===')
													if (adminsWithRoles.length > 0) {
														bid.FO = adminsWithRoles[0].fullName

														// callback()
													} else if (bid.pincode) {

														var pincodes = [bid.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid.cropsinfo.FO = adminsWithRolesNew[0].fullName
																		}
																		// callback()
																	})
																}
															})

														}
													}
												})

											}
											// only tsm role
											if (roleIdOfTSM) {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfTSM
												roleQuery.markets = { $in: [String(bid.market)] }
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {
													// console.log(adminsWithRoles, 'adminsWithRoles===')
													if (adminsWithRoles.length > 0) {
														bid.TSM = adminsWithRoles[0].fullName

														// callback()
													} else if (bid.pincode) {

														var pincodes = [bid.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid.TSM = adminsWithRolesNew[0].fullName
																		}
																		// callback()
																	})
																}
															})

														}

													}
												})
											}
											//only for ops
											if (roleIdOfOPS) {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfOPS
												roleQuery.markets = { $in: [String(bid.market)] }
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {

													if (adminsWithRoles.length > 0) {
														bid['OPS'] = adminsWithRoles[0].fullName

														// callback()
													} else if (bid.pincode) {

														var pincodes = [bid.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid['OPS'] = adminsWithRolesNew[0].fullName
																		}
																		// callback()
																	})
																}
															})

														}

													}
												})
											}
											callback();

										})

										//}
									}, function (error) {
										var json = results;
										var xls = json2xls(json);
										fs.writeFileSync('./csvs/' + fileName, xls, 'binary');
										//message = "Hi Team,";
										var message = '<br/><br/>';
										message += 'This mail is in regard to keep you informed about the total number of crops that have been uploaded on the FarmX panel.';
										message += '<br/><br/>';
										message += 'For <strong> ' + finaldate + ', <br>Total Number of Uploaded Crops: ' + cropresult[0].totalCrop + ' </strong>';
										message += '<br> <strong> Total Value: ' + cropresult[0].totalPrice.toLocaleString('en-IN', {
											maximumFractionDigits: 2,
											style: 'currency',
											currency: 'INR'
										}) + '</strong>';
										message += '<br/><br/><br/>';
										message += 'Thanks';
										message += '<br> <strong> Team FarmX </strong>';
										var query = {};
										query.select = ['firstName', 'email'];
										query.or = [{ roles: "A" }, { roles: "SA" }]
										Users.find(query).exec((err, users) => {
											console.log(users);
											users.forEach(function (userlist) {
												let messageToSend = "Hi " + userlist.firstName + ", " + message
												let emailMessage = {
													from: sails.config.appSMTP.auth.user,
													to: userlist.email,
													//to: 'arun.dixit@efarmexchange.com',
													subject: 'FarmX: Crops Uploded - ' + finaldate,
													html: messageToSend,
													attachments: [{
														path: './csvs/' + fileName
													}]
												};

												transport.sendMail(emailMessage, function (err, info) {
													if (err) {
														return;
													} else {
														console.log('mail sent successfully');
													}

												});
											})

										})
										//sendEmailToDailyReports(results, 'User uploaded');
										// return res.jsonx({
										// 	success: true,
										// 	data: results
										// });
									})
								} else {
									//sendEmailToDailyReports(results, 'User uploaded');
									var json = results;
									var xls = json2xls(json);
									fs.writeFileSync('./csvs/' + fileName, xls, 'binary');
									//message = "Hi Team,";
									var message = '<br/><br/>';
									message += 'This mail is in regard to keep you informed about the total number of crops that have been uploaded on the FarmX panel.';
									message += '<br/><br/>';
									message += 'For <strong> ' + finaldate + ', <br>Total Number of Uploaded Crops: ' + cropresult[0].totalCrop + ' </strong>';
									message += '<br> <strong> Total Value: ' + cropresult[0].totalPrice.toLocaleString('en-IN', {
										maximumFractionDigits: 2,
										style: 'currency',
										currency: 'INR'
									}) + '</strong>';
									message += '<br/><br/><br/>';
									message += 'Thanks';
									message += '<br> <strong> Team FarmX </strong>';
									var query = {};
									query.select = ['firstName', 'email'];
									query.or = [{ roles: "A" }, { roles: "SA" }]
									Users.find(query).exec((err, users) => {
										console.log(users);
										users.forEach(function (userlist) {
											let messageToSend = "Hi " + userlist.firstName + ", " + message
											let emailMessage = {
												from: sails.config.appSMTP.auth.user,
												to: userlist.email,
												//to: 'arun.dixit@efarmexchange.com',
												subject: 'FarmX: Crops Uploded - ' + finaldate,
												html: messageToSend,
												attachments: [{
													path: './csvs/' + fileName
												}]
											};

											transport.sendMail(emailMessage, function (err, info) {
												if (err) {
													return;
												} else {
													console.log('mail sent successfully');
												}

											});
										})

									})
									// return res.jsonx({
									// 	success: true,
									// 	data: results
									// });
								}

							})

						})

					})

				}
			});


		})
		//=====
	},

	// daily basis crop information send to admin users
	sendEmailToAdminUsersUploadedCropDetails: (data, cb) => {
		var datetime = new Date();
		datetime.setDate(datetime.getDate() - 1);
		var date = datetime.toISOString().slice(0, 10);
		var fileName = "crop_info.xlsx";
		console.log(datetime);
		var json2xls = require('json2xls');
		var fs = require('fs');
		day = datetime.getDate();
		month = datetime.getMonth() + 1;
		year = datetime.getFullYear();
		if (day < 10) {
			day = '0' + day;
		}
		if (month < 10) {
			month = '0' + month;
		}
		finaldate = day + "-" + month + "-" + year;
		//=====
		Crops.native(function (err, crops) {
			crops.aggregate([
				{
					$lookup: {
						from: "category",
						localField: "category",
						foreignField: "_id",
						as: "cat"
					}
				},
				{ $unwind: "$cat" },

				{
					$lookup: {
						from: "category",
						localField: "category.parentId",
						foreignField: "_id",
						as: "parentCategory"
					}
				},
				{ $unwind: "$parentCategory" },

				{
					$lookup: {
						from: "users",
						localField: "seller",
						foreignField: "_id",
						as: "user"
					}
				},
				{ $unwind: "$user" },
				{
					$project: {

						CropName: "$name",
						parentCategory: "$parentCategory.name",
						Category: "$cat.name",
						Verity: "$variety",
						City: "$city",
						State: "$state",
						Pincode: "$pincode",
						Qty: "$quantity",
						Mobile: "$user.mobile",
						Name: "$user.fullName",
						Price: "$price",
						Value: {
							$multiply: ["$price", "$quantity"]
						},
						createdAt: "$createdAt"

					}
				},
				{
					$match: {
						$and: [{ createdAt: { $gte: new Date(date + "T00:00:01+05:30") } }, { createdAt: { $lte: new Date(date + "T23:59:59+05:30") } }]
					}
				},
				{
					$sort: {
						"Category": 1
					}
				},
				{
					$group: {
						_id: {
							_id: "$_id",
						},
						data: {
							$push: {
								CropName: "$CropName",
								parentCategory: "$parentCategory", Category: "$Category",
								Verity: "$Verity",
								City: "$City",
								State: "$State",
								Pincode: "$Pincode",
								Qty: "$Qty",
								Mobile: "$Mobile",
								Name: "$Name",
								Price: "$Price",
								Value: "$Value",
							}
						},

					}
				},
				{
					$unwind: "$data"
				},
				{
					$group: {
						_id: null,
						totalPrice: { $sum: "$data.Value" },
						totalCrop: { $sum: 1 },
						cropsinfo: { $push: "$data" }
					}
				},

				{ $unwind: "$cropsinfo" },

			], function (err, results) {
				if (err) {
					console.log(err);
				}
				var cropresult = results;
				if (cropresult != undefined && cropresult != null && cropresult.length > 0) {
					var results = results.map(function (obj) {
						return { CropName: obj.cropsinfo.CropName, SuperCategory: obj.cropsinfo.parentCategory, Category: obj.cropsinfo.Category, Variety: obj.cropsinfo.Verity, City: obj.cropsinfo.City, State: obj.cropsinfo.State, Pincode: obj.cropsinfo.Pincode, SellerMobile: obj.cropsinfo.Mobile, Seller: obj.cropsinfo.Name, Qty: obj.cropsinfo.Qty, Price: obj.cropsinfo.Price, Value: obj.cropsinfo.Value };
					});

					var json = results;
					var xls = json2xls(json);
					fs.writeFileSync('./csvs/' + fileName, xls, 'binary');
					//message = "Hi Team,";
					var message = '<br/><br/>';
					message += 'This mail is in regard to keep you informed about the total number of crops that have been uploaded on the FarmX panel.';
					message += '<br/><br/>';
					message += 'For <strong> ' + finaldate + ', <br>Total Number of Uploaded Crops: ' + cropresult[0].totalCrop + ' </strong>';
					message += '<br> <strong> Total Value: ' + cropresult[0].totalPrice.toLocaleString('en-IN', {
						maximumFractionDigits: 2,
						style: 'currency',
						currency: 'INR'
					}) + '</strong>';
					message += '<br/><br/><br/>';
					message += 'Thanks';
					message += '<br> <strong> Team FarmX </strong>';
					var query = {};
					query.select = ['firstName', 'email'];
					query.or = [{ roles: "A" }, { roles: "SA" }]
					Users.find(query).exec((err, users) => {
						console.log(users);
						users.forEach(function (userlist) {
							let messageToSend = "Hi " + userlist.firstName + ", " + message
							let emailMessage = {
								from: sails.config.appSMTP.auth.user,
								to: userlist.email,
								//to: 'arun.dixit@efarmexchange.com',
								subject: 'FarmX: Crops Uploded - ' + finaldate,
								html: messageToSend,
								attachments: [{
									path: './csvs/' + fileName
								}]
							};

							transport.sendMail(emailMessage, function (err, info) {
								if (err) {
									return;
								} else {
									console.log('mail sent successfully');
								}

							});
						})

					})
				}
			});


		})
		//=====
	},

	// daily basis crop information send to admin users
	farmersCropDealing: (data, context) => {
		var fileName = "crop_12__info.xlsx";
		var json2xls = require('json2xls');
		var fs = require('fs');
		console.log("fileName == ", fileName)
		//=====
		Crops.native(function (err, crops) {
			crops.aggregate([
				{
					$lookup: {
						from: "category",
						localField: "category",
						foreignField: "_id",
						as: "cat"
					}
				},
				{
					$unwind: {
						path: "$cat",
						preserveNullAndEmptyArrays: true

					}
				},
				{
					$lookup: {
						from: "users",
						localField: "seller",
						foreignField: "_id",
						as: "user"
					}
				},
				{
					$unwind: {
						path: "$user",
						preserveNullAndEmptyArrays: true

					}
				},
				{
					$lookup: {
						from: "market",
						localField: "market",
						foreignField: "_id",
						as: "market"
					}
				},
				{
					$unwind: {
						path: "$market",
						preserveNullAndEmptyArrays: true

					}
				},
				{
					$lookup: {
						from: "users",
						localField: "market.GM",
						foreignField: "_id",
						as: "franchiseeuser"
					}
				},
				{
					$unwind: {
						path: "$franchiseeuser",
						preserveNullAndEmptyArrays: true

					}
				},
				{
					$project: {
						FarmerCode: "$user.code",
						Farmeridentifier: "$user.userUniqueId",
						FarmerName: "$user.fullName",
						Mobile: "$user.mobile",
						Product: "$cat.name",
						Verity: "$variety",
						City: "$city",
						State: "$state",
						Pincode: "$pincode",
						FranchiseeCode: "$franchiseeuser.code",
						Franchiseeidentifier: "$franchiseeuser.userUniqueId",
						FranchiseeName: "$franchiseeuser.fullName",
					}
				},
				{
					$sort: {
						"FarmerCode": 1
					}
				}

			], function (err, results) {
				console.log("results == ", results.length)
				if (err) {
					console.log(err);
					return {
						success: false,
						code: 400,
						data: err
					};
				}
				var cropresult = results;
				if (cropresult != undefined && cropresult != null && cropresult.length > 0) {
					var results = results.map(function (obj) {
						return { FarmerCode: obj.FarmerCode, Farmeridentifier: obj.Farmeridentifier, FarmerName: obj.FarmerName, Mobile: obj.Mobile, Product: obj.Product, Verity: obj.Verity, City: obj.City, State: obj.State, Pincode: obj.Pincode, FranchiseeCode: obj.FranchiseeCode, Franchiseeidentifier: obj.Franchiseeidentifier, FranchiseeName: obj.FranchiseeName };
					});

					var json = results;

					var xls = json2xls(json);

					fs.writeFileSync('./csvs/' + fileName, xls, 'binary');
					//message = "Hi Team,";
					return {
						success: true,
						code: 200,
						data: results
					};
				} else {

					return {
						success: true,
						code: 201,
						data: results
					};
				}
			});
		})
		//=====
	},

	//update user in facilitation charges
	updateUserInFacilitationCharges: function (data, cb) {
		let qry = {}
		let now = new Date()
		qry.$and = [{ userGivenInfo: { $ne: undefined } }, { userGivenInfo: { $ne: null } }, { $or: [{ user: null }, { user: undefined }] }, { $or: [{ market: undefined }, { market: null }] }, { $or: [{ validTill: { $gte: now } }, { validTill: null }, { validTill: undefined }] }]

		FacilitationCharges.find(qry).then(function (fcs) {
			async.each(fcs, function (fc, callback) {
				let findusrqry = {}
				findusrqry.$and = [{ $or: [{ email: fc.userGivenInfo }, { mobile: fc.userGivenInfo }] }, { $or: [{ 'roles': 'U' }, { 'roles': 'CP' }] }];
				Users.findOne(findusrqry).then(function (usr) {
					if (usr) {
						FacilitationCharges.update({ id: fc.id }, { user: usr.id }).then(function () {
							callback();
						});
					} else {
						callback();
					}
				})
			}, function (error) {
				if (error) {
					return cb(error);
				} else {
					return cb();
				}
			});
		});
	},

	//send sms for crop suggestions to Users
	sendRequirementSMStoBuyers: function (data, cb) {
		let qry = {}
		let now = new Date()
		qry.status = 'Suggested'
		qry.requiredOn = { $gte: now }
		qry.subscribe = true

		return cb();


		// BuyerRequirement.find(qry).populate('user', { select: ['fullName', 'mobile'] }).populate('category', { select: ['name'] }).then(function (requirements) {
		// 	async.each(requirements, function (fc, callback) {
		// 		let findCropQry = {}
		// 		findCropQry.category = fc.category.id
		// 		findCropQry.isApproved = true
		// 		findCropQry.isDeleted = false
		// 		findCropQry.isExpired = false
		// 		findCropQry.leftAfterAcceptanceQuantity = { $gte: fc.quantity }

		// 		if (fc.variety) {
		// 			findCropQry.variety = fc.variety
		// 		}

		// 		return Crops.find(findCropQry, { fields: ['name', 'code'] }).then(function (suugestedcrops) {
		// 			if (suugestedcrops && suugestedcrops.length > 0) {
		// 				let buyersmsInfo = {}

		// 				if (fc.user) {
		// 					buyersmsInfo.numbers = [fc.user.mobile]
		// 				} else if (fc.mobile) {
		// 					buyersmsInfo.numbers = [fc.mobile]
		// 				}

		// 				if (buyersmsInfo.numbers) {
		// 					buyersmsInfo.variables = { "{#CC#}": fc.category.name, "{#DD#}": commonService.longDateFormat((new Date(fc.createdAt))) }
		// 					buyersmsInfo.templateId = "33296"
		// 					commonService.sendGeneralSMS(buyersmsInfo)
		// 				}
		// 				callback()

		// 			} else {
		// 				callback()
		// 			}
		// 		}).fail(function (err) {
		// 			callback(err)
		// 		})
		// 	}, function (error) {
		// 		if (error) {
		// 			return cb(error);
		// 		} else {
		// 			return cb();
		// 		}
		// 	});
		// })
	},

	/*checkRefundStatus : function(data, cb) {
		var request = require('request-promise');
		
		var findTransactionQry = {}
		findTransactionQry.paymentType = "PayTm"
		findTransactionQry.$and = [{"processStatus":{$ne:'completed'}},{"processStatus":{$ne:'TXN_SUCCESS'}}]
		findTransactionQry.payTmRefundId = {$exists:true}
		
		return Transactions.find(findTransactionQry).then(function(transactions) {
			let merchantKey = constantObj.payu.KEY;
		
			async.each(transactions, function(transaction, callback) {
		
				let paymentId = transaction.transactionId;
				var refundApiPayuUrl = constantObj.payu.Refund_Status_TXNID + "?paymentId=" + paymentId + "&merchantKey=" + merchantKey;
				
				if (transaction.payURefundId) {
					refundApiPayuUrl = constantObj.payu.Refund_Status_RFNDID + "?refundId=" + transaction.payURefundId + "&merchantKey=" + merchantKey;
				}
		
				var options = {
					url: refundApiPayuUrl,
					method: 'GET',
					headers: {
						"Authorization": constantObj.payu.Authorization
					}
				};
			    
				function reqcallback(error, response, body) {
		
					if (!error && body != undefined) {
						var info = JSON.parse(body);
						if (transaction.payURefundId) {
							if (info.status == 0 && info.result["Refund Status"]) {
								var transactionData = {};
								transactionData.status = 'RF';
								transactionData.transactionType = 'DebitEscrow';
								transactionData.processStatus = info.RESPMSG;
								transactionData.payTmRefundId = info.REFUNDID;
								transactionData.refundjson = info;                   
		
								Transactions.update({id:transaction.id},transactionData).then(function(paymentData) {
									callback()
								}).fail(function(err) {
									callback()
								});
							} else {
								callback()
							}                			
						} else {
							
							if (info.status == 0 && info.result) {
								let transactionInfos = JSON.parse(info.result["Refund Details Map"])
								// callback()
								if (transactionInfos && transactionInfos.length > 0) {
									console.log("transactionInfo == ", transactionInfo)
									let transactionInfo = transactionInfos[0]
									var transactionData = {};
									transactionData.status = 'RF';
									transactionData.transactionType = 'DebitEscrow';
									transactionData.processStatus = transactionInfo["Refund Status"]
		
									Transactions.update({id:transaction.id},transactionData).then(function(paymentData) {
										callback()
									}).fail(function(err) {
										callback()
									});
		
								} else {
									callback()
								}
							} else {
								callback()
							}
						}
					} else {
						callback()
					}
				}
			    
				request(options, reqcallback);
		
			}, function(error) {
				if (error) {
					return cb(error);
				} else {
					return cb();
				}
			})
		})
	}*/
	readOrderEmail: function (data, cb) {
		let im = imap.connect();
		//console.log('readorderemail')
		console.log(im, 'arun imp======');
		setTimeout(() => {
			return cb;
		}, 30000)


	},

	deleteEmptyOrder: function (data, cb) {
		let deleteIds = []
		Orders.find({})
			.populate("orderedCarts").then(function (ordersData) {
				for (let i = 0; i < ordersData.length; i++) {
					if (ordersData[i].orderedCarts.length > 0) {

					} else {
						deleteIds.push(ordersData[i].id);
					}
				}
				Orders.destroy({ id: deleteIds }).then(function (deleteData) {

				})
				//console.log(deleteIds, 'deleteids====')
				return cb;
			})
	},
	sendEmailToOrder: function (data, cb) {
		sendEmailAfterTwoHour()
		return cb
	},
	TransactionReport: function (data, context, req, res) {

		var datetime = new Date();
		datetime.setDate(datetime.getDate() - 1);
		var date = datetime.toISOString().slice(0, 10);
		Bids.native(function (err, bids) {
			bids.aggregate([
				{
					$match: {
						$or: [{ status: 'Accepted' }, { status: 'Dispatched' }, { status: 'Delivered' }, { status: 'Received' }],
						$and: [{ productType: 'crop' }],
						//$and: [{ createdAt: { $gte: new Date(date + "T00:00:01+05:30") } }, { createdAt: { $lte: new Date(date + "T23:59:59+05:30") } }]
					}
				},
				{
					$lookup: {
						from: "crops",
						localField: "crop",
						foreignField: "_id",
						as: "crops"
					}
				},
				{ $unwind: "$crops" },
				{
					$lookup: {
						from: "category",
						localField: "crops.category",
						foreignField: "_id",
						as: "category"
					}
				},
				{ $unwind: "$category" },

				{
					$lookup: {
						from: "market",
						localField: "crops.market",
						foreignField: "_id",
						as: "market"
					}
				},
				{ $unwind: "$market" },

				{
					$lookup: {
						from: "users",
						localField: "market.GM",
						foreignField: "_id",
						as: "franchisee"
					}
				},
				{ $unwind: "$franchisee" },
				{
					$lookup: {
						from: "users",
						localField: "user",
						foreignField: "_id",
						as: "buyer"
					}
				},
				{ $unwind: "$buyer" },
				{
					$project: {
						_id: 0,
						Date: "$createdAt",
						BidId: "$code",
						//category: "$category._id",
						CategoryName: "$category.name",
						market: "$market._id",
						MarketName: "$market.name",
						//franchisee: "$franchisee._id",
						FranchiseeName: "$franchisee.fullName",
						City: "$franchisee.city",
						District: "$franchisee.district",
						State: "$franchisee.state",
						CropId: "$crops.code",
						Variety: "$crops.variety",
						CropName: "$crops.name",
						Price: "$crops.price",
						pincode: "$crops.pincode",
						createdAt: "$crops.createdAt",
						buyerName: "$buyer.fullName",
						buyerCity: "$buyer.city",
						buyerState: "$buyer.state",
						Qunatity: "$quantity",
						QunatityUnit: "$quantityUnit",
						GMV: "$amount",
						Margin: "$facilitationCharges",
						FacilitationPercent: "$facilitationPercent",
						Status: "$status"
					}
				}

			], function (err, results) {
				if (err) {
					return err;
				}
				else {
					//let roleIds = {};
					Roles.findOne({ name: "FO" }).then(function (rolefo) {
						let roleIdOfFo = rolefo ? rolefo.id : '';
						Roles.findOne({ name: "TSM" }).then(function (roletsm) {
							let roleIdOfTSM = roletsm ? roletsm.id : '';
							Roles.findOne({ name: "Ops Head" }).then(function (roleops) {
								let roleIdOfOPS = roleops ? roleops.id : '';
								if (roleIdOfFo != "" || roleIdOfTSM != "" || roleIdOfOPS != "") {
									async.each(results, function (bid, callback) {
										//for (role in roleIds) {
										bid.role = "-";
										bid.zone = "-";

										// console.log(roleQuery, 'adminsWithRoles===');

										Market.find({ pincode: { $in: [bid.pincode] }, marketLevel: 'zone level' }, { fields: ['name'] }).then(function (zone) {
											//	console.log(zone[0], 'all=====')
											bid.zone = zone.length > 0 ? zone[0].name : '-';
											// only FO role
											if (roleIdOfFo) {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfFo
												roleQuery.markets = { $in: [String(bid.market)] }
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {
													// console.log(adminsWithRoles, 'adminsWithRoles===')
													if (adminsWithRoles.length > 0) {
														bid.FO = adminsWithRoles[0].fullName

														//callback()
													} else if (bid.pincode) {

														var pincodes = [bid.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid.FO = adminsWithRolesNew[0].fullName
																		}
																		//callback()
																	})
																}
															})

														}

													}
												})

											}
											// only tsm role
											if (roleIdOfTSM) {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfTSM
												roleQuery.markets = { $in: [String(bid.market)] }
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {
													// console.log(adminsWithRoles, 'adminsWithRoles===')
													if (adminsWithRoles.length > 0) {
														bid.TSM = adminsWithRoles[0].fullName

														//callback()
													} else if (bid.pincode) {

														var pincodes = [bid.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid.TSM = adminsWithRolesNew[0].fullName
																		}
																		//callback()
																	})
																}
															})

														}

													}
												})
											}
											//only for ops
											if (roleIdOfOPS) {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfOPS
												roleQuery.markets = { $in: [String(bid.market)] }
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {

													if (adminsWithRoles.length > 0) {
														bid['OPS'] = adminsWithRoles[0].fullName

														//callback()
													} else if (bid.pincode) {

														var pincodes = [bid.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid['OPS'] = adminsWithRolesNew[0].fullName
																		}
																		//callback()
																	})
																}
															})

														}

													}
												})
											}
											callback();

										})

										//}
									}, function (error) {
										return res.jsonx(
											{
												"success": true,
												data: results
											}
										)
										// return res.jsonx({
										// 	success: true,
										// 	data: results
										// });
									})
								} else {

									return res.jsonx(
										{
											"success": true,
											data: results
										}
									)



									// return res.jsonx({
									// 	success: true,
									// 	data: results
									// });
								}

							})

						})

					})

				}
			})
		})


	},
	BidTransactionReport: function (data, context, req, res) {

		var datetime = new Date();
		datetime.setDate(datetime.getDate() - 1);
		var date = datetime.toISOString().slice(0, 10);
		Bids.native(function (err, bids) {

			bids.aggregate([
				{
					$match: {
						$and: [{ productType: 'crop' }],
						//	$and: [{ createdAt: { $gte: new Date(date + "T00:00:01+05:30") } }, { createdAt: { $lte: new Date(date + "T23:59:59+05:30") } }]
					}
				},
				{
					$lookup: {
						from: "crops",
						localField: "crop",
						foreignField: "_id",
						as: "crops"
					}
				},
				{ $unwind: "$crops" },
				{
					$lookup: {
						from: "category",
						localField: "crops.category",
						foreignField: "_id",
						as: "category"
					}
				},
				{ $unwind: "$category" },

				{
					$lookup: {
						from: "market",
						localField: "crops.market",
						foreignField: "_id",
						as: "market"
					}
				},
				{ $unwind: "$market" },

				{
					$lookup: {
						from: "users",
						localField: "market.GM",
						foreignField: "_id",
						as: "franchisee"
					}
				},
				{ $unwind: "$franchisee" },
				{
					$lookup: {
						from: "users",
						localField: "user",
						foreignField: "_id",
						as: "buyer"
					}
				},
				{ $unwind: "$buyer" },
				{
					$project: {
						_id: 0,
						Date: "$createdAt",
						BidId: "$code",
						//category: "$category._id",
						CategoryName: "$category.name",
						market: "$market._id",
						MarketName: "$market.name",
						createdAt: "$createdAt",
						FranchiseeName: "$franchisee.fullName",
						City: "$franchisee.city",
						District: "$franchisee.district",
						State: "$franchisee.state",
						CropId: "$crops.code",
						CropName: "$crops.name",
						pincode: "$crops.pincode",
						buyerName: "$buyer.fullName",
						Qunatity: "$quantity",
						QunatityUnit: "$quantityUnit",
						GMV: "$amount",
						Margin: "$facilitationCharges",
						FacilitationPercent: "$facilitationPercent",
						Status: "$status"
					}
				}

			], function (err, results) {
				if (err) {
					return err;
				}
				else {
					//let roleIds = {};
					Roles.findOne({ name: "FO" }).then(function (rolefo) {
						let roleIdOfFo = rolefo ? rolefo.id : '';
						Roles.findOne({ name: "TSM" }).then(function (roletsm) {
							let roleIdOfTSM = roletsm ? roletsm.id : '';
							Roles.findOne({ name: "Ops Head" }).then(function (roleops) {
								let roleIdOfOPS = roleops ? roleops.id : '';
								if (roleIdOfFo != "" || roleIdOfTSM != "" || roleIdOfOPS != "") {
									async.each(results, function (bid, callback) {
										//for (role in roleIds) {
										bid.role = "-";
										bid.zone = "-";

										// console.log(roleQuery, 'adminsWithRoles===');

										Market.find({ pincode: { $in: [bid.pincode] }, marketLevel: 'zone level' }, { fields: ['name'] }).then(function (zone) {

											//	console.log(zone[0], 'all=====')
											bid.zone = zone.length > 0 ? zone[0].name : '-';
											// only FO role
											if (roleIdOfFo != "") {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfFo
												roleQuery.markets = { $in: [String(bid.market)] }
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {
													// console.log(adminsWithRoles, 'adminsWithRoles===')
													if (adminsWithRoles.length > 0) {
														bid.FO = adminsWithRoles[0].fullName

														//callback()
													} else if (bid.pincode) {

														var pincodes = [bid.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid.FO = adminsWithRolesNew[0].fullName
																		}
																		//callback()
																	})
																}
															})

														}

													}
												})

											}
											// only tsm role
											if (roleIdOfTSM != "") {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfTSM
												roleQuery.markets = { $in: [String(bid.market)] }
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {
													// console.log(adminsWithRoles, 'adminsWithRoles===')
													if (adminsWithRoles.length > 0) {
														bid.TSM = adminsWithRoles[0].fullName

														//callback()
													} else if (bid.pincode) {
														var pincodes = [bid.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid.TSM = adminsWithRolesNew[0].fullName
																		}
																		//callback()
																	})
																}
															})

														}
													}

												})
											}
											//only for ops
											if (roleIdOfOPS != "") {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfOPS
												roleQuery.markets = { $in: [String(bid.market)] }
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {

													if (adminsWithRoles.length > 0) {
														bid['OPS'] = adminsWithRoles[0].fullName

														//callback()
													} else if (bid.pincode) {

														var pincodes = [bid.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid['OPS'] = adminsWithRolesNew[0].fullName
																		}
																		//callback()
																	})
																}
															})

														}

													}
												})
											}
											callback();
										})

										//}
									}, function (error) {
										//console.log(results, '===')
										//sendEmailToDailyReports(results, 'Bid placed');
										return res.jsonx({
											success: true,
											data: results
										});
									})
								} else {
									//sendEmailToDailyReports(results, 'Bid placed');
									return res.jsonx({
										success: true,
										data: results
									});
								}

							})

						})

					})


				}
			})
		})
	},

	CropReport: function (data, context, req, res) {
		var datetime = new Date();
		datetime.setDate(datetime.getDate() - 1);
		var date = datetime.toISOString().slice(0, 10);
		var fileName = "crop_info.xlsx";
		console.log(datetime);
		var json2xls = require('json2xls');
		var fs = require('fs');
		day = datetime.getDate();
		month = datetime.getMonth() + 1;
		year = datetime.getFullYear();
		if (day < 10) {
			day = '0' + day;
		}
		if (month < 10) {
			month = '0' + month;
		}
		finaldate = day + "-" + month + "-" + year;
		//=====
		Crops.native(function (err, crops) {
			crops.aggregate([
				{
					$lookup: {
						from: "category",
						localField: "category",
						foreignField: "_id",
						as: "cat"
					}
				},
				{ $unwind: "$cat" },


				{
					$lookup: {
						from: "users",
						localField: "seller",
						foreignField: "_id",
						as: "user"
					}
				},
				{ $unwind: "$user" },
				{
					$project: {

						CropName: "$name",
						CropId: "$code",
						//parentCategory: "$parentCategory.name",
						Category: "$cat.name",
						Verity: "$variety",
						City: "$city",
						State: "$state",
						Pincode: "$pincode",
						Qty: "$quantity",
						Mobile: "$user.mobile",
						Name: "$user.fullName",
						Price: "$price",
						Value: {
							$multiply: ["$price", "$quantity"]
						},
						createdAt: "$createdAt"

					}
				},
				// {
				// 	$match: {
				// 			$and: [{ createdAt: { $gte: new Date(date + "T00:00:01+05:30") } }, { createdAt: { $lte: new Date(date + "T23:59:59+05:30") } }]
				// 	}
				// },
				{
					$sort: {
						"Category": 1
					}
				},
				{
					$group: {
						_id: {
							_id: "$_id",
						},
						data: {
							$push: {
								CropName: "$CropName",
								CropId: "$CropId",
								//parentCategory: "$parentCategory",
								Category: "$Category",
								Variety: "$Verity",
								City: "$City",
								State: "$State",
								pincode: "$Pincode",
								Qty: "$Qty",
								Mobile: "$Mobile",
								Name: "$Name",
								Price: "$Price",
								Value: "$Value",
								market: "$market",
								createdAt: "$createdAt"
							}
						},

					}
				},
				{
					$unwind: "$data"
				},
				{
					$group: {
						_id: null,
						totalPrice: { $sum: "$data.Value" },
						totalCrop: { $sum: 1 },
						cropsinfo: { $push: "$data" }
					}
				},

				{ $unwind: "$cropsinfo" },

			], function (err, results) {
				//console.log(results, 'all data====')
				if (err) {
					console.log(err);
				}
				else {
					//console.log(results, '===');
					Roles.findOne({ name: "FO" }).then(function (rolefo) {
						let roleIdOfFo = rolefo ? rolefo.id : '';
						Roles.findOne({ name: "TSM" }).then(function (roletsm) {
							let roleIdOfTSM = roletsm ? roletsm.id : '';
							Roles.findOne({ name: "Ops Head" }).then(function (roleops) {
								let roleIdOfOPS = roleops ? roleops.id : '';
								if (roleIdOfFo != "" || roleIdOfTSM != "" || roleIdOfOPS != "") {
									async.each(results, function (bid, callback) {
										//for (role in roleIds) {
										bid.cropsinfo.zone = "-";


										Market.find({ pincode: { $in: [bid.cropsinfo.pincode] }, marketLevel: 'zone level' }, { fields: ['name'] }).then(function (zone) {
											//	console.log(zone[0], 'all=====')
											bid.cropsinfo.zone = zone.length > 0 ? zone[0].name : '-';
											// only FO role
											if (roleIdOfFo) {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfFo
												roleQuery.markets = { $in: [String(bid.cropsinfo.market)] }
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {
													// console.log(adminsWithRoles, 'adminsWithRoles===')
													if (adminsWithRoles.length > 0) {
														bid.cropsinfo.FO = adminsWithRoles[0].fullName

														// callback()
													} else if (bid.cropsinfo.pincode) {

														var pincodes = [bid.cropsinfo.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid.cropsinfo.FO = adminsWithRolesNew[0].fullName
																		}
																		// callback()
																	})
																}
															})

														}
													}
												})

											}
											// only tsm role
											if (roleIdOfTSM) {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfTSM
												roleQuery.markets = { $in: [String(bid.cropsinfo.market)] }
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {
													// console.log(adminsWithRoles, 'adminsWithRoles===')
													if (adminsWithRoles.length > 0) {
														bid.cropsinfo.TSM = adminsWithRoles[0].fullName

														// callback()
													} else if (bid.cropsinfo.pincode) {

														var pincodes = [bid.cropsinfo.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid.cropsinfo.TSM = adminsWithRolesNew[0].fullName
																		}
																		// callback()
																	})
																}
															})

														}

													}
												})
											}
											//only for ops
											if (roleIdOfOPS) {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfOPS
												roleQuery.markets = { $in: [String(bid.cropsinfo.market)] }
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {

													if (adminsWithRoles.length > 0) {
														bid.cropsinfo['OPS'] = adminsWithRoles[0].fullName

														// callback()
													} else if (bid.cropsinfo.pincode) {

														var pincodes = [bid.cropsinfo.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid.cropsinfo['OPS'] = adminsWithRolesNew[0].fullName
																		}
																		// callback()
																	})
																}
															})

														}

													}
												})
											}
											callback();

										})

										//}
									}, function (error) {

										//sendEmailToDailyReports(results, 'User uploaded');
										return res.jsonx({
											success: true,
											data: results
										});
									})
								} else {

									return res.jsonx({
										success: true,
										data: results
									});
								}

							})

						})

					})

				}
			});


		})
		//=====
	},
	UserReport: function (data, context, req, res) {
		var datetime = new Date();
		datetime.setDate(datetime.getDate() - 1);
		var date = datetime.toISOString().slice(0, 10);
		Users.native(function (err, users) {
			users.aggregate([
				{
					$match: {
						$or: [{ roles: 'U' }, { roles: 'CP' }, { roles: 'FGM' }],
						//$and: [{ createdAt: { $gte: new Date(date + "T00:00:01+05:30") } }, { createdAt: { $lte: new Date(date + "T23:59:59+05:30") } }]
					}
				},
				{
					$project: {
						_id: 0,
						Name: "$fullName",
						MobileNo: "$mobile",
						EmailId: "$email",
						City: "$city",
						State: "$state",
						District: "$district",
						pincode: "$pincode",
						Role: "$roles",
						userType: "$userType",
						createdAt: "$createdAt"

					}
				}

			], function (err, results) {
				if (err) {
					return err;
				}
				else {
					//console.log(results, '===');
					Roles.findOne({ name: "FO" }).then(function (rolefo) {
						let roleIdOfFo = rolefo ? rolefo.id : '';
						Roles.findOne({ name: "TSM" }).then(function (roletsm) {
							let roleIdOfTSM = roletsm ? roletsm.id : '';
							Roles.findOne({ name: "Ops Head" }).then(function (roleops) {
								let roleIdOfOPS = roleops ? roleops.id : '';
								if (roleIdOfFo != "" || roleIdOfTSM != "" || roleIdOfOPS != "") {
									async.each(results, function (bid, callback) {
										//for (role in roleIds) {
										bid.zone = "-";
										// console.log(roleQuery, 'adminsWithRoles===');
										if (bid.Role == "U") {
											bid.userType = bid.userType;
										} else {
											bid.userType = bid.Role;
										}
										delete bid.Role;



										Market.find({ pincode: { $in: [bid.pincode] }, marketLevel: 'zone level' }, { fields: ['name'] }).then(function (zone) {
											//	console.log(zone[0], 'all=====')
											bid.zone = zone.length > 0 ? zone[0].name : '-';
											bid.market = zone.length > 0 ? zone[0].id : '';
											// only FO role
											if (roleIdOfFo) {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfFo
												roleQuery.markets = { $in: [String(bid.market)] }
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {
													// console.log(adminsWithRoles, 'adminsWithRoles===')
													if (adminsWithRoles.length > 0) {
														bid.FO = adminsWithRoles[0].fullName

														// callback()
													} else if (bid.pincode) {

														var pincodes = [bid.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid.FO = adminsWithRolesNew[0].fullName
																		}
																		// callback()
																	})
																}
															})

														}
													}
												})

											}
											// only tsm role
											if (roleIdOfTSM) {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfTSM;
												bid.market = zone.length > 0 ? zone[0].id : '';
												roleQuery.markets = { $in: [String(bid.market)] }
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {
													// console.log(adminsWithRoles, 'adminsWithRoles===')
													if (adminsWithRoles.length > 0) {
														bid.TSM = adminsWithRoles[0].fullName

														// callback()
													} else if (bid.pincode) {

														var pincodes = [bid.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid.TSM = adminsWithRolesNew[0].fullName
																		}
																		// callback()
																	})
																}
															})

														}

													}
												})
											}
											//only for ops
											if (roleIdOfOPS) {
												let roleQuery = {}
												roleQuery.roleId = roleIdOfOPS;
												bid.market = zone.length > 0 ? zone[0].id : '';
												roleQuery.markets = { $in: [String(bid.market)] }
												roleQuery.roles = "A"
												Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRoles) {

													if (adminsWithRoles.length > 0) {
														bid['Ops Head'] = adminsWithRoles[0].fullName

														// callback()
													} else if (bid.pincode) {

														var pincodes = [bid.pincode];

														if (pincodes.length > 0) {
															let qry = {};
															qry.pincode = { "$in": pincodes }

															Market.find(qry).then(function (franchisees) {
																if (franchisees.length > 0) {
																	var marketIds = [];

																	franchisees.forEach(function (item) {
																		marketIds.push(item.id);
																	});
																	roleQuery.markets = { $in: marketIds }

																	Users.find(roleQuery, { fields: ['fullName'] }).then(function (adminsWithRolesNew) {
																		if (adminsWithRolesNew.length > 0) {
																			bid['Ops Head'] = adminsWithRolesNew[0].fullName
																		}
																		// callback()
																	})
																}
															})

														}

													}
												})
											}
											callback();

										})

										//}
									}, function (error) {
										//sendEmailToDailyReports(results, 'User uploaded');
										return res.jsonx({
											success: true,
											data: results
										});
									})
								} else {
									//sendEmailToDailyReports(results, 'User uploaded');

									return res.jsonx({
										success: true,
										data: results
									});
								}

							})

						})

					})

				}
			})
		})
	},




};
//end of module export



function readOrderEmailFile(fromEmailIds, seqno) {

	// console.log(fromEmailIds, 'fromemailId');
	Users.findOne({ email: fromEmailIds, isModerntrader: true }).then(function (user) {
		if (user) {
			Orders.count({ buyer: user.id, emailSequnce: seqno }).then(function (total) {
				if (total > 0) {
					return ({ message: "Email is already placed" })

				} else {
					const xlsxFile = require('read-excel-file/node');
					var date = new Date();
					var currentDate = date.valueOf();
					xlsxFile('attachments/' + fromEmailIds + '.sheet').then((rows) => {
						// console.log(rows);
						let CategoryName = [];

						for (i = 1; i < rows.length; i++) {
							let catObject = {}
							for (j = 0; j < rows[i].length; j++) {
								console.log(rows[i][j], '++++++');

								if (j == 0) {
									catObject.category = rows[i][0]
									catObject.name = rows[i][0]

								} else if (j == 1) {
									catObject.quantity = rows[i][1]

								}
								else if (j == 2) {
									catObject.variety = rows[i][2]

								}
								else if (j == 3) {
									catObject.price = rows[i][3]

								}
								else if (j == 4) {
									catObject.company = rows[i][4]

								}
								catObject.userid = user.id
							}
							CategoryName.push(catObject);

						}
						console.log(CategoryName, 'category data===');


						let FoundCrop = [];
						let notFoundCrop = []
						var commonServiceObj = require('./../services/commonService');

						let orderCode = commonServiceObj.getOrderCode("ORD");
						let orderData = {};
						orderData.code = orderCode;
						orderData.buyer = user.id;
						orderData.status = 'Pending';
						orderData.isModerntrader = true;
						orderData.placedStatus = false
						orderData.emailSequnce = seqno;
						orderData.logisticsOption = 'efarmx'
						if (CategoryName[0].company) {
							orderData.company = CategoryName[0].company;
						}

						let checkOrder = false;
						Orders.create(orderData).then(function (orderResponse) {
							user.orderId = orderResponse.id;
							// console.log(orderResponse, 'orderResponse')
							let orderId = orderResponse.id;
							if (CategoryName.length > 0) {

								async.each(CategoryName, function (item, callback) {
									//	console.log(item, 'item')
									//console.log(item.category, '++++');
									let query = {};
									query.name = { $regex: new RegExp(item.category, 'i') }
									query.variety = { $regex: new RegExp(item.variety, 'i') }
									//	console.log(query, '++++++++++');
									Category.findOne(query).then(function (categoryData) {
										// console.log(categoryData, 'categoryData------------')
										if (categoryData) {

											let qry = {};
											qry.category = categoryData.id;
											let arr = categoryData.variety;
											let searchCat = item.variety;
											if (arr.length > 0) {
												let searchVariety = arr.filter(function (pattern) {
													return new RegExp(pattern).test(searchCat);
												})

												qry.variety = searchVariety;
												if (searchVariety.length == 0) {
													qry.variety = { $regex: new RegExp(item.variety, 'i') };
												}
											} else {
												qry.variety = { $regex: new RegExp(item.variety, 'i') };
											}
											// console.log(matches);
											leftAfterAcceptanceQuantity = { $gte: item.quantity }
											// qry.price = { $gte: item.price }
											qry.isExpired = false;
											qry.isDeleted = false;
											qry.isApproved = true;
											// qry.price = { $near : [item.price,0] }
											// console.log(qry, 'crop query===========')
											Crops.find(qry).sort({ price: 1 }).then(function (cropData) {

												// console.log(cropData, 'cropData------------')
												if (cropData.length > 0) {
													//console.log(item)
													let finalCrop = cropData[0]

													let priceDiff = finalCrop.price - item.price
													if (priceDiff < 0) {
														priceDiff = priceDiff * -1
													}

													for (var k = 0; k < cropData.length; k++) {
														let diff = cropData[k].price - item.price

														if (diff < 0) {
															diff = diff * -1
														}
														if (priceDiff > diff) {
															priceDiff = diff
															finalCrop = cropData[k]
														} else {
															finalCrop = cropData[k]
															break
														}
													}

													FoundCrop.push({ id: finalCrop.id, name: finalCrop.name })
													let mm = {}
													mm.category = item.category;
													mm.userid = item.userid
													mm.quantity = item.quantity
													mm.price = item.price
													mm.variety = item.variety;
													mm.company = item.company;
													mm.isAvailbe = true


													mm.order = orderId;

													Moderntraderpreorder.create(mm).then(function (moderndata) {
														mm.id = moderndata.id
														createOrder(finalCrop, user, mm)
														checkOrder = true;
														callback();


													})

												} else {
													notFoundCrop.push({ name: item.category });
													let mm = {}
													mm.category = item.category;
													mm.userid = item.userid
													mm.quantity = item.quantity
													mm.price = item.price
													mm.variety = item.variety;
													mm.company = item.company;
													mm.isAvailbe = false
													mm.order = orderId;
													// console.log(mm, 'mmmmelse====')
													Moderntraderpreorder.create(mm).then(function (moderndata) {

														callback();
													})

												}

											})
											//callback();
										} else {
											notFoundCrop.push({ name: item.category });
											let mm = {}
											mm.category = item.category;
											mm.userid = item.userid
											mm.quantity = item.quantity
											mm.price = item.price
											mm.variety = item.variety;
											mm.company = item.company;
											mm.isAvailbe = false;
											mm.order = orderId;
											// console.log(mm, 'mmmm==== category else')
											Moderntraderpreorder.create(mm).then(function (moderndata) {

												callback();
											})
											//notFoundItem(item.category, user)
											//callback();
										}
									})
								}, function (error) {

									//sendEmail(FoundCrop, user);
									if (notFoundCrop.length > 0) {
										//notFoundItem(notFoundCrop, user)

									}
									if (checkOrder == false) {
										Orders.destroy({ id: orderResponse.id }).then(function () {

										})
									}
									//console.log("final call=====")
								})
							}

						})
						if (CategoryName) {
							sendEmail(CategoryName, user);
						}
					})
				}
			})

		}
	})

}

function sendEmailAfterTwoHour() {
	var lastHour = new Date();
	lastHour.setHours(lastHour.getHours() - 2);

	Orders.find({ isModerntrader: true, placedStatus: false, "createdAt": { $gt: lastHour } })
		.populate("orderedCarts")
		.populate("buyer")
		.then(function (order) {

			let FoundCrop = []
			let users = []
			let totalAmount = 0;
			let totalFacilitationPercent = 0;
			let totalFacilitationCharges = 0;
			let totalTaxPercent = 0;
			let totalTaxAmount = 0;
			let deliveryCharges = 0
			let itemTotal = 0;
			let shippingAddress = {}
			let address = '';
			let pincode = 0;
			for (let i = 0; i < order.length; i++) {

				for (let j = 0; j < order[i].orderedCarts.length; j++) {
					FoundCrop.push(order[i].orderedCarts[j].crop)
					users.push({ order: order[i].id, cropid: order[i].orderedCarts[j].crop, name: order[i].buyer.fullName, email: order[i].buyer.email, qty: order[i].orderedCarts[j].quantity, quantity: order[i].orderedCarts[j].quantity, id: order[i].orderedCarts[j].id, ordercode: order[i].code, user: order[i].buyer, amount: order[i].orderedCarts[j].amount, totalAmount: order[i].orderedCarts[j].totalAmount })

					totalAmount = order[i].orderedCarts[j].amount + totalAmount;
					totalFacilitationPercent = order[i].orderedCarts[j].facilitationPercent + totalFacilitationPercent
					totalFacilitationCharges = order[i].orderedCarts[j].facilitationCharges + totalFacilitationCharges
					totalTaxPercent = order[i].orderedCarts[j].taxPercent + totalTaxPercent
					totalTaxAmount = order[i].orderedCarts[j].taxAmount + totalTaxAmount;
					deliveryCharges = order[i].orderedCarts[j].logisticPayment + deliveryCharges;
					itemTotal = itemTotal + 1
					shippingAddress = order[i].buyer.shippingAddress[0];
					address = order[i].buyer.address;
					pincode = order[i].buyer.pincode
					// users[order[i].id].push(order[i].orderedCarts[j].crop);
				}
				// if (newArray.length > 0) {
				//     users.push(newArray)
				// }

				// users = _.indexBy(users, 'order');
				//console.log(FoundCrop, '=====')
			}


			Crops.find({ id: { $in: FoundCrop } }).then(function (cropData) {
				let arr = _.groupBy(users, 'order')
				// console.log(arr, '===ss', arr.length)
				let orderIds = [];
				let cropInfo = []
				let userInfo = {};
				_.each(arr, function (data, idx) {
					for (let i = 0; i < data.length; i++) {
						for (let j = 0; j < cropData.length; j++) {
							if (cropData[j].id == data[i].cropid) {
								cropInfo.push({ id: cropData[j].id, name: cropData[j].name, variety: cropData[j].variety, price: cropData[j].price, quantity: data[i].qty })
								userInfo.firstName = data[i].name;
								userInfo.username = data[i].email;
								userInfo.order = data[i].order;
								userInfo.ordercode = data[i].ordercode;

								let crop = cropData[j]

								var cropFindQry = {}
								cropFindQry.id = cropData[j].id
								if (crop.aggregatedCrops && crop.aggregatedCrops.length > 0) {
									let query = { id: { $in: crop.aggregatedCrops } }

									let selectedFields = ['leftAfterAcceptanceQuantity']

									let partSold = data[i].qty / crop.leftAfterAcceptanceQuantity

									Crops.find(query, { fields: selectedFields }).then(function (allcrops) {
										let subcropCount = 0
										let leftAfterAcceptanceQuantitiesParts = {}

										_.each(allcrops, function (subcrop, index) {


											let quantityOfSubcropSold = crop.leftAfterAcceptanceQuantitiesParts[subcrop.id] * partSold


											var updateSubCrop = {};
											let laaq = Math.max(0, subcrop.leftAfterAcceptanceQuantity - quantityOfSubcropSold)
											updateSubCrop.leftAfterAcceptanceQuantity = parseFloat((laaq).toFixed(3))//Math.max(0, subcrop.leftAfterAcceptanceQuantity - quantityOfSubcropSold)
											leftAfterAcceptanceQuantitiesParts[subcrop.id] = parseFloat((crop.leftAfterAcceptanceQuantitiesParts[subcrop.id] - quantityOfSubcropSold).toFixed(3))//updateSubCrop.leftAfterAcceptanceQuantity


											Crops.update({ id: subcrop.id }, updateSubCrop).then(function (subcropUpdate) {
												if (subcropUpdate) {
													if (subcropUpdate[0].aggregations && subcropUpdate[0].aggregations.length > 1) {
														let otherAggs = subcropUpdate[0].aggregations
														const indexOfCurrentAggcrop = otherAggs.indexOf(crop.id);
														if (indexOfCurrentAggcrop > -1) {
															otherAggs.splice(indexOfCurrentAggcrop, 1);
														}
														let findAggregationsQuery = { id: { $in: otherAggs } }

														let selectedFieldsAggregations = ['leftAfterAcceptanceQuantity', 'leftAfterDeliveryQuantity', 'quantity', 'price', 'grade', 'quantitiesPart', 'leftAfterAcceptanceQuantitiesParts']

														Crops.find(findAggregationsQuery, { fields: selectedFieldsAggregations }).then(function (allotheraggregatedcrops) {
															let supercropCount = 0
															_.each(allotheraggregatedcrops, function (supercrop, idx) {
																if (supercrop.leftAfterAcceptanceQuantitiesParts[subcropUpdate[0].id]) {
																	let lastQuantity = supercrop.leftAfterAcceptanceQuantitiesParts[subcropUpdate[0].id]
																	let quantityPartOfCrop = Math.min(Math.max(0, subcropUpdate[0].leftAfterAcceptanceQuantity), Math.max(0, supercrop.leftAfterAcceptanceQuantitiesParts[subcropUpdate[0].id]))

																	let quantityDifference = parseFloat((lastQuantity - quantityPartOfCrop).toFixed(3))

																	let newLeftAfterAcceptanceQuantitiesParts = supercrop.leftAfterAcceptanceQuantitiesParts
																	newLeftAfterAcceptanceQuantitiesParts[subcropUpdate[0].id] = parseFloat((quantityPartOfCrop).toFixed(3))

																	var updateSuperCrop = {};
																	updateSuperCrop.leftAfterAcceptanceQuantitiesParts = newLeftAfterAcceptanceQuantitiesParts
																	updateSuperCrop.leftAfterAcceptanceQuantity = parseFloat((supercrop.leftAfterAcceptanceQuantity - quantityDifference).toFixed(3))
																	updateSuperCrop.leftAfterDeliveryQuantity = parseFloat((supercrop.leftAfterDeliveryQuantity - quantityDifference).toFixed(3))


																	Crops.update({ id: supercrop.id }, updateSuperCrop).then(function (supercropUpdate) {
																		if (supercropUpdate) {
																			if (supercropCount == allotheraggregatedcrops.length - 1) {
																				if (subcropCount == allcrops.length) {
																					var cropUpdateQry = {}
																					cropUpdateQry.leftAfterAcceptanceQuantity = parseFloat((crop.leftAfterAcceptanceQuantity - data[i].qty).toFixed(3))
																					cropUpdateQry.leftAfterAcceptanceQuantitiesParts = leftAfterAcceptanceQuantitiesParts

																					Crops.update(cropFindQry, cropUpdateQry).then(function (crop) {

																					})
																				}
																			}
																		}
																		supercropCount++;
																	})
																} else {
																	if (subcropCount == allcrops.length - 1) {
																		var cropUpdateQry = {}
																		cropUpdateQry.leftAfterAcceptanceQuantity = parseFloat((crop.leftAfterAcceptanceQuantity - data[i].qty).toFixed(3))
																		cropUpdateQry.leftAfterAcceptanceQuantitiesParts = leftAfterAcceptanceQuantitiesParts
																		Crops.update(cropFindQry, cropUpdateQry).then(function (crop) {

																		})
																	}
																}
															})
														})
													} else {
														if (subcropCount == allcrops.length - 1) {
															var cropUpdateQry = {}
															cropUpdateQry.leftAfterAcceptanceQuantity = parseFloat((crop.leftAfterAcceptanceQuantity - data[i].qty).toFixed(3))
															cropUpdateQry.leftAfterAcceptanceQuantitiesParts = leftAfterAcceptanceQuantitiesParts

															Crops.update(cropFindQry, cropUpdateQry).then(function (crop) {

															})
														}
													}
												}
												subcropCount++;
											})
										})
									})
								} else if (crop.aggregations && crop.aggregations.length > 0) {
									let findAggregationsQuery = { id: { $in: crop.aggregations } }

									let selectedFieldsAggregations = ['leftAfterAcceptanceQuantity', 'leftAfterDeliveryQuantity', 'quantity', 'price', 'grade', 'quantitiesPart', 'leftAfterAcceptanceQuantitiesParts']

									Crops.find(findAggregationsQuery, { fields: selectedFieldsAggregations }).then(function (allcrops) {
										let subcropCount = 0
										_.each(allcrops, function (supercrop, index) {
											if (supercrop.leftAfterAcceptanceQuantitiesParts[crop.id]) {
												let lastQuantity = supercrop.leftAfterAcceptanceQuantitiesParts[crop.id]

												let quantityPartOfCrop = Math.min(Math.max(0, crop.leftAfterAcceptanceQuantity - data[i].qty), Math.max(0, supercrop.leftAfterAcceptanceQuantitiesParts[crop.id]))

												let quantityDifference = parseFloat((lastQuantity - quantityPartOfCrop).toFixed(3))

												let newLeftAfterAcceptanceQuantitiesParts = supercrop.leftAfterAcceptanceQuantitiesParts
												newLeftAfterAcceptanceQuantitiesParts[crop.id] = parseFloat((quantityPartOfCrop).toFixed(3))

												var updateSuperCrop = {};
												updateSuperCrop.leftAfterAcceptanceQuantitiesParts = newLeftAfterAcceptanceQuantitiesParts
												updateSuperCrop.leftAfterAcceptanceQuantity = parseFloat((supercrop.leftAfterAcceptanceQuantity - quantityDifference).toFixed(3))
												updateSuperCrop.leftAfterDeliveryQuantity = parseFloat((supercrop.leftAfterDeliveryQuantity - quantityDifference).toFixed(3))

												Crops.update({ id: supercrop.id }, updateSuperCrop).then(function (supercropUpdate) {
													if (supercropUpdate) {
														if (subcropCount == allcrops.length - 1) {
															var cropUpdateQry = {}
															cropUpdateQry.leftAfterAcceptanceQuantity = parseFloat((crop.leftAfterAcceptanceQuantity - data[i].qty).toFixed(3))
															Crops.update(cropFindQry, cropUpdateQry).then(function (crop) {

															})
														}
													}
													subcropCount++;
												})
											} else {
												var cropUpdateQry = {}
												cropUpdateQry.leftAfterAcceptanceQuantity = parseFloat((crop.leftAfterAcceptanceQuantity - data[i].qty).toFixed(3))
												Crops.update(cropFindQry, cropUpdateQry).then(function (crop) {

												})
											}
										})
									})
								} else {
									var cropUpdateQry = {}
									cropUpdateQry.leftAfterAcceptanceQuantity = parseFloat((crop.leftAfterAcceptanceQuantity - data[i].qty).toFixed(3))
									Crops.update(cropFindQry, cropUpdateQry).then(function (crop) {

									})
								}
								console.log(cropData[j].id, 'cropid==', data[i], 'order info')
								Sellerpayment.destroy({
									crop: cropData[j].id, order: data[i].order,
									suborder: data[i].id
								}).then(function (responseSellerPayment) {
									Bidspayment.destroy({
										crop: cropData[j].id, order: data[i].order,
										suborder: data[i].id
									}).then(function (responseBidsPayment) {
										createSellerPaymentForMT(cropData[j].id, data[i]).then(function () {
										})
										createMTPayment(cropData[j].id, data[i]).then(function () {
										})
									})
								})

							}



						}

						//console.log(cropInfo, '==cropinfounder')
					}
					//console.log(idx, 'order')
					let orderUpdate = {};
					orderUpdate.placedStatus = true;
					orderUpdate.status = 'Processing';
					orderUpdate.paymentStatus = 0;
					orderUpdate.totalAmount = totalAmount;
					orderUpdate.finalAmount = totalAmount
					orderUpdate.totalFacilitationPercent = totalFacilitationPercent
					orderUpdate.totalFacilitationCharges = totalFacilitationCharges
					orderUpdate.totalInsurancePercent = 0
					orderUpdate.totalInsuranceCharges = 0
					orderUpdate.totalTaxPercent = totalTaxPercent
					orderUpdate.totalTaxAmount = totalTaxAmount
					orderUpdate.deliveryCharges = deliveryCharges
					orderUpdate.logisticsOption = 'efarmx'
					orderUpdate.itemTotal = itemTotal
					orderUpdate.taxAmount = totalTaxAmount
					orderUpdate.shippingPrice = deliveryCharges
					orderUpdate.shippingAddress = shippingAddress
					orderUpdate.billingAddress = shippingAddress
					orderUpdate.address = address
					orderUpdate.pincode = pincode

					Orders.update({ id: idx }, orderUpdate).then(function (orderupdata) {



						//console.log(orderupdata, 'orderupdate data====')
					});
					Moderntraderpreorder.find({ order: idx, isAvailbe: 'false' }).then(function (notFound) {
						sendEmailWithNotFound(cropInfo, userInfo, notFound)
					})
				})

				return ({
					success: true,
					code: 200,
					data: order,
					user: users
				});
			})

		})
}
function sendEmailWithNotFound(cropData, user, notfound) {
	//console.log(cropData, 'cropdata=====', user, 'userdata==')
	//url = options.verifyURL,
	var email = user.username;
	var message = 'Hello ';
	message += user.firstName;
	message += ",";
	message += '<br/><br/>';
	let html = ""
	if (user.ordercode) {
		html += "<strong>This is the order no: " + user.ordercode + "</strong><br/><br/>"
	}

	html += '<strong>Products details are given below:</strong><br/><br/>';
	html += '<table style=" border: 1px solid black;">';
	html += '<tr><th>Sr. No</th><th>Name</th><th>Variety</th><th>Quantity</th><th>Price</th><th>Status</th><th>Url</th></tr>';
	let j = 1;
	for (i = 0; i < cropData.length; i++) {
		html += '<tr>'
		html += '<td>' + j + '</td>'
		html += '<td>' + cropData[i].name + '</td>'
		html += '<td>' + cropData[i].variety + '</td>'
		html += '<td>' + cropData[i].quantity + '</td>'
		html += '<td>' + cropData[i].price + '</td>'
		html += '<td>Placed</td>'
		if (cropData[i].id) {
			// html += '<td>' + constantObj.appUrls.FRONT_WEB_URL + '/#/crops/detail/' + cropData[i].id + '</td>'
			html += '<td>' + constantObj.appUrls.FRONT_WEB_URL + '/crops/detail/' + cropData[i].id + '</td>'
		} else {
			html += '<td></td>'
		}
		html += '</tr>'
		// message += 'Placed order item ' + cropData[i].name;
		// message += '<br/><br/>';
		// message += 'Product is or commodity: ' + constantObj.appUrls.FRONT_WEB_URL + '/#/crops/detail/' + cropData[i].id;
		// message += '<br/><br/>';
		j++;
	}
	if (notfound.length > 0) {
		for (let i = 0; i < notfound.length; i++) {
			html += '<tr>'
			html += '<td>' + j + '</td>'
			html += '<td>' + notfound[i].category + '</td>'
			html += '<td>' + notfound[i].variety + '</td>'
			html += '<td>' + notfound[i].quantity + '</td>'
			html += '<td>' + notfound[i].price + '</td>'
			html += '<td>Not Availble</td>'
			html += '<td></td>'
			html += '</tr>'
			j++;
		}
	}
	html += '</table><br/><br/>'

	message += html;

	message += 'Regards';
	message += '<br/>';
	message += 'eFarmX Support Team';

	transport.sendMail({
		from: sails.config.appSMTP.auth.user,
		to: email,
		subject: 'FarmX Order Items',
		html: message
	}, function (err, info) {
		console.log("errro is ", err, info);
	});

	return { success: true, code: 200, data: { message: 'order placed successfully' } };
}

function sendEmail(cropData, user) {
	//url = options.verifyURL,
	Orderedcarts.findOne({ order: user.orderId }).then(function (oc) {
		if (oc) {

		} else {
			Order.destroy({ id: user.orderId }).then(function (ro) {

			})
		}
	})
	var email = user.username;
	var message = 'Dear ';
	message += user.firstName;
	message += ",";
	message += '<br/><br/>';
	message += 'Greetings from FramX';
	message += '<br/><br/>';
	let html = ""
	if (user.order) {
		html += "<h3>This is the order no: " + user.order + "</h3><br/><br/>"
		html += '<strong>Placed Order Items</strong>';
	} else {
		message += 'We have received your order. Your order summary is';
		message += '<br/><br/>';
	}


	html += '<table style=" border: 1px solid black;">';
	html += '<tr><th>Sr. No</th><th>Name</th><th>Variety</th><th>Quantity</th><th>Price</th></tr>';
	let j = 1;
	for (i = 0; i < cropData.length; i++) {
		html += '<tr>'
		html += '<td>' + j + '</td>'
		html += '<td>' + cropData[i].name + '</td>'
		html += '<td>' + cropData[i].variety + '</td>'
		html += '<td>' + cropData[i].quantity + '</td>'
		html += '<td>' + cropData[i].price + '</td>'



		html += '</tr>'
		// message += 'Placed order item ' + cropData[i].name;
		// message += '<br/><br/>';
		// message += 'Product is or commodity: ' + constantObj.appUrls.FRONT_WEB_URL + '/#/crops/detail/' + cropData[i].id;
		// message += '<br/><br/>';
		j++;
	}
	html += '</table>'

	message += html;
	message += '<br/><br/>';
	message += 'You will receive a mail from us shortly once your order is generated.';
	message += '<br/><br/>';
	message += 'Regards';
	message += '<br/>';
	message += 'eFarmX Support Team';

	transport.sendMail({
		from: sails.config.appSMTP.auth.user,
		to: email,
		subject: 'FarmX Order Items',
		html: message
	}, function (err, info) {
		console.log("errro is ", err, info);
	});

	return { success: true, code: 200, data: { message: 'order placed successfully' } };
}

function createOrder(data, user, mm) {
	var commonServiceObj = require('./../services/commonService');

	let postData = {};
	postData.productId = data.id;
	postData.productType = 'CROP';
	postData.amount = data.price;
	postData.quantity = mm.quantity;
	postData.quantityUnit = data.quantityUnit;
	postData.crop = data.id;
	postData.user = user.id;
	postData.seller = data.seller;
	postData.order = mm.order;
	postData.emailData = mm;
	postData.taxPercent = data.taxRate
	postData.facilitationPercent = data.efarmxComission
	postData.facilitationCharges = ((data.price * mm.quantity * data.efarmxComission) / 100);
	postData.taxAmount = ((postData.facilitationCharges * data.taxRate) / 100);
	postData.insurancePercent = data.insurancePercent;
	postData.insuranceCharges = 0//(((data.price * data.quantity) / 100) * data.insurancePercent) / 100;
	postData.market = data.market;
	postData.pincode = data.pincode;
	postData.logisticsOption = 'efarmx'
	postData.status = 'Processing'
	//console.log("postdata=====", postData)
	let req = {}
	req.body = {
		destinationPincode: user.pincode, cropId: data.id, quantity: data.quantity, origin: data.pincode,// destination: user.pincode 
	}


	var distance = require('google-distance-matrix');

	//console.log('oooo', req)
	let destinationPincode = req.body.destinationPincode
	let cropId = req.body.cropId
	let quantity = req.body.quantity
	let origin = req.body.origin
	let destination = req.body.destination
	if (destination) {
		destination = destination.replace("↵", ", ");
		destination = destination.replace("\n", ", ");
	}
	//console.log(postData, '====postData=== Up')
	// console.log(cropId, 'cropId==', quantity, 'quantity', destinationPincode, 'destinationPincode')
	if (cropId && quantity && destinationPincode) {


		Crops.findOne({ id: cropId }, { fields: ['category', 'market', 'pincode'] }).then(function (crop) {
			//console.log(crop, 'crop==')
			Market.findOne({ id: String(crop.market) }).populate('GM', { select: ['pincode'] }).then(function (mkt) {

				//console.log(mkt, 'mktdata====')
				let sourceP = crop.pincode
				if (mkt && mkt.GM && mkt.GM.pincode) {
					sourceP = mkt.GM.pincode
				}
				origin = String(sourceP)
				let qry = {}
				qry.isDeleted = false
				let category = crop.category

				qry.destination = parseInt(destinationPincode)
				qry.category = category
				qry.source = sourceP

				let now = new Date()

				qry.$or = [{ validUpto: null }, { validUpto: undefined }, { validUpto: { $gte: now } }]
				Logisticprice.find(qry).sort('load desc').then(function (lprices) {
					if (lprices.length > 0) {
						let lastPrice = 0
						let lastLoad = 0
						let idx = -1
						for (var i = 0; i < lprices.length; i++) {
							if (lprices[i].load > crop.quantity || i == 0 || lprices[i].load == crop.quantity) {
								lastPrice = lprices[i].price
								lastLoad = lprices[i].load
								idx = i
							} else {
								break
							}
						}

						if (idx > -1) {
							let dist = {}
							dist['rate'] = lastPrice;
							if (lprices[idx].distanceInMeters != undefined) {
								dist['distance'] = { 'value': lprices[idx].distanceInMeters, 'text': String(lprices[idx].distanceInMeters / 1000) + " km" }
								if (lprices[idx].travelDurationInSec != undefined) {
									dist['duration'] = { 'value': lprices[idx].travelDurationInSec, 'text': String(lprices[idx].travelDurationInSec / 60) + " mins" }
								} else {
									dist['duration'] = { 'value': 0, 'text': "Time Not available" }
								}
								postData.logisticPayment = dist['rate'];
								let suborderCode = commonServiceObj.getOrderCode("SORD");
								postData.code = suborderCode;
								postData.totalAmount = (postData.amount * postData.quantity) + postData.facilitationCharges + postData.taxAmount + postData.insuranceCharges + postData.logisticPayment

								Orderedcarts.create(postData).then(function (order) {
									// createSellerPaymentForMT(data.id, order).then(function () {
									// })
									// createMTPayment(data.id, order).then(function () {
									// })
								});
								//	console.log("2")
								return ({
									success: 'true',
									data: dist
								});
							} else {
								let origins = [origin];
								let destinations = [destinationPincode];
								if (destination) {
									destinations = [destination];
								}

								let googleApiKey = constantObj.googlePlaces.key;


								distance.key(googleApiKey);
								distance.units('metric');

								let errorMessage = "Input address not valid";
								let errorFlag = false;

								distance.matrix(origins, destinations, function (err, distances) {
									console.log(distances, 'distances++++++11')
									if (distances.status == 'OK') {
										for (var i = 0; i < origins.length; i++) {
											for (var j = 0; j < destinations.length; j++) {
												var origin = distances.origin_addresses[i];
												var destination = distances.destination_addresses[j];
												if (distances.rows[0].elements[j].status == 'OK') {
													// dist = distances.rows[i].elements[j].distance.text;
													dist = distances.rows[i].elements[j];
													errorFlag = false;
													break;
												} else {
													errorFlag = true;
												}
											}
										}

										if (!errorFlag) {
											dist['rate'] = parseFloat((lastPrice).toFixed(2));

											postData.logisticPayment = dist['rate'];
											let suborderCode = commonServiceObj.getOrderCode("SORD");
											postData.code = suborderCode;
											postData.totalAmount = (postData.amount * postData.quantity) + postData.facilitationCharges + postData.taxAmount + postData.insuranceCharges + postData.logisticPayment

											Orderedcarts.create(postData).then(function (order) {
												// createSellerPaymentForMT(data.id, order).then(function () {
												// })
												// createMTPayment(data.id, order).then(function () {
												// })
											});
											return ({
												success: 'true',
												data: dist
											});
										} else {
											dist['distance'] = { 'value': 0, 'text': "Distance not available" }
											dist['duration'] = { 'value': 0, 'text': "Time Not available" }
											dist['rate'] = parseFloat((lastPrice).toFixed(2));

											postData.logisticPayment = dist['rate'];
											let suborderCode = commonServiceObj.getOrderCode("SORD");
											postData.code = suborderCode;
											postData.totalAmount = (postData.amount * postData.quantity) + postData.facilitationCharges + postData.taxAmount + postData.insuranceCharges + postData.logisticPayment

											Orderedcarts.create(postData).then(function (order) {
												// createSellerPaymentForMT(data.id, order).then(function () {
												// })
												// createMTPayment(data.id, order).then(function () {
												// })
											});

											return ({
												success: 'true',
												data: dist
											});
										}
									}
								});
							}
						} else {
							let origins = [origin];
							let destinations = [destinationPincode];
							if (destination) {
								destinations = [destination];
							}
							let googleApiKey = constantObj.googlePlaces.key;


							distance.key(googleApiKey);
							distance.units('metric');

							let dist = '';
							let errorMessage = "Input address not valid";
							let errorFlag = false;
							//console.log(origins, 'origins==', destinations, 'destinations===')



							distance.matrix(origins, destinations, function (err, distances) {

								// console.log(distances, 'distances++++++22')
								if (err) {
									// return 
									errorFlag = true;
									return ({
										success: 'false',
										message: errorMessage
									});
								}
								if (!distances) {
									// return 
									errorFlag = true;
									return ({
										success: 'false',
										message: errorMessage
									});
								}

								if (distances == 'undefined') {
									errorFlag = true;
									return ({
										success: 'false',
										message: errorMessage
									});
								}

								if (distances.status == 'OK') {
									for (var i = 0; i < origins.length; i++) {
										for (var j = 0; j < destinations.length; j++) {
											var origin = distances.origin_addresses[i];
											var destination = distances.destination_addresses[j];
											if (distances.rows[0].elements[j].status == 'OK') {
												// dist = distances.rows[i].elements[j].distance.text;
												dist = distances.rows[i].elements[j];
												errorFlag = false;
												break;
											} else {
												errorFlag = true;
											}
										}
									}

									if (!errorFlag) {
										let distancesss = (dist.distance.value / 1000);
										Settings.find({}).then(function (settings) {
											if (settings.length > 0) {
												let setting = settings[0]
												var logisticPricePerKM = setting.crop.logisticCharges
												if (!logisticPricePerKM) {
													logisticPricePerKM = 15.5
												}

												let itemRate = (distancesss * logisticPricePerKM);
												dist['rate'] = parseFloat((itemRate).toFixed(2));



												postData.logisticPayment = dist['rate'];
												let suborderCode = commonServiceObj.getOrderCode("SORD");
												postData.code = suborderCode;
												postData.totalAmount = (postData.amount * postData.quantity) + postData.facilitationCharges + postData.taxAmount + postData.insuranceCharges + postData.logisticPayment

												Orderedcarts.create(postData).then(function (order) {
													// createSellerPaymentForMT(data.id, order).then(function () {
													// })
													// createMTPayment(data.id, order).then(function () {
													// })
												});
												// return({
												// 	success: 'true',
												// 	data: dist
												// });
											} else {
												return ({
													success: 'false',
													message: "Unknown Error Occurred"
												});
											}
										}).fail(function (err) {
											return ({
												success: 'false',
												message: err
											});
										})
									} else {
										return ({
											success: 'false',
											message: errorMessage
										});
									}
								} else {

									return ({
										success: 'false',
										message: errorMessage
									});
								}
							});

						}
					} else {
						let origins = [origin];
						let destinations = [destinationPincode];
						if (destination) {
							destinations = [destination];
						}

						let googleApiKey = constantObj.googlePlaces.key;


						distance.key(googleApiKey);
						distance.units('metric');

						let dist = '';
						let errorMessage = "Input address not valid";
						let errorFlag = false;

						//	console.log(origins, 'origins1==', destinations, 'destinations1===')

						//console.log(postData, '====postData=== Up')

						distance.matrix(origins, destinations, function (err, distances) {
							// console.log(distances, 'distances++++++33')
							if (err) {
								// return 
								errorFlag = true;
								return ({
									success: 'false',
									message: errorMessage
								});
							}
							if (!distances) {
								// return 
								errorFlag = true;
								return ({
									success: 'false',
									message: errorMessage
								});
							}

							if (distances == 'undefined') {
								errorFlag = true;
								return ({
									success: 'false',
									message: errorMessage
								});
							}


							if (distances.status == 'OK') {
								for (var i = 0; i < origins.length; i++) {
									for (var j = 0; j < destinations.length; j++) {
										var origin = distances.origin_addresses[i];
										var destination = distances.destination_addresses[j];
										if (distances.rows[0].elements[j].status == 'OK') {
											// dist = distances.rows[i].elements[j].distance.text;
											dist = distances.rows[i].elements[j];
											errorFlag = false;
											break;
										} else {
											errorFlag = true;
										}
									}
								}
								console.log(errorFlag, '====errorFlag=== Up', dist)

								if (!errorFlag) {
									//console.log(postData, '====postDatasetting')
									let distancesss = (dist.distance.value / 1000);
									Settings.find({}).then(function (settings) {
										if (settings.length > 0) {
											let setting = settings[0]
											var logisticPricePerKM = setting.crop.logisticCharges
											if (!logisticPricePerKM) {
												logisticPricePerKM = 15.5
											}

											let itemRate = (distancesss * logisticPricePerKM);
											dist['rate'] = parseFloat((itemRate).toFixed(2));
											// console.log('distance===', dist)
											postData.logisticPayment = dist['rate'];
											let suborderCode = commonServiceObj.getOrderCode("SORD");
											postData.code = suborderCode;
											postData.totalAmount = (postData.amount * postData.quantity) + postData.facilitationCharges + postData.taxAmount + postData.insuranceCharges + postData.logisticPayment
											//	console.log(postData, 'postData333')
											Orderedcarts.create(postData).then(function (order) {
												//console.log('+++++order', order, 'postData333order')
												// createSellerPaymentForMT(data.id, order).then(function () {
												// })
												// createMTPayment(data.id, order).then(function () {
												// })
											});
											// return ({
											// 	success: 'true',
											// 	data: dist
											// });
										} else {
											// return ({
											// 	success: 'false',
											// 	message: "Unknown Error Occurred"
											// });
										}
									})


								} else {
									Moderntraderpreorder.update({ id: mm.id }, { isAvailbe: false }).then(function () { })
									// return ({
									// 	success: 'false',
									// 	message: errorMessage
									// });
								}
							} else {

								// return ({
								// 	success: 'false',
								// 	message: errorMessage
								// });
							}
						});


					}
				})
			})
		})
	}






	// cropsroutepricecalculate(req).then(function (lg) {
	// 	postData.logisticPayment = lg.data.rate;
	// 	let suborderCode = commonServiceObj.getOrderCode("SORD");
	// 	postData.code = suborderCode;
	// 	postData.totalAmount = (postData.amount * postData.quantity) + postData.facilitationCharges + postData.taxAmount + postData.insuranceCharges + postData.logisticPayment

	// 	Orderedcarts.create(postData).then(function (order) {
	// 		// createSellerPaymentForMT(data.id, order).then(function () {
	// 		// })
	// 		// createMTPayment(data.id, order).then(function () {
	// 		// })
	// 	});
	// })
}

// function cropsroutepricecalculate(req) {
// 	var distance = require('google-distance-matrix');

// 	//console.log('oooo', req)
// 	let destinationPincode = req.body.destinationPincode
// 	let cropId = req.body.cropId
// 	let quantity = req.body.quantity
// 	let origin = req.body.origin
// 	let destination = req.body.destination
// 	if (destination) {
// 		destination = destination.replace("↵", ", ");
// 		destination = destination.replace("\n", ", ");
// 	}

// 	if (cropId && quantity && destinationPincode) {

// 		return Crops.findOne({ id: cropId }, { fields: ['category', 'market', 'pincode'] }).then(function (crop) {
// 			//console.log(crop.market, 'market==')
// 			return Market.findOne({ id: String(crop.market) }).populate('GM', { select: ['pincode'] }).then(function (mkt) {

// 				//console.log(mkt.GM, 'gmdata====')
// 				let sourceP = crop.pincode
// 				if (mkt && mkt.GM && mkt.GM.pincode) {
// 					sourceP = mkt.GM.pincode
// 				}
// 				origin = String(sourceP)
// 				let qry = {}
// 				qry.isDeleted = false
// 				let category = crop.category

// 				qry.destination = parseInt(destinationPincode)
// 				qry.category = category
// 				qry.source = sourceP

// 				let now = new Date()

// 				qry.$or = [{ validUpto: null }, { validUpto: undefined }, { validUpto: { $gte: now } }]
// 				return Logisticprice.find(qry).sort('load desc').then(function (lprices) {
// 					if (lprices.length > 0) {
// 						let lastPrice = 0
// 						let lastLoad = 0
// 						let idx = -1
// 						for (var i = 0; i < lprices.length; i++) {
// 							if (lprices[i].load > crop.quantity || i == 0 || lprices[i].load == crop.quantity) {
// 								lastPrice = lprices[i].price
// 								lastLoad = lprices[i].load
// 								idx = i
// 							} else {
// 								break
// 							}
// 						}

// 						if (idx > -1) {
// 							let dist = {}
// 							dist['rate'] = lastPrice;
// 							if (lprices[idx].distanceInMeters != undefined) {
// 								dist['distance'] = { 'value': lprices[idx].distanceInMeters, 'text': String(lprices[idx].distanceInMeters / 1000) + " km" }
// 								if (lprices[idx].travelDurationInSec != undefined) {
// 									dist['duration'] = { 'value': lprices[idx].travelDurationInSec, 'text': String(lprices[idx].travelDurationInSec / 60) + " mins" }
// 								} else {
// 									dist['duration'] = { 'value': 0, 'text': "Time Not available" }
// 								}
// 								//	console.log("2")
// 								return ({
// 									success: 'true',
// 									data: dist
// 								});
// 							} else {
// 								let origins = [origin];
// 								let destinations = [destinationPincode];
// 								if (destination) {
// 									destinations = [destination];
// 								}

// 								let googleApiKey = constantObj.googlePlaces.key;


// 								distance.key(googleApiKey);
// 								distance.units('metric');

// 								let errorMessage = "Input address not valid";
// 								let errorFlag = false;

// 								return distance.matrix(origins, destinations, function (err, distances) {
// 									if (distances.status == 'OK') {
// 										for (var i = 0; i < origins.length; i++) {
// 											for (var j = 0; j < destinations.length; j++) {
// 												var origin = distances.origin_addresses[i];
// 												var destination = distances.destination_addresses[j];
// 												if (distances.rows[0].elements[j].status == 'OK') {
// 													// dist = distances.rows[i].elements[j].distance.text;
// 													dist = distances.rows[i].elements[j];
// 													errorFlag = false;
// 													break;
// 												} else {
// 													errorFlag = true;
// 												}
// 											}
// 										}

// 										if (!errorFlag) {
// 											dist['rate'] = parseFloat((lastPrice).toFixed(2));
// 											return ({
// 												success: 'true',
// 												data: dist
// 											});
// 										} else {
// 											dist['distance'] = { 'value': 0, 'text': "Distance not available" }
// 											dist['duration'] = { 'value': 0, 'text': "Time Not available" }
// 											dist['rate'] = parseFloat((lastPrice).toFixed(2));
// 											return ({
// 												success: 'true',
// 												data: dist
// 											});
// 										}
// 									}
// 								});
// 							}
// 						} else {
// 							let origins = [origin];
// 							let destinations = [destinationPincode];
// 							if (destination) {
// 								destinations = [destination];
// 							}
// 							let googleApiKey = constantObj.googlePlaces.key;


// 							distance.key(googleApiKey);
// 							distance.units('metric');

// 							let dist = '';
// 							let errorMessage = "Input address not valid";
// 							let errorFlag = false;
// 							//console.log(origins, 'origins==', destinations, 'destinations===')
// 							return new Promise((resolve, reject) => {


// 								distance.matrix(origins, destinations, function (err, distances) {
// 									if (err) {
// 										// return 
// 										errorFlag = true;
// 										reject({
// 											success: 'false',
// 											message: errorMessage
// 										});
// 									}
// 									if (!distances) {
// 										// return 
// 										errorFlag = true;
// 										reject({
// 											success: 'false',
// 											message: errorMessage
// 										});
// 									}

// 									if (distances == 'undefined') {
// 										errorFlag = true;
// 										reject({
// 											success: 'false',
// 											message: errorMessage
// 										});
// 									}

// 									if (distances.status == 'OK') {
// 										for (var i = 0; i < origins.length; i++) {
// 											for (var j = 0; j < destinations.length; j++) {
// 												var origin = distances.origin_addresses[i];
// 												var destination = distances.destination_addresses[j];
// 												if (distances.rows[0].elements[j].status == 'OK') {
// 													// dist = distances.rows[i].elements[j].distance.text;
// 													dist = distances.rows[i].elements[j];
// 													errorFlag = false;
// 													break;
// 												} else {
// 													errorFlag = true;
// 												}
// 											}
// 										}

// 										if (!errorFlag) {
// 											let distancesss = (dist.distance.value / 1000);
// 											Settings.find({}).then(function (settings) {
// 												if (settings.length > 0) {
// 													let setting = settings[0]
// 													var logisticPricePerKM = setting.crop.logisticCharges
// 													if (!logisticPricePerKM) {
// 														logisticPricePerKM = 15.5
// 													}

// 													let itemRate = (distancesss * logisticPricePerKM);
// 													dist['rate'] = parseFloat((itemRate).toFixed(2));
// 													resolve({
// 														success: 'true',
// 														data: dist
// 													});
// 												} else {
// 													reject({
// 														success: 'false',
// 														message: "Unknown Error Occurred"
// 													});
// 												}
// 											}).fail(function (err) {
// 												reject({
// 													success: 'false',
// 													message: err
// 												});
// 											})
// 										} else {
// 											reject({
// 												success: 'false',
// 												message: errorMessage
// 											});
// 										}
// 									} else {

// 										reject({
// 											success: 'false',
// 											message: errorMessage
// 										});
// 									}
// 								});
// 							})
// 						}
// 					} else {
// 						let origins = [origin];
// 						let destinations = [destinationPincode];
// 						if (destination) {
// 							destinations = [destination];
// 						}

// 						let googleApiKey = constantObj.googlePlaces.key;


// 						distance.key(googleApiKey);
// 						distance.units('metric');

// 						let dist = '';
// 						let errorMessage = "Input address not valid";
// 						let errorFlag = false;

// 						//console.log(origins, 'origins1==', destinations, 'destinations1===')

// 						return new Promise((resolve, reject) => {
// 							distance.matrix(origins, destinations, function (err, distances) {
// 								console.log(distances, 'distances++++++')
// 								if (err) {
// 									// return 
// 									errorFlag = true;
// 									reject({
// 										success: 'false',
// 										message: errorMessage
// 									});
// 								}
// 								if (!distances) {
// 									// return 
// 									errorFlag = true;
// 									reject({
// 										success: 'false',
// 										message: errorMessage
// 									});
// 								}

// 								if (distances == 'undefined') {
// 									errorFlag = true;
// 									reject({
// 										success: 'false',
// 										message: errorMessage
// 									});
// 								}

// 								if (distances.status == 'OK') {
// 									for (var i = 0; i < origins.length; i++) {
// 										for (var j = 0; j < destinations.length; j++) {
// 											var origin = distances.origin_addresses[i];
// 											var destination = distances.destination_addresses[j];
// 											if (distances.rows[0].elements[j].status == 'OK') {
// 												// dist = distances.rows[i].elements[j].distance.text;
// 												dist = distances.rows[i].elements[j];
// 												errorFlag = false;
// 												break;
// 											} else {
// 												errorFlag = true;
// 											}
// 										}
// 									}

// 									if (!errorFlag) {
// 										let distancesss = (dist.distance.value / 1000);
// 										Settings.find({}).then(function (settings) {
// 											if (settings.length > 0) {
// 												let setting = settings[0]
// 												var logisticPricePerKM = setting.crop.logisticCharges
// 												if (!logisticPricePerKM) {
// 													logisticPricePerKM = 15.5
// 												}

// 												let itemRate = (distancesss * logisticPricePerKM);
// 												dist['rate'] = parseFloat((itemRate).toFixed(2));
// 												// console.log('distance===', dist)

// 												resolve({
// 													success: 'true',
// 													data: dist
// 												});
// 											} else {
// 												reject({
// 													success: 'false',
// 													message: "Unknown Error Occurred"
// 												});
// 											}
// 										})


// 									} else {
// 										reject({
// 											success: 'false',
// 											message: errorMessage
// 										});
// 									}
// 								} else {

// 									reject({
// 										success: 'false',
// 										message: errorMessage
// 									});
// 								}
// 							});
// 						})

// 					}
// 				})
// 			})
// 		})
// 	}
// }

function createMTPayment(cropId, suborder) {
	return Crops.findOne({ id: cropId }).then(function (cropInfo) {
		let payments = [];

		let data = {
			'name': "Final",
			'percentage': 100,
			'days': 12,
			'amount': suborder.totalAmount,
			'pincode': cropInfo.pincode,
			'type': 'Final',
			'status': 'Due',
			'cropId': cropInfo.id,
			'order': suborder.order,
			'suborder': suborder.id,
			'buyerId': suborder.user,
			'sellerId': cropInfo.seller,
			'sequenceNumber': 1,
			'paymentDueDate': new Date(new Date().setDate(new Date().getDate() + 12)).toISOString(),
			'paymentMedia': 'Cart'
		}

		payments.push(data);
		Bidspayment.destroy({ cropId: cropId, order: suborder.order, suborder: suborder.id }).then(function (removeBuyerPayment) {
			return Bidspayment.create(payments).then(function (response) {

			})
		})
	})
}

function createSellerPaymentForMT(cropId, suborder) {
	//console.log('call method', cropId)
	return Crops.findOne({ id: cropId }).then(function (cropinfo) {
		//	console.log(cropinfo, 'cropinfo====')
		if (cropinfo.aggregatedCrops && cropinfo.aggregatedCrops.length > 0) {

			let query = { id: { $in: cropinfo.aggregatedCrops } }

			let selectedFields = ['seller', 'price', 'quantity', 'quantitiesPart', 'leftAfterAcceptanceQuantitiesParts']

			return Crops.find(query, { fields: selectedFields }).then(function (allcrops) {
				var sellerPayments = [];
				for (var i = 0; i < allcrops.length; i++) {

					let shareOfCrop = cropinfo.leftAfterAcceptanceQuantitiesParts[allcrops[i].id] / cropinfo.leftAfterAcceptanceQuantity

					let sequenceNumber = 1;

					let days = 0
					days = days + cropinfo.sellerUpfrontDays

					let upfrontObject = {
						cropId: cropinfo.id,
						baseCropId: allcrops[i].id,
						order: suborder.order,
						suborder: suborder.id,
						sellerId: allcrops[i].seller,
						buyerId: suborder.user,
						depositPercentage: cropinfo.sellerUpfrontPercentage,
						depositLabel: "Upfront",
						depositDays: cropinfo.sellerUpfrontDays,
						pincode: cropinfo.pincode,
						paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
						type: "Upfront",
						status: "Due",
						sequenceNumber: sequenceNumber,
						paymentMedia: 'Cart',
						amount: parseFloat((shareOfCrop * ((suborder.amount * suborder.quantity) * parseFloat(cropinfo.sellerUpfrontPercentage / 100))).toFixed(2))
					}
					sellerPayments.push(upfrontObject)

					for (var n = 0; n < cropinfo.sellerDepositPayment.length; n++) {
						let number = ++sequenceNumber;

						days = days + cropinfo.sellerDepositPayment[n].days

						let object = {
							cropId: cropinfo.id,
							baseCropId: allcrops[i].id,
							order: suborder.order,
							suborder: suborder.id,
							sellerId: allcrops[i].seller,
							buyerId: suborder.user,
							depositPercentage: cropinfo.sellerDepositPayment[n].percentage,
							depositLabel: cropinfo.sellerDepositPayment[n].label,
							depositDays: cropinfo.sellerDepositPayment[n].days,
							pincode: cropinfo.pincode,
							paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
							type: "Deposit",
							status: "Due",
							paymentMedia: 'Cart',
							sequenceNumber: number,
							amount: parseFloat((shareOfCrop * (suborder.amount * parseFloat(cropinfo.sellerDepositPayment[n].percentage / 100))).toFixed(2))
						}
						sellerPayments.push(object);
					}

					/*cropinfo.sellerDepositPayment.forEach((obj, i) => {
						days = days + cropinfo.sellerDepositPayment[i].days
						let number = ++sequenceNumber;
						let object = {
							cropId: cropinfo.id,
							bidId: bidInfo.id,
							sellerId: allcrops[i].seller,
							buyerId: bidInfo.user.id,
							depositPercentage: cropinfo.sellerDepositPayment[i].percentage,
							depositLabel: cropinfo.sellerDepositPayment[i].label,
							depositDays: cropinfo.sellerDepositPayment[i].days,
							pincode: cropinfo.pincode,
							paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
							type: "Deposit",
							status: "Due",
							sequenceNumber: number,
							amount: parseFloat((shareOfCrop * (bidInfo.amount * parseFloat(obj.percentage / 100))).toFixed(2))
						}
						sellerPayments.push(object);
					})*/

					days = days + cropinfo.sellerFinalDays
					let SequenceNumber = ++sequenceNumber;
					let finalObject = {
						cropId: cropinfo.id,
						baseCropId: allcrops[i].id,
						order: suborder.order,
						suborder: suborder.id,
						sellerId: allcrops[i].seller,
						buyerId: suborder.user,
						depositPercentage: cropinfo.sellerFinalPercentage,
						depositLabel: "Final",
						depositDays: cropinfo.sellerFinalDays,
						pincode: cropinfo.pincode,
						paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
						type: "Final",
						status: "Due",
						paymentMedia: 'Cart',
						sequenceNumber: SequenceNumber,
						amount: parseFloat((shareOfCrop * ((suborder.amount * suborder.quantity) * parseFloat(cropinfo.sellerFinalPercentage / 100))).toFixed(2))
					}
					sellerPayments.push(finalObject);

				}

				for (var i = 0; i < sellerPayments.length; i++) {
					if (sellerPayments[i].amount < 1) {
						sellerPayments[i].amount = 0
						sellerPayments[i].paymentMode = 'AutoAdjusted'
						sellerPayments[i].status = 'Verified'
						sellerPayments[i].isVerified = true
						sellerPayments[i].depositedOn = new Date()
					}
				}

				return Sellerpayment.create(sellerPayments).then(function (responseSellerPayment) {
				})

			})
		} else {
			var sellerPayments = [];
			var sequenceNumber = 1;

			var days = 0
			days = days + cropinfo.sellerUpfrontDays

			let upfrontObject = {
				cropId: cropinfo.id,
				baseCropId: cropinfo.id,
				order: suborder.order,
				suborder: suborder.id,
				sellerId: cropinfo.seller,
				buyerId: suborder.user,
				depositPercentage: cropinfo.sellerUpfrontPercentage,
				depositLabel: "Upfront",
				depositDays: cropinfo.sellerUpfrontDays,
				pincode: cropinfo.pincode,
				paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
				type: "Upfront",
				status: "Due",
				sequenceNumber: sequenceNumber,
				paymentMedia: 'Cart',
				amount: parseFloat((suborder.amount * suborder.quantity) * parseFloat(cropinfo.sellerUpfrontPercentage / 100))
			}
			sellerPayments.push(upfrontObject)

			cropinfo.sellerDepositPayment.forEach((obj, i) => {
				days = days + cropinfo.sellerDepositPayment[i].days
				let number = ++sequenceNumber;
				let object = {
					cropId: cropinfo.id,
					baseCropId: cropinfo.id,
					order: suborder.order,
					suborder: suborder.id,
					sellerId: cropinfo.seller,
					buyerId: suborder.user,
					depositPercentage: cropinfo.sellerDepositPayment[i].percentage,
					depositLabel: cropinfo.sellerDepositPayment[i].label,
					depositDays: cropinfo.sellerDepositPayment[i].days,
					pincode: cropinfo.pincode,
					paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
					type: "Deposit",
					status: "Due",
					sequenceNumber: number,
					paymentMedia: 'Cart',
					amount: parseFloat((suborder.amount * suborder.quantity) * parseFloat(obj.percentage / 100))
				}
				sellerPayments.push(object);
			})

			days = days + cropinfo.sellerFinalDays
			let SequenceNumber = ++sequenceNumber;
			let finalObject = {
				cropId: cropinfo.id,
				baseCropId: cropinfo.id,
				order: suborder.order,
				suborder: suborder.id,
				sellerId: cropinfo.seller,
				buyerId: suborder.user,
				depositPercentage: cropinfo.sellerFinalPercentage,
				depositLabel: "Final",
				depositDays: cropinfo.sellerFinalDays,
				pincode: cropinfo.pincode,
				paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
				type: "Final",
				status: "Due",
				sequenceNumber: SequenceNumber,
				paymentMedia: 'Cart',
				amount: parseFloat((suborder.amount * suborder.quantity) * parseFloat(cropinfo.sellerFinalPercentage / 100))
			}
			sellerPayments.push(finalObject);

			for (var i = 0; i < sellerPayments.length; i++) {
				if (sellerPayments[i].amount < 1) {
					sellerPayments[i].amount = 0
					sellerPayments[i].paymentMode = 'AutoAdjusted'
					sellerPayments[i].status = 'Verified'
					sellerPayments[i].isVerified = true
					sellerPayments[i].depositedOn = new Date()
				}
			}
			//console.log(sellerPayments, 'sellerPayments=========')

			return Sellerpayment.create(sellerPayments).then(function (responseSellerPayment) {
			})

		}
	})

}
function notFoundItem(item, user) {
	console.log(item, 'notfound item=====')
	var email = user.username;
	var message = 'Hello ';
	message += user.firstName;
	message += ",";
	message += '<br/><br/>';

	for (i = 0; i < item.length > 0; i++) {
		message += item[i].name + " not found with us";
		message += '<br/><br/>';
	}

	message += '<br/><br/>';
	message += 'Regards';
	message += '<br/>';
	message += 'eFarmX Support Team';

	transport.sendMail({
		from: sails.config.appSMTP.auth.user,
		to: email,
		subject: 'FarmX Not Found Products',
		html: message
	}, function (err, info) {
		console.log("errro is ", err, info);
	});

}
/**
*   Check the struct and return the different parts found
*   
*/
function findPart(struct) {
	var keys = [];
	for (var i = 0, len = struct.length, r; i < len; ++i) {
		if (Array.isArray(struct[i])) {
			for (var j = 0; j < struct[i].length; j++) {
				if (Array.isArray(struct[i][j])) {
					keys = checkType(keys, struct[i][j][0]);
				} else {
					keys = checkType(keys, struct[i][j]);
				}
			}
		} else {
			keys = checkType(keys, struct[i]);
		}
	}

	return keys;
}


/**
*   Check a single structure and see what type it is
*   Returns an array with some keys that will be used later
*/
function checkType(keys, struct) {
	if (struct.type === 'text' && struct.subtype === 'html') {
		keys.push({
			partID: struct.partID,
			role: 'body',
			type: struct.type + '/' + struct.subtype
		});
	} else if (struct.type == 'application' || struct.type == 'image') {
		keys.push({
			partID: struct.partID,
			role: 'attachment',
			type: struct.type + '/' + struct.subtype,
			name: randString() + '.' + struct.subtype
		});
	}

	return keys;
}

/**
*   Returns a random string that we use to name the attachment files
*/
function randString() {
	var s = "";
	while (s.length < 50) {
		var r = Math.random();
		s += (r < 0.1 ? Math.floor(r * 100) : String.fromCharCode(Math.floor(r * 26) + (r > 0.5 ? 97 : 65)));
	}
	return s;
}

/**
*   Look for a multipart message structure
*/
function getStruct(uid, cb) {
	var f = imap.fetch(uid, ({ struct: true }));
	var e = imap.fetch(uid, { bodies: '1', markSeen: true });
	f.on('error', function (err) {
		cb(err);
	});

	f.on('message', function (m, seqno) {
		console.log('arunseq=====++++', 'Message #%d', seqno);

		m.on('attributes', function (attrs) {
			cb(undefined, attrs.struct);
		});
	});
}

/**
*   Fetch a message by id and the part
*/
function getMsgByUID(uid, cb, partID) {
	var f = imap.fetch(uid, ({ bodies: ['HEADER.FIELDS (TO FROM SUBJECT)', 'TEXT', partID] }));
	var hadErr = false;

	if (partID) var msg = {
		header: undefined,
		body: '',
		attrs: undefined
	};

	f.on('error', function (err) {
		hadErr = true;
		cb(err);
	});

	f.on('message', function (m) {
		m.on('body', function (stream, info) {
			var b = '';
			stream.on('data', function (d) {
				b += d;
			});
			stream.on('end', function () {
				if (/^header/i.test(info.which)) {
					msg.header = Imap.parseHeader(b);


				}
				else msg.body = b;
			});
		});
		m.on('attributes', function (attrs) {
			msg.attrs = attrs;
		});
	});
	f.on('end', function () {
		if (hadErr) return;
		cb(undefined, msg.header, msg.body);
	});

}

/**
*   Save the attachment if any
*/
function saveAttachment(name, body, cb) {
	// Initiate the source
	var bufferStream = new stream.PassThrough();
	var writeStream = fs.createWriteStream(name);

	// Write your buffer
	bufferStream.end(new Buffer(body, 'base64'));

	// Pipe it to something else  (i.e. stdout)
	bufferStream.pipe(writeStream);

	cb(undefined);
}

/**
*   Picks up the messages and kick starts the whole process
*/
imap.once('ready', function () {

	imap.openBox('INBOX', false, function (err, box) {
		const d = new Date();
		const yesterday = new Date(d)

		yesterday.setDate(yesterday.getDate() - 1)
		const options = { year: 'numeric', month: 'short', day: 'numeric' };
		let dd = yesterday.toLocaleDateString('en-US', options);
		//, ['SINCE', dd]
		imap.search(['UNSEEN', ['SINCE', dd]], function (err, results) {
			// console.log(results, '=====');
			// return 1;
			if (err) {
				console.log(err);
				return false;
			}
			//var f = imap.fetch(results, { bodies: '1', markSeen: true });
			//If there are messages
			if (results.length > 0) {

				//Get each message structure
				results.forEach(function (result) {

					getStruct(result, function (err, struct) {
						if (err) throw err;
						var f = imap.fetch(result, ({ struct: true }));
						f.on('message', function (msg, seqno) {

							//console.log(result, 'resultarun', struct, 'struct data=========++++++++');
							//break;
							//If there's an structure found, fetch each part
							if (struct.length > 0) {
								var keys = findPart(struct);

								var parts = [];
								var header = [];
								keys.forEach(function (val) {
									getMsgByUID(result, function (err, head, msg) {
										header = head;
										parts[val.role] = msg;
										// console.log(header, '++++++++++++++++')
										//If we found an attachment, save the file
										if (val.role == 'attachment') {
											var date = new Date();
											var currentDate = date.valueOf();
											let from = header.from;

											let email = from[0].split('<').pop().split('>')[0];
											saveAttachment('attachments/' + email + '.sheet', msg, function (err) {
												if (err) {
													console.log(err);
												}
												readOrderEmailFile(email, seqno);
												return 1;
												// console.log('Parsed header: %s', fromEmailList);

											});
										}

									}, val.partID);
								});

							}
						});
					});

					//TODO: Do your thing to save the email (the attachment is already saved)
				});
			}
		});
		return false;
	});
});

updateNotificationSentTo = function (notification, users) {
	return Notifications.update({ id: notification.id }, { sentTo: users }).then(function (notifications) {
		return true
	}).fail(function (err) {
		return false
	})
}

sendEmailToDailyReports = function (results, reportType) {
	var datetime = new Date();
	var fileName = reportType + "_report_info.xlsx";
	//console.log(results, 'result===');
	var json2xls = require('json2xls');
	var fs = require('fs');
	day = datetime.getDate();
	month = datetime.getMonth() + 1;
	year = datetime.getFullYear();
	if (day < 10) {
		day = '0' + day;
	}
	if (month < 10) {
		month = '0' + month;
	}
	finaldate = day + "-" + month + "-" + year;
	var json = results;
	var xls = json2xls(json);
	//console.log(fileName, '----', xls, '======')
	fs.writeFileSync('./csvs/' + fileName, xls, 'binary');
	//message = "Hi Team,";
	var message = '<br/><br/>';
	message += 'This mail is in regard to keep you informed about the total number of' + reportType + ' that have been uploaded on the FarmX panel.';
	message += '<br/><br/>';
	message += 'For <strong> ' + finaldate + ', <br>Total Number of  ' + reportType + ': ' + results.length + ' </strong>';
	message += '<br/><br/><br/>';
	message += 'Thanks';
	message += '<br> <strong> Team FarmX </strong>';
	var query = {};
	query.select = ['firstName', 'email'];
	query.or = [{ roles: "A" }, { roles: "SA" }]
	Users.find(query).exec((err, users) => {
		// console.log(users);
		users.forEach(function (userlist) {
			let messageToSend = "Hi " + userlist.firstName + ", " + message
			let emailMessage = {
				from: sails.config.appSMTP.auth.user,
				to: userlist.email,
				//to: 'arun.dixit@efarmexchange.com',
				subject: 'FarmX: ' + reportType + '- ' + finaldate,
				html: messageToSend,
				attachments: [{
					path: './csvs/' + fileName
				}]
			};

			transport.sendMail(emailMessage, function (err, info) {
				if (err) {
					return;
				} else {
					console.log('mail sent successfully');
				}

			});
		})

	})
}

updateNotificationSentTo = function (notification, users) {
	return Notifications.update({ id: notification.id }, { sentTo: users }).then(function (notifications) {
		return true
	}).fail(function (err) {
		return false
	})
}
