var constantObj = sails.config.constants;
var Promise = require('bluebird'),
	promisify = Promise.promisify;
var constantObj = sails.config.constants;

const { resolve, reject } = require('bluebird');
var FCM = require('fcm-node');

exports.sendPush = function (device) {
	if (device.device_type == "IOS") {
		PushService.sendToIOS(device.device_token, device.message, device)
	} else if (device.device_type == "ANDROID") {
		PushService.sendToAndroid(device.device_token, device.message, device)
	}
};

exports.sendPushToUsersWithNotificationInfo = function (users, notificationInfo) {
	let environment = 'development'
	if (sails.config.PAYTM_FRONT_WEB_URL == "https://landx.co.in" || sails.config.PAYTM_FRONT_WEB_URL == "https://beta.landx.co.in") {
		environment = 'production'
	}

	var serverKey = constantObj.pushNotificationInfo[environment].serverKey
	var fcm = new FCM(serverKey);
	var devicetokens = []


	async.each(users, function (user, callback) {
		Userslogin.find({ $or: [{ device_type: 'ANDROID' }, { device_type: 'IOS' }], loggedIn: true, user: user }, { fields: ['fcm_token', 'device_token', 'device_type', 'createdAt'] }).sort('createdAt DESC').then(function (usersdevices) {
			if (usersdevices.length > 0) {
				let lastDeviceDate = new Date(usersdevices[0].createdAt)
				Userslogin.count({ createdAt: { $gt: lastDeviceDate }, fcm_token: usersdevices[0].fcm_token, user: { $ne: user } }).then(function (anotherUserCount) { //confirm
					if (anotherUserCount > 0) {
						callback()
					} else {
						var device_token = usersdevices[0].fcm_token;
						devicetokens.push(device_token)

						var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
							to: device_token,
							token: device_token,

							notification: {
								title: notificationInfo.messageTitle,
								body: notificationInfo.message,
								badge: 1,
								sound: "landx_notification_digicoin.wav",
							},

							data: {  //you can send only notification or only data(or include both)
								type: notificationInfo.messageKey,
								notificationId: notificationInfo.id,
							},

							priority: 'high',
							content_available: true,

							android: {
								content_available: true,
								notification: { //notification object
									title: notificationInfo.messageTitle,
									body: notificationInfo.message,
									sound: "landx_notification_digicoin.wav",
									badge: "1"
								}
							},

							// apns: {
							//  	payload: {
							//    		aps: {
							//      		alert: {
							// 		title: notificationInfo.messageTitle,
							// 		body: notificationInfo.message
							// 	},
							//    		},
							//    		Data:{  //you can send only notification or only data(or include both)
							// 	type: notificationInfo.messageKey,
							// 	notificationId: notificationInfo.id,
							// }
							//  	}
							// },

							// sound: "default",
						};


						fcm.send(message, function (err, response) {
							if (err) {
								console.log("fcm response - Something has gone wrong!", err);
							} else {
								console.log("fcm response - Successfully sent with response: ", response);
							}
						});

						callback()
					}
				})
			} else {
				callback()
			}
		})
	}, function (error) {
		if (error) {
			console.log("Something has gone wrong!", error);
		} else {
			console.log("Successfully sent with response: ");
		}
	});

};

exports.sendPushToFieldTransactionsAdmin = function (users, messageTitle, msg) {
	let environment = 'development'
	if (sails.config.PAYTM_FRONT_WEB_URL == "https://farmx.co.in" || sails.config.PAYTM_FRONT_WEB_URL == "https://beta.farmx.co.in") {
		environment = 'production'
	}

	var serverKey = constantObj.pushNotificationFieldTransactionInfo[environment].serverKey
	var fcm = new FCM(serverKey);
	var devicetokens = []


	async.each(users, function (user, callback) {
		Userslogin.find({ $or: [{ device_type: 'ANDROID' }, { device_type: 'IOS' }], loggedIn: true, user: user, applicationtype: 'fieldtransaction' }, { fields: ['fcm_token', 'device_token', 'device_type', 'createdAt'] }).sort('createdAt DESC').then(function (usersdevices) {
			if (usersdevices.length > 0) {
				let lastDeviceDate = new Date(usersdevices[0].createdAt)
				Userslogin.count({ createdAt: { $gt: lastDeviceDate }, fcm_token: usersdevices[0].fcm_token, user: { $ne: user } }).then(function (anotherUserCount) { //confirm
					if (anotherUserCount > 0) {
						callback()
					} else {
						var device_token = usersdevices[0].fcm_token;
						devicetokens.push(device_token)

						var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
							to: device_token,
							token: device_token,

							notification: {
								title: messageTitle,
								body: msg,
								badge: 1,
								sound: "farmx_notification_demon.wav",
							},

							priority: 'high',
							content_available: true,

							android: {
								content_available: true,
								notification: { //notification object
									title: messageTitle,
									body: msg,
									sound: "farmx_notification_demon.wav",
									badge: "1"
								}
							},

							// apns: {
							//  	payload: {
							//    		aps: {
							//      		alert: {
							// 		title: notificationInfo.messageTitle,
							// 		body: notificationInfo.message
							// 	},
							//    		},
							//    		Data:{  //you can send only notification or only data(or include both)
							// 	type: notificationInfo.messageKey,
							// 	notificationId: notificationInfo.id,
							// }
							//  	}
							// },

							// sound: "default",
						};


						fcm.send(message, function (err, response) {
							if (err) {
								console.log("fcm response - Something has gone wrong!", err);
							} else {
								console.log("fcm response - Successfully sent with response: ", response);
							}
						});

						callback()
					}
				})
			} else {
				callback()
			}
		})
	}, function (error) {
		if (error) {
			console.log("Something has gone wrong!", error);
		} else {
			console.log("Successfully sent with response: ");
		}
	});

};

exports.sendToIOS = function (deviceToken, message, value) {

	var apns = require('apn');
	var path = require('path');
	var deviceTokenArray = [deviceToken];

	var errorCallback = function (err, notif) {
		console.log('ERROR : ' + err + '\nNOTIFICATION : ' + notif);
	}

	var options = {
		/*live mode*/
		production: false,
		passphrase: "123456",
		ca: null,
		pfx: null,
		pfxData: null,
		//port: 2195,
		rejectUnauthorized: true,
		enhanced: true,
		errorCallback: errorCallback,
		cacheLength: 100,
		autoAdjustCache: true,
		connectionTimeout: 0
	}

	var mode = sails.config.constants.pushEnv.env;
	if (mode == "prod") {

		options.gateway = "gateway.push.apple.com";
		//options.key = path.resolve('./keys/abc.pem');
		options.cert = path.resolve('./keys/apns_dev_cert.pem');

	} else {
		options.gateway = "gateway.sandbox.push.apple.com";
		options.key = path.resolve('./keys/Certificates_dev.pem');
		options.cert = path.resolve('./keys/Certificates_dev.pem');
	}

	var apnsConnection = new apns.Provider(options);
	var note = new apns.Notification();

	note.expiry = Math.floor(Date.now() / 1000) + 3600;
	note.sound = 'landx_notification_digicoin.wav';
	note.badge = 1;
	note.alert = message;
	note.contentAvailable = 1;
	note.payload = {
		"value": value
	}

	apnsConnection.send(note, deviceTokenArray)
		.then(function (result) {
		})

	apnsConnection.on('error', log('error'));
	apnsConnection.on('transmitted', log('transmitted'));
	apnsConnection.on('timeout', log('timeout'));
	apnsConnection.on('connected', log('connected'));
	apnsConnection.on('disconnected', log('disconnected'));
	apnsConnection.on('socketError', log('socketError'));
	apnsConnection.on('transmissionError', log('transmissionError'));
	apnsConnection.on('cacheTooSmall', log('cacheTooSmall'));

	function log(type) {

		return function () {
			if ((type == "transmitted") || (type == "connected"))
				return cb(null, arguments)
		}
	}
};

exports.sendToAndroid = function (token, message, data) {
	var FCM = require('fcm-node');

	console.log('rrererererer**', data);

	// var serverKey = "AAAAiFzHemg:APA91bHerjlqBpPGsGmgzWzPBRIa6VCop0H8dz3WUtYycXaVrCRpIcOcTu0iytYBcdoPBVvx5x_twi8jSEg15hjkwIEudef5An6LeWDjEfFUWW_NX-NGEY3epmF1Vwz2fGFqdU1DPa62"; //"AIzaSyDry-zM5968brTY_L6bX8_coC5Jbg87hAg"
	// var serverKey = "AAAA30tmCng:APA91bHfjmBtkT6IDV0AoNWsL37PFXa9H4U03Nb8kAfTcr_ceISFkzgxuilrbaVTnR_QPIZQYQutOM2iqsv98Qb4_m1jVBpmUVcA3IPEhWXkRjY_FhD1EdvEyKuUXhj67q7qSZ32lGZA";
	let environment = 'development'
	if (sails.config.PAYTM_FRONT_WEB_URL == "https://landx.co.in" || sails.config.PAYTM_FRONT_WEB_URL == "https://beta.landx.co.in") {
		environment = 'production'
	}

	var serverKey = constantObj.pushNotificationInfo[environment].serverKey

	var validDeviceRegistrationToken = token;

	var fcmCli = new FCM(serverKey);

	var msg = JSON.stringify(data.message);
	var payloadOK = {
		to: validDeviceRegistrationToken,
		data: { //some data object (optional)			
			value: data
		},
		priority: 'high',
		content_available: true,
		notification: { //notification object
			title: 'FarmX',
			body: data.message,
			sound: "landx_notification_digicoin.wav",
			badge: "1"
		}
	};
	// console.log('payloadOK',payloadOK);
	/*var callbackLog = function(sender, err, res) {
		return function() {
		}
	};*/

	fcmCli.send(payloadOK, function (err, res) {
		//return cb(null,res)	
		console.log("sdsss", res);
		return true;
	});
}