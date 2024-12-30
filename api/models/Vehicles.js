/**
 * Vehicles.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    
    autoCreatedAt: true,
    autoUpdatedAt: true,

	attributes: {
        number: {
            type: 'string',
            required: true
        },
        type: {
            type: 'string',
            required: true
        },
        loadCapacity: {
            type: 'integer',
            required: true
        },
        nationalPermit: {
            type: 'string',
            enum: ['Yes', 'No'],
            defaultsTo:'Yes',
            required: true
        },
        description: {
            type: 'string',
            required: false
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

