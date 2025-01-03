/**
 * Tokens.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
var Promise = require('bluebird');
var promisify = Promise.promisify;
// var randToken = require('rand-token');
var crypto = require('crypto');
// Create the generator:
var randToken = require('rand-token').generator({
    chars: 'default',
    source: crypto.randomBytes
});

// Generate a 16 character token:
module.exports = {

    attributes: {

        access_token: {
            type: 'string',
            required: true,
            unique: true
        },

        refresh_token: {
            type: 'string',
            required: true,
            unique: true
        },

        code: {
            type: 'string',
            unique: true
        },

        user_id: {
            type: 'string'
        },

        expiration_date: {
            type: 'date'
        },

        client_id: {
            type: 'string',
            required: true
        },

        security_level: {
            type: 'string'
        },

        scope: {
            type: 'string'
        },

        loginType: {
            type: 'string',
            enum: ['tracking', 'user'],
            defaultsTo: 'user'
        },

        calc_expires_in: function () {
            return Math.floor(new Date(this.expiration_date).getTime() / 1000 - new Date().getTime() / 1000);
        },

        toJSON: function () {
            var hiddenProperties = ['id', 'access_token', 'refresh_token', 'code', 'user_id', 'client_id', ' '],
                obj = this.toObject();

            obj.expires_in = this.expires_in();

            hiddenProperties.forEach(function (property) {
                delete obj[property];
            });

            return obj;
        }

    },

    authenticate: function (criteria) {
        var tokenInfo,
            $Tokens = API.Model(Tokens),
            $Users = API.Model(Users),
            $Clients = API.Model(Clients),
            $LogisticTrip = API.Model(LogisticTrip),
            $result;
        // console.log("criteria==", criteria)
        if (criteria.access_token) {
            $result = $Tokens.findOne({ access_token: criteria.access_token });
        }
        else if (criteria.code) {
            $result = $Tokens.findOne({ code: criteria.code });
        }
        else {
            //Bad Token Criteria
            return Promise.reject("Unauthorized");
        }

        return $result.then(function (token) {

            if (!token) return null;

            // Handle expired token
            if (token.expiration_date && new Date() > token.expiration_date) {
                // console.log('destroy token ====')
                return $Tokens.destroy({ access_token: token }).then(function () {
                    // return $Userslogin.update({access_token: token}, {loggedIn: false}).then(function () {
                    return null
                    // })
                });
            }

            tokenInfo = token;

            if (token.user_id != null) {
                if (token.loginType) {
                    if (token.loginType == 'tracking') {
                        return $LogisticTrip.findOne({ id: token.user_id });
                    } else {
                        return $Users.findOne({ id: token.user_id });
                    }
                } else {
                    return $Users.findOne({ id: token.user_id });
                }
            }
            else {
                //The request came from a client only since userID is null
                //therefore the client is passed back instead of a user
                return $Clients.findOne({ client_id: token.client_id });
            }

        }).then(function (identity) {

            // to keep this example simple, restricted scopes are not implemented,
            // and this is just for illustrative purposes


            if (!identity) return null;
            else if (tokenInfo.loginType == 'tracking') {
                return {
                    identity: identity,
                    authorization: {
                        scope: tokenInfo.scope,
                        token: tokenInfo
                    }
                }
            }
            else if (criteria.type == 'verification') {
                if (identity.email != criteria.email) return null;
            }
            // Otherwise if criteria.type != 'verfication'
            else if (!identity.date_verified) return null;

            return {
                identity: identity,
                authorization: {
                    scope: tokenInfo.scope,
                    token: tokenInfo
                }
            };
        });
    },

    generateTokenString: function () {
        return randToken.generate(sails.config.security.oauth.token.length);
    },
    generateToken: function (criteria) {

        //if (err) return next(err);

        var token = {},
            accessToken,
            $Tokens = API.Model(Tokens);

        if (!criteria.client_id) return Promise.resolve(null);

        token.client_id = criteria.client_id;
        token.user_id = criteria.user_id || undefined;
        if (criteria.loginType) {
            token.loginType = criteria.loginType
        }

        token.access_token = accessToken = Tokens.generateTokenString();

        token.refresh_token = Tokens.generateTokenString();
        token.code = Tokens.generateTokenString();

        if (!criteria.expiration_date) {
            token.expiration_date = new Date();
            token.expiration_date.setTime(token.expiration_date.getTime() + sails.config.security.oauth.token.expiration * 1000 + 999);
        } else {
            // token.expiration_date.setTime(token.expiration_date.getTime() + sails.config.security.oauth.token.expiration * 1000 + 999);
        }
        // console.log(criteria, 'retrievedToken====')
        $Users = API.Model(Users)
        return $Users.findOne({ id: criteria.user_id }).then(function (users) {

            if (users && (users.roles == "SA" || users.roles == "A")) {
                return $Tokens.findOrCreate(criteria, token).then(function (retrievedToken) {
                    // console.log(retrievedToken, 'retrievedToken====')

                    if (retrievedToken.access_token != accessToken) {
                        return $Tokens.update(criteria, token).then(function (updatedTokens) {
                            return updatedTokens[0];
                        });
                    }
                    return retrievedToken;
                });
            } else {
                return $Tokens.findOrCreate(criteria, token).then(function (retrievedToken) {

                    if (retrievedToken.access_token != accessToken && retrievedToken.expiration_date < new Date()) {
                        // console.log('aaya===')
                        return $Tokens.update(criteria, token).then(function (updatedTokens) {
                            // console.log('11111')
                            return updatedTokens[0];
                        });
                    }
                    // console.log("2====")
                    return retrievedToken;
                });
            }
        })
    }
};