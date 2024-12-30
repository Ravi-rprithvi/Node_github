/**
 * Equipment.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    autoCreatedAt: true,
    autoUpdatedAt: true,
    attributes: {

        name: {
            type: 'string',
            //unique: true,
            //required: 'Please enter the role name.'
        },

        isEditable: {
            type: 'boolean',
            defaultsTo: true
        },
        
        permission:{
            type:'json',
            defaultsTo:{}
        }
    }
};

