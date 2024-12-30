/**
 * Packaging.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    
    autoCreatedAt: true,
    autoUpdatedAt: true,

	attributes: {
        type: {
            type: 'string',
            required: true,
            unique: true
        },
        material: {
            type: 'string',
            required: true
        },
     
        description: {
            type: 'string',
            required: false
        },
        featurues: {
             type: 'string',
            required: false
        },
       sizes:{
        type:'array',
        required:false
       }
	}
};

