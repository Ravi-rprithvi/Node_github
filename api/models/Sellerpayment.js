/**
 * Sellerpayment.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    autoCreatedAt: true,
    autoUpdatedAt: true,
    attributes: {
        cropId: {
            model: 'crops' //in case of aggregation this is the aggregated crop or resultant crop under aggregation
        },

        baseCropId: {
            model: 'crops' //in case of aggregation this is base crop which was aggregated un above crop id
        },

        landId: {
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
            enum: ['crop', 'input', 'land'],
            defaultsTo: 'crop',
        },

        bidId: {
            model: 'bids'
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

        buyerId: {
            model: 'users'
        },

        franchiseeId: {
            model: 'users'
        },

        amount: {
            type: 'float',
            defaultsTo: 0.00
        },

        originalAmount: {
            type: 'float',
        },

        pincode: {
            type: 'integer'
        },

        type: {
            type: 'string',
            enum: ['Upfront', 'Deposit', 'Final'],
            required: true
        },

        depositedOn: {
            type: 'datetime'
        },

        paymentDueDate: {
            type: 'datetime'
        },

        isVerified: {
            type: 'boolean',
            defaultsTo: false
        },

        verifiedBy: {
            model: 'users'
        },

        paymentBy: {
            model: 'users'
        },

        verifyDate: {
            type: 'date',
        },

        transactionId: {
            model: 'transactions',
        },

        sequenceNumber: {
            type: 'integer'
        },

        paymentMode: {
            type: 'string',
            enum: ['Cheque', 'DD', 'WireTransfer', 'PayTm', 'AutoAdjusted']
        },
        payableAt: {
            type: 'string',
        },
        depositLabel: {
            type: 'string',
        },
        payeeName: {
            type: 'string',
        },
        draftNumber: {
            type: 'string'
        },
        draftBankName: {
            type: 'string'
        },
        draftdate: {
            type: 'date'
        },
        depositDate: {
            type: 'date'
        },
        depositedbranch: {
            type: 'string'
        },
        otherDetails: {
            type: 'string'
        },
        chequeNumber: {
            type: 'string'
        },
        chequeBankBranch: {
            type: 'string'
        },
        chequeDate: {
            type: 'date'
        },
        wireTransferMode: {
            type: 'string'
        },
        wireTransferReferenceId: {
            type: 'string'
        },
        status: {
            type: 'string',
            enum: ['Due', 'Paid', 'Verified', 'Overdue', 'Refund', 'OverdueRefund', 'Refunded', 'RefundVerified'],
            required: true
        },
        bidStatus: {
            type: 'string',
            enum: ['Accepted', 'Placed']
        },
        image: {
            type: 'string',
        },
        paymentMedia: {
            type: 'string',
            enum: ['Bid', 'Cart', 'landinterest'],
            defaultsTo: 'Bid'
        },
        payer: {
            model: 'users'
        },
        payerType: {
            type: 'string',
            enum: ['Farmx', 'Franchisee', 'Buyer', 'Seller'],
            defaultsTo: 'Farmx'
        },
        payTo: {
            type: 'string',
            enum: ['Farmx', 'Franchisee', 'Buyer', 'Seller'],
            defaultsTo: 'Seller'
        },
    }
};