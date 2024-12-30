/**
 * Cart.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    autoCreatedAt: true,
    autoUpdatedAt: true,
    attributes: {

        productId: {
            type: "string"
        },

        user: {
            model: 'users'
        },

        crop: {
            model: 'crops'
        },

        input: {
            model: 'inputs'
        },

        // equipment: {
        //     model:'equipment'
        // }, 

        productType: {
            type: 'string',
            enum: ['INPUT', /*'EQUIPMENT',*/ 'CROP'],
            defaultsTo: 'INPUT',
            required: true
        },

        amountDuringUpdation: {
            type: 'float',
            required: true
        },
        quantity: {
            type: 'float',
            required: true
        },

        quantityUnit: {
            type: 'string'
        },

        selectedMarket: {
            model: 'market'
        },

        paymentMethod: {
            type: 'string',
            enum: ['STEP', 'ADVANCE', 'COD'],
            required: true
        },

        pincode: {
            type: 'integer',
            maxLength: 6,
            minLength: 6
        },
    }
};



