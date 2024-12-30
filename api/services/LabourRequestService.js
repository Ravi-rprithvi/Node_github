var Promise = require('bluebird'),
    promisify = Promise.promisify;
var constantObj = sails.config.constants;


module.exports = {
    
    saveLabourRequest: function(data,context,req,res){
    	data.createdBy = context.identity.id
    	return LabourRequest.create(data).exec(function(err,lr) {
    		if (err) {
    			return {
    				success:false,
    				error: {
    					code: 400,
    					message: err
    				}
    			}
    		} else {
    			return res.jsonx({
                    success:true,
                    key:"SUCCESSFULLY_SAVED_LABOURREQUEST",
                    message:"LabourRequest saved."
                })                
    		}
    	})
    },

    updateLabourRequest: function(data,context) {
    	return LabourRequest.findOne({id:data.id}).exec(function(err,lr) {
    		if (err) {
    			return {
    				success:false,
    				error: {
    					code: 400,
    					message: err
    				}
    			}
    		} else {
    			return LabourRequest.update({id:lr.id}, data).then(function(lrs) {
    				return {
    				success:true,
    				data: {
    					labourRequest:lrs[0],
	                    message: "LabourRequest saved",
	                    key: 'SUCCESSFULLY_SAVED_LABOURREQUEST',
	                }
    			}
    			}).fail(function(error) {
    				return {
	    				success:false,
	    				error: {
	    					code: 400,
	    					message: error
	    				}
	    			}
    			})  			
    		}
    	})
    },

    deleteLabourRequest: function(data,context){
    	return LabourRequest.findOne({id:data.id}).exec(function(err,lr) {
    		if (err) {
    			return {
    				success:false,
    				error: {
    					code: 400,
    					message: err
    				}
    			}
    		} else {
    			return LabourRequest.update({id:lr.id}, {isDeleted:true}).then(function(lrs) {
    				return {
    				success:true,
    				data: {
    					labourRequest:lrs[0],
	                    message: "LabourRequest delted",
	                    key: 'SUCCESSFULLY_DELTED_LABOURREQUEST',
	                }
    			}
    			}).fail(function(error) {
    				return {
	    				success:false,
	    				error: {
	    					code: 400,
	    					message: error
	    				}
	    			}
    			})  			
    		}
    	})
    },

    /*listLabourRequest: function(data,context) {
    	return LabourRequest.find({isDeleted:false}).exec(function(err,lrs) {
    		if (err) {
    			return {
    				success:false,
    				error: {
    					code: 400,
    					message: err
    				}
    			}
    		} else {
    			return {
    				success:true,
    				data: lrs
    			}
    		}
    	})
    }*/

};