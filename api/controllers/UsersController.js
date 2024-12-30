/**
 * UsersController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var constantObj = sails.config.constants;
var ObjectId = require('mongodb').ObjectID;
var pushService = require('./../services/PushService');
module.exports = {
    resendEmailVerificationLink: function (req, res) {
        API(UserService.resendEmailVerificationLink, req, res);
    },
    updateUser: function (req, res) {
        API(UserService.updateUser, req, res);
    },

    updateFarmerFranchisee: function (req, res) {
        API(Registration.updateFarmerFranchisee, req, res);
    },

    index: function (req, res) {
        API(Registration.registerUser, req, res);
    },

    register: function (req, res) {
        API(Registration.registerUser, req, res);
    },

    notifi: function (req, res) {

        console.log("fdddddddddddddsfdf", req.body);

        pushService.sendPush(req.body);

    },
    addFranchisee: function (req, res) {
        API(Registration.saveFranchisee, req, res);
    },

    addCP: function (req, res) {
        API(Registration.saveCP, req, res);
    },

    addDealer: function (req, res) {
        API(Registration.registerDealer, req, res);
    },

    /****
    * @Desc : Method use for sign up user via mobile. its sign up API for mobile.
    * @Params: post by mobile team
    * @return  :  Success and data
    * @Author: Rohitk.kumar
    ***/
    signup: function (req, res) {
        API(Registration.signupUser, req, res);
    },
    /****
   * @Desc : Method use for sign in user via mobile. its sign in API for mobile.
   * @Params: username password and device token
   * @return  :  Success and data
   * @Author: Rohitk.kumar
   ***/
    signin: function (req, res) {
        API(Registration.signinUser, req, res);
    },

    signinCP: function (req, res) {
        API(Registration.signinCP, req, res);
    },

    signindealer: function (req, res) {
        API(Registration.signinDealer, req, res);
    },

    /****
    * @Desc : Method use for Verify user OTP
    * @Params: OTP
    * @return  :  Success and data (json ARRAY)
    * @Author: Rohitk.kumar
    ***/
    'otp/:number': function (req, res) {
        API(Registration.checkOtpUser, req, res);
    },
    'testotp/:number': function (req, res) {
        API(Registration.testotp, req, res);
    },
    logout: function (req, res) {
        if (req.identity && req.identity.id && req.authorization && req.authorization.token && req.authorization.token.access_token) {
            let userid = req.identity.id
            let access_token = req.authorization.token.access_token
            Tokens.destroy({ user_id: userid, access_token: access_token }).then(function (dt) {
                Userslogin.update({ user: userid, access_token: access_token }, {/*access_token:null, */loggedIn: false }).then(function () {
                    res.jsonx({
                        success: true,
                        data: {
                            message: "Logged out successfully"
                        },
                    });
                })
            })
        } else {
            return res.status(400).jsonx({ "success": false, "error": { "code": 400, "message": "Already logged out" } });
        }
    },
    userTypeFieldOfficerData: function (req, res) {
        var qry = {};
        qry.roles = "U"
        //qry.userType = req.param("type");

        qry.$and = [{ date_registered: { $gte: new Date(req.param('from')) } }, { date_registered: { $lte: new Date(req.param('to')) } }]

        qry.userType = { "$exists": true, "$ne": null, "$ne": "" };

        Users.native(function (err, userslist) {
            userslist.aggregate([
                {
                    $match: qry
                },
                {
                    $group: {
                        _id: "$userType",
                        count: { $sum: 1 }
                    }
                }
            ], function (err, allUsers) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: allUsers
                    });
                }
            });
        })
    },
    'verification/:code': function (req, res) {

        let verifyCode = parseInt(req.param('code'))
        //let verifyCode = parseInt(data.code);

        Users.findOne({ code: verifyCode }).then(function (user) {

            if (user == undefined) {
                return { "success": false, "error": { "code": 404, "message": constantObj.messages.INVALID_USER } };
            } else {
                if (user.isVerified == 'N') {
                    Users.update({ id: user.id }, { isVerified: 'Y', emailVerifiedDate: new Date(), date_verified: new Date(), status: "active", isEmailVerified: true }).exec(function (usererr, userInfo) {
                        if (userInfo) {
                            return res.redirect(sails.config.PAYTM_FRONT_WEB_URL + "/#/login;verify=true");
                        } else {
                            return { "success": false, "error": { "code": 404, "message": constantObj.messages.INVALID_USER, "key": "INVALID_USER" } };
                        }
                    })
                } else {
                    // return res.redirect(sails.config.PAYTM_FRONT_WEB_URL + "/#/login;verify=alreadyverified");
                    return res.redirect(sails.config.PAYTM_FRONT_WEB_URL + "/login;verify=alreadyverified");
                    //return {"success": false, "error": {"code": 404,"message": constantObj.messages.ALREADY_VERIFIED, "key":"ALREADY_VERIFIED"} };
                }
            }
        });

        //API(Registration.verificationUser,req,res);
    },
    'verify/:username': function (req, res) {
        API(Registration.verifyUser, req, res);
    },
    'verify/:email': function (req, res) {
        API(UserService.verification, req, res);
    },
    current: function (req, res) {
        API(Registration.currentUser, req, res);
    },
    verifyOTPForRegistration: function (req, res) {
        API(Registration.verifyOTPForRegistration, req, res);
    },
    requestOTPForLogin: function (req, res) {
        API(Registration.requestOTPForLogin, req, res);
    },
    verifyOTPForLogin: function (req, res) {
        API(Registration.verifyOTPForLogin, req, res);
    },

    transectionOwner: function (req, res) {

        var pincode = JSON.parse(req.param('pincode'));
        var query = {};
        query.pincode = { "$in": [pincode] };


        Market.find(query)
            .then(function (m) {
                var marketIds = [];

                m.forEach(function (item) {
                    marketIds.push(item.id);
                });

                Users.find({ roleId: ObjectId(constantObj.staticRoles.ADMIN_CROP), markets: { "$in": marketIds } })
                    .then(function (u) {
                        res.jsonx({
                            success: true,
                            data: {
                                users: u
                            },
                        });
                    });
            });

    },
    add: function (req, res) {
        API(UserService.save, req, res);
    },
    changePassword: function (req, res) {
        API(UserService.changePassword, req, res);
    },
    setpassword: function (req, res) {
        API(UserService.setpassword, req, res);
    },
    forgotPassword: function (req, res) {
        API(UserService.forgotPassword, req, res);
    },
    userForgotPassword: function (req, res) {
        API(UserService.userForgotPassword, req, res);
    },
    resendRegisterationOTP: function (req, res) {
        API(UserService.resendRegisterationOTP, req, res);
    },
    changeRegisterationNumberForOTP: function (req, res) {
        API(UserService.changeRegisterationNumberForOTP, req, res);
    },
    changeMobileNumber: function (req, res) {
        API(UserService.changeMobileNumber, req, res);
    },
    resendLoginOTP: function (req, res) {
        API(UserService.resendLoginOTP, req, res);
    },

    getAllUsers: function (req, res, next) {

        var search = req.param('search');
        var sortBy = req.param('sortBy');
        var roles = req.param('roles');
        var superRoles = req.param('superRole');
        var page = req.param('page');
        var count = req.param('count');
        var status = req.param('status');
        var state = req.param('state');
        var userType = req.param('userType');
        var modernationStatus = req.param('modernationStatus');
        var isVerified = req.param('isVerified');
        var farmerFranchisee = req.param('farmerFranchisee');

        var skipNo = (page - 1) * count;
        var query = {};


        if (isVerified) {
            query.isVerified = isVerified;
        }
        if (sortBy) {

            sortBy = sortBy.toString();
        } else {
            sortBy = 'createdAt desc';
        }

        if (status) query.status = status;
        if (farmerFranchisee) query.farmerFranchisee = farmerFranchisee;

        if (state) query.state = state;

        if (modernationStatus) {
            query.status = 'active';
            query.isModerntrader = true;
            query.roles = 'U';
        }
        if (userType) {
            query.userType = userType;
        }
        if (req.param('from') && req.param('to')) {
            query.$and = [{ date_registered: { $gte: new Date(req.param('from')) } }, { date_registered: { $lte: new Date(req.param('to')) } }]
        }

        let searchQry = {}
        if (search) {
            searchQry.$or = [
                {
                    firstName: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    lastName: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    fullName: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    email: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    username: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    address: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    city: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    district: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    state: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    mobile: parseInt(search)
                },
                {
                    code: parseInt(search)
                },
                {
                    userUniqueId: {
                        'like': '%' + search + '%'
                    }
                }
            ]
        }

        if (roles && superRoles) {
            if (search) {
                query.$and = [searchQry, {
                    $or: [{
                        roles: roles
                    }, {
                        roles: superRoles
                    }]
                }]
            } else {
                query.$or = [{
                    roles: roles
                }, {
                    roles: superRoles
                }]
            }
        } else {
            query.roles = roles;
            query.$or = searchQry.$or
        }
        if (req.param('dealsWithCategory')) {
            let dealsWithCategory = JSON.parse(req.param('dealsWithCategory'));
            if (dealsWithCategory.length > 0) {
                query.dealsWithCategory = { "$in": dealsWithCategory };
            }
        }
        Users.count(query).exec(function (err, total) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                Users.find(query).populate('roleId').populate('franchisee').populate('farmerFranchisee', { select: ['name'] }).populate('reportsTo', { select: ['fullName'] }).sort(sortBy).skip(skipNo).limit(count).exec(function (err, users) {
                    if (err) {
                        return res.status(400).jsonx({
                            success: false,
                            error: err
                        });
                    } else {
                        return res.jsonx({
                            success: true,
                            data: {
                                users: users,
                                total: total
                            },
                        });
                    }
                })
            }
        })
    },
    getAdminAndSuperAdminUsersBasicDetails: function (req, res) {
        var search = req.param('search');

        var query = {};
        query.$or = [{
            roles: 'A'
        }, {
            roles: 'SA'
        }]

        query.status = 'active'

        Users.find(query, { fields: ['fullName', 'mobile', 'username'] }).exec(function (err, users) {

            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                return res.jsonx({
                    success: true,
                    data: users
                });
            }
        })
    },

    activeUsers: function (req, res, next) {

        var search = req.param('search');
        var sortBy = req.param('sortBy');
        var roles = req.param('roles');
        var multipleroles = req.param('multipleroles');
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var query = {};

        if (sortBy) {
            sortBy = sortBy.toString();
        } else {
            sortBy = 'firstName asc';
        }

        if (roles) query.roles = roles;

        if (multipleroles) {
            var mroles = JSON.parse(multipleroles);
            if (mroles.length > 0) {
                query.roles = { "$in": mroles };
            }
        }

        query.id = { $ne: req.identity.id }

        query.isDeleted = false;
        //query.isVerified = "Y";
        query.status = "active";

        if (search) {
            query.$or = [
                {
                    firstName: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    lastName: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    fullName: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    district: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    company: {
                        'like': '%' + search + '%'
                    }
                }

            ]
        }

        Users.count(query).exec(function (err, total) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                Users.find(query).populate('roleId').populate('franchisee').populate('dealerManufacturer').sort(sortBy).skip(skipNo).limit(count).exec(function (err, users) {
                    if (err) {
                        return res.status(400).jsonx({
                            success: false,
                            error: err
                        });
                    } else {
                        return res.jsonx({
                            success: true,
                            data: {
                                users: users,
                                total: total
                            },
                        });
                    }
                })
            }
        })
    },

    userProfileData: function (req, res, next) {

        let query = {};
        query.id = req.param('id');

        Users.findOne(query).populate('roleId').populate('franchisee').populate('dealerManufacturer').exec(function (err, users) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                let finalAve = 0;

                Crops.count({ seller: users.id, isDeleted: false }).then(function (cropsCount) {
                    Bids.count({ user: users.id }).then(function (bidsCount) {
                        Equipment.count({ user: users.id }).then(function (equipmentCount) {
                            Payments.count({ buyerId: users.id }).then(function (equipmentBuyCount) {
                                Rating.find({ user: users.id }).then(function (rating) {
                                    let userRating;
                                    if (rating.length > 0) {

                                        let ave = 0;
                                        let totalRcd = rating.length;

                                        rating.forEach(function (row) {
                                            ave = row.star + ave;
                                        });

                                        userRating = ave / totalRcd;
                                    } else {
                                        userRating = 0
                                    }

                                    users.cropsAddedCount = cropsCount;
                                    users.bidsPlacedCount = bidsCount;
                                    users.equipmentAddedCount = equipmentCount;
                                    users.equipmentsPurchasedCount = equipmentBuyCount;
                                    users.rating = userRating;

                                    return res.status(200).jsonx({
                                        success: true,
                                        data: users
                                    });
                                });
                            });
                        });
                    });
                });
            }
        });
    },

    usersInFranchisee: function (req, res) {

        var search = req.param('search');
        var sortBy = req.param('sortBy');
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;

        var query = {}
        query.isDeleted = false;
        query.roles = 'U'

        if (search) {
            query.$or = [
                {
                    firstName: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    lastName: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    fullName: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    district: {
                        'like': '%' + search + '%'
                    }
                },
            ]
        }

        if (req.param('pincode')) {
            var pincodes = JSON.parse(req.param('pincode'));
            if (pincodes.length > 0) {
                query.pincode = { "$in": pincodes }
            }
        }

        Users.count(query).sort(sortBy).exec(function (err, totalCount) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: err
                    }
                });
            } else {
                Users.find(query).sort(sortBy).skip(skipNo).limit(count).exec(function (error, results) {
                    if (error) {
                        return res.status(400).jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: err
                            }
                        });
                    } else {
                        Users.find(query).sort(sortBy).skip(skipNo).limit(count).exec(function (error, results) {
                            if (error) {
                                return res.status(400).jsonx({
                                    success: false,
                                    error: {
                                        code: 400,
                                        message: error
                                    }
                                });
                            } else {
                                return res.status(200).jsonx({
                                    success: true,
                                    data: {
                                        users: results,
                                        total: totalCount
                                    }
                                });
                            }
                        })
                    }
                })
            }
        })
    },

    userProfile: function (req, res) {
        var Promise = require('q');

        let query = {};
        query.id = req.param('id');

        Users.findOne(query).populate('franchisee').populate('farmerFranchisee', { select: ['name', 'GM'] }).populate('dealerManufacturer', { select: ['companyName', 'contactPerson'] }).exec(function (err, users) {
            if (users) {

                Promise.all([

                    Crops.find({ seller: users.id, isDeleted: false, isApproved: true }, { fields: ['name', 'images', 'coverImage', 'price', 'quantity', 'bidEndDate'] }).sort('createdAt desc').skip(0).limit(10).then(),

                    // Inputs.find({user:users.id, isDeleted:false,isApproved:true}).then(),

                    // Equipment.find({user:users.id}).then(), 

                    // Land.find({user:users.id}).then(), 

                    // Payments.find({buyerId:users.id}).then(),  

                    Rating.find({ user: users.id }, { fields: ['star', 'review', 'reviewer'] }).populate('reviewer', { select: ['firstName', 'lastName', 'fullName'] }).sort('createdAt desc').skip(0).limit(10).then(function (rating) {
                        let userRating;

                        if (rating.length > 0) {
                            let ave = 0;
                            let totalRcd = rating.length;

                            rating.forEach(function (row) {
                                ave = row.star + ave;
                            });

                            userRating = ave / totalRcd;
                        } else {
                            userRating = 0
                        }
                        let ratingJson = {};
                        ratingJson.rates = rating;
                        ratingJson.userRating = userRating;

                        return ratingJson;

                    }),

                    Bids.count({ user: users.id }).then(),

                    Bids.count({ user: users.id, status: "Delivered" }).then(),

                ]).spread(function (Crops, Rating, Bids_0, Bids_1) {

                    let fieldsProfile = ['firstName', 'lastName', 'username', 'mobile', 'address', 'residentialAddress', 'city', 'residentialCity', 'pincode', 'residentialPincode', 'state', 'residentialState', 'district', 'residentialDistrict', 'image', 'about', 'password', 'isMobileVerified', 'isEmailVerified']

                    if (users.roles == 'FGM') {
                        let franchiseeflds = ['kycDoc', 'pancard', 'bankName', 'bankAccountNumber', 'bankIFSCCode', 'firmName']
                        fieldsProfile = fieldsProfile.concat(franchiseeflds)
                    } else if (users.roles == 'U') {
                        let franchiseeflds = ['banks']
                        fieldsProfile = fieldsProfile.concat(franchiseeflds)
                    }

                    let blankfields = []
                    for (var i = 0; i < fieldsProfile.length; i++) {
                        if (fieldsProfile[i] == 'banks') {
                            if (users[fieldsProfile[i]] == undefined || users[fieldsProfile[i]] == null || (users[fieldsProfile[i]] != undefined && users[fieldsProfile[i]].length == 0)) {
                                blankfields.push(fieldsProfile[i])
                            }
                        } if (fieldsProfile[i] == 'isMobileVerified' || fieldsProfile[i] == 'isEmailVerified') {
                            if (users[fieldsProfile[i]] == false) {
                                blankfields.push(fieldsProfile[i])
                            }
                        } else {
                            if (users[fieldsProfile[i]] == undefined || users[fieldsProfile[i]] == null) {
                                blankfields.push(fieldsProfile[i])
                            }
                        }
                    }

                    let profilePercentage = 100 - ((blankfields.length * 100) / fieldsProfile.length)

                    if (users.farmerFranchisee && users.farmerFranchisee.GM) {
                        Users.findOne({ id: users.farmerFranchisee.GM }, { fields: ['code', 'userUniqueId', 'firstName', 'lastName', 'fullName', 'mobile', 'address', 'city', 'pincode', 'state', 'district'] }).then(function (franchiseeGM) {
                            users.farmerFranchisee.GM = franchiseeGM
                            return res.jsonx({
                                success: true,
                                data: {
                                    Users: users,
                                    Crops: Crops,
                                    Rating: Rating,
                                    TotalBids: Bids_0,
                                    SuccessfulBid: Bids_1,
                                    profilePercentage: profilePercentage,
                                    blankfields: blankfields
                                }
                            });
                        })
                    } else {
                        return res.jsonx({
                            success: true,
                            data: {
                                Users: users,
                                Crops: Crops,
                                Rating: Rating,
                                TotalBids: Bids_0,
                                SuccessfulBid: Bids_1,
                                profilePercentage: profilePercentage,
                                blankfields: blankfields
                            }
                        });
                    }

                }).fail(function (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                });
            } else {
                return res.status(400).jsonx({
                    success: false,
                    error: "User not found"
                });
            }
        })
    },
    searchUsers: function (req, res, next) {

        let search = req.param('search');
        let sortBy = 'fullName asc';

        if (search == undefined || search == null || search.length < 2) {
            return res.jsonx({
                success: true,
                data: {
                    users: []
                }
            });
        }

        let query = {};
        query.$or = [
            {
                firstName: {
                    'like': '%' + search + '%'
                }
            },
            {
                lastName: {
                    'like': '%' + search + '%'
                }
            },
            {
                fullName: {
                    'like': '%' + search + '%'
                }
            },
            {
                email: {
                    'like': '%' + search + '%'
                }
            },
            {
                mobile: parseInt(search)
            },
            {
                userUniqueId: {
                    'like': '%' + search + '%'
                }
            }
        ]

        query.roles = 'U'

        Users.find(query, { fields: ['userUniqueId', 'fullName', 'mobile', 'email'] }).sort(sortBy).exec(function (err, users) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                return res.jsonx({
                    success: true,
                    data: {
                        users: users
                    }
                });
            }
        })
    },

    userDetails: function (req, res) {
        var totalSell = 0;
        var bidQuery = {};
        var query = {};
        query.seller = req.param('id');

        Bids.count({ user: req.param('id'), status: "Delivered" }).exec(function (bidsErr, totalBuy) {

            Crops.find(query).then(function (totalCrops) {
                if (totalCrops) {
                    lengthOfCrops = totalCrops.length;

                    if (totalCrops) {
                        async.each(totalCrops, function (totalCrop, callback) {

                            var sellCrop = {};
                            sellCrop.crop = totalCrop.id;
                            sellCrop.status = 'Delivered';

                            Bids.count(sellCrop).then(function (totalSellBids) {

                                totalSell = totalSell + totalSellBids;
                                //totalSell.totalSellBids = totalSellBids;
                                callback();
                            })
                                .fail(function (error) {
                                    callback(error);
                                })

                            //     bidQuery.user = totalCrop.seller;
                            //     bidQuery.status = "Delivered";

                            /*Bids.aggregate( [
                                { $match: { $AND: [ { crop: totalCrop.id }, { status: "Delivered" } ] } },
                                { $group: { _id: null, crop:totalCrop.id } }
                            ] ).exec(function(err, data) {
                                if (err) {
                                } else {
                                }
                            })*/

                        }, function (error) {
                            if (error) {
                                return res.status(400).jsonx({
                                    success: false,
                                    error: error
                                });
                            } else {
                                return res.jsonx({
                                    success: true,
                                    data: {
                                        totalCrops: lengthOfCrops,
                                        totalBuy: totalBuy,
                                        totalSell: totalSell
                                    },
                                });
                            }
                        });
                    }
                }
            })
        })
    },

    updateFranchiseeUser: function (req, res) {
        API(UserService.updateFranchiseeUser, req, res);
    },

    updateCPUser: function (req, res) {
        API(UserService.updateCP, req, res);
    },

    updateDealerUser: function (req, res) {
        API(UserService.updateDealer, req, res);
    },
    userDashboardData: function (req, res) {
        var qry = {};
        qry.roles = "U"
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = { "$in": pincode }
            }
        }

        //        qry.$and = [{ATA: {$gte: new Date(req.param('from'))}}, {ATA: {$lte: new Date(req.param('to'))}}]

        Users.native(function (err, userslist) {
            userslist.aggregate([
                {
                    $match: qry
                },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 }
                    }
                }
            ], function (err, allUsers) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: allUsers
                    });
                }
            });
        })
    },

    userNewRegisteredData: function (req, res) {
        var qry = {};
        qry.roles = "U"
        if (req.param('pincode')) {
            var pincode = JSON.parse(req.param('pincode'));
            if (pincode.length > 0) {
                qry.pincode = { "$in": pincode }
            }
        }

        qry.$and = [{ date_registered: { $gte: new Date(req.param('from')) } }, { date_registered: { $lte: new Date(req.param('to')) } }]

        Users.native(function (err, userslist) {
            userslist.aggregate([
                {
                    $match: qry
                },
                {
                    $group: {
                        _id: "$isVerified",
                        count: { $sum: 1 }
                    }
                }
            ], function (err, allUsers) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: allUsers
                    });
                }
            });
        })
    },

    dealerDeliverableFranchisee: function (req, res) {
        var qry = {}
        qry.roles = "DLR"
        qry.id = req.identity.id

        Users.findOne(qry).then(function (userInfo) {
            if (userInfo != undefined) {
                let marketsToSend = []
                async.each(userInfo.dealerDeliveryFranchisees, function (market, callback) {
                    let mqry = {}
                    mqry.id = market
                    Market.findOne(mqry).populate('GM').then(function (mrkt) {
                        marketsToSend.push(mrkt)
                        callback()
                    }).fail(function (err) {
                        callback(err)
                    })
                }, function (error) {
                    if (error) {
                        return res.status(400).jsonx({
                            success: false,
                            error: error,
                        });
                    } else {
                        return res.jsonx({
                            success: true,
                            data: marketsToSend
                        });
                    }
                })
            } else {
                return res.status(400).jsonx({
                    success: false,
                    error: "User not found"
                })
            }
        }).fail(function (err) {
            return res.status(400).jsonx({
                success: false,
                error: err
            })
        })
    },


};