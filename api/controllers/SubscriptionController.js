var constantObj = sails.config.constants;
var commonServiceObj = require('../services/commonService.js');
var pushService = require('../services/PushService.js');
var moment = require('moment')
var gm = require('gm');

/**
 * SubscriptionController
 *
 * @description :: Server-side logic for managing bids
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var ObjectId = require('mongodb').ObjectID;


module.exports = {
    viewLandPlanInfo: function (req, res) {
        return API(SubscriptionService.viewLandPlanInfo, req, res);
    },
    updatePlandInLand: function (req, res) {
        return API(SubscriptionService.updatePlandInLand, req, res);
    },
    addFreePlanInLand: function (req, res) {
        return API(SubscriptionService.addFreePlanInLand, req, res);
    },

    updatePlan: function (req, res) {
        return API(SubscriptionService.updatePlan, req, res);
    },
    getPlan: function (req, res) {
        return API(SubscriptionService.getPlan, req, res);
    },
    planList: function (req, res) {
        return API(SubscriptionService.planList, req, res);
    },
    createPlan: function (req, res) {
        return API(SubscriptionService.createPlan, req, res);
    },
    postPayTm: function (req, res) {
        const reqHOst = req.headers.origin;
        var paramlist = req.body;

        var paramarray = new Array();
        var code = commonService.getUniqueCode();
        code = "SUBS_" + code;
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
        var planId = paramlist['PLAN_ID'];
        var paymentScheme = paramlist['PAYMENT_SCHEME'];
        delete paramlist['ITEM_ID'];
        delete paramlist['PLAN_ID'];
        delete paramlist['PAYMENT_SCHEME'];
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
            paramarray['CALLBACK_URL'] = sails.config.PAYTM_API_URL + '/subscription/paytmresponse/' + itemId + '?origin=' + reqHOst + '&env=' + envPaytm + '&planId=' + planId + '&paymentScheme=' + paymentScheme; // in case if you want to send callback
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
    ResponsePayTm: function (req, res) {
        var request = require('request');
        var itemID = req.param("id");

        var origin = req.query.origin;
        var envPaytm = req.query.ENV || "development";
        var planId = req.query.planId || req.body.planId;
        var paymentScheme = req.query.paymentScheme || req.body.paymentScheme;
        // console.log("req.query-------------", req.query);

        var paramlist = req.body;
        var transactId = paramlist.TXNID;
        var paramarray = new Array();
        var paramArray = {};
        var channelId = paramlist.CHANNEL_ID;

        console.log("paramlist***************", paramlist);

        if (paramlist.STATUS == 'TXN_SUCCESS') {

            //for mobile
            if (channelId != null && channelId != undefined && channelId == 'WAP') {

                var transactionData = {};
                transactionData.transactionId = transactId;
                transactionData.paymentjson = paramlist;
                transactionData.processStatus = paramlist.STATUS
                transactionData.productType = "subscription";
                transactionData.land = itemID;
                SubscriptionService.transectionCreate(transactionData).then(function (paymentsData) {

                    let txnId = paymentsData.id;

                    let url = origin + '/lands/mylands';
                    let landData = {};
                    landData.id = itemID;
                    landData.planId = planId;
                    landData.paymentScheme = paymentScheme;

                    SubscriptionService.updatePlandInLand(landData, req).then(function (landupdate) {

                        return res.json({
                            success: true,
                            data: landData,
                            message: 'Thanks for upgrading the plan'
                        });


                    })

                });


            }
            //for web
            else {
                if (Payments.verifychecksum(paramlist, constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY)) {
                    // console.log('if aya==')
                    var transactionData = {};
                    transactionData.transactionId = transactId;
                    transactionData.paymentjson = paramlist;
                    transactionData.processStatus = paramlist.STATUS
                    transactionData.productType = "subscription";
                    transactionData.land = itemID;
                    SubscriptionService.transectionCreate(transactionData).then(function (paymentsData) {


                        let txnId = paymentsData.id;


                        let url = origin + '/lands/mylands';
                        let landData = {};
                        landData.id = itemID;
                        landData.planId = planId;
                        landData.paymentScheme = paymentScheme;

                        SubscriptionService.updatePlandInLand(landData, req).then(function (landupdate) {

                            if (channelId != null && channelId != undefined && channelId == 'WAP') {
                                // console.log(landData, 'landupdate=====')
                                return res.json({
                                    success: true,
                                    data: landupdate
                                });
                            } else {
                                return res.redirect(url);
                            }

                        })

                    });

                } else {
                    console.log('esle aya==')
                    let url = origin + '/payments/failure/' + itemID
                    if (channelId != null && channelId != undefined && channelId == 'WAP') {
                        return res.json({
                            success: true,
                            data: landupdate
                        });
                    } else {
                        return res.redirect(url);
                    }

                };
            }
        } else {
            let url = origin + '/payments/failure/' + itemID
            if (channelId != null && channelId != undefined && channelId == 'WAP') {
                return res.json({
                    success: true,
                    data: landupdate
                });
            } else {
                return res.redirect(url);
            }

        }
    },

}