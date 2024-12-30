/**
 * DigitalLockers.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    
    autoCreatedAt: true,
    autoUpdatedAt: true,

	attributes: {
        code: {
            type: 'string',
            required: true
        },

        owner: {
            model: 'users',
            required: true
        },

        maxDocumentCount: {
            type: 'integer',
            required: true,
            defaultsTo: 1000
        }        
	}
};
