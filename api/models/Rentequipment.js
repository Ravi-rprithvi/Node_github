/**
 * Equipment.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    autoCreatedAt: true,
    autoUpdatedAt: true,
    attributes: {
        equipmentId:{
            model: 'equipment'
        },

        user:{
            model: 'users'
        },

        buyerId:{
            model: 'users'
        },

        // This would be price of equipment like (Rs 10/day) 
        rentPrice:{ 
            type: 'float'
        },
        
        selectForPayment:{
            type: 'boolean',
            defaultsTo: false
        },
        orderId:{
           model: 'orders' 
        },

        startDateTime:{
            type: 'datetime'
        },
        endDateTime:{
            type: 'datetime'
        },
        paymentId:{
            model: 'payments'
        }

    }
};

