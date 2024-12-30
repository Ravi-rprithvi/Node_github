var constantObj = sails.config.constants;
/**
 * NotificationController
 *
 * @description :: Server-side logic for managing equipment
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var pushService = require('../services/PushService.js');
module.exports = {


	getAllNotification: function (req, res) {

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
			query.$or = [
				{
					name: {
						'like': '%' + search + '%'
					}
				},
				{
					type: {
						'like': '%' + search + '%'
					}
				}
			]
		}
		Notifications.count(query).exec(function (err, total) {
			if (err) {
				return res.status(400).jsonx({
					success: false,
					error: err
				});
			} else {
				Notifications.find(query).sort(sortBy).skip(skipNo).limit(count).exec(function (err, notifications) {
					if (err) {
						return res.status(400).jsonx({
							success: false,
							error: err
						});
					} else {
						return res.jsonx({
							success: true,
							data: {
								notifications: notifications,
								total: total
							},
						});
					}
				})
			}
		})
	},

	getNotificationDetail: function (req, res) {
		//let Id = req.param('id')
		let productType = req.param('type')
		let populateField = '';

		let data = {};
		data.id = req.param('id')

		if (productType == 'crops') {
			populateField = 'crop';
		} else if (productType == 'equipment') {
			populateField = 'equipment';
		}

		Notifications.findOne(data).populate(populateField).populate('sellerId').exec(function (err, data) {
			if (err) {
				return res.status(400).jsonx({
					success: false,
					error: err
				});
			} else {
				return res.jsonx({
					success: true,
					data: data
				})
			}
		})
	},

	adminNotifications: function (req, res) {

		var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;



		var query = {}
		//query.$or = [{ sellerId: userId }, { buyerId: userId }, { sentTo: { $in: [userId] } }]
		// query.sentTo = {$in:[userId]}

		var page = req.param('page');
		var count = parseInt(req.param('count'));
		var skipNo = (page - 1) * count;
		var search = req.param('search');

		if (search) {
			query.$or = [
				{
					name: {
						'like': '%' + search + '%'
					}
				},
				{
					type: {
						'like': '%' + search + '%'
					}
				}
			]
		}

		Notifications.count(query).exec(function (err, total) {
			if (err) {
				return res.status(400).jsonx({
					success: false,
					error: err
				});
			} else {
				Notifications.find(query).sort('createdAt desc').skip(skipNo).limit(count).then(function (notifications) {
					return res.jsonx({
						success: true,
						data: {
							notifications: notifications,
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
	myNotifications: function (req, res) {

		var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

		var userId = req.identity.id

		if (req.param('user')) {
			userId = req.param('user')
		}

		var query = {}
		query.$or = [{ sellerId: userId }, { buyerId: userId }, { sentTo: { $in: [userId] } }]
		// query.sentTo = {$in:[userId]}

		var page = req.param('page');
		var count = parseInt(req.param('count'));
		var skipNo = (page - 1) * count;
		var search = req.param('search');

		if (search) {
			query.$or = [
				{
					name: {
						'like': '%' + search + '%'
					}
				},
				{
					type: {
						'like': '%' + search + '%'
					}
				}
			]
		}

		Notifications.count(query).exec(function (err, total) {
			if (err) {
				return res.status(400).jsonx({
					success: false,
					error: err
				});
			} else {
				Notifications.find(query).sort('createdAt desc').skip(skipNo).limit(count).then(function (notifications) {
					return res.jsonx({
						success: true,
						data: {
							notifications: notifications,
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

	read: function (req, res) {

		var idArray = []
		idArray = req.body.ids;
		let userId = req.identity.id

		async.each(idArray, function (notId, callback) {
			var query = {}
			query.id = notId

			Notifications.findOne(query).then(function (notif) {
				if (notif) {

					var readBy = notif.readBy
					readBy.push(userId)

					var update = {}
					update.readBy = readBy

					Notifications.update(query, update).then(function (message) {
						callback()
					}).fail(function (err) {
						callback(err)
					})
				} else {
					callback()
				}
			}).fail(function (err) {
				callback()
			})
		}, function (error) {
			if (error) {
				return res.status(400).jsonx({
					success: false,
					error: error
				});
			} else {
				return res.jsonx({
					success: true,
					data: 'success'
				});
			}
		});
	},

	unreadNotificationsCount: function (req, res) {
		var userId = req.identity.id
		if (req.param('user')) {
			userId = req.param('user')
		}
		var query = {}
		query.readBy = { $nin: [userId] }
		query.$or = [{ sellerId: userId }, { buyerId: userId }, { sentTo: { $in: [userId] } }]

		Notifications.count(query).exec(function (error, total) {
			if (error) {
				return res.status(400).jsonx({
					success: false,
					error: error
				});
			} else {
				return res.status(200).jsonx({
					success: true,
					data: total
				});
			}
		});
	},

	notifyUser: function (req, res) {
		let msg = req.body.message
		let messageKey = req.body.messageKey
		let productId = req.body.productId
		let user = req.body.user
		let productType = req.body.productType

		var sentBy = req.identity.id
		if (req.body.sentBy) {
			sentBy = req.body.sentBy
		}

		var notificationData = {};
		notificationData.productId = productId
		notificationData.user = user
		notificationData.productType = productType
		notificationData.sentTo = [user]

		notificationData.message = msg;
		notificationData.messageKey = messageKey
		notificationData.readBy = [];
		notificationData.sentBy = sentBy

		Notifications.create(notificationData).exec(function (err, notificationResponse) {
			if (err) {
				return res.status(400).jsonx({
					success: false,
					error: err
				});
			} else {
				if (notificationResponse) {
					sails.sockets.blast("general_notification", { message: msg, messageKey: messageKey, users: [user] });
				}

				pushService.sendPushToUsersWithNotificationInfo([user], notificationResponse)

				return res.status(200).jsonx({
					success: true,
					data: notificationResponse
				});
			}
		})
	}
};