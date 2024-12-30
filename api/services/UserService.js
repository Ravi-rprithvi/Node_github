/**
  * #DESC:  In this class/files EndUser related functions
  * #Author: Rishabh Gupta
  */
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var bcrypt = require('bcrypt-nodejs');
var constantObj = sails.config.constants;
var commonServiceObj = require('./commonService');
var transport = nodemailer.createTransport(smtpTransport({
    host: sails.config.appSMTP.host,
    port: sails.config.appSMTP.port,
    debug: sails.config.appSMTP.debug,
    auth: {
        user: sails.config.appSMTP.auth.user, //access using /congig/appSMTP.js
        pass: sails.config.appSMTP.auth.pass
    }
}));
emailGeneratedPassword = function (options) { //email generated code 
    var url = options.verifyURL,
        email = options.email,
        password = options.password;

    message = 'Hello ';
    message += options.firstName;
    message += '<br/>';
    message += 'Your new password has been created successfully';
    message += '<br/><br/>';
    message += 'Email Id : ' + email;
    message += '<br/>';
    message += 'Password : ' + password;

    transport.sendMail({
        from: sails.config.appSMTP.auth.user,
        to: email,
        subject: 'FarmX password reset',
        html: message
    }, function (err, info) {

    });

    return {
        success: true,
        data: {
            "message": "Password has been sent to Email"
        }
    }
};
var emailVerifyLink = function (options, cb) {

    var url = options.verifyURL,
        email = options.email,

        message = 'Hello!';
    message += options.firstName;
    message += '<br/><br/>';
    message += 'We heard that you lost your FarmX password. Please click on link to reset your password.';
    message += '<br/><br/>';
    message += '<a href="' + options.verifyURL + '" target="_blankh" >Click here to set new password</a>';
    message += '<br/><br/>';
    message += 'Regards';
    message += '<br/><br/>';
    message += 'FarmX Support Team';

    let msg = '';
    transport.sendMail({
        from: sails.config.appSMTP.auth.user,
        to: email,
        subject: 'FarmX password reset',
        html: message

    }, function (err, info) {
        if (err) {
            //msg = "There is some error to send mail to your email id.";
            console.log(err);
            return cb(err);
        } else {
            console.log(info, 'info===')
            return cb(null, info)
            //msg = "Link for reset passwork has been sent to your email id.";
        }
    });
    return cb();
};

var newEmailVerifyLink = function (options, cb) {

    var url = options.verifyURL,
        email = options.email,

        message = 'Hello!';
    message += options.firstName;
    message += '<br/><br/>';
    message += 'You have changed your email. To verify new email, click on the link given below.';
    message += '<br/><br/>';
    message += '<a href="' + options.verifyURL + '" target="_blankh" >Click and verify</a>';
    message += '<br/><br/>';
    message += 'Regards';
    message += '<br/><br/>';
    message += 'FarmX Support Team';

    let msg = '';
    transport.sendMail({
        from: sails.config.appSMTP.auth.user,
        to: email,
        subject: 'FarmX verify email',
        html: message

    }, function (err, info) {
        console.log("err === ", err)
    });
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

module.exports = {
    emailGeneratedPassword: emailGeneratedPassword, //emailgeneratecode()
    generatePassword: generatePassword,   //generatepassword()
    forgotPassword: function (data, context) {
        return Users.findOne({ email: data.email })
            .then(function (data) {
                if (data === undefined) {
                    return {
                        success: false,
                        error: {
                            "code": 404,
                            "message": "No such user exist"
                        }
                    }
                }
                else {
                    var password = generatePassword()
                    var encryptedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
                    return Users.update({ email: data.email }, { encryptedPassword: encryptedPassword })
                        .then(function (data) {
                            return emailGeneratedPassword({
                                email: data[0].email,
                                password: password,
                                firstName: data[0].firstName,
                                verifyURL: sails.config.security.server.url + "/users/verify/" + data[0].email + "?code=" + data[0].password,
                            })
                        })
                }

            })
    },
    userForgotPassword: function (data, context) {
        let qry = {}
        qry.$or = [{ email: data.email }, { mobile: data.email }]
        return Users.findOne(qry)
            .then(function (user) {
                if (user) {
                    let options = {
                        email: data.email,
                        firstName: user.firstName,
                        // verifyURL:sails.config.PAYTM_FRONT_WEB_URL + "/#/resetpassword/"+user.id
                        verifyURL: sails.config.PAYTM_FRONT_WEB_URL + "/resetpassword/" + user.id
                    }
                    let isMobile = true
                    if (user.email == data.email) {
                        isMobile = false
                    }

                    if (isMobile) {
                        var OTP = Math.floor(1000 + Math.random() * 9000);
                        var newUpdates = {}
                        newUpdates['otp'] = OTP;
                        newUpdates['otpTime'] = new Date()

                        return Users.update({ id: user.id }, newUpdates).then(function (newuser) {
                            let smsInfo = {}
                            smsInfo.otp = newuser[0].otp
                            smsInfo.numbers = [newuser[0].mobile]

                            commonServiceObj.sendLoginOTPSMS(smsInfo)
                            return {
                                "success": true,
                                data: {
                                    "id": newuser[0].id,
                                    "mobile": newuser[0].mobile, isMobile: isMobile,
                                    "message": "OTP is sent at your registered number."
                                }
                            };
                        });

                    } else {
                        return emailVerifyLink(options, function (error, success) {
                            if (error) {
                                return {
                                    success: false,
                                    data: {
                                        message: constantObj.messages.ERROR_MAIL,
                                        key: "ERROR_MAIL"
                                        //"message": "There is some error to send mail to your email id."
                                    }
                                }
                            } else {
                                return {
                                    success: true,
                                    data: {
                                        message: constantObj.messages.LINK_MAIL,
                                        key: "LINK_MAIL",
                                        isMobile: isMobile
                                        //"message": "Link for reset passwork has been sent to your email id. "
                                    }
                                }

                            }
                        })
                    }
                }
                else {
                    return {
                        success: false,
                        error: {
                            "code": 404,
                            message: constantObj.messages.INVALID_USER,
                            key: "INVALID_USER"
                            //"message": "No such user exist"
                        }
                    }
                }



            })
    },

    changePassword: function (data, context) {

        let newPassword = data.newPassword;
        let confirmPassword = data.confirmPassword;
        let currentPassword = data.currentPassword;

        let query = {};
        query.id = context.identity.id;

        return Users.findOne(query).then(function (user) {
            if (!bcrypt.compareSync(currentPassword, user.password)) {
                return { "success": false, "error": { "code": 404, "message": constantObj.messages.CURRENT_PASSWORD, key: 'CURRENT_PASSWORD' } };
            } else {
                if (newPassword != confirmPassword) {
                    return { "success": false, "error": { "code": 404, "message": "new password and confirmPassword does not match", key: 'WRONG_PASSWORD' } };
                } else {
                    var encryptedPassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));
                    return Users.update({ id: context.identity.id }, { encryptedPassword: encryptedPassword }).then(function (user) {
                        return { "success": true, "code": 200, message: constantObj.messages.PASSWORD_CHANGED, Key: "PASSWORD_CHANGED" };
                    });
                }
            }
        });
    },

    setpassword: function (data, context) {

        let newPassword = data.newPassword;
        let confirmPassword = data.confirmPassword;

        let query = {};
        query.id = data.id;

        return Users.findOne(query).then(function (user) {
            if (newPassword != confirmPassword) {
                return { "success": false, "error": { "code": 404, "message": "New password and confirm password does not match", key: 'WRONG_PASSWORD' } };
            } else {
                var encryptedPassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));
                return Users.update({ id: data.id }, { encryptedPassword: encryptedPassword }).then(function (user) {
                    return { "success": true, "code": 200, message: constantObj.messages.PASSWORD_CHANGED, Key: "PASSWORD_CHANGED" };
                });
            }
        });
    },

    resendLoginOTP: function (data, context) {
        let query = {};
        query.id = data.id;

        return Users.findOne(query).then(function (user) {
            if (user) {
                if (user.mobile != data.mobile) {
                    return { "success": false, "error": { "code": 404, "message": "Given mobile number does not math." } };
                } else {
                    let smsInfo = {}
                    smsInfo.otp = user.otp
                    smsInfo.numbers = [user.mobile]

                    commonServiceObj.sendLoginOTPSMS(smsInfo)
                    return Users.update({ id: data.id }, { otpTime: new Date() }).then(function (user) {
                        return { "success": true, "code": 200, "message": "OTP is resent at your registered number." };
                    });
                }
            } else {
                return { "success": false, "error": { "code": 301, "message": "User does not exists." } };
            }
        });
    },

    resendRegisterationOTP: function (data, context) {
        let query = {};
        query.id = data.id;

        return Users.findOne(query).then(function (user) {
            if (user) {
                if (user.isVerified == 'Y' && user.status == 'active' && user.isMobileVerified == true) {
                    return { "success": false, "error": { "code": 301, "message": "Your mobile number already verified. You can directly login." }, "data": { "id": user.id, "mobile": user.mobile, "fullName": user.fullName } };
                } else {
                    // console.log("user == ", user.otp)
                    // console.log("user2 == ", user.mobile)
                    var existingotp = user.otp
                    if (existingotp == undefined || existingotp == null) {
                        existingotp = Math.floor(1000 + Math.random() * 9000);
                    }
                    let smsInfo = {}
                    smsInfo.otp = existingotp
                    smsInfo.numbers = [user.mobile]

                    commonServiceObj.sendNumberVerificationSMS(smsInfo)

                    var newUpdates = {}
                    newUpdates['otp'] = existingotp;
                    newUpdates['otpTime'] = new Date()

                    return Users.update({ id: data.id }, newUpdates).then(function (user) {
                        return { "success": true, "code": 200, "message": "OTP is resent at your registered number." };
                    });
                }
            } else {
                return { "success": false, "error": { "code": 301, "message": "User does not exists." } };
            }
        });
    },

    changeRegisterationNumberForOTP: function (data, context) {
        let query = {};
        query.id = data.id;
        // query.mobile = data.mobile;

        return Users.findOne({ mobile: data.mobile, $or: [{ roles: 'U' }, { roles: 'CP' }, { roles: 'FGM' }] }).then(function (user) {
            if (user) {
                if (user.id == data.id) {
                    if (user.isVerified == 'Y' && user.status == 'active' && user.isMobileVerified == true) {
                        return { "success": false, "error": { "code": 301, "message": "Your mobile number already verified. You can directly login." }, "data": { "id": user.id, "mobile": user.mobile, "fullName": user.fullName } };
                    } else {
                        return { "success": false, "error": { "code": 301, "message": "Given phone number is same as you provided earlier." } };
                    }
                } else {
                    return { "success": false, "error": { "code": 301, "message": "Given phone number already exist for another user." } };
                }
            } else {
                return Users.count(query).then(function (usercount) {
                    if (usercount > 0) {
                        var OTP = Math.floor(1000 + Math.random() * 9000);
                        var newUpdates = {}
                        newUpdates['otp'] = OTP;
                        newUpdates['otpTime'] = new Date()
                        newUpdates['mobile'] = data.mobile
                        newUpdates['isMobileVerified'] = false

                        return Users.update({ id: data.id }, newUpdates).then(function (newuser) {
                            let smsInfo = {}
                            smsInfo.otp = newuser[0].otp
                            smsInfo.numbers = [newuser[0].mobile]

                            commonServiceObj.sendNumberVerificationSMS(smsInfo)
                            return { "success": true, "code": 200, "message": "OTP is sent at your registered number.", "data": { "id": newuser[0].id, "mobile": newuser[0].mobile, "fullName": newuser[0].fullName } };
                        });
                    } else {
                        return { "success": false, "error": { "code": 301, "message": "User does not exists." } };
                    }
                }).fail(function (err) {
                    return { "success": false, "error": { "code": 301, "message": err } };
                })
            }
        })

        // return Users.findOne(query).then(function(user) {
        //     if (user) {            
        //         if (user.isVerified == 'Y' && user.status == 'active' && user.isMobileVerified == true) {
        //             return {"success": false, "error": {"code": 301,"message": "Your mobile number already verified. You can directly login."}, "data": {"id":user.id, "mobile":user.mobile, "fullName": user.fullName} };
        //         } else {
        //             return Users.findOne({id:{$ne:data.id}, mobile: data.mobile, $or:[{roles:'U'},{roles:'CP'},{roles:'FGM'}}).then(function(user) {
        //                 if (user) {
        //                     return {"success": false, "error": {"code": 301,"message": "Given phone number already exist."} };
        //                 } else {
        //                     var OTP = Math.floor(1000 + Math.random() * 9000);
        //                     var newUpdates = {}
        //                     newUpdates['otp'] = OTP;
        //                     newUpdates['otpTime'] = new Date()
        //                     newUpdates['mobile'] = data.mobile

        // return Users.update({id: data.id},newUpdates).then(function (newuser) {
        //     let smsInfo = {}            
        //     smsInfo.otp = newuser[0].otp
        //     smsInfo.numbers = [newuser[0].mobile]

        //     commonServiceObj.sendNumberVerificationSMS(smsInfo)
        //     return {"success": true, "code": 200, "message": "OTP is sent at your registered number." };
        // });
        //                 }
        //             })
        //         }
        //     } else {
        //         return {"success": false, "error": {"code": 301,"message": "User does not exists."} };
        //     }
        // });      
    },

    changeMobileNumber: function (data, context) {
        let query = {};
        query.id = data.id;
        // query.mobile = data.mobile;

        return Users.findOne({ mobile: data.mobile, $or: [{ roles: 'U' }, { roles: 'CP' }, { roles: 'FGM' }] }).then(function (user) {
            if (user) {
                if (user.id == data.id) {
                    return { "success": false, "error": { "code": 301, "message": "Given phone number is same as you provided earlier." } };
                } else {
                    return { "success": false, "error": { "code": 301, "message": "Given phone number already exist for another user." } };
                }
            } else {
                return Users.count(query).then(function (usercount) {
                    if (usercount > 0) {
                        var OTP = Math.floor(1000 + Math.random() * 9000);
                        var newUpdates = {}
                        newUpdates['otp'] = OTP;
                        newUpdates['otpTime'] = new Date()
                        newUpdates['mobile'] = data.mobile
                        newUpdates['isMobileVerified'] = false

                        return Users.update({ id: data.id }, newUpdates).then(function (newuser) {
                            let smsInfo = {}
                            smsInfo.otp = newuser[0].otp
                            smsInfo.numbers = [newuser[0].mobile]
                            commonServiceObj.sendNumberVerificationSMS(smsInfo)
                            return Tokens.destroy({ user_id: newuser.id }).then(function (dt) {
                                return Userslogin.update({ user: newuser.id }, {/*access_token:null, */loggedIn: false }).then(function () {
                                    return { "success": true, "code": 200, "message": "OTP is sent at your registered number.", "data": { "id": newuser[0].id, "mobile": newuser[0].mobile, "fullName": newuser[0].fullName } };
                                })
                            })
                        });
                    } else {
                        return { "success": false, "error": { "code": 301, "message": "User does not exists." } };
                    }
                }).fail(function (err) {
                    return { "success": false, "error": { "code": 301, "message": err } };
                })
            }
        })
    },

    resendEmailVerificationLink: function (data, context) {
        let query = {};
        query.id = data.id;

        return Users.findOne(query).then(function (user) {
            if (user) {
                if (user.username == undefined || user.username == null) {
                    return { "success": false, "error": { "code": 301, "message": "Emaiil not available. Please edit profile to add email" } };
                } else {
                    if (user.isEmailVerified == true) {
                        return { "success": false, "error": { "code": 301, "message": "Your email is already verified." } };
                    } else {
                        // console.log("user == ", user.otp)
                        // console.log("user2 == ", user.mobile)
                        newEmailVerifyLink({
                            id: data.id,
                            type: "Email",
                            username: user.username,
                            firstName: user.firstName,
                            verifyURL: sails.config.PAYTM_API_URL + "/user/verification/" + user.code
                        });

                        return { "success": true, "code": 200, "message": "Email is sent at given email id. Please check email." };
                    }
                }
            } else {
                return { "success": false, "error": { "code": 301, "message": "User does not exists." } };
            }
        });
    },

    updateUser: function (data, context) {
        var query = {}
        query.id = data.id;

        let orqry = []
        if (data.username != undefined && data.username.length > 0) {
            orqry.push({ username: data.username })
            orqry.push({ email: data.username })
        } else {
            if (data.username != undefined) {
                delete data.username
            }
        }
        if (data.email) {
            data.username = data.email
        } else if (data.username) {
            data.email = data.username
        }

        if (data.email != undefined && data.email != null && data.email != '' && data.email != 'undefined') {
            orqry.push({ email: data.email })
            orqry.push({ username: data.email })
            data.username = data.email
        } else if (data.username != undefined && data.username != null && data.username != '' && data.username != 'undefined') {
            orqry.push({ email: data.username })
            orqry.push({ username: data.username })
            data.email = data.username
        }

        if (data.username == '') {
            data.username = undefined
            data.email = undefined
        }
        if (data.email == '') {
            data.username = undefined
            data.email = undefined
        }

        if (data.mobile != undefined) {
            orqry.push({ mobile: data.mobile })
        }

        let shouldchangeemail = false

        delete data.state
        delete data.district
        delete data.password
        delete data.encryptedPassword


        return Users.findOne(query).then(function (user) {

            if (user == undefined) {
                return { "success": false, "error": { "code": 404, "message": "User not found" } };
            } else {
                if (orqry.length > 0) {
                    let fndUsrQry = {}
                    fndUsrQry.$or = orqry
                    fndUsrQry.id = { $ne: data.id }
                    if (data.roles != undefined) {
                        fndUsrQry.roles = data.roles
                    } else {
                        fndUsrQry.roles = user.roles
                    }
                    return Users.find(fndUsrQry).then(function (usrs) {
                        if (usrs.length > 0) {
                            if (data.mobile != undefined && parseInt(data.mobile) == usrs[0].mobile) {
                                return { "success": false, "error": { "code": 404, "message": "Mobile number already exists for some other user" } };
                            } else {
                                return { "success": false, "error": { "code": 404, "message": "Email already exists for some other user" } };
                            }
                        } else {
                            if (data.mobile != undefined && parseInt(data.mobile) != user.mobile) {
                                data['isMobileVerified'] = false
                            }
                            if (data.username != undefined && data.email != null && data.email != '' && data.email != 'undefined' && data.username != user.username) {
                                data['isEmailVerified'] = false
                                shouldchangeemail = true
                                data.email = data.username
                            }
                            if (data.email != undefined && data.email != user.email) {
                                data['isEmailVerified'] = false
                                shouldchangeemail = true
                                data.username = data.email
                            }

                            if (data.pincode != undefined && parseInt(data.pincode) != user.pincode) {

                                return commonService.getDataFromPincode(data.pincode).then(function (pincodeInfo) {
                                    let pincodeData = pincodeInfo;
                                    if (pincodeData == 'error') {
                                        return {
                                            success: false,
                                            code: 400,
                                            message: 'please enter valid pincode.'
                                        };
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




                                    if (user.roles == "U") {
                                        var franchiseeQry = {}
                                        franchiseeQry.$and = [{ GM: { $ne: undefined } }, { GM: { $ne: null } }]

                                        franchiseeQry.pincode = { "$in": [parseInt(data.pincode)] }
                                        return Market.findOne(franchiseeQry).then(function (franchisee) {
                                            if (franchisee && ((data.userType != undefined && (data.userType == 'farmer' || data.userType == 'both')) || (user.userType != undefined && (user.userType == 'farmer' || user.userType == 'both')))) {
                                                data['farmerFranchisee'] = franchisee.id
                                            }


                                            return Users.update(query, data).then(function (updatedUser) {

                                                if (data.isMobileVerified == false) {
                                                    return Tokens.destroy({ user_id: data.id }).then(function (dt) {
                                                        return Userslogin.update({ user: data.id }, {/*access_token:null, */loggedIn: false }).then(function () {
                                                            return {
                                                                "success": true,
                                                                "data": {
                                                                    "user": updatedUser[0],
                                                                    "message": "User updated but given mobile number is not verified, so you have been logged out. Please login again and verify your number."
                                                                }
                                                            }
                                                        })
                                                    })
                                                } else if (shouldchangeemail == true) {
                                                    newEmailVerifyLink({
                                                        id: data.id,
                                                        type: "Email",
                                                        username: data.username,
                                                        firstName: user.firstName,
                                                        verifyURL: sails.config.PAYTM_API_URL + "/user/verification/" + user.code
                                                    });
                                                    return {
                                                        "success": true,
                                                        "data": {
                                                            "user": updatedUser[0],
                                                            "message": "User updated but given new email is not verified. Please verify by clicking the link sent at your given emial."
                                                        }
                                                    }
                                                } else {
                                                    return {
                                                        "success": true,
                                                        "data": {
                                                            "user": updatedUser[0],
                                                            "message": constantObj.franchisee.UPDATED_SUCCESSFULLY,
                                                            "key": "UPDATED_SUCCESSFULLY"
                                                        }
                                                    }
                                                }
                                            })
                                        })
                                    } else {

                                        return Users.update(query, data).then(function (updatedUser) {
                                            return {
                                                "success": true,
                                                "data": {
                                                    "user": updatedUser[0],
                                                    "message": constantObj.franchisee.UPDATED_SUCCESSFULLY,
                                                    "key": "UPDATED_SUCCESSFULLY"
                                                }
                                            }
                                        })
                                    }


                                })

                            } else {
                                if (user.roles == 'U') {
                                    return Users.update(query, data).then(function (updatedUser) {
                                        if (data.isMobileVerified == false) {
                                            return Tokens.destroy({ user_id: data.id }).then(function (dt) {
                                                return Userslogin.update({ user: data.id }, {/*access_token:null, */loggedIn: false }).then(function () {
                                                    return {
                                                        "success": true,
                                                        "data": {
                                                            "user": updatedUser[0],
                                                            "message": "User updated but given mobile number is not verified, so you have been logged out. Please login again and verify your number."
                                                        }
                                                    }
                                                })
                                            })
                                        } else if (shouldchangeemail == true) {
                                            newEmailVerifyLink({
                                                id: data.id,
                                                type: "Email",
                                                username: data.username,
                                                firstName: user.firstName,
                                                verifyURL: sails.config.PAYTM_API_URL + "/user/verification/" + user.code
                                            });
                                            return {
                                                "success": true,
                                                "data": {
                                                    "user": updatedUser[0],
                                                    "message": "User updated but given new email is not verified. Please verify by clicking the link sent at your given emial."
                                                }
                                            }
                                        } else {
                                            return {
                                                "success": true,
                                                "data": {
                                                    "user": updatedUser[0],
                                                    "message": constantObj.franchisee.UPDATED_SUCCESSFULLY,
                                                    "key": "UPDATED_SUCCESSFULLY"
                                                }
                                            }
                                        }
                                    })
                                } else {
                                    console.log(data, 'data===')
                                    delete data.encryptedPassword;
                                    return Users.update(query, data).then(function (updatedUser) {
                                        return {
                                            "success": true,
                                            "data": {
                                                "user": updatedUser[0],
                                                "message": constantObj.franchisee.UPDATED_SUCCESSFULLY,
                                                "key": "UPDATED_SUCCESSFULLY"
                                            }
                                        };
                                    })
                                }
                            }
                        }
                    })
                } else {
                    if (user.roles == "U") {
                        if (parseInt(data.pincode) != parseInt(user.pincode)) {
                            var franchiseeQry = {}
                            franchiseeQry.$and = [{ GM: { $ne: undefined } }, { GM: { $ne: null } }]

                            franchiseeQry.pincode = { "$in": [parseInt(data.pincode)] }
                            return Market.findOne(franchiseeQry).then(function (franchisee) {
                                if (franchisee && ((data.userType != undefined && (data.userType == 'farmer' || data.userType == 'both')) || (user.userType != undefined && (user.userType == 'farmer' || user.userType == 'both')))) {
                                    data['farmerFranchisee'] = franchisee.id
                                }


                                return Users.update(query, data).then(function (updatedUser) {
                                    return {
                                        "success": true,
                                        "data": {
                                            "user": updatedUser[0],
                                            "message": constantObj.franchisee.UPDATED_SUCCESSFULLY,
                                            "key": "UPDATED_SUCCESSFULLY"
                                        }
                                    };
                                })
                            })
                        } else {
                            return Users.update(query, data).then(function (updatedUser) {
                                return {
                                    "success": true,
                                    "data": {
                                        "user": updatedUser[0],
                                        "message": constantObj.franchisee.UPDATED_SUCCESSFULLY,
                                        "key": "UPDATED_SUCCESSFULLY"
                                    }
                                };
                            })
                        }
                    } else {

                        return Users.update(query, data).then(function (updatedUser) {
                            return {
                                "success": true,
                                "data": {
                                    "user": updatedUser[0],
                                    "message": constantObj.franchisee.UPDATED_SUCCESSFULLY,
                                    "key": "UPDATED_SUCCESSFULLY"
                                }
                            };
                        })
                    }
                }
            }
        })
    },

    updateFranchiseeUser: function (data, context) {
        var query = {}
        query.id = data.id;

        return Users.findOne(query).then(function (user) {
            if (user.roles == "FGM") {
                var removefranchiseequery = {}
                removefranchiseequery.id = user.franchisee

                var marketDataToRemove = {}
                marketDataToRemove.GM = null

                return Market.update(removefranchiseequery, marketDataToRemove).then(function (removedMarket) {
                    return Users.update(query, data).then(function (updatedUser) {
                        if (data.franchisee) {
                            var marketUpdateQuery = {}
                            marketUpdateQuery.id = data.franchisee

                            var marketDataToUpdate = {}
                            marketDataToUpdate.GM = data.id

                            return Market.update(marketUpdateQuery, marketDataToUpdate).then(function (updatedMarket) {
                                return {
                                    "success": true,
                                    "data": {
                                        "message": constantObj.franchisee.UPDATED_SUCCESSFULLY,
                                        "key": "UPDATED_SUCCESSFULLY"
                                    }
                                };
                            })
                        } else {
                            return {
                                "success": true,
                                "data": {
                                    "message": constantObj.franchisee.UPDATED_SUCCESSFULLY,
                                    "key": "UPDATED_SUCCESSFULLY"
                                }
                            };
                        }
                    })
                })
            }
        })
    },

    updateCP: function (data, context) {
        var query = {}
        query.id = data.id;

        return Users.findOne(query).then(function (user) {
            if (user.roles == "CP") {
                var removecpquery = {}
                removecpquery.id = user.franchisee

                var marketDataToRemove = {}
                marketDataToRemove.CP = null

                return Market.update(removecpquery, marketDataToRemove).then(function (removedMarket) {
                    return Users.update(query, data).then(function (updatedUser) {
                        if (data.franchisee) {
                            var marketUpdateQuery = {}
                            marketUpdateQuery.id = data.franchisee

                            var marketDataToUpdate = {}
                            marketDataToUpdate.CP = data.id

                            return Market.update(marketUpdateQuery, marketDataToUpdate).then(function (updatedMarket) {
                                return {
                                    "success": true,
                                    "data": {
                                        "message": constantObj.cpartners.UPDATED_CPARTNER
                                    }
                                };
                            })
                        } else {
                            return {
                                "success": true,
                                "data": {
                                    "message": constantObj.cpartners.UPDATED_CPARTNER
                                }
                            };
                        }
                    })
                })
            } else {
                return { "success": false, "error": { "code": 404, "message": "User is not CP" } };
            }
        })
    },


    updateDealer: function (data, context) {
        var query = {}
        query.id = data.id;

        return Users.findOne(query).then(function (user) {
            if (user.roles == "DLR") {
                return Users.update(query, data).then(function (updatedUser) {
                    return {
                        "success": true,
                        "data": {
                            "message": "Dealer updated successfully."
                        }
                    };
                })
            } else {
                return { "success": false, "error": { "code": 404, "message": "User is not DLR" } };
            }
        }).fail(function (err) {
            return { "success": false, "error": { "code": 404, "message": err } };
        })
    },

};
