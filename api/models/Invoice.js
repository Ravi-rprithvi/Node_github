/**
 * Invoice.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  autoCreatedAt: true,
  autoUpdatedAt: true,
    attributes: {
        bidId: {
            model:'bids'
        },
        
        orderId: {
            model:'orders'
        },

        suborder: {
            model: 'Orderedcarts'
        },

        landdeal: {
            model: 'landinterests'
        },

        fieldTransaction: {
            model: 'FieldTransactions'
        },

        type:{
            type: 'string',
            enum: [ 'bid', 'order', 'landinterest', 'fieldtransaction' ],
            defaultsTo: 'bid',
        },

        number: {
            type: 'integer'
        },

        financialYear: {
            type: 'string'
        }
    }
};