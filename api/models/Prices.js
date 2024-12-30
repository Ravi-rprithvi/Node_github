/**
 * Prices.js
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

        variety: {
            type: 'string'
        },

        price: {
            type: 'float',
            defaultsTo: 0.00,
            required: true
        },

        market: {
            model: 'market'
        },

        addedBy: {
            model: 'pricecollectors'
        },

        quality: {
            type: 'string',
            // enum: ['A+', 'A', 'B', 'C', 'D'],
            //defaultsTo:'A'
        },

        lat: {
            type: 'double'
        },

        lng: {
            type: 'double'
        },

        confirmedFrom: {
            type: 'string'
        },

        confirmedFromMobile: {
            type: 'string'
        },

        verified: {
            type: 'boolean',
            defaultsTo: false
        },

        verifiedBy: {
            model: 'users'
        },

        verifiedOn: {
            type: 'date'
        },


    }
};