
var Promise = require('bluebird'),
    promisify = Promise.promisify;
var constantObj = sails.config.constants;
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var transport = nodemailer.createTransport(smtpTransport({
    host: sails.config.appSMTP.host,
    port: sails.config.appSMTP.port,
    debug: sails.config.appSMTP.debug,
    auth: {
        user: sails.config.appSMTP.auth.user, //access using /congig/appSMTP.js
        pass: sails.config.appSMTP.auth.pass
    }
}));
module.exports = {

    saveFranchisee: function (data, context, req, res) {

        let query = {}

        if (data.email) {
            query.email = data.email;
        }
        if (data.phone) {
            query.phone = data.phone;
        }
        Becomefranchisee.findOne(query).then(function (frn) {
            if (frn) {
                return res.jsonx({
                    success: false,
                    message: "Your enquiry is already registered with us",
                });
            } else {
                Becomefranchisee.create(data).then(function (franchisee) {
                    if (franchisee.email) {
                        sendEmailUsers(franchisee);
                        sendEmailToAdminUsers(franchisee);
                    }
                    return res.jsonx({
                        success: true,
                        code: 200,
                        data: franchisee
                    });
                }).fail(function (err) {
                    console.log("err == ", err)
                    return res.jsonx({
                        success: false,
                        message: err,
                    });
                });
            }
        }).fail(function (err) {
            console.log("err 1 == ", err)
            return res.jsonx({
                success: false,
                message: err,
            });
        });
    },

    getAllList: function (data, context, req, res) {

        var page = data.page;
        var count = parseInt(data.count);
        var skipNo = (page - 1) * count;
        var search = data.search;
        var query = {};

        var sortBy = data.sortBy;

        if (sortBy) {
            sortBy = sortBy.toString();
        } else {
            sortBy = 'createdAt desc';
        }



        if (search) {
            query.$or = [
                {
                    name: {
                        'like': '%' + search + '%'
                    }
                }, {
                    city: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    phone: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    email: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    pincode: {
                        'like': '%' + search + '%'
                    }
                }
            ]
        }

        Becomefranchisee.count(query).exec(function (err, total) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                Becomefranchisee.find(query).sort(sortBy).skip(skipNo).limit(count).exec(function (err, frn) {
                    if (err) {
                        return res.status(400).jsonx({
                            success: false,
                            error: err
                        });
                    } else {
                        return res.jsonx({
                            success: true,
                            data: frn,
                            total: total

                        });
                    }
                })
            }
        })
    },
}

var sendEmailUsers = function (options) {

    email = options.email,

        message = 'Hi ' + options.name;
    message += '<br/><br/>';
    ;
    message += 'Thank you so much for reaching out to us. We have received your query. Now  all you have to do is , sit back and relax meanwhile, we will go through your request and one of our assistance will contact you regarding the same.';
    message += '<br/><br/>';
    message += 'we will be contacting you soon again.';

    message += '<br/><br/>';
    message += 'Regards';
    message += '<br/><br/>';
    message += 'Team FarmX';

    let msg = '';
    transport.sendMail({
        from: sails.config.appSMTP.auth.user,
        to: email,
        subject: 'FarmX Become Franchisee email',
        html: message

    }, function (err, info) {
        console.log("err === ", err)
    });
};
var sendEmailToAdminUsers = function (options) {

    email = options.email,

        message = 'Hello! ';
    message += '<br/><br/>';
    ;
    message += 'Name: ' + options.name;
    message += '<br/><br/>';
    message += 'Email: ' + email;
    message += '<br/><br/>';
    if (options.phone) {
        message += 'Phone: ' + options.phone;
        message += '<br/><br/>';
    }
    message += 'Address: ' + options.address;
    message += '<br/><br/>';
    message += 'City: ' + options.city;
    message += '<br/><br/>';
    message += 'State: ' + options.state;
    message += '<br/><br/>';

    message += 'Regards';
    message += '<br/><br/>';
    message += 'Team FarmX';

    let msg = '';
    transport.sendMail({
        from: sails.config.appSMTP.auth.user,
        to: sails.config.appSMTP.auth.user,
        subject: 'FarmX Become Franchisee email',
        html: message

    }, function (err, info) {
        console.log("err === ", err)
    });
};