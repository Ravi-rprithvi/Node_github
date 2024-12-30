var Promise = require('bluebird'),
    promisify = Promise.promisify;	
var constantObj = sails.config.constants;
var client = require('twilio')(constantObj.twillio.accountSid, constantObj.twillio.authToken);

module.exports = {
	msg : function(data, context,req,res) {
		if(data) {	
			if(data.id != '') {
				var totalMobile= [];
				return  Groups.findOne({id:data.id}).then(function(groups){
						
						async.each(groups.users, function(grpuser, callback) {
							Users.findOne({id:grpuser}).then(function(users){
								client.messages.create({
		 							to 		: 	constantObj.code.COUNTRY+""+users.mobile,
						  			from	: 	constantObj.twillio.outboundPhoneNumber,
						  			body	: 	data.message 
		 						},function(error, message){
						    		if (error) {
						    			return {"success": false, "error": {"message": constantObj.sms.SMS_ERROR } };
									} else {
										var record ={};
										record.to 	= message.to;
				        				record.message = message.body;
				        				record.group_id = data.id;
							    		Sms.create(record).exec(function(error, messages){
							    			if(error){ 
							    				return {"success": false, "error": {"message": constantObj.sms.SMS_ERROR} };
						            			}
								   	 	});
							    	}					    
								});

								callback();
							});
						},function(error){
		            		if(error){ 
		            			return res.status(400).jsonx({
			                   		success: false,
			                   		error:{
			                   			message:constantObj.sms.SMS_ERROR
			                   		}
								});
		            		} else {
		            			return res.status(200).jsonx({
			                   		success: true,
			                   		data:{
			                   			message:constantObj.sms.SMS_SENT
			                   		}
								});
		            		}
		            	});
				});
			} 
			if(data.mobile != '') {
				client.messages.create({
		      		to 		: 	constantObj.code.COUNTRY+""+data.mobile,
			  		from	: 	constantObj.twillio.outboundPhoneNumber,
			  		body	: 	data.message ,
 	    		},function(error , message){
	    			if (error) {
		      			return res.status(400).jsonx({
	                   		success: false,
	                   		error:{
	                   			message:constantObj.sms.SMS_ERROR
	                   		}
						});
		    		} else {
		    			var record ={};
			    		record.to 	= message.to;
				        record.message = message.body;
				        return API.Model(Sms).create(record).then(function(messages){
				        	if(messages) {
								return res.status(200).jsonx({
			                   		success: true,
			                   		data:{
			                   			message:constantObj.sms.SMS_SENT
			                   		}
								});
							} 							
				   	 	});
			    	}
			    });
			}
		}
	}
};
