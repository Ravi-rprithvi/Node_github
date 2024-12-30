/**
 * Equipment.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    autoCreatedAt: true,
    autoUpdatedAt: true,
    /*types: {
        decimal2: function(number){
          return ((number *100)%1 === 0);
        }
    },*/
    attributes: {

        code: {
            type: 'integer',
            unique: true
        },
        name: {
            type: 'string',
            required: true
        },
        type:{
        	type: 'string',
        	enum: ['rent', 'sell'],
            required:true
        },
        categoryId:{
            type:'string'
        },
        availableFrom:{
            type:'date'
        },
        
        availablePeriod:{
            type:'integer',
            defaultsTo: null
        },
        endDate:{
            type: 'date'
        },
        
        capex:{
            type: 'string',
            defaultsTo: null
        },

        price : {
            type: 'float',
            required: true
        },

        priceUnit : {
            type: 'string',
        },

        efarmxComission:{
            type: 'float'
        },
        taxRate:{
            type: 'float'
        },

        totalPrice:{
            type:'float'
        },

        paymentId: {
            model: 'payments'            
        },

        logisticPayment: {
            model: 'payments'            
        },

        paymentStatus: {
            type:'boolean',
            defaultsTo: false
        },

        availableUnit:{
            type:'string'
        },

        user:{
            model:'users'
        },

        address:{
            type:'string',
            required: true
        },

        city: {
            type: 'string',
            required: true
        },

        district: {
            type: 'string',
            required: true
        },

        state: {
            type: 'string',
            required: true
        },
       
        pincode: {
            type: 'integer',
            required: true
        },

        manufacturer:{
            model:'manufacturer'
        },

        category:{
            model:"Category",
        },

        variety: {
            type: 'string'
        },

        /*quantity:{
            type:'integer'
        }, */
        company:{
            type:'string'
        },

        model:{
            type:'string'
        },

        modelYear:{
            type:'integer'
        },

        images: {
            type: 'array'
        },
        
        description: {
            type: 'text'
        },

        terms:{
        	type:'text'
        },
                
        isApproved:{
            type:'boolean',
            defaultsTo: false
        },
        
        soldOut:{
            type:'boolean',
            defaultsTo: false
        },
        
        isVerified:{
            type:'boolean',
            defaultsTo: false
        },
        
        addedBy:{
            model:'users'
        },

        updatedBy:{
            model:'users'
        },

        deletedBy:{
            model:'users'
        },

        verificationCharges:{
             type:'integer',
        },
        
        receiptNumber:{
             type:'string',
        },
        
        isDeleted:{
            type:'boolean',
            defaultsTo: false
        },

        equipmentLogisticId:{
            model: 'equipmentlogistic'
        },

        logisticsPreference:{
          model: 'Logisticpreference'  
        },

        ddPayment: {
            model: 'payments'
        },

        orderId:{
            model: 'orders'  
        },
        closedBy:{
            model:'users'
        }
    }
};

