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
        price: {
            type: 'float',
            // defaultsTo: 0.00,
            required: true
        },

        productId:{
            type:"string"
        },
        
        input: {
            model:'inputs'
        },
        
        productType: {
            type: 'string',
            enum: ['INPUT'],
            defaultsTo: 'INPUT',
            required: true
        },

        market: {
            model: 'market'
        },

        productPriceWithoutMarket: {
            type: 'float',
            // defaultsTo: 0.00
            required: true
        },

        marketDistanceInMeters: {
            type: 'float'
        },

        travelDurationInSec: {
            type: 'float'
        }
	}
};

