/**
 * GroupController
 *
 * @description :: Server-side logic for managing groups
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	
	save: function(req,res)
	{
		API(GroupService.saveGroup, req, res);
	},
	show: function(req, res) {
        API(GroupService.get, req, res);
    },
	'userList/:id' : function(req,res)
	{
		API(GroupService.listUser, req, res);
	},
	'addUser/:id' : function(req,res)
	{
		API(GroupService.addMember, req, res);
	},

	getAllGroup: function(req, res, next) {

        var search = req.param('search');
        var sortBy = req.param('sortBy');
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var query = {};

        if (sortBy) {
            sortBy = sortBy.toString();
        } else {
            sortBy = 'createdAt desc';
        }

        query.isDeleted = 'false';

        if (search) {
            query.$or = [{
                    name: {
                        'like': '%' + search + '%'
                    }
                }

            ]
        }

        Groups.count(query).exec(function(err, total) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                Groups.find(query).sort(sortBy).skip(skipNo).limit(count).exec(function(err, groups) {
                    if (err) {
                        return res.status(400).jsonx({
                            success: false,
                            error: err
                        });

                    } else {
                    
                    	_.each(groups, function(d, index ) {
                   			groups[index].totalUser = d.users.length;
                    	})
                    	return res.jsonx({
		                    success: true,
		                    data: {
		                        groups: groups,
		                        total: total
		                    },
		                });
                   	}
                })
            }
        })
    },

    /*groupMember: function(req, res, next) {

        var page = req.param('page');
        var groupId = req.param('groupId');
       
       var ObjectID = require('mongodb').ObjectID;
        
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var sortBy = req.param('sortBy');
       
        var query = {};
        var sortquery ={};

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }
        count= parseInt(count);

        sortquery[field?field:'createdAt'] = sortType?(sortType=='desc'?-1:1):-1;

        //query.isDeleted = false;
        groupId = ObjectID(groupId);

        Groups.native(function(err, userlist) {
            userlist.aggregate([
                {
                    $unwind: '$users'
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "users",
                        foreignField: "_id",
                        as: "users"
                    }
                },
                // {
                //     $match: {"_id":groupId}
                // }
                // {
                //     $project: {
                //         id: "$_id",
                //         name: "$name",
                //         email: "$users.email",
                //         fullName: "$users.fullName",
                //         mobile: "$users.mobile"
                //     }
                // }

                // {
                //     $group:{
                //         _id:"$_id",
                //         "users":{$push:"$users"}
            
                //     }
                // }

                
            ],function (err, results) {
                if (err){
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    }); 
                } else {
                    return res.jsonx({
                        success: true,
                        data: {
                            results: results,
                            
                        },
                    });
                }
            });
        })
    },*/

    groupMembers : function(req, res, next) {

        var page        = req.param('page');
        var count       = req.param('count');
        var skipNo      = (page - 1) * count;
        //var search      = req.param('search');
        var groupId     = req.param('id');
        var query       = {};
    
      
        query.isDeleted = 'false';
        query.id = groupId;

        Groups.findOne(query).exec(function(err, group) {
            if (err) {
                return res.status(400).jsonx({
                   success: false,
                   error: err
                });

            } else {
                var groupUsers = group.users;
               
                sortBy = 'fullName desc';

                Users.find({id:{$in:groupUsers}}).sort(sortBy).skip(skipNo).limit(count).exec(function(err, userInfo) {
                    if(err){
                        return res.status(400).jsonx({
                           success: false,
                           error: err
                        });
                    } else {
                        group.users = userInfo;
                        return res.jsonx({
                            success: true,
                            data: {
                                //users: userInfo,
                                group: group,
                                total: groupUsers.length
                            },
                        });
                    }
                })
             
            }
       })    


    } 

};