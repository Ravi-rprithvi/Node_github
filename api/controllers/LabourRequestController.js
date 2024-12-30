var constantObj = sails.config.constants;
var commonServiceObj = require('../services/commonService.js');
var moment = require('moment')
/**
 * LabourRequestController
 *
 * @description :: Server-side logic for managing bids
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var ObjectId = require('mongodb').ObjectID;

var vm = this;

module.exports = {
	save: function(req, res) {
        return API(LabourRequestService.saveLabourRequest, req, res);
    },

    update: function(req, res) {
        return API(LabourRequestService.updateLabourRequest, req, res);
    },

    delete: function(req, res) {
        return API(LabourRequestService.deleteLabourRequest, req, res);
    },

    list: function(req,res) {

        var search = req.param('search');
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var sortBy = req.param('sortBy');

        var query = {};
        var sortquery ={};

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }
        count= parseInt(count);

        sortquery[field?field:'createdAt'] = sortType?(sortType=='desc'?-1:1):-1;

        // query.isDeleted = false;

        if (search) {
            query.$or = [
                            { createdBy: {$regex: search, '$options' : 'i'}},
                            { firstName:{$regex: search, '$options' : 'i'}}, 
                            { lastName:{$regex: search, '$options' : 'i'}}, 
                            { email:{$regex: search, '$options' : 'i'}}, 
                            { mobile:{$regex: search, '$options' : 'i'}}, 
                            { address:{$regex: search, '$options' : 'i'}}, 
                            { city:{$regex: search, '$options' : 'i'}},
                            { state:{$regex: search, '$options' : 'i'}}, 
                            { district:{$regex: search, '$options' : 'i'}}, 
                            { cropName:{$regex: search, '$options' : 'i'}}, 
                            { category:{$regex: search, '$options' : 'i'}}, 
                            { areaoffarm:{$regex: search, '$options' : 'i'}}, 
                            { description:{$regex: search, '$options' : 'i'}},
                            { typeofwork:{$regex: search, '$options' : 'i'}}
                        ]
        }

        //Filter on Location:        

        LabourRequest.native(function(err, croplist) {
            croplist.aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "createdBy",
                        foreignField: "_id",
                        as: "createdBy"
                    }
                },
                {
                    $unwind: '$createdBy'
                },                                
                {
                    $match: query
                }
            ],function (err, totalresults) {
                if (err){
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    }); 
                } else {
                    croplist.aggregate([
                        {
                            $lookup: {
                                from: "users",
                                localField: "createdBy",
                                foreignField: "_id",
                                as: "createdBy"
                            }
                        },
                        {
                            $unwind: '$createdBy'
                        }, 
                        {
                            $match: query
                        },
                        {
                            $sort: sortquery
                        },
                        {
                            $skip: skipNo
                        },
                        {
                            $limit: count
                        }
                    ],function (err, results) {
                        if (err){
                            return res.status(400).jsonx({
                                success: false,
                                error: err
                            }); 
                        } else {                           
                            return res.jsonx({
                                success: true,
                                data: {
                                    labourrequests: results,
                                    total: totalresults.length
                                },
                            });
                        }
                    });
                }
            });
           
        })
    },
};