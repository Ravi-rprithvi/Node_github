/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */
var request = require('request')
module.exports.bootstrap = function (cb) {

  var CronJob = require('cron').CronJob
  //process.env.TZ = 'UTC';
  process.env.TZ = 'Asia/Kolkata';

  // It's very important to trigger this callback method when you are finished
  // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)

  // new CronJob('00 01 * * * 0-6', function () {
  //     commonService.finalBidStatus({}, function (err, success) {

  //     });
  // }, null, true, 'Asia/Kolkata');

  // new CronJob('00 02 * * * 0-6', function () {
  //     commonService.sellerPaymentStatus({}, function (err, success) {

  //     });
  // }, null, true, 'Asia/Kolkata');

  // new CronJob('00 03 * * * 0-6', function () {
  //     commonService.franchiseePaymentStatus({}, function (err, success) {

  //        		});
  //    	}, null, true, 'Asia/Kolkata');

  // new CronJob('10 * * * * *', function() {
  // new CronJob('00 05 * * * 0-6', function () {
  //     commonService.cropExpired({}, function (err, success) {

  //     });
  // }, null, true, 'Asia/Kolkata');

  // new CronJob('00 10 * * * 0-6', function () {
  //     commonService.inactiveUsers({}, function (err, success) {

  //     });
  // }, null, true, 'Asia/Kolkata');
  // new CronJob('00 05 * * * 0-6', function () {
  //     commonService.landExpired({}, function (err, success) {

  //     });
  // }, null, true, 'Asia/Kolkata');

  // new CronJob('00 10 * * * 0-6', function () {
  //     commonService.inactiveUsers({}, function (err, success) {

  //     });
  // }, null, true, 'Asia/Kolkata');

  /*new CronJob('00 12 * * * 0-6', function() {
      commonService.checkRefundStatus({}, function(err, success) {

//	new CronJob('00 00 08 * * 1-7', function() {        //runs every day at 08:00 AM
//      		commonService.UpdateSellerPaidStatus({}, function(err,success) {

  new CronJob('00 13 * * * 0-6', function () {
      commonService.makeDeliveredToReceivedStatus({}, function (err, success) {

//	new CronJob('00 00 08 * * 1-7', function() {        //runs every day at 08:00 AM
//      		commonService.UpdateFranchiseePaidStatus({}, function(err,success) {

  new CronJob('00 18 * * * 0-6', function () {
      commonService.makeDeliveredToReceivedStatusOrders({}, function (err, success) {


  // new CronJob('00 15 * * * 0-6', function () {
  //     commonService.logisticPaymentStatus({}, function (err, success) {

  //     });
  // }, null, true, 'Asia/Kolkata');

  // new CronJob('00 00 * * * 0-6', function () {        //runs every hour 
  //     commonService.onGoingTripStatuses({}, function (err, success) {

  //     });
  // }, null, true, 'Asia/Kolkata');

  new CronJob('00 15 03 * * 0-6', function () {        //runs every day at 03:15 AM
      commonService.buyerRefundedPaymentStatus({}, function (err, success) {

//        		});
//    	}, null, true, 'Asia/Kolkata');

  new CronJob('50 20 08 * * 0-6', function () {        //runs at 08:20:50 every day // seconds minutes hour dayOfMonth montth dayOfWeek
      commonService.sendRequirementSMStoBuyers({}, function (err, success) {

// 		new CronJob('00 02 * * * 1-7', function() {
//      		commonService.sellerPaymentStatus({}, function(err,success) {

  /*new CronJob('*//*1 * * * *', function() {
      commonService.deleteOrders(function(error, success) {
          if (success) {	               
              }
      });
  }, null, true, 'America/Chicago');*/

  // new CronJob('00 00 07 * * 0-6', function () {
  //     //runs every day at 7 AM
  //     commonService.dailyUploadedCropDetails({}, function (err, success) {
  //     });
  // }, null, true, 'Asia/Kolkata');

  // new CronJob('00 00 08 * * 0-6', function () {
  //     //runs every day of daily bid report at 8 AM
  //     commonService.dailyBidReports({}, function (err, success) {
  //     });
  // }, null, true, 'Asia/Kolkata');

  // new CronJob('00 00 09 * * 0-6', function () {
  //     // runs every day of daily transaction report at 9 AM
  //     commonService.dailyTransactionReports({}, function (err, success) {
  //     });
  // }, null, true, 'Asia/Kolkata');

  // new CronJob('00 00 10 * * 0-6', function () {
  //     //runs every day of daily registered user report at 10 AM
  //     commonService.dailyRegisteredUsers({}, function (err, success) {
  //     });
  // }, null, true, 'Asia/Kolkata');

  // new CronJob('00 02 */2 * * 0-6', function () {        //runs at second minute of every even hour // seconds minutes hour dayOfMonth montth dayOfWeek
  //     commonService.updateUserInFacilitationCharges({}, function (err, success) {

  //     // new CronJob('10 * * * * *', function() {
  //     new CronJob('00 05 * * * 1-7', function() {
  //         commonService.cropExpired({}, function(err,success) {

  // new CronJob('0 */10 * * * 0-6', function () {        //runs every 10 minute 
  //     console.log('This runs every 2 minutes for read email');
  //     commonService.readOrderEmail({}, function (err, success) {
  //     });

  // }, null, true, 'Asia/Kolkata');


  // new CronJob('0 0 */2 * * 0-6', function () {        //runs every 2 hour 
  //     var d = new Date();
  //     var hour = d.getHours();
  //     if (hour < 20 && hour > 9) {
  //         commonService.sendEmailToOrder({}, function (err, success) {

  //         });
  //     }
  // }, null, true, 'Asia/Kolkata');




  /*new CronJob('*//*1 * * * *', function() {
      commonService.closeCropByEndDate({}, function(error, success) {
  
         console.log( success );
  
      });
      }, null, true, 'America/Chicago');*/

  cb();

};
