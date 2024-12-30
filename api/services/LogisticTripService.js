var GeoPoint = require('geopoint');
var constantObj = sails.config.constants;
const fs = require('fs');
var inside = require('point-in-geopolygon');

module.exports = {

    readLocation: function (data, context, req, res) {
        let path = 'assets/location/triplocations/' + data.id + '.json';
        let publicPath = 'location/triplocations/' + data.id + '.json';
        let prPublicPath = 'location/prescriberoutes/' + data.id + '.json';


        if (!fs.existsSync(path)) {
            return res.jsonx({
                success: false,
                error: 'no file found'
            })
        } else {
            fs.readFile(path, function (err, content) {
                if (err) throw err;

                var parseJson = content.length > 0 ? JSON.parse(content) : [];
                // console.log('error', parseJson.length)




                let locations = parseJson;
                let existingPoints = []
                let startTime = new Date()
                // console.log(startTime)
                // console.log(locations.length)
                let boundaries = data.boundaries;
                //console.log(boundaries, '=====')
                let mapBoundry = JSON.parse(boundaries);
                // console.log(mapBoundry, 'mapboundriy')
                // let mapBoundry = [[[26.111, 78.100], [30.4714500, 78.500], [30.4714500, 80.065278], [27.4714500, 80.065278], [27.4714500, 78.500], [26.111, 78.100]]];
                if (locations.length > 0) {
                    for (let i = 0; i < locations.length; i++) {
                        // console.log(i, 'i==', locations[i]);
                        let lat = locations[i].coord.lat;
                        let lng = locations[i].coord.lon;
                        if (inside.polygon([mapBoundry], [lat, lng])) {
                            existingPoints.push(locations[i]);
                        }
                    }

                    if (existingPoints.length > 100) {
                        let ind = Math.floor(existingPoints.length / 100);
                        // console.log(ind, 'ind')
                        var original = existingPoints;
                        existingPoints = original.filter(function (val, idx) {
                            if (idx % ind == 0)
                                return val;
                        })
                        // console.log(existingPoints.length)
                    }

                    // console.log(existingPoints)
                    let endTime = new Date()
                    // console.log(endTime)
                    let timeTaken = endTime - startTime
                    // console.log(timeTaken)
                    return res.jsonx({
                        success: true,
                        data: existingPoints,
                        filePath: publicPath,
                        prescribedRouteFilePath: prPublicPath
                    })
                } else {
                    return res.jsonx({
                        success: false,
                        error: 'no record found'
                    })
                }

            })
        }
    },
    resendTripOTTC: function (data, context, req, res) {
        LogisticTrip.findOne({ id: data.id }).populate('logisticPartner').populate('vehicle').populate('driver').then(function (trip) {
            if (trip) {
                let smsInfo = {}
                smsInfo.tripcode = String(trip.code)
                smsInfo.OTTC = String(trip.OTTC)
                smsInfo.numbers = [trip.logisticPartner.mobile, trip.driver.mobile]
                smsInfo.vehiclenumber = trip.vehicle.number

                commonService.sendOTTCSMS(smsInfo)

                return res.jsonx({
                    success: true,
                    message: "OTTC resent to driver and logisticPartner"
                })
            } else {
                return res.jsonx({
                    success: false,
                    error: "Trip not found"
                })
            }
        }).fail(function (err) {
            return res.jsonx({
                success: false,
                error: err
            })
        })
    },

    tripInfoFromOTTC: function (data, context, req, res) {
        var findOngoingTrip = {}
        findOngoingTrip.OTTC = data.OTTC
        findOngoingTrip.$or = [{ status: 'Created' }, { status: 'Tracking' }]
        if (!data.client_id || data.client_id == undefined || data.client_id == null) {
            return res.status(400).jsonx({
                success: false,
                error: "Client Id is missing"
            });
        }
        let selectedFields = ['status', 'runningStatus', 'code', 'OTTC', 'OTTCStatus', 'OTTCUsedDate', 'OTTCCreatedDate', 'totalDistanceToTravel', 'totalTimeToBeTaken', 'tripFinishedDate', 'logisticTimeFactor', 'delayTime', "logisticPartner", "vehicle", "driver", "orders", "destinationSequence"]
        LogisticTrip.find(findOngoingTrip, { fields: selectedFields }).populate('logisticPartner', { select: ["id", "companyName", "contactPerson", "mobile", "mobile1", "mobile2", "address", "city", "pincode", "state", "district", "email", "website", "numberOfVehicles", "nationalPermit", "speciality"] }).populate('vehicle', { select: ["id", "number", "type", "loadCapacity", "nationalPermit", "image"] }).populate('driver', { select: ["id", "name", "mobile", "dob", "licenceNumber"] }).populate('orders', { select: ["id", "code", "buyer", "seller", "bidId"] }).then(function (trips) {
            if (trips.length > 0) {
                // console.log(trips, 'tripes====')
                let trip = trips[0]
                if (trip.OTTCStatus == "Expired") {
                    return res.status(400).jsonx({
                        success: false,
                        error: "This OTTC is expired. Please request a new one."
                    });
                } else {
                    var buyers = Users.find({ id: _.pluck(trip.orders, 'buyer') }, { fields: ['id', 'fullName', 'mobile', 'email', 'pincode', 'address', 'district', 'state'] }).then(function (buyers) {
                        return buyers
                    });
                    var sellers = Users.find({ id: _.pluck(trip.orders, 'seller') }, { fields: ['id', 'fullName', 'mobile', 'email', 'pincode', 'address', 'district', 'state'] }).then(function (sellers) {
                        return sellers
                    });
                    var bids = Bids.find({ id: _.pluck(trip.orders, 'bidId') }, { fields: ['id', 'code', 'productType', 'amount', 'originalAmount', 'bidRate', 'totalAmount', 'originalTotalAmount', 'address', 'quantity', 'quantityUnit', 'status'] }).populate('crop', { select: ["id", "code", "name", "pincode", "variety", 'quantity', 'quantityUnit', 'price'] }).populate('input', { select: ["id", "code", "name", "pincode", "variety", 'quantity', 'quantityUnit', 'price'] }).then(function (bids) {
                        return bids
                    });
                    var orders = Orderedcarts.find({ id: _.pluck(trip.orders, 'orderId') }).populate('crop', { select: ["id", "code", "name", "pincode", "variety", 'quantity', 'quantityUnit', 'price'] }).populate('input', { select: ["id", "code", "name", "pincode", "variety", 'quantity', 'quantityUnit', 'price'] }).then(function (orders) {
                        return orders
                    });
                    var fieldTransactions = FieldTransactions.find({ id: _.pluck(trip.orders, 'fieldTransactionId') }).populate('buyer', { select: ["id", "name", "pincode", "email", 'address', 'phone'] }).then(function (fieldTransactions) {
                        return fieldTransactions
                    });

                    return [trip, buyers, sellers, bids, orders, fieldTransactions]
                }
            } else {
                return res.status(400).jsonx({
                    success: false,
                    error: "Trip does not exist."
                });
            }
        }).spread(function (trip, buyers, sellers, bids, orders, fieldTransactions) {
            buyers = _.indexBy(buyers, 'id');
            sellers = _.indexBy(sellers, 'id');
            bids = _.indexBy(bids, 'id');
            orders = _.indexBy(orders, 'id');
            fieldTransactions = _.indexBy(fieldTransactions, 'id');
            console.log(trip, '====trip')
            trip.orders = _.map(trip.orders, function (order) {
                order.buyer = buyers[order.buyer]
                order.seller = sellers[order.seller]
                order.orderId = orders[order.orderId]
                order.bidId = bids[order.bidId]
                order.fieldTransactionId = fieldTransactions[order.fieldTransactionId]

                delete order.buyer.password
                delete order.seller.password

                return order
            });
            // console.log({ client_id: data.client_id, user_id: trip.id, loginType: 'tracking' }, 'token info===')
            Tokens.generateToken({ client_id: data.client_id, user_id: trip.id, loginType: 'tracking' }).then(function (token) {

                let inputData = {};
                if (data.gcm_id) {
                    inputData.gcm_id = data.gcm_id;
                }
                if (data.device_token) {
                    inputData.device_token = data.device_token;
                }
                inputData.device_type = data.device_type;
                inputData.trip = trip.id;
                if (data.device_type == '' || data.device_type == undefined) {
                    inputData.device_type = "ANDROID";
                }

                inputData.access_token = token.access_token;
                // console.log(inputData, 'inputData=====')
                Triplogin.create(inputData).then(function (loginTrip) {
                    // console.log(loginTrip, 'loginTrip')
                    trip.OTTCStatus = "Expired"
                    trip.OTTCUsedDate = new Date()
                    trip.status = "Tracking"

                    let tripToUpdate = trip

                    delete tripToUpdate.orders

                    tripToUpdate.logisticPartner = trip.logisticPartner.id;
                    tripToUpdate.vehicle = trip.vehicle.id;
                    tripToUpdate.driver = trip.driver.id


                    LogisticTrip.update({ id: trip.id }, tripToUpdate).then(function (updatedTrip) {
                        if (updatedTrip) {
                            console.log('2====')
                            trip.access_token = token.access_token;
                            trip.refresh_token = token.refresh_token;
                            return res.jsonx({
                                success: true,
                                trip: trip
                            })
                        } else {
                            return res.status(400).jsonx({
                                success: false,
                                error: "Unknown error occurred."
                            });
                        }
                    }).fail(function (err) {
                        console.log('3====')
                        return res.status(400).jsonx({
                            success: false,
                            error: err
                        });
                    })
                }).fail(function (err) {
                    console.log('4====')
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                })
            })
        }).fail(function (err) {
            return res.status(400).jsonx({
                success: false,
                error: err
            });
        })
    },

    tripInfo: function (data, context, req, res) {
        let selectedFields = ['status', 'runningStatus', 'code', 'OTTC', 'OTTCStatus', 'OTTCUsedDate', 'OTTCCreatedDate', 'totalDistanceToTravel', 'totalTimeToBeTaken', 'tripFinishedDate', 'logisticTimeFactor', 'delayTime', "logisticPartner", "vehicle", "driver", "orders", "destinationSequence", "prescribedRoute", "tripStartDate"]
        LogisticTrip.find({ id: data.id }, { fields: selectedFields }).populate('logisticPartner', { select: ["id", "companyName", "contactPerson", "mobile", "mobile1", "mobile2", "address", "city", "pincode", "state", "district", "email", "website", "numberOfVehicles", "nationalPermit", "speciality"] }).populate('vehicle', { select: ["id", "number", "type", "loadCapacity", "nationalPermit", "image"] }).populate('driver', { select: ["id", "name", "mobile", "dob", "licenceNumber"] }).populate('orders').then(function (trips) {
            if (trips.length > 0) {

                let trip = trips[0]
                var buyers = Users.find({ id: _.pluck(trip.orders, 'buyer') }, { fields: ['id', 'fullName', 'city', 'mobile', 'email', 'pincode', 'address', 'district', 'state'] }).then(function (buyers) {
                    return buyers
                });
                var sellers = Users.find({ id: _.pluck(trip.orders, 'seller') }, { fields: ['id', 'fullName', 'mobile', 'email', 'pincode', 'address', 'city', 'district', 'state'] }).then(function (sellers) {
                    return sellers
                });
                var bids = Bids.find({ id: _.pluck(trip.orders, 'bidId') }, { fields: ['id', 'code', 'productType', 'amount', 'originalAmount', 'bidRate', 'totalAmount', 'originalTotalAmount', 'address', 'quantity', 'quantityUnit', 'status', 'productType'] }).populate('crop', { select: ["id", "code", "name", "pincode", "variety", 'quantity', 'quantityUnit', 'price'] }).populate('input', { select: ["id", "code", "name", "pincode", "variety", 'quantity', 'quantityUnit', 'price'] }).then(function (bids) {
                    return bids
                });
                var orders = Orderedcarts.find({ id: _.pluck(trip.orders, 'orderId') }).populate('crop', { select: ["id", "code", "name", "pincode", "variety", 'quantity', 'quantityUnit', 'price'] }).populate('input', { select: ["id", "code", "name", "pincode", "variety", 'quantity', 'quantityUnit', 'price'] }).then(function (orders) {
                    return orders
                });

                var fieldTransactions = FieldTransactions.find({ id: _.pluck(trip.orders, 'fieldTransactionId') }).populate('buyer', { select: ["id", "name", "pincode", "email", 'address', 'phone'] }).then(function (fieldTransactions) {
                    return fieldTransactions
                });
                return [trip, buyers, sellers, bids, orders, fieldTransactions]
            } else {
                return res.status(400).jsonx({
                    success: false,
                    error: "Trip does not exist."
                });
            }
        }).spread(function (trip, buyers, sellers, bids, orders, fieldTransactions) {
            buyers = _.indexBy(buyers, 'id');
            sellers = _.indexBy(sellers, 'id');
            bids = _.indexBy(bids, 'id');
            orders = _.indexBy(orders, 'id');
            fieldTransactions = _.indexBy(fieldTransactions, 'id');

            trip.orders = _.map(trip.orders, function (order) {
                order.buyer = buyers[order.buyer]
                order.seller = sellers[order.seller]
                order.orderId = orders[order.orderId]
                order.bidId = bids[order.bidId]
                order.fieldTransactionId = fieldTransactions[order.fieldTransactionId]
                delete order.buyer.password
                delete order.seller.password

                return order
            });

            let path1 = 'assets/location/prescriberoutes/' + trip.id + '.json';

            fs.readFile(path1, function (err, content) {
                var locJson;
                if (content == undefined) {
                    locJson = [];
                } else {
                    locJson = content.length > 0 ? JSON.parse(content) : [];
                }

                if (trip.prescribedRoute && trip.prescribedRoute.length > 0) {
                    trip.prescribedRoute = trip.prescribedRoute;
                } else {
                    // console.log(locJson)
                    trip.prescribedRoute = locJson;
                }
                let path = 'assets/location/triplocations/' + trip.id + '.json';
                trip.locationPath = path

                trip.prescribedRoutePath = path1
                // fs.readFile(path, function (err, content1) {
                //     var locJson1;
                //     if (content1 == undefined) {
                //         locJson1 = [];
                //     } else {
                //         locJson1 = content1.length > 0 ? JSON.parse(content1) : [];
                //     }

                //     // if (trip.locations && trip.locations.length > 0) {
                //     //     // trip.locations = trip.locations;
                //     // } else {
                //         // console.log(locJson)
                //         trip.locations = locJson1;
                //     // }


                    return res.jsonx({
                        success: true,
                        trip: trip
                    })
                // })
            })
        }).fail(function (err) {
            return res.status(400).jsonx({
                success: false,
                error: err
            });
        })
    },

    changeStatusOfOrder: function (data, context, req, res) {
        Triporder.findOne({ id: data.id }).then(function (order) {
            if (order) {
                order.status = data.status
                if (data.status == "PickupDone") {
                    order.pickupTime = new Date()
                } else if (data.status == "Revert") {
                    if (data.revertReason) {
                        order.revertReason = data.revertReason
                    } else {
                        return res.status(400).jsonx({
                            success: false,
                            error: 'Please define reason to revert this order.'
                        });
                    }
                }
                Triporder.update({ id: order.id }, order).then(function (updatedOrders) {
                    let updatedOrder = updatedOrders[0]
                    let pendingDeliveriesQuery = {}
                    pendingDeliveriesQuery.tripId = updatedOrder.tripId
                    pendingDeliveriesQuery.$or = [{ status: 'Pending' }, { status: 'PickupInTransit' }, { status: 'PickupDone' }, { status: 'DropInTransit' }]

                    Triporder.count(pendingDeliveriesQuery).then(function (pendingCount) {
                        if (pendingCount > 0) {
                            return res.jsonx({
                                success: true,
                                order: updatedOrder,
                                message: "Status updated succssfully"
                            })
                        } else {
                            finishCurrentTrip({ id: updatedOrder.tripId }, context).then(function (result) {
                                return res.jsonx({
                                    success: true,
                                    order: updatedOrder,
                                    tripResult: result,
                                    message: "Status updated succssfully"
                                })
                            })
                        }
                    })
                }).fail(function (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                })
            } else {
                return res.status(400).jsonx({
                    success: false,
                    error: "Order not found"
                });
            }
        }).fail(function (err) {
            return res.status(400).jsonx({
                success: false,
                error: err
            });
        })
    },

    unexpireOTTC: function (data, context, req, res) {
        LogisticTrip.findOne({ id: data.id }).then(function (trip) {
            if (trip) {
                trip.OTTCStatus = "Valid"
                trip.status = "Created"
                trip.OTTCUsedDate = null

                delete trip.orders


                LogisticTrip.update({ id: trip.id }, trip).then(function (updatedTrip) {
                    return res.jsonx({
                        success: true,
                        message: "Updated succssfully"
                    })
                }).fail(function (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                })
            } else {
                return res.status(400).jsonx({
                    success: false,
                    error: "Trip not found"
                });
            }
        }).fail(function (err) {

            return res.status(400).jsonx({
                success: false,
                error: err
            });
        })
    },

    updateLocations: function (data, context, req, res) {

        if (data.locations == undefined || data.locations == null || data.locations.length == 0) {
            return res.status(400).jsonx({
                success: false,
                error: "No Location to update"
            });
        } else {

            var findOngoingTrip = {}
            findOngoingTrip.id = data.id
            findOngoingTrip.$or = [{ status: 'Created' }, { status: 'Tracking' }]

            LogisticTrip.findOne(findOngoingTrip).then(function (trip) {
                // console.log(data.locations, '===')
                if (trip) {
                    let path = 'assets/location/triplocations/' + trip.id + '.json';

                    fs.readFile(path, function (err, content) {
                        var locJson;                        
                        let tripJustStarted = false
                        if (content == undefined) {
                            locJson = [];
                            tripJustStarted = true
                        } else {
                            locJson = content.length > 0 ? JSON.parse(content) : [];
                        }

                        Array.prototype.push.apply(locJson, data.locations);
                        trip.locations = locJson


                        // console.log("1 ====", trip.locations)

                        // var distanceToBeCovered = 0
                        var timeToBeTaken = 0

                        let path1 = 'assets/location/prescriberoutes/' + trip.id + '.json';

                        fs.readFile(path1, function (err, content1) {
                            var prescriberoutesJson;
                            if (content1 == undefined) {
                                prescriberoutesJson = [];
                            } else {
                                prescriberoutesJson = content1.length > 0 ? JSON.parse(content1) : [];
                            }
                            trip.prescribedRoute = prescriberoutesJson;
                            //Array.prototype.push.apply(prescriberoutesJson, data.locations);
                            trip.locations = locJson

                            if (trip.prescribedRoute && trip.locations) {

                                // var lastLocation = 0
                                var lastLocationdistance = 0

                                // var meterFactor = 1050

                                for (var i = 0; i < trip.prescribedRoute.length; i++) {
                                    let pointstartLocation = new GeoPoint(trip.prescribedRoute[i].start_location.lat, trip.prescribedRoute[i].start_location.lng);
                                    let lastLocationPoint = new GeoPoint(trip.locations[trip.locations.length - 1].coord.lat, trip.locations[trip.locations.length - 1].coord.lon);

                                    var distancestartLocation = pointstartLocation.distanceTo(lastLocationPoint, true)
                                    if (i == 0) {
                                        lastLocationdistance = distancestartLocation
                                        // lastLocation = i
                                        // distanceToBeCovered = lastLocationdistance * meterFactor
                                        timeToBeTaken = 0
                                    } else {
                                        if (distancestartLocation < lastLocationdistance) {
                                            lastLocationdistance = distancestartLocation
                                            // lastLocation = i

                                            // distanceToBeCovered = lastLocationdistance * meterFactor
                                            timeToBeTaken = 0
                                        } else {
                                            // distanceToBeCovered = distanceToBeCovered + trip.prescribedRoute[i].distance.value
                                            timeToBeTaken = timeToBeTaken + trip.prescribedRoute[i].duration.value
                                        }
                                    }

                                    let pointendlocation = new GeoPoint(trip.prescribedRoute[i].end_location.lat, trip.prescribedRoute[i].end_location.lng);

                                    var distanceEndLocation = pointendlocation.distanceTo(lastLocationPoint, true)

                                    if (distanceEndLocation < lastLocationdistance) {
                                        lastLocationdistance = distanceEndLocation
                                        // lastLocation = i

                                        // distanceToBeCovered = lastLocationdistance * meterFactor
                                        timeToBeTaken = 0
                                        // } else {
                                        //     // distanceToBeCovered = distanceToBeCovered + trip.prescribedRoute[i].distance.value
                                        //     timeToBeTaken = timeToBeTaken + trip.prescribedRoute[i].duration.value
                                    }
                                }
                            }


                            let totalTimePlanned = 0

                            if (trip.totalTimeToBeTaken) {
                                totalTimePlanned = trip.totalTimeToBeTaken.value * trip.logisticTimeFactor
                            }

                            let firstLocationTime = new Date(trip.locations[0].time)
                            let expectedTimeToReach = new Date(firstLocationTime.getTime() + totalTimePlanned * 1000)

                            let currentTime = new Date()
                            let currentlyReachingTime = new Date(currentTime.getTime() + (timeToBeTaken * trip.logisticTimeFactor) * 1000)

                            var delaySeconds = (currentlyReachingTime.getTime() - expectedTimeToReach.getTime()) / 1000;

                            if (delaySeconds == NaN) {
                                delaySeconds = 0
                            }


                            let status = 'OnTime'
                            if (delaySeconds > totalTimePlanned * 0.1) {
                                status = 'Late'
                            }


                            trip.runningStatus = status
                            trip.delayTime = delaySeconds//Int(delaySeconds)

                            delete trip.orders



                            delete trip.locations;
                            delete trip.prescribedRoute;
                            trip.prescribedRoute = [];
                            trip.locations = [];
                            if (locJson && locJson.length > 0) {                                
                                trip.lastLocation = [locJson[locJson.length - 1]]
                            }
                            if (tripJustStarted == true) {
                                trip.tripStartDate = new Date()
                            }
                            LogisticTrip.update({ id: trip.id }, trip).then(function (updatedTrip) {

                                fs.writeFile(path, JSON.stringify(locJson, null, 2), function (err) {
                                    if (err) throw err;
                                    return res.jsonx({
                                        success: true,
                                        message: "Location added succssfully"
                                    })

                                })


                            }).fail(function (err) {
                                return res.status(400).jsonx({
                                    success: false,
                                    error: err
                                });
                            })
                        })
                    })


                } else {
                    return res.status(400).jsonx({
                        success: false,
                        error: "Trip not found"
                    });
                }
            }).fail(function (err) {

                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            })
        }
    },

    requestOTTC: function (data, context, req, res) {
        LogisticTrip.findOne({ code: data.id }).then(function (trip) {
            if (trip) {
                if (trip.status == 'Finished') {
                    return res.status(400).jsonx({
                        success: false,
                        error: 'Trip already finished'
                    });
                } if (trip.status == 'Created' && trip.OTTCStatus == 'Valid') {
                    return res.status(400).jsonx({
                        success: false,
                        error: 'Shared OTTC is still valid. If you don not have OTTC then ask administrator to resend it.'
                    });
                } else {
                    if (trip.OTTCStatus == 'Valid') {
                        return res.status(400).jsonx({
                            success: false,
                            error: 'Shared OTTC is still valid. If you don not have OTTC then ask administrator to resend it.'
                        });
                    } else {
                        let generatedOTTCs = []
                        generatedOTTCs.push({ createdDate: trip.OTTCCreatedDate, OTTC: trip.OTTC, OTTCUsedDate: trip.OTTCUsedDate })

                        if (trip.generatedOTTCs) {
                            Array.prototype.push.apply(generatedOTTCs, trip.generatedOTTCs);
                        }

                        trip.generatedOTTCs = generatedOTTCs

                        newOTTCagain().then(function (ottc) {
                            trip.OTTC = ottc
                            trip.OTTCStatus = 'Valid'
                            trip.OTTCCreatedDate = new Date()

                            trip.OTTCUsedDate = null

                            delete trip.orders

                            LogisticTrip.update({ id: trip.id }, trip).then(function (updatedTrip) {
                                if (updatedTrip && updatedTrip.length > 0) {
                                    LogisticTripService.resendTripOTTC(updatedTrip[0], context, req, res)
                                } else {
                                    return res.status(400).jsonx({
                                        success: false,
                                        error: 'Unknown error occured.'
                                    });
                                }
                            })

                        })
                    }
                }
            } else {
                return res.status(400).jsonx({
                    success: false,
                    error: 'Trip does not exist.'
                });
            }
        }).fail(function (err) {
            return res.status(400).jsonx({
                success: false,
                error: err
            });
        })
    },

    updateTimeFactor: function (data, context, req, res) {
        return LogisticTrip.findOne({ id: data.id }).then(function (trip) {
            if (trip) {
                if (trip.status == 'Finished') {
                    return {
                        success: false,
                        error: 'Trip already finished'
                    };
                } else {
                    trip.logisticTimeFactor = data.logisticTimeFactor

                    delete trip.orders

                    return LogisticTrip.update({ id: trip.id }, trip).then(function (updatedTrip) {
                        return {
                            success: true,
                            trip: updatedTrip,
                            message: "Trip is updated"
                        }
                    })
                }
            }
        }).fail(function (err) {
            return {
                success: false,
                error: err
            };
        })
    },

    updateTripLogisticInfo: function (data, context, req, res) {
        var findOngoingTrip = {}
        findOngoingTrip.id = data.id
        LogisticTrip.findOne(findOngoingTrip).populate('logisticPartner').then(function (trip) {
            if (trip) {
                if (trip.status == 'Created') {
                    let earlierLogisticPartnerNumber = trip.logisticPartner.mobile

                    trip.logisticPartner = data.logisticPartner
                    trip.driver = data.driver
                    trip.vehicle = data.vehicle
                    newOTTCagain().then(function (ottc) {
                        trip.OTTC = ottc
                        trip.OTTCCreatedDate = new Date()

                        delete trip.orders

                        LogisticTrip.update({ id: trip.id }, trip).then(function (updatedTrip) {
                            LogisticTrip.findOne({ id: data.id }).populate('logisticPartner').populate('vehicle').populate('driver').then(function (trip) {
                                if (trip) {
                                    let newSmsInfo = {}
                                    newSmsInfo.tripcode = String(trip.code)
                                    newSmsInfo.numbers = [earlierLogisticPartnerNumber]

                                    commonService.sendTripCancelledMessage(newSmsInfo)

                                    let smsInfo = {}
                                    smsInfo.tripcode = String(trip.code)
                                    smsInfo.OTTC = String(trip.OTTC)
                                    smsInfo.numbers = [trip.logisticPartner.mobile, trip.driver.mobile]
                                    smsInfo.vehiclenumber = trip.vehicle.number

                                    commonService.sendOTTCSMS(smsInfo)

                                    return res.jsonx({
                                        success: true,
                                        message: "Trip updated succssfully and new OTTC sent to logistic partner.",
                                        trip: trip
                                    })
                                } else {
                                    return res.jsonx({
                                        success: false,
                                        error: "Trip not found"
                                    })
                                }
                            }).fail(function (err) {
                                return res.jsonx({
                                    success: false,
                                    error: err
                                })
                            })
                        }).fail(function (err) {
                            return res.status(400).jsonx({
                                success: false,
                                error: err
                            });
                        })
                    })
                } else if (trip.status == 'Tracking') {
                    return res.status(400).jsonx({
                        success: false,
                        error: "Trip has already started. You can not modify this trip now."
                    });
                } else {
                    return res.status(400).jsonx({
                        success: false,
                        error: "This trip is finished, so can not be modified."
                    });
                }
            } else {
                return res.status(400).jsonx({
                    success: false,
                    error: "Trip not found"
                });
            }
        }).fail(function (err) {
            return res.status(400).jsonx({
                success: false,
                error: err
            });
        })
    },

    removeOrderFromTrip: function (data, context, req, res) {
        const googleMapsClient = require('@google/maps').createClient({
            key: constantObj.googlePlaces.key
        });

        Triporder.findOne({ id: data.id }).populate('tripId').then(function (order) {
            if (order) {
                if (order.tripId.status == 'Created') {
                    if (order.status == 'Pending') {

                        let currentDestinationSequence = []

                        for (var i = 0; i < order.tripId.destinationSequence.length; i++) {
                            let destination = order.tripId.destinationSequence[i]

                            if (destination.orderId != order.id) {
                                currentDestinationSequence.push(destination)
                            }
                        }

                        let trip = order.tripId
                        trip.destinationSequence = currentDestinationSequence

                        let waypoints = null

                        for (var i = 1; i < currentDestinationSequence.length - 1; i++) {
                            if (i > 1 && i < currentDestinationSequence.length - 1) {
                                waypoints = waypoints + "|"
                            } else if (i == 1) {
                                waypoints = ""
                            }
                            waypoints = waypoints + "via:" + String(currentDestinationSequence[i].coord.lat) + "," + String(currentDestinationSequence[i].coord.lon)
                        }

                        Triporder.destroy({ id: data.id }).then(function (result) {
                            if (!_.isEmpty(result)) {
                                if (order.type == 'cartOrder' && order.orderId) {
                                    Orderedcarts.findOne({ id: order.orderId }).then(function (ordercart) {
                                        delete ordercart.tripId
                                        delete ordercart.ETA
                                        delete ordercart.logisticId
                                        delete ordercart.vehicleId

                                        Orderedcarts.update({ id: ordercart.id }, ordercart).then(function (ordercart) {
                                            if (currentDestinationSequence.length == 0) {
                                                LogisticTrip.destroy({ id: trip.id }).then(function (tripResult) {
                                                    Lpartner.findOne({ id: order.tripId.logisticPartner }).then(function (lp) {
                                                        if (lp) {
                                                            let newSmsInfo = {}
                                                            newSmsInfo.tripcode = String(order.tripId.code)
                                                            newSmsInfo.numbers = [lp.mobile]

                                                            commonService.sendTripCancelledMessage(newSmsInfo)

                                                            if (!_.isEmpty(tripResult)) {
                                                                return res.jsonx({
                                                                    success: true,
                                                                    message: "No order so trip deleted.",
                                                                })
                                                            } else {
                                                                return res.status(400).jsonx({
                                                                    success: false,
                                                                    error: "Unknown error occured"
                                                                });
                                                            }
                                                        } else {
                                                            if (!_.isEmpty(tripResult)) {
                                                                return res.jsonx({
                                                                    success: true,
                                                                    message: "No order so trip deleted.",
                                                                })
                                                            } else {
                                                                return res.status(400).jsonx({
                                                                    success: false,
                                                                    error: "Unknown error occured"
                                                                });
                                                            }
                                                        }
                                                    }).fail(function (err) {
                                                        if (!_.isEmpty(tripResult)) {
                                                            return res.jsonx({
                                                                success: true,
                                                                message: "No order so trip deleted.",
                                                            })
                                                        } else {
                                                            return res.status(400).jsonx({
                                                                success: false,
                                                                error: "Unknown error occured"
                                                            });
                                                        }
                                                    })
                                                }).fail(function (err) {
                                                    return res.status(400).jsonx({
                                                        success: false,
                                                        error: err
                                                    });
                                                })
                                            } else {
                                                googleMapsClient.directions({
                                                    origin: String(currentDestinationSequence[0].coord.lat) + "," + String(currentDestinationSequence[0].coord.lon),
                                                    destination: String(currentDestinationSequence[currentDestinationSequence.length - 1].coord.lat) + "," + String(currentDestinationSequence[currentDestinationSequence.length - 1].coord.lon),
                                                    waypoints: waypoints,
                                                    optimize: false
                                                }, function (err, routeresponses) {
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
                                                    delete trip.orders;
                                                    delete trip.prescribedRoute;
                                                    trip.prescribedRoute = [];

                                                    LogisticTrip.update({ id: trip.id }, trip).then(function (newTrip) {
                                                        let path1 = 'assets/location/prescriberoutes/' + trip.id + '.json';
                                                        fs.writeFile(path1, JSON.stringify(locJson, null, 2), function (err) {
                                                            if (err) throw err;

                                                            return res.jsonx({
                                                                success: true,
                                                                message: "Order removed succssfully",
                                                                trip: newTrip,

                                                            })
                                                        })
                                                    }).fail(function (err) {
                                                        return res.status(400).jsonx({
                                                            success: false,
                                                            error: "Unknown error occured"
                                                        });
                                                    })
                                                })
                                            }
                                        })
                                    })
                                } else {
                                    Bids.findOne({ id: order.bidId }).then(function (bid) {
                                        delete bid.tripId
                                        delete bid.ETA
                                        delete bid.logisticId
                                        delete bid.vehicleId

                                        Bids.update({ id: bid.id }, bid).then(function (bid) {
                                            if (currentDestinationSequence.length == 0) {
                                                LogisticTrip.destroy({ id: trip.id }).then(function (tripResult) {
                                                    Lpartner.findOne({ id: order.tripId.logisticPartner }).then(function (lp) {
                                                        if (lp) {
                                                            let newSmsInfo = {}
                                                            newSmsInfo.tripcode = String(order.tripId.code)
                                                            newSmsInfo.numbers = [lp.mobile]

                                                            commonService.sendTripCancelledMessage(newSmsInfo)

                                                            if (!_.isEmpty(tripResult)) {
                                                                return res.jsonx({
                                                                    success: true,
                                                                    message: "No order so trip deleted.",
                                                                })
                                                            } else {
                                                                return res.status(400).jsonx({
                                                                    success: false,
                                                                    error: "Unknown error occured"
                                                                });
                                                            }
                                                        } else {
                                                            if (!_.isEmpty(tripResult)) {
                                                                return res.jsonx({
                                                                    success: true,
                                                                    message: "No order so trip deleted.",
                                                                })
                                                            } else {
                                                                return res.status(400).jsonx({
                                                                    success: false,
                                                                    error: "Unknown error occured"
                                                                });
                                                            }
                                                        }
                                                    }).fail(function (err) {
                                                        if (!_.isEmpty(tripResult)) {
                                                            return res.jsonx({
                                                                success: true,
                                                                message: "No order so trip deleted.",
                                                            })
                                                        } else {
                                                            return res.status(400).jsonx({
                                                                success: false,
                                                                error: "Unknown error occured"
                                                            });
                                                        }
                                                    })
                                                }).fail(function (err) {
                                                    return res.status(400).jsonx({
                                                        success: false,
                                                        error: err
                                                    });
                                                })
                                            } else {
                                                googleMapsClient.directions({
                                                    origin: String(currentDestinationSequence[0].coord.lat) + "," + String(currentDestinationSequence[0].coord.lon),
                                                    destination: String(currentDestinationSequence[currentDestinationSequence.length - 1].coord.lat) + "," + String(currentDestinationSequence[currentDestinationSequence.length - 1].coord.lon),
                                                    waypoints: waypoints,
                                                    optimize: false
                                                }, function (err, routeresponses) {
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
                                                    delete trip.prescribedRoute;
                                                    delete trip.orders
                                                    trip.prescribedRoute = []
                                                    LogisticTrip.update({ id: trip.id }, trip).then(function (newTrip) {
                                                        let path1 = 'assets/location/prescriberoutes/' + trip.id + '.json';
                                                        fs.writeFile(path1, JSON.stringify(locJson, null, 2), function (err) {
                                                            if (err) throw err;

                                                            return res.jsonx({
                                                                success: true,
                                                                message: "Order removed succssfully",
                                                                trip: newTrip
                                                            })
                                                        })
                                                    }).fail(function (err) {
                                                        return res.status(400).jsonx({
                                                            success: false,
                                                            error: "Unknown error occured"
                                                        });
                                                    })
                                                })
                                            }
                                        })
                                    })
                                }
                            } else {
                                return res.status(400).jsonx({
                                    success: false,
                                    error: "Unknown error occured"
                                });
                            }
                        }).fail(function (err) {
                            return res.status(400).jsonx({
                                success: false,
                                error: err
                            });
                        })
                    } else {
                        return res.status(400).jsonx({
                            success: false,
                            error: "Order is not pending state, so can not remove it."
                        });
                    }
                } else if (order.tripId.status == 'Tracking') {
                    return res.status(400).jsonx({
                        success: false,
                        error: "Trip has already started. You can not modify that this now"
                    });
                } else {
                    return res.status(400).jsonx({
                        success: false,
                        error: "This trip is finished, so can not be modified."
                    });
                }
            } else {
                return res.status(400).jsonx({
                    success: false,
                    error: "Order not found"
                });
            }
        }).fail(function (err) {
            return res.status(400).jsonx({
                success: false,
                error: err
            });
        })
    },

    changeDestinationSequence: function (data, context, req, res) {

        const googleMapsClient = require('@google/maps').createClient({
            key: constantObj.googlePlaces.key
        });

        var findOngoingTrip = {}
        findOngoingTrip.id = data.id
        findOngoingTrip.status = 'Created'
        LogisticTrip.findOne(findOngoingTrip).then(function (trip) {
            if (trip) {
                trip.destinationSequence = data.destinationSequence

                let waypoints = null

                let currentDestinationSequence = data.destinationSequence

                for (var i = 1; i < currentDestinationSequence.length - 1; i++) {
                    if (i > 1 && i < currentDestinationSequence.length - 1) {
                        waypoints = waypoints + "|"
                    } else if (i == 1) {
                        waypoints = ""
                    }
                    waypoints = waypoints + "via:" + String(currentDestinationSequence[i].coord.lat) + "," + String(currentDestinationSequence[i].coord.lon)
                }

                googleMapsClient.directions({
                    origin: String(currentDestinationSequence[0].coord.lat) + "," + String(currentDestinationSequence[0].coord.lon),
                    destination: String(currentDestinationSequence[currentDestinationSequence.length - 1].coord.lat) + "," + String(currentDestinationSequence[currentDestinationSequence.length - 1].coord.lon),
                    waypoints: waypoints,
                    optimize: false
                }, function (err, routeresponses) {
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

                    delete trip.orders
                    var locJson = trip.prescribedRoute;
                    delete trip.prescribedRoute;
                    trip.prescribedRoute = [];
                    LogisticTrip.update({ id: trip.id }, trip).then(function (updatedTrip) {
                        let path1 = 'assets/location/prescriberoutes/' + trip.id + '.json';
                        fs.writeFile(path1, JSON.stringify(locJson, null, 2), function (err) {
                            if (err) throw err;
                            return res.jsonx({
                                success: true,
                                message: "Sequence updated succssfully",
                                trip: updatedTrip[0]
                            })
                        })
                    }).fail(function (err) {
                        return res.status(400).jsonx({
                            success: false,
                            error: err
                        });
                    })
                })
            } else {
                return res.status(400).jsonx({
                    success: false,
                    error: "Trip not found"
                });
            }
        }).fail(function (err) {
            return res.status(400).jsonx({
                success: false,
                error: err
            });
        })
    },

    addPODInOrder: function (data, context, req, res) {
        Triporder.findOne({ id: data.id }).then(function (order) {
            if (order) {
                order.status = "Delivered"
                order.deliveryTime = new Date()
                order.PODDocs = { "signature": data.signature, "POD": data.POD }
                Triporder.update({ id: order.id }, order).then(function (updatedOrders) {
                    let updatedOrder = updatedOrders[0]
                    if (updatedOrder.type == 'fieldTransaction') {
                        FieldTransactions.findOne({ id: updatedOrder.fieldTransactionId }).then(function (bid) {
                            if (bid) {
                                let documents = []
                                if (bid.documents) {
                                    documents = bid.documents
                                }
                                // documents.push({type: "POD signature", path:data.signature})
                                // documents.push({type: "POD document", path:data.POD})
                                documents.push(data.signature)
                                documents.push(data.POD)

                                let tu = {}
                                tu.documents = documents
                                tu.ATA = updatedOrder.deliveryTime

                                FieldTransactions.update({ id: bid.id }, tu).then(function (updatedBid) {
                                    let pendingDeliveriesQuery = {}
                                    pendingDeliveriesQuery.tripId = updatedOrder.tripId
                                    pendingDeliveriesQuery.$or = [{ status: 'Pending' }, { status: 'PickupInTransit' }, { status: 'PickupDone' }, { status: 'DropInTransit' }]

                                    Triporder.count(pendingDeliveriesQuery).then(function (pendingCount) {
                                        if (pendingCount > 0) {
                                            return res.jsonx({
                                                success: true,
                                                order: updatedOrder,
                                                message: "Status updated succssfully"
                                            })
                                        } else {
                                            finishCurrentTrip({ id: updatedOrder.tripId }, context).then(function (result) {
                                                return res.jsonx({
                                                    success: true,
                                                    order: updatedOrder,
                                                    tripResult: result,
                                                    message: "Status updated succssfully"
                                                })
                                            })
                                        }
                                    })
                                })
                            } else {
                                let pendingDeliveriesQuery = {}
                                pendingDeliveriesQuery.tripId = updatedOrder.tripId
                                pendingDeliveriesQuery.$or = [{ status: 'Pending' }, { status: 'PickupInTransit' }, { status: 'PickupDone' }, { status: 'DropInTransit' }]

                                Triporder.count(pendingDeliveriesQuery).then(function (pendingCount) {
                                    if (pendingCount > 0) {
                                        return res.jsonx({
                                            success: true,
                                            order: updatedOrder,
                                            message: "Status updated succssfully"
                                        })
                                    } else {
                                        finishCurrentTrip({ id: updatedOrder.tripId }, context).then(function (result) {
                                            return res.jsonx({
                                                success: true,
                                                order: updatedOrder,
                                                tripResult: result,
                                                message: "Status updated succssfully"
                                            })
                                        })
                                    }
                                })
                            }
                        })
                    } else if (updatedOrder.type == 'bid') {
                        Bids.findOne({ id: updatedOrder.bidId }).then(function (bid) {
                            if (bid) {
                                let documents = []
                                if (bid.documents) {
                                    documents = bid.documents
                                }
                                // documents.push({type: "POD signature", path:data.signature})
                                // documents.push({type: "POD document", path:data.POD})
                                documents.push(data.signature)
                                documents.push(data.POD)

                                bid.documents = documents
                                bid.ATA = updatedOrder.deliveryTime

                                Bids.update({ id: bid.id }, bid).then(function (updatedBid) {
                                    let pendingDeliveriesQuery = {}
                                    pendingDeliveriesQuery.tripId = updatedOrder.tripId
                                    pendingDeliveriesQuery.$or = [{ status: 'Pending' }, { status: 'PickupInTransit' }, { status: 'PickupDone' }, { status: 'DropInTransit' }]

                                    Triporder.count(pendingDeliveriesQuery).then(function (pendingCount) {
                                        if (pendingCount > 0) {
                                            return res.jsonx({
                                                success: true,
                                                order: updatedOrder,
                                                message: "Status updated succssfully"
                                            })
                                        } else {
                                            finishCurrentTrip({ id: updatedOrder.tripId }, context).then(function (result) {
                                                return res.jsonx({
                                                    success: true,
                                                    order: updatedOrder,
                                                    tripResult: result,
                                                    message: "Status updated succssfully"
                                                })
                                            })
                                        }
                                    })
                                })
                            } else {
                                let pendingDeliveriesQuery = {}
                                pendingDeliveriesQuery.tripId = updatedOrder.tripId
                                pendingDeliveriesQuery.$or = [{ status: 'Pending' }, { status: 'PickupInTransit' }, { status: 'PickupDone' }, { status: 'DropInTransit' }]

                                Triporder.count(pendingDeliveriesQuery).then(function (pendingCount) {
                                    if (pendingCount > 0) {
                                        return res.jsonx({
                                            success: true,
                                            order: updatedOrder,
                                            message: "Status updated succssfully"
                                        })
                                    } else {
                                        finishCurrentTrip({ id: updatedOrder.tripId }, context).then(function (result) {
                                            return res.jsonx({
                                                success: true,
                                                order: updatedOrder,
                                                tripResult: result,
                                                message: "Status updated succssfully"
                                            })
                                        })
                                    }
                                })
                            }
                        })
                    } else {
                        Orderedcarts.findOne({ id: updatedOrder.orderId }).then(function (orderedcarts) {
                            if (orderedcarts) {
                                let documents = []
                                if (orderedcarts.documents) {
                                    documents = orderedcarts.documents
                                }
                                // documents.push({type: "POD signature", path:data.signature})
                                // documents.push({type: "POD document", path:data.POD})
                                documents.push(data.signature)
                                documents.push(data.POD)
                                orderedcarts.documents = documents
                                orderedcarts.ATA = updatedOrder.deliveryTime
                                Orderedcarts.update({ id: orderedcarts.id }, orderedcarts).then(function (updatedorderedcarts) {
                                    let pendingDeliveriesQuery = {}
                                    pendingDeliveriesQuery.tripId = updatedOrder.tripId
                                    pendingDeliveriesQuery.$or = [{ status: 'Pending' }, { status: 'PickupInTransit' }, { status: 'PickupDone' }, { status: 'DropInTransit' }]

                                    Triporder.count(pendingDeliveriesQuery).then(function (pendingCount) {
                                        if (pendingCount > 0) {
                                            return res.jsonx({
                                                success: true,
                                                order: updatedOrder,
                                                message: "Status updated succssfully"
                                            })
                                        } else {
                                            finishCurrentTrip({ id: updatedOrder.tripId }, context).then(function (result) {
                                                return res.jsonx({
                                                    success: true,
                                                    order: updatedOrder,
                                                    tripResult: result,
                                                    message: "Status updated succssfully"
                                                })
                                            })
                                        }
                                    })
                                })
                            } else {
                                let pendingDeliveriesQuery = {}
                                pendingDeliveriesQuery.tripId = updatedOrder.tripId
                                pendingDeliveriesQuery.$or = [{ status: 'Pending' }, { status: 'PickupInTransit' }, { status: 'PickupDone' }, { status: 'DropInTransit' }]

                                Triporder.count(pendingDeliveriesQuery).then(function (pendingCount) {
                                    if (pendingCount > 0) {
                                        return res.jsonx({
                                            success: true,
                                            order: updatedOrder,
                                            message: "Status updated succssfully"
                                        })
                                    } else {
                                        finishCurrentTrip({ id: updatedOrder.tripId }, context).then(function (result) {
                                            return res.jsonx({
                                                success: true,
                                                order: updatedOrder,
                                                tripResult: result,
                                                message: "Status updated succssfully"
                                            })
                                        })
                                    }
                                })
                            }
                        })
                    }
                }).fail(function (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                })
            } else {
                return res.status(400).jsonx({
                    success: false,
                    error: "Order not found"
                });
            }
        }).fail(function (err) {
            return res.status(400).jsonx({
                success: false,
                error: err
            });
        })
    },

    finishTrip: function (data, context, req, res) {
        finishCurrentTrip(data, context).then(function (result) {
            return res.jsonx(result)
        })
    },
},

    newOTTCagain = function () {
        let newOTTC = Math.floor(Math.random() * 90000) + 10000;

        return LogisticTrip.count({ OTTC: newOTTC, OTTCStatus: "Valid" }).then(function (codeExists) {
            if (codeExists > 0) {
                newOTTCagain()
            } else {
                return newOTTC
            }
        })
    },

    finishCurrentTrip = function (data, context) {
        return LogisticTrip.findOne({ id: data.id }).then(function (trip) {
            if (trip) {
                if (trip.status == 'Finished') {
                    return {
                        success: false,
                        error: 'Trip already finished'
                    };
                } else {
                    trip.status = 'Finished'
                    trip.tripFinishedDate = new Date()

                    delete trip.orders

                    return LogisticTrip.update({ id: trip.id }, trip).then(function (updatedTrip) {
                        return {
                            success: true,
                            trip: updatedTrip,
                            message: "Trip is finished"
                        }
                    })
                }
            } else {
                return {
                    success: false,
                    error: 'Trip not found'
                };
            }
        }).fail(function (err) {
            return {
                success: false,
                error: err
            };
        })
    }