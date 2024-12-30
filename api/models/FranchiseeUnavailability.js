/**
 * FranchiseeUnavailability.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    autoCreatedAt: true,
    autoUpdatedAt: true,

    attributes: {
        unavailabilityDateFrom: {
            type: 'date',
            required: true
        },
        unavailabilityDateTill: {
            type: 'date',
            required: true
        },
        startTime: {
            type: 'datetime'
        },
        endTime: {
            type: 'datetime'
        },

        market: {
            model: 'market',
            required: true
        },
        unavailabilityReason: {
            type: 'string',
            enum: ['Already_Booked', 'Unavailable'],
            required: true,
            defaultsTo: 'Unavailable'
        }

    }
};


