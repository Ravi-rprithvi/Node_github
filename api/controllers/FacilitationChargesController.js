

var Promise = require('q');
var path = require('path');
var constantObj = sails.config.constants;
var ObjectId = require('mongodb').ObjectID;
// var mongoose = require("mongoose");
// mongoose.connect( 'mongodb://devfarmx:devfarmx2780@52.34.207.5:27017/devfarmx' );
// var db = mongoose.connection.db

/**
 * FacilitationChargesController
 *
 * @description :: Server-side logic for managing crops
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

    add: function (req, res) {
        API(FacilitationChargesService.save, req, res);
    },

    get: function (req, res) {
        API(FacilitationChargesService.get, req, res);
    },

    listingMarket: function (req, res) {
        API(FacilitationChargesService.listMarket, req, res);
    },

    listingUser: function (req, res) {
        API(FacilitationChargesService.listUser, req, res);
    },

    edit: function (req, res) {
        API(FacilitationChargesService.update, req, res);
    },

    delete: function (req, res) {
        API(FacilitationChargesService.delete, req, res);
    },
}