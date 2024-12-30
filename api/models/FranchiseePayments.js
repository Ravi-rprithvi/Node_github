/**
 * FranchiseePayments.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    autoCreatedAt: true,
    autoUpdatedAt: true,
    attributes: {
        cropId: {
            model: 'crops'
        },
        inputId: {
            model: 'inputs'
        },
        landId: {
            model: 'lands'
        },

        landInterestId: {
            model: 'landinterests'
        },
        order: {
            model: 'orders'
        },
        suborder: {
            model: 'Orderedcarts'
        },
        bidId: {
            model: 'bids'
        },
        sellerId: {
            model: 'users'
        },
        marketId: {
            model: 'market'
        },
        franchiseeUserId: {
            model: 'users'
        },
        buyerId: {
            model: 'users'
        },
        image: {
            type: 'string',
        },
        amount: {
            type: 'float',
            defaultsTo: 0.00
        },
        originalAmount: {
            type: 'float'
        },
        pincode: {
            type: 'integer'
        },
        paymentDate: {
            type: 'date'
        },
        paymentDueDate: {
            type: 'datetime'
        },
        isVerified: {
            type: 'boolean',
            defaultsTo: false
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
        paymentMode: {
            type: 'string',
            enum: ['Cheque', 'DD', 'WireTransfer', 'PayTm']
        },
        payableAt: {
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
        depositedOn: {
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
            enum: ['Due', 'Paid', 'Verified', 'Overdue', 'Refund', 'OverdueRefund', 'Refunded', 'RefundVerified']
        },
        productType: {
            type: 'string',
            enum: ['crop', 'input', 'land'],
            defaultsTo: 'crop',
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
            defaultsTo: 'Franchisee'
        },
    }
};