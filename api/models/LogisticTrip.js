/**
 * LogisticTrip.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    autoCreatedAt: true,
    autoUpdatedAt: true,

    attributes: {
        status: {
            type: 'string',
            enum: ['Created', 'Tracking', 'Finished'],
            required: true,
            defaultsTo: 'Created'
        },

        runningStatus: {
            type: 'string',
            enum: ['Not Started', 'Late', 'OnTime'],
            required: true,
            defaultsTo: 'Not Started'
        },

        code: {                 //max 15 digit
            type: 'integer',
            unique: true
        },

        orders: {
            collection: 'Triporder',
            via: 'tripId'
        },

        logisticPartner: {
            model: 'Lpartners',
            required: true
        },

        vehicle: {
            model: 'Vehicles',
            required: true
        },

        driver: {
            model: 'Drivers',
            required: true
        },

        destinationSequence: {
            type: 'array',      //each index contains object as {address: string, coord: {lat: float, lon: float}, type: 'seller'/'buyer', orderId:'order of an id'}
            required: true
        },

        OTTC: {                 //One Time Trip Code 5 digits digit
            type: 'integer',
            unique: true,
            required: true
        },

        OTTCStatus: {
            type: 'string',
            enum: ['Valid', 'Expired'],
            required: true,
            defaultsTo: 'Valid'
        },

        OTTCUsedDate: {
            type: 'date'
        },

        OTTCCreatedDate: {
            type: 'date'
        },

        generatedOTTCs: {
            type: 'array'       //contains array of object. Each object contains createdDate, OTTC, OTTCUsedDate 
        },

        locations: {
            type: 'array'       //array of json object and each object contains 
            //1. orderid(for which this is currently tracking)
            //2. coordinate(json type contains lat, lon)
            //3. battery status
            //4. deviceId
            //5. time
        },

        lastLocation: {
            type: 'array'       //array of json object and each object contains 
            //1. orderid(for which this is currently tracking)
            //2. coordinate(json type contains lat, lon)
            //3. battery status
            //4. deviceId
            //5. time
        },

        prescribedRoute: {
            type: 'array'
        },

        totalDistanceToTravel: {
            type: 'json'
        },

        totalTimeToBeTaken: {
            type: 'json'
        },

        tripFinishedDate: {
            type: 'date'
        },

        tripStartDate: {
            type: 'date'
        },

        logisticTimeFactor: {
            type: 'float',
            required: true,
            defaultsTo: 2.5
        },

        delayTime: {
            type: 'integer'
        }
    }
};

