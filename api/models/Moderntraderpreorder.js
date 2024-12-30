/**
 * Moderntraderpreorder.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */


module.exports = {
    autoCreatedAt: true,
    autoUpdatedAt: true,
    attributes: {
        userid: {
            model: 'users'
        },
        category: {
            type: 'string',
        },
        variety: {
            type: 'string',
        },
        price: {
            type: 'float',
            defaultsTo: 0.00
        },
        quantity: {
            type: 'integer'
        },
        isAvailbe: {
            type: 'Boolean',
            defaultsTo: false
        },
        order: {
            model: 'orders'
        },
        company: {
            type: 'string'
        }
    }
};

