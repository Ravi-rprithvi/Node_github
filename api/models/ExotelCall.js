/**
 * ExotelCall.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */


module.exports = {
    autoCreatedAt: true,
    autoUpdatedAt: true,
    attributes: {

        landId: {
            model: 'lands',
        },
        landInterestId: {
            model: 'landinterests'
        },
        landVisitId: {
            model: 'landvisitschedules'
        },
        recordingUrl: {
            type: 'string',
        },
        to: {
            type: 'integer',
        },
        from: {
            type: 'integer',

        },
        startTime: {
            type: 'date',

        },
        endTime: {
            type: 'date',

        },
        toUserId: {
            model: 'users',
        },
        fromUserId: {
            model: 'users'
        },

        conversationDuration: {
            type: 'json'
        },
        media: {
            type: 'string',
            enum: ['exotel'],
            defaultsTo: 'exotel',
            required: true
        },
        mediaResponse: {
            type: 'json',
        },
        mediaId: {
            type: 'string',
            required: true
        },
        callSid: {
            type: 'string',
            required: true
        },
        mediaCallStatus: {
            type: 'string',

        },
        mediaResponseType: {
            type: 'string',
            enum: ['start', 'terminate'],
            defaultsTo: 'start',
            required: true
        }

    }
};

