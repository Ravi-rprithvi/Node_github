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

  		name: {
            type: 'string',
            required: true,
            maxLength: 70
        },
        email: {
            type: 'email',
            unique: true,
            required: 'Please enter valid email id.'
        },     

        mobile: {
            type: 'integer',
            maxLength: 10,
            //required: true
        },

        company_entity: {
            type: 'string',
            enum: ['individual','company'],
            defaultsTo:'company'
        },
        company_name: {
            type: 'string',
            required: true,
            maxLength: 100
        },

        business_type: {
            type: 'string',
            enum: ['wholesale','distributer'],
            defaultsTo:'wholesale'
        },
      
        status: {
            type: 'string',
            enum: ['active', 'deactive'],
            defaultsTo:'active'
        },

        address: {
            type: 'string',
            required: true
        },

        address2: {
            type: 'string',
            required: true
        },

        pincode: {
            type: 'integer',
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
        
        createdBy:{
           model:'users'
        },
       
        isDeleted: {
            type: 'boolean',
            defaultsTo:false
        }
        
  }
};

