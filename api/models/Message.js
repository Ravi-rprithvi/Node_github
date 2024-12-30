/**
 * Message.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  autoCreatedAt: true,
  autoUpdatedAt: true,
    attributes: {        
        to:{
          model:'users',
          required: true
        },

        from:{
          model:'users',
          required: true
        },
        
        relatedTo: {
            type:'string'
        },

        relatedId: {
            type: 'string'
        },

        message: {
            type: 'string',
            required: true
        },

        type: {
            type: 'string',
            enum: ['internal', 'external'],
            required: true
        },

        read: {
            type: 'boolean',
            defaultsTo: false,
            required: true
        },

        readAt : {
            type: 'datetime',
        }

    }
};

