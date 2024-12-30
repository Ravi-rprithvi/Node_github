/**
 * LockerDocumentPages.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    
    autoCreatedAt: true,
    autoUpdatedAt: true,

	attributes: {
        owner: {
            model: 'users',
            required: true
        },

        type: {
            type: 'string',
            enum: ['pdf', 'image'],
            required: true,
            defaultsTo: 'image'
        },

        mimeType: {
            type: 'string'
        },

        size: {
            type: 'integer',
            defaultsTo: 0,
            required: true
        },

        number: {
            type: 'integer',
            required: true
        },

        fileName: {
            type: 'string'
        },

        isDeleted: {
            type: 'boolean',
            defaultsTo:false
        },        

        deletedDate: {
            type: 'datetime'
        },

        document: {
            model: 'lockerDocuments'
        },

        path: {
            type: 'string',
            required: true
        },

        isThumbnailAvailable: {
            type: 'boolean',
            defaultsTo:false
        },        
	}
};
