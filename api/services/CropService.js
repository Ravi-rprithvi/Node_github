/**
  * #DESC:  In this class/files crops related functions
  * #Request param: Crops add form data values
  * #Return : Boolen and sucess message
  * #Author: Rohitk.kumar
  */

var Promise = require('bluebird'),
    promisify = Promise.promisify;
var constantObj = sails.config.constants;
var minBidAmountePercentage = 5;
var commonServiceObj = require('./commonService');
var client = require('twilio')(constantObj.twillio.accountSid, constantObj.twillio.authToken);
var pushService = require('./PushService');

getCrop = function (Id) {
    return API.Model(Crops).findOne(Id).then(function (crop) {
        return crop;
    });
};

var updateSellerCodeFirstTime = function (sellerId, indo) {

    return Users.update({ id: sellerId }, { userType: indo }).then(function (res) {
        return res;
    });
};


module.exports = {
    bulkUploadProduct: function (data, context, req, res) {
        var date = new Date();
        Settings.find({ type: 'crop' }).then(function (settingsAry) {
            if (settingsAry && settingsAry.length > 0) {

                let settings = settingsAry[0].crop;

                data.terms = settings.terms || '';
                data.paymentTerms = settings.paymentTerms || '';
                data.logisticsTerms = settings.logisticsTerms || '';
                // data.bidEarnestPercent = settings.earnestPercent ||  tsConstants.BID_EARNEST_PERCENT;
                data.bidEarnestAmount = settings.earnestAmount || 1;
                data.depositPayment = settings.depositPayment || [];
                data.insurancePercent = settings.insurancePercent;
                data.efarmxComission = settings.efarmxComission;// ||  tsConstants.EFARMX_COMISSION;
                data.efarmxLogisticPercentage = settings.efarmxLogisticPercentage || 0;
                data.taxRate = settings.taxRate;// || tsConstants.TAX_RATE;
                data.finalPaymentDays = settings.finalPaymentDays;
                data.franchiseePercentage = settings.franchiseePercentage;
                data.cartEarnestAmount = settings.cartEarnestAmount;
                data.cartFinalPaymentDays = settings.cartFinalPaymentDays;

                let seller = settings.seller;
                data.sellerUpfrontPercentage = seller.upfrontPercentage;
                data.sellerUpfrontDays = seller.upfrontDays;
                data.sellerFinalPercentage = seller.finalPercentage;
                data.sellerFinalDays = seller.finalDays;
                data.sellerDepositPayment = seller.depositPayment || [];

            }
            const csv = require('csv-parser')
            const fs = require('fs')
            const results = [];
            let productSheet = data.productSheet;

            var request = require('request');
            request.get(productSheet, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var csvData = body;

                    console.log(csvData);
                    var lines = csvData.split("\n");

                    var result = [];
                    var headers = lines[0].split(",");

                    for (var i = 1; i < lines.length; i++) {

                        var obj = {};
                        var currentline = lines[i].split(",");

                        for (var j = 0; j < headers.length; j++) {
                            obj[headers[j]] = currentline[j];
                        }

                        result.push(obj);

                    }


                }

                // })

                // let productSheet = 'assets/product-upload-framx.csv';
                if (productSheet) {

                    //console.log(productSheet, 'productSheet====')
                    //fs.createReadStream(productSheet)
                    // .pipe(csv())
                    // .on('data', (data1) => results.push(data1))
                    // .on('end', () => {
                    // console.log(results);

                    // xlsxFile(productSheet).then((rows) => {
                    // console.log(rows, 'row===')
                    let finalData = [];
                    async.each(result, function (row, cb) {
                        if (row.pincode) {
                            console.log(row, 'row')
                            //finalData.push(row);

                            let cropData = {};
                            cropData.minBidAmount = row.minBidAmount || 0;
                            var offerPrice = parseFloat(row.price);
                            var bidEarnestAmount = (offerPrice / 100) * 2;
                            cropData.bidEarnestAmount = bidEarnestAmount;
                            let catQry = {}
                            let catnames = row.name.split(" ");
                            let catName;
                            let catName1 = null;
                            if (catnames.length > 0) {
                                catName = catnames[0];
                                catName1 = catnames[1]
                            } else {
                                catName = row.name
                            }


                            catQry.$or = [{ name: { $regex: new RegExp(catName, 'i') } }, { name: { $regex: new RegExp(catName1, 'i') } }, { variety: row.variety }]

                            console.log(catQry, '++++++++++');
                            Category.findOne(catQry).then(function (categoryData) {
                                if (categoryData) {
                                    //match category
                                    let variety = categoryData.variety;
                                    cropData.variety = row.variety;
                                    let updateCategoryStatus = false;
                                    let updateCate = {};
                                    // console.log(variety.includes(row[6]), 'variety====', variety)
                                    if (variety.includes(row.variety) == false) {
                                        categoryData.variety.push(row.variety)
                                        updateCate.variety = categoryData.variety;
                                        updateCategoryStatus = true;
                                        // console.log(updateCate, 'pdatecat====', categoryData.variety)
                                    }


                                    cropData.category = categoryData.id;
                                    cropData.name = row.name
                                    cropData.quantityUnit = row.quantityUnit;
                                    cropData.otherResource = true;
                                    var dateChanged = new Date(row.endDate);
                                    cropData.endDate = dateChanged;
                                    cropData.bidEndDate = dateChanged;
                                    cropData.terms = constantObj.terms_and_condition.text;

                                    code = commonServiceObj.getUniqueCode();
                                    cropData.code = code;
                                    var pincode = parseInt(row.pincode);
                                    var query = {};
                                    query.pincode = { "$in": [pincode] };


                                    if (row.images && row.images.length > 0) {
                                        data.coverImage = row['images'][0]
                                    }

                                    // console.log("query",query);
                                    // console.log("data",data);

                                    Market.find(query).then(function (m) {
                                        var marketIds = [];
                                        var marketWithGMIds = [];

                                        m.forEach(function (item) {
                                            marketIds.push(item.id);
                                            if (item.GM != undefined) {
                                                marketWithGMIds.push(item.id)
                                            }
                                        });

                                        let selectedmaarketgm = undefined

                                        Users.find({ roleId: constantObj.staticRoles.ADMIN_CROP, markets: { "$in": marketIds } }).then(function (u) {

                                            if (u != undefined && u.length > 0) {
                                                var userCount = u.length
                                                var randnumber = Math.floor(Math.random() % userCount)
                                                var userObject = u[randnumber];
                                                cropData.transactionOwner = userObject.id;
                                            }
                                            if (marketWithGMIds != undefined && marketWithGMIds.length > 0) {
                                                var mrandnumber = Math.floor(Math.random() % marketWithGMIds.length)
                                                cropData.market = marketWithGMIds[mrandnumber]
                                                selectedmaarketgm = marketWithGMIds[mrandnumber].GM
                                            }
                                            // console.log({ uploadBy: row[0], fpo: row[1], roles: 'U', userType: 'fpo' })
                                            Users.findOne({ uploadBy: row.domain, fpo: row.fpo, roles: 'U', userType: 'fpo' }).then(function (checkSeller) {
                                                if (checkSeller) {
                                                    console.log(checkSeller, 'checkSellerCropAlready===')

                                                    cropData.seller = checkSeller.id;
                                                    cropData.leftAfterAcceptanceQuantity = row.quantity
                                                    cropData.leftAfterDeliveryQuantity = row.quantity
                                                    // Save crop


                                                    commonService.getDataFromPincode(row.pincode).then(function (pincodeInfo) {
                                                        let pincodeData = pincodeInfo;
                                                        if (pincodeData == 'error') {

                                                            return cb();
                                                        } else {

                                                            cropData["state"] = pincodeData["statename"];
                                                            cropData["district"] = pincodeData["Districtname"];
                                                            cropData["city"] = pincodeData["Taluk"];
                                                            cropData["address"] = row.address;
                                                            cropData['pincode'] = row.pincode;

                                                            console.log(cropData, 'cropData')
                                                            Crops.findOne({ seller: cropData.seller, name: cropData.name }).then(function (crop) {
                                                                if (crop) {

                                                                    Crops.update({ id: crop.id }, cropData).then(function (updatedCrop) {
                                                                        row['comment'] = "Crop updated successfully";
                                                                        finalData.push(row);
                                                                        return cb();
                                                                    })

                                                                }
                                                                else {
                                                                    Crops.create(cropData).then(function (crop) {
                                                                        row['comment'] = "Successfully uploaded";
                                                                        finalData.push(row);
                                                                        if (updateCategoryStatus) {
                                                                            Category.update({ id: categoryData.id }, updateCate).then(function (catu) {
                                                                                return cb();
                                                                            })
                                                                        } else {
                                                                            return cb();
                                                                        }
                                                                    }).fail(function (err) {
                                                                        return res.jsonx({
                                                                            success: false,
                                                                            error: err
                                                                        })
                                                                    })



                                                                }
                                                            })


                                                        }
                                                    })
                                                } else {
                                                    row['comment'] = "Given fpo not registered with us";
                                                    finalData.push(row);
                                                    return cb();
                                                }

                                            });
                                        })
                                    });   // get user of markets 

                                }
                                else {
                                    //category not found 
                                    row['comment'] = "Category not found please contact to admin"
                                    finalData.push(row);
                                    return cb();
                                }
                            })
                        } else {
                            return cb();
                        }
                    }, function (error) {
                        // console.log("aauya====", finalData)
                        if (error) {
                            return res.jsonx({
                                success: false,
                                error: error
                            })
                        } else {
                            // var fs = require('fs');
                            let ressponsseFilePath = 'assets/product-response.csv';
                            // xlsxFile.writeFile(rows, 'out.xlsx');

                            const createCsvWriter = require('csv-writer').createObjectCsvWriter;
                            const csvWriter = createCsvWriter({
                                path: ressponsseFilePath,
                                header: [
                                    { id: 'domain', title: 'Domain' },
                                    { id: 'fpo', title: 'FPO' },
                                    { id: 'address', title: 'Address' },
                                    { id: 'availableFrom', title: 'availableFrom' },
                                    { id: 'availableUnit', title: 'availableUnit' },
                                    { id: 'category', title: 'category' },
                                    { id: 'variety', title: 'variety' },
                                    { id: 'declaration', title: 'declaration' },
                                    { id: 'description', title: 'description' },
                                    { id: 'documents', title: 'documents' },
                                    { id: 'endDate', title: 'endDate' },
                                    { id: 'gifimages', title: 'gifimages' },
                                    { id: 'grade', title: 'grade' },
                                    { id: 'images', title: 'images' },
                                    { id: 'minBidAmount', title: 'minBidAmount' },
                                    { id: 'name', title: 'name' },
                                    { id: 'pincode', title: 'pincode' },
                                    { id: 'price', title: 'price' },
                                    { id: 'quantity', title: 'quantity' },
                                    { id: 'quantityUnit', title: 'quantityUnit' },
                                    { id: 'imageBaseUrl', title: 'imageBaseUrl' },
                                    { id: 'comment', title: 'comment' }

                                ]
                            });

                            csvWriter
                                .writeRecords(finalData)
                                .then(() => {
                                    console.log('The CSV file was written successfully')
                                    return res.jsonx({
                                        success: true,
                                        data: sails.config.PAYTM_API_URL
                                            + "/" + 'product-response.csv',

                                    })
                                });

                            // fs.writeFileSync(ressponsseFilePath, finalData.join('\n'), 'binary')
                            // return res.jsonx({
                            //     success: true,
                            //     data: ressponsseFilePath
                            // })




                        }

                    })

                    // })
                } else {
                    return res.jsonx({
                        success: false,
                        error: 'Please send sheet url'
                    })
                }
            })
        }); // get markets for perticuler pincode
    },
    getPublicCrops: function (data, context, req, res) {
        let mobile = data.mobile;
        let email = data.email;
        let query = {}
        if (email) {
            query.email = email;
        }
        if (mobile) {
            query.mobile = mobile;
        }
        Users.findOne(query).then(function (user) {
            if (user) {
                let id = user.id;
                let qry = {};
                qry.seller = id;
                Crops.find(qry).then(function (crops) {
                    return res.jsonx({
                        success: true,
                        data: crops
                    })
                })
            } else {
                return res.jsonx({
                    success: false,
                    error: 'Your not authorized'
                })
            }
        })

    },
    save: function (data, context) {
        var date = new Date();
        return Settings.find({ type: 'crop' }).then(function (settingsAry) {
            if (settingsAry && settingsAry.length > 0) {

                let settings = settingsAry[0].crop;

                data.terms = settings.terms || '';
                data.paymentTerms = settings.paymentTerms || '';
                data.logisticsTerms = settings.logisticsTerms || '';
                // data.bidEarnestPercent = settings.earnestPercent ||  tsConstants.BID_EARNEST_PERCENT;
                data.bidEarnestAmount = settings.earnestAmount || 1;
                data.depositPayment = settings.depositPayment || [];
                data.insurancePercent = settings.insurancePercent;
                data.efarmxComission = settings.efarmxComission;// ||  tsConstants.EFARMX_COMISSION;
                data.efarmxLogisticPercentage = settings.efarmxLogisticPercentage || 0;
                data.taxRate = settings.taxRate;// || tsConstants.TAX_RATE;
                data.finalPaymentDays = settings.finalPaymentDays;
                data.franchiseePercentage = settings.franchiseePercentage;
                data.cartEarnestAmount = settings.cartEarnestAmount;
                data.cartFinalPaymentDays = settings.cartFinalPaymentDays;

                let seller = settings.seller;
                data.sellerUpfrontPercentage = seller.upfrontPercentage;
                data.sellerUpfrontDays = seller.upfrontDays;
                data.sellerFinalPercentage = seller.finalPercentage;
                data.sellerFinalDays = seller.finalDays;
                data.sellerDepositPayment = seller.depositPayment || [];

            }

            if (data.minBidAmount == undefined || data.minBidAmount == null) {
                data.minBidAmount = 0.9 * data.price
            }

            if (!data.bidEarnestAmount) {
                var offerPrice = parseFloat(data.price);
                var bidEarnestAmount = (offerPrice / 100) * 2;
                data.bidEarnestAmount = bidEarnestAmount;
            }
            data.categoryId = data.category;

            if (data.endDate) {
                var dateChanged = new Date(data.endDate);
                data.endDate = dateChanged;
                if (data.bidEndDate == undefined || data.bidEndDate == null) {
                    data.bidEndDate = dateChanged;
                }
            } else if (data.availablePeriod) {

                var availObj = data.availableFrom;
                var availableRange = parseInt(data.availablePeriod);
                var dateChanged = new Date(availObj);

                if (data.availableUnit == "Days") {
                    dateChanged.setDate(dateChanged.getDate() + availableRange);
                } else if (data.availableUnit == "Month") {
                    dateChanged.setMonth(dateChanged.getMonth() + availableRange);
                } else if (data.availableUnit == "Year") {
                    dateChanged.setFullYear(dateChanged.getFullYear() + availableRange);
                } else {
                    dateChanged.setDate(dateChanged.getDate() + availableRange);
                }

                data.endDate = dateChanged;

            } else {
                data.endDate = null;
            }

            if (!data.terms) {
                data.terms = constantObj.terms_and_condition.text;
            }

            reWhiteSpace = new RegExp(/^\s+$/);
            // Check for white space
            if (reWhiteSpace.test(data.name)) {
                return {
                    success: false,
                    code: 401,
                    message: constantObj.messages.SPACE_NOT_ALLOWED,
                    key: 'SPACE_NOT_ALLOWED',
                };
            }

            code = commonServiceObj.getUniqueCode();
            data.code = code;
            var pincode = JSON.parse(data.pincode);
            var query = {};
            query.pincode = { "$in": [pincode] };
            // query.$and = [{GM:{$ne:undefined}},{GM:{$ne:null}}]

            if (data.allImages) {
                delete data.allImages
            }

            if (data.images && data.images.length > 0) {
                data.coverImage = data.images[0]
            }

            // console.log("query",query);
            // console.log("data",data);

            return Market.find(query).then(function (m) {
                var marketIds = [];
                var marketWithGMIds = [];

                m.forEach(function (item) {
                    marketIds.push(item.id);
                    if (item.GM != undefined) {
                        marketWithGMIds.push(item.id)
                    }
                });

                let selectedmaarketgm = undefined

                return Users.find({ roleId: constantObj.staticRoles.ADMIN_CROP, markets: { "$in": marketIds } }).then(function (u) {

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
                    }
                    //  console.log(data.seller, 'sellerid')
                    return Users.findOne({ id: data.seller, roles: 'U' }, { fields: ['userType', 'pincode', 'state', 'district'] }).then(function (checkSellerCropAlready) {


                        let needtoupdateusertype = true;
                        let usertype = 'farmer'
                        if (checkSellerCropAlready.userType != undefined) {

                            if (checkSellerCropAlready.userType == 'farmer' || checkSellerCropAlready.userType == 'both') {
                                needtoupdateusertype = false;
                            } else if (checkSellerCropAlready.userType == 'cropbuyer') {
                                needtoupdateusertype = true;
                                usertype = 'both'
                            }
                        } else {
                            needtoupdateusertype = true;
                        }


                        if (needtoupdateusertype) {
                            updateSellerCodeFirstTime(data.seller, usertype);
                        }

                        data.leftAfterAcceptanceQuantity = data.quantity
                        data.leftAfterDeliveryQuantity = data.quantity
                        // Save crop

                        let pincode = data.pincode;
                        if (checkSellerCropAlready.pincode != undefined && pincode != undefined && checkSellerCropAlready.pincode == pincode && checkSellerCropAlready.state != undefined && checkSellerCropAlready.district != undefined && checkSellerCropAlready.state != null && checkSellerCropAlready.district != null) {
                            if (data.state == undefined || data.state == "" || data.state == null) {
                                data.state = checkSellerCropAlready.state
                            }
                            if (data.district == undefined || data.district == "" || data.district == null) {
                                data.district = checkSellerCropAlready.district
                            }
                            //console.log(data, 'cropdata=====')

                            return Crops.create(data).then(function (crop) {
                                if (crop) {
                                    var msg = "A new crop " + crop.name + " with id " + crop.code + " has been added under " + crop.variety + " variety. FarmX will look into it for approval.";

                                    var notificationData = {};
                                    notificationData.productId = crop.id;
                                    notificationData.crop = crop.id;
                                    notificationData.sellerId = crop.seller;
                                    notificationData.user = crop.seller;
                                    notificationData.productType = "crops";
                                    //notificationData.transactionOwner = u[0].id;
                                    notificationData.transactionOwner = crop.transactionOwner;
                                    notificationData.message = msg;
                                    notificationData.messageKey = "CROP_ADDED_NOTIFICATION"
                                    notificationData.readBy = [];
                                    notificationData.messageTitle = 'Crop added'
                                    let pushnotreceiver = [crop.seller]
                                    if (selectedmaarketgm != undefined) {
                                        pushnotreceiver.push(selectedmaarketgm)
                                    }

                                    return Notifications.create(notificationData).then(function (notificationResponse) {

                                        if (notificationResponse) {
                                            commonService.notifyUsersFromNotification(notificationResponse, crop)
                                            pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                        }
                                        if (notificationResponse) {
                                            crop.userType = usertype;
                                            console.log(usertype, 'usertype====')
                                            // return Users.find({ markets: { "$in": marketIds } }).then(function (areaAdmins) {
                                            return {
                                                success: true,
                                                code: 200,
                                                message: constantObj.crops.ADDED_CROP,
                                                key: "ADDED_CROP",
                                                data: crop,
                                            }
                                            // });
                                        }
                                    })
                                } else {
                                    return {
                                        success: false,
                                        error: {
                                            code: 404,
                                            message: constantObj.messages.NOT_FOUND,
                                            key: 'NOT_FOUND',
                                        },
                                    };
                                }

                            }).fail((err) => {
                                return { "success": false, "error": { "code": 501, "message": "Invalid pincode." } }
                            })
                        } else if (pincode) {
                            var request = require('request');
                            let prom = new Promise((resolve, reject) => {
                                request('https://api.postalpincode.in/pincode/' + pincode, function (error, response, body) {
                                    if (body) {
                                        let addr = JSON.parse(body);
                                        if (addr.length > 0 && addr[0]['Status'] == 'Success' && addr[0]["PostOffice"].length > 0) {

                                            if (data["state"] == "" || data.state == undefined) {
                                                data["state"] = addr[0]["PostOffice"][0]["State"];
                                            }
                                            if (data.district == undefined || data["district"] == "") {
                                                data["district"] = addr[0]["PostOffice"][0]["District"];
                                            }
                                            Crops.create(data).then(function (crop) {
                                                if (crop) {
                                                    var msg = "A new crop " + crop.name + " with id " + crop.code + " has been added under " + crop.variety + " variety. eFarmX will look into it for approval.";

                                                    var notificationData = {};
                                                    notificationData.productId = crop.id;
                                                    notificationData.crop = crop.id;
                                                    notificationData.sellerId = crop.seller;
                                                    notificationData.user = crop.seller;
                                                    notificationData.productType = "crops";
                                                    //notificationData.transactionOwner = u[0].id;
                                                    notificationData.transactionOwner = crop.transactionOwner;
                                                    notificationData.message = msg;
                                                    notificationData.messageKey = "CROP_ADDED_NOTIFICATION"
                                                    notificationData.readBy = [];
                                                    notificationData.messageTitle = 'Crop added'
                                                    let pushnotreceiver = [crop.seller]
                                                    if (selectedmaarketgm != undefined) {
                                                        pushnotreceiver.push(selectedmaarketgm)
                                                    }

                                                    Notifications.create(notificationData).then(function (notificationResponse) {
                                                        if (notificationResponse) {
                                                            commonService.notifyUsersFromNotification(notificationResponse, crop)
                                                            pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                                        }
                                                        if (notificationResponse) {

                                                            // Users.find({ markets: { "$in": marketIds } }).then(function (areaAdmins) {

                                                            resolve({
                                                                success: true,
                                                                code: 200,
                                                                message: constantObj.crops.ADDED_CROP,
                                                                key: "ADDED_CROP",
                                                                data: crop,
                                                            })
                                                            // });
                                                        }
                                                    })

                                                    resolve({
                                                        success: true,
                                                        code: 200,
                                                        message: constantObj.crops.ADDED_CROP,
                                                        key: "ADDED_CROP",
                                                        data: crop,
                                                    })
                                                } else {
                                                    reject({
                                                        success: false,
                                                        error: {
                                                            code: 404,
                                                            message: constantObj.messages.NOT_FOUND,
                                                            key: 'NOT_FOUND',
                                                        },
                                                    });
                                                }
                                            }).fail((err) => {

                                                reject({
                                                    success: false,
                                                    error: err
                                                });
                                            })
                                        } else {
                                            reject({ "success": false, "error": { "code": 501, "message": "Invalid pincode." } });
                                        }
                                    } else {
                                        reject({ "success": false, "error": { "code": 501, "message": "Invalid pincode." } });
                                    }
                                })

                            })
                            return prom.then(function (success) {
                                return success
                            }).catch(function (err) {
                                return err
                            })

                        } else {
                            return { "success": false, "error": { "code": 501, "message": "Invalid pincode." } }
                        }
                    });
                })
            });   // get user of markets         
        }); // get markets for perticuler pincode
    },

    list: function (data, context) {

        return Crops.find({ "isDeleted": false }).populate('user').populate('category')
            .then(function (crops) {
                var result;
                if (crop) {
                    result = {
                        success: true,
                        code: 200,
                        data: crop,
                    }

                } else {
                    result = {
                        success: false,
                        error: {
                            code: 404,
                            message: constantObj.messages.NOT_FOUND,
                            key: 'NOT_FOUND',
                        },
                    };
                }
                return result;

            });
    },

    update: function (data, context) {

        var approvedBy = context.identity.id;

        var findCropQry = {}
        findCropQry.id = data.id

        return Crops.findOne(findCropQry).then(function (cropInfo) {

            if (data.availablePeriod) {
                var availObj = data.availableFrom;
                var availableRange = parseInt(data.availablePeriod);
                var dateChanged = new Date(availObj);

                if (data.availableUnit == "Days") {
                    dateChanged.setDate(dateChanged.getDate() + availableRange);
                } else if (data.availableUnit == "Month") {
                    dateChanged.setMonth(dateChanged.getMonth() + availableRange);
                } else if (data.availableUnit == "Year") {
                    dateChanged.setFullYear(dateChanged.getFullYear() + availableRange);
                }

                data.endDate = dateChanged;
                // } else {
                //     data.endDate = null;
            }
            data.categoryId = data.category;
            if (data.quantity) {
                let quantityChangedBy = data.quantity - cropInfo.quantity
                data.leftAfterDeliveryQuantity = cropInfo.leftAfterDeliveryQuantity + quantityChangedBy
                data.leftAfterAcceptanceQuantity = cropInfo.leftAfterAcceptanceQuantity + quantityChangedBy
            }

            if (data.endDate) {
                var dateChanged = new Date(data.endDate);
                data.endDate = dateChanged;
                if (data.bidEndDate == undefined || data.bidEndDate == null) {
                    data.bidEndDate = dateChanged;
                }
            } else if (data.bidEndDate) {
                data.bidEndDate = new Date(data.bidEndDate)
            } else if (data.bidEndDays) {
                if (cropInfo.approvedOn) {
                    var approvedOn = cropInfo.approvedOn;
                    // var approvedOn = cropInfo.updatedAt;
                    var bidEndRange = parseInt(data.bidEndDays);
                    var newBidEndDate;

                    // if(cropInfo.bidEndDate){
                    //     let lastBidEndate = cropInfo.bidEndDate ;

                    //     if(lastBidEndate > new Date() ){
                    //         newBidEndDate = new Date(lastBidEndate);
                    //     }else if(lastBidEndate < new Date() ){
                    //         newBidEndDate = new Date();
                    //     }
                    // }else{
                    //     newBidEndDate = new Date();
                    // }

                    if (data.availableFrom) {
                        var availObj = data.availableFrom;
                        newBidEndDate = new Date(availObj);
                    } else {
                        var availObj = cropInfo.availableFrom;
                        newBidEndDate = new Date(availObj);
                    }


                    if (data.bidEndDaysUnit == "Days") {
                        newBidEndDate.setDate(newBidEndDate.getDate() + bidEndRange);
                    } else if (data.bidEndDaysUnit == "Month") {
                        newBidEndDate.setMonth(newBidEndDate.getMonth() + bidEndRange);
                    } else if (data.bidEndDaysUnit == "Year") {
                        newBidEndDate.setFullYear(newBidEndDate.getFullYear() + bidEndRange);
                    }

                    if (newBidEndDate > new Date() && data.leftAfterAcceptanceQuantity > 0) {
                        if (cropInfo.isExpired == true) {
                            data.createdAt = new Date();
                        }
                        data.isExpired = false;
                    }

                    data.bidEndDate = newBidEndDate

                }
            }

            if (data.images && data.images.length > 0 && (data.coverImage == undefined || data.coverImage == null) && (cropInfo.coverImage == undefined || cropInfo.coverImage == null)) {
                data.coverImage = data.images[0]
            }
            if (data.coverImage == undefined) {
                if (data.images && data.images.length > 0) {
                    if (cropInfo.coverImage) {
                        const index = data.images.indexOf(cropInfo.coverImage);
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

            //console.log(data)
            // if (data.allImages == undefined) {
            //     if (data.images && data.images.length > 0) {
            //         var imagesToAdd = []
            //         for (var i = 0; i < data.images.length; i++) {
            //             let link = { image: data.images[i], status: false }
            //             imagesToAdd.push(link)
            //         }
            //         data.allImages = imagesToAdd
            //     }
            // }

            if (cropInfo.aggregatedCrops) {
                data.isApproved = false
            }

            delete data.postedTotal
            return Crops.update({ id: data.id }, data).then(function (crop) {
                if (crop) {
                    var msg = "Crop " + crop[0].name + " with id " + crop[0].code + " is updated. ";

                    var notificationData = {};
                    notificationData.productId = crop[0].id;
                    notificationData.crop = crop[0].id;
                    notificationData.sellerId = crop[0].seller;
                    notificationData.user = crop[0].seller;
                    notificationData.productType = "crops";
                    notificationData.message = msg;
                    notificationData.messageKey = "CROP_UPDATED_NOTIFICATION"
                    notificationData.readBy = [];
                    notificationData.messageTitle = 'Crop updated'

                    return Notifications.create(notificationData).then(function (notificationResponse) {
                        if (notificationResponse) {
                            commonService.notifyUsersFromNotification(notificationResponse, crop[0])
                        }
                        return {
                            success: true,
                            code: 200,
                            message: constantObj.crops.UPDATED_CROP,
                            key: 'UPDATED_CROP',
                            data: crop
                        }
                    })

                } else {
                    return {
                        success: false,
                        error: {
                            code: 4042222,
                            message: constantObj.messages.NOT_FOUND,
                            key: 'NOT_FOUND'
                        }
                    };
                }

                return result;
            }).fail(function (error) {
                return {
                    success: false,
                    error: {
                        code: 4042,
                        message: error
                    }
                };
            });
        }).fail(function (err) {
            return {
                success: false,
                error: {
                    code: 4043,
                    message: err
                }
            };
        });
    },

    adminCropDetail: function (data, context) {
        let cropId = data.id
        if (cropId == undefined || cropId == null) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: "Please provide cropId"
                },
            };
        }

        return Crops.findOne({ id: cropId }).populate('seller', { select: ['fullName', 'mobile', 'email'] }).populate('market', { select: ['name', 'GM'] })
            .populate('category').then(function (crop) {
                if (crop) {
                    if (crop.aggregatedCrops && crop.aggregatedCrops.length > 0) {
                        let query = { id: { $in: crop.aggregatedCrops } }

                        let selectedFields = ['code', 'name', 'images', 'coverImage', 'bidEndDate', 'leftAfterAcceptanceQuantity', 'quantity', 'address', 'city', 'pincode', 'seller', 'price', 'grade']

                        return Crops.find(query, { fields: selectedFields }).populate('seller', { select: ['fullName', 'address', 'city', 'pincode', 'mobile', 'email'] }).then(function (allcrops) {
                            // let sellers = []
                            // for (var i = 0; i < allcrops.length; i++) {
                            //     sellers.push(allcrops[i].seller)
                            // }
                            crop.aggregatedCrops = allcrops
                            // crop.sellers = sellers
                            return {
                                success: true,
                                code: 200,
                                data: crop
                            }
                        })
                    } else if (crop.aggregations && crop.aggregations.length > 0) {
                        let query = { id: { $in: crop.aggregations } }

                        let selectedFields = ['code', 'name', 'images', 'coverImage', 'bidEndDate', 'leftAfterAcceptanceQuantity', 'leftAfterAcceptanceQuantitiesParts', 'quantity', 'address', 'city', 'pincode', 'seller', 'price', 'grade']

                        return Crops.find(query, { fields: selectedFields }).populate('seller', { select: ['fullName', 'address', 'city', 'pincode', 'mobile', 'email'] }).then(function (allcrops) {
                            // let sellers = []
                            // for (var i = 0; i < allcrops.length; i++) {
                            //     sellers.push(allcrops[i].seller)
                            // }
                            crop.aggregations = allcrops
                            // crop.sellers = sellers
                            return {
                                success: true,
                                code: 200,
                                data: crop
                            }
                        })
                    } else {
                        return {
                            success: true,
                            code: 200,
                            data: crop
                        }
                    }
                } else {
                    return {
                        success: false,
                        error: {
                            code: 404,
                            message: constantObj.messages.NOT_FOUND,
                            key: 'NOT_FOUND',
                        },
                    }
                }
            })
    },

    delete: function (data, context) {

        return API.Model(Crops).update(data.id, data).then(function (crop) {
            var Report;
            if (crop) {
                var msg = "Crop " + crop[0].name + " with id " + crop[0].code + " is deleted. ";

                var notificationData = {};
                notificationData.productId = crop[0].id;
                notificationData.crop = crop[0].id;
                notificationData.sellerId = crop[0].seller;
                notificationData.user = crop[0].seller;
                notificationData.productType = "crops";
                notificationData.message = msg;
                notificationData.messageKey = "CROP_DELETED_NOTIFICATION"
                notificationData.readBy = [];
                notificationData.messageTitle = 'Crop deleted'
                let pushnotreceiver = [crop[0].seller]

                return Notifications.create(notificationData).then(function (notificationResponse) {
                    if (notificationResponse) {
                        commonService.notifyUsersFromNotification(notificationResponse, crop[0])
                        pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                    }
                    Report = {
                        "success": {
                            "Code": 200,
                            "Message": "Deleted"
                        }
                    }

                    return Bids.find({ crop: crop.id, status: 'Pending' }).then(function (bids) {

                        async.each(bids, function (bid, callback) {
                            bid.comment = "Crop was removed from system."
                            BidService.failedBid(bid, context).then(function (returnD) {
                                callback()
                            }).fail(function (failed) {
                                callback()
                            })
                        }, function (error) {
                            return {
                                "Status": true,
                                Report
                            };
                        });

                    }).fail(function (err) {
                        return {
                            "Status": true,
                            Report
                        };
                    })
                })
            } else {
                Report = {
                    "error": {
                        "Code": 301,
                        "Message": "Faild"
                    }
                }

                return {
                    "Status": true,
                    Report
                };
            }
        });
    },

    showInPincode: function (userPincode, pincode, userBid, req, res) {
        let Id = req.param('id');
        let pctofind = pincode
        if (userPincode) {
            pctofind = userPincode
        }
        if (pctofind != null) {
            Market.find({ select: ['id'], where: { pincode: { "$in": [JSON.parse(pincode)] } } }).then(function (markesId) {
                if (markesId.length > 0) {
                    let markets = []
                    //  let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
                    for (var i = 0; i < markesId.length; i++) {
                        markets.push(markesId[i].id)
                    }

                    let findfcQry = {}
                    findfcQry.productId = Id
                    findfcQry.productType = 'CROPS'

                    findfcQry.market = { '$in': markets }

                    FacilitationCharges.find(findfcQry).sort({ facilitationPercentage: 1 }).then(function (fc) {
                        if (fc.length > 0) {
                            let now = new Date()
                            let fcAllotted = false
                            for (var i = 0; i < fc.length; i++) {
                                if (fc[i].validTill != undefined && fc[i].validTill != null) {
                                    if (fc[i].validTill > now) {
                                        CropService.showWithFacilitationCharges(fc[i].facilitationPercentage, userBid, req, res)
                                        fcAllotted = true
                                        break
                                    }
                                } else {
                                    CropService.showWithFacilitationCharges(fc[i].facilitationPercentage, userBid, req, res)
                                    fcAllotted = true
                                    break
                                }
                            }
                            if (!fcAllotted) {
                                CropService.showWithFacilitationCharges(null, userBid, req, res)
                            }
                        } else {
                            if (userPincode) {
                                CropService.showInPincode(null, pincode, userBid, req, res)
                            } else {
                                CropService.showWithFacilitationCharges(null, userBid, req, res)
                            }
                        }
                    })
                } else {
                    CropService.showWithFacilitationCharges(null, userBid, req, res)
                }
            })
        } else {
            CropService.showWithFacilitationCharges(null, userBid, req, res)
        }
    },

    showWithFacilitationCharges: function (facilitationCharges, userBid, req, res) {
        let pincode = req.param('pincode');

        let Id = req.param('id');
        let version = req.param('version');
        let IP = req.ip
        var viewquery = {}
        viewquery.ipAddress = IP;

        var count = 0;

        Crops.findOne(Id).populate('seller', { select: ['firstName', 'lastName', 'fullName', 'city', 'district', 'avgRating', 'ratedUsersCount', 'state', 'image', 'code', 'sellerCode', 'userUniqueId', 'about'] })
            .populate('market', { select: ['name', 'GM'] })
            .populate('category')
            .then(function (cropInfo) {
                let fuser = null
                if (cropInfo.market && cropInfo.market.GM) {
                    fuser = cropInfo.market.GM
                }
                let pId = cropInfo.category.parentId;
                Category.findOne({ id: pId }).then(function (parentCategory) {
                    // console.log(parentCategory, 'pcate====')
                    cropInfo.parentCategory = parentCategory.name;
                    Users.findOne({ id: fuser }).then(function (gmuser) {
                        let sourceP = cropInfo.pincode
                        if (gmuser && gmuser.pincode) {
                            sourceP = gmuser.pincode
                        }
                        let qry = {}
                        qry.isDeleted = false
                        let category = cropInfo.category.id

                        if (pincode) {
                            qry.destination = parseInt(pincode)
                        } else {
                            qry.destination = 0
                        }
                        qry.category = category
                        qry.source = sourceP

                        let now = new Date()

                        qry.$or = [{ validUpto: null }, { validUpto: undefined }, { validUpto: { $gt: now } }]

                        Logisticprice.find(qry).sort('load desc').then(function (lprices) {
                            if (lprices.length > 0) {
                                let lastPrice = 0
                                let lastLoad = 1
                                for (var i = 0; i < lprices.length; i++) {
                                    if (lprices[i].load > cropInfo.leftAfterAcceptanceQuantity || i == 0 || lprices[i].load == cropInfo.leftAfterAcceptanceQuantity) {
                                        lastPrice = lprices[i].price
                                        lastLoad = lprices[i].load
                                    } else {
                                        break
                                    }
                                }
                                // let generalLandingPrice = cropInfo.price + ((cropInfo.efarmxComission/100 * cropInfo.price) * (1 + cropInfo.taxRate/100)) + (lastPrice/lastLoad)
                                let generalLandingPrice = cropInfo.price + ((cropInfo.efarmxComission / 100 * cropInfo.price) * (1 + cropInfo.taxRate / 100)) + (lastPrice / cropInfo.leftAfterAcceptanceQuantity)
                                cropInfo.generalLandingPrice = parseFloat((generalLandingPrice).toFixed(2));

                                if (facilitationCharges != null) {
                                    // let userLandingPrice = cropInfo.price + ((facilitationCharges/100 * cropInfo.price) * (1 + cropInfo.taxRate/100)) + (lastPrice/lastLoad)
                                    let userLandingPrice = cropInfo.price + ((facilitationCharges / 100 * cropInfo.price) * (1 + cropInfo.taxRate / 100)) + (lastPrice / cropInfo.leftAfterAcceptanceQuantity)
                                    cropInfo.landingPrice = parseFloat((userLandingPrice).toFixed(2));
                                } else {
                                    cropInfo.landingPrice = parseFloat((generalLandingPrice).toFixed(2));
                                }
                            }

                            cropInfo.bids = [];
                            viewquery.cropId = Id;
                            totalview = cropInfo.viewed;

                            if (facilitationCharges != null) {
                                cropInfo.efarmxComission = facilitationCharges
                            }

                            let totalCrops = {};

                            totalCrops.isDeleted = false;
                            // totalCrops.isExpired = false;
                            totalCrops.isApproved = true;
                            if (cropInfo.seller) {
                                totalCrops.seller = cropInfo.seller.id;
                            }

                            Crops.count(totalCrops).exec(function (croperr, postedTotal) {
                                cropInfo.postedTotal = postedTotal
                                Cropviewed.find(viewquery).exec(function (err, response) {
                                    if (response == undefined || response == '') {
                                        if (req.param('userid')) {
                                            viewquery.userid = req.param('userid');
                                        }
                                        Cropviewed.create(viewquery).then(function (viewentry) {
                                            totalview = totalview + 1;
                                            Crops.update({ id: req.param('id') }, { viewed: totalview }).then(function (cropdetail) {
                                                if (version) {
                                                    if (userBid) {
                                                        cropInfo.userBid = userBid
                                                    }
                                                    // Bids.find( {crop:Id, select:['createdAt', 'status', 'quantity', 'bidRate']} ).sort('createdAt DESC').then(function (allbids) {
                                                    //     cropInfo.bids = allbids;
                                                    return res.jsonx({
                                                        success: true,
                                                        code: 200,
                                                        data: cropInfo
                                                    });
                                                    // })
                                                } else {
                                                    Bids.find({ crop: Id }).sort('createdAt DESC').populate('user', { select: ['firstName', 'lastName', /*'mobile', 'username', 'city', 'district', 'state', 'pincode', 'address',*/ 'userUniqueId', 'code', 'avgRating', /*'sellerCode',*/ 'billingAddress', 'shippingAddress', 'fullName'] }).then(function (allbids) {
                                                        cropInfo.bids = allbids;
                                                        return res.jsonx({
                                                            success: true,
                                                            code: 200,
                                                            data: cropInfo
                                                        });
                                                    })
                                                }
                                            })
                                        })
                                    } else {
                                        if (version) {
                                            if (userBid) {
                                                cropInfo.userBid = userBid
                                            }
                                            // Bids.find( {crop:Id, select:['createdAt', 'status', 'quantity', 'bidRate']} ).sort('createdAt DESC').then(function (allbids) {
                                            //     cropInfo.bids = allbids;
                                            return res.jsonx({
                                                success: true,
                                                code: 200,
                                                data: cropInfo
                                            });
                                            // })
                                        } else {
                                            Bids.find({ crop: Id }).sort('createdAt DESC').populate('user', { select: ['firstName', 'lastName', /*'mobile', 'username', 'city', 'district', 'state', 'pincode', 'address',*/ 'userUniqueId', 'code', 'avgRating', /*'sellerCode',*/ 'billingAddress', 'shippingAddress', 'fullName'] }).then(function (allbids) {
                                                cropInfo.bids = allbids;
                                                return res.jsonx({
                                                    success: true,
                                                    code: 200,
                                                    data: cropInfo
                                                });
                                            })
                                        }
                                    }
                                })
                            })
                        })
                    })
                })

            });
    },

    startAggregation: function (data, context) {
        let cropId = data.cropId
        let quantity = data.quantity

        if (cropId == undefined || cropId == null) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: "Please provide cropId for aggregation"
                },
            };
        }

        if (quantity == undefined || quantity == null) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: "Please provide quantity of crop to aggregate"
                },
            };
        }

        quantity = parseFloat(quantity)

        return Crops.findOne({ id: cropId }).populate('category', { select: ['name'] }).populate('market').then(function (crop) {
            if (crop.leftAfterAcceptanceQuantity < quantity) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: "Quantity can not be more than available quantity"
                    },
                };
            }

            if (!crop.isApproved || crop.isDeleted || crop.isExpired) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: "Only approved, existing and unexpired crops can be added for aggregation"
                    },
                };
            }

            let now = new Date()
            let endDate = new Date(crop.endDate)
            if (endDate < now) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: "Crop is expired due to end date."
                    },
                };
            }

            let fuser = null
            if (crop.market && crop.market.GM) {
                fuser = crop.market.GM
            }
            return Users.findOne({ id: fuser }).then(function (gmuser) {

                let addedCrop = {}
                addedCrop.aggregatedBy = context.identity.id
                addedCrop.code = commonServiceObj.getUniqueCode();
                addedCrop.name = crop.category.name
                addedCrop.category = crop.category.id
                addedCrop.market = crop.market.id
                addedCrop.seller = crop.market.GM
                addedCrop.images = crop.images
                addedCrop.videos = crop.videos
                addedCrop.coverImage = crop.coverImage
                //addedCrop.allImages = crop.allImages
                addedCrop.aggregatedCrops = [crop.id]
                addedCrop.categoryId = String(crop.category.id)
                addedCrop.variety = crop.variety
                addedCrop.quantity = quantity
                addedCrop.quantityUnit = crop.quantityUnit
                addedCrop.minBidAmount = crop.minBidAmount
                addedCrop.bidEndDate = crop.bidEndDate
                addedCrop.bidEndDays = crop.bidEndDays
                addedCrop.bidEndDaysUnit = crop.bidEndDaysUnit
                addedCrop.bidEarnestAmount = crop.bidEarnestAmount
                addedCrop.taxRate = crop.taxRate
                addedCrop.bidEarnestPercent = crop.bidEarnestPercent
                addedCrop.upfrontPercent = crop.upfrontPercent
                addedCrop.efarmxComission = crop.efarmxComission
                addedCrop.bidQuantityUnit = crop.bidQuantityUnit
                addedCrop.shippingPrice = crop.shippingPrice
                addedCrop.endDate = crop.endDate
                addedCrop.grades = [crop.grade]
                // addedCrop.sellers = [crop.seller]
                let quantities = {}
                quantities[cropId] = parseFloat((quantity).toFixed(3))
                addedCrop.quantitiesPart = quantities
                addedCrop.leftAfterAcceptanceQuantitiesParts = quantities

                addedCrop.availableFrom = new Date()
                addedCrop.sellerUpfrontPercentage = crop.sellerUpfrontPercentage
                addedCrop.sellerUpfrontDays = crop.sellerUpfrontDays
                addedCrop.sellerFinalPercentage = crop.sellerFinalPercentage
                addedCrop.sellerFinalDays = crop.sellerFinalDays
                addedCrop.sellerDepositPayment = crop.sellerDepositPayment
                addedCrop.isBidNow = "Yes"
                addedCrop.isAddToCart = "No"
                addedCrop.availablePeriod = crop.availablePeriod
                addedCrop.availableUnit = crop.availableUnit
                addedCrop.terms = crop.terms
                addedCrop.gifimages = crop.gifimages
                addedCrop.depositPayment = crop.depositPayment
                addedCrop.status = crop.status

                addedCrop.address = gmuser.address
                addedCrop.city = gmuser.city
                addedCrop.district = gmuser.district
                addedCrop.state = gmuser.state
                addedCrop.pincode = gmuser.pincode

                addedCrop.description = crop.description
                addedCrop.paymentTerms = crop.paymentTerms
                addedCrop.logisticsTerms = crop.logisticsTerms
                addedCrop.verified = 'No'
                addedCrop.isFeatured = false
                addedCrop.isApproved = false
                addedCrop.isExpired = false
                addedCrop.isDeleted = false
                addedCrop.leftAfterAcceptanceQuantity = quantity
                addedCrop.leftAfterDeliveryQuantity = quantity
                addedCrop.franchiseePercentage = crop.franchiseePercentage
                addedCrop.packaging = crop.packaging
                addedCrop.price = crop.price

                addedCrop.efarmxLogisticPercentage = crop.efarmxLogisticPercentage
                addedCrop.upfrontProcessedDate = crop.upfrontProcessedDate
                addedCrop.farmerUpfrontProcessedDate = crop.farmerUpfrontProcessedDate

                addedCrop.balanceProcessedDate = crop.balanceProcessedDate
                addedCrop.farmerBalanceProcessedDate = crop.farmerBalanceProcessedDate
                addedCrop.logisticProcessedDate = crop.logisticProcessedDate

                return Crops.create(addedCrop).then(function (addedcrop) {
                    if (addedcrop) {
                        let aggregations = []
                        if (crop.aggregations && crop.aggregations.length > 0) {
                            aggregations = crop.aggregations
                        }
                        aggregations.push(addedcrop.id)
                        return Crops.update({ id: crop.id }, { aggregations: aggregations }).then(function (updatedcrop) {

                            var msg = "Your crop " + crop.name + " with id " + crop.code + " has been aggregated under id " + addedcrop.code + ".";

                            var notificationData = {};
                            notificationData.productId = addedcrop.id;
                            notificationData.crop = addedcrop.id;
                            notificationData.sellerId = crop.seller;
                            notificationData.user = crop.seller;
                            notificationData.productType = "crops";
                            //notificationData.transactionOwner = u[0].id;
                            notificationData.transactionOwner = crop.transactionOwner;
                            notificationData.message = msg;
                            notificationData.messageKey = "CROP_AGGREGATED_NOTIFICATION"
                            notificationData.readBy = [];
                            notificationData.messageTitle = 'Crop aggregated'
                            let pushnotreceiver = [crop.seller]

                            return Notifications.create(notificationData).then(function (notificationResponse) {

                                if (notificationResponse) {
                                    commonService.notifyUsersFromNotification(notificationResponse, crop)
                                    pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                }
                                return {
                                    success: true,
                                    code: 200,
                                    message: constantObj.crops.ADDED_CROP,
                                    key: "ADDED_CROP",
                                    data: addedcrop,
                                }
                            }).fail(function (err) {
                                return {
                                    success: true,
                                    code: 200,
                                    message: constantObj.crops.ADDED_CROP,
                                    key: "ADDED_CROP",
                                    data: addedcrop,
                                }
                            });
                        })
                    } else {
                        return {
                            success: false,
                            error: {
                                code: 404,
                                message: constantObj.messages.NOT_FOUND,
                                key: 'NOT_FOUND',
                            },
                        };
                    }
                }).fail(function (err) {
                    return {
                        success: false,
                        error: {
                            code: 400,
                            message: err
                        },
                    };
                });
            })
        })
    },

    cropsInAggregation: function (data, context) {
        let aggregationId = data.id
        if (aggregationId == undefined || aggregationId == null) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: "Please provide aggregation id"
                },
            };
        }

        return Crops.findOne({ id: aggregationId }).then(function (aggregation) {
            if (aggregation && aggregation.aggregatedCrops != undefined && aggregation.aggregatedCrops != null && aggregation.aggregatedCrops.length > 0) {
                let query = { id: { $in: aggregation.aggregatedCrops } }

                let selectedFields = ['code', 'name', 'images', 'coverImage', 'bidEndDate', 'leftAfterAcceptanceQuantity', 'quantity', 'address', 'city', 'pincode', 'seller', 'price', 'grade']

                return Crops.find(query, { fields: selectedFields }).populate('seller', { select: ['fullName', 'address', 'city', 'pincode', 'mobile', 'email'] }).then(function (allcrops) {
                    if (allcrops && allcrops.length > 0) {
                        return {
                            success: true,
                            code: 200,
                            data: {
                                crops: allcrops,
                                quantities: aggregation.quantitiesPart,
                                leftQuantities: aggregation.leftAfterAcceptanceQuantitiesParts,
                                aggregation: aggregation
                            }
                        };
                    } else {
                        return {
                            success: true,
                            code: 200,
                            data: {
                                crops: [],
                                quantities: aggregation.quantitiesPart,
                                leftQuantities: aggregation.leftAfterAcceptanceQuantitiesParts,
                                aggregation: aggregation
                            }
                        };
                    }
                })

            } else {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: "This is not an aggregated crop"
                    },
                };
            }
        })
    },

    aggreggationaddition: function (data, context) {
        let cropId = data.cropId
        let quantity = data.quantity
        let aggregationId = data.id
        // console.log(cropId, '====');
        // return cropId;
        if (aggregationId == undefined || aggregationId == null) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: "Please provide aggregation id"
                },
            };
        }

        if (cropId == undefined || cropId == null) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: "Please provide cropId for aggregation"
                },
            };
        }

        if (quantity == undefined || quantity == null) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: "Please provide quantity of crop to aggregate"
                },
            };
        }

        quantity = parseFloat(quantity)

        return Crops.findOne({ id: aggregationId }).then(function (aggregation) {
            if (aggregation) {
                return Crops.findOne({ id: cropId }).populate('category', { select: ['name'] }).populate('market').then(function (crop) {

                    if (aggregation.market != crop.market.id) {
                        return {
                            success: false,
                            error: {
                                code: 400,
                                message: "Market of crop should be same as aggregated crop."
                            },
                        };
                    }
                    if (aggregation.category != crop.category.id) {
                        return {
                            success: false,
                            error: {
                                code: 400,
                                message: "Category should be same for as aggregation"
                            },
                        };
                    }
                    if (aggregation.variety != crop.variety) {
                        return {
                            success: false,
                            error: {
                                code: 400,
                                message: "Variety should be same for as aggregation"
                            },
                        };
                    }
                    if (crop.leftAfterAcceptanceQuantity < quantity) {
                        return {
                            success: false,
                            error: {
                                code: 400,
                                message: "Quantity can not be more than available quantity"
                            },
                        };
                    }

                    if (!crop.isApproved || crop.isDeleted || crop.isExpired) {
                        return {
                            success: false,
                            error: {
                                code: 400,
                                message: "Only approved, existing and unexpired crops can be added for aggregation"
                            },
                        };
                    }

                    let now = new Date()
                    let endDate = new Date(crop.endDate)
                    if (endDate < now) {
                        return {
                            success: false,
                            error: {
                                code: 400,
                                message: "Crop is expired due to end date."
                            },
                        };
                    }

                    let addedCrop = {}

                    let images = aggregation.images
                    if (images == null) {
                        images = '';
                    }
                    images = images.concat(crop.images)
                    addedCrop.images = images

                    let videos = aggregation.videos
                    if (videos == null) {
                        videos = '';
                    }
                    videos = videos.concat(crop.videos)
                    addedCrop.videos = videos

                    // let allImages = aggregation.allImages
                    // allImages = allImages.concat(crop.allImages)
                    // addedCrop.allImages = allImages

                    let aggregatedCrops = aggregation.aggregatedCrops
                    aggregatedCrops.push(crop.id)
                    addedCrop.aggregatedCrops = aggregatedCrops

                    addedCrop.quantity = aggregation.quantity + quantity

                    // addedCrop.minBidAmount = crop.minBidAmount

                    let grades = aggregation.grades
                    grades.push(crop.grade)
                    var gradeset = Array.from(new Set(grades));
                    addedCrop.grades = gradeset
                    // addedCrop.sellers = [crop.seller]
                    let quantitiesPart = aggregation.quantitiesPart
                    quantitiesPart[cropId] = quantity
                    addedCrop.quantitiesPart = quantitiesPart

                    let leftAfterAcceptanceQuantitiesParts = aggregation.leftAfterAcceptanceQuantitiesParts
                    leftAfterAcceptanceQuantitiesParts[cropId] = parseFloat((quantity).toFixed(3))
                    addedCrop.leftAfterAcceptanceQuantitiesParts = leftAfterAcceptanceQuantitiesParts

                    let gifimages = aggregation.gifimages
                    // console.log(gifimages, crop.gifimages, 'gif images====')
                    if (gifimages == null) {
                        gifimages = '';
                    }
                    gifimages = gifimages.concat(crop.gifimages)
                    addedCrop.gifimages = gifimages

                    addedCrop.price = ((aggregation.price * aggregation.quantity) + (crop.price * quantity)) / (aggregation.quantity + quantity)
                    addedCrop.price = parseFloat((addedCrop.price).toFixed(2))
                    if (aggregation.minBidAmount > crop.minBidAmount) {
                        addedCrop.minBidAmount = crop.minBidAmount
                    }

                    addedCrop.leftAfterAcceptanceQuantity = parseFloat((aggregation.leftAfterAcceptanceQuantity + quantity).toFixed(3))
                    addedCrop.leftAfterDeliveryQuantity = parseFloat((aggregation.leftAfterAcceptanceQuantity + quantity).toFixed(3))
                    addedCrop.isApproved = false
                    return Crops.update({ id: aggregationId }, addedCrop).then(function (addedcrop) {
                        if (addedcrop) {

                            let aggregations = []
                            if (crop.aggregations && crop.aggregations.length > 0) {
                                aggregations = crop.aggregations
                            }
                            aggregations.push(addedcrop[0].id)

                            return Crops.update({ id: crop.id }, { aggregations: aggregations }).then(function (updatedcrop) {

                                var msg = "Crop " + crop.name + " with id " + crop.code + " has been aggregated under id " + addedcrop[0].code + ".";

                                var notificationData = {};
                                notificationData.productId = addedcrop[0].id;
                                notificationData.crop = addedcrop[0].id;
                                notificationData.sellerId = crop.seller;
                                notificationData.user = crop.seller;
                                notificationData.productType = "crops";
                                //notificationData.transactionOwner = u[0].id;
                                notificationData.transactionOwner = crop.transactionOwner;
                                notificationData.message = msg;
                                notificationData.messageKey = "CROP_AGGREGATED_NOTIFICATION"
                                notificationData.readBy = [];
                                notificationData.messageTitle = 'Crop aggregated'
                                let pushnotreceiver = [crop.seller]

                                return Notifications.create(notificationData).then(function (notificationResponse) {

                                    if (notificationResponse) {
                                        commonService.notifyUsersFromNotification(notificationResponse, crop)
                                        pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                    }
                                    return {
                                        success: true,
                                        code: 200,
                                        message: constantObj.crops.ADDED_CROP,
                                        key: "ADDED_CROP",
                                        data: crop,
                                    }
                                }).fail(function (err) {
                                    return {
                                        success: true,
                                        code: 200,
                                        message: constantObj.crops.ADDED_CROP,
                                        key: "ADDED_CROP",
                                        data: crop,
                                    }
                                });
                            })
                        } else {
                            return {
                                success: false,
                                error: {
                                    code: 404,
                                    message: constantObj.messages.NOT_FOUND,
                                    key: 'NOT_FOUND',
                                },
                            };
                        }
                    }).fail(function (err) {
                        return {
                            success: false,
                            error: {
                                code: 400,
                                message: err
                            },
                        };
                    });
                })
            }
        })
    },

    aggreggationSuggestion: function (data, context) {
        let cropId = data.id
        if (cropId == undefined || cropId == null) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: "Please provide aggregation id"
                },
            };
        }

        return Crops.findOne({ id: cropId }).then(function (aggregation) {
            if (aggregation && aggregation.aggregatedCrops != undefined && aggregation.aggregatedCrops != null && aggregation.aggregatedCrops.length > 0) {
                let findqry = {}
                findqry.isApproved = true
                findqry.isExpired = false
                findqry.isDeleted = false
                findqry.category = aggregation.category
                findqry.market = aggregation.market;
                findqry.bidEndDate = { "$gt": new Date() }
                findqry.variety = aggregation.variety
                findqry.id = { "$nin": aggregation.aggregatedCrops }
                findqry.leftAfterAcceptanceQuantity = { "$gt": 0 }
                findqry.$or = [{ aggregatedCrops: null }, { aggregatedCrops: undefined }]

                let selectedFields = ['code', 'name', 'images', 'coverImage', 'bidEndDate', 'leftAfterAcceptanceQuantity', 'quantity', 'address', 'city', 'pincode', 'seller', 'price', 'grade']

                return Crops.find(findqry, { fields: selectedFields }).populate('seller', { select: ['fullName', 'address', 'city', 'pincode', 'mobile', 'email'] }).then(function (allcrops) {
                    if (allcrops && allcrops.length > 0) {
                        return {
                            success: true,
                            code: 200,
                            data: {
                                crops: allcrops
                            }
                        };
                    } else {
                        return {
                            success: true,
                            code: 200,
                            data: {
                                crops: []
                            }
                        };
                    }
                })
            } else {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: "This is not an aggregated crop"
                    },
                };
            }
        })
    },

    publishAggregation: function (data, context) {
        //let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        //console.log(data.cropId, "===")
        let cropId = data.id

        if (cropId == undefined || cropId == null) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: "Please provide cropId for aggregation"
                },
            };
        }

        return Crops.findOne({ id: cropId }).then(function (crop) {
            if (!(crop.aggregatedCrops && crop.aggregatedCrops.length > 1)) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: "More than one crop needs to be aggregated."
                    },
                };
            }

            let updatedCrop = {}
            updatedCrop.isApproved = true;
            updatedCrop.isExpired = false;
            let price = data.price
            if (price) {
                updatedCrop.price = parseFloat((price).toFixed(2))
            }
            if (data.endDate) {
                updatedCrop.endDate = new Date(data.endDate)
            }
            if (data.bidEndDate) {
                updatedCrop.bidEndDate = new Date(data.bidEndDate)
            }
            if (data.availableFrom) {
                updatedCrop.availableFrom = new Date(data.availableFrom)
            }

            let now = new Date()
            let endDateTillNow = crop.endDate
            if (data.endDate) {
                endDateTillNow = data.endDate
            }
            let endDate = new Date(endDateTillNow)

            let bidEndDateTillNow = crop.bidEndDate
            if (data.bidEndDate) {
                bidEndDateTillNow = data.bidEndDate
            }
            let bidEndDate = new Date(bidEndDateTillNow)

            if (endDate < bidEndDate) {
                if (data.endDate) {
                    return {
                        success: false,
                        error: {
                            code: 400,
                            message: "End date can not be smaller than bid end date. Either provide proper end date of crop or decrease bid end date."
                        },
                    };
                } else {
                    updatedCrop.endDate = bidEndDate
                }
            }

            if (updatedCrop.endDate < now) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: "Crop is expired due to end date."
                    },
                };
            }

            var approvedBy = context.identity.id;
            updatedCrop.approvedBy = approvedBy
            updatedCrop.approvedOn = new Date()

            return Crops.update({ id: cropId }, updatedCrop).then(function (cropdata) {
                if (cropdata && cropdata.length > 0) {
                    return {
                        success: true,
                        code: 200,
                        message: "Crop published successfully.",
                        data: cropdata[0]

                    }
                } else {
                    return {
                        success: true,
                        code: 200,
                        message: "Unknown error occured.",
                        data: cropdata[0]

                    }
                }
            }).fail(function (err) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: err
                    },
                }
            })
        }).fail(function (err) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: err
                },
            }
        })
    },

    removeAggreationCrop: function (data, context) {
        let cropId = data.cropId
        //let quantity = data.quantity
        let aggregationId = data.id

        if (aggregationId == undefined || aggregationId == null) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: "Please provide aggregation id"
                },
            };
        }

        if (cropId == undefined || cropId == null) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: "Please provide cropId for aggregation"
                },
            };
        }

        return Crops.findOne({ id: aggregationId }).then(function (aggregation) {
            if (aggregation) {

                return Crops.findOne({ id: cropId }).then(function (crop) {

                    let aggregatedCropsIds = aggregation.aggregatedCrops
                    const indexOfCrop = aggregatedCropsIds.indexOf(crop.id);
                    if (indexOfCrop > -1) {
                        aggregatedCropsIds.splice(indexOfCrop, 1);
                    }
                    if (aggregatedCropsIds.length == 0 && aggregation.totalBids == 0) {
                        return Crops.destroy({ id: aggregationId }).then(function (result) {
                            if (!_.isEmpty(result)) {
                                let aggregations = []
                                if (crop.aggregations && crop.aggregations.length > 0) {
                                    aggregations = crop.aggregations
                                    const index2 = aggregations.indexOf(aggregationId);
                                    if (index2 > -1) {
                                        aggregations.splice(index2, 1);
                                    }
                                }

                                let cropUpdate = {}

                                if (aggregations.length == 0) {
                                    cropUpdate.aggregations = undefined
                                } else {
                                    cropUpdate.aggregations = aggregations
                                }
                                return Crops.update({ id: crop.id }, cropUpdate).then(function (updatedcrop) {


                                    var msg = "Your crop " + crop.name + " with id " + crop.code + " has been removed from aggregation with id " + aggregation.code + ".";

                                    var notificationData = {};
                                    notificationData.productId = aggregation.id;
                                    notificationData.crop = aggregation.id;
                                    notificationData.sellerId = crop.seller;
                                    notificationData.user = crop.seller;
                                    notificationData.productType = "crops";
                                    //notificationData.transactionOwner = u[0].id;
                                    notificationData.transactionOwner = crop.transactionOwner;
                                    notificationData.message = msg;
                                    notificationData.messageKey = "CROP_AGGREGATED_NOTIFICATION"
                                    notificationData.readBy = [];
                                    notificationData.messageTitle = 'Crop removed from aggregation'
                                    let pushnotreceiver = [crop.seller]

                                    return Notifications.create(notificationData).then(function (notificationResponse) {

                                        if (notificationResponse) {
                                            commonService.notifyUsersFromNotification(notificationResponse, crop)
                                            pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                        }
                                        return {
                                            success: true,
                                            code: 200,
                                            message: "Crop is removed from aggregation and no aggregation is now available",
                                            key: "REMOVED_CROP",
                                            data: crop,
                                        }
                                    });
                                }).fail(function (error) {
                                    return {
                                        success: false,
                                        error: error
                                    }
                                })
                            } else {
                                return {
                                    success: false,
                                    message: "some error occured"
                                }
                            }
                        }).fail(function (error) {
                            return {
                                success: false,
                                error: error
                            }
                        })
                    } else {
                        let selectedFields = ['grade', 'minBidAmount']

                        let query = { id: { $in: aggregatedCropsIds } }

                        let findBidsOnCrop = {}
                        findBidsOnCrop.crop = aggregationId
                        findBidsOnCrop.$or = [{ status: 'Pending' }, { status: 'Accepted' }]

                        return Bids.count(findBidsOnCrop).then(function (bidCount) {
                            if (bidCount > 0) {
                                return {
                                    success: false,
                                    error: {
                                        code: 404,
                                        message: 'Can not remove as few bids are pending or accepted. First either reject them or dispatch those bids',
                                        key: 'NOT_FOUND',
                                    },
                                };
                            } else {
                                return Crops.find(query, { fields: selectedFields }).sort('minBidAmount asc').then(function (allcrops) {

                                    let addedCrop = {}

                                    let cropImage = crop.images;
                                    let images = aggregation.images
                                    images = images.filter(item => !(cropImage.indexOf(item) > -1));
                                    addedCrop.images = images

                                    let cropvideo = crop.videos;
                                    let videos = aggregation.videos
                                    videos = videos.filter(item => !(cropvideo.indexOf(item) > -1));
                                    addedCrop.videos = videos

                                    // let cropAllImage = crop.allImages;
                                    // let allImages = aggregation.allImages

                                    // if (cropAllImage == undefined || cropAllImage == null) {
                                    //     cropAllImage = []
                                    // }

                                    // if (allImages == undefined || allImages == null) {
                                    //     allImages = []
                                    // }

                                    // for (var i = 0; i < allImages.length; i++) {
                                    //     for (var j = 0; j < cropAllImage.length; j++) {
                                    //         if (cropAllImage[j].image == allImages[i].image) {                                        
                                    //             cropAllImage.splice(j, 1);
                                    //             break
                                    //         }
                                    //     }
                                    // }

                                    // addedCrop.allImages = cropAllImage


                                    let aggregatedCrops = aggregation.aggregatedCrops
                                    const index = aggregatedCrops.indexOf(cropId);
                                    if (index > -1) {
                                        aggregatedCrops.splice(index, 1);
                                    }
                                    addedCrop.aggregatedCrops = aggregatedCrops

                                    addedCrop.quantity = aggregation.quantity - aggregation.quantitiesPart[cropId]

                                    addedCrop.minBidAmount = allcrops[0].minBidAmount

                                    let grades = []

                                    for (var i = 0; i < allcrops.length; i++) {
                                        grades.push(allcrops[i].grade)
                                    }

                                    var gradeset = Array.from(new Set(grades));
                                    addedCrop.grades = gradeset

                                    addedCrop.leftAfterAcceptanceQuantity = parseFloat((aggregation.leftAfterAcceptanceQuantity - aggregation.leftAfterAcceptanceQuantitiesParts[cropId]).toFixed(3))
                                    addedCrop.leftAfterDeliveryQuantity = parseFloat((aggregation.leftAfterDeliveryQuantity - aggregation.leftAfterAcceptanceQuantitiesParts[cropId]).toFixed(3))

                                    let quantitiesPart = aggregation.quantitiesPart
                                    delete quantitiesPart[cropId]
                                    addedCrop.quantitiesPart = quantitiesPart

                                    let leftAfterAcceptanceQuantitiesParts = aggregation.leftAfterAcceptanceQuantitiesParts
                                    delete leftAfterAcceptanceQuantitiesParts[cropId]
                                    addedCrop.leftAfterAcceptanceQuantitiesParts = leftAfterAcceptanceQuantitiesParts

                                    let cropgifimages = crop.gifimages;
                                    let gifimages = aggregation.gifimages
                                    if (gifimages && cropgifimages) {
                                        gifimages = gifimages.filter(item => !(cropgifimages.indexOf(item) > -1));
                                    }
                                    addedCrop.gifimages = gifimages
                                    addedCrop.isApproved = false

                                    return Crops.update({ id: aggregationId }, addedCrop).then(function (addedcrop) {
                                        if (addedcrop) {
                                            let aggregations = []
                                            if (crop.aggregations && crop.aggregations.length > 0) {
                                                aggregations = crop.aggregations
                                                const index2 = aggregations.indexOf(aggregationId);
                                                if (index2 > -1) {
                                                    aggregations.splice(index2, 1);
                                                }
                                            }

                                            let cropUpdate = {}

                                            if (aggregations.length == 0) {
                                                cropUpdate.aggregations = undefined
                                            } else {
                                                cropUpdate.aggregations = aggregations
                                            }

                                            return Crops.update({ id: crop.id }, cropUpdate).then(function (updatedcrop) {

                                                var msg = "Crop " + crop.name + " with id " + crop.code + " has been removed from aggregation with id " + addedcrop.code + ".";

                                                var notificationData = {};
                                                notificationData.productId = addedcrop.id;
                                                notificationData.crop = addedcrop.id;
                                                notificationData.sellerId = crop.seller;
                                                notificationData.user = crop.seller;
                                                notificationData.productType = "crops";
                                                //notificationData.transactionOwner = u[0].id;
                                                notificationData.transactionOwner = crop.transactionOwner;
                                                notificationData.message = msg;
                                                notificationData.messageKey = "CROP_AGGREGATED_NOTIFICATION"
                                                notificationData.readBy = [];
                                                notificationData.messageTitle = 'Crop removed from aggregation'
                                                let pushnotreceiver = [crop.seller]

                                                return Notifications.create(notificationData).then(function (notificationResponse) {

                                                    if (notificationResponse) {
                                                        commonService.notifyUsersFromNotification(notificationResponse, crop)
                                                        pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                                    }
                                                    return {
                                                        success: true,
                                                        code: 200,
                                                        message: "Crop is removed from aggregation",
                                                        key: "REMOVED_CROP",
                                                        data: crop,
                                                    }
                                                }).fail(function (err) {
                                                    return {
                                                        success: true,
                                                        code: 200,
                                                        message: "CROP is removed from aggregation",
                                                        key: "REMOVED_CROP",
                                                        data: crop,
                                                    }
                                                });
                                            }).fail(function (error) {
                                                return {
                                                    success: false,
                                                    error: error
                                                }
                                            })
                                        } else {
                                            return {
                                                success: false,
                                                error: {
                                                    code: 404,
                                                    message: constantObj.messages.NOT_FOUND,
                                                    key: 'NOT_FOUND',
                                                },
                                            };
                                        }
                                    }).fail(function (err) {
                                        return {
                                            success: false,
                                            error: {
                                                code: 400,
                                                message: err
                                            },
                                        };
                                    });
                                })
                            }
                        })
                    }
                })
            }
        })
    },

    cropBids: function (data, context) {
        let cropId = data.id

        console.log(data)

        let page = data.page
        let count = data.count
        let skipNo = (page - 1) * count;

        return Crops.findOne({ id: cropId })
            .populate('seller', { select: ['firstName', 'lastName', 'userUniqueId', 'code', 'avgRating', 'sellerCode', /*'billingAddress', 'shippingAddress',*/ 'fullName'] })
            .populate('category', { select: ['name', 'qualities'] }).then(function (crop) {

                let cropInfo = {}
                if (data.cropFields) {
                    let cropFields = JSON.parse(data.cropFields);

                    for (var i = 0; i < cropFields.length; i++) {
                        if (crop[cropFields[i]] != undefined) {
                            cropInfo[cropFields[i]] = crop[cropFields[i]]
                        }
                    }
                } else {
                    cropInfo.id = crop.id
                    cropInfo.category = crop.category
                    cropInfo.name = crop.name
                    cropInfo.variety = crop.variety
                    cropInfo.code = crop.code
                    cropInfo.seller = crop.seller
                    cropInfo.quantity = crop.quantity
                    cropInfo.quantityUnit = crop.quantityUnit
                    cropInfo.price = crop.price
                    cropInfo.grade = crop.grade
                    cropInfo.status = crop.status
                    cropInfo.images = crop.images
                    cropInfo.gifimages = crop.gifimages
                    cropInfo.leftAfterAcceptanceQuantity = crop.leftAfterAcceptanceQuantity
                    // cropInfo.allImages = crop.allImages
                    cropInfo.availableFrom = crop.availableFrom
                    cropInfo.isExpired = crop.isExpired
                }

                return Bids.count({ crop: cropId }).then(function (total) {
                    return Bids.find({ crop: cropId })
                        .sort('createdAt DESC')
                        .populate('user', { select: ['firstName', 'lastName', /*'mobile', 'username', 'city', 'district', 'state', 'pincode', 'address',*/ 'userUniqueId', 'code', 'avgRating', /*'sellerCode', 'billingAddress', 'shippingAddress',*/ 'fullName'] })
                        .skip(skipNo)
                        .limit(count)
                        .then(function (allbids) {
                            let sharedcrops = []
                            for (var i = 0; i < allbids.length; i++) {
                                if (allbids[i].aggregatedCropQuantities) {
                                    Object.keys(allbids[i].aggregatedCropQuantities).forEach((crpId, index) => {
                                        const indexOfCrop = sharedcrops.indexOf(crpId);
                                        if (!(indexOfCrop > -1)) {
                                            sharedcrops.push(crpId)
                                        }
                                    })
                                }
                            }
                            if (sharedcrops.length > 0) {
                                return Crops.find({ id: { $in: sharedcrops } }, { fields: ['code', 'seller'] }).populate('seller', { select: ['fullName', 'image'] }).then(function (subsequentCrops) {
                                    for (var i = 0; i < allbids.length; i++) {
                                        if (allbids[i].aggregatedCropQuantities) {
                                            Object.keys(allbids[i].aggregatedCropQuantities).forEach((crpId, index) => {
                                                for (var j = 0; j < subsequentCrops.length; j++) {
                                                    let cp = subsequentCrops[j]
                                                    if (cp.id == crpId) {
                                                        let qty = allbids[i].aggregatedCropQuantities[crpId]
                                                        // allbids[i].aggregatedCropQuantities[crpId] = {seller:cp.seller.fullName, cropcode: cp.code, quantity: qty} 
                                                        let subcrops = []
                                                        if (allbids[i].subsequentCrops) {
                                                            subcrops = allbids[i].subsequentCrops
                                                        }
                                                        let scobj = { seller: cp.seller.fullName, sellerId: cp.seller.id, cropcode: cp.code, quantity: qty }
                                                        if (cp.seller.image) {
                                                            scobj.sellerImage = cp.seller.image
                                                        }
                                                        subcrops.push(scobj)
                                                        allbids[i].subsequentCrops = subcrops
                                                        break
                                                    }
                                                }
                                            })
                                        }
                                    }

                                    return {
                                        success: true,
                                        code: 200,
                                        data: {
                                            crop: cropInfo,
                                            bids: allbids,
                                            total: total
                                        }
                                    };
                                })
                            } else {
                                return {
                                    success: true,
                                    code: 200,
                                    data: {
                                        crop: cropInfo,
                                        bids: allbids,
                                        total: total
                                    }
                                };
                            }
                        })
                })
            }).fail(function (error) {
                return {
                    code: 400,
                    success: false,
                    error: error
                };
            })
    },

    changeStatus: function (data, context) {

        return API.Model(Crops).update(data.id, data).then(function (crop) {
            var Report;
            if (crop) {
                Report = {
                    "success": {
                        "Code": 200,
                        "Message": "Status Updated"
                    }
                }
            } else {
                Report = {
                    "error": {
                        "Code": 301,
                        "Message": "Faild"
                    }
                }
            }
            return {
                "Status": true,
                Report
            };
        });
    },

    makeVerifyCrop: function (data, context) {
        return Crops.findOne({ id: data.id }).populate('market').then(function (crp) {

            return Crops.update({ id: data.id }, { verified: "Yes", verifyBy: context.identity.id }).then(function (crop) {

                return Users.findOne(crop[0].seller).then(function (userinfo) {

                    let fieldOfficerContact = context.identity.mobile;

                    /*var message = userinfo.firstName;
                    message += '<br/><br/>';
                    message += 'Your crop "'+crop[0].name+'" is verified by the eFarmX. Thanks for the verification, it will help you get valuable buyers.';
                    message += 'You can let your crop fetch more and frequent bids by adding in featured list or display it on banner. For More details on this, contact our field officer at "'+fieldOfficerContact ;
                    message += '<br/><br/>';
                    message += '<br/><br/>';
                    message += 'Regards';
                    message += '<br/><br/>';
                    message += 'eFarmX Team';
                    var SMS = ' Your crop "'+crop[0].name+'" is verified by the eFarmX. Please visir again manage your crop.';
     
                    var sendObj = commonServiceObj.notifyCropUser(userinfo.username, userinfo.mobile, message, SMS );*/

                    var msg = "Crop " + crop[0].name + " with id " + crop[0].code + " is verified and now avaiable  for buyers. ";

                    var notificationData = {};
                    notificationData.productId = crop[0].id;
                    notificationData.crop = crop[0].id;
                    notificationData.sellerId = crop[0].seller;
                    notificationData.user = crop[0].seller;
                    notificationData.productType = "crops";
                    notificationData.message = msg;
                    notificationData.messageKey = "CROP_VERIFIED_NOTIFICATION"
                    notificationData.readBy = [];
                    notificationData.messageTitle = 'Crop verified'
                    let pushnotreceiver = [crop[0].seller]
                    if (crp.market && crp.market.GM) {
                        pushnotreceiver.push(crp.market.GM)
                    }


                    return Notifications.create(notificationData).then(function (notificationResponse) {
                        if (notificationResponse) {
                            commonService.notifyUsersFromNotification(notificationResponse, crop[0])
                            pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                        }
                        return {
                            success: true,
                            code: 200,
                            data: {
                                message: constantObj.crops.VERIFIED_CROP
                            }
                        };
                    })
                });
            }).fail(function (err) {
                return {
                    success: false,
                    error: {
                        code: 404,
                        message: constantObj.messages.NOT_FOUND,
                        key: 'NOT_FOUND',
                    }
                };
            });
        })

    },

    disapproveCrop: function (data, context) {

        if (data.id == undefined) {
            return {
                success: false,
                error: {
                    code: 404,
                    message: "Please send crop id"
                }
            }
        }
        if (data.reason == undefined) {
            return {
                success: false,
                error: {
                    code: 404,
                    message: "Please send reason for disapproval of crop."
                }
            }
        }

        return Crops.findOne({ id: data.id }).populate('market').then(function (crp) {

            if (crp) {

                let reasons = []

                if (crp.disappovedReason && crp.disappovedReason.length > 0) {
                    reasons = crp.disappovedReason
                }
                reasons.push(data.reason)

                return Crops.update({ id: data.id }, { disappovedReason: reasons }).then(function (crop) {

                    var msg = "Crop " + crop[0].name + " with id " + crop[0].code + " is disapproved by FarmX. Reason for disapproval is " + data.reason + " \n Please rectify the crop information for approval.";

                    var notificationData = {};
                    notificationData.productId = crop[0].id;
                    notificationData.crop = crop[0].id;
                    notificationData.sellerId = crop[0].seller;
                    notificationData.user = crop[0].seller;
                    notificationData.productType = "crops";
                    notificationData.message = msg;
                    notificationData.messageKey = "CROP_DISAPPROVED_NOTIFICATION"
                    notificationData.readBy = [];
                    notificationData.messageTitle = 'Crop disapproved'
                    let pushnotreceiver = [crop[0].seller]
                    if (crp.market && crp.market.GM) {
                        pushnotreceiver.push(crp.market.GM)
                    }

                    return Notifications.create(notificationData).then(function (notificationResponse) {
                        if (notificationResponse) {
                            commonService.notifyUsersFromNotification(notificationResponse, crop[0])
                            pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                        }
                        return {
                            success: true,
                            code: 200,
                            data: {
                                message: constantObj.crops.VERIFIED_CROP
                            }
                        };
                    })
                }).fail(function (err) {
                    return {
                        success: false,
                        error: {
                            code: 404,
                            message: constantObj.messages.NOT_FOUND,
                            key: 'NOT_FOUND',
                        }
                    };
                });
            } else {
                return {
                    success: false,
                    error: {
                        code: 404,
                        message: constantObj.messages.NOT_FOUND
                    }
                };
            }
        })

    },

    makeApproveCrop: function (data, context) {
        var approvedBy = context.identity.id;

        var findCropQry = {}
        findCropQry.id = data.id

        return Crops.findOne(findCropQry).populate('market').then(function (cropInfo) {

            if (!cropInfo.market || cropInfo.market == null) {
                return {
                    success: true,
                    code: 200,
                    data: {
                        message: "A crop can't be confirmed/approved till the time franchisee is not assigned to it"
                    }
                };
            }

            var dataToUpdate = {}

            if (cropInfo.bidEndDate == undefined || cropInfo.bidEndDate == null) {
                if (cropInfo.bidEndDays) {
                    var availObj = new Date();
                    var availableRange = cropInfo.bidEndDays;
                    var dateChanged = new Date(availObj);

                    if (cropInfo.bidEndDaysUnit == "Days") {
                        dateChanged.setDate(dateChanged.getDate() + availableRange);
                    } else if (cropInfo.bidEndDaysUnit == "Month") {
                        dateChanged.setMonth(dateChanged.getMonth() + availableRange);
                    } else if (cropInfo.bidEndDaysUnit == "Year") {
                        dateChanged.setFullYear(dateChanged.getFullYear() + availableRange);
                    }

                    dataToUpdate.bidEndDate = dateChanged
                } else {
                    dataToUpdate.bidEndDate = cropInfo.endDate
                }
            }

            dataToUpdate.isApproved = true
            dataToUpdate.approvedBy = approvedBy
            dataToUpdate.approvedOn = new Date()

            return Crops.update({ id: data.id }, dataToUpdate).then(function (crop) {
                return Users.findOne(crop[0].seller).then(function (userinfo) {

                    var addedCrop = crop
                    addedCrop.seller = userinfo

                    sails.sockets.blast('crop_added', addedCrop);

                    let fieldOfficerContact = context.identity.mobile;

                    /*  var message = userinfo.firstName;
                      message += '<br/><br/>';
                      message += 'Your crop "'+crop[0].name+'" is approved by the eFarmX and now available for other users for bidding';
                      message += 'For more and frequent bids, make your crop more valuable by verification from eFarmX, adding in featured list or display it on banner. For More details on this, contact our field officer at  "'+fieldOfficerContact ;
                      message += '<br/><br/>';
                      message += '<br/><br/>';
                      message += 'Regards';
                      message += '<br/><br/>';
                      message += 'eFarmX Team';
                      var SMS = ' Your crop "'+crop[0].name+'" is approved by the eFarmX and now visible at frontend';
     
                      var sendObj = commonServiceObj.notifyCropUser(userinfo.username, userinfo.mobile, message, SMS );
                    */

                    var msg = "Crop " + crop[0].name + " with id " + crop[0].code + " is approved by FarmX. ";

                    var notificationData = {};
                    notificationData.productId = crop[0].id;
                    notificationData.crop = crop[0].id;
                    notificationData.sellerId = crop[0].seller;
                    notificationData.user = crop[0].seller;
                    notificationData.productType = "crops";
                    notificationData.message = msg;
                    notificationData.messageKey = "CROP_APPROVED_NOTIFICATION"
                    notificationData.readBy = [];
                    notificationData.messageTitle = 'Crop approved'
                    let pushnotreceiver = [crop[0].seller]
                    if (cropInfo.market && cropInfo.market.GM) {
                        pushnotreceiver.push(cropInfo.market.GM)
                    }

                    return Notifications.create(notificationData).then(function (notificationResponse) {
                        if (notificationResponse) {
                            commonService.notifyUsersFromNotification(notificationResponse, crop[0])
                            pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                        }

                        let reqqry = {}
                        let now = new Date()
                        reqqry.$and = [{ $or: [{ status: 'Suggested' }, { status: 'Pending' }] }, { $or: [{ variety: undefined }, { variety: null }, { variety: cropInfo.variety }] }]
                        reqqry.requiredOn = { $gte: now }
                        // reqqry.subscribe = true
                        reqqry.category = cropInfo.category

                        return BuyerRequirement.find(reqqry).populate('user', { select: ['fullName', 'mobile'] }).populate('category', { select: ['name'] }).then(function (requirements) {

                            var numbers = []
                            var requirementDate = []
                            var notificationDatas = []
                            var notificationusers = []
                            var requiurementIds = []

                            let categoryName = ""

                            for (var i = 0; i < requirements.length; i++) {
                                let fc = requirements[i]

                                if (fc.status == 'Pending') {
                                    requiurementIds.push(fc.id)
                                }

                                if (fc.user) {
                                    if (fc.subscribe == true) {
                                        numbers.push(fc.user.mobile)
                                        requirementDate.push(fc.createdAt)
                                    }

                                    var msg = "The requirement for " + requirements[i].category.name + " has been raised by you on " + commonService.longDateFormat((new Date(fc.createdAt))) + ".The product is now available. Place your bid to get product.";
                                    categoryName = requirements[i].category.name

                                    var buyernotificationData = {};
                                    buyernotificationData.requirement = fc.id;
                                    buyernotificationData.user = fc.user.id;
                                    buyernotificationData.productType = "crops";
                                    buyernotificationData.message = msg;
                                    buyernotificationData.messageKey = "CROP_REQUIREMENT_NOTIFICATION"
                                    buyernotificationData.readBy = [];
                                    buyernotificationData.sentTo = [fc.user.id]
                                    buyernotificationData.messageTitle = 'Product available'

                                    notificationDatas.push(buyernotificationData)
                                    notificationusers.push(fc.user.id)

                                } else if (fc.mobile) {
                                    if (fc.subscribe == true) {
                                        numbers.push(fc.mobile)
                                        requirementDate.push(fc.createdAt)
                                    }
                                }

                            }

                            if (requiurementIds.length > 0) {
                                BuyerRequirement.update({ id: requiurementIds }, { status: 'Suggested' }).then(function () {
                                })
                            }

                            if (notificationDatas.length > 0) {
                                Notifications.create(notificationDatas).then(function (notificationResponse) {
                                    sails.sockets.blast("general_notification", { message: msg, messageKey: "CROP_REQUIREMENT_NOTIFICATION", users: notificationusers });
                                    pushService.sendPushToUsersWithNotificationInfo(notificationusers, notificationResponse[0])
                                })
                            }

                            if (numbers.length > 0) {
                                for (var i = 0; i < numbers.length; i++) {

                                    let buyersmsInfo = {}

                                    buyersmsInfo.numbers = [numbers[i]]

                                    buyersmsInfo.variables = { "{#CC#}": categoryName, "{#DD#}": commonService.longDateFormat((new Date(requirementDate[i]))) }
                                    buyersmsInfo.templateId = "33296"

                                    commonService.sendGeneralSMS(buyersmsInfo)
                                }
                            }

                            return {
                                success: true,
                                code: 200,
                                data: {
                                    message: constantObj.crops.APPROVED_CROP
                                }
                            };
                        })
                    })
                });
            }).fail(function (err) {
                return {
                    success: false,
                    error: {
                        code: 404,
                        message: constantObj.messages.NOT_FOUND,
                        key: 'NOT_FOUND',
                    }
                };
            });
        }).fail(function (err) {
            return {
                success: false,
                error: {
                    code: 404,
                    message: constantObj.messages.NOT_FOUND,
                    key: 'NOT_FOUND',
                }
            };
        });
    },

    get: function (data, context) {

        let Id = data.id;
        return Crops.findOne(Id).populate('seller').populate('category')
            .then(function (cropInfo) {

                cropInfo.bids = [];

                return Bids.find({ crop: Id }).populate('user').then(function (allbids) {
                    cropInfo.bids = allbids;
                    return {
                        success: true,
                        code: 200,
                        data: cropInfo,
                    };
                });
            });
    }
}; // End Crops service class