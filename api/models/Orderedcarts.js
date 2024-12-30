/**
 * Orderedcarts.js
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

        order: {
            model: 'orders'
        },

        buyingPrice: {  // price at which buyer is buying
            type: 'float',
            // defaultsTo: 0.00,
            required: true
        },

        sellingPrice: { //price at which seller is selling without considering efarmcommision, comminsion taxes and franchisee commission
            type: 'float',
            // defaultsTo: 0.00,
            required: true
        },

        buyerPayments: {
            collection: 'BidsPayment',
            via: 'suborder'
        },

        sellerPayments: {
            collection: 'Sellerpayment',
            via: 'suborder'
        },

        logisticPayments: {
            collection: 'LogisticPayment',
            via: 'suborder'
        },

        franchiseePayments: {
            collection: 'FranchiseePayments',
            via: 'suborder'
        },

        francshiseePercentage: {
            type: 'float',
            defaultsTo: 0.00
        },

        user: {
            model: 'users'
        },

        seller: {
            model: 'users'
        },

        buyer: {
            model: 'users'
        },

        receivedQuantity: {
            type: 'float',
            defaultsTo: 0.00,
        },

        receivedQuantityReason: {
            type: 'string'
        },

        receivedQuantityComment: {
            type: 'string'
        },

        receivedQuantityProofDocuments: {
            type: 'array'
        },

        receivedQuantityApprovedBy: {
            model: 'users'
        },

        receivedQuantityApprovedTime: {
            type: 'date'
        },

        market: {
            model: 'market'
        },

        productId: {
            type: 'string',
            required: true
        },

        land: {
            model: 'lands'
        },

        equipment: {
            model: 'equipment'
        },

        crop: {
            model: 'crops'
        },
        productType: {
            type: 'string',
            enum: ['CROP', 'INPUT', 'EQUIPMENT'],
            defaultsTo: 'CROP',
            required: true
        },

        paymentMethod: {
            type: 'string',
            enum: ['STEP', 'ADVANCE', 'COD'],
            required: true
        },

        input: {
            model: 'inputs'
        },

        amount: {
            type: 'float',
            defaultsTo: 0.00
        },
        totalAmount: {
            type: 'float',
            defaultsTo: 0.00
        },
        taxAmount: {
            defaultsTo: 0.00
        },

        taxes: {
            type: 'array' //taxes of the product by dealer. Array of keyvalue where value is float
        },

        taxPercent: {
            type: 'float',
            defaultsTo: 0.00
        },

        taxAmount: {
            type: 'float',
            defaultsTo: 0.00
        },

        productTaxes: {
            type: 'array' //taxes of the product by dealer. Array of keyvalue where value is float
        },

        productTaxAmount: {
            type: 'float',
            defaultsTo: 0.00
        },

        productTaxRate: {
            type: 'float',
            defaultsTo: 18.00,
        },

        quantity: {
            type: 'float',
            defaultsTo: 0.00,
            required: true
        },

        quantityUnit: {
            type: 'string'
        },

        documents: {
            type: 'array'       //contains array of object with each object contains {type: "String", path: "document path/name"}
        },

        facilitationPercent: {
            type: 'float',
            defaultsTo: 0.00
        },

        facilitationCharges: {
            type: 'float',
            defaultsTo: 0.00
        },

        earnestAmount: {
            type: 'float',
            defaultsTo: 0.00
        },

        distance: {
            type: 'float'
        },

        deliveryCharges: {
            type: 'float'
        },

        insurancePercent: {
            type: 'float',
            defaultsTo: 0.00
        },
        depositPercentage: {
            type: 'float',
            defaultsTo: 0.00
        },
        insuranceCharges: { type: 'float' },
        logisticsOption: { type: 'string' },
        logisticPayment: { type: 'float' },
        ETD: {
            type: "date"
        },

        ETA: {
            type: "date"
        },

        ATD: {
            type: "date"
        },

        ATA: {
            type: "date"
        },

        receivedDate: {
            type: 'date'
        },

        deliveryTime: {
            type: 'integer'
        },
        routeDetails: {
            type: "array"
        },

        logisticId: {
            model: 'lpartners'
        },

        vehicleId: {
            type: "string"
        },
        isCanceled: {
            type: 'boolean',
            defaultsTo: false
        },
        reasonCancellation: {
            type: "string"
        },
        rejectedAt: {
            type: 'date',
        },

        acceptedAt: {
            type: 'date',
        },

        withdrawalAt: {
            type: 'date',
        },

        processedBy: {
            model: 'users'
        },

        refundDate: {
            type: 'date',
        },

        tripId: {
            model: "LogisticTrip"
        },
        emailData: {
            type: 'json'
        },
        invoice: {
            model: "Invoice"
        },

        status: {
            type: 'string',
            enum: ['Placed', 'Processing', 'Seller_Rejected', 'Seller_Dispatched', 'Franch_Received', 'Delivered', 'Received', 'Completed', 'Failed', 'Cancelled', 'Return', 'Return_Rejected', 'Return_Accepted', 'Retrun_Seller_Received'],
            defaultsTo: "Placed",
            required: true
        },

        reasonSellerRejected: {
            type: "string"
        },

        dateSellerRejectedAccepted: {
            type: 'date',
        },

        reasonCancellation: {
            type: "string"
        },

        isCanceled: {
            type: 'boolean',
            defaultsTo: false
        },

        dateCancellation: {
            type: 'date',
        },

        reasonReturn: {
            type: "string"
        },

        dateReturnClaim: {
            type: 'date',
        },

        reasonReturnRejected: {
            type: "string"
        },

        dateReturnRejectAccept: {
            type: 'date',
        },

        dateReturnSellerReceived: {
            type: 'date',
        },

        invoice: {
            model: 'invoice'
        },

        franchiseePartPerQuantity: {
            type: 'float',
            defaultsTo: 0.00
        },

    }
};