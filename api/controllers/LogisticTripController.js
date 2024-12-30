/**
 * LogisticTripController
 *
 * @description :: Server-side logic for managing wishlists
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var Promise = require('q');
var path = require('path');
var constantObj = sails.config.constants;
var ObjectId = require('mongodb').ObjectID;

module.exports = {
    readLocation: function (req, res) {
        return API(LogisticTripService.readLocation, req, res)
    },
    resendTripOTTC: function (req, res) {
        return API(LogisticTripService.resendTripOTTC, req, res)
    },

    tripInfoFromOTTC: function (req, res) {
        return API(LogisticTripService.tripInfoFromOTTC, req, res)
    },

    changeStatusOfOrder: function (req, res) {
        return API(LogisticTripService.changeStatusOfOrder, req, res)
    },

    tripInfo: function (req, res) {
        return API(LogisticTripService.tripInfo, req, res)
    },

    updateLocations: function (req, res) {
        return API(LogisticTripService.updateLocations, req, res)
    },

    changeDestinationSequence: function (req, res) {
        return API(LogisticTripService.changeDestinationSequence, req, res)
    },

    removeOrderFromTrip: function (req, res) {
        return API(LogisticTripService.removeOrderFromTrip, req, res)
    },

    updateTimeFactor: function (req, res) {
        return API(LogisticTripService.updateTimeFactor, req, res)
    },

    updateTripLogisticInfo: function (req, res) {
        return API(LogisticTripService.updateTripLogisticInfo, req, res)
    },

    addPODInOrder: function (req, res) {
        return API(LogisticTripService.addPODInOrder, req, res)
    },

    requestOTTC: function (req, res) {
        return API(LogisticTripService.requestOTTC, req, res)
    },



    unexpireOTTC: function (req, res) {
        return API(LogisticTripService.unexpireOTTC, req, res)
    },



    getAllTrips: function (req, res) {
        var status = req.param('status');
        var runningStatus = req.param('runningStatus');

        var search = req.param('search');

        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;

        var sortBy = req.param('sortBy');

        var query = {};
        var sortquery = {};

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];

            sortquery[field] = sortType == 'desc' ? -1 : 1

        } else {
            sortquery['createdAt'] = -1
        }

        count = parseInt(count);


        if (status) {
            query.status = status
        }
        if (runningStatus) {
            query.runningStatus = runningStatus
        }

        if (search) {
            query.$or = [
                { code: parseInt(search) },
                { logisticPartner: { $regex: search, '$options': 'i' } },
                { vehicle: { $regex: search, '$options': 'i' } },
                { driver: { $regex: search, '$options': 'i' } },
                { OTTC: parseInt(search) },
            ]
        }


        LogisticTrip.native(function (err, trips) {
            trips.aggregate([
                {
                    $lookup: {
                        from: "lpartners",
                        localField: "logisticPartner",
                        foreignField: "_id",
                        as: "logisticPartner"
                    }
                },
                {
                    $unwind: '$logisticPartner'
                },
                {
                    $lookup: {
                        from: "vehicles",
                        localField: "vehicle",
                        foreignField: "_id",
                        as: "vehicle"
                    }
                },
                {
                    $unwind: '$vehicle'
                },
                {
                    $lookup: {
                        from: "drivers",
                        localField: "driver",
                        foreignField: "_id",
                        as: "driver"
                    }
                },
                {
                    $unwind: '$driver'
                },
                {
                    $match: query
                }
            ], function (err, totalresults) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    trips.aggregate([
                        {
                            $lookup: {
                                from: "lpartners",
                                localField: "logisticPartner",
                                foreignField: "_id",
                                as: "logisticPartner"
                            }
                        },
                        {
                            $unwind: '$logisticPartner'
                        },
                        {
                            $lookup: {
                                from: "vehicles",
                                localField: "vehicle",
                                foreignField: "_id",
                                as: "vehicle"
                            }
                        },
                        {
                            $unwind: '$vehicle'
                        },
                        {
                            $lookup: {
                                from: "drivers",
                                localField: "driver",
                                foreignField: "_id",
                                as: "driver"
                            }
                        },
                        {
                            $unwind: '$driver'
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
                    ], function (err, results) {
                        if (err) {
                            return res.status(400).jsonx({
                                success: false,
                                error: err
                            });
                        } else {
                            return res.jsonx({
                                success: true,
                                data: {
                                    trips: results,
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

