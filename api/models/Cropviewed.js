/**
* Inputviewed.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
*/


module.exports = {
    autoCreatedAt: true,
    autoUpdatedAt: true,
    attributes: {

        cropId: {
            model: 'crops'
        },
        landId: {
            model: 'lands'
        },
        modelType: {
            type: 'string',
            enum: ['crop','land'],
            defaultsTo:'crop'
        },
        userId: {
            model: 'users'
        },
        ipAddress: {
            type: 'string'
        }
    }
};