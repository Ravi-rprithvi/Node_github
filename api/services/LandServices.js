
const { fn } = require('moment');
const commonService = require('./commonService');
const DigitalLockersService = require('../services/DigitalLockersService.js');
var Promise = require('bluebird'),
    promisify = Promise.promisify;
var constantObj = sails.config.constants;
var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var pushService = require('../services/PushService.js');

var transport = nodemailer.createTransport(smtpTransport({
    host: sails.config.appSMTP.host,
    port: sails.config.appSMTP.port,
    debug: sails.config.appSMTP.debug,
    auth: {
        user: sails.config.appSMTP.auth.user, //access using /congig/appSMTP.js
        pass: sails.config.appSMTP.auth.pass
    }
}));

// var capitalize_Words = function (str) {
//     return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
// }

module.exports = {
    getMostPopularLand: function (data, context, req, res) {

        var count = req.param('count')
        if (count == undefined) {
            count = 8
        } else {
            count = parseInt(count)
        }

        var page = req.param('page')

        if (page == undefined) {
            page = 1
        } else {
            page = parseInt(page)
        }

        var skipNo = (page - 1) * count;
        Lands.find().sort({ viewed: -1 }).skip(skipNo).limit(count).then(function (response) {
            // console.log(response)
            if (response == undefined || response == '') {
                return res.jsonx({
                    success: false,
                    code: 400,
                    message: 'No record Fond'
                });

            } else {
                return res.jsonx({
                    success: true,
                    data: response
                });
            }
        })
    },

    getRecentViewLand: function (data, context, req, res) {
        let viewquery = {}
        viewquery.ipAddress = data.ip;
        if (data.user) {
            viewquery.userid = data.user;
        }

        viewquery.modelType = 'land';

        var count = req.param('count')
        if (count == undefined) {
            count = 8
        } else {
            count = parseInt(count)
        }

        var page = req.param('page')

        if (page == undefined) {
            page = 1
        } else {
            page = parseInt(page)
        }

        Cropviewed.find(viewquery).skip(skipNo).limit(count).then(function (response) {
            if (response == undefined || response == '') {
                return res.jsonx({
                    success: true,
                    data: response
                });
            } else {
                return res.jsonx({
                    success: false,
                    code: 400,
                    message: 'No record Fond'
                });
            }
        })

    },
    save: function (data, context, req, res) {


        if (data.user) {
            data.user = data.user;
        } else {
            data.user = context.identity.id;
        }
        let findQuery = {};
        findQuery.user = data.user;
        findQuery.pincode = data.pincode;
        findQuery.khasraNo = data.khasraNo;
        Lands.findOne(findQuery).then(function (landInfo) {
            if (landInfo) {
                return res.jsonx({
                    success: false,
                    code: 400,
                    data: landInfo,
                    message: constantObj.land.EXISTED_LAND,
                    key: 'EXISTED_LAND',
                });
            } else {

                Settings.find({ type: 'land' }).then(function (settingsAry) {
                    // console.log(settingsAry, '====');
                    if (settingsAry && settingsAry.length > 0) {

                        let settings = settingsAry[0];

                        data.franchiseePercentage = settings.general.franchiseePercentage || 1
                        data.earnestAmount = settings.buyer.earnestAmount || 1;

                        let buyerTaxes = settings.buyer;

                        data.buyerTaxRate = buyerTaxes.buyerTax.taxRate;
                        data.buyerTaxes = buyerTaxes.buyerTax.taxes || [];
                        data.farmxComission = buyerTaxes.efarmxComission;
                        data.buyerDepositPayment = buyerTaxes.depositPayment || [];
                        data.buyerFinalPercentage = buyerTaxes.finalPercentage;
                        data.buyerFinalDays = buyerTaxes.finalDays;
                        if (data.buyerterms) {

                        } else {
                            data.buyerterms = buyerTaxes.terms;
                        }

                        if (data.agreements) {

                        } else {
                            data.agreements = buyerTaxes.agreements
                        }

                        data.buyerCancelDeductionPercentage = buyerTaxes.buyerCancelDeductionPercentage

                        var sellerData = settings.seller;
                        data.sellerFarmxComission = sellerData.efarmxComission;
                        data.sellerUpfrontPercentage = sellerData.upfrontPercentage;
                        data.sellerUpfrontDays = sellerData.upfrontDays;
                        data.sellerFinalPercentage = sellerData.finalPercentage;
                        data.sellerFinalDays = sellerData.finalDays;
                        if (data.sellerterms) {

                        } else {
                            data.sellerterms = sellerData.sellerterms;
                        }

                        data.sellerDepositPayment = sellerData.depositPayment || [];
                        data.sellerTaxRate = sellerData.sellerTax.taxRate;
                        data.sellerTaxes = sellerData.sellerTax.taxes || [];
                        data.sellerCancelDeductionPercentage = sellerData.sellerCancelDeductionPercentage

                        data.buyerQuestion = settings.questions.buyerQuestion;
                        data.franchiseeQuestion = settings.questions.franchiseeQuestion;
                        data.registrationCharges = [];
                    }

                    var pinQry = {};
                    pinQry.pincode = { "$in": [parseInt(data.pincode)] };
                    Market.find(pinQry).then(function (m) {
                        var marketIds = [];
                        var marketWithGMIds = [];
                        m.forEach(function (item) {
                            marketIds.push(item.id);
                            if (item.GM != undefined) {
                                marketWithGMIds.push(item.id)
                            }
                        });
                        let selectedmaarketgm = undefined
                        let selectedmaarketname = ""

                        Users.find({ markets: { "$in": marketIds }, roles: 'A', status: 'active' }).then(function (u) {
                            if (u != undefined && u.length > 0) {
                                var userCount = u.length
                                var randnumber = Math.floor(Math.random() % userCount)
                                var userObject = u[randnumber];
                                data.transactionOwner = userObject.id;
                            }
                            if (marketWithGMIds != undefined && marketWithGMIds.length > 0) {
                                var mrandnumber = Math.floor(Math.random() % marketWithGMIds.length)
                                data.market = marketWithGMIds[mrandnumber]
                                selectedmaarketgm = marketWithGMIds[mrandnumber].GM
                                selectedmaarketname = marketWithGMIds[mrandnumber].name
                            }
                            data.code = "LD-" + commonService.getUniqueCode()
                            commonService.getDataFromPincode(data.pincode).then(function (pincodeInfo) {
                                let pincodeData = pincodeInfo;
                                if (pincodeData == 'error') {
                                    return res.jsonx({
                                        success: false,
                                        code: 400,
                                        message: 'please enter valid pincode.'
                                    });
                                }

                                let address = data.address + ", " + data.city + " " + pincodeData["Districtname"] + " , " + pincodeData["statename"] + " " + data.pincode;
                                commonService.getLatLong(address).then(function (lantLong) {
                                    if (lantLong == 'error') {
                                        return res.jsonx({
                                            success: false,
                                            code: 400,
                                            message: 'please enter valid address.'
                                        });
                                    }
                                    let district = pincodeData["Districtname"] + ',' + pincodeData["statename"];
                                    let coordinates = [lantLong[0].latitude, lantLong[0].longitude];
                                    data.coordinates = coordinates
                                    commonService.getDistance(address, district).then(function (distance) {
                                        if (distance == 'error') {
                                            return res.jsonx({
                                                success: false,
                                                code: 400,
                                                message: 'please enter valid address.'
                                            });
                                        }
                                        data.distanceInKm = distance.text;
                                        data.distanceInM = distance.value;
                                        if (pincodeData) {
                                            if (data['state'] == undefined || data['state'] == "") {
                                                data["state"] = pincodeData["statename"];
                                            }
                                            if (data['district'] == undefined || data['district'] == "") {
                                                data["district"] = pincodeData["Districtname"];
                                            }
                                            if (data['city'] == undefined || data['city'] == "" || data['city'] == null) {
                                                data["city"] = pincodeData["Taluk"];
                                            }

                                            if (settingsAry && settingsAry.length > 0) {
                                                let regisstrationCharges = settingsAry[0].registrationCharges
                                                if (regisstrationCharges && regisstrationCharges.length > 0) {
                                                    for (var i = 0; i < regisstrationCharges.length; i++) {
                                                        let state = regisstrationCharges[i].state
                                                        if (state && state == data['state']) {
                                                            let maleRegistrationCharges = regisstrationCharges[i].male
                                                            if (maleRegistrationCharges) {
                                                                data.maleRegistrationCharges = maleRegistrationCharges
                                                            }
                                                            let femaleRegistrationCharges = regisstrationCharges[i].female
                                                            if (femaleRegistrationCharges) {
                                                                data.femaleRegistrationCharges = femaleRegistrationCharges
                                                            }
                                                            let jointRegistrationCharges = regisstrationCharges[i].joint
                                                            if (jointRegistrationCharges) {
                                                                data.jointRegistrationCharges = jointRegistrationCharges
                                                            }
                                                            let maleJointRegistrationCharges = regisstrationCharges[i].maleJoint
                                                            if (maleJointRegistrationCharges) {
                                                                data.maleJointRegistrationCharges = maleJointRegistrationCharges
                                                            }
                                                            let femaleJointRegistrationCharges = regisstrationCharges[i].femaleJoint
                                                            if (femaleJointRegistrationCharges) {
                                                                data.femaleJointRegistrationCharges = femaleJointRegistrationCharges
                                                            }
                                                            break
                                                        }
                                                    }
                                                }
                                            }

                                        }
                                        let sell;
                                        if (data.forSell == true) {
                                            sell = 'sale';
                                        }
                                        if (data.forLease == true) {
                                            sell = 'leasing';
                                        }
                                        if (data.forSell == true && data.forLease == true) {
                                            sell = 'sale & lease';
                                        }


                                        let title = data.area + " " + data.areaUnit + " available for " + sell
                                            ;
                                        data.title = title;
                                        data.availableArea = data.area;
                                        // console.log("lease price", data.leasePrice);
                                        if (data.leasePrice) {
                                            data.leasePriceDisplay = changeNumberFormat(parseInt(data.leasePrice));

                                            let leaseLandingPrice = parseFloat(parseFloat(data.leasePrice) + parseFloat(parseFloat(data.sellerFarmxComission / 100 * data.leasePrice) * parseFloat(1 + data.sellerTaxRate / 100))).toFixed(2);
                                            data.leaseLandingPrice = leaseLandingPrice;
                                            data.leaseLandingPriceDisplay = changeNumberFormat(parseInt(leaseLandingPrice));
                                        }
                                        if (data.sellPrice) {
                                            data.sellPriceDisplay = changeNumberFormat(parseInt(data.sellPrice));

                                            let sellLandingPrice = parseFloat(parseFloat(data.sellPrice) + parseFloat(parseFloat(data.sellerFarmxComission / 100 * data.sellPrice) * parseFloat(1 + data.sellerTaxRate / 100))).toFixed(2);
                                            data.sellLandingPrice = sellLandingPrice;
                                            data.sellLandingPriceDisplay = changeNumberFormat(parseInt(sellLandingPrice));
                                        }

                                        if (data.images && data.images.length > 0) {
                                            data.coverImage = data.images[0]
                                        }
                                        if (data.documents) {
                                            let finalDoc = [];
                                            for (var i = 0; i < data.documents.length; i++) {
                                                finalDoc.push({ name: data.documents[i].name, doc: data.documents[i].doc, uploadedBy: context.identity.id, uploadedTime: new Date() })
                                            }
                                            data.documents = finalDoc;
                                            var pages = data.pages;
                                            delete data.pages;
                                        }
                                        // console.log(data);
                                        // return;
                                        Lands.create(data).then(function (landData) {
                                            SubscriptionService.addFreePlanInLand(landData, context).then(function (addPlan) {

                                                //DigitalLockersService.addDocument()
                                                var msg = "A land information with id " + landData.code + " has been added. FarmX will look into it for approval.";

                                                var notificationData = {};
                                                notificationData.productId = landData.id;
                                                notificationData.land = landData.id;
                                                notificationData.sellerId = landData.user;
                                                notificationData.user = landData.user;
                                                notificationData.productType = "lands";
                                                //notificationData.transactionOwner = u[0].id;
                                                // notificationData.transactionOwner = landData.transactionOwner;
                                                notificationData.message = msg;
                                                notificationData.messageKey = "LAND_ADDED_NOTIFICATION"
                                                notificationData.readBy = [];
                                                notificationData.messageTitle = 'Land added'
                                                let pushnotreceiver = [landData.user]
                                                if (selectedmaarketgm != undefined) {
                                                    pushnotreceiver.push(selectedmaarketgm)
                                                }

                                                Notifications.create(notificationData).then(function (notificationResponse) {

                                                    if (notificationResponse) {
                                                        commonService.notifyUsersFromNotification(notificationResponse, landData)
                                                        pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                                    }

                                                    let sendSMSToFarmer = {}
                                                    sendSMSToFarmer.variables = { "{#CC#}": landData.code }
                                                    sendSMSToFarmer.templateId = "42368"
                                                    commonService.sendGeneralSMSToUsersWithId(sendSMSToFarmer, [landData.user])

                                                    if (selectedmaarketgm) {
                                                        let landfor = ""
                                                        if (landData.forSell) {
                                                            landfor = "Sell"
                                                        }
                                                        if (landData.forlease) {
                                                            if (landfor != "") {
                                                                landfor = landfor + " & for "
                                                            }
                                                            landfor = landfor + "lease"
                                                        }
                                                        let sendSMSToFranchisee = {}
                                                        sendSMSToFranchisee.variables = { "{#BB#}": landfor, "{#CC#}": landData.code, "{#DD#}": "Farmer" }
                                                        sendSMSToFranchisee.templateId = "42367"
                                                        commonService.sendGeneralSMSToUsersWithId(sendSMSToFranchisee, [selectedmaarketgm])
                                                    }

                                                    if (landData.transactionOwner) {
                                                        let landfor = ""
                                                        if (landData.forSell) {
                                                            landfor = "Sell"
                                                        }
                                                        if (landData.forlease) {
                                                            if (landfor != "") {
                                                                landfor = landfor + " & for "
                                                            }
                                                            landfor = landfor + "lease"
                                                        }
                                                        let sendSMSToFranchisee = {}
                                                        sendSMSToFranchisee.variables = { "{#BB#}": landfor, "{#CC#}": landData.code, "{#DD#}": selectedmaarketname, "{#EE#}": "Farmer" }
                                                        sendSMSToFranchisee.templateId = "42374"
                                                        commonService.sendGeneralSMSToUsersWithId(sendSMSToFranchisee, [landData.transactionOwner])
                                                    }

                                                    // console.log(data.documentFromLand, 'data.documentFromLand')
                                                    if (data.documentFromLocker) {
                                                        let locerDoc = {}
                                                        locerDoc.type = landData.documents[0]['name'];
                                                        locerDoc.pages = pages;

                                                        // console.log(data, 'upfsdata===')
                                                        let DocResponses = new Promise((resolve, reject) => {
                                                            let updateDoc = DigitalLockersService.addDocument(locerDoc, context);
                                                            if (updateDoc) {
                                                                return resolve(updateDoc)
                                                            } else {
                                                                reject({ error: "something wrong" })
                                                            }

                                                        })
                                                        DocResponses.then(function (DocResponse) {
                                                            let docData = landData.documents;
                                                            if (DocResponse && DocResponse.data) {
                                                                docData = landData.documents;
                                                                docData[0]['docid'] = DocResponse.data.document.id;
                                                            }
                                                            Lands.update({ id: landData.id }, { documents: docData }).then(function (updateLandDoc) {
                                                                return res.jsonx({
                                                                    success: true,
                                                                    code: 200,
                                                                    data: landData,
                                                                    message: constantObj.land.ADDED_LAND,
                                                                    key: 'ADDED_LAND',

                                                                });
                                                            })
                                                        })

                                                    } else {
                                                        return res.jsonx({
                                                            success: true,
                                                            code: 200,
                                                            data: landData,
                                                            message: constantObj.land.ADDED_LAND,
                                                            key: 'ADDED_LAND',

                                                        });
                                                    }
                                                })
                                            })
                                        }).fail(function (err) {
                                            return res.jsonx({
                                                success: false,
                                                code: 400,
                                                message: err
                                            });
                                        });
                                    });
                                })

                            })
                        })
                    })
                })
            }
        })
    },

    updateBannerLand: function (data, context, req, res) {
        if (data.id) {
            Lands.findOne({ id: data.id }).exec(function (err, landInfo) {
                if (err) {
                    return res.jsonx({
                        success: false,
                        code: 400,
                        message: 'Land not found.'
                    });
                }
                if (data.subscriptionInfo && data.subscriptionInfo.visibility) {
                    Lands.update({ id: data.id }, data).then(function (landData) {
                        return res.jsonx({
                            success: true,
                            code: 200,
                            data: landData,
                            message: constantObj.land.UPDATED_LAND,
                            key: 'UPDATED_LAND',

                        });
                    })
                }
            })
        }
    },

    updateLand: function (data, context, req, res) {
        // console.log(context, '-====');
        // return 1;
        if (data.id) {
            Lands.findOne({ id: data.id }).exec(function (err, landInfo) {
                if (err) {
                    return res.jsonx({
                        success: false,
                        code: 400,
                        message: 'Land not found.'
                    });
                }
                if (data.feature == true) {
                    delete data.feature;
                    Lands.update({ id: data.id }, data).then(function (landData) {
                        return res.jsonx({
                            success: true,
                            code: 200,
                            data: landData,
                            message: constantObj.land.UPDATED_LAND,
                            key: 'UPDATED_LAND',

                        });
                    })
                }


                else {


                    if (landInfo.subscriptionInfo && landInfo.subscriptionInfo.visibility == "IsFeatured") {
                        data.isFeatured = true
                    }

                    var pinQry = {};
                    pinQry.pincode = { "$in": [parseInt(data.pincode)] };
                    Market.find(pinQry).then(function (m) {
                        var marketIds = [];
                        var marketWithGMIds = [];
                        m.forEach(function (item) {
                            marketIds.push(item.id);
                            if (item.GM != undefined) {
                                marketWithGMIds.push(item.id)
                            }
                        });
                        let selectedmaarketgm = undefined
                        // Users.find({markets: { "$in": marketIds } }).then(function (u) {
                        if (marketWithGMIds != undefined && marketWithGMIds.length > 0) {
                            var mrandnumber = Math.floor(Math.random() % marketWithGMIds.length)
                            if (data.market != null && data.market != undefined) {

                            } else {
                                data.market = marketWithGMIds[mrandnumber]
                            }
                            selectedmaarketgm = marketWithGMIds[mrandnumber].GM
                        }
                        // data.code = "Ld-" + commonService.getUniqueCode()
                        commonService.getDataFromPincode(data.pincode).then(function (pincodeInfo) {
                            let pincodeData = pincodeInfo;
                            if (pincodeData == 'error') {
                                return res.jsonx({
                                    success: false,
                                    code: 400,
                                    message: 'please enter valid pincode.'
                                });
                            }
                            let address = data.address + ", " + data.city + " " + pincodeData["Districtname"] + " , " + pincodeData["statename"] + " " + data.pincode;

                            commonService.getLatLong(address).then(function (lantLong) {
                                if (lantLong == 'error') {
                                    return res.jsonx({
                                        success: false,
                                        code: 400,
                                        message: 'please enter valid address.'
                                    });
                                }
                                let district = pincodeData["Districtname"] + ',' + pincodeData["statename"];
                                let coordinates = [lantLong[0].latitude, lantLong[0].longitude];
                                data.coordinates = coordinates
                                commonService.getDistance(address, district).then(function (distance) {
                                    if (distance == 'error') {
                                        return res.jsonx({
                                            success: false,
                                            code: 400,
                                            message: 'please enter valid address.'
                                        });
                                    }
                                    data.distanceInKm = distance.text;
                                    data.distanceInM = distance.value;
                                    if (pincodeData) {
                                        if (data['state'] == undefined || data['state'] == "") {
                                            data["state"] = pincodeData["statename"];
                                        }
                                        if (data['district'] == undefined || data['district'] == "") {
                                            data["district"] = pincodeData["Districtname"];
                                        }
                                        if (data['city'] == undefined || data['city'] == "" || data['city'] == null) {
                                            data["city"] = pincodeData["Taluk"];
                                        }
                                    }


                                    let sell;
                                    if (data.forSell == true) {
                                        sell = 'sale';
                                        if ((data.sellPrice != landInfo.sellPrice) || (data.area != landInfo.area) || (data.khasraNo != landInfo.khasraNo) || (data.documents.length != landInfo.documents.length)) {
                                            data.approvalStatus = 'Approval_Pending';
                                        }
                                    }
                                    if (data.forLease == true) {
                                        sell = 'leasing';

                                        if ((data.leasePrice != landInfo.leasePrice) || (data.area != landInfo.area) || (data.khasraNo != landInfo.khasraNo) || (data.documents.length != landInfo.documents.length)) {
                                            data.approvalStatus = 'Approval_Pending';
                                        }
                                    }
                                    if (data.forSell == true && data.forLease == true) {
                                        sell = 'sale & lease';

                                        if ((data.leasePrice != landInfo.leasePrice) || (data.sellPrice != landInfo.sellPrice) || (data.area != landInfo.area) || (data.khasraNo != landInfo.khasraNo) || (data.documents.length != landInfo.documents.length)) {
                                            data.approvalStatus = 'Approval_Pending';
                                        }
                                    }
                                    let title = data.area + " " + data.areaUnit + " available for " + sell;
                                    if (context.identity.roles == "SA" && data.title) {
                                        title = data.title;
                                        delete data.approvalStatus;
                                    }


                                    data.title = title;
                                    data.availableArea = data.area;

                                    if (data.leasePrice) {
                                        data.leasePriceDisplay = changeNumberFormat(parseInt(data.leasePrice));

                                        let leaseLandingPrice = parseFloat((parseFloat(data.leasePrice) + parseFloat(parseFloat(landInfo.sellerFarmxComission / 100 * data.leasePrice) * parseFloat(1 + landInfo.sellerTaxRate / 100)))).toFixed(2);
                                        data.leaseLandingPrice = leaseLandingPrice;
                                        data.leaseLandingPriceDisplay = changeNumberFormat(parseInt(leaseLandingPrice));
                                    }
                                    if (data.sellPrice) {
                                        data.sellPriceDisplay = changeNumberFormat(parseInt(data.sellPrice));

                                        sellLandingPrice = parseFloat(parseFloat(data.sellPrice) + parseFloat(parseFloat(landInfo.sellerFarmxComission / 100 * data.sellPrice) * parseFloat(1 + landInfo.sellerTaxRate / 100))).toFixed(2);
                                        data.sellLandingPrice = sellLandingPrice;
                                        data.sellLandingPriceDisplay = changeNumberFormat(parseInt(sellLandingPrice));
                                    }
                                    let availableTill = new Date(data.avalaibleTill);
                                    let currentdate = new Date();
                                    if ((data.forlease == true && availableTill > currentdate) || (data.availableArea < 0.15)) {
                                        data.isExpired = true
                                    } else {
                                        data.isExpired = false
                                    }
                                    // data.coverImage = data.coverImage || "";
                                    if (data.images.indexOf(landInfo.coverImage) == -1) {
                                        data.coverImage = data.images[0]
                                    }

                                    if (data.images && data.images.length > 0 && (data.coverImage == undefined || data.coverImage == null) && (landInfo.coverImage == undefined || landInfo.coverImage == null)) {
                                        data.coverImage = data.images[0]
                                    }
                                    if (data.coverImage == undefined) {
                                        if (data.images && data.images.length > 0) {
                                            if (landInfo.coverImage) {
                                                const index = data.images.indexOf(landInfo.coverImage);
                                                if (!(index > -1)) {
                                                    data.coverImage = data.images[0]
                                                }
                                            } else {
                                                data.coverImage = data.images[0]
                                            }
                                        } else {
                                            data.coverImage = null;
                                        }
                                    }
                                    //console.log(data);
                                    // return;
                                    //data.approvalStatus = 'Approval_Pending';
                                    if (data.user) {
                                        data.user = data.user;
                                    } else {
                                        data.user = context.identity.id;
                                    }
                                    if (landInfo.subscriptionInfo && landInfo.subscriptionInfo.noOfEditsType == "counted") {
                                        data.noOfedits = landInfo.subscriptionInfo.noOfEdits - 1;
                                        if (data.noOfedits == -1) {
                                            return res.jsonx({
                                                success: false,
                                                code: 400,
                                                error: 'Now you can not edit this land as per plan.'
                                            });
                                        }

                                    }
                                    if (data.documents) {
                                        let finalDoc = [];
                                        for (var i = 0; i < data.documents.length; i++) {
                                            finalDoc.push({ name: data.documents[i].name, doc: data.documents[i].doc, uploadedBy: context.identity.id, uploadedTime: new Date() })
                                        }
                                        data.documents = finalDoc;
                                        var pages = data.pages;
                                        delete data.pages;
                                    }
                                    if (data.documentFromLocker) {
                                        let locerDoc = {}
                                        locerDoc.type = landInfo.documents[0]['name'];
                                        locerDoc.pages = pages;

                                        // console.log(data, 'upfsdata===')
                                        let DocResponses = new Promise((resolve, reject) => {
                                            let updateDoc = DigitalLockersService.addDocument(locerDoc, context);
                                            if (updateDoc) {
                                                return resolve(updateDoc)
                                            } else {
                                                reject({ error: "something wrong" })
                                            }

                                        })
                                        DocResponses.then(function (DocResponse) {
                                            let docData = landInfo.documents;
                                            if (DocResponse && DocResponse.data) {
                                                docData = landInfo.documents;
                                                docData[0]['docid'] = DocResponse.data.document.id;
                                            }
                                            Lands.update({ id: landInfo.id }, { documents: docData }).then(function (updateLandDoc) {
                                                return res.jsonx({
                                                    success: true,
                                                    code: 200,
                                                    data: landData,
                                                    message: constantObj.land.UPDATED_LAND,
                                                    key: 'UPDATED_LAND',

                                                });
                                            })
                                        })

                                    }
                                    else {
                                        Lands.update({ id: data.id }, data).then(function (landData) {
                                            return res.jsonx({
                                                success: true,
                                                code: 200,
                                                data: landData,
                                                message: constantObj.land.UPDATED_LAND,
                                                key: 'UPDATED_LAND',

                                            });
                                        }).fail(function (err) {
                                            return res.jsonx({
                                                success: false,
                                                code: 400,
                                                message: err
                                            });
                                        });
                                    }
                                });
                            })

                        })
                    })
                }
            })

        }
    },

    updateFinance: function (data, context, req, res) {

        Lands.findOne({ id: data.id }).exec(function (err, landInfo) {
            if (err) {
                return res.jsonx({
                    success: false,
                    code: 400,
                    message: 'Land not found.'
                });
            }
            if (data.buyerTaxes != null && data.buyerTaxes != undefined && data.sellerTaxes != null && data.sellerTaxes != undefined) {
                Lands.update({ id: data.id }, data).then(function (landData) {
                    return res.jsonx({
                        success: true,
                        code: 200,
                        data: landData,
                        message: constantObj.land.UPDATED_LAND,
                        key: 'UPDATED_LAND',

                    });
                })
            } else {
                return res.jsonx({
                    success: false,
                    code: 400,
                    error: 'please enter required data'
                });
            }
        })
    },

    deleteLand: function (data, context, req, res) {
        //soft delete land api
        let dltupdate = {}
        dltupdate.isDeleted = true
        dltupdate.deletedBy = context.identity.id
        dltupdate.deletedOn = new Date()

        Landinterests.count({ landId: data.id, status: { $ne: 'canceled' } }).then(function (intcount) {
            console.log("{id:data.id} == ", { id: data.id })
            console.log("{id:data.id} == ", { id: data.id })
            if (intcount == 0) {
                Lands.findOne({ id: data.id }).then(function (land) {
                    if (land) {
                        Lands.update({ id: data.id }, dltupdate).then(function (land) {
                            var report;
                            if (land) {
                                report = {
                                    "success": true,
                                    "Code": 200,
                                    "data": {
                                        "message": "Deleted from list",
                                        "code": 200,
                                    }

                                }
                            } else {
                                report = {
                                    "success": false,
                                    "Code": 301,
                                    "error": {
                                        "message": "unable to delete, unknown error occurred",
                                        "code": 301,
                                    }

                                }
                            }
                            return res.jsonx(report);
                        });
                    } else {
                        return res.jsonx({
                            success: false,
                            code: 400,
                            error: {
                                code: 400,
                                message: "Land not found with given id",
                            },
                            key: 'COMMON_ERROR'
                        });
                    }
                })

            } else {
                return res.jsonx({
                    success: false,
                    code: 400,
                    error: {
                        code: 400,
                        message: "Can not delete land as deals are going on in this land",
                    },
                    key: 'COMMON_ERROR'
                });
            }
        })
    },
    getFeaturedLand: function (data, context, req, res) {
        //featured.isFeatured = true;
        // query.isApproved = true;
        // query.franchiseeApproved = true;
        var count = req.param('count')
        if (count == undefined) {
            count = 8
        } else {
            count = parseInt(count)
        }

        var page = req.param('page')

        if (page == undefined) {
            page = 1
        } else {
            page = parseInt(page)
        }

        var skipNo = (page - 1) * count;
        let today = new Date()
        let sellquery = {};
        sellquery.forSell = true;
        sellquery.approvalStatus = 'Admin_Approved';
        sellquery.isDeleted = false;
        sellquery.availableArea = { $gt: 0 }
        sellquery.isFeatured = true;
        // sellquery.$or = [{ subscriptionExpiredDate: { $gte: today } }, { subscriptionExpiredDate: { $eq: undefined } }, { subscriptionExpiredDate: { $eq: null } }];
        let leasequery = {};
        leasequery.approvalStatus = 'Admin_Approved';
        leasequery.forLease = true;
        leasequery.isDeleted = false;

        // leasequery.availableFrom = { $gte: today }
        leasequery.availableTill = { $gte: today }
        leasequery.availableArea = { $gt: 0 }
        leasequery.isFeatured = true;
        // leasequery.$or = [{ subscriptionExpiredDate: { $gte: today } }, { subscriptionExpiredDate: { $eq: undefined } }, { subscriptionExpiredDate: { $eq: null } }];
        // console.log(leasequery, 'leasequery====')
        var type = req.param('type')
        if (type) {
            if (type == 'sell') {
                Lands.count(sellquery).exec(function (err, sellTotal) {
                    Lands.find(sellquery, { fields: ['availableArea', 'coverImage', 'area', 'areaUnit', 'title', 'city', 'district', 'state', 'sellPriceDisplay', 'isFeatured', 'isVerified'] }).sort({ isFeatured: -1 }).skip(skipNo).limit(count).exec(function (err, lands) {
                        return res.jsonx({
                            success: true,
                            data: { sell: { lands: lands, total: sellTotal } },
                        });
                    })
                })
            } else {
                Lands.count(leasequery).exec(function (err, leaseTotal) {
                    Lands.find(leasequery, { fields: ['availableArea', 'coverImage', 'area', 'areaUnit', 'title', 'city', 'district', 'state', 'leasePriceDisplay', 'isFeatured', 'isVerified', 'leasePriceUnit'] }).sort({ isFeatured: -1 }).skip(skipNo).limit(count).exec(function (err, leaselands) {
                        return res.jsonx({
                            success: true,
                            data: { lease: { lands: leaselands, total: leaseTotal } },
                        });
                    });
                })
            }
        } else {
            Lands.count(sellquery).exec(function (err, sellTotal) {
                Lands.find(sellquery, { fields: ['availableArea', 'coverImage', 'area', 'areaUnit', 'title', 'city', 'district', 'state', 'sellPriceDisplay', 'isFeatured', 'isVerified'] }).sort({ isFeatured: -1 }).skip(skipNo).limit(count).exec(function (err, lands) {
                    if (err) {
                        return res.status(400).jsonx({
                            success: false,
                            error: err
                        });
                    } else {
                        Lands.count(leasequery).exec(function (err, leaseTotal) {
                            Lands.find(leasequery, { fields: ['availableArea', 'coverImage', 'area', 'areaUnit', 'title', 'city', 'district', 'state', 'leasePriceDisplay', 'isFeatured', 'isVerified', 'leasePriceUnit'] }).sort({ isFeatured: -1 }).skip(skipNo).limit(count).exec(function (err, leaselands) {
                                return res.jsonx({
                                    success: true,
                                    data: { sell: { lands: lands, total: sellTotal }, lease: { lands: leaselands, total: leaseTotal } },
                                });
                            });
                        })
                    }
                })
            })
        }
    },

    getHomeLand: function (data, context, req, res) {
        //featured.isFeatured = true;
        // query.isApproved = true;
        // query.franchiseeApproved = true;
        var count = req.param('count')
        if (count == undefined) {
            count = 8
        } else {
            count = parseInt(count)
        }

        var page = req.param('page')
        if (page == undefined) {
            page = 1
        } else {
            page = parseInt(page)
        }

        var skipNo = (page - 1) * count;
        let today = new Date()
        let sellquery = {};
        sellquery.forSell = true;
        sellquery.approvalStatus = 'Admin_Approved';
        sellquery.isDeleted = false;
        sellquery.availableArea = { $gt: 0 }
        // sellquery.$or = [{ subscriptionExpiredDate: { $gte: today } }, { subscriptionExpiredDate: { $eq: undefined } }, { subscriptionExpiredDate: { $eq: null } }];
        // sellquery.subscriptionExpiredDate = { $gte: today };
        let leasequery = {};
        leasequery.approvalStatus = 'Admin_Approved';
        leasequery.forLease = true;
        leasequery.isDeleted = false;

        // leasequery.availableFrom = { $gte: today }
        leasequery.availableTill = { $gte: today }
        leasequery.availableArea = { $gt: 0 }
        // leasequery.$or = [{ subscriptionExpiredDate: { $gte: today } }, { subscriptionExpiredDate: { $eq: undefined } }, { subscriptionExpiredDate: { $eq: null } }];

        // console.log(leasequery, 'leasequery====')
        var type = req.param('type')
        if (type) {
            if (type == 'sell') {
                Lands.count(sellquery).exec(function (err, sellTotal) {
                    Lands.find(sellquery, { fields: ['availableArea', 'coverImage', 'area', 'areaUnit', 'title', 'city', 'district', 'state', 'sellPriceDisplay', 'isFeatured', 'isVerified'] }).sort({ isFeatured: -1 }).skip(skipNo).limit(count).exec(function (err, lands) {

                        return res.jsonx({
                            success: true,
                            data: { sell: { lands: lands, total: sellTotal } },
                        });
                    })
                })
            } else {
                Lands.count(leasequery).exec(function (err, leaseTotal) {
                    Lands.find(leasequery, { fields: ['availableArea', 'coverImage', 'area', 'areaUnit', 'title', 'city', 'district', 'state', 'leasePriceDisplay', 'isFeatured', 'isVerified', 'leasePriceUnit'] }).sort({ isFeatured: -1 }).skip(skipNo).limit(count).exec(function (err, leaselands) {
                        return res.jsonx({
                            success: true,
                            data: { lease: { lands: leaselands, total: leaseTotal } },
                        });
                    });
                })
            }
        } else {
            Lands.count(sellquery).exec(function (err, sellTotal) {
                Lands.find(sellquery, { fields: ['availableArea', 'coverImage', 'area', 'areaUnit', 'title', 'city', 'district', 'state', 'sellPriceDisplay', 'isFeatured', 'isVerified'] }).sort({ isFeatured: -1 }).skip(skipNo).limit(count).exec(function (err, lands) {
                    if (err) {
                        return res.status(400).jsonx({
                            success: false,
                            error: err
                        });
                    } else {
                        Lands.count(leasequery).exec(function (err, leaseTotal) {
                            Lands.find(leasequery, { fields: ['availableArea', 'coverImage', 'area', 'areaUnit', 'title', 'city', 'district', 'state', 'leasePriceDisplay', 'isFeatured', 'isVerified', 'leasePriceUnit'] }).sort({ isFeatured: -1 }).skip(skipNo).limit(count).exec(function (err, leaselands) {
                                return res.jsonx({
                                    success: true,
                                    data: { sell: { lands: lands, total: sellTotal }, lease: { lands: leaselands, total: leaseTotal } },
                                });
                            });
                        })
                    }
                })
            })
        }
    },

    getAllAdmin: function (data, context, req, res) {
        var list = data.list;
        var search = data.search;
        var page = data.page;
        var count = data.count;
        var skipNo = (page - 1) * count;
        var sortBy = data.sortBy;
        var seller = data.seller;
        var markets;
        var assign = data.assign;
        var close = data.close;
        var approve = data.approve;

        if (data.markets) markets = JSON.parse(data.markets);

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

        query.isDeleted = false;
        if (approve == 'true') {
            query.approvalStatus = 'Admin_Approved';
            query.isExpired = false;
        } else if (approve == 'false') {
            query.approvalStatus = 'Approval_Pending';
            query.isExpired = false;
        } else if (approve == 'franchisee') {
            query.approvalStatus = 'Franchisee_Approved';

        }

        if (close == 'true') {
            query.isExpired = true;
        }

        if (assign == 'true') {
            query.transactionOwner = ObjectId(req.identity.id);
            //query.transactionOwner = String(query.transactionOwner);
            query.isExpired = false
        }

        if (markets != undefined && markets.length > 0) {
            query.pincode = { "$in": markets };
        }

        if (data.bidFrom && data.bidTo) {
            query.$and = [{
                availableTill: {
                    $gte: new Date(data.bidFrom)
                }
            }, {
                availableTill: {
                    $lte: new Date(data.bidTo)
                }
            }]
        }


        if (data.createdAtFrom && data.createdAtTo) {
            query.$and = [{
                createdAt: {
                    $gte: new Date(data.createdAtFrom)
                }
            }, {
                createdAt: {
                    $lte: new Date(data.createdAtTo)
                }
            }]
        }

        if (search) {
            query.$or = [
                { code: { 'like': '%' + search + '%' } },
                { name: { 'like': '%' + search + '%' } },
                { transactionOwner: { 'like': '%' + search + '%' } },
                { category: { 'like': '%' + search + '%' } },
                { parentCategory: { 'like': '%' + search + '%' } },
                { price: parseFloat(search) },
                { quantity: parseFloat(search) },
                { verified: { 'like': '%' + search + '%' } },
                { district: { 'like': '%' + search + '%' } },
                { seller: { 'like': '%' + search + '%' } },
                { sellerCode: { 'like': '%' + search + '%' } },
                { userUniqueId: { 'like': '%' + search + '%' } }

            ]
        }

        Lands.count(query).exec(function (err, total) {
            if (err) {
                return res.jsonx({
                    success: false,
                    code: 400,
                    error: err
                });
            } else {
                //console.log("arun")
                Lands.find(query).populate("market").populate("user").sort(sortBy).skip(skipNo).limit(count).exec(function (err, lands) {

                    if (err) {
                        return res.status(400).jsonx({
                            success: false,
                            error: err
                        });
                    } else {
                        // console.log(lands, 'arun');
                        return res.jsonx({
                            success: true,
                            data: lands,
                            total: total

                        });
                    }
                })
            }
        })
    },

    frontLandsFilter: function (data, context, req, res) {
        let query = {};

        query.approvalStatus = 'Admin_Approved';
        query.isDeleted = false;
        query.availableArea = { "$gt": 0 };
        // query.sellPrice = {"$gt": 0}
        // query.leasePrice = {"$gt": 0}

        Lands.native(function (error, landlist) {
            landlist.aggregate([
                {
                    $match: query
                },
                {
                    $lookup: {
                        from: "category",
                        localField: "soilType",
                        foreignField: "_id",
                        as: "soil"
                    }
                },
                { $unwind: "$soil" },
                {
                    "$group": {
                        "_id": "$state",
                        "districts": {
                            "$addToSet": "$district"
                        },
                        "soils": {
                            "$addToSet": {
                                "name": "$soil.name",
                                "id": "$soil._id"
                            }
                        },
                        "minArea": { $min: "$availableArea" },
                        "maxArea": { $max: "$availableArea" },
                        "minPrice": {
                            "$push": {
                                "$cond": [
                                    { "$gt": ["$sellPrice", 0] },
                                    { "value": "$sellPrice" },
                                    null
                                ]
                            }
                        },
                        "maxPrice": { $max: "$sellPrice" },
                        "minLeasePrice": {
                            "$push": {
                                "$cond": [
                                    { "$gt": ["$leasePrice", 0] },
                                    { "value": "$leasePrice" },
                                    null
                                ]
                            }
                        },
                        "maxLeasePrice": { $max: "$leasePrice" },
                    }
                },
                { "$unwind": "$minPrice" },
                { "$unwind": "$minLeasePrice" },
                {
                    "$group": {
                        "_id": {
                            "name": "$_id",
                            "district": "$districts",
                        },
                        "soils": {
                            "$addToSet": "$soils"
                        },
                        "minArea": { $min: "$minArea" },
                        "maxArea": { $max: "$maxArea" },
                        "minPrice": { $min: "$minPrice.value" },
                        "maxPrice": { $max: "$maxPrice" },
                        "minLeasePrice": { $min: "$minLeasePrice.value" },
                        "maxLeasePrice": { $max: "$maxLeasePrice" },
                    }
                },
                {
                    "$project": {
                        "_id": "$_id",
                        "minArea": "$minArea",
                        "maxArea": "$maxArea",
                        "minPrice": "$minPrice",
                        "maxPrice": "$maxPrice",
                        "minLeasePrice": "$minLeasePrice",
                        "maxLeasePrice": "$maxLeasePrice",
                        "soils": {
                            $reduce: {
                                input: "$soils",
                                initialValue: [],
                                in: { $setUnion: ["$$value", "$$this"] }
                            }
                        },
                    }
                },
                {
                    "$group": {
                        "_id": null,
                        "states": {
                            "$push": "$_id",
                        },
                        // "soils": {$reduce: {
                        //     input: "$soils",
                        //     initialValue: [],
                        //     in: { $concatArrays : ["$$value", "$$this"] }
                        //     }
                        // },
                        "soils": {
                            "$addToSet": "$soils"
                        },
                        "minArea": { $min: "$minArea" },
                        "maxArea": { $max: "$maxArea" },
                        "minPrice": { $min: "$minPrice" },
                        "maxPrice": { $max: "$maxPrice" },
                        "minLeasePrice": { $min: "$minLeasePrice" },
                        "maxLeasePrice": { $max: "$maxLeasePrice" },
                    }
                },
                {
                    "$project": {
                        "states": "$states",
                        "minArea": "$minArea",
                        "maxArea": "$maxArea",
                        // "minPrice": "$minPrice",
                        // "maxPrice": "$maxPrice",
                        // "minLeasePrice": "$minLeasePrice",
                        // "maxLeasePrice": $maxLeasePrice
                        "minPrice": { $floor: { $min: ["$minPrice", "$minLeasePrice"] } },//"$minLeasePrice",
                        "maxPrice": { $ceil: { $max: ["$maxLeasePrice", "$maxPrice"] } }, //$maxLeasePrice                        
                        "soils": {
                            $reduce: {
                                input: "$soils",
                                initialValue: [],
                                in: { $setUnion: ["$$value", "$$this"] }
                            }
                        },
                    }
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
                        data: results[0],

                    });
                }
            })
        });
    },

    frontLands: function (data, context, req, res) {
        let query = {};
        var datetime = new Date();
        // subtract one day from specified time  
        // console.log(data, 'data===')

        datetime.setDate(datetime.getDate() - 1);
        var date = datetime.toISOString().slice(0, 10);
        query.approvalStatus = 'Admin_Approved';
        // query.subscriptionExpiredDate = { $gte: new Date() };

        query.isDeleted = false;
        query.availableArea = { "$gt": 0 };
        query.isExpired = false;
        // query.$or = { subscriptionExpiredDate: { $gte: datetime } }, { subscriptionExpiredDate: { $eq: undefined } }, { subscriptionExpiredDate: { $eq: null } };
        if (data.forSell) {
            if (data.forSell == true || data.forSell == 'true') {
                if (data.forLease && (data.forLease == true || data.forLease == 'true')) {
                    console.log("1")
                } else {
                    console.log("2")
                    query.forSell = true;
                }
            } else {
                console.log("3")
                query.forSell = false;
            }
        } else {
            // console.log("4")
        }
        let today = new Date()
        if (data.forLease) {
            if (data.forLease == true || data.forLease == 'true') {
                if (data.forSell && (data.forSell == true || data.forSell == 'true')) {


                    query.$or = [{ forSell: true }, {
                        $and: [{ forLease: true }, { availableTill: { $gte: today } },
                            // { subscriptionExpiredDate: { $gte: datetime } }, { subscriptionExpiredDate: { $eq: undefined } }, { subscriptionExpiredDate: { $eq: null } }
                        ]
                    }]
                    console.log("5")

                } else {
                    query.forLease = true;
                    // leasequery.availableFrom = { $gte: today }
                    query.availableTill = { $gte: today }
                    console.log("6")

                    // query.availableTill = { $gte: new Date(date + "T23:59:59+05:30") };
                }
            } else {
                query.forLease = false;
                console.log("7")

            }
        } else {
            // query.$or = [{availableTill:{ $gte: today }},{availableTill:undefined}, {availableTill:null}]
            // console.log("8")

        }

        if (data.sourceOfIrrigation) {
            let sourceOfIrrigation = JSON.parse(data.sourceOfIrrigation);
            if (sourceOfIrrigation.length > 0) {
                query.sourceOfIrrigation = { "$in": sourceOfIrrigation }
            }
        }

        if (data.suitableCrops) {
            let suitableCrops = JSON.parse(data.suitableCrops);
            if (suitableCrops.length > 0) {
                query.suitableCrops = { "$in": suitableCrops }
            }
        }

        // if (data.state) {
        //     let state = data.state;
        //     query.state = state;
        // }

        if (data.district) {
            let district = JSON.parse(data.district);
            if (district.length > 0) {
                query.district = { "$in": district }
            }
        }
        if (data.fromDistance && data.toDistance) {
            let fromDistance = data.fromDistance;
            let toDistance = data.toDistance;
            query.distanceInM = { $gte: parseFloat(fromDistance), $lte: parseFloat(toDistance) }

        }
        if (data.soilType) {
            let soilType = JSON.parse(data.soilType);
            if (soilType.length > 0) {
                query.soilType = { "$in": soilType }
            }
        }

        if (data.minNoOfOwners) {
            query.noOfOwners = { "$gte": parseInt(data.minNoOfOwners) }
        }
        if (data.maxNoOfOwners) {
            query.noOfOwners = { "$lte": parseInt(data.maxNoOfOwners) }
        }

        if (data.minPrice && data.maxPrice) {
            let minPrice = data.minPrice
            let maxPrice = data.maxPrice;
            query.$or = [{ sellPrice: { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) } }, { leasePrice: { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) } }];
            //     query.leasePrice = { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) };
        }

        if (data.minArea && data.maxArea) {
            let minArea = data.minArea;
            let maxArea = data.maxArea;
            query.availableArea = { $gte: parseFloat(minArea), $lte: parseFloat(maxArea) };
        }
        var sortBy = data.sortBy;

        var sortQuery = {};
        sortQuery = { createdAt: -1 }
        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
            if (field == 'price') {
                sortQuery = { "sellPrice": (sortType == 'desc' ? -1 : 1), "leasePrice": (sortType == 'desc' ? -1 : 1) };
            }

        }
        // console.log(sortQuery, 'sortQuery==');
        // sortQuery[field ? field : 'updatedAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        // if (sortBy) {
        //     sortBy = sortBy.toString();
        // } else {
        //     sortBy = 'updatedAt Desc';
        // }

        var page = data.page;
        var count = parseInt(data.count);
        var skipNo = (page - 1) * count;
        var search = data.search
        // console.log(search, 'serach====')
        if (search) {

            let searchor = [
                {
                    pincode: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    city: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    district: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    state: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    title: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    area: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    price: {
                        'like': '%' + search + '%'
                    }
                }, {
                    code: {
                        'like': '%' + search + '%'
                    }
                },


            ]

            if (query.$or == undefined) {
                query.$or = searchor
            } else {
                // query.$or = searchor
                query.$and = [{ $or: searchor }, { $or: query.$or }]
                // console.log(query, 'searchor===')
            }

        }


        Lands.count(query).exec(function (err, total) {
            if (err) {
                return res.jsonx({
                    success: false,
                    code: 400,
                    error: err
                });
            } else {
                Lands.find(query, { fields: ['code', 'title', 'area', 'availableArea', 'areaUnit', 'leasePriceDisplay', 'sellPriceDisplay', 'leaseLandingPriceDisplay', 'leasePriceUnit', 'sellLandingPriceDisplay', 'approvalStatus', 'address', 'district', 'state', 'coverImage', 'user', 'forSell', 'forLease', 'soilType', 'availableFrom', 'availableTill'] })
                    .populate('soilType', { select: ['name'] }).populate('user', { select: ['fullName', 'district', 'state', 'avgRating', 'image'] })
                    .sort(sortQuery).skip(skipNo).limit(count)
                    .exec(function (err, lands) {
                        if (err) {
                            return res.jsonx({ error: err })
                        } else {
                            if (lands) {
                                // Lands.find(query).sort({ area: 1 }).limit(1).then(function (minArea) {
                                //     Lands.find(query).sort({ area: -1 }).limit(1).then(function (maxArea) {
                                //         Lands.find(query).sort({ leasePrice: 1 }).limit(1).then(function (minleasePrice) {
                                //             Lands.find(query).sort({ leasePrice: -1 }).limit(1).then(function (maxleasePrice) {
                                return res.jsonx({
                                    success: true,
                                    code: 200,
                                    data: lands,
                                    total: total,
                                    // minArea: minArea[0].area,
                                    // maxArea: maxArea[0].area,
                                    // minPrice: minleasePrice[0].leasePrice,
                                    // maxPrice: maxleasePrice[0].leasePrice
                                    //             })
                                    //         })
                                    //     })
                                    // })
                                })
                            } else {
                                return res.jsonx({
                                    success: true,
                                    code: 200,
                                    data: [],
                                    total: total,
                                    // minArea: minArea[0].area,
                                    // maxArea: maxArea[0].area,
                                    // minPrice: minleasePrice[0].leasePrice,
                                    // maxPrice: maxleasePrice[0].leasePrice
                                    //             })
                                    //         })
                                    //     })
                                    // })
                                })
                            }
                        }

                    })
            }
        })
    },

    landFrontDetail: function (data, context, req, res) {
        let Id = data.id;
        let user = req.param('user');

        Lands.findOne(Id).populate('user', { select: ['email', 'fullName', 'code', 'mobile', 'email', 'state', 'district', 'pincode', 'coverImage'] }).populate("soilType", { select: ['id', 'name', 'description'] }).then(function (landInfo) {
            if (landInfo) {
                if (typeof (landInfo['interestedCount']) === 'undefined') {
                    landInfo.interestedCount = 0;
                }
                let viewquery = {}
                viewquery.ipAddress = data.ip;
                if (data.user) {
                    viewquery.userid = data.user;
                }
                viewquery.landId = Id;
                viewquery.modelType = 'land'
                let totalview = landInfo.viewed || 0;
                Cropviewed.find(viewquery).then(function (response) {
                    if (response == undefined || response == '') {
                        Cropviewed.create(viewquery).then(function (viewentry) {
                            totalview = totalview + 1;
                            Lands.update({ id: Id }, { viewed: totalview }).then(function (detail) {
                                if (user) {
                                    console.log("1111 = ", user)
                                    Landinterests.findOne({ landId: Id, buyerId: user, $and: [{ status: { $ne: 'canceled' } }, { status: { $ne: 'failed' } }] }, { fields: ['code', 'status'] }).then(function (userInterest) {
                                        console.log("1112 = ", userInterest)
                                        if (userInterest != undefined) {
                                            landInfo.userdeal = userInterest
                                        }
                                        return res.jsonx({
                                            success: true,
                                            code: 200,
                                            data: landInfo
                                        });
                                    })
                                } else {
                                    return res.jsonx({
                                        success: true,
                                        code: 200,
                                        data: landInfo
                                    });
                                }
                            })
                        })
                    } else {
                        if (user) {
                            console.log("1113 = ", user)
                            Landinterests.findOne({ landId: Id, buyerId: user, $and: [{ status: { $ne: 'canceled' } }, { status: { $ne: 'failed' } }] }, { fields: ['code', 'status'] }).then(function (userInterest) {
                                console.log("1114 = ", userInterest)
                                if (userInterest != undefined) {
                                    landInfo.userdeal = userInterest
                                }
                                return res.jsonx({
                                    success: true,
                                    code: 200,
                                    data: landInfo
                                });
                            })
                        } else {
                            return res.jsonx({
                                success: true,
                                code: 200,
                                data: landInfo
                            });
                        }
                    }
                })

            } else {
                return res.jsonx({
                    success: false,
                    code: 400,
                    error: constantObj.land.COMMON_ERROR,
                    key: 'COMMON_ERROR',
                })
            }
        });
    },

    show: function (data, context, req, res) {
        let Id = data.id;
        var count = 0;
        Lands.findOne(Id).populate('user', { select: ['fullName', 'mobile', 'email'] }).populate("market").populate('soilType', { select: ['name', 'id'] }).then(function (landInfo) {
            if (landInfo) {
                return res.jsonx({
                    success: true,
                    code: 200,
                    data: landInfo
                });

            } else {
                return res.jsonx({
                    success: false,
                    code: 400,
                    error: constantObj.land.COMMON_ERROR,
                    key: 'COMMON_ERROR',
                })
            }


        });
    },

    adminLandDetail: function (data, context, req, res) {
        let Id = data.id;
        Lands.findOne(Id).populate('user', { fields: ['fullName', 'mobile', 'email'] }).populate('soilType', { fields: ['name', 'id'] }).exec(function (err, landInfo) {
            if (err) {
                return res.jsonx({
                    success: false,
                    code: 400,
                    error: constantObj.land.COMMON_ERROR,
                    key: 'COMMON_ERROR',
                })
            }
            console.log(landInfo, '====')
            return res.jsonx({
                success: true,
                code: 200,
                data: landInfo
            });
        });
    },

    getMyLands: function (data, context, req, res) {

        var sortBy = data.sortBy;
        var page = data.page;
        var count = parseInt(data.count);
        var search = data.search;
        var skipNo = (page - 1) * count;
        var query = {};
        //sortBy = sortBy.toString();
        if (sortBy) {
            sortBy = sortBy.toString();
        } else {
            sortBy = 'createdAt desc';
        }
        query.isDeleted = 'false';
        if (search) {
            query.$or = [
                {
                    pincode: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    city: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    area: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    price: {
                        'like': '%' + search + '%'
                    }
                }

            ]
        }

        var userId = context.identity.id
        if (data.user) {
            userId = data.user;
        }
        query.user = userId
        var isExpired = data.isExpired;

        console.log("data.isExpired; == ", data)
        if (isExpired == true || isExpired == 'true') {
            query.$or = [{ isExpired: true }, { availableArea: { $lte: 0 } }, { $and: [{ forLease: true }, { availableTill: { $lt: new Date() } }] }];
            console.log("query == ", query)
        } else {
            query.$and = [{ isExpired: false }, { availableArea: { $gt: 0 } }, { $or: [{ $and: [{ forLease: true }, { availableTill: { $gt: new Date() } }] }, { forLease: false }] }];
            console.log("query 111 == ", query)
        }

        Lands.count(query).exec(function (err, total) {
            if (err) {
                return res.jsonx({
                    success: false,
                    code: 400,
                    error: err
                });
            } else {

                Lands.find(query).populate('user', { select: ['fullName', 'mobile', 'email'] }).populate('soilType', { select: ['name', 'id'] }).sort(sortBy).skip(skipNo).limit(count).exec(function (err, lands) {
                    if (err) {
                        return res.jsonx({
                            success: false,
                            code: 400,
                            error: err
                        });
                    } else {
                        let landIds = lands.map(a => a.id);
                        console.log("landIds == ", landIds)
                        Sellerpayment.find({ landId: { $in: landIds } }, { fields: ['landId'] }).then(function (sellerPayments) {
                            let sellerPaymentsGrouped = _.groupBy(sellerPayments, 'landId');
                            // console.log("sellerPaymentsGrouped == ", sellerPaymentsGrouped)
                            Landinterests.find({ landId: { $in: landIds } }, { fields: ['id', 'landId', 'registryDate'] }).then(function (deal) {
                                let dealGrouped = _.groupBy(deal, 'landId');
                                // console.log(dealGrouped, 'dealGrouped')
                                for (var i = 0; i < lands.length; i++) {
                                    let lid = lands[i].id
                                    if (dealGrouped[lid]) {
                                        lands[i].landRegistryInfo = dealGrouped[lid]
                                        // console.log(dealGrouped[lid].registryDate, 'dealGrouped[lid].registryDate')
                                    }
                                    if (sellerPaymentsGrouped[lid]) {
                                        lands[i].ispayments = true
                                    } else {
                                        lands[i].ispayments = false
                                    }
                                }


                                return res.jsonx({
                                    success: true,
                                    data: lands,
                                    total: total
                                });
                            })
                        })
                    }
                })
            }
        })
    },

    franchiseeLands: function (data, context, req, res) {
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
        if (data.status) {
            query.approvalStatus = status
        }
        // if (data.pincode')) {
        //     var pincodes = JSON.parse(data.pincode'));
        //     if (pincodes.length > 0) {
        //         query.pincode = { "$in": pincodes }
        //     }
        // }

        query.GM = ObjectId(req.identity.id)
        //let basicCondition = landBasicDisplayCondition();
        //query = { ...query, ...basicCondition };
        if (search) {
            query.$or = [
                { code: parseInt(search) },
                { khasraNo: { $regex: search, '$options': 'i' } },
                { pincode: { $regex: search, '$options': 'i' } },
                { price: parseFloat(search) },
                { area: parseFloat(search) },
                { seller: { $regex: search, '$options': 'i' } },
                { city: { $regex: search, '$options': 'i' } },
                { approvalStatus: { $regex: search, '$options': 'i' } }
            ]
        }

        if (req.param('to') != undefined && req.param('from') != undefined) {
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

        Lands.native(function (error, landlist) {
            landlist.aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user',
                        foreignField: '_id',
                        as: "sellers"
                    }
                },
                {
                    $unwind: '$sellers'
                },
                {
                    $lookup: {
                        from: 'category',
                        localField: 'soilType',
                        foreignField: '_id',
                        as: "categorys"
                    }
                },
                {
                    $unwind: '$categorys'
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
                        // id: "$_id",
                        seller: "$sellers.fullName",
                        sellerId: "$sellers._id",
                        pincode: "$pincode",
                        code: "$code",
                        address: "$address",
                        city: "$city",
                        forLease: "$forLease",
                        forSell: '$forSell',
                        leasePrice: '$leasePrice',
                        leasePriceDisplay: '$leasePriceDisplay',
                        sellPrice: '$sellPrice',
                        sellPriceDisplay: '$sellPriceDisplay',
                        leasePriceUnit: '$leasePriceUnit',
                        area: "$area",
                        areaUnit: "$areaUnit",
                        createdAt: "$createdAt",
                        title: "$title",
                        // isApproved: "$isApproved",
                        approvalStatus: '$approvalStatus',
                        GM: "$market.GM",
                        soilType: '$categorys.name',
                        soilId: '$categorys._id',

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
                    landlist.aggregate([
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'user',
                                foreignField: '_id',
                                as: "sellers"
                            }
                        },
                        {
                            $unwind: '$sellers'
                        },
                        {
                            $lookup: {
                                from: 'category',
                                localField: 'soilType',
                                foreignField: '_id',
                                as: "categorys"
                            }
                        },
                        {
                            $unwind: '$categorys'
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
                                // id: "$_id",
                                seller: "$sellers.fullName",
                                sellerId: "$sellers._id",
                                code: "$code",
                                address: "$address",
                                city: "$city",
                                forLease: "$forLease",
                                forSell: '$forSell',
                                leasePrice: '$leasePrice',
                                leasePriceDisplay: '$leasePriceDisplay',
                                sellPrice: '$sellPrice',
                                sellPriceDisplay: '$sellPriceDisplay',
                                leasePriceUnit: '$leasePriceUnit',
                                area: "$area",
                                areaUnit: "$areaUnit",
                                createdAt: "$createdAt",
                                // isApproved: "$isApproved",
                                approvalStatus: '$approvalStatus',
                                //  isRejected: "$isRejected",
                                isDeleted: "$isDeleted",
                                GM: "$market.GM",
                                soilType: '$categorys',
                                //soilId: '$categorys._id',
                                title: '$title',
                                availableFrom: '$availableFrom',
                                availableTill: '$availableTill',
                                khasraNo: '$khasraNo',
                                documents: '$documents',
                                coverImage: '$coverImage',
                                interestedCount: '$interestedCount',
                                rejectReason: '$rejectReason',
                                rejectComment: '$rejectComment',


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
    },

    approveLand: function (data, context, req, res) {
        let status = 'Admin_Approved';
        Lands.findOne({ id: data.id }).populate('market').populate('user').then(function (response) {
            if (response) {
                Lands.update({ id: data.id }, { approvedOn: new Date(), approvedBy: context.identity.id, approvalStatus: status }).then(function (land) {
                    var msg = "Land with id " + land.code + " is approved by FarmX.";

                    var notificationData = {};
                    notificationData.productId = response.id;
                    notificationData.land = response.id;
                    notificationData.sellerId = response.user.id;
                    notificationData.user = response.user.id;
                    notificationData.productType = "lands";
                    //notificationData.transactionOwner = u[0].id;
                    // notificationData.transactionOwner = landData.transactionOwner;
                    notificationData.message = msg;
                    notificationData.messageKey = "LAND_APPROVED_NOTIFICATION"
                    notificationData.readBy = [];
                    notificationData.messageTitle = 'Land Approved'
                    let pushnotreceiver = [response.user.id]

                    if (response.market && response.market.GM) {
                        pushnotreceiver.push(response.market.GM)
                    }

                    Notifications.create(notificationData).then(function (notificationResponse) {

                        let landfor = ""
                        if (land[0].forSell) {
                            landfor = "Sell"
                        }
                        if (land[0].forlease) {
                            if (landfor != "") {
                                landfor = landfor + " & for "
                            }
                            landfor = landfor + "lease"
                        }
                        if (response.market && response.market.GM) {
                            let sendSMSToFarmer = {}
                            sendSMSToFarmer.variables = { "{#BB#}": landfor, "{#CC#}": land[0].code, "{#DD#}": response.user.fullName }
                            sendSMSToFarmer.templateId = "42395"
                            commonService.sendGeneralSMSToUsersWithId(sendSMSToFarmer, [land[0].user.id, response.market.GM])
                        }

                        if (land[0].transactionOwner) {
                            let sendSMSToFranchisee = {}
                            sendSMSToFranchisee.variables = { "{#BB#}": landfor, "{#CC#}": land[0].code, "{#DD#}": response.market.name, "{#EE#}": response.user.fullName }
                            sendSMSToFranchisee.templateId = "42396"
                            commonService.sendGeneralSMSToUsersWithId(sendSMSToFranchisee, [land[0].transactionOwner])
                        }

                        if (notificationResponse) {
                            commonService.notifyUsersFromNotification(notificationResponse, land[0])
                            pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                        }

                        return res.jsonx({
                            success: true,
                            key: "LAND_APPROVED",
                            message: constantObj.land.LAND_APPROVED,
                            data: land
                        })
                    })
                }).fail(function (error) {
                    return res.jsonx({ success: false, error: error })
                });
            } else {
                return res.jsonx({
                    success: false,
                    error: "Land not available"
                })
            }
        }).fail(function (error) {
            return res.jsonx({
                success: false,
                error: error
            })
        })
    },

    frnRejectLand: function (data, context, req, res) {
        Lands.find({ id: data.id }).populate('market').exec(function (err, response) {
            if (err) {
                return res.jsonx({
                    success: false,
                    error: err
                })
            } else {
                let updateQuery = {};
                // updateQuery.isRejected = true;
                updateQuery.rejectReason = data.rejectReason;
                updateQuery.rejectComment = data.rejectComment;
                updateQuery.approvalStatus = 'Franchisee_Reject';
                // updateQuery.franchiseeApprovedBy = context.identity.id;
                if ((data.rejectReason == undefined || data.rejectReason == "")) {
                    return res.jsonx({
                        success: false,
                        error: 'Please provide a reason.'
                    })
                } else {
                    Lands.update({ id: data.id }, updateQuery).exec(function (err, land) {
                        if (err) {
                            return res.jsonx({
                                success: false,
                                error: err
                            })
                        }

                        var msg = "Land with id " + land[0].code + " is disapproved. Reason is " + data.rejectReason;

                        var notificationData = {};
                        notificationData.productId = land[0].id;
                        notificationData.land = land[0].id;
                        notificationData.sellerId = land[0].user;
                        notificationData.user = land[0].user;
                        notificationData.productType = "lands";
                        //notificationData.transactionOwner = u[0].id;
                        // notificationData.transactionOwner = landData.transactionOwner;
                        notificationData.message = msg;
                        notificationData.messageKey = "LAND_DISAPPROVED_NOTIFICATION"
                        notificationData.readBy = [];
                        notificationData.messageTitle = 'Land Disapproved'
                        let pushnotreceiver = [land[0].user]

                        Notifications.create(notificationData).then(function (notificationResponse) {

                            if (notificationResponse) {
                                commonService.notifyUsersFromNotification(notificationResponse, land[0])
                                pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                            }

                            let landfor = ""
                            if (land[0].forSell) {
                                landfor = " Sell"
                            }
                            if (land[0].forlease) {
                                if (landfor != "") {
                                    landfor = landfor + " & for "
                                }
                                landfor = landfor + "lease"
                            }
                            let sendSMSToFarmer = {}
                            sendSMSToFarmer.variables = { "{#BB#}": landfor, "{#CC#}": land[0].code }
                            sendSMSToFarmer.templateId = "42392"
                            commonService.sendGeneralSMSToUsersWithId(sendSMSToFarmer, [land[0].user])

                            if (land[0].transactionOwner) {
                                let sendSMSToFranchisee = {}
                                sendSMSToFranchisee.variables = { "{#BB#}": landfor, "{#CC#}": land[0].code, "{#DD#}": response[0].market.name, "{#EE#}": "Farmer" }
                                sendSMSToFranchisee.templateId = "42393"
                                commonService.sendGeneralSMSToUsersWithId(sendSMSToFranchisee, [land[0].transactionOwner])
                            }

                            return res.jsonx({
                                success: true,
                                key: "LAND_REJECT",
                                message: constantObj.land.LAND_REJECT

                            })
                        })

                    })
                }
            }
        })
    },

    franchiseeApprove: function (data, context, req, res) {
        let fndQry = {}
        fndQry.id = data.id;

        Lands.findOne(fndQry).then(function (landInfo) {
            if (landInfo == undefined || landInfo == null || landInfo == "") {
                return res.jsonx({
                    success: false,
                    error: 'Land not found'
                })
            }

            var pinQry = {};
            pinQry.pincode = { "$in": [parseInt(data.pincode)] };
            Market.find(pinQry).then(function (m) {
                var marketIds = [];
                var marketWithGMIds = [];
                m.forEach(function (item) {
                    marketIds.push(item.id);
                    if (item.GM != undefined) {
                        marketWithGMIds.push(item.id)
                    }
                });
                let selectedmaarketgm = undefined
                // Users.find({markets: { "$in": marketIds } }).then(function (u) {
                if (marketWithGMIds != undefined && marketWithGMIds.length > 0) {
                    var mrandnumber = Math.floor(Math.random() % marketWithGMIds.length)
                    if (landInfo.market) {

                    } else {
                        data.market = marketWithGMIds[mrandnumber]
                    }

                    selectedmaarketgm = marketWithGMIds[mrandnumber].GM
                }

                commonService.getDataFromPincode(data.pincode).then(function (pincodeInfo) {
                    let pincodeData = pincodeInfo;
                    if (pincodeData == 'error') {
                        return res.jsonx({
                            success: false,
                            code: 400,
                            message: 'please enter valid pincode.'
                        });
                    }
                    let address = data.address + ", " + data.city + " " + pincodeData["Districtname"] + " , " + pincodeData["statename"] + " " + data.pincode;
                    commonService.getLatLong(address).then(function (lantLong) {
                        if (lantLong == 'error') {
                            return res.jsonx({
                                success: false,
                                code: 400,
                                message: 'please enter valid address.'
                            });
                        }
                        let district = pincodeData["Districtname"] + ',' + pincodeData["statename"];
                        let coordinates = [lantLong[0].latitude, lantLong[0].longitude];

                        if (data.geoFancingCoordinates && data.geoFancingCoordinates.length > 0) {
                            coordinates = [data.geoFancingCoordinates[0][0], data.geoFancingCoordinates[0][1]]
                        }

                        data.coordinates = coordinates
                        commonService.getDistance(address, district).then(function (distance) {
                            if (distance == 'error') {
                                return res.jsonx({
                                    success: false,
                                    code: 400,
                                    message: 'please enter valid address.'
                                });
                            }
                            data.distanceInKm = distance.text;
                            data.distanceInM = distance.value;
                            if (pincodeData) {
                                if (data['state'] == undefined || data['state'] == "") {
                                    data["state"] = pincodeData["statename"];
                                }
                                if (data['district'] == undefined || data['district'] == "") {
                                    data["district"] = pincodeData["Districtname"];
                                }
                                if (data['city'] == undefined || data['city'] == "" || data['city'] == null) {
                                    data["city"] = pincodeData["Taluk"];
                                }
                            }

                            let sell;
                            if (data.forSell == true) {
                                sell = 'sale';
                            }
                            if (data.forLease == true) {
                                sell = 'lease';
                            }
                            if (data.forSell == true && data.forLease == true) {
                                sell = 'sale & lease';
                            }


                            let title = data.area + " " + data.areaUnit + " available for " + sell + ' in ' + data["district"];
                            data.title = title;
                            data.availableArea = data.area;
                            // console.log("lease price", data.leasePrice);
                            if (data.leasePrice) {
                                data.leasePriceDisplay = changeNumberFormat(parseInt(data.leasePrice));

                                let leaseLandingPrice = data.leasePrice + ((landInfo.sellerFarmxComission / 100 * data.leasePrice) * (1 + landInfo.sellerTaxRate / 100));
                                data.leaseLandingPrice = leaseLandingPrice;
                                data.leaseLandingPriceDisplay = changeNumberFormat(parseInt(leaseLandingPrice));
                            }
                            if (data.sellPrice) {
                                data.sellPriceDisplay = changeNumberFormat(parseInt(data.sellPrice));

                                let sellLandingPrice = data.sellPrice + ((landInfo.sellerFarmxComission / 100 * data.sellPrice) * (1 + landInfo.sellerTaxRate / 100));
                                data.sellLandingPrice = sellLandingPrice;
                                data.sellLandingPriceDisplay = changeNumberFormat(parseInt(sellLandingPrice));
                            }
                            let availableTill = new Date(data.avalaibleTill);
                            let currentdate = new Date();
                            if ((data.forlease == true && availableTill > currentdate) || (data.availableArea < 0.15)) {
                                data.isExpired = true
                            } else {
                                data.isExpired = false
                            }
                            //data.coverImage = data.coverImage || "";
                            if (data.images.indexOf(landInfo.coverImage) == -1) {
                                data.coverImage = data.images[0]
                            }
                            if (data.images && data.images.length > 0 && (data.coverImage == undefined || data.coverImage == null) && (landInfo.coverImage == undefined || landInfo.coverImage == null)) {
                                data.coverImage = data.images[0]
                            }
                            if (data.coverImage == undefined) {
                                if (data.images && data.images.length > 0) {
                                    if (landInfo.coverImage) {
                                        const index = data.images.indexOf(landInfo.coverImage);
                                        if (!(index > -1)) {
                                            data.coverImage = data.images[0]
                                        }
                                    } else {
                                        data.coverImage = data.images[0]
                                    }
                                } else {
                                    data.coverImage = null;
                                }
                            }

                            data.approvalStatus = 'Franchisee_Approved';
                            delete data.user;
                            // data.franchiseeApprovedBy = context.identity.id;
                            // console.log(data, 'id-=')
                            if (data.documents) {
                                let finalDoc = [];
                                for (var i = 0; i < data.documents.length; i++) {
                                    finalDoc.push({ name: data.documents[i].name, doc: data.documents[i].doc, uploadedBy: context.identity.id, uploadedTime: new Date() })
                                }
                                data.documents = finalDoc;
                            }
                            Lands.update({ id: data.id }, data).exec(function (err, landData) {
                                if (err) {
                                    return res.jsonx({
                                        success: false,
                                        code: 400,
                                        error: err
                                    });
                                }
                                return res.jsonx({
                                    success: true,
                                    message: constantObj.land.LAND_APPROVED,
                                    key: "LAND_APPROVED",


                                });
                            })
                        });
                    })

                })
            })
        })
    },

    verify: function (data, context, req, res) {
        Lands.update({ id: data.id }, { isVerified: true, verifyBy: context.identity.id }).then(function (land) {
            if (land) {
                return res.jsonx({
                    success: true,
                    message: constantObj.land.LAND_VERIFIED,
                    key: "LAND_VERIFIED",
                    data: land
                })
            } else {
                return res.jsonx({
                    success: false
                })
            }
        }).fail(function (error) {
            return res.jsonx({
                success: true,
                error: error
            })
        })
    },

    disapproveLand: function (data, context, req, res) {

        if (data.id == undefined) {
            return res.jsonx({
                success: false,
                error: {
                    code: 404,
                    message: "Please send land id"
                }
            })
        }
        if (data.reason == undefined) {
            return res.jsonx({
                success: false,
                error: {
                    code: 404,
                    message: "Please send reason for disapproval of land."
                }
            })
        }

        Lands.findOne({ id: data.id }).populate('market').populate('user').then(function (land) {

            if (land) {

                let reasons = []

                if (land.disappovedReason && land.disappovedReason.length > 0) {
                    reasons = land.disappovedReason
                }
                reasons.push(data.reason)

                var msg = "Land with id " + land.code + " is disapproved by FarmX. Reason is " + data.reason;

                var notificationData = {};
                notificationData.productId = land.id;
                notificationData.land = land.id;
                notificationData.sellerId = land.user.id;
                notificationData.user = land.user.id;
                notificationData.productType = "lands";
                //notificationData.transactionOwner = u[0].id;
                // notificationData.transactionOwner = landData.transactionOwner;
                notificationData.message = msg;
                notificationData.messageKey = "LAND_DISAPPROVED_NOTIFICATION"
                notificationData.readBy = [];
                notificationData.messageTitle = 'Land Disapproved'
                let pushnotreceiver = [land.user.id]

                if (land.market && land.market.GM) {
                    pushnotreceiver.push(land.market.GM)
                }

                Notifications.create(notificationData).then(function (notificationResponse) {

                    if (notificationResponse) {
                        commonService.notifyUsersFromNotification(notificationResponse, land)
                        pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                    }

                    Lands.update({ id: data.id }, { disappovedReason: reasons, approvalStatus: 'Admin_Disapproved' }).then(function (landInfo) {

                        let landfor = ""
                        if (land.forSell) {
                            landfor = "Sell"
                        }
                        if (land.forlease) {
                            if (landfor != "") {
                                landfor = landfor + " & for "
                            }
                            landfor = landfor + "lease"
                        }
                        let sendSMSToFarmer = {}
                        sendSMSToFarmer.variables = { "{#BB#}": landfor, "{#CC#}": land.code }
                        sendSMSToFarmer.templateId = "42451"
                        commonService.sendGeneralSMSToUsersWithId(sendSMSToFarmer, [land.user.id])

                        if (land.market && land.market.GM) {
                            let sendSMSToFranchisee = {}
                            sendSMSToFranchisee.variables = { "{#BB#}": landfor, "{#CC#}": land.code, "{#DD#}": land.user.fullName }
                            sendSMSToFranchisee.templateId = "42398"
                            commonService.sendGeneralSMSToUsersWithId(sendSMSToFranchisee, [land.market.GM])
                        }

                        if (land.transactionOwner) {
                            let sendSMSToFranchisee = {}
                            sendSMSToFranchisee.variables = { "{#BB#}": landfor, "{#CC#}": land.code, "{#DD#}": land.market.name, "{#EE#}": land.user.fullName }
                            sendSMSToFranchisee.templateId = "42452"
                            commonService.sendGeneralSMSToUsersWithId(sendSMSToFranchisee, [land.transactionOwner])
                        }

                        return res.jsonx({
                            success: true,
                            message: "land disapproved ",
                            key: "LAND_DISAPPROVED"
                        });
                    })
                })
            } else {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 404,
                        message: constantObj.messages.NOT_FOUND
                    }
                });
            }
        })
    },

    getTimeSlot: function (data, context, req, res) {

        Settings.findOne({ type: 'land' }).then(function (settingInfo) {
            // console.log(settingInfo.timeSlot);
            let slotsInMinute = settingInfo.timeSlot;
            //let designSlots = workingTime / slots;
            let work_strat = constantObj.land.WORKING_START;
            let work_end = constantObj.land.WORKING_END;

            let date = new Date().toISOString().slice(0, 10)
            if (data.date) {
                date = new Date(data.date).toISOString().slice(0, 10)
            }
            let startTime = date + " " + work_strat
            let endTime = date + " " + work_end;
            //console.log(new Date(startTime).toString())
            // console.log(endTime, '====')
            startTime = parseIn(startTime);
            endTime = parseIn(endTime);
            let intervals = getTimeIntervals(startTime, endTime, slotsInMinute);

            let qry = {}
            qry.market = ObjectId("5c6f919992af07580fe46db2");
            qry.unavailabilityDateTill = { $gt: new Date(date + "T00:00:00") }
            qry.unavailabilityDateTill = { $lt: new Date(date + "T23:59:59") }
            // console.log(qry, 'qry===')
            FranchiseeUnavailability.find(qry).then(function (franchiseeUnavailabilityInfo) {
                // console.log(fu, 'fun====')
                let franchiseeUnavailability = [];
                franchiseeUnavailabilityInfo.forEach(function (frnUnavilability) {
                    franchiseeUnavailability.push({
                        startTime: frnUnavilability.startTime.toLocaleString('en-IST', { hour: 'numeric', minute: 'numeric', hour12: true }), endTime: frnUnavilability.endTime.toLocaleString('en-IST', { hour: 'numeric', minute: 'numeric', hour12: true })
                    });
                })
                var finalIntervals = intervals.filter(function (objFromA) {
                    return !franchiseeUnavailability.find(function (objFromB) {
                        return (objFromA.startTime === objFromB.startTime && objFromA.endTime === objFromB.endTime)
                    })
                })

                return res.jsonx({
                    success: true,
                    data: finalIntervals,
                    franchiseeUnavailability: franchiseeUnavailability
                });
            })

        })
    },

    relatedLand: function (data, context, req, res) {
        let query = {};
        query.approvalStatus = 'Admin_Approved';
        query.soilType = data.soilType;
        query.availableArea = { $gt: 0 }
        let datetime = new Date()
        // query.$or = [{ subscriptionExpiredDate: { $gte: datetime } }, { subscriptionExpiredDate: { $eq: undefined } }, { subscriptionExpiredDate: { $eq: null } }];

        //query.pincode = data.pincode;
        var count = 5;
        var skipNo = 0;

        Lands.find(query, { fields: ['availableArea', 'coverImage', 'area', 'areaUnit', 'title', 'city', 'district', 'state', 'sellPriceDisplay', 'isFeatured', 'isVerified', 'leasePriceDisplay', 'leasePriceUnit', 'forSell', 'forLease'] }).sort({ createdAt: -1 }).skip(skipNo).limit(count).exec(function (err, lands) {

            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {

                return res.jsonx({
                    success: true,
                    data: lands,

                });
            }
        })
    },

    landMail: function (data, context, req, res) {
        let landId = data.id;

        if (data.email != "") {
            Lands.findOne({ id: landId }).then(function (land) {
                if (land) {
                    sendEmail(land, data.email, req, res);
                } else {
                    return res.jsonx({
                        success: false,
                        error: 'land not found'
                    })
                }
            })
        } else {
            return res.jsonx({
                success: false,
                code: 400,
                error: "please send email id"
            });
        }
    },
    getVisibilityOfLands: function (data, context, req, res) {
        // console.log("arun")
        var datetime = new Date();
        // subtract one day from specified time                           
        datetime.setDate(datetime.getDate() - 1);
        var date = datetime.toISOString().slice(0, 10);

        var sortBy = data.sortBy;
        var page = data.page;
        var count = parseInt(data.count);
        var search = data.search;
        var skipNo = (page - 1) * count;
        var query = {};
        //sortBy = sortBy.toString();
        if (sortBy) {
            sortBy = sortBy.toString();
        } else {
            sortBy = 'createdAt desc';
        }
        query.availableArea = { $gt: 0 }
        query.isDeleted = false;
        query.isExpired = false
        query.approvalStatus = 'Admin_Approved';
        // query.$or = [{ subscriptionExpiredDate: { $gte: datetime } }, { subscriptionExpiredDate: { $eq: undefined } }, { subscriptionExpiredDate: { $eq: null } }];

        if (data.visibility) {
            query['subscriptionInfo.visibility'] = data.visibility;
        }
        if (search) {
            query.$or = [
                {
                    pincode: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    city: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    district: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    state: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    title: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    area: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    price: {
                        'like': '%' + search + '%'
                    }
                }, {
                    code: {
                        'like': '%' + search + '%'
                    }
                },
                // { subscriptionExpiredDate: { $gte: datetime } }, { subscriptionExpiredDate: { $eq: undefined } }, { subscriptionExpiredDate: { $eq: null } }
            ]
        }

        if (data.forSell) {
            if (data.forSell == true || data.forSell == 'true') {
                query.forSell = true;
            } else {
                query.forSell = false;
            }
        }
        if (data.forLease) {
            if (data.forLease == true || data.forLease == 'true') {
                query.forLease = true;
                query.availableTill = { $gte: new Date(date + "T23:59:59+05:30") };
            } else {
                query.forLease = false;
            }
        } else {
            // query.availableTill = { $gte: new Date(date + "T23:59:59+05:30") };
        }
        // query.subscriptionExpiredDate = { $gte: new Date(date + "T23:59:59+05:30") };
        // console.log(query, '----')
        Lands.count(query).exec(function (err, total) {
            if (err) {
                return res.jsonx({
                    success: false,
                    code: 400,
                    error: err
                });
            } else {
                Lands.find(query, { fields: ['title', 'area', 'areaUnit', 'leasePriceDisplay', 'sellPriceDisplay', 'leaseLandingPriceDisplay', 'description', 'sellLandingPriceDisplay', 'approvalStatus', 'address', 'city', 'district', 'state', 'pincode', 'coverImage', 'image', 'availableArea', 'leasePriceUnit', 'bannerImage'] }).populate('user', { select: ['fullName', 'mobile', 'email'] }).populate('soilType', { select: ['name', 'id'] }).sort(sortBy).skip(skipNo).limit(count).exec(function (err, lands) {
                    if (err) {
                        return res.jsonx({
                            success: false,
                            code: 400,
                            error: err
                        });
                    } else {
                        return res.jsonx({
                            success: true,
                            data: lands,
                            total: total

                        });
                    }
                })
            }
        })
    },

    getAllLands: function (data, context, req, res) {
        // console.log("arun")
        var datetime = new Date();
        // subtract one day from specified time                           
        datetime.setDate(datetime.getDate() - 1);
        var date = datetime.toISOString().slice(0, 10);

        var sortBy = data.sortBy;
        var page = data.page;
        var count = parseInt(data.count);
        var search = data.search;
        var skipNo = (page - 1) * count;
        var query = {};
        //sortBy = sortBy.toString();
        if (sortBy) {
            sortBy = sortBy.toString();
        } else {
            sortBy = 'createdAt desc';
        }
        query.availableArea = { $gt: 0 }
        query.isDeleted = false;
        query.isExpired = false
        query.approvalStatus = 'Admin_Approved';
        // query.$or = [{ subscriptionExpiredDate: { $gte: datetime } }, { subscriptionExpiredDate: { $eq: undefined } }, { subscriptionExpiredDate: { $eq: null } }];

        if (search) {
            query.$or = [
                {
                    pincode: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    city: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    district: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    state: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    title: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    area: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    price: {
                        'like': '%' + search + '%'
                    }
                }, {
                    code: {
                        'like': '%' + search + '%'
                    }
                },
                // { subscriptionExpiredDate: { $gte: datetime } }, { subscriptionExpiredDate: { $eq: undefined } }, { subscriptionExpiredDate: { $eq: null } }
            ]
        }

        if (data.forSell) {
            if (data.forSell == true || data.forSell == 'true') {
                query.forSell = true;
            } else {
                query.forSell = false;
            }
        }
        if (data.forLease) {
            if (data.forLease == true || data.forLease == 'true') {
                query.forLease = true;
                query.availableTill = { $lte: new Date(date + "T23:59:59+05:30") };
            } else {
                query.forLease = false;
            }
        } else {
            query.availableTill = { $lte: new Date(date + "T23:59:59+05:30") };
        }

        Lands.count(query).exec(function (err, total) {
            if (err) {
                return res.jsonx({
                    success: false,
                    code: 400,
                    error: err
                });
            } else {
                Lands.find(query, { fields: ['title', 'area', 'areaUnit', 'leasePriceDisplay', 'sellPriceDisplay', 'leaseLandingPriceDisplay', 'sellLandingPriceDisplay', 'approvalStatus', 'address', 'city', 'district', 'coverImage', 'image', 'availableArea', 'leasePriceUnit'] }).populate('user', { select: ['fullName', 'mobile', 'email'] }).populate('soilType', { select: ['name', 'id'] }).sort(sortBy).skip(skipNo).limit(count).exec(function (err, lands) {
                    if (err) {
                        return res.jsonx({
                            success: false,
                            code: 400,
                            error: err
                        });
                    } else {
                        return res.jsonx({
                            success: true,
                            data: lands,
                            total: total

                        });
                    }
                })
            }
        })
    },
    compareLand: function (data, context, req, res) {
        let ids = '';
        if (data.ids) ids = JSON.parse(data.ids);

        console.log(ids, '====')
        let idsList = [];
        ids.forEach((obj, i) => {
            idsList.push(ObjectId(obj))
        });
        if (idsList.length > 1 && idsList.length < 6) {
            let Qry = {};
            Qry.id = { "$in": idsList };
            console.log(Qry, 'qry===');
            Lands.find(Qry, { fields: ['code', 'title', 'area', 'availableArea', 'areaUnit', 'leasePriceDisplay', 'sellPriceDisplay', 'leaseLandingPriceDisplay', 'sellLandingPriceDisplay', 'approvalStatus', 'address', 'district', 'state', 'coverImage', 'user', 'forSell', 'forLease', 'soilType', 'availableFrom', 'availableTill', 'images', 'videos', 'sourceOfIrrigation', 'tubewell', 'isElectricity', 'suitableCrops', 'leasePriceUnit'] }).populate('soilType', { select: ['name'] }).then(function (data) {
                const sortBy = (array, values, key = 'id') => ((map) => values.reduce((a, i) =>
                    a.push(map[i]) && a, []))(array.reduce((a, i) => (a[i[key]] = i) && a, {}));
                let newdata = sortBy(data, idsList)

                return res.jsonx({
                    success: true,
                    data: newdata,


                });
            })

        } else {
            return res.jsonx({
                success: false,
                code: 400,
                error: 'please enter min 2 and maximum 6 land ids '

            })
        }
    }
};

var sendEmail = function (data, user, req, res) {


    let email = user;
    message = 'Hello!';
    message += '<br/><br/>';
    message += 'Buyer agreement: Terms & Conditions';
    message += '<br/><br/>';
    message += data.buyerterms ? data.buyerterms : '';
    message += '<br/><br/>';
    message += 'Regards';
    message += '<br/><br/>';
    message += 'FarmX Support Team';

    let emailMessage = {
        from: sails.config.appSMTP.auth.user,
        to: email,
        //to: 'arun.dixit@efarmexchange.com',
        subject: 'FarmX: Land agreement: Terms & Conditions - for land id ' + data.code,
        html: message,
    };
    transport.sendMail(emailMessage, function (err, info) {
        if (err) {
            //msg = "There is some error to send mail to your email id.";
            return res.jsonx(err);
        } else {
            return res.jsonx(
                {
                    success: true,
                    message: "email send successfully"
                }
            )
        }
    });
}

var changeNumberFormat = function (val) {
    if (val >= 10000000) val = (val / 10000000) + ' Cr';
    else if (val >= 100000) val = (val / 100000) + ' Lac';
    else if (val >= 1000) val = (val / 1000) + ' K';
    return val;
}

var landBasicDisplayCondition = function () {
    let qry = {}
    qry.isDeleted = false;
    qry.availableArea = { "$gt": 0 };
    qry.isDeleted = false;
    //qry.isApproved = true;
    qry.isExpired = false;
    return qry;
}

var parseIn = function (date_time) {
    var d = new Date();
    d.setHours(date_time.substring(11, 13));
    d.setMinutes(date_time.substring(14, 16));

    return d;
}

//make list
var getTimeIntervals = function (time1, time2, slotsInMinute) {
    var arr = [];
    while (time1 < time2) {
        // console.log(time1.toLocaleString('en-IST', { hour: 'numeric', minute: 'numeric', hour12: true }), 'localstirg')
        let slot = {};
        slot.startTime = time1.toLocaleString('en-IST', { hour: 'numeric', minute: 'numeric', hour12: true });
        time1.setMinutes(time1.getMinutes() + slotsInMinute);
        slot.endTime = time1.toLocaleString('en-IST', { hour: 'numeric', minute: 'numeric', hour12: true });
        arr.push(slot);
        // time1.setMinutes(time1.getMinutes() + slotsInMinute);
    }
    return arr;
}



