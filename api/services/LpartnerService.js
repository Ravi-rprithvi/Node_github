var Promise = require('bluebird'),
    promisify = Promise.promisify;
var constantObj = sails.config.constants;

module.exports = {

    saveLpartner: function(data,context){

        if((!data.contactPerson) || typeof data.contactPerson == undefined){ 
            return {"success": false, "error": {"code": 404,"message": constantObj.lpartner.CONTACT_PERSON_REQUIRED} };
        }

        if((!data.mobile) || typeof data.mobile == undefined){ 
            return {"success": false, "error": {"code": 404,"message": constantObj.lpartner.LPARTNER_PHONE_REQUIRED} };
        }

        // if((!data.vehicles) || typeof data.vehicles == undefined){ 
        //     return {"success": false, "error": {"code": 404,"message": constantObj.lpartner.VEHICLE_REQUIRED} };
        // }

        if((!data.nationalPermit) || typeof data.nationalPermit == undefined){ 
            return {"success": false, "error": {"code": 404,"message": constantObj.lpartner.NATIONAL_PERMIT_REQUIRED} };
        }
      
        let query = {}

        // for (var i = 0; i < data.vehicles.length; i++) {
        //             var __id = require('mongodb').ObjectID ;
        //             if(data.vehicles[i]["_id"] == undefined) data.vehicles[i]["_id"] = new __id();
        //         }

        return Lpartners.create(data).then(function(lpart) {
            return {
                success: true,
                code:200,
                data: {
                    lpart:lpart,
                    message: constantObj.lpartner.LPARTNER_SAVED,
                    key: 'LPARTNER_SAVED'
                },
            };
        }).fail(function(err){
            return {
                success: false,
                error: {
                    code: 400,
                    message: constantObj.lpartner.LPARTNER_ISSUE,
                    key: 'LPARTNER_ISSUE'
                },
            };   
        });
    },

    update: function(data,context){

        let query = {};
        query.id = data.id;
        query.isDeleted = false;
        
        return Lpartners.findOne(query).then(function(cat) {
            
            if(cat){
                
                // for (var i = 0; i < data.vehicles.length; i++) {
                //     var __id = require('mongodb').ObjectID ;
                //     if(data.vehicles[i]["_id"] == undefined) data.vehicles[i]["_id"] = new __id();

                //     data.vehicles[i]["_id"] = String(data.vehicles[i]["_id"]);
                // }

                delete data.vehicles
                delete data.drivers

                return Lpartners.update(data.id,data).then(function(cats) {
                cats = cats[0];
                    return {
                        success: true,
                        code:200,
                        data: {
                            lpartner:cats,
                            message: constantObj.lpartner.UPDATED_LPARTNER,
                            key: 'UPDATED_LPARTNER'
                        },
                    };
                })
                .fail(function(err){
                    return {
                        success: false,
                        error: {
                            code: 400,
                            message: constantObj.lpartner.ISSUE_UPDATE_LPARTNER,
                            key: 'ISSUE_UPDATE_LPARTNER'
                        },
                    };   
                });

                
            } else {

                return {
                    success: false,
                    error: {
                        code: 400,
                        message: constantObj.lpartner.ISSUE_UPDATE_LPARTNER,
                            key: 'ISSUE_UPDATE_LPARTNER2'
                    },
                };
                
            }
        }).fail(function(err){ 
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: err
                    },
                };   
        });
    },

    allLogisticPartnerList: function(data, context) {
        return Lpartners.find({isDeleted:false}).populate('vehicles').populate('drivers').then(function(lpartners) {
            return {
                success: true,
                code:200,
                data: lpartners
            };
        }).fail(function(err) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: err
                },
            };
        })
    }
}; // End Logistic Partner service class