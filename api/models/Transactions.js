/**
 * Transactions.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    autoCreatedAt: true,
    autoUpdatedAt: true,
    attributes: {

        buyerId: {
            model: 'users'
        },

        order: {
            model: 'orders'
        },
        suborder: {
            model: 'Orderedcarts'
        },

        sellerId: {
            model: 'users'
        },

        crop: {
            model: 'crops'
        },
        land: {
            model: 'lands'
        },
        landInterestId: {
            model: 'landinterests'
        },

        input: {
            model: 'inputs'
        },

        productType: {
            type: 'string',
            enum: ['crop', 'input', 'land', 'subscription'],
            defaultsTo: 'crop',
        },

        bidId: {
            model: 'bids'
        },
        bidsPaymentId: {
            model: 'Bidspayment'
        },

        transactionId: {
            type: 'string'
        },

        amount: {
            type: 'float',
            defaultsTo: 0.00,
        },

        refundAmount: {
            type: 'float',
            defaultsTo: 0.00,
        },

        processedBy: {
            model: 'users'
        },

        paymentjson: {
            type: 'json'
        },

        refundjson: {
            type: 'json'
        },

        paymentType: {
            type: 'string' // PayTm, DD, Wire
        },

        processStatus: {
            type: 'string',
            // defaultsTo:'success'
        },

        status: {
            type: 'string',
            enum: ['EA', 'UA', 'FUA', 'LA', 'BA', 'FBA', 'FA', 'RF', 'WD', 'DA', 'FP', 'LP'],
            defaultsTo: 'EA'
        },

        payTmRefundId: {
            type: 'string'
        },

        transactionType: {
            type: 'string',
            enum: ['Credit', 'Debit', 'DebitEscrow'],
            defaultsTo: 'Credit'
        },

    }
};

