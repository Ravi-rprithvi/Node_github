var Promise = require('q');
var path = require('path');
var constantObj = sails.config.constants;
var ObjectId = require('mongodb').ObjectID;
// var mongoose = require("mongoose");
// mongoose.connect( 'mongodb://devfarmx:devfarmx2780@52.34.207.5:27017/devfarmx' );
// var db = mongoose.connection.db

/**
 * TestimonialController
 *
 * @description :: Server-side logic for managing crops
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

    add: function (req, res) {
        API(TestimonialService.save, req, res);
    },

    delete: function (req, res) {
        API(TestimonialService.delete, req, res);
    },

    list: function (req, res) {
        API(TestimonialService.list, req, res);
    },

    get: function (req, res) {
        API(TestimonialService.get, req, res);
    },
}