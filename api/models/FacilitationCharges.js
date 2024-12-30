/**
 * ProductMarketPrice.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    autoCreatedAt: true,
    autoUpdatedAt: true,

    attributes: {
        facilitationPercentage: {
            type: 'float',
            // defaultsTo: 0.00,
            required: true
        },

        productId: {
            type: "string"
        },

        input: {
            model: 'inputs'
        },

        crops: {
            model: 'crops'
        },

        lands: {
            model: 'lands'
        },
        productType: {
            type: 'string',
            enum: ['CROPS', 'INPUT', 'LANDS'],
            defaultsTo: 'CROPS',
            required: true
        },

        market: {
            model: 'market'
        },

        userGivenInfo: {
            type: "string"
        },

        user: {
            model: 'users'
        },

        validTill: {
            type: 'date',
        }
    }
};

