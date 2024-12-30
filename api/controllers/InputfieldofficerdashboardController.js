/**
 * InputfieldofficerdashboardController
 *
 * @description :: Server-side logic for managing inputs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var ObjectId = require('mongodb').ObjectID;
var constantObj = sails.config.constants;
var commonServiceObj = require('./../services/commonService');

module.exports = {


    approvedInputDashboard: function(req, res) {
        var qry = {};
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if(pincode.length > 0){
              qry.pincode = { "$in": pincode}
            }
        }

        if (req.param('userId') && req.param('userId') != undefined && req.param('userId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('userId'))

            qry.seller = userId
        }

        qry.$and = [{createdAt: {$gte: new Date(req.param('from'))}}, {createdAt: {$lte: new Date(req.param('to'))}}]
        qry.isDeleted = false
        qry.isExpired = false

        Inputs.native(function(err, allinputs) {
            allinputs.aggregate([
            {
                $match: qry
            },
            {
                $project: {
                    approvestatus: {
                        $cond:[{$eq: ["$verified", "Yes"]}, "Verified", {
                            $cond:[{$eq: ["$isApproved", true]}, "Approved", "Not Approved"]
                        }]
                    }
                }
            },
            {
                $group: {
                    _id: "$approvestatus",
                    count: { $sum: 1 }
                }
            }
            ], function(err, inputs) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error:err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: inputs
                    });
                }
            });
        })
    },

    statusInputDashboard: function(req, res) {
        var qry = {};
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if(pincode.length > 0){
              qry.pincode = { "$in": pincode}
            }
        }

        if (req.param('userId') && req.param('userId') != undefined && req.param('userId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('userId'))

            qry.seller = userId
        }        

        qry.$and = [{createdAt: {$gte: new Date(req.param('from'))}}, {createdAt: {$lte: new Date(req.param('to'))}}]
        qry.isDeleted = false

        Inputs.native(function(err, allinputs) {
            allinputs.aggregate([
            {
                $match: qry
            },
            {
                $project: {
                    currentstatus: {
                        $cond:[{$eq: ["$leftAfterAcceptanceQuantity", 0]}, "SoldOut", {
                            $cond:[{$eq: ["$isExpired", false]}, "Active", {
                                $cond:[{$eq: ["$leftAfterAcceptanceQuantity", 0]}, "SoldOut", "Expired"]
                            }]
                        }]
                    },
                }
            },
            {
                $group: {
                    _id: "$currentstatus",
                    count: { $sum: 1 }
                }
            }
            ], function(err, inputs) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error:err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: inputs
                    });
                }
            });
        })
    },

    categoryInputDashboard: function(req, res) {
        var qry = {};
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if(pincode.length > 0){
              qry.pincode = { "$in": pincode}
            }
        }

        if (req.param('userId') && req.param('userId') != undefined && req.param('userId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('userId'))

            qry.seller = userId
        }

        qry.$and = [{createdAt: {$gte: new Date(req.param('from'))}}, {createdAt: {$lte: new Date(req.param('to'))}}]
        qry.isDeleted = false;
        qry.isExpired = false;

        Inputs.native(function(err, allinputs) {
            allinputs.aggregate([
            {
                $match: qry
            },
            {
                $lookup: {
                    from: 'category',
                    localField: 'category',
                    foreignField: '_id',
                    as: "category"
                }
            },
            {
                $unwind: '$category'
            },
            {
                $lookup: {
                    from: 'category',
                    localField: 'category.parentId',
                    foreignField: '_id',
                    as: "parentCategory"
                }
            },
            {
                $unwind: '$parentCategory'
            },
            {
                $project: {
                    category:"$category.name",
                    parentCategory:"$parentCategory.name"
                }
            },
            {
                $group: {
                    _id: {
                        parentCategory:"$parentCategory",
                        category:"$category"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id:"$_id.parentCategory",
                    'total': {$sum:"$count"},
                    'categories': {
                        $push: {
                            category: "$_id.category",
                            count: "$count"
                        }
                    }
                }
            }
            ], function(err, inputs) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error:err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: inputs
                    });
                }
            });
        })
    },




};