var Promise = require('bluebird'),
    promisify = Promise.promisify;
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var bcrypt = require('bcrypt-nodejs');
var commonServiceObj = require('./commonService');
var constantObj = sails.config.constants;



// Create authenticated  Twilio API clients
const twilioClient = require('twilio')(constantObj.twillio.accountSid,
    constantObj.twillio.authToken);

var transport = nodemailer.createTransport(smtpTransport({
    host: sails.config.appSMTP.host,
    port: sails.config.appSMTP.port,
    debug: sails.config.appSMTP.debug,
    auth: {
        user: sails.config.appSMTP.auth.user, //access using /congig/appSMTP.js
        pass: sails.config.appSMTP.auth.pass
    }
}));





var emailGeneratedCode = function (options) { //email generated code 
    //url = options.verifyURL,
    var email = options.username,
        password = options.password;

    message = 'Hello ';
    message += options.firstName;
    message += ",";
    message += '<br/><br/>';
    message += 'Your account has been created. Please login with the following credentials.';
    message += '<br/><br/>';
    message += 'Email Id : ' + email;
    message += '<br/>';
    message += 'Password : ' + password;
    message += '<br/><br/>';
    message += 'Regards';
    message += '<br/>';
    message += 'FarmX Support Team';

    transport.sendMail({
        from: sails.config.appSMTP.auth.user,
        to: email,
        subject: 'FarmX Registration',
        html: message
    }, function (err, info) {
        console.log("errro is ", err, info);
    });

    return { success: true, code: 200, data: { message: constantObj.messages.ADDED_SUCCESSFULL, /* data: url */ } };
};

emailVerifyLink = function (options) { //email generated code 
    var url = options.verifyURL,
        email = options.username;

    message = 'Hello ';
    message += options.firstName;
    message += ",";
    message += '<br/><br/>';
    message += 'Thanks for sign up on FarmX. Your account has been registered successfully. Please click on below link to verify your account.';
    message += '<br/><br/>';
    message += '<a href="' + options.verifyURL + '" target="_blankh" >Click and Verify</a>';
    message += '<br/><br/>';

    if (options.otp) {
        message += 'To verify your phone number, OTP is '
        message += '<div style="letter-spacing:7px;font-weight:600;font-size:21px;">'
        message += options.otp
        message += '</div>'

        message += '<br/><br/>';
    }
    message += 'Regards,';
    message += '<br/>';
    message += 'FarmX Support Team';

    transport.sendMail({
        from: sails.config.appSMTP.auth.user,
        to: email,
        subject: 'FarmX Registration',
        html: message
    }, function (err, info) {
        console.log("errro is ", err, info);
    });

    return true;
};
generatePassword = function () { // action are perform to generate random password for user 
    var length = 8,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-=+;:,.?",
        retVal = "";

    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
};
saveUser = function (data) {

    data["fullName"] = data.firstName + ' ' + '';

    if (data.lastName) {
        data["fullName"] = data.firstName + ' ' + data.lastName;
    }
    if (data.username) {
        data["email"] = data.username
    }

    delete data['client_id'];
    code = commonServiceObj.getUniqueCode();
    data.code = code;

    if (data.mobile && data.appversion) {
        var OTP = Math.floor(1000 + Math.random() * 9000);
        data['otp'] = OTP;
        data['otpTime'] = new Date()

        let smsInfo = {}
        smsInfo.otp = String(OTP)
        smsInfo.numbers = [data.mobile]

        commonServiceObj.sendNumberVerificationSMS(smsInfo)
    }

    delete data['appversion']
    return API.Model(Users).create(data).then(function (user) {
        return user;
    });
};

socialUserAccess = function (client_id, user) {

    if (client_id) {
        return Tokens.generateToken({
            client_id: client_id,
            user_id: user.id
        }).then(function (token) {
            user.access_token = token.access_token;
            user.refresh_token = token.refresh_token;
            return {
                success: true,
                code: 200,
                message: constantObj.messages.SOCIAL_USER_LOGGED_IN,
                data: user,
                key: 'SOCIAL_USER_LOGGED_IN',
            };
        });

    } else {
        return { success: true, code: 401, message: "Client Id is missing" };
    }



}

module.exports = {
    emailGeneratedCode: emailGeneratedCode,


    testotp: function (data, context) {

        var OTP = 12345;
        var message = "This is your OTP password : " + OTP + "You can sign in with verified OTP. Regards, FarmX";

        console.log("twilioClient result ",
            twilioClient.messages.create({
                to: data.number,
                from: constantObj.twillio.outboundPhoneNumber,
                body: message,
            })
        );

    },

    currentUser: function (data, context) {
        return context.identity;
    },

    verifyOTPForRegistration: function (data, context) {
        let query = {};
        query.id = data.id;
        // query.mobile = data.mobile;

        return Users.findOne(query).populate('franchisee').then(function (user) {
            if (user) {
                if (user.isVerified == 'Y' && user.status == 'active' && user.isMobileVerified == true) {
                    return { "success": false, "error": { "code": 301, "message": "Your mobile number already verified. You can directly login." }, "data": { "id": user.id, "mobile": user.mobile, "fullName": user.fullName } };
                } else {
                    if (data.otp == user.otp) {
                        var today = new Date();
                        var Christmas = user.otpTime;
                        var diffMs = (today - Christmas); // milliseconds
                        var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes

                        if (diffMins > 30) {
                            return { "success": false, "error": { "code": 300, "message": "OTP is expired. Please request a new one or click resend." }, "data": { "id": user.id, "mobile": user.mobile, "fullName": user.fullName } };
                        } else {
                            return Users.update({ id: user.id }, { isVerified: 'Y', mobileVerifiedDate: new Date(), date_verified: new Date(), status: "active", isMobileVerified: true, otp: null, otpTime: null }).then(function (userInfoAry) {
                                if (userInfoAry && userInfoAry.length > 0) {
                                    let userInfo = userInfoAry[0]
                                    let inputData = {};

                                    if (userInfo.roles == 'FGM') {
                                        userInfo.franchisee = user.franchisee
                                    }

                                    inputData.user = userInfo.id;

                                    if (data.gcm_id) {
                                        inputData.device_token = data.gcm_id;
                                        inputData.fcm_token = data.gcm_id;
                                    }
                                    if (data.fcm_token) {
                                        inputData.fcm_token = data.fcm_token
                                    } else if (data.device_token) {
                                        inputData.fcm_token = data.device_token;
                                    }

                                    if (data.device_token) {
                                        inputData.device_token = data.device_token;
                                    }

                                    if (data.device_type == '' || data.device_type == undefined) {
                                        inputData.device_type = "WEB";
                                    } else {
                                        inputData.device_type = data.device_type;
                                    }

                                    return Tokens.generateToken({
                                        client_id: data.client_id,
                                        user_id: userInfo.id
                                    }).then(function (token) {
                                        userInfo.access_token = token.access_token;
                                        userInfo.refresh_token = token.refresh_token;

                                        inputData.access_token = token.access_token;

                                        let fieldsProfile = ['firstName', 'lastName', 'username', 'mobile', 'address', 'residentialAddress', 'city', 'residentialCity', 'pincode', 'residentialPincode', 'state', 'residentialState', 'district', 'residentialDistrict', 'image', 'about', 'password', 'isMobileVerified', 'isEmailVerified']

                                        if (userInfo.roles == 'FGM') {
                                            let franchiseeflds = ['kycDoc', 'pancard', 'bankName', 'bankAccountNumber', 'bankIFSCCode', 'firmName']
                                            fieldsProfile = fieldsProfile.concat(franchiseeflds)
                                        } else if (userInfo.roles == 'U') {
                                            let franchiseeflds = ['banks']
                                            fieldsProfile = fieldsProfile.concat(franchiseeflds)
                                        }

                                        let blankfields = []
                                        for (var i = 0; i < fieldsProfile.length; i++) {
                                            if (fieldsProfile[i] == 'banks') {
                                                if (userInfo[fieldsProfile[i]] == undefined || userInfo[fieldsProfile[i]] == null || (userInfo[fieldsProfile[i]] != undefined && userInfo[fieldsProfile[i]].length == 0)) {
                                                    blankfields.push(fieldsProfile[i])
                                                }
                                            } if (fieldsProfile[i] == 'isMobileVerified' || fieldsProfile[i] == 'isEmailVerified') {
                                                if (userInfo[fieldsProfile[i]] == false) {
                                                    blankfields.push(fieldsProfile[i])
                                                }
                                            } else {
                                                if (userInfo[fieldsProfile[i]] == undefined || userInfo[fieldsProfile[i]] == null) {
                                                    blankfields.push(fieldsProfile[i])
                                                }
                                            }
                                        }

                                        let profilePercentage = 100 - ((blankfields.length * 100) / fieldsProfile.length)

                                        userInfo.profilePercentage = profilePercentage
                                        userInfo.blankfields = blankfields

                                        return Userslogin.create(inputData).then(function () {
                                            var lastLoginUpdate = {}
                                            lastLoginUpdate.lastLogin = new Date();
                                            lastLoginUpdate.status = 'active';
                                            if (data.domain == 'mobile') {
                                                lastLoginUpdate.deviceToken = data.device_token;
                                                lastLoginUpdate.domain = data.domain;
                                                lastLoginUpdate.os = data.device_type;
                                            } else {

                                                lastLoginUpdate.deviceToken = "";
                                                lastLoginUpdate.domain = "web";
                                            }
                                            return Users.update({ id: userInfo.id }, lastLoginUpdate).then(function () {
                                                return { "success": true, "code": 200, "message": constantObj.messages.SUCCESSFULLY_REGISTERED, "data": userInfo };
                                            }).fail(function (errr) {
                                                return { "success": false, "error": { "code": 400, "message": errr } };
                                            });
                                        });
                                    });
                                } else {
                                    return { "success": false, "error": { "code": 404, "message": constantObj.messages.INVALID_USER, "key": "INVALID_USER" } };
                                }
                            })
                        }
                    } else {
                        return { "success": false, "error": { "code": 302, "message": "OTP does not match." } };
                    }
                }
            } else {
                return { "success": false, "error": { "code": 303, "message": "User does not exists." } };
            }
        });
    },

    registerUser: function (data, context) {
        var date = new Date();

        if ((!data.firstName) || typeof data.firstName == undefined) {
            return { "success": false, "error": { "code": 404, "message": constantObj.messages.FIRSTNAME_REQUIRED, key: 'FIRSTNAME_REQUIRED' } };
        }
        if ((!data.lastName) || typeof data.lastName == undefined) {
            return { "success": false, "error": { "code": 404, "message": constantObj.messages.LASTNAME_REQUIRED, key: 'LASTNAME_REQUIRED' } };
        }
        // if((!data.username) || typeof data.username == undefined){ 
        //     return {"success": false, "error": {"code": 404,"message": constantObj.messages.USERNAME_REQUIRED, key: 'USERNAME_REQUIRED'} };
        // }
        if ((!data.mobile) || typeof data.mobile == undefined) {
            return { "success": false, "error": { "code": 404, "message": constantObj.messages.MOBILE_REQUIRED, key: 'MOBILE_REQUIRED' } };
        }

        let orQuery = []

        if ((data.username) && data.username != undefined && data.username != null) {
            orQuery.push({ username: data.username })
        }
        if ((data.email) && data.email != undefined && data.email != null) {
            orQuery.push({ username: data.email })
        }
        orQuery.push({ mobile: data.mobile })

        let findAlreadyUserqry = { "$or": orQuery }

        if (data.roles) {
            findAlreadyUserqry.roles = data.roles
        }

        return Users.findOne(findAlreadyUserqry).then(function (user) {


            if (user !== undefined) {
                return { "success": false, "error": { "code": 301, "message": constantObj.messages.USER_EXIST, key: 'USER_EXIST' } };
            } else {
                if (data.roles == 'SA' || data.roles == 'A') {
                    data['roles'] = data.roles;

                } else if (data.roles == 'CP') {
                    return { "success": false, "error": { "code": 404, "message": "CP user can not be created with given info" } };
                } else {
                    data['roles'] = 'U';
                }

                if (!data['password']) {
                    data['password'] = generatePassword();
                    //data['password'] = 123456789;
                }

                data['date_registered'] = date;
                // data['date_verified'] = date;
                data['isVerified'] = "N";
                data['addedBy'] = context.identity.id;
                if (data.mobile) {
                    if (typeof data.mobile == 'string') {
                        var phExpression = /^\d+$/;
                        if (data.mobile.match(phExpression)) {
                            if (data.mobile.length > 10 || data.mobile.length < 10) {
                                return { "success": false, "error": { "code": 412, "message": constantObj.messages.PHONE_NUMBER, key: 'PHONE_NUMBER' } };
                            }

                            data['mobile'] = data.mobile;

                        } else {
                            return { "success": false, "error": { "code": 412, "message": constantObj.messages.PHONE_INVALID, key: 'PHONE_INVALID' } };
                        }
                    } else {
                        var mobile = data.mobile.toString();
                        if (mobile.length > 10 || mobile.length < 10) {
                            return { "success": false, "error": { "code": 412, "message": constantObj.messages.PHONE_NUMBER, key: 'PHONE_NUMBER' } };
                        } else {
                            data['mobile'] = data.mobile;
                        }
                    }
                }
                data["fullName"] = data.firstName + ' ' + data.lastName;
                data["status"] = "deactive";
                if (data['isModerntrader']) {
                    data["status"] = "active";
                    data["userType"] = "cropbuyer"
                    data['isEmailVerified'] = true;

                }

                // let userMarkets = data.market;
                code = commonServiceObj.getUniqueCode();
                data.code = code;

                // userUniqueId = commonServiceObj.getalphanumeric_unique();

                if (data['roles'] == 'U' && data.userType != undefined) {
                    if (data.userType == 'farmer') {
                        data.userUniqueId = 'UF_' + userUniqueId;
                    } else if (data.userType == 'cropbuyer') {
                        data.userUniqueId = 'UB_' + userUniqueId;
                    } else {
                        data.userUniqueId = 'UFB_' + userUniqueId;
                    }
                } else {
                    data.userUniqueId = data['roles'] + "_" + String(code);
                }

                if (data.roles == 'U' && data.pincode) {
                    var franchiseeQry = {}
                    franchiseeQry.$and = [{ GM: { $ne: undefined } }, { GM: { $ne: null } }]


                    franchiseeQry.pincode = { "$in": [parseInt(data.pincode)] }
                    franchiseeQry.marketLevel = { "$ne": "zone level" }
                    return Market.findOne(franchiseeQry).then(function (franchisee) {

                        if (franchisee && data.userType != undefined && (data.userType == 'farmer' || data.userType == 'both')) {
                            data['farmerFranchisee'] = franchisee.id
                        }

                        return API.Model(Users).create(data).then(function (user) {
                            context.id = user.mobile;
                            context.type = 'Mobile';
                            return Tokens.generateToken({
                                user_id: user.id,
                                client_id: Tokens.generateTokenString()
                            });
                        }).then(function (token) {
                            if (data.email || data.username) {
                                return emailGeneratedCode({
                                    id: context.id,
                                    type: context.type,
                                    username: data.username,
                                    password: data.password,
                                    firstName: data.firstName,
                                    verifyURL: sails.getBaseUrl() + "/user/verify/" + data.username + "?code=" + token.code
                                });
                            } else {
                                return { "success": true, "data": { "message": constantObj.messages.ADDED_SUCCESSFULL }, "code": 200 };
                            }
                        });
                    })
                } else {
                    return API.Model(Users).create(data).then(function (user) {
                        context.id = user.mobile;
                        context.type = 'Mobile';
                        return Tokens.generateToken({
                            user_id: user.id,
                            client_id: Tokens.generateTokenString()
                        });
                    }).then(function (token) {
                        if (data.email || data.username) {
                            return emailGeneratedCode({
                                id: context.id,
                                type: context.type,
                                username: data.username,
                                password: data.password,
                                firstName: data.firstName,
                                verifyURL: sails.getBaseUrl() + "/user/verify/" + data.username + "?code=" + token.code
                            });
                        } else {
                            return { "success": true, "data": { "message": constantObj.messages.ADDED_SUCCESSFULL }, "code": 200 };
                        }
                    });
                }
            }
        })
    },
    signUpPublicUser: function (data, context) {
        data['roles'] = 'U';

        var date = new Date();
        data['date_registered'] = date;
        data['date_verified'] = date;
        if (data.registeredFrom == undefined || data.registeredFrom == null) {
            return {
                "success": false,
                "error": 'Please send registeredFrom name'
            };
        }
        if (data.firstName == undefined || data.firstName == null) {
            return {
                "success": false,
                "error": 'Please send first name'
            };
        }
        data.fullName = data.firstName + " " + data.lastName;
        if (data.mobile == undefined || data.mobile == null) {
            return {
                "success": false,
                "error": 'Please send mobile number'
            };
        }

        data['uploadBy'] = data.registeredFrom;
        data.userType = 'fpo';
        data.status = "active";
        data.isVerified = "Y";

        userUniqueId = commonServiceObj.getUniqueCode();
        data.userUniqueId = 'UF_' + userUniqueId;
        data.code = userUniqueId;
        if (data.pincode == undefined || data.pincode == null) {
            return {
                "success": false,
                error: 'please send pincode'
            }
        }
        return commonService.getDataFromPincode(data.pincode).then(function (pincodeInfo) {
            let pincodeData = pincodeInfo;
            if (pincodeData == 'error') {
                // console.log("pincode error===", user[4], user[5], user[6], user[7])
                return {
                    "success": false,
                    error: 'please enter valid pincode'
                }
            } else {

                data["state"] = pincodeData["statename"];
                data["district"] = pincodeData["Districtname"];
                data["city"] = data["city"];
                data['pincode'] = pincodeData["pincode"];

                data['password'] = generatePassword();

                return Users.findOne({ mobile: data.mobile }).then(function (user) {
                    if (user) {
                        return {
                            "success": false,
                            error: 'This mobile is already registered with us'
                        }
                    } else {

                        return Users.create(data).then(function (u) {
                            return {
                                "success": true,
                                data: u
                            }
                        }).fail(function (errr) {
                            return { "success": false, "error": { "code": 400, "message": errr } };
                        });
                    }
                })

            }
        })
    },

    signUpBulkPublicUser: function (data, context, req, res) {
        // console.log("arun===")
        const xlsxFile = require('read-excel-file/node');
        var date = new Date();
        var currentDate = new Date();

        xlsxFile('assets/farmx.xls').then((rows) => {

            let data = [];
            // console.log(rows, '=====')
            rows.shift();
            let usersResponse = [];
            async.each(rows, function (user, cb) {
                // let userObject = Object.assign({}, user);
                // console.log(user[4], '===')
                // if (user[2] != "" && user[2] != null && user[2] != undefined && user[2].length == 10 && user[6] != "") {
                return Users.findOne({ mobile: user[4], select: ['fullName', 'mobile', 'pincode'] }).then(function (userInfo) {
                    console.log(userInfo, 'userInfo')
                    if (userInfo) {
                        user.comment = 'Already registered with us';
                        usersResponse.push(user);
                        // console.log("match user====", userInfo)
                        return cb();
                    } else {
                        let object = {}
                        object.firstName = user[2];
                        object.lastName = user[3];
                        object.fullName = user[2] + " " + user[3];
                        object.mobile = user[4];
                        object.roles = "U"
                        object.userType = "both"
                        object.status = "active";
                        object.isVerified = "Y";
                        //object.pincode = user[3];
                        object.uploadBy = data.registeredFrom;
                        object.fpo = data.fpo;

                        object.date_registered = currentDate;
                        object.date_verified = currentDate;
                        userUniqueId = commonService.getUniqueCode();
                        object.userUniqueId = 'UF_' + userUniqueId;
                        object.code = userUniqueId;
                        // console.log(object, 'object===upar');
                        return commonService.getDataFromPincode(user[5]).then(function (pincodeInfo) {
                            let pincodeData = pincodeInfo;
                            if (pincodeData == 'error') {
                                user.comment = 'Please enter valid pincode';

                                usersResponse.push(user);
                                // console.log("pincode error===", user[4], user[5], user[6], user[7])
                                return cb();
                            } else {

                                object["state"] = pincodeData["statename"];
                                object["district"] = pincodeData["Districtname"];
                                object["city"] = user[8];
                                object['pincode'] = pincodeData["pincode"];
                                object['address'] = user[6];
                                object['password'] = generatePassword();
                                // data.push(object);
                                console.log(object, 'object===');
                                return Users.findOne({ uploadBy: user[0] }).then(function (uploadBy) {
                                    if (uploadBy) {
                                        return Users.create(object).then(function (u) {
                                            // console.log("u===", u)
                                            return cb();
                                        })
                                    } else {
                                        user.comment = 'Your are not authorized for registration';
                                        usersResponse.push(user);
                                    }
                                })
                                // 

                            }

                        })
                    }
                    //	return cb();
                })
                //Registration.signupUser(object, res)
                // return cb();

                // }
            }, function (asyncErrorM) {
                console.log(usersResponse, 'usersResponse==')
                let finalResult = {};
                if (usersResponse.length > 0) {
                    finalResult.error = usersResponse;
                } else {
                    finalResult.message = "Successfully registered user";
                }
                return res.jsonx({
                    success: true,
                    data: finalResult
                });
            })

        })
    },


    signupUser: function (data, context) {

        data['roles'] = 'U';
        if (!data.password) {
            data['password'] = generatePassword();
        }
        var date = new Date();
        data['date_registered'] = date;
        data['date_verified'] = date;
        var cId = data.client_id;

        userUniqueId = commonServiceObj.getUniqueCode();
        if (data.userType != undefined) {
            if (data.userType == 'farmer') {
                data.userUniqueId = 'UF_' + userUniqueId;
            } else if (data.userType == 'cropbuyer') {
                data.userUniqueId = 'UB_' + userUniqueId;
            } else {
                data.userUniqueId = 'UFB_' + userUniqueId;
            }
        } else {
            data.userUniqueId = userUniqueId;
        }
        data.code = userUniqueId

        if (data.fbId && data.providers == "facebook") {
            var query = { "fbId": data.fbId };
            return API.Model(Users).findOne(query).then(function (user) {
                //console.log("user fb ",user);
                if (user != undefined) {
                    //console.log("Already");
                    //return {success: true,code:200,message: "Third party login User Already Exist"} ;
                    return socialUserAccess(cId, user);
                } else {
                    if (!data['firstName'] && !data['lastName']) {
                        data['firstName'] = "efarmx";
                        data['lastName'] = "facebook user";
                    }
                    return Users.findOne({ username: data.username, mobile: data.mobile }).then(function (user) {
                        if (user != undefined) {
                            return { "success": false, "error": { "code": 301, "message": constantObj.messages.USER_EXIST, key: 'USER_EXIST' } };
                        } else {
                            return saveUser(data).then(function (res) {
                                return socialUserAccess(cId, res);
                            });
                        }
                    });
                }
            });
        } else if (data.gId && data.providers == "google") {
            // User save information in this methods
            var query = { "gId": data.gId };
            return API.Model(Users).findOne(query).then(function (user) {
                if (user != undefined) {
                    if (user.status == 'active') {
                        return socialUserAccess(data.client_id, user);
                    } else {
                        return { "success": false, "error": { "code": 301, "message": constantObj.messages.NOT_AUTHORIZED, key: 'NOT_AUTHORIZED' } };
                    }
                } else {
                    if (!data['firstName'] && !data['lastName']) {
                        data['firstName'] = "efarmx";
                        data['lastName'] = "googleuser";
                    }
                    console.log("data of google registration", data);
                    return Users.findOne({ username: data.username, mobile: data.mobile }).then(function (user) {
                        if (user != undefined) {
                            return { "success": false, "error": { "code": 301, "message": constantObj.messages.USER_EXIST, key: 'USER_EXIST' } };
                        } else {
                            data['status'] = "active";
                            data['isVerified'] = "Y";
                            return saveUser(data).then(function (res) {
                                return socialUserAccess(cId, res);
                            });
                        }
                    });
                }
            });
        } else {
            if ((!data.username && !data.mobile)) {
                return { "success": false, "error": { "code": 404, "message": constantObj.messages.REQUIRED_FIELD, key: 'REQUIRED_FIELD' } };
            }

            let orqry = []
            if (data.username != undefined && data.username.length > 0) {
                orqry.push({ username: data.username })
            } else {
                if (data.username != undefined) {
                    delete data.username
                }
            }
            if (data.mobile != undefined) {
                orqry.push({ mobile: data.mobile })
            }

            //return Users.findOne({ "$or": orqry }).then(function (user) {
            var franchiseeQry = {}
            franchiseeQry.$and = [{ GM: { $ne: undefined } }, { GM: { $ne: null } }]

            let pincode = data.pincode;
            franchiseeQry.pincode = { "$in": [parseInt(pincode)] }
            franchiseeQry.marketLevel = { "$ne": "zone level" }
            return Market.findOne(franchiseeQry).then(function (franchisee) {
                if (franchisee && data.userType != undefined && (data.userType == 'farmer' || data.userType == 'both')) {
                    data['farmerFranchisee'] = franchisee.id
                }

                return Users.findOne({ "$or": orqry }).then(function (user) {
                    if (user != undefined) {
                        return { "success": false, "error": { "code": 301, "message": constantObj.messages.USER_EXIST, key: 'USER_EXIST' } };
                    } else {


                        return commonService.getDataFromPincode(data.pincode).then(function (pincodeInfo) {
                            let pincodeData = pincodeInfo;
                            if (pincodeData == 'error') {
                                return { "success": false, "error": { "code": 404, "message": 'please enter valid pincode' } };
                            }
                            if (data['state'] == undefined || data['state'] == "") {
                                data["state"] = pincodeData["statename"];
                            }
                            if (data['district'] == undefined || data['district'] == "") {
                                data["district"] = pincodeData["Districtname"];
                            }
                            if (data['city'] == undefined || data['city'] == "" || data['city'] == null) {
                                data["city"] = pincodeData["Taluk"];
                            }
                            if (data['address'] == undefined || data['address'] == "") {
                                data["address"] = data.city + " " + pincodeData["Districtname"] + " , " + pincodeData["statename"] + " " + data.pincode;;
                            }


                            if (data['appversion']) {
                                if (data.mobile) {
                                    return saveUser(data).then(function (res) {
                                        if (res.email) {
                                            emailVerifyLink({
                                                id: res.id,
                                                type: "Email",
                                                username: res.email,
                                                firstName: res.firstName,
                                                verifyURL: sails.config.PAYTM_API_URL + "/user/verification/" + res.code
                                            });
                                        }
                                        return { success: true, code: 200, message: constantObj.messages.SUCCESSFULLY_REGISTERED_NEEDS_OTP, data: { id: res.id, mobile: data.mobile, fullName: res.fullName } };
                                    });
                                } else {
                                    return { "success": false, "error": { "code": 301, "message": "Please add mobile number." } };
                                }
                            } else {
                                data['status'] = "active";
                                data['isVerified'] = "Y";
                                return saveUser(data).then(function (res) {
                                    if (res.email) {
                                        emailVerifyLink({
                                            id: res.id,
                                            type: "Email",
                                            username: res.username,
                                            firstName: res.firstName,
                                            verifyURL: sails.config.PAYTM_API_URL + "/user/verification/" + res.code
                                        });
                                    }

                                    return { success: true, code: 200, message: constantObj.messages.SUCCESSFULLY_REGISTERED, data: res };
                                });
                            }


                        })


                    }

                });
            });
        }
    },

    requestOTPForLogin: function (data, context) {
        let query = {}
        query.$and = [{ $or: [{ email: data.username }, { mobile: data.username }] }, { $or: [{ 'roles': 'U' }, { 'roles': 'FGM' }, { 'roles': 'CP' }] }];
        return Users.findOne(query).then(function (user) {
            if (user == undefined) {
                return { "success": false, "error": { "code": 404, "message": constantObj.messages.WRONG_USERNAME, key: 'WRONG_USERNAME' } };
            } else {
                if (user.mobile) {
                    var OTP = Math.floor(1000 + Math.random() * 9000);
                    var newUpdates = {}
                    newUpdates['otp'] = OTP;
                    newUpdates['otpTime'] = new Date()

                    return Users.update({ id: user.id }, newUpdates).then(function (newuser) {
                        let smsInfo = {}
                        smsInfo.otp = newuser[0].otp
                        smsInfo.numbers = [newuser[0].mobile]

                        commonServiceObj.sendLoginOTPSMS(smsInfo)
                        return { "success": true, "code": 200, "message": "OTP is sent at your registered number.", "data": { "id": newuser[0].id, "mobile": newuser[0].mobile } };
                    });
                } else {
                    return { "success": false, "error": { "code": 404, "message": "User does not have mobile number. Login with email and update mobile number." } };
                }
            }
        })
    },

    verifyOTPForLogin: function (data, context) {
        let query = {};
        query.id = data.id;
        query.$or = [{ 'roles': 'U' }, { 'roles': 'FGM' }, { 'roles': 'CP' }]
        // query.mobile = data.mobile;

        return Users.findOne(query).populate('franchisee').then(function (user) {
            if (user) {
                if (user.isMobileVerified == undefined || user.isMobileVerified == false) {
                    // return {"success": false, "error": {"code": 300,"message": "Mobile number is not verified. Please verify your mobile number"}, "data": {"id":user.id, "mobile":user.mobile, "fullName": user.fullName} };
                    if (user.mobile != data.mobile) {
                        return { "success": false, "error": { "code": 404, "message": "Given mobile number does not match." } };
                    } else {
                        if (data.otp == user.otp) {

                            var today = new Date();
                            var Christmas = user.otpTime;
                            var diffMs = (today - Christmas); // milliseconds
                            var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes

                            if (diffMins > 30) {
                                return { "success": false, "error": { "code": 300, "message": "OTP is expired. Please request a new one or click resend." } };
                            } else {
                                return Users.update({ id: user.id }, { isVerified: 'Y', mobileVerifiedDate: new Date(), date_verified: new Date(), status: "active", isMobileVerified: true, otp: null, otpTime: null }).then(function (userInfoAry) {
                                    if (userInfoAry && userInfoAry.length > 0) {
                                        let userInfo = userInfoAry[0]
                                        let inputData = {};


                                        let fieldsProfile = ['firstName', 'lastName', 'username', 'mobile', 'address', 'residentialAddress', 'city', 'residentialCity', 'pincode', 'residentialPincode', 'state', 'residentialState', 'district', 'residentialDistrict', 'image', 'about', 'password', 'isMobileVerified', 'isEmailVerified']

                                        if (userInfo.roles == 'FGM') {
                                            let franchiseeflds = ['kycDoc', 'pancard', 'bankName', 'bankAccountNumber', 'bankIFSCCode', 'firmName']
                                            fieldsProfile = fieldsProfile.concat(franchiseeflds)
                                        } else if (userInfo.roles == 'U') {
                                            let franchiseeflds = ['banks']
                                            fieldsProfile = fieldsProfile.concat(franchiseeflds)
                                        }

                                        let blankfields = []
                                        for (var i = 0; i < fieldsProfile.length; i++) {
                                            if (fieldsProfile[i] == 'banks') {
                                                if (userInfo[fieldsProfile[i]] == undefined || userInfo[fieldsProfile[i]] == null || (userInfo[fieldsProfile[i]] != undefined && userInfo[fieldsProfile[i]].length == 0)) {
                                                    blankfields.push(fieldsProfile[i])
                                                }
                                            } if (fieldsProfile[i] == 'isMobileVerified' || fieldsProfile[i] == 'isEmailVerified') {
                                                if (userInfo[fieldsProfile[i]] == false) {
                                                    blankfields.push(fieldsProfile[i])
                                                }
                                            } else {
                                                if (userInfo[fieldsProfile[i]] == undefined || userInfo[fieldsProfile[i]] == null) {
                                                    blankfields.push(fieldsProfile[i])
                                                }
                                            }
                                        }

                                        let profilePercentage = 100 - ((blankfields.length * 100) / fieldsProfile.length)

                                        userInfo.profilePercentage = profilePercentage
                                        userInfo.blankfields = blankfields

                                        if (userInfo.roles == 'FGM') {
                                            userInfo.franchisee = user.franchisee
                                        }

                                        inputData.user = userInfo.id;

                                        if (data.gcm_id) {
                                            inputData.device_token = data.gcm_id;
                                            inputData.fcm_token = data.gcm_id;
                                        }
                                        if (data.fcm_token) {
                                            inputData.fcm_token = data.fcm_token
                                        } else if (data.device_token) {
                                            inputData.fcm_token = data.device_token;
                                        }

                                        if (data.device_token) {
                                            inputData.device_token = data.device_token;
                                        }

                                        if (data.device_type == '' || data.device_type == undefined) {
                                            inputData.device_type = "WEB";
                                        } else {
                                            inputData.device_type = data.device_type;
                                        }

                                        return Tokens.generateToken({
                                            client_id: data.client_id,
                                            user_id: userInfo.id
                                        }).then(function (token) {
                                            userInfo.access_token = token.access_token;
                                            userInfo.refresh_token = token.refresh_token;

                                            inputData.access_token = token.access_token;

                                            return Userslogin.create(inputData).then(function () {
                                                var lastLoginUpdate = {}
                                                lastLoginUpdate.lastLogin = new Date();
                                                lastLoginUpdate.status = 'active';
                                                if (data.domain == 'mobile') {
                                                    lastLoginUpdate.deviceToken = data.device_token;
                                                    lastLoginUpdate.domain = data.domain;
                                                    lastLoginUpdate.os = data.device_type;
                                                } else {

                                                    lastLoginUpdate.deviceToken = "";
                                                    lastLoginUpdate.domain = "web";
                                                }
                                                return Users.update({ id: userInfo.id }, lastLoginUpdate).then(function () {
                                                    return { "success": true, "code": 200, "message": constantObj.messages.SUCCESSFULLY_LOGGEDIN, "data": userInfo };
                                                }).fail(function (errr) {
                                                    return { "success": false, "error": { "code": 400, "message": errr } };
                                                });
                                            });
                                        });
                                    } else {
                                        return { "success": false, "error": { "code": 404, "message": constantObj.messages.INVALID_USER, "key": "INVALID_USER" } };
                                    }
                                })
                            }
                        } else {
                            return { "success": false, "error": { "code": 300, "message": "OTP does not match." } };
                        }
                    }
                } else {

                    if (user != undefined && user.roles == 'U' && user.isVerified != 'Y' && user.status == 'deactive') {
                        return { "success": false, "error": { "code": 404, "message": constantObj.messages.USERNAME_NOT_VERIFIED, key: 'USERNAME_NOT_VERIFIED' } };
                    }

                    if (user != undefined && user.status == 'deactive') {
                        return { "success": false, "error": { "code": 404, "message": constantObj.messages.USERNAME_INACTIVE, key: 'USERNAME_INACTIVE' } };
                    }

                    if (user != undefined && user.status != "active" && user.isVerified != "Y") {
                        return { "success": false, "error": { "code": 404, "message": constantObj.messages.USERNAME_INACTIVE, key: 'USERNAME_INACTIVE' } };
                    }

                    if (user.mobile != data.mobile) {
                        return { "success": false, "error": { "code": 404, "message": "Given mobile number does not match." } };
                    } else {
                        if (data.otp == user.otp) {

                            var today = new Date();
                            var Christmas = user.otpTime;
                            var diffMs = (today - Christmas); // milliseconds
                            var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes

                            if (diffMins > 30) {
                                return { "success": false, "error": { "code": 300, "message": "OTP is expired. Please request a new one or click resend." } };
                            } else {
                                return Users.update({ id: user.id }, { otp: null, otpTime: null }).then(function (userInfoAry) {
                                    if (userInfoAry && userInfoAry.length > 0) {
                                        let userInfo = userInfoAry[0]
                                        let inputData = {};


                                        let fieldsProfile = ['firstName', 'lastName', 'username', 'mobile', 'address', 'residentialAddress', 'city', 'residentialCity', 'pincode', 'residentialPincode', 'state', 'residentialState', 'district', 'residentialDistrict', 'image', 'about', 'password', 'isMobileVerified', 'isEmailVerified']

                                        if (userInfo.roles == 'FGM') {
                                            let franchiseeflds = ['kycDoc', 'pancard', 'bankName', 'bankAccountNumber', 'bankIFSCCode', 'firmName']
                                            fieldsProfile = fieldsProfile.concat(franchiseeflds)
                                        } else if (userInfo.roles == 'U') {
                                            let franchiseeflds = ['banks']
                                            fieldsProfile = fieldsProfile.concat(franchiseeflds)
                                        }

                                        let blankfields = []
                                        for (var i = 0; i < fieldsProfile.length; i++) {
                                            if (fieldsProfile[i] == 'banks') {
                                                if (userInfo[fieldsProfile[i]] == undefined || userInfo[fieldsProfile[i]] == null || (userInfo[fieldsProfile[i]] != undefined && userInfo[fieldsProfile[i]].length == 0)) {
                                                    blankfields.push(fieldsProfile[i])
                                                }
                                            } if (fieldsProfile[i] == 'isMobileVerified' || fieldsProfile[i] == 'isEmailVerified') {
                                                if (userInfo[fieldsProfile[i]] == false) {
                                                    blankfields.push(fieldsProfile[i])
                                                }
                                            } else {
                                                if (userInfo[fieldsProfile[i]] == undefined || userInfo[fieldsProfile[i]] == null) {
                                                    blankfields.push(fieldsProfile[i])
                                                }
                                            }
                                        }

                                        let profilePercentage = 100 - ((blankfields.length * 100) / fieldsProfile.length)

                                        userInfo.profilePercentage = profilePercentage
                                        userInfo.blankfields = blankfields


                                        if (userInfo.roles == 'FGM') {
                                            userInfo.franchisee = user.franchisee
                                        }

                                        inputData.user = userInfo.id;

                                        if (data.gcm_id) {
                                            inputData.device_token = data.gcm_id;
                                            inputData.fcm_token = data.gcm_id;
                                        }
                                        if (data.fcm_token) {
                                            inputData.fcm_token = data.fcm_token
                                        } else if (data.device_token) {
                                            inputData.fcm_token = data.device_token;
                                        }

                                        if (data.device_token) {
                                            inputData.device_token = data.device_token;
                                        }

                                        if (data.device_type == '' || data.device_type == undefined) {
                                            inputData.device_type = "WEB";
                                        } else {
                                            inputData.device_type = data.device_type;
                                        }

                                        return Tokens.generateToken({
                                            client_id: data.client_id,
                                            user_id: userInfo.id
                                        }).then(function (token) {
                                            userInfo.access_token = token.access_token;
                                            userInfo.refresh_token = token.refresh_token;

                                            inputData.access_token = token.access_token;

                                            return Userslogin.create(inputData).then(function () {
                                                var lastLoginUpdate = {}
                                                lastLoginUpdate.lastLogin = new Date();
                                                lastLoginUpdate.status = 'active';
                                                if (data.domain == 'mobile') {
                                                    lastLoginUpdate.deviceToken = data.device_token;
                                                    lastLoginUpdate.domain = data.domain;
                                                    lastLoginUpdate.os = data.device_type;
                                                } else {

                                                    lastLoginUpdate.deviceToken = "";
                                                    lastLoginUpdate.domain = "web";
                                                }
                                                return Users.update({ id: userInfo.id }, lastLoginUpdate).then(function () {
                                                    return { "success": true, "code": 200, "message": constantObj.messages.SUCCESSFULLY_LOGGEDIN, "data": userInfo };
                                                }).fail(function (errr) {
                                                    return { "success": false, "error": { "code": 400, "message": errr } };
                                                });
                                            });
                                        });
                                    } else {
                                        return { "success": false, "error": { "code": 404, "message": constantObj.messages.INVALID_USER, "key": "INVALID_USER" } };
                                    }
                                })
                            }
                        } else {
                            return { "success": false, "error": { "code": 300, "message": "OTP does not match." } };
                        }
                    }
                }
            } else {
                return { "success": false, "error": { "code": 301, "message": "User does not exists." } };
            }
        });
    },

    signinDealer: function (data, context) {

        let query = {};
        query.username = data.username;
        query.status = { $ne: "deactive" };
        query.isVerified = "Y";
        query.roles = 'DLR'

        return Users.findOne(query).populate('dealerManufacturer').then(function (user) {

            if (user == undefined) {
                return { "success": false, "error": { "code": 404, "message": constantObj.messages.WRONG_USERNAME, key: 'WRONG_USERNAME' } };
            }

            if (user != undefined && user.roles == 'DLR' && user.isVerified != 'Y') {
                return { "success": false, "error": { "code": 404, "message": constantObj.messages.USERNAME_NOT_VERIFIED, key: 'USERNAME_NOT_VERIFIED' } };
            }

            if (user != undefined && user.status == 'deactive') {
                return { "success": false, "error": { "code": 404, "message": constantObj.messages.USERNAME_INACTIVE, key: 'USERNAME_INACTIVE' } };
            }

            if (user != undefined && user.status != "active") {
                return { "success": false, "error": { "code": 404, "message": constantObj.messages.USERNAME_INACTIVE, key: 'USERNAME_INACTIVE' } };
            }

            if (!bcrypt.compareSync(data.password, user.password)) {

                return { "success": false, "error": { "code": 404, "message": constantObj.messages.WRONG_PASSWORD, key: 'WRONG_PASSWORD' } };

            } else {
                let inputData = {};
                // if(data.gcm_id){ inputData.gcm_id = data.gcm_id; }
                // if(data.device_token){ inputData.device_token = data.device_token; }
                inputData.user = user.id;
                // inputData.device_type = "Web";

                return Tokens.generateToken({
                    client_id: data.client_id,
                    user_id: user.id
                }).then(function (token) {
                    user.access_token = token.access_token;
                    user.refresh_token = token.refresh_token;

                    inputData.access_token = token.access_token;

                    return Userslogin.create(inputData).then(function () {
                        var lastLoginUpdate = {}
                        lastLoginUpdate.lastLogin = new Date();
                        lastLoginUpdate.status = 'active';
                        if (data.domain == 'mobile') {
                            lastLoginUpdate.deviceToken = data.device_token;
                            lastLoginUpdate.domain = data.domain;
                            lastLoginUpdate.os = data.device_type;
                        } else {

                            lastLoginUpdate.deviceToken = "";
                            lastLoginUpdate.domain = "web";

                        }

                        return Users.update({ id: user.id }, lastLoginUpdate).then(function () {
                            return { success: true, code: 200, message: constantObj.messages.SUCCESSFULLY_LOGGEDIN, data: user };
                        }).fail(function (errr) {
                            return { "success": false, "error": { "code": 400, "message": errr } };
                        });
                    });
                });
            }
        });
    },

    signinUser: function (data, context) {

        let query = {};
        // query.username = data.username;
        query.$and = [{ $or: [{ email: data.username }, { mobile: data.username }, { username: data.username }] }, { $or: [{ 'roles': 'U' }, { 'roles': 'FGM' }, { 'roles': 'CP' }] }];
        // query.status = {$ne:"deactive"};
        // query.isVerified = "Y";
        // query.$or = [{'roles':'U'},{'roles':'FGM'},{'roles':'CP'}]


        //return Users.findOne({username:username, roles:'U'}).then(function (user) {
        return Users.findOne(query).populate('franchisee').then(function (user) {

            if (user == undefined) {
                return { "success": false, "error": { "code": 404, "message": constantObj.messages.WRONG_USERNAME, key: 'WRONG_USERNAME' } };
            } else {
                if (!bcrypt.compareSync(data.password, user.password)) {
                    return { "success": false, "error": { "code": 404, "message": constantObj.messages.WRONG_PASSWORD, key: 'WRONG_PASSWORD' } };
                }


                let fieldsProfile = ['firstName', 'lastName', 'username', 'mobile', 'address', 'residentialAddress', 'city', 'residentialCity', 'pincode', 'residentialPincode', 'state', 'residentialState', 'district', 'residentialDistrict', 'image', 'about', 'password', 'isMobileVerified', 'isEmailVerified']

                if (user.roles == 'FGM') {
                    let franchiseeflds = ['kycDoc', 'pancard', 'bankName', 'bankAccountNumber', 'bankIFSCCode', 'firmName']
                    fieldsProfile = fieldsProfile.concat(franchiseeflds)
                } else if (user.roles == 'U') {
                    let franchiseeflds = ['banks']
                    fieldsProfile = fieldsProfile.concat(franchiseeflds)
                }

                let blankfields = []
                for (var i = 0; i < fieldsProfile.length; i++) {
                    if (fieldsProfile[i] == 'banks') {
                        if (user[fieldsProfile[i]] == undefined || user[fieldsProfile[i]] == null || (user[fieldsProfile[i]] != undefined && user[fieldsProfile[i]].length == 0)) {
                            blankfields.push(fieldsProfile[i])
                        }
                    } if (fieldsProfile[i] == 'isMobileVerified' || fieldsProfile[i] == 'isEmailVerified') {
                        if (user[fieldsProfile[i]] == false) {
                            blankfields.push(fieldsProfile[i])
                        }
                    } else {
                        if (user[fieldsProfile[i]] == undefined || user[fieldsProfile[i]] == null) {
                            blankfields.push(fieldsProfile[i])
                        }
                    }
                }

                let profilePercentage = 100 - ((blankfields.length * 100) / fieldsProfile.length)

                user.profilePercentage = profilePercentage
                user.blankfields = blankfields
                if (data.appversion) {
                    if (user.isMobileVerified == undefined || user.isMobileVerified == false) {
                        return { "success": false, "error": { "code": 300, "message": "Mobile number is not verified. Please verify your mobile number" }, "data": { "id": user.id, "mobile": user.mobile, "fullName": user.fullName } };
                    } else {
                        if (user != undefined && user.roles == 'U' && user.isVerified != 'Y' && user.status == 'deactive') {
                            return { "success": false, "error": { "code": 404, "message": constantObj.messages.USERNAME_NOT_VERIFIED, key: 'USERNAME_NOT_VERIFIED' } };
                        }

                        if (user != undefined && user.status == 'deactive') {
                            return { "success": false, "error": { "code": 404, "message": constantObj.messages.USERNAME_INACTIVE, key: 'USERNAME_INACTIVE' } };
                        }

                        if (user != undefined && user.status != "active" && user.isVerified != "Y") {
                            return { "success": false, "error": { "code": 404, "message": constantObj.messages.USERNAME_INACTIVE, key: 'USERNAME_INACTIVE' } };
                        }

                        if (!bcrypt.compareSync(data.password, user.password)) {

                            return { "success": false, "error": { "code": 404, "message": constantObj.messages.WRONG_PASSWORD, key: 'WRONG_PASSWORD' } };

                        } else {
                            let inputData = {};
                            inputData.user = user.id;
                            if (data.gcm_id) {
                                inputData.device_token = data.gcm_id;
                                inputData.fcm_token = data.gcm_id;
                            }
                            if (data.fcm_token) {
                                inputData.fcm_token = data.fcm_token
                            } else if (data.device_token) {
                                inputData.fcm_token = data.device_token;
                            }

                            if (data.device_token) {
                                inputData.device_token = data.device_token;
                            }

                            if (data.device_type == '' || data.device_type == undefined) {
                                inputData.device_type = "WEB";
                            } else {
                                inputData.device_type = data.device_type;
                            }

                            return Tokens.generateToken({
                                client_id: data.client_id,
                                user_id: user.id
                            }).then(function (token) {
                                user.access_token = token.access_token;
                                user.refresh_token = token.refresh_token;

                                inputData.access_token = token.access_token;

                                return Userslogin.create(inputData).then(function () {
                                    var lastLoginUpdate = {}
                                    lastLoginUpdate.lastLogin = new Date();
                                    lastLoginUpdate.status = 'active';
                                    // console.log("eeeeeeeee", lastLoginUpdate);
                                    if (data.domain == 'mobile') {
                                        lastLoginUpdate.deviceToken = data.device_token;
                                        lastLoginUpdate.domain = data.domain;
                                        lastLoginUpdate.os = data.device_type;
                                    } else {
                                        lastLoginUpdate.deviceToken = "";
                                        lastLoginUpdate.domain = "web";
                                    }

                                    return Users.update({ id: user.id }, lastLoginUpdate).then(function () {
                                        return { success: true, code: 200, message: constantObj.messages.SUCCESSFULLY_LOGGEDIN, data: user };
                                    }).fail(function (errr) {
                                        return { "success": false, "error": { "code": 400, "message": errr } };
                                    });
                                });
                            });
                        }
                    }
                } else {

                    if (user != undefined && user.roles == 'U' && user.isVerified != 'Y' && user.status == 'deactive') {
                        return { "success": false, "error": { "code": 404, "message": constantObj.messages.USERNAME_NOT_VERIFIED, key: 'USERNAME_NOT_VERIFIED' } };
                    }

                    if (user != undefined && user.status == 'deactive') {
                        return { "success": false, "error": { "code": 404, "message": constantObj.messages.USERNAME_INACTIVE, key: 'USERNAME_INACTIVE' } };
                    }

                    if (user != undefined && user.status != "active" && user.isVerified != "Y") {
                        return { "success": false, "error": { "code": 404, "message": constantObj.messages.USERNAME_INACTIVE, key: 'USERNAME_INACTIVE' } };
                    }

                    if (!bcrypt.compareSync(data.password, user.password)) {

                        return { "success": false, "error": { "code": 404, "message": constantObj.messages.WRONG_PASSWORD, key: 'WRONG_PASSWORD' } };

                    } else {
                        let inputData = {};
                        inputData.user = user.id;
                        if (data.gcm_id) {
                            inputData.device_token = data.gcm_id;
                            inputData.fcm_token = data.gcm_id;
                        }
                        if (data.fcm_token) {
                            inputData.fcm_token = data.fcm_token
                        } else if (data.device_token) {
                            inputData.fcm_token = data.device_token;
                        }

                        if (data.device_token) {
                            inputData.device_token = data.device_token;
                        }

                        if (data.device_type == '' || data.device_type == undefined) {
                            inputData.device_type = "WEB";
                        } else {
                            inputData.device_type = data.device_type;
                        }

                        return Tokens.generateToken({
                            client_id: data.client_id,
                            user_id: user.id
                        }).then(function (token) {
                            user.access_token = token.access_token;
                            user.refresh_token = token.refresh_token;

                            inputData.access_token = token.access_token;

                            return Userslogin.create(inputData).then(function () {
                                var lastLoginUpdate = {}
                                lastLoginUpdate.lastLogin = new Date();
                                lastLoginUpdate.status = 'active';
                                // console.log("eeeeeeeee", lastLoginUpdate);
                                if (data.domain == 'mobile') {
                                    lastLoginUpdate.deviceToken = data.device_token;
                                    lastLoginUpdate.domain = data.domain;
                                    lastLoginUpdate.os = data.device_type;
                                } else {

                                    lastLoginUpdate.deviceToken = "";
                                    lastLoginUpdate.domain = "web";

                                }



                                // console.log("sdsdsdsds",lastLoginUpdate);

                                return Users.update({ id: user.id }, lastLoginUpdate).then(function () {
                                    return { success: true, code: 200, message: constantObj.messages.SUCCESSFULLY_LOGGEDIN, data: user };
                                }).fail(function (errr) {
                                    return { "success": false, "error": { "code": 400, "message": errr } };
                                });
                            });
                        });
                    }
                }
            }
        });
    },

    signinCP: function (data, context) {

        let query = {};
        query.username = data.username;
        // query.status = {$ne:"deactive"};
        // query.isVerified = "Y";
        query.roles = 'CP'
        query.$or = [{ username: data.username }, { mobile: data.username }];

        //return Users.findOne({username:username, roles:'U'}).then(function (user) {
        return Users.findOne(query).populate('franchisee').then(function (user) {

            if (user == undefined) {
                return { "success": false, "error": { "code": 404, "message": constantObj.messages.WRONG_USERNAME, key: 'WRONG_USERNAME' } };
            }

            if (user != undefined && user.roles == 'CP' && user.isVerified != 'Y' && user.status == 'deactive') {
                return { "success": false, "error": { "code": 404, "message": constantObj.messages.USERNAME_NOT_VERIFIED, key: 'USERNAME_NOT_VERIFIED' } };
            }

            if (user != undefined && user.status == 'deactive') {
                return { "success": false, "error": { "code": 404, "message": constantObj.messages.USERNAME_INACTIVE, key: 'USERNAME_INACTIVE' } };
            }

            if (user != undefined && user.status != "active" && user.isVerified != "Y") {
                return { "success": false, "error": { "code": 404, "message": constantObj.messages.USERNAME_INACTIVE, key: 'USERNAME_INACTIVE' } };
            }

            if (!bcrypt.compareSync(data.password, user.password)) {

                return { "success": false, "error": { "code": 404, "message": constantObj.messages.WRONG_PASSWORD, key: 'WRONG_PASSWORD' } };

            } else {
                let inputData = {};
                if (data.gcm_id) {
                    inpustData.device_token = data.gcm_id;
                    inputData.fcm_token = data.gcm_id;
                }
                if (data.fcm_token) {
                    inputData.fcm_token = data.fcm_token
                } else if (data.device_token) {
                    inputData.fcm_token = data.device_token;
                }

                if (data.device_token) {
                    inputData.device_token = data.device_token;
                }

                if (data.device_type == '' || data.device_type == undefined) {
                    inputData.device_type = "WEB";
                } else {
                    inputData.device_type = data.device_type;
                }

                return Tokens.generateToken({
                    client_id: data.client_id,
                    user_id: user.id
                }).then(function (token) {
                    user.access_token = token.access_token;
                    user.refresh_token = token.refresh_token;

                    inputData.access_token = token.access_token;

                    return
                    (inputData).then(function () {
                        var lastLoginUpdate = {}
                        lastLoginUpdate.lastLogin = new Date();
                        lastLoginUpdate.status = 'active';
                        if (data.domain == 'mobile') {
                            lastLoginUpdate.deviceToken = data.device_token;
                            lastLoginUpdate.domain = data.domain;
                            lastLoginUpdate.os = data.device_type;
                        } else {
                            lastLoginUpdate.deviceToken = "";
                            lastLoginUpdate.domain = "WEB";
                        }

                        return Users.update({ id: user.id }, lastLoginUpdate).then(function () {
                            return { success: true, code: 200, message: constantObj.messages.SUCCESSFULLY_LOGGEDIN, data: user };
                        }).fail(function (errr) {
                            return { "success": false, "error": { "code": 400, "message": errr } };
                        });
                    });
                });
            }
        });
    },

    checkOtpUser: function (data, context) {
        let userOtp = parseInt(data.number);
        return Users.findOne({ otp: userOtp }).then(function (user) {

            if (user == undefined) {
                return {
                    "success": false,
                    "error": {
                        "code": 404,
                        "message": constantObj.messages.WRONG_OTP,
                        key: 'WRONG_OTP'
                    }
                };
            }
            API.Model(Users).update(
                {
                    id: user.id
                },
                {
                    otpVerified: "Y",
                    isVerified: "Y"
                }
            );

            return {
                userVerifiedByOtp: true,
                username: user.username,
                userId: user.id
            }
        });
    },
    /*verificationUser: function (data, context) {
        let verifyCode = parseInt(data.code);
        console.log("---------------",verifyCode,data);
        
        return Users.findOne({code:verifyCode}).then(function (user) {
            
            if( user == undefined ){
                return {"success": false, "error": {"code": 404,"message": constantObj.messages.INVALID_USER} };
            }
            return Users.update({id:user.id},{isVerified: 'Y',date_verified:new Date(),status:"active"}).exec(function(usererr,userInfo){
                console.log("++++++++++++++++++",usererr,userInfo)
                if(userInfo){  
                    return {
                        username: user.username,
                        status: "active",
                        isVerified : true
                    }
                    return redirect("http://localhost:4200/#/login");
 
                } else {
                    return {"success": false, "error": {"code": 404,"message": constantObj.messages.INVALID_USER} };       
                }
            })
        });
    },*/
    verifyUser: function (data, context) {
        return Tokens.authenticate({
            code: data.code,
            type: 'verification',
            username: data.username
        }).then(function (info) {
            var date = new Date();
            if (!info) return Promise.reject('Unauthorized');

            API.Model(Users).update(
                {
                    username: info.identity.username
                },
                {
                    date_verified: date,
                    isVerified: 'Y',
                    status: 'active'

                }
            );

            return {
                verified: true,
                username: info.identity.username
            }
        });
    },
    registerClient: function (data, context) {
        return API.Model(Clients).create({
            client_id: Tokens.generateTokenString(),
            client_secret: Tokens.generateTokenString(),
            username: data.username
        }).then(function (client) {
            context.id = client.client_id;
            context.type = 'Client ID';

            return Tokens.generateToken({
                client_id: client.client_id
            });
        }).then(function (token) {
            return emailGeneratedCode({
                id: context.id,
                type: context.type,
                verifyURL: sails.config.security.server.url + "/clients/verify/" + data.username + "?code=" + token.code,
                username: data.username
            });
        });
    },
    verifyClient: function (data, context) {
        return Tokens.authenticate({
            type: 'verification',
            code: data.code,
            username: data.username
        }).then(function (info) {
            var date = new Date();
            if (!info) return Promise.reject('Unauthorized');

            API.Model(Clients).update(
                {
                    client_id: info.identity.client_id
                },
                {
                    date_verified: date
                }
            );

            return {
                verified: true,
                username: info.identity.username
            };
        });
    },

    saveFranchisee: function (data, context) {
        var date = new Date();

        if ((!data.firstName) || typeof data.firstName == undefined) {
            return { "success": false, "error": { "code": 404, "message": constantObj.messages.FIRSTNAME_REQUIRED, key: 'FIRSTNAME_REQUIRED' } };
        }
        if ((!data.lastName) || typeof data.lastName == undefined) {
            return { "success": false, "error": { "code": 404, "message": constantObj.messages.LASTNAME_REQUIRED, key: 'LASTNAME_REQUIRED' } };
        }
        if ((!data.username) || typeof data.username == undefined) {
            return { "success": false, "error": { "code": 404, "message": constantObj.messages.USERNAME_REQUIRED, key: 'USERNAME_REQUIRED' } };
        }
        if ((!data.mobile) || typeof data.mobile == undefined) {
            return { "success": false, "error": { "code": 404, "message": constantObj.messages.MOBILE_REQUIRED, key: 'MOBILE_REQUIRED' } };
        }

        return Users.findOne({ username: data.username }).then(function (user) {

            if (user !== undefined) {
                return { "success": false, "error": { "code": 301, "message": constantObj.messages.USER_EXIST, key: 'USER_EXIST' } };
            } else {

                data['roles'] = 'FGM';

                if (!data['password']) {
                    //data['password'] = generatePassword();
                    data['password'] = 123456789;
                }

                data['date_registered'] = date;
                data['date_verified'] = date;
                data['isVerified'] = "Y";
                data['addedBy'] = context.identity.id;

                if (data.mobile) {
                    if (typeof data.mobile == 'string') {
                        var phExpression = /^\d+$/;
                        if (data.mobile.match(phExpression)) {
                            if (data.mobile.length > 10 || data.mobile.length < 10) {
                                return { "success": false, "error": { "code": 412, "message": constantObj.messages.PHONE_NUMBER, key: 'PHONE_NUMBER' } };
                            }

                            data['mobile'] = data.mobile;

                        } else {
                            return { "success": false, "error": { "code": 412, "message": constantObj.messages.PHONE_INVALID, key: 'PHONE_INVALID' } };
                        }
                    } else {
                        var mobile = data.mobile.toString();
                        if (mobile.length > 10 || mobile.length < 10) {
                            return { "success": false, "error": { "code": 412, "message": constantObj.messages.PHONE_NUMBER, key: 'PHONE_NUMBER' } };
                        } else {
                            data['mobile'] = data.mobile;
                        }
                    }
                }
                data["fullName"] = data.firstName + ' ' + data.lastName;
                data["status"] = "active";
                code = commonServiceObj.getUniqueCode();
                data.code = code;

                let sellerCode = Math.floor(Math.random() * 9999998) + 1000099;

                data.code = sellerCode;
                data.sellerCode = "FRC_" + sellerCode;
                data.userUniqueId = "FRC_" + sellerCode;

                return API.Model(Users).create(data).then(function (user) {
                    context.id = user.username;
                    context.type = 'Email';
                    if (data.franchisee) {
                        var updateMarketQuery = {}
                        updateMarketQuery.id = data.franchisee

                        var updateMarketData = {}
                        updateMarketData.GM = user.id
                        Market.update(updateMarketQuery, updateMarketData).then(function (updatedMarket) {
                            return Tokens.generateToken({ user_id: user.id, client_id: Tokens.generateTokenString() })
                        });
                    } else {
                        return Tokens.generateToken({ user_id: user.id, client_id: Tokens.generateTokenString() })
                    }
                }).then(function (token) {

                    return emailGeneratedCode({
                        username: data.username,
                        password: data.password,
                        firstName: data.firstName
                    });

                    /*return {
                         "success": true,
                         "data": {
                             "code": 200,
                             "message": constantObj.franchisee.FRANCHISEE_ADDED, 
                             "key": 'FRANCHISEE_ADDED'
                         } 
                     };*/
                });
            }
        })
    },

    saveCP: function (data, context) {
        var date = new Date();

        if ((!data.firstName) || typeof data.firstName == undefined) {
            return { "success": false, "error": { "code": 404, "message": constantObj.messages.FIRSTNAME_REQUIRED, key: 'FIRSTNAME_REQUIRED' } };
        }
        if ((!data.lastName) || typeof data.lastName == undefined) {
            return { "success": false, "error": { "code": 404, "message": constantObj.messages.LASTNAME_REQUIRED, key: 'LASTNAME_REQUIRED' } };
        }
        if ((!data.email) || typeof data.email == undefined) {
            return { "success": false, "error": { "code": 404, "message": constantObj.messages.WRONG_USERNAME } };
        }
        if ((!data.mobile) || typeof data.mobile == undefined) {
            return { "success": false, "error": { "code": 404, "message": constantObj.messages.MOBILE_REQUIRED, key: 'MOBILE_REQUIRED' } };
        }
        if ((!data.franchisee) || typeof data.franchisee == undefined) {
            return { "success": false, "error": { "code": 404, "message": constantObj.messages.MOBILE_REQUIRED, key: 'MOBILE_REQUIRED' } };
        }

        return Users.findOne({ username: data.username }).then(function (user) {

            if (user !== undefined) {
                return { "success": false, "error": { "code": 301, "message": constantObj.messages.USER_EXIST, key: 'USER_EXIST' } };
            } else {

                data['roles'] = 'CP';

                if (!data['password']) {
                    data['password'] = generatePassword();
                    // data['password'] = 123456789;
                }

                data['date_registered'] = date;
                data['date_verified'] = date;
                data['isVerified'] = "Y";
                data['addedBy'] = context.identity.id;

                if (data.mobile) {
                    if (typeof data.mobile == 'string') {
                        var phExpression = /^\d+$/;
                        if (data.mobile.match(phExpression)) {
                            if (data.mobile.length > 10 || data.mobile.length < 10) {
                                return { "success": false, "error": { "code": 412, "message": constantObj.messages.PHONE_NUMBER, key: 'PHONE_NUMBER' } };
                            }

                            data['mobile'] = data.mobile;

                        } else {
                            return { "success": false, "error": { "code": 412, "message": constantObj.messages.PHONE_INVALID, key: 'PHONE_INVALID' } };
                        }
                    } else {
                        var mobile = data.mobile.toString();
                        if (mobile.length > 10 || mobile.length < 10) {
                            return { "success": false, "error": { "code": 412, "message": constantObj.messages.PHONE_NUMBER, key: 'PHONE_NUMBER' } };
                        } else {
                            data['mobile'] = data.mobile;
                        }
                    }
                }
                data["fullName"] = data.firstName + ' ' + data.lastName;
                data["status"] = "active";
                data["username"] = data.email

                code = commonServiceObj.getUniqueCode();
                data.code = code;

                let sellerCode = Math.floor(Math.random() * 9999998) + 1000099;

                data.code = sellerCode;
                data.sellerCode = "CP_" + sellerCode;
                data.userUniqueId = "CP_" + sellerCode;

                return API.Model(Users).create(data).then(function (user) {
                    context.id = user.username;
                    context.type = 'Email';
                    if (data.franchisee) {
                        var updateMarketQuery = {}
                        updateMarketQuery.id = data.franchisee

                        var updateMarketData = {}
                        updateMarketData.CP = user.id
                        Market.update(updateMarketQuery, updateMarketData).then(function (updatedMarket) {
                            return Tokens.generateToken({ user_id: user.id, client_id: Tokens.generateTokenString() })
                        });
                    } else {
                        return Tokens.generateToken({ user_id: user.id, client_id: Tokens.generateTokenString() })
                    }
                }).then(function (token) {

                    return emailGeneratedCode({
                        username: data.username,
                        password: data.password,
                        firstName: data.firstName
                    });

                    /*return {
                         "success": true,
                         "data": {
                             "code": 200,
                             "message": constantObj.franchisee.FRANCHISEE_ADDED, 
                             "key": 'FRANCHISEE_ADDED'
                         } 
                     };*/
                });
            }
        })
    },

    updateFarmerFranchisee: function (data, context) {
        if (id == undefined) {
            return { "success": false, "error": { "code": 412, "message": "Please provide user id" } };
        } else if (farmerFranchisee == undefined) {
            return { "success": false, "error": { "code": 412, "message": "Please provide market id" } };
        } else {
            return Users.findOne({ id: data.id }).then(function (user) {
                if (user && user.roles == 'U' && (user.userType == 'farmer' || user.userType == 'both')) {
                    return Users.update({ id: data.id }, { farmerFranchisee: data.farmerFranchisee }).then(function (us) {
                        return { success: true, code: 200, message: "Franchisee assigned successfully", data: us };
                    })
                } else {
                    return { "success": false, "error": { "code": 412, "message": "Invalid user" } };
                }
            })
        }
    },
    registerDealer: function (data, context) {
        var date = new Date();

        if ((!data.firstName) || typeof data.firstName == undefined) {
            return { "success": false, "error": { "code": 404, "message": constantObj.messages.FIRSTNAME_REQUIRED, key: 'FIRSTNAME_REQUIRED' } };
        }
        if ((!data.lastName) || typeof data.lastName == undefined) {
            return { "success": false, "error": { "code": 404, "message": constantObj.messages.LASTNAME_REQUIRED, key: 'LASTNAME_REQUIRED' } };
        }
        if ((!data.email) || typeof data.email == undefined) {
            return { "success": false, "error": { "code": 404, "message": constantObj.messages.WRONG_USERNAME } };
        }
        if ((!data.mobile) || typeof data.mobile == undefined) {
            return { "success": false, "error": { "code": 404, "message": constantObj.messages.MOBILE_REQUIRED, key: 'MOBILE_REQUIRED' } };
        }
        if ((!data.dealerManufacturer) || typeof data.dealerManufacturer == undefined) {
            return { "success": false, "error": { "code": 404, "message": "Manufacturer is missing" } };
        }
        if ((!data.dealerDealsIn) || typeof data.dealerDealsIn == undefined || data.dealerDealsIn.length == 0) {
            return { "success": false, "error": { "code": 404, "message": "Dealer deals in is missing" } };
        }
        if ((!data.dealerLicenceNumber) || typeof data.dealerLicenceNumber == undefined) {
            return { "success": false, "error": { "code": 404, "message": "Dealer licence is not given." } };
        }

        return Users.findOne({ username: data.username }).then(function (user) {

            if (user !== undefined) {
                return { "success": false, "error": { "code": 301, "message": constantObj.messages.USER_EXIST, key: 'USER_EXIST' } };
            } else {

                data['roles'] = 'DLR';

                if (!data['password']) {
                    data['password'] = generatePassword();
                    // data['password'] = 123456789;
                }

                data['date_registered'] = date;
                data['date_verified'] = date;
                data['isVerified'] = "Y";
                data['addedBy'] = context.identity.id;

                if (data.mobile) {
                    if (typeof data.mobile == 'string') {
                        var phExpression = /^\d+$/;
                        if (data.mobile.match(phExpression)) {
                            if (data.mobile.length > 10 || data.mobile.length < 10) {
                                return { "success": false, "error": { "code": 412, "message": constantObj.messages.PHONE_NUMBER, key: 'PHONE_NUMBER' } };
                            }

                            data['mobile'] = data.mobile;

                        } else {
                            return { "success": false, "error": { "code": 412, "message": constantObj.messages.PHONE_INVALID, key: 'PHONE_INVALID' } };
                        }
                    } else {
                        var mobile = data.mobile.toString();
                        if (mobile.length > 10 || mobile.length < 10) {
                            return { "success": false, "error": { "code": 412, "message": constantObj.messages.PHONE_NUMBER, key: 'PHONE_NUMBER' } };
                        } else {
                            data['mobile'] = data.mobile;
                        }
                    }
                }
                data["fullName"] = data.firstName + ' ' + data.lastName;
                data["status"] = "active";
                data["username"] = data.email

                // code = commonServiceObj.getUniqueCode();
                // data.code = code;

                let sellerCode = Math.floor(Math.random() * 9999998) + 1000099;

                data.code = sellerCode;
                data.sellerCode = "DLR_" + sellerCode;
                data.userUniqueId = "DLR_" + sellerCode;

                return API.Model(Users).create(data).then(function (user) {
                    context.id = user.username;
                    context.type = 'Email';

                    return Tokens.generateToken({ user_id: user.id, client_id: Tokens.generateTokenString() })

                }).then(function (token) {

                    return emailGeneratedCode({
                        username: data.username,
                        password: data.password,
                        firstName: data.firstName
                    });

                    /*return {
                         "success": true,
                         "data": {
                             "code": 200,
                             "message": constantObj.franchisee.FRANCHISEE_ADDED, 
                             "key": 'FRANCHISEE_ADDED'
                         } 
                     };*/
                });
            }
        })
    },
};