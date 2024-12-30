/**
 * Logisticpricehistory.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    autoCreatedAt: true,
    attributes: {

        for: {
            model: 'Logisticprice',
            required: true
        },

        pastValues: {
            type: 'json',
            required: true
        },

        updates: {
            type: 'array',
            enum: ['LOAD', 'PRICE', 'MARGIN', 'VALIDITY', 'PRICE_TAKEN_FROM', 'DELETED', 'UNDELETED'],
            required: true
        },

        by: {
            model: 'users'
        },      

        // load: {
        //     type: 'float',
        // },

        // price: {
        //     type: 'float',
        // },

        // margin: {
        //     type: 'float',
        // },

        // validUpto: {
        //     type : 'date'
        // },

        // priceTakenFrom: {
        //     type: 'string'
        // },

        // isDeleted: {
        //     type: 'boolean'
        // },
    }
};