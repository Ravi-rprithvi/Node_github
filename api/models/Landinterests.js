/**
 * Landinterests.js
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

        landId: {
            model: 'lands'
        },

        buyerId: {
            model: 'users',
            required: true
        },
        sellerId: {
            model: 'users',
            required: true
        },
        area: {
            type: 'float',
            defaultsTo: 0.00,
        },

        areaUnit: {
            type: 'string'
        },

        dealType: {
            type: 'string',
            enum: ['Sell', 'Lease'],
            required: true
        },

        buyerPayment: {
            collection: 'BidsPayment',
            via: 'landInterestId'
        },

        sellerPayment: {
            collection: 'Sellerpayment',
            via: 'landInterestId'
        },

        franchiseePayment: {
            collection: 'FranchiseePayments',
            via: 'landInterestId'
        },

        landPrice: {
            type: 'float',
            defaultsTo: 0.00
        },

        dealAtPrice: {
            type: 'float',
            defaultsTo: 0.00
        },

        landLeasePriceUnit: {
          type: 'string',
          enum: ['Month', 'Year'],
        },

        landLeaseAvailabilityFrom: {
          type: 'date',
        },

        landLeaseAvailabilityTill: {
          type: 'date',
        },

        leaseFrom: {
          type: 'date',
        },

        leaseTill: {
          type: 'date',
        },

        displayPrice: {
            type: 'string'
        },
        buyerTaxes: {
            type: 'array'
        },
        buyerTaxRate: {
            type: 'float',
        },

        buyerTaxCharges: {
            type: 'float',
        },

        sellerTaxes: {
            type: 'array'
        },
        sellerTaxRate: {
            type: 'float',
        },

        sellerTaxCharges: {
            type: 'float',
        },

        franchiseeCommissionPercent: {
            type: 'float',
            defaultsTo: 0.00
        },

        buyerFacilitationCharges: {
            type: 'float',
            defaultsTo: 0.00
        },

        buyerFacilitationPercent: {
            type: 'float',
            defaultsTo: 0.00
        },

        sellerFacilitationCharges: {
            type: 'float',
            defaultsTo: 0.00
        },

        sellerFacilitationPercent: {
            type: 'float',
            defaultsTo: 0.00
        },

        tokenAmount: {
            type: 'float',
            required: true
        },

        buyerTotalAmount: {
            type: 'float',
            required: true
        },

        earnestAmount: {
            type: 'float',
            defaultsTo: 0,
            required: true
        },

        sellerAmountByBuyer: {
            type: 'float',
            defaultsTo: 0,
            required: true
        },

        buyerCancelDeductionPercentage: {
            type: 'float',
            defaultsTo: 0.00,
        },

        sellerCancelDeductionPercentage: {
            type: 'float',
            defaultsTo: 0.00,
        },
        
        buyerAgreement: {
            type: 'text'
        },

        sellerAmountInToken: {
            type: 'float',
            defaultsTo: 0,
            required: true
        },

        sellerAmountByFarmX: {
            type: 'float',
            defaultsTo: 0,
            required: true
        },

        dealTotalAmount: {
            type: 'float',
            required: true
        },

        productType: {
            type: 'string',
            enum: ['land'],
            defaultsTo: 'land',
        },

        status: {
            type: 'string',
            enum: ['interested', 'revisit', 'deal_requested', 'deal_accepted', 'payments_done', 'transferred', 'canceled', 'failed'],
            required: true,
            defaultsTo: 'interested'
        },

        canceledBy: {
            model: 'users',
            // required: true
        },

        canceledOn: {
            type: 'datetime'
        },

        cancelReason: {
            type: 'string',
        },

        cancelComment: {
            type: 'string',
        },

        coordinator: {
            model: 'users',
            // required: true
        },

        marketId: {
            model: 'market',
            required: true
        },

        franchiseeId: {
            model: 'users',
            required: true
        },

        invoice: {
            model: "Invoice"
        },

        visits: {
            collection: 'LandVisitSchedules',
            via: 'landInterestId'
        },
        uniqueId: {
            type: 'string'
        },

        registryDate: {
            type: 'datetime'
        },

        registryDateAddedOn: {
            type: 'datetime'
        },

        transferDate: {
            type: 'datetime'
        },

        invoice: {
            model: "Invoice"
        }
    }
};
