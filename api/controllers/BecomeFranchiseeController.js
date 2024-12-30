
/**
 * BecomeFranchiseeController
 *
 * @description :: Server-side logic for managing Blog
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */




module.exports = {

    save: function (req, res) {
        API(BecomeFranchiseeService.saveFranchisee, req, res);

    },
    getAll: function (req, res) {
        API(BecomeFranchiseeService.getAllList, req, res);

    },
}