/**
 * Rating.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    autoCreatedAt: true,
    autoUpdatedAt: true,
    attributes: {

        reviewer: {
          model:'users'
        },

        user: {
          model:'users'
        },

        star: {
            type: 'integer',
            required: true,
        }, 
        
        review: {
            type: 'string'
        },

        comment: {
            type: 'string'
        },

        rateOnModal: {
            type:'string'
        },

        modalId: {
            type: 'string'
        },

        isFarmx: {
            type: 'boolean',            
            defaultsTo: false
        },
    }
};

