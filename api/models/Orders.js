/**
 * Orders.js
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

        buyer: {
            model: 'users'
        },

        orderedCarts: {
            collection: 'Orderedcarts',
            via: 'order'
        },

        txns: {
            collection: 'Transactions',
            via: 'order'
        },

        paymentStatus: {
            type: 'integer',
            defaultsTo: 0
        },

        totalAmount: {
            type: 'float',
            defaultsTo: 0.00
        },
        finalAmount: {
            type: 'float',
            defaultsTo: 0.00
        },

        avgFacilitationPercent: {
            type: 'float',
            defaultsTo: 0.00
        },
        totalFacilitationCharges: {
            type: 'float',
            defaultsTo: 0.00
        },
        avgInsurancePercent: {
            type: 'float',
            defaultsTo: 0.00
        },
        totalInsuranceCharges: {
            type: 'float',
            defaultsTo: 0.00
        },
        avgTaxPercent: {
            type: 'float',
            defaultsTo: 0.00
        },
        totalTaxAmount: {
            type: 'float',
            defaultsTo: 0.00
        },
        totalDistance: {
            type: 'float',
            defaultsTo: 0
        },
        deliveryCharges: {
            type: 'float',
            defaultsTo: 0
        },
        logisticsOption: {
            type: 'string'
        },
        temTotal: {
            type: 'float',
            defaultsTo: 0.00
        },
        totalBidEarnestAmount: {
            type: 'float',
            defaultsTo: 0.00
        },

        taxAmount: {
            type: 'float',
            defaultsTo: 0.00
        },

        shippingPrice: {
            type: 'float',
            defaultsTo: 0.00
        },
        shippingAddress: {
            type: 'json'
        },
        billingAddress: {
            type: 'json'
        },

        /* status: {
             type: 'string',
             enum: ['Pending', 'Completed', 'Failed', 'Delivered', 'Processing']
         },*/

        address: {
            type: 'string'
        },

        pincode: {
            type: 'integer'
        },

        logisticsOption: {
            type: 'string',
            enum: ['self', 'efarmx']
        },
        logisticId: {
            model: 'lpartners'
        },
        vehicleId: {
            type: "string"
        },
        tripId: {
            model: "LogisticTrip"
        },
        isModerntrader: {
            type: 'Boolean',
            defaultsTo: false
        },
        changeStatus: {
            type: 'Boolean',
            defaultsTo: false
        },
        placedStatus: {
            type: 'Boolean',
            defaultsTo: true
        },
        emailSequnce: {
            type: 'integer'
        },
        company: {
            type: 'string'
        }

    }
};
