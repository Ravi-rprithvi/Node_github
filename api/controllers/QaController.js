/**
 * QaController
 *
 * @description :: Server-side logic for managing qas
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	getAllQuestions: function(req, res ) {
		return API(QaService.getAllQuestions, req, res);
	},
	
	myQuestions: function(req, res ) {
		return API(QaService.myQuestions, req, res);
	}
	
};

