/**
 * InputfinancedashboardController
 *
 * @description :: Server-side logic for managing inputs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var ObjectId = require('mongodb').ObjectID;
var constantObj = sails.config.constants;
var commonServiceObj = require('./../services/commonService');

module.exports = {


    inputPaymentListDetail: function (req, res) {

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

        // query.productType = "input";


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

        let media = req.param('media');

        if (search) {
            query.$or = [{
                code: parseFloat(search)
            },
            {
                inputcode: parseFloat(search)
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

            if (media == "order") {
                query.$or.push();
            } else {
                query.$or.push();
            }
        }



        console.log("ssssssssssssssssssss", JSON.stringify(query), "mediamedia", media);
        Bidspayment.native(function (err, bidpaymentlist) {
            bidpaymentlist.aggregate([{
                $lookup: {
                    from: "inputs",
                    localField: "input",
                    foreignField: "_id",
                    as: "input"
                }
            },
            {
                $unwind: '$input'
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
                    from: (media == "order") ? 'orderedcarts' : 'bids',
                    localField: (media == "order") ? 'suborder' : 'bidId',
                    foreignField: '_id',
                    as: (media == "order") ? 'suborder' : 'bids',
                }
            },
            {
                $unwind: (media == "order") ? '$suborder' : '$bids',
            },
            {
                $lookup: {
                    from: (media == "order") ? 'orders' : 'bids',
                    localField: (media == "order") ? 'order' : 'bidId',
                    foreignField: '_id',
                    as: (media == "order") ? 'order' : 'bidDetails',
                }
            },
            {
                $unwind: (media == "order") ? '$order' : '$bidDetails',
            },
            {
                $project: {
                    id: "$_id",
                    Id: (media == "order") ? "$suborder._id" : "$bids._id",
                    code: (media == "order") ? "$suborder.code" : "$bids.code",
                    orderCode: (media == "order") ? "$order.code" : "$bidDetails.code",
                    inputcode: "$input.code",
                    input: "$input._id",
                    type: "$type",
                    status: "$status",
                    amount: "$amount",
                    createdAt: "$createdAt",
                    pincode: "$pincode",
                    productType: "$productType",
                    depositedOn: "$depositedOn",
                    paymentDueDate: "$paymentDueDate",
                    paymentMode: "$paymentMode",
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
                    buyerId: "$buyers._id",
                    buyer: "$buyers.fullName",
                    verifiedBy: "$verifiedUser.fullName",
                    verifiedbyId: "$verifiedUser._id",
                }
            },
            {
                $match: query
            }
            ], function (err, totalresults) {
                if (err) {
                    console.log("errerrerr", err);
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {

                    bidpaymentlist.aggregate([{
                        $lookup: {
                            from: "inputs",
                            localField: "input",
                            foreignField: "_id",
                            as: "input"
                        }
                    },
                    {
                        $unwind: '$input'
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
                            from: (media == "order") ? 'orderedcarts' : 'bids',
                            localField: (media == "order") ? 'suborder' : 'bidId',
                            foreignField: '_id',
                            as: (media == "order") ? 'suborder' : 'bids',
                        }
                    },
                    {
                        $unwind: (media == "order") ? '$suborder' : '$bids',
                    },
                    {
                        $lookup: {
                            from: (media == "order") ? 'orders' : 'bids',
                            localField: (media == "order") ? 'order' : 'bidId',
                            foreignField: '_id',
                            as: (media == "order") ? 'order' : 'bidDetails',
                        }
                    },
                    {
                        $unwind: (media == "order") ? '$order' : '$bidDetails',
                    },
                    {
                        $project: {
                            id: "$_id",
                            Id: (media == "order") ? "$suborder._id" : "$bids._id",
                            code: (media == "order") ? "$suborder.code" : "$bids.code",
                            orderCode: (media == "order") ? "$order.code" : "$bidDetails.code",
                            inputcode: "$input.code",
                            input: "$input._id",
                            type: "$type",
                            status: "$status",
                            amount: "$amount",
                            createdAt: "$createdAt",
                            pincode: "$pincode",
                            productType: "$productType",
                            depositedOn: "$depositedOn",
                            paymentDueDate: "$paymentDueDate",
                            paymentMode: "$paymentMode",
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
                            buyer: "$buyers.fullName",
                            buyerId: "$buyers._id",
                            verifiedBy: "$verifiedUser.fullName",
                            verifiedbyId: "$verifiedUser._id",
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
                            console.log("errerrerr", err);
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
    inputBuyerfinanceDashboard: function (req, res) {
        var qry = {};
        qry.productType = "input";

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                };
            }
        }

        if (req.param('status') == 'Received') {
            qry.$or = [{
                status: 'Paid'
            }, {
                status: 'Verified'
            }]
            datakey = 'depositedOn';
            qry.$and = [{
                depositedOn: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                depositedOn: {
                    $lte: new Date(req.param('to'))
                }
            }]
        } else if (req.param('status') == 'Due') {
            qry.status = req.param('status');
            qry.$and = [{
                paymentDueDate: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                paymentDueDate: {
                    $lte: new Date(req.param('to'))
                }
            }]
        } else if (req.param('status') == 'Overdue') {
            qry.status = req.param('status');
            qry.$and = [{
                paymentDueDate: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                paymentDueDate: {
                    $lte: new Date(req.param('to'))
                }
            }]
        }

        Bidspayment.native(function (err, bidlist) {
            bidlist.aggregate([{
                $match: qry
            },
            {
                $project: {
                    type: "$type",
                    status: "$status",
                    amount: "$amount"
                }
            },
            {
                $group: {
                    _id: {
                        type: "$type",
                        status: "$status"
                    },
                    'amount': {
                        $sum: "$amount"
                    },
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.status",
                    'status': {
                        $push: {
                            status: "$_id.type",
                            count: "$count",
                            amount: "$amount"
                        }
                    }
                }
            }
            ], function (err, allVerified) {

                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: allVerified
                    });
                }
            });
        })
    },

    inputFinanceRefundDashboard: function (req, res) {
        var qry = {};
        //qry.paymentMedia = { $ne: "Cart" }
        qry.productType = "input";
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                };
            }
        }
        qry.$and = [{
            refundDate: {
                $gte: new Date(req.param('from'))
            }
        }, {
            refundDate: {
                $lte: new Date(req.param('to'))
            }
        }]


        console.log("qry is", qry)

        Bidspayment.native(function (err, cartlist) {
            cartlist.aggregate([{
                $match: qry
            },
            {
                $project: {
                    type: "$type",
                    refundStatus: "$refundStatus",
                    refundAmount: "$refundAmount"
                }
            },
            {
                $group: {
                    _id: {
                        type: "$type",
                        refundStatus: "$refundStatus"
                    },
                    'amount': {
                        $sum: "$refundAmount"
                    },
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.refundStatus",
                    'status': {
                        $push: {
                            status: "$_id.type",
                            count: "$count",
                            amount: "$amount"
                        }
                    }
                }
            }
            ], function (err, allVerified) {

                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: allVerified
                    });
                }
            });
        })
    },
    inputFinanceSellerDashboard: function (req, res) {
        var qry = {};
        qry.productType = "input";
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }
        if (req.param('status') == 'Made') {
            qry.$or = [{
                status: 'Paid'
            }, {
                status: 'Verified'
            }]
            qry.$and = [{
                depositedOn: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                depositedOn: {
                    $lte: new Date(req.param('to'))
                }
            }]
        } else if (req.param('status') == 'Due') {
            qry.status = req.param('status');
            qry.$and = [{
                paymentDueDate: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                paymentDueDate: {
                    $lte: new Date(req.param('to'))
                }
            }]
        } else if (req.param('status') == 'Overdue') {
            qry.status = req.param('status');
            qry.$and = [{
                paymentDueDate: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                paymentDueDate: {
                    $lte: new Date(req.param('to'))
                }
            }]
        }

        Sellerpayment.native(function (err, bidlist) {
            bidlist.aggregate([{
                $match: qry
            },
            {
                $project: {
                    type: "$type",
                    status: "$status",
                    amount: "$amount"
                }
            },
            {
                $group: {
                    _id: {
                        type: "$type",
                        status: "$status"
                    },
                    'amount': {
                        $sum: "$amount"
                    },
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.status",
                    'status': {
                        $push: {
                            status: "$_id.type",
                            count: "$count",
                            amount: "$amount"
                        }
                    }
                }
            }
            ], function (err, allVerified) {

                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: allVerified
                    });
                }
            });
        })
    },
    inputPaymentSellerListDetail: function (req, res) {

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
        sortquery["BidId"] = 1;

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

        if (req.param('status') == 'Made' || req.param('status') == 'Received') {
            query.$or = [{
                status: 'Paid'
            }, {
                status: 'Verified'
            }]
        } else {
            query.status = req.param('status');
        }

        if (req.param('status') == 'Made' || req.param('status') == 'Paid' || req.param('status') == 'Verified' || req.param('status') == 'Received') {
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
            console.log("from date", new Date(req.param('from')))
            console.log("to date", new Date(req.param('to')))
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
                inputcode: parseFloat(search)
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
                paymentBy: {
                    $regex: search,
                    '$options': 'i'
                }
            }
            ]
        }

        let media = req.param('media');

        query.productType = "input";
        console.log("query", JSON.stringify(query));

        Sellerpayment.native(function (err, sellerpaymentlist) {
            sellerpaymentlist.aggregate([{
                $lookup: {
                    from: "inputs",
                    localField: "input",
                    foreignField: "_id",
                    as: "inputs"
                }
            },
            {
                $unwind: '$inputs'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'sellerId',
                    foreignField: '_id',
                    as: "sellers"
                }
            },
            {
                $unwind: '$sellers'
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
                    from: 'users',
                    localField: 'paymentBy',
                    foreignField: '_id',
                    as: "paymentUser"
                }
            },
            {
                $unwind: {
                    path: "$paymentUser",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: (media == "order") ? 'orderedcarts' : 'bids',
                    localField: (media == "order") ? 'suborder' : 'bidId',
                    foreignField: '_id',
                    as: (media == "order") ? 'suborder' : 'bids',
                }
            },
            {
                $unwind: (media == "order") ? '$suborder' : '$bids',
            },
            {
                $lookup: {
                    from: (media == "order") ? 'orders' : 'bids',
                    localField: (media == "order") ? 'order' : 'bidId',
                    foreignField: '_id',
                    as: (media == "order") ? 'order' : 'bidDetails',
                }
            },
            {
                $unwind: (media == "order") ? '$order' : '$bidDetails',
            },
            {
                $project: {
                    id: "$_id",
                    Id: (media == "order") ? "$suborder._id" : "$bids._id",
                    code: (media == "order") ? "$suborder.code" : "$bids.code",
                    orderCode: (media == "order") ? "$order.code" : "$bidDetails.code",
                    seller: "$sellers.fullName",
                    sellerId: "$sellers._id",
                    sellerCode: "$sellers.sellerCode",
                    buyer: "$buyer.fullName",
                    inputcode: "$inputs.code",
                    inputId: "$inputs._id",
                    paymentBy: "$paymentUser.fullName",
                    paymentById: "$paymentUser._id",
                    depositedOn: "$depositedOn",
                    paymentDueDate: "$paymentDueDate",
                    type: "$type",
                    status: "$status",
                    paymentMode: "$paymentMode",
                    productType: "$productType",
                    amount: "$amount",
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

                    sellerpaymentlist.aggregate([{
                        $lookup: {
                            from: "inputs",
                            localField: "input",
                            foreignField: "_id",
                            as: "inputs"
                        }
                    },
                    {
                        $unwind: '$inputs'
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'sellerId',
                            foreignField: '_id',
                            as: "sellers"
                        }
                    },
                    {
                        $unwind: '$sellers'
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
                            from: 'users',
                            localField: 'paymentBy',
                            foreignField: '_id',
                            as: "paymentUser"
                        }
                    },
                    {
                        $unwind: {
                            path: "$paymentUser",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $lookup: {
                            from: (media == "order") ? 'orderedcarts' : 'bids',
                            localField: (media == "order") ? 'suborder' : 'bidId',
                            foreignField: '_id',
                            as: (media == "order") ? 'suborder' : 'bids',
                        }
                    },
                    {
                        $unwind: (media == "order") ? '$suborder' : '$bids',
                    },
                    {
                        $lookup: {
                            from: (media == "order") ? 'orders' : 'bids',
                            localField: (media == "order") ? 'order' : 'bidId',
                            foreignField: '_id',
                            as: (media == "order") ? 'order' : 'bidDetails',
                        }
                    },
                    {
                        $unwind: (media == "order") ? '$order' : '$bidDetails',
                    },
                    {
                        $project: {
                            id: "$_id",
                            Id: (media == "order") ? "$suborder._id" : "$bids._id",
                            code: (media == "order") ? "$suborder.code" : "$bids.code",
                            orderCode: (media == "order") ? "$order.code" : "$bidDetails.code",
                            seller: "$sellers.fullName",
                            buyer: "$buyer.fullName",
                            sellerId: "$sellers._id",
                            sellerCode: "$sellers.sellerCode",
                            inputcode: "$inputs.code",
                            inputId: "$inputs._id",
                            paymentBy: "$paymentUser.fullName",
                            paymentById: "$paymentUser._id",
                            depositedOn: "$depositedOn",
                            paymentDueDate: "$paymentDueDate",
                            type: "$type",
                            status: "$status",
                            paymentMode: "$paymentMode",
                            productType: "$productType",
                            amount: "$amount",
                            createdAt: "$createdAt",
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
                                    sellerpaymentlist: results,
                                    total: totalresults.length
                                },
                            });
                        }
                    });
                }
            });
        })
    },

    inputFinanceLogistic: function (req, res) {

        var qry = {};
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            qry.pincode = {
                "$in": pincode
            };
        }
        qry.type = "Final"
        qry.productType = "input";

        Bidspayment.native(function (err, bidlist) {
            bidlist.aggregate([{
                $match: {
                    $and: [{
                        createdAt: {
                            $gte: new Date(req.param('from')),
                            $lt: new Date(req.param('to'))
                        }
                    },
                        qry
                    ]
                }
            },

            {
                $project: {
                    type: "$type",
                    status: "$status",
                    amount: "$amount"
                }
            },
            {
                $group: {
                    _id: {
                        type: "$type",
                        status: "$status"
                    },
                    'amount': {
                        $sum: "$amount"
                    },
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.status",
                    'status': {
                        $push: {
                            status: "$_id.type",
                            count: "$count",
                            amount: "$amount"
                        }
                    }
                }
            }
            ], function (err, allVerified) {

                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: allVerified
                    });
                }
            });
        })
    },
    inputFinanceLogisticDashboard: function (req, res) {
        var qry = {};
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }

        qry.$and = [{
            createdAt: {
                $gte: new Date(req.param('from'))
            }
        }, {
            createdAt: {
                $lte: new Date(req.param('to'))
            }
        }]

        qry.productType = "input";

        LogisticPayment.native(function (err, bidlist) {
            bidlist.aggregate([{
                $match: qry
            },
            {
                $project: {
                    status: "$status",
                    amount: "$amount"
                }
            },
            {
                $group: {
                    _id: "$status",
                    'amount': {
                        $sum: "$amount"
                    },
                    count: {
                        $sum: 1
                    }
                }
            }
            ], function (err, allVerified) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: allVerified
                    });
                }
            });
        })
    },

    inputFinanceFranchiseeDashboard: function (req, res) {
        var qry = {};
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }

        qry.$and = [{
            createdAt: {
                $gte: new Date(req.param('from'))
            }
        }, {
            createdAt: {
                $lte: new Date(req.param('to'))
            }
        }]

        qry.productType = "input";

        FranchiseePayments.native(function (err, bidlist) {
            bidlist.aggregate([{
                $match: qry
            },
            {
                $project: {
                    status: "$status",
                    amount: "$amount"
                }
            },
            {
                $group: {
                    _id: "$status",
                    'amount': {
                        $sum: "$amount"
                    },
                    count: {
                        $sum: 1
                    }
                }
            }
            ], function (err, allVerified) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: allVerified
                    });
                }
            });
        })
    },


    inputSellerBidPayments: function (req, res) {

        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        console.log("req.param('input')", req.param('inputId'))
        var input = ObjectId(req.param('inputId'))

        var query = {}

        query.input = input
        console.log("query", query)

        Sellerpayment.native(function (error, sellerpaymentlist) {
            sellerpaymentlist.aggregate([{
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
                    from: 'bids',
                    localField: 'bidId',
                    foreignField: '_id',
                    as: "bid"
                }
            },
            {
                $unwind: '$bid'
            },
            {
                $lookup: {
                    from: 'inputs',
                    localField: 'input',
                    foreignField: '_id',
                    as: "inputs"
                }
            },
            {
                $unwind: '$inputs'
            },
            {
                $project: {
                    id: "$_id",
                    buyerId: "$buyer.fullName",
                    bidcode: "$bid.code",
                    bidAmount: "$bid.amount",
                    bidDate: "$bid.createdAt",
                    bidAcceptedAt: "$bid.acceptedAt",
                    depositedOn: "$depositedOn",
                    paymentDueDate: "$paymentDueDate",
                    type: "$type",
                    depositLabel: "$depositLabel",
                    status: "$status",
                    paymentMode: "$paymentMode",
                    amount: "$amount",
                    input: "$inputs._id"

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
                    _id: "$bidcode",
                    'payments': {
                        $push: {
                            _id: "$_id",
                            buyerName: "$buyerId",
                            bidcode: "$bidcode",
                            bidAmount: "$bidAmount",
                            bidDate: "$bidDate",
                            bidAcceptedAt: "$bidAcceptedAt",
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
    inputVerifyBuyerPayments: function (req, res) {

        var ids = [];
        //if(req.body.id) ids = JSON.parse(req.body.id);
        if (req.body.id) {

            ids = req.body.id;
        }
        console.log("req.body", req.body);
        var query = {};
        query.isVerified = true;
        query.status = "Verified";
        query.verifiedBy = req.identity.id
        query.verifyDate = new Date()
        let code = commonServiceObj.getUniqueCode();

        async.each(ids, function (paymentid, callback) {


            Bidspayment.findOne({
                id: paymentid
            }).populate("bidId").populate("order").populate("suborder").then(function (bidspaymentDetail) {
                console.log("bidspaymentDetail", bidspaymentDetail);
                if (bidspaymentDetail.status != 'Verified' && typeof bidspaymentDetail.transactionId == 'undefined') {

                    Bidspayment.update({
                        id: paymentid
                    }, query).then(function (bidpaymentStatus) {
                        //     console.log("bidpaymentStatus==", bidpaymentStatus ) ;
                        //     return false ;
                        // console.log("fffffffffff") ;
                        if (bidpaymentStatus) {

                            var transactionData = {};
                            transactionData.buyerId = bidspaymentDetail.buyerId;
                            transactionData.sellerId = bidspaymentDetail.sellerId;
                            transactionData.input = bidspaymentDetail.input;
                            if (bidspaymentDetail.bidId) {
                                transactionData.bidId = bidspaymentDetail.bidId.id;
                            } else {
                                transactionData.order = bidspaymentDetail.order.id;
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

                                        let msg = "";

                                        if (bidspaymentDetail.bidId) {
                                            msg = bidspaymentDetail.name + " consisting of ₹ " + bidspaymentDetail.amount + "for id (" + bidspaymentDetail.bidId.code + ") paid on via (" + bidspaymentDetail.paymentMode + ") is verified. ";
                                        } else {
                                            msg = bidspaymentDetail.name + " consisting of ₹ " + bidspaymentDetail.amount + "for id (" + bidspaymentDetail.suborder.code + ") paid on via (" + bidspaymentDetail.paymentMode + ") is verified. ";
                                            orderCode = bidspaymentDetail.suborder.code;
                                        }


                                        var notificationData = {};
                                        notificationData.productId = bidspaymentDetail.input;
                                        notificationData.input = bidspaymentDetail.input;
                                        notificationData.user = bidspaymentDetail.buyerId;
                                        notificationData.buyerId = bidspaymentDetail.buyerId;
                                        notificationData.productType = "inputs";

                                        notificationData.message = msg;
                                        notificationData.messageKey = "PAYMENT_VERIFIED_NOTIFICATION"
                                        notificationData.readBy = [];

                                        Notifications.create(notificationData).then(function (notificationResponse) {
                                            if (notificationResponse) {
                                                commonService.notifyUsersFromNotification(notificationResponse, undefined)
                                            }

                                            var userID = bidspaymentDetail.buyerId;
                                            Users.findOne(userID).then(function (user) {
                                                // push notification by rohitk
                                                console.log("user push notify", user);
                                                if (user && user.deviceToken) {
                                                    let pushObj = {};
                                                    pushObj.device_token = user.deviceToken;
                                                    pushObj.device_type = user.device_type;
                                                    pushObj.message = msg;
                                                    pushService.sendPush(pushObj);
                                                }
                                                callback()
                                            });

                                        }).fail(function (err) {
                                            callback()
                                        })
                                    })
                                } else {
                                    callback()
                                }
                            });
                            //callback();
                        }
                    })
                } else {
                    callback()
                }
                // callback();
            })


        }, function (error) {
            if (error) {

            } else {
                return res.jsonx({
                    success: true,
                    data: {
                        message: constantObj.bids.SUCCESSFULLY_VERIFIED,
                        key: 'SUCCESSFULLY_VERIFIED',
                    },
                });
            }
        });
    },
    verifyInputSellerPayments: function (req, res) {

        var ids = [];
        //if(req.body.id) ids = JSON.parse(req.body.id);
        if (req.body.id) {

            ids = req.body.id;
        }

        var query = {};
        query.isVerified = "true";
        query.status = "Verified";
        query.verifyDate = new Date()
        let code = commonServiceObj.getUniqueCode();

        async.each(ids, function (paymentid, callback) {


            Sellerpayment.findOne({
                id: paymentid
            }).then(function (sellerpaymentDetail) {

                if (sellerpaymentDetail.status != 'Verified' && typeof sellerpaymentDetail.transactionId == 'undefined') {

                    Sellerpayment.update({
                        id: paymentid
                    }, query).then(function (sellerpaymentStatus) {
                        if (sellerpaymentStatus) {


                            var transactionData = {};
                            transactionData.buyerId = sellerpaymentStatus[0].buyerId;
                            transactionData.sellerId = sellerpaymentStatus[0].sellerId;
                            transactionData.input = sellerpaymentStatus[0].input;
                            transactionData.bidId = sellerpaymentStatus[0].bidId;
                            if (sellerpaymentStatus[0].bidId) {
                                transactionData.bidId = sellerpaymentStatus[0].bidId;
                            } else {
                                transactionData.order = sellerpaymentStatus.order;
                            }
                            transactionData.bidsPaymentId = sellerpaymentStatus[0].id;

                            transactionData.transactionId = code;
                            transactionData.amount = sellerpaymentStatus[0].amount;
                            transactionData.paymentType = sellerpaymentStatus[0].paymentMode;
                            transactionData.processStatus = "TXN_SUCCESS";
                            transactionData.transactionType = 'Debit';

                            if (sellerpaymentStatus[0].type == "Deposit") {
                                transactionData.status = 'DA';
                            } else if (sellerpaymentStatus[0].type == "Final") {
                                transactionData.status = 'FA';
                            } else if (sellerpaymentStatus[0].type == "Upfront") {
                                transactionData.status = 'UA';
                            }

                            Transactions.create(transactionData).then(function (newTransactionEntry) {
                                if (newTransactionEntry) {
                                    qry = {};
                                    qry.transactionId = newTransactionEntry.id
                                    Sellerpayment.update({
                                        id: paymentid
                                    }, qry).then(function (sellerpaymentStatus) {
                                        callback()
                                    })
                                } else {
                                    callback()
                                }
                            });
                            //callback();
                        }
                    })
                } else {
                    callback()
                }
                callback();
            })
        }, function (error) {
            if (error) {

            } else {
                return res.jsonx({
                    success: true,
                    data: {
                        message: constantObj.bids.SUCCESSFULLY_VERIFIED,
                        key: 'SUCCESSFULLY_VERIFIED',
                    },
                });
            }
        });
    },
    inputVerifyFranchiseePayments: function (req, res) {

        var ids = [];
        if (req.body.id) {
            ids = req.body.id;
        }

        var query = {};
        query.isVerified = "true";
        query.status = "Verified";
        query.verifyDate = new Date()

        async.each(ids, function (paymentid, callback) {

            FranchiseePayments.findOne({
                id: paymentid
            }).then(function (franchiseepaymentDetail) {
                if (franchiseepaymentDetail.status != 'Verified' && typeof franchiseepaymentDetail.transactionId == 'undefined') {
                    FranchiseePayments.update({
                        id: paymentid
                    }, query).then(function (franchiseepaymentStatus) {
                        if (franchiseepaymentStatus) {

                            var code = commonServiceObj.getUniqueCode();
                            var transactionData = {};
                            transactionData.buyerId = franchiseepaymentStatus[0].buyerId;
                            transactionData.sellerId = franchiseepaymentStatus[0].sellerId;
                            transactionData.input = franchiseepaymentStatus[0].inputId;
                            if (franchiseepaymentStatus[0].bidId) {
                                transactionData.bidId = franchiseepaymentStatus[0].bidId;
                            } else {
                                transactionData.order = franchiseepaymentStatus.order;
                            }

                            transactionData.bidsPaymentId = franchiseepaymentStatus[0].id;

                            transactionData.transactionId = code;
                            transactionData.amount = franchiseepaymentStatus[0].amount;
                            transactionData.paymentType = franchiseepaymentStatus[0].paymentMode;
                            transactionData.processStatus = "TXN_SUCCESS";
                            transactionData.transactionType = 'Debit';

                            transactionData.status = 'FP';

                            Transactions.create(transactionData).then(function (newTransactionEntry) {
                                if (newTransactionEntry) {
                                    qry = {};
                                    qry.transactionId = newTransactionEntry.id
                                    FranchiseePayments.update({
                                        id: paymentid
                                    }, qry).then(function (sellerpaymentStatus) {
                                        callback()
                                    })
                                }
                            });
                        }
                    })
                } else {
                    callback()
                }
                callback();
            })
        }, function (error) {
            if (error) {

            } else {
                return res.jsonx({
                    success: true,
                    data: {
                        message: constantObj.bids.SUCCESSFULLY_VERIFIED,
                        key: 'SUCCESSFULLY_VERIFIED',
                    },
                });
            }
        });
    },
    inputPaymentLogisticListDetail: function (req, res) {

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

        if (req.param('status')) {
            query.status = req.param('status');
        }

        if (req.param('from') && req.param('to')) {
            query.$and = [{
                createdAt: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                createdAt: {
                    $lte: new Date(req.param('to'))
                }
            }]
        }

        if (search) {
            query.$or = [{
                bidcode: parseFloat(search)
            },
            {
                inputcode: parseFloat(search)
            },
            {
                buyer: {
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
                logisticPartner: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                paymentBy: {
                    $regex: search,
                    '$options': 'i'
                }
            }
            ]
        }

        query.productType = "input";

        let media = req.param('media');

        LogisticPayment.native(function (err, sellerpaymentlist) {
            sellerpaymentlist.aggregate([{
                $lookup: {
                    from: "inputs",
                    localField: "input",
                    foreignField: "_id",
                    as: "inputs"
                }
            },
            {
                $unwind: '$inputs'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'sellerId',
                    foreignField: '_id',
                    as: "sellers"
                }
            },
            {
                $unwind: '$sellers'
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
                    from: 'lpartners',
                    localField: 'logisticPartner',
                    foreignField: '_id',
                    as: "logisticParter"
                }
            },
            {
                $unwind: '$logisticParter'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'paymentBy',
                    foreignField: '_id',
                    as: "paymentUser"
                }
            },
            {
                $unwind: {
                    path: "$paymentUser",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: (media == "order") ? 'orderedcarts' : 'bids',
                    localField: (media == "order") ? 'suborder' : 'bidId',
                    foreignField: '_id',
                    as: (media == "order") ? 'suborder' : 'bids',
                }
            },
            {
                $unwind: (media == "order") ? '$suborder' : '$bids',
            },
            {
                $lookup: {
                    from: (media == "order") ? 'orders' : 'bids',
                    localField: (media == "order") ? 'order' : 'bidId',
                    foreignField: '_id',
                    as: (media == "order") ? 'order' : 'bidDetails',
                }
            },
            {
                $unwind: (media == "order") ? '$order' : '$bidDetails',
            },
            {
                $project: {
                    id: "$_id",
                    Id: (media == "order") ? "$suborder._id" : "$bids._id",
                    code: (media == "order") ? "$suborder.code" : "$bids.code",
                    orderCode: (media == "order") ? "$order.code" : "$bidDetails.code",
                    sellerId: "$sellers._id",
                    seller: "$sellers.fullName",
                    buyerId: "$buyers._id",
                    buyer: "$buyers.fullName",
                    logisticParterId: "$logisticParter._id",
                    logisticParter: "$logisticParter.companyName",
                    inputcode: "$inputs.code",
                    depositedOn: "$depositedOn",
                    paymentDueDate: "$paymentDueDate",
                    status: "$status",
                    paymentMode: "$paymentMode",
                    productType: "$productType",
                    amount: "$amount",
                    inputId: "$inputs._id",
                    paymentBy: "$paymentUser.fullName",
                    paymentById: "$paymentUser._id",
                    createdAt: "$createdAt",
                    pincode: "$pincode",
                    remark: "$remark",
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

                    sellerpaymentlist.aggregate([{
                        $lookup: {
                            from: "inputs",
                            localField: "input",
                            foreignField: "_id",
                            as: "inputs"
                        }
                    },
                    {
                        $unwind: '$inputs'
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'sellerId',
                            foreignField: '_id',
                            as: "sellers"
                        }
                    },
                    {
                        $unwind: '$sellers'
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
                            from: 'lpartners',
                            localField: 'logisticPartner',
                            foreignField: '_id',
                            as: "logisticParter"
                        }
                    },
                    {
                        $unwind: '$logisticParter'
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'paymentBy',
                            foreignField: '_id',
                            as: "paymentUser"
                        }
                    },
                    {
                        $unwind: {
                            path: "$paymentUser",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $lookup: {
                            from: (media == "order") ? 'orderedcarts' : 'bids',
                            localField: (media == "order") ? 'suborder' : 'bidId',
                            foreignField: '_id',
                            as: (media == "order") ? 'suborder' : 'bids',
                        }
                    },
                    {
                        $unwind: (media == "order") ? '$suborder' : '$bids',
                    },
                    {
                        $lookup: {
                            from: (media == "order") ? 'orders' : 'bids',
                            localField: (media == "order") ? 'order' : 'bidId',
                            foreignField: '_id',
                            as: (media == "order") ? 'order' : 'bidDetails',
                        }
                    },
                    {
                        $unwind: (media == "order") ? '$order' : '$bidDetails',
                    },
                    {
                        $project: {
                            id: "$_id",
                            Id: (media == "order") ? "$suborder._id" : "$bids._id",
                            code: (media == "order") ? "$suborder.code" : "$bids.code",
                            orderCode: (media == "order") ? "$order.code" : "$bidDetails.code",
                            sellerId: "$sellers._id",
                            seller: "$sellers.fullName",
                            buyerId: "$buyers._id",
                            buyer: "$buyers.fullName",
                            logisticPartnerId: "$logisticParter._id",
                            logisticPartner: "$logisticParter.companyName",
                            inputcode: "$inputs.code",
                            depositedOn: "$depositedOn",
                            paymentDueDate: "$paymentDueDate",
                            status: "$status",
                            paymentMode: "$paymentMode",
                            productType: "$productType",
                            amount: "$amount",
                            inputId: "$inputs._id",
                            createdAt: "$createdAt",
                            paymentBy: "$paymentUser.fullName",
                            paymentById: "$paymentUser._id",
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
                            createdAt: "$createdAt",
                            pincode: "$pincode",
                            remark: "$remark",
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
                                    logisticpaymentlist: results,
                                    total: totalresults.length
                                },
                            });
                        }
                    });
                }
            });
        })
    },

    inputFieldOfficerBidAllDashboard: function (req, res) {
        var qry = {}

        let user = req.identity.id

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }

        if (req.param('userId') && req.param('userId') != undefined && req.param('userId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('userId'))

            qry.seller = userId
        }

        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('buyerId'))

            qry.user = userId
        }

        if (req.param('from') && req.param('to')) {
            qry.$and = [{
                createdAt: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                createdAt: {
                    $lte: new Date(req.param('to'))
                }
            }]
        }

        console.log("qryqryqryqry", qry);

        Bids.native(function (err, bidlist) {
            bidlist.aggregate([{
                $lookup: {
                    from: 'inputs',
                    localField: 'input',
                    foreignField: '_id',
                    as: "input"
                }
            },
            {
                $unwind: '$input'
            },
            {
                $project: {
                    pincode: "$input.pincode",
                    seller: "$input.seller",
                    user: "$user",
                    isDeleted: "$input.isDeleted",
                    bidId: "$_id",
                    status: "$status",
                    createdAt: "$createdAt",
                    popId: "$popId"
                }
            },
            {
                $match: qry
            },
            {
                $group: {
                    _id: "$status",
                    count: {
                        $sum: 1
                    }
                }
            }
            ], function (err, result) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: result
                    });

                }
            });
        })
    },
    inputFieldOfficerBidInputDashboard: function (req, res) {
        var qry = {}

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }

        if (req.param('userId') && req.param('userId') != undefined && req.param('userId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('userId'))

            qry.seller = userId
        }

        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('buyerId'))

            qry.user = userId
        }
        qry.isDeleted = false

        if (req.param('from') && req.param('to')) {
            qry.$and = [{
                createdAt: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                createdAt: {
                    $lte: new Date(req.param('to'))
                }
            }]
        }

        Bids.native(function (err, bidlist) {
            bidlist.aggregate([{
                $lookup: {
                    from: 'inputs',
                    localField: 'input',
                    foreignField: '_id',
                    as: "input"
                }
            },
            {
                $unwind: '$input'
            },
            {
                $lookup: {
                    from: 'category',
                    localField: 'input.category',
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
                    user: "$user",
                    pincode: "$input.pincode",
                    seller: "$input.seller",
                    isDeleted: "$input.isDeleted",
                    bidId: "$id",
                    createdAt: "$createdAt",
                    category: "$category.name",
                    categoryID: "$category._id",
                    parentCategory: "$parentCategory.name"
                }
            },
            {
                $match: qry
            },
            {
                $group: {
                    _id: {
                        parentCategory: "$parentCategory",
                        category: "$category",
                        categoryID: "$categoryID"
                    },
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.parentCategory",
                    'total': {
                        $sum: "$count"
                    },
                    'categories': {
                        $push: {
                            category: "$_id.category",
                            categoryID: "$_id.categoryID",
                            count: "$count"
                        }
                    }
                }
            }
            ], function (err, result) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: result
                    });
                }
            });
        })
    },
    // new requirement for dashboard listing for fieldOfficer on 21 AUG 2018 by rohitk.kumar
    inputFieldOfficerBids: function (req, res) {
        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";
        var status = req.param('status')
        var category = req.param('category')

        if (req.param('sortBy')) {
            sortBy = req.param('sortBy')
        }

        var typeArr = new Array();
        typeArr = sortBy.split(" ");
        var sortType = typeArr[1];
        var field = typeArr[0];
        var sortquery = {};
        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        var query = {};

        if (status) {
            query.bidStatus = status
        } else {
            query.$or = [{
                bidStatus: 'Accepted'
            }, {
                bidStatus: 'Dispatched'
            }, {
                bidStatus: 'Delivered'
            }, {
                bidStatus: 'Received'
            }, {
                bidStatus: 'Pending'
            }]
        }


        if (search) {
            query.$or = [{
                bidcode: parseFloat(search)
            },
            {
                inputCode: parseFloat(search)
            },
            {
                buyerName: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                sellerName: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                inputName: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                amount: parseFloat(search)
            },
            {
                bidQuantity: parseFloat(search)
            },
            {
                bidRate: parseFloat(search)
            },
            {
                bidAmount: parseFloat(search)
            },
            {
                bidStatus: {
                    $regex: search,
                    '$options': 'i'
                }
            }
            ]
        }

        if (category) {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var categoryId = ObjectId(category)
            query.inputCategory = categoryId;
        }



        query.$and = [{
            bidDate: {
                $gte: new Date(req.param('from'))
            }
        }, {
            bidDate: {
                $lte: new Date(req.param('to'))
            }
        }]

        console.log("dddddqqq", query);

        Bids.native(function (error, bidslist) {
            bidslist.aggregate([{
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: "buyer"
                }
            },
            {
                $unwind: '$buyer'
            },
            {
                $lookup: {
                    from: 'inputs',
                    localField: 'input',
                    foreignField: '_id',
                    as: "inputs"
                }
            },
            {
                $unwind: '$inputs'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'inputs.user',
                    foreignField: '_id',
                    as: "sellers"
                }
            },
            {
                $unwind: '$sellers'
            },
            {
                $project: {
                    id: "$_id",
                    buyerName: "$buyer.fullName",
                    buyerId: "$user",
                    sellerName: "$sellers.fullName",
                    sellerId: "$sellers._id",
                    inputId: "$inputs._id",
                    inputCode: "$inputs.code",
                    inputCategory: "$inputs.category",
                    pincode: "$inputs.pincode",
                    inputName: "$inputs.name",
                    isDeleted: "$inputs.isDeleted",
                    bidcode: "$code",
                    bidQuantity: "$quantity",
                    bidRate: "$bidRate",
                    bidAmount: "$amount",
                    bidDate: "$createdAt",
                    bidAcceptedAt: "$acceptedAt",
                    bidStatus: "$status",
                    bidTotalAmount: "$totalAmount",
                    popId: "$popId",
                    quantityUnit: "$quantityUnit",
                    logisticsOption: "$logisticsOption",
                    ETD: "$ETD",
                    ETA: "$ETA",
                    ATD: "$ATD",
                    ATA: "$ATA",
                    deliveryTime: "$deliveryTime"
                }
            },
            {
                $match: query
            },
            {
                $sort: sortquery
            }
            ], function (err, totalresults) {
                bidslist.aggregate([{
                    $lookup: {
                        from: 'users',
                        localField: 'user',
                        foreignField: '_id',
                        as: "buyer"
                    }
                },
                {
                    $unwind: '$buyer'
                },
                {
                    $lookup: {
                        from: 'inputs',
                        localField: 'input',
                        foreignField: '_id',
                        as: "inputs"
                    }
                },
                {
                    $unwind: '$inputs'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'inputs.user',
                        foreignField: '_id',
                        as: "sellers"
                    }
                },
                {
                    $unwind: '$sellers'
                },
                {
                    $project: {
                        id: "$_id",
                        buyerName: "$buyer.fullName",
                        buyerId: "$user",
                        sellerName: "$sellers.fullName",
                        sellerId: "$sellers._id",
                        inputId: "$inputs._id",
                        inputCode: "$inputs.code",
                        inputCategory: "$inputs.category",
                        pincode: "$inputs.pincode",
                        inputName: "$inputs.name",
                        isDeleted: "$inputs.isDeleted",
                        bidcode: "$code",
                        bidQuantity: "$quantity",
                        bidRate: "$bidRate",
                        bidAmount: "$amount",
                        bidDate: "$createdAt",
                        bidAcceptedAt: "$acceptedAt",
                        bidStatus: "$status",
                        bidTotalAmount: "$totalAmount",
                        popId: "$popId",
                        quantityUnit: "$quantityUnit",
                        logisticsOption: "$logisticsOption",
                        ETD: "$ETD",
                        ETA: "$ETA",
                        ATD: "$ATD",
                        ATA: "$ATA",
                        deliveryTime: "$deliveryTime",
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

                        return res.status(200).jsonx({
                            success: true,
                            data: {
                                bids: results,
                                total: totalresults.length
                            }
                        });


                    }
                });
            });
        });
    },
    inputFieldOfficerPaymentsBuyerDashboard: function (req, res) {

        var query = {};

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                query.pincode = {
                    "$in": pincode
                };
            }
        }

        if (req.param('userId') && req.param('userId') != undefined && req.param('userId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('userId'))

            // var userId = req.param('userId')
            query.sellerId = userId
        }

        query.type = {
            $ne: "Earnest"
        }
        query.paymentDueDate = {
            $exists: true
        }


        query.$and = [{
            createdAt: {
                $gte: new Date(req.param('from'))
            }
        }, {
            createdAt: {
                $lte: new Date(req.param('to'))
            }
        }]

        Bidspayment.native(function (err, bidlist) {
            bidlist.aggregate([{
                $match: query
            },
            {
                $project: {
                    type: "$type",
                    status: "$status",
                    amount: "$amount"
                }
            },
            {
                $group: {
                    _id: {
                        type: "$type",
                        status: "$status"
                    },
                    'amount': {
                        $sum: "$amount"
                    },
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.type",
                    'status': {
                        $push: {
                            status: "$_id.status",
                            count: "$count",
                            amount: "$amount"
                        }
                    }
                }
            }
            ], function (err, allVerified) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: allVerified
                    });
                }
            });
        })
    },
    inputFieldOfficerPaymentsSellerDashboard: function (req, res) {

        var query = {};

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                query.pincode = {
                    "$in": pincode
                };
            }
        }

        if (req.param('userId') && req.param('userId') != undefined && req.param('userId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('userId'))

            query.sellerId = userId
        }

        query.$and = [{
            createdAt: {
                $gte: new Date(req.param('from'))
            }
        }, {
            createdAt: {
                $lte: new Date(req.param('to'))
            }
        }]

        Sellerpayment.native(function (err, bidlist) {
            bidlist.aggregate([{
                $lookup: {
                    from: 'bids',
                    localField: 'bidId',
                    foreignField: '_id',
                    as: "bids"
                }
            },
            {
                $unwind: '$bids'
            },
            {
                $project: {
                    status: "$status",
                    sellerId: "$sellerId",
                    pincode: "$pincode",
                    createdAt: "$bids.createdAt",
                    amount: "$amount"
                }
            },
            {
                $match: query
            },
            {
                $group: {
                    _id: "$status",
                    'amount': {
                        $sum: "$amount"
                    },
                    count: {
                        $sum: 1
                    }
                }
            }
            ], function (err, allVerified) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: allVerified
                    });
                }
            });
        })
    },

    //BUYER DASHBOARD
    inputBuyerBidDashboard: function (req, res) {
        var qry = {}

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }

        if (req.param('userId') && req.param('userId') != undefined && req.param('userId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('userId'))

            qry.user = userId
        }

        // qry.isDeleted = false

        qry.$and = [{
            createdAt: {
                $gte: new Date(req.param('from'))
            }
        }, {
            createdAt: {
                $lte: new Date(req.param('to'))
            }
        }]

        Bids.native(function (err, bidlist) {
            bidlist.aggregate([{
                $lookup: {
                    from: 'inputs',
                    localField: 'input',
                    foreignField: '_id',
                    as: "input"
                }
            },
            {
                $unwind: '$input'
            },
            {
                $project: {
                    pincode: "$input.pincode",
                    user: "$user",
                    status: "$status",
                    createdAt: "$createdAt",
                }
            },
            {
                $match: qry
            },
            {
                $group: {
                    _id: "$status",
                    count: {
                        $sum: 1
                    }
                }
            }
            ], function (err, result) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: result
                    });
                }
            });
        })
    },

    inputBuyerPaymentsBuyerDashboard: function (req, res) {

        var query = {};

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                query.pincode = {
                    "$in": pincode
                };
            }
        }

        if (req.param('userId') && req.param('userId') != undefined && req.param('userId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('userId'))

            query.buyerId = userId
        }

        query.paymentDueDate = {
            $exists: true
        }

        query.$and = [{
            createdAt: {
                $gte: new Date(req.param('from'))
            }
        }, {
            createdAt: {
                $lte: new Date(req.param('to'))
            }
        }]

        Bidspayment.native(function (err, bidlist) {
            bidlist.aggregate([{
                $match: query
            },
            {
                $group: {
                    _id: {
                        type: "$type",
                        status: "$status"
                    },
                    'amount': {
                        $sum: "$amount"
                    },
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.type",
                    'status': {
                        $push: {
                            status: "$_id.status",
                            count: "$count",
                            amount: "$amount"
                        }
                    }
                }
            }
            ], function (err, allVerified) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: allVerified
                    });
                }
            });
        })
    },

    fieldOfficerOrderInputDashboard: function (req, res) {
        var qry = {}

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }

        if (req.param('userId') && req.param('userId') != undefined && req.param('userId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('userId'))

            qry.seller = userId
        }

        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('buyerId'))

            qry.user = userId
        }
        if (req.param('from') != "" && req.param('to') != "") {
            qry.$and = [{
                createdAt: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                createdAt: {
                    $lte: new Date(req.param('to'))
                }
            }]
        }

        Orderedcarts.native(function (err, orderlist) {
            orderlist.aggregate([{
                $lookup: {
                    from: 'inputs',
                    localField: 'input',
                    foreignField: '_id',
                    as: "input"
                }
            },
            {
                $unwind: '$input'
            },
            {
                $lookup: {
                    from: 'category',
                    localField: 'input.category',
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
                    user: "$user",
                    pincode: "$input.pincode",
                    seller: "$input.user",
                    orderId: "$_id",
                    createdAt: "$createdAt",
                    category: "$category.name",
                    categoryID: "$category._id",
                    parentCategory: "$parentCategory.name"
                }
            },
            {
                $match: qry
            },
            {
                $group: {
                    _id: {
                        parentCategory: "$parentCategory",
                        category: "$category",
                        categoryID: "$categoryID"
                    },
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.parentCategory",
                    'total': {
                        $sum: "$count"
                    },
                    'categories': {
                        $push: {
                            category: "$_id.category",
                            categoryID: "$_id.categoryID",
                            count: "$count"
                        }
                    }
                }
            }
            ], function (err, result) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: result
                    });
                }
            });
        })
    },
    //FIELD OFFICER DASHBOARD
    fieldOfficerOrderAllInputDashboard: function (req, res) {
        var qry = {}
        // let user = req.identity.id

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }

        if (req.param('userId') && req.param('userId') != undefined && req.param('userId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('userId'))

            qry.seller = userId
        }

        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('buyerId'))

            qry.user = userId
        }
        if (req.param('from') != "" && req.param('to') != "") {
            qry.$and = [{
                createdAt: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                createdAt: {
                    $lte: new Date(req.param('to'))
                }
            }]
        }

        Orderedcarts.native(function (err, orderlist) {
            orderlist.aggregate([{
                $lookup: {
                    from: 'inputs',
                    localField: 'input',
                    foreignField: '_id',
                    as: "input"
                }
            },
            {
                $unwind: '$input'
            },
            {
                $project: {
                    pincode: "$input.pincode",
                    seller: "$input.user",
                    user: "$user",
                    isDeleted: "$input.isDeleted",
                    orderId: "$_id",
                    status: "$status",
                    createdAt: "$createdAt"
                }
            },
            {
                $match: qry
            },
            {
                $group: {
                    _id: "$status",
                    count: {
                        $sum: 1
                    }
                }
            }
            ], function (err, result) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: result
                    });
                }
            });
        })
    },

    // Sub orders for fieldOfficer API  new requirements input
    fieldOfficerInputOrders: function (req, res) {
        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";
        var status = req.param('status')
        var category = req.param('category')

        if (req.param('sortBy')) {
            sortBy = req.param('sortBy')
        }

        var typeArr = new Array();
        typeArr = sortBy.split(" ");
        var sortType = typeArr[1];
        var field = typeArr[0];
        var sortquery = {};
        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        var query = {};
        if (status) {
            query.status = status
        } else {
            query.$or = [{
                status: 'Accepted'
            }, {
                status: 'Dispatched'
            }, {
                status: 'Delivered'
            }, {
                status: 'Received'
            }]
        }

        if (category) {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var categoryId = ObjectId(category)
            query.inputCategory = categoryId;
        }


        if (search) {
            query.$or = [{
                code: parseFloat(search)
            },
            {
                inputCode: parseFloat(search)
            },
            {
                buyerName: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                sellerName: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                inputName: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                amount: parseFloat(search)
            },
            {
                quantity: parseFloat(search)
            },
            {
                status: {
                    $regex: search,
                    '$options': 'i'
                }
            }
            ]
        }

        if (req.param('from') != "" && req.param('to') != "") {
            query.$and = [{
                createdAt: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                createdAt: {
                    $lte: new Date(req.param('to'))
                }
            }]
        }


        console.log("dddddqqq", query);
        Orderedcarts.native(function (error, suborderlist) {
            suborderlist.aggregate([{
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: "buyer"
                }
            },
            {
                $unwind: '$buyer'
            },
            {
                $lookup: {
                    from: 'inputs',
                    localField: 'input',
                    foreignField: '_id',
                    as: "inputs"
                }
            },
            {
                $unwind: '$inputs'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'seller',
                    foreignField: '_id',
                    as: "sellers"
                }
            },
            {
                $unwind: '$sellers'
            },
            {
                $lookup: {
                    from: 'orders',
                    localField: 'order',
                    foreignField: '_id',
                    as: "order"
                }
            },
            {
                $unwind: '$order'
            },
            {
                $project: {
                    id: "$_id",
                    subcode: "$code",
                    code: "$order.code",
                    buyerName: "$buyer.fullName",
                    buyerId: "$user",
                    sellerName: "$sellers.fullName",
                    sellerId: "$sellers._id",
                    inputId: "$inputs._id",
                    inputCode: "$inputs.code",
                    pincode: "$pincode",
                    inputName: "$inputs.name",
                    inputCategory: "$inputs.category",
                    isDeleted: "$inputs.isDeleted",
                    quantity: "$quantity",
                    amount: "$amount",
                    createdAt: "$createdAt",
                    status: "$status",
                    earnestAmount: "$earnestAmount",
                    quantityUnit: "$quantityUnit",
                    logisticsOption: "$logisticsOption",
                    ETD: "$ETD",
                    ETA: "$ETA",
                    ATD: "$ATD",
                    ATA: "$ATA",
                    deliveryTime: "$deliveryTime",
                }
            },
            {
                $match: query
            },
            {
                $sort: sortquery
            }
            ], function (err, totalresults) {
                suborderlist.aggregate([{
                    $lookup: {
                        from: 'users',
                        localField: 'user',
                        foreignField: '_id',
                        as: "buyer"
                    }
                },
                {
                    $unwind: '$buyer'
                },
                {
                    $lookup: {
                        from: 'inputs',
                        localField: 'input',
                        foreignField: '_id',
                        as: "inputs"
                    }
                },
                {
                    $unwind: '$inputs'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'seller',
                        foreignField: '_id',
                        as: "sellers"
                    }
                },
                {
                    $unwind: '$sellers'
                },
                {
                    $lookup: {
                        from: 'orders',
                        localField: 'order',
                        foreignField: '_id',
                        as: "order"
                    }
                },
                {
                    $unwind: '$order'
                },
                {
                    $project: {
                        id: "$_id",
                        subcode: "$code",
                        code: "$order.code",
                        buyerName: "$buyer.fullName",
                        buyerId: "$user",
                        sellerName: "$sellers.fullName",
                        sellerId: "$sellers._id",
                        inputId: "$inputs._id",
                        inputCode: "$inputs.code",
                        pincode: "$pincode",
                        inputName: "$inputs.name",
                        inputCategory: "$inputs.category",
                        isDeleted: "$inputs.isDeleted",
                        quantity: "$quantity",
                        amount: "$amount",
                        createdAt: "$createdAt",
                        status: "$status",
                        earnestAmount: "$earnestAmount",
                        quantityUnit: "$quantityUnit",
                        logisticsOption: "$logisticsOption",
                        ETD: "$ETD",
                        ETA: "$ETA",
                        ATD: "$ATD",
                        ATA: "$ATA",
                        deliveryTime: "$deliveryTime"
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

                        return res.status(200).jsonx({
                            success: true,
                            data: {
                                orders: results,
                                total: totalresults.length
                            }
                        });


                    }
                });
            });
        });
    },












};