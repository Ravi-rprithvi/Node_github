/**
 * BuyerRequirement.js
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
            unique: true
        },

        market: {
            model: 'market'
        },

        pincode: {
            type: 'integer',
            // required: true,
            maxLength: 6
        },

        user: {
            model: 'users'
        },

        mobile: {
            type: 'integer',
            maxLength: 10,
            required: true
        },

        category: {
            model: 'Category',
            // required:true
        },

        variety: {
            type: 'string'
        },

        quantity: {
            type: 'float',
            defaultsTo: 0,
            required: true
        },

        quantityUnit: {
            type: 'string',
            required: true,
            defaultsTo: "Qtl",
        },

        price: {
            type: 'float',
        },

        requiredOn: {
            type: 'date',
        },

        grade: {
            type: 'string',
        },

        productType: {
            type: 'string',
            enum: ['crops', 'lands'],
            defaultsTo: 'crops',
        },
        sourceLocation: {
            type: 'string',
        },
        location: {
            type: 'string',
        },

        city: {
            type: 'string',
        },

        state: {
            type: 'string',
        },

        district: {
            type: 'string'
        },

        landFor: {
            type: 'string',
            enum: ['landLease', 'landBuy'],
            defaultsTo: 'landBuy',
        },

        landSuitables: {
            type: 'array',
        },

        landArea: {
            type: 'float'
        },

        landAreaUnit: {
            type: 'string',
            defaultsTo: 'acre'
        },

        status: {
            type: 'string',
            enum: ['Pending', 'Suggested', 'Fulfilled'],
            defaultsTo: 'Pending',
            required: true
        },

        placedBid: {
            model: 'bids'
        },

        subscribe: {
            type: 'boolean',
            defaultsTo: false,
            required: true
        },

        otp: {
            type: 'integer',
            maxLength: 4,
        },
        requirementSource: {
            type: 'string',
            enum: ['admin', 'frontend'],
            defaultsTo: 'frontend',
        },
        addedBy: {
            model: 'users'
        },
        staff: {
            type: 'boolean',
            defaultsTo: false,

        },
        rejection: {
            type: 'float'
        },
        cpName: {
            type: 'string'
        },
        nameOfCP: {
            model: 'users'
        },
        franchiseeId: {
            model: 'users'
        },
        franchiseeQuote: {
            type: 'array' //array of json
        },

        dealExecuted: {
            type: 'boolean',
            defaultsTo: false,
        },
        transactionCode: {
            type: 'string'
        },
        reason: {
            type: 'string'
        },
        dealDoneByFranchisee: {
            model: 'users'
        },
        logisticCost: {
            type: 'float'
        },
        remarks: {
            type: 'string'
        },
        reason: {
            type: 'string'
        },
        requirementDescription: {
            type: 'text'
        }
    },

};

