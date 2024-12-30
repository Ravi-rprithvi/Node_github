/**
 * Payments.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
var crypt = require('../controllers/crypt');
var crypto = require('crypto');

module.exports = {
    autoCreatedAt: true,
    autoUpdatedAt: true,
    attributes: {
        productId: {
            type: 'string',
            required: true
        },

        equipment: {
            model: 'equipment'
        },
        crop: {
            model: 'crops'
        },

        land: {
            model: 'lands'
        },

        sellerId: {
            model: 'users'
        },

        buyerId: {
            model: 'users'
        },

        buyers: {
            type: 'array'
        },

        productType: {
            type: 'string',
            required: true
        },

        paymentType: {
            type: 'string'
        },

        orderId: {
            model: 'orders'
        },

        capex: {
            type: 'string',
        },

        amount: {
            type: 'float',
            required: true
        },
        payment: {
            type: 'json'
        },
        equipmentInterestsId: {
            model: 'equipmentinterests'
        },
        landInterestsId: {
            model: 'landinterests'
        },
        lowCapexId: {
            model: 'lowcapexsell'
        },
        isCollected: {
            type: 'boolean',
            defaultsTo: false
        },
        ddNumber: {
            type: 'string'
        }
    },

    genOrderChecksum: function (params, key, cb) {
        // console.log("hello", params,key)
        //var key = "M4v9YSeDNSdgZpGO"
        var flag = params.refund ? true : false;
        var data = this.paramsToString(params);

        // console.log("params456",params)

        crypt.gen_salt(4, function (err, salt) {
            // console.log("+++++++++++++++++++++++++",err,salt)
            var sha256 = crypto.createHash('sha256').update(data + salt).digest('hex');
            var check_sum = sha256 + salt;
            var encrypted = crypt.encrypt(check_sum, key);
            params.CHECKSUMHASH = encrypted;



            console.log("print checksume with paytm", params)
            /*if (flag) {
                params.CHECKSUM = (encrypted);
                params.CHECKSUM = encrypted;
            } else {
                params.CHECKSUMHASH = (encrypted);
            }*/
            cb(undefined, params);
        });
    },

    genchecksum: function (params, paramArray, key, cb) {
        // console.log("hello", params,key)
        //var key = "M4v9YSeDNSdgZpGO"
        var flag = params.refund ? true : false;
        var data = this.paramsToString(params);

        // console.log("params456",params)

        crypt.gen_salt(4, function (err, salt) {
            // console.log("+++++++++++++++++++++++++",err,salt)
            var sha256 = crypto.createHash('sha256').update(data + salt).digest('hex');
            var check_sum = sha256 + salt;
            var encrypted = crypt.encrypt(check_sum, key);
            params.CHECKSUMHASH = encrypted;
            paramArray['CHECKSUMHASH'] = encrypted;
            paramArray['CALLBACK_URL'] = params.CALLBACK_URL;
            var OBJ = {
                params: params,
                paramArray: paramArray
            }

            console.log("print checksume with paytm", OBJ)
            /*if (flag) {
                params.CHECKSUM = (encrypted);
                params.CHECKSUM = encrypted;
            } else {
                params.CHECKSUMHASH = (encrypted);
            }*/
            cb(undefined, OBJ);
        });
    },

    paramsToString: function (params, mandatoryflag) {

        var data = '';
        var tempKeys = Object.keys(params);
        tempKeys.sort();

        // console.log("parmas in paramstostring",params)
        tempKeys.forEach(function (key) {

            var n = params[key].includes("REFUND");
            var m = params[key].includes("|");

            if (n == true) {
                params[key] = "";
            }
            if (m == true) {
                params[key] = "";
            }
            if (key !== 'CHECKSUMHASH') {
                if (params[key] === 'null') params[key] = '';
                if (!mandatoryflag || mandatoryParams.indexOf(key) !== -1) {
                    data += (params[key] + '|');
                }
            }
            console.log("in second b", data)
        });
        return data;
    },
    verifychecksum: function (params, key) {

        var data = this.paramsToString(params, false);
        //TODO: after PG fix on thier side remove below two lines
        if (params.CHECKSUMHASH) {
            params.CHECKSUMHASH = params.CHECKSUMHASH.replace('\n', '');
            params.CHECKSUMHASH = params.CHECKSUMHASH.replace('\r', '');

            var temp = decodeURIComponent(params.CHECKSUMHASH);
            var checksum = crypt.decrypt(temp, key);
            var salt = checksum.substr(checksum.length - 4);
            var sha256 = checksum.substr(0, checksum.length - 4);
            var hash = crypto.createHash('sha256').update(data + salt).digest('hex');
            if (hash === sha256) {
                return true;
            } else {
                util.log("checksum is wrong");
                return false;
            }
        } else {
            util.log("checksum not found");
            return false;
        }
    },
    verifychecksumbystring: function (params, key, checksumhash) {
        var checksum = crypt.decrypt(checksumhash, key);
        var salt = checksum.substr(checksum.length - 4);
        var sha256 = checksum.substr(0, checksum.length - 4);
        var hash = crypto.createHash('sha256').update(params + '|' + salt).digest('hex');
        if (hash === sha256) {
            return true;
        } else {
            util.log("checksum is wrong");
            return false;
        }
    },
    genchecksumforrefund: function (params, key, cb) {

        var data = this.paramsToStringrefund(params);
        console.log("data of refund is", data)
        crypt.gen_salt(4, function (err, salt) {
            var sha256 = crypto.createHash('sha256').update(data + salt).digest('hex');
            var check_sum = sha256 + salt;
            var encrypted = crypt.encrypt(check_sum, key);
            params.CHECKSUM = encodeURIComponent(encrypted);
            cb(undefined, params);
        });
    },
    paramsToStringrefund: function (params, mandatoryflag) {
        var data = '';
        var tempKeys = Object.keys(params);
        tempKeys.sort();
        //console.log(tempKeys, 'tempKeys=====')
        tempKeys.forEach(function (key) {
            var m = params[key].toString().includes("|");
            if (m == true) {
                params[key] = "";
            }
            if (key !== 'CHECKSUMHASH') {
                if (params[key] === 'null') params[key] = '';
                if (!mandatoryflag || mandatoryParams.indexOf(key) !== -1) {
                    data += (params[key] + '|');
                }
            }
        });
        return data;
    }
};