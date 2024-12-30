/**
 * Orders.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    autoCreatedAt: true,
    autoUpdatedAt: true,
    attributes: {

        productId: {
            type: 'string'
        },

        land: {
            model:'lands'
        },

        equipment: {
            model:'equipment'
        },

        crop: {
            model:'crops'
        }, 

        requirement: {
            model:'buyerRequirement'
        },

        input: {
            model:'inputs'
        },       
        
        sellerId: {
            model: 'users'
        },
        
        buyerId: {
            model: 'users'
        },

        user: {
            model: 'users'
        },

        productType: {
            type: 'string',
            required: true
        },

        transactionOwner:{
            model: 'users'
        },

        amount:{
            type: 'float'
        },

        message: {
            type: 'string'
        },

        messageTitle: {
            type: 'string'
        },

        messageKey: {
            type: 'string'
        },

        readBy : {
            type: 'array'
        },

        sentTo : {
            type: 'array'
        },

        sentBy : {
            model: 'users'
        }
    }
};
