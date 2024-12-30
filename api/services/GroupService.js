var Promise = require('bluebird'),
    promisify = Promise.promisify;
var constantObj = sails.config.constants;


module.exports = {

	saveGroup: function(data,context)
	{
		if((!data.name) || typeof data.name == undefined){ 
            return {"success": false, "error": {"code": 404,"message": constantObj.groups.GROUPNAME_REQUIRED,
                            key: 'GROUPNAME_REQUIRED'} };
        }

        if((!data.users) || typeof data.users == undefined){ 
            return {"success": false, "error": {"code": 404,"message": constantObj.groups.USERS_REQUIRED,
                            key: 'USERS_REQUIRED'} };
        }
        //data.createdBy = context.identity.id;
		let query = {}
		query.name = data.name,
		query.isDeleted = false
		
        return Groups.findOne(query).then(function(group) {
          
            if(group) {
            	return {
                  	success: false,
                  	error: {
	                    code: 400,
	                    message: constantObj.groups.GROUP_ALREADY_EXIST,
                            key: 'GROUP_ALREADY_EXIST'
                    },
                };
            } else {
		        return Groups.create(data).then(function(group) {
	                return {
	                    success: true,
	                    code:200,
	                    data: {
	                        message:constantObj.groups.CREATE_GROUP,
                            key: 'CREATE_GROUP'
	                    },
	                };
		        })
		        .fail(function(err){
	        		return {
                  		success: false,
                  		error: {
                    		code: 400,
                    		message: err
                        },
              		};   
		    	});
           	}
	    });
	},

    get: function (data, context) {
        let Id = data.id;
        return Groups.findOne(Id).populate({path:'_id',model:'users'})
        .then(function(groupInfo){
                //return Users.find( {id:cropInfo.id} ).then(function (bids) {
                    return {   
                        success: true,
                        data: {
                            groupInfo:groupInfo
                        }
                    };
                //});
            });            
    },
	
    //listing User of Groups
    listUser : function(data, context){
    	return Groups.findOne({id: data.id}).then(function(users){
    		if(users){
    			return {"success":true,"code":200, "users":users.users};
    		}
    		else{
    			return{"success":false,"error":{"code":404,"message":constantObj.groups.FAILED,
                            key: 'FAILED'}}
    		}
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

    //addMember to Group
    addMember : function(data,context){
    	return Groups.update({id: data.id},{users:data.users, name:data.name}).then(function(users){
   		   if(users){
    			return {"success":true,"code":200, "message":constantObj.groups.SUCCESS,
                            key: 'FAILED'};
    		}
    		else{
    			return{"success":false,"error":{"code":404,"message":constantObj.groups.FAILED,
                            key: 'FAILED'}}
    		}
    	});
    }
};