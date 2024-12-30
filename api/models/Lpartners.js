/**
 * Lpartners.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    autoCreatedAt: true,
    autoUpdatedAt: true,
    
    attributes: {
  		
  		companyName:{
            type: 'string'
	    },

  		contactPerson: {
            type: 'string',
            required: true
        }, 

        mobile: {
            type: 'integer',
            required: true
        },
        mobile1: {
            type: 'integer'
        },

        mobile2: {
            type: 'integer'
        },

        address: {
            type: 'string',
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
        email: {
            type: 'email',
        },
        
        website: {
            type: 'string'
        },

        numberOfVehicles: {
            type: 'integer',
            required: true
        },

        vehicles: {
          collection: 'Vehicles',
          via: 'lPartner'
        },

        drivers: {
          collection: 'Drivers',
          via: 'lPartner'
        },

        nationalPermit: {
            type: 'string',
            enum: ['Yes', 'No'],
            defaultsTo:'Yes',
            required: true
        },

        speciality : {
            type: 'string'   
        },        

        images: {
            type: 'array'
        },
        
        isDeleted: {
            type: 'boolean',
            defaultsTo:false
        }
    }

};