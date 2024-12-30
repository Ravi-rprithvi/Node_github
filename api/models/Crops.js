/**
 * Crops.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */


module.exports = {
    autoCreatedAt: true,
    autoUpdatedAt: true,
    attributes: {

        code: {
            type: 'integer',
            unique: true
        },

        market: {
            model: 'market'
        },

        seller: {
            model: 'users'
        },

        // sellers: {
        //   type:'array' //[id of all sellers in case of aggregation]
        // },

        transactionOwner: {
            model: 'users'
        },

        allbids: {
            collection: 'Bids',
            via: 'crop'
        },

        aggregations: {
            type: 'array', // array of aggregation ids in crops
        },

        aggregatedCrops: {
            type: 'array', // array of crop ids in aggregation
        },

        // published: {
        //     type: 'boolean',
        //     defaultsTo: true,
        //     required: true
        // },

        croppayments: {
            collection: 'Sellerpayment',
            via: 'cropId'
        },

        cropOrderpayments: {
            collection: 'Sellerpayment',
            via: 'cropId'
        },

        myOrders: {
            collection: 'Orderedcarts',
            via: 'crop'
        },

        efarmxLogisticPercentage: {
            type: 'float',
            defaultsTo: 0.00,
            required: true
        },

        name: {
            type: 'string',
            required: true
        },

        category: {
            model: 'Category',
            required: true
        },

        categoryId: {
            type: 'string'
        },

        variety: {
            type: 'string'
        },

        viewed: {
            type: 'integer',
            defaultsTo: 0
        },

        quantity: {
            type: 'float',
            defaultsTo: 0,
            required: true
        },

        quantitiesPart: {
            type: 'json' //id of crop and their quantities in case of aggregation            
        },

        quantityUnit: {
            type: 'string',
            required: true
        },

        price: {
            type: 'float',
            defaultsTo: 0.00,
            required: true
        },

        minBidAmount: {
            type: 'float',
            defaultsTo: 0.00,
        },

        bidEndDate: {
            type: 'date',
        },

        bidEndDays: {
            type: 'integer'
        },

        finalPaymentDays: {
            type: 'integer'
        },
        
        bidEndDaysUnit: {
            type: 'string',
            enum: ['Days', 'Month', 'Year'],
            required: true,
            defaultsTo: 'Days'
        },

        bidEarnestAmount: {
            type: 'float',
            defaultsTo: 0.00,
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

        insurancePercent: {
            type: 'float',
            defaultsTo: 0.00,
        },

        bidQuantityUnit: {
            type: 'string'
        },

        shippingPrice: {
            type: 'float',
        },

        endDate: {
            type: 'date',
        },

        grade: {
            type: 'string',
            //enum: ['A+', 'A', 'B', 'C', 'D'],
            //defaultsTo:'A'
        },

        grades: {
            type: 'array', //in case of aggregation
            //enum: ['A+', 'A', 'B', 'C', 'D'],
            //defaultsTo:'A'
        },

        availableFrom: {
            type: 'date',
        },

        upfrontProcessedDate: {
            type: 'date',
        },

        farmerUpfrontProcessedDate: {
            type: 'date',
        },

        balanceProcessedDate: {
            type: 'date',
        },

        farmerBalanceProcessedDate: {
            type: 'date',
        },

        logisticProcessedDate: {
            type: 'date',
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

        sellerFinalDays: {
            type: 'integer',
            defaultsTo: 0
        },

        sellerDepositPayment: {
            type: 'array'
        },

        isBidNow: {
            type: 'string',
            defaultsTo: "Yes"
        },

        isAddToCart: {
            type: 'string',
            defaultsTo: "No"
        },

        deliveredAt: {
            type: 'date'
        },

        rejectedAt: {
            type: 'date'
        },

        acceptedAt: {
            type: 'date'
        },

        availablePeriod: {
            type: 'integer'
        },

        availableUnit: {
            type: 'string',
            enum: ['Days', 'Month', 'Year'],
            required: true,
            defaultsTo: 'Days'
        },

        terms: {
            type: 'string'
        },

        // allImages: {
        //     type: 'array'
        // },

        coverImage: {
            type: 'string'
        },

        images: {
            type: 'array',
        },

        videos: {
            type: 'array',
        },

        gifimages: {
            type: 'array',
        },

        depositPayment: {
            type: 'array'
        },

        documents: {
            type: 'array'
        },

        lat: {
            type: 'string'
        },

        lng: {
            type: 'string'
        },

        status: {
            type: 'string',
            enum: ['Active', 'Deactive'],
            defaultsTo: 'Active'
        },

        address: {
            type: 'string',
            required: true
        },

        city: {
            type: 'string',
            required: true
        },

        district: {
            type: 'string',
            required: true
        },

        state: {
            type: 'string',
            required: true
        },

        pincode: {
            type: 'integer',
            required: true
        },

        description: {
            type: 'string'
        },

        paymentTerms: {
            type: 'string'
        },

        logisticsTerms: {
            type: 'string'
        },

        verified: {
            type: 'string',
            enum: ['Yes', 'No'],
            required: true,
            defaultsTo: 'No'
        },

        verifyBy: {
            model: 'users'
        },

        isFeatured: {
            type: 'boolean',
            defaultsTo: false
        },

        isApproved: {
            type: 'boolean',
            defaultsTo: false
        },

        approvedBy: {
            model: 'users'
        },

        approvedOn: {
            type: 'date'
        },

        isExpired: {
            type: 'boolean',
            defaultsTo: false
        },

        isDeleted: {
            type: 'boolean',
            defaultsTo: false
        },

        totalBids: {
            type: 'integer',
            defaultsTo: 0
        },

        highestBid: {
            type: 'float',
            defaultsTo: 0.00
        },

        leftAfterAcceptanceQuantity: {
            type: 'float',
            defaultsTo: 0.0
        },

        leftAfterAcceptanceQuantitiesParts: {
            type: 'json' //id of crop and their quantities left after acceptance in case of aggregation
        },

        leftAfterDeliveryQuantity: {
            type: 'float',
            defaultsTo: 0.0
        },

        franchiseePercentage: {
            type: 'float'
            // defaultsTo: 1.0
        },

        packaging: {
            type: 'array',
            required: false
            //it stores type and sizes array of object
        },

        aggregatedBy: {
            model: 'users'
        },

        disappovedReason: {
            type: 'array'
        },
        otherResource: {// this key is use for uploading data from other resources like klever kisan
            type: 'boolean',
            defaultsTo: false,
        }

    },

};

