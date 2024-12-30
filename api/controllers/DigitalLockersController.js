var constantObj = sails.config.constants;
var commonServiceObj = require('../services/commonService.js');
var pushService = require('../services/PushService.js');
var moment = require('moment')
var gm = require('gm');

/**
 * DigitalLockersController
 *
 * @description :: Server-side logic for managing bids
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var ObjectId = require('mongodb').ObjectID;

var vm = this;

module.exports = {

    createLocker: function (req, res) {
        return API(DigitalLockersService.createLocker, req, res);
    },

	listLocker: function (req, res) {
        return API(DigitalLockersService.listLocker, req, res);
    },

    getLocker: function (req, res) {
        return API(DigitalLockersService.getLocker, req, res);
    },

	addDocument: function (req, res) {
        return API(DigitalLockersService.addDocument, req, res);
    },
    
	verifyDocument: function (req, res) {
        return API(DigitalLockersService.verifyDocument, req, res);
    },
    
	allDocumentsDateWise: function (req, res) {
        return API(DigitalLockersService.allDocumentsDateWise, req, res);
    },
    
	allDocumentsTypeWise: function (req, res) {
        return API(DigitalLockersService.allDocumentsTypeWise, req, res);
    },
    
	getDocument: function (req, res) {
        return API(DigitalLockersService.getDocument, req, res);
    },

    moveDocument: function(req, res) {
    	return API(DigitalLockersService.moveDocument, req, res);
    },

    deleteDocument: function(req, res) {
    	return API(DigitalLockersService.deleteDocument, req, res);
    },

    removePage: function(req, res) {
    	return API(DigitalLockersService.removePage, req, res);
    },

    deletePage: function(req, res) {
    	return API(DigitalLockersService.deletePage, req, res);
    },

    uploadPage: function (req, res) {
        var fs = require('fs');
        var uuid = require('uuid');
        var randomStr = uuid.v4();
        var date = new Date();
        var currentDate = date.valueOf();
        var randNumber = randomStr + "-" + currentDate;

        var modelName = 'locker_documents';
        let folderName = require('path').resolve(sails.config.appPath, 'assets/' + modelName);

        var origifile = req.file('document')._files[0].stream.filename;

        var filename = randNumber + "_" + origifile;

        var fullPath = filename;
        var imagePath = modelName + '/' + filename;

        var filenameandextension = origifile.split(".");
        let extension = filenameandextension[filenameandextension.length - 1]
        let type = 'image'
        let mymimetype = "image/jpeg"
        if (extension == 'pdf' || extension == 'PDF') {
        	type = 'pdf'
            mymimetype = "application/pdf"
        }

        req.file('document').upload({
            saveAs: filename,
            // don't allow the total upload size to exceed ~50MB
            maxBytes: 52428800,
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

            var uploadLocation = 'assets/' + modelName + '/' + filename;
            fs.readFile(uploadLocation, function (err, data) {

                if (err) {
                                console.log("err76576576 == ", err)
                    return res.jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: err
                        },
                    });
                } else {
                    if (data) {
		                var thumbnails = [];
            	        let page = {}
                        page.owner = req.identity.id
						page.type = type
						page.mimeType = mymimetype
                        let number = 1
                        if (req.body.number == undefined) {
                            number = 1
                        } else {
                            number = parseInt(req.body.number)
                        }
                        if (number == undefined || number == NaN) {
                            number = 1
                        }
						page.number = number
						page.fileName = origifile
						page.path = fullPath
						var stats = fs.statSync(uploadLocation)
						var fileSizeInBytes = stats.size;
						if (fileSizeInBytes != NaN) {
							page.size = "" + fileSizeInBytes
						}

                        var thumbpath = 'assets/' + modelName + '/thumbnail/200/' + filename;
                        gm(data).resize('200', '200', '^').write(thumbpath, function (err) {
                            if (!err) {
                                page.isThumbnailAvailable = true
                            }

							LockerDocumentPages.create(page).then(function (pg) {
								return res.jsonx({
                                    success: true,
                                    data: {
                                    	page: pg,
                                        fullPath: fullPath,
                                        docPath: imagePath
                                    },
                                });
							}).fail(function(error) {
								return res.jsonx({
			                        success: false,
			                        error: {
			                            code: 400,
			                            message: error
			                        }
			                    })
							})	                            
                        });
                    }
                }
            });
        });        
    }
    
}

