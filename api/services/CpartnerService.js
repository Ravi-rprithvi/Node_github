var Promise = require('bluebird'),
    promisify = Promise.promisify;
var constantObj = sails.config.constants;

module.exports = {
    
    saveCpartner: function(data,context){

    	if((!data.name) || typeof data.name == undefined){ 
            return {"success": false, "error": {"code": 404,"message": constantObj.cpartners.NAME_REQUIRED,
                            key: 'NAME_REQUIRED'} };
        }

        if((!data.email) || typeof data.email == undefined){ 
            return {"success": false, "error": {"code": 404,"message": constantObj.cpartners.EMAIL_REQUIRED,
                            key: 'EMAIL_REQUIRED'} };
        }

        if((!data.mobile) || typeof data.mobile == undefined){ 
            return {"success": false, "error": {"code": 404,"message": constantObj.cpartners.MOBILE_REQUIRED,
                            key: 'MOBILE_REQUIRED'} };
        }

        if((!data.company_name) || typeof data.company_name == undefined){ 
            return {"success": false, "error": {"code": 404,"message": constantObj.cpartners.COMPANY_NAME_REQUIRED,
                            key: 'COMPANY_NAME_REQUIRED'} };
        } 

        if((!data.address) || typeof data.address == undefined){ 
            return {"success": false, "error": {"code": 404,"message": constantObj.cpartners.ADDRESS_REQUIRED,
                            key: 'ADDRESS_REQUIRED'} };
        }

        if((!data.pincode) || typeof data.pincode == undefined){ 
            return {"success": false, "error": {"code": 404,"message": constantObj.cpartners.PIADDRESS_REQUIREDNCODE_REQUIRED,
                            key: 'PIADDRESS_REQUIREDNCODE_REQUIRED'} };
        }   

        if((!data.city) || typeof data.city == undefined){ 
            return {"success": false, "error": {"code": 404,"message": constantObj.cpartners.CITY_REQUIRED,
                            key: 'CITY_REQUIRED'} };
        }
        if((!data.district) || typeof data.district == undefined){ 
            return {"success": false, "error": {"code": 404,"message": constantObj.cpartners.DISTRICT_REQUIRED,
                            key: 'DISTRICT_REQUIRED'} };
        } 
        if((!data.state) || typeof data.state == undefined){ 
            return {"success": false, "error": {"code": 404,"message": constantObj.cpartners.STATE_REQUIRED,
                            key: 'STATE_REQUIRED'} };
        }
      	
		data.createdBy = context.identity.id;
		
		let query = {}
		query.isDeleted = false,
		query.email = data.email,
		query.status =  "Active";

      	return Cpartners.findOne(query).then(function(cpartner) {
            
            if(cpartner) {
            	return {
                  	success: false,
                  	error: {
	                    code: 400,
	                    message: constantObj.cpartners.CPARTNER_ALREADY_EXIST,
                            key: 'CPARTNER_ALREADY_EXIST'
                    },
                };

            } else {
		        return Cpartners.create(data).then(function(channelPartner) {
	                return {
	                    success: true,
	                    code:200,
	                    data: {
	                        message: constantObj.cpartners.SAVED_PARTNERS,
                            key: 'SAVED_PARTNERS'
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

    editCpartner: function(data,context){

		data.createdBy = context.identity.id;
		
		let query = {}
	
		return Cpartners.update(data.id,data)
        .then(function (cpartner) {
            
			var result;
            
            if(cpartner){

                result = {
                    success: true,
                    data :{
                    	message: constantObj.cpartners.UPDATED_CPARTNER,
                            key: 'UPDATED_CPARTNER'
                    }
                };
                
            } else {
                result = {
              		success: false,
              		error: {
                        code: 404,
                        message: constantObj.cpartners.ISSUE_IN_UPDATE,
                            key: 'ISSUE_IN_UPDATE'
                        
                    },
          		};
            }

            return result;

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
};