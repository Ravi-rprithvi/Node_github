/**
 * LogisticpriceController
 *
 * @description :: Server-side logic for managing clients
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var Promise = require('q');
var path = require('path');
var constantObj = sails.config.constants;
var ObjectId = require('mongodb').ObjectID;
var distance = require('google-distance-matrix');

module.exports = {

    assignedLogisticPriceCategory: function (req, res) {
        API(LogisticpriceService.assignedLogisticPriceCategory, req, res);
    },
    add: function (req, res) {
        API(LogisticpriceService.save, req, res);
    },

    delete: function (req, res) {
        API(LogisticpriceService.delete, req, res);
    },

    deleteMultiple: function (req, res) {
        API(LogisticpriceService.deleteMultiple, req, res);
    },

    update: function (req, res) {
        API(LogisticpriceService.update, req, res);
    },
    // cropsroutepricecalculate: function (req, res) {
    //     API(LogisticpriceService.cropsroutepriceModernTrade, req, res);
    // },


    addBulk: function (req, res) {
        let category = req.param("category")
        let rfilePath = req.param("filePath")
        if (category == undefined || category == null) {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: "Please provide category of product"
                },
            });
        }
        if (rfilePath == undefined || rfilePath == null) {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: "Please upload the file."
                },
            });
        }
        var fs = require('fs');
        let filePath = 'assets/' + rfilePath
        if (fs.existsSync(filePath)) {
            const csvtojson = require("csvtojson");
            var json2xls = require('json2xls');

            var priceResponses = []

            csvtojson().fromFile(filePath).then((jsonObj) => {
                let failedObjects = 0
                async.each(jsonObj, function (priceObj, callback) {
                    let priceData = {}
                    priceData.category = category

                    let save = true

                    if (priceObj['Source Pincode'] == undefined || priceObj['Source Pincode'] == null || priceObj['Source Pincode'] == '' || parseInt(priceObj['Source Pincode']) == undefined || priceObj['Source Pincode'].length != 6) {
                        failedObjects += 1
                        priceObj.comment = 'Source Pincode not valid'
                        save = false
                    } else {
                        priceData.source = parseInt(priceObj['Source Pincode'])
                    }

                    if (priceObj['Destination Pincode'] == undefined || priceObj['Destination Pincode'] == null || priceObj['Destination Pincode'] == '' || parseInt(priceObj['Destination Pincode']) == undefined || priceObj['Source Pincode'].length != 6) {
                        if (save) {
                            failedObjects += 1
                            priceObj.comment = 'Destination Pincode not valid'
                            save = false
                        }
                    } else {
                        priceData.destination = parseInt(priceObj['Destination Pincode'])
                    }

                    if (priceObj['Vehicle Capacity (In QTL)'] == undefined || priceObj['Vehicle Capacity (In QTL)'] == null || priceObj['Vehicle Capacity (In QTL)'] == '' || parseInt(priceObj['Vehicle Capacity (In QTL)']) == undefined) {
                        if (save) {
                            failedObjects += 1
                            priceObj.comment = 'Vehicle Capacity (In QTL) not valid'
                            save = false
                        }
                    } else {
                        priceData.carryCapacity = parseInt(priceObj['Vehicle Capacity (In QTL)'])
                    }

                    if (priceObj['Load Capacity (In QTL)'] == undefined || priceObj['Load Capacity (In QTL)'] == null || priceObj['Load Capacity (In QTL)'] == '' || parseInt(priceObj['Load Capacity (In QTL)']) == undefined) {
                        if (save) {
                            priceObj.comment = 'Load Capacity (In QTL) not valid'
                            failedObjects += 1
                            save = false
                        }
                    } else {
                        priceData.load = parseInt(priceObj['Load Capacity (In QTL)'])
                    }

                    if (parseInt(priceData.load) > parseInt(priceData.carryCapacity)) {
                        if (save) {
                            failedObjects += 1
                            priceObj.comment = 'Load Capacity can not be more than Vehicle Capacity'
                            save = false
                        }
                    }

                    if (priceObj['Price'] == undefined || priceObj['Price'] == null || priceObj['Price'] == '' || parseFloat(priceObj['Price']) == undefined) {
                        if (save) {
                            failedObjects += 1
                            priceObj.comment = 'Price can not be empty'
                            save = false
                        }
                    } else {
                        priceData.price = parseFloat(priceObj['Price'])
                    }

                    priceData.addedBy = req.identity.id
                    priceData.addedOn = new Date()

                    if (priceObj['Distance (In KMs)'] != undefined && priceObj['Distance (In KMs)'] != null && priceObj['Distance (In KMs)'] != '' && parseFloat(priceObj['Distance (In KMs)']) != undefined) {
                        priceData.distanceInMeters = parseFloat(priceObj['Distance (In KMs)']) * 1000
                    }

                    if (priceObj['Travel Time (In Hours)'] != undefined && priceObj['Travel Time (In Hours)'] != null && priceObj['Travel Time (In Hours)'] != '' && parseFloat(priceObj['Travel Time (In Hours)']) != undefined) {
                        priceData.travelDurationInSec = parseFloat(priceObj['Travel Time (In Hours)']) * 3600
                    }

                    if (priceObj['Vehicle Type'] != undefined && priceObj['Vehicle Type'] != null && priceObj['Vehicle Type'] != '') {
                        priceData.vehicleType = priceObj['Vehicle Type']
                    }

                    if (priceObj['Price Taken From'] != undefined && priceObj['Price Taken From'] != null && priceObj['Price Taken From'] != '') {
                        priceData.priceTakenFrom = priceObj['Price Taken From']
                    }

                    if (priceObj['Source Area Name'] != undefined && priceObj['Source Area Name'] != null && priceObj['Source Area Name'] != '') {
                        priceData.sourceName = priceObj['Source Area Name']
                    }

                    if (priceObj['Destination Area Name'] != undefined && priceObj['Destination Area Name'] != null && priceObj['Destination Area Name'] != '') {
                        priceData.destinationName = priceObj['Destination Area Name']
                    }

                    if (priceObj['Valid Till'] != undefined && priceObj['Valid Till'] != null && priceObj['Valid Till'] != '') {
                        var parts = priceObj['Valid Till'].split('-');
                        parts[2] = "20" + parts[2]
                        var mydate = new Date(parts[2], parts[1] - 1, parts[0]);
                        mydate.setMinutes(59)
                        mydate.setHours(23)
                        mydate.setSeconds(59)
                        mydate.setMilliseconds(999)

                        if (mydate != undefined && mydate != null) {
                            priceData.validUpto = mydate
                        } else {
                            priceObj.comment = 'Valid Till date seems invalid. Please update manually'
                        }
                    }

                    if (priceObj['Margin (In Rs)'] != undefined && priceObj['Margin (In Rs)'] != null && priceObj['Margin (In Rs)'] != '' && parseFloat(priceObj['Margin (In Rs)']) != undefined) {
                        priceData.margin = parseFloat(priceObj['Margin (In Rs)'])
                    }

                    let qry = {}
                    qry.category = priceData.category
                    qry.source = priceData.source
                    qry.destination = priceData.destination
                    qry.carryCapacity = priceData.carryCapacity

                    priceResponses.push(priceObj)

                    if (!save) {
                        callback()
                    } else {
                        Logisticprice.findOne(qry).then(function (price) {
                            if (price) {
                                let history = {}
                                let changes = []
                                if (price.price != parseInt(priceData.price)) {
                                    history.price = price.price
                                    changes.push('PRICE')
                                }
                                if (price.load != parseInt(priceData.load)) {
                                    history.load = price.load
                                    changes.push('LOAD')
                                }
                                if (priceData.margin != null && priceData.margin != undefined && price.margin != parseFloat(priceData.margin)) {
                                    history.margin = price.margin
                                    changes.push('MARGIN')
                                }
                                if (price.validUpto && priceData.validUpto) {
                                    let lastDate = new Date(price.validUpto)
                                    let newDate = new Date(priceData.validUpto)
                                    if (lastDate.getDate() != newDate.getDate() || lastDate.getMonth() != newDate.getMonth() || lastDate.getFullYear() == newDate.getFullYear()) {
                                        history.validUpto = price.validUpto
                                        changes.push('VALIDITY')
                                    }
                                } else if ((priceData.validUpto == null || priceData.validUpto == undefined) && price.validUpto) {
                                    history.validUpto = price.validUpto
                                    changes.push('VALIDITY')
                                } else if ((price.validUpto == null || price.validUpto == undefined) && price.validUpto) {
                                    changes.push('VALIDITY')
                                }
                                if (priceData.priceTakenFrom && price.priceTakenFrom != priceData.priceTakenFrom) {
                                    history.priceTakenFrom = price.priceTakenFrom
                                    changes.push('PRICE_TAKEN_FROM')
                                }
                                if (price.isDeleted) {
                                    history.isDeleted = true
                                    changes.push('UNDELETED')
                                }

                                priceData.isDeleted = false

                                let historyData = {}
                                historyData.by = req.identity.id
                                historyData.pastValues = history
                                historyData.updates = changes
                                historyData.for = price.id
                                Logisticprice.update({ id: price.id }, priceData).then(function (fc) {
                                    if (changes.length > 0) {
                                        Logisticpricehistory.create(historyData).then(function () {
                                            priceObj.comment = ''
                                            callback()
                                        }).fail(function (error) {
                                            callback()
                                        })
                                    } else {
                                        priceObj.comment = 'Nothing to update, this record already existed'
                                        callback()
                                    }
                                }).fail(function (error) {
                                    priceObj.comment = 'Unknow error occurred'
                                    callback()
                                })
                            } else {
                                Logisticprice.create(priceData).then(function (fc) {
                                    priceObj.comment = ''
                                    callback()
                                }).fail(function (error) {
                                    priceObj.comment = 'Unknow error occurred'
                                    callback()
                                })
                            }
                        })
                    }
                }, function (error) {
                    var json = priceResponses;
                    var xls = json2xls(json);
                    let ressponsseFilePath = 'csvs/lpresponse.csv'
                    fs.writeFileSync('./assets/' + ressponsseFilePath, xls, 'binary')
                    fs.unlink(filePath, (err) => {
                        if (err) {

                        }
                    })
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: error
                            },
                        });
                    } else {
                        if (failedObjects > 0) {
                            return res.jsonx({
                                success: true,
                                data: {
                                    message: 'Prices added but ' + failedObjects + ' prices failed to add due to inappropriate data.',
                                    filePath: ressponsseFilePath
                                },
                            });
                        } else {
                            return res.jsonx({
                                success: true,
                                data: {
                                    message: 'Prices added successfully.',
                                    filePath: ressponsseFilePath
                                },
                            });
                        }
                    }
                });
            })
        } else {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: "Valid file not found."
                },
            });
        }
    },

    get: function (req, res) {
        API(LogisticpriceService.get, req, res);
    },

    categoryWiseCarrryLoadCapacity: function (req, res) {
        API(LogisticpriceService.categoryWiseCarrryLoadCapacity, req, res);
    },

    getListForLoadSectionsSourceWise: function (req, res) {
        API(LogisticpriceService.getListForLoadSectionsSourceWise, req, res);
    },

    getListForLoadSectionsDestinationWise: function (req, res) {
        API(LogisticpriceService.getListForLoadSectionsDestinationWise, req, res);
    },

    cropsrouteprice: function (req, res) {
        let destinationPincode = req.body.destinationPincode
        let cropId = req.body.cropId
        let quantity = req.body.quantity
        let origin = req.body.origin
        let destination = req.body.destination
        if (destination) {
            destination = destination.replace("↵", ", ");
            destination = destination.replace("\n", ", ");
        }

        if (cropId && quantity && destinationPincode) {
            Crops.findOne({ id: cropId }, { fields: ['category', 'market', 'pincode'] }).then(function (crop) {
                Market.findOne({ id: String(crop.market) }).populate('GM', { select: ['pincode'] }).then(function (mkt) {
                    let sourceP = crop.pincode
                    if (mkt && mkt.GM && mkt.GM.pincode) {
                        sourceP = mkt.GM.pincode
                    }
                    origin = String(sourceP)
                    let qry = {}
                    qry.isDeleted = false
                    let category = crop.category

                    qry.destination = parseInt(destinationPincode)
                    qry.category = category
                    qry.source = sourceP

                    let now = new Date()

                    qry.$or = [{ validUpto: null }, { validUpto: undefined }, { validUpto: { $gte: now } }]
                    Logisticprice.find(qry).sort('load desc').then(function (lprices) {
                        if (lprices.length > 0) {
                            let lastPrice = 0
                            let lastLoad = 0
                            let idx = -1
                            for (var i = 0; i < lprices.length; i++) {

                                //crop.quanity condition replace with quantity for forntend bid placing time put quantity change according price
                                if (lprices[i].load > quantity || i == 0 || lprices[i].load == quantity) {
                                    lastPrice = lprices[i].price
                                    lastLoad = lprices[i].load
                                    idx = i
                                } else {
                                    break
                                }
                            }

                            if (idx > -1) {
                                let dist = {}
                                dist['rate'] = lastPrice;
                                if (lprices[idx].distanceInMeters != undefined) {
                                    dist['distance'] = { 'value': lprices[idx].distanceInMeters, 'text': String(lprices[idx].distanceInMeters / 1000) + " km" }
                                    if (lprices[idx].travelDurationInSec != undefined) {
                                        dist['duration'] = { 'value': lprices[idx].travelDurationInSec, 'text': String(lprices[idx].travelDurationInSec / 60) + " mins" }
                                    } else {
                                        dist['duration'] = { 'value': 0, 'text': "Time Not available" }
                                    }
                                    return res.json({
                                        success: 'true',
                                        data: dist
                                    });
                                } else {
                                    let origins = [origin];
                                    let destinations = [destinationPincode];
                                    if (destination) {
                                        destinations = [destination];
                                    }

                                    let googleApiKey = constantObj.googlePlaces.key;


                                    distance.key(googleApiKey);
                                    distance.units('metric');

                                    let errorMessage = "Input address not valid";
                                    let errorFlag = false;

                                    distance.matrix(origins, destinations, function (err, distances) {
                                        if (distances.status == 'OK') {
                                            for (var i = 0; i < origins.length; i++) {
                                                for (var j = 0; j < destinations.length; j++) {
                                                    var origin = distances.origin_addresses[i];
                                                    var destination = distances.destination_addresses[j];
                                                    if (distances.rows[0].elements[j].status == 'OK') {
                                                        // dist = distances.rows[i].elements[j].distance.text;
                                                        dist = distances.rows[i].elements[j];
                                                        errorFlag = false;
                                                        break;
                                                    } else {
                                                        errorFlag = true;
                                                    }
                                                }
                                            }

                                            if (!errorFlag) {
                                                dist['rate'] = parseFloat((lastPrice).toFixed(2));
                                                return res.json({
                                                    success: 'true',
                                                    data: dist
                                                });
                                            } else {
                                                dist['distance'] = { 'value': 0, 'text': "Distance not available" }
                                                dist['duration'] = { 'value': 0, 'text': "Time Not available" }
                                                dist['rate'] = parseFloat((lastPrice).toFixed(2));
                                                return res.json({
                                                    success: 'true',
                                                    data: dist
                                                });
                                            }
                                        }
                                    });
                                }
                            } else {
                                let origins = [origin];
                                let destinations = [destinationPincode];
                                if (destination) {
                                    destinations = [destination];
                                }
                                let googleApiKey = constantObj.googlePlaces.key;


                                distance.key(googleApiKey);
                                distance.units('metric');

                                let dist = '';
                                let errorMessage = "Input address not valid";
                                let errorFlag = false;

                                distance.matrix(origins, destinations, function (err, distances) {
                                    if (err) {
                                        // return 
                                        errorFlag = true;
                                        return res.json({
                                            success: 'false',
                                            message: errorMessage
                                        });
                                    }
                                    if (!distances) {
                                        // return 
                                        errorFlag = true;
                                        return res.json({
                                            success: 'false',
                                            message: errorMessage
                                        });
                                    }

                                    if (distances == 'undefined') {
                                        errorFlag = true;
                                        return res.json({
                                            success: 'false',
                                            message: errorMessage
                                        });
                                    }

                                    if (distances.status == 'OK') {
                                        for (var i = 0; i < origins.length; i++) {
                                            for (var j = 0; j < destinations.length; j++) {
                                                var origin = distances.origin_addresses[i];
                                                var destination = distances.destination_addresses[j];
                                                if (distances.rows[0].elements[j].status == 'OK') {
                                                    // dist = distances.rows[i].elements[j].distance.text;
                                                    dist = distances.rows[i].elements[j];
                                                    errorFlag = false;
                                                    break;
                                                } else {
                                                    errorFlag = true;
                                                }
                                            }
                                        }

                                        if (!errorFlag) {
                                            let distancesss = (dist.distance.value / 1000);
                                            Settings.find({}).then(function (settings) {
                                                if (settings.length > 0) {
                                                    let setting = settings[0]
                                                    var logisticPricePerKM = setting.crop.logisticCharges
                                                    if (!logisticPricePerKM) {
                                                        logisticPricePerKM = 15.5
                                                    }

                                                    let itemRate = (distancesss * logisticPricePerKM);
                                                    dist['rate'] = parseFloat((itemRate).toFixed(2));
                                                    return res.json({
                                                        success: 'true',
                                                        data: dist
                                                    });
                                                } else {
                                                    return res.json({
                                                        success: 'false',
                                                        message: "Unknown Error Occurred"
                                                    });
                                                }
                                            }).fail(function (err) {
                                                return res.json({
                                                    success: 'false',
                                                    message: err
                                                });
                                            })
                                        } else {
                                            return res.json({
                                                success: 'false',
                                                message: errorMessage
                                            });
                                        }
                                    } else {

                                        return res.json({
                                            success: 'false',
                                            message: errorMessage
                                        });
                                    }
                                });
                            }
                        } else {
                            let origins = [origin];
                            let destinations = [destinationPincode];
                            if (destination) {
                                destinations = [destination];
                            }

                            let googleApiKey = constantObj.googlePlaces.key;


                            distance.key(googleApiKey);
                            distance.units('metric');

                            let dist = '';
                            let errorMessage = "Input address not valid";
                            let errorFlag = false;

                            distance.matrix(origins, destinations, function (err, distances) {

                                if (err) {
                                    // return 
                                    errorFlag = true;
                                    return res.json({
                                        success: 'false',
                                        message: errorMessage
                                    });
                                }
                                if (!distances) {
                                    // return 
                                    errorFlag = true;
                                    return res.json({
                                        success: 'false',
                                        message: errorMessage
                                    });
                                }

                                if (distances == 'undefined') {
                                    errorFlag = true;
                                    return res.json({
                                        success: 'false',
                                        message: errorMessage
                                    });
                                }

                                if (distances.status == 'OK') {
                                    for (var i = 0; i < origins.length; i++) {
                                        for (var j = 0; j < destinations.length; j++) {
                                            var origin = distances.origin_addresses[i];
                                            var destination = distances.destination_addresses[j];
                                            if (distances.rows[0].elements[j].status == 'OK') {
                                                // dist = distances.rows[i].elements[j].distance.text;
                                                dist = distances.rows[i].elements[j];
                                                errorFlag = false;
                                                break;
                                            } else {
                                                errorFlag = true;
                                            }
                                        }
                                    }

                                    if (!errorFlag) {
                                        let distancesss = (dist.distance.value / 1000);
                                        Settings.find({}).then(function (settings) {
                                            if (settings.length > 0) {
                                                let setting = settings[0]
                                                var logisticPricePerKM = setting.crop.logisticCharges
                                                if (!logisticPricePerKM) {
                                                    logisticPricePerKM = 15.5
                                                }

                                                let itemRate = (distancesss * logisticPricePerKM);
                                                dist['rate'] = parseFloat((itemRate).toFixed(2));
                                                return res.json({
                                                    success: 'true',
                                                    data: dist
                                                });
                                            } else {
                                                return res.json({
                                                    success: 'false',
                                                    message: "Unknown Error Occurred"
                                                });
                                            }
                                        }).fail(function (err) {
                                            return res.json({
                                                success: 'false',
                                                message: err
                                            });
                                        })
                                    } else {
                                        return res.json({
                                            success: 'false',
                                            message: errorMessage
                                        });
                                    }
                                } else {

                                    return res.json({
                                        success: 'false',
                                        message: errorMessage
                                    });
                                }
                            });
                        }
                    })
                })
            })
        } else {
            return res.json({
                success: 'false',
                message: 'Please send crop Info, quantity and destination pincode'
            });
        }
    },

};