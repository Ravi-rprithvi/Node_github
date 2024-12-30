var Promise = require('bluebird'),
    promisify = Promise.promisify;
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var bcrypt    = require('bcrypt-nodejs');
var constantObj = sails.config.constants;

var transport = nodemailer.createTransport(smtpTransport({
    host: sails.config.appSMTP.host,
    port: sails.config.appSMTP.port,
    debug: sails.config.appSMTP.debug,
    auth: {
        user: sails.config.appSMTP.auth.user, //access using /congig/appSMTP.js
        pass: sails.config.appSMTP.auth.pass
    }
}));

/**
 * WebmailController
 *
 * @description :: Server-side logic for managing webmails
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

    sendMail : function (req ,res) {

        transport.sendMail({
            from: req.body.from,
            to: req.body.to,
            subject: req.body.subject,
            html: req.body.message
        }, function (err, info) {
            
           if(err){
				return res.jsonx({
					success: false,
					error: err
				});
		   }else {
				return Webmail.create(req.body).exec(function(err,data){
					if(err){
						return res.jsonx({
							success: false,
							error: err
						});
					}else {
						return res.jsonx({
							success: true,
							data:{
								data:data,
								message:"Mail has been sent successfully."
							}
						});
					}
				})
		   }
        });
    },

    list: function(req, res){
        Webmail.find({}).exec(function(err, data){
            return res.jsonx({
                success: true,
                data: data
            })
        })
    },

    sendMail1 : function(req, res){
        return API(commonService.send, req, res);
    },
	
};

