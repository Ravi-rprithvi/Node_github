var Promise = require('q');
var constantObj = sails.config.constants;
var gm = require('gm').subClass({ imageMagick: true });
var smtpTransport = require('nodemailer-smtp-transport');
var nodemailer = require('nodemailer');
var distance = require('google-distance-matrix');
var direction = require('google-maps-direction');

var crypt = require('./crypt');
var util = require('util');
var crypto = require('crypto');
var NodeGeocoder = require('node-geocoder');
var os = require('os');
os.tmpDir = os.tmpdir;

var transport = nodemailer.createTransport(smtpTransport({
    host: sails.config.appSMTP.host,
    port: sails.config.appSMTP.port,
    debug: sails.config.appSMTP.debug,
    auth: {
        user: sails.config.appSMTP.auth.user, //access using /congig/appSMTP.js
        pass: sails.config.appSMTP.auth.pass
    }
}));
/**
 * CommonController
 *
 * @description :: Server-side logic for managing equipment
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */


function getOriginAddress(data) {
    // let address = data.address+', '+data.city+', '+data.district+', '+data.state+', '+data.pincode;
    let address = data.city + ', ' + data.district + ', ' + data.state + ', ' + data.pincode;
    return address;
}

function uploadS3Bucket(folder, data) {

    var AWS = require('aws-sdk');
    // console.log('0--')
    AWS.config.loadFromPath('./aws_config.json');
    console.log('1--')
    let awsOptions = {
        httpOptions: {
            timeout: 900000 // 15 minutes
        }
    };
    var s3Bucket = new AWS.S3(awsOptions);
    // console.log('2--')
    var buf = data;
    // console.log('3--')
    let bucketFolder = constantObj.S3_BUCKET.stag_bucket || 'farmx-staging';
    if (sails.config.environment == 'development') {
        bucketFolder = constantObj.S3_BUCKET.dev_bucket || 'farmx-dev';
    }
    if (sails.config.environment == 'production') {
        bucketFolder = constantObj.S3_BUCKET.pro_bucket || 'farmx';
    }
    var param = {
        Bucket: 'farmx',
        Key: bucketFolder + "/" + folder,
        Body: buf,
        // ContentEncoding: 'base64',
        //ContentType: 'image/' + type
    };
    // console.log('4--')
    var stored = s3Bucket.upload(param).promise();
    return stored.then(function (data1) {
        return { success: true, data: 'image uploaded successfully' }
        // console.log('Success');
    }).catch(function (err) {
        return { success: false, error: err }
        //console.log(err);
    });





}

var fs = require('fs');
var stream = require('stream');
//const { sendEmailToAdminUsers } = require('./../services/commonService');



module.exports = {


    sendGeneralSMS: function (req, res) {
        return API(commonService.sendGeneralSMS, req, res);
    },
    TransactionReport: function (req, res) {
        return API(commonService.TransactionReport, req, res);
    },
    BidTransactionReport: function (req, res) {
        return API(commonService.BidTransactionReport, req, res);
    },
    CropReport: function (req, res) {
        return API(commonService.CropReport, req, res);
    },
    UserReport: function (req, res) {
        return API(commonService.UserReport, req, res);
    },
    cronfunc: function (req, res) {
        return API(commonService.finalBidStatus, req, res);
    },
    sellerCron: function (req, res) {
        return API(commonService.sellerPaymentStatus, req, res);
    },

    // farmersCropDealing: function(req, res) {
    //     return API(commonService.farmersCropDealing, req, res);
    // },

    readOrderEmails: function () {
        console.log("readorderemailapi")
        return API(commonService.readOrderEmails, req, res);
    },

    /*sendpush: function(req, res) {
    	
        API(commonService.sendSaveNotification,req,res);
        
    },*/

    sendpush: function (req, res) {

        var FCM = require('fcm-node');
        var serverKey = 'AAAAJ5R9yMQ:APA91bF3p4GeTi83LzDMWbCEGCgcnYfVT02AbU-FfTezVq6mQ5xof5udJB-DpPUJVqOqj9NfrJKBJywDrlZ7T3ScORy0A_d9Y34CxBhMfplwe6IRxyV0AWp9jNbWFHHVQ2bwLzd1w5iz'; //put your server key here
        var fcm = new FCM(serverKey);

        var message = {
            to: 'c_0vsuugPoU:APA91bEGl-W5M1G9FhqWqeaOT6yNrCBjEBbbSEdY8kgFHmQewrICGX-Chy-MpK1N0WQK0IVN8qZiJRElJOxM1FseFWKeXujC0D3DnX7iKJ8TVhPnLnfra6xUb5UiNvr4RDYnluT9jDdx',
            // collapse_key: 'your_collapse_key',

            notification: {
                title: 'Title of your push notification',
                body: 'Body of your push notification',
                badge: 1,
                sound: "farmx_notification_demon.wav"
            },


            data: {  //you can send only notification or only data(or include both)
                my_key: 'my value',
                my_another_key: 'my another value'
            },

        };
        console.log("sendpush====", message);
        fcm.send(message, function (err, response) {
            if (err) {
                console.log("Something has gone wrong!");
            } else {
                console.log("Successfully sent with response: ", response);
            }
        });
        // let data = {};
        // data.user = "598963c4f06a575609967438";
        // data.message = "This is just a test for push notification of sending equipments."
        // commonService.sendSaveNotification(data, function (err, response) {


        //res.redirect(url);

        //})

    },


    getDetails: function (req, res) {

        var query = {};
        var Model = {};
        query.isDeleted = 'false';

        var modelName = req.param('model');
        var Model = sails.models[modelName];

        if (modelName === 'users') {
            query.roles = "U";
        }

        //
        Model.find(query).exec(function (err, response) {
            if (response) {
                return res.jsonx({
                    success: true,
                    data: response
                });
            } else {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            }
        });
    },

    getAssets: function (req, res) {


        var query = {};
        var Model = {};

        var userQuery = {};
        var CategoryQuery = {};

        userQuery.isDeleted = 'false';
        userQuery.roles = 'U';

        CategoryQuery.isDeleted = 'false';
        CategoryQuery.type = req.param('type');

        Promise.all([

            Category.find(CategoryQuery).then(),

            Manufacturer.find().then(),

            Users.find(userQuery).then(),

            States.find().then(),

        ]).spread(function (Category, Manufacturer, Users, States) {
            return res.jsonx({
                success: true,
                data: {
                    Users: Users,
                    Category: Category,
                    Manufacturer: Manufacturer,
                    States: States
                },
            });

        }).fail(function (err) {
            return res.status(400).jsonx({
                success: false,
                error: err
            });
            //res.jsonx(err);

        });
    },

    uploadPODFiles: function (req, res) {
        var fs = require('fs');
        var uuid = require('uuid');
        var randomStr = uuid.v4();
        var date = new Date();
        var currentDate = date.valueOf();
        var randNumber = randomStr + "-" + currentDate;

        let modelName = req.param('type');
        let folderName = require('path').resolve(sails.config.appPath, 'assets/docs/' + modelName);

        //console.log("fileeeeeeeeeee", req.file('image')._files ) ;
        var origifile = req.file('image')._files[0].stream.filename;
        var filename = randNumber + "_" + origifile;

        var fullPath = filename;
        var imagePath = 'docs/' + modelName + '/' + filename;

        uploadS3Bucket(imagePath, filename).then(function (uploadResponse) {
            console.log(uploadResponse, 'uploadResponse');
            if (uploadResponse.success == true) {
                return res.jsonx({
                    success: true,
                    data: {
                        fullPath: fullPath,
                        imagePath: imagePath,
                        //thumbpath : thumbnails
                    },
                });
            } else {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: "No file was uploaded"
                    }
                });
            }

            //console.log("fel----------", uploadedFiles);
            //res.json({ status: 200, file: uploadedFiles });
        });
    },

    uploadVideoFile: function (req, res) {
        console.log("1 video upload")
        var fs = require('fs');
        var uuid = require('uuid');
        var randomStr = uuid.v4();
        var date = new Date();
        var currentDate = date.valueOf();
        var randNumber = randomStr + "-" + currentDate;

        let modelName = req.param('type');
        let folderName = require('path').resolve(sails.config.appPath, 'assets/videos/' + modelName);

        console.log("fileeeeeeeeeee", req.file('video')._files);
        var origifile = req.file('video')._files[0].stream.filename;
        var filename = randNumber + "_" + origifile;

        var fullPath = filename;
        var imagePath = 'videos/' + modelName + '/' + filename;

        console.log("2 video upload")
        uploadS3Bucket(imagePath, filename).then(function (uploadResponse) {
            console.log(uploadResponse, 'uploadResponse');
            if (uploadResponse.success == true) {



                console.log("3 video upload")
                return res.jsonx({
                    success: true,
                    data: {
                        fullPath: fullPath,
                        videoPath: imagePath,
                    },
                });
            } else {
                // If no files were uploaded, respond with an error.

                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: "No file was uploaded"
                    }
                });

            }
        });
    },

    uploadCSVFiles: function (req, res) {

        var fs = require('fs');
        var uuid = require('uuid');
        var randomStr = uuid.v4();
        var date = new Date();
        var currentDate = date.valueOf();
        var randNumber = randomStr + "-" + currentDate;

        let folderName = require('path').resolve(sails.config.appPath, 'assets/csvs');

        var origifile = req.file('file')._files[0].stream.filename;
        var filename = randNumber + "_" + origifile;

        var fullPath = 'csvs/' + filename;

        uploadS3Bucket(fullPath, filename).then(function (uploadResponse) {
            console.log(uploadResponse, 'uploadResponse');
            if (uploadResponse.success == true) {

                // If no files were uploaded, respond with an error.

                return res.jsonx({
                    success: true,
                    data: {
                        filePath: fullPath,
                    },
                });

            } else {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: "No file was uploaded"
                    }
                });
            }
        });
    },

    deleteUploadedCSVFile: function (req, res) {
        let rfilePath = req.param('filePath');
        if (rfilePath == undefined) {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: "Please provide file path"
                }
            });
        } else {
            var fs = require('fs');
            let filePath = 'assets/' + rfilePath
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: err
                            }
                        });
                    } else {
                        return res.jsonx({
                            success: true,
                            data: {
                                message: "File deleted"
                            },
                        });
                    }
                })
            } else {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: "No such file exists"
                    }
                });
            }
        }
    },

    uploadFiles: function (req, res) {
        var fs = require('fs');
        var uuid = require('uuid');
        var randomStr = uuid.v4();
        var date = new Date();
        var currentDate = date.valueOf();
        var randNumber = randomStr + "-" + currentDate;

        let modelName = req.param('type');
        let folderName = require('path').resolve(sails.config.appPath, 'assets/images/' + modelName);

        //console.log("fileeeeeeeeeee", req.file('image')._files ) ;
        var origifile = req.file('image')._files[0].stream.filename;
        var filename = randNumber + "_" + origifile;

        var fullPath = filename;
        var imagePath = 'images/' + modelName + '/' + filename;

        uploadS3Bucket(imagePath, filename).then(function (uploadResponse) {
            console.log(uploadResponse, 'uploadResponse');
            if (uploadResponse.success == true) {
                // If no files were uploaded, respond with an error.

                var thumbnails = [];
                var uploadLocation = 'images/' + modelName + '/' + filename;

                var thumbpath = 'images/' + modelName + '/thumbnail/200/' + filename;
                console.log("ttttttttt", thumbpath)
                //var thumbtempLocation = '.tmp/public/images/'+ modelName + '/thumbnail/' +'200_' +name + '.' + fileExt ;
                gm(filename)
                    .resize('200', '200', '!')
                    .stream(function (err, stdout, stderr) {
                        if (!err) {
                            uploadS3Bucket(thumbpath, stdout).then(function (uploadResponse1) {
                                if (uploadResponse1.success == true) {

                                    var thumbpath1 = 'images/' + modelName + '/thumbnail/300/' + filename;
                                    thumbnails.push(thumbpath)
                                    gm(filename)
                                        .resize('300', '300', '!')
                                        .stream(function (error, stdout, stderr) {
                                            if (!error) {
                                                uploadS3Bucket(thumbpath1, stdout).then(function (uploadResponse1) {
                                                    if (uploadResponse1.success == true) {
                                                        thumbnails.push(thumbpath1)
                                                        var thumbpath2 = 'images/' + modelName + '/thumbnail/500/' + filename;
                                                        gm(data)
                                                            .resize('500', '500', '!')
                                                            .stream(function (errr, stdout, stderr) {
                                                                if (!errr) {
                                                                    uploadS3Bucket(thumbpath2, stdout).then(function (uploadResponse1) {
                                                                        if (uploadResponse1.success == true) {
                                                                            return res.jsonx({
                                                                                success: true,
                                                                                data: {
                                                                                    fullPath: fullPath,
                                                                                    imagePath: imagePath,
                                                                                    //thumbpath : thumbnails
                                                                                },
                                                                            });
                                                                        }
                                                                    })
                                                                }

                                                            })
                                                    }
                                                })
                                            } else {
                                                return res.jsonx({
                                                    success: false,
                                                    error: {
                                                        code: 400,
                                                        message: constantObj.messages.NOT_UPLOADED1

                                                    },
                                                });
                                            }

                                        })
                                }
                            })
                        } else {
                            return res.jsonx({
                                success: false,
                                error: {
                                    code: 400,
                                    message: constantObj.messages.NOT_UPLOADED

                                },
                            });
                        }
                    });


            } else {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: "No file was uploaded"
                    }
                });
            }


        });
    },

    uploadFilesGif: function (req, res) {
        var fs = require('fs');
        var uuid = require('uuid');
        var randomStr = uuid.v4();
        var date = new Date();
        var currentDate = date.valueOf();
        var randNumber = randomStr + "-" + currentDate;

        let modelName = req.param('type');
        let folderName = require('path').resolve(sails.config.appPath, 'assets/images/' + modelName + '/gif');

        //console.log("fileeeeeeeeeee", req.file('image')._files ) ;
        var origifile = req.file('image')._files[0].stream.filename;
        var filename = randNumber + "_" + origifile;

        var fullPath = filename;
        var imagePath = '/images/' + modelName + '/gif/' + filename;

        req.file('image').upload({
            saveAs: filename,
            // don't allow the total upload size to exceed ~10MB
            maxBytes: 10000000,
            dirname: folderName
        }, function (err, uploadedFiles) {
            if (err) {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: err
                    }
                });
            }
            // If no files were uploaded, respond with an error.
            if (uploadedFiles.length === 0) {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: "No file was uploaded"
                    }
                });
            }

            var thumbnails = [];
            var uploadLocation = 'assets/images/' + modelName + '/gif/' + filename;
            fs.readFile(uploadLocation, function (err, data) {
                console.log("data", data);
                if (err) {
                    return res.jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: err
                        },
                    });
                }
                if (data) {
                    var thumbpath = 'assets/images/' + modelName + '/thumbnail/200/gif/' + filename;
                    console.log("ttttttttt", thumbpath)
                    //var thumbtempLocation = '.tmp/public/images/'+ modelName + '/thumbnail/' +'200_' +name + '.' + fileExt ;
                    gm(data)
                        .resize('200', '200', '^')
                        .write(thumbpath, function (err) {
                            console.log("data", err);
                            if (!err) {

                                var thumbpath1 = 'assets/images/' + modelName + '/thumbnail/300/gif/' + filename;
                                thumbnails.push(thumbpath)
                                gm(data)
                                    .resize('300', '300', '^')
                                    .write(thumbpath1, function (error) {

                                        if (!error) {
                                            thumbnails.push(thumbpath1)
                                            var thumbpath2 = 'assets/images/' + modelName + '/thumbnail/500/gif/' + filename;
                                            gm(data)
                                                .resize('500', '500', '^')
                                                .write(thumbpath2, function (er) {
                                                    if (!er) {

                                                        return res.jsonx({
                                                            success: true,
                                                            data: {
                                                                fullPath: fullPath,
                                                                imagePath: imagePath,
                                                                //thumbpath : thumbnails
                                                            },
                                                        });

                                                    }

                                                })
                                        } else {
                                            return res.jsonx({
                                                success: false,
                                                error: {
                                                    code: 400,
                                                    message: constantObj.messages.NOT_UPLOADED1

                                                },
                                            });
                                        }

                                    })
                            } else {
                                return res.jsonx({
                                    success: false,
                                    error: {
                                        code: 400,
                                        message: constantObj.messages.NOT_UPLOADED

                                    },
                                });
                            }
                        });
                }
            });

            console.log("fel----------", uploadedFiles);
            //res.json({ status: 200, file: uploadedFiles });
        });
    },

    uploadImagesPackaging: function (req, res) {
        console.log("body---", req.body);
        var fs = require('fs');
        //var path = require('path');
        var uuid = require('uuid');
        var randomStr = uuid.v4();
        var date = new Date();
        var currentDate = date.valueOf();

        var modelName = req.body.type;
        //var modelName = 'crops';

        var Model = sails.models[modelName];
        var name = randomStr + "-" + currentDate;

        var imagedata = req.body.data;
        imageBuffer = this.decodeBase64Image(imagedata);

        var imageType = imageBuffer.type;

        var typeArr = new Array();
        typeArr = imageType.split("/");
        var fileExt = typeArr[1];

        var size = Buffer.byteLength(imagedata, "base64");
        var i = parseInt(Math.floor(Math.log(size) / Math.log(1024)));
        var test = Math.round(size / Math.pow(1024, i), 2);

        if (size <= 10737418) {

            if ((fileExt === 'jpeg') || (fileExt === 'JPEG') || (fileExt === 'JPG') || (fileExt === 'jpg') || (fileExt === 'PNG') || (fileExt === 'png')) {
                if (imageBuffer.error) return imageBuffer.error;

                var fullPath = name + '.' + fileExt;
                var imagePath = '/images/' + modelName + '/' + name + '.' + fileExt;
                var uploadLocation = 'images/' + modelName + '/' + name + '.' + fileExt;


                /* var tempLocation = '.tmp/public/images/'+ modelName + '/' + name + '.' + fileExt ;
                 var thumbtempLocation = '.tmp/public/images/'+ modelName + '/thumbnail/' + name + '.' + fileExt ;*/
                console.log("buffer==========", imageBuffer);
                uploadS3Bucket(uploadLocation, imageBuffer.data).then(function (uploadResponse) {
                    console.log(uploadResponse, 'uploadResponse');
                    if (uploadResponse.success == true) {
                        return res.jsonx({
                            success: true,
                            data: {
                                fullPath: fullPath,
                                imagePath: imagePath,
                                //thumbpath : thumbnails
                            },
                        });


                    } else {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: "No file uploaded"

                            },
                        });
                    }
                })


            } else {

                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: constantObj.messages.INVALID_IMAGE

                    },
                });

            }
        } else {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: constantObj.messages.SIZE_EXCEEDED

                },
            });
        }
    },


    uploadImages: function (req, res) {
        // console.log("body---", req.body);
        var fs = require('fs');
        //var path = require('path');
        var uuid = require('uuid');
        var randomStr = uuid.v4();
        var date = new Date();
        var currentDate = date.valueOf();

        var modelName = req.body.type;
        //var modelName = 'crops';

        var Model = sails.models[modelName];
        var name = randomStr + "-" + currentDate;


        // var AWS = require('aws-sdk');
        // console.log('0--')
        // AWS.config.loadFromPath('./aws_config.json');
        // console.log('1--')
        // var s3Bucket = new AWS.S3();
        // console.log('2--')
        // var buf = Buffer.from(req.body.data.replace(/^data:image\/\w+;base64,/, ""), 'base64')
        // const type = req.body.data.split(';')[0].split('/')[1]


        // console.log('3--')
        // var param = {
        //     Bucket: 'farmx',
        //     Key: 'farmx-dev/devTest/' + name,
        //     Body: buf,
        //     ContentEncoding: 'base64',
        //     ContentType: 'image/' + type
        // };
        // console.log('4--')
        // s3Bucket.upload(param, function (err, data1) {
        //     if (err) {
        //         console.log(err);
        //         console.log('Error uploading data: ', data1);
        //     } else {
        //         console.log('successfully uploaded the image!');
        //     }
        // });
        // return 1;

        var imagedata = req.body.data;
        imageBuffer = this.decodeBase64Image(imagedata);

        var imageType = imageBuffer.type;

        var typeArr = new Array();
        typeArr = imageType.split("/");
        var fileExt = typeArr[1];

        var size = Buffer.byteLength(imagedata, "base64");
        var i = parseInt(Math.floor(Math.log(size) / Math.log(1024)));
        var test = Math.round(size / Math.pow(1024, i), 2);

        if (size <= 10737418) {

            if ((fileExt === 'jpeg') || (fileExt === 'JPEG') || (fileExt === 'JPG') || (fileExt === 'jpg') || (fileExt === 'PNG') || (fileExt === 'png')) {
                if (imageBuffer.error) return imageBuffer.error;

                var fullPath = name + '.' + fileExt;
                var imagePath = '/images/' + modelName + '/' + name + '.' + fileExt;
                var uploadLocation = modelName + '/' + name + '.' + fileExt;

                var thumbnails = [];
                /* var tempLocation = '.tmp/public/images/'+ modelName + '/' + name + '.' + fileExt ;
                 var thumbtempLocation = '.tmp/public/images/'+ modelName + '/thumbnail/' + name + '.' + fileExt ;*/
                uploadS3Bucket(uploadLocation, imageBuffer.data).then(function (uploadResponse) {
                    console.log(uploadResponse, 'uploadResponse');
                    if (uploadResponse.success == true) {


                        console.log(uploadResponse);




                        var thumbpath = modelName + '/thumbnail/200/' + name + '.' + fileExt;
                        var resize = gm(imageBuffer.data).resize('200', '200', '^')
                        console.log("resizing == ", resize)

                        //var thumbtempLocation = '.tmp/public/images/'+ modelName + '/thumbnail/' +'200_' +name + '.' + fileExt ;
                        gm(imageBuffer.data)
                            .resize('200', '200', '!')
                            .stream(function (err, stdout, stderr) {
                                if (!err) {
                                    uploadS3Bucket(thumbpath, stdout).then(function (uploadResponse1) {
                                        if (uploadResponse1.success == true) {
                                            var thumbpath1 = modelName + '/thumbnail/300/' + name + '.' + fileExt;
                                            thumbnails.push(thumbpath)


                                            gm(imageBuffer.data)
                                                .resize('300', '300', '!')
                                                .stream(function (error, stdout, stderr) {

                                                    if (!error) {

                                                        uploadS3Bucket(thumbpath1, stdout).then(function (uploadResponse2) {
                                                            if (uploadResponse2.success == true) {

                                                                var thumbpath2 = modelName + '/thumbnail/500/' + name + '.' + fileExt;
                                                                gm(imageBuffer.data)
                                                                    .resize('500', '500', '!')
                                                                    .stream(function (er, stdout, stderr) {
                                                                        if (!er) {
                                                                            uploadS3Bucket(thumbpath2, stdout).then(function (uploadResponse3) {
                                                                                if (uploadResponse3.success == true) {

                                                                                    return res.jsonx({
                                                                                        success: true,
                                                                                        data: {
                                                                                            fullPath: fullPath,
                                                                                            imagePath: imagePath,
                                                                                            //thumbpath : thumbnails
                                                                                        },
                                                                                    });

                                                                                }

                                                                            })
                                                                        }
                                                                    })
                                                            }
                                                        })
                                                    }
                                                })
                                        }
                                        else {
                                            return res.jsonx({
                                                success: false,
                                                error: {
                                                    code: 400,
                                                    message: constantObj.messages.NOT_UPLOADED1

                                                },
                                            });
                                        }

                                    })
                                } else {
                                    return res.jsonx({
                                        success: false,
                                        error: {
                                            code: 400,
                                            message: constantObj.messages.NOT_UPLOADED

                                        },
                                    });
                                }
                            });
                    }

                })


            } else {

                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: constantObj.messages.INVALID_IMAGE

                    },
                });

            }
        } else {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: constantObj.messages.SIZE_EXCEEDED

                },
            });
        }
    },

    uploadGif: function (req, res) {
        var fs = require('fs');
        //var path = require('path');
        var uuid = require('uuid');
        var randomStr = uuid.v4();
        var date = new Date();
        var currentDate = date.valueOf();

        var modelName = req.body.type;
        //var modelName = 'crops';

        var Model = sails.models[modelName];
        var name = randomStr + "-" + currentDate;

        var imagedata = req.body.data;
        imageBuffer = this.decodeBase64Image(imagedata);

        var imageType = imageBuffer.type;
        var typeArr = new Array();
        typeArr = imageType.split("/");
        var fileExt = typeArr[1];

        var size = Buffer.byteLength(imagedata, "base64");
        var i = parseInt(Math.floor(Math.log(size) / Math.log(1024)));
        var test = Math.round(size / Math.pow(1024, i), 2);



        if (size <= 10737418) {

            if ((fileExt === 'gif') || (fileExt === 'GIF')) {
                if (imageBuffer.error) return imageBuffer.error;

                var fullPath = name + '.' + fileExt;
                var imagePath = '/images/' + modelName + '/' + name + '.' + fileExt;
                var uploadLocation = 'assets/images/' + modelName + '/gif/' + name + '.' + fileExt;

                var thumbnails = [];
                /* var tempLocation = '.tmp/public/images/'+ modelName + '/' + name + '.' + fileExt ;
                 var thumbtempLocation = '.tmp/public/images/'+ modelName + '/thumbnail/' + name + '.' + fileExt ;*/

                fs.writeFile('assets/images/' + modelName + '/gif/' + name + '.' + fileExt, imageBuffer.data, function (imgerr, img) {

                    if (imgerr) {

                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: imgerr

                            },
                        });
                    } else {

                        fs.readFile(uploadLocation, function (err, data) {
                            if (err) {
                                return res.jsonx({
                                    success: false,
                                    error: {
                                        code: 400,
                                        message: err
                                    },
                                });
                            }
                            if (data) {
                                var thumbpath = 'assets/images/' + modelName + '/thumbnail/200/gif/' + name + '.' + fileExt;
                                //var thumbtempLocation = '.tmp/public/images/'+ modelName + '/thumbnail/' +'200_' +name + '.' + fileExt ;

                                gm(data)
                                    .resize('200', '200', '!')
                                    .write(thumbpath, function (err) {

                                        if (!err) {
                                            var thumbpath1 = 'assets/images/' + modelName + '/thumbnail/300/gif/' + name + '.' + fileExt;
                                            thumbnails.push(thumbpath)
                                            gm(data)
                                                .resize('300', '300', '!')
                                                .write(thumbpath1, function (error) {

                                                    if (!error) {
                                                        thumbnails.push(thumbpath1)
                                                        var thumbpath2 = 'assets/images/' + modelName + '/thumbnail/500/gif/' + name + '.' + fileExt;
                                                        gm(data)
                                                            .resize('500', '500', '!')
                                                            .write(thumbpath2, function (er) {
                                                                if (!er) {

                                                                    return res.jsonx({
                                                                        success: true,
                                                                        data: {
                                                                            fullPath: fullPath,
                                                                            imagePath: imagePath,
                                                                            //thumbpath : thumbnails
                                                                        },
                                                                    });

                                                                }

                                                            })
                                                    } else {
                                                        return res.jsonx({
                                                            success: false,
                                                            error: {
                                                                code: 400,
                                                                message: constantObj.messages.NOT_UPLOADED

                                                            },
                                                        });
                                                    }

                                                })
                                        } else {
                                            return res.jsonx({
                                                success: false,
                                                error: {
                                                    code: 400,
                                                    message: constantObj.messages.NOT_UPLOADED

                                                },
                                            });
                                        }
                                    });

                            }
                        });
                        /*return res.jsonx({
                            success: true,
                            data: {
                                fullPath : fullPath,
                                imagePath : imagePath,
                                thumbpath : thumbnails
                            },
                        });*/
                    }

                });

            } else {

                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: constantObj.messages.INVALID_IMAGE

                    },
                });

            }
        } else {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: constantObj.messages.SIZE_EXCEEDED

                },
            });
        }
    },

    /*function to decode base64 image*/
    decodeBase64Image: function (dataString) {
        var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
            response = {};
        if (matches) {

            if (matches.length !== 3) {
                return new Error('Invalid input string');
            }

            response.type = matches[1];
            response.data = new Buffer(matches[2], 'base64');
        } else {
            response.error = constantObj.messages.INVALID_IMAGE;
        }

        return response;
    },

    delete: function (req, res) {

        var modelName = req.param('model');
        var Model = sails.models[modelName];
        var itemId = req.param('id');

        let query = {};
        query.id = itemId;

        Model.find(query).exec(function (err, data) {
            if (err) {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: constantObj.messages.DATABASE_ISSUE
                    }
                });
            } else {

                Model.update({
                    id: itemId
                }, {
                    isDeleted: true,
                    deletedBy: req.identity.id
                }, function (err, data) {
                    if (data) {
                        return res.jsonx({
                            success: true,
                            data: {
                                message: constantObj.messages.DELETE_RECORD
                            }
                        });
                    } else {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: constantObj.messages.DATABASE_ISSUE
                            }
                        });
                    }

                });
            }
        })
    },

    contactUsFormMail: function (req, res) {
        var email = req.param('email');
        var phoneNumber = req.param('phoneNumber');
        var subject = req.param('subject');
        var mailmsg = req.param('message');
        var name = req.param('name');

        if (email == '' || email == undefined || email == null) {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: "Email is required"
                }
            });
        }

        if (subject == '' || subject == undefined || subject == null) {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: "Subject is required"
                }
            });
        }

        if (mailmsg == '' || mailmsg == undefined || mailmsg == null) {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: "Message is required"
                }
            });
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

        message = 'Hello';
        message += '<br/><br/>';
        message += 'A new message is arrived from' + name + 'having phone number' + phoneNumber
        message += '<br/><br/><br/>';
        message += 'Message is:';
        message += '<br/><br/><br/>';
        message += mailmsg;
        message += '<br/>';

        transport.sendMail({
            from: sails.config.appSMTP.auth.user,
            to: 'help@farmx.co.in',
            subject: subject,
            html: message
        }, function (err, info) {
            if (err) {
                return res.jsonx({
                    success: false,
                    error: {
                        message: constantObj.messages.SEND_MAIL_ISSUE
                    }
                });
            } else {
                return res.jsonx({
                    success: true,
                    data: {
                        message: 'Mail sent successful'
                    }
                });
            }

        });

    },

    changeStatus: function (req, res) {

        var modelName = req.param('model');
        var Model = sails.models[modelName];
        var itemId = req.param('id');
        var updated_status = req.param('status');

        let query = {};
        query.id = itemId;
        let updateData = {}
        updateData.status = updated_status;
        if (modelName == 'users' && (updated_status == 'active' || updated_status == 'deactive' || updated_status == 'inactive')) {
            updateData.date_verified = new Date();
            updateData.isVerified = 'Y';
            updateData.isEmailVerified = true;
            updateData.isMobileVerified = true;
        }

        Model.findOne(query).exec(function (err, data) {

            if (err) {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: constantObj.messages.DATABASE_ISSUE
                    }
                });
            } else {
                let email = '';

                if (!data.email) {
                    email = data.username;
                } else {
                    email = data.email;
                }

                Model.update({
                    id: itemId
                }, updateData, function (err, response) {
                    if (err) {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: constantObj.messages.DATABASE_ISSUE
                            }
                        });

                    } else {

                        if (modelName == 'users' && email != "" && email != null && email != undefined) {
                            var transport = nodemailer.createTransport(smtpTransport({
                                host: sails.config.appSMTP.host,
                                port: sails.config.appSMTP.port,
                                debug: sails.config.appSMTP.debug,
                                auth: {
                                    user: sails.config.appSMTP.auth.user, //access using /congig/appSMTP.js
                                    pass: sails.config.appSMTP.auth.pass
                                }
                            }));

                            if (updated_status == 'deactive') {
                                var msgText = 'deactivated. ' + constantObj.messages.CONTACT_ADMINISTRATOR;
                            } else {
                                var msgText = 'activated.';
                            }

                            message = 'Hello ' + data.fullName + ",";
                            message += '<br/><br/>';
                            message += constantObj.messages.YOUR_ACCOUNT + " " + msgText;
                            message += '<br/><br/><br/>';
                            message += 'Regards,';
                            message += '<br/>';
                            message += 'FarmX Support Team';

                            transport.sendMail({
                                from: sails.config.appSMTP.auth.user,
                                to: email,
                                subject: 'Account Notification',
                                html: message
                            }, function (err, info) {

                                if (err) {
                                    return res.jsonx({
                                        success: false,
                                        error: {
                                            message: constantObj.messages.SEND_MAIL_ISSUE
                                        },
                                        //error: err
                                    });
                                } else {
                                    return res.jsonx({
                                        success: true,
                                        data: {
                                            message: constantObj.messages.STATUS_CHANGED
                                        }
                                    });
                                }

                            });
                        } else {
                            return res.jsonx({
                                success: true,
                                data: {
                                    message: constantObj.messages.STATUS_CHANGED
                                }
                            });
                        }
                    }

                });
            }
        })
    },

    uploadDocument: function (req, res) {

        var fs = require('fs');
        var uuid = require('uuid');
        var randomStr = uuid.v4();
        var date = new Date();
        var currentDate = date.valueOf();

        var modelName = req.body.type;

        //var modelName = 'crops';

        var Model = sails.models[modelName];
        var name = randomStr + "-" + currentDate;

        var docdata = req.body.data;
        // console.log(req.file('doc'), 'docdata==', docdata)
        docBuffer = this.decodeBase64Image(docdata);

        var imageType = docBuffer.type;

        var typeArr = new Array();
        typeArr = imageType.split("/");
        var fileExt = typeArr[1];
        // console.log(fileExt, '=====')
        var size = Buffer.byteLength(docdata, "base64");

        var i = parseInt(Math.floor(Math.log(size) / Math.log(1024)));
        var test = Math.round(size / Math.pow(1024, i), 2);

        if (size <= 10737418) {
            // console.log(fileExt, '=====')
            if ((fileExt === 'jpeg') || (fileExt === 'JPEG') || (fileExt === 'JPG') || (fileExt === 'jpg') || (fileExt === 'PNG') || (fileExt === 'png') || (fileExt === 'pdf') || (fileExt === 'doc' || fileExt === 'docm' || fileExt === 'docx')) {
                if (docBuffer.error) return docBuffer.error;



                var fullPath = name + '.' + fileExt;
                var docPath = '/docs/' + modelName + '/' + name + '.' + fileExt;
                var uploadLocation = 'assets/docs/' + modelName + '/' + name + '.' + fileExt;


                var thumbnails = [];

                fs.writeFile('assets/docs/' + modelName + '/' + name + '.' + fileExt, docBuffer.data, function (docerr, doc) {

                    if (docerr) {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: docerr

                            },
                        });
                    } else {

                        fs.readFile(uploadLocation, function (err, data) {
                            if (err) {
                                return res.jsonx({
                                    success: false,
                                    error: {
                                        code: 400,
                                        message: err
                                    },
                                });
                            }
                            if (data) {
                                var thumbpath = 'assets/docs/' + modelName + '/thumbnail/' + name + '.' + fileExt;
                                gm(data)
                                    .resize('200', '200', '!')
                                    .write(thumbpath, function (err) {
                                        if (!err) {
                                            thumbnails.push(thumbpath)
                                            return res.jsonx({
                                                success: true,
                                                data: {
                                                    fullPath: fullPath,
                                                    docPath: docPath,
                                                },
                                            });
                                        } else {
                                            return res.jsonx({
                                                success: false,
                                                error: {
                                                    code: 400,
                                                    message: constantObj.messages.NOT_UPLOADED

                                                },
                                            });
                                        }
                                    });

                            }
                        });
                    }

                });

            } else {

                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: constantObj.messages.INVALID_DOC

                    },
                });

            }
        } else {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: constantObj.messages.SIZE_EXCEEDED

                },
            });
        }
    },

    payment: function (req, res) {
        API(commonService.highCapexPayment, req, res);
    },

    cartDistanceAddress: function (req, res) {

        let loggedIn = req.identity.id;
        let destination = req.body.destination;

        let destinations = [];

        let googleApiKey = constantObj.googlePlaces.key;


        distance.key(googleApiKey);
        distance.units('metric');

        let dist = [];
        let errorMessage = "Input address not valid";
        let errorFlag = false;

        Carts.find({
            user: loggedIn
        }).populate('crop')
            .populate('input')
            .then(function (carts) {
                let origins = [];

                for (var i = 0; i < carts.length; i++) {
                    let origin;
                    if (carts[i].crop) {
                        origin = getOriginAddress(carts[i].crop);
                    }
                    if (carts[i].input) {
                        origin = getOriginAddress(carts[i].input);
                    }
                    origins.push(origin);
                    destinations.push(destination);
                }

                distance.matrix(origins, destinations, (err, distances) => {
                    if (err) {
                        errorFlag = true;
                        return res.json({
                            success: 'false',
                            message: errorMessage
                        });
                    }
                    if (!distances) {
                        // return 
                        errorFlag = true;
                        return res.json({
                            success: 'false',
                            message: errorMessage
                        });
                    }

                    if (distances == 'undefined') {
                        errorFlag = true;
                        return res.json({
                            success: 'false',
                            message: errorMessage
                        });
                    }

                    if (distances.status == 'OK') {

                        for (var i = 0; i < origins.length; i++) {

                            for (var j = 0; j < destinations.length; j++) {

                                var origin = distances.origin_addresses[i];
                                var destination = distances.destination_addresses[j];

                                if (distances.rows[0].elements[j].status == 'OK') {
                                    let cartId = carts[i].id;
                                    distances.rows[i].elements[j]["cart"] = cartId;
                                    dist.push(distances.rows[i].elements[j]);
                                    errorFlag = false;
                                    break;
                                } else {
                                    errorFlag = true;
                                }
                            }
                        }

                        if (!errorFlag) {
                            let distancesss = [];

                            Settings.find({}).then(function (settings) {
                                if (settings.length > 0) {
                                    let setting = settings[0]
                                    var logisticPricePerKM = setting.crop.logisticCharges
                                    if (!logisticPricePerKM) {
                                        logisticPricePerKM = 15.5
                                    }

                                    dist.forEach(function (ele, index) {

                                        let getDist = ele.distance.value / 1000;
                                        let itemRate = (getDist * logisticPricePerKM);
                                        dist[index]['rate'] = itemRate;


                                    });


                                    return res.json({
                                        success: 'true',
                                        data: dist
                                    });
                                } else {
                                    return res.json({
                                        success: 'false',
                                        message: "Unknown Error Occurred"
                                    });
                                }
                            }).fail(function (err) {
                                return res.json({
                                    success: 'false',
                                    message: err
                                });
                            })
                        } else {
                            return res.json({
                                success: 'false',
                                message: errorMessage
                            });
                        }



                    } else {

                        return res.json({
                            success: 'false',
                            message: errorMessage
                        });
                    }
                });

            });
    },

    googleAddress: function (req, res) {

        let origin = req.body.origin;
        let destination = req.body.destination;

        let origins = [origin];
        let destinations = [destination];

        let googleApiKey = constantObj.googlePlaces.key;


        distance.key(googleApiKey);
        distance.units('metric');

        let dist = '';
        let errorMessage = "Input address not valid";
        let errorFlag = false;

        distance.matrix(origins, destinations, function (err, distances) {
            if (err) {
                // return 
                errorFlag = true;
                return res.json({
                    success: 'false',
                    message: errorMessage
                });
            }
            if (!distances) {
                // return 
                errorFlag = true;
                return res.json({
                    success: 'false',
                    message: errorMessage
                });
            }

            if (distances == 'undefined') {
                errorFlag = true;
                return res.json({
                    success: 'false',
                    message: errorMessage
                });
            }

            if (distances.status == 'OK') {
                for (var i = 0; i < origins.length; i++) {
                    for (var j = 0; j < destinations.length; j++) {
                        var origin = distances.origin_addresses[i];
                        var destination = distances.destination_addresses[j];
                        if (distances.rows[0].elements[j].status == 'OK') {
                            // dist = distances.rows[i].elements[j].distance.text;
                            dist = distances.rows[i].elements[j];
                            errorFlag = false;
                            break;
                        } else {
                            errorFlag = true;
                        }
                    }
                }

                if (!errorFlag) {
                    let distancesss = (dist.distance.value / 1000);
                    Settings.find({}).then(function (settings) {
                        if (settings.length > 0) {
                            let setting = settings[0]
                            var logisticPricePerKM = setting.crop.logisticCharges
                            if (!logisticPricePerKM) {
                                logisticPricePerKM = 15.5
                            }

                            let itemRate = (distancesss * logisticPricePerKM);
                            dist['rate'] = itemRate;
                            return res.json({
                                success: 'true',
                                data: dist
                            });
                        } else {
                            return res.json({
                                success: 'false',
                                message: "Unknown Error Occurred"
                            });
                        }
                    }).fail(function (err) {
                        return res.json({
                            success: 'false',
                            message: err
                        });
                    })
                } else {
                    return res.json({
                        success: 'false',
                        message: errorMessage
                    });
                }
            } else {

                return res.json({
                    success: 'false',
                    message: errorMessage
                });
            }
        });
    },

    getLatLong: function (req, res) {

        var geocoder = NodeGeocoder(constantObj.googlePlaces.options);

        geocoder.geocode(req.param("address"), function (err, response) {
            if (err) {
                return res.jsonx({
                    success: 'false',
                    error: err
                });
            } else {
                return res.jsonx({
                    success: 'true',
                    data: response
                });
            }
        });
    },

    getTotalDistanceAndTime: function (req, res) {

        // let origin = req.body.origin;
        // let destination = req.body.destination;

        let origins = req.body.origin;
        let destinations = req.body.destination;

        let googleApiKey = constantObj.googlePlaces.key;


        distance.key(googleApiKey);
        distance.units('metric');


        distance.matrix(origins, destinations, function (err, distances) {
            console.log("err == ", req.body)
            return res.jsonx({
                err: err,
                distances: distances
            })
        })
    },

    getDirections: function (req, res) {
        const googleMapsClient = require('@google/maps').createClient({
            key: constantObj.googlePlaces.key
        });

        googleMapsClient.directions({
            origin: req.body.origin,
            destination: req.body.destination,
            waypoints: req.body.waypoints,
            optimize: false
        }, function (err, response) {
            if (!err) {
                console.log(response.json);
                return res.jsonx({
                    final: response.json
                })
            } else {
                return res.jsonx({
                    err: err
                })
            }
        })
    },

    hashGenerator: function (req, res) {
        var sha512 = require('sha512');

        var key = constantObj.payu.KEY;
        var salt = constantObj.payu.SALT;

        var hash = sha512(req.param('hashconst'))
        return hash.toString('hex');

        //\(params.key)|\(txnid)|\(params.amount)|\(params.productinfo)|\(params.firstname)|\(params.email)|||||||||||e5iIg1jwi8"

    },

    /*function to generate payment hash code. */
    generateHashCode: function (req, res) {

        var sha512 = require('sha512')

        var txnid = req.body.txnid;
        var amount = req.body.amount;
        var productinfo = req.body.productinfo;
        var firstname = req.body.firstname;
        var email = req.body.email;
        var udf1 = req.body.udf1;
        var udf2 = req.body.udf2;
        var udf3 = (req.body.udf3) ? req.body.udf3 : '';
        var udf4 = (req.body.udf4) ? req.body.udf4 : '';
        var udf5 = (req.body.udf5) ? req.body.udf5 : '';
        var udf6 = (req.body.udf6) ? req.body.udf6 : '';
        var udf7 = (req.body.udf7) ? req.body.udf7 : '';
        var udf8 = (req.body.udf8) ? req.body.udf8 : '';
        var udf9 = (req.body.udf9) ? req.body.udf9 : '';
        var udf10 = (req.body.udf10) ? req.body.udf10 : '';

        var key = req.body.key;
        var salt = req.body.salt;



        // $hashSequence = "key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10";
        var hashSequence = key + "|" + txnid + "|" + amount + "|" + productinfo + "|" + firstname + "|" + email + "|" + udf1 + "|" + udf2 + "|" + udf3 + "|" + udf4 + "|" + udf5 + "|" + udf6 + "|" + udf7 + "|" + udf8 + "|" + udf9 + "|" + udf10 + "|" + salt;

        var hash = sha512(hashSequence)
        var hashSting = hash.toString('hex');

        return res.json({
            success: 'true',
            hash: hashSting
        });
    },

    success: function (req, res) {

        let itemID = req.body.udf1;
        let referer = req.body.udf2;
        let taxId = req.body.payuMoneyId;

        /*code to update Tranasction collection */
        /****************************************/
        let transactionData = {};
        transactionData.transactionId = taxId;
        transactionData.paymentjson = req.body;
        transactionData.processStatus = req.body.status

        let bidpayment = {};

        BidService.transectionCreate(transactionData).then(function (paymentsData) {

            let tId = paymentsData.id;
            // let url = referer + '/#/payments/success/' + itemID + '/' + tId;
            let url = referer + '/payments/success/' + itemID + '/' + tId;

            return res.redirect(url);
        });
    },

    failure: function (req, res) {


        let itemID = req.body.udf1;
        let referer = req.body.udf2;

        // let url = referer + '/#/payments/failure/' + itemID;
        let url = referer + '/payments/failure/' + itemID;
        return res.redirect(url);
    },
    //return res.redirect('http://localhost:4200/#/payments/failure');
    //},

    deleteOrders: function (req, res) {
        return res.json({
            success: 'true',
            "message": "Tesing..."
        });
    },

    mainSearch: function (req, res) {

        var keyword = req.body.keyword;
        var type = req.body.type;
        if (type != '') {
            var Model = sails.models[type];
        }

        if (keyword && type == '') {


            var catQuery = {};
            var userQuery = {};
            var cropQuery = {};
            var inputQuery = {};
            var landQuery = {};
            var equipmentQuery = {};

            catQuery.status = "active";
            catQuery.isDeleted = false;

            catQuery.$or = [{
                name: {
                    $regex: new RegExp(keyword, 'i')
                }
            },
            {
                variety: {
                    $regex: new RegExp(keyword, 'i')
                }
            }
            ];

            /*userQuery.isDeleted = false;
            userQuery.$or = [
                { firstName: {$regex: new RegExp(keyword, 'i')}},
                { lastName: {$regex: new RegExp(keyword, 'i')}},
                { fullName: {$regex: new RegExp(keyword, 'i')}}
            ];*/

            cropQuery.isDeleted = false;
            cropQuery.isApproved = true;
            cropQuery.isExpired = false;
            cropQuery.endDate = {
                $gte: new Date()
            } //$gte: new Date(new Date().getTime()-60*5*1000).toISOString()
            cropQuery.$or = [{
                name: {
                    $regex: new RegExp(keyword, 'i')
                }
            }];

            inputQuery.isDeleted = false;
            inputQuery.$or = [{
                name: {
                    $regex: new RegExp(keyword, 'i')
                }
            }];

            equipmentQuery.isDeleted = false;
            equipmentQuery.isApproved = true;
            equipmentQuery.paymentId = {
                $exists: false
            };
            equipmentQuery.orderId = {
                $exists: false
            };
            equipmentQuery.endDate = {
                $gte: new Date()
            } //$gte: new Date(new Date().getTime()-60*5*1000).toISOString()
            equipmentQuery.$or = [{
                name: {
                    $regex: new RegExp(keyword, 'i')
                }
            }];

            Promise.all([

                Category.find(catQuery).sort('name ASC').then(),

                //Users.find(userQuery).sort('firstName ASC').then(),				

                Crops.find(cropQuery).sort('name ASC').then(),

                Inputs.find(inputQuery).sort('name ASC').then(),

                Equipment.find(equipmentQuery).sort('name ASC').then(),

            ]).spread(function (Category, /*Users,*/ Crops, Inputs, Equipment) {
                return res.jsonx({
                    success: true,
                    data: {
                        Category: Category,
                        //Users : Users,
                        Crops: Crops,
                        Inputs: Inputs,
                        Equipment: Equipment
                    },
                });
            }).fail(function (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
                //res.jsonx(err);

            });
        } else if (keyword && type) {

            var query = {};
            var catQ = {};
            query.isDeleted = false;

            catQ.type = type;
            catQ.$or = [{
                name: {
                    $regex: new RegExp(keyword, 'i')
                }
            },
            {
                variety: {
                    $regex: new RegExp(keyword, 'i')
                }
            }
            ];

            if (type == 'crops') {
                query.isApproved = true;
                query.isExpired = false;
                query.endDate = {
                    $gte: new Date()
                };
                query.$or = [{
                    name: {
                        $regex: new RegExp(keyword, 'i')
                    }
                }];
            } else if (type == 'equipment') {
                query.isApproved = true;
                query.paymentId = {
                    $exists: false
                };
                query.orderId = {
                    $exists: false
                };
                query.endDate = {
                    $gte: new Date()
                };
                query.$or = [{
                    name: {
                        $regex: new RegExp(keyword, 'i')
                    }
                }];
            }


            Promise.all([
                Category.find(catQ).sort('name ASC').then(),
                Model.find(query).sort('name ASC').then(),
            ]).spread(function (Category, Model) {
                return res.jsonx({
                    success: true,
                    data: {
                        Category: Category,
                        Model: Model
                    },
                });
            }).fail(function (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            });

        }
    },

    postPayTm: function (req, res) {
        const reqHOst = req.headers.origin;
        var paramlist = req.body;
        /*return res.json({
                success: true,
                data: { "MID" : "EFARME78610588610733",
                        "ORDER_ID" : "ORDS82731829",
                        "CUST_ID" : "CUST001",
                        "INDUSTRY_TYPE_ID" : "Retail109" ,
                        "CHANNEL_ID" : "WAP",
                        "TXN_AMOUNT" : 1,
                        "WEBSITE" : "APPPROD",
                        "CALLBACK_URL" : "https://securegw.paytm.in/theia/paytmCallback?ORDER_ID=ORDS82731829",
                        "CHECKSUMHASH" : "R5arTsbaEXFt+6BEn3VuEl9L7aLahWaOyxyyASyb44OyUgKYlG0mAdK/6jsVjIF83t/3NYMtfhZ2LJS1Bj67b+CdOd4jza+++fP7v1EdnoQ="
                        }
            });*/

        var paramarray = new Array();
        var code = commonService.getUniqueCode();
        code = "ORD_" + code;
        if (req.body.ENV == "" || req.body.ENV == undefined) {
            return res.json({
                success: false,
                msg: "ENV is required"
            });
        }

        let envPaytm = req.body.ENV;

        paramlist['ORDER_ID'] = code;
        paramlist['CUST_ID'] = req.identity.id;
        paramlist['INDUSTRY_TYPE_ID'] = constantObj.paytm_config[envPaytm].INDUSTRY_TYPE_ID;
        //paramlist['PAYTM_MERCHANT_KEY'] = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;
        paramlist['MID'] = constantObj.paytm_config[envPaytm].MID;
        if (paramlist['CHANNEL_ID'] == 'WEB') {
            paramlist['MOBILE_NO'] = constantObj.paytm_config[envPaytm].PAYTM_MOBILE;
            paramlist['EMAIL'] = constantObj.paytm_config[envPaytm].PAYTM_EMAIL;
        }

        var itemId = paramlist['ITEM_ID'];
        delete paramlist['ITEM_ID'];
        delete paramlist['ENV'];

        var paramArray = {};
        for (name in paramlist) {
            console.log("name", name)
            if (name == 'PAYTM_MERCHANT_KEY') {
                var PAYTM_MERCHANT_KEY = paramlist[name];
            } else {
                paramarray[name] = paramlist[name];
            }
            paramArray[name] = paramlist[name];
        }

        if (paramlist['CHANNEL_ID'] == 'WEB') {
            if (sails.getBaseUrl() == 'http://dev-api.farmx.co.in') {
                sails.config.PAYTM_API_URL = sails.getBaseUrl();
            }
            paramarray['CALLBACK_URL'] = sails.config.PAYTM_API_URL + '/paytmresponse/' + itemId + '?origin=' + reqHOst + '&env=' + envPaytm; // in case if you want to send callback

        } else {
            if (envPaytm == "production") {
                paramarray['CALLBACK_URL'] = "https://securegw.paytm.in/theia/paytmCallback?ORDER_ID=" + code;
            } else {
                paramarray['CALLBACK_URL'] = "https://pguat.paytm.com/paytmchecksum/paytmCallback.jsp";
            }
        }

        console.log("parametersssssss", paramarray);
        let paytm_key = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;
        Payments.genchecksum(paramarray, paramArray, paytm_key, function (err, result) {
            console.log("result", result)

            return res.json({
                success: true,
                data: result.paramArray
            });
        });
    },


    responsePayTm: function (req, res) {
        var request = require('request');
        var itemID = req.param("id");
        var origin = req.query.origin;
        var envPaytm = req.query.env;

        var paramlist = req.body;
        var transactId = paramlist.TXNID;
        var paramarray = new Array();
        var paramArray = {};

        if (paramlist.STATUS == 'TXN_SUCCESS') {

            if (Payments.verifychecksum(paramlist, constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY)) {

                var transactionData = {};
                transactionData.transactionId = transactId;
                transactionData.paymentjson = paramlist;
                transactionData.processStatus = paramlist.STATUS
                transactionData.productType = "crop";
                transactionData.crop = itemID;

                let bidpayment = {};
                BidService.transectionCreate(transactionData).then(function (paymentsData) {
                    console.log("paymentsDatapaymentsDatapaymentsData=============", paymentsData)
                    let tId = paymentsData.id;
                    // let url = origin + '/#/payments/success/' + itemID + '/' + tId;
                    let url = origin + '/payments/success/' + itemID + '/' + tId;

                    return res.redirect(url);
                });

            } else {
                // let url = origin + '/#/payments/failure/' + itemID

                let url = origin + '/payments/failure/' + itemID
                return res.redirect(url);
            };
        } else {
            // let url = origin + '/#/payments/failure/' + itemID
            let url = origin + '/payments/failure/' + itemID
            return res.redirect(url);
        }
    },

    postPayTmForBidPayment: function (req, res) {
        const reqHOst = req.headers.origin;
        var paramlist = req.body;

        var paramarray = new Array();
        var itemId = paramlist['ITEM_ID'];
        var bidId = paramlist['BID_ID'];
        var interestId = paramlist['INTEREST_ID'];
        let code = "ORD_" + commonService.getUniqueCode();
        let paymentfor = 'cropBid'
        if (interestId != undefined && interestId != "") {
            paymentfor = 'landinterest'
            bidId = interestId
        }

        if (req.body.ENV == "" || req.body.ENV == undefined) {
            return res.json({
                success: false,
                msg: "ENV is required"
            });
        }

        let envPaytm = req.body.ENV;

        paramlist['ORDER_ID'] = code;
        paramlist['CUST_ID'] = req.identity.id;
        paramlist['INDUSTRY_TYPE_ID'] = constantObj.paytm_config[envPaytm].INDUSTRY_TYPE_ID;
        //paramlist['PAYTM_MERCHANT_KEY'] = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;
        paramlist['MID'] = constantObj.paytm_config[envPaytm].MID;
        if (paramlist['CHANNEL_ID'] == 'WEB') {
            paramlist['MOBILE_NO'] = constantObj.paytm_config[envPaytm].PAYTM_MOBILE;
            paramlist['EMAIL'] = constantObj.paytm_config[envPaytm].PAYTM_EMAIL;
        }

        delete paramlist['ITEM_ID'];
        delete paramlist['ENV'];
        delete paramlist['BID_ID']
        delete paramlist['INTEREST_ID']

        var paramArray = {};
        for (name in paramlist) {
            if (name == 'PAYTM_MERCHANT_KEY') {
                var PAYTM_MERCHANT_KEY = paramlist[name];
            } else {
                paramarray[name] = paramlist[name];
            }
            paramArray[name] = paramlist[name];
        }

        if (paramlist['CHANNEL_ID'] == 'WEB') {
            paramarray['CALLBACK_URL'] = sails.config.PAYTM_API_URL + '/paytmbidpaymentresponse/' + itemId + '/' + bidId + '?origin=' + reqHOst + '&env=' + envPaytm + '&paymentfor=' + paymentfor; // in case if you want to send callback
        } else {
            if (envPaytm == "production") {
                paramarray['CALLBACK_URL'] = "https://securegw.paytm.in/theia/paytmCallback?ORDER_ID=" + code;
            } else {
                paramarray['CALLBACK_URL'] = "https://pguat.paytm.com/paytmchecksum/paytmCallback.jsp";
            }
        }

        let paytm_key = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;
        Payments.genchecksum(paramarray, paramArray, paytm_key, function (err, result) {
            return res.json({
                success: true,
                data: result.paramArray
            });
        });
    },


    bidPaymentResponsePayTm: function (req, res) {
        var request = require('request');
        var itemID = req.param("id");
        var bidID = req.param("bidid");
        var paramlist = req.body;
        var channelId = paramlist.CHANNEL_ID;
        var paymentfor = req.query.paymentfor

        if (channelId != null && channelId != undefined && channelId == 'WAP') {

            var paymentjsonrec = paramlist.paymentjson
            var transactId = paramlist.transactionId;
            var transactStatus = paramlist.processStatus;
            if (transactStatus != 'TXN_SUCCESS') {
                return res.json({
                    success: false,
                    msg: "Tranasction is not successful."
                });
            } else {
                Bidspayment.findOne({ id: itemID }).then(function (buyer_payment) {
                    if (buyer_payment) {
                        var transactionData = {};
                        transactionData.transactionId = transactId;
                        transactionData.paymentjson = paymentjsonrec;
                        transactionData.processStatus = transactStatus
                        if (paymentfor == 'landinterest') {
                            transactionData.productType = "land";
                            transactionData.land = buyer_payment.land;
                            transactionData.landInterestId = buyer_payment.landInterestId
                        } else {
                            transactionData.productType = "crop";
                            transactionData.crop = buyer_payment.cropId;
                            transactionData.bidId = buyer_payment.bidId
                        }
                        transactionData.buyerId = buyer_payment.buyerId
                        transactionData.sellerId = buyer_payment.sellerId

                        let bidpayment = {};
                        BidService.transectionCreate(transactionData).then(function (paymentsData) {
                            let paymentData = {}
                            paymentData.paymentDate = new Date()
                            paymentData.depositedOn = new Date()
                            paymentData.isVerified = true
                            paymentData.transactionId = paymentsData.id
                            paymentData.paymentMode = 'PayTm'
                            paymentData.status = 'Verified';
                            Bidspayment.update({ id: itemID }, paymentData).then(function (bidpayment) {
                                if (paymentfor == 'landinterest') {
                                    commonService.checkLandPaymentsStatus(itemID)
                                }
                                return res.json({
                                    success: true,
                                    data: bidpayment[0]
                                });
                            }).fail(function (err) {
                                return res.json({
                                    success: 'false',
                                    message: err
                                });
                            })
                        }).fail(function (err) {
                            return res.json({
                                success: 'false',
                                message: err
                            });
                        });
                    }
                });
            }
        } else {
            var origin = req.query.origin;
            var envPaytm = req.query.env;

            var transactId = paramlist.TXNID;
            var paramarray = new Array();
            var paramArray = {};

            if (paramlist.STATUS == 'TXN_SUCCESS') {

                if (Payments.verifychecksum(paramlist, constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY)) {

                    Bidspayment.findOne({ id: itemID }).then(function (buyer_payment) {
                        if (buyer_payment) {
                            var transactionData = {};
                            transactionData.transactionId = transactId;
                            transactionData.paymentjson = paramlist;
                            transactionData.processStatus = paramlist.STATUS
                            if (paymentfor == 'landinterest') {
                                transactionData.productType = "land";
                                transactionData.land = buyer_payment.land;
                                transactionData.landInterestId = buyer_payment.landInterestId
                            } else {
                                transactionData.productType = "crop";
                                transactionData.crop = buyer_payment.cropId;
                                transactionData.bidId = buyer_payment.bidId
                            }
                            transactionData.buyerId = buyer_payment.buyerId
                            transactionData.sellerId = buyer_payment.sellerId

                            let bidpayment = {};
                            BidService.transectionCreate(transactionData).then(function (paymentsData) {
                                let paymentData = {}
                                paymentData.paymentDate = new Date()
                                paymentData.depositedOn = new Date()
                                paymentData.isVerified = true
                                paymentData.transactionId = paymentsData.id
                                paymentData.paymentMode = 'PayTm'
                                paymentData.status = 'Verified';
                                Bidspayment.update({ id: itemID }, paymentData).then(function (bidpayment) {
                                    // let url = origin + '/#/crops/bidpayments/' + bidID;
                                    if (paymentfor == 'landinterest') {
                                        console.log("yes going in land deals")
                                        commonService.checkLandPaymentsStatus(itemID)
                                        let url = origin + '/lands/payment/' + bidID;
                                        return res.redirect(url);
                                    } else {
                                        let url = origin + '/crops/bidpayments/' + bidID;
                                        return res.redirect(url);
                                    }

                                })
                            });
                        }
                    });
                } else {
                    // let url = origin + '/#/crops/bidpayments/' + bidID;
                    if (paymentfor == 'landinterest') {
                        let url = origin + '/lands/payment/' + bidID;
                        return res.redirect(url);
                    } else {
                        let url = origin + '/crops/bidpayments/' + bidID;
                        return res.redirect(url);
                    }
                };
            } else {
                // let url = origin + '/#/crops/bidpayments/' + bidID;
                if (paymentfor == 'landinterest') {
                    let url = origin + '/lands/payment/' + bidID;
                    return res.redirect(url);
                } else {
                    let url = origin + '/crops/bidpayments/' + bidID;
                    return res.redirect(url);
                }
            }
        }
    },

    postPayTmForSellerPayment: function (req, res) {
        const reqHOst = req.headers.origin;
        var paramlist = req.body;

        var paramarray = new Array();
        var itemId = paramlist['ITEM_ID'];
        var bidId = paramlist['CROP_ID'];
        let code = "ORD_" + commonService.getUniqueCode();
        if (req.body.ENV == "" || req.body.ENV == undefined) {
            return res.json({
                success: false,
                msg: "ENV is required"
            });
        }

        let envPaytm = req.body.ENV;

        paramlist['ORDER_ID'] = code;
        paramlist['CUST_ID'] = req.identity.id;
        paramlist['INDUSTRY_TYPE_ID'] = constantObj.paytm_config[envPaytm].INDUSTRY_TYPE_ID;
        //paramlist['PAYTM_MERCHANT_KEY'] = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;
        paramlist['MID'] = constantObj.paytm_config[envPaytm].MID;
        if (paramlist['CHANNEL_ID'] == 'WEB') {
            paramlist['MOBILE_NO'] = constantObj.paytm_config[envPaytm].PAYTM_MOBILE;
            paramlist['EMAIL'] = constantObj.paytm_config[envPaytm].PAYTM_EMAIL;
        }

        delete paramlist['ITEM_ID'];
        delete paramlist['ENV'];
        delete paramlist['CROP_ID']

        var paramArray = {};
        for (name in paramlist) {
            if (name == 'PAYTM_MERCHANT_KEY') {
                var PAYTM_MERCHANT_KEY = paramlist[name];
            } else {
                paramarray[name] = paramlist[name];
            }
            paramArray[name] = paramlist[name];
        }

        if (paramlist['CHANNEL_ID'] == 'WEB') {
            paramarray['CALLBACK_URL'] = sails.config.PAYTM_API_URL + '/paytmsellerpaymentresponse/' + itemId + '/' + bidId + '?origin=' + reqHOst + '&env=' + envPaytm; // in case if you want to send callback
        } else {
            if (envPaytm == "production") {
                paramarray['CALLBACK_URL'] = "https://securegw.paytm.in/theia/paytmCallback?ORDER_ID=" + code;
            } else {
                paramarray['CALLBACK_URL'] = "https://pguat.paytm.com/paytmchecksum/paytmCallback.jsp";
            }
        }

        let paytm_key = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;
        Payments.genchecksum(paramarray, paramArray, paytm_key, function (err, result) {
            console.log("result == ", result)
            return res.json({
                success: true,
                data: result.paramArray
            });
        });
    },


    sellerPaymentResponsePayTm: function (req, res) {
        var request = require('request');
        var itemID = req.param("id");
        var cropid = req.param("cropid");
        var paramlist = req.body;
        var channelId = paramlist.CHANNEL_ID;
        console.log("paramlist == ", paramlist)
        if (channelId != null && channelId != undefined && channelId == 'WAP') {

            var paymentjsonrec = paramlist.paymentjson
            var transactId = paramlist.transactionId;
            var transactStatus = paramlist.processStatus;
            if (transactStatus != 'TXN_SUCCESS') {
                console.log("paramlist 1 == ")
                return res.json({
                    success: false,
                    msg: "Tranasction is not successful."
                });
            } else {
                console.log("paramlist 2 == ")
                Sellerpayment.findOne({ id: itemID }).then(function (buyer_payment) {
                    console.log("paramlist 3 == ")
                    if (buyer_payment) {
                        console.log("paramlist 4 == ")
                        var transactionData = {};
                        transactionData.transactionId = transactId;
                        transactionData.paymentjson = paymentjsonrec;
                        transactionData.processStatus = transactStatus
                        transactionData.productType = "crop";
                        transactionData.crop = buyer_payment.cropId;
                        transactionData.buyerId = buyer_payment.buyerId
                        transactionData.sellerId = buyer_payment.sellerId
                        transactionData.bidId = buyer_payment.bidId
                        transactionData.landInterestId = buyer_payment.landInterestId
                        transactionData.land = buyer_payment.landId
                        if (transactionData.landInterestId) {
                            transactionData.productType = "land";
                        }

                        let bidpayment = {};
                        BidService.transectionCreate(transactionData).then(function (paymentsData) {
                            console.log("paramlist 5 == ")
                            let paymentData = {}
                            paymentData.paymentDate = new Date()
                            paymentData.depositedOn = new Date()
                            paymentData.isVerified = true
                            paymentData.transactionId = paymentsData.id
                            paymentData.paymentMode = 'PayTm'
                            paymentData.status = 'RefundVerified';
                            Sellerpayment.update({ id: itemID }, paymentData).then(function (bidpayment) {
                                console.log("paramlist 6 == ")
                                return res.json({
                                    success: true,
                                    data: bidpayment[0]
                                });
                            }).fail(function (err) {
                                return res.json({
                                    success: 'false',
                                    message: err
                                });
                            })
                        }).fail(function (err) {
                            return res.json({
                                success: 'false',
                                message: err
                            });
                        });
                    }
                });
            }
        } else {
            var origin = req.query.origin;
            var envPaytm = req.query.env;

            var transactId = paramlist.TXNID;
            var paramarray = new Array();
            var paramArray = {};

            if (paramlist.STATUS == 'TXN_SUCCESS') {

                if (Payments.verifychecksum(paramlist, constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY)) {

                    Sellerpayment.findOne({ id: itemID }).then(function (buyer_payment) {
                        if (buyer_payment) {
                            var transactionData = {};
                            transactionData.transactionId = transactId;
                            transactionData.paymentjson = paramlist;
                            transactionData.processStatus = paramlist.STATUS
                            transactionData.productType = "crop";
                            transactionData.crop = buyer_payment.cropId;
                            transactionData.buyerId = buyer_payment.buyerId
                            transactionData.sellerId = buyer_payment.sellerId
                            transactionData.bidId = buyer_payment.bidId
                            transactionData.landInterestId = buyer_payment.landInterestId
                            transactionData.land = buyer_payment.landId
                            if (transactionData.landInterestId) {
                                transactionData.productType = "land";
                            }

                            let bidpayment = {};
                            BidService.transectionCreate(transactionData).then(function (paymentsData) {
                                let paymentData = {}
                                paymentData.paymentDate = new Date()
                                paymentData.depositedOn = new Date()
                                paymentData.isVerified = true
                                paymentData.transactionId = paymentsData.id
                                paymentData.paymentMode = 'PayTm'
                                paymentData.status = 'RefundVerified';
                                Sellerpayment.update({ id: itemID }, paymentData).then(function (bidpayment) {
                                    // let url = origin + '/#/crops/mypayments/' + cropid;
                                    let url = origin + '/crops/mypayments/' + cropid;
                                    return res.redirect(url);
                                })
                            });
                        }
                    });
                } else {
                    // let url = origin + '/#/crops/mypayments/' + cropid;
                    let url = origin + '/crops/mypayments/' + cropid;
                    return res.redirect(url);
                };
            } else {
                // let url = origin + '/#/crops/mypayments/' + cropid;
                let url = origin + '/crops/mypayments/' + cropid;
                return res.redirect(url);
            }
        }
    }
}; // End of module export


