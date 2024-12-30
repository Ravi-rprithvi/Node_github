/**
 * LandVisitSchedule.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    autoCreatedAt: true,
    autoUpdatedAt: true,

    attributes: {
        landId: {
            model: 'lands'
        },
        
        landInterestId: {
            model: 'landinterests'
        },

        buyerId: {
            model: 'users'
        },

        sellerId: {
            model: 'users'
        },

        franchiseeId: {
            model: 'users'
        },

        market: {
            model: 'market'
        },

        visitTime: {
            type: 'datetime'
        },

        buyerFeedback: {
            type: 'string'
        },

        franchiseeFeedback: {
            type: 'string'
        },

        franchiseeQA: {
            type: 'array' //array of objects , each object contains keys: question: string and answer: string
        },

        buyerQA: {
            type: 'array' //array of objects , each object contains keys: question: string and answer: string
        },

        visitStatus: {
            type: 'string',
            enum: ['scheduled', 'visited', 'not_visited', 'canceled'],
            defaultsTo: 'scheduled'
        },

        canceledBy: {
            model: 'users',
            // required: true
        },

        cancelReason: {
            type: 'string',
        },

        cancelComment: {
            type: 'string',
        },

        dealDateTime: {
            type: 'datetime'
        },

        visitType: {
            type: 'integer',
            defaultsTo: 1
        },

        coordinator: {
            model: 'users',
            // required: true
        }
    }
};


