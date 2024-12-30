var Promise = require('bluebird'),
    promisify = Promise.promisify;
var constantObj = sails.config.constants;
var ObjectID = require('mongodb').ObjectID;

module.exports = {
    
    saveMarket: function(data,context){
   		// return Market.find( { pincode: {"$in" : data.pincode }   } ).then(function(marketres) {

   		return Market.find( { name: data.name } ).then(function(marketres) {
			// if(marketres.length > 0){
			//    return {"success": false, "error": {"code": 404,"message": constantObj.market.ALREADY_EXIST_MARKET} };
			// } else {
			if(marketres.length > 0){
			   return {"success": false, "error": {"code": 404,"message": "Market with same name already exists."} };
			} else {
				if (data.filePath != undefined) {
					var fs = require('fs');
			        let filePath = 'assets/' + data.filePath          
			        if (fs.existsSync(filePath)) {
		            	const csvtojson = require("csvtojson");
		    			var json2xls = require('json2xls');

		    			var priceResponses = []

		            	return csvtojson().fromFile(filePath).then((jsonObj) => {
		                	let failedObjects = 0

		                	var priceResponses = []

		                	let filePincodes = []                    

		                	for (var i = 0; i < jsonObj.length; i++) {
			                	let pincodeObject = jsonObj[i]
			                	if (pincodeObject['Pincodes'] == undefined || pincodeObject['Pincodes'] == null || pincodeObject['Pincodes'] == '' || parseInt(pincodeObject['Pincodes']) == undefined || pincodeObject['Pincodes'].length != 6) {
			                        pincodeObject.comment = 'Pincode not valid'
			                        failedObjects += 1
			                    } else {
			                    	let recPincode = parseInt(pincodeObject['Pincodes'])
			                    	if (data.pincode != undefined && data.pincode.length > 0 && data.pincode.includes(recPincode, 0)) {
				                        pincodeObject.comment = 'Pincode added from given manual addition'
				                        failedObjects += 1			                    		
			                    	} else if (filePincodes.length > 0 && filePincodes.includes(recPincode, 0)) {
				                        pincodeObject.comment = 'Repetitive Pincode'
				                        failedObjects += 1			                    					                    		
			                    	} else {
			                        	filePincodes.push(recPincode)
			                    	}
			                    }
			                    priceResponses.push(pincodeObject)
			                }

			                let allPincodes = []
			                if (data.pincode != undefined && data.pincode.length > 0) {
				                allPincodes = data.pincode.concat(filePincodes)											                	
			                } else if (filePincodes.length > 0){
			                	allPincodes = filePincodes
			                }
			                if (allPincodes.length > 0) {
			                	data.pincode = allPincodes
			            	}

			                var json = priceResponses;
							var xls = json2xls(json);
							let ressponsseFilePath = 'csvs/pincoderesponse.csv'
							fs.writeFileSync('./assets/' + ressponsseFilePath, xls, 'binary')

							fs.unlink(filePath, (err) => {
							  	if (err) {
							  		console.log('fileemoved error', err)
							  	}
							    console.log('fileemoved')
							})

							delete data.filePath

			                return Market.create(data).then(function(result) {
			                	if (failedObjects > 0) {
		                            return {
		                                success: true,
		                                data: {
		    		                        message: constantObj.market.SAVE_MARKET + ' but ' + failedObjects + ' pincodes failed to add due to inappropriate data.',
		                                    filePath: ressponsseFilePath,
		    		                        market: result,
		                                },
		                            };
		                        } else {                            
		                            return {
					                    success: true,
					                    code:200,
					                    data: {
					                        market: result,
					                        message: constantObj.market.SAVE_MARKET,
		                                    filePath: ressponsseFilePath
					                    },
					                };
		                        }		                
					        }).fail(function(err){
				                return {
			                  		success: false,
			                  		error: {
			                    		code: 400,
			                    		message: constantObj.market.EXIST_MARKET,
			                        },
			              		};
					    	});
			            })
			        } else {
			        	delete data.filePath
			        	return Market.create(data).then(function(result) {
	                        return {
			                    success: true,
			                    code:200,
			                    data: {
			                        market: result,
			                        message: constantObj.market.SAVE_MARKET + ' but given file does not exists',
			                    },
			                };
				        }).fail(function(err){
			                return {
		                  		success: false,
		                  		error: {
		                    		code: 400,
		                    		message: constantObj.market.EXIST_MARKET,
		                        },
		              		};
				    	});
			        }
				} else {
					return Market.create(data).then(function(result) {
                        return {
		                    success: true,
		                    code:200,
		                    data: {
		                        market: result,
		                        message: constantObj.market.SAVE_MARKET,
		                    },
		                };
			        }).fail(function(err){
		                return {
	                  		success: false,
	                  		error: {
	                    		code: 400,
	                    		message: constantObj.market.EXIST_MARKET,
	                        },
	              		};
			    	});
				}  	
		    }
		});
    },

    // updateMarket: function(data,context){
    	
    // 	return Market.update({id:data.id}, data).then(function(result) {
    //         return {
    //             success: true,
    //             code:200,
    //             data: {
    //                 market: result[0],
    //                 message: constantObj.market.UPDATE_MARKET,
    //                 key: 'UPDATE_MARKET',
    //             },
    //         };
	   //  }).fail(function(err){
    // 		return {
	   //          success: false,
	   //          error: {
	   //             code: 400,
	   //             message: constantObj.market.EXIST_MARKET,    
	   //            },
	   //      };
    // 	});
    // },

    updateMarket: function(data,context){

    	var findQry = {}
    	// findQry.pincode = {"$in" : data.pincode }
    	findQry.name = data.name
    	findQry.id = {"$ne":data.id}

    	return Market.find(findQry).then(function(marketres) {

			if(marketres.length > 0){
		   		return {"success": false, "error": {"code": 404, "message": "Market with same name already exists."} };
			} else {

	        	let query = {};
	    		query.name = data.name;
	    		query._id = { $nin: [ ObjectID(data.id) ] }
	    		query._id = String(query._id)
	        		
	       		return Market.findOne(query).then(function(cat) {
	            	
	            	if( cat == undefined ) {
	            		if (data.filePath != undefined) {
							var fs = require('fs');
			        		let filePath = 'assets/' + data.filePath          
			        		if (fs.existsSync(filePath)) {
		            			const csvtojson = require("csvtojson");
		    					var json2xls = require('json2xls');

		    					var priceResponses = []

		            			return csvtojson().fromFile(filePath).then((jsonObj) => {
		                			let failedObjects = 0

		                			var priceResponses = []

		                			let filePincodes = []                    
			
				            		return Market.findOne({id:data.id}).then(function(existingCat) {
			                			for (var i = 0; i < jsonObj.length; i++) {
				                			let pincodeObject = jsonObj[i]
				                			if (pincodeObject['Pincodes'] == undefined || pincodeObject['Pincodes'] == null || pincodeObject['Pincodes'] == '' || parseInt(pincodeObject['Pincodes']) == undefined || pincodeObject['Pincodes'].length != 6) {
				                        		pincodeObject.comment = 'Pincode not valid'
				                        		failedObjects += 1
				                    		} else {
				                    			let recPincode = parseInt(pincodeObject['Pincodes'])
				                    			if (data.pincode != undefined && data.pincode.length > 0 && data.pincode.includes(recPincode, 0)) {
					                        		pincodeObject.comment = 'Pincode added from given manual addition'
					                        		failedObjects += 1			                    		
				                    			} else if (existingCat.pincode != undefined && existingCat.pincode.length > 0 && existingCat.pincode.includes(recPincode, 0)) {
					                        		pincodeObject.comment = 'Pincode already existed in ths market'
					                        		failedObjects += 1			                    		
				                    			} else if (filePincodes.length > 0 && filePincodes.includes(recPincode, 0)) {
					                        		pincodeObject.comment = 'Repetitive Pincode'
					                        		failedObjects += 1			                    					                    		
				                    			} else {
				                        			filePincodes.push(recPincode)
				                    			}
				                    		}
				                    		priceResponses.push(pincodeObject)
				                		}

				                		let allPincodes = []
						                if (data.pincode != undefined && data.pincode.length > 0) {
							                allPincodes = data.pincode.concat(filePincodes)											                	
						                } else if (filePincodes.length > 0){
						                	allPincodes = filePincodes
						                }
						            	if (existingCat.pincode != undefined && existingCat.pincode.length > 0) {
						            		allPincodes = allPincodes.concat(existingCat.pincode)
						            	}

						                if (allPincodes.length > 0) {
						                	data.pincode = allPincodes
						            	}

						                var json = priceResponses;
										var xls = json2xls(json);
										let ressponsseFilePath = 'csvs/pincoderesponse.csv'
										fs.writeFileSync('./assets/' + ressponsseFilePath, xls, 'binary')

										fs.unlink(filePath, (err) => {
										  	if (err) {
										  		console.log('fileemoved error', err)
										  	}
										    console.log('fileemoved')
										})
				
							        	delete data.filePath

										return Market.update({id:data.id},data).then(function(cats) {
											if (failedObjects > 0) {
					                            return {
					                                success: true,
					                                data: {
					    		                        message: constantObj.market.UPDATE_MARKET + ' but ' + failedObjects + ' pincodes failed to add due to inappropriate data.',
					                                    filePath: ressponsseFilePath,
					    		                        market: cats[0],
					                                },
					                            };
					                        } else {                            
					                            return {
								                    success: true,
								                    code:200,
								                    data: {
								                        market: cats[0],
								                        message: constantObj.market.UPDATE_MARKET,
					                                    filePath: ressponsseFilePath
								                    },
								                };
					                        }					                    
						                }).fail(function(err){	                    
						                    return {
						                        success: false,
						                        error: {
						                            code: 400,
						                            message: err,
						                            filePath: ressponsseFilePath	
						                        },
						                    };   
						                });	
					                })		            
			            		})
					        } else {
					        	delete data.filePath					        	
					        	return Market.update({d:data.id},data).then(function(cats) {
				                    return {
				                        success: true,
				                        code:200,
				                        data: {
				                            market:cats[0],
				                            message: constantObj.market.UPDATE_MARKET + ' but given file does not exists',
				                            key: 'UPDATE_MARKET'
				                        },
				                    };
				                }).fail(function(err){	                    
				                    return {
				                        success: false,
				                        error: {
				                            code: 400,
				                            message: err
				                        },
				                    };   
				                });			        
			        		}
						} else {
							return Market.update({id:data.id},data).then(function(cats) {
			                    return {
			                        success: true,
			                        code:200,
			                        data: {
			                            market:cats[0],
			                            message: constantObj.market.UPDATE_MARKET,
			                            key: 'UPDATE_MARKET'
			                        },
			                    };
			                }).fail(function(err) {
			                    return {
			                        success: false,
			                        error: {
			                            code: 400,
			                            message: err
			                        },
			                    };   
			                });	
						}	               
	            	} else {
		                return {
		                    success: false,
		                    error: {
		                        code: 400,
		                        message: constantObj.market.EXIST_MARKET,
		                        key: 'EXIST_MARKET'
		                    },
		                };
	            	}
		        }).fail(function(err){ 
	                return {
	                    success: false,
	                    error: {
	                        code: 400,
	                        message: err
	                    },
	                };   
		        });
		    }
    	});
    },

    marketsForPincode: function(pincode) {
		console.log("pincode == ", pincode)
        if (pincode) {
            Market.find({select:['id'], where:{pincode:{"$in":[JSON.parse( pincode )]}}}).then(function(markesId) {
            	console.log("markesId == ", markesId)
                if (markesId.length > 0) {
                    let markets = []
                    let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
                    for (var i = 0; i < markesId.length; i++) {
                        markets.push(ObjectId(markesId[i].id))
                    }
                    return markets
                } else {
                    return []
                }
            })
        } else {
        	console.log("pincode == ", "pincode")

            return []
        }

    },
};