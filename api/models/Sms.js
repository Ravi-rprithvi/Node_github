/**
 * Sms.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
	autoCreatedAt: true,
    autoUpdatedAt: true,
	  attributes: {
	  	to: {
	        type: 'integer',
	        required: true
	    },
	  	group_id:{
	  		model:'groups'
	  	},
	  	message:{
	  		type:'string',
	  		required:true
	  	}
	  }
};

