/**
  * #DESC:  In this class/files crops related functions
  * #Request param: Crops add form data values
  * #Return : Boolen and sucess message
  * #Author: Rohitk.kumar
  */

var Promise = require('bluebird'),
	promisify = Promise.promisify;
var constantObj = sails.config.constants;
var commonServiceObj = require('./commonService');


module.exports = {
	save: function (data, context) {
		if (data.type == 1) {
			data.userGivenInfo = undefined

			if (data.market == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please provide market information"
					},
				};
			}
		} else {
			data.market = undefined

			if (data.userGivenInfo == undefined) {
				return {
					success: false,
					error: {
						code: 400,
						message: "Please provide user information"
					},
				};
			}
		}

		if (data.productId == undefined) {
			return {
				success: false,
				error: {
					code: 400,
					message: "Please provide product id"
				},
			};
		}

		if (data.productType == undefined) {
			return {
				success: false,
				error: {
					code: 400,
					message: "Please provide productType. Either CROPS,  INPUTS and LANDS"
				},
			};
		}

		if (data.productType == "CROPS") {
			data.crops = data.productId
		}
		else if (data.productType == "LANDS") {
			data.lands = data.productId
		}
		else {
			data.input = data.productId
		}

		let type = data.type

		delete data.type

		if (type != 1) {
			let qry = {}
			qry.$and = [{ $or: [{ email: data.userGivenInfo }, { mobile: data.userGivenInfo }] }, { $or: [{ 'roles': 'U' }, { 'roles': 'CP' }] }];
			return Users.findOne(qry).then(function (usr) {
				let findQry = {}
				findQry.productId = data.productId

				if (usr) {
					data.user = usr.id
					findQry.$or = [{ user: usr.id }, { userGivenInfo: data.userGivenInfo }]
				} else {
					findQry.userGivenInfo = data.userGivenInfo
				}

				return FacilitationCharges.findOne(findQry).then(function (existingfc) {
					if (existingfc) {
						return {
							success: false,
							error: {
								code: 404,
								message: "Already exist user"
							}
						};
					} else {
						return FacilitationCharges.create(data).then(function (fc) {
							return {
								success: true,
								data: fc
							}
						}).fail(function (error) {
							return {
								success: false,
								error: {
									code: 404,
									message: error
								}
							};
						})
					}
				})
			})
		} else {
			let findQry = {}
			findQry.productId = data.productId
			findQry.market = data.market

			return FacilitationCharges.findOne(findQry).then(function (existingfc) {
				if (existingfc) {
					return {
						success: false,
						error: {
							code: 404,
							message: "Already exist market"
						}
					};
				} else {
					return FacilitationCharges.create(data).then(function (fc) {
						return {
							success: true,
							data: fc
						}
					}).fail(function (error) {
						return {
							success: false,
							error: {
								code: 404,
								message: error
							}
						};
					})
				}
			})
		}

	},

	get: function (data, context) {
		let qry = { id: data.id }

		return FacilitationCharges.findOne(qry).populate('user', { select: ['fullName', 'code'] }).populate('market', { select: ['name', 'code'] }).populate('crops', { select: ['name', 'code'] }).populate('input', { select: ['name', 'code'] }).then(function (fcs) {
			return {
				success: true,
				data: fcs
			}
		}).fail(function (error) {
			return {
				success: false,
				error: {
					code: 400,
					message: error
				}
			};
		})
	},

	listMarket: function (data, context) {
		let qry = {}
		qry.productId = data.productId
		qry.$or = [{ userGivenInfo: undefined }, { userGivenInfo: null }]
		qry.$and = [{ market: { $ne: undefined } }, { market: { $ne: null } }]

		return FacilitationCharges.find(qry).populate('market', { select: ['name', 'code'] }).populate('crops', { select: ['name', 'code'] }).populate('input', { select: ['name', 'code'] }).then(function (fcs) {
			return {
				success: true,
				data: fcs
			}
		}).fail(function (error) {
			return {
				success: false,
				error: {
					code: 400,
					message: error
				}
			};
		})

	},

	listUser: function (data, context) {
		let qry = {}
		qry.productId = data.productId
		qry.$or = [{ market: undefined }, { market: null }]
		qry.$and = [{ userGivenInfo: { $ne: undefined } }, { userGivenInfo: { $ne: null } }]

		return FacilitationCharges.find(qry).populate('user', { select: ['fullName', 'code'] }).populate('crops', { select: ['name', 'code'] }).populate('input', { select: ['name', 'code'] }).then(function (fcs) {
			return {
				success: true,
				data: fcs
			}
		}).fail(function (error) {
			return {
				success: false,
				error: {
					code: 400,
					message: error
				}
			};
		})
	},

	update: function (data, context) {
		let dataToUpdate = {}
		if (data.facilitationPercentage) {
			dataToUpdate.facilitationPercentage = data.facilitationPercentage
		}
		if (data.validTill) {
			dataToUpdate.validTill = data.validTill
		}

		return FacilitationCharges.update({ id: data.id }, dataToUpdate).then(function (updatedfc) {
			if (updatedfc.length > 0) {
				return {
					success: true,
					data: updatedfc[0]
				}
			} else {
				return {
					success: false,
					error: {
						code: 400,
						message: "Unknown error occurred"
					}
				};
			}
		}).fail(function (error) {
			return {
				success: false,
				error: {
					code: 400,
					message: error
				}
			};
		})
	},

	delete: function (data, context) {
		let query = { id: data.id }
		return FacilitationCharges.destroy(query).then(function (result) {
			if (!_.isEmpty(result)) {
				return {
					success: true,
					message: "Facilitation charges deleted"
				}
			} else {
				return {
					success: false,
					message: "some error occured"
				}
			}
		}).fail(function (error) {
			return {
				success: false,
				error: error
			}
		})
	}
}