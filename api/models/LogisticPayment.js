/**
 * LogisticPayment.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  autoCreatedAt: true,
  autoUpdatedAt: true,
    attributes: {
        logisticPartner: {
            model:'lpartners'
        },

        cropId: {
            model:'crops'
        },

        input: {
            model:'inputs'
        },

        productType:{
            type: 'string',
            enum: [ 'crop', 'input' ],
            defaultsTo: 'crop',
        },

        order: {
            model: 'orders'
        },
        suborder: {
            model: 'Orderedcarts'
        },
        bidId:{
            model:'bids'
        },
        sellerId:{
          model:'users'
        },

        image: {
            type: 'string',
        },

        buyerId:{
          model:'users'
        },
        amount:{
            type: 'float',
            defaultsTo: 0.00
        },
        pincode:{
            type:'integer'
        },
        
        paymentDate:{
            type:'date'
        },
        paymentDueDate:{
            type:'date'
        },
        isVerified:{
            type: 'boolean',
            defaultsTo:false
        },
        paymentBy:{
            model:'users'
        },
        verifyDate:{
            type: 'date',
        },
        transactionId:{
            model:'transactions',
        },
        paymentMode: {
            type: 'string',
            enum: [ 'Cheque', 'DD', 'WireTransfer','PayTm']
        },
        payableAt:{
            type: 'string',
        },
        payeeName:{
            type: 'string',
        },
        draftNumber:{
            type:'string'
        },
        draftBankName:{
            type:'string'
        },
        draftdate:{
            type:'date'
        },
        depositDate:{
            type:'date'
        },
        depositedOn:{
            type:'date'
        },
        depositedbranch:{
            type:'string'
        },
        otherDetails:{
            type:'string'
        },
        chequeNumber:{
            type:'string'
        },
        chequeBankBranch:{
            type:'string'  
        },
        chequeDate:{
            type:'date'
        },
        wireTransferMode:{
            type:'string'
        },
        wireTransferReferenceId:{
            type:'string'
        },
        status: {
            type: 'string',
            enum: [ 'Due', 'Made', 'Overdue']
        },
        paymentMedia: {
            type: 'string',
            enum: ['Bid', 'Cart'],
            defaultsTo:'Bid'
        },
        remark:{
            type: 'array'
        }
        
    }
};