/**
 * LandInterestController
 *
 * @description :: Server-side logic for managing lands
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var path = require('path');
var constantObj = sails.config.constants;
var pushService = require('../services/PushService.js');

module.exports = {
    totalCall: function (req, res) {
        API(LandInterestService.totalCall, req, res);
    },
    todayMeetings: function (req, res) {
        API(LandInterestService.todayMeetings, req, res);
    },
    todayDeals: function (req, res) {
        API(LandInterestService.todayDeals, req, res);
    },
    topPerformanceFranchiseeLands: function (req, res) {
        API(LandInterestService.topPerformanceFranchiseeLands, req, res);
    },
    topDealFranchiseeLands: function (req, res) {
        API(LandInterestService.topDealFranchiseeLands, req, res);
    },
    topFranchiseeLands: function (req, res) {
        API(LandInterestService.topFranchiseeLands, req, res);
    },
    totalRevenueDuePaidPieChart: function (req, res) {
        // console.log('aay')
        API(LandInterestService.totalRevenueDuePaidPieChart, req, res);
    },
    totalRevenuePieChart: function (req, res) {
        API(LandInterestService.totalRevenuePieChart, req, res);
    },
    totalFranchiseeCommisionDayWeekMonthWise: function (req, res) {
        API(LandInterestService.totalFranchiseeCommisionDayWeekMonthWise, req, res);
    },
    totalRevenueDayWeekMonthWise: function (req, res) {
        API(LandInterestService.totalRevenueDayWeekMonthWise, req, res);
    },
    dashboardLand: function (req, res) {
        API(LandInterestService.dashboardLand, req, res);
    },
    totalLandOfFranchisee: function (req, res) {
        API(LandInterestService.totalLandOfFranchisee, req, res);
    },
    totalVisitsOfFranchisee: function (req, res) {
        API(LandInterestService.totalVisitsOfFranchisee, req, res);
    },
    totalFranchiseeAmount: function (req, res) {
        API(LandInterestService.totalFranchiseeAmount, req, res);
    },
    placeLand: function (req, res) {
        return API(LandInterestService.saveLand, req, res);
    },

    landInterestStatus: function (req, res) {
        API(LandInterestService.landInterestStatus, req, res);
    },
    franchiseeLandInterest: function (req, res) {
        API(LandInterestService.franchiseeLandInterest, req, res);
    },
    myLandInterest: function (req, res) {
        API(LandInterestService.myLandInterest, req, res);
    },
    sellerLandInterest: function (req, res) {
        API(LandInterestService.sellerLandInterest, req, res);
    },
    getAllLandInterest: function (req, res) {
        API(LandInterestService.getAllLandInterest, req, res);
    },


    dealStatusChange: function (req, res) {
        API(LandInterestService.dealStatusChange, req, res);
    },
    verifyDealPayments: function (req, res) {
        API(LandInterestService.verifyDealPayments, req, res);
    },
    LandDealCancel: function (req, res) {
        API(LandInterestService.LandDealCancel, req, res);
    },

    postPayTm: function (req, res) {
        const reqHOst = req.headers.origin;
        var paramlist = req.body;

        var paramarray = new Array();
        var code = commonService.getUniqueCode();
        code = "ORD_" + code;
        if (req.body.ENV == "" || req.body.ENV == undefined) {
            return res.json({
                success: false,
                msg: "ENV is required"
            });
        }

        let envPaytm = req.body.ENV;

        paramlist['ORDER_ID'] = code;
        paramlist['CUST_ID'] = req.identity.id;
        paramlist['INDUSTRY_TYPE_ID'] = constantObj.paytm_config[envPaytm].INDUSTRY_TYPE_ID;
        //paramlist['PAYTM_MERCHANT_KEY'] = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;
        paramlist['MID'] = constantObj.paytm_config[envPaytm].MID;
        if (paramlist['CHANNEL_ID'] == 'WEB') {
            paramlist['MOBILE_NO'] = constantObj.paytm_config[envPaytm].PAYTM_MOBILE;
            paramlist['EMAIL'] = constantObj.paytm_config[envPaytm].PAYTM_EMAIL;
        }

        var itemId = paramlist['ITEM_ID'];
        delete paramlist['ITEM_ID'];
        delete paramlist['ENV'];

        var paramArray = {};
        for (name in paramlist) {
            console.log("name", name)
            if (name == 'PAYTM_MERCHANT_KEY') {
                var PAYTM_MERCHANT_KEY = paramlist[name];
            } else {
                paramarray[name] = paramlist[name];
            }
            paramArray[name] = paramlist[name];
        }

        if (paramlist['CHANNEL_ID'] == 'WEB') {
            paramarray['CALLBACK_URL'] = sails.config.PAYTM_API_URL + '/land-paytmresponse/' + itemId + '?origin=' + reqHOst + '&env=' + envPaytm; // in case if you want to send callback
        } else {
            if (envPaytm == "production") {
                paramarray['CALLBACK_URL'] = "https://securegw.paytm.in/theia/paytmCallback?ORDER_ID=" + code;
            } else {
                paramarray['CALLBACK_URL'] = "https://pguat.paytm.com/paytmchecksum/paytmCallback.jsp";
            }
        }

        console.log("parametersssssss", paramarray);
        let paytm_key = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;
        Payments.genchecksum(paramarray, paramArray, paytm_key, function (err, result) {
            console.log("result", result)

            return res.json({
                success: true,
                data: result.paramArray
            });
        });

    },
    landResponsePayTm: function (req, res) {
        var request = require('request');
        var itemID = req.param("id");
        var origin = req.query.origin;
        var envPaytm = req.query.ENV || "development";

        console.log("req.query-------------", req.query);

        var paramlist = req.body;
        var transactId = paramlist.TXNID;
        var paramarray = new Array();
        var paramArray = {};

        console.log("req.body***************", req.body);

        if (paramlist.STATUS == 'TXN_SUCCESS') {

            if (Payments.verifychecksum(paramlist, constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY)) {

                var transactionData = {};
                transactionData.transactionId = transactId;
                transactionData.paymentjson = paramlist;
                transactionData.processStatus = paramlist.STATUS
                transactionData.productType = "land";
                transactionData.land = itemID;


                let bidpayment = {};
                LandInterestService.transectionCreate(transactionData).then(function (paymentsData) {
                    console.log("paymentsDatapa=============", paymentsData)
                    console.log("paymentsData.id", paymentsData.id);

                    let txnId = paymentsData.id;
                    console.log(origin + '/payments/success/' + itemID + '/' + txnId + '?module=land');

                    let url = origin + '/payments/success/' + itemID + '/' + txnId + '?module=land';

                    return res.redirect(url);
                });

            } else {
                let url = origin + '/payments/failure/' + itemID
                return res.redirect(url);
            };
        } else {
            let url = origin + '/payments/failure/' + itemID
            return res.redirect(url);
        }
    },

    getCompleteDetails: function (req, res) {
        API(LandInterestService.dealCompleteDetails, req, res);
    },

    assignCoordinator: function (req, res) {
        API(LandInterestService.assignCoordinator, req, res);
    },

    addRegistryDate: function (req, res) {
        API(LandInterestService.addRegistryDate, req, res);
    },

    landFranchiseePaymentList: function (req, res) {

        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var search = req.param('search');
        var sortBy = req.param('sortBy');
        var query = {};
        var sortquery = {};

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }

        count = parseInt(count);

        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;


        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                query.pincode = {
                    "$in": pincode
                };
            }
        }

        if (req.param('type')) {
            query.type = req.param('type');
        }

        if (req.param('status') == 'Received') {
            query.$or = [{
                status: 'Paid'
            }, {
                status: 'Verified'
            }]
        } else {
            query.status = req.param('status');
        }

        if (req.param('status') == 'Received' || req.param('status') == 'Paid' || req.param('status') == 'Verified') {
            query.$and = [{
                depositedOn: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                depositedOn: {
                    $lte: new Date(req.param('to'))
                }
            }]
        } else {
            query.$and = [{
                paymentDueDate: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                paymentDueDate: {
                    $lte: new Date(req.param('to'))
                }
            }]
        }

        if (search) {
            query.$or = [{
                code: parseFloat(search)
            },
            {
                cropcode: parseFloat(search)
            },
            {
                buyer: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                type: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                paymentMode: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                amount: parseFloat(search)
            },
            {
                verifiedby: {
                    $regex: search,
                    '$options': 'i'
                }
            }
            ];
        }

        Bidspayment.native(function (err, bidpaymentlist) {
            bidpaymentlist.aggregate([
                {
                    $lookup: {
                        from: "lands",
                        localField: "landId",
                        foreignField: "_id",
                        as: "lands"
                    }
                },
                {
                    $unwind: '$lands'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'buyerId',
                        foreignField: '_id',
                        as: "buyers"
                    }
                },
                {
                    $unwind: '$buyers'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'verifiedBy',
                        foreignField: '_id',
                        as: "verifiedUser"
                    }
                },
                {
                    $unwind: {
                        path: '$verifiedUser',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'landinterests',
                        localField: 'landInterestId',
                        foreignField: '_id',
                        as: 'landinterests',
                    }
                },
                {
                    $unwind: '$landinterests',
                },
                // {
                //     $lookup: {
                //         from: 'landinterests',
                //         localField:  'landInterestId',
                //         foreignField: '_id',
                //         as:  'landInterestDetails',
                //     }
                // },
                // {
                //     $unwind: '$landInterestDetails',
                // },
                {
                    $project: {
                        id: "$_id",
                        Id: "$landinterests._id",
                        code: "$landinterests.code",
                        buyer: "$buyers.fullName",
                        landcode: "$lands.code",
                        depositedOn: "$depositedOn",
                        paymentDueDate: "$paymentDueDate",
                        type: "$type",
                        status: "$status",
                        paymentMode: "$paymentMode",
                        amount: "$amount",
                        landId: "$lands._id",
                        buyerId: "$buyers._id",
                        verifiedBy: "$verifiedUser.fullName",
                        verifiedbyId: "$verifiedUser._id",
                        pincode: "$pincode"
                    }
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

                    bidpaymentlist.aggregate([{
                        $lookup: {
                            from: "lands",
                            localField: "landId",
                            foreignField: "_id",
                            as: "lands"
                        }
                    },
                    {
                        $unwind: '$lands'
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'buyerId',
                            foreignField: '_id',
                            as: "buyers"
                        }
                    },
                    {
                        $unwind: '$buyers'
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'verifiedBy',
                            foreignField: '_id',
                            as: "verifiedUser"
                        }
                    },
                    {
                        $unwind: {
                            path: '$verifiedUser',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $lookup: {
                            from: 'landinterests',
                            localField: 'landInterestId',
                            foreignField: '_id',
                            as: 'landinterests',
                        }
                    },
                    {
                        $unwind: '$landinterests',
                    },
                    // {
                    //     $lookup: {
                    //         from: 'landinterests',
                    //         localField:  'landInterestId',
                    //         foreignField: '_id',
                    //         as:  'landInterestDetails',
                    //     }
                    // },
                    // {
                    //     $unwind: '$landInterestDetails',
                    // },
                    {
                        $project: {
                            id: "$_id",
                            Id: "$landinterests._id",
                            code: "$landinterests.code",

                            buyer: "$buyers.fullName",
                            landcode: "$lands.code",
                            depositedOn: "$depositedOn",
                            paymentDueDate: "$paymentDueDate",
                            type: "$type",
                            status: "$status",
                            paymentMode: "$paymentMode",
                            amount: "$amount",
                            landId: "$lands._id",
                            buyerId: "$buyers._id",
                            createdAt: "$createdAt",
                            verifiedBy: "$verifiedUser.fullName",
                            verifiedbyId: "$verifiedUser._id",
                            image: "$image",
                            payableAt: "$payableAt",
                            payeeName: "$payeeName",
                            draftNumber: "$draftNumber",
                            draftBankName: "$draftBankName",
                            draftdate: "$draftdate",
                            depositDate: "$depositDate",
                            depositedOn: "$depositedOn",
                            depositedbranch: "$depositedbranch",
                            otherDetails: "$otherDetails",
                            chequeNumber: "$chequeNumber",
                            chequeBankBranch: "$chequeBankBranch",
                            chequeDate: "$chequeDate",
                            wireTransferMode: "$wireTransferMode",
                            wireTransferReferenceId: "$wireTransferReferenceId",
                            pincode: "$pincode"
                        }
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
                                    bidPaymentList: results,
                                    total: totalresults.length
                                },
                            });
                        }
                    });
                }
            });
        })
    },

    landSellerBidPayments: function (req, res) {

        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

        var landId = ObjectId(req.param('landId'))

        var query = {}

        query.landId = landId
        query.$and = [{ landInterestId: { $ne: undefined } }, { landInterestId: { $ne: null } }]
        query.paymentMedia = 'landinterest'
        //console.log(query, 'query====')
        Sellerpayment.native(function (error, sellerpaymentlist) {
            sellerpaymentlist.aggregate([
                {
                    $match: query
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'buyerId',
                        foreignField: '_id',
                        as: "buyer"
                    }
                },
                {
                    $unwind: '$buyer'
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
                    $unwind: '$landinterests'
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
                    $unwind: '$lands'
                },
                {
                    $project: {
                        id: "$_id",
                        buyerId: "$buyer.fullName",
                        landInterestCode: "$landinterests.code",
                        landPrice: "$landinterests.landPrice",
                        landDate: "$landinterests.createdAt",
                        depositedOn: "$depositedOn",
                        paymentDueDate: "$paymentDueDate",
                        type: "$type",
                        depositLabel: "$depositLabel",
                        status: "$status",
                        paymentMode: "$paymentMode",
                        amount: "$amount",
                        landId: "$lands._id"

                    }
                },
                {
                    //$sort:{'paymentDueDate':1}
                    $sort: {
                        'sequenceNumber': 1
                    }
                },
                {
                    $group: {
                        _id: "$landInterestCode",
                        'payments': {
                            $push: {
                                _id: "$_id",
                                id: "$_id",
                                buyerName: "$buyerId",
                                landInterestCode: "$landInterestCode",
                                landAmount: "$landPrice",
                                landDate: "$landDate",
                                depositedOn: "$depositedOn",
                                paymentDueDate: "$paymentDueDate",
                                type: "$type",
                                depositLabel: "$depositLabel",
                                status: "$status",
                                paymentMode: "$paymentMode",
                                amount: "$amount"
                            }
                        }
                    }
                }
            ], function (err, results) {
                // console.log(results, 'result====');
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.jsonx({
                        success: true,
                        data: results
                    });
                }
            });
        });
    },
};