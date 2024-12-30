/**
 * Category.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    autoCreatedAt: true,
    autoUpdatedAt: true,
    attributes: {
        // crops:{
        //     collection: 'crops',
        //     via: 'category'
        // },
  		
        name: {
            type: 'string'
        },
        
        // crops: {
        //   model: 'crops'
        // },
        
        parentId:{
            model: 'category'
        },
        
        type: {
          type: 'string',
        },

        hsn: {
          type: 'string',
        },
        
        variety:{
            type: 'array',
        },
        
        qualities: {
            type: 'array' //array of objects with keys name & name 
        },
        
        description: {},
        
        image: {
          type: 'string',
        },
        
        bannerImage: {
          type: 'string',
        },
        
        iconImage: {
          type: 'string',
        },
        
        status: {
            type: 'string',
            enum: ['active', 'deactive'],
            defaultsTo:'active'
        },
        
        isDeleted: {
            type: 'Boolean',
            defaultsTo: false
        },
        
        packaging:{
            type:'array',
            required:false
            //it stores type and sizes array of object
        },

        primaryColor:  {
           type: 'string'           
        },

        secondaryColor:  {
           type: 'string'           
        },

        tax:  {
           type: 'float'
        }
    }
};