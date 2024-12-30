var Promise = require('bluebird'),
    promisify = Promise.promisify;
var constantObj = sails.config.constants;

module.exports = {
    
    transaction : function(data, context){        
		/*return Payments.create(data).then(function(data){
			return {
				success: true,
				code: 200,
				data
			}
		})*/
	}

};
