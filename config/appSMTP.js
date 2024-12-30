/*var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var transport = nodemailer.createTransport(smtpTransport({
host: sails.config.appSMTP.host,
port: sails.config.appSMTP.port,
debug: sails.config.appSMTP.debug,
auth: {
        user: sails.config.appSMTP.auth.user,
        pass: sails.config.appSMTP.auth.pass
      }

    }));*/
module.exports.appSMTP = { //appSmtp use in EndUserService.js
  service: "Gmail",
  host: 'smtp.gmail.com',
  port: 587,
  debug: true,
  sendmail: true,
  requiresAuth: true,
  domains: ["gmail.com", "googlemail.com"],

  auth: {
    user: 'help@efarmexchange.com',
    pass: 'resetpass@123'
    //user: 'smartdata.ms@gmail.com',
    // user: 'sdm.os46@gmail.com',
    // pass: 'Sde!@google#3443'
    // user: 'help@landx.co.in',
    // pass: 'password@08245'
    //pass: 'chd$$sdei022'
    //pass: 'mohali2378'
  }
}
