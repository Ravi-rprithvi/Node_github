/**
 * Module dependencies.
 */
// var socketIOClient = require('socket.io-client');
// var sailsIOClient = require('sails.io');

// var io = sailsIOClient(socketIOClient);

var bcrypt = require('bcrypt-nodejs');

var promisify = require('bluebird').promisify,
    passport = require('passport'),
    oauth2orize = require('oauth2orize'),

    PublicClientPasswordStrategy = require('passport-oauth2-public-client').Strategy,
    BearerStrategy = require('passport-http-bearer').Strategy,

    server = oauth2orize.createServer(), // create OAuth 2.0 server service
    validateAndSendToken = promisify(server.token()),
    tokenErrorMessage = server.errorHandler(),

    //Handlers
    publicClientVerifyHandler,
    bearerVerifyHandler,
    exchangePasswordHandler,
    exchangeRefreshTokenHandler;

/**
 * Public Client strategy
 *
 * The OAuth 2.0 public client authentication strategy authenticates clients
 * using a client ID. The strategy requires a verify callback,
 * which accepts those credentials and calls done providing a client.
 */

publicClientVerifyHandler = function (clientId, next) {
    process.nextTick(function () {
        API.Model(Clients).findOne({ client_id: clientId }).nodeify(next);
    });
};

/**
 * BearerStrategy
 *
 * This strategy is used to authenticate either users or clients based on an access token
 * (aka a bearer token).  If a user, they must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 */
bearerVerifyHandler = function (token, next) {
    process.nextTick(function () {
        Tokens.authenticate({ access_token: token }).nodeify(function (err, info) {
            if (!info || !info.identity) return next(null, null);
            next(null, info.identity, info.authorization);
        });
    });
};

/**
 * Exchange user id and password for access tokens.
 *
 * The callback accepts the `client`, which is exchanging the user's name and password
 * from the token request for verification. If these values are validated, the
 * application issues an access token on behalf of the user who authorized the code.
 */
exchangePasswordHandler = function (client, username, password, scope, data, next) {
    // console.log(client, 'scope', data)
    if (!client) return next(null, false); //passport-oauth2-client-password needs to be configured
    //Validate the user
    Users.authenticate(username, password).then(function (user) {
        if (!user) return next(null, false);
        return Tokens.generateToken({
            client_id: client.client_id,
            user_id: user.id
        }).then(function (token) {
            var userMarkets = [];

            if (user.markets) {
                userMarkets = user.markets;
            }

            var markets = [];
            return Market.find({ id: { "$in": userMarkets } }).then(function (marketsData) {
                if (marketsData != undefined) {
                    markets = marketsData;
                }

                const userObj = JSON.parse(JSON.stringify(user));

                // let userObj = user

                delete userObj.passport
                delete userObj.encryptedPassword
                delete userObj.markets
                delete userObj.roleId

                let inputData = {};
                inputData.user = userObj.id;

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
                inputData.access_token = token.access_token;
                if (data.applicationtype) {
                    inputData.applicationtype = data.applicationtype
                    if (data.applicationtype == 'fieldtransaction') {
                        if (data.device_type == '' || data.device_type == undefined) {
                            inputData.device_type = "ANDROID";
                        }
                    }
                }

                return Userslogin.create(inputData).then(function () {
                    return next(null, token.access_token, token.refresh_token, {
                        user_info: userObj,
                        expires_in: token.calc_expires_in(),
                        roles: user.roles,
                        role_id: user.roleId,
                        markets: markets
                    });
                });
            });
        });
    });
};

/**
 * Exchange the refresh token for an access token.
 *
 * The callback accepts the `client`, which is exchanging the client's id from the token
 * request for verification.  If this value is validated, the application issues an access
 * token on behalf of the client who authorized the code
 */
exchangeRefreshTokenHandler = function (client, refreshToken, scope, done) {

    API.Model(Tokens).findOne({
        refresh_token: refreshToken
    }).then(function (token) {
        if (!token) return done(null, null);

        return Tokens.generateToken({
            user_id: token.user_id,
            client_id: token.client_id
        }).then(function (token) {
            return done(null, token.access_token, token.refresh_token, {
                expires_in: token.calc_expires_in()
            });

        });
    }).catch(function (err) {
        done(err);
    });

};

//Initialize Passport Strategies
passport.use(new PublicClientPasswordStrategy(publicClientVerifyHandler));
passport.use(new BearerStrategy(bearerVerifyHandler));
server.exchange(oauth2orize.exchange.password(exchangePasswordHandler));
server.exchange(oauth2orize.exchange.refreshToken(exchangeRefreshTokenHandler));

module.exports = {
    authenticator: passport,
    server: server,

    //OAuth Token Services
    sendToken: function (data, context, req, res) {
        if (req.method != 'POST') throw 'Unsupported method';
        return validateAndSendToken(req, res).catch(function (err) {
            tokenErrorMessage(err, req, res);
        });
    },

    tokenInfo: function (data, context) {
        var token = context.authorization.token;
        token.expires_in = token.calc_expires_in();
        return {
            identity: context.identity,
            authorization: context.authorization
        };
    }
};