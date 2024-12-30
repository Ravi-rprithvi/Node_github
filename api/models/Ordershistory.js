/**
 * Ordershistory.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
	autoCreatedAt: true,
    autoUpdatedAt: true,
	  attributes: {

	  	order: {
	        model: 'orders'
	    },
	  	suborder: {
	        model: 'orderedcarts'
	    },	    
	    crop:{
	    	model:'crops'
	    },
	    input:{
	    	model:'inputs'
	    },
	  	updatedBy:{
	  		model:'users'
	  	},
	  	rejectReason:{
	  		type:'string'
	  	},
	  	comment: {
	  		type: 'string'
	  	}

	  }
};

