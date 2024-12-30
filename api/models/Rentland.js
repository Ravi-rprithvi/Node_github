/**
 * Rentland.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    autoCreatedAt: true,
    autoUpdatedAt: true,
    attributes: {
        landId:{
            model: 'lands'
        },
        user:{
            model: 'users'
        },

        buyerId:{
            model: 'users'
        },

        // This would be price of equipment like (Rs 10/day) 
        originalPrice:{ 
            type: 'float'
        },

        // calculating netprice as per start date and end date of each day (like rs 10/day, difference is 3 day of start date and end date, so netprice = rs 30)according to originalPrice
        netPrice:{
            type: 'float'
        },

        commissionPrice:{
            type: 'float'
        },

        efarmxComission:{
            type: 'float'
        },
        
        selectForPayment:{
            type: 'boolean',
            defaultsTo: false
        },

        taxRatePrice:{
            type: 'float'
        },

        taxRate:{
            type: 'float'
        },

        selectForPayment:{
            type: 'boolean',
            defaultsTo: false
        },
        startDateTime:{
            type: 'datetime'
        },
        endDateTime:{
            type: 'datetime'
        }/*,
        orderId:{
            model: 'orders'
        }*/

    }
};