/**
 * Drivers.js
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
        mobile: {
            type: 'integer',
            maxLength: 10,
            required: true,
            unique: true
        },
        dob: {
            type: 'date',
        },
        licenceNumber: {
            type: 'string',
            required: false,
            unique: true
        },
        lPartner: {
            model: 'Lpartners',
            required: false
        },
        image: {
            type: 'string',
            required: false
        }

	}
};

