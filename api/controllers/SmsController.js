/**
 * SmsController
 *
 * @description :: Server-side logic for managing sms
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var constantObj = sails.config.constants;
var client = require('twilio')(constantObj.twillio.accountSid, constantObj.twillio.authToken);

module.exports = {

	groupMsg: function(req,res){
		API(SmsService.msg, req, res);
	} 
	
};

