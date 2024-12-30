/**
  * #DESC:  In this class/files crops related functions
  * #Request param: Crops add form data values
  * #Return : Boolen and sucess message
  * #Author: 
  */

var Promise = require('bluebird'),
    promisify = Promise.promisify;
var constantObj = sails.config.constants;
var commonServiceObj = require('./commonService');
const { resolve, reject } = require('bluebird');

module.exports = {


    // cropsroutepriceModernTrade: function (data, context, req) {
    //     var distance = require('google-distance-matrix');

    //     // console.log('oooo', req)
    //     let destinationPincode = req.body.destinationPincode
    //     let cropId = req.body.cropId
    //     let quantity = req.body.quantity
    //     let origin = req.body.origin
    //     let destination = req.body.destination
    //     if (destination) {
    //         destination = destination.replace("↵", ", ");
    //         destination = destination.replace("\n", ", ");
    //     }

    //     if (cropId && quantity && destinationPincode) {
    //         return Crops.findOne({ id: cropId }, { fields: ['category', 'market', 'pincode'] }).then(function (crop) {
    //             return Market.findOne({ id: String(crop.market) }).populate('GM', { select: ['pincode'] }).then(function (mkt) {
    //                 let sourceP = crop.pincode
    //                 if (mkt && mkt.GM && mkt.GM.pincode) {
    //                     sourceP = mkt.GM.pincode
    //                 }
    //                 origin = String(sourceP)
    //                 let qry = {}
    //                 qry.isDeleted = false
    //                 let category = crop.category

    //                 qry.destination = parseInt(destinationPincode)
    //                 qry.category = category
    //                 qry.source = sourceP

    //                 let now = new Date()

    //                 qry.$or = [{ validUpto: null }, { validUpto: undefined }, { validUpto: { $gte: now } }]
    //                 return Logisticprice.find(qry).sort('load desc').then(function (lprices) {
    //                     if (lprices.length > 0) {
    //                         let lastPrice = 0
    //                         let lastLoad = 0
    //                         let idx = -1
    //                         for (var i = 0; i < lprices.length; i++) {
    //                             if (lprices[i].load > crop.quantity || i == 0 || lprices[i].load == crop.quantity) {
    //                                 lastPrice = lprices[i].price
    //                                 lastLoad = lprices[i].load
    //                                 idx = i
    //                             } else {
    //                                 break
    //                             }
    //                         }

    //                         if (idx > -1) {
    //                             let dist = {}
    //                             dist['rate'] = lastPrice;
    //                             if (lprices[idx].distanceInMeters != undefined) {
    //                                 dist['distance'] = { 'value': lprices[idx].distanceInMeters, 'text': String(lprices[idx].distanceInMeters / 1000) + " km" }
    //                                 if (lprices[idx].travelDurationInSec != undefined) {
    //                                     dist['duration'] = { 'value': lprices[idx].travelDurationInSec, 'text': String(lprices[idx].travelDurationInSec / 60) + " mins" }
    //                                 } else {
    //                                     dist['duration'] = { 'value': 0, 'text': "Time Not available" }
    //                                 }
    //                                 console.log("2")
    //                                 return ({
    //                                     success: 'true',
    //                                     data: dist
    //                                 });
    //                             } else {
    //                                 let origins = [origin];
    //                                 let destinations = [destinationPincode];
    //                                 if (destination) {
    //                                     destinations = [destination];
    //                                 }

    //                                 let googleApiKey = constantObj.googlePlaces.key;


    //                                 distance.key(googleApiKey);
    //                                 distance.units('metric');

    //                                 let errorMessage = "Input address not valid";
    //                                 let errorFlag = false;

    //                                 return distance.matrix(origins, destinations, function (err, distances) {
    //                                     if (distances.status == 'OK') {
    //                                         for (var i = 0; i < origins.length; i++) {
    //                                             for (var j = 0; j < destinations.length; j++) {
    //                                                 var origin = distances.origin_addresses[i];
    //                                                 var destination = distances.destination_addresses[j];
    //                                                 if (distances.rows[0].elements[j].status == 'OK') {
    //                                                     // dist = distances.rows[i].elements[j].distance.text;
    //                                                     dist = distances.rows[i].elements[j];
    //                                                     errorFlag = false;
    //                                                     break;
    //                                                 } else {
    //                                                     errorFlag = true;
    //                                                 }
    //                                             }
    //                                         }

    //                                         if (!errorFlag) {
    //                                             dist['rate'] = parseFloat((lastPrice).toFixed(2));
    //                                             return ({
    //                                                 success: 'true',
    //                                                 data: dist
    //                                             });
    //                                         } else {
    //                                             dist['distance'] = { 'value': 0, 'text': "Distance not available" }
    //                                             dist['duration'] = { 'value': 0, 'text': "Time Not available" }
    //                                             dist['rate'] = parseFloat((lastPrice).toFixed(2));
    //                                             return ({
    //                                                 success: 'true',
    //                                                 data: dist
    //                                             });
    //                                         }
    //                                     }
    //                                 });
    //                             }
    //                         } else {
    //                             let origins = [origin];
    //                             let destinations = [destinationPincode];
    //                             if (destination) {
    //                                 destinations = [destination];
    //                             }
    //                             let googleApiKey = constantObj.googlePlaces.key;


    //                             distance.key(googleApiKey);
    //                             distance.units('metric');

    //                             let dist = '';
    //                             let errorMessage = "Input address not valid";
    //                             let errorFlag = false;
    //                             return new Promise((resolve, reject) => {
    //                                 distance.matrix(origins, destinations, function (err, distances) {
    //                                     if (err) {
    //                                         // return 
    //                                         errorFlag = true;
    //                                         reject({
    //                                             success: 'false',
    //                                             message: errorMessage
    //                                         });
    //                                     }
    //                                     if (!distances) {
    //                                         // return 
    //                                         errorFlag = true;
    //                                         reject({
    //                                             success: 'false',
    //                                             message: errorMessage
    //                                         });
    //                                     }

    //                                     if (distances == 'undefined') {
    //                                         errorFlag = true;
    //                                         reject({
    //                                             success: 'false',
    //                                             message: errorMessage
    //                                         });
    //                                     }

    //                                     if (distances.status == 'OK') {
    //                                         for (var i = 0; i < origins.length; i++) {
    //                                             for (var j = 0; j < destinations.length; j++) {
    //                                                 var origin = distances.origin_addresses[i];
    //                                                 var destination = distances.destination_addresses[j];
    //                                                 if (distances.rows[0].elements[j].status == 'OK') {
    //                                                     // dist = distances.rows[i].elements[j].distance.text;
    //                                                     dist = distances.rows[i].elements[j];
    //                                                     errorFlag = false;
    //                                                     break;
    //                                                 } else {
    //                                                     errorFlag = true;
    //                                                 }
    //                                             }
    //                                         }

    //                                         if (!errorFlag) {
    //                                             let distancesss = (dist.distance.value / 1000);
    //                                             Settings.find({}).then(function (settings) {
    //                                                 if (settings.length > 0) {
    //                                                     let setting = settings[0]
    //                                                     var logisticPricePerKM = setting.crop.logisticCharges
    //                                                     if (!logisticPricePerKM) {
    //                                                         logisticPricePerKM = 15.5
    //                                                     }

    //                                                     let itemRate = (distancesss * logisticPricePerKM);
    //                                                     dist['rate'] = parseFloat((itemRate).toFixed(2));
    //                                                     resolve({
    //                                                         success: 'true',
    //                                                         data: dist
    //                                                     });
    //                                                 } else {
    //                                                     reject({
    //                                                         success: 'false',
    //                                                         message: "Unknown Error Occurred"
    //                                                     });
    //                                                 }
    //                                             }).fail(function (err) {
    //                                                 reject({
    //                                                     success: 'false',
    //                                                     message: err
    //                                                 });
    //                                             })
    //                                         } else {
    //                                             reject({
    //                                                 success: 'false',
    //                                                 message: errorMessage
    //                                             });
    //                                         }
    //                                     } else {

    //                                         reject({
    //                                             success: 'false',
    //                                             message: errorMessage
    //                                         });
    //                                     }
    //                                 });
    //                             })
    //                         }
    //                     } else {
    //                         let origins = [origin];
    //                         let destinations = [destinationPincode];
    //                         if (destination) {
    //                             destinations = [destination];
    //                         }

    //                         let googleApiKey = constantObj.googlePlaces.key;


    //                         distance.key(googleApiKey);
    //                         distance.units('metric');

    //                         let dist = '';
    //                         let errorMessage = "Input address not valid";
    //                         let errorFlag = false;
    //                         return new Promise((resolve, reject) => {
    //                             distance.matrix(origins, destinations, function (err, distances) {

    //                                 if (err) {
    //                                     // return 
    //                                     errorFlag = true;
    //                                     reject({
    //                                         success: 'false',
    //                                         message: errorMessage
    //                                     });
    //                                 }
    //                                 if (!distances) {
    //                                     // return 
    //                                     errorFlag = true;
    //                                     reject({
    //                                         success: 'false',
    //                                         message: errorMessage
    //                                     });
    //                                 }

    //                                 if (distances == 'undefined') {
    //                                     errorFlag = true;
    //                                     reject({
    //                                         success: 'false',
    //                                         message: errorMessage
    //                                     });
    //                                 }

    //                                 if (distances.status == 'OK') {
    //                                     for (var i = 0; i < origins.length; i++) {
    //                                         for (var j = 0; j < destinations.length; j++) {
    //                                             var origin = distances.origin_addresses[i];
    //                                             var destination = distances.destination_addresses[j];
    //                                             if (distances.rows[0].elements[j].status == 'OK') {
    //                                                 // dist = distances.rows[i].elements[j].distance.text;
    //                                                 dist = distances.rows[i].elements[j];
    //                                                 errorFlag = false;
    //                                                 break;
    //                                             } else {
    //                                                 errorFlag = true;
    //                                             }
    //                                         }
    //                                     }

    //                                     if (!errorFlag) {
    //                                         let distancesss = (dist.distance.value / 1000);

    //                                         Settings.find({}).then(function (settings) {
    //                                             if (settings.length > 0) {
    //                                                 let setting = settings[0]
    //                                                 var logisticPricePerKM = setting.crop.logisticCharges
    //                                                 if (!logisticPricePerKM) {
    //                                                     logisticPricePerKM = 15.5
    //                                                 }

    //                                                 let itemRate = (distancesss * logisticPricePerKM);
    //                                                 dist['rate'] = parseFloat((itemRate).toFixed(2));
    //                                                 // console.log('distance===', dist)

    //                                                 resolve({
    //                                                     success: 'true',
    //                                                     data: dist
    //                                                 });
    //                                             } else {
    //                                                 reject({
    //                                                     success: 'false',
    //                                                     message: "Unknown Error Occurred"
    //                                                 });
    //                                             }
    //                                         })


    //                                     } else {
    //                                         reject({
    //                                             success: 'false',
    //                                             message: errorMessage
    //                                         });
    //                                     }
    //                                 } else {

    //                                     reject({
    //                                         success: 'false',
    //                                         message: errorMessage
    //                                     });
    //                                 }
    //                             });
    //                         })

    //                     }
    //                 })
    //             })
    //         })
    //     } else {
    //         return ({
    //             success: 'false',
    //             message: 'Please send crop Info, quantity and destination pincode'
    //         });
    //     }
    // },

    assignedLogisticPriceCategory: function (data, context) {

        return Logisticprice.find({ isDeleted: false }, { fields: ['category'] }).then(function (category) {
            // console.log(category)
            let cateIds = _.uniq(_.pluck(category, 'category'))
            // console.log(cateIds)
            return Category.find({ id: cateIds }, { fields: ['name', 'id'] }).then(function (cat) {
                if (cat) {
                    return {
                        success: true,
                        data: cat
                    }
                } else {
                    return {
                        success: false,
                        error: {
                            code: 400,
                            message: "No data found"
                        }
                    };
                }
            }).fail(function (error) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: error
                    }
                };
            })
        });

    },

    save: function (data, context) {
        if (data.category == undefined) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: "Please provide category of product"
                },
            };
        }

        if (data.source == undefined) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: "Please provide source pincode"
                },
            };
        }

        if (data.destination == undefined) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: "Please provide destination pincode"
                },
            };
        }

        if (data.carryCapacity == undefined) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: "What is the carrying capacity of vehicle?"
                },
            };
        }

        if (data.load == undefined) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: "How much load can be kept in vehicle?"
                },
            };
        }

        if (parseInt(data.load) > parseInt(data.carryCapacity)) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: "Loading weight can not be more than carrying capacity."
                },
            };
        }

        if (data.price == undefined) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: "What is the price?"
                },
            };
        }

        if (data.validUpto != undefined && data.validUpto != null) {
            if (data.validUpto == '' || data.validUpto.length == 0) {
                delete data.validUpto
            }
        } else {
            delete data.validUpto
        }

        data.addedBy = context.identity.id
        data.addedOn = new Date()

        let qry = {}
        qry.category = data.category
        qry.source = data.source
        qry.destination = data.destination
        qry.carryCapacity = data.carryCapacity

        return Logisticprice.findOne(qry).then(function (price) {
            if (price) {
                let history = {}
                let changes = []
                if (price.price != parseInt(data.price)) {
                    history.price = price.price
                    changes.push('PRICE')
                }
                if (price.load != parseInt(data.load)) {
                    history.load = price.load
                    changes.push('LOAD')
                }
                if (data.margin != null && data.margin != undefined && price.margin != parseFloat(data.margin)) {
                    history.margin = price.margin
                    changes.push('MARGIN')
                }
                if (price.validUpto && data.validUpto) {
                    let lastDate = new Date(price.validUpto)
                    let newDate = new Date(data.validUpto)
                    if (lastDate.getDate() != newDate.getDate() || lastDate.getMonth() != newDate.getMonth() || lastDate.getFullYear() == newDate.getFullYear()) {
                        history.validUpto = price.validUpto
                        changes.push('VALIDITY')
                    }
                } else if ((data.validUpto == null || data.validUpto == undefined) && price.validUpto) {
                    history.validUpto = price.validUpto
                    changes.push('VALIDITY')
                } else if ((price.validUpto == null || price.validUpto == undefined) && price.validUpto) {
                    changes.push('VALIDITY')
                }
                if (data.priceTakenFrom && price.priceTakenFrom != data.priceTakenFrom) {
                    history.priceTakenFrom = price.priceTakenFrom
                    changes.push('PRICE_TAKEN_FROM')
                }
                if (price.isDeleted) {
                    history.isDeleted = true
                    changes.push('UNDELETED')
                }

                data.isDeleted = false

                let historyData = {}
                historyData.by = context.identity.id
                historyData.pastValues = history
                historyData.updates = changes
                historyData.for = price.id

                return Logisticprice.update({ id: price.id }, data).then(function (fc) {
                    if (changes.length > 0) {
                        return Logisticpricehistory.create(historyData).then(function () {
                            return {
                                success: true,
                                data: fc[0].id,
                                message: 'Price updated successfully'
                            }
                        })
                    } else {
                        return {
                            success: true,
                            data: fc[0].id,
                            message: 'Nothing to update. Record already existed.'
                        }
                    }
                }).fail(function (error) {
                    return {
                        success: false,
                        error: {
                            code: 404,
                            message: error
                        }
                    };
                })
            } else {
                return Logisticprice.create(data).then(function (fc) {
                    return {
                        success: true,
                        data: fc.id,
                        message: 'Price added successfully'
                    }
                }).fail(function (error) {
                    return {
                        success: false,
                        error: {
                            code: 404,
                            message: error
                        }
                    };
                })
            }
        })
    },

    get: function (data, context) {
        return Logisticprice.findOne({ id: data.id }).populate('category', { select: ['name'] }).populate('addedBy', { select: ['fullName'] }).then(function (updatedfc) {
            if (updatedfc) {
                return {
                    success: true,
                    data: updatedfc
                }
            } else {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: "No data found"
                    }
                };
            }
        }).fail(function (error) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: error
                }
            };
        })
    },

    categoryWiseCarrryLoadCapacity: function (data, context, req, res) {
        var query = {};
        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

        let category = req.param('category');
        if (category) {
            query.category = ObjectId(category)
        }

        let source = req.param('source');
        if (source) {
            query.source = parseInt(source)
        }

        let sourceName = req.param('sourceName');
        if (sourceName) {
            query.sourceName = sourceName
        }

        let destinationName = req.param('destinationName');
        if (destinationName) {
            query.destinationName = destinationName
        }

        let destination = req.param('destination');
        if (destination) {
            query.destination = parseInt(destination)
        }

        let carryCapacity = req.param('carryCapacity');
        if (carryCapacity) {
            query.carryCapacity = parseInt(carryCapacity)
        }

        let load = req.param('load');
        if (load) {
            query.load = parseInt(load)
        }

        let priceTakenFrom = req.param('priceTakenFrom');
        if (priceTakenFrom) {
            query.priceTakenFrom = { 'like': '%' + priceTakenFrom + '%' }
        }

        let validUpto = req.param('validUpto');
        if (validUpto) {
            query.validUpto = { $lte: new Date(validUpto) }
        }

        query.isDeleted = false

        Logisticprice.native(function (err, prices) {
            prices.aggregate([
                // {
                //     $sort: {"carryCapacity" : 1}
                // },
                {
                    $match: query
                },
                {
                    $lookup: {
                        from: 'category',
                        localField: 'category',
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
                            category: "$category._id",
                            categoryName: "$category.name",
                            carryCapacity: "$carryCapacity",
                            load: "$load",
                            source: "$source",
                        },
                        destinationCount: {
                            $sum: 1
                        },
                        destinations: {
                            $push: "$destination"
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            category: "$_id.category",
                            categoryName: "$_id.categoryName",
                            carryCapacity: "$_id.carryCapacity",
                            load: "$_id.load",
                        },
                        // sources: {
                        //     $push: {
                        //         source: "$_id.source",
                        //         destinations: "$destinationCount"
                        //     }
                        // },

                        sourcesCount: {
                            $sum: 1
                        },
                        // maxDestinations: { $max: "$destinationCount"},
                        allDestinations: { $push: "$destinations" }
                    }
                },
                {
                    $sort: { "_id.carryCapacity": 1, "_id.load": 1 }
                },
                {
                    $group: {
                        _id: {
                            id: "$_id.category",
                            name: "$_id.categoryName",
                        },
                        capacity: {
                            $push: {
                                carryCapacity: "$_id.carryCapacity",
                                load: "$_id.load",
                                sources: "$sources",
                                sourcesCount: "$sourcesCount",
                                // maxDestinations: "$maxDestinations"
                                maxDestinations: {
                                    $size: {
                                        $reduce: {
                                            "input": "$allDestinations",
                                            "initialValue": [],
                                            "in": {
                                                $setUnion: ["$$value", "$$this"]
                                            }
                                        }
                                    }
                                },
                                // allDestination: { $reduce: {
                                //                                 "input": "$allDestinations",
                                //                                 "initialValue": [],
                                //                                 "in": { 
                                //                                     $setUnion: ["$$value", "$$this"] 
                                //                                 }
                                //                             } },
                                // allDestinations: "$allDestinations"

                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        category: "$_id",
                        capacity: "$capacity",
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
        })
    },

    getListForLoadSectionsSourceWise: function (data, context, req, res) {
        var query = {};
        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

        var page = req.param('destinationpage');
        var count = parseInt(req.param('destinationcount'));
        var skipNo = (page - 1) * count;

        var hpage = req.param('sourcepage');
        var hcount = -1
        if (req.param('sourcecount')) {
            hcount = parseInt(req.param('sourcecount'));
        }
        var hskipNo = 0
        if (hpage != undefined && hcount != undefined) {
            hskipNo = (hpage - 1) * hcount;
        }

        let category = req.param('category');
        if (category) {
            query.category = ObjectId(category)
        }

        let source = req.param('source');
        if (source) {
            query.source = parseInt(source)
        }

        let sourceName = req.param('sourceName');
        if (sourceName) {
            query.sourceName = sourceName
        }

        let destinationName = req.param('destinationName');
        if (destinationName) {
            query.destinationName = destinationName
        }

        let destination = req.param('destination');
        if (destination) {
            query.destination = parseInt(destination)
        }

        let carryCapacity = req.param('carryCapacity');
        if (carryCapacity) {
            query.carryCapacity = parseInt(carryCapacity)
        }

        let load = req.param('load');
        if (load) {
            query.load = parseInt(load)
        }

        let priceTakenFrom = req.param('priceTakenFrom');
        if (priceTakenFrom) {
            query.priceTakenFrom = { 'like': '%' + priceTakenFrom + '%' }
        }

        let validUpto = req.param('validUpto');
        if (validUpto) {
            query.validUpto = { $lte: new Date(validUpto) }
        }

        query.isDeleted = false

        Logisticprice.native(function (err, prices) {
            prices.aggregate([
                {
                    $match: query
                },
                {
                    $sort: { "destination": 1 }
                },
                {
                    $group: {
                        _id: "$source",
                        total: {
                            $sum: 1
                        },
                        destinations: {
                            $push: {
                                destination: "$destination",
                                destinationName: "$destinationName",
                                price: "$price",
                                validUpto: "$validUpto",
                                id: "$_id"
                            }
                        },
                        sourceName: { $push: "$sourceName" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        source: "$_id",
                        sourceName: { $cond: { if: { $gte: [{ $size: "$sourceName" }, 0] }, then: { $arrayElemAt: ["$sourceName", 0] }, else: '' } },
                        destinations: { $slice: ["$destinations", skipNo, count] },
                        total: "$total"
                    }
                },
                {
                    $sort: { "source": 1 }
                },
            ], function (err, results) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    var finalResult = results
                    if (hcount > -1) {
                        finalResult = results.slice(hskipNo, hskipNo + hcount)
                    }
                    return res.jsonx({
                        success: true,
                        data: {
                            sources: finalResult,
                            totalSources: results.length
                        }
                    });
                }
            });
        })
    },

    getListForLoadSectionsDestinationWise: function (data, context, req, res) {
        var query = {};
        var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

        var page = req.param('sourcepage');
        var count = parseInt(req.param('sourcecount'));
        var skipNo = (page - 1) * count;

        var hpage = req.param('destinationpage');
        var hcount = -1
        if (req.param('destinationcount')) {
            hcount = parseInt(req.param('destinationcount'));
        }
        var hskipNo = 0
        if (hpage != undefined && hcount != undefined) {
            hskipNo = (hpage - 1) * hcount;
        }

        let category = req.param('category');
        if (category) {
            query.category = ObjectId(category)
        }

        let source = req.param('source');
        if (source) {
            query.source = parseInt(source)
        }

        let sourceName = req.param('sourceName');
        if (sourceName) {
            query.sourceName = sourceName
        }

        let destinationName = req.param('destinationName');
        if (destinationName) {
            query.destinationName = destinationName
        }

        let destination = req.param('destination');
        if (destination) {
            query.destination = parseInt(destination)
        }

        let carryCapacity = req.param('carryCapacity');
        if (carryCapacity) {
            query.carryCapacity = parseInt(carryCapacity)
        }

        let load = req.param('load');
        if (load) {
            query.load = parseInt(load)
        }

        let priceTakenFrom = req.param('priceTakenFrom');
        if (priceTakenFrom) {
            query.priceTakenFrom = { 'like': '%' + priceTakenFrom + '%' }
        }

        let validUpto = req.param('validUpto');
        if (validUpto) {
            query.validUpto = { $lte: new Date(validUpto) }
        }

        query.isDeleted = false

        Logisticprice.native(function (err, prices) {
            prices.aggregate([
                {
                    $match: query
                },
                {
                    $sort: { "source": 1 }
                },
                {
                    $group: {
                        _id: "$destination",
                        total: {
                            $sum: 1
                        },
                        sources: {
                            $push: {
                                source: "$source",
                                sourceName: "$sourceName",
                                price: "$price",
                                validUpto: "$validUpto",
                                id: "$_id"
                            }
                        },
                        destinationName: { $push: "$destinationName" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        destination: "$_id",
                        destinationName: { $cond: { if: { $gte: [{ $size: "$destinationName" }, 0] }, then: { $arrayElemAt: ["$destinationName", 0] }, else: '' } },
                        sources: { $slice: ["$sources", skipNo, count] },
                        total: "$total"
                    }
                },
                {
                    $sort: { "destination": 1 }
                },
            ], function (err, results) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    var finalResult = results
                    if (hcount > -1) {
                        finalResult = results.slice(hskipNo, hskipNo + hcount)
                    }
                    return res.jsonx({
                        success: true,
                        data: {
                            destinations: finalResult,
                            totaldestinations: results.length
                        }
                    });
                }
            });
        })
    },

    update: function (data, context) {
        return Logisticprice.findOne({ id: data.id }).then(function (price) {
            if (price) {
                let history = {}
                let changes = []
                if (data.price && price.price != parseInt(data.price)) {
                    history.price = price.price
                    changes.push('PRICE')
                }
                if (data.load && price.load != parseInt(data.load)) {
                    history.load = price.load
                    changes.push('LOAD')
                }
                if (data.margin != null && data.margin != undefined && price.margin != parseFloat(data.margin)) {
                    history.margin = price.margin
                    changes.push('MARGIN')
                }
                if (data.validUpto) {
                    if (price.validUpto && data.validUpto) {
                        let lastDate = new Date(price.validUpto)
                        let newDate = new Date(data.validUpto)
                        if (lastDate.getDate() != newDate.getDate() || lastDate.getMonth() != newDate.getMonth() || lastDate.getFullYear() == newDate.getFullYear()) {
                            history.validUpto = price.validUpto
                            changes.push('VALIDITY')
                        }
                    } else if ((data.validUpto == null || data.validUpto == undefined) && price.validUpto) {
                        history.validUpto = price.validUpto
                        changes.push('VALIDITY')
                    } else if ((price.validUpto == null || price.validUpto == undefined) && price.validUpto) {
                        changes.push('VALIDITY')
                    }
                }
                if (data.priceTakenFrom && price.priceTakenFrom != data.priceTakenFrom) {
                    history.priceTakenFrom = price.priceTakenFrom
                    changes.push('PRICE_TAKEN_FROM')
                }

                if (price.isDeleted) {
                    history.isDeleted = true
                    data.isDeleted = false
                    changes.push('UNDELETED')
                }

                let historyData = {}
                historyData.by = context.identity.id
                historyData.pastValues = history
                historyData.updates = changes
                historyData.for = price.id

                return Logisticprice.update({ id: data.id }, data).then(function (updatedfc) {
                    if (updatedfc.length > 0) {
                        if (changes.length > 0) {
                            return Logisticpricehistory.create(historyData).then(function () {
                                return {
                                    success: true,
                                    data: updatedfc[0],
                                    message: "Successfully updated record"
                                }
                            })
                        } else {
                            return {
                                success: true,
                                data: updatedfc[0],
                                message: "Successfully updated record"
                            }
                        }
                    } else {
                        return {
                            success: false,
                            error: {
                                code: 400,
                                message: "Unknown error occurred"
                            }
                        };
                    }
                }).fail(function (error) {
                    return {
                        success: false,
                        error: {
                            code: 400,
                            message: error
                        }
                    };
                })
            } else {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: 'No price found'
                    }
                };
            }
        })
    },

    delete: function (data, context) {
        let query = { id: data.id }

        return Logisticprice.findOne(query).then(function (price) {
            if (price) {
                if (price.isDeleted) {
                    return {
                        success: false,
                        message: "Already deleted"
                    }
                } else {
                    let update = {}
                    update.isDeleted = true

                    let historyData = {}
                    historyData.by = context.identity.id
                    historyData.pastValues = { 'isDeleted': false }
                    historyData.updates = ['DELETED']
                    historyData.for = price.id

                    return Logisticprice.update({ id: price.id }, update).then(function (updatedfc) {
                        if (updatedfc.length > 0) {
                            return Logisticpricehistory.create(historyData).then(function () {
                                return {
                                    success: true,
                                    message: "Price deleted"
                                }
                            })
                        } else {
                            return {
                                success: false,
                                error: {
                                    code: 400,
                                    message: "Unknown error occurred"
                                }
                            };
                        }
                    }).fail(function (error) {
                        return {
                            success: false,
                            error: {
                                code: 400,
                                message: error
                            }
                        };
                    })
                }
            } else {
                return {
                    success: false,
                    message: "No Price found"
                }
            }
        }).fail(function (error) {
            return {
                success: false,
                error: error
            }
        })

        /*return Logisticprice.destroy(query).then(function(result) {
            if( !_.isEmpty(result) ){
                return {
                    success: true,
                    message: "Price deleted"
                }
            } else {
                return {
                    success: false,
                    message: "some error occured"
                }
            }
        }).fail(function(error){
            return {
                success: false,
                error: error
            }
        }) */
    },

    deleteMultiple: function (data, context) {
        let query = { id: { $in: JSON.parse(data.ids) } }
        return Logisticprice.find(query).then(function (prices) {
            if (prices.length > 0) {

                let historyDatas = []

                let idsToUpdate = []

                for (var i = 0; i < prices.length; i++) {
                    if (prices[i].isDeleted == false) {
                        let historyData = {}
                        historyData.by = context.identity.id
                        historyData.pastValues = { 'isDeleted': prices[i].isDeleted }
                        historyData.updates = ['DELETED']
                        historyData.for = prices[i].id

                        historyDatas.push(historyData)

                        idsToUpdate.push(prices[i].id)
                    }
                }

                if (idsToUpdate.length > 0) {
                    let update = {}
                    update.isDeleted = true

                    return Logisticprice.update({ id: idsToUpdate }, update).then(function (updatedfc) {
                        if (updatedfc.length > 0) {
                            return Logisticpricehistory.create(historyDatas).then(function () {
                                return {
                                    success: true,
                                    message: "Prices deleted"
                                }
                            })
                        } else {
                            return {
                                success: false,
                                error: {
                                    code: 400,
                                    message: "Unknown error occurred"
                                }
                            };
                        }
                    }).fail(function (error) {
                        return {
                            success: false,
                            error: {
                                code: 400,
                                message: error
                            }
                        };
                    })
                } else {
                    return {
                        success: false,
                        message: "No price to delete"
                    }
                }
            } else {
                return {
                    success: false,
                    message: "No Price found"
                }
            }
        }).fail(function (error) {
            return {
                success: false,
                error: error
            }
        })
        /*return Logisticprice.destroy(query).then(function(result) {
            if( !_.isEmpty(result) ){
                return {
                    success: true,
                    message: "Prices deleted"
                }
            } else {
                return {
                    success: false,
                    message: "some error occured"
                }
            }
        }).fail(function(error){
            return {
                success: false,
                error: error
            }
        }) */
    },







}