/**
 * Bids.js
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

        user: {
            model: 'users'
        },

        addedBy: {
            model: 'users'
        },

        crop: {
            model: 'crops'
        },

        input: {
            model: 'inputs'
        },

        buyerpayments: {
            collection: 'BidsPayment',
            via: 'bidId'
        },

        productType: {
            type: 'string',
            enum: ['crop', 'input'],
            defaultsTo: 'crop',
        },

        amount: {
            type: 'float',
            required: true
        },

        originalAmount: {
            type: 'float'
        },

        bidRate: {
            type: 'float',
        },

        totalAmount: {
            type: 'float',
            required: true
        },
        originalTotalAmount: {
            type: 'float'
        },
        address: {
            type: 'string',
        },

        time: {
            type: 'date',
            required: true
        },

        reason: {
            type: 'string',
        },

        quantity: {
            type: 'float',
            defaultsTo: 0.00,
        },

        aggregatedCropQuantities: {
            type: 'json'
        },

        quantityUnit: {
            type: 'string'
        },

        askedReceivedQuantity: {
            type: 'float',
        },

        receivedQuantity: {
            type: 'float',
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

        receivedQuantityStatus: {
            type: 'string',
            enum: ['Approved', 'Unapproved', "FullReceive", "Pending"]
        },

        receivedQuantityUnapprovedReason: {
            type: 'string',
        },

        receivedQuantityApprovedReason: {
            type: 'string',
        },

        receivedQuantityApprovalTime: {
            type: 'date'
        },

        documents: {
            type: 'array'       //contains array of object with each object contains {type: "String", path: "document path/name"}
        },

        deliveredAt: {
            type: 'date',
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
        logisticType: {
            type: 'string'
        },
        logisticPayment: {
            type: 'float',
            defaultsTo: 0.00
        },
        insurancePayment: {
            type: 'float',
            defaultsTo: 0.00
        },
        facilitationPercent: {
            type: 'float',
            defaultsTo: 0.00
        },
        facilitationCharges: {
            type: 'float',
            defaultsTo: 0.00
        },
        originalFacilitationCharges: {
            type: 'float'
        },
        taxPercent: {
            type: 'float',
            defaultsTo: 0.00
        },
        taxAmount: {
            type: 'float',
            defaultsTo: 0.00
        },
        originalTaxAmount: {
            type: 'float'
        },
        status: {
            type: 'string',
            enum: ['Withdrawal', 'Refund', 'Failed', 'Pending', 'Rejected', 'Accepted', 'Dispatched', 'Delivered', 'Received'],
            required: true
        },
        logisticsOption: {
            type: 'string',
            enum: ['self', 'efarmx']
        },
        popId: {
            model: 'proofofproduct'
        },
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
        logisticId: {
            model: 'lpartners'
        },
        vehicleId: {
            type: "string"
        },
        tripId: {
            model: "LogisticTrip"
        },
        invoice: {
            model: "Invoice"
        },

        packaging: {
            model: "Packaging"
        },

        packagingSize: {
            type: 'string'
        },

        packagingSelectedBy: {
            model: 'users'
        },
        loadedVechicleImage: {
            type: 'string'
        },
        weightSlipImage: {
            type: 'string'
        },
        dispatchQuantity: {
            type: 'float',
            defaultsTo: 0.00,
        },

    }
};

