/**
 * Lands.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  autoCreatedAt: true,
  autoUpdatedAt: true,
  attributes: {
    title: {
      type: 'string',
      required: true
    },
    user: {
      model: 'users'
    },
    khasraNo: {
      type: 'string'
    },
    code: {
      type: 'string',
      unique: true
    },
    area: {
      type: 'float',
      required: true,
      defaultsTo: 0
    },

    areaUnit: {
      type: 'string',
      required: true,
      defaultsTo: 'acre'
    },
    landLeased: {
      type: 'float',
      defaultsTo: 0.00,
      required: true
    },
    landSold: {
      type: 'float',
      defaultsTo: 0.00,
      required: true
    },
    availableArea: {
      type: 'float',
      required: true
    },
    soilType: {
      model: 'Category',
      //required: true
    },
    soilVariety: {
      type: 'string',
    },
    noOfOwners: {
      type: 'integer',
      defaultsTo: 1,
    },
    sourceOfIrrigation: {
      type: 'string'
    },
    tubewell: {
      type: 'integer'
    },
    forLease: {
      type: 'boolean',
      defaultsTo: false
    },
    forSell: {
      type: 'boolean',
      defaultsTo: false
    },
    leasePrice: {
      type: 'float',
      defaultsTo: 0.00,
    },
    leasePriceDisplay: {
      type: 'string',
    },
    leaseLandingPrice: {
      type: 'float',
      defaultsTo: 0.00,
    },
    leaseLandingPriceDisplay: {
      type: 'string',
    },
    sellPrice: {
      type: 'float',
      defaultsTo: 0.00,
    },
    sellPriceDisplay: {
      type: 'string',
    },
    sellLandingPrice: {
      type: 'float',
      defaultsTo: 0.00,
    },
    sellLandingPriceDisplay: {
      type: 'string',
    },
    leasePriceUnit: {
      type: 'string',
      enum: ['Month', 'Year'],
    },
    availableFrom: {
      type: 'date'
    },
    availableTill: {
      type: 'date'
    },
    suitableCrops: {
      type: 'array'
    },
    description: {
      type: 'text'
    },
    content: {
      type: 'json'
      // json is the combination of language code and content
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
    address: {
      type: 'string',
      required: true
    },
    pincode: {
      type: 'integer',
      required: true
    },
    market: {
      model: 'market'
    },

    images: {
      type: 'array',
    },
    videos: {
      type: 'array',
    },
    documentFromLocker: {
      type: 'boolean',
      defaultsTo: false
    },
    documents: {
      type: 'array',//array of object key contain type and doc.
    },
    earnestAmount: {
      type: 'float',
      defaultsTo: 0.00,
    },
    buyerDepositPayment: {
      type: 'array'
    },
    sellerUpfrontPercentage: {
      type: 'float',
      defaultsTo: 10.00,
    },
    sellerUpfrontDays: {
      type: 'integer',
      defaultsTo: 0
    },
    sellerDepositPayment: {
      type: 'array'
    },
    sellerFinalDays: {
      type: 'integer',
      defaultsTo: 0
    },
    buyerTaxes: {
      type: 'array'
    },
    buyerTaxRate: {
      type: 'float',
      defaultsTo: 18.00,
    },
    sellerTaxes: {
      type: 'array'
    },
    sellerTaxRate: {
      type: 'float',
      defaultsTo: 18.00,
    },
    farmxComission: {
      type: 'float',
      defaultsTo: 0.00,
    },
    sellerFarmxComission: {
      type: 'float',
      defaultsTo: 0.00,
    },
    franchiseePercentage: {
      type: 'float',
      defaultsTo: 0.00,
    },
    buyerCancelDeductionPercentage: {
      type: 'float',
      defaultsTo: 0.00,
    },
    sellerCancelDeductionPercentage: {
      type: 'float',
      defaultsTo: 0.00,
    },
    rejectReason: {
      type: 'string',
    },
    rejectComment: {
      type: 'string',
    },
    disappovedReason: {
      type: 'array'
    },
    approvedBy: {
      model: 'users'
    },
    isVerified: {
      type: 'boolean',
      defaultsTo: false
    },
    verifyBy: {
      model: 'users'
    },
    isDeleted: {
      type: 'boolean',
      defaultsTo: false
    },
    deletedBy: {
      model: 'users'
    },
    deletedOn: {
      type: 'datetime'
    },
    buyerterms: {
      type: 'text'
    },
    sellerterms: {
      type: 'text'
    },
    buyerAgreement: {
      type: 'text'
    },
    leaseterms: {
      type: 'text'
    },
    sellterms: {
      type: 'text'
    },
    coordinates: {
      type: "json",
      index: "2dsphere",
      //loc: "array"
      //array of lat long
    },
    distanceInKm: {
      type: 'float'
    },
    distanceInM: {
      type: 'float'
    },
    geoFancingCoordinates: {
      type: "json",
      index: "2dsphere"
    },
    geoFancingImage: {
      type: "string",
    },
    isElectricity: {
      type: 'boolean',
      defaultsTo: false
    },
    fencing: {
      type: 'string',
      enum: ['No', 'Partial', 'Yes'],
    },
    howManyRoads: {
      type: 'integer',
    },
    isFeatured: {
      type: 'boolean',
      defaultsTo: false
    },
    coverImage: {
      type: 'string',
    },
    isExpired: {
      type: 'boolean',
      defaultsTo: false
    },
    viewed: {
      type: 'integer',
      defaultsTo: 0
    },
    approvalStatus: {
      type: 'string',
      enum: ['Approval_Pending', 'Franchisee_Approved', 'Franchisee_Reject', 'Admin_Approved', 'Admin_Disapproved'],
      defaultsTo: 'Approval_Pending',
      required: true
    },
    interestedCount: {
      type: 'integer',
      defaultsTo: 0,
      required: true
    },
    buyerQuestion: {
      type: 'array'
    },
    sellerQuestion: {
      type: 'array'
    },
    transactionOwner: {
      model: 'users'
    },
    maleRegistrationCharges: {
      type: 'string',
    },
    femaleRegistrationCharges: {
      type: 'string',
    },
    jointRegistrationCharges: {
      type: 'string',
    },
    maleJointRegistrationCharges: {
      type: 'string',
    },
    femaleJointRegistrationCharges: {
      type: 'string',
    },
    subscriptionId: {
      model: 'Subscriptions'
    },
    subscriptionInfo: {
      type: 'json'
    },

    subscriptionStartDate: {
      type: 'date',

    },
    subscriptionExpiredDate: {
      type: 'date',

    },
    bannerImage: {
      type: 'array'
    },
    noOfEdits: {
      type: 'integer',
      defaultsTo: 0,
      required: true
    }
  }
};