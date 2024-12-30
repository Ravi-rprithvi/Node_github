/**
 * Inputs.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    autoCreatedAt: true,
    autoUpdatedAt: true,
    attributes: {

        name: {
            type: 'string',
            required: true
        },

        code: {
            type: 'integer',
            unique: true
        },

        market: {
            model: 'market'
        },



        dealer: {
            model: 'users'
        },

        category: {
            model: 'category',
            required: true
        },

        allbids: {
            collection: 'Bids',
            via: 'input'
        },




        inputbuyerpayments: {
            collection: 'Bidspayment',
            via: 'input'
        },

        inputBidSellerpayments: {
            collection: 'Sellerpayment',
            via: 'input'
        },

        inputOrderSellerpayments: {
            collection: 'Sellerpayment',
            via: 'input'
        },

        allOrders: {
            collection: 'Orderedcarts',
            via: 'input'
        },
        variety: {
            type: 'string'
        },

        company: {
            type: 'string',
            required: true
        },

        price: {
            type: 'float',
            required: true
        },

        finalPrice: {
            type: 'float',
            defaultsTo: 0.00
        },

        pricesAtMarkets: {
            collection: 'ProductMarketPrice',
            via: 'input'
        },

        manufacturer: {
            model: 'manufacturer'
        },
        availableQuantity: {
            type: 'float',
            required: true
        },

        minimumQuantityToPurchase: {
            type: 'float',
            required: true
        },

        workingUnit: {
            type: 'string',
            required: true,
            defaultsTo: 'KG'
        },

        allOrders: {
            collection: 'Orderedcarts',
            via: 'input'
        },

        isCODAvailable: {
            type: 'boolean',
            defaultsTo: true
        },

        bidEndDaysUnit: {
            type: 'string',
            enum: ['Days', 'Month', 'Year'],
            required: true,
            defaultsTo: 'Days'
        },
        isStepsPaymentAvailable: {
            type: 'boolean',
            defaultsTo: true
        },

        isAdvancePaymentAvailable: {
            type: 'boolean',
            defaultsTo: true
        },

        taxRate: {
            type: 'float',
            defaultsTo: 18.00,
        },

        bidEarnestPercent: {
            type: 'float',
            defaultsTo: 1.00,
        },

        upfrontPercent: {
            type: 'float',
            defaultsTo: 10.00,
        },

        efarmxComission: {
            type: 'float',
            defaultsTo: 10.00,
        },

        bidQuantityUnit: {
            type: 'string'
        },
        taxes: {
            type: 'array'
        },

        productTaxes: {
            type: 'array' //taxes of the product by dealer. Array of keyvalue where value is float
        },

        productTaxRate: {
            type: 'float',
            defaultsTo: 18.00,
        },

        description: {
            type: 'string',
            required: true
        },

        earnestPercent: {
            type: 'float',
            defaultsTo: 0.00,
        },

        depositPayment: {
            type: 'array'
        },

        finalPaymentPercentage: {
            type: 'float'
        },

        finalPaymentDays: {
            type: 'integer'
        },



        shippingPrice: {
            type: 'float',
            defaultsTo: 0.0
        },

        buyergeneralTerms: {
            type: 'string'
        },

        buyerpaymentTerms: {
            type: 'string'
        },

        pincode: {
            type: 'integer',
            required: true
        },

        buyerlogisticTerms: {
            type: 'string'
        },

        sellergeneralTerms: {
            type: 'string'
        },

        sellerpaymentTerms: {
            type: 'string'
        },

        sellerlogisticTerms: {
            type: 'string'
        },

        coverPageImage: {
            type: 'string'
        },

        images: {
            type: 'array',
        },

        gifimages: {
            type: 'array',
        },
        isBidNow: {
            type: 'string',
            defaultsTo: "Yes"
        },

        isAddToCart: {
            type: 'string',
            defaultsTo: "Yes"
        },


        isApproved: {
            type: 'boolean',
            required: true,
            defaultsTo: false
        },



        isFeatured: {
            type: 'boolean',
            defaultsTo: false
        },

        approvedOn: {
            type: 'date'
        },

        isActive: {
            type: 'boolean',
            defaultsTo: false
        },

        approvedBy: {
            model: 'users'
        },



        isDeleted: {
            type: 'boolean',
            defaultsTo: false
        },


        status: {
            type: 'string',
            enum: ['Active', 'Deactive'],
            defaultsTo: 'Active'
        },
        viewed: {
            type: 'integer',
            defaultsTo: 0
        },

        soldQuantity: {
            type: 'float',
            defaultsTo: 0.0
        },

        franchiseePercentage: {
            type: 'float',
            defaultsTo: 1.0
        },

        sellerUpfrontPercentage: {
            type: 'float',
            defaultsTo: 0.00
        },

        sellerUpfrontDays: {
            type: 'integer',
            defaultsTo: 0
        },

        sellerFinalPercentage: {
            type: 'float',
            defaultsTo: 0.00
        },

        leftAfterAcceptanceQuantity: {
            type: 'float',
            defaultsTo: 0.0
        },

        verified: {
            type: 'string',
            enum: ['Yes', 'No'],
            defaultsTo: 'No'
        },




        leftAfterDeliveryQuantity: {
            type: 'float',
            defaultsTo: 0.0
        },

        sellerFinalDays: {
            type: 'integer',
            defaultsTo: 0
        },

        sellerDepositPayment: {
            type: 'array'
        },

        isExpired: {
            type: 'boolean',
            defaultsTo: false
        },

        deletedBy: {
            model: 'users'
        },



        availableUnit: {
            type: 'string',
            enum: ['Days', 'Month', 'Year'],
            required: true,
            defaultsTo: 'Days'
        },
        deleteDate: {
            type: 'date'
        },

        availableFrom: {
            type: 'date',
        },

        availableTill: {
            type: 'date',
        },

        availableForFranchisees: {
            type: 'array',
            required: true
        },

        ratedUsersCount: {
            type: 'integer'
        },

        averageRating: {
            type: 'float',
            defaultsTo: 0.0
        }
    }
};
