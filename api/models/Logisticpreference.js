/**
 * Logisticpreference.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    autoCreatedAt: true,
    autoUpdatedAt: true,
    attributes: {
        
        equipmentId: {
            model: 'equipment'
        },

        buyerId: {
            model: 'users'
        },

        address: {
            type: 'string',
        },

        logiticType: {
            type: 'string'
        }
    }
};