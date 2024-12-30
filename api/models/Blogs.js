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
  		
  		createdBy:{
	       model:'users'
	    },

  		title: {
            type: 'string',
            required: true
        },  

        description : {
            type:'text',
            required: true
        },
        category : {
            model:'category',
            
        },

        slug :{
            type:'string'  
        },

        image:{
            type:'string'
        },
        
        isDeleted: {
            type: 'boolean',
            defaultsTo:false
        }
        
  }
};

