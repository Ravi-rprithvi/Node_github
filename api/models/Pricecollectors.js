/**
 * PriceCollectors.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    autoCreatedAt: true,
    autoUpdatedAt: true,
    attributes: {

        name: {
            type: 'string'
        },

        email: {
            type: 'string',
            unique: true,
            required: true
        },

        mobile: {
            type: 'integer',
            maxLength: 10,
            required: true,
            unique: true
        },

        markets: {
            type: 'array'
        },
        
        activated: {
            type: 'boolean',
            defaultsTo : true,
        },

        added_by: {
            model: 'users'
        }
               
    }
};