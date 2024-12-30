/**
 * FarmxPayment.js
 *
 * @description :: TODO: You might write a short summary of how this model 
 * cworks and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    autoCreatedAt: true,
    autoUpdatedAt: true,
    attributes: {
        cropId: {
            model: 'crops'
        },
        bidId: {
            model: 'bids'
        },
        sellerId: {
            model: 'users'
        },
        franchiseeId: {
            model: 'users'
        },
        input: {
            model: 'inputs'
        },

        productType: {
            type: 'string',
            enum: ['crop', 'input'],
            defaultsTo: 'crop',
        },

        image: {
            type: 'string',
        },
        order: {
            model: 'orders'
        },
        suborder: {
            model: 'Orderedcarts'
        },

        buyerId: {
            model: 'users'
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
        type: {
            type: 'string',
            enum: ['Earnest', 'Deposit', 'Final']
        },
        sequenceNumber: {
            type: 'integer'
        },

        paymentDate: {
            type: 'date'
        },
        paymentDueDate: {
            type: 'date'
        },
        isVerified: {
            type: 'boolean',
            defaultsTo: false
        },
        verifiedBy: {
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
            enum: ['Cheque', 'DD', 'WireTransfer', 'PayTm', 'AutoAdjusted']
        },
        name: {
            type: 'string',
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
        bidStatus: {
            type: 'string',
            enum: ['Accepted', 'Placed']
        },
        images: {
            type: 'string'
        },
        paymentMedia: {
            type: 'string',
            enum: ['Bid', 'Cart'],
            defaultsTo: 'Bid'
        },
        caseId: {
            type: 'string'
        },
        refundDescription: {
            type: 'text'
        },
        refundBy: {
            model: 'users'
        },
        payer: {
            model:'users'
        },
        payerType: {
            type: 'string',
            enum: [ 'Farmx', 'Franchisee', 'Buyer', 'Seller'],
            defaultsTo: 'Franchisee'
        },        
        payTo:{
            type: 'string',
            enum: [ 'Farmx', 'Franchisee', 'Buyer', 'Seller'],
            defaultsTo: 'Farmx'
        },
    }
};