/**
 * Manufacturer.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  autoCreatedAt: true,
  autoUpdatedAt: true,
  attributes: {
    companyName: {
      type: 'string',
      required: true
    },

    contactPerson: {
      type: 'string',
      required: true
    },

    email: {
      type: 'string',
      required: true
    },

    mobile: {
      type: 'integer',
      required: true,
      maxLength: 10
    },

    mobile1: {
      type: 'integer',
      maxLength: 10
    },

    mobile2: {
      type: 'integer',
      maxLength: 10
    },

    address: {
      type: 'string'
    },

    city: {
      type: 'string'
    },

    pincode: {
      type: 'integer',
      required: true
    },

    state: {
      type: 'string',
      required: true
    },

    district: {
      type: 'string',
      required: true
    },

    website: {
      type: 'string'
    },

    dealsIn: {
      type: 'array',
      required: true
    },

    speciality: {
      type: 'string'
    },

    description: {
      type: 'string'
    },

    approximateTurnover: {
      type: 'float'
    },

    approximateManufacturingQuantity: {
      type: 'float'
    },

    approximateManufacturingQuantityUnit: {
      type: 'string'
    },

    workingSince: {
      type: 'integer'
    },

    numberOfDealers: {
      type: 'integer'
    },

    numberOfDistributers: {
      type: 'integer'
    },

    productsRating: {
      type: 'float'
    },

    registeredDealers: {
      collection: 'Users',
      via: 'dealerManufacturer'
    }
  }
};