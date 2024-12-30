/**
 * Logisticprice.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    autoCreatedAt: true,
    autoUpdatedAt: true,
    attributes: {

        category: {
            model: 'category',
            required: true
        },

        sourceName: {
            type: 'string'
        },

        source: {
            type: 'integer',
            maxLength: 10,
            required: true
        },

        destination: {
            type: 'integer',
            maxLength: 10,
            required: true
        },

        destinationName: {
            type: 'string'
        },

        distanceInMeters: {
            type: 'float'
        },

        travelDurationInSec: {
            type: 'float'
        },

        carryCapacity: {
            type: 'float',
            required: true
        },

        load: {
            type: 'float',
            required: true
        },

        vehicleType: {
            type: 'string'
        },

        price: {
            type: 'float',
            required: true
        },

        margin: {
            type: 'float',
        },

        validUpto: {
            type : 'date'
        },

        addedBy: {
            model: 'users'
        },

        addedOn: {
            type : 'date'
        },

        priceTakenFrom: {
            type: 'string'
        },

        isDeleted: {
            type: 'boolean',
            defaultsTo:false
        }
    }
};