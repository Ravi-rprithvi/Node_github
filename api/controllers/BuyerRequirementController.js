/**
 * BuyerRequirementController
 *
 * @description :: Server-side logic for managing sms
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var constantObj = sails.config.constants;

module.exports = {

	add: function (req, res) {
		API(BuyerRequirementService.save, req, res);
	},
	update: function (req, res) {
		API(BuyerRequirementService.update, req, res);
	},
	addForLand: function (req, res) {
		API(BuyerRequirementService.saveLandRequirement, req, res);
	},

	submitotp: function (req, res) {
		API(BuyerRequirementService.submitOTPToSubscribe, req, res);
	},

	updatesubscribe: function (req, res) {
		API(BuyerRequirementService.updateSubscribe, req, res);
	},

	list: function (req, res) {
		API(BuyerRequirementService.list, req, res);
	},

	verifyuser: function (req, res) {
		API(BuyerRequirementService.sendOTPToVerifyUser, req, res);
	},

	get: function (req, res) {
		API(BuyerRequirementService.get, req, res);
	},
	LandRequirements: function (req, res) {
		API(BuyerRequirementService.LandRequirements, req, res);
	},
	categoryWiseRequirements: function (req, res) {
		API(BuyerRequirementService.categoryWiseRequirements, req, res);
	},

	statesWiseRequirements: function (req, res) {
		API(BuyerRequirementService.statesWiseRequirements, req, res);
	},

	search: function (req, res) {
		API(BuyerRequirementService.search, req, res);
	}

};

