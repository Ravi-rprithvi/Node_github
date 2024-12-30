/**
 * OrderController.js
 *
 * @description :: Server-side logic for managing payments
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var constantObj = sails.config.constants;
var commonServiceObj = require('./../services/commonService');
var pushService = require('../services/PushService.js');
var NodeGeocoder = require('node-geocoder');
var sortByDistance = require('sort-by-distance')
const fs = require('fs');

module.exports = {
    sellerAggregationOrderPayments: function (req, res) {

        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        let cid = req.param('cropId')

        var cropId = ObjectId(cid)

        var query = {}

        Crops.findOne({ id: cid }).exec(function (err, cropInfo) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                let cropIds = []
                if (cropInfo.aggregations) {
                    for (var i = 0; i < cropInfo.aggregations.length; i++) {
                        if (cropInfo.aggregations[i] != null) {
                            cropIds.push(ObjectId(cropInfo.aggregations[i]))
                        }
                    }
                }

                Crops.find({ aggregatedCrops: { $in: [cid] } }, { fields: ['code'] }).exec(function (error, allAggregatedCrrops) {
                    if (allAggregatedCrrops && allAggregatedCrrops.length > 0) {
                        for (var i = 0; i < allAggregatedCrrops.length; i++) {
                            if (cropIds.indexOf(allAggregatedCrrops[i].id) !== -1) {

                            } else {
                                cropIds.push(ObjectId(allAggregatedCrrops[i].id))
                            }
                        }
                    }

                    query.$or = [{ "cropId": { "$in": cropIds } }, { "baseCropId": cropId }]
                    query.cropId = { "$ne": cropId }

                    query.sellerId = ObjectId(req.identity.id)
                    query.$and = [{ $or: [{ bidId: undefined }, { bidId: null }] }, { suborder: { $ne: undefined } }, { suborder: { $ne: null } }]
                    query.paymentMedia = 'Cart'

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
                                    from: 'orderedcarts',
                                    localField: 'suborder',
                                    foreignField: '_id',
                                    as: "order"
                                }
                            },
                            {
                                $unwind: '$order'
                            },
                            {
                                $lookup: {
                                    from: 'crops',
                                    localField: 'cropId',
                                    foreignField: '_id',
                                    as: "crops"
                                }
                            },
                            {
                                $unwind: '$crops'
                            },
                            {
                                $project: {
                                    id: "$_id",
                                    buyerId: "$buyer.fullName",
                                    bidcode: "$order.code",
                                    bidAmount: "$order.amount",
                                    bidDate: "$order.createdAt",
                                    depositedOn: "$depositedOn",
                                    paymentDueDate: "$paymentDueDate",
                                    type: "$type",
                                    depositLabel: "$depositLabel",
                                    status: "$status",
                                    paymentMode: "$paymentMode",
                                    amount: "$amount",
                                    cropId: "$crops._id",
                                    cropCode: "$crops.code",
                                    bidQuantity: "$order.quantity"
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
                                    _id: {
                                        bidcode: "$bidcode",
                                        bidAmount: "$bidAmount",
                                        quantity: "$bidQuantity",
                                        cropCode: "$cropCode",
                                        cropId: "$cropId",
                                        buyerName: "$buyerId",
                                    },
                                    'payments': {
                                        $push: {
                                            _id: "$_id",
                                            id: "$_id",
                                            // buyerName: "$buyerId",
                                            // bidcode: "$bidcode",
                                            // bidAmount: "$bidAmount",
                                            bidDate: "$bidDate",
                                            depositedOn: "$depositedOn",
                                            paymentDueDate: "$paymentDueDate",
                                            type: "$type",
                                            depositLabel: "$depositLabel",
                                            status: "$status",
                                            paymentMode: "$paymentMode",
                                            amount: "$amount",
                                            // cropId: "$cropId",
                                            // cropCode: "$cropCode"
                                        }
                                    },
                                    totalAmount: {
                                        "$sum": "$amount"
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: "$_id.bidcode",
                                    cropCode: "$_id.cropCode",
                                    payments: '$payments',
                                    quantity: { $multiply: ["$_id.quantity", { $divide: ["$totalAmount", "$_id.bidAmount"] }] },
                                    amount: '$totalAmount',
                                    cropId: "$_id.cropId",
                                    buyerName: "$_id.buyerName"

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
                })
            }
        })
    },



    // for front end item list in orders 
    getUserOrder: function (req, res) {
        let qry = {};
        let userId = req.identity.id;
        if (req.param("id")) {
            userId = req.param("id");
        }
        qry.user = userId;
        // if (req.param("status")) {
        //     qry.status = req.param("status");
        // }

        let page = req.param('page');
        let count = parseInt(req.param('count'));
        let skipNo = (page - 1) * count;
        let tab = parseInt(req.param('tab'));


        let tabName = ''
        if (tab == 2) {    //delivered
            qry.$or = [{ status: 'Delivered' }, { status: 'Received' }, { status: 'Completed' }]
            tabName = 'Delivered'
        } else if (tab == 3) { //failed
            qry.$or = [{ status: 'Seller_Rejected' }, { status: 'Cancelled' }, { status: 'Failed' }, { status: 'Return' }, { status: 'Rejected' }]
            tabName = 'Canceled'
        } else { //active
            qry.$or = [{ status: 'Placed' }, { status: 'Processing' }, { status: 'Seller_Dispatched' },  { status: 'Franch_Received' }]
            tabName = 'Active'
        }
        Orderedcarts.count(qry).exec(function (cerr, counttotal) {
            if (cerr) {
                return res.status(400).jsonx({
                    success: false,
                    error: cerr,
                });
            } else {
                Orderedcarts.find(qry)
                .populate("input", { select: ['name', 'variety', 'coverPageImage', 'images'] })
                .populate("seller", { select: ['fullName', 'address', 'city', 'district', 'state', 'pincode', 'mobile'] })
                .skip(skipNo).limit(count)
                .sort('createdAt desc').exec((err, orderList) => {

                    if (err) {
                        return res.jsonx({
                            success: false,
                            message: "No records found."
                        });
                    } else {
                        return res.status(200).jsonx({
                            success: true,
                            data: orderList,
                            total: counttotal
                        });
                        /*async.each(orderList, function (orders, callback) {
                            if (orders.status == 'Seller_Rejected' || orders.status == 'Cancelled' || orders.status == 'Failed' || orders.status == 'Rejected') {
                                orders.tab = tabName
                            }
                            if (orders.status == 'Placed' || orders.status == 'Processing' || orders.status == 'Seller_Dispatched' || orders.status == 'Return') {
                                orders.tab = tabName
                            }
                            if (orders.status == 'Delivered' || orders.status == 'Received' || orders.status == 'Completed') {
                                orders.tab = tabName
                            }
                            callback();

                        }, function (error) {
                            if (error) {
                                return res.status(400).jsonx({
                                    success: false,
                                    error: error,
                                });
                            } else {
                                //orderList = _.groupBy(orderList, 'tab');
                                return res.status(200).jsonx({
                                    success: true,
                                    data: orderList,
                                    total: counttotal
                                });
                            }
                        });*/

                    }
                })
            }
        })
    },

    getSubOrderDetail: (req, res) => {
        let id = req.param('id');
        if (id != null && id != undefined) {
            Orderedcarts.find({
                id: id
            })
                .populate('order')
                .populate('buyerPayments')
                .populate('market')
                .populate("user", { select: ['fullName', 'address', 'city', 'district', 'state', 'pincode', 'mobile'] })
                .populate("seller", { select: ['fullName', 'address', 'city', 'district', 'state', 'pincode', 'mobile'] })
                .populate("input", { select: ['name', 'images', 'variety'] }).then((orderlist) => {


                    var cartsSelectedMarkets = []
                    for (var i = 0; i < orderlist.length; i++) {
                        //if (orderlist[i].market != undefined) {
                        cartsSelectedMarkets.push(orderlist[i].market)
                        // }

                    }
                    cartsSelectedMarkets = _.indexBy(cartsSelectedMarkets, 'GM');
                    // console.log(cartsSelectedMarkets, "cartsSelectedMarkets");
                    var frnUser = Users.find({ id: _.pluck(cartsSelectedMarkets, 'GM'), select: ['fullName', 'address', 'city', 'district', 'state', 'pincode', 'mobile'] }).then(function (frnUser) { return frnUser; })
                    // frnUser = _.indexBy(frnUser, 'id');
                    // console.log(frnUser, "frnchuer")
                    return [orderlist, frnUser]


                }).spread(function (orderlist, frnUser) {
                    // console.log(orderlist, "suborder")
                    frnUser = _.indexBy(frnUser, 'id');
                    //console.log(frnUser, "frnUser")
                    let i = 0;
                    orderlist = _.map(orderlist, function (allPrice) {
                        // console.log("address", frnUser.address);
                        allPrice.market = frnUser[orderlist[i].market.GM]
                        i++
                        return allPrice
                    });
                    // console.log(orderlist, "orderdata")


                    return res.jsonx({
                        success: true,
                        code: 200,
                        data: orderlist
                    });
                })


        }
    },

    getOrderDetails: function (req, res) {
        var id = req.param('id');

        Orderedcarts.findOne({ id: id })
            .populate("order")
            .populate("buyerPayments")
            .populate("sellerPayments")
            .populate("logisticPayments")
            .populate('franchiseePayments')
            .populate("logisticId")
            .populate("market")
            .populate("user")
            .populate("seller")
            .populate("crop")
            .populate("input")
            .then((orderinfo) => {

                //console.log("ddddd", orderinfo);

                if (orderinfo.franchiseePayments.length > 0) {
                    let franchiseePayment = orderinfo.franchiseePayments[0];
                    FranchiseePayments.findOne(franchiseePayment.id)
                        .populate(['franchiseeUserId', 'paymentBy'])
                        .then(function (franchiseeinfo) {

                            orderinfo.franchiseePayments = [];

                            orderinfo.franchiseePayments.push(franchiseeinfo);

                            return res.jsonx({
                                success: true,
                                code: 200,
                                data: orderinfo
                            });

                        });



                } else {
                    return res.jsonx({
                        success: true,
                        code: 200,
                        data: orderinfo
                    });
                }


            }).fail(function (err) {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: constantObj.messages.UNKNOW_ERROR_OCCURRED,
                        key: "UNKNOW_ERROR_OCCURRED"

                    },
                });
            });
    },

    getSellerSubOrders: function (req, res) {
        let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        let loggedIn = req.identity.id;
        // var search = req.param('search');
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var sortBy = req.param('sortBy');
        count = parseInt(count);
        var sortquery = {};

        var qry = {};
        qry.seller = loggedIn;
        count = parseInt(count);

        var sortquery = {};
        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }
        // console.log(qry)
        sortquery[field ? field : "createdAt"] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;
        Orderedcarts.find(qry)
            // .populate("order")
            .populate("user", { select: ['fullName'] })
            .populate("input", { select: ['name', 'coverPageImage'] })
            .populate("market", { select: ['name', 'GM'] })
            .skip(skipNo).limit(count).sort(sortquery)
            .then((suborders) => {
                // console.log(suborders, "suborders")
                let cartsSelectedMarkets = []
                for (var i = 0; i < suborders.length; i++) {
                    if (suborders[i].market != undefined) {
                        cartsSelectedMarkets.push(suborders[i].market)
                    }

                }
                cartsSelectedMarkets = _.indexBy(cartsSelectedMarkets, 'GM');
                // console.log(cartsSelectedMarkets, "cartsSelectedMarkets");
                var user = Users.find({ id: _.pluck(cartsSelectedMarkets, 'GM'), select: ['fullName', 'address', 'city', 'district', 'state', 'pincode'] }).then(function (marketGM) {

                    return marketGM
                });

                return [suborders, user]


            }).spread(function (suborders, user) {
                // console.log(suborders, "suborder===with== address")
                user = _.indexBy(user, 'id');
                // console.log("user", user)
                let i = 0
                suborders = _.map(suborders, function (allPrice) {
                    //console.log(user[suborders[i].market.GM], "==>>>")
                    if (allPrice.market && allPrice.market.GM != 'undefined') {
                        allPrice.market = user[suborders[i].market.GM]
                    }
                    i++
                    return allPrice

                });
                //console.log(suborders, "suborder===with== address")
                // console.log(qry);
                Orderedcarts.count(qry).then((allorderscount) => {
                    return res.jsonx({
                        success: true,
                        code: 200,
                        data: suborders,
                        total: allorderscount
                    });
                });
            })
    },


    getSubOrder: function (req, res) {
        let id = req.param("id");

        Orderedcarts.find({
            order: id
        })
            .populate('order')
            .populate('market', { select: ['name', 'GM'] })
            .populate("user", { select: ['fullName', 'address', 'city', 'district', 'state', 'pincode', 'mobile'] })
            .populate("seller", { select: ['fullName', 'address', 'city', 'district', 'state', 'pincode', 'mobile'] })
            .populate("input", { select: ['name', 'coverPageImage', 'variety'] }).exec((err, orderlist) => {
                if (err) {
                    return res.jsonx({
                        success: false,
                        message: "No record found."
                    });
                } else {
                    return res.jsonx({
                        success: true,
                        code: 200,
                        data: orderlist
                    });
                }
            })
    },

    // admin side get the list of orders according to user id wise
    userOrder: function (req, res) {

        let loggedIn = req.param('id');
        var search = req.param('search');
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var sortBy = req.param('sortBy');

        var sortquery = {};
        // console.log(loggedIn, "===");
        // return 1;
        var qry = {};
        qry.buyer = loggedIn;

        count = parseInt(count);

        if (search) {
            qry.$or = [
                {
                    code: {
                        'like': '%' + search + '%'
                    }
                    // },
                    // {
                    //     pincode: { "$in": [parseInt(search)] }
                }
            ]
        }

        var sortquery = {};

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }
        sortquery[field ? field : "createdAt"] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        Orders.count(qry).exec(function (err, total) {
            //console.log("qry", qry);
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                Orders.find(qry).populate('orderedCarts', { select: ['status'] }).skip(skipNo).limit(count).sort(sortquery).exec((err, orders) => {
                    if (err) {
                        return res.jsonx({
                            success: false,
                            message: "No records found"
                        });
                    } else {
                        // console.log("orders", orders)
                        for (var i = 0; i < orders.length; i++) {
                            let subOrders = orders[i].orderedCarts

                            orders[i].totalProducts = orders[i].orderedCarts.length
                            console.log("orders[i].orderedCarts.count == ", orders[i].orderedCarts.length)
                            suborder = _.groupBy(subOrders, 'status');

                            let placed = 0
                            let dispatched = 0
                            let delivered = 0
                            let cancelled = 0
                            let failed = 0
                            if (suborder['Placed']) {
                                placed = suborder['Placed']
                            }
                            if (suborder['Processing']) {
                                placed = suborder['Processing']
                            }
                            if (suborder['Seller_Dispatched']) {
                                dispatched = suborder['Seller_Dispatched']
                            }
                            if (suborder['Franch_Received']) {
                                dispatched = suborder['Franch_Received']
                            }
                            if (suborder['Delivered']) {
                                delivered = suborder['Delivered']
                            }
                            if (suborder['Received']) {
                                delivered = suborder['Received']
                            }
                            if (suborder['Cancelled']) {
                                cancelled = suborder['Cancelled']
                            }
                            if (suborder['Failed']) {
                                failed = suborder['Failed']
                            }


                            orders[i].placed = placed
                            orders[i].dispatched = dispatched
                            orders[i].delivered = delivered
                            orders[i].cancelled = cancelled
                            orders[i].failed = failed

                            delete orders[i].orderedCarts
                        }

                        return res.jsonx({
                            success: true,
                            code: 200,
                            data: {
                                orders: orders,
                                total: total
                            }
                        });
                    }
                })
            }
        });
    },


    myOrders: function (req, res) {

        let loggedIn = req.identity.id;
        var search = req.param('search');
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var sortBy = req.param('sortBy');
        count = parseInt(count);
        var sortquery = {};

        var qry = {};
        qry.buyer = loggedIn;

        count = parseInt(count);

        if (search) {
            qry.$or = [
                {
                    code: {
                        'like': '%' + search + '%'
                    }
                    // },
                    // {
                    //     pincode: { "$in": [parseInt(search)] }
                }
            ]
        }

        Orders.count(qry).exec(function (err, total) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                Orders.find(qry).populate("buyer").skip(skipNo).limit(count).sort('createdAt DESC').exec((err, orders) => {
                    if (err) {
                        return res.jsonx({
                            success: false,
                            message: "No records found"
                        });
                    } else {
                        return res.jsonx({
                            success: true,
                            code: 200,
                            data: {
                                orders: orders,
                                total: total
                            }
                        });
                    }

                })
            }
        });
    },

    getCropSubOrder: function (req, res) {

        var search = req.param('search');
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var sortBy = req.param('sortBy');
        count = parseInt(count);
        var sortquery = {};

        var qry = {};
        qry.crop = req.param('crop');

        count = parseInt(count);
        var sortquery = {};

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }
        sortquery[field ? field : "createdAt"] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        Orderedcarts.find(qry)
            .populate("order")
            .populate("crop")
            .populate("seller")
            .populate("user").skip(skipNo).limit(count).sort(sortquery)
            .then(function (subOrders) {

                return res.jsonx({
                    success: true,
                    code: 200,
                    data: subOrders
                });


            }).fail(function (err) {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: constantObj.messages.UNKNOW_ERROR_OCCURRED,
                        key: "UNKNOW_ERROR_OCCURRED"

                    },
                });
            });

    },

    getInputSubOrder: function (req, res) {

        var search = req.param('search');
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var sortBy = req.param('sortBy');
        count = parseInt(count);
        var sortquery = {};

        var qry = {};
        qry.input = req.param('input');

        count = parseInt(count);
        var sortquery = {};

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }
        sortquery[field ? field : "createdAt"] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        console.log(qry);
        Orderedcarts.find(qry)
            // .populate("order")
            .populate("input", { select: ['name', 'coverImage'] })
            .populate("seller")
            .populate("market")
            .populate("user", { select: ['fullName', 'address', 'city', 'district', 'state', 'pincode', 'mobile'] }).skip(skipNo).limit(count).sort(sortquery)
            .then(function (subOrders) {

                return res.jsonx({
                    success: true,
                    code: 200,
                    data: subOrders
                });


            }).fail(function (err) {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: constantObj.messages.UNKNOW_ERROR_OCCURRED,
                        key: "UNKNOW_ERROR_OCCURRED"

                    },
                });
            });

    },

    sellerOrderPayments: function (req, res) {

        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

        var cropId = ObjectId(req.param('cropId'))

        var query = {}

        query.cropId = cropId
        query.$and = [{ $or: [{ bidId: undefined }, { bidId: null }] }, { suborder: { $ne: undefined } }, { suborder: { $ne: null } }]
        query.paymentMedia = 'Cart'

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
                    from: 'orderedcarts',
                    localField: 'suborder',
                    foreignField: '_id',
                    as: "order"
                }
            },
            {
                $unwind: '$order'
            },
            {
                $lookup: {
                    from: 'crops',
                    localField: 'cropId',
                    foreignField: '_id',
                    as: "crops"
                }
            },
            {
                $unwind: '$crops'
            },
            {
                $project: {
                    id: "$_id",
                    buyerId: "$buyer.fullName",
                    bidcode: "$order.code",
                    bidAmount: "$order.amount",
                    bidDate: "$order.createdAt",
                    bidAcceptedAt: "$order.acceptedAt",
                    depositedOn: "$depositedOn",
                    paymentDueDate: "$paymentDueDate",
                    type: "$type",
                    depositLabel: "$depositLabel",
                    status: "$status",
                    paymentMode: "$paymentMode",
                    amount: "$amount",
                    cropId: "$crops._id"

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

    sellerInputOrderPayments: function (req, res) {

        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

        var input = ObjectId(req.param('inputId'))
        var query = {}
        query.input = input

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
                    from: 'orders',
                    localField: 'order',
                    foreignField: '_id',
                    as: "mainorder"
                }
            },
            {
                $unwind: '$mainorder'
            },
            {
                $lookup: {
                    from: 'orderedcarts',
                    localField: 'suborder',
                    foreignField: '_id',
                    as: "order"
                }
            },
            {
                $unwind: '$order'
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
                    bidcode: "$order.code",
                    orderCode: "$mainorder.code",
                    bidAmount: "$order.amount",
                    bidDate: "$order.createdAt",
                    bidAcceptedAt: "$order.acceptedAt",
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
                            orderCode: "$orderCode",
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

    // Sub orders for franchiseeDelivery API for crop
    franchiseeDeliveryCropOrders: function (req, res) {
        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";
        var status = req.param('status')

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

        if (search) {
            query.$or = [{
                code: parseFloat(search)
            },
            {
                cropCode: parseFloat(search)
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
                cropName: {
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

        // if (req.param('pincode')) {
        //     var pincodes = JSON.parse(req.param('pincode'));
        //     if (pincodes.length > 0) {
        //         query.pincode = {
        //             "$in": pincodes
        //         }
        //     }
        // }
        let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

        query.franchisee = ObjectId(req.identity.id)

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
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crops"
                }
            },
            {
                $unwind: '$crops'
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
                $unwind: '$market'
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
                    logisticId: {
                        $ifNull: ["$logisticId", "nulll"]
                    },
                    cropId: "$crops._id",
                    cropCode: "$crops.code",
                    pincode: "$pincode",
                    cropName: "$crops.name",
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
                    franchisee: "$market.GM"
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
                        from: 'crops',
                        localField: 'crop',
                        foreignField: '_id',
                        as: "crops"
                    }
                },
                {
                    $unwind: '$crops'
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
                    $unwind: '$market'
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
                        logisticId: {
                            $ifNull: ["$logisticId", "nulll"]
                        },
                        cropId: "$crops._id",
                        cropCode: "$crops.code",
                        pincode: "$pincode",
                        cropName: "$crops.name",
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
                        franchisee: "$market.GM"
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
                        //console.log("orderdata===", results)
                        async.each(results, function (item, callback) {
                            let subOrder = item.id
                            let paymentquery = {};
                            paymentquery.suborder = subOrder.toString()
                            paymentquery.paymentMedia = "Cart";
                            paymentquery.type = "Final";
                            Bidspayment.find(paymentquery)
                                .then((orderPaymentsCount) => {
                                    item.bidspaymentStatus = orderPaymentsCount[0].status;

                                    callback();


                                }).fail(function (error) {
                                    callback();
                                });

                        }, function (error) {
                            if (error) {
                                return false;
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


                    }
                });
            });
        });
    },

    // Sub orders for franchiseeDelivery API for input
    franchiseeDeliveryInputOrders: function (req, res) {
        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";
        var status = req.param('status')
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
        // if (req.param('pincode')) {
        //     var pincodes = JSON.parse(req.param('pincode'));
        //     if (pincodes.length > 0) {
        //         query.pincode = {
        //             "$in": pincodes
        //         }
        //     }
        // }
        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        query.seller = ObjectId(req.param('fId'));
        //console.log("dfdsfdsf", query);
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
                    seller: "$sellers._id",
                    logisticId: {
                        $ifNull: ["$logisticId", "nulll"]
                    },
                    input: "$inputs._id",
                    inputCode: "$inputs.code",
                    pincode: "$pincode",
                    inputName: "$inputs.name",
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
                        seller: "$sellers._id",
                        logisticId: {
                            $ifNull: ["$logisticId", "nulll"]
                        },
                        inputId: "$inputs._id",
                        inputCode: "$inputs.code",
                        pincode: "$pincode",
                        inputName: "$inputs.name",
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
                    console.log("results", results)
                    if (err) {
                        return res.status(400).jsonx({
                            success: false,
                            error: err
                        });
                    } else {

                        async.each(results, function (item, callback) {
                            let subOrder = item.id
                            let paymentquery = {};
                            paymentquery.suborder = subOrder.toString()
                            paymentquery.paymentMedia = "Cart";
                            paymentquery.type = "Final";
                            Bidspayment.find(paymentquery)
                                .then((orderPaymentsCount) => {
                                    item.bidspaymentStatus = orderPaymentsCount[0].status;

                                    callback();


                                }).fail(function (error) {
                                    callback();
                                });

                        }, function (error) {
                            if (error) {
                                return false;
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


                    }
                });
            });
        });
    },
    createETD: function (req, res) {
        let Id = req.param("id");
        if (Id != null && Id != undefined) {
            
            let body = {}
            let date = new Date(req.body.ETD);
            body.ETD = date

            Orderedcarts.findOne({ id: Id }).then(function (order) {
                if (order.distance) {
                    let numberOfDays = Math.ceil(order.distance / 200);
                    let etaDate = new Date(date)
                    etaDate.setDate(etaDate.getDate() + numberOfDays)
                    body.ETA = etaDate
                }
                
                Orderedcarts.update({ id: Id }, body).exec(function (err, orderUpdate) {
                    if (err) {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: err
                            }
                        });
                    } else {
                        return res.jsonx({
                            success: true,
                            data: {
                                message: "Order Updated",
                                order: orderUpdate[0]
                            }
                        });
                    }
                })
            })
        }
    },

    // update sub order API in admin section
    updateSubOdrer: function (req, res) {
        let orderId = req.param("id");
        var comment = req.param("comment");
        var status = req.param("status");
        var body = req.body;

        console.log("body == ", body);
        let env = body.env

        delete body.code;
        delete body.comment;
        delete body.subcode;
        delete body.env;

        if (orderId != undefined && orderId != null && status != undefined && status != null) {
            //update order status Processing to status condition
            console.log(status);
            if (status == "Processing") {
                body.dateSellerRejectedAccepted = new Date();
            } else if (status == "Seller_Rejected") {
                if (req.param("reasonSellerRejected") != null && req.param("reasonSellerRejected") != undefined) {
                    body.reasonSellerRejected = req.param("reasonSellerRejected");
                    body.dateSellerRejectedAccepted = new Date();
                } else {
                    return res.jsonx({
                        success: false,
                        message: "Reason of rejection is required."
                    });
                }
            } else if (status == "Seller_Dispatched") {
                body.ATD = new Date();
            } else if (status == "Franch_Received") {
                body.dateSellerRejectedAccepted = new Date();
                body.ATA = new Date();
            } else if (status == "Delivered" || status == "Completed" || status == "Failed" || status == "Received") {
                body.receivedDate = new Date();
            } else if (status == "Cancelled") {
                if (req.param("reasonCancellation") != null && req.param("reasonCancellation") != undefined) {
                    body.dateCancellation = new Date();
                    body.reasonCancellation = req.param("reasonCancellation")
                    body.isCanceled = true
                } else {
                    return res.jsonx({
                        success: false,
                        message: "Reason of cancelation is required."
                    });
                }
            } else if (status == "Return") { 
                if (req.param("reasonReturn") != null && req.param("reasonReturn") != undefined) {
                    body.dateReturnClaim = new Date();
                    body.reasonReturn = req.param("reasonReturn")
                } else {
                    return res.jsonx({
                        success: false,
                        message: "Reason of return is required."
                    });
                }
            } else if (status == "Return_Rejected") {
                if (req.param("reasonReturnRejected") != null && req.param("reasonReturnRejected") != undefined) {
                    body.dateReturnRejectAccept = new Date();
                    body.reasonReturnRejected = req.param("reasonReturnRejected")
                } else {
                    return res.jsonx({
                        success: false,
                        message: "Reason for rejection of return is required."
                    });
                }
            } else if (status == "Return_Accepted") {
                body.dateReturnRejectAccept = new Date();
            } else if (status == "Retrun_Seller_Received") {
                body.dateReturnSellerReceived = new Date();
            }

            Orderedcarts.update({ id: orderId }, body).exec((err, orderUpdates) => {
                var orderUpdate = orderUpdates[0];
                                                    console.log(orderUpdate, "orderUpdate");

                if (err) {
                    return res.jsonx({
                        success: false,
                        message: "Something went wrong."
                    });
                } else {
                    if ((status == "Cancelled" || status == "Return_Accepted" || status == "Seller_Rejected") 
                        && (orderUpdate.paymentMethod == "STEP" || orderUpdate.paymentMethod == "ADVANCE")) {
                        body.env = env
                        return API(OrderService.orderRefundAmount, req, res);
                    } else {
                        let orderUpdateData = orderUpdate;

                        // ================== input order history==============
                        let orderStatusHistory = {}
                        orderStatusHistory.order = orderUpdateData.order;
                        orderStatusHistory.suborder = orderUpdateData.id;
                        orderStatusHistory.input = orderUpdateData.productId;
                        orderStatusHistory.updatedBy = req.identity.id;
                        orderStatusHistory.comment = status;

                        // console.log("orderStatusHistory", orderStatusHistory);
                        Ordershistory.create(orderStatusHistory).exec((err, orderHistory) => {
                            Inputs.findOne({id:orderUpdate.input}).then( function(orderinput) {
                                Orders.findOne({id:orderUpdate.order}).then(function (ordr) {
                                
                                    if (status == "Received") {
                                        // Bidspayment.findOne({ suborder: orderUpdate.id, input: orderUpdate.input }).then(function (bids) {
                                        // console.log("bidpayemnt", bids);
                                        var fpQuery = {}
                                        fpQuery.inputId = orderUpdate.input
                                        fpQuery.order = orderUpdate.order
                                        fpQuery.suborder = orderUpdate.id
                                        fpQuery.sellerId = orderUpdate.seller
                                        fpQuery.buyerId = ordr.buyer

                                        let franchiseeAmount = orderinput.price * orderUpdate.franchiseePercentage * orderUpdate.quantity / 100
                                        if (orderUpdate.franchiseePartPerQuantity != undefined) {
                                            franchiseeAmount = orderUpdate.franchiseePartPerQuantity * orderUpdate.quantity
                                        }

                                            console.log(franchiseeAmount, "franchiseeAmount");
                                        // let franchiseeAmount = orderUpdate.sellingPrice * (orderUpdate.francshiseePercentage/100)
                                        fpQuery.amount = parseFloat((franchiseeAmount).toFixed(2))

                                        fpQuery.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString()
                                        fpQuery.status = 'Due'
                                        fpQuery.productType = "input"
                                        fpQuery.marketId = orderUpdate.market

                                        Market.findOne({ id: orderUpdate.market }).populate("GM").then(function (market) {
                                            // console.log(market, "market");
                                            fpQuery.franchiseeUserId = market.GM.id
                                            console.log(fpQuery, "fpQuery");
                                            FranchiseePayments.create(fpQuery).then(function (fp) {
                                                return res.jsonx({
                                                    success: true,
                                                    data: {
                                                        message: constantObj.order.UPDATED_ORDER,
                                                        key: 'UPDATED_ORDER',
                                                        data: {
                                                            order: orderUpdateData,
                                                            franchiseePayment: fp
                                                        }
                                                    }
                                                })
                                            })
                                        })
                                        // })
                                    } else if (status == "Delivered") {
                                        var fpQuery = {}
                                        fpQuery.input = orderUpdate.input
                                        fpQuery.order = orderUpdate.order
                                        fpQuery.suborder = orderUpdate.id
                                        fpQuery.sellerId = orderUpdate.seller
                                        fpQuery.buyerId = ordr.buyer

                                        let franchiseeAmount = orderUpdate.amount

                                        fpQuery.amount = parseFloat((franchiseeAmount).toFixed(2))

                                        fpQuery.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString()
                                        fpQuery.status = 'Due'
                                        fpQuery.productType = "input"

                                        Market.findOne({ id: orderUpdate.market }).populate("GM").then(function (market) {

                                            if (market.GM) {
                                                fpQuery.franchiseeId = market.GM.id
                                                fpQuery.payer = market.GM.id
                                            }

                                            console.log("fpQuery == ", fpQuery)

                                            FarmxPayment.create(fpQuery).then(function (fp) {
                                                return res.jsonx({
                                                    success: true,
                                                    data: {
                                                        message: constantObj.order.UPDATED_ORDER,
                                                        key: 'UPDATED_ORDER',
                                                        data: {
                                                            order: orderUpdateData,
                                                            farmxPayment: fp
                                                        }
                                                    }
                                                })
                                            })
                                        })
                                    } else {                                    
                                        return res.jsonx({
                                            success: true,
                                            data: {
                                                message: constantObj.order.UPDATED_ORDER,
                                                key: 'UPDATED_ORDER',
                                                data: {
                                                    order: orderUpdateData,
                                                    orderHistory: orderHistory
                                                }
                                            }
                                        });
                                    }
                                })
                            })
                        })
                    }
                }
            });
        } else {
            return res.jsonx({
                success: false,
                message: "Order Id is required."
            });
        }

    },

    assignLogisticAndDeliveryTimeSubOrder: function (req, res) {
        let orderID = req.param("id");
        let data = req.body;
        console.log("req.body == ", req.body)
        console.log(data);
        /*if(!req.body.code || req.body.code ==  undefined){
            return res.jsonx({
                        success: false,
                        error: {
                           code: 400,
                           message: "Sub order code can't update now."
                        },
                    });
        }*/

        let orderUpdateData = {}
        orderUpdateData.id = orderID
        orderUpdateData.deliveryTime = data.deliveryTime
        orderUpdateData.logisticId = data.logisticId


        const googleMapsClient = require('@google/maps').createClient({
            key: constantObj.googlePlaces.key
        });

        Orderedcarts.findOne({ id: orderID }).populate('crop').populate('input').populate("tripId").populate("order").then(function (orderedcarts) {
            if (orderedcarts) {

                var message = 'Logistic assigned';
                if (orderedcarts["logisticId"]) {
                    message = 'Logistic changed'
                }

                if (!orderedcarts.ETD) {
                    return res.jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: "Can not assign logistic as ETD is not assigned to order yet."
                        },
                    });
                }


                if (orderedcarts.ETD) {

                    var availObj = orderedcarts.ETD;
                    var availableRange = parseInt(data.deliveryTime);
                    var dateChanged = new Date(availObj);
                    dateChanged.setDate(dateChanged.getDate() + availableRange);
                    orderUpdateData.ETA = dateChanged

                }

                if (orderedcarts.tripId) {
                    return res.jsonx({
                        success: false,
                        error: "Already assigned in trip " + String(orderedcarts.tripId.code) + ". Please remove order from there and then reassign."
                    });
                } else {

                    var findOngoingTrip = {}
                    findOngoingTrip.vehicle = data.vehicleId
                    findOngoingTrip.status = 'Created'

                    LogisticTrip.findOne(findOngoingTrip).populate('orders').then(function (trip) {
                        console.log("existing trip == ", trip)
                        let sourceAddress = "" //orderedcarts.crop.address + ", " + orderedcarts.crop.city + ", " + orderedcarts.crop.district + ", " + orderedcarts.crop.state
                        if (orderedcarts.productType == "CROP") {
                            sourceAddress = orderedcarts.crop.address + ", " + orderedcarts.crop.city + ", " + orderedcarts.crop.district + ", " + orderedcarts.crop.state
                        } else if (orderedcarts.productType == "INPUT") {
                            sourceAddress = orderedcarts.input.address + ", " + orderedcarts.input.city + ", " + orderedcarts.input.district + ", " + orderedcarts.input.state
                        }

                        let destinationAddress = orderedcarts.order.shippingAddress.address + ", " + orderedcarts.order.shippingAddress.city + ", " + orderedcarts.order.shippingAddress.district + ", " + orderedcarts.order.shippingAddress.state

                        var tripOrderData = {}
                        tripOrderData.seller = orderedcarts.seller
                        tripOrderData.buyer = orderedcarts.user
                        tripOrderData.sourceAddress = sourceAddress
                        tripOrderData.destinationAddress = destinationAddress

                        var geocoder = NodeGeocoder(constantObj.googlePlaces.options);

                        geocoder.geocode(sourceAddress).then(function (sourceAddressInfo) {
                            if (sourceAddressInfo) {
                                if (sourceAddressInfo.length > 0) {
                                    geocoder.geocode(destinationAddress).then(function (destinationAddressInfo) {
                                        if (destinationAddressInfo) {
                                            if (destinationAddressInfo.length > 0) {
                                                if (sourceAddressInfo[0].zipcode) {
                                                    tripOrderData.sourcePincode = sourceAddressInfo[0].zipcode
                                                } else {
                                                    tripOrderData.sourcePincode = orderedcarts.order.shippingAddress.pincode
                                                }

                                                tripOrderData.sourceCoordinates = { lat: sourceAddressInfo[0].latitude, lon: sourceAddressInfo[0].longitude }

                                                if (destinationAddressInfo[0].zipcode) {
                                                    tripOrderData.destinationPincode = destinationAddressInfo[0].zipcode
                                                }

                                                tripOrderData.destinationCoordinates = { lat: destinationAddressInfo[0].latitude, lon: destinationAddressInfo[0].longitude }

                                                tripOrderData.orderId = orderID

                                                if (trip) {
                                                    console.log("going inside existing == ")
                                                    orderUpdateData.tripId = trip.id

                                                    tripOrderData.tripId = trip.id
                                                    tripOrderData.type = 'cartOrder'

                                                    Triporder.create(tripOrderData).then(function (tripData) {
                                                        let orders = trip.orders
                                                        orders.push(tripData)

                                                        let addressSequence = []

                                                        let allCoordinates = []

                                                        for (var i = 0; i < orders.length; i++) {
                                                            allCoordinates.push({ address: orders[i].sourceAddress, lat: orders[i].sourceCoordinates.lat, lon: orders[i].sourceCoordinates.lon, type: "seller", orderId: orders[i].id })
                                                            allCoordinates.push({ address: orders[i].destinationAddress, lat: orders[i].destinationCoordinates.lat, lon: orders[i].destinationCoordinates.lon, type: "buyer", orderId: orders[i].id })
                                                        }

                                                        let opts = {
                                                            yName: "lon",
                                                            xName: "lat"
                                                        }

                                                        let origin = { lon: allCoordinates[0].lon, lat: allCoordinates[0].lat }

                                                        let sortedLocations = sortByDistance(origin, allCoordinates, opts)
                                                        //console.log("===+++ arun aaya===")

                                                        let sequecenceOfDestinations = []


                                                        for (var i = 0; i < sortedLocations.length; i++) {
                                                            sequecenceOfDestinations.push({ address: sortedLocations[i].address, coord: { lat: sortedLocations[i].lat, lon: sortedLocations[i].lon }, type: sortedLocations[i].type, orderId: sortedLocations[i].orderId })
                                                        }

                                                        trip.destinationSequence = sequecenceOfDestinations
                                                        let waypoints = ""

                                                        for (var i = 1; i < sortedLocations.length - 1; i++) {
                                                            if (i > 1) {
                                                                waypoints = waypoints + "|"
                                                            }
                                                            waypoints = waypoints + "via:" + String(sortedLocations[i].lat) + "," + String(sortedLocations[i].lon)
                                                        }

                                                        googleMapsClient.directions({
                                                            origin: String(origin.lat) + "," + String(origin.lon),
                                                            destination: String(sortedLocations[sortedLocations.length - 1].lat) + "," + String(sortedLocations[sortedLocations.length - 1].lon),
                                                            waypoints: waypoints,
                                                            optimize: false
                                                        }, function (err, routeresponses) {
                                                            console.log("routeresponses == ", routeresponses)
                                                            let routeresponse = undefined
                                                            if (routeresponses && routeresponses.json) {
                                                                routeresponse = routeresponses.json
                                                            }
                                                            if (!err && routeresponse && routeresponse.status == 'OK' && routeresponse.routes && routeresponse.routes.length > 0) {
                                                                if (routeresponse.routes[0].legs && routeresponse.routes[0].legs.length > 0) {
                                                                    trip.totalDistanceToTravel = routeresponse.routes[0].legs[0].distance
                                                                    trip.totalTimeToBeTaken = routeresponse.routes[0].legs[0].duration
                                                                    trip.prescribedRoute = routeresponse.routes[0].legs[0].steps
                                                                }
                                                            }

                                                            var locJson = trip.prescribedRoute;                                                    

                                                            let tripToUpdate = trip

                                                            delete tripToUpdate.orders
                                                            delete tripToUpdate.prescribedRoute;
                                                            tripToUpdate.prescribedRoute = [];

                                                            LogisticTrip.update({ id: trip.id }, tripToUpdate).then(function (updatedTrip) {
                                                                Orderedcarts.update({ id: orderID }, orderUpdateData).then(function (updatesuborder) {
                                                                    let history = saveHistory(orderedcarts.order,
                                                                        orderedcarts.id,
                                                                        orderedcarts.crop.id,
                                                                        req.identity.id, message, "");


                                                                    let path1 = 'assets/location/prescriberoutes/' + trip.id + '.json';
                                                        
                                                                    fs.writeFile(path1, JSON.stringify(locJson, null, 2), function (err) {
                                                                        if (err) throw err;

                                                                        return res.jsonx({
                                                                            success: true,
                                                                            code: 200,
                                                                            data: {
                                                                                suborder: updatesuborder[0],
                                                                                trip: updatedTrip[0],
                                                                                message: constantObj.order.UPDATED_ORDER,
                                                                                key: 'UPDATED_ORDER',
                                                                            },
                                                                        })
                                                                    })                                                                    
                                                                }).fail(function (error) {
                                                                    return res.jsonx({
                                                                        success: false,
                                                                        error: {
                                                                            code: 400,
                                                                            message: error
                                                                        },
                                                                    });
                                                                });
                                                            }).fail(function (error) {
                                                                console.log("error == ", error)
                                                                return res.jsonx({
                                                                    success: false,
                                                                    error: {
                                                                        code: 400,
                                                                        message: error
                                                                    },
                                                                })
                                                            })
                                                        })
                                                    }).fail(function (err) {
                                                        return res.jsonx({
                                                            success: false,
                                                            error: {
                                                                code: 400,
                                                                message: err
                                                            },
                                                        })
                                                    })
                                                } else {

                                                    let logisticTrip = {}
                                                    TripCode().then(function (code) {
                                                        logisticTrip.code = code
                                                        logisticTrip.logisticPartner = data.logisticId
                                                        logisticTrip.vehicle = data.vehicleId
                                                        logisticTrip.driver = data.driverId
                                                        logisticTrip.destinationSequence = [{ address: sourceAddress, coord: tripOrderData.sourceCoordinates, type: 'seller' }, { address: destinationAddress, coord: tripOrderData.destinationCoordinates, type: 'buyer' }]
                                                        OTTC().then(function (ottc) {
                                                            logisticTrip.OTTC = ottc
                                                            logisticTrip.OTTCCreatedDate = new Date()

                                                            googleMapsClient.directions({
                                                                origin: String(tripOrderData.sourceCoordinates.lat) + "," + String(tripOrderData.sourceCoordinates.lon),
                                                                destination: String(tripOrderData.destinationCoordinates.lat) + "," + String(tripOrderData.destinationCoordinates.lon),
                                                            }, function (err, routeresponses) {
                                                                console.log("routeresponses == ", routeresponses)
                                                                let routeresponse = undefined
                                                                if (routeresponses && routeresponses.json) {
                                                                    routeresponse = routeresponses.json
                                                                }

                                                                if (!err && routeresponse && routeresponse.status == 'OK' && routeresponse.routes && routeresponse.routes.length > 0) {
                                                                    if (routeresponse.routes[0].legs && routeresponse.routes[0].legs.length > 0) {
                                                                        logisticTrip.totalDistanceToTravel = routeresponse.routes[0].legs[0].distance
                                                                        logisticTrip.totalTimeToBeTaken = routeresponse.routes[0].legs[0].duration
                                                                        logisticTrip.prescribedRoute = routeresponse.routes[0].legs[0].steps
                                                                    }
                                                                }

                                                                var locJson = logisticTrip.prescribedRoute;
                                                                delete logisticTrip.prescribedRoute;
                                                                logisticTrip.prescribedRoute = [];

                                                                LogisticTrip.create(logisticTrip).then(function (newtrip) {
                                                                    if (newtrip) {
                                                                        tripOrderData.tripId = newtrip.id
                                                                        tripOrderData.type = 'cartOrder'

                                                                        orderUpdateData.tripId = newtrip.id


                                                                        Triporder.create(tripOrderData).then(function (tripData) {
                                                                            newtrip.destinationSequence = [{ address: sourceAddress, coord: tripOrderData.sourceCoordinates, type: "seller", orderId: tripData.id }, { address: destinationAddress, coord: tripOrderData.destinationCoordinates, type: "buyer", orderId: tripData.id }]
                                                                            delete newtrip.orders
                                                                            LogisticTrip.update({ id: newtrip.id }, newtrip).then(function (updatedTripInfo) {
                                                                                let smsInfo = {}
                                                                                smsInfo.tripcode = String(newtrip.code)
                                                                                smsInfo.OTTC = String(newtrip.OTTC)
                                                                                Lpartners.findOne({ id: data.logisticId }).populate('vehicles').populate('drivers').then(function (lpartner) {
                                                                                    console.log("lpartner == ", lpartner)
                                                                                    for (var i = 0; i < lpartner.vehicles.length; i++) {
                                                                                        let vehicle = lpartner.vehicles[i]
                                                                                        if (vehicle.id == data.vehicleId) {
                                                                                            smsInfo.vehiclenumber = vehicle.number
                                                                                            break
                                                                                        }
                                                                                    }
                                                                                    for (var i = 0; i < lpartner.drivers.length; i++) {
                                                                                        let vehicle = lpartner.drivers[i]
                                                                                        if (vehicle.id == data.driverId) {
                                                                                            if (vehicle.mobile) {
                                                                                                smsInfo.numbers = [lpartner.mobile, vehicle.mobile]
                                                                                            } else {
                                                                                                smsInfo.numbers = [lpartner.mobile]
                                                                                            }
                                                                                            break
                                                                                        }
                                                                                    }

                                                                                    if (!smsInfo.numbers) {
                                                                                        smsInfo.numbers = [lpartner.mobile]
                                                                                    }

                                                                                    commonService.sendOTTCSMS(smsInfo)


                                                                                    Orderedcarts.update({ id: orderID }, orderUpdateData).then(function (updatesuborder) {
                                                                                        let history = saveHistory(orderedcarts.order,
                                                                                            orderedcarts.id,
                                                                                            orderedcarts.crop,
                                                                                            req.identity.id, message, "");
                                                                                        //(order,suborder,crop,updatedBy,comment, rejectReason)

                                                                                        let path1 = 'assets/location/prescriberoutes/' + newtrip.id + '.json';
                                                                                        fs.writeFile(path1, JSON.stringify(locJson, null, 2), function (err) {
                                                                                            if (err) throw err;

                                                                                            return res.jsonx({
                                                                                                success: true,
                                                                                                code: 200,
                                                                                                data: {
                                                                                                    suborder: updatesuborder[0],
                                                                                                    trip: updatedTrip[0],
                                                                                                    message: constantObj.order.UPDATED_ORDER,
                                                                                                    key: 'UPDATED_ORDER',
                                                                                                },
                                                                                            })
                                                                                        })                                                                                        
                                                                                    }).fail(function (error) {
                                                                                        return res.jsonx({
                                                                                            success: false,
                                                                                            error: {
                                                                                                code: 400,
                                                                                                message: error
                                                                                            },
                                                                                        });
                                                                                    });
                                                                                })
                                                                            }).fail(function (err) {
                                                                                return res.jsonx({
                                                                                    success: false,
                                                                                    error: {
                                                                                        code: 400,
                                                                                        message: err
                                                                                    },
                                                                                })
                                                                            })
                                                                        }).fail(function (err) {
                                                                            return res.jsonx({
                                                                                success: false,
                                                                                error: {
                                                                                    code: 400,
                                                                                    message: err
                                                                                },
                                                                            })
                                                                        })
                                                                    } else {
                                                                        return res.jsonx({
                                                                            success: false,
                                                                            error: {
                                                                                code: 400,
                                                                                message: "Unknow Error Occurred"
                                                                            },
                                                                        });
                                                                    }
                                                                }).fail(function (err) {
                                                                    return res.jsonx({
                                                                        success: false,
                                                                        error: {
                                                                            code: 400,
                                                                            message: err
                                                                        },
                                                                    });
                                                                });
                                                            })
                                                        })
                                                    })
                                                }
                                            } else {
                                                return res.jsonx({
                                                    success: false,
                                                    error: {
                                                        code: 400,
                                                        message: "Destination Address not valid"
                                                    },
                                                });
                                            }
                                        }
                                    });
                                } else {
                                    return res.jsonx({
                                        success: false,
                                        error: {
                                            code: 400,
                                            message: "Source Address not valid"
                                        },
                                    });
                                }
                            }
                        });
                    }).fail(function (error) {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: error
                            },
                        })
                    })
                }
            } else {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: "Unknow Error Occurred"
                    },
                });
            }
        }).fail(function (error) {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: error
                },
            });
        });
    },

    // dispatch sub order API in admin section
    dispatchSubOdrer: function (req, res) {
        let suborderId = req.param("id");
        Orderedcarts.findOne({ id: suborderId }).populate("crop").then(function (suborder) {

            let departureAddress = suborder["crop"].city + ", " + suborder["crop"].district + ", " + suborder["crop"].state;

            let data = {};
            data.status = 'Dispatched';
            data.ATD = new Date();
            data.routeDetails = [{
                departure: departureAddress,
                createdAt: new Date(),
                updatedAt: new Date(),
                comment: 'Dispatched',
                isCompleted: true
            }]

            Orderedcarts.update({
                id: suborderId
            }, data)
                .then((orderUpdate) => {

                    let order = orderUpdate[0].order;
                    let suborder = orderUpdate[0].id;
                    let crop = orderUpdate[0].crop;
                    let updatedBy = req.identity.id
                    let comment = 'Order dispatched';

                    let history = saveHistory(order, suborder, crop, updatedBy, comment, "");

                    var findCropQuery = {}
                    findCropQuery.id = orderUpdate[0].crop

                    Crops.findOne(findCropQuery)
                        .then((crop) => {
                            var cropUpdateQry = {}
                            cropUpdateQry.leftAfterDeliveryQuantity = crop.leftAfterDeliveryQuantity - orderUpdate[0].quantity
                            Crops.update(findCropQuery, cropUpdateQry)
                                .then((updatedCrop) => {

                                    var msg = "Order (" + orderUpdate[0].code + ") is dispatched.";

                                    var notificationData = {};
                                    notificationData.productId = orderUpdate[0].crop;
                                    notificationData.crop = orderUpdate[0].crop;
                                    notificationData.user = orderUpdate[0].user;
                                    notificationData.buyerId = orderUpdate[0].user;
                                    notificationData.sellerId = crop.seller
                                    notificationData.productType = "crops";
                                    notificationData.message = msg;
                                    notificationData.messageKey = "ORDER_DISPATCHED_NOTIFICATION"
                                    notificationData.readBy = [];

                                    Notifications.create(notificationData).then((notificationResponse) => {

                                        var userID = orderUpdate[0].user;
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

                                            res.jsonx({
                                                success: true,
                                                data: {
                                                    message: constantObj.order.UPDATED_ORDER,
                                                    key: 'UPDATED_ORDER',
                                                    odrer: orderUpdate[0]
                                                }
                                            });

                                        });

                                    })

                                })
                        })

                }).fail(function (error) {
                    res.jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: error
                        },
                    });
                });
        }).fail(function (error) {
            res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: "Find Sub order failed"
                },
            });
        });

    },

    // Receive sub order API in admin section
    receiveSubOdrer: function (req, res) {
        let data = {};
        data.status = 'Received'
        data.receivedDate = new Date()

        let orderId = req.param("id");
        Orderedcarts.update({
            id: orderId
        }, data)
            .then((suborder) => {

                let order = suborder[0].order;
                let subOrder = suborder[0].id;
                let crop = suborder[0].crop;
                let updatedBy = req.identity.id
                let comment = 'Order Received';

                let history = saveHistory(order, subOrder, crop, updatedBy, comment, "");
                var findCropQuery = {}
                findCropQuery.id = suborder[0].crop

                // console.log("findCropQuery",findCropQuery)
                Crops.findOne(findCropQuery).populate('market').then((crop) => {

                    // console.log("crop123@@@@@@@@@@@@@@@@@@@@@@@",crop)
                    var fpQuery = {};
                    fpQuery.cropId = suborder[0].crop;
                    fpQuery.order = suborder[0].order;
                    fpQuery.suborder = suborder[0].id;
                    fpQuery.sellerId = crop.seller;
                    fpQuery.buyerId = suborder[0].user;
                    fpQuery.amount = parseFloat(suborder[0].amount * suborder[0].quantity) * parseFloat(crop.franchiseePercentage / 100);
                    fpQuery.pincode = crop.pincode;
                    fpQuery.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString();
                    fpQuery.status = 'Due';

                    if (crop.market.id) {
                        fpQuery.marketId = crop.market.id;
                    } else if (crop.market._id) {
                        fpQuery.marketId = crop.market._id;
                    }
                    fpQuery.franchiseeUserId = crop.market.GM;

                    FranchiseePayments.create(fpQuery).then((fp) => {
                        // console.log("fp1234@@@@@@@@@@@@@@@@@@@",fp)
                        var msg = "Order (" + suborder[0].code + ") is Received. ";

                        var notificationData = {};
                        notificationData.productId = suborder[0].crop;
                        notificationData.crop = suborder[0].crop;
                        notificationData.user = suborder[0].user;
                        notificationData.buyerId = suborder[0].user;
                        notificationData.productType = "crops";
                        //notificationData.transactionOwner = u[0].id;
                        notificationData.message = msg;
                        notificationData.messageKey = "ORDER_RECEIVED_NOTIFICATION"
                        notificationData.readBy = [];
                        // console.log("notificationData______________________",notificationData)

                        Notifications.create(notificationData).then((notificationResponse) => {
                            // console.log("notificationResponse++++++++++++++++++++++",notificationResponse)

                            var userID = suborder[0].user;
                            Users.findOne(userID).then(function (userinfo) {
                                // push notification by rohitk
                                console.log("user push notify", userinfo);
                                if (userinfo && userinfo.deviceToken) {
                                    let pushObj = {};
                                    pushObj.device_token = userinfo.deviceToken;
                                    pushObj.device_type = userinfo.device_type;
                                    pushObj.message = msg;
                                    pushService.sendPush(pushObj);
                                }

                                res.jsonx({
                                    success: true,
                                    data: {
                                        message: constantObj.order.UPDATED_ORDER,
                                        key: 'UPDATED_ORDER',
                                        odrer: suborder[0]
                                    }
                                });

                            });

                        })
                    }).fail(function (error) {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: error
                            },
                        });
                    })
                });
            }).fail(function (error) {
                res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: error
                    },
                });
            });
    },
    deliverOrder: function (req, res) {
        // Add .ATA to by deliverOrder
        let orderId = req.param("id");
        let data = req.body;
        /*if(req.body.code || req.body.code ==  undefined){
            return res.jsonx({
                        success: false,
                        error: {
                           code: 400,
                           message: "Sub order code can't update now."
                        },
                    });
        }*/
        Orderedcarts.update({ id: orderId }, data).then(function (subOrder) {
            let suborder = subOrder[0];
            // console.log("suborder is",suborder)
            let history = saveHistory(suborder.order,
                suborder.id,
                suborder.crop,
                req.identity.id,
                "Order Delivered",
                "");

            Crops.findOne({ id: suborder.crop }).then(function (crop) {
                // console.log("crop is",crop)
                var msg = "Suborder (" + suborder.code + ") is delivered. ";

                var notificationData = {};
                notificationData.productId = suborder.crop;
                notificationData.crop = suborder.crop;
                notificationData.user = suborder.user;
                notificationData.buyerId = suborder.user;
                notificationData.productType = "crops";
                notificationData.message = msg;
                notificationData.messageKey = "SUBORDER_DELIVERED_NOTIFICATION"
                notificationData.readBy = [];


                /*if(user && user.deviceToken){
                    let pushObj = {};
                    pushObj.device_token = user.deviceToken ;
                    pushObj.device_type = user.device_type ;
                    pushObj.message = msg ;
                    pushService.sendPush(pushObj) ;
                }*/

                // console.log("notificationData is",notificationData)
                Notifications.create(notificationData)
                    .then(function (notificationResponse) {
                        // console.log("notificationResponse is",notificationResponse)
                        if (crop.efarmxLogisticPercentage >= 0) {

                            var lpQuery = {}
                            lpQuery.cropId = suborder.crop;
                            lpQuery.order = suborder.order;
                            lpQuery.suborder = suborder.id;
                            lpQuery.sellerId = crop.seller;
                            lpQuery.buyerId = suborder.user;
                            lpQuery.amount = parseFloat(suborder.deliveryCharges) * parseFloat((100 - crop.efarmxLogisticPercentage) / 100);
                            //lpQuery.amount = parseFloat(suborder.logisticPayment) * parseFloat((100-crop.efarmxLogisticPercentage)/100);
                            lpQuery.pincode = crop.pincode;
                            lpQuery.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString();
                            lpQuery.logisticPartner = suborder.logisticId;
                            lpQuery.status = 'Due';
                            // console.log("lpQuery",lpQuery)
                            LogisticPayment.create(lpQuery).then(function (fp) {
                                console.log("LogisticPayment is", fp)
                                return res.jsonx({
                                    success: true,
                                    code: 200,
                                    data: {
                                        suborder: suborder,
                                        message: constantObj.order.UPDATED_ORDER,
                                        key: 'UPDATED_ORDER',
                                    },
                                });
                            }).fail(function (error) {
                                return res.jsonx({
                                    success: true,
                                    code: 200,
                                    data: {
                                        suborder: suborder,
                                        message: constantObj.order.UPDATED_ORDER,
                                        key: 'UPDATED_ORDER',
                                    },
                                });
                            })
                        } else {
                            return res.jsonx({
                                success: true,
                                code: 200,
                                data: {
                                    suborder: suborder,
                                    message: constantObj.order.UPDATED_ORDER,
                                    key: 'UPDATED_ORDER',
                                },
                            });
                        }
                    })
            }); // crop end query

        }).fail(function (error) {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: error
                },
            });
        });

    },

    // input dispatch sub order API in admin section
    dispatchInputSubOdrer: function (req, res) {
        let suborderId = req.param("id");
        Orderedcarts.findOne({ id: suborderId }).populate("input").then(function (suborder) {

            let departureAddress = suborder["input"].city + ", " + suborder["input"].district + ", " + suborder["input"].state;
            let data = {};
            data.status = 'Dispatched';
            data.ATD = new Date();
            data.routeDetails = [{
                departure: departureAddress,
                createdAt: new Date(),
                updatedAt: new Date(),
                comment: 'Dispatched',
                isCompleted: true
            }]

            Orderedcarts.update({
                id: suborderId
            }, data)
                .then((orderUpdate) => {

                    let order = orderUpdate[0].order;
                    let suborder = orderUpdate[0].id;
                    let input = orderUpdate[0].input;
                    let updatedBy = req.identity.id
                    let comment = 'Order dispatched';

                    let history = saveInputHistory(order, suborder, input, updatedBy, comment, "");

                    var findinputQuery = {}
                    findinputQuery.id = orderUpdate[0].input

                    Inputs.findOne(findinputQuery)
                        .then((input) => {
                            var inputUpdateQry = {}
                            inputUpdateQry.leftAfterDeliveryQuantity = input.leftAfterDeliveryQuantity - orderUpdate[0].quantity
                            Inputs.update(findinputQuery, inputUpdateQry)
                                .then((updatedinput) => {

                                    var msg = "Order (" + orderUpdate[0].code + ") is dispatched.";

                                    var notificationData = {};
                                    notificationData.productId = orderUpdate[0].input;
                                    notificationData.input = orderUpdate[0].input;
                                    notificationData.user = orderUpdate[0].user;
                                    notificationData.buyerId = orderUpdate[0].user;
                                    notificationData.sellerId = input.user;
                                    notificationData.productType = "inputs";
                                    notificationData.message = msg;
                                    notificationData.messageKey = "ORDER_DISPATCHED_NOTIFICATION"
                                    notificationData.readBy = [];

                                    Notifications.create(notificationData).then((notificationResponse) => {

                                        var userID = orderUpdate[0].user;
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

                                            res.jsonx({
                                                success: true,
                                                data: {
                                                    message: constantObj.order.UPDATED_ORDER,
                                                    key: 'UPDATED_ORDER',
                                                    odrer: orderUpdate[0]
                                                }
                                            });

                                        });

                                    })

                                })
                        })

                }).fail(function (error) {
                    res.jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: error
                        },
                    });
                });
        }).fail(function (error) {
            res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: "Find Sub order failed"
                },
            });
        });

    },

    // Receive sub order API in admin section for input
    receiveInputSubOdrer: function (req, res) {
        let data = {};
        data.status = 'Received'
        data.receivedDate = new Date()

        let orderId = req.param("id");
        Orderedcarts.update({
            id: orderId
        }, data)
            .then((suborder) => {

                let order = suborder[0].order;
                let subOrder = suborder[0].id;
                let input = suborder[0].input;
                let updatedBy = req.identity.id
                let comment = 'Order Received';

                let history = saveInputHistory(order, subOrder, input, updatedBy, comment, "");
                var findinputQuery = {}
                findinputQuery.id = suborder[0].input

                // console.log("findinputQuery",findinputQuery)
                Inputs.findOne(findinputQuery).then((input) => {

                    // console.log("input123@@@@@@@@@@@@@@@@@@@@@@@",input)
                    var fpQuery = {};
                    fpQuery.inputId = suborder[0].input;
                    fpQuery.order = suborder[0].order;
                    fpQuery.suborder = suborder[0].id;
                    fpQuery.sellerId = input.user;
                    fpQuery.buyerId = suborder[0].user;
                    fpQuery.amount = parseFloat(suborder[0].amount * suborder[0].quantity) * parseFloat(input.franchiseePercentage / 100);
                    fpQuery.pincode = input.pincode;
                    fpQuery.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString();
                    fpQuery.status = 'Due';

                    fpQuery.franchiseeUserId = input.user;
                    fpQuery.productType = 'input';

                    FranchiseePayments.create(fpQuery).then((fp) => {

                        var msg = "Order (" + suborder[0].code + ") is Received. ";

                        var notificationData = {};
                        notificationData.productId = suborder[0].input;
                        notificationData.input = suborder[0].input;
                        notificationData.user = suborder[0].user;
                        notificationData.buyerId = suborder[0].user;
                        notificationData.productType = "inputs";
                        //notificationData.transactionOwner = u[0].id;
                        notificationData.message = msg;
                        notificationData.messageKey = "ORDER_RECEIVED_NOTIFICATION"
                        notificationData.readBy = [];
                        // console.log("notificationData______________________",notificationData)

                        Notifications.create(notificationData).then((notificationResponse) => {
                            // console.log("notificationResponse++++++++++++++++++++++",notificationResponse)

                            var userID = suborder[0].user;
                            Users.findOne(userID).then(function (userinfo) {
                                // push notification by rohitk
                                console.log("user push notify", userinfo);
                                if (userinfo && userinfo.deviceToken) {
                                    let pushObj = {};
                                    pushObj.device_token = userinfo.deviceToken;
                                    pushObj.device_type = userinfo.device_type;
                                    pushObj.message = msg;
                                    pushService.sendPush(pushObj);
                                }

                                res.jsonx({
                                    success: true,
                                    data: {
                                        message: constantObj.order.UPDATED_ORDER,
                                        key: 'UPDATED_ORDER',
                                        odrer: suborder[0]
                                    }
                                });

                            });

                        })
                    }).fail(function (error) {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: error
                            },
                        });
                    })
                });
            }).fail(function (error) {
                res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: error
                    },
                });
            });
    },

    // For input  deliverOrder
    deliverInputOrder: function (req, res) {
        // Add .ATA to by deliverOrder
        let orderId = req.param("id");
        let data = req.body;
        Orderedcarts.update({ id: orderId }, data).then(function (subOrder) {
            let suborder = subOrder[0];
            // console.log("suborder is",suborder)
            let history = saveHistory(suborder.order,
                suborder.id,
                suborder.input,
                req.identity.id,
                "Order Delivered",
                "");

            Inputs.findOne({ id: suborder.input }).then(function (input) {
                // console.log("input is",input)
                var msg = "Suborder (" + suborder.code + ") is delivered. ";

                var notificationData = {};
                notificationData.productId = suborder.input;
                notificationData.input = suborder.input;
                notificationData.user = suborder.user;
                notificationData.buyerId = suborder.user;
                notificationData.productType = "inputs";
                notificationData.message = msg;
                notificationData.messageKey = "SUBORDER_DELIVERED_NOTIFICATION"
                notificationData.readBy = [];

                // console.log("notificationData is",notificationData)
                Notifications.create(notificationData)
                    .then(function (notificationResponse) {
                        // console.log("notificationResponse is",notificationResponse)
                        if (input.efarmxLogisticPercentage >= 0) {

                            var lpQuery = {}
                            lpQuery.input = suborder.input;
                            lpQuery.order = suborder.order;
                            lpQuery.suborder = suborder.id;
                            lpQuery.sellerId = input.user;
                            lpQuery.buyerId = suborder.user;
                            lpQuery.amount = parseFloat(suborder.deliveryCharges) * parseFloat((100 - input.efarmxLogisticPercentage) / 100);
                            //lpQuery.amount = parseFloat(suborder.logisticPayment) * parseFloat((100-input.efarmxLogisticPercentage)/100);
                            lpQuery.pincode = input.pincode;
                            lpQuery.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString();
                            lpQuery.logisticPartner = suborder.logisticId;
                            lpQuery.status = 'Due';
                            lpQuery.productType = "input";
                            // console.log("lpQuery",lpQuery)
                            LogisticPayment.create(lpQuery).then(function (fp) {
                                console.log("LogisticPayment is", fp)
                                return res.jsonx({
                                    success: true,
                                    code: 200,
                                    data: {
                                        suborder: suborder,
                                        message: constantObj.order.UPDATED_ORDER,
                                        key: 'UPDATED_ORDER',
                                    },
                                });
                            }).fail(function (error) {
                                return res.jsonx({
                                    success: true,
                                    code: 200,
                                    data: {
                                        suborder: suborder,
                                        message: constantObj.order.UPDATED_ORDER,
                                        key: 'UPDATED_ORDER',
                                    },
                                });
                            })
                        } else {
                            return res.jsonx({
                                success: true,
                                code: 200,
                                data: {
                                    suborder: suborder,
                                    message: constantObj.order.UPDATED_ORDER,
                                    key: 'UPDATED_ORDER',
                                },
                            });
                        }
                    })
            }); // input end query

        }).fail(function (error) {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: error
                },
            });
        });

    },

    // From Crop logistics-order-count
    logisticOrderCountDashboard: function (req, res) {
        let status = req.param('status');

        var qry = {};
        qry.status = status;
        qry.logisticsOption = "efarmx";

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }
        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            qry.user = ObjectId(req.param('buyerId'));
        }
        if (req.param('sellerId') && req.param('sellerId') != undefined && req.param('sellerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            qry.seller = ObjectId(req.param('sellerId'))
        }
        console.log("ddddddd", qry);
        Orderedcarts.native(function (err, orderlist) {
            orderlist.aggregate([
                {
                    $lookup: {
                        from: 'crops',
                        localField: 'crop',
                        foreignField: '_id',
                        as: "crop"
                    }
                },
                {
                    $unwind: '$crop'
                },
                {
                    $project: {
                        user: "$user",
                        seller: "$crop.seller",
                        status: "$status",
                        logisticsOption: "$logisticsOption",
                        pincode: "$crop.pincode"
                    }
                },
                {
                    $match: qry
                }
            ], function (err, rcds) {
                console.log("dfsdfd", rcds);
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: rcds.length
                    });
                }
            });
        })
    },

    // From input logistics-order-count
    logisticInputOrderCountDashboard: function (req, res) {
        let status = req.param('status');



        var qry = {};

        if (status = "Pending") {
            qry.$or = [{
                status: "Pending"
            }, {
                status: "Processing"
            }]
        } else {
            qry.status = status;
        }



        qry.logisticsOption = "efarmx";

        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }
        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            qry.user = ObjectId(req.param('buyerId'));
        }
        if (req.param('sellerId') && req.param('sellerId') != undefined && req.param('sellerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            qry.seller = ObjectId(req.param('sellerId'))
        }
        console.log("ddddddd", qry);
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
                    user: "$user",
                    seller: "$input.user",
                    status: "$status",
                    logisticsOption: "$logisticsOption",
                    pincode: "$input.pincode"
                }
            },
            {
                $match: qry
            }
            ], function (err, rcds) {
                console.log("dfsdfd", rcds);
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: rcds.length
                    });
                }
            });
        })
    },

    // For Crop
    logisticOrderCompletedDashboard: function (req, res) {
        var qry = {};
        qry.$or = [{
            status: "Delivered"
        }, {
            status: "Received"
        }]
        qry.logisticsOption = 'efarmx';
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }
        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('buyerId'))
            qry.user = userId
        }
        if (req.param('sellerId') && req.param('sellerId') != undefined && req.param('sellerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('sellerId'))
            qry.seller = userId
        }

        // qry.$and = [{ATA: {$gte: new Date(req.param('from'))}}, {ATA: {$lte: new Date(req.param('to'))}}]

        qry.$or = [{
            $and: [{
                ATA: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                ATA: {
                    $lte: new Date(req.param('to'))
                }
            }]
        },
        {
            $and: [{
                receivedDate: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                receivedDate: {
                    $lte: new Date(req.param('to'))
                }
            }]
        }
        ]


        Orderedcarts.native(function (err, orderlist) {
            orderlist.aggregate([{
                $lookup: {
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crop"
                }
            },
            {
                $unwind: '$crop'
            },
            {
                $project: {
                    user: "$user",
                    seller: "$crop.seller",
                    code: "$code",
                    Id: "$id",
                    status: "$status",
                    logisticsOption: "$logisticsOption",
                    pincode: "$crop.pincode",
                    ATA: "$ATA",
                    receivedDate: "$receivedDate",
                    comp: {
                        $cmp: ["$ETA", "$ATA"]
                    }
                }
            },
            {
                $match: qry
            },
            {
                $group: {
                    _id: "$comp",
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

    // For Input
    logisticInputOrderCompletedDashboard: function (req, res) {
        var qry = {};
        qry.$or = [{
            status: "Delivered"
        }, {
            status: "Received"
        }]
        qry.logisticsOption = 'efarmx';
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = {
                    "$in": pincode
                }
            }
        }
        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('buyerId'))
            qry.user = userId
        }
        if (req.param('sellerId') && req.param('sellerId') != undefined && req.param('sellerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('sellerId'))
            qry.seller = userId
        }

        // qry.$and = [{ATA: {$gte: new Date(req.param('from'))}}, {ATA: {$lte: new Date(req.param('to'))}}]

        qry.$or = [{
            $and: [{
                ATA: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                ATA: {
                    $lte: new Date(req.param('to'))
                }
            }]
        },
        {
            $and: [{
                receivedDate: {
                    $gte: new Date(req.param('from'))
                }
            }, {
                receivedDate: {
                    $lte: new Date(req.param('to'))
                }
            }]
        }
        ]


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
                    user: "$user",
                    seller: "$input.user",
                    code: "$code",
                    Id: "$id",
                    status: "$status",
                    logisticsOption: "$logisticsOption",
                    pincode: "$input.pincode",
                    ATA: "$ATA",
                    receivedDate: "$receivedDate",
                    comp: {
                        $cmp: ["$ETA", "$ATA"]
                    }
                }
            },
            {
                $match: qry
            },
            {
                $group: {
                    _id: "$comp",
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
    logisticPendingOrderListing: function (req, res) {

        var qry = {};

        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";
        // var status = req.param('status')

        if (req.param('sortBy')) {
            sortBy = req.param('sortBy')
        }

        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('buyerId'))

            qry.buyerId = userId
        }

        if (req.param('sellerId') && req.param('sellerId') != undefined && req.param('sellerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('sellerId'))

            qry.sellerId = userId
        }

        if (req.param('logisticId')) {
            if (req.param('logisticId') == "nulll") {
                qry.logisticId = "nulll"
            } else {
                qry.logisticId = {
                    $ne: "nulll"
                }
            }
        }


        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }
        var sortquery = {};
        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        if (search) {
            qry.$or = [{
                code: parseFloat(search)
            },
            {
                buyer: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                seller: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressPincode: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressState: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressDistrict: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressCity: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddress: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            /*{
                dropAddress: {
                    $regex: search,
                    '$options': 'i'
                }
            },*/
            {
                logisticPartner: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                quantity: parseFloat(search)
            }
            ]
        }

        //qry.status = "Pending" // "Dispatched"
        qry.$or = [{
            status: "Pending"
        }, {
            status: "Processing"
        }]
        qry.logisticsOption = 'efarmx'
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pickupAddressPincode = {
                    "$in": pincode
                }
            }
        }
        console.log("qry********", qry);
        Orderedcarts.native(function (err, orderlist) {
            orderlist.aggregate([{
                $lookup: {
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crop"
                }
            },
            {
                $unwind: '$crop'
            },
            {
                $lookup: {
                    from: 'orders',
                    localField: 'order',
                    foreignField: '_id',
                    as: "orders"
                }
            },
            {
                $unwind: '$orders'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'crop.seller',
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
                    localField: 'user',
                    foreignField: '_id',
                    as: "buyers"
                }
            },
            {
                $unwind: '$buyers'
            },
            // {
            //     $lookup: {
            //         from: 'lpartners',
            //         localField: 'logisticId',
            //         foreignField: '_id',
            //         as: "lpartner"
            //     }
            // },
            // {
            //     $unwind: '$lpartner',
            //     preserveNullAndEmptyArrays: true
            // },
            {
                $project: {
                    sellerId: "$sellers._id",
                    seller: "$sellers.fullName",
                    sellerContact: "$seller.mobile",
                    buyerId: "$buyers._id",
                    buyer: "$buyers.fullName",
                    buyerContact: "$buyers.mobile",
                    code: "$code",
                    orderCode: "$orders.code",
                    status: "$status",
                    logisticsOption: "$logisticsOption",
                    cropCode: "$crop.code",
                    cropId: "$crop._id",
                    logisticId: {
                        $ifNull: ["$logisticId", "nulll"]
                    },
                    // logisticPartner: "$lpartner.companyName",
                    ETD: "$ETD",
                    ETA: "$ETA",
                    ATD: "$ATD",
                    ATA: "$ATA",
                    deliveryTime: "$deliveryTime",
                    routeDetails: "$routeDetails",
                    dropAddress: "$orders.shippingAddress",
                    pickupAddress: "$crop.address",
                    pickupAddressCity: "$crop.city",
                    pickupAddressDistrict: "$crop.disctrict",
                    pickupAddressState: "$crop.state",
                    pickupAddressPincode: "$crop.pincode"
                }
            },
            {
                $match: qry
            }
            ], function (err, totalresults) {

                orderlist.aggregate([{
                    $lookup: {
                        from: 'crops',
                        localField: 'crop',
                        foreignField: '_id',
                        as: "crop"
                    }
                },
                {
                    $unwind: '$crop'
                },
                {
                    $lookup: {
                        from: 'orders',
                        localField: 'order',
                        foreignField: '_id',
                        as: "orders"
                    }
                },
                {
                    $unwind: '$orders'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'crop.seller',
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
                        localField: 'user',
                        foreignField: '_id',
                        as: "buyers"
                    }
                },
                {
                    $unwind: '$buyers'
                },
                // {
                //     $lookup: {
                //         from: 'lpartners',
                //         localField: 'logisticId',
                //         foreignField: '_id',
                //         as: "lpartner"
                //     }
                // },
                // {
                //     $unwind: '$lpartner',
                //     preserveNullAndEmptyArrays: true
                // },
                {
                    $project: {
                        sellerId: "$sellers._id",
                        seller: "$sellers.fullName",
                        sellerContact: "$seller.mobile",
                        buyerId: "$buyers._id",
                        buyer: "$buyers.fullName",
                        buyerContact: "$buyers.mobile",
                        code: "$code",
                        orderCode: "$orders.code",
                        status: "$status",
                        logisticsOption: "$logisticsOption",
                        cropCode: "$crop.code",
                        cropId: "$crop._id",
                        logisticId: {
                            $ifNull: ["$logisticId", "nulll"]
                        },
                        // logisticPartner: "$lpartner.companyName",
                        ETD: "$ETD",
                        ETA: "$ETA",
                        ATD: "$ATD",
                        ATA: "$ATA",
                        deliveryTime: "$deliveryTime",
                        routeDetails: "$routeDetails",
                        dropAddress: "$orders.shippingAddress",
                        pickupAddress: "$crop.address",
                        pickupAddressCity: "$crop.city",
                        pickupAddressDistrict: "$crop.disctrict",
                        pickupAddressState: "$crop.state",
                        pickupAddressPincode: "$crop.pincode",
                        createdAt: "$createdAt"
                    }
                },
                {
                    $match: qry
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

                        async.each(results, function (order, callback) {
                            if (order.logisticId != "nulll") {
                                var lpqry = order.logisticId.toString()
                                Lpartners.findOne(lpqry).then(function (lp) {
                                    order.logisticPartner = lp.companyName
                                    callback()
                                }).fail(function (err) {
                                    callback()
                                });
                            } else {
                                callback()
                            }
                        }, function (asyncError) {
                            if (asyncError) {
                                return res.status(400).jsonx({
                                    success: false,
                                    error: asyncError
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
                    }
                });
            });
        })
    },

    // for input 
    logisticPendingInputOrderListing: function (req, res) {

        var qry = {};

        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";

        if (req.param('sortBy')) {
            sortBy = req.param('sortBy')
        }

        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('buyerId'))

            qry.buyerId = userId
        }

        if (req.param('sellerId') && req.param('sellerId') != undefined && req.param('sellerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('sellerId'))

            qry.sellerId = userId
        }

        if (req.param('logisticId')) {
            if (req.param('logisticId') == "nulll") {
                qry.logisticId = "nulll"
            } else {
                qry.logisticId = {
                    $ne: "nulll"
                }
            }
        }

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }
        var sortquery = {};
        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        if (search) {
            qry.$or = [{
                code: parseFloat(search)
            },
            {
                buyer: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                seller: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressPincode: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressState: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressDistrict: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressCity: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddress: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                logisticPartner: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                quantity: parseFloat(search)
            }
            ]
        }

        //qry.status = "Pending" // "Dispatched"

        qry.$or = [{
            status: "Pending"
        }, {
            status: "Processing"
        }]

        qry.logisticsOption = 'efarmx'
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pickupAddressPincode = {
                    "$in": pincode
                }
            }
        }
        console.log("qry********", qry);
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
                    from: 'orders',
                    localField: 'order',
                    foreignField: '_id',
                    as: "orders"
                }
            },
            {
                $unwind: '$orders'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'input.user',
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
                    localField: 'user',
                    foreignField: '_id',
                    as: "buyers"
                }
            },
            {
                $unwind: '$buyers'
            },
            {
                $project: {
                    sellerId: "$sellers._id",
                    seller: "$sellers.fullName",
                    sellerContact: "$seller.mobile",
                    buyerId: "$buyers._id",
                    buyer: "$buyers.fullName",
                    buyerContact: "$buyers.mobile",
                    code: "$code",
                    orderCode: "$orders.code",
                    dropAddress: "$orders.shippingAddress",
                    status: "$status",
                    logisticsOption: "$logisticsOption",
                    logisticId: {
                        $ifNull: ["$logisticId", "nulll"]
                    },
                    // logisticPartner: "$lpartner.companyName",
                    ETD: "$ETD",
                    ETA: "$ETA",
                    ATD: "$ATD",
                    ATA: "$ATA",
                    deliveryTime: "$deliveryTime",
                    routeDetails: "$routeDetails",
                    inputCode: "$input.code",
                    inputId: "$input._id",
                    pickupAddress: "$input.address",
                    pickupAddressCity: "$input.city",
                    pickupAddressDistrict: "$input.disctrict",
                    pickupAddressState: "$input.state",
                    pickupAddressPincode: "$input.pincode"
                }
            },
            {
                $match: qry
            }
            ], function (err, totalresults) {

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
                        from: 'orders',
                        localField: 'order',
                        foreignField: '_id',
                        as: "orders"
                    }
                },
                {
                    $unwind: '$orders'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'input.user',
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
                        localField: 'user',
                        foreignField: '_id',
                        as: "buyers"
                    }
                },
                {
                    $unwind: '$buyers'
                },
                {
                    $project: {
                        sellerId: "$sellers._id",
                        seller: "$sellers.fullName",
                        sellerContact: "$seller.mobile",
                        buyerId: "$buyers._id",
                        buyer: "$buyers.fullName",
                        buyerContact: "$buyers.mobile",
                        code: "$code",
                        orderCode: "$orders.code",
                        status: "$status",
                        logisticsOption: "$logisticsOption",
                        inputCode: "$input.code",
                        inputId: "$input._id",
                        logisticId: {
                            $ifNull: ["$logisticId", "nulll"]
                        },
                        // logisticPartner: "$lpartner.companyName",
                        ETD: "$ETD",
                        ETA: "$ETA",
                        ATD: "$ATD",
                        ATA: "$ATA",
                        deliveryTime: "$deliveryTime",
                        routeDetails: "$routeDetails",
                        dropAddress: "$orders.shippingAddress",
                        pickupAddress: "$input.address",
                        pickupAddressCity: "$input.city",
                        pickupAddressDistrict: "$input.disctrict",
                        pickupAddressState: "$input.state",
                        pickupAddressPincode: "$input.pincode",
                        createdAt: "$createdAt"
                    }
                },
                {
                    $match: qry
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

                        async.each(results, function (order, callback) {
                            if (order.logisticId != "nulll") {
                                var lpqry = order.logisticId.toString()
                                Lpartners.findOne(lpqry).then(function (lp) {
                                    order.logisticPartner = lp.companyName
                                    callback()
                                }).fail(function (err) {
                                    callback()
                                });
                            } else {
                                callback()
                            }
                        }, function (asyncError) {
                            if (asyncError) {
                                return res.status(400).jsonx({
                                    success: false,
                                    error: asyncError
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
                    }
                });
            });
        })
    },

    // For crop
    logisticDispatchedOrderListing: function (req, res) {

        var qry = {};

        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";
        // var status = req.param('status')

        if (req.param('sortBy')) {
            sortBy = req.param('sortBy')
        }

        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('buyerId'))

            qry.buyerId = userId
        }

        if (req.param('sellerId') && req.param('sellerId') != undefined && req.param('sellerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('sellerId'))

            qry.sellerId = userId
        }

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }
        var sortquery = {};
        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        if (search) {
            qry.$or = [{
                code: parseFloat(search)
            },
            {
                buyer: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                seller: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressPincode: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressState: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressDistrict: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressCity: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddress: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            /*{
                dropAddress: {
                    $regex: search,
                    '$options': 'i'
                }
            },*/
            {
                logisticPartner: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                quantity: parseFloat(search)
            }
            ]
        }

        qry.status = "Dispatched" // "Dispatched"
        qry.logisticsOption = 'efarmx'
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pickupAddressPincode = {
                    "$in": pincode
                }
            }
        }
        console.log("ddddddd", qry);
        Orderedcarts.native(function (err, orderlist) {
            orderlist.aggregate([{
                $lookup: {
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crop"
                }
            },
            {
                $unwind: '$crop'
            },
            {
                $lookup: {
                    from: 'orders',
                    localField: 'order',
                    foreignField: '_id',
                    as: "orders"
                }
            },
            {
                $unwind: '$orders'
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
                    localField: 'user',
                    foreignField: '_id',
                    as: "buyers"
                }
            },
            {
                $unwind: '$buyers'
            },
            {
                $project: {
                    code: "$code",
                    orderCode: "$orders.code",
                    sellerId: "$sellers._id",
                    seller: "$sellers.fullName",
                    sellerContact: "$seller.mobile",
                    buyerId: "$buyers._id",
                    buyer: "$buyers.fullName",
                    buyerContact: "$buyers.mobile",
                    status: "$status",
                    logisticsOption: "$logisticsOption",
                    cropCode: "$crop.code",
                    cropId: "$crop._id",
                    logisticId: {
                        $ifNull: ["$logisticId", "nulll"]
                    },
                    ETD: "$ETD",
                    ETA: "$ETA",
                    ATD: "$ATD",
                    ATA: "$ATA",
                    deliveryTime: "$deliveryTime",
                    routeDetails: "$routeDetails",
                    dropAddress: "$orders.shippingAddress",
                    pickupAddress: "$crop.address",
                    pickupAddressCity: "$crop.city",
                    pickupAddressDistrict: "$crop.disctrict",
                    pickupAddressState: "$crop.state",
                    pickupAddressPincode: "$crop.pincode",
                    createdAt: "$createdAt"
                }
            },
            {
                $match: qry
            }
            ], function (err, totalresults) {

                orderlist.aggregate([{
                    $lookup: {
                        from: 'crops',
                        localField: 'crop',
                        foreignField: '_id',
                        as: "crop"
                    }
                },
                {
                    $unwind: '$crop'
                },
                {
                    $lookup: {
                        from: 'orders',
                        localField: 'order',
                        foreignField: '_id',
                        as: "orders"
                    }
                },
                {
                    $unwind: '$orders'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'crop.seller',
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
                        localField: 'user',
                        foreignField: '_id',
                        as: "buyers"
                    }
                },
                {
                    $unwind: '$buyers'
                },
                {
                    $project: {
                        sellerId: "$sellers._id",
                        seller: "$sellers.fullName",
                        sellerContact: "$seller.mobile",
                        buyerId: "$buyers._id",
                        buyer: "$buyers.fullName",
                        buyerContact: "$buyers.mobile",
                        code: "$code",
                        orderCode: "$orders.code",
                        status: "$status",
                        logisticsOption: "$logisticsOption",
                        cropCode: "$crop.code",
                        cropId: "$crop._id",
                        logisticId: {
                            $ifNull: ["$logisticId", "nulll"]
                        },
                        ETD: "$ETD",
                        ETA: "$ETA",
                        ATD: "$ATD",
                        ATA: "$ATA",
                        deliveryTime: "$deliveryTime",
                        routeDetails: "$routeDetails",
                        dropAddress: "$orders.shippingAddress",
                        pickupAddress: "$crop.address",
                        pickupAddressCity: "$crop.city",
                        pickupAddressDistrict: "$crop.disctrict",
                        pickupAddressState: "$crop.state",
                        pickupAddressPincode: "$crop.pincode",
                        createdAt: "$createdAt"
                    }
                },
                {
                    $match: qry
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

                        console.log("totalresults", totalresults);
                        async.each(results, function (item, callback) {

                            if (item.logisticId == "nulll") {

                                item["logisticPartner"] = "No assigned";
                                callback();

                            } else {
                                Lpartners.findOne({ id: item.logisticId })
                                    .then(function (lpartnerinfo) {
                                        item["logisticPartner"] = lpartnerinfo.companyName;
                                        callback();
                                    });
                            }

                        }, function (error) {
                            if (error) {
                                return false;
                            } else {

                                return res.status(200).jsonx({
                                    success: true,
                                    data: {
                                        orders: results,
                                        total: results.length
                                    }
                                });

                            }
                        });

                    }
                });
            });
        })
    },

    // for Input
    logisticDispatchedInputOrderListing: function (req, res) {

        var qry = {};

        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";

        if (req.param('sortBy')) {
            sortBy = req.param('sortBy')
        }

        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('buyerId'))

            qry.buyerId = userId
        }

        if (req.param('sellerId') && req.param('sellerId') != undefined && req.param('sellerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('sellerId'))

            qry.sellerId = userId
        }

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }
        var sortquery = {};
        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        if (search) {
            qry.$or = [{
                code: parseFloat(search)
            },
            {
                buyer: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                seller: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressPincode: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressState: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressDistrict: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressCity: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddress: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            /*{
                dropAddress: {
                    $regex: search,
                    '$options': 'i'
                }
            },*/
            {
                logisticPartner: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                quantity: parseFloat(search)
            }
            ]
        }

        qry.status = "Dispatched" // "Dispatched"
        qry.logisticsOption = 'efarmx'
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pickupAddressPincode = {
                    "$in": pincode
                }
            }
        }
        console.log("ddddddd", qry);
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
                    from: 'orders',
                    localField: 'order',
                    foreignField: '_id',
                    as: "orders"
                }
            },
            {
                $unwind: '$orders'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'input.user',
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
                    localField: 'user',
                    foreignField: '_id',
                    as: "buyers"
                }
            },
            {
                $unwind: '$buyers'
            },
            {
                $project: {
                    code: "$code",
                    orderCode: "$orders.code",
                    sellerId: "$sellers._id",
                    seller: "$sellers.fullName",
                    sellerContact: "$seller.mobile",
                    buyerId: "$buyers._id",
                    buyer: "$buyers.fullName",
                    buyerContact: "$buyers.mobile",
                    status: "$status",
                    logisticsOption: "$logisticsOption",
                    inputCode: "$input.code",
                    inputId: "$input._id",
                    logisticId: {
                        $ifNull: ["$logisticId", "nulll"]
                    },
                    ETD: "$ETD",
                    ETA: "$ETA",
                    ATD: "$ATD",
                    ATA: "$ATA",
                    deliveryTime: "$deliveryTime",
                    routeDetails: "$routeDetails",
                    dropAddress: "$orders.shippingAddress",
                    pickupAddress: "$input.address",
                    pickupAddressCity: "$input.city",
                    pickupAddressDistrict: "$input.disctrict",
                    pickupAddressState: "$input.state",
                    pickupAddressPincode: "$input.pincode",
                    createdAt: "$createdAt"
                }
            },
            {
                $match: qry
            }
            ], function (err, totalresults) {

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
                        from: 'orders',
                        localField: 'order',
                        foreignField: '_id',
                        as: "orders"
                    }
                },
                {
                    $unwind: '$orders'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'input.user',
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
                        localField: 'user',
                        foreignField: '_id',
                        as: "buyers"
                    }
                },
                {
                    $unwind: '$buyers'
                },
                {
                    $project: {
                        sellerId: "$sellers._id",
                        seller: "$sellers.fullName",
                        sellerContact: "$seller.mobile",
                        buyerId: "$buyers._id",
                        buyer: "$buyers.fullName",
                        buyerContact: "$buyers.mobile",
                        code: "$code",
                        orderCode: "$orders.code",
                        status: "$status",
                        logisticsOption: "$logisticsOption",
                        inputCode: "$input.code",
                        inputId: "$input._id",
                        logisticId: {
                            $ifNull: ["$logisticId", "nulll"]
                        },
                        ETD: "$ETD",
                        ETA: "$ETA",
                        ATD: "$ATD",
                        ATA: "$ATA",
                        deliveryTime: "$deliveryTime",
                        routeDetails: "$routeDetails",
                        dropAddress: "$orders.shippingAddress",
                        pickupAddress: "$input.address",
                        pickupAddressCity: "$input.city",
                        pickupAddressDistrict: "$input.disctrict",
                        pickupAddressState: "$input.state",
                        pickupAddressPincode: "$input.pincode",
                        createdAt: "$createdAt"
                    }
                },
                {
                    $match: qry
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

                        console.log("totalresults", totalresults);
                        async.each(results, function (item, callback) {

                            if (item.logisticId == "nulll") {

                                item["logisticPartner"] = "No assigned";
                                callback();

                            } else {
                                Lpartners.findOne({ id: item.logisticId })
                                    .then(function (lpartnerinfo) {
                                        item["logisticPartner"] = lpartnerinfo.companyName;
                                        callback();
                                    });
                            }

                        }, function (error) {
                            if (error) {
                                return false;
                            } else {

                                return res.status(200).jsonx({
                                    success: true,
                                    data: {
                                        orders: results,
                                        total: results.length
                                    }
                                });

                            }
                        });

                    }
                });
            });
        })
    },

    // For crop
    logisticCompletedOrderListing: function (req, res) {

        var qry = {};

        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";

        if (req.param('sortBy')) {
            sortBy = req.param('sortBy')
        }

        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('buyerId'))

            qry.buyerId = userId
        }

        if (req.param('sellerId') && req.param('sellerId') != undefined && req.param('sellerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('sellerId'))

            qry.sellerId = userId
        }

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }
        var sortquery = {};
        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        if (search) {
            qry.$or = [{
                code: parseFloat(search)
            },
            {
                buyer: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                seller: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressPincode: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressState: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressDistrict: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressCity: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddress: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                logisticPartner: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                quantity: parseFloat(search)
            }
            ]
        }

        qry.$or = [{
            status: "Delivered"
        }, {
            status: "Received"
        }]
        qry.logisticsOption = 'efarmx'
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pickupAddressPincode = {
                    "$in": pincode
                }
            }
        }
        Orderedcarts.native(function (err, orderlist) {
            orderlist.aggregate([{
                $lookup: {
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crop"
                }
            },
            {
                $unwind: '$crop'
            },
            {
                $lookup: {
                    from: 'orders',
                    localField: 'order',
                    foreignField: '_id',
                    as: "orders"
                }
            },
            {
                $unwind: '$orders'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'crop.seller',
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
                    localField: 'user',
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
                    localField: 'logisticId',
                    foreignField: '_id',
                    as: "lpartner"
                }
            },
            {
                $unwind: '$lpartner'
            },
            {
                $project: {
                    sellerId: "$sellers._id",
                    seller: "$sellers.fullName",
                    sellerContact: "$seller.mobile",
                    buyerId: "$buyers._id",
                    buyer: "$buyers.fullName",
                    buyerContact: "$buyers.mobile",
                    code: "$code",
                    orderCode: "$orders.code",
                    status: "$status",
                    logisticsOption: "$logisticsOption",
                    cropCode: "$crop.code",
                    cropId: "$crop._id",
                    logisticId: "$logisticId",
                    logisticPartner: "$lpartner.companyName",
                    ETD: "$ETD",
                    ETA: "$ETA",
                    ATD: "$ATD",
                    ATA: "$ATA",
                    deliveryTime: "$deliveryTime",
                    routeDetails: "$routeDetails",
                    //dropAddress: "$orders.shippingAddress.address" + "$orders.shippingAddress.city" + "$orders.shippingAddress.district" +"$orders.shippingAddress.state" + "$orders.shippingAddress.pincode",
                    dropAddress: "$orders.shippingAddress",
                    pickupAddress: "$crop.address",
                    pickupAddressCity: "$crop.city",
                    pickupAddressDistrict: "$crop.disctrict",
                    pickupAddressState: "$crop.state",
                    pickupAddressPincode: "$crop.pincode"
                }
            },
            {
                $match: qry
            }
            ], function (err, totalresults) {

                orderlist.aggregate([{
                    $lookup: {
                        from: 'crops',
                        localField: 'crop',
                        foreignField: '_id',
                        as: "crop"
                    }
                },
                {
                    $unwind: '$crop'
                },
                {
                    $lookup: {
                        from: 'orders',
                        localField: 'order',
                        foreignField: '_id',
                        as: "orders"
                    }
                },
                {
                    $unwind: '$orders'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'crop.seller',
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
                        localField: 'user',
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
                        localField: 'logisticId',
                        foreignField: '_id',
                        as: "lpartner"
                    }
                },
                {
                    $unwind: '$lpartner'
                },
                {
                    $project: {
                        sellerId: "$sellers._id",
                        seller: "$sellers.fullName",
                        sellerContact: "$seller.mobile",
                        buyerId: "$buyers._id",
                        buyer: "$buyers.fullName",
                        buyerContact: "$buyers.mobile",
                        code: "$code",
                        orderCode: "$orders.code",
                        status: "$status",
                        logisticsOption: "$logisticsOption",
                        cropCode: "$crop.code",
                        cropId: "$crop._id",
                        logisticId: "$logisticId",
                        logisticPartner: "$lpartner.companyName",
                        ETD: "$ETD",
                        ETA: "$ETA",
                        ATD: "$ATD",
                        ATA: "$ATA",
                        deliveryTime: "$deliveryTime",
                        routeDetails: "$routeDetails",
                        // dropAddress: "$orders.shippingAddress.address" + "$orders.shippingAddress.city" + "$orders.shippingAddress.district" +"$orders.shippingAddress.state" + "$orders.shippingAddress.pincode",
                        dropAddress: "$orders.shippingAddress",
                        pickupAddress: "$crop.address",
                        pickupAddressCity: "$crop.city",
                        pickupAddressDistrict: "$crop.disctrict",
                        pickupAddressState: "$crop.state",
                        pickupAddressPincode: "$crop.pincode",
                        createdAt: "$createdAt"
                    }
                },
                {
                    $match: qry
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
        })
    },
    // For Input
    logisticCompletedInputOrderListing: function (req, res) {

        var qry = {};

        var search = req.param('search');
        var page = req.param('page');
        var count = parseInt(req.param('count'));
        var skipNo = (page - 1) * count;
        var sortBy = "createdAt desc";

        if (req.param('sortBy')) {
            sortBy = req.param('sortBy')
        }

        if (req.param('buyerId') && req.param('buyerId') != undefined && req.param('buyerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('buyerId'))

            qry.buyerId = userId
        }

        if (req.param('sellerId') && req.param('sellerId') != undefined && req.param('sellerId') != 'undefined') {
            var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            var userId = ObjectId(req.param('sellerId'))

            qry.sellerId = userId
        }

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }
        var sortquery = {};
        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        if (search) {
            qry.$or = [{
                code: parseFloat(search)
            },
            {
                buyer: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                seller: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressPincode: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressState: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressDistrict: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddressCity: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                pickupAddress: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                logisticPartner: {
                    $regex: search,
                    '$options': 'i'
                }
            },
            {
                quantity: parseFloat(search)
            }
            ]
        }

        qry.$or = [{
            status: "Delivered"
        }, {
            status: "Received"
        }]
        qry.logisticsOption = 'efarmx'
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pickupAddressPincode = {
                    "$in": pincode
                }
            }
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
                    from: 'orders',
                    localField: 'order',
                    foreignField: '_id',
                    as: "orders"
                }
            },
            {
                $unwind: '$orders'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'input.user',
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
                    localField: 'user',
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
                    localField: 'logisticId',
                    foreignField: '_id',
                    as: "lpartner"
                }
            },
            {
                $unwind: '$lpartner'
            },
            {
                $project: {
                    sellerId: "$sellers._id",
                    seller: "$sellers.fullName",
                    sellerContact: "$seller.mobile",
                    buyerId: "$buyers._id",
                    buyer: "$buyers.fullName",
                    buyerContact: "$buyers.mobile",
                    code: "$code",
                    orderCode: "$orders.code",
                    status: "$status",
                    logisticsOption: "$logisticsOption",
                    inputCode: "$input.code",
                    inputId: "$input._id",
                    logisticId: "$logisticId",
                    logisticPartner: "$lpartner.companyName",
                    ETD: "$ETD",
                    ETA: "$ETA",
                    ATD: "$ATD",
                    ATA: "$ATA",
                    deliveryTime: "$deliveryTime",
                    routeDetails: "$routeDetails",
                    //dropAddress: "$orders.shippingAddress.address" + "$orders.shippingAddress.city" + "$orders.shippingAddress.district" +"$orders.shippingAddress.state" + "$orders.shippingAddress.pincode",
                    dropAddress: "$orders.shippingAddress",
                    pickupAddress: "$input.address",
                    pickupAddressCity: "$input.city",
                    pickupAddressDistrict: "$input.disctrict",
                    pickupAddressState: "$input.state",
                    pickupAddressPincode: "$input.pincode"
                }
            },
            {
                $match: qry
            }
            ], function (err, totalresults) {

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
                        from: 'orders',
                        localField: 'order',
                        foreignField: '_id',
                        as: "orders"
                    }
                },
                {
                    $unwind: '$orders'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'input.user',
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
                        localField: 'user',
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
                        localField: 'logisticId',
                        foreignField: '_id',
                        as: "lpartner"
                    }
                },
                {
                    $unwind: '$lpartner'
                },
                {
                    $project: {
                        sellerId: "$sellers._id",
                        seller: "$sellers.fullName",
                        sellerContact: "$seller.mobile",
                        buyerId: "$buyers._id",
                        buyer: "$buyers.fullName",
                        buyerContact: "$buyers.mobile",
                        code: "$code",
                        orderCode: "$orders.code",
                        status: "$status",
                        logisticsOption: "$logisticsOption",
                        inputCode: "$input.code",
                        inputId: "$input._id",
                        logisticId: "$logisticId",
                        logisticPartner: "$lpartner.companyName",
                        ETD: "$ETD",
                        ETA: "$ETA",
                        ATD: "$ATD",
                        ATA: "$ATA",
                        deliveryTime: "$deliveryTime",
                        routeDetails: "$routeDetails",
                        // dropAddress: "$orders.shippingAddress.address" + "$orders.shippingAddress.city" + "$orders.shippingAddress.district" +"$orders.shippingAddress.state" + "$orders.shippingAddress.pincode",
                        dropAddress: "$orders.shippingAddress",
                        pickupAddress: "$input.address",
                        pickupAddressCity: "$input.city",
                        pickupAddressDistrict: "$input.disctrict",
                        pickupAddressState: "$input.state",
                        pickupAddressPincode: "$input.pincode",
                        createdAt: "$createdAt"
                    }
                },
                {
                    $match: qry
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
        })
    },
    fieldOfficerOrderCropDashboard: function (req, res) {
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

        console.log("ddddddddd", qry);

        Orderedcarts.native(function (err, orderlist) {
            orderlist.aggregate([{
                $lookup: {
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crop"
                }
            },
            {
                $unwind: '$crop'
            },
            {
                $lookup: {
                    from: 'category',
                    localField: 'crop.category',
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
                    pincode: "$crop.pincode",
                    seller: "$crop.seller",
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
    fieldOfficerOrderAllDashboard: function (req, res) {
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

        console.log("ddddddddd", qry);

        Orderedcarts.native(function (err, orderlist) {
            orderlist.aggregate([{
                $lookup: {
                    from: 'crops',
                    localField: 'crop',
                    foreignField: '_id',
                    as: "crop"
                }
            },
            {
                $unwind: '$crop'
            },
            {
                $project: {
                    pincode: "$crop.pincode",
                    seller: "$crop.seller",
                    user: "$user",
                    isDeleted: "$crop.isDeleted",
                    orderId: "$_id",
                    status: "$status",
                    createdAt: "$createdAt",
                    // popId: "$popId"
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

    // Sub orders for fieldOfficer API  new requirements
    fieldOfficerOrders: function (req, res) {
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
            // query.cropCategory = categoryId;
        }


        if (search) {
            query.$or = [{
                code: parseFloat(search)
            },
            {
                cropCode: parseFloat(search)
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
                cropName: {
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
        category.findOne({ parentId: categoryId }).then(function (cat) {
            let catIds = _.pluck(cat, 'id')
            if (category) {
                query.cropCategory = catIds;
            }


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
                        from: 'crops',
                        localField: 'crop',
                        foreignField: '_id',
                        as: "crops"
                    }
                },
                {
                    $unwind: '$crops'
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
                        cropId: "$crops._id",
                        cropCode: "$crops.code",
                        pincode: "$pincode",
                        cropName: "$crops.name",
                        cropCategory: "$crops.category",
                        isDeleted: "$crop.isDeleted",
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
                            from: 'crops',
                            localField: 'crop',
                            foreignField: '_id',
                            as: "crops"
                        }
                    },
                    {
                        $unwind: '$crops'
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
                            cropId: "$crops._id",
                            cropCode: "$crops.code",
                            pincode: "$pincode",
                            cropName: "$crops.name",
                            cropCategory: "$crops.category",
                            isDeleted: "$crop.isDeleted",
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
        })
    },

    franchiseeOrders: (req, res) => {
        var search = req.param('search');
        var marketId = req.param('id')
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var sortBy = req.param('sortBy');
        count = parseInt(count);
        var sortquery = {};

        var qry = {};
        if (marketId) {

            Market.findOne({ GM: marketId }).then(function (mkt) {
                qry.market = mkt.id;

                if (req.param('input')) {
                    qry.input = req.param('input')
                }
                count = parseInt(count);

                if (search) {
                    qry.$or = [
                        {
                            code: {
                                'like': '%' + search + '%'
                            }
                            // },
                            // {
                            //     pincode: { "$in": [parseInt(search)] }
                        }
                    ]
                }
                console.log(qry, 'qry=====')
                Orderedcarts.count(qry).exec(function (err, total) {
                    if (err) {
                        return res.status(400).jsonx({
                            success: false,
                            error: err
                        });
                    } else {
                        Orderedcarts.find(qry).populate("user", { select: ['fullName', 'address', 'city', 'district', 'state', 'pincode', 'mobile'] }).populate("seller", { select: ['fullName', 'address', 'city', 'district', 'state', 'pincode', 'mobile'] }).populate('input', { select: ['name', 'coverPageImage', 'code'] }).skip(skipNo).limit(count).sort('createdAt DESC').exec((err, orders) => {
                            if (err) {
                                return res.jsonx({
                                    success: false,
                                    message: "No records found"
                                });
                            } else {
                                return res.jsonx({
                                    success: true,
                                    code: 200,
                                    data: {
                                        orders: orders,
                                        total: total
                                    }
                                });
                            }

                        })
                    }
                });
            })
        }
        else {
            return res.jsonx({
                success: false,
                message: "Please send valid market"
            });
        }
    },

    dealerOrderAtFranchiseeLevel: function (req, res) {
        var search = req.param('search');
        var status = req.param('status');
        var sortBy = "createdAt desc";

        var typeArr = new Array();
        typeArr = sortBy.split(" ");
        var sortType = typeArr[1];
        var field = typeArr[0];
        var sortquery = {};
        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        var query = {};
        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        query.seller = ObjectId(req.identity.id)
        if (status) {
            query.status = status
        }

        var searchQry = {}
        if (search) {
            searchQry.$or = [
                {
                    name: {
                        $regex: search,
                        '$options': 'i'
                    }
                },
                {
                    GMName: {
                        $regex: search,
                        '$options': 'i'
                    }
                },
                {
                    address: {
                        $regex: search,
                        '$options': 'i'
                    }
                },
                {
                    city: {
                        $regex: search,
                        '$options': 'i'
                    }
                },
                {
                    state: {
                        $regex: search,
                        '$options': 'i'
                    }
                },
                {
                    district: {
                        $regex: search,
                        '$options': 'i'
                    }
                }
            ]
        }

        if (req.param('createdAtFrom') && req.param('createdAtTo')) {
            query.$and = [{
                createdAt: {
                    $gte: new Date(req.param('createdAtFrom'))
                }
            }, {
                createdAt: {
                    $lte: new Date(req.param('createdAtTo'))
                }
            }]
        }

        Orderedcarts.native(function (err, orderlist) {
            orderlist.aggregate([
                {
                    $sort: sortquery
                },
                {
                    $match: query
                },
                {
                    $project: {
                        franchiseeId: "$market",
                        amount: "$amount",
                        status: "$status",
                    }
                },
                {
                    $group: {
                        _id: {
                            franchiseeId: "$franchiseeId",
                            status: "$status"
                        },
                        count: {
                            $sum: 1
                        },
                        'amount': {
                            $sum: '$amount'
                        }
                    }
                },
                {
                    $group: {
                        _id: "$_id.franchiseeId",
                        'totalOrder': {
                            $sum: "$count"
                        },
                        'totalAmount': {
                            $sum: '$amount'
                        },
                        'status': {
                            $push: {
                                status: "$_id.status",
                                count: "$count",
                                amount: "$amount"
                            }
                        },
                    }
                },
                {
                    $lookup: {
                        from: 'market',
                        localField: '_id',
                        foreignField: '_id',
                        as: "market"
                    }
                },
                {
                    $unwind: '$market'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'market.GM',
                        foreignField: '_id',
                        as: "GM"
                    }
                },
                {
                    $unwind: '$GM'
                },
                {
                    $project: {
                        name: "$market.name",
                        GMName: "$GM.fullName",
                        address: "$GM.address",
                        city: "$GM.city",
                        state: "$GM.state",
                        district: "$GM.district",
                        pincode: "$GM.pincode",
                        status: "$status",
                        totalOrder: "$totalOrder",
                        totalAmount: "$totalAmount"
                    }
                },
                {
                    $match: searchQry
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
    FranchiseeInputOrders: (req, res) => {

        let marketId = req.param('id')
        let productId = req.param('input');
        var sortBy = req.param('sortBy');
        if (sortBy == undefined) {
            sortBy = 'createdAt desc'
        }
        let qry = {};

        if (marketId != null && marketId != undefined && productId != null && productId != undefined) {
            //var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
            qry.market = marketId;
            qry.productId = productId;
            qry.productType = "INPUT"
            console.log(qry)
            Orderedcarts.find(qry)
                .populate("user", { select: ['fullName'] })
                .populate('input', { select: ['name', 'coverPageImage', 'variety', 'code'] })
                .sort(sortBy).exec((err, orders) => {

                    return res.jsonx({
                        success: true,
                        code: 200,
                        data: orders,
                        totalOrders: orders.length,

                    });
                })
        } else {
            return res.jsonx({
                success: false,
                code: 400,
                erro: 'marketid and input id not defined',

            });
        }

    },

    dealerOrdersAtSelectedFranchisee: function (req, res) {
        var search = req.param('search');
        var status = req.param('status');
        var marketId = req.param('id')
        var sortBy = req.param('sortBy');
        if (sortBy == undefined) {
            sortBy = 'createdAt desc'
        }

        var qry = {};
        qry.market = marketId;
        qry.seller = req.identity.id

        if (search) {
            qry.$or = [
                {
                    code: {
                        'like': '%' + search + '%'
                    }
                }
            ]
        }
        if (status) {
            qry.status = status
        }
        if (req.param('createdAtFrom') && req.param('createdAtTo')) {
            qry.$and = [{
                createdAt: {
                    $gte: new Date(req.param('createdAtFrom'))
                }
            }, {
                createdAt: {
                    $lte: new Date(req.param('createdAtTo'))
                }
            }]
        }

        Market.findOne({ id: marketId }).populate('GM', { select: ['fullName', 'address', 'city', 'state', 'district', 'pincode'] }).then(function (mkt) {
            Orderedcarts.find(qry).populate("user", { select: ['fullName'] }).populate('input', { select: ['name', 'coverPageImage', 'variety', 'code'] }).sort(sortBy).exec((err, orders) => {
                if (err) {
                    return res.jsonx({
                        success: false,
                        message: "No records found"
                    });
                } else {
                    let totalAmount = 0
                    for (var i = 0; i < orders.length; i++) {
                        totalAmount = totalAmount + orders[i].amount
                    }
                    return res.jsonx({
                        success: true,
                        code: 200,
                        data: orders,
                        franchisee: mkt,
                        totalOrders: orders.length,
                        totalAmount: parseFloat((totalAmount).toFixed(2))
                    });
                }
            })
        })
    },

    dealerMarketsAndProducts: function (req, res) {
        let dealer = req.identity.id

        Inputs.find({ dealer: dealer, select: ['name', 'code'] }).then(function (products) {
            Users.findOne({ id: dealer, select: ['markets'] }).then(function (user) {
                Market.find({ id: user.markets, select: ['name'] }).then(function (markets) {
                    return res.jsonx({
                        success: true,
                        code: 200,
                        products: products,
                        markets: markets
                    })
                })
            })
        })
    },

    dealerOrderFranchiseeProductCombination: function (req, res) {
        var search = req.param('search');
        var status = req.param('status');
        var markets = req.param('markets');
        var products = req.param('products');

        var sortBy = "createdAt desc";

        var typeArr = new Array();
        typeArr = sortBy.split(" ");
        var sortType = typeArr[1];
        var field = typeArr[0];
        var sortquery = {};
        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        var query = {};
        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        query.seller = ObjectId(req.identity.id)
        if (status) {
            query.status = status
        }
        if (markets) {
            query.market = JSON.parse(markets)
        }
        if (products) {
            query.input = JSON.parse(products)
        }

        var searchQry = {}
        if (search) {
            searchQry.$or = [
                {
                    name: {
                        $regex: search,
                        '$options': 'i'
                    }
                },
                {
                    GMName: {
                        $regex: search,
                        '$options': 'i'
                    }
                },
                {
                    address: {
                        $regex: search,
                        '$options': 'i'
                    }
                },
                {
                    city: {
                        $regex: search,
                        '$options': 'i'
                    }
                },
                {
                    state: {
                        $regex: search,
                        '$options': 'i'
                    }
                },
                {
                    district: {
                        $regex: search,
                        '$options': 'i'
                    }
                }
            ]
        }

        if (req.param('createdAtFrom') && req.param('createdAtTo')) {
            query.$and = [{
                createdAt: {
                    $gte: new Date(req.param('createdAtFrom'))
                }
            }, {
                createdAt: {
                    $lte: new Date(req.param('createdAtTo'))
                }
            }]
        }

        Orderedcarts.native(function (err, orderlist) {
            orderlist.aggregate([
                {
                    $sort: sortquery
                },
                {
                    $match: query
                },
                {
                    $group: {
                        _id: {
                            market: "$market",
                            distance: "$distance",
                            product: "$input",
                        },
                        count: {
                            $sum: 1
                        },
                        totalAmount: {
                            $sum: '$amount'
                        },
                        totalQuantity: {
                            $sum: '$quantity'
                        },
                        orders: {
                            $push: {
                                orderId: "$_id",
                                orderCode: "$code",
                                amount: "$amount",
                                status: "$status",
                                quantity: '$quantity',
                                quantityUnit: '$quantityUnit',
                                taxAmount: '$productTaxAmount',
                                buyingPrice: '$buyingPrice'
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'inputs',
                        localField: '_id.product',
                        foreignField: '_id',
                        as: "product"
                    }
                },
                {
                    $unwind: '$product'
                },
                {
                    $lookup: {
                        from: 'category',
                        localField: 'product.category',
                        foreignField: '_id',
                        as: "category"
                    }
                },
                {
                    $unwind: '$category'
                },
                {
                    $group: {
                        _id: {
                            market: "$_id.market",
                            distance: "$_id.distance"
                        },
                        totalProducts: {
                            $sum: 1
                        },
                        totalOrders: {
                            $sum: '$count'
                        },
                        totalAmount: {
                            $sum: '$totalAmount'
                        },
                        totalQuantity: {
                            $sum: '$totalQuantity'
                        },
                        products: {
                            $push: {
                                id: '$product._id',
                                productCode: '$product.code',
                                name: '$product.name',
                                category: '$category.name',
                                variety: '$product.variety',
                                workingUnit: "$product.workingUnit",
                                totalOrder: "$count",
                                totalAmount: "$totalAmount",
                                totalQuantity: "$totalQuantity",
                                orders: "$orders"
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'market',
                        localField: '_id.market',
                        foreignField: '_id',
                        as: "market"
                    }
                },
                {
                    $unwind: '$market'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'market.GM',
                        foreignField: '_id',
                        as: "GM"
                    }
                },
                {
                    $unwind: '$GM'
                },
                {
                    $project: {
                        _id: "$_id.market",
                        name: "$market.name",
                        distance: "$_id.distance",
                        GMName: "$GM.fullName",
                        address: "$GM.address",
                        city: "$GM.city",
                        state: "$GM.state",
                        district: "$GM.district",
                        pincode: "$GM.pincode",
                        totalProducts: "$totalProducts",
                        totalOrders: "$totalOrders",
                        totalAmount: "$totalAmount",
                        totalQuantity: "$totalQuantity",
                        products: "$products"
                    }
                },
                {
                    $match: searchQry
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

    dealerOrderProductFranchiseeCombination: function (req, res) {
        var search = req.param('search');
        var status = req.param('status');
        var markets = req.param('markets');
        var products = req.param('products');

        var sortBy = "createdAt desc";

        var typeArr = new Array();
        typeArr = sortBy.split(" ");
        var sortType = typeArr[1];
        var field = typeArr[0];
        var sortquery = {};
        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        var query = {};
        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        query.seller = ObjectId(req.identity.id)
        if (status) {
            query.status = status
        }
        if (markets) {
            query.market = JSON.parse(markets)
        }
        if (products) {
            query.input = JSON.parse(products)
        }

        var searchQry = {}
        // if (search) {
        //     searchQry.$or = [              
        //         {
        //             name: {
        //                 $regex: search,
        //                 '$options': 'i'
        //             }
        //         },
        //         {
        //             category: {
        //                 $regex: search,
        //                 '$options': 'i'
        //             }
        //         },
        //         {
        //             variety: {
        //                 $regex: search,
        //                 '$options': 'i'
        //             }
        //         },
        //         {
        //             workingUnit: {
        //                 $regex: search,
        //                 '$options': 'i'
        //             }
        //         },
        //         {
        //             productCode: parseInt(search)
        //         }
        //     ]
        // }

        if (req.param('createdAtFrom') && req.param('createdAtTo')) {
            query.$and = [{
                createdAt: {
                    $gte: new Date(req.param('createdAtFrom'))
                }
            }, {
                createdAt: {
                    $lte: new Date(req.param('createdAtTo'))
                }
            }]
        }

        Orderedcarts.native(function (err, orderlist) {
            orderlist.aggregate([
                {
                    $sort: sortquery
                },
                {
                    $match: query
                },
                {
                    $group: {
                        _id: {
                            market: "$market",
                            distance: "$distance",
                            product: "$input",
                        },
                        count: {
                            $sum: 1
                        },
                        totalAmount: {
                            $sum: '$amount'
                        },
                        totalQuantity: {
                            $sum: '$quantity'
                        },
                        orders: {
                            $push: {
                                orderId: "$_id",
                                orderCode: "$code",
                                amount: "$amount",
                                status: "$status",
                                quantity: '$quantity',
                                quantityUnit: '$quantityUnit',
                                taxAmount: '$productTaxAmount',
                                buyingPrice: '$buyingPrice'
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'market',
                        localField: '_id.market',
                        foreignField: '_id',
                        as: "market"
                    }
                },
                {
                    $unwind: '$market'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'market.GM',
                        foreignField: '_id',
                        as: "GM"
                    }
                },
                {
                    $unwind: '$GM'
                },
                {
                    $group: {
                        _id: "$_id.product",
                        totalFranchisee: {
                            $sum: 1
                        },
                        totalOrders: {
                            $sum: '$count'
                        },
                        totalAmount: {
                            $sum: '$totalAmount'
                        },
                        totalQuantity: {
                            $sum: '$totalQuantity'
                        },
                        franchisee: {
                            $push: {
                                id: "$market._id",
                                name: "$market.name",
                                distance: "$_id.distance",
                                GMName: "$GM.fullName",
                                address: "$GM.address",
                                city: "$GM.city",
                                state: "$GM.state",
                                district: "$GM.district",
                                pincode: "$GM.pincode",
                                marketId: '$market.id',
                                totalOrder: "$count",
                                totalAmount: "$totalAmount",
                                totalQuantity: "$totalQuantity",
                                orders: "$orders"
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'inputs',
                        localField: '_id',
                        foreignField: '_id',
                        as: "product"
                    }
                },
                {
                    $unwind: '$product'
                },
                {
                    $lookup: {
                        from: 'category',
                        localField: 'product.category',
                        foreignField: '_id',
                        as: "category"
                    }
                },
                {
                    $unwind: '$category'
                },
                {
                    $project: {
                        productCode: '$product.code',
                        name: '$product.name',
                        category: '$category.name',
                        variety: '$product.variety',
                        workingUnit: "$product.workingUnit",
                        totalFranchisee: "$totalFranchisee",
                        totalOrders: "$totalOrders",
                        totalAmount: "$totalAmount",
                        totalQuantity: "$totalQuantity",
                        franchisee: "$franchisee"
                    }
                },
                {
                    $match: searchQry
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

    payTMHashForStepAndCod: function (req, res) {
        const reqHOst = req.headers.origin;
        var paramlist = req.body;

        var paramarray = new Array();
        var itemId = paramlist['ITEM_ID'];
        var bidId = paramlist['SORD_ID'];
        let code = "SORD_" + itemId;
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

        delete paramlist['ITEM_ID'];
        delete paramlist['ENV'];
        delete paramlist['SORD_ID']

        var paramArray = {};
        for (name in paramlist) {
            if (name == 'PAYTM_MERCHANT_KEY') {
                var PAYTM_MERCHANT_KEY = paramlist[name];
            } else {
                paramarray[name] = paramlist[name];
            }
            paramArray[name] = paramlist[name];
        }

        if (paramlist['CHANNEL_ID'] == 'WEB') {
            paramarray['CALLBACK_URL'] = sails.config.PAYTM_API_URL + '/paytmorderpaymentresponse/' + itemId + '/' + bidId + '?origin=' + reqHOst + '&env=' + envPaytm; // in case if you want to send callback
        } else {
            if (envPaytm == "production") {
                paramarray['CALLBACK_URL'] = "https://securegw.paytm.in/theia/paytmCallback?ORDER_ID=" + code;
            } else {
                paramarray['CALLBACK_URL'] = "https://securegw-stage.paytm.in/theia/paytmCallback?ORDER_ID=" + code;
            }
        }

        let paytm_key = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;
        Payments.genchecksum(paramarray, paramArray, paytm_key, function (err, result) {
            return res.json({
                success: true,
                data: result.paramArray
            });
        });
    },

    orderPaymentResponsePayTm: function (req, res) {
        var request = require('request');
        var itemID = req.param("id");
        var bidID = req.param("sordid");
        var paramlist = req.body;
        var channelId = paramlist.CHANNEL_ID;

        if (channelId != null && channelId != undefined && channelId == 'WAP') {

            var paymentjsonrec = paramlist.paymentjson
            var transactId = paramlist.transactionId;
            var transactStatus = paramlist.processStatus;
            if (transactStatus != 'TXN_SUCCESS') {
                return res.json({
                    success: false,
                    msg: "Tranasction is not successful."
                });
            } else {
                Bidspayment.findOne({ id: itemID }).then(function (buyer_payment) {
                    if (buyer_payment) {
                        var transactionData = {};
                        transactionData.transactionId = transactId;
                        transactionData.paymentjson = paymentjsonrec;
                        transactionData.processStatus = transactStatus
                        transactionData.productType = "input";
                        transactionData.input = buyer_payment.input;
                        transactionData.buyerId = buyer_payment.buyerId
                        transactionData.sellerId = buyer_payment.sellerId
                        transactionData.suborder = buyer_payment.suborder
                        transactionData.order = buyer_payment.order

                        let bidpayment = {};
                        Transactions.create(transactionData).then(function (paymentsData) {
                            let paymentData = {}
                            paymentData.paymentDate = new Date()
                            paymentData.depositedOn = new Date()
                            paymentData.isVerified = true
                            paymentData.transactionId = paymentsData.id
                            paymentData.paymentMode = 'PayTm'
                            paymentData.status = 'Verified';
                            Bidspayment.update({ id: itemID }, paymentData).then(function (bidpayment) {
                                return res.json({
                                    success: true,
                                    data: bidpayment[0]
                                });
                            }).fail(function (err) {
                                return res.json({
                                    success: 'false',
                                    message: err
                                });
                            })
                        }).fail(function (err) {
                            return res.json({
                                success: 'false',
                                message: err
                            });
                        });
                    }
                });
            }
        } else {
            var origin = req.query.origin;
            var envPaytm = req.query.env;

            var transactId = paramlist.TXNID;
            var paramarray = new Array();
            var paramArray = {};

            if (paramlist.STATUS == 'TXN_SUCCESS') {

                if (Payments.verifychecksum(paramlist, constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY)) {

                    Bidspayment.findOne({ id: itemID }).then(function (buyer_payment) {
                        if (buyer_payment) {
                            var transactionData = {};
                            transactionData.transactionId = transactId;
                            transactionData.paymentjson = paramlist;
                            transactionData.processStatus = paramlist.STATUS
                            transactionData.productType = "input";
                            transactionData.input = buyer_payment.input;
                            transactionData.buyerId = buyer_payment.buyerId
                            transactionData.sellerId = buyer_payment.sellerId
                            transactionData.suborder = buyer_payment.suborder
                            transactionData.order = buyer_payment.order

                            let bidpayment = {};
                            Transactions.create(transactionData).then(function (paymentsData) {
                                let paymentData = {}
                                paymentData.paymentDate = new Date()
                                paymentData.depositedOn = new Date()
                                paymentData.isVerified = true
                                paymentData.transactionId = paymentsData.id
                                paymentData.paymentMode = 'PayTm'
                                paymentData.status = 'Verified';
                                Bidspayment.update({ id: itemID }, paymentData).then(function (bidpayment) {
                                    let url = origin + '/#/inputs/orderpayments/' + bidID;
                                    return res.redirect(url);
                                })
                            });
                        }
                    });
                } else {
                    let url = origin + '/#/inputs/orderpayments/' + bidID;
                    return res.redirect(url);
                };
            } else {
                let url = origin + '/#/inputs/orderpayments/' + bidID;
                return res.redirect(url);
            }
        }
    },
    dealerDashboardUserStats: (req, res) => {
        var date = new Date;
        date.setHours(0, 0, 0)
        let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        let fromDate = new Date(req.param('fromDate'));
        let toDate = new Date(req.param('toDate'));
        var loggedIn;
        loggedIn = {
            seller: ObjectId(req.identity.id),
            createdAt: {
                $gte: fromDate
                , $lte: toDate
            },
            productType: "INPUT"
        };
        if (req.param("month") == 1) {



            if (toDate != undefined && toDate != null && fromDate != undefined && fromDate != null) {

                Orderedcarts.native(function (err, orderlist) {
                    orderlist.aggregate([

                        { $match: loggedIn },
                        {
                            $project: {
                                // day: { $dayOfMonth: "$createdAt" },
                                month: { $month: "$createdAt" },
                                year: { $year: "$createdAt" },
                                createdAt: "$createdAt",
                                amount: "$amount",
                                order: "$order",
                                quantity: "$quantity"


                            }
                        },

                        /*  {
                              $addFields: {
                                  month: {
                                      $let: {
                                          vars: {
                                              monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                                          },
                                          in: {
                                              $arrayElemAt: ['$$monthsInString', '$month']
                                          }
                                      }
                                  }
                              }
                          },*/
                        {
                            $group: {
                                _id: {
                                    month: "$month",

                                    year: "$year",

                                },
                                amount: { $sum: "$amount" },
                                order: { $sum: 1 },
                                //  product: { $sum: "$quantity" },




                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                month: "$_id.month",
                                // day: "$_id.day",
                                year: "$_id.year",
                                amount: "$amount",
                                order: "$order",
                                // product: "$product",
                            }
                        },
                        { $sort: { month: 1 } },
                        {
                            $addFields: {
                                month: {
                                    $let: {
                                        vars: {
                                            monthsInString: [, 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                                        },
                                        in: {
                                            $arrayElemAt: ['$$monthsInString', '$month']
                                        }
                                    }
                                }
                            }
                        },




                    ], function (err, result) {
                        if (err) {
                            return res.status(400).jsonx({
                                success: false,
                                error: err
                            });
                        } else {

                            var minorder = Number.POSITIVE_INFINITY;
                            var maxorder = Number.NEGATIVE_INFINITY;
                            var minamt = Number.POSITIVE_INFINITY;
                            var maxamt = Number.NEGATIVE_INFINITY;
                            for (var i = result.length - 1; i >= 0; i--) {
                                tmp = result[i].order;
                                if (tmp < minorder) minorder = tmp;
                                if (tmp > maxorder) maxorder = tmp;
                                tmp1 = result[i].amount;
                                if (tmp1 < minamt) minamt = tmp1;
                                if (tmp1 > maxamt) maxamt = tmp1;
                            }
                            // result.push({ minorder: minorder })
                            // result.push({ maxorder: maxorder })
                            //result.push({ minamt: Math.ceil(minamt) })
                            // result.push({ maxamt: Math.ceil(maxamt) })

                            //console.log(highest, lowest);
                            return res.status(200).jsonx({
                                success: true,
                                data: result,
                                minorder: minorder,
                                maxorder: maxorder,
                                minamt: minamt,
                                maxamt: maxamt


                            });
                        }
                    })
                })
            } else {
                return res.status(400).jsonx({
                    success: false,
                    error: "please select fromdate and todate"
                });
            }
        } else {
            if (toDate != undefined && toDate != null && fromDate != undefined && fromDate != null) {
                console.log(loggedIn, 'loggedin1')
                Orderedcarts.native(function (err, orderlist) {
                    orderlist.aggregate([
                        { $match: loggedIn },
                        {
                            $project: {
                                day: { $dayOfMonth: "$createdAt" },
                                month: { $month: "$createdAt" },
                                year: { $year: "$createdAt" },
                                amount: "$amount",
                                order: "$order",
                                quantity: "$quantity"


                            }
                        },
                        /* {
                             $addFields: {
                                 month: {
                                     $let: {
                                         vars: {
                                             monthsInString: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                                         },
                                         in: {
                                             $arrayElemAt: ['$$monthsInString', '$month']
                                         }
                                     }
                                 }
                             }
                         },*/
                        {
                            $group: {
                                _id: {
                                    month: "$month",
                                    day: "$day",
                                    year: "$year",

                                },
                                amount: { $sum: "$amount" },
                                order: { $sum: 1 },
                                // product: { $sum: "$quantity" },




                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                month: "$_id.month",
                                day: "$_id.day",
                                year: "$_id.year",
                                amount: "$amount",
                                order: "$order",
                                //product: "$product",
                            }
                        },
                        { $sort: { day: 1 } }


                    ], function (err, result) {
                        if (err) {
                            return res.status(400).jsonx({
                                success: false,
                                error: err
                            });
                        } else {
                            var minorder = Number.POSITIVE_INFINITY;
                            var maxorder = Number.NEGATIVE_INFINITY;
                            var minamt = Number.POSITIVE_INFINITY;
                            var maxamt = Number.NEGATIVE_INFINITY;
                            for (var i = result.length - 1; i >= 0; i--) {
                                tmp = result[i].order;
                                if (tmp < minorder) minorder = tmp;
                                if (tmp > maxorder) maxorder = tmp;
                                tmp1 = result[i].amount;
                                if (tmp1 < minamt) minamt = tmp1;
                                if (tmp1 > maxamt) maxamt = tmp1;
                            }
                            // result.push({ minorder: minorder })
                            // result.push({ maxorder: maxorder })
                            // result.push({ minamt: Math.ceil(minamt) })
                            //result.push({ maxamt: Math.ceil(maxamt) })
                            return res.status(200).jsonx({
                                success: true,
                                data: result,
                                minorder: minorder,
                                maxorder: maxorder,
                                minamt: minamt,
                                maxamt: maxamt
                            });
                        }
                    })
                })
            } else {
                return res.status(400).jsonx({
                    success: false,
                    error: "please select fromdate and todate"
                });
            }
        }
    },
    totalOrderStatusCount: (req, res) => {
        let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        let loggedIn = { seller: ObjectId(req.identity.id) };
        //loggedIn = '5c8f78d7a7ba0751a531e227';
        sortquery = { createdAt: -1 };
        Orderedcarts.native(function (err, orderlist) {
            orderlist.aggregate([
                {
                    $match: loggedIn
                },
                {
                    $group: {
                        _id: {
                            seller: "$seller",
                            status: "$status",

                        },
                        total: { $sum: 1 },
                    }
                },
                {
                    $group: {
                        totalcount: { $sum: "$total" },
                        _id: {
                            orderstatus: "$_id.status",
                        }

                    }
                },
                {
                    $project: {
                        _id: 0,
                        status: "$_id.orderstatus",
                        count: "$totalcount"
                    }
                }
            ], function (err, result) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    let rs = {};
                    let order = 0;
                    for (i = 0; i < result.length; i++) {
                        console.log(i, "=====", result[i].status)
                        if (result[i].status == "Cancelled") {
                            // rs.Cancelled = "Cancelled";
                            rs.Cancelled = result[i].count
                        } else {
                            //rs.TotalOrder = "TotalOrder";
                            order = Number(order) + Number(result[i].count)
                            rs.TotalOrder = order
                        }


                    }

                    return res.status(200).jsonx({
                        success: true,
                        data: rs
                    });
                }
            });
        })
    },
    totalOrderProductsCount: (req, res) => {

        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        let matchQuery = { dealer: ObjectId(req.identity.id) };
        console.log(matchQuery);
        Inputs.native(function (err, input) {
            input.aggregate([

                { $match: matchQuery },
                {
                    "$facet": {
                        "totalinput": [
                            {
                                "$group": {
                                    "_id": "$dealer",
                                    "response": {
                                        "$sum": 1
                                    }
                                }
                            },

                            {
                                "$group": {
                                    "_id": null,
                                    "totalorder": {
                                        "$sum": "$response"
                                    }
                                }
                            }

                        ],
                        "viewed": [
                            {
                                "$group": {
                                    "_id": "$dealer",
                                    "response": {
                                        "$sum": "$viewed"
                                    }
                                }
                            },


                            {
                                "$group": {
                                    "_id": "viewed",
                                    "totalviewed": {
                                        "$sum": "$response"
                                    }
                                }
                            }
                        ],
                        "isexpired": [
                            {
                                "$group": {
                                    "_id": "$dealer",
                                    "isexpired": {
                                        "$sum": { "$cond": [{ "$and": [{ "$eq": ["$isExpired", true] }, { "$eq": ["$isExpired", true] }] }, 1, 0] }

                                    }
                                }
                            },


                            {
                                "$group": {
                                    "_id": null,
                                    "totalexpired": {
                                        "$sum": "$isexpired"
                                    }
                                }
                            }
                        ]
                    }
                },

                {
                    $project: {
                        totalinput: { "$arrayElemAt": ["$totalinput.totalorder", 0] },
                        totalviewed: { "$arrayElemAt": ["$viewed.totalviewed", 0] },
                        totalexpired: { "$arrayElemAt": ["$isexpired.totalexpired", 0] }
                    }

                }
            ], function (err, result) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    if (result) {
                        result = result[0];
                    }
                    return res.status(200).jsonx({
                        success: true,
                        data: result
                    });
                }
            })
        })

    },


    totalTodaySalesProductsCount: (req, res) => {
        var date = new Date;

        date.setHours(0, 0, 0)
        let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

        let loggedIn = { seller: ObjectId(req.identity.id), createdAt: { $gt: date } };
        Orderedcarts.native(function (err, orderedcart) {
            orderedcart.aggregate([
                { $match: loggedIn },
                {
                    "$facet": {
                        "todaysale": [
                            {
                                "$group": {
                                    "_id": "$_id",
                                    "response": {
                                        "$sum": 1
                                    }
                                }
                            },

                            {
                                "$group": {
                                    "_id": null,
                                    "totalorder": {
                                        "$sum": "$response"
                                    }
                                }
                            }

                        ],
                        "todaysalewithdata": [
                            {
                                "$group": {
                                    "_id": "$input",
                                    "amt": {
                                        "$sum": "$amount"
                                    }
                                }
                            },


                            {
                                "$group": {
                                    "_id": "todaysale",
                                    "todayamount": {
                                        "$sum": "$amt"
                                    },

                                }
                            }
                        ],

                    }
                },
                {
                    $project: {
                        todayorderscount: { "$arrayElemAt": ["$todaysale.totalorder", 0] },
                        todaysalewithamount: { "$arrayElemAt": ["$todaysalewithdata.todayamount", 0] },

                    }

                }


            ], function (err, result) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    if (result) {
                        result = result[0]
                    }
                    return res.status(200).jsonx({
                        success: true,
                        data: result
                    });
                }
            })
        })
    },
    totalActiveInput: (req, res) => {
        // let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        let loggedIn = { dealer: req.identity.id, isActive: true };
        console.log("user dealer in", loggedIn)
        Inputs.count(loggedIn).then(function (total) {
            return res.status(200).jsonx({
                success: true,
                data: total
            });
        })
    },
    topSalesProduct: (req, res) => {
        let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        let loggedIn = { seller: ObjectId(req.identity.id) };
        console.log("user logged in", loggedIn)
        Orderedcarts.native(function (err, orderedcart) {
            orderedcart.aggregate([
                { $match: loggedIn },

                {
                    $lookup: {
                        from: "inputs",
                        localField: "input",
                        foreignField: "_id",
                        as: "input"
                    }
                },
                // 	{ $unwind: "$input" },
                { $group: { _id: "$input", inputid: { $max: "$input" }, "totalorder": { "$sum": 1 } } },
                {
                    $project: {
                        _id: { "$arrayElemAt": ["$_id._id", 0] },
                        name: { "$arrayElemAt": ["$inputid.name", 0] },
                        image: { "$arrayElemAt": ["$inputid.coverPageImage", 0] },
                        variety: { "$arrayElemAt": ["$inputid.variety", 0] },
                        views: { "$arrayElemAt": ["$inputid.viewed", 0] },
                        totalOrder: "$totalorder"
                    }
                },
                //{ $sort: { createdAt: -1 } },
                { $limit: 5 }
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
            })

        })
    },
    totalFranchiseeSale: (req, res) => {
        let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        let loggedIn = { seller: ObjectId(req.identity.id), status: 'Franch_Received' };
        console.log("user logged in", loggedIn)
        Orderedcarts.native(function (err, orderedcart) {
            orderedcart.aggregate([
                { $match: loggedIn },
                {
                    $group: {
                        _id: { id: "$status" },
                        total: { "$sum": 1 }

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
            })

        })
    },
    topFranchisee: (req, res) => {
        let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        let loggedIn = { seller: ObjectId(req.identity.id) };
        console.log("user logged in", loggedIn)
        Orderedcarts.native(function (err, orderedcart) {
            orderedcart.aggregate([
                { $match: loggedIn },
                {
                    $group: {
                        _id: {

                            market: "$market",

                        },
                        ordercount: { $sum: 1 },
                        productcount: { $sum: "$quantity" }
                    }
                },


                {
                    $lookup: {
                        from: "market",
                        localField: "_id.market",
                        foreignField: "_id",
                        as: "market"
                    }
                },
                {
                    $group: {
                        _id: {
                            gm: "$market.GM",
                            ordercount: "$ordercount",
                            productcount: "$productcount"
                        }
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id.gm",
                        foreignField: "_id",
                        as: "user"
                    }
                },

                // { $sort: { "_id.marketcnt": -1 } },
                { $limit: 5 }

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
            })

        })
    },
    totalSale: (req, res) => {
        let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        let loggedIn = { seller: ObjectId(req.identity.id) };
        console.log("user logged in1 ", loggedIn)
        Orderedcarts.native(function (err, orderedcart) {
            orderedcart.aggregate([
                { $match: loggedIn },
                {
                    $group: {
                        _id: {

                            seller: "$seller"
                        },
                        totalsale: { $sum: "$amount" }
                    }
                }], function (err, result) {
                    if (result) {
                        result = result[0]
                    }
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
                })

        })

    },
    totalRecived: (req, res) => {
        let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        let loggedIn = { seller: ObjectId(req.identity.id), status: "Completed" };
        console.log("user logged in1 ", loggedIn)
        Orderedcarts.native(function (err, orderedcart) {
            orderedcart.aggregate([
                { $match: loggedIn },
                {
                    $group: {
                        _id: {

                            seller: "$seller"
                        },
                        totalRecived: { $sum: "$amount" }
                    }
                }], function (err, result) {
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
                })

        })
    },

    financeBoardPaymentMethodCount: (req, res) => {
        var query = {};
        query.productType = 'INPUT'
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
        Orderedcarts.native(function (err, orderedcart) {
            orderedcart.aggregate([
                {
                    $match: query
                },
                {
                    $group: {
                        _id: "$paymentMethod",
                        totalRecived: { $sum: "$amount" },
                        orders: { $sum: 1 }
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
            })
        })
    }

}
// moduel export end 

saveHistory = function (order, suborder, crop, updatedBy, comment, rejectReason) {

    var history = {};
    history.order = order;
    history.suborder = suborder;
    history.crop = crop;
    history.updatedBy = updatedBy;
    history.rejectReason = rejectReason;
    history.comment = comment;
    // console.log("historyhistory", history);
    Ordershistory.create(history).then((res) => {
        // console.log("resssssssssssssss", res);
        return true
    }).fail(function (error) {
        return false
    });

}

saveInputHistory = function (order, suborder, input, updatedBy, comment, rejectReason) {

    var history = {};
    history.order = order;
    history.suborder = suborder;
    history.input = input;
    history.updatedBy = updatedBy;
    history.rejectReason = rejectReason;
    history.comment = comment;
    // console.log("historyhistory", history);
    Ordershistory.create(history).then((res) => {
        // console.log("resssssssssssssss", res);
        return true
    }).fail(function (error) {
        return false
    });

}