/**
 * TripOrder.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    autoCreatedAt: true,
    autoUpdatedAt: true,

    attributes: {
        status: {
            type: 'string',
            enum: ['Pending', 'PickupInTransit', 'PickupDone', 'DropInTransit', 'Delivered', 'Revert'],
            required: true,
            defaultsTo: 'Pending'
        },

        seller: {
            model: 'Users',
            // required: true
        },

        buyer: {
            model: 'Users',
            required: true
        },

        tripId: {
            model: 'LogisticTrip'
        },

        sourceAddress: {
            type: 'json',
            required: true
        },

        destinationAddress: {
            type: 'json',
            required: true
        },

        sourcePincode: {
            type: 'integer',
            required: true
        },

        destinationPincode: {
            type: 'integer',
        },

        sourceCoordinates: {
            type: 'json',
            required: true,
        },

        destinationCoordinates: {
            type: 'json',
            required: true,
        },

        bidId: {
            model: 'Bids'
        },

        orderId: {
            model: 'Orderedcarts'
        },
        fieldTransactionId: {
            model: 'FieldTransactions'
        },

        type: {
            type: 'string',
            enum: ['bid', 'cartOrder', 'fieldTransaction'],
            defaultsTo: 'bid'
        },

        PODDocs: {
            type: "json"   //Object contains keys : "signature" , "POD". Both will be images name.
        },

        pickupTime: {
            type: 'date'
        },

        deliveryTime: {
            type: 'date'
        },

        revertReason: {
            type: 'string'
        }
    }
};

