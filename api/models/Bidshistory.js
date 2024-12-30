/**
 * Bidshistory.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
	autoCreatedAt: true,
    autoUpdatedAt: true,
	  attributes: {

	  	bid: {
	        model: 'bids'
	    },

	    crop:{
	    	model:'crops'
	    },

	    input: {
            model:'inputs'
        },

        productType:{
            type: 'string',
            enum: [ 'crop', 'input' ],
            defaultsTo: 'crop',
        },
	  	
	  	bidBy:{
	  		model:'users'
	  	},
	  	
	  	amount:{
	  		type:'float'
	  	},

        quantity: {
             type: 'float',
             defaultsTo: 0.00,
        },

        quantityUnit:{
            type: 'string'
        },

	  	bidStatus:{
	  		type:'string'
	  	},

	  	bidRejectReason:{
	  		type:'string'
	  	},

	  	comment: {
	  		type: 'string'
	  	}

	  }
};

