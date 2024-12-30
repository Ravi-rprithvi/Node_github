var Promise = require('bluebird'),
	promisify = Promise.promisify;
var constantObj = sails.config.constants;
var commonServiceObj = require('./commonService');
var pushService = require('./PushService');
var bcrypt = require('bcrypt-nodejs');
var NodeGeocoder = require('node-geocoder');
var sortByDistance = require('sort-by-distance');
const fs = require('fs');

generatePasswordft = function () { // action are perform to generate random password for user 
	var length = 8,
		charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-=+;:,.?",
		retVal = "";
	for (var i = 0, n = charset.length; i < length; ++i) {
		retVal += charset.charAt(Math.floor(Math.random() * n));
	}
	return retVal;
};

getTransactionLeaderForUser = function (adminusrid) {
	const prom = new Promise((resolve, reject) => {
		let adminuserqry = {}
		adminuserqry.$or = [{ roles: 'SA' }, { roles: 'A' }]
		adminuserqry.id = adminusrid
		Users.findOne(adminuserqry).populate('roleId').then(function (info) {
			if (info) {
				if (info.reportsTo == undefined) {
					resolve(info.id)
				} else {
					if (info.roleId && info.roleId.permission && info.roleId.permission.transaction && info.roleId.permission.transaction.isApproved && info.roleId.permission.transaction.isApproved == true) {
						resolve(info.id)
					} else {
						getTransactionLeaderForUser(info.reportsTo).then(function (finalusr) {
							resolve(finalusr)
						})
					}
				}
			} else {
				reject('101');
			}
		})

	})
	return prom.then(function (success) {
		return success
	}).catch(function (err) {
		return err
	})
},

	module.exports = {

		assignLogisticAndDeliveryTimeForTransaction: function (data, context, req, res) {

			let bidData = {}
			bidData.id = data.id
			bidData.deliveryTime = data.deliveryTime
			bidData.logisticId = data.logisticId

			const googleMapsClient = require('@google/maps').createClient({
				key: constantObj.googlePlaces.key
			});
			FieldTransactions.findOne({ id: data.id }).populate('tripId').then(function (bid) {
				if (bid) {
					//console.log(bid, 'bid')
					var message = 'Logistic assigned'
					if (bid.logisticId) {
						message = 'Logistic changed'
					}
					if (bid.ETD) {
						var availObj = bid.ETD;
						var availableRange = parseInt(data.deliveryTime);
						var dateChanged = new Date(availObj);
						dateChanged.setDate(dateChanged.getDate() + availableRange);
						bidData.ETA = dateChanged
					}

					var findOngoingTrip = {}
					findOngoingTrip.vehicle = data.vehicleId
					findOngoingTrip.status = 'Created'

					if (bid.tripId) {
						return res.jsonx({
							success: false,
							error: "Already assigned in trip " + String(bid.tripId.code) + ". Please remove order from there and then reassign."
						});
					} else {
						LogisticTrip.findOne(findOngoingTrip).populate('orders').then(function (trip) {
							let sourceAddress = ""

							if (bid.productType == 'crops') {
								sourceAddress = bid.sellerAddress
							}

							let destinationAddress = bid.buyerAddress
							var tripOrderData = {}

							if (bid.productType == 'crops') {
								tripOrderData.seller = bid.seller
							}

							tripOrderData.buyer = bid.buyer
							tripOrderData.sourceAddress = sourceAddress
							tripOrderData.destinationAddress = destinationAddress
							console.log(tripOrderData, 'tripOrderData')
							var geocoder = NodeGeocoder(constantObj.googlePlaces.options);
							// console.log('0===');
							geocoder.geocode(sourceAddress).then(function (sourceAddressInfo) {
								// console.log('1===');
								if (sourceAddressInfo) {
									// console.log(sourceAddress, '2===', sourceAddressInfo);
									if (sourceAddressInfo.length > 0) {
										// console.log('3===');
										geocoder.geocode(destinationAddress).then(function (destinationAddressInfo) {
											// console.log('4===');
											if (destinationAddressInfo) {
												// console.log('5===');
												if (destinationAddressInfo.length > 0) {
													console.log('6===');
													if (sourceAddressInfo[0].zipcode) {
														tripOrderData.sourcePincode = sourceAddressInfo[0].zipcode
													} else {
														if (bid.productType == 'crops') {
															tripOrderData.sourcePincode = bid.sellerPincode
														}
													}

													tripOrderData.sourceCoordinates = { lat: sourceAddressInfo[0].latitude, lon: sourceAddressInfo[0].longitude }

													if (destinationAddressInfo[0].zipcode) {
														tripOrderData.destinationPincode = destinationAddressInfo[0].zipcode
													}

													tripOrderData.destinationCoordinates = { lat: destinationAddressInfo[0].latitude, lon: destinationAddressInfo[0].longitude }

													tripOrderData.fieldTransactionId = data.id

													if (trip) {
														console.log("going inside existing == ")
														tripOrderData.tripId = trip.id
														bidData.tripId = trip.id
														tripOrderData.type = 'fieldTransaction';
														Triporder.create(tripOrderData).then(function (tripData) {
															let orders = trip.orders
															orders.push(tripData)

															let addressSequence = []

															let allCoordinates = []

															for (var i = 0; i < orders.length; i++) {
																allCoordinates.push({ address: orders[i].sourceAddress, lat: orders[i].sourceCoordinates.lat, lon: orders[i].sourceCoordinates.lon, type: "seller", orderId: orders[i].id })
																allCoordinates.push({ address: orders[i].destinationAddress, lat: orders[i].destinationCoordinates.lat, lon: orders[i].destinationCoordinates.lon, type: "buyer", orderId: orders[i].id })
															}

															let opts = {
																yName: "lon",
																xName: "lat"
															}

															let origin = { lon: allCoordinates[0].lon, lat: allCoordinates[0].lat }

															let sortedLocations = sortByDistance(origin, allCoordinates, opts)

															let sequecenceOfDestinations = []


															for (var i = 0; i < sortedLocations.length; i++) {
																sequecenceOfDestinations.push({ address: sortedLocations[i].address, coord: { lat: sortedLocations[i].lat, lon: sortedLocations[i].lon }, type: sortedLocations[i].type, orderId: sortedLocations[i].orderId })
															}

															trip.destinationSequence = sequecenceOfDestinations
															let waypoints = ""

															for (var i = 1; i < sortedLocations.length - 1; i++) {
																if (i > 1) {
																	waypoints = waypoints + "|"
																}
																waypoints = waypoints + "via:" + String(sortedLocations[i].lat) + "," + String(sortedLocations[i].lon)
															}

															googleMapsClient.directions({
																origin: String(origin.lat) + "," + String(origin.lon),
																destination: String(sortedLocations[sortedLocations.length - 1].lat) + "," + String(sortedLocations[sortedLocations.length - 1].lon),
																waypoints: waypoints,
																optimize: false
															}, function (err, routeresponses) {
																console.log("routeresponses == ", routeresponses)
																let routeresponse = undefined
																if (routeresponses && routeresponses.json) {
																	routeresponse = routeresponses.json
																}
																if (!err && routeresponse && routeresponse.status == 'OK' && routeresponse.routes && routeresponse.routes.length > 0) {
																	if (routeresponse.routes[0].legs && routeresponse.routes[0].legs.length > 0) {
																		trip.totalDistanceToTravel = routeresponse.routes[0].legs[0].distance
																		trip.totalTimeToBeTaken = routeresponse.routes[0].legs[0].duration
																		trip.prescribedRoute = routeresponse.routes[0].legs[0].steps
																	}
																}

																var locJson = trip.prescribedRoute;

																let tripToUpdate = trip

																delete tripToUpdate.orders
			                                                    delete tripToUpdate.prescribedRoute;
			                                                    tripToUpdate.prescribedRoute = [];


																LogisticTrip.update({ id: trip.id }, tripToUpdate).then(function (updatedTrip) {
																	FieldTransactions.update({ id: data.id }, bidData).then(function (bid) {
																		sendAssignLogisticTransactionMessages(bid[0])
																		let path1 = 'assets/location/prescriberoutes/' + trip.id + '.json';
				                                                        fs.writeFile(path1, JSON.stringify(locJson, null, 2), function (err) {
				                                                            if (err) throw err;

				                                                            return res.jsonx({
																				success: true,
																				code: 200,
																				data: {
																					transaction: bid[0],
																					trip: updatedTrip[0],
																					message: "Successfully added order to trip",
																				},
																			})
				                                                        })
																		
																	})
																}).fail(function (error) {
																	console.log("error == ", error)
																	return res.jsonx({
																		success: false,
																		error: {
																			code: 400,
																			message: error
																		},
																	})
																})
															})
														}).fail(function (err) {
															return res.jsonx({
																success: false,
																error: {
																	code: 400,
																	message: err
																},
															})
														})
													} else {
														// console.log("else==")
														let logisticTrip = {}
														TripCode().then(function (code) {
															console.log("code==", code)
															logisticTrip.code = code
															logisticTrip.logisticPartner = data.logisticId
															logisticTrip.vehicle = data.vehicleId
															logisticTrip.driver = data.driverId
															logisticTrip.destinationSequence = [{ address: sourceAddress, coord: tripOrderData.sourceCoordinates, type: 'seller' }, { address: destinationAddress, coord: tripOrderData.destinationCoordinates, type: 'buyer' }]
															OTTC().then(function (ottc) {
																console.log("ottc==", ottc)
																logisticTrip.OTTC = ottc
																logisticTrip.OTTCCreatedDate = new Date()

																googleMapsClient.directions({
																	origin: String(tripOrderData.sourceCoordinates.lat) + "," + String(tripOrderData.sourceCoordinates.lon),
																	destination: String(tripOrderData.destinationCoordinates.lat) + "," + String(tripOrderData.destinationCoordinates.lon),
																}, function (err, routeresponses) {
																	let routeresponse = undefined
																	if (routeresponses && routeresponses.json) {
																		routeresponse = routeresponses.json
																	}

																	if (!err && routeresponse && routeresponse.status == 'OK' && routeresponse.routes && routeresponse.routes.length > 0) {
																		if (routeresponse.routes[0].legs && routeresponse.routes[0].legs.length > 0) {
																			logisticTrip.totalDistanceToTravel = routeresponse.routes[0].legs[0].distance
																			logisticTrip.totalTimeToBeTaken = routeresponse.routes[0].legs[0].duration
																			logisticTrip.prescribedRoute = routeresponse.routes[0].legs[0].steps
																		}
																	}

																	var locJson = logisticTrip.prescribedRoute;
				                                                    delete logisticTrip.orders;
				                                                    delete logisticTrip.prescribedRoute;
				                                                    logisticTrip.prescribedRoute = [];


																	LogisticTrip.create(logisticTrip).then(function (newtrip) {
																		if (newtrip) {
																			tripOrderData.tripId = newtrip.id
																			bidData.tripId = newtrip.id
																			tripOrderData.type = 'fieldTransaction';
																			Triporder.create(tripOrderData).then(function (tripData) {
																				newtrip.destinationSequence = [{ address: sourceAddress, coord: tripOrderData.sourceCoordinates, type: "seller", orderId: tripData.id }, { address: destinationAddress, coord: tripOrderData.destinationCoordinates, type: "buyer", orderId: tripData.id }]
																				delete newtrip.orders
																				LogisticTrip.update({ id: newtrip.id }, newtrip).then(function (updatedTripInfo) {
																					let smsInfo = {}
																					smsInfo.tripcode = String(newtrip.code)
																					smsInfo.OTTC = String(newtrip.OTTC)
																					Lpartners.findOne({ id: data.logisticId }).populate('vehicles').populate('drivers').then(function (lpartner) {
																						if (lpartner.vehicles != 'undefined') {
																							for (var i = 0; i < lpartner.vehicles.length; i++) {
																								let vehicle = lpartner.vehicles[i]
																								if (vehicle.id == data.vehicleId) {
																									smsInfo.vehiclenumber = vehicle.number
																									break
																								}
																							}
																						}
																						for (var i = 0; i < lpartner.drivers.length; i++) {
																							let vehicle = lpartner.drivers[i]
																							if (vehicle.id == data.driverId) {
																								if (vehicle.mobile) {
																									smsInfo.numbers = [lpartner.mobile, vehicle.mobile]
																								} else {
																									smsInfo.numbers = [lpartner.mobile]
																								}
																								break
																							}
																						}

																						if (!smsInfo.numbers) {
																							smsInfo.numbers = [lpartner.mobile]
																						}

																						commonService.sendOTTCSMS(smsInfo)


																						FieldTransactions.update({ id: data.id }, bidData).then(function (bid) {
																							//assignLogisticFieldTransactionAndDeliveryTime(bid[0])

																							let path1 = 'assets/location/prescriberoutes/' + newtrip.id + '.json';
									                                                        fs.writeFile(path1, JSON.stringify(locJson, null, 2), function (err) {
									                                                            if (err) throw err;

									                                                            return res.jsonx({
																									success: true,
																									code: 200,
																									data: {
																										transaction: bid[0],
																										trip: updatedTripInfo[0],
																										message: "Successfully created Trip"
																									},
																								})
									                                                        })
																							
																						})
																					})
																				}).fail(function (err) {
																					return res.jsonx({
																						success: false,
																						error: {
																							code: 400,
																							message: err
																						},
																					})
																				})
																			}).fail(function (err) {
																				return res.jsonx({
																					success: false,
																					error: {
																						code: 400,
																						message: err
																					},
																				})
																			})
																		} else {
																			return res.jsonx({
																				success: false,
																				error: {
																					code: 400,
																					message: "Unknow Error Occurred"
																				},
																			});
																		}
																	}).fail(function (err) {
																		return res.jsonx({
																			success: false,
																			error: {
																				code: 400,
																				message: err
																			},
																		});
																	});
																})
															})
														})
													}
												} else {
													return res.jsonx({
														success: false,
														error: {
															code: 400,
															message: "Destination Address not valid"
														},
													});
												}
											}
										});
									} else {
										return res.jsonx({
											success: false,
											error: {
												code: 400,
												message: "Source Address not valid"
											},
										});
									}
								}
							});
						}).fail(function (error) {
							return res.jsonx({
								success: false,
								error: {
									code: 400,
									message: error
								},
							})
						})
					}
				} else {
					return res.jsonx({
						success: false,
						error: {
							code: 400,
							message: "Unknow Error Occurred"
						},
					});
				}
			}).fail(function (error) {
				return res.jsonx({
					success: false,
					error: {
						code: 400,
						message: error
					},
				});
			});
		},

		addRequirement: function (data, context) {

			if (data.products == undefined || data.products == null) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please select the product"
					},
					message: "Please select the product"
				};
			}

			if (data.buyerName == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send buyer name"
					},
					message: "Please send buyer name"
				};
			}

			// if (data.askedQuantity == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "How much quantity of product is required?"
			// 		},
			// 	};
			// }

			// if (data.quantityUnit == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "What is quantityUnit?"
			// 		},
			// 	};
			// }

			if (data.buyerMobile == undefined || data.buyerAddress == undefined || data.buyerPincode == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send the valid address, mobile number and pincode of buyer"
					},
					message: "Please send the valid address, mobile number and pincode of buyer"
				};
			}

			if (data.creditDays == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "What is payment credit period in days?"
					},
					message: "What is payment credit period in days?"
				};
			}

			// if (data.buyerRate == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "At what rate buyer is buying the product?"
			// 		},
			// 	};
			// }

			// data.buyerRate = parseFloat((data.buyerRate).toFixed(2))

			// data.buyerAmount = parseFloat((data.buyerAmount).toFixed(2))

			// // if (data.buyerAmount == undefined || data.buyerAmount < buyerAmount - 5 || data.buyerAmount > buyerAmount + 5) {
			// // 	return {
			// // 		success: false,
			// // 		error: {
			// // 			code: 400,
			// // 			message: "Buyer amount is not properly calculated"
			// // 		},
			// // 	};
			// // }

			if (data.advancePayment && parseFloat(data.advancePayment) > 0) {
				let payments = []
				let advance = {}
				advance.amount = parseFloat(parseFloat(data.advancePayment).toFixed(2))
				advance.paymentDate = new Date()
				advance.paymentType = "Advance"
				advance.status = "Paid"
				payments.push(advance)
				data.buyerpayments = payments

				delete data.advancePayment
			}

			data.status = 'Pending'
			data.cpfo = context.identity.id
			if (context.identity.reportsTo) {
				data.cptsm = context.identity.reportsTo
			}

			let totalAmountOfBuyer = 0

			for (var i = 0; i < data.products.length; i++) {
				let prod = data.products[i]

				if (prod.product == undefined || prod.product == null) {
					return {
						success: false,
						error: {
							code: 400,
							message: "What is product at " + i + " index?"
						},
						message: "What is product at " + i + " index?"
					};
				}

				if (prod.askedQuantity == undefined) {
					return {
						success: false,
						error: {
							code: 400,
							message: "How much quantity of " + prod.product + " is required?"
						},
						message: "How much quantity of " + prod.product + " is required?"
					};
				}

				if (prod.quantityUnit == undefined) {
					return {
						success: false,
						error: {
							code: 400,
							message: "What is quantityUnit of " + prod.product + "?"
						},
						message: "What is quantityUnit of " + prod.product + "?"
					};
				}


				if (prod.buyerRate == undefined) {
					return {
						success: false,
						error: {
							code: 400,
							message: "At what rate buyer is buying the " + prod.product + "?"
						},
						message: "At what rate buyer is buying the " + prod.product + "?"
					};
				}

				if (prod.buyerTax == undefined) {
					data.products[i].buyerTax = 0
					data.products[i].taxPercent = 0
				}

				data.products[i].buyerRate = parseFloat(prod.buyerRate).toFixed(2)

				data.products[i].buyerAmount = parseFloat(parseFloat(prod.askedQuantity) * parseFloat(prod.buyerRate)).toFixed(2)
				data.products[i].totalBuyerAmount = parseFloat(parseFloat(data.products[i].buyerAmount) + parseFloat(data.products[i].buyerTax)).toFixed(2)

				totalAmountOfBuyer = totalAmountOfBuyer + data.products[i].totalBuyerAmount

				var __id = require('mongodb').ObjectID
				data.products[i]["_id"] = (new __id()).toString()
				data.products[i]["_parentProductId"] = data.products[i]["_id"]

			}

			data.buyerTotalAmount = parseFloat(totalAmountOfBuyer).toFixed(2)
			data.productRequirementDate = new Date()

			if (data.farmxFinalisedTransportation && data.farmxFinalisedTransportation == 'Buyer') {
				data.isLogisticPaymentDone = true
			}

			return commonService.getDataFromPincode(data.buyerPincode).then(function (pincodeInfo) {
				let pincodeData = pincodeInfo;
				if (pincodeData == 'error') {
					return {
						success: false,
						code: 400,
						message: 'please enter valid pincode.'
					}
				} else {

					data.buyerDistrict = pincodeData["Districtname"]
					data.buyerState = pincodeData["statename"]

					return getTransactionLeaderForUser(data.cpfo).then(function (tl) {
						if (pincodeInfo != '101') {
							data.transactionleader = tl
						}
						return FieldTransactions.create(data).then(function (requirement) {
							if (requirement && data.transactionleader) {
								pushService.sendPushToFieldTransactionsAdmin([data.transactionleader], 'New requirement added', 'A new requirement is raised by ' + context.identity.fullName + ' for buyer named ' + data.buyerName + '. Please approve.')
							}
							if (data.buyer == undefined) {
								let createuser = {}
								createuser.mobile = data.buyerMobile
								createuser.userType = 'cropbuyer'
								let names = data.buyerName.split(" ")
								if (names.length > 1) {
									createuser.firstName = names[0]
									createuser.lastName = names[names.length - 1]
								} else if (names.length == 1) {
									createuser.firstName = names[0]
									createuser.lastName = ''
								} else {
									createuser.firstName = ''
									createuser.lastName = ''
								}
								createuser.fullName = data.buyerName
								createuser.address = data.buyerAddress
								createuser.pincode = data.buyerPincode
								createuser.district = data.buyerDistrict
								createuser.state = data.buyerState
								createuser.addedBy = context.identity.id
								createuser.uploadBy = "fieldTransaction"
								let userUniqueId = commonServiceObj.getUniqueCode();
								createuser.userUniqueId = 'UB_' + userUniqueId;
								createuser.code = userUniqueId;

								var password = generatePasswordft()

								var encryptedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
								createuser.encryptedPassword = encryptedPassword
								createuser.password = encryptedPassword

								return Users.findOne({ role: "U", mobile: data.buyerMobile }).then(function (existingusr) {
									if (existingusr) {
										return FieldTransactions.update({ id: requirement.id }, { buyer: existingusr.id }).then(function (upreq) {
											if (requirement) {
												return {
													success: true,
													code: 200,
													message: "Requirement added successfully and buyer is already existing. Looking for its approval",
													key: "REQUIREMENTS_TAKEN",
													data: requirement,
												}
											} else {
												return {
													success: false,
													error: {
														code: 400,
														message: "Unknown error occurred"
													},
													message: "Unknown error occurred"
												};
											}
										})
									} else {
										return Users.create(createuser).then(function (usercreated) {
											if (usercreated) {
												return FieldTransactions.update({ id: requirement.id }, { buyer: usercreated.id }).then(function (upreq) {
													if (requirement) {
														return {
															success: true,
															code: 200,
															message: "Requirement added successfully and user registered successfully too. Looking for its approval",
															key: "REQUIREMENTS_TAKEN",
															data: requirement,
														}
													} else {
														return {
															success: false,
															error: {
																code: 400,
																message: "Unknown error occurred"
															},
															message: "Unknown error occurred"
														};
													}
												})
											} else {
												if (requirement) {
													return {
														success: true,
														code: 200,
														message: "Requirement added successfully and user registered successfully too. Looking for its approval",
														key: "REQUIREMENTS_TAKEN",
														data: requirement,
													}
												} else {
													return {
														success: false,
														error: {
															code: 400,
															message: "Unknown error occurred"
														},
														message: "Unknown error occurred"
													};
												}
											}
										}).fail(function (err) {
											if (requirement) {
												return {
													success: true,
													code: 200,
													message: "Requirement added successfully but unable to register user. Looking for its approval",
													key: "REQUIREMENTS_TAKEN",
													data: requirement,
												}
											} else {
												return {
													success: false,
													error: {
														code: 400,
														message: "Unknown error occurred"
													},
													message: "Unknown error occurred"
												};
											}
										})
									}
								})
							} else {
								if (requirement) {
									return {
										success: true,
										code: 200,
										message: "Requirement added successfully. Looking for its approval",
										key: "REQUIREMENTS_TAKEN",
										data: requirement,
									}
								} else {
									return {
										success: false,
										error: {
											code: 400,
											message: "Unknown error occurred"
										},
										message: "Unknown error occurred"
									};
								}
							}
						}).fail(function (error) {
							return {
								success: false,
								error: {
									code: 400,
									message: error
								},
								message: error
							};
						})
					})
				}
			})
		},

		updateRequirement: function (data, context) {

			if (data.products == undefined || data.products == null) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please select the product"
					},
					message: "Please select the product"
				};
			}

			if (data.buyerName == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send buyer name"
					},
					message: "Please send buyer name"
				};
			}

			// if (data.askedQuantity == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "How much quantity of product is required?"
			// 		},
			// 	};
			// }

			// if (data.quantityUnit == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "What is quantityUnit?"
			// 		},
			// 	};
			// }

			if (data.buyerMobile == undefined || data.buyerAddress == undefined || data.buyerPincode == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send the valid address, mobile number and pincode of buyer"
					},
					message: "Please send the valid address, mobile number and pincode of buyer"
				};
			}

			if (data.creditDays == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "What is payment credit period in days?"
					},
					message: "What is payment credit period in days?"
				};
			}

			// if (data.buyerRate == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "At what rate buyer is buying the product?"
			// 		},
			// 	};
			// }

			// data.buyerRate = parseFloat((data.buyerRate).toFixed(2))

			// data.buyerAmount = parseFloat((data.buyerAmount).toFixed(2))

			// // if (data.buyerAmount == undefined || data.buyerAmount < buyerAmount - 5 || data.buyerAmount > buyerAmount + 5) {
			// // 	return {
			// // 		success: false,
			// // 		error: {
			// // 			code: 400,
			// // 			message: "Buyer amount is not properly calculated"
			// // 		},
			// // 	};
			// // }

			if (data.advancePayment && parseFloat(data.advancePayment) > 0) {
				let payments = []
				let advance = {}
				advance.amount = parseFloat(parseFloat(data.advancePayment).toFixed(2))
				advance.paymentDate = new Date()
				advance.paymentType = "Advance"
				advance.status = "Paid"
				payments.push(advance)
				data.buyerpayments = payments

				delete data.advancePayment
			}

			data.status = 'Pending'
			data.cpfo = context.identity.id
			if (context.identity.reportsTo) {
				data.cptsm = context.identity.reportsTo
			}

			data.approvedBy = null
			data.approvedOn = null

			let totalAmountOfBuyer = 0

			for (var i = 0; i < data.products.length; i++) {
				let prod = data.products[i]

				if (prod.product == undefined || prod.product == null) {
					return {
						success: false,
						error: {
							code: 400,
							message: "What is product at " + i + " index?"
						},
						message: "What is product at " + i + " index?"
					};
				}

				if (prod.askedQuantity == undefined) {
					return {
						success: false,
						error: {
							code: 400,
							message: "How much quantity of " + prod.product + " is required?"
						},
						message: "How much quantity of " + prod.product + " is required?"
					};
				}

				if (prod.quantityUnit == undefined) {
					return {
						success: false,
						error: {
							code: 400,
							message: "What is quantityUnit of " + prod.product + "?"
						},
						message: "What is quantityUnit of " + prod.product + "?"
					};
				}


				if (prod.buyerRate == undefined) {
					return {
						success: false,
						error: {
							code: 400,
							message: "At what rate buyer is buying the " + prod.product + "?"
						},
						message: "At what rate buyer is buying the " + prod.product + "?"
					};
				}

				if (prod.buyerTax == undefined) {
					data.products[i].buyerTax = 0
					data.products[i].taxPercent = 0
				}

				data.products[i].buyerRate = parseFloat(prod.buyerRate).toFixed(2)

				data.products[i].buyerAmount = parseFloat(parseFloat(prod.askedQuantity) * parseFloat(prod.buyerRate)).toFixed(2)
				data.products[i].totalBuyerAmount = parseFloat(parseFloat(data.products[i].buyerAmount) + parseFloat(data.products[i].buyerTax)).toFixed(2)

				totalAmountOfBuyer = totalAmountOfBuyer + data.products[i].totalBuyerAmount

				var __id = require('mongodb').ObjectID
				data.products[i]["_id"] = (new __id()).toString()
				data.products[i]["_parentProductId"] = data.products[i]["_id"]

			}

			data.buyerTotalAmount = parseFloat(totalAmountOfBuyer).toFixed(2)
			data.productRequirementDate = new Date()

			if (data.farmxFinalisedTransportation && data.farmxFinalisedTransportation == 'Buyer') {
				data.isLogisticPaymentDone = true
			}

			return FieldTransactions.findOne({ id: data.id }).then(function (rqmnt) {
				if (rqmnt) {
					return commonService.getDataFromPincode(data.buyerPincode).then(function (pincodeInfo) {
						let pincodeData = pincodeInfo;
						if (pincodeData == 'error') {
							return {
								success: false,
								code: 400,
								message: 'please enter valid pincode.'
							}
						} else {

							data.buyerDistrict = pincodeData["Districtname"]
							data.buyerState = pincodeData["statename"]


							return FieldTransactions.update({ id: data.id }, data).then(function (requirement) {
								if (requirement && data.transactionleader) {
									pushService.sendPushToFieldTransactionsAdmin([data.transactionleader], 'A requirement modified', 'A requirement of is updated by ' + context.identity.fullName + ' for buyer named ' + data.buyerName + '. Please reapprove.')
								}
								if (data.buyer == undefined) {
									let createuser = {}
									createuser.mobile = data.buyerMobile
									createuser.userType = 'cropbuyer'
									let names = data.buyerName.split(" ")
									if (names.length > 1) {
										createuser.firstName = names[0]
										createuser.lastName = names[names.length - 1]
									} else if (names.length == 1) {
										createuser.firstName = names[0]
										createuser.lastName = ''
									} else {
										createuser.firstName = ''
										createuser.lastName = ''
									}
									createuser.fullName = data.buyerName
									createuser.address = data.buyerAddress
									createuser.pincode = data.buyerPincode
									createuser.district = data.buyerDistrict
									createuser.state = data.buyerState
									createuser.addedBy = context.identity.id
									createuser.uploadBy = "fieldTransaction"
									let userUniqueId = commonServiceObj.getUniqueCode();
									createuser.userUniqueId = 'UB_' + userUniqueId;
									createuser.code = userUniqueId;

									var password = generatePasswordft()

									var encryptedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
									createuser.encryptedPassword = encryptedPassword
									createuser.password = encryptedPassword

									return Users.findOne({ role: "U", mobile: data.buyerMobile }).then(function (existingusr) {
										if (existingusr) {
											return FieldTransactions.update({ id: requirement.id }, { buyer: existingusr.id }).then(function (upreq) {
												if (requirement) {
													return {
														success: true,
														code: 200,
														message: "Requirement updated successfully and buyer is already existing. Looking for its approval",
														key: "REQUIREMENTS_TAKEN",
														data: requirement,
													}
												} else {
													return {
														success: false,
														error: {
															code: 400,
															message: "Unknown error occurred"
														},
														message: "Unknown error occurred"
													};
												}
											})
										} else {
											return Users.create(createuser).then(function (usercreated) {
												if (usercreated) {
													return FieldTransactions.update({ id: requirement.id }, { buyer: usercreated.id }).then(function (upreq) {
														if (requirement) {
															return {
																success: true,
																code: 200,
																message: "Requirement updated successfully and user registered successfully too. Looking for its approval",
																key: "REQUIREMENTS_TAKEN",
																data: requirement,
															}
														} else {
															return {
																success: false,
																error: {
																	code: 400,
																	message: "Unknown error occurred"
																},
																message: "Unknown error occurred"
															};
														}
													})
												} else {
													if (requirement) {
														return {
															success: true,
															code: 200,
															message: "Requirement updated successfully and user registered successfully too. Looking for its approval",
															key: "REQUIREMENTS_TAKEN",
															data: requirement,
														}
													} else {
														return {
															success: false,
															error: {
																code: 400,
																message: "Unknown error occurred"
															},
															message: "Unknown error occurred"
														};
													}
												}
											}).fail(function (err) {
												if (requirement) {
													return {
														success: true,
														code: 200,
														message: "Requirement updated successfully but unable to register user. Looking for its approval",
														key: "REQUIREMENTS_TAKEN",
														data: requirement,
													}
												} else {
													return {
														success: false,
														error: {
															code: 400,
															message: "Unknown error occurred"
														},
														message: "Unknown error occurred"
													};
												}
											})
										}
									})
								} else {
									if (requirement) {
										return {
											success: true,
											code: 200,
											message: "Requirement updated successfully. Looking for its approval",
											key: "REQUIREMENTS_TAKEN",
											data: requirement,
										}
									} else {
										return {
											success: false,
											error: {
												code: 400,
												message: "Unknown error occurred"
											},
											message: "Unknown error occurred"
										};
									}
								}
							}).fail(function (error) {
								return {
									success: false,
									error: {
										code: 400,
										message: error
									},
									message: error
								};
							})

						}
					})
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "Invalid requirement id"
						},
						message: "Invalid requirement id"
					};
				}
			})
		},

		approve: function (data, context) {
			if (data.id == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send requirement id"
					},
					message: "Please send requirement id"
				};
			}

			if (data.frfo == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please assign franchisee field officer to fulfill this requirement"
					},
					message: "Please assign franchisee field officer to fulfill this requirement"
				};
			}

			// if (data.frtsm == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "Please assign franchisee tsm to fulfill this requirement"
			// 		},
			// 	};
			// }

			return FieldTransactions.findOne({ id: data.id }).then(function (rqmnt) {
				if (rqmnt) {
					var d = new Date();
					var n = "" + d.getTime();
					let code = Math.floor(1 + Math.random() * 9);

					let timePartOne = n.substring(0, 6)
					let timePartTwo = n.substring(6, n.length)

					data.code = 'FT-' + timePartOne + "-" + timePartTwo + code;

					data.status = "Approved"
					data.approvedBy = context.identity.id
					data.approvedOn = new Date()

					return FieldTransactions.update({ id: data.id }, data).then(function (requirement) {
						if (requirement) {
							pushService.sendPushToFieldTransactionsAdmin([data.frfo], 'Fulfill requirement', 'You are assigned as franchisee FO to fulfill requirement. Please view listing.')

							return {
								success: true,
								code: 200,
								message: "Transaction updated successfully",
								data: requirement[0],
							}
						} else {
							return {
								success: false,
								error: {
									code: 400,
									message: "Unknown error occurred"
								},
								message: "Unknown error occurred"
							};
						}
					}).fail(function (error) {
						return {
							success: false,
							error: {
								code: 400,
								message: error
							},
							message: error
						};
					})
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "Invalid requirement id"
						},
						message: "Invalid requirement id"
					};
				}
			})
		},

		addFranchiseeLogistics: function (data, context) {
			if (data.id == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send requirement id"
					},
					message: "Please send requirement id"
				};
			}

			if (data.franchiseeSuggestedLoadingCharges == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please tell us your loading charges"
					},
					message: "Please tell us your loading charges"
				};
			}

			if (data.franchiseeSuggestedUnloadingCharges == undefined) {
				data.franchiseeSuggestedUnloadingCharges = data.franchiseeSuggestedLoadingCharges
			}

			if (data.franchiseeSuggestedTransportationCharges == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please tell us your transportation charges"
					},
					message: "Please tell us your transportation charges"
				};
			}

			if (data.franchiseeSuggestedLogisticCharges == undefined) {
				data.franchiseeSuggestedLogisticCharges = parseFloat(parseFloat(data.franchiseeSuggestedTransportationCharges) + parseFloat(data.franchiseeSuggestedUnloadingCharges) + parseFloat(data.franchiseeSuggestedLoadingCharges)).toFixed(2)
			}

			if (data.franchiseeSuggestedTransporterName == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please add transporter name"
					},
					message: "Please add transporter name"
				};
			}

			return FieldTransactions.findOne({ id: data.id }).then(function (rqmnt) {
				if (rqmnt) {

					data.franshiseeSuggestedLogisticsBy = context.identity.id
					data.franshiseeSuggestedLogisticsOn = new Date()

					return FieldTransactions.update({ id: data.id }, data).then(function (requirement) {
						if (requirement) {
							// pushService.sendPushToFieldTransactionsAdmin([data.frfo], 'Fulfill requirement', 'You are assigned as franchisee FO to fulfill requirement of ' + requirement[0].askedQuantity + ' ' + requirement[0].quantityUnit + ' of ' + requirement[0].product + '. Please view listing.')

							return {
								success: true,
								code: 200,
								message: "Transaction updated successfully",
								data: requirement[0],
							}
						} else {
							return {
								success: false,
								error: {
									code: 400,
									message: "Unknown error occurred"
								},
								message: "Unknown error occurred"
							};
						}
					}).fail(function (error) {
						return {
							success: false,
							error: {
								code: 400,
								message: error
							},
							message: error
						};
					})
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "Invalid requirement id"
						},
						message: "Invalid requirement id"
					};
				}
			})
		},

		addFarmxLogistics: function (data, context) {
			if (data.id == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send requirement id"
					},
					message: "Please send requirement id"
				};
			}

			if (data.farmxSuggestedLoadingCharges == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please tell us your loading charges"
					},
					message: "Please tell us your loading charges"
				};
			}

			if (data.farmxSuggestedUnloadingCharges == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please tell us your unloading charges"
					},
					message: "Please tell us your unloading charges"
				};
			}

			if (data.farmxSuggestedTransportationCharges == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please tell us your transportation charges"
					},
					message: "Please tell us your transportation charges"
				};
			}

			if (data.farmxSuggestedLogisticCharges == undefined) {
				data.franchiseeSuggestedLogisticCharges = parseFloat(parseFloat(data.farmxSuggestedTransportationCharges) + parseFloat(data.farmxSuggestedUnloadingCharges) + parseFloat(data.farmxSuggestedLoadingCharges)).toFixed(2)
			}

			if (data.farmxSuggestedTransporterName == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please add transporter name"
					},
					message: "Please add transporter name"
				};
			}

			if (data.farmxFinalisedTransportation == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please suggest which transport to use"
					},
					message: "Please suggest which transport to use"
				};
			}

			return FieldTransactions.findOne({ id: data.id }).then(function (rqmnt) {
				if (rqmnt) {

					data.farmxSuggestedLogisticsBy = context.identity.id
					data.farmxSuggestedLogisticsOn = new Date()

					return FieldTransactions.update({ id: data.id }, data).then(function (requirement) {
						if (requirement) {
							pushService.sendPushToFieldTransactionsAdmin([rqmnt.frfo], 'Logistic suggested', 'You have to use ' + data.farmxFinalisedTransportation + ' for ' + requirement[0].code + ' transaction. Please view listing.')

							return {
								success: true,
								code: 200,
								message: "Transaction updated successfully",
								data: requirement[0],
							}
						} else {
							return {
								success: false,
								error: {
									code: 400,
									message: "Unknown error occurred"
								},
								message: "Unknown error occurred"
							};
						}
					}).fail(function (error) {
						return {
							success: false,
							error: {
								code: 400,
								message: error
							},
							message: error
						};
					})
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "Invalid requirement id"
						},
						message: "Invalid requirement id"
					};
				}
			})
		},

		fulfillWithAdvance: function (data, context) {
			if (data.id == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send transaction id"
					},
					message: "Please send transaction id"
				};
			}

			if (data.sellerName == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send seller name"
					},
					message: "Please send seller name"
				};
			}

			if (data.expectedLoadingDate == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "When it was loaded?"
					},
					message: "When it was loaded?"
				};
			}

			if (data.farmerAdvanceRequired == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "What amount is asked by seller in advance?"
					},
					message: "What amount is asked by seller in advance?"
				};
			}

			if (data.sellerMobile == undefined || data.sellerAddress == undefined || data.sellerPincode == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send the valid address, mobile number and pincode of seller"
					},
					message: "Please send the valid address, mobile number and pincode of seller"
				};
			}

			data.farmerAdvanceRequired = parseFloat(data.farmerAdvanceRequired)
			data.expectedLoadingDate = new Date(data.expectedLoadingDate)

			return FieldTransactions.findOne({ id: data.id }).then(function (rqmnt) {
				if (rqmnt) {

					return commonService.getDataFromPincode(data.sellerPincode).then(function (pincodeInfo) {
						let pincodeData = pincodeInfo;
						if (pincodeData == 'error') {
							return {
								success: false,
								code: 400,
								error: {
									code: 400,
									message: "please enter valid pincode."
								},
								message: 'please enter valid pincode.'
							}
						} else {
							data.sellerDistrict = pincodeData["Districtname"]
							data.sellerState = pincodeData["statename"]

							return FieldTransactions.update({ id: data.id }, data).then(function (requirement) {
								if (requirement) {
									pushService.sendPushToFieldTransactionsAdmin([rqmnt.transactionleader], 'Seller advance asked', 'Franchisee/Farmer has asked for advance of Rs.' + data.farmerAdvanceRequired + ' for transaction id ' + requirement[0].code + '.')
								}
								if (data.seller == undefined && data.sellerName && data.sellerMobile) {
									let createuser = {}
									createuser.mobile = data.sellerMobile
									createuser.userType = 'farmer'
									let names = data.sellerName.split(" ")
									if (names.length > 1) {
										createuser.firstName = names[0]
										createuser.lastName = names[names.length - 1]
									} else if (names.length == 1) {
										createuser.firstName = names[0]
										createuser.lastName = ''
									} else {
										createuser.firstName = ''
										createuser.lastName = ''
									}
									createuser.fullName = data.sellerName
									if (data.sellerAddress) {
										createuser.address = data.sellerAddress
									}
									if (data.sellerPincode) {
										createuser.pincode = data.sellerPincode
									} else if (data.franchiseePincode) {
										createuser.pincode = data.franchiseePincode
									}

									if (data.sellerDistrict) {
										createuser.district = data.sellerDistrict
									}

									createuser.state = data.sellerState
									createuser.addedBy = context.identity.id
									createuser.uploadBy = "fieldTransaction"
									let userUniqueId = commonServiceObj.getUniqueCode();
									createuser.userUniqueId = 'UF_' + userUniqueId;
									createuser.code = userUniqueId;

									var password = generatePasswordft()
									var encryptedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
									createuser.encryptedPassword = encryptedPassword
									createuser.password = encryptedPassword

									return Users.findOne({ role: "U", mobile: data.buyerMobile }).then(function (existingusr) {
										if (existingusr) {
											return FieldTransactions.update({ id: requirement[0].id }, { seller: existingusr.id }).then(function (upreq) {
												if (requirement) {
													return {
														success: true,
														code: 200,
														message: "Transaction updated successfully and user already exists",
														data: requirement[0],
													}
												} else {
													return {
														success: false,
														error: {
															code: 400,
															message: "Unknown error occurred"
														},
														message: "Unknown error occurred"
													};
												}
											})
										} else {
											return Users.create(createuser).then(function (usercreated) {
												if (usercreated) {
													return FieldTransactions.update({ id: requirement[0].id }, { seller: usercreated.id }).then(function (upreq) {
														if (requirement) {
															return {
																success: true,
																code: 200,
																message: "Transaction updated successfully and user created too",
																data: requirement[0],
															}
														} else {
															return {
																success: false,
																error: {
																	code: 400,
																	message: "Unknown error occurred"
																},
																message: "Unknown error occurred"
															};
														}
													})
												} else {
													if (requirement) {
														return {
															success: true,
															code: 200,
															message: "Transaction updated successfully and user created too",
															data: requirement[0],
														}
													} else {
														return {
															success: false,
															error: {
																code: 400,
																message: "Unknown error occurred"
															},
															message: "Unknown error occurred"
														};
													}
												}

											}).fail(function (err) {
												if (requirement) {
													return {
														success: true,
														code: 200,
														message: "Transaction updated successfully but unable to add user",
														data: requirement[0],
													}
												} else {
													return {
														success: false,
														error: {
															code: 400,
															message: "Unknown error occurred"
														},
														message: "Unknown error occurred"
													};
												}
											})
										}
									})
								} else {
									if (requirement) {
										return {
											success: true,
											code: 200,
											message: "Transaction updated successfully",
											data: requirement[0],
										}
									} else {
										return {
											success: false,
											error: {
												code: 400,
												message: "Unknown error occurred"
											},
											message: "Unknown error occurred"
										};
									}
								}
							}).fail(function (error) {
								return {
									success: false,
									error: {
										code: 400,
										message: error
									},
									message: error
								};
							})
						}
					})
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "Invalid requirement id"
						},
						message: "Invalid requirement id"
					};
				}
			})
		},

		fulfill: function (data, context) {
			if (data.id == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send transaction id"
					},
					message: "Please send transaction id"
				};
			}

			if (data.sellerName == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send seller name"
					},
					message: "Please send seller name"
				};
			}

			if (data.loadingDate == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "When it was loaded?"
					},
					message: "When it was loaded?"
				};
			}

			// if (data.dispatchQuantity == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "What quantity you are dispatching?"
			// 		},
			// 	};
			// }

			// // if (data.vehicleNumber == undefined) {
			// // 	return {
			// // 		success: false,
			// // 		error: {
			// // 			code: 400,
			// // 			message: "What is vehicle number?"
			// // 		},
			// // 	};
			// // }

			// // if (data.vehicleImage == undefined) {
			// // 	return {
			// // 		success: false,
			// // 		error: {
			// // 			code: 400,
			// // 			message: "Please upload vehicle image"
			// // 		},
			// // 	};
			// // }

			// if (data.rate == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "At what rate seller is selling?"
			// 		},
			// 	};
			// }

			// if (data.amount == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "What is amount?"
			// 		},
			// 	};
			// }

			if (data.logisticCharges == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "What are logistic charges?"
					},
					message: "What are logistic charges?"
				};
			}

			// // if (data.facilitationCharges == undefined) {
			// // 	return {
			// // 		success: false,
			// // 		error: {
			// // 			code: 400,
			// // 			message: "What is margin?"
			// // 		},
			// // 	};
			// // }

			// // if (data.facilitationPercent == undefined) {
			// // 	return {
			// // 		success: false,
			// // 		error: {
			// // 			code: 400,
			// // 			message: "What is margin percentage?"
			// // 		},
			// // 	};
			// // }

			// if (data.totalAmount == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "What is total amount?"
			// 		},
			// 	};
			// }

			// // if (data.ETA == undefined) {
			// // 	return {
			// // 		success: false,
			// // 		error: {
			// // 			code: 400,
			// // 			message: "What is quantityUnit?"
			// // 		},
			// // 	};
			// // }

			if (data.sellerMobile == undefined || data.sellerAddress == undefined || data.sellerPincode == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send the valid address, mobile number and pincode of seller"
					},
					message: "Please send the valid address, mobile number and pincode of seller"
				};
			}

			// data.sellerRate = data.rate
			// data.sellerConsideredQuantity = data.dispatchQuantity
			// data.sellerAmount = data.amount
			// data.pendingQuantityToReconciel = data.dispatchQuantity


			return FieldTransactions.findOne({ id: data.id }).then(function (rqmnt) {
				if (rqmnt) {
					data.status = "Dispatched"

					// data.amount = parseFloat((data.amount).toFixed(2))
					// data.taxAmount = parseFloat((data.taxAmount).toFixed(2))
					// data.totalAmount = parseFloat((data.totalAmount + data.taxAmount + data.logisticCharges).toFixed(2))

					// data.originalamount = data.amount
					// data.originalTaxAmount = data.taxAmount
					// data.originalTotalAmount = data.totalAmount

					data.ATD = new Date()

					if (rqmnt.farmxFinalisedTransportation == 'Farmx' && rqmnt.farmxSuggestedLogisticCharges) {
						data.logisticMargin = parseFloat(data.logisticCharges - rqmnt.farmxSuggestedLogisticCharges).toFixed(2)
						data.logisticMarginPercentage = parseFloat(data.logisticMargin * 100 / data.logisticCharges).toFixed(2)
					} else if (rqmnt.farmxFinalisedTransportation == 'Franchisee' && rqmnt.franchiseeSuggestedLogisticCharges) {
						data.logisticMargin = parseFloat(data.logisticCharges - rqmnt.franchiseeSuggestedLogisticCharges).toFixed(2)
						data.logisticMarginPercentage = parseFloat(data.logisticMargin * 100 / data.logisticCharges).toFixed(2)
					} else {
						data.logisticMargin = 0
						data.logisticMarginPercentage = 0
					}

					return commonService.getDataFromPincode(data.sellerPincode).then(function (pincodeInfo) {
						let pincodeData = pincodeInfo;
						if (pincodeData == 'error') {
							return {
								success: false,
								code: 400,
								message: 'please enter valid pincode.'
							}
						} else {
							data.sellerDistrict = pincodeData["Districtname"]
							data.sellerState = pincodeData["statename"]

							let totalAmountOfSeller = 0
							let totalcgst = 0
							let totalsgst = 0
							let totaligst = 0

							for (var i = 0; i < data.products.length; i++) {
								let prod = data.products[i]

								if (prod.dispatchQuantity == undefined) {
									return {
										success: false,
										error: {
											code: 400,
											message: "What quantity you are dispatching for " + prod.product + "?"
										},
										message: "What quantity you are dispatching for " + prod.product + "?"
									};
								}

								if (prod.rate == undefined) {
									return {
										success: false,
										error: {
											code: 400,
											message: "At what rate seller is selling " + prod.product + "?"
										},
									};
									message: "At what rate seller is selling " + prod.product + "?"
								}


								data.products[i].amount = parseFloat((prod.dispatchQuantity * prod.rate).toFixed(2))


								// if (prod.taxAmount == undefined) {
								data.products[i].taxAmount = parseFloat(data.products[i].amount) * parseFloat(data.products[i].taxPercent) / 100
								// }

								if (data.sellerState == rqmnt.buyerState) {
									data.products[i].cgst = data.products[i].taxAmount / 2
									data.products[i].cgstPercent = data.products[i].taxPercent / 2
									data.products[i].sgst = data.products[i].taxAmount / 2
									data.products[i].sgstPercent = data.products[i].taxPercent / 2
									data.products[i].igst = 0
									data.products[i].igstPercent = 0

									totalcgst = totalcgst + data.products[i].cgst
									totalsgst = totalsgst + data.products[i].sgst
									totaligst = totaligst + data.products[i].igst
								} else {
									data.products[i].cgst = 0
									data.products[i].cgstPercent = 0
									data.products[i].sgst = 0
									data.products[i].sgstPercent = 0
									data.products[i].igst = data.products[i].taxAmount
									data.products[i].igstPercent = data.products[i].taxPercent

									totalcgst = totalcgst + data.products[i].cgst
									totalsgst = totalsgst + data.products[i].sgst
									totaligst = totaligst + data.products[i].igst
								}

								data.products[i].totalProductAmount = parseFloat((data.products[i].amount + data.products[i].taxAmount).toFixed(2))

								totalAmountOfSeller = totalAmountOfSeller + parseFloat(data.products[i].totalProductAmount)

								data.products[i].sellerRate = parseFloat(data.products[i].rate)
								data.products[i].sellerConsideredQuantity = parseFloat(data.products[i].dispatchQuantity)
								data.products[i].sellerAmount = parseFloat(data.products[i].amount)
								data.products[i].pendingQuantityToReconciel = parseFloat(data.products[i].dispatchQuantity)

							}

							data.sellerTotalAmount = totalAmountOfSeller - (totalcgst + totalsgst + totaligst)

							data.cgst = totalcgst
							data.sgst = totalsgst
							data.igst = totaligst

							data.amount = parseFloat((data.sellerTotalAmount).toFixed(2))
							data.totalAmount = parseFloat((totalAmountOfSeller + data.logisticCharges).toFixed(2))

							data.originalamount = parseFloat(data.amount)
							data.originalTaxAmount = totalcgst + totalsgst + totaligst
							data.originalTotalAmount = parseFloat(data.totalAmount)

							if (data.advancePayment && parseFloat(data.advancePayment) > 0) {
								let payments = []
								let advance = {}
								advance.amount = parseFloat(parseFloat(data.advancePayment).toFixed(2))
								advance.paymentDate = new Date()
								advance.paymentType = "Advance"
								advance.status = "Paid"
								payments.push(advance)
								data.sellerpayments = payments

								delete data.advancePayment
							}

							return FieldTransactions.update({ id: data.id }, data).then(function (requirement) {
								if (requirement) {
									pushService.sendPushToFieldTransactionsAdmin([requirement[0].cpfo], 'Requirement fulfilled', 'Requirement of transaction ' + requirement[0].code + ' is fulfilled.')
								}
								if (data.seller == undefined && data.sellerName && data.sellerMobile) {
									let createuser = {}
									createuser.mobile = data.sellerMobile
									createuser.userType = 'farmer'
									let names = data.sellerName.split(" ")
									if (names.length > 1) {
										createuser.firstName = names[0]
										createuser.lastName = names[names.length - 1]
									} else if (names.length == 1) {
										createuser.firstName = names[0]
										createuser.lastName = ''
									} else {
										createuser.firstName = ''
										createuser.lastName = ''
									}
									createuser.fullName = data.sellerName
									if (data.sellerAddress) {
										createuser.address = data.sellerAddress
									}
									if (data.sellerPincode) {
										createuser.pincode = data.sellerPincode
									} else if (data.franchiseePincode) {
										createuser.pincode = data.franchiseePincode
									}

									if (data.sellerDistrict) {
										createuser.district = data.sellerDistrict
									}

									createuser.state = data.sellerState
									createuser.addedBy = context.identity.id
									createuser.uploadBy = "fieldTransaction"
									let userUniqueId = commonServiceObj.getUniqueCode();
									createuser.userUniqueId = 'UF_' + userUniqueId;
									createuser.code = userUniqueId;

									var password = generatePasswordft()
									var encryptedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
									createuser.encryptedPassword = encryptedPassword
									createuser.password = encryptedPassword

									return Users.findOne({ role: "U", mobile: data.sellerMobile }).then(function (existingusr) {
										if (existingusr) {
											return FieldTransactions.update({ id: requirement[0].id }, { seller: existingusr.id }).then(function (upreq) {
												if (requirement) {
													return {
														success: true,
														code: 200,
														message: "Transaction updated successfully and user already exists",
														data: requirement[0],
													}
												} else {
													return {
														success: false,
														error: {
															code: 400,
															message: "Unknown error occurred"
														},
														message: "Unknown error occurred"
													};
												}
											})
										} else {
											return Users.create(createuser).then(function (usercreated) {
												if (usercreated) {
													return FieldTransactions.update({ id: requirement[0].id }, { seller: usercreated.id }).then(function (upreq) {
														if (requirement) {
															return {
																success: true,
																code: 200,
																message: "Transaction updated successfully and user created too",
																data: requirement[0],
															}
														} else {
															return {
																success: false,
																error: {
																	code: 400,
																	message: "Unknown error occurred"
																},
																message: "Unknown error occurred"
															};
														}
													})
												} else {
													if (requirement) {
														return {
															success: true,
															code: 200,
															message: "Transaction updated successfully and user created too",
															data: requirement[0],
														}
													} else {
														return {
															success: false,
															error: {
																code: 400,
																message: "Unknown error occurred"
															},
															message: "Unknown error occurred"
														};
													}
												}

											}).fail(function (err) {
												if (requirement) {
													return {
														success: true,
														code: 200,
														message: "Transaction updated successfully but unable to add user",
														data: requirement[0],
													}
												} else {
													return {
														success: false,
														error: {
															code: 400,
															message: "Unknown error occurred"
														},
														message: "Unknown error occurred"
													};
												}
											})
										}
									})
								} else {
									if (requirement) {
										return {
											success: true,
											code: 200,
											message: "Transaction updated successfully",
											data: requirement[0],
										}
									} else {
										return {
											success: false,
											error: {
												code: 400,
												message: "Unknown error occurred"
											},
											message: "Unknown error occurred"
										};
									}
								}
							}).fail(function (error) {
								return {
									success: false,
									error: {
										code: 400,
										message: error
									},
									message: error
								};
							})
						}
					})
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "Invalid requirement id"
						},
						message: "Invalid requirement id"
					};
				}
			})
		},

		fulfillAfterAdvance: function (data, context) {
			if (data.id == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send transaction id"
					},
					message: "Please send transaction id"
				};
			}

			if (data.loadingDate == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "When it was loaded?"
					},
					message: "When it was loaded?"
				};
			}

			if (data.logisticCharges == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "What are logistic charges?"
					},
					message: "What are logistic charges?"
				};
			}

			return FieldTransactions.findOne({ id: data.id }).then(function (rqmnt) {
				if (rqmnt) {
					data.status = "Dispatched"

					data.ATD = new Date()

					if (rqmnt.farmxFinalisedTransportation == 'Farmx' && rqmnt.farmxSuggestedLogisticCharges) {
						data.logisticMargin = parseFloat(data.logisticCharges - rqmnt.farmxSuggestedLogisticCharges).toFixed(2)
						data.logisticMarginPercentage = parseFloat(data.logisticMargin * 100 / data.logisticCharges).toFixed(2)
					} else if (rqmnt.farmxFinalisedTransportation == 'Franchisee' && rqmnt.franchiseeSuggestedLogisticCharges) {
						data.logisticMargin = parseFloat(data.logisticCharges - rqmnt.franchiseeSuggestedLogisticCharges).toFixed(2)
						data.logisticMarginPercentage = parseFloat(data.logisticMargin * 100 / data.logisticCharges).toFixed(2)
					} else {
						data.logisticMargin = 0
						data.logisticMarginPercentage = 0
					}

					let totalAmountOfSeller = 0
					let totalcgst = 0
					let totalsgst = 0
					let totaligst = 0

					for (var i = 0; i < data.products.length; i++) {
						let prod = data.products[i]

						if (prod.dispatchQuantity == undefined) {
							return {
								success: false,
								error: {
									code: 400,
									message: "What quantity you are dispatching for " + prod.product + "?"
								},
								message: "What quantity you are dispatching for " + prod.product + "?"
							};
						}

						if (prod.rate == undefined) {
							return {
								success: false,
								error: {
									code: 400,
									message: "At what rate seller is selling " + prod.product + "?"
								},
							};
							message: "At what rate seller is selling " + prod.product + "?"
						}


						data.products[i].amount = parseFloat((prod.dispatchQuantity * prod.rate).toFixed(2))


						// if (prod.taxAmount == undefined) {
						data.products[i].taxAmount = parseFloat(data.products[i].amount) * parseFloat(data.products[i].taxPercent) / 100
						// }

						if (rqmnt.sellerState == rqmnt.buyerState) {
							data.products[i].cgst = data.products[i].taxAmount / 2
							data.products[i].cgstPercent = data.products[i].taxPercent / 2
							data.products[i].sgst = data.products[i].taxAmount / 2
							data.products[i].sgstPercent = data.products[i].taxPercent / 2
							data.products[i].igst = 0
							data.products[i].igstPercent = 0

							totalcgst = totalcgst + data.products[i].cgst
							totalsgst = totalsgst + data.products[i].sgst
							totaligst = totaligst + data.products[i].igst
						} else {
							data.products[i].cgst = 0
							data.products[i].cgstPercent = 0
							data.products[i].sgst = 0
							data.products[i].sgstPercent = 0
							data.products[i].igst = data.products[i].taxAmount
							data.products[i].igstPercent = data.products[i].taxPercent

							totalcgst = totalcgst + data.products[i].cgst
							totalsgst = totalsgst + data.products[i].sgst
							totaligst = totaligst + data.products[i].igst
						}

						data.products[i].totalProductAmount = parseFloat((data.products[i].amount + data.products[i].taxAmount).toFixed(2))

						totalAmountOfSeller = totalAmountOfSeller + parseFloat(data.products[i].totalProductAmount)

						data.products[i].sellerRate = parseFloat(data.products[i].rate)
						data.products[i].sellerConsideredQuantity = parseFloat(data.products[i].dispatchQuantity)
						data.products[i].sellerAmount = parseFloat(data.products[i].amount)
						data.products[i].pendingQuantityToReconciel = parseFloat(data.products[i].dispatchQuantity)

					}

					data.sellerTotalAmount = totalAmountOfSeller - (totalcgst + totalsgst + totaligst)

					data.cgst = totalcgst
					data.sgst = totalsgst
					data.igst = totaligst

					data.amount = parseFloat((data.sellerTotalAmount).toFixed(2))
					data.totalAmount = parseFloat((totalAmountOfSeller + data.logisticCharges).toFixed(2))

					data.originalamount = parseFloat(data.amount)
					data.originalTaxAmount = totalcgst + totalsgst + totaligst
					data.originalTotalAmount = parseFloat(data.totalAmount)

					if (data.advancePayment && parseFloat(data.advancePayment) > 0) {
						let payments = []
						let advance = {}
						advance.amount = parseFloat(parseFloat(data.advancePayment).toFixed(2))
						advance.paymentDate = new Date()
						advance.paymentType = "Advance"
						advance.status = "Paid"
						payments.push(advance)
						data.sellerpayments = payments

						delete data.advancePayment
					}

					return FieldTransactions.update({ id: data.id }, data).then(function (requirement) {
						if (requirement) {
							pushService.sendPushToFieldTransactionsAdmin([requirement[0].cpfo, requirement[0].transactionleader], 'Requirement fulfilled', 'Requirement of transaction ' + requirement[0].code + ' is fulfilled.')
						}

						if (requirement) {
							return {
								success: true,
								code: 200,
								message: "Transaction updated successfully",
								data: requirement[0],
							}
						} else {
							return {
								success: false,
								error: {
									code: 400,
									message: "Unknown error occurred"
								},
								message: "Unknown error occurred"
							};
						}
					}).fail(function (error) {
						return {
							success: false,
							error: {
								code: 400,
								message: error
							},
							message: error
						};
					})
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "Invalid requirement id"
						},
						message: "Invalid requirement id"
					};
				}
			})
		},

		cancel: function (data, context) {
			if (data.id == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send requirement id"
					},
					message: "Please send requirement id"
				};
			}

			if (data.cancelReason == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please provide a cancel reason"
					},
					message: "Please provide a cancel reason"
				};
			}

			return FieldTransactions.findOne({ id: data.id }).then(function (rqmnt) {
				if (rqmnt) {
					data.status = "Cancelled"
					data.cancelledBy = context.identity.id
					data.cancelledOn = new Date()

					return FieldTransactions.update({ id: data.id }, data).then(function (requirement) {
						if (requirement) {
							pushService.sendPushToFieldTransactionsAdmin([requirement[0].cpfo], 'Transaction cancelled', 'Transaction of product for buyer ' + requirement[0].buyerName + ' is canceled by ' + context.identity.fullName + '. Reason give is ' + data.cancelReason)

							return {
								success: true,
								code: 200,
								message: "Transaction updated successfully",
								data: requirement[0],
							}
						} else {
							return {
								success: false,
								error: {
									code: 400,
									message: "Unknown error occurred"
								},
								message: "Unknown error occurred"
							};
						}
					}).fail(function (error) {
						return {
							success: false,
							error: {
								code: 400,
								message: error
							},
							message: error
						};
					})
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "Invalid requirement id"
						},
						message: "Invalid requirement id"
					};
				}
			})
		},

		updateGRN: function (data, context) {
			if (data.id == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send requirement id"
					},
					message: "Please send requirement id"
				};
			}

			if (data.grncopyimage == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please provide a cancel reason"
					},
					message: "Please provide a cancel reason"
				};
			}

			return FieldTransactions.findOne({ id: data.id }).then(function (rqmnt) {
				if (rqmnt) {
					data.receivingAddedDateTimes = []
					if (rqmnt.receivingAddedDateTimes) {
						data.receivingAddedDateTimes = rqmnt.receivingAddedDateTimes
					}

					data.receivingAddedDateTimes.push(new Date())

					let updates = {}
					updates.grncopyimage = data.grncopyimage
					updates.receivingAddedDateTimes = data.receivingAddedDateTimes

					return FieldTransactions.update({ id: data.id }, updates).then(function (requirement) {
						if (requirement) {
							return {
								success: true,
								code: 200,
								message: "Transaction updated successfully",
								data: requirement[0],
							}
						} else {
							return {
								success: false,
								error: {
									code: 400,
									message: "Unknown error occurred"
								},
								message: "Unknown error occurred"
							};
						}
					}).fail(function (error) {
						return {
							success: false,
							error: {
								code: 400,
								message: error
							},
							message: error
						};
					})
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "Invalid requirement id"
						},
						message: "Invalid requirement id"
					};
				}
			})
		},

		receive: function (data, context) {

			if (data.ATA == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please enter the arrival time"
					},
					message: "Please enter the arrival time"
				};
			}

			if (data.unloadingDate == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please enter the unloading time"
					},
					message: "Please enter the unloading time"
				};
			}

			// if (data.receivedQuantity == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "How much quantity is received?"
			// 		},
			// 	};
			// }

			// if (data.rejectedQuantity == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "What is rejection quantity"
			// 		},
			// 	};
			// } else if (data.rejectedQuantity > 0) {
			// 	if (data.rejectionreason == undefined) {
			// 		return {
			// 			success: false,
			// 			error: {
			// 				code: 400,
			// 				message: "Please define reasone of rejection"
			// 			},
			// 		};
			// 	}
			// }

			// if (data.grncopyimage == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "Please add grn image."
			// 		},
			// 	};
			// }

			// if (data.rate == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "At what rate seller is selling?"
			// 		},
			// 	};
			// }

			// if (data.amount == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "What is amount?"
			// 		},
			// 	};
			// }

			// if (data.totalAmount == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "What is total amount?"
			// 		},
			// 	};
			// }

			// if (data.taxAmount == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "What is tax amount?"
			// 		},
			// 	};
			// }

			// // if (data.facilitationPercent == undefined) {
			// // 	return {
			// // 		success: false,
			// // 		error: {
			// // 			code: 400,
			// // 			message: "What is facilitation Percent?"
			// // 		},
			// // 	};
			// // }

			// // if (data.facilitationCharges == undefined) {
			// // 	return {
			// // 		success: false,
			// // 		error: {
			// // 			code: 400,
			// // 			message: "What is facilitation Charges?"
			// // 		},
			// // 	};
			// // }

			return FieldTransactions.findOne({ id: data.id }).then(function (rqmnt) {
				if (rqmnt) {
					data.receivingAddedDateTimes = []
					if (rqmnt.receivingAddedDateTimes) {
						data.receivingAddedDateTimes = rqmnt.receivingAddedDateTimes
					}

					data.receivingAddedDateTimes.push(new Date())

					data.status = 'Received'
					// data.acceptedQuantity = data.receivedQuantity - data.rejectedQuantity
					// data.transitionlossquantity = rqmnt.dispatchQuantity - data.receivedQuantity

					// data.pendingQuantityToReconciel = data.rejectedQuantity

					// data.marginOnBasisOfWeight = (data.acceptedQuantity *  data.rate) - (data.acceptedQuantity * rqmnt.sellerRate)
					// data.marginPercentOnBasisOfWeight = (data.marginOnBasisOfWeight * 100) / (data.acceptedQuantity *  data.rate)



					// data.marginGeneral = (data.acceptedQuantity *  data.rate) - (rqmnt.sellerConsideredQuantity * rqmnt.sellerRate)
					// data.marginPercentGeneral = data.marginGeneral * 100 / (data.acceptedQuantity *  data.rate)				

					if (data.unloadingCharges) {
						data.logisticCharges = parseFloat(rqmnt.logisticCharges) + parseFloat(data.unloadingCharges)
						if (rqmnt.farmxFinalisedTransportation == 'Farmx' && rqmnt.farmxSuggestedLogisticCharges) {
							data.logisticMargin = parseFloat(data.logisticCharges) - parseFloat(rqmnt.farmxSuggestedLogisticCharges)
							data.logisticMarginPercentage = data.logisticMargin * 100 / data.logisticCharges
						} else if (rqmnt.farmxFinalisedTransportation == 'Franchisee' && rqmnt.franchiseeSuggestedLogisticCharges) {
							data.logisticMargin = parseFloat(data.logisticCharges) - parseFloat(rqmnt.franchiseeSuggestedLogisticCharges)
							data.logisticMarginPercentage = parseFloat(data.logisticMargin) * 100 / parseFloat(data.logisticCharges)
						} else {
							data.logisticMargin = 0
							data.logisticMarginPercentage = 0
						}
					} else {
						data.logisticMargin = parseFloat(rqmnt.logisticMargin)
						data.logisticCharges = parseFloat(rqmnt.logisticCharges)
					}

					data.isQuantityReconcieled = true

					let totalAmountOfSeller = 0
					let totalcgst = 0
					let totalsgst = 0
					let totaligst = 0
					let totalWeightBasedMargin = 0
					let totalGeneralMargin = 0

					for (var i = 0; i < data.products.length; i++) {
						let prod = data.products[i]

						if (prod.receivedQuantity == undefined) {
							return {
								success: false,
								error: {
									code: 400,
									message: "How much quantity is received?"
								},
								message: "How much quantity is received?"
							};
						}

						if (prod.rejectedQuantity == undefined) {
							return {
								success: false,
								error: {
									code: 400,
									message: "What is rejection quantity"
								},
								message: "What is rejection quantity"
							};
						} else if (data.rejectedQuantity > 0) {
							if (data.rejectionreason == undefined) {
								return {
									success: false,
									error: {
										code: 400,
										message: "Please define reasone of rejection"
									},
									message: "Please define reasone of rejection"
								};
							}
						}

						if (prod.rate == undefined) {
							return {
								success: false,
								error: {
									code: 400,
									message: "At what rate buyer is buying now?"
								},
								message: "At what rate buyer is buying now?"
							};
						}

						data.products[i].acceptedQuantity = parseFloat(prod.receivedQuantity) - parseFloat(prod.rejectedQuantity)
						data.products[i].transitionlossquantity = parseFloat(prod.dispatchQuantity) - parseFloat(prod.receivedQuantity)

						data.products[i].originalamount = parseFloat(prod.amount)
						data.products[i].originalTaxAmount = parseFloat(prod.taxAmount)

						data.products[i].amount = parseFloat((data.products[i].acceptedQuantity * prod.rate).toFixed(2))

						if (prod.taxAmount == undefined) {
							data.products[i].taxAmount = parseFloat(data.products[i].amount) * parseFloat(data.products[i].taxPercent) / 100
						}

						if (rqmnt.sellerState == rqmnt.buyerState) {
							data.products[i].cgst = data.products[i].taxAmount / 2
							data.products[i].cgstPercent = data.products[i].taxPercent / 2
							data.products[i].sgst = data.products[i].taxAmount / 2
							data.products[i].sgstPercent = data.products[i].taxPercent / 2
							data.products[i].igst = 0
							data.products[i].igstPercent = 0

							totalcgst = totalcgst + data.products[i].cgst
							totalsgst = totalsgst + data.products[i].sgst
							totaligst = totaligst + data.products[i].igst
						} else {
							data.products[i].cgst = 0
							data.products[i].cgstPercent = 0
							data.products[i].sgst = 0
							data.products[i].sgstPercent = 0
							data.products[i].igst = data.products[i].taxAmount
							data.products[i].igstPercent = data.products[i].taxPercent

							totalcgst = totalcgst + data.products[i].cgst
							totalsgst = totalsgst + data.products[i].sgst
							totaligst = totaligst + data.products[i].igst
						}

						data.products[i].totalProductAmount = parseFloat((data.products[i].amount + data.products[i].taxAmount).toFixed(2))

						totalAmountOfSeller = totalAmountOfSeller + parseFloat(data.products[i].totalProductAmount)

						data.products[i].pendingQuantityToReconciel = parseFloat(prod.rejectedQuantity)

						if (prod.rejectedQuantity > 0) {
							data.isQuantityReconcieled = false
						}

						data.products[i].marginOnBasisOfWeight = (parseFloat(data.products[i].acceptedQuantity) * parseFloat(prod.rate)) - (parseFloat(data.products[i].acceptedQuantity) * parseFloat(data.products[i].sellerRate))
						data.products[i].marginPercentOnBasisOfWeight = (parseFloat(data.products[i].marginOnBasisOfWeight) * 100) / (parseFloat(data.products[i].acceptedQuantity) * parseFloat(prod.rate))

						data.products[i].marginGeneral = (parseFloat(data.products[i].acceptedQuantity) * parseFloat(prod.rate)) - (parseFloat(prod.sellerConsideredQuantity) * parseFloat(prod.sellerRate))
						data.products[i].marginPercentGeneral = parseFloat(data.products[i].marginGeneral) * 100 / (parseFloat(data.products[i].acceptedQuantity) * parseFloat(prod.rate))

						totalWeightBasedMargin = totalWeightBasedMargin + parseFloat(data.products[i].marginOnBasisOfWeight)

						totalGeneralMargin = totalGeneralMargin + parseFloat(data.products[i].marginGeneral)
					}

					// data.sellerTotalAmount  = totalAmountOfSeller - (totalcgst + totalsgst + totaligst)

					data.cgst = totalcgst
					data.sgst = totalsgst
					data.igst = totaligst

					data.amount = parseFloat((totalAmountOfSeller - (totalcgst + totalsgst + totaligst)).toFixed(2))
					data.totalAmount = parseFloat((totalAmountOfSeller + parseFloat(rqmnt.logisticCharges)).toFixed(2))

					data.totalMargin = totalGeneralMargin + parseFloat(rqmnt.logisticMargin)
					data.totalMarginPercentage = parseFloat(data.totalMargin) * 100 / ((data.amount - (totalcgst + totalsgst + totaligst)) + rqmnt.logisticCharges)

					data.totalMarginIncludingSubTransactions = data.totalMargin
					data.totalMarginPercentageIncludingSubTransactions = data.totalMarginPercentage

					if (data.grnPayment && parseFloat(data.grnPayment) > 0) {
						let payments = rqmnt.buyerpayments
						if (payments == undefined) {
							payments = []
						}
						let advance = {}
						advance.amount = parseFloat((data.grnPayment).toFixed(2))
						advance.paymentDate = new Date()
						advance.paymentType = "GRN Amount"
						advance.status = "Paid"
						payments.push(advance)
						data.buyerpayments = payments

						let amountToTake = data.totalAmount
						let amountReceived = 0

						for (var i = 0; i < payments.length; i++) {
							if (payments[i].amount) {
								amountReceived = amountReceived + payments[i].amount
							}
						}
						if (amountReceived > amountToTake - 100) {
							data.isBuyerPaymentDone = true

							if (rqmnt.isSellerPaymentDone && rqmnt.isQuantityReconcieled && rqmnt.isLogisticPaymentDone) {
								data.status = 'Completed'
							}
						}

						delete data.grnPayment
					}

					// if (data.rejectedQuantity == 0) {
					// 	data.isQuantityReconcieled = true
					// }

					// if (rqmnt.sellerState == rqmnt.buyerState && data.taxAmount) {
					// 	data.cgst = data.taxAmount/2
					// 	data.cgstPercent = data.taxPercent/2
					// 	data.sgst = data.taxAmount/2
					// 	data.sgstPercent = data.taxPercent/2
					// 	data.igst = 0
					// 	data.igstPercent = 0
					// } else {
					// 	data.cgst = 0
					// 	data.cgstPercent = 0
					// 	data.sgst = 0
					// 	data.sgstPercent = 0
					// 	data.cgst = data.taxAmount
					// 	data.cgstPercent = data.taxPercent
					// }

					return FieldTransactions.update({ id: data.id }, data).then(function (requirement) {
						if (requirement) {
							pushService.sendPushToFieldTransactionsAdmin([requirement[0].frfo], 'Product received', 'Transaction with  transaction  number ' + requirement[0].code + ' is received.')

							var d = new Date();
							var month = d.getMonth();
							var year = d.getFullYear();

							var yrStore = ""
							if (month < 3) {
								yrStore = (year - 1).toString().substr(-2) + "-" + year.toString().substr(-2)
							} else {
								yrStore = year.toString().substr(-2) + "-" + (year + 1).toString().substr(-2)
							}


							return Invoice.find({ financialYear: yrStore, type: "fieldtransaction" }).sort('number DESC').then(function (invoices) {
								let numberToAssign = 1
								if (invoices.length > 0) {
									let invoice = invoices[0]
									numberToAssign = invoice.number + 1
								}

								let createInvoiceData = {}
								createInvoiceData.type = "fieldtransaction"
								createInvoiceData.fieldTransaction = data.id
								createInvoiceData.number = numberToAssign
								createInvoiceData.financialYear = yrStore

								return Invoice.create(createInvoiceData).then(function (createdInvoice) {
									return FieldTransactions.update({ id: data.id }, { invoice: createdInvoice.id }).then(function () {
										return {
											success: true,
											code: 200,
											message: "Transaction updated successfully",
											data: requirement[0],
										}
									})
								})
							})
						} else {
							return {
								success: false,
								error: {
									code: 400,
									message: "Unknown error occurred"
								},
								message: "Unknown error occurred"
							};
						}
					}).fail(function (error) {
						return {
							success: false,
							error: {
								code: 400,
								message: error
							},
							message: error
						};
					})
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "Invalid requirement id"
						},
						message: "Invalid requirement id"
					};
				}
			})
		},

		list: function (data, context, req, res) {

			let page = req.param('page');
			let count = parseInt(req.param('count'));
			let skipNo = (page - 1) * count;

			let search = req.param('search');

			let query = {}
			query.isDeleted = false

			// let pincodes = req.param('pincode')
			// if (pincode) {
			//     var pincode = JSON.parse(pincodes);
			//     if (pincode.length > 0) {
			//         query.buyerPincode = { "$in": pincode }
			//     }
			// }

			let andpush = []
			let currentUser = req.param('currentUser')
			if (currentUser) {
				andpush.push({ $or: [{ frfo: currentUser }, { frtsm: currentUser }, { cpfo: currentUser }, { cptsm: currentUser }, { transactionleader: currentUser }] })
			}

			let from = req.param('fromRequirement')
			let to = req.param('toRequirement')
			if (from && to) {
				andpush.push({ $and: [{ createdAt: { $gte: new Date(from) } }, { createdAt: { $lte: new Date(to) } }] })
			} else if (from) {
				query.createdAt = { $gte: new Date(from) }
			} else if (to) {
				query.createdAt = { $lte: new Date(to) }
			}

			let fromDispatch = req.param('fromDispatch')
			let toDispatch = req.param('toDispatch')
			if (fromDispatch && toDispatch) {
				andpush.push({ $and: [{ ATD: { $gte: new Date(fromDispatch) } }, { ATD: { $lte: new Date(toDispatch) } }] })
			} else if (fromDispatch) {
				query.ATD = { $gte: new Date(fromDispatch) }
			} else if (toDispatch) {
				query.ATD = { $lte: new Date(toDispatch) }
			}

			if (search) {
				andpush.push({
					$or: [
						{
							code: {
								'like': '%' + search + '%'
							}
							//         }, {
							//         	product:  {
							//                 'like': '%' + search + '%'
							//             }
							//         }, {
							// variety:  {
							//                 'like': '%' + search + '%'
							//             }
						}, {
							buyerName: {
								'like': '%' + search + '%'
							}
						}, {
							buyerMobile: {
								'like': '%' + search + '%'
							}
						}, {
							buyerAddress: {
								'like': '%' + search + '%'
							}
						}, {
							deliveryAddress: {
								'like': '%' + search + '%'
							}
						}, {
							deliveryPincode: {
								'like': '%' + search + '%'
							}
						}, {
							sellerName: {
								'like': '%' + search + '%'
							}
						}, {
							sellerMobile: {
								'like': '%' + search + '%'
							}
						}, {
							sellerAddress: {
								'like': '%' + search + '%'
							}
						}, {
							franchiseeName: {
								'like': '%' + search + '%'
							}
						}, {
							franchiseeMobile: {
								'like': '%' + search + '%'
							}
						}, {
							franchiseeAddress: {
								'like': '%' + search + '%'
							}
						}, {
							vehicleNumber: {
								'like': '%' + search + '%'
							}
						}
					]
				})
			}

			if (andpush.length > 0) {
				query.$and = andpush
			}

			// let category = req.param('category')
			// if (category) {
			// 	query.category = category
			// }

			let status = req.param('status')
			if (status) {
				query.status = status
			}

			let transactionType = req.param('transactionType')
			if (transactionType) {
				query.transactionType = transactionType
			}

			query.parentTransaction = null

			FieldTransactions.find(query)
				.populate('farmxSuggestedLogisticsBy', { select: ['fullName', 'email', 'mobile', 'code', 'userUniqueId'] })
				.populate('franshiseeSuggestedLogisticsBy', { select: ['fullName', 'email', 'mobile', 'code', 'userUniqueId'] })
				.populate('frfo', { select: ['fullName', 'email', 'mobile', 'code', 'userUniqueId'] })
				.populate('frtsm', { select: ['fullName', 'email', 'mobile', 'code', 'userUniqueId'] })
				.populate('cpfo', { select: ['fullName', 'email', 'mobile', 'code', 'userUniqueId'] })
				.populate('cptsm', { select: ['fullName', 'email', 'mobile', 'code', 'userUniqueId'] })
				.populate('transactionleader', { select: ['fullName', 'email', 'mobile', 'code', 'userUniqueId'] })
				.populate('approvedBy', { select: ['fullName', 'email', 'mobile', 'code', 'userUniqueId'] })
				.populate('manualCompletedBy', { select: ['fullName', 'email', 'mobile', 'code', 'userUniqueId'] })
				.populate('parentTransaction', { select: ['code'] })
				.skip(skipNo).limit(count).sort('updatedAt desc').exec(function (err, result) {
					if (err) {
						return res.jsonx({
							success: false,
							error: err
						});
					}
					FieldTransactions.count(query).exec((cer, count) => {
						if (cer) {
							return res.jsonx({
								success: false,
								error: cer
							});
						}

						return res.jsonx({
							success: true,
							data: {
								transactions: result,
								total: count
							}
						});
					})
				})
		},

		get: function (data, context, req, res) {

			FieldTransactions.findOne({ id: data.id })
				.populate('sellerPaymentModifiedBy', { select: ['fullName', 'email', 'mobile', 'code', 'userUniqueId'] })
				.populate('farmxSuggestedLogisticsBy', { select: ['fullName', 'email', 'mobile', 'code', 'userUniqueId'] })
				.populate('franshiseeSuggestedLogisticsBy', { select: ['fullName', 'email', 'mobile', 'code', 'userUniqueId'] })
				.populate('buyer', { select: ['fullName', 'email', 'mobile', 'code', 'userUniqueId'] })
				.populate('seller', { select: ['fullName', 'email', 'mobile', 'code', 'userUniqueId'] })
				.populate('frfo', { select: ['fullName', 'email', 'mobile', 'code', 'userUniqueId'] })
				.populate('frtsm', { select: ['fullName', 'email', 'mobile', 'code', 'userUniqueId'] })
				.populate('cpfo', { select: ['fullName', 'email', 'mobile', 'code', 'userUniqueId'] })
				.populate('cptsm', { select: ['fullName', 'email', 'mobile', 'code', 'userUniqueId'] })
				.populate('approvedBy', { select: ['fullName', 'email', 'mobile', 'code', 'userUniqueId'] })
				.populate('childTransactions')
				.exec(function (err, result) {

					if (err) {
						return res.jsonx({
							success: false,
							error: err
						});
					}

					if (result == undefined) {
						return res.jsonx({
							success: false,
							error: "No result found"
						});
					}

					let amountReceived = 0
					if (result.buyerpayments) {
						let payments = result.buyerpayments
						if (payments != undefined && payments != null) {
							for (var i = 0; i < payments.length; i++) {
								if (payments[i].amount) {
									amountReceived = amountReceived + parseFloat(payments[i].amount)
								}
							}
						}
					}

					let amountGiven = 0
					if (result.sellerpayments) {
						let paymentsG = result.sellerpayments
						if (paymentsG != undefined && paymentsG != null) {
							for (var i = 0; i < paymentsG.length; i++) {
								if (paymentsG[i].amount) {
									amountGiven = amountGiven + parseFloat(paymentsG[i].amount)
								}
							}
						}
					}

					let logisticAmountGiven = 0
					if (result.logisticpayments) {
						//console.log(result.logisticpayments, '====')
						let paymentsL = result.logisticpayments;
						if (paymentsL != undefined && paymentsL != null) {
							for (var i = 0; i < paymentsL.length; i++) {
								if (paymentsL[i].amount) {
									logisticAmountGiven = logisticAmountGiven + parseFloat(paymentsL[i].amount)
								}
							}
						}
					}

					if (result.totalAmount == undefined || result.totalAmount == null) {
						result.pendingBuyerAmount = 0
					} else {
						result.pendingBuyerAmount = parseFloat(parseFloat(result.totalAmount - amountReceived).toFixed(2))
					}
					if (result.sellerTotalAmount == undefined || result.sellerTotalAmount == null) {
						result.pendingSellerAmount = 0
					} else {
						result.pendingSellerAmount = parseFloat(parseFloat(result.sellerTotalAmount - amountGiven).toFixed(2))
					}
					if (result.logisticCharges == undefined || result.logisticCharges == null) {
						result.pendingLogiticAmount = 0
					} else {
						result.pendingLogiticAmount = parseFloat(parseFloat(result.logisticCharges - logisticAmountGiven).toFixed(2))
					}

					let totalReceivedFromChildTrans = 0

					if (result.childTransactions) {
						for (var i = 0; i < result.childTransactions.length; i++) {
							let amountReceivedC = 0
							if (result.childTransactions[i].buyerpayments) {
								let payments = result.childTransactions[i].buyerpayments
								for (var j = 0; j < payments.length; j++) {
									if (payments[j].amount) {
										amountReceivedC = amountReceivedC + parseFloat(payments[j].amount)
									}
								}
							}

							// let assmountGivenC = 0
							//          if (result.childTransactions[i].sellerpayments) {
							//          	let paymentsG = result.childTransactions[i].sellerpayments
							// 	for (var j = 0; j < paymentsG.length; j++) {
							// 		if (paymentsG[j].amount) {
							// 			amountGivenC = amountGivenC + parseFloat(paymentsG[j].amount)
							// 		}
							// 	}
							// }

							totalReceivedFromChildTrans = totalReceivedFromChildTrans + amountReceivedC

							result.childTransactions[i].pendingBuyerAmount = parseFloat(result.totalAmount - amountReceivedC).toFixed(2)
							// result.childTransactions[i].pendingSellerAmount = parseFloat(result.sellerAmount - amountGivenC).toFixed(2)
						}
					}

					let finalOngoingMargin = amountReceived + totalReceivedFromChildTrans - amountGiven - logisticAmountGiven
					let finalOngoingMarginPercentage = (finalOngoingMargin * 100) / (amountReceived + totalReceivedFromChildTrans)

					result.finalOngoingMargin = finalOngoingMargin
					result.finalOngoingMarginPercentage = finalOngoingMarginPercentage
					// .populate('category', {select: ['name', 'hsn', 'tax']})

					var ratingquery = {}
					ratingquery.rateOnModal = 'fieldTransactions'
					ratingquery.modalId = String(data.id)

					Rating.find(ratingquery).populate('reviewer', { select: ['fullName', 'email', 'mobile', 'code', 'userUniqueId'] }).populate('user', { select: ['fullName', 'email', 'mobile', 'code', 'userUniqueId'] }).then(function (ratings) {
						if (ratings) {
							result.feedbacks = ratings
						}
						//add condition for status completed whenever all pending amount is zero
						if (result.pendingSellerAmount == 0 && result.pendingBuyerAmount == 0 && result.pendingLogiticAmount == 0 && result.status != "Completed") {
							FieldTransactions.update({ id: data.id }, { status: 'Completed' }).then(function (updateFiled) {
								return res.jsonx({
									success: true,
									data: result
								});
							})
						} else {
							return res.jsonx({
								success: true,
								data: result
							});
						}
					})
				})
		},

		receiveBuyerPayment: function (data, context) {

			if (data.id == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send transaction id"
					},
					message: "Please send transaction id"
				};
			}

			if (data.amount == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please enter the amount"
					},
					message: "Please enter the amount"
				};
			} else {
				if (parseFloat(data.amount) < 1) {
					return {
						success: false,
						error: {
							code: 400,
							message: "amount should be greater than 1"
						},
						message: "amount should be greater than 1"
					};
				}
			}

			return FieldTransactions.findOne({ id: data.id }).then(function (rqmnt) {
				if (rqmnt) {

					let amountToTake = rqmnt.totalAmount
					let amountReceived = 0


					let payments = rqmnt.buyerpayments
					if (payments == undefined) {
						payments = []
					}
					let advance = {}
					advance.amount = parseFloat(data.amount)
					if (data.paymentDate) {
						advance.paymentDate = new Date(data.paymentDate)

						delete data.paymentDate
					} else {
						advance.paymentDate = new Date()
					}
					advance.paymentType = "Deposit"
					advance.status = "Paid"
					payments.push(advance)
					data.buyerpayments = payments

					for (var i = 0; i < payments.length; i++) {
						if (payments[i].amount) {
							amountReceived = amountReceived + payments[i].amount
						}
					}

					if (amountReceived > amountToTake - 100) {
						data.isBuyerPaymentDone = true

						if (rqmnt.isSellerPaymentDone && rqmnt.isQuantityReconcieled && rqmnt.isLogisticPaymentDone) {
							data.status = 'Completed'
						}
					}

					delete data.amount

					return FieldTransactions.update({ id: data.id }, data).then(function (requirement) {
						if (requirement) {
							return {
								success: true,
								code: 200,
								message: "Transaction updated successfully",
								data: requirement[0],
							}
						} else {
							return {
								success: false,
								error: {
									code: 400,
									message: "Unknown error occurred"
								},
								message: "Unknown error occurred"
							};
						}
					}).fail(function (error) {
						return {
							success: false,
							error: {
								code: 400,
								message: error
							},
							message: error
						};
					})
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "Invalid transaction id"
						},
						message: "Invalid transaction id"
					};
				}
			})
		},

		receiveSellerPayment: function (data, context) {

			if (data.id == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send transaction id"
					},
					message: "Please send transaction id"
				};
			}

			if (data.amount == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please enter the amount"
					},
					message: "Please enter the amount"
				};
			} else {
				if (parseFloat(data.amount) < 1) {
					return {
						success: false,
						error: {
							code: 400,
							message: "amount should be greater than 1"
						},
						message: "amount should be greater than 1"
					};
				}
			}

			return FieldTransactions.findOne({ id: data.id }).then(function (rqmnt) {
				if (rqmnt) {

					let amountToTake = parseFloat(rqmnt.sellerTotalAmount).toFixed(2)
					let amountReceived = 0

					let payments = rqmnt.sellerpayments
					if (payments == undefined) {
						payments = []
					}
					let advance = {}
					advance.amount = parseFloat(data.amount)
					if (data.paymentDate) {
						advance.paymentDate = new Date(data.paymentDate)

						delete data.paymentDate
					} else {
						advance.paymentDate = new Date()
					}
					advance.paymentType = "Deposit"
					advance.status = "Paid"
					payments.push(advance)
					data.sellerpayments = payments

					for (var i = 0; i < payments.length; i++) {
						if (payments[i].amount) {
							amountReceived = parseFloat(amountReceived) + parseFloat(payments[i].amount)
						}
					}

					if (amountReceived > amountToTake || amountReceived == amountToTake) {
						data.isSellerPaymentDone = true
						if (rqmnt.isBuyerPaymentDone && rqmnt.isQuantityReconcieled && rqmnt.isLogisticPaymentDone) {
							data.status = 'Completed'
						}
					}

					delete data.amount

					return FieldTransactions.update({ id: data.id }, data).then(function (requirement) {
						if (requirement) {
							return {
								success: true,
								code: 200,
								message: "Transaction updated successfully",
								data: requirement[0],
							}
						} else {
							return {
								success: false,
								error: {
									code: 400,
									message: "Unknown error occurred"
								},
								message: "Unknown error occurred"
							};
						}
					}).fail(function (error) {
						return {
							success: false,
							error: {
								code: 400,
								message: error
							},
							message: error
						};
					})
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "Invalid transaction id"
						},
						message: "Invalid transaction id"
					};
				}
			})
		},

		receiveLogisticPayment: function (data, context) {

			if (data.id == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send transaction id"
					},
					message: "Please send transaction id"
				};
			}

			if (data.amount == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please enter the amount"
					},
					message: "Please enter the amount"
				};
			} else {
				if (parseFloat(data.amount) < 1) {
					return {
						success: false,
						error: {
							code: 400,
							message: "amount should be greater than 1"
						},
						message: "amount should be greater than 1"
					};
				}
			}

			return FieldTransactions.findOne({ id: data.id }).then(function (rqmnt) {
				if (rqmnt) {

					let amountToTake = parseFloat(rqmnt.logisticCharges).toFixed(2)
					let amountReceived = 0

					let payments = rqmnt.logisticpayments
					if (payments == undefined) {
						payments = []
					}
					let advance = {}
					advance.amount = parseFloat(data.amount)
					if (data.paymentDate) {
						advance.paymentDate = new Date(data.paymentDate)

						delete data.paymentDate
					} else {
						advance.paymentDate = new Date()
					}
					advance.paymentType = "Deposit"
					advance.status = "Verified"
					payments.push(advance)
					data.logisticpayments = payments

					for (var i = 0; i < payments.length; i++) {
						if (payments[i].amount) {
							amountReceived = parseFloat(amountReceived) + parseFloat(payments[i].amount)
						}
					}

					if (amountReceived > amountToTake || amountReceived == amountToTake) {
						data.isLogisticPaymentDone = true
						if (rqmnt.isBuyerPaymentDone && rqmnt.isQuantityReconcieled && rqmnt.isSellerPaymentDone) {
							data.status = 'Completed'
						}
					}

					delete data.amount

					return FieldTransactions.update({ id: data.id }, data).then(function (requirement) {
						if (requirement) {
							return {
								success: true,
								code: 200,
								message: "Transaction updated successfully",
								data: requirement[0],
							}
						} else {
							return {
								success: false,
								error: {
									code: 400,
									message: "Unknown error occurred"
								},
								message: "Unknown error occurred"
							};
						}
					}).fail(function (error) {
						return {
							success: false,
							error: {
								code: 400,
								message: error
							},
							message: error
						};
					})
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "Invalid transaction id"
						},
						message: "Invalid transaction id"
					};
				}
			})
		},

		changestakeholders: function (data, context) {
			if (data.id == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send transaction id"
					},
					message: "Please send transaction id"
				};
			}

			if (data.frfo == undefined && data.frtsm == undefined && data.cpfo == undefined && data.cptsm == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please enter the stakeholder"
					},
					message: "Please enter the stakeholder"
				};
			}

			let change = {}

			let user = ''
			let position = ''

			if (data.frfo) {
				change.frfo = data.frfo
				user = data.frfo
				position = 'Franchisee FO'
			}

			if (data.frtsm) {
				change.frtsm = data.frtsm
				user = data.frtsm
				position = 'Franchisee TSM'
			}

			if (data.cpfo) {
				change.cpfo = data.cpfo
				user = data.cpfo
				position = 'CP FO'
			}

			if (data.cptsm) {
				change.cptsm = data.cptsm
				user = data.cptsm
				position = 'CP TSM'
			}

			return FieldTransactions.findOne({ id: data.id }).then(function (rqmnt) {
				if (rqmnt) {

					return FieldTransactions.update({ id: data.id }, change).then(function (requirement) {
						if (requirement) {
							pushService.sendPushToFieldTransactionsAdmin([user], 'Position assigned', 'You are assiggned as ' + position + ' for  transaction  number ' + requirement[0].code)
							return {
								success: true,
								code: 200,
								message: "Transaction updated successfully",
								data: requirement[0],
							}
						} else {
							return {
								success: false,
								error: {
									code: 400,
									message: "Unknown error occurred"
								},
								message: "Unknown error occurred"
							};
						}
					}).fail(function (error) {
						return {
							success: false,
							error: {
								code: 400,
								message: error
							},
							message: error
						};
					})
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "Invalid transaction id"
						},
						message: "Invalid transaction id"
					};
				}
			})
		},

		complete: function (data, context) {
			if (data.id == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send requirement id"
					},
					message: "Please send requirement id"
				};
			}

			if (data.manualCompletionReason == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please provide a cancel reason"
					},
					message: "Please provide a cancel reason"
				};
			}

			return FieldTransactions.findOne({ id: data.id }).then(function (rqmnt) {
				if (rqmnt) {
					data.status = "Completed"
					data.manualCompletedBy = context.identity.id
					data.manualCompletedOn = new Date()

					return FieldTransactions.update({ id: data.id }, data).then(function (requirement) {
						if (requirement) {
							pushService.sendPushToFieldTransactionsAdmin([requirement[0].frfo, requirement[0].frtsm, requirement[0].cpfo, requirement[0].cptsm, requirement[0].transactionleader], 'Transaction completed', 'Transaction completed for  transaction  number ' + requirement[0].code)
							return {
								success: true,
								code: 200,
								message: "Transaction updated successfully",
								data: requirement[0],
							}
						} else {
							return {
								success: false,
								error: {
									code: 400,
									message: "Unknown error occurred"
								},
								message: "Unknown error occurred"
							};
						}
					}).fail(function (error) {
						return {
							success: false,
							error: {
								code: 400,
								message: error
							},
							message: error
						};
					})
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "Invalid requirement id"
						},
						message: "Invalid requirement id"
					};
				}
			})
		},

		createchild: function (data, context) {

			if (data.buyerName == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send buyer name"
					},
					message: "Please send buyer name"
				};
			}

			if (data.products == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "What products sold to this buyer?"
					},
					message: "What products sold to this buyer?"
				};
			}

			if (data.buyerMobile == undefined || data.buyerAddress == undefined || data.buyerPincode == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send the valid address, mobile number and pincode of buyer"
					},
					message: "Please send the valid address, mobile number and pincode of buyer"
				};
			}

			if (data.creditDays == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "What is payment credit period in days?"
					},
					message: "What is payment credit period in days?"
				};
			}

			if (data.ATA == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please enter the arrival time"
					},
					message: "Please enter the arrival time"
				};
			}

			if (data.unloadingDate == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please enter the unloading time"
					},
					message: "Please enter the unloading time"
				};
			}

			// if (data.receivedQuantity == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "How much quantity is received?"
			// 		},
			// 	};
			// }

			// // if (data.transitionlossquantity == undefined) {
			// // 	return {
			// // 		success: false,
			// // 		error: {
			// // 			code: 400,
			// // 			message: "How much quantity is lost in transition?"
			// // 		},
			// // 	};
			// // }

			// if (data.rejectedQuantity == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "What is rejection quantity"
			// 		},
			// 	};
			// } else if (data.rejectedQuantity > 0) {
			// 	if (data.rejectionreason == undefined) {
			// 		return {
			// 			success: false,
			// 			error: {
			// 				code: 400,
			// 				message: "Please define reasone of rejection"
			// 			},
			// 		};
			// 	}
			// }

			if (data.grncopyimage == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please add grn image."
					},
					message: "Please add grn image."
				};
			}

			// if (data.rate == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "At what rate seller is selling?"
			// 		},
			// 	};
			// }

			// if (data.amount == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "What is amount?"
			// 		},
			// 	};
			// }

			// if (data.totalAmount == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "What is total amount?"
			// 		},
			// 	};
			// }

			// if (data.taxAmount == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "What is tax amount?"
			// 		},
			// 	};
			// }

			if (data.unloadingCharges && data.logisticCharges == undefined) {
				data.logisticCharges = parseFloat(data.unloadingCharges)
			}

			// // if (data.facilitationPercent == undefined) {
			// // 	return {
			// // 		success: false,
			// // 		error: {
			// // 			code: 400,
			// // 			message: "What is facilitation Percent?"
			// // 		},
			// // 	};
			// // }

			// // if (data.facilitationCharges == undefined) {
			// // 	return {
			// // 		success: false,
			// // 		error: {
			// // 			code: 400,
			// // 			message: "What is facilitation Charges?"
			// // 		},
			// // 	};
			// // }

			if (data.advancePayment && parseFloat(data.advancePayment) > 0) {
				let payments = []
				let advance = {}
				advance.amount = parseFloat((data.advancePayment).toFixed(2))
				advance.paymentDate = new Date()
				advance.paymentType = "Advance"
				advance.status = "Paid"
				payments.push(advance)
				data.buyerpayments = payments
			}

			return commonService.getDataFromPincode(data.buyerPincode).then(function (pincodeInfo) {
				let pincodeData = pincodeInfo;
				if (pincodeData == 'error') {
					return {
						success: false,
						code: 400,
						message: 'please enter valid pincode.'
					}
				} else {

					data.buyerDistrict = pincodeData["Districtname"]
					data.buyerState = pincodeData["statename"]

					return FieldTransactions.findOne({ id: data.id }).then(function (rqmnt) {
						if (rqmnt) {
							if (rqmnt.parentTransaction == null || rqmnt.parentTransaction == undefined) {
								data.receivingAddedDateTime = [new Date()]

								data.parentTransaction = rqmnt.id
								data.farmxFinalisedTransportation = rqmnt.farmxFinalisedTransportation

								data.status = 'Received'

								// data.pendingQuantityToReconciel = 0
								data.isQuantityReconcieled = true
								data.isSellerPaymentDone = true

								// data.transitionlossquantity = rqmnt.pendingQuantityToReconciel - data.receivedQuantity

								// data.acceptedQuantity = data.receivedQuantity - data.rejectedQuantity

								// data.marginOnBasisOfWeight = (data.acceptedQuantity * data.rate) - (data.acceptedQuantity * rqmnt.sellerRate)
								// data.marginPercentOnBasisOfWeight = (data.marginOnBasisOfWeight * 100) / (data.acceptedQuantity *  data.rate)

								// data.marginGeneral = data.marginOnBasisOfWeight
								// data.marginPercentGeneral = data.marginPercentOnBasisOfWeight


								let rqmntUpdate = {}
								rqmntUpdate.products = rqmnt.products
								rqmntUpdate.isQuantityReconcieled = true


								let totalMargin = 0
								let fromtotalMargin = 0

								let totalAmount = 0

								let totalcgst = 0
								let totalsgst = 0
								let totaligst = 0



								for (var i = 0; i < data.products.length; i++) {
									let mainProd = data.products[i]
									let isAvailable = false

									if (mainProd.receivedQuantity == undefined) {
										return {
											success: false,
											error: {
												code: 400,
												message: "How much quantity is received?"
											},
											message: "How much quantity is received?"
										};
									}

									if (mainProd.rejectedQuantity == undefined) {
										return {
											success: false,
											error: {
												code: 400,
												message: "What is rejection quantity"
											},
											message: "What is rejection quantity"
										};
									} else if (mainProd.rejectedQuantity > 0) {
										if (mainProd.rejectionreason == undefined) {
											return {
												success: false,
												error: {
													code: 400,
													message: "Please define reason of rejection"
												},
												message: "Please define reason of rejection"
											};
										}
									}

									if (mainProd.rate == undefined) {
										return {
											success: false,
											error: {
												code: 400,
												message: "At what rate buyer is buying?"
											},
											message: "At what rate buyer is buying?"
										};
									}
									if (mainProd.taxPercent == undefined) {
										return {
											success: false,
											error: {
												code: 400,
												message: "What is tax percentage?"
											},
											message: "What is tax percentage?"
										};
									}

									data.products[i].acceptedQuantity = parseFloat(data.products[i].receivedQuantity) - parseFloat(data.products[i].rejectedQuantity)

									data.products[i].marginOnBasisOfWeight = 0
									data.products[i].marginPercentOnBasisOfWeight = 0

									data.products[i].amount = parseFloat(data.products[i].acceptedQuantity) * parseFloat(data.products[i].rate)
									data.products[i].taxAmount = parseFloat(data.products[i].amount) * parseFloat(data.products[i].taxPercent) / 100
									data.products[i].totalAmount = parseFloat(data.products[i].amount) + parseFloat(data.products[i].taxAmount)

									totalAmount = totalAmount + parseFloat(data.products[i].totalAmount)

									if (data.buyerState == rqmnt.sellerState) {
										data.products[i].cgst = data.products[i].taxAmount / 2
										data.products[i].cgstPercent = data.products[i].taxPercent / 2
										data.products[i].sgst = data.products[i].taxAmount / 2
										data.products[i].sgstPercent = data.products[i].taxPercent / 2
										data.products[i].igst = 0
										data.products[i].igstPercent = 0



										totalcgst = totalcgst + data.products[i].cgst
										totalsgst = totalsgst + data.products[i].sgst
										totaligst = totaligst + data.products[i].igst

									} else {
										data.products[i].cgst = 0
										data.products[i].cgstPercent = 0
										data.products[i].sgst = 0
										data.products[i].sgstPercent = 0
										data.products[i].igst = data.products[i].taxAmount
										data.products[i].igstPercent = data.products[i].taxPercent

										totalcgst = totalcgst + data.products[i].cgst
										totalsgst = totalsgst + data.products[i].sgst
										totaligst = totaligst + data.products[i].igst


									}

									for (var j = 0; j < rqmnt.products.length; j++) {
										if (rqmnt.products[j]._id == mainProd._id) {
											isAvailable = true
											data.products[i]["_parentProductId"] = rqmnt.products[j].id

											data.products[i].transitionlossquantity = parseFloat(rqmnt.products[j].pendingQuantityToReconciel) - parseFloat(data.products[i].receivedQuantity)


											data.products[i].marginOnBasisOfWeight = (parseFloat(data.products[i].acceptedQuantity) * parseFloat(data.products[i].rate)) - (parseFloat(data.products[i].acceptedQuantity) * parseFloat(rqmnt.products[j].sellerRate))
											data.products[i].marginPercentOnBasisOfWeight = (parseFloat(data.products[i].marginOnBasisOfWeight) * 100) / (parseFloat(data.products[i].acceptedQuantity) * parseFloat(data.products[i].rate))

											fromtotalMargin = fromtotalMargin + (parseFloat(data.products[i].acceptedQuantity) * parseFloat(data.products[i].rate))

											rqmntUpdate.products[j].pendingQuantityToReconciel = parseFloat(data.products[i].rejectedQuantity)

											break
										}

									}

									var __id = require('mongodb').ObjectID
									data.products[i]["_id"] = (new __id()).toString()

									data.products[i].marginGeneral = parseFloat(data.products[i].marginOnBasisOfWeight)
									data.products[i].marginPercentGeneral = parseFloat(data.products[i].marginPercentOnBasisOfWeight)

									totalMargin = totalMargin + parseFloat(data.products[i].marginGeneral)

									data.products[i].pendingQuantityToReconciel = parseFloat(data.products[i].rejectedQuantity)
									if (data.products[i].rejectedQuantity > 0) {
										rqmntUpdate.isQuantityReconcieled = false
									}
								}

								if (data.logisticCharges) {
									totalAmount = totalAmount + parseFloat(data.logisticCharges)
								}

								data.totalAmount = totalAmount

								data.cgst = totalcgst
								data.sgst = totalsgst
								data.igst = totaligst

								data.totalMargin = totalMargin
								if (fromtotalMargin > 0) {

									data.totalMarginPercentage = totalMargin * 100 / fromtotalMargin
								} else {
									data.totalMarginPercentage = 0
								}

								data.logisticMargin = 0.0
								data.logisticMarginPercentage = 0.0

								data.totalMarginIncludingSubTransactions = parseFloat(data.totalMargin)
								data.totalMarginPercentageIncludingSubTransactions = parseFloat(data.totalMarginPercentage)

								if (data.advancePayment == data.totalAmount) {
									data.isBuyerPaymentDone = true
									data.status = 'Completed'
								}

								delete data.advancePayment

								let moneyEarned = 0
								// moneyEarned = rqmnt.amount

								moneyEarned = moneyEarned + data.totalAmount - (totalcgst + totaligst + totalsgst)




								let otherGivenlogisticCharges = 0 // like unloading and loading charges

								if (data.logisticCharges) {
									otherGivenlogisticCharges = data.logisticCharges
								}

								if (rqmnt.childTransactions) {
									for (var i = 0; i < rqmnt.childTransactions.length; i++) {
										moneyEarned = moneyEarned + (rqmnt.childTransactions[i].totalAmount - rqmnt.childTransactions[i].cgst - rqmnt.childTransactions[i].sgst - rqmnt.childTransactions[i].igst)
										if (childTransactions[i].logisticCharges) {
											otherGivenlogisticCharges = otherGivenlogisticCharges + parseFloat(rqmnt.childTransactions[i].logisticCharges)
										}
									}
								}

								moneyEarned = moneyEarned + rqmnt.logisticMargin

								let moneyGiven = rqmnt.sellerTotalAmount

								rqmntUpdate.totalMarginIncludingSubTransactions = parseFloat(moneyEarned) - parseFloat(moneyGiven) - parseFloat(otherGivenlogisticCharges)
								rqmntUpdate.totalMarginPercentageIncludingSubTransactions = parseFloat(rqmntUpdate.totalMarginIncludingSubTransactions) * 100 / moneyEarned

								if (rqmntUpdate.isQuantityReconcieled) {
									for (var j = 0; j < rqmntUpdate.products.length; j++) {
										if (rqmntUpdate.products[j].pendingQuantityToReconciel > 0) {
											rqmntUpdate.isQuantityReconcieled = false
											break
										}
									}
								}

								if (rqmnt.isSellerPaymentDone && rqmnt.isBuyerPaymentDone && rqmnt.isQuantityReconcieled) {
									rqmntUpdate.status = 'Completed'
								}

								data.frfo = rqmnt.frfo
								data.frtsm = rqmnt.frtsm
								data.cpfo = rqmnt.cpfo
								data.cptsm = rqmnt.cptsm

								data.approvedBy = rqmnt.approvedBy
								data.approvedOn = new Date()
								if (rqmnt.seller) {
									data.seller = rqmnt.seller
								}
								data.sellerName = rqmnt.sellerName
								data.sellerMobile = rqmnt.sellerMobile
								data.sellerAddress = rqmnt.sellerAddress
								data.sellerPincode = rqmnt.sellerPincode
								if (rqmnt.franchisee) {
									data.franchisee = rqmnt.franchisee
								}

								data.franchiseeName = rqmnt.franchiseeName
								data.franchiseeMobile = rqmnt.franchiseeMobile
								data.franchiseeAddress = rqmnt.franchiseeAddress
								data.franchiseePincode = rqmnt.franchiseePincode
								data.vehicleNumber = rqmnt.vehicleNumber
								data.vehicleImage = rqmnt.vehicleImage
								data.productType = rqmnt.productType

								loadingDate = rqmnt.ATA
								status = "Received"

								return FieldTransactions.update({ id: rqmnt.id }, rqmntUpdate).then(function (requirement) {

									var d = new Date();
									var n = "" + d.getTime();
									let code = Math.floor(1 + Math.random() * 9);

									let timePartOne = n.substring(0, 6)
									let timePartTwo = n.substring(6, n.length)

									data.code = 'FTC-' + timePartOne + "-" + timePartTwo + code;

									delete data.id

									return FieldTransactions.create(data).then(function (child) {
										var d = new Date();
										var month = d.getMonth();
										var year = d.getFullYear();

										var yrStore = ""
										if (month < 3) {
											yrStore = (year - 1).toString().substr(-2) + "-" + year.toString().substr(-2)
										} else {
											yrStore = year.toString().substr(-2) + "-" + (year + 1).toString().substr(-2)
										}
										return Invoice.find({ financialYear: yrStore, type: "fieldtransaction" }).sort('number DESC').then(function (invoices) {
											let numberToAssign = 1
											if (invoices.length > 0) {
												let invoice = invoices[0]
												numberToAssign = invoice.number + 1
											}

											let createInvoiceData = {}
											createInvoiceData.type = "fieldtransaction"
											createInvoiceData.fieldTransaction = child.id
											createInvoiceData.number = numberToAssign
											createInvoiceData.financialYear = yrStore

											return Invoice.create(createInvoiceData).then(function (createdInvoice) {
												if (child) {
													return {
														success: true,
														code: 200,
														message: "Transaction updated successfully",
														data: child,
													}
												} else {
													return {
														success: false,
														error: {
															code: 400,
															message: "Unknown error occurred"
														},
														message: "Unknown error occurred"
													};
												}
											})
										})
									}).fail(function (error) {
										return {
											success: false,
											error: {
												code: 400,
												message: error
											},
											message: error
										};
									})
								}).fail(function (error) {
									return {
										success: false,
										error: {
											code: 400,
											message: error
										},
										message: error
									};
								})
							} else {
								return {
									success: false,
									error: {
										code: 400,
										message: "This is not parent transaction or main transaction happened."
									},
									message: "This is not parent transaction or main transaction happened."
								};
							}
						} else {
							return {
								success: false,
								error: {
									code: 400,
									message: "Invalid requirement id"
								},
								message: "Invalid requirement id"
							};
						}
					})
				}
			})
		},

		sellerAmountModify: function (data, context) {
			if (data.id == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send requirement id"
					},
					message: "Please send requirement id"
				};
			}

			// if (data.sellerRate == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "At what rate seller is selling?"
			// 		},
			// 	};
			// }

			// // if (data.sellerTaxPercentage == undefined) {
			// // 	return {
			// // 		success: false,
			// // 		error: {
			// // 			code: 400,
			// // 			message: "what percentage of tax is levied on him"
			// // 		},
			// // 	};
			// // }

			// // if (data.sellerTaxAmount == undefined) {
			// // 	return {
			// // 		success: false,
			// // 		error: {
			// // 			code: 400,
			// // 			message: "What is tax amount?"
			// // 		},
			// // 	};
			// // }

			// // if (data.sellerConsideredQuantity == undefined) {
			// // 	return {
			// // 		success: false,
			// // 		error: {
			// // 			code: 400,
			// // 			message: "What quantity he is considered"
			// // 		},
			// // 	};
			// // }

			// if (data.sellerTotalAmount == undefined) {
			// 	return {
			// 		success: false,
			// 		error: {
			// 			code: 400,
			// 			message: "What is final seller amount"
			// 		},
			// 	};
			// }

			if (data.sellerPaymentNote == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please add note why you modifing seller payments."
					},
					message: "Please add note why you modifing seller payments."
				};
			}

			if (data.products == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send list of products."
					},
					message: "Please send list of products."
				};
			}

			return FieldTransactions.findOne({ id: data.id }).then(function (rqmnt) {
				if (rqmnt) {

					let totalGeneralMargin = 0
					let totalSellerAmount = 0

					if (Array.isArray(data.products) == false) {
						data.products = JSON.parse(data.products)
					}

					for (var i = 0; i < data.products.length; i++) {
						let prod = data.products[i]

						if (prod.sellerRate == undefined) {
							return {
								success: false,
								error: {
									code: 400,
									message: "What seller rate is considered?"
								},
								message: "What seller rate is considered?"
							};
						}

						if (prod.sellerConsideredQuantity == undefined) {
							return {
								success: false,
								error: {
									code: 400,
									message: "What quantity is considered from seller?"
								},
								message: "What quantity is considered from seller?"
							};
						}

						data.products[i].sellerAmount = parseFloat(parseFloat(prod.sellerRate).toFixed(2) * parseFloat(prod.sellerConsideredQuantity).toFixed(2)).toFixed(2)
						totalSellerAmount = parseFloat(totalSellerAmount) + parseFloat(data.products[i].sellerAmount)

						data.products[i].marginOnBasisOfWeight = (parseFloat(prod.acceptedQuantity) * parseFloat(prod.rate)) - (parseFloat(prod.acceptedQuantity) * parseFloat(prod.sellerRate)).toFixed(2)
						data.products[i].marginPercentOnBasisOfWeight = (parseFloat(data.products[i].marginOnBasisOfWeight) * 100) / (parseFloat(prod.acceptedQuantity) * parseFloat(prod.rate)).toFixed(2)

						data.products[i].marginGeneral = (parseFloat(prod.acceptedQuantity) * parseFloat(prod.rate)) - (parseFloat(prod.sellerConsideredQuantity) * parseFloat(prod.sellerRate)).toFixed(2)
						data.products[i].marginPercentGeneral = (parseFloat(data.products[i].marginGeneral) * 100 / (parseFloat(prod.acceptedQuantity) * parseFloat(prod.rate))).toFixed(2)

						totalGeneralMargin = totalGeneralMargin + data.products[i].marginGeneral

					}

					data.sellerTotalAmount = totalSellerAmount

					// data.marginOnBasisOfWeight = (rqmnt.acceptedQuantity *  rqmnt.rate) - (rqmnt.acceptedQuantity * rqmnt.sellerRate)
					// data.marginPercentOnBasisOfWeight = (data.marginOnBasisOfWeight * 100) / (rqmnt.acceptedQuantity *  rqmnt.rate)

					// data.marginGeneral = (rqmnt.acceptedQuantity *  rqmnt.rate) - (data.sellerConsideredQuantity * data.sellerRate)
					// data.marginPercentGeneral = data.marginGeneral * 100 / (rqmnt.acceptedQuantity *  rqmnt.rate)

					data.totalMargin = totalGeneralMargin + rqmnt.logisticMargin
					data.totalMarginPercentage = data.totalMargin * 100 / (rqmnt.amount + parseFloat(rqmnt.logisticCharges))

					let moneyEarned = 0
					moneyEarned = rqmnt.amount

					let otherGivenlogisticCharges = 0// like unloading and loading charges

					if (rqmnt.childTransactions) {
						for (var i = 0; i < rqmnt.childTransactions.length; i++) {
							moneyEarned = moneyEarned + parseFloat(childTransactions[i].amount)

							if (childTransactions[i].logisticCharges) {
								otherGivenlogisticCharges = otherGivenlogisticCharges + parseFloat(childTransactions[i].logisticCharges)
							}
						}
					}

					moneyEarned = moneyEarned + rqmnt.logisticMargin

					let moneyGiven = data.sellerTotalAmount

					data.totalMarginIncludingSubTransactions = moneyEarned - moneyGiven - otherGivenlogisticCharges
					data.totalMarginPercentageIncludingSubTransactions = data.totalMarginIncludingSubTransactions * 100 / moneyEarned

					data.sellerPaymentModifiedBy = context.identity.id
					data.sellerPaymentModifiedOn = new Date()

					return FieldTransactions.update({ id: data.id }, data).then(function (requirement) {
						if (requirement) {
							pushService.sendPushToFieldTransactionsAdmin([requirement[0].frfo, requirement[0].frtsm, requirement[0].transactionleader], 'Seller amount modified', 'Seller amount modified for  transaction  number ' + requirement[0].code)
							return {
								success: true,
								code: 200,
								message: "Transaction updated successfully",
								data: requirement[0],
							}
						} else {
							return {
								success: false,
								error: {
									code: 400,
									message: "Unknown error occurred"
								},
								message: "Unknown error occurred"
							};
						}
					}).fail(function (error) {
						return {
							success: false,
							error: {
								code: 400,
								message: error
							},
						};
					})
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "Invalid requirement id"
						},
						message: "Invalid requirement id"
					};
				}
			})
		},

		verifyBuyerPayment: function (data, context) {

			if (data.id == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send transaction id"
					},
					message: "Please send transaction id"
				};
			}

			if (data.amount == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "What was amount"
					},
					message: "What was amount"
				};
			}

			if (data.paymentDate == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "What was payment date"
					},
					message: "What was payment date"
				};
			}

			if (data.index == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "What is payment number"
					},
					message: "What is payment number"
				};
			}

			return FieldTransactions.findOne({ id: data.id }).then(function (rqmnt) {
				if (rqmnt) {

					let payments = rqmnt.buyerpayments
					if (payments == undefined) {
						return {
							success: false,
							error: {
								code: 400,
								message: "Payment does not exist."
							},
							message: "Payment does not exist."
						};
					}
					if (payments.length > data.index) {
						let paymnt = payments[data.index]
						if (paymnt.amount != data.amount) {
							return {
								success: false,
								error: {
									code: 400,
									message: "Invalid amount at given index."
								},
								message: "Invalid amount at given index."
							};
						}
						let paymentdate = new Date(data.paymentDate)
						let feededPaymentDate = new Date(paymnt.paymentDate)
						if (paymentdate.getTime() != feededPaymentDate.getTime()) {
							return {
								success: false,
								error: {
									code: 400,
									message: "Invalid payment date at given index."
								},
								message: "Invalid payment date at given index."
							};
						}
						if (paymnt.status == 'Verified') {
							return {
								success: false,
								error: {
									code: 400,
									message: "Payment already verified"
								},
								message: "Payment already verified"
							};
						}

						payments[data.index].status = 'Verified'
						payments[data.index].verifiedBy = context.identity.id
						payments[data.index].verifiedOn = new Date()

						let updates = {}
						updates.buyerpayments = payments

						return FieldTransactions.update({ id: data.id }, updates).then(function (requirement) {
							if (requirement) {
								return {
									success: true,
									code: 200,
									message: "Transaction updated successfully",
									data: requirement[0],
								}
							} else {
								return {
									success: false,
									error: {
										code: 400,
										message: "Unknown error occurred"
									},
									message: "Unknown error occurred"
								};
							}
						}).fail(function (error) {
							return {
								success: false,
								error: {
									code: 400,
									message: error
								},
								message: error
							};
						})
					} else {
						return {
							success: false,
							error: {
								code: 400,
								message: "Invalid index number."
							},
							message: "Invalid index number."
						};
					}
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "Invalid transaction id"
						},
						message: "Invalid transaction id"
					};
				}
			})
		},

		deleteTransaction: function (data, context) {

			if (data.id == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please send transaction id"
					},
					message: "Please send transaction id"
				};
			}

			return FieldTransactions.findOne({ id: data.id }).then(function (rqmnt) {
				if (rqmnt) {

					let updates = {}
					updates.isDeleted = true
					updates.deletedBy = context.identity.id
					updates.deletedOn = new Date()

					return FieldTransactions.update({ id: data.id }, updates).then(function (requirement) {
						if (requirement) {
							return {
								success: true,
								code: 200,
								message: "Transaction is deleted",
								data: requirement[0],
							}
						} else {
							return {
								success: false,
								error: {
									code: 400,
									message: "Unknown error occurred"
								},
								message: "Unknown error occurred"
							};
						}
					}).fail(function (error) {
						return {
							success: false,
							error: {
								code: 400,
								message: error
							},
							message: error
						};
					})
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "Invalid transaction id"
						},
						message: "Invalid transaction id"
					};
				}
			})
		},
	}
