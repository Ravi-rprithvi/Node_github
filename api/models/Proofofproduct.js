/**
 * ProofOfProduct.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

 module.exports = {
 	autoCreatedAt:true,
 	autoUpdatedAt:true,
 	attributes: {
 		code: {
 			type: 'integer',
 			unique: true
 		},
 		cropId: {
 			model: 'crops'
 		},
 		bidId: {
 			model: 'bids'
 		},
 		images: {
 			type: 'array'
 		},
 		videos: {
 			type: 'array'
 		},
 		/*allApprovedByQC: {
 			type: 'boolean',
 			defaultsTo: false
 		},*/
 		allApprovedByBuyer: {
 			type: 'boolean',
 			defaultsTo: false
 		},
 		addedBy: {
 			model: 'users'
 		}
 	}
 }