/**
 * FieldTransactions.js
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

        transactionType: {
            type: 'string',
            enum: ['EfarmExchange', 'Farmx'],
            defaultsTo: 'Farmx'
        },

        frfo: {
            model: 'users'
        },

        frtsm: {
            model: 'users'
        },

        transactionleader: {
            model: 'users'
        },

        cpfo: {
            model: 'users'
        },

        cptsm: {
            model: 'users'
        },

        cpfirmname: {
            type: 'string',
        },

        cpothername: {
            type: 'string',
        },

        cpfinancepersonname: {
            type: 'string',
        },

        cpfinancepersoncontactnumber: {
            type: 'string',
        },

        buyerAadharNumber: {
            type: 'string',
        },

        buyerPanNumber: {
            type: 'string',
        },

        // category: {
        //     model: 'Category',
        //     required:true
        // },

        // product: {
        //     type: 'string',
        //     required:true
        // },

        // variety: {
        //     type: 'string'
        // },

        products: {
            type: 'array',     // array of objects with keys: [category(id),variety(optional),product,askedQuantity,quantityUnit,buyerRate,buyerTax,buyerAmount,dispatchQuantity,rate,amount,originalamount,taxAmount,originalTaxAmount,taxPercent,receivedQuantity,rejectedQuantity,acceptedQuantity,transitionlossquantity,rejectionreason]
            required: true
        },

        buyer: {
            model: 'users'
        },

        buyerName: {
            type: 'string'
        },

        buyerMobile: {
            type: 'integer',
            maxLength: 10,
            required: true
        },

        buyerAddress: {
            type: 'string'
        },

        buyerDistrict: {
            type: 'string'
        },

        buyerState: {
            type: 'string'
        },

        buyerPincode: {
            type: 'integer'
        },

        deliveryAddress: {
            type: 'string'
        },

        deliveryPincode: {
            type: 'integer'
        },

        creditDays: {
            type: 'integer'
        },

        sellerCreditDays: {
            type: 'integer'
        },

        productRequirementDate: {
            type: "date"
        },

        // askedQuantity: {
        //     type: 'float',
        //     required: true
        // },

        // quantityUnit: {
        //     type: 'string',
        // },

        // buyerRate: {
        //     type: 'float'
        // },

        // buyerTax: {
        //     type: 'float',
        // },

        // buyerAmount: {
        //     type: 'float'
        // },

        buyerTotalAmount: {
            type: 'float'
        },

        approvedBy: {
            model: 'users'
        },

        approvedOn: {
            type: "date"
        },

        seller: {
            model: 'users'
        },

        sellerName: {
            type: 'string'
        },

        sellerMobile: {
            type: 'integer',
            maxLength: 10,
        },

        sellerAddress: {
            type: 'string'
        },

        sellerPincode: {
            type: 'integer'
        },

        sellerState: {
            type: 'string'
        },

        sellerDistrict: {
            type: 'string'
        },

        sellerBeneficiaryName: {
            type: 'string'
        },

        sellerAccountImage: {
            type: 'string'
        },

        sellerAadharNumber: {
            type: 'string',
        },

        sellerPanNumber: {
            type: 'string',
        },

        franchisee: {
            model: 'users'
        },

        franchiseeName: {
            type: 'string'
        },

        franchiseeMobile: {
            type: 'integer',
            maxLength: 10,
        },

        franchiseeAddress: {
            type: 'string'
        },

        franchiseePincode: {
            type: 'integer'
        },

        noFranchiseeReason: {
            type: 'string'
        },

        noFranchiseeReasonProofImage: {
            type: 'string'
        },

        expectedLoadingDate: {
            type: 'datetime',
        },

        farmerAdvanceRequired: {
            type: 'float',
        },

        loadingDate: {
            type: 'datetime',
        },

        // dispatchQuantity: {
        //     type: 'float',
        // },

        transporterName: {
            type: 'string',
        },

        vehicleNumber: {
            type: 'string',
        },

        vehicleImage: {
            type: 'string',
        },

        loadingWeightImage: {
            type: 'string',
        },

        deliveryChallanImage: {
            type: 'string',
        },

        // rate: {
        //     type: 'float',
        // },

        // amount: {
        //     type: 'float',
        // },

        // originalamount: {
        //     type: 'float',
        // },

        loadingCharges: {
            type: 'float',
        },

        unloadingCharges: {
            type: 'float',
        },

        transportationCharges: {
            type: 'float',
        },

        logisticCharges: {
            type: 'float',
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

        franchiseeSuggestedLoagisticWeight: {
            type: 'string',
        },

        franchiseeSuggestedLoadingCharges: {
            type: 'float',
        },

        franchiseeSuggestedUnloadingCharges: {
            type: 'float',
        },

        franchiseeSuggestedTransportationCharges: {
            type: 'float',
        },

        franchiseeSuggestedLogisticCharges: {
            type: 'float',
        },

        franchiseeSuggestedTransporterName: {
            type: 'string',
        },

        franshiseeSuggestedLogisticsBy: {
            model: 'users'
        },

        franshiseeSuggestedLogisticsOn: {
            type: "date"
        },

        farmxSuggestedLoadingCharges: {
            type: 'float',
        },

        farmxSuggestedUnloadingCharges: {
            type: 'float',
        },

        farmxSuggestedTransportationCharges: {
            type: 'float',
        },

        farmxSuggestedLogisticCharges: {
            type: 'float',
        },

        farmxSuggestedTransporterName: {
            type: 'string',
        },

        farmxSuggestedLogisticsBy: {
            model: 'users'
        },

        farmxSuggestedLogisticsOn: {
            type: "date"
        },

        farmxFinalisedTransportation: {
            type: 'string',
            enum: ['Franchisee', 'Farmx', 'Buyer'],
            defaultsTo: 'Franchisee'
        },

        farmxLogisticsAdvanceRequired: {
            type: 'float',
            defaultsTo: 0.0
        },

        farmxTransportationNote: {
            type: 'string',
        },

        logisticMargin: {
            type: 'float',
        },

        logisticMarginPercentage: {
            type: 'float',
        },

        marginOnBasisOfWeight: {
            type: 'float',
        },

        marginPercentOnBasisOfWeight: {
            type: 'float',
        },

        marginGeneral: {
            type: 'float',
        },

        marginPercentGeneral: {
            type: 'float',
        },

        totalMargin: {
            type: 'float',
        },

        totalMarginPercentage: {
            type: 'float',
        },

        totalMarginIncludingSubTransactions: {
            type: 'float',
        },

        totalMarginPercentageIncludingSubTransactions: {
            type: 'float',
        },

        // taxAmount: {
        //     type: 'float',
        // },

        // originalTaxAmount: {
        //     type: 'float',
        // },

        // taxPercent: {
        //     type: 'float',
        // },

        totalAmount: {
            type: 'float',
        },

        originalTotalAmount: {
            type: 'float',
        },

        sellerRate: {
            type: 'float',
        },

        // sellerTaxPercentage: {
        //     type: 'float',
        // },

        // sellerTaxAmount: {
        //     type: 'float',
        // },

        // sellerConsideredQuantity: {
        //     type: 'float',
        // },

        sellerTotalAmount: {
            type: 'float',
        },

        sellerPaymentNote: {
            type: 'string',
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

        unloadingDate: {
            type: 'datetime'
        },

        receivingAddedDateTime: {
            type: 'datetime'
        },

        // receivedQuantity: {
        //     type: 'float'
        // },

        // rejectedQuantity: {
        //     type: 'float'
        // },

        // acceptedQuantity: {
        //     type: 'float'
        // },

        receivingWeightImage: {
            type: 'string',
        },

        // transitionlossquantity: {
        //     type: 'float'
        // },

        // rejectionreason: {
        //     type: 'string'
        // },

        grncopyimage: {
            type: 'string'
        },

        status: {
            type: 'string',
            enum: ['Pending', 'Approved', 'Dispatched', 'Received', 'Completed', 'Cancelled'],
            required: true
        },

        isBuyerPaymentDone: {
            type: 'boolean',
            defaultsTo: false,
            required: true
        },

        isSellerPaymentDone: {
            type: 'boolean',
            defaultsTo: false,
            required: true
        },

        isLogisticPaymentDone: {
            type: 'boolean',
            defaultsTo: false,
            required: true
        },

        isQuantityReconcieled: {
            type: 'boolean',
            defaultsTo: false,
            required: true
        },

        isDeleted: {
            type: 'boolean',
            defaultsTo: false,
            required: true
        },

        deletedBy: {
            model: 'users'
        },

        deletedOn: {
            type: "date"
        },

        pendingQuantityToReconciel: {
            type: 'float',
        },

        buyerpayments: {
            // collection: 'BidsPayment',
            // via: 'bidId'
            type: 'array'
        },

        sellerpayments: {
            type: 'array'
        },

        logisticpayments: {
            type: 'array'
        },

        productType: {
            type: 'string',
            enum: ['crops', 'input'],
            defaultsTo: 'crops',
        },

        parentTransaction: {
            model: 'FieldTransactions'
        },

        childTransactions: {
            collection: 'FieldTransactions',
            via: 'parentTransaction'
        },

        cancelledBy: {
            model: 'users'
        },

        cancelledOn: {
            type: "date"
        },

        cancelReason: {
            type: 'string'
        },

        manualCompletionReason: {
            type: 'string'
        },


        manualCompletedOn: {
            type: "date"
        },

        manualCompletedBy: {
            model: 'users'
        },

        invoice: {
            model: "Invoice"
        },

        sellerPaymentModifiedBy: {
            model: 'users'
        },

        sellerPaymentModifiedOn: {
            type: "date"
        },
    }
};

/*
- add requirement
- approve requirement
- fulfillrequirement
- receive requirement
- add buyer payment
- add seller payment
- list transactions
- get transactions
- add child transaction
- change frfo
- change cpfo
- change frtsm
- change
*/

