var Promise = require('bluebird'),
    promisify = Promise.promisify;
var constantObj = sails.config.constants;
var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
var commonServiceObj = require('./commonService');
var commonService = require('./commonService');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var pushService = require('../services/PushService.js');
var changeNumberFormat = function (val) {
    if (val >= 10000000) val = (val / 10000000) + ' Cr';
    else if (val >= 100000) val = (val / 100000) + ' Lac';
    else if (val >= 1000) val = (val / 1000) + ' K';
    return val;
}
var transport = nodemailer.createTransport(smtpTransport({
    host: sails.config.appSMTP.host,
    port: sails.config.appSMTP.port,
    debug: sails.config.appSMTP.debug,
    auth: {
        user: sails.config.appSMTP.auth.user, //access using /congig/appSMTP.js
        pass: sails.config.appSMTP.auth.pass
    }
}));


module.exports = {
    todayMeetings: function (data, context, req, res) {
        let query = {}
        if (data.franchiseeId && data.franchiseeId != '') {
            let Ids = JSON.parse(data.franchiseeId);
            let frnIds = [];
            Ids.forEach(function (id) {
                frnIds.push(ObjectId(id))
            });

            query.franchiseeId = { $in: frnIds };
        }
        if (data.dealType) {
            query.dealType = data.dealType;
        }



        query.visitStatus = "scheduled";
        var page = data.page;
        var count = parseInt(data.count);
        var skipNo = (page - 1) * count;
        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        let endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        // console.log({ createdAt: { $gte: new Date(startDate) } }, { createdAt: { $lte: new Date(endDate) } }, '=====')
        query.$and = [{ dealDateTime: { $gte: new Date(startDate) } }, { dealDateTime: { $lte: new Date(endDate) } }]

        var suitableCrops;
        if (data.suitableCrops) suitableCrops = JSON.parse(data.suitableCrops);
        if (suitableCrops != undefined && suitableCrops.length > 0) {
            query.suitableCrops = { "$in": suitableCrops };
        }

        // console.log(new Date(endDate));
        LandVisitSchedules.native(function (error, landvisitschedules) {
            landvisitschedules.aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'buyerId',
                        foreignField: '_id',
                        as: "buyerusers"
                    }
                },
                {
                    $unwind: {
                        path: '$buyerusers',

                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'sellerId',
                        foreignField: '_id',
                        as: "sellerusers"
                    }
                },
                {
                    $unwind: {
                        path: '$sellerusers',

                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'franchiseeId',
                        foreignField: '_id',
                        as: "franchiseeusers"
                    }
                },
                {
                    $unwind: {
                        path: '$franchiseeusers',

                    }
                },
                {
                    $lookup: {
                        from: 'landinterests',
                        localField: 'landInterestId',
                        foreignField: '_id',
                        as: "landinterests"
                    }
                },
                {
                    $unwind: {
                        path: '$landinterests',

                    }
                },
                {
                    $lookup: {
                        from: "lands",
                        localField: 'landId',
                        foreignField: '_id',
                        as: "lands"
                    }
                }, {
                    $unwind: "$lands"
                },
                {
                    $project: {
                        id: "$_id",
                        dealId: "$landinterests.code",
                        dealType: "$landinterests.dealType",
                        landId: "$lands.code",
                        franchiseeId: "$franchiseeId",
                        Franchisee: "$franchiseeusers.fullName",
                        buyer: "$buyerusers.fullName",
                        seller: "$sellerusers.fullName",
                        visitStatus: "$visitStatus",
                        dateTime: "$visitTime",
                        createdAt: "$createdAt",
                        dealDateTime: "$dealDateTime",
                        suitableCrops: "$lands.suitableCrops",

                    }
                },

                { $match: query },




            ], function (error, totalResults) {
                // console.log(totalResults, 'totalResults=====')
                if (error) {
                    return res.jsonx({
                        success: false,
                        error: error
                    });
                } else {

                    landvisitschedules.aggregate([
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'buyerId',
                                foreignField: '_id',
                                as: "buyerusers"
                            }
                        },
                        {
                            $unwind: {
                                path: '$buyerusers',

                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'sellerId',
                                foreignField: '_id',
                                as: "sellerusers"
                            }
                        },
                        {
                            $unwind: {
                                path: '$sellerusers',

                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'franchiseeId',
                                foreignField: '_id',
                                as: "franchiseeusers"
                            }
                        },
                        {
                            $unwind: {
                                path: '$franchiseeusers',

                            }
                        },
                        {
                            $lookup: {
                                from: 'landinterests',
                                localField: 'landInterestId',
                                foreignField: '_id',
                                as: "landinterests"
                            }
                        },
                        {
                            $unwind: {
                                path: '$landinterests',

                            }
                        },
                        {
                            $lookup: {
                                from: 'lands',
                                localField: 'landId',
                                foreignField: '_id',
                                as: "lands"
                            }
                        },
                        {
                            $unwind: {
                                path: '$lands',

                            }
                        },

                        {
                            $project: {
                                id: "$_id",
                                dealId: "$landinterests.code",
                                dealType: "$landinterests.dealType",
                                landId: "$lands.code",
                                franchiseeId: "$franchiseeId",
                                Franchisee: "$franchiseeusers.fullName",
                                buyer: "$buyerusers.fullName",
                                seller: "$sellerusers.fullName",
                                visitStatus: "$visitStatus",
                                dateTime: "$visitTime",
                                createdAt: "$createdAt",
                                dealDateTime: "$dealDateTime",
                                suitableCrops: "$lands.suitableCrops"
                            }
                        },

                        { $match: query },

                        { $sort: { "createdAt": -1 } },
                        {
                            $skip: skipNo
                        },
                        {
                            $limit: count
                        },


                    ], function (err, results) {
                        // console.log(results)
                        if (err) {
                            return res.jsonx({
                                success: false,
                                error: err
                            });
                        } else {
                            // console.log(totalResults, 'totalResults===')
                            return res.jsonx({
                                success: true,
                                data: results,
                                total: totalResults.length

                            });




                        }

                    })




                }

            })
        })
    },

    todayDeals: function (data, context, req, res) {
        let query = {}
        if (data.franchiseeId && data.franchiseeId != '') {
            let Ids = JSON.parse(data.franchiseeId);
            let frnIds = [];
            Ids.forEach(function (id) {
                frnIds.push(ObjectId(id))
            });

            query.franchiseeId = { $in: frnIds };
        }
        if (data.dealType) {
            query.dealType = data.dealType
        }

        var suitableCrops;
        if (data.suitableCrops) suitableCrops = JSON.parse(data.suitableCrops);
        if (suitableCrops != undefined && suitableCrops.length > 0) {
            query.suitableCrops = { "$in": suitableCrops };
        }

        var page = data.page;
        var count = parseInt(data.count);
        var skipNo = (page - 1) * count;
        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        let endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        // console.log(new Date(startDate));
        query.$and = [{ createdAt: { $gte: new Date(startDate) } }, { createdAt: { $lte: new Date(endDate) } }]
        // console.log(new Date(endDate));
        // console.log(query, '====')
        Landinterests.native(function (error, landinterests) {
            landinterests.aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'buyerId',
                        foreignField: '_id',
                        as: "buyerusers"
                    }
                },
                {
                    $unwind: {
                        path: '$buyerusers',

                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'franchiseeId',
                        foreignField: '_id',
                        as: "franchiseeusers"
                    }
                },
                {
                    $unwind: {
                        path: '$franchiseeusers',

                    }
                },
                {
                    $lookup: {
                        from: "lands",
                        localField: 'landId',
                        foreignField: '_id',
                        as: "lands"
                    }
                }, {
                    $unwind: "$lands"
                },
                {
                    $project: {
                        id: "$_id",
                        franchiseeId: "$franchiseeId",
                        landId: "$landId",
                        dealType: "$dealType",
                        Franchisee: "$franchiseeusers.fullName",
                        createdAt: "$createdAt",
                        suitableCrops: "$lands.suitableCrops"
                    }
                },

                { $match: query },




            ], function (error, totalResults) {
                // console.log(results)
                if (error) {
                    return res.jsonx({
                        success: false,
                        error: error
                    });
                } else {

                    landinterests.aggregate([
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'buyerId',
                                foreignField: '_id',
                                as: "buyerusers"
                            }
                        },
                        {
                            $unwind: {
                                path: '$buyerusers',

                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'franchiseeId',
                                foreignField: '_id',
                                as: "franchiseeusers"
                            }
                        },
                        {
                            $unwind: {
                                path: '$franchiseeusers',

                            }
                        },
                        {
                            $lookup: {
                                from: "lands",
                                localField: 'landId',
                                foreignField: '_id',
                                as: "lands"
                            }
                        }, {
                            $unwind: "$lands"
                        },
                        {
                            $project: {
                                id: "$_id",
                                landId: "$landId",
                                franchiseeId: "$franchiseeId",
                                Franchisee: "$franchiseeusers.fullName",
                                buyer: "$buyerusers.fullName",
                                status: "$status",
                                dealType: "$dealType",
                                area: "$area",
                                areaUnit: "$areaUnit",
                                dealTotalAmount: "$dealTotalAmount",
                                suitableCrops: "$lands.suitableCrops"
                            }
                        },

                        { $match: query },

                        { $sort: { "createdAt": -1 } },
                        {
                            $skip: skipNo
                        },
                        {
                            $limit: count
                        },


                    ], function (err, results) {
                        // console.log(results)
                        if (err) {
                            return res.jsonx({
                                success: false,
                                error: err
                            });
                        } else {
                            // console.log(totalResults, 'totalResults===')
                            return res.jsonx({
                                success: true,
                                data: results,
                                total: totalResults.length

                            });




                        }

                    })




                }

            })
        })
    },
    topPerformanceFranchiseeLands: function (data, context, req, res) {
        let query = {}
        if (data.franchiseeId && data.franchiseeId != '') {
            let Ids = JSON.parse(data.franchiseeId);
            let frnIds = [];
            Ids.forEach(function (id) {
                frnIds.push(ObjectId(id))
            });

            query.franchiseeId = { $in: frnIds };
        }
        if (data.fromDate && data.toDate) {
            query.$and = [{
                createdAt: {
                    $gte: new Date(data.fromDate)
                }
            }, {
                createdAt: {
                    $lte: new Date(data.toDate)
                }
            }]
        }
        if (data.dealType) {
            query.dealType = data.dealType
        }
        var page = data.page;
        var count = parseInt(data.count);
        var skipNo = (page - 1) * count;

        var suitableCrops;
        if (data.suitableCrops) suitableCrops = JSON.parse(data.suitableCrops);
        if (suitableCrops != undefined && suitableCrops.length > 0) {
            query.suitableCrops = { "$in": suitableCrops };
        }

        Landinterests.native(function (error, landinterests) {
            landinterests.aggregate([

                {
                    $lookup: {
                        from: 'users',
                        localField: 'franchiseeId',
                        foreignField: '_id',
                        as: "franchiseeusers"
                    }
                },
                {
                    $unwind: {
                        path: '$franchiseeusers',

                    }
                },
                {
                    $lookup: {
                        from: "lands",
                        localField: 'landId',
                        foreignField: '_id',
                        as: "lands"
                    }
                }, {
                    $unwind: "$lands"
                },
                {
                    $project: {
                        id: "$_id",
                        franchiseeId: "$franchiseeId",
                        dealType: "$dealType",
                        landId: "$landId",
                        Franchisee: "$franchiseeusers.fullName",
                        createdAt: "$createdAt",
                        suitableCrops: "$lands.suitableCrops"

                    }
                },

                { $match: query },
                {
                    $group: {
                        _id: "$franchiseeId",
                        totalDeal: { $sum: 1 },
                        // landInfo: { $push: "$$ROOT" }
                    }
                },
                // { $unwind: "$landInfo" },
                // { $sort: { "totalDeal": -1 } },



            ], function (error, totalResults) {
                // console.log(results)
                if (error) {
                    return res.jsonx({
                        success: false,
                        error: error
                    });
                } else {

                    landinterests.aggregate([

                        {
                            $lookup: {
                                from: 'users',
                                localField: 'franchiseeId',
                                foreignField: '_id',
                                as: "franchiseeusers"
                            }
                        },
                        {
                            $unwind: {
                                path: '$franchiseeusers',

                            }
                        },
                        {
                            $lookup: {
                                from: "lands",
                                localField: 'landId',
                                foreignField: '_id',
                                as: "lands"
                            }
                        }, {
                            $unwind: "$lands"
                        },
                        {
                            $project: {
                                id: "$_id",
                                landId: "$landId",
                                franchiseeId: "$franchiseeId",
                                Franchisee: "$franchiseeusers.fullName",
                                status: "$status",
                                dealType: "$dealType",
                                createdAt: "$createdAt",
                                suitableCrops: "$lands.suitableCrops"

                            }
                        },

                        { $match: query },
                        {
                            $group: {
                                _id: "$franchiseeId",
                                totalDeal: { $sum: 1 },

                                saleDeal: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Sell"] }, 1, 0] } },
                                leaseDeal: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Lease"] }, 1, 0] } },
                                // landInfo: { $push: "$$ROOT" }
                                Franchisee: { $first: '$Franchisee' },
                            }
                        },
                        // { $unwind: "$landInfo" },
                        { $sort: { "totalDeal": -1 } },
                        {
                            $skip: skipNo
                        },
                        {
                            $limit: count
                        },


                    ], function (err, results) {
                        // console.log(results)
                        if (err) {
                            return res.jsonx({
                                success: false,
                                error: err
                            });
                        } else {
                            // console.log(totalResults, 'totalResults===')
                            return res.jsonx({
                                success: true,
                                data: results,
                                total: totalResults.length

                            });




                        }

                    })




                }

            })
        })
    },
    topDealFranchiseeLands: function (data, context, req, res) {
        let query = {}
        if (data.franchiseeId && data.franchiseeId != '') {
            let Ids = JSON.parse(data.franchiseeId);
            let frnIds = [];
            Ids.forEach(function (id) {
                frnIds.push(ObjectId(id))
            });

            query.franchiseeId = { $in: frnIds };
        }
        if (data.fromDate && data.toDate) {
            query.$and = [{
                createdAt: {
                    $gte: new Date(data.fromDate)
                }
            }, {
                createdAt: {
                    $lte: new Date(data.toDate)
                }
            }]
        }
        if (data.dealType) {
            query.dealType = data.dealType
        }
        var page = data.page;
        var count = parseInt(data.count);
        var skipNo = (page - 1) * count;
        var suitableCrops;
        if (data.suitableCrops) suitableCrops = JSON.parse(data.suitableCrops);
        if (suitableCrops != undefined && suitableCrops.length > 0) {
            query.suitableCrops = { "$in": suitableCrops };
        }

        Landinterests.native(function (error, landinterests) {
            landinterests.aggregate([

                {
                    $lookup: {
                        from: 'users',
                        localField: 'franchiseeId',
                        foreignField: '_id',
                        as: "franchiseeusers"
                    }
                },
                {
                    $unwind: {
                        path: '$franchiseeusers',

                    }
                },
                {
                    $lookup: {
                        from: "lands",
                        localField: 'landId',
                        foreignField: '_id',
                        as: "lands"
                    }
                }, {
                    $unwind: "$lands"
                },
                {
                    $project: {
                        id: "$_id",
                        landId: "$landId",
                        franchiseeId: "$franchiseeId",
                        Franchisee: "$franchiseeusers.fullName",
                        createdAt: "$createdAt",
                        suitableCrops: "$lands.suitableCrops",
                        dealType: "$dealType"

                    }
                },

                { $match: query },
                {
                    $group: {
                        _id: "$franchiseeId",
                        totalDeal: { $sum: 1 },
                        // landInfo: { $push: "$$ROOT" }
                    }
                },
                // { $unwind: "$landInfo" },
                // { $sort: { "totalDeal": -1 } },



            ], function (error, totalResults) {
                // console.log(results)
                if (error) {
                    return res.jsonx({
                        success: false,
                        error: error
                    });
                } else {

                    landinterests.aggregate([

                        {
                            $lookup: {
                                from: 'users',
                                localField: 'franchiseeId',
                                foreignField: '_id',
                                as: "franchiseeusers"
                            }
                        },
                        {
                            $unwind: {
                                path: '$franchiseeusers',

                            }
                        },
                        {
                            $lookup: {
                                from: "lands",
                                localField: 'landId',
                                foreignField: '_id',
                                as: "lands"
                            }
                        }, {
                            $unwind: "$lands"
                        },
                        {
                            $project: {
                                id: "$_id",
                                landId: "$landId",
                                franchiseeId: "$franchiseeId",
                                Franchisee: "$franchiseeusers.fullName",
                                status: "$status",
                                dealType: "$dealType",
                                createdAt: "$createdAt",
                                suitableCrops: "$lands.suitableCrops"
                            }
                        },

                        { $match: query },
                        {
                            $group: {
                                _id: "$franchiseeId",
                                totalDeal: { $sum: 1 },
                                successfullDeals: { "$sum": { "$cond": [{ "$eq": ["$status", "transferred"] }, 1, 0] } },
                                ongoingDeals: { $sum: { $cond: [{ $or: [{ $eq: ["$status", 'interested'] }, { $eq: ["$status", "revisit"] }, { $eq: ["$status", "deal_requested"] }, { $eq: ["$status", "deal_accepted"] }, { $eq: ["$status", "payments_done"] }] }, 1, 0] } },
                                unsuccessfullDeals: { $sum: { $cond: [{ $or: [{ $eq: ["$status", 'canceled'] }, { $eq: ["$status", "failed"] }] }, 1, 0] } },
                                saleDeal: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Sell"] }, 1, 0] } },
                                leaseDeal: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Lease"] }, 1, 0] } },
                                // landInfo: { $push: "$$ROOT" }
                                Franchisee: { $first: '$Franchisee' },
                                // viewed: { $first: '$viewed' },
                                // forSell: { $first: '$forSell' },
                                // forLease: { $first: '$forLease' },
                                // availableArea: { $first: '$availableArea' },
                            }
                        },
                        //{ $unwind: "$landInfo" },
                        { $sort: { "totalDeal": -1 } },
                        {
                            $skip: skipNo
                        },
                        {
                            $limit: count
                        },


                    ], function (err, results) {
                        // console.log(results)
                        if (err) {
                            return res.jsonx({
                                success: false,
                                error: err
                            });
                        } else {
                            // console.log(totalResults, 'totalResults===')
                            return res.jsonx({
                                success: true,
                                data: results,
                                total: totalResults.length

                            });




                        }

                    })




                }

            })
        })
    },

    topFranchiseeLands: function (data, context, req, res) {
        let query = {}
        if (data.franchiseeId && data.franchiseeId != '') {
            let Ids = JSON.parse(data.franchiseeId);
            let frnIds = [];
            Ids.forEach(function (id) {
                frnIds.push(ObjectId(id))
            });

            query.GM = { $in: frnIds };
        }
        if (data.fromDate && data.toDate) {
            query.$and = [{
                createdAt: {
                    $gte: new Date(data.fromDate)
                }
            }, {
                createdAt: {
                    $lte: new Date(data.toDate)
                }
            }]
        }
        if (data.dealType == 'Lease') {
            query.forLease = true
        }
        if (data.dealType == 'Sell') {
            query.forSell = true
        }

        var page = data.page;
        var count = parseInt(data.count);
        var skipNo = (page - 1) * count;

        var suitableCrops;
        if (data.suitableCrops) suitableCrops = JSON.parse(data.suitableCrops);
        if (suitableCrops != undefined && suitableCrops.length > 0) {
            query.suitableCrops = { "$in": suitableCrops };
        }

        Lands.native(function (error, lands) {
            lands.aggregate([
                {
                    $lookup: {
                        from: 'market',
                        localField: 'market',
                        foreignField: '_id',
                        as: "market"
                    }
                },
                {
                    $unwind: {
                        path: '$market',
                        preserveNullAndEmptyArrays: true
                    }
                },
                // {
                //     $lookup: {
                //         from: 'users',
                //         localField: 'market.GM',
                //         foreignField: '_id',
                //         as: "franchiseeusers"
                //     }
                // },
                // {
                //     $unwind: {
                //         path: '$franchiseeusers',

                //     }
                // },
                {
                    $project: {
                        id: "$_id",
                        GM: "$market.GM",
                        Franchisee: "$market.name",
                        viewed: "$viewed",
                        forSell: "$forSell",
                        forLease: "$forLease",
                        availableArea: "$availableArea",
                        createdAt: "$createdAt",
                        suitableCrops: "$suitableCrops",
                        forSell: "$forSell",
                        forLease: "$forLease"
                    }
                },

                { $match: query },
                // {
                //     $skip: skipNo
                // },
                // {
                //     $limit: count
                // },
                {
                    $group: {
                        _id: "$GM",
                        totalLand: { $sum: 1 },
                        Franchisee: { $first: '$Franchisee' },
                        viewed: { $sum: '$viewed' },
                        forSell: { $first: '$forSell' },
                        forLease: { $first: '$forLease' },
                        availableArea: { $first: '$availableArea' },


                        // landInfo: { $push: "$$ROOT" }
                    }
                },
                // { $unwind: "$landInfo" },
                // { $sort: { "landInfo.viewed": -1 } },




            ], function (error, totalResults) {
                // console.log(results)
                if (error) {
                    return res.jsonx({
                        success: false,
                        error: error
                    });
                } else {

                    lands.aggregate([
                        {
                            $lookup: {
                                from: 'market',
                                localField: 'market',
                                foreignField: '_id',
                                as: "market"
                            }
                        },
                        {
                            $unwind: {
                                path: '$market',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        // {
                        //     $lookup: {
                        //         from: 'users',
                        //         localField: 'market.GM',
                        //         foreignField: '_id',
                        //         as: "franchiseeusers"
                        //     }
                        // },
                        // {
                        //     $unwind: {
                        //         path: '$franchiseeusers',

                        //     }
                        // },
                        {
                            $project: {
                                id: "$_id",
                                GM: "$market.GM",
                                Franchisee: "$market.name",
                                viewed: "$viewed",
                                forSell: "$forSell",
                                forLease: "$forLease",
                                availableArea: "$availableArea",
                                createdAt: "$createdAt",
                                suitableCrops: "$suitableCrops",
                                forSell: "$forSell",
                                forLease: "$forLease"
                            }
                        },


                        {
                            $group: {
                                _id: "$GM",
                                totalLand: { $sum: 1 },
                                Franchisee: { $first: '$Franchisee' },
                                viewed: { $sum: '$viewed' },
                                forSell: { "$sum": { "$cond": [{ "$eq": ["$forSell", true] }, 1, 0] } },
                                forLease: { "$sum": { "$cond": [{ "$eq": ["$forLease", true] }, 1, 0] } },
                                availableArea: { $first: '$availableArea' },


                                // landInfo: { $push: "$$ROOT" }
                            }
                        },
                        { $match: query },
                        {
                            $skip: skipNo
                        },
                        {
                            $limit: count
                        },
                        // { $unwind: "$landInfo" },
                        // { $sort: { "landInfo.viewed": -1 } },



                    ], function (err, results) {
                        console.log(results)
                        if (err) {
                            return res.jsonx({
                                success: false,
                                error: err
                            });
                        } else {
                            console.log(totalResults.length, 'totalResults===')
                            return res.jsonx({
                                success: true,
                                data: results,
                                total: totalResults.length

                            });




                        }

                    })




                }

            })
        })
    },
    totalRevenueDuePaidPieChart: function (data, context, req, res) {
        let query = {};
        if (data.franchiseeId && data.franchiseeId != '') {
            let Ids = JSON.parse(data.franchiseeId);
            let frnIds = [];
            Ids.forEach(function (id) {
                frnIds.push(ObjectId(id))
            });

            query.franchiseeId = { $in: frnIds };
        }
        if (data.fromDate && data.toDate) {
            query.$and = [{
                createdAt: {
                    $gte: new Date(data.fromDate)
                }
            }, {
                createdAt: {
                    $lte: new Date(data.toDate)
                }
            }]
        }
        if (data.dealType) {
            query.dealType = data.dealType
        }
        var suitableCrops;
        if (data.suitableCrops) suitableCrops = JSON.parse(data.suitableCrops);
        if (suitableCrops != undefined && suitableCrops.length > 0) {
            query.suitableCrops = { "$in": suitableCrops };
        }

        if (data.selectedType == 'total_income') {
            Landinterests.native(function (error, landinterests) {
                landinterests.aggregate([
                    {
                        $lookup: {
                            from: "lands",
                            localField: 'landId',
                            foreignField: '_id',
                            as: "lands"
                        }
                    }, {
                        $unwind: "$lands"
                    }, {
                        $project: {
                            franchiseeId: "$franchiseeId",
                            suitableCrops: "$lands.suitableCrops",
                            createdAt: "$createdAt",
                            status: "$status",
                            dealTotalAmount: "$dealTotalAmount",
                            dealType: "$dealType"

                        }
                    },

                    { $match: query },
                    {
                        "$group": {

                            "_id": "$franchiseeId",


                            Due: {
                                $sum: {
                                    $cond: [{
                                        $or: [
                                            {
                                                $eq: ["$status", 'interested']
                                            },
                                            {
                                                $eq:
                                                    ["$status", "revisit"]
                                            },
                                            {
                                                $eq:
                                                    ["$status", "deal_requested"]
                                            },
                                            {
                                                $eq:
                                                    ["$status", "deal_accepted"]
                                            }
                                        ]
                                    },
                                        "$dealTotalAmount",
                                        0]
                                }
                            },
                            Paid: {
                                $sum: {
                                    $cond: [
                                        {
                                            $or: [
                                                {
                                                    $eq: ["$status", 'payments_done']
                                                },
                                                {
                                                    $eq: ["$status", "transferred"]
                                                }
                                            ]
                                        },
                                        "$dealTotalAmount",
                                        0]
                                }
                            },



                        }
                    }
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {
                        let Due = 0;
                        let Paid = 0;
                        for (let i = 0; i < results.length; i++) {
                            Paid = Paid + results[i].Paid;
                            Due = Due + results[i].Due;
                        }

                        Due = Math.floor(Due);
                        Paid = Math.floor(Paid);
                        let total = Math.floor(Due + Paid)
                        let duepart = Math.floor((Due * 100) / total)
                        let paidpart = Math.floor((Paid * 100) / total)
                        results = { Due: duepart, Paid: paidpart }
                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else if (data.selectedType == 'total_franchisee_commission') {
            FranchiseePayments.native(function (error, franchiseepayments) {
                franchiseepayments.aggregate([
                    {
                        $lookup: {
                            from: "landinterests",
                            localField: 'landInterestId',
                            foreignField: '_id',
                            as: "landinterests"
                        }
                    }, {
                        $unwind: "$landinterests"
                    }, {
                        $project: {
                            franchiseeId: "$franchiseeUserId",
                            // suitableCrops: "$lands.suitableCrops",
                            createdAt: "$createdAt",
                            status: "$landinterests.status",
                            dealTotalAmount: "$landinterests.dealTotalAmount",
                            dealType: "$landinterests.dealType"

                        }
                    },

                    { $match: query },
                    {
                        "$group": {

                            "_id": "$franchiseeId",


                            Due: {
                                $sum: {
                                    $cond: [{
                                        $or: [
                                            {
                                                $eq: ["$status", 'interested']
                                            },
                                            {
                                                $eq:
                                                    ["$status", "revisit"]
                                            },
                                            {
                                                $eq:
                                                    ["$status", "deal_requested"]
                                            },
                                            {
                                                $eq:
                                                    ["$status", "deal_accepted"]
                                            }
                                        ]
                                    },
                                        "$dealTotalAmount",
                                        0]
                                }
                            },
                            Paid: {
                                $sum: {
                                    $cond: [
                                        {
                                            $or: [
                                                {
                                                    $eq: ["$status", 'payments_done']
                                                },
                                                {
                                                    $eq: ["$status", "transferred"]
                                                }
                                            ]
                                        },
                                        "$dealTotalAmount",
                                        0]
                                }
                            },



                        }
                    }
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {
                        let Due = 0;
                        let Paid = 0;
                        for (let i = 0; i < results.length; i++) {
                            Paid = Paid + results[i].Paid;
                            Due = Due + results[i].Due;
                        }

                        Due = Math.floor(Due);
                        Paid = Math.floor(Paid);
                        let total = Math.floor(Due + Paid)
                        let duepart = Math.floor((Due * 100) / total)
                        let paidpart = Math.floor((Paid * 100) / total)
                        results = { Due: duepart, Paid: paidpart }
                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else if (data.selectedType == 'total_call') {
            ExotelCall.native(function (error, exotelcall) {
                exotelcall.aggregate([
                    {
                        $lookup: {
                            from: "landinterests",
                            localField: 'landInterestId',
                            foreignField: '_id',
                            as: "landinterests"
                        }
                    }, {
                        $unwind: "$landinterests"
                    }, {
                        $project: {
                            franchiseeId: "$landinterests.franchiseeId",
                            // suitableCrops: "$lands.suitableCrops",
                            createdAt: "$createdAt",
                            status: "$landinterests.status",
                            dealTotalAmount: "$landinterests.dealTotalAmount",
                            dealType: "$landinterests.dealType"

                        }
                    },

                    { $match: query },
                    {
                        "$group": {

                            "_id": "$franchiseeId",


                            Due: {
                                $sum: {
                                    $cond: [{
                                        $or: [
                                            {
                                                $eq: ["$status", 'interested']
                                            },
                                            {
                                                $eq:
                                                    ["$status", "revisit"]
                                            },
                                            {
                                                $eq:
                                                    ["$status", "deal_requested"]
                                            },
                                            {
                                                $eq:
                                                    ["$status", "deal_accepted"]
                                            }
                                        ]
                                    },
                                        "$dealTotalAmount",
                                        0]
                                }
                            },
                            Paid: {
                                $sum: {
                                    $cond: [
                                        {
                                            $or: [
                                                {
                                                    $eq: ["$status", 'payments_done']
                                                },
                                                {
                                                    $eq: ["$status", "transferred"]
                                                }
                                            ]
                                        },
                                        "$dealTotalAmount",
                                        0]
                                }
                            },



                        }
                    }
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {
                        let Due = 0;
                        let Paid = 0;
                        for (let i = 0; i < results.length; i++) {
                            Paid = Paid + results[i].Paid;
                            Due = Due + results[i].Due;
                        }

                        Due = Math.floor(Due);
                        Paid = Math.floor(Paid);
                        let total = Math.floor(Due + Paid)
                        let duepart = Math.floor((Due * 100) / total)
                        let paidpart = Math.floor((Paid * 100) / total)
                        results = { Due: duepart, Paid: paidpart }
                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else if (data.selectedType == 'total_land') {
            Landinterests.native(function (error, landinterests) {
                landinterests.aggregate([
                    {
                        $lookup: {
                            from: "lands",
                            localField: 'landId',
                            foreignField: '_id',
                            as: "lands"
                        }
                    }, {
                        $unwind: "$lands"
                    }, {
                        $project: {
                            franchiseeId: "$franchiseeId",
                            suitableCrops: "$lands.suitableCrops",
                            createdAt: "$createdAt",
                            status: "$status",
                            dealTotalAmount: "$dealTotalAmount",
                            dealType: "$dealType"

                        }
                    },

                    { $match: query },
                    {
                        "$group": {

                            "_id": "$franchiseeId",


                            Due: {
                                $sum: {
                                    $cond: [{
                                        $or: [
                                            {
                                                $eq: ["$status", 'interested']
                                            },
                                            {
                                                $eq:
                                                    ["$status", "revisit"]
                                            },
                                            {
                                                $eq:
                                                    ["$status", "deal_requested"]
                                            },
                                            {
                                                $eq:
                                                    ["$status", "deal_accepted"]
                                            }
                                        ]
                                    },
                                        "$dealTotalAmount",
                                        0]
                                }
                            },
                            Paid: {
                                $sum: {
                                    $cond: [
                                        {
                                            $or: [
                                                {
                                                    $eq: ["$status", 'payments_done']
                                                },
                                                {
                                                    $eq: ["$status", "transferred"]
                                                }
                                            ]
                                        },
                                        "$dealTotalAmount",
                                        0]
                                }
                            },



                        }
                    }
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {
                        let Due = 0;
                        let Paid = 0;
                        for (let i = 0; i < results.length; i++) {
                            Paid = Paid + results[i].Paid;
                            Due = Due + results[i].Due;
                        }

                        Due = Math.floor(Due);
                        Paid = Math.floor(Paid);
                        let total = Math.floor(Due + Paid)
                        let duepart = Math.floor((Due * 100) / total)
                        let paidpart = Math.floor((Paid * 100) / total)
                        results = { Due: duepart, Paid: paidpart }
                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else if (data.selectedType == 'total_deal') {
            Landinterests.native(function (error, landinterests) {
                landinterests.aggregate([
                    {
                        $lookup: {
                            from: "lands",
                            localField: 'landId',
                            foreignField: '_id',
                            as: "lands"
                        }
                    }, {
                        $unwind: "$lands"
                    }, {
                        $project: {
                            franchiseeId: "$franchiseeId",
                            suitableCrops: "$lands.suitableCrops",
                            createdAt: "$createdAt",
                            status: "$status",
                            dealTotalAmount: "$dealTotalAmount",
                            dealType: "$dealType"

                        }
                    },

                    { $match: query },
                    {
                        "$group": {

                            "_id": "$franchiseeId",


                            Due: {
                                $sum: {
                                    $cond: [{
                                        $or: [
                                            {
                                                $eq: ["$status", 'interested']
                                            },
                                            {
                                                $eq:
                                                    ["$status", "revisit"]
                                            },
                                            {
                                                $eq:
                                                    ["$status", "deal_requested"]
                                            },
                                            {
                                                $eq:
                                                    ["$status", "deal_accepted"]
                                            }
                                        ]
                                    },
                                        "$dealTotalAmount",
                                        0]
                                }
                            },
                            Paid: {
                                $sum: {
                                    $cond: [
                                        {
                                            $or: [
                                                {
                                                    $eq: ["$status", 'payments_done']
                                                },
                                                {
                                                    $eq: ["$status", "transferred"]
                                                }
                                            ]
                                        },
                                        "$dealTotalAmount",
                                        0]
                                }
                            },



                        }
                    }
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {
                        let Due = 0;
                        let Paid = 0;
                        for (let i = 0; i < results.length; i++) {
                            Paid = Paid + results[i].Paid;
                            Due = Due + results[i].Due;
                        }

                        Due = Math.floor(Due);
                        Paid = Math.floor(Paid);
                        let total = Math.floor(Due + Paid)
                        let duepart = Math.floor((Due * 100) / total)
                        let paidpart = Math.floor((Paid * 100) / total)
                        results = { Due: duepart, Paid: paidpart }
                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else if (data.selectedType == 'total_successfull') {
            query.$or = [{ status: "payments_done" }, { status: "transferred" }]
            Landinterests.native(function (error, landinterests) {
                landinterests.aggregate([
                    {
                        $lookup: {
                            from: "lands",
                            localField: 'landId',
                            foreignField: '_id',
                            as: "lands"
                        }
                    }, {
                        $unwind: "$lands"
                    }, {
                        $project: {
                            franchiseeId: "$franchiseeId",
                            suitableCrops: "$lands.suitableCrops",
                            createdAt: "$createdAt",
                            status: "$status",
                            dealTotalAmount: "$dealTotalAmount",
                            dealType: "$dealType"

                        }
                    },

                    { $match: query },
                    {
                        "$group": {

                            "_id": "$franchiseeId",


                            Due: {
                                $sum: {
                                    $cond: [{
                                        $or: [
                                            {
                                                $eq: ["$status", 'interested']
                                            },
                                            {
                                                $eq:
                                                    ["$status", "revisit"]
                                            },
                                            {
                                                $eq:
                                                    ["$status", "deal_requested"]
                                            },
                                            {
                                                $eq:
                                                    ["$status", "deal_accepted"]
                                            }
                                        ]
                                    },
                                        "$dealTotalAmount",
                                        0]
                                }
                            },
                            Paid: {
                                $sum: {
                                    $cond: [
                                        {
                                            $or: [
                                                {
                                                    $eq: ["$status", 'payments_done']
                                                },
                                                {
                                                    $eq: ["$status", "transferred"]
                                                }
                                            ]
                                        },
                                        "$dealTotalAmount",
                                        0]
                                }
                            },



                        }
                    }
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {
                        let Due = 0;
                        let Paid = 0;
                        for (let i = 0; i < results.length; i++) {
                            Paid = Paid + results[i].Paid;
                            Due = Due + results[i].Due;
                        }

                        Due = Math.floor(Due);
                        Paid = Math.floor(Paid);
                        let total = Math.floor(Due + Paid)
                        let duepart = Math.floor((Due * 100) / total)
                        let paidpart = Math.floor((Paid * 100) / total)
                        results = { Due: duepart, Paid: paidpart }
                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else if (data.selectedType == 'total_ongoing') {
            query.$or = [{ status: "interested" }, { status: "revisit" }, { status: "deal_accepted" }, { status: "revisit" }]
            Landinterests.native(function (error, landinterests) {
                landinterests.aggregate([
                    {
                        $lookup: {
                            from: "lands",
                            localField: 'landId',
                            foreignField: '_id',
                            as: "lands"
                        }
                    }, {
                        $unwind: "$lands"
                    }, {
                        $project: {
                            franchiseeId: "$franchiseeId",
                            suitableCrops: "$lands.suitableCrops",
                            createdAt: "$createdAt",
                            status: "$status",
                            dealTotalAmount: "$dealTotalAmount",
                            dealType: "$dealType"

                        }
                    },

                    { $match: query },
                    {
                        "$group": {

                            "_id": "$franchiseeId",


                            Due: {
                                $sum: {
                                    $cond: [{
                                        $or: [
                                            {
                                                $eq: ["$status", 'interested']
                                            },
                                            {
                                                $eq:
                                                    ["$status", "revisit"]
                                            },
                                            {
                                                $eq:
                                                    ["$status", "deal_requested"]
                                            },
                                            {
                                                $eq:
                                                    ["$status", "deal_accepted"]
                                            }
                                        ]
                                    },
                                        "$dealTotalAmount",
                                        0]
                                }
                            },
                            Paid: {
                                $sum: {
                                    $cond: [
                                        {
                                            $or: [
                                                {
                                                    $eq: ["$status", 'payments_done']
                                                },
                                                {
                                                    $eq: ["$status", "transferred"]
                                                }
                                            ]
                                        },
                                        "$dealTotalAmount",
                                        0]
                                }
                            },



                        }
                    }
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {
                        let Due = 0;
                        let Paid = 0;
                        for (let i = 0; i < results.length; i++) {
                            Paid = Paid + results[i].Paid;
                            Due = Due + results[i].Due;
                        }

                        Due = Math.floor(Due);
                        Paid = Math.floor(Paid);
                        let total = Math.floor(Due + Paid)
                        let duepart = Math.floor((Due * 100) / total)
                        let paidpart = Math.floor((Paid * 100) / total)
                        results = { Due: duepart, Paid: paidpart }
                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else if (data.selectedType == 'total_unsuccessfull') {
            query.$or = [{ status: "canceled" }, { status: "failed" }]
            Landinterests.native(function (error, landinterests) {
                landinterests.aggregate([
                    {
                        $lookup: {
                            from: "lands",
                            localField: 'landId',
                            foreignField: '_id',
                            as: "lands"
                        }
                    }, {
                        $unwind: "$lands"
                    }, {
                        $project: {
                            franchiseeId: "$franchiseeId",
                            suitableCrops: "$lands.suitableCrops",
                            createdAt: "$createdAt",
                            status: "$status",
                            dealTotalAmount: "$dealTotalAmount",
                            dealType: "$dealType"

                        }
                    },

                    { $match: query },
                    {
                        "$group": {

                            "_id": "$franchiseeId",


                            Due: {
                                $sum: {
                                    $cond: [{
                                        $or: [
                                            {
                                                $eq: ["$status", 'interested']
                                            },
                                            {
                                                $eq:
                                                    ["$status", "revisit"]
                                            },
                                            {
                                                $eq:
                                                    ["$status", "deal_requested"]
                                            },
                                            {
                                                $eq:
                                                    ["$status", "deal_accepted"]
                                            }
                                        ]
                                    },
                                        "$dealTotalAmount",
                                        0]
                                }
                            },
                            Paid: {
                                $sum: {
                                    $cond: [
                                        {
                                            $or: [
                                                {
                                                    $eq: ["$status", 'payments_done']
                                                },
                                                {
                                                    $eq: ["$status", "transferred"]
                                                }
                                            ]
                                        },
                                        "$dealTotalAmount",
                                        0]
                                }
                            },



                        }
                    }
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {
                        let Due = 0;
                        let Paid = 0;
                        for (let i = 0; i < results.length; i++) {
                            Paid = Paid + results[i].Paid;
                            Due = Due + results[i].Due;
                        }

                        Due = Math.floor(Due);
                        Paid = Math.floor(Paid);
                        let total = Math.floor(Due + Paid)
                        let duepart = Math.floor((Due * 100) / total)
                        let paidpart = Math.floor((Paid * 100) / total)
                        results = { Due: duepart, Paid: paidpart }
                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else if (data.selectedType == 'total_visit') {

            LandVisitSchedules.native(function (error, landvisitschedules) {
                landvisitschedules.aggregate([
                    {
                        $lookup: {
                            from: "landinterests",
                            localField: 'landInterestId',
                            foreignField: '_id',
                            as: "landinterests"
                        }
                    }, {
                        $unwind: "$landinterests"
                    }, {
                        $project: {
                            franchiseeId: "$franchiseeId",
                            //suitableCrops: "$lands.suitableCrops",
                            createdAt: "$createdAt",
                            status: "$landinterests.status",
                            dealTotalAmount: "$landinterests.dealTotalAmount",
                            dealType: "$landinterests.dealType"

                        }
                    },

                    { $match: query },
                    {
                        "$group": {

                            "_id": "$franchiseeId",


                            Due: {
                                $sum: {
                                    $cond: [{
                                        $or: [
                                            {
                                                $eq: ["$status", 'interested']
                                            },
                                            {
                                                $eq:
                                                    ["$status", "revisit"]
                                            },
                                            {
                                                $eq:
                                                    ["$status", "deal_requested"]
                                            },
                                            {
                                                $eq:
                                                    ["$status", "deal_accepted"]
                                            }
                                        ]
                                    },
                                        "$dealTotalAmount",
                                        0]
                                }
                            },
                            Paid: {
                                $sum: {
                                    $cond: [
                                        {
                                            $or: [
                                                {
                                                    $eq: ["$status", 'payments_done']
                                                },
                                                {
                                                    $eq: ["$status", "transferred"]
                                                }
                                            ]
                                        },
                                        "$dealTotalAmount",
                                        0]
                                }
                            },



                        }
                    }
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {
                        let Due = 0;
                        let Paid = 0;
                        for (let i = 0; i < results.length; i++) {
                            Paid = Paid + results[i].Paid;
                            Due = Due + results[i].Due;
                        }

                        Due = Math.floor(Due);
                        Paid = Math.floor(Paid);
                        let total = Math.floor(Due + Paid)
                        let duepart = Math.floor((Due * 100) / total)
                        let paidpart = Math.floor((Paid * 100) / total)
                        results = { Due: duepart, Paid: paidpart }
                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else if (data.selectedType == 'total_plan') {

            LandVisitSchedules.native(function (error, landvisitschedules) {
                landvisitschedules.aggregate([
                    {
                        $lookup: {
                            from: "landinterests",
                            localField: 'landInterestId',
                            foreignField: '_id',
                            as: "landinterests"
                        }
                    }, {
                        $unwind: "$landinterests"
                    }, {
                        $project: {
                            franchiseeId: "$franchiseeId",
                            //suitableCrops: "$lands.suitableCrops",
                            createdAt: "$createdAt",
                            status: "$landinterests.status",
                            dealTotalAmount: "$landinterests.dealTotalAmount",
                            dealType: "$landinterests.dealType"

                        }
                    },

                    { $match: query },
                    {
                        "$group": {

                            "_id": "$franchiseeId",


                            Due: {
                                $sum: {
                                    $cond: [{
                                        $or: [
                                            {
                                                $eq: ["$status", 'interested']
                                            },
                                            {
                                                $eq:
                                                    ["$status", "revisit"]
                                            },
                                            {
                                                $eq:
                                                    ["$status", "deal_requested"]
                                            },
                                            {
                                                $eq:
                                                    ["$status", "deal_accepted"]
                                            }
                                        ]
                                    },
                                        "$dealTotalAmount",
                                        0]
                                }
                            },
                            Paid: {
                                $sum: {
                                    $cond: [
                                        {
                                            $or: [
                                                {
                                                    $eq: ["$status", 'payments_done']
                                                },
                                                {
                                                    $eq: ["$status", "transferred"]
                                                }
                                            ]
                                        },
                                        "$dealTotalAmount",
                                        0]
                                }
                            },



                        }
                    }
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {
                        let Due = 0;
                        let Paid = 0;
                        for (let i = 0; i < results.length; i++) {
                            Paid = Paid + results[i].Paid;
                            Due = Due + results[i].Due;
                        }

                        Due = Math.floor(Due);
                        Paid = Math.floor(Paid);
                        let total = Math.floor(Due + Paid)
                        let duepart = Math.floor((Due * 100) / total)
                        let paidpart = Math.floor((Paid * 100) / total)
                        results = { Due: duepart, Paid: paidpart }
                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else {
            Landinterests.native(function (error, landinterests) {
                landinterests.aggregate([
                    {
                        $lookup: {
                            from: "lands",
                            localField: 'landId',
                            foreignField: '_id',
                            as: "lands"
                        }
                    }, {
                        $unwind: "$lands"
                    }, {
                        $project: {
                            franchiseeId: "$franchiseeId",
                            suitableCrops: "$lands.suitableCrops",
                            createdAt: "$createdAt",
                            status: "$status",
                            dealTotalAmount: "$dealTotalAmount",
                            dealType: "$dealType"

                        }
                    },

                    { $match: query },
                    {
                        "$group": {

                            "_id": "$franchiseeId",


                            Due: {
                                $sum: {
                                    $cond: [{
                                        $or: [
                                            {
                                                $eq: ["$status", 'interested']
                                            },
                                            {
                                                $eq:
                                                    ["$status", "revisit"]
                                            },
                                            {
                                                $eq:
                                                    ["$status", "deal_requested"]
                                            },
                                            {
                                                $eq:
                                                    ["$status", "deal_accepted"]
                                            }
                                        ]
                                    },
                                        "$dealTotalAmount",
                                        0]
                                }
                            },
                            Paid: {
                                $sum: {
                                    $cond: [
                                        {
                                            $or: [
                                                {
                                                    $eq: ["$status", 'payments_done']
                                                },
                                                {
                                                    $eq: ["$status", "transferred"]
                                                }
                                            ]
                                        },
                                        "$dealTotalAmount",
                                        0]
                                }
                            },



                        }
                    }
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {
                        let Due = 0;
                        let Paid = 0;
                        for (let i = 0; i < results.length; i++) {
                            Paid = Paid + results[i].Paid;
                            Due = Due + results[i].Due;
                        }

                        Due = Math.floor(Due);
                        Paid = Math.floor(Paid);
                        let total = Math.floor(Due + Paid)
                        let duepart = Math.floor((Due * 100) / total)
                        let paidpart = Math.floor((Paid * 100) / total)
                        results = { Due: duepart, Paid: paidpart }
                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
    },
    totalRevenuePieChart: function (data, context, req, res) {
        let query = {};
        if (data.franchiseeId && data.franchiseeId != '') {
            let Ids = JSON.parse(data.franchiseeId);
            let frnIds = [];
            Ids.forEach(function (id) {
                frnIds.push(ObjectId(id))
            });

            query.franchiseeId = { $in: frnIds };
        }
        if (data.fromDate && data.toDate) {
            query.$and = [{
                createdAt: {
                    $gte: new Date(data.fromDate)
                }
            }, {
                createdAt: {
                    $lte: new Date(data.toDate)
                }
            }]
        }
        var suitableCrops;
        if (data.suitableCrops) suitableCrops = JSON.parse(data.suitableCrops);
        if (suitableCrops != undefined && suitableCrops.length > 0) {
            query.suitableCrops = { "$in": suitableCrops };
        }
        if (data.dealType) {
            query.dealType = data.dealType
        }
        if (data.selectedType == 'total_income') {
            Landinterests.native(function (error, landinterests) {
                landinterests.aggregate([
                    {
                        $lookup: {
                            from: "lands",
                            localField: 'landId',
                            foreignField: '_id',
                            as: "lands"
                        }
                    }, {
                        $unwind: "$lands"
                    }, {
                        $project: {
                            franchiseeId: "$franchiseeId",
                            suitableCrops: "$lands.suitableCrops",
                            dealType: "$dealType",
                            dealTotalAmount: "$dealTotalAmount",
                            createdAt: "$createdAt",

                        }
                    },

                    { $match: query },
                    {
                        "$group": {

                            "_id": "$franchiseeId",

                            sale: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Sell"] }, "$dealTotalAmount", 0] } },
                            lease: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Lease"] }, "$dealTotalAmount", 0] } },


                        }
                    }
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {
                        let sale = 0;
                        let lease = 0;
                        for (let i = 0; i < results.length; i++) {
                            sale = sale + results[i].sale;
                            lease = lease + results[i].lease;
                        }
                        let total = Math.floor(sale + lease);
                        let salepart = Math.floor((sale * 100) / total)
                        let leasepart = Math.floor((lease * 100) / total)
                        results = { sale: salepart, lease: leasepart }
                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }

        else if (data.selectedType == 'total_franchisee_commission') {
            FranchiseePayments.native(function (error, franchiseepayments) {
                franchiseepayments.aggregate([
                    {
                        $lookup: {
                            from: "landinterests",
                            localField: 'landInterestId',
                            foreignField: '_id',
                            as: "landinterests"
                        }
                    }, {
                        $unwind: "$landinterests"
                    }, {
                        $project: {
                            franchiseeId: "$franchiseeUserId",
                            // suitableCrops: "$lands.suitableCrops",
                            dealType: "$landinterests.dealType",
                            dealTotalAmount: "$landinterests.dealTotalAmount",
                            createdAt: "$createdAt",

                        }
                    },

                    { $match: query },
                    {
                        "$group": {

                            "_id": "$franchiseeId",

                            sale: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Sell"] }, "$dealTotalAmount", 0] } },
                            lease: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Lease"] }, "$dealTotalAmount", 0] } },


                        }
                    }
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {
                        let sale = 0;
                        let lease = 0;
                        for (let i = 0; i < results.length; i++) {
                            sale = sale + results[i].sale;
                            lease = lease + results[i].lease;
                        }
                        let total = Math.floor(sale + lease);
                        let salepart = Math.floor((sale * 100) / total)
                        let leasepart = Math.floor((lease * 100) / total)
                        results = { sale: salepart, lease: leasepart }
                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else if (data.selectedType == 'total_call') {
            ExotelCall.native(function (error, exotelcall) {
                exotelcall.aggregate([
                    {
                        $lookup: {
                            from: "landinterests",
                            localField: 'landInterestId',
                            foreignField: '_id',
                            as: "landinterests"
                        }
                    }, {
                        $unwind: "$landinterests"
                    }, {
                        $project: {
                            franchiseeId: "$landinterests.franchiseeUserId",
                            // suitableCrops: "$lands.suitableCrops",
                            dealType: "$landinterests.dealType",
                            dealTotalAmount: "$landinterests.dealTotalAmount",
                            createdAt: "$createdAt",

                        }
                    },

                    { $match: query },
                    {
                        "$group": {

                            "_id": "$franchiseeId",

                            sale: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Sell"] }, "$dealTotalAmount", 0] } },
                            lease: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Lease"] }, "$dealTotalAmount", 0] } },


                        }
                    }
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {
                        let sale = 0;
                        let lease = 0;
                        for (let i = 0; i < results.length; i++) {
                            sale = sale + results[i].sale;
                            lease = lease + results[i].lease;
                        }
                        let total = Math.floor(sale + lease);
                        let salepart = Math.floor((sale * 100) / total)
                        let leasepart = Math.floor((lease * 100) / total)
                        results = { sale: salepart, lease: leasepart }
                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else if (data.selectedType == 'total_land') {
            Lands.native(function (error, lands) {
                lands.aggregate([

                    {
                        $lookup: {
                            from: 'market',
                            localField: 'market',
                            foreignField: '_id',
                            as: "market"
                        }
                    },
                    {
                        $unwind: {
                            path: '$market',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project: {
                            franchiseeId: "$market.GM",
                            forSell: "$forSell",
                            forLease: "$forLease",
                            sellPrice: "$sellPrice",
                            leasePrice: "$leasePrice",

                            createdAt: "$createdAt",
                            suitableCrops: "$suitableCrops"

                        }
                    },

                    { $match: query },
                    {
                        "$group": {

                            "_id": "$franchiseeId",

                            sale: { "$sum": { "$cond": [{ "$eq": ["$forSell", true] }, "$sellPrice", 0] } },
                            lease: { "$sum": { "$cond": [{ "$eq": ["$forLease", true] }, "$leasePrice", 0] } },


                        }
                    }
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {
                        let sale = 0;
                        let lease = 0;
                        for (let i = 0; i < results.length; i++) {
                            sale = sale + results[i].sale;
                            lease = lease + results[i].lease;
                        }
                        let total = Math.floor(sale + lease);
                        let salepart = Math.floor((sale * 100) / total)
                        let leasepart = Math.floor((lease * 100) / total)
                        results = { sale: salepart, lease: leasepart }
                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else if (data.selectedType == 'total_deal') {
            Landinterests.native(function (error, landinterests) {
                landinterests.aggregate([
                    {
                        $lookup: {
                            from: "lands",
                            localField: 'landId',
                            foreignField: '_id',
                            as: "lands"
                        }
                    }, {
                        $unwind: "$lands"
                    }, {
                        $project: {
                            franchiseeId: "$franchiseeId",
                            suitableCrops: "$lands.suitableCrops",
                            dealType: "$dealType",
                            dealTotalAmount: "$dealTotalAmount",
                            createdAt: "$createdAt",

                        }
                    },

                    { $match: query },
                    {
                        "$group": {

                            "_id": "$franchiseeId",

                            sale: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Sell"] }, "$dealTotalAmount", 0] } },
                            lease: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Lease"] }, "$dealTotalAmount", 0] } },


                        }
                    }
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {
                        let sale = 0;
                        let lease = 0;
                        for (let i = 0; i < results.length; i++) {
                            sale = sale + results[i].sale;
                            lease = lease + results[i].lease;
                        }
                        let total = Math.floor(sale + lease);
                        let salepart = Math.floor((sale * 100) / total)
                        let leasepart = Math.floor((lease * 100) / total)
                        results = { sale: salepart, lease: leasepart }
                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else if (data.selectedType == 'total_successfull') {
            query.$or = [{ status: "payments_done" }, { status: "transferred" }]
            Landinterests.native(function (error, landinterests) {
                landinterests.aggregate([
                    {
                        $lookup: {
                            from: "lands",
                            localField: 'landId',
                            foreignField: '_id',
                            as: "lands"
                        }
                    }, {
                        $unwind: "$lands"
                    }, {
                        $project: {
                            franchiseeId: "$franchiseeId",
                            suitableCrops: "$lands.suitableCrops",
                            dealType: "$dealType",
                            dealTotalAmount: "$dealTotalAmount",
                            createdAt: "$createdAt",

                        }
                    },

                    { $match: query },
                    {
                        "$group": {

                            "_id": "$franchiseeId",

                            sale: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Sell"] }, "$dealTotalAmount", 0] } },
                            lease: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Lease"] }, "$dealTotalAmount", 0] } },


                        }
                    }
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {
                        let sale = 0;
                        let lease = 0;
                        for (let i = 0; i < results.length; i++) {
                            sale = sale + results[i].sale;
                            lease = lease + results[i].lease;
                        }
                        let total = Math.floor(sale + lease);
                        let salepart = Math.floor((sale * 100) / total)
                        let leasepart = Math.floor((lease * 100) / total)
                        results = { sale: salepart, lease: leasepart }
                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else if (data.selectedType == 'total_ongoing') {

            query.$or = [{ status: "interested" }, { status: "revisit" }, { status: "deal_accepted" }, { status: "revisit" }]
            Landinterests.native(function (error, landinterests) {
                landinterests.aggregate([
                    {
                        $lookup: {
                            from: "lands",
                            localField: 'landId',
                            foreignField: '_id',
                            as: "lands"
                        }
                    }, {
                        $unwind: "$lands"
                    }, {
                        $project: {
                            franchiseeId: "$franchiseeId",
                            suitableCrops: "$lands.suitableCrops",
                            dealType: "$dealType",
                            dealTotalAmount: "$dealTotalAmount",
                            createdAt: "$createdAt",

                        }
                    },

                    { $match: query },
                    {
                        "$group": {

                            "_id": "$franchiseeId",

                            sale: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Sell"] }, "$dealTotalAmount", 0] } },
                            lease: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Lease"] }, "$dealTotalAmount", 0] } },


                        }
                    }
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {
                        let sale = 0;
                        let lease = 0;
                        for (let i = 0; i < results.length; i++) {
                            sale = sale + results[i].sale;
                            lease = lease + results[i].lease;
                        }
                        let total = Math.floor(sale + lease);
                        let salepart = Math.floor((sale * 100) / total)
                        let leasepart = Math.floor((lease * 100) / total)
                        results = { sale: salepart, lease: leasepart }
                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else if (data.selectedType == 'total_unsuccessfull') {

            query.$or = [{ status: "canceled" }, { status: "failed" }]
            Landinterests.native(function (error, landinterests) {
                landinterests.aggregate([
                    {
                        $lookup: {
                            from: "lands",
                            localField: 'landId',
                            foreignField: '_id',
                            as: "lands"
                        }
                    }, {
                        $unwind: "$lands"
                    }, {
                        $project: {
                            franchiseeId: "$franchiseeId",
                            suitableCrops: "$lands.suitableCrops",
                            dealType: "$dealType",
                            dealTotalAmount: "$dealTotalAmount",
                            createdAt: "$createdAt",

                        }
                    },

                    { $match: query },
                    {
                        "$group": {

                            "_id": "$franchiseeId",

                            sale: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Sell"] }, "$dealTotalAmount", 0] } },
                            lease: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Lease"] }, "$dealTotalAmount", 0] } },


                        }
                    }
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {
                        let sale = 0;
                        let lease = 0;
                        for (let i = 0; i < results.length; i++) {
                            sale = sale + results[i].sale;
                            lease = lease + results[i].lease;
                        }
                        let total = Math.floor(sale + lease);
                        let salepart = Math.floor((sale * 100) / total)
                        let leasepart = Math.floor((lease * 100) / total)
                        results = { sale: salepart, lease: leasepart }
                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else if (data.selectedType == 'total_visit') {

            LandVisitSchedules.native(function (error, landvisitschedules) {
                landvisitschedules.aggregate([
                    {
                        $lookup: {
                            from: "landinterests",
                            localField: 'landInterestId',
                            foreignField: '_id',
                            as: "landinterests"
                        }
                    }, {
                        $unwind: "$landinterests"
                    }, {
                        $project: {
                            franchiseeId: "$franchiseeId",
                            // suitableCrops: "$lands.suitableCrops",
                            dealType: "$landinterests.dealType",
                            dealTotalAmount: "$dealTotalAmount",
                            createdAt: "$createdAt",

                        }
                    },

                    { $match: query },
                    {
                        "$group": {

                            "_id": "$franchiseeId",

                            sale: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Sell"] }, "$dealTotalAmount", 0] } },
                            lease: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Lease"] }, "$dealTotalAmount", 0] } },


                        }
                    }
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {
                        let sale = 0;
                        let lease = 0;
                        for (let i = 0; i < results.length; i++) {
                            sale = sale + results[i].sale;
                            lease = lease + results[i].lease;
                        }
                        let total = Math.floor(sale + lease);
                        let salepart = Math.floor((sale * 100) / total)
                        let leasepart = Math.floor((lease * 100) / total)
                        results = { sale: salepart, lease: leasepart }
                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else if (data.selectedType == 'total_plan') {
            query.$and = [{ subscriptionId: { $ne: undefined } }, { subscriptionId: { $ne: null } }]
            Lands.native(function (error, lands) {
                lands.aggregate([
                    {
                        $lookup: {
                            from: 'market',
                            localField: 'market',
                            foreignField: '_id',
                            as: "market"
                        }
                    },
                    {
                        $unwind: {
                            path: '$market',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project: {
                            franchiseeId: "$market.GM",
                            forSell: "$forSell",
                            forLease: "$forLease",
                            sellPrice: "$sellPrice",
                            leasePrice: "$leasePrice",

                            createdAt: "$createdAt",
                            suitableCrops: "$suitableCrops"

                        }
                    },

                    { $match: query },
                    {
                        "$group": {

                            "_id": "$franchiseeId",

                            sale: { "$sum": { "$cond": [{ "$eq": ["$forSell", true] }, "$sellPrice", 0] } },
                            lease: { "$sum": { "$cond": [{ "$eq": ["$forLease", true] }, "$leasePrice", 0] } },


                        }
                    }
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {
                        let sale = 0;
                        let lease = 0;
                        for (let i = 0; i < results.length; i++) {
                            sale = sale + results[i].sale;
                            lease = lease + results[i].lease;
                        }
                        let total = Math.floor(sale + lease);
                        let salepart = Math.floor((sale * 100) / total)
                        let leasepart = Math.floor((lease * 100) / total)
                        results = { sale: salepart, lease: leasepart }
                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else {
            Landinterests.native(function (error, landinterests) {
                landinterests.aggregate([
                    {
                        $lookup: {
                            from: "lands",
                            localField: 'landId',
                            foreignField: '_id',
                            as: "lands"
                        }
                    }, {
                        $unwind: "$lands"
                    }, {
                        $project: {
                            franchiseeId: "$franchiseeId",
                            suitableCrops: "$lands.suitableCrops",
                            dealType: "$dealType",
                            franchiseeCommissionPercent: "$franchiseeCommissionPercent",
                            createdAt: "$createdAt",

                        }
                    },

                    { $match: query },
                    {
                        "$group": {

                            "_id": "$franchiseeId",

                            sale: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Sell"] }, "$franchiseeCommissionPercent", 0] } },
                            lease: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Lease"] }, "$franchiseeCommissionPercent", 0] } },


                        }
                    }
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {
                        let sale = 0;
                        let lease = 0;
                        for (let i = 0; i < results.length; i++) {
                            sale = sale + results[i].sale;
                            lease = lease + results[i].lease;
                        }
                        let total = Math.floor(sale + lease);
                        let salepart = Math.floor((sale * 100) / total)
                        let leasepart = Math.floor((lease * 100) / total)
                        results = { sale: salepart, lease: leasepart }
                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
    },
    totalFranchiseeCommisionDayWeekMonthWise: function (data, context, req, res) {
        let query = {};
        if (data.franchiseeId && data.franchiseeId != '') {
            let Ids = JSON.parse(data.franchiseeId);
            let frnIds = [];
            Ids.forEach(function (id) {
                frnIds.push(ObjectId(id))
            });

            query.franchiseeId = { $in: frnIds };
        }
        if (data.fromDate && data.toDate) {
            query.$and = [{
                createdAt: {
                    $gte: new Date(data.fromDate)
                }
            }, {
                createdAt: {
                    $lte: new Date(data.toDate)
                }
            }]
        } else {
            var date = new Date();
            var startDate = new Date(date.getFullYear(), date.getMonth(), 1);
            var endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            if (data.type == "day") {
                query.$and = [{ createdAt: { $gte: new Date(startDate) } }, { createdAt: { $lte: new Date(endDate) } }]
            }
            if (data.type == "week") {

                query.$and = [{ createdAt: { $gte: new Date(startDate) } }, { createdAt: { $lte: new Date(endDate) } }]
            }
        }
        let day = "day";
        if (data.type == "day") {
            day = "day";

        }
        else if (data.type == "week") {
            day = "week";
        }
        else if (data.type == "month") {
            day = "month";
        }
        else if (data.type == "year") {
            day = "year";
        }
        if (data.dealType) {
            query.dealType = data.dealType
        }
        var suitableCrops;
        if (data.suitableCrops) suitableCrops = JSON.parse(data.suitableCrops);
        if (suitableCrops != undefined && suitableCrops.length > 0) {
            query.suitableCrops = { "$in": suitableCrops };
        }


        Landinterests.native(function (error, landinterests) {
            landinterests.aggregate([
                {
                    $lookup: {
                        from: "lands",
                        localField: 'landId',
                        foreignField: '_id',
                        as: "lands"
                    }
                }, {
                    $unwind: "$lands"
                },

                {
                    $project: {
                        day: { "$dayOfMonth": "$createdAt" },
                        "week": { $floor: { $divide: [{ $dayOfMonth: "$createdAt" }, 7] } },
                        // week: { "$dayOfWeek": "$createdAt" },
                        month: { "$month": "$createdAt" },
                        year: { "$year": "$createdAt" },
                        dealType: "$dealType",
                        franchiseeCommissionPercent: "$franchiseeCommissionPercent",
                        franchiseeId: "$franchiseeId",
                        createdAt: "$createdAt",
                        suitableCrops: "$lands.suitableCrops",


                    }
                },
                { $match: query },

                {
                    "$group": {

                        "_id":
                        {
                            // franchisee: "$franchiseeId",
                            day: (day == "day") ? "$day" : (day == "week") ? "$week" : (day == "year") ? '$year' : "$month",
                            month: (day == "year") ? '$year' : "$month",
                            year: "$year",
                        },
                        sale: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Sell"] }, "$franchiseeCommissionPercent", 0] } },
                        lease: { "$sum": { "$cond": [{ "$eq": ["$dealType", "Lease"] }, "$franchiseeCommissionPercent", 0] } },


                    }
                },
                {
                    $sort: { "_id.month": -1, "_id.day": -1 }
                },

            ], function (error, results) {
                // console.log(results)
                if (error) {
                    return res.jsonx({
                        success: false,
                        error: error
                    });
                } else {

                    return res.jsonx({
                        success: true,
                        data: results,

                    });




                }

            })
        })
    },
    totalRevenueDayWeekMonthWise: function (data, context, req, res) {
        let query = {};
        if (data.franchiseeId && data.franchiseeId != '') {
            let Ids = JSON.parse(data.franchiseeId);
            let frnIds = [];
            Ids.forEach(function (id) {
                frnIds.push(ObjectId(id))
            });
            query.franchiseeId = { $in: frnIds };

        }
        if (data.fromDate && data.toDate) {
            query.$and = [{
                createdAt: {
                    $gte: new Date(data.fromDate)
                }
            }, {
                createdAt: {
                    $lte: new Date(data.toDate)
                }
            }]
        }
        else {
            var date = new Date();
            var startDate = new Date(date.getFullYear(), date.getMonth(), 1);
            var endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            //console.log('start==', startDate)
            //console.log('enddate==', endDate)

            if (data.type == "day") {
                query.$and = [{ createdAt: { $gte: new Date(startDate) } }, { createdAt: { $lte: new Date(endDate) } }]
            }
            if (data.type == "week") {

                query.$and = [{ createdAt: { $gte: new Date(startDate) } }, { createdAt: { $lte: new Date(endDate) } }]
            }
        }
        let day = "day";
        if (data.type == "day") {
            day = "day";
        }
        else if (data.type == "week") {
            day = "week";
        }
        else if (data.type == "month") {
            day = "month";
        }
        else if (data.type == "year") {
            day = "year";
        }
        var suitableCrops;
        if (data.suitableCrops) suitableCrops = JSON.parse(data.suitableCrops);
        if (suitableCrops != undefined && suitableCrops.length > 0) {
            query.suitableCrops = { "$in": suitableCrops };
        }
        if (data.dealType == 'Lease') {
            query.forLease = true;
        }
        if (data.dealType == 'Sell') {
            query.forSell = true
        }
        if (data.selectedType == 'total_income') {
            Landinterests.native(function (error, landinterests) {
                landinterests.aggregate([
                    {
                        $lookup: {
                            from: "lands",
                            localField: 'landId',
                            foreignField: '_id',
                            as: "lands"
                        }
                    }, {
                        $unwind: "$lands"
                    },

                    {
                        $project: {
                            day: { "$dayOfMonth": "$createdAt" },
                            week: { "$dayOfWeek": "$createdAt" },
                            month: { "$month": "$createdAt" },
                            year: { "$year": "$createdAt" },
                            dealType: "$dealType",

                            dealTotalAmount: "$dealTotalAmount",
                            franchiseeId: "$franchiseeId",
                            createdAt: "$createdAt",
                            suitableCrops: "$lands.suitableCrops",


                        }
                    },
                    { $match: query },

                    {
                        "$group": {


                            "_id": {
                                day: (day == "day") ? "$day" : (day == "week") ? "$week" : (day == "year") ? '$year' : "$month",
                                month: (day == "year") ? '$year' : "$month",
                                year: "$year",
                            },

                            forsell: { "$sum": { "$cond": [{ "$eq": ["$dealType", 'Sell'] }, "$dealTotalAmount", 0] } },
                            forLease: { "$sum": { "$cond": [{ "$eq": ["$dealType", 'Lease'] }, "$dealTotalAmount", 0] } },
                        }
                    },
                    {
                        $sort: { "_id.month": -1, "_id.day": -1 }
                    },

                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {

                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else if (data.selectedType == 'total_franchisee_commission') {

            FranchiseePayments.native(function (error, franchiseepayments) {
                franchiseepayments.aggregate([
                    {
                        $lookup: {
                            from: "landinterests",
                            localField: 'landInterestId',
                            foreignField: '_id',
                            as: "landinterests"
                        }
                    }, {
                        $unwind: "$landinterests"
                    },


                    {
                        $project: {
                            day: { "$dayOfMonth": "$createdAt" },
                            week: { "$dayOfWeek": "$createdAt" },
                            month: { "$month": "$createdAt" },
                            year: { "$year": "$createdAt" },
                            dealType: "$landinterests.dealType",
                            amount: "$amount",
                            dealTotalAmount: "$landinterests.dealTotalAmount",
                            franchiseeId: "$franchiseeUserId",
                            createdAt: "$createdAt",
                            //suitableCrops: "$lands.suitableCrops",


                        }
                    },
                    { $match: query },

                    {
                        "$group": {


                            "_id": {
                                day: (day == "day") ? "$day" : (day == "week") ? "$week" : (day == "year") ? '$year' : "$month",
                                month: (day == "year") ? '$year' : "$month",
                                year: "$year",
                            },

                            forsell: { "$sum": { "$cond": [{ "$eq": ["$dealType", 'Sell'] }, "$amount", 0] } },
                            forLease: { "$sum": { "$cond": [{ "$eq": ["$dealType", 'Lease'] }, "$amount", 0] } },
                        }
                    },
                    {
                        $sort: { "_id.month": -1, "_id.day": -1 }
                    },

                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {

                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })

        }
        else if (data.selectedType == 'total_call') {

            ExotelCall.native(function (error, exotelcall) {
                exotelcall.aggregate([
                    {
                        $lookup: {
                            from: "landinterests",
                            localField: 'landInterestId',
                            foreignField: '_id',
                            as: "landinterests"
                        }
                    }, {
                        $unwind: "$landinterests"
                    },


                    {
                        $project: {
                            day: { "$dayOfMonth": "$createdAt" },
                            week: { "$dayOfWeek": "$createdAt" },
                            month: { "$month": "$createdAt" },
                            year: { "$year": "$createdAt" },
                            dealType: "$landinterests.dealType",
                            amount: "$amount",
                            dealTotalAmount: "$landinterests.dealTotalAmount",
                            franchiseeId: "$franchiseeUserId",
                            createdAt: "$createdAt",
                            //suitableCrops: "$lands.suitableCrops",


                        }
                    },
                    { $match: query },

                    {
                        "$group": {


                            "_id": {
                                day: (day == "day") ? "$day" : (day == "week") ? "$week" : (day == "year") ? '$year' : "$month",
                                month: (day == "year") ? '$year' : "$month",
                                year: "$year",
                            },

                            forsell: { "$sum": { "$cond": [{ "$eq": ["$dealType", 'Sell'] }, "$dealTotalAmount", 0] } },
                            forLease: { "$sum": { "$cond": [{ "$eq": ["$dealType", 'Lease'] }, "$dealTotalAmount", 0] } },
                        }
                    },
                    {
                        $sort: { "_id.month": -1, "_id.day": -1 }
                    },

                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {

                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })

        }
        else if (data.selectedType == 'total_land') {
            Lands.native(function (error, lands) {
                lands.aggregate([

                    {
                        $lookup: {
                            from: 'market',
                            localField: 'market',
                            foreignField: '_id',
                            as: "market"
                        }
                    },
                    {
                        $unwind: {
                            path: '$market',
                            preserveNullAndEmptyArrays: true
                        }
                    },

                    {
                        $project: {
                            day: { "$dayOfMonth": "$createdAt" },
                            "week": { "$week": "$createdAt" },
                            month: { "$month": "$createdAt" },
                            year: { "$year": "$createdAt" },
                            forSell: "$forSell",
                            forLease: "$forLease",
                            sellPrice: "$sellPrice",
                            leasePrice: "$leasePrice",
                            "franchiseeId": "$market.GM",
                            createdAt: "$createdAt",
                            suitableCrops: "$suitableCrops",


                        }
                    },
                    { $match: query },
                    {
                        "$group": {

                            "_id": {
                                day: (day == "day") ? "$day" : (day == "week") ? "$week" : (day == "year") ? '$year' : "$month",
                                month: (day == "year") ? '$year' : "$month",
                                year: "$year",
                            },

                            forsell: { "$sum": { "$cond": [{ "$eq": ["$forSell", true] }, "$sellPrice", 0] } },
                            forLease: { "$sum": { "$cond": [{ "$eq": ["$forLease", true] }, "$leasePrice", 0] } },


                        }
                    },
                    {
                        $sort: { "_id.month": -1, "_id.day": -1 }
                    },
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {

                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })

        }
        else if (data.selectedType == 'total_deal') {
            Landinterests.native(function (error, landinterests) {
                landinterests.aggregate([
                    {
                        $lookup: {
                            from: "lands",
                            localField: 'landId',
                            foreignField: '_id',
                            as: "lands"
                        }
                    }, {
                        $unwind: "$lands"
                    },

                    {
                        $project: {
                            day: { "$dayOfMonth": "$createdAt" },
                            week: { "$dayOfWeek": "$createdAt" },
                            month: { "$month": "$createdAt" },
                            year: { "$year": "$createdAt" },
                            dealType: "$dealType",

                            dealTotalAmount: "$dealTotalAmount",
                            franchiseeId: "$franchiseeId",
                            createdAt: "$createdAt",
                            suitableCrops: "$lands.suitableCrops",


                        }
                    },
                    { $match: query },

                    {
                        "$group": {


                            "_id": {
                                day: (day == "day") ? "$day" : (day == "week") ? "$week" : (day == "year") ? '$year' : "$month",
                                month: (day == "year") ? '$year' : "$month",
                                year: "$year",
                            },

                            forsell: { "$sum": { "$cond": [{ "$eq": ["$dealType", 'Sell'] }, "$dealTotalAmount", 0] } },
                            forLease: { "$sum": { "$cond": [{ "$eq": ["$dealType", 'Lease'] }, "$dealTotalAmount", 0] } },
                        }
                    },
                    {
                        $sort: { "_id.month": -1, "_id.day": -1 }
                    },

                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {

                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else if (data.selectedType == 'total_successfull') {
            query.$or = [{ status: "payments_done" }, { status: "transferred" }]
            Landinterests.native(function (error, landinterests) {
                landinterests.aggregate([
                    {
                        $lookup: {
                            from: "lands",
                            localField: 'landId',
                            foreignField: '_id',
                            as: "lands"
                        }
                    }, {
                        $unwind: "$lands"
                    },

                    {
                        $project: {
                            day: { "$dayOfMonth": "$createdAt" },
                            week: { "$dayOfWeek": "$createdAt" },
                            month: { "$month": "$createdAt" },
                            year: { "$year": "$createdAt" },
                            dealType: "$dealType",

                            dealTotalAmount: "$dealTotalAmount",
                            franchiseeId: "$franchiseeId",
                            createdAt: "$createdAt",
                            suitableCrops: "$lands.suitableCrops",


                        }
                    },
                    { $match: query },

                    {
                        "$group": {


                            "_id": {
                                day: (day == "day") ? "$day" : (day == "week") ? "$week" : (day == "year") ? '$year' : "$month",
                                month: (day == "year") ? '$year' : "$month",
                                year: "$year",
                            },

                            forsell: { "$sum": { "$cond": [{ "$eq": ["$dealType", 'Sell'] }, "$dealTotalAmount", 0] } },
                            forLease: { "$sum": { "$cond": [{ "$eq": ["$dealType", 'Lease'] }, "$dealTotalAmount", 0] } },
                        }
                    },
                    {
                        $sort: { "_id.month": -1, "_id.day": -1 }
                    },

                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {

                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else if (data.selectedType == 'total_ongoing') {
            query.$or = [{ status: "interested" }, { status: "revisit" }, { status: "deal_accepted" }, { status: "revisit" }]
            Landinterests.native(function (error, landinterests) {
                landinterests.aggregate([
                    {
                        $lookup: {
                            from: "lands",
                            localField: 'landId',
                            foreignField: '_id',
                            as: "lands"
                        }
                    }, {
                        $unwind: "$lands"
                    },

                    {
                        $project: {
                            day: { "$dayOfMonth": "$createdAt" },
                            week: { "$dayOfWeek": "$createdAt" },
                            month: { "$month": "$createdAt" },
                            year: { "$year": "$createdAt" },
                            dealType: "$dealType",

                            dealTotalAmount: "$dealTotalAmount",
                            franchiseeId: "$franchiseeId",
                            createdAt: "$createdAt",
                            suitableCrops: "$lands.suitableCrops",


                        }
                    },
                    { $match: query },

                    {
                        "$group": {


                            "_id": {
                                day: (day == "day") ? "$day" : (day == "week") ? "$week" : (day == "year") ? '$year' : "$month",
                                month: (day == "year") ? '$year' : "$month",
                                year: "$year",
                            },

                            forsell: { "$sum": { "$cond": [{ "$eq": ["$dealType", 'Sell'] }, "$dealTotalAmount", 0] } },
                            forLease: { "$sum": { "$cond": [{ "$eq": ["$dealType", 'Lease'] }, "$dealTotalAmount", 0] } },
                        }
                    },
                    {
                        $sort: { "_id.month": -1, "_id.day": -1 }
                    },

                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {

                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else if (data.selectedType == 'total_unsuccessfull') {
            query.$or = [{ status: "canceled" }, { status: "failed" }]
            Landinterests.native(function (error, landinterests) {
                landinterests.aggregate([
                    {
                        $lookup: {
                            from: "lands",
                            localField: 'landId',
                            foreignField: '_id',
                            as: "lands"
                        }
                    }, {
                        $unwind: "$lands"
                    },

                    {
                        $project: {
                            day: { "$dayOfMonth": "$createdAt" },
                            week: { "$dayOfWeek": "$createdAt" },
                            month: { "$month": "$createdAt" },
                            year: { "$year": "$createdAt" },
                            dealType: "$dealType",

                            dealTotalAmount: "$dealTotalAmount",
                            franchiseeId: "$franchiseeId",
                            createdAt: "$createdAt",
                            suitableCrops: "$lands.suitableCrops",


                        }
                    },
                    { $match: query },

                    {
                        "$group": {


                            "_id": {
                                day: (day == "day") ? "$day" : (day == "week") ? "$week" : (day == "year") ? '$year' : "$month",
                                month: (day == "year") ? '$year' : "$month",
                                year: "$year",
                            },

                            forsell: { "$sum": { "$cond": [{ "$eq": ["$dealType", 'Sell'] }, "$dealTotalAmount", 0] } },
                            forLease: { "$sum": { "$cond": [{ "$eq": ["$dealType", 'Lease'] }, "$dealTotalAmount", 0] } },
                        }
                    },
                    {
                        $sort: { "_id.month": -1, "_id.day": -1 }
                    },

                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {

                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else if (data.selectedType == 'total_visit') {

            LandVisitSchedules.native(function (error, landvisitschedules) {
                landvisitschedules.aggregate([
                    {
                        $lookup: {
                            from: "landinterests",
                            localField: 'landInterestId',
                            foreignField: '_id',
                            as: "landinterests"
                        }
                    }, {
                        $unwind: "$landinterests"
                    },

                    {
                        $project: {
                            day: { "$dayOfMonth": "$createdAt" },
                            week: { "$dayOfWeek": "$createdAt" },
                            month: { "$month": "$createdAt" },
                            year: { "$year": "$createdAt" },
                            dealType: "$landinterests.dealType",

                            dealTotalAmount: "$landinterests.dealTotalAmount",
                            franchiseeId: "$franchiseeId",
                            createdAt: "$createdAt",
                            suitableCrops: "$lands.suitableCrops",


                        }
                    },
                    { $match: query },

                    {
                        "$group": {


                            "_id": {
                                day: (day == "day") ? "$day" : (day == "week") ? "$week" : (day == "year") ? '$year' : "$month",
                                month: (day == "year") ? '$year' : "$month",
                                year: "$year",
                            },

                            forsell: { "$sum": { "$cond": [{ "$eq": ["$dealType", 'Sell'] }, "$dealTotalAmount", 0] } },
                            forLease: { "$sum": { "$cond": [{ "$eq": ["$dealType", 'Lease'] }, "$dealTotalAmount", 0] } },
                        }
                    },
                    {
                        $sort: { "_id.month": -1, "_id.day": -1 }
                    },

                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {

                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
        else if (data.selectedType == 'total_plan') {
            query.$and = [{ subscriptionId: { $ne: undefined } }, { subscriptionId: { $ne: null } }]
            Lands.native(function (error, lands) {
                lands.aggregate([

                    {
                        $lookup: {
                            from: 'market',
                            localField: 'market',
                            foreignField: '_id',
                            as: "market"
                        }
                    },
                    {
                        $unwind: {
                            path: '$market',
                            preserveNullAndEmptyArrays: true
                        }
                    },

                    {
                        $project: {
                            day: { "$dayOfMonth": "$createdAt" },
                            "week": { "$week": "$createdAt" },
                            month: { "$month": "$createdAt" },
                            year: { "$year": "$createdAt" },
                            forSell: "$forSell",
                            forLease: "$forLease",
                            sellPrice: "$sellPrice",
                            leasePrice: "$leasePrice",
                            "franchiseeId": "$market.GM",
                            createdAt: "$createdAt",
                            suitableCrops: "$suitableCrops",


                        }
                    },
                    { $match: query },
                    {
                        "$group": {

                            "_id": {
                                day: (day == "day") ? "$day" : (day == "week") ? "$week" : (day == "year") ? '$year' : "$month",
                                month: (day == "year") ? '$year' : "$month",
                                year: "$year",
                            },

                            forsell: { "$sum": { "$cond": [{ "$eq": ["$forSell", true] }, "$sellPrice", 0] } },
                            forLease: { "$sum": { "$cond": [{ "$eq": ["$forLease", true] }, "$leasePrice", 0] } },


                        }
                    },
                    {
                        $sort: { "_id.month": -1, "_id.day": -1 }
                    },
                ], function (error, results) {
                    // console.log(results)
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {

                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })

        }
        else {
            Lands.native(function (error, lands) {
                lands.aggregate([

                    {
                        $lookup: {
                            from: 'market',
                            localField: 'market',
                            foreignField: '_id',
                            as: "market"
                        }
                    },
                    {
                        $unwind: {
                            path: '$market',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $lookup: {
                            from: 'market',
                            localField: 'market',
                            foreignField: '_id',
                            as: "market"
                        }
                    },
                    {
                        $unwind: {
                            path: '$market',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project: {
                            day: { "$dayOfMonth": "$createdAt" },
                            "week": { "$week": "$createdAt" },
                            month: { "$month": "$createdAt" },
                            year: { "$year": "$createdAt" },
                            forSell: "$forSell",
                            forLease: "$forLease",
                            sellPrice: "$sellPrice",
                            leasePrice: "$leasePrice",
                            "franchiseeId": "$market.GM",
                            createdAt: "$createdAt",
                            suitableCrops: "$suitableCrops",


                        }
                    },
                    { $match: query },
                    {
                        "$group": {

                            "_id": {
                                day: (day == "day") ? "$day" : (day == "week") ? "$week" : (day == "year") ? '$year' : "$month",
                                month: (day == "year") ? '$year' : "$month",
                                year: "$year",
                            },

                            forsell: { "$sum": { "$cond": [{ "$eq": ["$forSell", true] }, 1, 0] } },
                            forLease: { "$sum": { "$cond": [{ "$eq": ["$forLease", true] }, 1, 0] } },


                        }
                    },
                    {
                        $sort: { "_id.month": -1, "_id.day": -1 }
                    },
                ], function (error, results) {
                    // console.log(results)

                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: error
                        });
                    } else {

                        return res.jsonx({
                            success: true,
                            data: results,

                        });




                    }

                })
            })
        }
    },
    dashboardFranchiseeFo: function (data, context, req, res) {
        let query = {}

        if (data.franchiseeId) {
            let Ids = JSON.parse(data.franchiseeId);
            let frnIds = [];
            Ids.forEach(function (id) {
                frnIds.push(ObjectId(id))
            });

            query.GM = { $in: frnIds };
        }

        Market.find(query).then(function (franchisees) {
            var marketIds = [];
            let roleQuery = {}
            roleQuery.roles = "A"
            franchisees.forEach(function (item) {
                marketIds.push(item.id);
            });
            roleQuery.markets = { $in: marketIds }
            Users.find(roleQuery, { fields: ['fullName'] }).then(function (foUsers) {
                return res.jsonx({
                    success: true,
                    data: foUsers,

                });
            })

        })
    },
    dashboardLand: function (data, context, req, res) {
        let query = {}
        if (data.franchiseeId && data.franchiseeId != '') {
            var Ids = JSON.parse(data.franchiseeId);
            var frnIds = [];
            Ids.forEach(function (id) {
                frnIds.push(ObjectId(id))
            });

            query.franchiseeId = { $in: frnIds };
        }
        if (data.dealType) {
            query.dealType = data.dealType
        }
        var suitableCrops;
        if (data.suitableCrops) suitableCrops = JSON.parse(data.suitableCrops);
        if (suitableCrops != undefined && suitableCrops.length > 0) {
            query.suitableCrops = { "$in": suitableCrops };
        }
        if (data.fromDate && data.toDate) {
            query.$and = [{
                createdAt: {
                    $gte: new Date(data.fromDate)
                }
            }, {
                createdAt: {
                    $lte: new Date(data.toDate)
                }
            }]
        }
        // query.mediaCallStatus = "completed";
        // console.log(query, 'query===')
        Landinterests.native(function (error, landinterests) {
            landinterests.aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'franchiseeId',
                        foreignField: '_id',
                        as: "franchiseeUser"
                    }
                },
                {
                    $unwind: '$franchiseeUser'
                },
                // {
                //     $lookup: {
                //         from: "lands",
                //         localField: 'landinterests.landId',
                //         foreignField: 'lands._id',
                //         as: "lands"
                //     }
                // }, {
                //     $unwind: "$lands"
                // },

                {
                    $project:
                    {
                        "_id": "$_id",
                        "franchiseeId": "$franchiseeId",
                        "franchiseeUser": "$franchiseeUser.fullName",
                        "dealTotalAmount": "$dealTotalAmount",
                        "sellerAmountByFarmX": "$sellerAmountByFarmX",
                        "franchiseeCommissionPercent": "$franchiseeCommissionPercent",
                        "status": "$status",
                        // landId: "$lands._id",
                        dealType: "$dealType",
                        // callId: "$exotelcall._id",
                        // mediaCallStatus: "$exotelcall.mediaCallStatus",
                        createdAt: "$createdAt",
                        suitableCrops: "$lands.suitableCrops"

                    }

                },
                { $match: query },
                {
                    $group: {
                        _id: "$franchiseeId",
                        // totalRevenue: { $sum: "$dealTotalAmount" },
                        totalincome: { $sum: { $cond: [{ $or: [{ $eq: ["$status", 'transferred'] }, { $eq: ["$status", "payments_done"] }] }, '$sellerAmountByFarmX', 0] } },
                        totaldeals: { $sum: 1 },
                        successfullDeals: { "$sum": { "$cond": [{ "$eq": ["$status", "transferred"] }, 1, 0] } },
                        ongoingDeals: { $sum: { $cond: [{ $or: [{ $eq: ["$status", 'interested'] }, { $eq: ["$status", "revisit"] }, { $eq: ["$status", "deal_requested"] }, { $eq: ["$status", "deal_accepted"] }, { $eq: ["$status", "payments_done"] }] }, 1, 0] } },
                        unsuccessfullDeals: { $sum: { $cond: [{ $or: [{ $eq: ["$status", 'canceled'] }, { $eq: ["$status", "failed"] }] }, 1, 0] } },
                        franchiseeUser: { $first: "$franchiseeUser" },
                        // totalCall: { "$sum": { "$cond": [{ "$eq": ["$mediaCallStatus", "completed"] }, 1, 0] } },

                        //data: { $push: "$$ROOT" }
                    }
                }
            ], function (error, results) {
                // console.log(results)
                if (error) {
                    return res.jsonx({
                        success: false,
                        error: error
                    });
                } else {
                    let totalRevenue = 0;
                    let totalincome = 0;
                    let totaldeals = 0;
                    let successfullDeals = 0;
                    let ongoingDeals = 0;
                    let unsuccessfullDeals = 0;
                    for (let i = 0; i < results.length; i++) {
                        // totalRevenue = totalRevenue + results[i].totalRevenue;
                        totalincome = totalincome + results[i].totalincome;
                        totaldeals = totaldeals + results[i].totaldeals;
                        successfullDeals = successfullDeals + results[i].successfullDeals;
                        ongoingDeals = ongoingDeals + results[i].ongoingDeals;
                        unsuccessfullDeals = unsuccessfullDeals + results[i].unsuccessfullDeals

                    }
                    let qry = {}
                    qry.isDeleted = false;
                    if (data.franchiseeId && data.franchiseeId != '') {
                        let mrk = {}
                        mrk.GM = { "$in": frnIds };
                        // console.log(frnIds, 'frnds')
                        Market.find(mrk).then(function (market) {
                            var marketIds = [];
                            // console.log(market, 'market')
                            market.forEach(function (item) {
                                marketIds.push(ObjectId(item.id));
                            });
                            qry.market = { "$in": marketIds };
                            // console.log(qry, 'qry===')
                            Lands.native(function (error, lands) {
                                lands.aggregate([

                                    { $match: qry },
                                    {
                                        $group: {
                                            _id: "$market",
                                            totalRevenue: {
                                                $sum: {
                                                    $add: [
                                                        '$sellLandingPrice', '$leaseLandingPrice'
                                                    ]
                                                }
                                            },
                                        }
                                    }
                                ], function (err, res1) {

                                    for (let i = 0; i < res1.length; i++) {
                                        totalRevenue = totalRevenue + res1[i].totalRevenue;
                                    }
                                    totalRevenue = changeNumberFormat(parseInt(totalRevenue));
                                    totalincome = changeNumberFormat(parseInt(totalincome));
                                    results = { totalRevenue: totalRevenue, totalincome: totalincome, totaldeals: totaldeals, successfullDeals: successfullDeals, ongoingDeals: ongoingDeals, unsuccessfullDeals: unsuccessfullDeals }
                                    return res.jsonx({
                                        success: true,
                                        data: results,

                                    });

                                })
                            })

                        })
                    } else {
                        let qry = {};
                        qry.isDeleted = false;
                        Lands.native(function (error, lands) {
                            lands.aggregate([

                                { $match: qry },
                                {
                                    $group: {
                                        _id: "$market",
                                        totalRevenue: {
                                            $sum: {
                                                $add: [
                                                    '$sellLandingPrice', '$leaseLandingPrice'
                                                ]
                                            }
                                        },
                                    }
                                }
                            ], function (err, res1) {

                                for (let i = 0; i < res1.length; i++) {
                                    totalRevenue = totalRevenue + res1[i].totalRevenue;
                                }
                                totalRevenue = changeNumberFormat(parseInt(totalRevenue));
                                totalincome = changeNumberFormat(parseInt(totalincome));
                                results = { totalRevenue: totalRevenue, totalincome: totalincome, totaldeals: totaldeals, successfullDeals: successfullDeals, ongoingDeals: ongoingDeals, unsuccessfullDeals: unsuccessfullDeals }
                                return res.jsonx({
                                    success: true,
                                    data: results,

                                });


                            })
                        })
                    }





                }

            })
        })
    },

    totalCall: function (data, context, req, res) {
        let query = {}
        if (data.franchiseeId && data.franchiseeId != '') {
            let Ids = JSON.parse(data.franchiseeId);
            // console.log(Ids, 'ids===', Ids.length)
            let frnIds = [];
            Ids.forEach(function (id) {
                frnIds.push(ObjectId(id))
            });

            query.franchiseeId = { $in: frnIds };
        }
        if (data.fromDate && data.toDate) {
            query.$and = [{
                createdAt: {
                    $gte: new Date(data.fromDate)
                }
            }, {
                createdAt: {
                    $lte: new Date(data.toDate)
                }
            }]
        }

        var suitableCrops;
        if (data.suitableCrops) suitableCrops = JSON.parse(data.suitableCrops);
        if (suitableCrops != undefined && suitableCrops.length > 0) {
            query.suitableCrops = { "$in": suitableCrops };
        }
        if (data.dealType) {
            query.dealType = data.dealType
        }
        query.mediaCallStatus = 'completed';
        // console.log(query, 'query===')
        ExotelCall.native(function (error, exotelcall) {
            exotelcall.aggregate([

                {
                    $lookup: {
                        from: "landinterests",
                        localField: 'landInterestId',
                        foreignField: '_id',
                        as: "landinterests"
                    }
                }, {
                    $unwind: "$landinterests"
                },


                {
                    $project: {
                        _id: "$_id",
                        franchiseeId: "$landinterests.franchiseeId",
                        //callId: "$exotelcall._id",
                        mediaCallStatus: "$mediaCallStatus",
                        dealType: "$landinterests.dealType"
                    }
                },
                { $match: query },
                {
                    $group: {
                        _id: {
                            // franchiseeId: "$franchiseeId",
                            status: "$mediaCallStatus"
                        },
                        // totalCall: { $sum: 1 },
                        totalCall: { "$sum": { "$cond": [{ "$eq": ["$mediaCallStatus", "completed"] }, 1, 0] } },
                    }
                }


            ], function (error, results) {
                // console.log(results)
                if (error) {
                    return res.jsonx({
                        success: false,
                        error: error
                    });
                } else {

                    return res.jsonx({
                        success: true,
                        data: results,

                    });




                }

            })
        })
    },
    totalLandOfFranchisee: function (data, context, req, res) {
        let query = {}
        if (data.franchiseeId && data.franchiseeId != '') {
            let Ids = JSON.parse(data.franchiseeId);
            // console.log(Ids, 'ids===', Ids.length)
            let frnIds = [];
            Ids.forEach(function (id) {
                frnIds.push(ObjectId(id))
            });

            query.GM = { $in: frnIds };
        }
        if (data.fromDate && data.toDate) {
            query.$and = [{
                createdAt: {
                    $gte: new Date(data.fromDate)
                }
            }, {
                createdAt: {
                    $lte: new Date(data.toDate)
                }
            }]
        }

        var suitableCrops;
        if (data.suitableCrops) suitableCrops = JSON.parse(data.suitableCrops);
        if (suitableCrops != undefined && suitableCrops.length > 0) {
            query.suitableCrops = { "$in": suitableCrops };
        }
        if (data.dealType == 'Lease') {
            query.forLease = true
        }
        if (data.dealType == 'Sell') {
            query.forSell = true
        }
        // query.mediaCallStatus = 'completed';
        // console.log(query, 'query===')
        Lands.native(function (error, lands) {
            lands.aggregate([
                {
                    $lookup: {
                        from: 'market',
                        localField: 'market',
                        foreignField: '_id',
                        as: "market"
                    }
                },
                {
                    $unwind: {
                        path: '$market',
                        preserveNullAndEmptyArrays: true
                    }
                },
                // {
                //     $lookup: {
                //         from: "exotelcall",
                //         localField: 'lands._id',
                //         foreignField: 'exotelcall.landId',
                //         as: "exotelcall"
                //     }
                // }, {
                //     $unwind: "$exotelcall"
                // },


                {
                    $project: {
                        id: "$_id",
                        GM: "$market.GM",
                        createdAt: "$createdAt",
                        suitableCrops: "$suitableCrops",
                        subscriptionId: "$subscriptionId",
                        forLease: "$forLease",
                        forSell: "$forSell"
                        // callId: "$exotelcall._id",
                        // mediaCallStatus: "$exotelcall.mediaCallStatus",
                    }
                },
                { $match: query },
                {
                    $group: {
                        _id: "$GM",
                        totalLand: { $sum: 1 },
                        totalPlan: { "$sum": { "$cond": [{ "$ne": ["$subscriptionId", null] }, 1, 0] } },
                        // totalCall: { "$sum": { "$cond": [{ "$eq": ["$mediaCallStatus", 'completed'] }, 1, 0] } },
                    }
                }


            ], function (error, results) {
                // console.log(results)
                if (error) {
                    return res.jsonx({
                        success: false,
                        error: error
                    });
                } else {
                    let totalLand = 0;
                    let totalPlan = 0;
                    for (let i = 0; i < results.length; i++) {
                        totalPlan = results[i].totalPlan + totalPlan;
                        totalLand = results[i].totalLand + totalLand;
                    }
                    results = {
                        totalPlan: totalPlan,
                        totalLand: totalLand
                    }
                    return res.jsonx({
                        success: true,
                        data: results,

                    });




                }

            })
        })
    },
    totalVisitsOfFranchisee: function (data, context, req, res) {
        let query = {}
        if (data.franchiseeId && data.franchiseeId != '') {
            let Ids = JSON.parse(data.franchiseeId);
            let frnIds = [];
            Ids.forEach(function (id) {
                frnIds.push(ObjectId(id))
            });

            query.franchiseeId = { $in: frnIds };
        }
        if (data.fromDate && data.toDate) {
            query.$and = [{
                createdAt: {
                    $gte: new Date(data.fromDate)
                }
            }, {
                createdAt: {
                    $lte: new Date(data.toDate)
                }
            }]
        }
        var suitableCrops;
        if (data.suitableCrops) suitableCrops = JSON.parse(data.suitableCrops);
        if (suitableCrops != undefined && suitableCrops.length > 0) {
            query.suitableCrops = { "$in": suitableCrops };
        }
        if (data.dealType == 'Lease') {
            query.forLease = true
        }
        if (data.dealType == 'Sell') {
            query.forSell = true
        }
        LandVisitSchedules.native(function (error, landvisitschedules) {
            landvisitschedules.aggregate([
                {
                    $lookup: {
                        from: "lands",
                        localField: 'landId',
                        foreignField: '_id',
                        as: "lands"
                    }
                }, {
                    $unwind: "$lands"
                },
                {
                    $project: {
                        franchiseeId: "$franchiseeId",
                        //amount: "$amount",
                        suitableCrops: "$lands.suitableCrops",
                        forLease: "$forLease",
                        forSell: "$forSell"
                    }
                },
                { $match: query },
                {
                    $group: {
                        _id: "$franchiseeId",
                        totalVisits: { $sum: 1 },
                    }
                },


            ], function (error, results) {
                // console.log(results)
                if (error) {
                    return res.jsonx({
                        success: false,
                        error: error
                    });
                } else {
                    let visits = 0
                    for (let i = 0; i < results.length; i++) {
                        visits = results[i].totalVisits + visits;
                    }
                    results = { totalVisits: visits }
                    return res.jsonx({
                        success: true,
                        data: results,

                    });




                }

            })
        })
    },
    totalFranchiseeAmount: function (data, context, req, res) {
        let query = {}

        if (data.franchiseeId && data.franchiseeId != '') {
            let Ids = JSON.parse(data.franchiseeId);
            let frnIds = [];
            Ids.forEach(function (id) {
                frnIds.push(ObjectId(id))
            });

            query.franchiseeUserId = { $in: frnIds };
        }
        var suitableCrops;
        if (data.suitableCrops) suitableCrops = JSON.parse(data.suitableCrops);
        if (suitableCrops != undefined && suitableCrops.length > 0) {
            query.suitableCrops = { "$in": suitableCrops };
        }
        if (data.fromDate && data.toDate) {
            query.$and = [{
                createdAt: {
                    $gte: new Date(data.fromDate)
                }
            }, {
                createdAt: {
                    $lte: new Date(data.toDate)
                }
            }]
        }
        if (data.dealType == 'Lease') {
            query.forLease = true
        }
        if (data.dealType == 'Sell') {
            query.forSell = true
        }
        // console.log(query, '===')
        FranchiseePayments.native(function (error, franchiseepayments) {
            franchiseepayments.aggregate([
                {
                    $lookup: {
                        from: "lands",
                        localField: 'landId',
                        foreignField: '_id',
                        as: "lands"
                    }
                }, {
                    $unwind: "$lands"
                }, {
                    $project: {
                        franchiseeUserId: "$franchiseeUserId",
                        amount: { $floor: "$amount" },
                        suitableCrops: "$lands.suitableCrops",
                        forLease: "$forLease",
                        forSell: "$forSell"
                    }
                },
                { $match: query },
                {
                    $group: {
                        _id: "$franchiseeUserId",
                        totalFranchiseeAmount: { $sum: "$amount" },
                    }
                },


            ], function (error, results) {
                // console.log(results)
                if (error) {
                    return res.jsonx({
                        success: false,
                        error: error
                    });
                } else {
                    let amount = 0;
                    for (let i = 0; i < results.length; i++) {
                        amount = results[i].totalFranchiseeAmount + amount;
                    }
                    let changeFormate = changeNumberFormat(parseInt(amount));
                    results = { totalFranchiseeAmount: changeFormate }
                    return res.jsonx({
                        success: true,
                        data: results,

                    });




                }

            })
        })
    },

    saveLand: function (data, context) {

        let code = commonServiceObj.getUniqueCode();

        data.code = "DL-" + code;
        let transactionData = {};
        let transactionSatus = data.transactionSatus;
        let Id = data.transactionId;
        let visitTime = new Date(data.visitTime)
        let visitDate = data.vistDate

        return Lands.findOne({ id: data.landId }).populate('market').then(function (land) {
            if (land != undefined && land.approvalStatus == 'Admin_Approved' && land.availableArea > 0) {

                data.code = "DL-" + code
                data.landId = data.landId
                data.buyerId = data.currentUserID
                data.area = data.area
                data.areaUnit = data.areaUnit
                data.dealType = data.dealType
                data.earnestAmount = data.earnestAmount
                data.productType = 'land'
                data.status = 'interested';
                data.sellerId = land.user;


                if (land.transactionOwner) {
                    data.coordinator = land.transactionOwner.id
                    data.coordinatorRole = land.transactionOwner.roleId
                }

                data.marketId = land.market.id
                data.franchiseeId = land.market.GM

                if (data.dealType == 'Sell') {
                    data.landPrice = parseFloat((land.sellPrice).toFixed(2))
                    data.dealAtPrice = parseFloat((land.sellPrice).toFixed(2))
                    data.displayPrice = land.sellPriceDisplay;
                    data.code = "DLB-" + code
                } else if (data.dealType == 'Lease') {
                    data.dealAtPrice = parseFloat(land.leasePrice)
                    data.displayPrice = land.leasePriceDisplay;
                    data.landLeasePriceUnit = land.leasePriceUnit
                    data.landLeaseAvailabilityFrom = land.availableFrom
                    data.landLeaseAvailabilityTill = land.availableTill
                    data.leaseFrom = land.availableFrom
                    data.leaseTill = land.availableTill

                    let perDayPrice = 0
                    if (land.leasePriceUnit == 'Month') {
                        perDayPrice = parseFloat((parseFloat(land.leasePrice) * 12.0 / 365.0).toFixed(2))
                    } else {
                        perDayPrice = parseFloat((parseFloat(land.leasePrice) / 365.0).toFixed(2))
                    }

                    let leaseDays = commonService.daysBetweenTwoDates(data.leaseFrom, data.leaseTill)
                    // console.log(leaseDays, 'lease days===', data.leaseTill, 'lease leaseTill===', data.leaseFrom, 'lease leaseFrom===')
                    if (leaseDays) {
                        if (leaseDays < 0) {

                            leaseDays = leaseDays * -1;
                            // console.log(leaseDays, 'lease days===', data.leaseTill, 'lease leaseTill===', data.leaseFrom, 'lease leaseFrom===')
                        }

                        data.landPrice = parseFloat((parseFloat(perDayPrice) * leaseDays).toFixed(2))

                    } else {
                        data.landPrice = parseFloat((land.leasePrice).toFixed(2))
                    }


                    data.code = "DLL-" + code
                }
                // console.log(data.landPrice, 'price===')

                data.franchiseeCommissionPercent = parseFloat(land.franchiseePercentage)
                data.buyerFacilitationPercent = parseFloat(land.farmxComission)
                data.sellerFacilitationPercent = parseFloat(land.sellerFarmxComission)

                let buyerFacilitationCharges = parseFloat((data.landPrice * data.buyerFacilitationPercent / 100).toFixed(2))
                let buyerTaxCharges = parseFloat((buyerFacilitationCharges * land.buyerTaxRate / 100).toFixed(2))
                if (land.buyerTaxes != undefined) {
                    let allTaxes = []
                    for (var i = 0; i < land.buyerTaxes.length; i++) {
                        let tax = land.buyerTaxes[i]
                        tax.value = parseFloat((buyerFacilitationCharges * tax.percentage / 100).toFixed(2))
                        allTaxes.push(tax)
                    }

                    data.buyerTaxes = allTaxes
                }
                let sellerFacilitationCharges = parseFloat((data.landPrice * data.sellerFacilitationPercent / 100).toFixed(2))
                let sellerTaxCharges = parseFloat((sellerFacilitationCharges * land.sellerTaxRate / 100).toFixed(2))

                if (land.sellerTaxes != undefined) {
                    let allTaxes = []
                    for (var i = 0; i < land.sellerTaxes.length; i++) {
                        let tax = land.sellerTaxes[i]
                        tax.value = parseFloat((sellerFacilitationCharges * tax.percentage / 100).toFixed(2))
                        allTaxes.push(tax)
                    }

                    data.sellerTaxes = allTaxes
                }

                data.buyerFacilitationCharges = parseFloat((buyerFacilitationCharges).toFixed(2))
                data.sellerFacilitationCharges = parseFloat((sellerFacilitationCharges).toFixed(2))
                data.buyerTaxCharges = parseFloat((buyerTaxCharges).toFixed(2))
                data.sellerTaxCharges = parseFloat((sellerTaxCharges).toFixed(2))
                data.buyerTaxRate = land.buyerTaxRate
                data.sellerTaxRate = land.sellerTaxRate

                let landTotalAmount = parseFloat(data.landPrice + buyerFacilitationCharges + buyerTaxCharges)
                data.dealTotalAmount = parseFloat((landTotalAmount).toFixed(2))

                let sellerUpfrontAmt = parseFloat((data.landPrice * land.sellerUpfrontPercentage / 100).toFixed(2))

                data.tokenAmount = parseFloat((buyerFacilitationCharges + sellerFacilitationCharges + sellerTaxCharges + sellerUpfrontAmt).toFixed(2))
                data.buyerTotalAmount = parseFloat((buyerFacilitationCharges + buyerTaxCharges + sellerFacilitationCharges + sellerTaxCharges + sellerUpfrontAmt).toFixed(2))
                data.sellerAmountByBuyer = parseFloat((data.landPrice - (sellerFacilitationCharges + sellerTaxCharges + sellerUpfrontAmt)).toFixed(2))
                data.sellerAmountByFarmX = parseFloat((sellerUpfrontAmt).toFixed(2))
                data.sellerAmountInToken = parseFloat((sellerFacilitationCharges + sellerTaxCharges + sellerUpfrontAmt).toFixed(2))

                data.buyerCancelDeductionPercentage = land.buyerCancelDeductionPercentage
                data.sellerCancelDeductionPercentage = land.sellerCancelDeductionPercentage
                data.buyerAgreement = land.buyerAgreement

                delete data.transactionId;
                delete data.transactionSatus;
                delete data.currentUserID
                delete data.visitTime
                delete data.visitDate

                return Transactions.findOne({ id: Id }).then(function (td) {

                    if (td.landInterestId) {
                        return {
                            success: false,
                            error: {
                                code: 400,
                                message: "This transection is already processed. Please try with new transaction."
                            },
                        };
                    } else if (td != undefined && td.paymentjson != undefined && td.paymentjson.status != undefined && td.paymentjson.status != "TXN_SUCCESS") {
                        return {
                            success: false,
                            error: {
                                code: 400,
                                message: "This transection is failed. Please process transaction"
                            },
                        };
                    } else {
                        return Landinterests.create(data).then(function (bid) {
                            let visitInfo = {};
                            visitInfo.landId = data.landId;
                            visitInfo.landInterestId = bid.id;
                            visitInfo.buyerId = data.buyerId;
                            visitInfo.sellerId = data.sellerId;
                            visitInfo.market = data.marketId;
                            visitInfo.franchiseeId = data.franchiseeId;
                            visitInfo.visitTime = visitTime;
                            visitInfo.dealDateTime = new Date()
                            if (data.coordinator) {
                                visitInfo.coordinator = data.coordinator
                            }

                            return LandVisitSchedules.create(visitInfo).then(function (visitDetail) {

                                transactionData.buyerId = data.buyerId;
                                transactionData.land = data.landId;
                                transactionData.landInterestId = bid.id;
                                transactionData.amount = data.earnestAmount;
                                // transactionData.status = transactionSatus ;
                                transactionData.sellerId = land.user;
                                transactionData.paymentType = "PayTm";

                                return Transactions.update({ id: Id }, transactionData).then(function (paymentsData) {

                                    let bidpayment = {}
                                    bidpayment.landId = land.id;
                                    bidpayment.landInterestId = bid.id;
                                    bidpayment.sellerId = land.user;
                                    bidpayment.buyerId = data.buyerId;
                                    bidpayment.transactionId = paymentsData[0].id;
                                    bidpayment.amount = paymentsData[0].amount;
                                    bidpayment.type = "Earnest";
                                    bidpayment.paymentDate = paymentsData[0].createdAt;
                                    bidpayment.status = 'Verified';
                                    bidpayment.depositedOn = paymentsData[0].createdAt;
                                    bidpayment.amountPercent = 0;
                                    bidpayment.paymentMode = "PayTm";
                                    bidpayment.paymentDueDate = paymentsData[0].createdAt
                                    bidpayment.sequenceNumber = 0;
                                    bidpayment.isVerified = true;
                                    bidpayment.productType = 'land'
                                    bidpayment.originalAmount = paymentsData[0].amount
                                    bidpayment.pincode = land.pincode
                                    bidpayment.name = 'Earnest'

                                    return Bidspayment.create(bidpayment).then(function (payment) {
                                        var lndQry = {};
                                        lndQry.interestedCount = land.interestedCount + 1;

                                        return Lands.update({ id: data.landId }, lndQry).then(function (updatedCrop) {
                                            var msg = " "
                                            if (data.dealType == 'Sell') {
                                                msg = "There is an interested buyer in buying land with id " + land.code
                                            } else {
                                                msg = "There is an interested lessee for land with id " + land.code
                                            }

                                            var notificationData = {};
                                            notificationData.productId = land.id;
                                            notificationData.land = land.id;
                                            notificationData.sellerId = land.user;
                                            notificationData.buyerId = data.buyerId;
                                            notificationData.user = land.user;
                                            notificationData.productType = "lands";
                                            //notificationData.transactionOwner = u[0].id;
                                            // notificationData.transactionOwner = land.transactionOwner;
                                            notificationData.message = msg;
                                            notificationData.messageKey = "LAND_DEAL_ADDED_NOTIFICATION"
                                            notificationData.readBy = [];
                                            notificationData.messageTitle = 'Land added'
                                            let pushnotreceiver = [land.user]
                                            if (land.market != undefined && land.market.GM) {
                                                pushnotreceiver.push(land.market.GM)
                                            }

                                            let allNotifications = []
                                            allNotifications.push(notificationData)

                                            var notificationData = {};
                                            notificationData.productId = land.id;
                                            notificationData.land = land.id;
                                            // notificationData.sellerId = land.user;
                                            notificationData.buyerId = data.buyerId;
                                            notificationData.user = data.buyerId;
                                            notificationData.productType = "lands";
                                            //notificationData.transactionOwner = u[0].id;
                                            // notificationData.transactionOwner = land.transactionOwner;
                                            notificationData.message = "A visit for land id " + land.code + " is scheduled at " + commonService.longDateFormatWithTime(visitTime)
                                            notificationData.messageKey = "LAND_DEAL_ADDED_NOTIFICATION"
                                            notificationData.readBy = [];
                                            notificationData.messageTitle = 'Land added'
                                            let pushnotreceiver1 = [data.buyerId]
                                            if (land.market != undefined && land.market.GM) {
                                                pushnotreceiver1.push(land.market.GM)
                                            }

                                            allNotifications.push(notificationData)

                                            return Notifications.create(allNotifications).then(function (notificationResponse) {

                                                if (notificationResponse) {
                                                    commonService.notifyUsersFromNotification(notificationResponse[0], land)
                                                    pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse[0])
                                                    commonService.notifyUsersFromNotification(notificationResponse[1], land)
                                                    if (land.subscriptionInfo && land.subscriptionInfo.buyerNotification == true) {
                                                        pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver1, notificationResponse[1])
                                                    }
                                                }

                                                let sendSMSTobuyer = {}
                                                sendSMSTobuyer.variables = { "{#CC#}": land.code }
                                                sendSMSTobuyer.templateId = "42612"
                                                commonService.sendGeneralSMSToUsersWithId(sendSMSTobuyer, [land.market.GM])

                                                let selectedmaarketname = ""
                                                if (land.market != undefined && land.market.GM) {
                                                    selectedmaarketname = land.market.name
                                                    let landfor = bid.dealType
                                                    if (landfor == "Sell") {
                                                        landfor = "Buy"
                                                    }
                                                    let sendSMSToFranchisee = {}
                                                    sendSMSToFranchisee.variables = { "{#BB#}": landfor, "{#CC#}": land.code, "{#DD#}": "Farmer" }
                                                    sendSMSToFranchisee.templateId = "42492"
                                                    commonService.sendGeneralSMSToUsersWithId(sendSMSToFranchisee, [land.market.GM])
                                                }

                                                if (land.transactionOwner) {
                                                    let landfor = bid.dealType
                                                    if (landfor == "Sell") {
                                                        landfor = "Buy"
                                                    }
                                                    let sendSMSToFranchisee = {}
                                                    sendSMSToFranchisee.variables = { "{#BB#}": landfor, "{#CC#}": land.code, "{#DD#}": selectedmaarketname, "{#EE#}": "Farmer" }
                                                    sendSMSToFranchisee.templateId = "42493"
                                                    commonService.sendGeneralSMSToUsersWithId(sendSMSToFranchisee, [land.transactionOwner])
                                                }

                                                return {
                                                    success: true,
                                                    code: 200,
                                                    data: {
                                                        land: bid,
                                                        message: 'Your visit is scheduled. FarmX will connect you.'
                                                    }
                                                };
                                            })
                                        })
                                    })

                                })
                            })
                        })
                    }
                })
            } else {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: 'Land not available.'
                    },
                };
            }
        })
    },

    myLandInterest: function (data, context, req, res) {
        let user = req.identity.id

        let page = req.param('page');
        let count = parseInt(req.param('count'));
        let skipNo = (page - 1) * count;
        let tab = parseInt(req.param('tab'));

        let type = req.param('productType');

        let mybidsqry = {}
        mybidsqry.buyerId = user
        if (type) {
            mybidsqry.productType = type
        }


        let tabName = ''
        if (tab == 2) {    //delivered
            mybidsqry.$or = [{ status: 'transferred' }]
            tabName = 'Completed'
        } else if (tab == 3) { //failed
            mybidsqry.$or = [{ status: 'deal_canceled_by_buyer' }, { status: 'deal_canceled_by_franchisee' }, { status: 'failed' }, { status: 'canceled' }]
            tabName = 'Failed'
        } else { //active
            mybidsqry.$or = [{ status: 'interested' }, { status: 'revisit' }, { status: 'deal_accepted' }, { status: 'payments_done' }, { status: 'deal_requested' }]
            tabName = 'Active'
        }

        if (data.from && data.to) {
            mybidsqry.$and = [{
                createdAt: {
                    $gte: new Date(data.from)
                }
            }, {
                createdAt: {
                    $lte: new Date(data.to)
                }
            }]
        }
        Landinterests.count(mybidsqry).exec(function (cerr, counttotal) {
            if (cerr) {
                return res.status(400).jsonx({
                    success: false,
                    error: cerr,
                });
            } else {
                Landinterests.find(mybidsqry).populate('visits', { sort: 'visitType DESC' })
                    .populate('franchiseeId', { select: ['fullName', 'email', 'mobile', 'id', 'address', 'city', 'state', 'pincode', 'district'] })
                    .populate('landId', { select: ['title', 'khasraNo', 'code', 'address', 'state', 'district', 'city', 'pincode', 'forLease', 'forSell', 'area', 'areaUnit', 'leasePriceDisplay', 'sellPriceDisplay', 'city', 'district', 'address', 'availableTill'] })
                    .skip(skipNo).sort('updatedAt Desc').limit(count).exec(function (err, bids) {
                        if (err) {
                            return res.status(400).jsonx({
                                success: false,
                                error: err,
                            });
                        } else {
                            return res.status(200).jsonx({
                                success: true,
                                data: bids,
                                total: counttotal
                            });
                        }
                    })
            }
        })
    },

    sellerLandInterest: function (data, context, req, res) {
        let page = req.param('page');
        let count = parseInt(req.param('count'));
        let skipNo = (page - 1) * count;

        let qry = {}
        qry.landId = data.landId

        Landinterests.count(qry).exec(function (cerr, counttotal) {
            if (cerr) {
                return res.status(400).jsonx({
                    success: false,
                    error: cerr,
                });
            } else {
                Lands.findOne({ id: data.landId }, { fields: ['code', 'availableArea', 'sellPriceDisplay', 'leasePriceDisplay', 'forLease', 'forSell'] }).exec(function (err, land) {
                    Landinterests.find(qry, { fields: ['buyerId', 'status', 'createdAt', 'code', 'dealType', 'registryDate'] }).populate('buyerId', { select: ['fullName', 'email', 'mobile', 'id', 'address', 'city', 'state', 'pincode'] })
                        .skip(skipNo).sort('updatedAt Desc').limit(count).exec(function (err, bids) {
                            if (err) {
                                return res.status(400).jsonx({
                                    success: false,
                                    error: err,
                                });
                            } else {
                                return res.status(200).jsonx({
                                    success: true,
                                    data: {
                                        deals: bids,
                                        land: land,
                                        total: counttotal
                                    }
                                });
                            }
                        })
                })
            }
        })
    },

    /*myLandInterest: function (data, context, req, res) {
        var search = data.search;
        var page = data.page;
        var count = parseInt(data.count);
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";
        var isExpired = data.expire;

        if (data.sortBy) {
            sortBy = data.sortBy
        }

        var typeArr = new Array();
        typeArr = sortBy.split(" ");
        var sortType = typeArr[1];
        var field = typeArr[0];
        var sortquery = {};
        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        var query = {};
        query.isDeleted = false

        if (data.sell) {
            query.forSell = true;
        }
        if (data.forLease) {
            query.forLease = true;
        }


        query.buyerId = ObjectId(req.identity.id)
        //let basicCondition = landBasicDisplayCondition();
        //query = { ...query, ...basicCondition };
        if (search) {
            query.$or = [
                { code: parseInt(search) },
                { khasraNo: { $regex: search, '$options': 'i' } },
                { price: parseFloat(search) },
                { area: parseFloat(search) },


            ]
        }
        // console.log(query, '====')
        Landinterests.native(function (error, landInterestList) {
            landInterestList.aggregate([
                {
                    $lookup: {
                        from: 'lands',
                        localField: 'landId',
                        foreignField: '_id',
                        as: "lands"
                    }
                },
                {
                    $unwind: '$lands'
                },
                {
                    $lookup: {
                        from: 'landvisitschedules',
                        localField: 'landId',
                        foreignField: 'landId',
                        as: "landvisitschedules"
                    }
                },
                {
                    $unwind: '$landvisitschedules'
                },

                {
                    $project: {

                        pincode: "$lands.pincode",
                        code: "$lands.code",
                        address: "$lands.address",
                        city: "$lands.city",
                        landType: "$landType",
                        forSell: '$lands.forSell',
                        leasePrice: '$lands.leasePrice',
                        leasePriceDisplay: '$lands.leasePriceDisplay',
                        sellPrice: '$lands.sellPrice',
                        sellPriceDisplay: '$lands.sellPriceDisplay',
                        leasePriceUnit: '$lands.leasePriceUnit',
                        area: "$lands.area",
                        description: '$lands.description',
                        areaUnit: "$lands.areaUnit",
                        createdAt: "$createdAt",
                        title: "$lands.title",


                    }
                },
                {
                    $match: query
                }
            ], function (err, totalresults) {
                // console.log(totalresults, '----')
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    landInterestList.aggregate([
                        {
                            $lookup: {
                                from: 'lands',
                                localField: 'landId',
                                foreignField: '_id',
                                as: "lands"
                            }
                        },
                        {
                            $unwind: '$lands'
                        },
                        {
                            $lookup: {
                                from: 'landvisitschedules',
                                localField: 'landId',
                                foreignField: 'landId',
                                as: "landvisitschedules"
                            }
                        },
                        {
                            $unwind: '$landvisitschedules'
                        },

                        {
                            $project: {

                                pincode: "$lands.pincode",
                                code: "$lands.code",
                                address: "$lands.address",
                                city: "$lands.city",
                                landType: "$landType",
                                forSell: '$lands.forSell',
                                leasePrice: '$lands.leasePrice',
                                leasePriceDisplay: '$lands.leasePriceDisplay',
                                sellPrice: '$lands.sellPrice',
                                sellPriceDisplay: '$lands.sellPriceDisplay',
                                leasePriceUnit: '$lands.leasePriceUnit',
                                area: "$lands.area",
                                description: '$lands.description',
                                areaUnit: "$lands.areaUnit",
                                createdAt: "$createdAt",
                                title: "$lands.title",


                            }
                        },
                        {
                            $match: query
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
                    ], function (error, results) {
                        if (error) {
                            return res.status(400).jsonx({
                                success: false,
                                error: error
                            });
                        } else {
                            return res.status(200).jsonx({
                                success: true,
                                data: results,
                                total: totalresults.length
                            });
                        }
                    });
                }
            });
        });
    },*/

    franchiseeLandInterest: function (data, context, req, res) {
        var search = data.search;
        var page = data.page;
        var count = parseInt(data.count);
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";

        var query = {};

        if (data.dealType) {
            query.dealType = data.dealType;
        }
        if (data.status) {
            query.status = data.status;
        }

        if (data.from && data.to) {
            query.$and = [{
                createdAt: {
                    $gte: new Date(data.from)
                }
            }, {
                createdAt: {
                    $lte: new Date(data.to)
                }
            }]
        }
        if (search) {
            query.$or = [
                { code: { 'like': '%' + search + '%' } },
                { title: { 'like': '%' + search + '%' } },
                { district: { 'like': '%' + search + '%' } },
                { seller: { 'like': '%' + search + '%' } },
                { sellerCode: { 'like': '%' + search + '%' } },
                { userUniqueId: { 'like': '%' + search + '%' } }

            ]
        }

        query.franchiseeId = context.identity.id;
        if (data.landId != "undefined" && data.landId != null) {
            query.landId = data.landId;
        }
        // console.log(query, '=====query')
        Landinterests.count(query).exec(function (cerr, counttotal) {
            if (cerr) {
                return res.status(400).jsonx({
                    success: false,
                    error: cerr,
                });
            } else {
                Landinterests.find(query).sort('updatedAt DESC')
                    .populate('visits', { sort: 'visitType DESC' })
                    .populate('buyerId', { select: ['fullName', 'email', 'mobile', 'id', 'address', 'city', 'state', 'pincode'] })
                    .populate('sellerId', { select: ['fullName', 'email', 'mobile', 'id', 'address', 'city', 'state', 'pincode'] })
                    .populate('landId', { select: ['title', 'khasraNo', 'code', 'address', 'state', 'district', 'city', 'pincode', 'forLease', 'forSell', 'area', 'areaUnit', 'leasePriceDisplay', 'sellPriceDisplay', 'city', 'district', 'address', 'availableTill', 'interestedCount'] })

                    .skip(skipNo).limit(count).exec(function (err, landinterest) {
                        if (err) {
                            return res.status(400).jsonx({
                                success: false,
                                error: err,
                            });
                        } else {
                            return res.status(200).jsonx({
                                success: true,
                                data: landinterest,
                                total: counttotal
                            });
                        }
                    })
            }
        })
    },

    transectionCreate: function (reqData, context) {

        return Transactions.create(reqData).then(function (res) {

            return res;

        });
    },

    getAllLandInterest: function (data, context, req, res) {

        var search = data.search;
        var page = data.page;
        var count = parseInt(data.count);
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";


        if (data.sortBy) {
            sortBy = data.sortBy
        }

        var typeArr = new Array();
        typeArr = sortBy.split(" ");
        var sortType = typeArr[1];
        var field = typeArr[0];
        var sortquery = {};
        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        var query = {};

        if (data.dealType) {
            query.dealType = data.dealType;
        }
        if (data.status) {
            query.status = data.status;
        }

        if (data.from && data.to) {
            query.$and = [{ createdAt: { $gte: new Date(data.from) } }, { createdAt: { $lte: new Date(data.to) } }]
        }

        if (data.marketId) {
            query.marketId = data.marketId;
        }
        if (data.marketIds) {
            query.marketIds = { $in: data.marketIds };
        }

        if (search) {
            query.$or = [
                { code: { 'like': '%' + search + '%' } },
                { khasraNo: { 'like': '%' + search + '%' } },
                { pincode: { 'like': '%' + search + '%' } },
                { price: parseFloat(search) },
                { area: parseFloat(search) },
                { seller: { 'like': '%' + search + '%' } },
                { city: { 'like': '%' + search + '%' } },

            ]
        }
        if (data.landId != null && data.landId != "undefined") {
            query.landId = data.landId;
        }
        console.log(query, '====')

        Landinterests.count(query).exec(function (cerr, counttotal) {
            if (cerr) {
                return res.status(400).jsonx({
                    success: false,
                    error: cerr,
                });
            } else {
                Landinterests.find(query).sort('createdAt DESC').populate('buyerId', { select: ['fullName', 'mobile', 'email', 'id'] }).populate('sellerId', { select: ['fullName', 'mobile', 'email', 'id'] }).populate('franchiseeId', { select: ['fullName', 'mobile', 'email', 'id'] }).populate('visits', { sort: 'createdAt DESC' }).populate('landId', { select: ['title', 'khasraNo', 'code', 'address', 'state', 'district', 'city', 'pincode', 'forLease', 'forSell', 'area', 'areaUnit', 'leasePriceDisplay', 'sellPriceDisplay', 'city', 'district', 'address', 'availableTill'] })
                    .skip(skipNo).limit(count).exec(function (err, deals) {
                        if (err) {
                            return res.status(400).jsonx({
                                success: false,
                                error: err,
                            });
                        } else {
                            return res.status(200).jsonx({
                                success: true,
                                data: deals,
                                total: counttotal
                            });
                        }
                    })
            }
        })
    },

    dealStatusChange: function (data, context, req, res) {
        let intrestedId = data.id;
        Landinterests.findOne({ id: intrestedId }).exec(function (err, lndInterestInfo) {
            if (err) {
                return res.jsonx({
                    "success": false,
                    error: err
                })
            } else {
                if (data.status == 'revisit') {
                    if (lndInterestInfo.status == 'canceled' || lndInterestInfo.status == 'failed') {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: 'Can not re visit as deal is already canceled. Please book another visit'
                            }
                        })
                    } else if (lndInterestInfo.status == 'deal_accepted' || lndInterestInfo.status == 'payments_done') {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: 'Can not revisit as deal is already accepted. Please schedule a new visit'
                            }
                        })
                    } else if (lndInterestInfo.status == 'transferred') {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: 'No visit can be scheduled as land is already transferred to buyer'
                            }
                        })
                    } else {
                        reVisit(lndInterestInfo, data, context, req, res);
                    }
                }
                if (data.status == 'deal_requested') {
                    if (lndInterestInfo.status == 'canceled' || lndInterestInfo.status == 'failed') {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: 'Can not request as deal is already canceled.'
                            }
                        })
                    } else if (lndInterestInfo.status == 'deal_accepted' || lndInterestInfo.status == 'payments_done') {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: 'Can not request deal as deal is already accepted.'
                            }
                        })
                    } else if (lndInterestInfo.status == 'transferred') {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: 'Can not request deal as land deal is completed'
                            }
                        })
                    } else {
                        updateLandInterestStatus(data, context, req, res);
                    }
                }
                if (data.status == 'deal_accepted') {
                    if (lndInterestInfo.status == 'canceled' || lndInterestInfo.status == 'failed') {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: 'Can not accept deal as deal is already canceled. Please book another visit'
                            }
                        })
                    } else if (lndInterestInfo.status == 'deal_accepted' || lndInterestInfo.status == 'payments_done') {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: 'Can not accept deal again as deal is already accepted. Please schedule a new visit'
                            }
                        })
                    } else if (lndInterestInfo.status == 'transferred') {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: 'Can not accept deal as this deal is closed and land is under your custody'
                            }
                        })
                    } else {
                        buyerPaymentGenerate(lndInterestInfo, data, context, req, res);
                    }
                }
                if (data.status == 'payments_done') {
                    generateSellerPayments(lndInterestInfo, context).then(function (resp) {
                        return res.jsonx(resp);
                    })
                }
                if (data.status == 'transferred') {
                    if (lndInterestInfo.status == 'canceled' || lndInterestInfo.status == 'failed') {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: 'Can not transfer as deal was canceled'
                            }
                        })
                    } else {
                        generateFranchiseePayments(lndInterestInfo, data, context, req, res);
                    }
                }
            }
        })
    },

    verifyDealPayments: function (data, context, req, res) {
        var ids = [];
        //if(req.body.id) ids = JSON.parse(req.body.id);
        if (data.id) {

            ids = data.id;
        }


        // console.log(ids);
        // return
        var query = {};
        query.isVerified = true;
        query.status = "Verified";
        query.verifiedBy = req.identity.id
        query.verifyDate = new Date()
        let code = commonServiceObj.getUniqueCode();
        async.each(ids, function (paymentid, callback) {

            Bidspayment.findOne({
                id: paymentid
            }).populate("landInterestId").then(function (bidspaymentDetail) {

                if (bidspaymentDetail.status != 'Verified' && bidspaymentDetail.transactionId == undefined) {

                    Bidspayment.update({
                        id: paymentid
                    }, query).then(function (bidpaymentStatus) {

                        //     return false ;
                        // console.log("fffffffffff") ;
                        if (bidpaymentStatus) {
                            if (bidspaymentDetail.landInterestId.status == 'canceled' || bidspaymentDetail.landInterestId.status == 'failed' || bidspaymentDetail.landInterestId.status == 'transferred') {
                                callback()
                            } else {
                                let landInterestId = bidspaymentDetail.landInterestId;
                                let fndQuery = {};
                                fndQuery.landInterestId = landInterestId;
                                fndQuery.$or = [{ status: 'Due' }, { status: 'Paid' }, { status: 'Overdue' }]
                                Bidspayment.count(fndQuery).then(function (total) {
                                    if (total > 0) {
                                        var transactionData = {};
                                        transactionData.buyerId = bidspaymentDetail.buyerId;
                                        transactionData.sellerId = bidspaymentDetail.sellerId;
                                        transactionData.land = bidspaymentDetail.landId;
                                        if (bidspaymentDetail.landInterestId) {
                                            transactionData.landInterestId = bidspaymentDetail.landInterestId.id;
                                        }
                                        transactionData.bidsPaymentId = bidspaymentDetail.id;

                                        transactionData.transactionId = code;
                                        transactionData.amount = bidspaymentDetail.amount;
                                        transactionData.paymentType = bidspaymentDetail.paymentMode;
                                        transactionData.processStatus = "TXN_SUCCESS";
                                        transactionData.transactionType = 'Credit';

                                        if (bidspaymentDetail.type == "Deposit") {
                                            transactionData.status = 'DA';
                                        } else if (bidspaymentDetail.type == "Final") {
                                            transactionData.status = 'FA';
                                        }

                                        Transactions.create(transactionData).then(function (newTransactionEntry) {
                                            if (newTransactionEntry) {
                                                qry = {};
                                                qry.transactionId = newTransactionEntry.id
                                                Bidspayment.update({
                                                    id: paymentid
                                                }, qry).then(function (bidpaymentStatus) {
                                                    callback()
                                                })
                                            } else {
                                                callback()
                                            }
                                        });
                                    } else {
                                        Landinterests.findOne({ id: landInterestId }).then(function (lndInterestInfo) {
                                            generateSellerPayments(landInterestId, context);
                                            callback()
                                        })
                                    }
                                })
                            }
                        }
                    })
                } else {
                    callback()
                }
            })
        }, function (error) {
            if (error) {

            } else {
                return res.jsonx({
                    success: true,
                    message: constantObj.bids.SUCCESSFULLY_VERIFIED,
                    key: 'SUCCESSFULLY_VERIFIED',

                });
            }
        });

    },

    LandDealCancel: function (data, context, req, res) {

        if (data.cancelReason == undefined || data.cancelReason == "") {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: 'Please enter cancel reason.'
                }
            })
        }
        Landinterests.findOne({ id: data.id }).exec(function (err, lndInterestInfo) {
            if (err) {
                return res.jsonx({
                    "success": false,
                    error: err
                })
            } else {
                if (lndInterestInfo.status == 'interested' || lndInterestInfo.status == 'revisit' || lndInterestInfo.status == 'deal_requested') {
                    //refund earnest amount only                                        
                    dealCancelforEarnestAmount(lndInterestInfo, data, context, req, res);

                }
                else if (lndInterestInfo.status == 'deal_accepted') {
                    //refund only buyer payments                    
                    dealCancelAndRefundBuyerAmount(lndInterestInfo, data, context, req, res);

                } else if (lndInterestInfo.status == 'payments_done') {
                    //refund all payments                    
                    dealCancelAndRefundBuyerSellerAndFranchiseeAmount(lndInterestInfo, data, context, req, res);
                } else if (lndInterestInfo.status == 'transferred') {
                    //refund all payments
                    return res.status(400).jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: 'Land already transferred at your name. Cancellation of deal not allowed.'
                        },
                    });
                } else if (lndInterestInfo.status == 'canceled') {
                    //refund all payments
                    return res.status(400).jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: 'Deal is already canceled.'
                        },
                    });
                } else {
                    return res.status(400).jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: 'This was a failed dealed. No need to cancel this.'
                        },
                    });
                }
            }
        })
    },

    dealCompleteDetails: function (data, context, req, res) {
        Landinterests.findOne({ id: data.id }).populate("landId", { select: ['code', 'pincode'] })
            .populate("buyerId", { select: ['fullName', 'userUniqueId', 'mobile'] })
            .populate("sellerId", { select: ['fullName', 'userUniqueId', 'mobile'] })
            .populate("buyerPayment")
            .populate("franchiseePayment")
            .populate("sellerPayment")
            .populate("coordinator", { select: ['fullName', 'userUniqueId', 'mobile'] })
            .populate("canceledBy", { select: ['fullName', 'userUniqueId', 'mobile'] })
            .populate("marketId", { select: ['name'] })
            .populate("franchiseeId", { select: ['fullName', 'userUniqueId', 'mobile'] })
            .populate("visits", { select: ['visitTime', 'visitStatus', 'visitType', 'createdAt', 'dealDateTime', 'visitTimeHistory', 'franchiseeQA', 'buyerQA', 'buyerFeedback', 'franchiseeFeedback'] }).exec(function (error, deal) {
                if (error) {
                    return res.jsonx({
                        success: false,
                        error: error,
                    });
                } else {
                    if (deal) {
                        let payPayments = 0
                        let takePayments = 0
                        if (deal.buyerPayment) {
                            let buyerPayments = deal.buyerPayment
                            if (buyerPayments.length > 0) {

                                for (var i = 0; i < buyerPayments.length; i++) {
                                    let bp = buyerPayments[i]
                                    if (bp.status == 'Due' || bp.status == 'Paid' || bp.status == 'Verified' || bp.status == 'Overdue') {
                                        takePayments = takePayments + bp.amount
                                    } else {
                                        payPayments = payPayments + bp.amount
                                    }
                                }
                            }
                        }

                        deal.finalBuyerPaymentAmount = parseFloat((takePayments - payPayments).toFixed(2));



                        let paySPayments = 0
                        let takeSPayments = 0

                        if (deal.sellerPayment) {
                            let sellerPayments = deal.sellerPayment
                            let allsellers = []

                            for (var i = 0; i < sellerPayments.length; i++) {
                                let sp = sellerPayments[i]
                                if (sp.status == 'Due' || sp.status == 'Paid' || sp.status == 'Verified' || sp.status == 'Overdue') {
                                    paySPayments = paySPayments + sp.amount
                                } else {
                                    takeSPayments = takeSPayments + sp.amount
                                }


                                allsellers.push(sp.sellerId)
                            }

                            let sellerPaymentsGrouped = _.groupBy(sellerPayments, 'sellerId.id');
                            deal.sellers = allsellers

                            var sellerWiseAmountTotal = {}


                            Object.keys(sellerPaymentsGrouped).forEach((slrid, index) => {
                                let csellpaySPayments = 0
                                let cselltakeSPayments = 0
                                let csellallpays = sellerPaymentsGrouped[slrid]

                                for (var j = 0; j < csellallpays.length; j++) {
                                    let sp = csellallpays[j]
                                    if (sp.status == 'Due' || sp.status == 'Paid' || sp.status == 'Verified' || sp.status == 'Overdue') {
                                        csellpaySPayments = csellpaySPayments + sp.amount
                                    } else {
                                        cselltakeSPayments = cselltakeSPayments + sp.amount
                                    }
                                }
                                sellerWiseAmountTotal[slrid] = parseFloat((csellpaySPayments - cselltakeSPayments).toFixed(2));
                            })


                            deal.sellerWiseAmountTotal = sellerWiseAmountTotal
                        }

                        deal.finalSellerPaymentAmount = parseFloat((paySPayments - takeSPayments).toFixed(2));

                        let payFPayments = 0
                        let takeFPayments = 0

                        if (deal.franchiseePayment) {
                            let franchiseePayments = deal.franchiseePayment

                            for (var i = 0; i < franchiseePayments.length; i++) {
                                let fp = franchiseePayments[i]
                                if (fp.status == 'Due' || fp.status == 'Paid' || fp.status == 'Verified' || fp.status == 'Overdue') {
                                    payFPayments = payFPayments + fp.amount
                                } else {
                                    takeFPayments = takeFPayments + fp.amount
                                }
                            }
                        }

                        deal.finalFranchiseePaymentAmount = parseFloat((payFPayments - takeFPayments).toFixed(2));

                        ExotelCall.find({ landInterestId: deal.id }).populate("toUserId", { select: ['fullName', 'userUniqueId', 'mobile'] }).populate("fromUserId", { select: ['fullName', 'userUniqueId', 'mobile'] }).then(function (calls) {


                            if (calls) {
                                deal.calls = calls
                            }


                            return res.jsonx({
                                code: 200,
                                data: deal,
                                success: true
                            });
                        })
                    } else {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: "Deal not found"
                            },
                        });
                    }
                }
            })
    },

    assignCoordinator: function (data, context, req, res) {
        if (data.id && data.coordinator) {
            Landinterests.findOne({ id: data.id }).exec(function (error, deal) {
                if (error) {
                    return res.jsonx({
                        success: false,
                        error: error
                    })
                } else {
                    if (deal) {
                        if (deal.coordinator == data.coordinator) {
                            return res.jsonx({
                                success: false,
                                error: {
                                    code: 400,
                                    message: 'This user is already coordinator of this deal'
                                }
                            })
                        } else {
                            Users.findOne({ id: data.coordinator }).exec(function (error, cu) {
                                if (cu && (cu.roles == 'A' || cu.roles == 'SA')) {
                                    Landinterests.update({ id: data.id }, { coordinator: data.coordinator }).exec(function (error, li) {
                                        if (data.changevisits != undefined && data.changevisits == true) {
                                            LandVisitSchedules.update({ landInterestId: data.id, visitStatus: 'scheduled' }, { coordinator: data.coordinator }).exec(function (error, updated) {
                                                return res.jsonx({
                                                    success: true,
                                                    code: 200,
                                                    data: {
                                                        deal: li[0],
                                                        message: 'Cordinator assigned'
                                                    }
                                                })
                                            })
                                        } else {
                                            return res.jsonx({
                                                success: true,
                                                code: 200,
                                                data: {
                                                    deal: li[0],
                                                    message: 'Cordinator assigned'
                                                }
                                            })
                                        }
                                    })
                                } else {
                                    return res.jsonx({
                                        success: false,
                                        error: {
                                            code: 400,
                                            message: 'Not a valid cordinator. Only admin user can be coordinator'
                                        }
                                    })
                                }
                            })
                        }
                    } else {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: 'Deal not found'
                            }
                        })
                    }
                }
            })
        } else {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: 'Please provide deal and coordinator'
                }
            })
        }
    },

    addRegistryDate: function (data, context, req, res) {
        if (data.id) {
            Landinterests.findOne({ id: data.id }).exec(function (error, deal) {
                if (error) {
                    return res.jsonx({
                        success: false,
                        error: error
                    })
                } else {
                    if (deal) {
                        let registryDate = new Date()

                        if (data.registryDate) {
                            registryDate = new Date(data.registryDate)
                        }

                        Landinterests.update({ id: data.id }, { 'registryDate': registryDate, registryDateAddedOn: new Date() }).exec(function (error, li) {
                            return res.jsonx({
                                success: true,
                                code: 200,
                                data: {
                                    deal: li[0],
                                    message: 'Registry date added'
                                }
                            })
                        })
                    } else {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: 'Deal not found'
                            }
                        })
                    }
                }
            })
        } else {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: 'Please provide deal id'
                }
            })
        }
    }
};

var generateSellerPayments = function (lndInterestInfo, context) {
    let data = {}
    data.id = lndInterestInfo.id;
    data.status = 'payments_done';
    let landId = lndInterestInfo.landId;

    return Lands.findOne({ id: landId }).then(function (landInfo) {
        var sellerPayments = [];
        var sequenceNumber = 1;

        var days = 0
        days = days + landInfo.sellerUpfrontDays

        let upfrontObject = {
            landId: landInfo.id,
            baseLandId: landInfo.id,
            landInterestId: lndInterestInfo.id,
            sellerId: landInfo.user,
            buyerId: lndInterestInfo.buyerId,
            depositPercentage: landInfo.sellerUpfrontPercentage,
            depositLabel: "Upfront",
            depositDays: landInfo.sellerUpfrontDays,
            pincode: landInfo.pincode,
            paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
            type: "Upfront",
            status: "Due",
            productType: 'land',
            sequenceNumber: sequenceNumber,
            paymentMedia: 'landinterest',
            amount: parseFloat(lndInterestInfo.sellerAmountByFarmX)
        }
        sellerPayments.push(upfrontObject)

        for (var i = 0; i < sellerPayments.length; i++) {
            if (sellerPayments[i].amount < 1) {
                sellerPayments[i].amount = 0
                sellerPayments[i].paymentMode = 'AutoAdjusted'
                sellerPayments[i].status = 'Verified'
                sellerPayments[i].isVerified = true
                sellerPayments[i].depositedOn = new Date()
            }
        }
        return Sellerpayment.create(sellerPayments).then(function (responseSellerPayment) {
            if (responseSellerPayment) {
                /* var fpQuery = {}
                 fpQuery.landId = landInfo.id
                 fpQuery.landInterestId = lndInterestInfo.id
                 fpQuery.sellerId = landInfo.user
                 fpQuery.buyerId = lndInterestInfo.buyerId
                 fpQuery.amount = parseFloat(lndInterestInfo.landPrice) * parseFloat(lndInterestInfo.franchiseeCommissionPercent / 100)
                 fpQuery.pincode = landInfo.pincode
                 fpQuery.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString()
                 fpQuery.status = 'Due';
                 fpQuery.productType = 'land';
                 fpQuery.franchiseeUserId = lndInterestInfo.franchiseeId
                 FranchiseePayments.create(fpQuery).then(function (franchiseePayment) {
                     if (franchiseePayment) {*/
                // let fndQry = {}
                // fndQry.landInterestId = lndInterestInfo.id;
                // fndQry.visitStatus = 'scheduled';
                // LandVisitSchedules.destroy(fndQry).then(function (visitSchedule) {
                let fndQry1 = {}
                fndQry1.id = lndInterestInfo.id;
                let updateData = {};
                updateData.status = 'payments_done'
                return Landinterests.update(fndQry1, updateData).then(function (lndInterestUpdae) {
                    return Lands.update({ id: landInfo.id }, { availableArea: landInfo.availableArea - lndInterestInfo.area }).then(function (updatedland) {
                        return {
                            success: true,
                            code: 200,
                            data: {
                                deal: lndInterestUpdae[0],
                                message: 'Deal status updated'
                            }
                        }
                    })
                })
                // })
                // }

                // })
            }
        }).fail(function (error) {
            return {
                success: false,
                error: error
            };
        })
    })
}

var dealCancelAndRefundBuyerSellerAndFranchiseeAmount = function (lndInterestInfo, data, context, req, res) {


    //refund earnest amount also
    var request = require('request-promise');
    var envPaytm = data.ENV // "development" "production";
    // console.log(envPaytm, "envpaytm *------------------", data);

    data.id = lndInterestInfo.id;
    data.rejectedAt = new Date();
    data.comment = data.comment ? data.comment : "";
    data.reason = data.reason ? data.reason : "";
    data.canceledBy = context.identity.id;
    let refundBy = context.identity.id

    var findTransactionQry = {}
    findTransactionQry.landInterestId = data.id
    findTransactionQry.paymentType = "PayTm"
    findTransactionQry.processStatus = "TXN_SUCCESS"
    // console.log(findTransactionQry, 'findTransactionQry====')
    Transactions.findOne(findTransactionQry).then(function (bidTransactions) {
        // console.log(bidTransactions, 'bidTransactions====')
        if (bidTransactions == undefined) {
            return res.status(200).jsonx({
                success: false,
                error: {
                    code: 400,
                    message: 'transaction not found'
                },
            });
        }

        let REFUNDCode = commonServiceObj.getRefundCode("REFID");

        let refundAmount = (bidTransactions.paymentjson.TXNAMOUNT - lndInterestInfo.earnestAmount * 1.99 / 100);

        var paramlist = {};

        paramlist['MID'] = bidTransactions.paymentjson.MID;
        paramlist['TXNID'] = bidTransactions.paymentjson.TXNID;
        paramlist['ORDERID'] = bidTransactions.paymentjson.ORDERID;
        paramlist['REFUNDAMOUNT'] = refundAmount
        paramlist['TXNTYPE'] = "REFUND";
        paramlist["REFID"] = REFUNDCode;
        //console.log(paramlist, 'paramlist====', bidTransactions.paymentjson.TXNAMOUNT)
        let paytm_key = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;

        // console.log(envPaytm, "paramlist *------------------", paytm_key);

        Payments.genchecksumforrefund(paramlist, paytm_key, (err, JsonData) => {

            let jsONDST = JSON.stringify(JsonData);
            // console.log("jsONDST *------------------", jsONDST) ;

            let refundApiPayTmUrl = constantObj.paytm_config[envPaytm].REFUND_URL + "?JsonData=" + jsONDST
            var options = {
                url: refundApiPayTmUrl,
                method: 'GET',
                headers: {
                    "Pragma": "no-cache",
                    "Cache-Control": "no-cache",
                    "Expires": 0
                }
            };

            console.log("options *------------------", options);

            request(options).then(function (body) {

                console.log("request response body Paytm+++++++++", body);
                var info = JSON.parse(body);
                if (info.STATUS == 'TXN_SUCCESS' || info.STATUS == 'PENDING') {

                    let transactionData = {};
                    transactionData.processedBy = refundBy;
                    transactionData.status = 'RF';
                    transactionData.transactionType = 'DebitEscrow';
                    transactionData.processStatus = info.RESPMSG;
                    transactionData.payTmRefundId = info.REFUNDID;
                    transactionData.refundjson = info;
                    transactionData.transactionId = bidTransactions.id;
                    transactionData.landInterestId = lndInterestInfo.id;
                    transactionData.land = lndInterestInfo.landId;
                    transactionData.sellerId = bidTransactions.sellerId;
                    transactionData.buyerId = bidTransactions.buyerId;
                    transactionData.paymentType = 'PayTm';
                    transactionData.refundAmount = refundAmount

                    Transactions.create(transactionData).then(function (paymentsData) {
                        console.log("paymentsData************", paymentsData);
                        let bidFndQry = {};
                        bidFndQry.landInterestId = data.id;
                        bidFndQry.type = 'Earnest';

                        Bidspayment.findOne(bidFndQry).then(function (bidsPaymentInfo) {
                            delete bidsPaymentInfo.id;
                            delete bidsPaymentInfo.createdAt;
                            delete bidsPaymentInfo.updatedAt;

                            let refundPaymentInfo = bidsPaymentInfo
                            refundPaymentInfo.amount = refundAmount
                            refundPaymentInfo.originalAmount = refundAmount
                            refundPaymentInfo.type = 'Earnest'
                            refundPaymentInfo.sequenceNumber = bidsPaymentInfo.sequenceNumber + 1
                            refundPaymentInfo.paymentDate = new Date()

                            refundPaymentInfo.paymentDueDate = new Date()
                            refundPaymentInfo.isVerified = true
                            refundPaymentInfo.verifyDate = new Date()
                            refundPaymentInfo.transactionId = paymentsData.id
                            refundPaymentInfo.paymentMode = 'PayTm'
                            refundPaymentInfo.name = 'Final'
                            refundPaymentInfo.depositDate = new Date()
                            refundPaymentInfo.depositedOn = new Date()
                            refundPaymentInfo.status = 'RefundVerified'
                            refundPaymentInfo.paymentMedia = 'landinterest'
                            refundPaymentInfo.refundDescription = "refunded because deal is canceled"
                            refundPaymentInfo.refundBy = refundBy

                            Bidspayment.create(refundPaymentInfo).then(function (bidPaymentResp) {
                                let findAllBidsPayments = {};
                                findAllBidsPayments.landInterestId = data.id;
                                findAllBidsPayments.type = { $ne: 'Earnest' }
                                Bidspayment.find(findAllBidsPayments).then(function (bidsPaymentsInfo) {
                                    let totalRefund = 0;
                                    async.each(bidsPaymentsInfo, function (payment, callback) {
                                        if (payment.status == 'Paid' || payment.status == 'Verified') {
                                            totalRefund = payment.amount + totalRefund;
                                            callback();
                                        } else {
                                            let updatedBidpayments = {}
                                            updatedBidpayments.paymentMode = 'AutoAdjusted';
                                            updatedBidpayments.originalAmount = payment.amount;
                                            updatedBidpayments.amount = 0;
                                            updatedBidpayments.isVerified = true;
                                            updatedBidpayments.status = 'Verified';
                                            Bidspayment.update({ id: payment.id }, updatedBidpayments).then(function (bidPaymentUpdated) {
                                                callback();
                                            })
                                        }
                                    }, function (asyncError) {
                                        let deductionAmount = 0.0
                                        if (refundBy == lndInterestInfo.buyerId && lndInterestInfo.buyerCancelDeductionPercentage) {
                                            deductionAmount = parseFloat(lndInterestInfo.landPrice) * parseFloat((parseFloat(lndInterestInfo.buyerCancelDeductionPercentage) / 100))
                                        }

                                        totalRefund = parseFloat(totalRefund) - parseFloat(deductionAmount)

                                        if (totalRefund > 0) {
                                            let finalObject = {};
                                            finalObject.landInterestId = bidsPaymentInfo.landInterestId;
                                            finalObject.landId = bidsPaymentInfo.landId;
                                            finalObject.sellerId = bidsPaymentInfo.sellerId;
                                            finalObject.buyerId = bidsPaymentInfo.buyerId;
                                            finalObject.amount = totalRefund;
                                            finalObject.originalAmount = totalRefund;
                                            finalObject.type = 'Final';
                                            finalObject.name = 'Refund';
                                            finalObject.status = 'Refund';
                                            finalObject.productType = 'land';
                                            finalObject.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString();
                                            Bidspayment.create(finalObject).then(function (refundPayment) {
                                                let sellerFndQry = {};
                                                sellerFndQry.landInterestId = data.id;
                                                Sellerpayment.find(sellerFndQry).then(function (sellerPayemnts) {
                                                    let sellerTotalRefund = 0;
                                                    async.each(sellerPayemnts, function (payment, callback) {
                                                        if (payment.status == 'Paid' || payment.status == 'Verified') {
                                                            sellerTotalRefund = payment.amount + sellerTotalRefund;
                                                            callback();
                                                        } else {
                                                            let updatedSellerpayments = {}
                                                            updatedSellerpayments.paymentMode = 'AutoAdjusted';
                                                            updatedSellerpayments.originalAmount = payment.amount;
                                                            updatedSellerpayments.amount = 0;
                                                            updatedSellerpayments.status = 'Verified';
                                                            Sellerpayment.update({ id: payment.id }, updatedSellerpayments).then(function (bidPaymentUpdated) {
                                                                callback();
                                                            })
                                                        }
                                                    }, function (asynError) {
                                                        let sellerChargedDeductionAmount = 0.0
                                                        if (refundBy == lndInterestInfo.sellerId && lndInterestInfo.sellerCancelDeductionPercentage) {
                                                            sellerChargedDeductionAmount = parseFloat(lndInterestInfo.landPrice) * parseFloat((parseFloat(lndInterestInfo.sellerCancelDeductionPercentage) / 100))
                                                        }

                                                        sellerTotalRefund = parseFloat(sellerTotalRefund) + parseFloat(sellerChargedDeductionAmount)

                                                        if (sellerTotalRefund > 0) {
                                                            let sellerFinalObject = {};
                                                            sellerFinalObject.landInterestId = bidsPaymentInfo.landInterestId;
                                                            sellerFinalObject.landId = bidsPaymentInfo.landId;
                                                            sellerFinalObject.sellerId = bidsPaymentInfo.sellerId;
                                                            sellerFinalObject.buyerId = bidsPaymentInfo.buyerId;
                                                            sellerFinalObject.amount = sellerTotalRefund;
                                                            sellerFinalObject.originalAmount = sellerTotalRefund;
                                                            sellerFinalObject.type = 'Final';
                                                            sellerFinalObject.name = 'Refund';
                                                            sellerFinalObject.status = 'Refund';
                                                            sellerFinalObject.productType = 'land';
                                                            sellerFinalObject.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString();
                                                            Sellerpayment.create(sellerFinalObject).then(function (sellerpaymentcreated) {

                                                                let franchiseFndQry = {};
                                                                franchiseFndQry.landInterestId = data.id;

                                                                FranchiseePayments.find(franchiseFndQry).then(function (franchiseePayment) {

                                                                    let franchiseeTotalRefund = 0;
                                                                    async.each(franchiseePayment, function (payment, callback) {
                                                                        if (payment.status == 'Paid' || payment.status == 'Verified') {
                                                                            franchiseeTotalRefund = payment.amount + franchiseeTotalRefund;
                                                                            callback();
                                                                        } else {
                                                                            let updatedFranchiseePayments = {}
                                                                            updatedFranchiseePayments.paymentMode = 'AutoAdjusted';
                                                                            updatedFranchiseePayments.originalAmount = payment.amount;
                                                                            updatedFranchiseePayments.amount = 0;
                                                                            updatedFranchiseePayments.status = 'Verified';
                                                                            FranchiseePayments.update({ id: payment.id }, updatedFranchiseePayments).then(function (frnPaymentUpdated) {
                                                                                callback();
                                                                            })
                                                                        }
                                                                    }, function (asyncError) {
                                                                        if (franchiseeTotalRefund > 0) {
                                                                            let franchiseeFinalObject = {};
                                                                            franchiseeFinalObject.landInterestId = bidsPaymentInfo.landInterestId;
                                                                            franchiseeFinalObject.landId = bidsPaymentInfo.landId;
                                                                            franchiseeFinalObject.sellerId = bidsPaymentInfo.sellerId;
                                                                            franchiseeFinalObject.buyerId = bidsPaymentInfo.buyerId;
                                                                            franchiseeFinalObject.amount = franchiseePayment.amount;
                                                                            franchiseeFinalObject.type = 'Final';
                                                                            franchiseeFinalObject.name = 'Refund';
                                                                            franchiseeFinalObject.status = 'Refund';
                                                                            franchiseeFinalObject.productType = 'land';
                                                                            franchiseeFinalObject.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString();
                                                                            FranchiseePayments.create(franchiseeFinalObject).then(function (franchiseepayment) {
                                                                                cancelAllScheduledVisits(data, context, req, res);
                                                                            })
                                                                        } else {
                                                                            cancelAllScheduledVisits(data, context, req, res);
                                                                        }
                                                                    })

                                                                })
                                                            })
                                                        } else {
                                                            cancelAllScheduledVisits(data, context, req, res);
                                                        }
                                                    })
                                                })
                                                // cancelAllScheduledVisits(data, context, req, res);
                                            })
                                        } else if (totalRefund == 0) {
                                            let sellerFndQry = {};
                                            sellerFndQry.landInterestId = data.id;
                                            Sellerpayment.find(sellerFndQry).then(function (sellerPayemnts) {
                                                let sellerTotalRefund = 0;
                                                async.each(sellerPayemnts, function (payment, callback) {
                                                    if (payment.status == 'Paid' || payment.status == 'Verified') {
                                                        sellerTotalRefund = payment.amount + sellerTotalRefund;
                                                        callback();
                                                    } else {
                                                        let updatedSellerpayments = {}
                                                        updatedSellerpayments.paymentMode = 'AutoAdjusted';
                                                        updatedSellerpayments.originalAmount = payment.amount;
                                                        updatedSellerpayments.amount = 0;
                                                        updatedSellerpayments.status = 'Verified';
                                                        Sellerpayment.update({ id: payment.id }, updatedSellerpayments).then(function (bidPaymentUpdated) {
                                                            callback();
                                                        })
                                                    }
                                                }, function (asynError) {

                                                    let sellerChargedDeductionAmount = 0.0
                                                    if (refundBy == lndInterestInfo.sellerId && lndInterestInfo.sellerCancelDeductionPercentage) {
                                                        sellerChargedDeductionAmount = parseFloat(lndInterestInfo.landPrice) * parseFloat((parseFloat(lndInterestInfo.sellerCancelDeductionPercentage) / 100))
                                                    }

                                                    sellerTotalRefund = parseFloat(sellerTotalRefund) + parseFloat(sellerChargedDeductionAmount)

                                                    if (sellerTotalRefund > 0) {
                                                        let sellerFinalObject = {};
                                                        sellerFinalObject.landInterestId = bidsPaymentInfo.landInterestId;
                                                        sellerFinalObject.landId = bidsPaymentInfo.landId;
                                                        sellerFinalObject.sellerId = bidsPaymentInfo.sellerId;
                                                        sellerFinalObject.buyerId = bidsPaymentInfo.buyerId;
                                                        sellerFinalObject.amount = sellerTotalRefund;
                                                        sellerFinalObject.originalAmount = sellerTotalRefund;
                                                        sellerFinalObject.type = 'Final';
                                                        sellerFinalObject.name = 'Refund';
                                                        sellerFinalObject.status = 'Refund';
                                                        sellerFinalObject.productType = 'land';
                                                        sellerFinalObject.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString();
                                                        Sellerpayment.create(sellerFinalObject).then(function (sellerpaymentcreated) {

                                                            let franchiseFndQry = {};
                                                            franchiseFndQry.landInterestId = data.id;

                                                            FranchiseePayments.find(franchiseFndQry).then(function (franchiseePayment) {

                                                                let franchiseeTotalRefund = 0;
                                                                async.each(franchiseePayment, function (payment, callback) {
                                                                    if (payment.status == 'Paid' || payment.status == 'Verified') {
                                                                        franchiseeTotalRefund = payment.amount + franchiseeTotalRefund;
                                                                        callback();
                                                                    } else {
                                                                        let updatedFranchiseePayments = {}
                                                                        updatedFranchiseePayments.paymentMode = 'AutoAdjusted';
                                                                        updatedFranchiseePayments.originalAmount = payment.amount;
                                                                        updatedFranchiseePayments.amount = 0;
                                                                        updatedFranchiseePayments.status = 'Verified';
                                                                        FranchiseePayments.update({ id: payment.id }, updatedFranchiseePayments).then(function (frnPaymentUpdated) {
                                                                            callback();
                                                                        })
                                                                    }
                                                                }, function (asyncError) {
                                                                    if (franchiseeTotalRefund > 0) {
                                                                        let franchiseeFinalObject = {};
                                                                        franchiseeFinalObject.landInterestId = bidsPaymentInfo.landInterestId;
                                                                        franchiseeFinalObject.landId = bidsPaymentInfo.landId;
                                                                        franchiseeFinalObject.sellerId = bidsPaymentInfo.sellerId;
                                                                        franchiseeFinalObject.buyerId = bidsPaymentInfo.buyerId;
                                                                        franchiseeFinalObject.amount = franchiseePayment.amount;
                                                                        franchiseeFinalObject.type = 'Final';
                                                                        franchiseeFinalObject.name = 'Refund';
                                                                        franchiseeFinalObject.status = 'Refund';
                                                                        franchiseeFinalObject.productType = 'land';
                                                                        franchiseeFinalObject.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString();
                                                                        FranchiseePayments.create(franchiseeFinalObject).then(function (franchiseepayment) {
                                                                            cancelAllScheduledVisits(data, context, req, res);
                                                                        })
                                                                    } else {
                                                                        cancelAllScheduledVisits(data, context, req, res);
                                                                    }
                                                                })

                                                            })


                                                        })
                                                    } else {
                                                        cancelAllScheduledVisits(data, context, req, res);
                                                    }
                                                })
                                            })
                                            // cancelAllScheduledVisits(data, context, req, res);
                                        } else {
                                            let finalObject = {};
                                            finalObject.landInterestId = bidsPaymentInfo.landInterestId;
                                            finalObject.landId = bidsPaymentInfo.landId;
                                            finalObject.sellerId = bidsPaymentInfo.sellerId;
                                            finalObject.buyerId = bidsPaymentInfo.buyerId;
                                            finalObject.amount = totalRefund;
                                            finalObject.originalAmount = totalRefund;
                                            finalObject.type = 'Final';
                                            finalObject.name = 'Final adjustment';
                                            finalObject.status = 'Due';
                                            finalObject.productType = 'land';
                                            finalObject.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString();
                                            Bidspayment.create(finalObject).then(function (refundPayment) {
                                                let sellerFndQry = {};
                                                sellerFndQry.landInterestId = data.id;
                                                Sellerpayment.find(sellerFndQry).then(function (sellerPayemnts) {
                                                    let sellerTotalRefund = 0;
                                                    async.each(sellerPayemnts, function (payment, callback) {
                                                        if (payment.status == 'Paid' || payment.status == 'Verified') {
                                                            sellerTotalRefund = payment.amount + sellerTotalRefund;
                                                            callback();
                                                        } else {
                                                            let updatedSellerpayments = {}
                                                            updatedSellerpayments.paymentMode = 'AutoAdjusted';
                                                            updatedSellerpayments.originalAmount = payment.amount;
                                                            updatedSellerpayments.amount = 0;
                                                            updatedSellerpayments.status = 'Verified';
                                                            Sellerpayment.update({ id: payment.id }, updatedSellerpayments).then(function (bidPaymentUpdated) {
                                                                callback();
                                                            })
                                                        }
                                                    }, function (asynError) {
                                                        let sellerChargedDeductionAmount = 0.0
                                                        if (refundBy == lndInterestInfo.sellerId && lndInterestInfo.sellerCancelDeductionPercentage) {
                                                            sellerChargedDeductionAmount = parseFloat(lndInterestInfo.landPrice) * parseFloat((parseFloat(lndInterestInfo.sellerCancelDeductionPercentage) / 100))
                                                        }

                                                        sellerTotalRefund = parseFloat(sellerTotalRefund) + parseFloat(sellerChargedDeductionAmount)

                                                        if (sellerTotalRefund > 0) {
                                                            let sellerFinalObject = {};
                                                            sellerFinalObject.landInterestId = bidsPaymentInfo.landInterestId;
                                                            sellerFinalObject.landId = bidsPaymentInfo.landId;
                                                            sellerFinalObject.sellerId = bidsPaymentInfo.sellerId;
                                                            sellerFinalObject.buyerId = bidsPaymentInfo.buyerId;
                                                            sellerFinalObject.amount = sellerTotalRefund;
                                                            sellerFinalObject.originalAmount = sellerTotalRefund;
                                                            sellerFinalObject.type = 'Final';
                                                            sellerFinalObject.name = 'Refund';
                                                            sellerFinalObject.status = 'Refund';
                                                            sellerFinalObject.productType = 'land';
                                                            sellerFinalObject.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString();
                                                            Sellerpayment.create(sellerFinalObject).then(function (sellerpaymentcreated) {

                                                                let franchiseFndQry = {};
                                                                franchiseFndQry.landInterestId = data.id;

                                                                FranchiseePayments.find(franchiseFndQry).then(function (franchiseePayment) {

                                                                    let franchiseeTotalRefund = 0;
                                                                    async.each(franchiseePayment, function (payment, callback) {
                                                                        if (payment.status == 'Paid' || payment.status == 'Verified') {
                                                                            franchiseeTotalRefund = payment.amount + franchiseeTotalRefund;
                                                                            callback();
                                                                        } else {
                                                                            let updatedFranchiseePayments = {}
                                                                            updatedFranchiseePayments.paymentMode = 'AutoAdjusted';
                                                                            updatedFranchiseePayments.originalAmount = payment.amount;
                                                                            updatedFranchiseePayments.amount = 0;
                                                                            updatedFranchiseePayments.status = 'Verified';
                                                                            FranchiseePayments.update({ id: payment.id }, updatedFranchiseePayments).then(function (frnPaymentUpdated) {
                                                                                callback();
                                                                            })
                                                                        }
                                                                    }, function (asyncError) {
                                                                        if (franchiseeTotalRefund > 0) {
                                                                            let franchiseeFinalObject = {};
                                                                            franchiseeFinalObject.landInterestId = bidsPaymentInfo.landInterestId;
                                                                            franchiseeFinalObject.landId = bidsPaymentInfo.landId;
                                                                            franchiseeFinalObject.sellerId = bidsPaymentInfo.sellerId;
                                                                            franchiseeFinalObject.buyerId = bidsPaymentInfo.buyerId;
                                                                            franchiseeFinalObject.amount = franchiseePayment.amount;
                                                                            franchiseeFinalObject.type = 'Final';
                                                                            franchiseeFinalObject.name = 'Refund';
                                                                            franchiseeFinalObject.status = 'Refund';
                                                                            franchiseeFinalObject.productType = 'land';
                                                                            franchiseeFinalObject.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString();
                                                                            FranchiseePayments.create(franchiseeFinalObject).then(function (franchiseepayment) {
                                                                                cancelAllScheduledVisits(data, context, req, res);
                                                                            })
                                                                        } else {
                                                                            cancelAllScheduledVisits(data, context, req, res);
                                                                        }
                                                                    })

                                                                })


                                                            })
                                                        } else {
                                                            cancelAllScheduledVisits(data, context, req, res);
                                                        }
                                                    })
                                                })
                                                // cancelAllScheduledVisits(data, context, req, res);
                                            })
                                        }
                                    })
                                })
                            })
                        }).fail(function (error) {
                            return res.jsonx({
                                success: false,
                                error: error
                            })
                        })
                    });
                } else {
                    return res.status(200).jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: info.RESPMSG
                        },
                    });
                }
            }).catch(function (err) {
                return res.jsonx({
                    success: false,
                    error: err
                })
            });
        });
    });
}

var dealCancelAndRefundBuyerAmount = function (lndInterestInfo, data, context, req, res) {

    // console.log("data == ", data)
    // var envPaytm = data.ENV // "development" "production";
    //     console.log("envPaytm == ", envPaytm)

    // console.log("constantObj.paytm_config[envPaytm] == ", constantObj.paytm_config[envPaytm])
    //         let paytm_key = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;
    // console.log("paytm_key == ", paytm_key)

    // return true

    //refund earnest amount also
    var request = require('request-promise');
    var envPaytm = data.ENV // "development" "production";

    data.id = lndInterestInfo.id;
    data.rejectedAt = new Date();
    data.comment = data.comment ? data.comment : "";
    data.reason = data.reason ? data.reason : "";
    data.canceledBy = context.identity.id;
    let refundBy = context.identity.id

    var findTransactionQry = {}
    findTransactionQry.landInterestId = data.id
    findTransactionQry.paymentType = "PayTm"
    findTransactionQry.processStatus = "TXN_SUCCESS"

    Transactions.findOne(findTransactionQry).then(function (bidTransactions) {
        if (bidTransactions == undefined) {
            return res.status(200).jsonx({
                success: false,
                error: {
                    code: 400,
                    message: 'transaction not found'
                },
            });
        }

        let REFUNDCode = commonServiceObj.getRefundCode("REFID");
        var paramlist = {};
        let refundAmount = parseFloat((bidTransactions.paymentjson.TXNAMOUNT) - (bidTransactions.paymentjson.TXNAMOUNT * 1.99 / 100)).toFixed(2)

        paramlist['MID'] = bidTransactions.paymentjson.MID;
        paramlist['TXNID'] = bidTransactions.paymentjson.TXNID;
        paramlist['ORDERID'] = bidTransactions.paymentjson.ORDERID;
        paramlist['REFUNDAMOUNT'] = refundAmount//parseFloat(bidTransactions.paymentjson.TXNAMOUNT) - parseFloat(bidTransactions.paymentjson.TXNAMOUNT * 3.98 / 100);
        paramlist['TXNTYPE'] = "REFUND";
        paramlist["REFID"] = REFUNDCode;

        //     console.log("data == ", data)
        //     console.log("envPaytm == ", envPaytm)

        // console.log("constantObj.paytm_config[envPaytm] == ", constantObj.paytm_config[envPaytm])
        //         let paytm_key = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;
        // console.log("paytm_key == ", paytm_key)

        // return true

        let paytm_key = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;

        // console.log("paramlist *------------------", paramlist) ;

        Payments.genchecksumforrefund(paramlist, paytm_key, (err, JsonData) => {

            let jsONDST = JSON.stringify(JsonData);
            // console.log("jsONDST *------------------", jsONDST) ;

            let refundApiPayTmUrl = constantObj.paytm_config[envPaytm].REFUND_URL + "?JsonData=" + jsONDST
            var options = {
                url: refundApiPayTmUrl,
                method: 'GET',
                headers: {
                    "Pragma": "no-cache",
                    "Cache-Control": "no-cache",
                    "Expires": 0
                }
            };

            // console.log("options *------------------", options) ;

            request(options).then(function (body) {

                var info = JSON.parse(body);
                console.log("info == ", info)
                if (info.STATUS == 'TXN_SUCCESS' || info.STATUS == 'PENDING') {

                    let transactionData = {};
                    transactionData.processedBy = refundBy;
                    transactionData.status = 'RF';
                    transactionData.transactionType = 'DebitEscrow';
                    transactionData.processStatus = info.RESPMSG;
                    transactionData.payTmRefundId = info.REFUNDID;
                    transactionData.refundjson = info;
                    transactionData.transactionId = bidTransactions.id;
                    transactionData.landInterestId = lndInterestInfo.id;
                    transactionData.land = lndInterestInfo.landId;
                    transactionData.sellerId = bidTransactions.sellerId;
                    transactionData.buyerId = bidTransactions.buyerId;
                    transactionData.paymentType = 'PayTm';
                    transactionData.refundAmount = parseFloat(bidTransactions.paymentjson.TXNAMOUNT) - parseFloat(bidTransactions.paymentjson.TXNAMOUNT * 1.99 / 100);

                    Transactions.create(transactionData).then(function (paymentsData) {
                        console.log("paymentsData************", paymentsData);
                        let bidFndQry = {};
                        bidFndQry.landInterestId = data.id;
                        bidFndQry.type = 'Earnest';

                        Bidspayment.findOne(bidFndQry).then(function (bidsPaymentInfo) {
                            console.log("found earnest == ", bidsPaymentInfo.id)
                            delete bidsPaymentInfo.id;
                            delete bidsPaymentInfo.createdAt;
                            delete bidsPaymentInfo.updatedAt;

                            let refundPaymentInfo = bidsPaymentInfo
                            refundPaymentInfo.amount = transactionData.refundAmount
                            refundPaymentInfo.originalAmount = transactionData.refundAmount
                            refundPaymentInfo.type = 'Earnest'
                            refundPaymentInfo.sequenceNumber = bidsPaymentInfo.sequenceNumber + 1
                            refundPaymentInfo.paymentDate = new Date()

                            refundPaymentInfo.paymentDueDate = new Date()
                            refundPaymentInfo.isVerified = true
                            refundPaymentInfo.verifyDate = new Date()
                            refundPaymentInfo.transactionId = paymentsData.id
                            refundPaymentInfo.paymentMode = 'PayTm'
                            refundPaymentInfo.name = 'Final'
                            refundPaymentInfo.depositDate = new Date()
                            refundPaymentInfo.depositedOn = new Date()
                            refundPaymentInfo.status = 'RefundVerified'
                            refundPaymentInfo.paymentMedia = 'landinterest'
                            refundPaymentInfo.refundDescription = "refunded because deal is canceled"
                            refundPaymentInfo.refundBy = refundBy


                            Bidspayment.create(refundPaymentInfo).then(function (bidPaymentResp) {
                                console.log("earnest refund generated == ", bidPaymentResp)
                                let findAllBidsPayments = {};
                                findAllBidsPayments.landInterestId = data.id;
                                findAllBidsPayments.type = { $ne: 'Earnest' }
                                Bidspayment.find(findAllBidsPayments).then(function (bidsPaymentsInfo) {
                                    let totalRefund = 0;
                                    async.each(bidsPaymentsInfo, function (payment, callback) {
                                        if (payment.status == 'Paid' || payment.status == 'Verified') {
                                            totalRefund = payment.amount + totalRefund;
                                            console.log("totalRefund 1 == ", totalRefund)
                                            callback();
                                        } else {
                                            let updatedBidpayments = {}
                                            updatedBidpayments.paymentMode = 'AutoAdjusted';
                                            updatedBidpayments.originalAmount = payment.amount;
                                            updatedBidpayments.amount = 0;
                                            updatedBidpayments.isVerified = true;
                                            updatedBidpayments.status = 'Verified';
                                            Bidspayment.update({ id: payment.id }, updatedBidpayments).then(function (bidPaymentUpdated) {

                                                console.log("bidPaymentUpdated 2n == ", bidPaymentUpdated)

                                                callback();
                                            }).fail(function (error) {
                                                console.log("error 4 == ", error)
                                                return res.jsonx({
                                                    success: false,
                                                    error: error
                                                })
                                            })
                                        }
                                    }, function (asyncError) {
                                        console.log("totalRefund == ", totalRefund)
                                        if (totalRefund > 0) {
                                            let finalObject = {};
                                            finalObject.landInterestId = bidsPaymentInfo.landInterestId;
                                            finalObject.landId = bidsPaymentInfo.landId;
                                            finalObject.sellerId = bidsPaymentInfo.sellerId;
                                            finalObject.buyerId = bidsPaymentInfo.buyerId;
                                            finalObject.amount = totalRefund;
                                            finalObject.type = 'Final';
                                            finalObject.name = 'Refund';
                                            finalObject.status = 'Refund';
                                            finalObject.productType = 'land';
                                            finalObject.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString();

                                            Bidspayment.create(finalObject).then(function (refundPayment) {
                                                console.log("refundPayment == ", refundPayment)
                                                cancelAllScheduledVisits(data, context, req, res);
                                            }).fail(function (error) {
                                                console.log("error 3 == ", error)
                                                return res.jsonx({
                                                    success: false,
                                                    error: error
                                                })
                                            })
                                        } else {
                                            cancelAllScheduledVisits(data, context, req, res);
                                        }
                                    })
                                })
                            }).fail(function (error) {
                                console.log("error 2 == ", error)
                                return res.jsonx({
                                    success: false,
                                    error: error
                                })
                            })
                        })
                    }).fail(function (error) {
                        console.log("error 1 == ", error)
                        return res.jsonx({
                            success: false,
                            error: error
                        })
                    });
                } else {
                    if (envPaytm == 'development') {
                        let transactionData = {};
                        transactionData.processedBy = refundBy;
                        transactionData.status = 'RF';
                        transactionData.transactionType = 'DebitEscrow';
                        transactionData.processStatus = info.RESPMSG;
                        transactionData.payTmRefundId = info.REFUNDID;
                        transactionData.refundjson = info;
                        transactionData.transactionId = bidTransactions.id;
                        transactionData.landInterestId = lndInterestInfo.id;
                        transactionData.land = lndInterestInfo.landId;
                        transactionData.sellerId = bidTransactions.sellerId;
                        transactionData.buyerId = bidTransactions.buyerId;
                        transactionData.paymentType = 'PayTm';
                        transactionData.refundAmount = parseFloat(bidTransactions.paymentjson.TXNAMOUNT) - parseFloat(bidTransactions.paymentjson.TXNAMOUNT * 3.98 / 100);

                        Transactions.create(transactionData).then(function (paymentsData) {
                            console.log("paymentsData************", paymentsData);
                            let bidFndQry = {};
                            bidFndQry.landInterestId = data.id;
                            bidFndQry.type = 'Earnest';

                            Bidspayment.findOne(bidFndQry).then(function (bidsPaymentInfo) {
                                console.log("found earnest 1 == ", bidsPaymentInfo.id)
                                delete bidsPaymentInfo.id;
                                delete bidsPaymentInfo.createdAt;
                                delete bidsPaymentInfo.updatedAt;

                                let refundPaymentInfo = bidsPaymentInfo
                                refundPaymentInfo.amount = transactionData.refundAmount
                                refundPaymentInfo.originalAmount = transactionData.refundAmount
                                refundPaymentInfo.type = 'Earnest'
                                refundPaymentInfo.sequenceNumber = bidsPaymentInfo.sequenceNumber + 1
                                refundPaymentInfo.paymentDate = new Date()

                                refundPaymentInfo.paymentDueDate = new Date()
                                refundPaymentInfo.isVerified = true
                                refundPaymentInfo.verifyDate = new Date()
                                refundPaymentInfo.transactionId = paymentsData.id
                                refundPaymentInfo.paymentMode = 'PayTm'
                                refundPaymentInfo.name = 'Final'
                                refundPaymentInfo.depositDate = new Date()
                                refundPaymentInfo.depositedOn = new Date()
                                refundPaymentInfo.status = 'RefundVerified'
                                refundPaymentInfo.paymentMedia = 'landinterest'
                                refundPaymentInfo.refundDescription = "refunded because deal is canceled"
                                refundPaymentInfo.refundBy = refundBy

                                Bidspayment.create(refundPaymentInfo).then(function (bidPaymentResp) {
                                    console.log("refund of earnesst generated 1 == ", bidPaymentResp)
                                    let findAllBidsPayments = {};
                                    findAllBidsPayments.landInterestId = data.id;
                                    findAllBidsPayments.type = { $ne: 'Earnest' }
                                    Bidspayment.find(findAllBidsPayments).then(function (bidsPaymentsInfo) {
                                        let totalRefund = 0;
                                        async.each(bidsPaymentsInfo, function (payment, callback) {
                                            if (payment.status == 'Paid' || payment.status == 'Verified') {
                                                console.log("totalRefund 4 == ", totalRefund)
                                                totalRefund = payment.amount + totalRefund;
                                                callback();
                                            } else {
                                                let updatedBidpayments = {}
                                                updatedBidpayments.paymentMode = 'AutoAdjusted';
                                                updatedBidpayments.originalAmount = payment.amount;
                                                updatedBidpayments.amount = 0;
                                                updatedBidpayments.isVerified = true;
                                                updatedBidpayments.status = 'Verified';
                                                Bidspayment.update({ id: payment.id }, updatedBidpayments).then(function (bidPaymentUpdated) {
                                                    console.log("bidPaymentUpdated 4n == ", bidPaymentUpdated)
                                                    callback();
                                                }).fail(function (error) {
                                                    console.log("error 4n == ", error)
                                                    return res.jsonx({
                                                        success: false,
                                                        error: error
                                                    })
                                                })
                                            }
                                        }, function (asyncError) {
                                            console.log("totalRefund 2 == ", totalRefund)
                                            if (totalRefund > 0) {
                                                let finalObject = {};
                                                finalObject.landInterestId = bidsPaymentInfo.landInterestId;
                                                finalObject.landId = bidsPaymentInfo.landId;
                                                finalObject.sellerId = bidsPaymentInfo.sellerId;
                                                finalObject.buyerId = bidsPaymentInfo.buyerId;
                                                finalObject.amount = totalRefund;
                                                finalObject.type = 'Final';
                                                finalObject.name = 'Refund';
                                                finalObject.status = 'Refund';
                                                finalObject.productType = 'land';
                                                finalObject.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString();
                                                Bidspayment.create(finalObject).then(function (refundPayment) {
                                                    cancelAllScheduledVisits(data, context, req, res);
                                                }).fail(function (error) {
                                                    console.log("error 3n == ", error)
                                                    return res.jsonx({
                                                        success: false,
                                                        error: error
                                                    })
                                                })
                                            } else {
                                                cancelAllScheduledVisits(data, context, req, res);
                                            }
                                        })
                                    })

                                }).fail(function (error) {
                                    console.log("error 2n == ", error)
                                    return res.jsonx({
                                        success: false,
                                        error: error
                                    })
                                })
                            })
                        }).fail(function (error) {
                            console.log("error 1n == ", error)
                            return res.jsonx({
                                success: false,
                                error: error
                            })
                        });;
                    } else {
                        return res.status(200).jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: info.RESPMSG
                            },
                        });
                    }
                }
            }).catch(function (err) {
                return res.jsonx({
                    success: false,
                    error: err
                })
            });
        });
    });
}

var dealCancelforEarnestAmount = function (lndInterestInfo, data, context, req, res) {
    console.log("data == ", data)
    console.log("3")
    var request = require('request-promise');
    // var data = {};
    var envPaytm = data.ENV || "development" // "development" "production";
    //console.log(envPaytm, 'envPaytm====')
    data.id = lndInterestInfo.id;
    data.rejectedAt = new Date();
    data.cancelReason = data.cancelReason ? data.cancelReason : "";
    data.cancelComment = data.cancelComment ? data.cancelComment : "";
    data.canceledBy = context.identity.id;
    let refundBy = context.identity.id

    var findTransactionQry = {}
    findTransactionQry.landInterestId = data.id
    findTransactionQry.paymentType = "PayTm"
    findTransactionQry.processStatus = "TXN_SUCCESS"

    console.log("4")
    Transactions.findOne(findTransactionQry).then(function (bidTransactions) {
        if (bidTransactions == undefined) {
            return res.status(200).jsonx({
                success: false,
                error: {
                    code: 400,
                    message: 'transaction not found'
                },
            });
        }

        let refundAmount = parseFloat((bidTransactions.paymentjson.TXNAMOUNT) - (bidTransactions.paymentjson.TXNAMOUNT * 3.98 / 100)).toFixed(2)
        console.log("5")
        let REFUNDCode = commonServiceObj.getRefundCode("REFID");
        var paramlist = {};

        paramlist['MID'] = bidTransactions.paymentjson.MID;
        paramlist['TXNID'] = bidTransactions.paymentjson.TXNID;
        paramlist['ORDERID'] = bidTransactions.paymentjson.ORDERID;
        paramlist['REFUNDAMOUNT'] = refundAmount + "";
        paramlist['TXNTYPE'] = "REFUND";
        paramlist["REFID"] = REFUNDCode;
        let paytm_key = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;

        // console.log(paramlist, "paramlist *------------------", paytm_key);

        console.log("6")
        console.log("data == ", data)
        Payments.genchecksumforrefund(paramlist, paytm_key, (err, JsonData) => {
            let jsONDST = JSON.stringify(JsonData);
            // console.log("jsONDST *------------------", jsONDST);

            let refundApiPayTmUrl = constantObj.paytm_config[envPaytm].REFUND_URL + "?JsonData=" + jsONDST
            var options = {
                url: refundApiPayTmUrl,
                method: 'GET',
                headers: {
                    "Pragma": "no-cache",
                    "Cache-Control": "no-cache",
                    "Expires": 0
                }
            };

            // console.log("options *------------------", options);

            console.log("7")
            request(options).then(function (body) {

                // console.log("request response body Paytm+++++++++", body);
                console.log("data == ", data)
                var info = JSON.parse(body);

                if (info.STATUS == 'TXN_SUCCESS' || info.STATUS == 'PENDING') {

                    console.log("8")

                    let transactionData = {};
                    transactionData.processedBy = refundBy;
                    transactionData.status = 'RF';
                    transactionData.transactionType = 'DebitEscrow';
                    transactionData.processStatus = info.RESPMSG;
                    transactionData.payTmRefundId = info.REFUNDID;
                    transactionData.refundjson = info;
                    transactionData.transactionId = bidTransactions.id;
                    transactionData.landInterestId = lndInterestInfo.id;
                    transactionData.land = lndInterestInfo.landId;
                    transactionData.sellerId = bidTransactions.sellerId;
                    transactionData.buyerId = bidTransactions.buyerId;
                    transactionData.paymentType = 'PayTm';
                    transactionData.refundAmount = refundAmount

                    Transactions.create(transactionData).then(function (paymentsData) {
                        console.log("9")
                        let bidFndQry = {};
                        bidFndQry.landInterestId = data.id;
                        bidFndQry.type = 'Earnest';

                        Bidspayment.findOne(bidFndQry).then(function (bidsPaymentInfo) {
                            console.log("10 ======= ")


                            delete bidsPaymentInfo.id;
                            delete bidsPaymentInfo.createdAt;
                            delete bidsPaymentInfo.updatedAt;

                            let refundPaymentInfo = bidsPaymentInfo
                            refundPaymentInfo.amount = refundAmount
                            refundPaymentInfo.originalAmount = refundAmount
                            refundPaymentInfo.type = 'Earnest'
                            refundPaymentInfo.sequenceNumber = bidsPaymentInfo.sequenceNumber + 1
                            refundPaymentInfo.paymentDate = new Date()

                            refundPaymentInfo.paymentDueDate = new Date()
                            refundPaymentInfo.isVerified = true
                            refundPaymentInfo.verifyDate = new Date()
                            refundPaymentInfo.transactionId = paymentsData.id
                            refundPaymentInfo.paymentMode = 'PayTm'
                            refundPaymentInfo.name = 'Final'
                            refundPaymentInfo.depositDate = new Date()
                            refundPaymentInfo.depositedOn = new Date()
                            refundPaymentInfo.status = 'RefundVerified'
                            refundPaymentInfo.paymentMedia = 'landinterest'
                            refundPaymentInfo.refundDescription = "refunded because deal is canceled"
                            refundPaymentInfo.refundBy = refundBy

                            Bidspayment.create(refundPaymentInfo).then(function (bidPaymentResp) {
                                console.log("13")

                                cancelAllScheduledVisits(data, context, req, res);
                            }).fail(function (error) {
                                console.log("error == ", error)

                                return res.jsonx({
                                    success: false,
                                    error: error
                                })
                            })
                        }).fail(function (error) {
                            console.log("error == ", error)

                            return res.jsonx({
                                success: false,
                                error: error
                            })
                        })
                    });
                } else {

                    console.log("data == ", data)
                    console.log("9")

                    if (envPaytm == 'development') {
                        let transactionData = {};
                        transactionData.processedBy = refundBy;
                        transactionData.status = 'RF';
                        transactionData.transactionType = 'DebitEscrow';
                        transactionData.processStatus = info.RESPMSG;
                        transactionData.payTmRefundId = info.REFUNDID;
                        transactionData.refundjson = info;
                        transactionData.transactionId = bidTransactions.id;
                        transactionData.landInterestId = lndInterestInfo.id;
                        transactionData.land = lndInterestInfo.landId;
                        transactionData.sellerId = bidTransactions.sellerId;
                        transactionData.buyerId = bidTransactions.buyerId;
                        transactionData.paymentType = 'PayTm';
                        transactionData.refundAmount = refundAmount;

                        console.log("10")

                        Transactions.create(transactionData).then(function (paymentsData) {
                            let bidFndQry = {};
                            bidFndQry.landInterestId = data.id;
                            bidFndQry.type = 'Earnest';

                            console.log("11")


                            Bidspayment.findOne(bidFndQry).then(function (bidsPaymentInfo) {
                                delete bidsPaymentInfo.id;
                                delete bidsPaymentInfo.createdAt;
                                delete bidsPaymentInfo.updatedAt;

                                let refundPaymentInfo = bidsPaymentInfo
                                refundPaymentInfo.amount = refundAmount
                                refundPaymentInfo.originalAmount = refundAmount
                                refundPaymentInfo.type = 'Earnest'
                                refundPaymentInfo.sequenceNumber = bidsPaymentInfo.sequenceNumber + 1
                                refundPaymentInfo.paymentDate = new Date()

                                refundPaymentInfo.paymentDueDate = new Date()
                                refundPaymentInfo.isVerified = true
                                refundPaymentInfo.verifyDate = new Date()
                                refundPaymentInfo.transactionId = paymentsData.id
                                refundPaymentInfo.paymentMode = 'PayTm'
                                refundPaymentInfo.name = 'Final'
                                refundPaymentInfo.depositDate = new Date()
                                refundPaymentInfo.depositedOn = new Date()
                                refundPaymentInfo.status = 'RefundVerified'
                                refundPaymentInfo.paymentMedia = 'landinterest'
                                refundPaymentInfo.refundDescription = "refunded because deal is canceled"
                                refundPaymentInfo.refundBy = refundBy

                                console.log("12")

                                Bidspayment.create(refundPaymentInfo).then(function (bidPaymentResp) {

                                    console.log("112")



                                    console.log("data == ", data)
                                    cancelAllScheduledVisits(data, context, req, res);
                                })
                            }).fail(function (error) {
                                return res.jsonx({
                                    success: false,
                                    error: error
                                })
                            })
                        }).fail(function (error) {
                            console.log("error112 == ", error)
                            return res.jsonx({
                                success: false,
                                error: error
                            })
                        })
                    } else {
                        return res.status(200).jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: info.RESPMSG
                            },
                        });
                    }
                }
            }).catch(function (err) {
                return res.jsonx({
                    success: false,
                    error: err
                })
            });
        });
    });
}

var cancelAllScheduledVisits = function (data, context, req, res) {
    console.log("data == ", data)
    let fndQry = {}
    fndQry.landInterestId = data.id;
    fndQry.visitStatus = 'scheduled';
    let updateStatus = {}
    updateStatus.visitStatus = 'canceled';
    console.log("14")

    LandVisitSchedules.update(fndQry, updateStatus).then(function (visitSchedule) {
        console.log("15")
        console.log("data == ", data)
        data.status = 'canceled'
        updateLandInterestStatus(data, context, req, res);
    })
}

var deleteAllScheduledMeeting = function (data, context, req, res) {

    let fndQry = {}
    fndQry.landInterestId = data.id;
    fndQry.visitStatus = 'scheduled';
    LandVisitSchedules.destroy(fndQry).then(function (visitSchedule) {
        updateLandInterestStatus(data, context, req, res);
    })
}

generateFranchiseePayments = function (lndInterestInfo, data, context, req, res) {
    // code for buyer payment genereate
    let landId = lndInterestInfo.landId;

    if (lndInterestInfo.registryDate == undefined) {
        return res.jsonx({
            success: false,
            error: {
                code: 400,
                message: 'Please enter registry or lease transfer date first.'
            }
        })
    } else {
        Lands.findOne({ id: landId }).then(function (landInfo) {
            var fpQuery = {}
            fpQuery.landId = landInfo.id
            fpQuery.landInterestId = lndInterestInfo.id
            fpQuery.sellerId = landInfo.user
            fpQuery.buyerId = lndInterestInfo.buyerId
            fpQuery.amount = parseFloat(lndInterestInfo.landPrice) * parseFloat(lndInterestInfo.franchiseeCommissionPercent / 100)
            fpQuery.pincode = landInfo.pincode
            fpQuery.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString()
            fpQuery.status = 'Due';
            fpQuery.franchiseeUserId = lndInterestInfo.franchiseeId,
                fpQuery.productType = 'land';
            FranchiseePayments.create(fpQuery).then(function (franchiseePayment) {
                if (franchiseePayment) {
                    deleteAllScheduledMeeting(data, context, req, res)
                }
            })
        })
    }
}

var buyerPaymentGenerate = function (lndInterestInfo, data, context, req, res) {
    // code for buyer payment genereate
    let landId = lndInterestInfo.landId;
    let buyerTotalAmount = parseFloat(lndInterestInfo.buyerTotalAmount) - parseFloat(lndInterestInfo.earnestAmount);

    let existingPaymentscount = {}
    existingPaymentscount.landInterestId = lndInterestInfo.id
    existingPaymentscount.type = { $ne: 'Earnest' }
    existingPaymentscount.$and = [{ status: { $ne: 'Refund' } }, { status: { $ne: 'OverdueRefund' } }, { status: { $ne: 'Refunded' } }, { status: { $ne: 'RefundVerified' } }]

    Bidspayment.count(existingPaymentscount).then(function (exispaymens) {
        if (exispaymens == 0) {
            Lands.findOne({ id: landId }).then(function (landInfo) {
                var buyerPayments = [];
                var sequenceNumber = 0;
                let days = 0
                let percentage = 0
                landInfo.buyerDepositPayment.forEach((obj, i) => {
                    let number = ++sequenceNumber;
                    days = days + obj.days
                    console.log("days 12 == ", days)

                    percentage = percentage + obj.percentage
                    let object = {
                        landId: landInfo.id,
                        landInterestId: lndInterestInfo.id,
                        sellerId: landInfo.user,
                        buyerId: lndInterestInfo.buyerId,
                        depositPercentage: obj.percentage,
                        percentage: obj.percentage,
                        name: obj.label,
                        depositLabel: obj.label,
                        depositDays: obj.days,
                        days: days,
                        pincode: landInfo.pincode,
                        type: "Deposit",
                        status: "Due",
                        sequenceNumber: number,
                        productType: 'land',
                        paymentMedia: 'landinterest',
                        amount: parseFloat(buyerTotalAmount * parseFloat(obj.percentage / 100)),
                        paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
                    }
                    console.log("object == ", object)

                    buyerPayments.push(object);
                })

                days = days + landInfo.buyerFinalDays
                console.log("days 11 == ", days)
                let SequenceNumber = ++sequenceNumber;
                let finalPercentage = 100 - percentage;

                let finalObject = {
                    landId: landInfo.id,
                    landInterestId: lndInterestInfo.id,
                    sellerId: landInfo.user,
                    buyerId: lndInterestInfo.buyerId,
                    depositPercentage: finalPercentage,
                    percentage: finalPercentage,
                    name: "Final",
                    depositLabel: "Final",
                    depositDays: landInfo.buyerFinalDays,
                    days: days,
                    pincode: landInfo.pincode,
                    type: "Final",
                    status: "Due",
                    productType: 'land',
                    paymentMedia: 'landinterest',
                    sequenceNumber: SequenceNumber,
                    amount: parseFloat(buyerTotalAmount * parseFloat((finalPercentage) / 100)),
                    paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString()
                }
                console.log("finalObject == ", finalObject)
                buyerPayments.push(finalObject);

                for (var i = 0; i < buyerPayments.length; i++) {
                    if (buyerPayments[i].amount < 1) {
                        buyerPayments[i].amount = 0
                        buyerPayments[i].paymentMode = 'AutoAdjusted'
                        buyerPayments[i].status = 'Verified'
                        buyerPayments[i].isVerified = true
                        buyerPayments[i].depositedOn = new Date()
                    }
                }
                Bidspayment.create(buyerPayments).then(function (bidpayments) {
                    updateLandInterestStatus(data, context, req, res);
                })
            })
        } else {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: 'Payments already created. Please check payments'
                }
            })
        }
    })
}

var updateLandInterestStatus = function (data, context, req, res) {
    let fndQry = {}
    fndQry.id = data.id;
    let updateData = {};
    updateData.status = data.status;

    if (data.status == 'canceled') {
        data.canceledOn = new Date()
        if (data.cancelReason == undefined || data.cancelReason == "") {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: 'Please enter cancel reason.'
                }
            })
        } else {
            updateData.cancelComment = data.cancelComment
            updateData.cancelReason = data.cancelReason;
            updateData.canceledBy = context.identity.id;
        }
    } else if (data.status == 'transferred') {
        updateData.transferDate = new Date()
    }

    Landinterests.findOne(fndQry, { fields: ['status'] }).then(function (li) {
        var addLandBack = false
        if (li.status == 'payments_done' && data.status == 'canceled') {
            addLandBack = true
        }

        Landinterests.update(fndQry, updateData).then(function (lndInterestUpdate) {
            Landinterests.findOne(fndQry).populate('landId').populate('marketId').populate('sellerId').then(function (lndInterestfi) {
                let msg = 'Deal status updated'
                let msgtitle = 'Status updated'
                if (data.status == 'deal_accepted') {
                    msg = 'Land deal with id ' + lndInterestfi.code + ' is accepted'
                    msgtitle = 'Deal Accepted'

                    let usersforsms = []

                    if (lndInterestfi.franchiseeId != undefined) {
                        usersforsms.push(lndInterestfi.franchiseeId)
                    }

                    if (lndInterestfi.coordinator != undefined) {
                        usersforsms.push(lndInterestfi.coordinator)
                    }

                    if (usersforsms.length > 0) {
                        let landfor = lndInterestfi.dealType
                        if (landfor == "Sell") {
                            landfor = "Buy"
                        }
                        let sendSMSToFranchisee = {}
                        sendSMSToFranchisee.variables = { "{#BB#}": landfor, "{#CC#}": lndInterestfi.landId.code, "{#DD#}": "Farmer" }
                        sendSMSToFranchisee.templateId = "42767"
                        commonService.sendGeneralSMSToUsersWithId(sendSMSToFranchisee, usersforsms)
                    }
                } else if (data.status == 'canceled') {
                    msg = 'Land deal with id ' + lndInterestfi.code + ' is canceled due to ' + lndInterestfi.cancelReason
                    msgtitle = 'Deal Canceled'

                    if (lndInterestfi.canceledBy == lndInterestfi.franchiseeId || lndInterestfi.canceledBy == lndInterestfi.coordinator) {
                        let landfor = lndInterestfi.dealType
                        if (landfor == "Sell") {
                            landfor = "Buy"
                        }
                        let sendSMSToFranchisee = {}
                        sendSMSToFranchisee.variables = { "{#BB#}": landfor, "{#CC#}": lndInterestfi.landId.code, "{#DD#}": lndInterestfi.marketId.name }
                        sendSMSToFranchisee.templateId = "42672"
                        commonService.sendGeneralSMSToUsersWithId(sendSMSToFranchisee, lndInterestfi.buyerId)

                    } else if (lndInterestfi.canceledBy == lndInterestfi.buyerId) {
                        let usersforsms = []

                        if (lndInterestfi.franchiseeId != undefined) {
                            usersforsms.push(lndInterestfi.franchiseeId)
                        }

                        if (lndInterestfi.coordinator != undefined) {
                            usersforsms.push(lndInterestfi.coordinator)
                        }

                        if (usersforsms.length > 0) {

                            let landfor = lndInterestfi.dealType
                            if (landfor == "Sell") {
                                landfor = "Buy"
                            }
                            let sendSMSToFranchisee = {}
                            sendSMSToFranchisee.variables = { "{#BB#}": landfor, "{#CC#}": lndInterestfi.landId.code, "{#DD#}": lndInterestfi.sellerId.fullName }
                            sendSMSToFranchisee.templateId = "42661"
                            commonService.sendGeneralSMSToUsersWithId(sendSMSToFranchisee, usersforsms)
                        }

                    }

                } else if (data.status == 'revisit') {
                    msg = 'Land deal with id ' + lndInterestfi.code + ' is scheduled for a revisit '
                    msgtitle = 'Revisit asked'
                } else if (data.status == 'payments_done') {
                    msg = "All payments of land deal id (" + lndInterestfi.code + ") are done.";
                    msgtitle = 'Payments done'
                } else if (data.status == 'deal_requested') {
                    msg = "Land deal with id " + lndInterestfi.code + " is requested to accept.";
                    msgtitle = 'Deal acceptance requested'
                }

                var notificationData = {};
                notificationData.productId = lndInterestfi.landId.id;
                notificationData.land = lndInterestfi.landId.id;
                notificationData.buyerId = lndInterestfi.buyerId;
                notificationData.user = lndInterestfi.buyerId;
                notificationData.productType = "lands";
                //notificationData.transactionOwner = u[0].id;
                // notificationData.transactionOwner = land.transactionOwner;
                notificationData.message = msg;
                notificationData.messageKey = "LAND_DEAL_STATUS_UPDATE_NOTIFICATION"
                notificationData.readBy = [];
                notificationData.messageTitle = msgtitle
                let pushnotreceiver = [lndInterestfi.buyerId]
                if (lndInterestfi.franchiseeId != undefined) {
                    pushnotreceiver.push(lndInterestfi.franchiseeId)
                }

                Notifications.create(notificationData).then(function (notificationResponse) {
                    if (notificationResponse) {
                        commonService.notifyUsersFromNotification(notificationResponse, lndInterestfi.landId)
                        pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                    }
                    if (data.status == 'deal_requested') {
                        let uniqueId = Date.now();
                        Landinterests.update(fndQry, { uniqueId: uniqueId }).then(function (lndInterestInfo) {
                            sendEmailForDeal(lndInterestfi, data, context, req, res)
                        })
                    } else if (data.status == 'payments_done') {
                        var d = new Date();
                        var month = d.getMonth();
                        var year = d.getFullYear();

                        var yrStore = ""
                        if (month < 3) {
                            yrStore = (year - 1).toString().substr(-2) + "-" + year.toString().substr(-2)
                        } else {
                            yrStore = year.toString().substr(-2) + "-" + (year + 1).toString().substr(-2)
                        }

                        Invoice.find({ financialYear: yrStore, type: { $ne: "fieldtransaction" } }).sort('number DESC').then(function (invoices) {
                            let numberToAssign = 1
                            if (invoices.length > 0) {
                                let invoice = invoices[0]
                                numberToAssign = invoice.number + 1
                            }

                            let createInvoiceData = {}
                            createInvoiceData.type = "landinterest"
                            createInvoiceData.landdeal = lndInterestfi.id
                            createInvoiceData.number = numberToAssign
                            createInvoiceData.financialYear = yrStore

                            Invoice.create(createInvoiceData).then(function (createdInvoice) {
                                Landinterests.update(fndQry, { invoice: createdInvoice.id }).then(function (lndInterestInfo) {
                                    return res.jsonx({
                                        success: true,
                                        code: 200,
                                        data: {
                                            deal: lndInterestUpdate[0],
                                            message: 'Deal status updated'
                                        }
                                    })
                                })
                            })
                        })
                    } else {
                        if (addLandBack) {
                            Lands.update({ id: lndInterestfi.landId.id }, { availableArea: lndInterestfi.landId.availableArea + lndInterestfi.area }).then(function (updatedland) {
                                return res.jsonx({
                                    success: true,
                                    code: 200,
                                    data: {
                                        deal: lndInterestUpdate[0],
                                        message: 'Deal status updated'
                                    }
                                })
                            })
                        } else {
                            return res.jsonx({
                                success: true,
                                code: 200,
                                data: {
                                    deal: lndInterestUpdate[0],
                                    message: 'Deal status updated'
                                }
                            })
                        }
                    }
                })
            })
        })
    })
}

var reVisit = function (lndInterestInfo, data, context, req, res) {

    if (lndInterestInfo.status == 'canceled') {
        return res.jsonx({
            success: false,
            error: {
                code: 400,
                message: "Deal is canceled, can not revisit. Please book and pay again for this land"
            },
        });
    } else if (lndInterestInfo.status == 'failed') {
        return res.jsonx({
            success: false,
            error: {
                code: 400,
                message: "Deal is fail, can not revisit. Please book and pay again for this land"
            },
        });
    } else if (lndInterestInfo.status == 'transferred') {
        return res.jsonx({
            success: false,
            error: {
                code: 400,
                message: "Land already transferred to buyer. Can not schedule visit with franchisee."
            },
        });
    } else {
        let now = new Date()
        let visittime = new Date(data.visitTime)

        if (visittime < now) {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: 'Visit date can not be past date and time'
                }
            });
        } else {
            LandVisitSchedules.count({ landInterestId: lndInterestInfo.id, visitStatus: 'scheduled' }).then(function (scheviisiits) {
                if (scheviisiits > 0) {
                    return res.jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: "Visit is already scheduled."
                        },
                    });
                } else {
                    LandVisitSchedules.count({ landInterestId: lndInterestInfo.id }).then(function (allVisists) {
                        let sv = {}
                        sv.landId = lndInterestInfo.landId
                        sv.landInterestId = lndInterestInfo.id
                        sv.buyerId = lndInterestInfo.buyerId
                        sv.sellerId = lndInterestInfo.sellerId
                        sv.franchiseeId = lndInterestInfo.franchiseeId
                        sv.market = lndInterestInfo.marketId
                        sv.visitTime = data.visitTime
                        sv.visitType = allVisists + 1
                        sv.dealDateTime = lndInterestInfo.createdAt
                        if (lndInterestInfo.coordinator) {
                            sv.coordinator = lndInterestInfo.coordinator
                        }

                        LandVisitSchedules.create(sv).exec(function (error, reVisit) {
                            if (error) {
                                return res.jsonx({
                                    success: false,
                                    error: error
                                });
                            } else {
                                if (lndInterestInfo.status == 'interested' || lndInterestInfo.status == 'deal_requested') {
                                    let interestUpdate = {};
                                    interestUpdate.status = 'revisit';

                                    Landinterests.update({ id: lndInterestInfo.id }, interestUpdate).then(function (lndInterestUpdae) {
                                        return res.jsonx({
                                            success: true,
                                            data: {
                                                deal: lndInterestUpdae,
                                                message: "New visit is scheduled."
                                            }
                                        })
                                    })
                                } else {
                                    return res.jsonx({
                                        success: true,
                                        data: {
                                            deal: lndInterestInfo,
                                            message: "New visit is scheduled."
                                        }
                                    })
                                }
                            }
                        })
                    })
                }
            })
        }
    }
}

var sendEmailForDeal = function (lndInterestInfo, data, context, req, res) {
    // console.log(lndInterestInfo, 'lndInterestInfo info=====')

    const reqHOst = req.headers.origin;

    let userId = lndInterestInfo.buyerId;
    let url = reqHOst + "/lands/my-interest"//"/lands/payment/" //+ lndInterestInfo.id;
    var message = '<br/><br/>';
    message += 'This mail is in regard to keep you informed about the land deal request, please confirm.' + url;
    message += '<br/><br/>';
    message += '<br/><br/><br/>';
    message += 'Thanks';
    message += '<br> <strong> Team FarmX </strong>';


    let landfor = lndInterestInfo.dealType
    if (landfor == "Sell") {
        landfor = "Buy"
    }
    let sendSMSToFranchisee = {}
    sendSMSToFranchisee.variables = { "{#BB#}": landfor, "{#CC#}": lndInterestInfo.landId.code, "{#DD#}": lndInterestInfo.marketId.name, "{#FF#}": url }
    sendSMSToFranchisee.templateId = "42766"
    commonService.sendGeneralSMSToUsersWithId(sendSMSToFranchisee, lndInterestInfo.buyerId)

    Users.findOne({ id: userId }).then(function (user) {
        if (typeof (user.email) != "undefined") {
            let messageToSend = "Hi " + user.fullName + ", " + message
            let emailMessage = {
                from: sails.config.appSMTP.auth.user,
                to: user.email,
                subject: 'FarmX: Land Deal',
                html: messageToSend
            };
            transport.sendMail(emailMessage, function (err, info) {
                if (err) {
                    return res.jsonx({
                        success: true,
                        error: err
                    })
                } else {
                    return res.jsonx({
                        success: true,
                        code: 200,
                        data: {
                            deal: lndInterestInfo[0],
                            message: 'Deal status updated'
                        }
                    })
                }
            });
        } else {
            return res.jsonx({
                success: true,
                code: 200,
                data: {
                    deal: lndInterestInfo[0],
                    message: 'Deal status updated'
                }
            })
        }

    })
}

