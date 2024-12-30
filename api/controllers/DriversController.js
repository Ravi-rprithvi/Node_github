/**
 * DriversController
 *
 * @description :: Server-side logic for managing wishlists
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

    add: function(req, res){
        return API(DriversService.save, req, res)
    },

    getAll: function(req, res){
        return API(DriversService.list, req, res)
    },

    update:function(req,res) {
        return API(DriversService.update, req, res)
    },

    get: function(req, res){
        return API(DriversService.get, req, res)
    },	
};

