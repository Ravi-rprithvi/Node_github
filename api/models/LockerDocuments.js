/**
 * LockerDocuments.js
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

        isDeleted: {
            type: 'boolean',
            defaultsTo: false
        },

        deletedDate: {
            type: 'datetime'
        },

        type: {
            type: 'string',
            required: true
        },

        pages: {
          collection: 'LockerDocumentPages',
          via: 'document'
        },

        locker: {
            model: 'digitalLockers',
            required: true
        },

        isVerified: {
            type: 'boolean',
            defaultsTo: false,
            required: true
        },

        verifiedBy: {
            model: 'users',
        },

        verifiedOn: {
            type: 'datetime',
        },
    }
};
