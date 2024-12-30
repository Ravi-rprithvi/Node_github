/**
 * Subscriptions.js
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
            required: true,
            unique: true
        },
        color: {
            type: 'string',
        },
        paymentScheme: {
            type: 'string'
        },
        price: {
            type: 'float',
            defaultsTo: 0
        },
        discount: {
            type: 'float',
            defaultsTo: 0
        },
        paymentType: {
            type: 'array'
        },
        validity: {
            type: 'integer',
        },
        validityType: {
            type: 'string',
            enum: ['Hourly', 'Weekly', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly'],

        },
        validityImage: {
            type: 'string'
        },
        visibility: {
            type: 'string',
            enum: ['Normal', 'IsFeatured', 'Banner'],
            defaultsTo: 'Normal'
        },
        visibilityImage: {
            type: 'string'
        },
        buyerNotification: {
            type: 'boolean',
            defaultsTo: false
        },
        buyerNotificationImage: {
            type: 'string'
        },
        propertyDescription: {
            type: 'string',
            enum: ['Basic', 'Expert'],
            defaultsTo: 'Basic'
        },
        propertyDescriptionImage: {
            type: 'string'
        },
        socialMedia: {
            type: 'boolean',
            defaultsTo: false
        },
        socialMediaImage: {
            type: 'string'
        },
        contactDetail: {
            type: 'string',
            enum: ['PanIndia'],
            defaultsTo: 'PanIndia'
        },
        contactDetailImage: {
            type: 'string'
        },
        video_image: {
            type: 'boolean',
            defaultsTo: true

        },
        videoImage: {
            type: 'string'
        },
        noOfEditsType: {
            type: 'string',
            enum: ['unlimited', 'counted'],
            defaultsTo: 'unlimited'
        },
        noOfEdits: {
            type: 'integer',
            defaultsTo: 0
        },

        isActive: {
            type: 'boolean',
            defaultsTo: true
        },


    }
};

