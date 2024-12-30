/**
 * LabourRequest.js
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

        firstName:{
           type:'string'
        },
        lastName:{
           type:'string'
        },
        email:{
           type:'string'
        },
        mobile:{
           type:'string'
        },
        address:{
           type:'string'
        },
        city:{
           type:'string'
        },
        state:{
           type:'string'
        },
        district:{
           type:'string'
        },
        cropName:{
           type:'string'
        },
        category:{
           type:'string'
        },
        areaoffarm:{
           type:'string'
        },
        description:{
           type:'string'
        },
        typeofwork:{
           type:'string'
        },
        availableFrom:{
           type:'date'
        },
        availableTo:{
           type:'date'
        },
        isDeleted: {
            type:'boolean',
            defaultsTo:false
        },
        nooflabours:{
          type:'integer'
        }
    }
};

