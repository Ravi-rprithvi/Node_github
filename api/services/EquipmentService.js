/**
  * #DESC:  In this class/files crops related functions
  * #Request param: Crops add form data values
  * #Return : Boolen and sucess message
  * #Author: Rohitk.kumar
  */

var Promise = require('bluebird'),
    promisify = Promise.promisify;
var constantObj = sails.config.constants;
var smtpTransport = require('nodemailer-smtp-transport');
var nodemailer = require('nodemailer');
var pushService = require('./PushService');

//var commonService = require()

var approveEquipment = function(data){
    return Equipment.update({id: data.id},{isApproved:true}).then(function (equipment) {
        if(equipment){
            return {success:true,key:"EQUIPMENT_APPROVED",message:"Equipment Approved Successfully.",data:equipment}
        }
    }).fail(function(error){
        return {success:false,error:error}
    });
}

var sendmailtoseller = function(data,cb) {
    var query={};
    query.id = data.id;
    
    var verifyURL = '';
    let msg ='';

    if(!data.buyerId){
        verifyURL= constantObj.appUrls.FRONT_WEB_URL + "/#/external/equipmentpay/"+data.id+"/"+data.share+"/"+data.user;
        msg = constantObj.messages.HIGH_CAPEX_PAYMENT_MAIL + " " + data.share + " " + constantObj.messages.HIGH_CAPEX_PAYMENT_PART;
        mailfunction(msg,verifyURL,query,cb)
    } else{
        verifyURL= constantObj.appUrls.FRONT_WEB_URL + "/#/external/equipmentpay/"+data.id+"/"+data.amountPaidBySeller+"/"+data.user+"/"+data.buyerId;
        commonService.getUserDetail(data.buyerId, function(err,succ){
            if(err){
                return err;
            } else {
                if(succ.city == null){
                    constantObj.messages.FROM='';
                    succ.city = '';
                    succ.state = '';
                }
                msg = succ.fullName+" "+constantObj.messages.FROM+" "+succ.city+" "+succ.state+" "+constantObj.messages.INTERESTED_MAIL
                mailfunction(msg,verifyURL,query,cb)
            }
        });
    }
}

module.exports = {

    newequipment: function(data, context,req, res){
        if(data.availablePeriod){
            var availObj = data.availableFrom;
            var availableRange = parseInt(data.availablePeriod);      
            var dateChanged = new Date(availObj);

            if( data.availableUnit == "Days" ){
                dateChanged.setDate(dateChanged.getDate() + availableRange); 
            } else if( data.availableUnit == "Month" ){
                dateChanged.setMonth(dateChanged.getMonth() + availableRange); 
            } else if( data.availableUnit == "Year" ){
                dateChanged.setFullYear(dateChanged.getFullYear() + availableRange); 
            }

            data.endDate = dateChanged;
        } else {
            data.endDate = null;
        }
        if(!data.terms){
            data.terms = constantObj.terms_and_condition.text;
        }
        data.addedBy = context.identity.id;
        data.role = context.identity.roles;
        data.categoryId = data.category;

        commonService.getSettings(function(err, success){

            if(success){
                if(data.role == 'U'){
                    data.efarmxComission = parseFloat(success.efarmxComission);
                    data.taxRate = parseFloat(success.equipmentTaxRate);
                } else {
                    data.efarmxComission = data.efarmxComission;
                    data.taxRate = data.taxRate;
                    data.capex = data.capex
                    if(data.capex == 'low'){
                        data.isApproved == 'true'
                    }
                }
                let commissioncal = parseFloat(data.price) * (data.efarmxComission/100);
                let taxcal = parseFloat(data.price) * (data.taxRate/100);
    
                let totalPrice = parseFloat(data.price) + parseFloat(commissioncal) + parseFloat(taxcal);
                data.totalPrice = totalPrice;

                let code = commonService.getUniqueCode();
                data.code = code;


                Equipment.create(data).then(function (equipment) {
                    if(equipment){
                        if(equipment.capex == 'high'){
                            equipment.amountPaidBySeller = parseFloat(commissioncal) + parseFloat(taxcal);
                            equipment.amountPaidBySeller = Number((equipment.amountPaidBySeller).toFixed(2));

                            commonService.getUserDetail(equipment.user, function(err,succ){
                                
                                if(succ){
                                    equipment.username = succ.username;
                                    equipment.mobile = succ.mobile;

                                    EquipmentService.sendmailtoseller(equipment,function(error,success){
                                        if(success){
                                            return res.jsonx({
                                                success: true,
                                                code: 200,
                                                message: constantObj.equipment.ADDED_EQUIPMENT,
                                                key: 'ADDED_EQUIPMENT',
                                                data: equipment,
                                            });
                                        } else {
                                            return res.jsonx({
                                                success: false,
                                                error: {
                                                    code: 404,
                                                    message : "Error in sending mail",
                                                }
                                            });
                                        }
                                    })
                                }
                            });
                            // save notification to table and send message to mobile number is left now.
                        } else {
                            return res.jsonx({
                                success: true,
                                code: 200,
                                message: constantObj.equipment.ADDED_EQUIPMENT,
                                key: 'ADDED_EQUIPMENT',
                                data: equipment,
                            });
                        }
                    }
                }).fail(function(error){
                    return res.jsonx({
                        success: false,
                        error: {
                            code: 404,
                            message: constantObj.messages.NOT_FOUND,
                            key: 'NOT_FOUND1',
                            error:error
                        },
                    });
                });
            }
        })
    },

    update: function (data, context,req, res) {

        if(data.availablePeriod){
            var availObj = data.availableFrom;
            var availableRange = parseInt(data.availablePeriod);      
            var dateChanged = new Date(availObj);

            if( data.availableUnit == "Days" ){
                dateChanged.setDate(dateChanged.getDate() + availableRange); 
            } else if( data.availableUnit == "Month" ){
                dateChanged.setMonth(dateChanged.getMonth() + availableRange); 
            } else if( data.availableUnit == "Year" ){
                dateChanged.setFullYear(dateChanged.getFullYear() + availableRange); 
            }

            data.endDate = dateChanged;
        }else{
            data.endDate = null;
        }
        
        data.updatedBy = context.identity.id;

        
        let commissioncal = parseFloat(data.price) * (data.efarmxComission/100);
        let taxcal = parseFloat(data.price) * (data.taxRate/100);

        let totalPrice = parseFloat(data.price) + parseFloat(commissioncal) + parseFloat(taxcal);
        data.totalPrice = totalPrice;
        
        return Equipment.update({id: data.id},data).then(function (equipment) {
            var result;
            if(equipment){
                let Id = equipment[0].user;
                Equipment.findOne({user:Id}).populate('user').then(function(data)
                        {
                            let role = data.user.roles;  
                            if(role == 'SA' || role == 'A' && equipment[0].capex == 'high')
                            {
                                sendmailtoseller(data,function(error,success){
                                if(!error){
                                    return res.jsonx({
                                        success: true,
                                        message: constantObj.equipment.UPDATED_EQUIPMENT,
                                         key: 'UPDATED_EQUIPMENT',
                                        data: {
                                            success: success
                                        }
                                    });
                                } else {
                                    return res.jsonx({
                                        success: false,
                                        error: error
                                    });
                                }
                                })
                            }
                            else 
                            {
                                return res.jsonx({
                                    success: true,
                                    code: 200,
                                    message: constantObj.equipment.UPDATED_EQUIPMENT,
                                    key: 'UPDATED_EQUIPMENT',
                                    data: equipment,
                                });
                            }
                            

                        })
               /* result = {
                    success: true,
                    code: 200,
                    message: constantObj.equipment.UPDATED_EQUIPMENT,
                    key: 'UPDATED_EQUIPMENT',
                    data: equipment,
                };*/
            }else{
                result = {
                    success: false,
                    error: {
                    code: 404,
                        message: constantObj.messages.NOT_FOUND,
                    key: 'NOT_FOUND',
                    },
                };
            }
            return result;

        }).fail(function(error){
            return  {
                success: false,
                error: {
                    code: 404,
                    message: "constantObj.messages.NOT_FOUND",
                    key: 'NOT_FOUND',
                },
            };
        });
    },

    approve: function(data, context, req, res){
        Equipment.findOne({id:data.id}).then(function(response){
            if(response.capex=="high"){
                sendmailtoseller(response,function(error,success){
                    if(error){
                        return res.jsonx({
                            success: false,
                            error: error
                        })
                    } else if(success){
                            return res.jsonx({
                                success: true,
                                data: success
                            })
                    } else {
                        return res.jsonx({
                            success: false,
                            error: "some error occured"
                        })
                    }
                });

            } else {
                Equipment.update({id: data.id},{isApproved:true}).exec(function(err,approveresponse){ 
                    if(approveresponse) {
                        let query ={};
                        query.user = response.user;
                        query.device_type != "Web";
                        
                        Userslogin.find(query).exec(function(deviceerr,userdevices){ 
                            if(userdevices){

                                var msg = "Equipment " + response.name + " has been approved by admin and can visible to the site now";
                                let notificationData = {}
                                notificationData.productId = data.id;
                                notificationData.equipment = data.id;
                                notificationData.sellerId = response.user;
                                notificationData.productType = "equipment";
                                notificationData.message = msg;
                                notificationData.readBy = [];

                                smsData ={};
                                smsData.mobile = response.mobile;
                                smsData.message = msg;

                                Notifications.create(notificationData).then(function(notificationResponse){
                                    if(notificationResponse){
                                        commonService.sendSaveNotification(data,function(err,response){})
                                        commonService.sendSMS(smsData,function(err,response){})
                                        sails.sockets.blast('Notification',notificationResponse);
                                        return res.jsonx({
                                            success: true,
                                            message: msg,
                                            data: approveresponse
                                        }) 
                                    }
                                })
                            } else {
                                return res.jsonx({
                                    success: false,
                                    message: 'Error in userlist for approve equipment'
                                })
                            }
                        })
                    } else {
                        return res.jsonx({
                            success: false,
                            message: 'Unable to get equipment'
                        })
                    }
                });                     
            }
        }).fail(function(error){
            return res.jsonx({
                success: false, 
                error: error
            })
        })
        
    },

    verify: function(data, context, req, res){

        Equipment.update({id:data.id},{isVerified:true}).then(function(equipment){
            if(equipment){
                return res.jsonx({
                    success: true,
                    message: "Equipment Verified Successfully.",
                    key: "EQUIPMENT_VERIFIED",
                    data: equipment
                })
            } else {
                return res.jsonx({
                    success: false
                })
            }
        }).fail(function(error){
            return res.jsonx({
                success: true,
                error: error
            })
        })
    },

    makeExpire: function (data, context) {
        let fieldOfficerContact = context.identity.mobile;
        let closedBy = context.identity.id;

        return Equipment.update({id:data.id},{isExpired:true,closedBy:closedBy}).then(function (equipment) {

            return Users.findOne({id:equipment.user}).then(function(userinfo){
                let msg = 'Equipment '+ equiment[0].name + 'has been expired. Please contact with Transaction Owner to activate.'; 
                //let msg = "hello";
                let smsData ={};
                smsData.mobile = userinfo.mobile;
                smsData.message = msg;

                let data={};
                data.user = equipment[0].user;
                data.message = msg;

                //commonService.sendSaveNotification(data,function(err,response){})
                //commonService.sendSMS(smsData,function(err,response){})

                return {
                    success: true,
                    code: 200,
                    data: {
                        message: constantObj.crops.EXPIRED_CROP
                    }
                };   
            }) 
        }).fail(function(err){
            return {
                success: false,
                error: {
                    code: 404,
                    message: err,
                    key: 'NOT_FOUND',
                }
            };
        });     
    },

    sendmailtoseller: function(data,cb) {
        var query={};
        query.id = data.id;
        
        var verifyURL = '';
        let msg ='';

        if(!data.buyerId){
            verifyURL= constantObj.appUrls.FRONT_WEB_URL + "/#/payments/equipmentCapex/"+data.id+"/"+data.amountPaidBySeller+"/pending";
            msg = constantObj.messages.HIGH_CAPEX_PAYMENT_MAIL + " " + data.amountPaidBySeller + " " + constantObj.messages.HIGH_CAPEX_PAYMENT_PART;
            mailfunction(msg,verifyURL,query,cb)
        } else{
            verifyURL= constantObj.appUrls.FRONT_WEB_URL + "/#/payments/equipmentCapex/"+data.id+"/"+data.amountPaidBySeller+"/pending/"+data.buyerId;
            commonService.getUserDetail(data.buyerId, function(err,succ){
                if(err){
                    return err;
                } else {
                    if(succ.city == null){
                        constantObj.messages.FROM='';
                        succ.city = '';
                        succ.state = '';
                    }
                    msg = succ.fullName+" "+constantObj.messages.FROM+" "+succ.city+" "+succ.state+" "+constantObj.messages.INTERESTED_MAIL
                    mailfunction(msg,verifyURL,query,cb)
                }
            });
        }
    }


}; // End Equipment service class
function mailfunction(msg,verifyURL,query,cb){

    Equipment.findOne(query).populate('category').populate('user').exec(function(err, equipment) {
        if (err) {
            return  cb;
        } else {
            let email = '';

            if(!equipment.user.email){
                email = equipment.user.username;
            } else {
                email = equipment.user.email;
            }
            
            var transport = nodemailer.createTransport(smtpTransport({
                host: sails.config.appSMTP.host,
                port: sails.config.appSMTP.port,
                debug: sails.config.appSMTP.debug,
                auth: {
                        user: sails.config.appSMTP.auth.user, //access using /congig/appSMTP.js
                        pass: sails.config.appSMTP.auth.pass
                    }
            }));
            //var verifyURL= sails.getBaseUrl() + "/common/payment/" + data.id + "?amt=" + data.share + "&sell=" + data.user;
            
            message = 'Hello ' + equipment.user.fullName;
            message += '<br/><br/>';
            message +=  msg
            message += '<br/><br/>';
            message += '<a href="'+verifyURL+'" target="_blank" >Pay your amount.</a>';
            message += '<br/><br/><br/>';
            message += 'Thanks';
            message += '<br/>';
            message += 'eFarmX Team';
            
            transport.sendMail({
                from: sails.config.appSMTP.auth.user,
                to: email,
                subject: equipment.name + ' Payment Notification',
                html: message
            }, function (err, info) {
                if(err){
                    return  cb(constantObj.messages.SEND_MAIL_ISSUE)
                } else {
                    return cb(null,constantObj.messages.MAIL_SENT)
                }
                
            });

            //return  equipment
        }
   })
}
