var constantObj = sails.config.constants;
var commonServiceObj = require('../services/commonService.js');
var moment = require('moment')
/**
 * MessageController
 *
 * @description :: Server-side logic for managing bids
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var ObjectId = require('mongodb').ObjectID;

module.exports = {
	add: function(req, res) {
        var query ={};
        query.to =  req.body.to;
        query.message =  req.body.message;
        query.from =  req.identity.id;
        query.type = req.body.type;
        query.read = false
        if (req.body.relatedTo) {
        	query.relatedTo = req.body.relatedTo
        	query.relatedId = req.body.relatedId
        }        

        Message.create(query).then(function(response){
            Users.findOne({id:req.identity.id}).then(function(user) {
                if(response) {
                    response.fromName = user.fullName
                    sails.sockets.blast('notification', response);
                    return res.jsonx({
                        success: true,
                        data:response
                    });
                }                
            }).fail(function(error) {
                if(response) {
                    sails.sockets.blast('notification', response);
                    return res.jsonx({
                        success: true,
                        data:response
                    });
                }
            })
        }).fail(function(err){
            return {
                success: false,
                error: {
                    code: 400,
                    message: err
                },
            };
        });
    },

    getAllMessages: function(req,res) {
		var page        = req.param('page');
        var count       = req.param('count');
        var skipNo      = (page - 1) * count;

        var query       = {};
        query.to = req.identity.id;
        let sortBy = 'createdAt desc';

        Message.count(query).exec(function(error, total) {
        	if (error) {
                return res.status(400).jsonx({
                   success: false,
                   error: err
                });
        	} else {
	        	Message.find(query).sort(sortBy).populate('from').skip(skipNo).limit(count).exec(function(err, messages) {
		            if (err) {
		                return res.status(400).jsonx({
		                   success: false,
		                   error: err
		                });
		            } else {
		                return res.status(200).jsonx({
		                    success: true,
		                    data: {messages:messages, total: total}
		                });
		            }
		        });
	        }
        });
    },

    getConversation: function(req,res) {
		var page        = req.param('page');
        var count       = req.param('count');
        var skipNo      = (page - 1) * count;

        var query       = {};
        query.$or = [{ $and: [{to:req.identity.id}, {from:req.param('to')}] } , { $and: [{from:req.identity.id}, {to:req.param('to')}] }];
        // query.$or = [{from:req.identity.id}, {from:req.param('to')}];
        let sortBy = 'createdAt desc';

        Message.count(query).exec(function(error, total) {
        	if (error) {
                return res.status(400).jsonx({
                   success: false,
                   error: err
                });
        	} else {
		        Message.find(query).sort(sortBy).populate('to').populate('from').skip(skipNo).limit(count).exec(function(err, messages) {
		            if (err) {
		                return res.status(400).jsonx({
		                   success: false,
		                   error: err
		                });
		            } else {
		                return res.status(200).jsonx({
		                    success: true,
		                    data: {messages: messages, total:total}
		                });
		            }
		        });
		    }
		});
    },

    read: function(req, res) {
    	var query ={};
        query.id =  {$in:req.body.ids};

        var update = {}
        update.read = true
        update.readAt = new Date()

        Message.update(query, update).exec(function(err, message) {
        	if (err) {
                return res.status(400).jsonx({
                   success: false,
                   error: err
                });
            } else {
                return res.status(200).jsonx({
                    success: true,
                    data: 'success'
                });
            }
        })
    },

    getRelatedMessages: function(req, res) {
        var query ={};

    	query.relatedTo = req.param('relatedTo')
    	query.relatedId = req.param('relatedId')

    	if (req.param('from')) {
	        query.$or = [{from:req.identity.id}, {from:req.param('from')}];
            query.$or = [{to:req.identity.id}, {to:req.param('from')}];
    	}

		var page        = req.param('page');
        var count       = req.param('count');
        var skipNo      = (page - 1) * count;

        let sortBy = 'createdAt desc';

        Message.count(query).exec(function(error, total) {
        	if (error) {
                return res.status(400).jsonx({
                   success: false,
                   error: err
                });
        	} else {
		        Message.find(query).sort(sortBy).populate('to').populate('from').skip(skipNo).limit(count).exec(function(err, messages) {
		            if (err) {
		                return res.status(400).jsonx({
		                   success: false,
		                   error: err
		                });
		            } else {
		                return res.status(200).jsonx({
		                    success: true,
		                    data: {messages: messages, total:total}
		                });
		            }
		        });
		    }
		});
    },

    unreadMessagesCount: function (req, res) {
    	var query = {}
    	query.read = false
    	query.to = req.identity.id

    	Message.count(query).exec(function(error, total) {
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

    unreadMessages: function(req, res) {
    	var query = {}
    	query.read = false
    	query.to = req.identity.id

        let sortBy = 'createdAt desc'; 
   		var page        = req.param('page');
        var count       = req.param('count');
        var skipNo      = (page - 1) * count;   	

    	Message.count(query).exec(function(error, total) {
        	if (error) {
                return res.status(400).jsonx({
                   success: false,
                   error: err
                });
        	} else {
		        Message.find(query).sort(sortBy).populate('to').populate('from').skip(skipNo).limit(count).exec(function(err, messages) {
		            if (err) {
		                return res.status(400).jsonx({
		                   success: false,
		                   error: err
		                });
		            } else {
		                return res.status(200).jsonx({
		                    success: true,
		                    data: {messages: messages, total:total}
		                });
		            }
		        });
		    }
		});
    },

    communicationDashboard: function(req, res) {
        var query = {}
        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

        query.to = ObjectId(req.identity.id)
        query.$and = [{createdAt: {$gte: new Date(req.param('from'))}}, {createdAt: {$lte: new Date(req.param('to'))}}]

        Message.native(function(err, messages) {
            messages.aggregate([
            {
                $match: query
            },
            {
                $group: {
                    _id: {
                        type: "$type",
                        read: "$read"
                    },
                    count: {$sum: 1}
                }
            },
            {
                $group: {
                    _id:"$_id.type",
                    'read': {
                        $push: {
                            status: "$_id.read",
                            count: "$count"
                        }
                    }
                }
            }
            ], function(err, allVerified) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error:err
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

    communicationDashboardRepliedReceived: function(req, res) {
        var query = {}
        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

        let userId = ObjectId(req.identity.id)

        query.$or = [{to:userId}, {from:userId}]
        query.$and = [{createdAt: {$gte: new Date(req.param('from'))}}, {createdAt: {$lte: new Date(req.param('to'))}}]

        Message.native(function(err, messages) {
            messages.aggregate([
            {
                $match: query
            },
            /*{
                $addFields: {
                    repliedReceived:{
                        $cond:[{$ne: ["$from", userId]}, "received", "replied"]
                    }
                }
            },*/
            {
                $project: {
                    type: "$type",
                    repliedReceived: {
                        $cond:[{$ne: ["$from", userId]}, "Received", "Replied"]
                    }
                }
            },
            {
                $group: {
                    _id: {
                        type: "$type",
                        repliedReceived: "$repliedReceived"
                    },
                    count: {$sum: 1}
                }
            },
            {
                $group: {
                    _id:"$_id.type",
                    'repliedReceived': {
                        $push: {
                            status: "$_id.repliedReceived",
                            count: "$count"
                        }
                    }
                }
            }
            ], function(err, allVerified) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error:err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: allVerified
                    });
                }
            });
        })
    }
}