/**
 * VehiclesController
 *
 * @description :: Server-side logic for managing wishlists
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

    add: function(req, res){
        return API(VehiclesService.save, req, res)
    },

    getAll: function(req, res){
        return API(VehiclesService.list, req, res)
    },

    update:function(req,res) {
        return API(VehiclesService.update, req, res)
    },

    get: function(req, res){
        return API(VehiclesService.get, req, res)
    },	
};

