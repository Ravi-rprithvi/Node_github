/**
 * Wishlist.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    autoCreatedAt: true,
    autoUpdatedAt: true,
    attributes: {

        user_id: {
            model: 'users'
        },

        product_id: {
            type: 'string'
        },

        product_type: {
            type: 'string',
            enum: [ 'crops', 'inputs', 'lands'],
            required: true
        }
    }
};