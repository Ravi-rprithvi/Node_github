/**
 * Qualitycheck.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */


module.exports = {
    autoCreatedAt: true,
    autoUpdatedAt: true,
    attributes: {
        cropExist: {
            type: 'boolean',
            defaultsTo: true
        },
        landExist: {
            type: 'boolean',
            defaultsTo: true
        },
        cropId: {
            model: 'crops'
        },
        landId: {
            model: 'lands'
        },
        quantity: {
            type: 'float',
            defaultsTo: 0.0
        },
        parameters: {
            type: 'json'
        },
        comments: {
            type: 'text'
        },
        rating: {
            type: 'string',
            enum: ['Good', 'Average', 'Poor'],
        },
        addedBy: {
            model: 'users'
        },
        images: {
            type: 'array'
        },
        userType: {
            type: 'string',
            enum: ['Franchisee', 'Admin']
        }
    },

};

