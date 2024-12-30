/**
 * Users.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

var promisify = require('bluebird').promisify;
var bcrypt = require('bcrypt-nodejs');

module.exports = {
    autoCreatedAt: true,
    autoUpdatedAt: true,

    attributes: {

        code: {
            type: 'integer',
            unique: true
        },

        // sellerCode: {
        //     type: 'string',
        //     unique: true
        // },

        userUniqueId: {
            type: 'string'
        },

        firstName: {
            type: 'string',
            required: true
        },

        lastName: {
            type: 'string',
        },

        fbId: {
            type: 'string',
            maxLength: 100
        },

        gId: {
            type: 'string',
            maxLength: 100
        },

        fullName: {
            type: 'string',
            required: true
        },

        username: {
            type: 'string',
            //unique: true,
            // required: true
        },

        mobile: {
            type: 'integer',
            maxLength: 10,
            // unique: true,
            required: true
        },

        mobile1: {
            type: 'integer',
            maxLength: 10,
        },

        mobile2: {
            type: 'integer',
            maxLength: 10,
            // unique: true,
        },

        otp: {
            type: 'integer',
            maxLength: 5,
        },

        otpTime: {
            type: 'date'
        },

        address: {
            type: 'string',
        },

        residentialAddress: {
            type: 'string',
        },

        city: {
            type: 'string',
            //required: true
        },

        residentialCity: {
            type: 'string',
            //required: true
        },

        pincode: {
            type: 'integer',
            //required: true
        },

        residentialPincode: {
            type: 'integer',
            //required: true
        },

        avgRating: {
            type: 'float',
            defaultsTo: 0.0
        },

        ratedUsersCount: {
            type: 'integer',
            defaultsTo: 0
        },

        state: {
            type: 'string',
            //required: true
        },

        residentialState: {
            type: 'string',
            //required: true
        },

        district: {
            type: 'string',
            //required: true
        },

        residentialDistrict: {
            type: 'string',
            //required: true
        },

        image: {
            type: 'string',
        },

        kycDoc: {
            type: 'string',
        },

        pancard: {
            type: 'string',
        },

        about: {
            type: 'string'
        },

        lat: {
            type: 'string',
            defaultsTo: "0",
        },

        lng: {
            type: 'string',
            defaultsTo: "0",
        },

        residentialLat: {
            type: 'string',
            defaultsTo: "0",
        },

        residentialLng: {
            type: 'string',
            defaultsTo: "0",
        },

        password: {
            type: 'string',
            required: true,
            columnName: 'encryptedPassword',
            minLength: 8
        },

        date_verified: {
            type: 'date'
        },

        isVerified: {
            type: 'string',
            enum: ['Y', 'N'],
            defaultsTo: 'N'
        },

        isMobileVerified: {
            type: 'Boolean',
            defaultsTo: false
        },

        mobileVerifiedDate: {
            type: 'date'
        },

        isEmailVerified: {
            type: 'Boolean',
            defaultsTo: false
        },

        emailVerifiedDate: {
            type: 'date'
        },

        roles: {
            type: 'string',
            enum: ['SA', 'A', 'U', 'CP', 'FGM', 'DLR'],  //DLR is Dealer type user
            defaultsTo: 'U'
            // required: true
        },

        domain: {
            type: 'string',
            enum: ['web', 'mobile']
        },

        os: {
            type: 'string',
            enum: ['ANDROID', 'IOS']
        },

        deviceToken: {
            type: 'string',
        },

        roleId: {
            model: 'roles',
        },

        markets: {
            type: 'array'
        },

        addedBy: {
            model: 'users'
        },

        uploadBy: {
            type: 'string', //sheet in case from file, fieldTransaction in case from transaction or uploaded by other portals like kelever kisan or main domain name or etc...
        },
        vendor: {
            type: 'string',// in case of kelever kisan it is fpo or and it will be consider as a vendor 
        },

        status: {
            type: 'string',
            enum: ['active', 'deactive', 'inactive'],
            defaultsTo: 'deactive'
        },

        isDeleted: {
            type: 'Boolean',
            defaultsTo: false
        },

        franchisee: {
            model: 'market'
        },

        banks: {
            type: 'array'
        },

        bankName: {
            type: 'string'
        },

        bankAccountNumber: {
            type: 'string'
        },

        bankIFSCCode: {
            type: 'string'
        },

        lastLogin: {
            type: 'date'
        },

        date_registered: {
            type: 'date'
        },
        dealerManufacturer: {
            model: 'manufacturer'
        },
        dealerDealsIn: {
            type: 'array'
        },
        dealerLicenceNumber: {
            type: 'string'
        },
        dealerLicenceIssuedBy: {
            type: 'string'
        },
        dealerDeliveryFranchisees: {
            type: 'array'
        },
        panNumber: {
            type: 'string'
        },
        gstNumber: {
            type: 'string'
        },

        firmName: {
            type: 'string'
        },
        userType: {
            type: 'string',
            enum: ['farmer', 'cropbuyer', 'both', 'unknown', 'landbuyer', 'fpo'],
            defaultsTo: 'unknown'
        },

        farmerFranchisee: {
            model: 'market'
        },

        reportsTo: {
            model: 'users'
        },
        isModerntrader: {
            type: 'Boolean',
            defaultsTo: false
        },
        selectedLanguage: {
            type: 'string'
        },
        registeredFrom: {
            type: 'string'
        },
        fpo: {
            type: 'string'
        },
        dealsWithCategory: {
            type: 'array'//array of object
        },



        comparePassword: function (password) {
            return bcrypt.compareSync(password, this.password);
        },

        toJSON: function () {
            var obj = this.toObject();
            delete obj.password;
            return obj;
        }

    },

    beforeCreate: function (user, next) {
        if (user.firstName && user.lastName) {
            user.fullName = user.firstName + ' ' + user.lastName;
        }

        if (user.hasOwnProperty('password')) {
            user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(10));
            next(false, user);

        } else {
            next(null, user);
        }
    },


    beforeUpdate: function (user, next) {
        if (user.firstName && user.lastName) {
            user.fullName = user.firstName + ' ' + user.lastName;
        }
        // console.log(user, 'userinfo befor updae')
        if (user.hasOwnProperty('password')) {
            if (user.password) {
                next(null, user);
            } else {
                user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(10));
                next(false, user);
            }
        } else {
            next(null, user);
        }
    },

    authenticate: function (username, password) {
        var query = {};
        query.username = username;
        query.$or = [{ roles: ["SA", "A"] }];

        return Users.findOne(query).populate('roleId').then(function (user) {
            //return API.Model(Users).findOne(query).then(function(user){
            return (user && user.date_verified && user.comparePassword(password)) ? user : null;
        });
    },

};