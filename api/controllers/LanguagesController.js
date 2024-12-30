
var constantObj = sails.config.constants;
/**
 * CommonController
 *
 * @description :: Server-side logic for managing equipment
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	getLoginUserLanguage: function (req, res) {
		if (req.identity.id) {
			let langCode = '';
			//console.log(req.user, 'userid');
			if (!req.param('code')) {
				langCode = "en";
			} else {
				langCode = req.param('code');
			}
			Users.update({ id: req.identity.id }, { selectedLanguage: langCode }).then(function (user) {
				let query = {};
				query.code = langCode;

				Languages.findOne(query)

					.then(function (language) {
						if (language === undefined) {
							return res.status(400).jsonx({
								success: false,
								error: constantObj.languages.LANGUAGE_NOT_FOUND
							});
						} else {
							return res.jsonx({
								success: true,
								data: language
							});
						}
					})
			})
		}
	},

	getLanguage: function (req, res) {

		let langCode = '';
		//console.log(req.user, 'userid');
		if (!req.param('code')) {
			langCode = "en";
		} else {
			langCode = req.param('code');
		}

		let query = {};
		query.code = langCode;

		Languages.findOne(query).then(function (language) {
			if (language === undefined) {
				return res.status(400).jsonx({
					success: false,
					error: constantObj.languages.LANGUAGE_NOT_FOUND
				});
			} else {
				return res.jsonx({
					success: true,
					data: language
				});
			}
		})
	},

	getAllLang: function (req, res, next) {

		Languages.find({ select: ['name', 'code'] }).exec(function (err, lang) {
			if (err) {
				return res.status(400).jsonx({
					success: false,
					error: err
				});
			} else {
				return res.jsonx({
					success: true,
					data: {
						lang: lang
					}
				});
			}
		})
	},

	updateKeysInLanguagage: function (req, res) {

		let langCode = '';
		//console.log(req.user, 'userid');
		if (!req.body.code) {
			langCode = "en";
		} else {
			langCode = req.body.code;
		}

		let query = {};
		query.code = langCode;

		if (req.body.filePath) {
			Languages.findOne(query).then(function (language) {
				if (language === undefined) {
					return res.status(400).jsonx({
						success: false,
						error: {
							code: 400,
							message:constantObj.languages.LANGUAGE_NOT_FOUND
						}
					});
				} else {
					var fs = require('fs');
			        let filePath = 'assets/' + req.body.filePath         
			        if (fs.existsSync(filePath)) {
			        	const csvtojson = require("csvtojson");
						var json2xls = require('json2xls');

						var priceResponses = []

						let exestingKeysValues = {}
						let allKeys = []

						if (language.value) {
							exestingKeysValues = language.value
							allKeys = Object.keys(exestingKeysValues)
						}

						csvtojson().fromFile(filePath).then((jsonObj) => {
							let failedObjects = 0

			            	var priceResponses = []

			            	let filePincodes = []

			            	for (var i = 0; i < jsonObj.length; i++) {
			                	let pincodeObject = jsonObj[i]
			                	if (pincodeObject['Keys'] == undefined || pincodeObject['Keys'] == null || pincodeObject['Keys'] == '') {
			                        pincodeObject.comment = 'Key not valid'
			                        failedObjects += 1
			                    } else {
			                    	let key = pincodeObject['Keys']
			                    	let value = pincodeObject['Values']
			                    	if (allKeys != undefined && allKeys.length > 0 && allKeys.includes(key, 0)) {
				                        pincodeObject.comment = 'key already existed'
				                        failedObjects += 1			                    		
			                    	} else if (value == undefined || value == null || value == '') {
				                        pincodeObject.comment = 'Value not valid'
				                        failedObjects += 1
				                    } else {
			                        	allKeys.push(key)
			                        	exestingKeysValues[key] = value
			                    	}
			                    }
			                    priceResponses.push(pincodeObject)
			                }			               

			                var json = priceResponses;
							var xls = json2xls(json);
							let ressponsseFilePath = 'csvs/languageAddResponse.csv'
							fs.writeFileSync('./assets/' + ressponsseFilePath, xls, 'binary')

							fs.unlink(filePath, (err) => {
							  	if (err) {
							  		console.log('fileemoved error', err)
							  	}
							    console.log('fileemoved')
							})

			                Languages.update(query, {value: exestingKeysValues}).then(function(result) {
			                	if (failedObjects > 0) {
			                        return res.jsonx({
			                            success: true,
			                            data: {
					                        message: 'Language updated but ' + failedObjects + ' keys failed to add due to inappropriate data.',
			                                filePath: ressponsseFilePath,
					                        language: result[0],
			                            },
			                        });
			                    } else {                            
			                        return res.jsonx({
					                    success: true,
					                    code:200,
					                    data: {
					                        language: result[0],
					                        message: 'Language updated successfully',
			                                filePath: ressponsseFilePath
					                    },
					                });
			                    }		                
					        }).fail(function(err){
				                return {
			                  		success: false,
			                  		error: {
			                    		code: 400,
			                    		message: err,
			                        },
			              		};
					    	});                    
						})
			        } else {
			        	return res.status(400).jsonx({
							success: false,
							error: {
								code: 400,
								message:"No file exist at given path"
							}
						});
			        }
				}
			})
		} else {
			return res.status(400).jsonx({
				success: false,
				error: {
					code: 400,
					message: "Please send file path"
				}
			});
		}
	},
};