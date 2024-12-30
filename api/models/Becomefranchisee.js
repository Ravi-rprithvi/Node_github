/**
 * Becomefranchisee.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    autoCreatedAt: true,
    autoUpdatedAt: true,

    attributes: {
        name: {
            type: 'string',
            required: true
        },
        email: {
            type: 'string',
        },
        phone: {
            type: 'integer',
        },
        pincode: {
            type: 'integer',
            required: true
        },
        city: {
            type: 'string',
        },
        district: {
            type: 'string',
        },
        state: {
            type: 'string',
        },
        address: {
            type: 'string',
        },
    }
};

