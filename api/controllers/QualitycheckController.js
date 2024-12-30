

var Promise = require('q');
var path = require('path');
var constantObj = sails.config.constants;
var ObjectId = require('mongodb').ObjectID;
/**
 * CropsController
 *
 * @description :: Server-side logic for managing crops
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

    add: function (req, res) {

        var query = {};
        if (req.body.landexist == true) {
            query.landId = req.body.landid;
            query.landExist = true;
            query.images = req.body.images;
        } else {
            query.cropId = req.body.cropid;
            query.cropExist = req.body.cropexist;
        }
        query.quantity = req.body.quantity;
        query.parameters = req.body.parameters;
        query.comments = req.body.overallComment;
        query.rating = req.body.rating;
        query.addedBy = req.identity.id;
        query.userType = req.body.userType;

        Qualitycheck.create(query).exec(function (err, response) {

            if (response) {
                return res.jsonx({
                    success: true,
                    data: response,
                    message: "Quality added successfully."
                });
            } else {
                return res.jsonx({
                    success: false,
                    error: err
                });
            }
        })
    },


    getAllQuality: function (req, res) {

        /*var page        = req.param('page');
        var count       = req.param('count');
        var skipNo      = (page - 1) * count;*/
        var query = {};

        query.cropId = req.param('cropId');

        let sortBy = 'createdAt desc';

        Qualitycheck.find(query).sort(sortBy).populate('addedBy').exec(function (err, quality) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                return res.status(200).jsonx({
                    success: true,
                    data: quality
                });
            }
        });

        /*var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        var cropId = ObjectId(req.param('cropId'))

        Crops.findOne({_id:cropId}).exec(function(err, crop) {            
            if (err) {
                return res.status(400).jsonx({
                   success: false,
                   error: err
                });
            } else {
                Qualitycheck.find(query).sort(sortBy).populate('addedBy').then(function(quality) {
                    if (quality.length > 0) {
                        crop.quality = quality
                    }
                    return res.status(200).jsonx({
                        success: true,
                        data: crop
                    });
                }).fail(function(err) {
                    return res.status(400).jsonx({
                        success: true,
                        error: err
                    });                
                });
            }
        })*/
    },

    getQualityDetail: function (req, res) {
        var query = {};
        query.id = req.param('id');
        Qualitycheck.findOne(query).populate('addedBy').populate('cropId').exec(function (err, qualityInfo) {

            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                return res.status(200).jsonx({
                    success: true,
                    data: qualityInfo
                });
            }
        });
    },

    qualitiesDashboard: function (req, res) {
        var qry = {};
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = { "$in": pincode }
            }
        }

        if (req.param('userId') && req.param('userId') != undefined && req.param('userId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('userId'))

            qry.seller = userId
        }

        // qry.createdAt = {$lte: new Date(req.param('to'))}
        qry.$and = [{ createdAt: { $gte: new Date(req.param('from')) } }, { createdAt: { $lte: new Date(req.param('to')) } }]

        Qualitycheck.native(function (err, allQualities) {
            allQualities.aggregate([
                {
                    $lookup: {
                        from: 'crops',
                        localField: 'cropId',
                        foreignField: '_id',
                        as: "crop"
                    }
                },
                {
                    $unwind: '$crop'
                },
                {
                    $project: {
                        rating: "$rating",
                        pincode: "$crop.pincode",
                        createdAt: "$createdAt",
                        seller: "$crop.seller"
                    }
                },
                {
                    $match: qry
                },
                {
                    $group: {
                        _id: "$rating",
                        count: { $sum: 1 }
                    }
                }
            ], function (err, qualities) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: qualities
                    });
                }
            });
        })
    }
};