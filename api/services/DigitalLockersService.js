var Promise = require('bluebird'),
	promisify = Promise.promisify;
var constantObj = sails.config.constants;
var commonServiceObj = require('./commonService');

module.exports = {

	createLocker: function (data, context) {
		data.owner = context.identity.id
		return createLocker(data)
	},

	listLocker: function (data, context, req, res) {
		let page = req.param('page');
		let count = parseInt(req.param('count'));
		let skipNo = (page - 1) * count;

		let query = {}

		let owner = req.param('ownerId')
		if (owner) {
			query.owner = owner
		}

		if (search) {
			query.$or = [{
				code: {
					'like': '%' + search + '%'
				}
			}]
		}

		if (page) {
			DigitalLockers.find(query).populate('owner', {
				select: ['fullName', 'image', 'userType', 'userUniqueId']
			}).skip(skipNo).limit(count).exec(function (err, result) {
				if (err) {
					return res.jsonx({
						success: false,
						error: err
					});
				}
				DigitalLockers.count(query).exec((cer, count) => {
					if (cer) {
						return res.jsonx({
							success: false,
							error: cer
						});
					}
					return res.jsonx({
						success: true,
						data: {
							lockers: result,
							total: count
						}
					});
				})
			})
		} else {
			DigitalLockers.find(query).populate('owner', {
				select: ['fullName', 'image', 'userType', 'userUniqueId']
			}).exec(function (err, result) {
				if (err) {
					return res.jsonx({
						success: false,
						error: err
					});
				}

				return res.jsonx({
					success: true,
					data: {
						lockers: result,
						total: result.length
					}
				});
			})
		}
	},

	getLocker: function (data, context) {
		return DigitalLockers.findOne({ id: data.id }).populate('owner', { select: ['fullName', 'image', 'userType', 'userUniqueId'] }).then(function (doc) {
			if (doc) {
				return LockerDocuments.find({ locker: doc.id, isDeleted: false }).populate('pages', {
					where: { isDeleted: false },
					select: ['type', 'mimeType', 'number', 'path'],
					sort: 'number ASC'
				}).then(function (docs) {
					doc.documents = docs
					return {
						success: true,
						code: 200,
						data: doc
					};
				})
			} else {
				return {
					success: false,
					error: {
						code: 400,
						message: "No document found."
					},
				};
			}
		}).fail(function (err) {
			return {
				success: false,
				error: {
					code: 400,
					message: err
				},
			};
		})
	},

	addDocument: function (data, context) {
		let user = data.owner
		if (user == undefined) {
			user = context.identity.id
		}

		if (data.type == undefined) {
			return {
				success: false,
				error: {
					code: 400,
					message: "Which document is this?"
				},
			};
		}
		if (data.pages == undefined || data.pages.length == 0) {
			return {
				success: false,
				error: {
					code: 400,
					message: "Please add document first"
				},
			};
		}

		data.owner = user

		if (data.locker) {
			return DigitalLockers.findOne({ owner: user, id: data.locker }).then(function (locker) {
				if (locker) {
					return addDocumentToLocker(data)
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "No locker available with given locker id"
						},
					};
				}
			})
		} else {
			return DigitalLockers.find({ owner: user }).then(function (lockers) {
				if (lockers == undefined || lockers.length == 0) {
					let lockerinfo = {}
					lockerinfo.owner = user
					return createLocker(lockerinfo).then(function (locker) {

						if (locker.success == true) {
							data.locker = locker.data.locker.id
							return addDocumentToLocker(data)
						} else {
							return {
								success: false,
								error: {
									code: 400,
									message: "unknown error occurred"
								},
							};
						}
					})
				} else {
					data.locker = lockers[0].id
					return addDocumentToLocker(data)
				}
			})
		}
	},

	verifyDocument: (data, context, req, res) => {
		let qry = {}
		qry.id = data.id

		let updateQry = {}
		updateQry.isVerified = true
		if (context.identity.id) {
			updateQry.verifiedBy = context.identity.id
			updateQry.verifiedOn = new Date()
			LockerDocuments.update(qry, updateQry).then((pricedata) => {
				return res.jsonx({
					success: true,
					data: {
						message: "Document verified.",
						price: pricedata
					},
				})
			}).fail(function (error) {
				return res.jsonx({
					success: false,
					error: error
				});
			});
		} else {
			return res.jsonx({
				success: false,
				error: "Please login to verify."
			});
		}
	},

	allDocumentsDateWise: function (data, context, req, res) {
		let page = parseInt(req.param('page'));
		let count = parseInt(req.param('count'));
		let skipNo = (page - 1) * count;

		let query = {}
		query.isDeleted = false

		let owner = req.param('owner')
		if (owner) {
			query.owner = owner
		}

		let locker = req.param('locker')
		if (locker) {
			query.locker = locker
		}

		let type = req.param('type')
		if (type) {
			query.type = type
		}

		let search = req.param('search')
		if (search) {
			query.$or = [
				{
					code: {
						'like': '%' + search + '%'
					}
				},
				{
					type: {
						'like': '%' + search + '%'
					}
				}
			]
		}

		LockerDocuments.count(query).exec((cer, total) => {
			if (cer) {
				return res.jsonx({
					success: false,
					error: cer
				});
			}
			LockerDocuments.find(query).populate('owner', {
				select: ['fullName', 'image', 'userType', 'userUniqueId']
			}).populate('pages', {
				where: { isDeleted: false },
				select: ['type', 'mimeType', 'number', 'path', 'isThumbnailAvailable'],
				sort: 'number ASC'
			}).sort('createdAt DESC').skip(skipNo).limit(count).exec(function (err, result) {
				if (err) {
					return res.jsonx({
						success: false,
						error: err
					});
				}
				let finalObj = {}
				result.forEach((games) => {
					let dtstring = games.createdAt.toISOString()
					let date = dtstring.split('T')[0]
					if (finalObj[date]) {
						finalObj[date].push(games);
					} else {
						finalObj[date] = [games];
					}
				})

				return res.jsonx({
					success: true,
					data: {
						documents: finalObj,
						received: result.length,
						total: total
					}
				});
			})
			/*LockerDocuments.count(query).exec((cer, count) => {
				if (cer) {
					return res.jsonx({
						success: false,
						error: cer
					});
				}

				let finalObj = {}
					result.forEach((games) => {
					const date = games.createdAt.split('T')[0]
					if (finalObj[date]) {
							finalObj[date].push(games);
					} else {
					  finalObj[date] = [games];
					}
					})

				return res.jsonx({
					success: true,
					data: finalObj
				});
			}) */
		})
	},

	allDocumentsTypeWise: function (data, context, req, res) {
		let page = req.param('page');
		let count = parseInt(req.param('count'));
		let skipNo = (page - 1) * count;

		let query = {}
		query.isDeleted = false

		let owner = req.param('owner')
		if (owner) {
			query.owner = owner
		}

		let locker = req.param('locker')
		if (locker) {
			query.locker = locker
		}

		let type = req.param('type')
		if (type) {
			query.type = type
		}

		let search = req.param('search')
		if (search) {
			query.$or = [
				{
					code: {
						'like': '%' + search + '%'
					}
				},
				{
					type: {
						'like': '%' + search + '%'
					}
				}
			]
		}

		LockerDocuments.count(query).exec((cer, total) => {
			if (cer) {
				return res.jsonx({
					success: false,
					error: cer
				});
			}
			LockerDocuments.find(query).populate('owner', {
				select: ['fullName', 'image', 'userType', 'userUniqueId']
			}).populate('pages', {
				where: { isDeleted: false },
				select: ['type', 'mimeType', 'number', 'path', 'isThumbnailAvailable'],
				sort: 'number ASC'
			}).sort('type ASC').skip(skipNo).limit(count).exec(function (err, result) {
				if (err) {
					return res.jsonx({
						success: false,
						error: err
					});
				}

				var grouped = _.groupBy(result, 'type');

				return res.jsonx({
					success: true,
					data: {
						documents: grouped,
						received: result.length,
						total: total
					}
				});
			})

			/*LockerDocuments.count(query).exec((cer, count) => {
				if (cer) {
					return res.jsonx({
						success: false,
						error: cer
					});
				}
				return res.jsonx({
					success: true,
					data: {
						documents: result,
						total: count
					}
				});
			})*/
		})
	},

	getDocument: function (data, context) {
		return LockerDocuments.findOne({ id: data.id }).populate('owner', { select: ['fullName', 'image', 'userType', 'userUniqueId'] }).populate('pages', {
			where: { isDeleted: false },
			select: ['type', 'mimeType', 'number', 'path'],
			sort: 'number ASC'
		}).populate('locker').then(function (doc) {
			if (doc) {
				return {
					success: true,
					code: 200,
					data: doc
				};
			} else {
				return {
					success: false,
					error: {
						code: 400,
						message: "No document found."
					},
				};
			}
		}).fail(function (err) {
			return {
				success: false,
				error: {
					code: 400,
					message: err
				},
			};
		})
	},

	moveDocument: function (data, context) {
		if (data.moveTo == undefined) {
			return {
				success: false,
				error: {
					code: 400,
					message: "In which locker you want to move the documents."
				},
			};
		}
		return LockerDocuments.findOne({ id: data.id }).then(function (doc) {
			if (doc) {
				if (doc.locker == data.moveTo) {
					return {
						success: false,
						error: {
							code: 400,
							message: "Document is already in this locker."
						},
					};
				} else {
					return DigitalLockers.findOne({ id: data.moveTo }).then(function (locker) {
						if (locker) {
							if (locker.owner == doc.owner) {
								return LockerDocuments.update({ id: data.id }, { locker: data.moveTo }).then(function (updatedDoc) {
									return {
										success: false,
										error: {
											code: 400,
											message: "Document is moved to destination locker."
										},
									};
								}).fail(function (err) {
									return {
										success: false,
										error: {
											code: 400,
											message: err
										},
									};
								})
							} else {
								return {
									success: false,
									error: {
										code: 400,
										message: "Document does not belong to owner of the destination locker."
									},
								};
							}
						} else {
							return {
								success: false,
								error: {
									code: 400,
									message: "Invalid Locker"
								},
							};
						}
					})
				}
			} else {
				return {
					success: false,
					error: {
						code: 400,
						message: "Document not found"
					},
				};
			}
		}).fail(function (err) {
			return {
				success: false,
				error: {
					code: 400,
					message: err
				},
			};
		})
	},

	deleteDocument: function (data, context) {
		console.log("123")
		return LockerDocuments.findOne({ id: data.id }).then(function (doc) {
			console.log("doc == ", doc)

			if (doc) {
				if (doc.isDeleted == false) {
					console.log("doc1 == ", doc)

					if (doc.owner == context.identity.id) {
						let toUpdate = {}
						toUpdate.isDeleted = true
						toUpdate.deletedDate = new Date()
						console.log("doc2 == ", doc)

						return LockerDocuments.update({ id: data.id }, toUpdate).then(function (updatedDoc) {
							console.log("doc3 == ", doc)

							return LockerDocumentPages.update({ document: data.id }, toUpdate).then(function (allPages) {
								console.log("doc4 == ", doc)

								return {
									success: true,
									code: 200,
									message: "Document is deleted from locker."

								};
							});
						}).fail(function (err) {
							return {
								success: false,
								error: {
									code: 400,
									message: err
								},
							};
						})
					} else {
						return {
							success: false,
							error: {
								code: 400,
								message: "You are not the authorized person to delete this document. Only owner of document can delete this document."
							},
						};
					}
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "Already deleted."
						},
					};
				}
			} else {
				return {
					success: false,
					error: {
						code: 400,
						message: "Document not found"
					},
				};
			}
		}).fail(function (err) {
			return {
				success: false,
				error: {
					code: 400,
					message: err
				},
			};
		})
	},

	removePage: function (data, context) {
		return LockerDocumentPages.findOne({ id: data.id }).then(function (page) {
			if (page) {
				if (page.isDeleted == false) {
					if (page.owner == context.identity.id) {
						let toUpdate = {}
						toUpdate.isDeleted = true
						toUpdate.deletedDate = new Date()
						return LockerDocumentPages.update({ id: data.id }, toUpdate).then(function (allPages) {
							return LockerDocumentPages.count({ document: page.document, isDeleted: false }).then(function (pagesCount) {
								if (pagesCount > 0) {
									return {
										success: true,
										data: {
											message: "Page is deleted from document."
										},
									};
								} else {
									let docupdate = {}
									docupdate.isDeleted = true
									docupdate.deletedDate = new Date()
									return LockerDocuments.update({ id: page.document }, docupdate).then(function (updades) {
										return {
											success: true,
											data: {
												message: "Page is deleted from document."
											},
										};
									})
								}
							})
						}).fail(function (err) {
							return {
								success: false,
								error: {
									code: 400,
									message: err
								},
							};
						})
					} else {
						return {
							success: false,
							error: {
								code: 400,
								message: "You are not the authorized person to delete this page. Only owner of document can delete this page."
							},
						};
					}
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "Already deleted."
						},
					};
				}
			} else {
				return {
					success: false,
					error: {
						code: 400,
						message: "Page not found"
					},
				};
			}
		}).fail(function (err) {
			return {
				success: false,
				error: {
					code: 400,
					message: err
				},
			};
		})
	},

	deletePage: function (data, context) {
		return LockerDocumentPages.findOne({ id: data.id }).then(function (page) {
			if (page) {
				if (page.owner == context.identity.id) {
					let path = page.path

					var fs = require('fs');
					let filePath = 'assets/locker_documents/' + page.path
					if (fs.existsSync(filePath)) {
						fs.unlink(filePath, (err) => {
							if (err) {
								console.log('fileemoved error', err)
							}
							let thumbnailFilePath = 'assets/locker_documents/thumbnail/200/' + page.path
							if (fs.existsSync(thumbnailFilePath)) {
								fs.unlink(thumbnailFilePath, (err) => {
									if (err) {
										console.log('fileemoved error', err)
									}
								})
							}
						})
					}

					return LockerDocumentPages.destroy({ id: data.id }).then(function (destroyed) {
						return {
							success: true,
							data: {
								message: "Page is deleted."
							},
						};
					}).fail(function (err) {
						return {
							success: false,
							error: {
								code: 400,
								message: err
							},
						};
					})
				} else {
					return {
						success: false,
						error: {
							code: 400,
							message: "You are not the authorized person to delete this page. Only owner of document can delete this page."
						},
					};
				}
			} else {
				return {
					success: false,
					error: {
						code: 400,
						message: "Page not found"
					},
				};
			}
		}).fail(function (err) {
			return {
				success: false,
				error: {
					code: 400,
					message: err
				},
			};
		})
	}
};

getUniqueCodeForLocker = function () {
	let code = "DLK-" + commonServiceObj.getalphanumeric_unique();

	return DigitalLockers.count({ code: code }).then(function (codeExists) {
		if (codeExists > 0) {
			getUniqueCodeForLocker()
		} else {
			return code
		}
	})
},

	getUniqueCodeForDocForUser = function (userId) {
		let code = "DOC-" + commonServiceObj.getUniqueCode();

		return LockerDocuments.count({ code: code, owner: userId }).then(function (codeExists) {
			if (codeExists > 0) {
				getUniqueCodeForDocForUser(userId)
			} else {
				return code
			}
		})
	},

	createLocker = function (data) {
		return getUniqueCodeForLocker().then(function (code) {
			let digitalLockers = {}
			digitalLockers.code = code
			digitalLockers.owner = data.owner

			return DigitalLockers.create(digitalLockers).then(function (dl) {
				return {
					success: true,
					code: 200,
					data: {
						locker: dl,
						message: "Locker created successfully",
						key: 'SUCCESSFULLY_CREATED_LOCKER',
					}
				};
			}).fail(function (error) {
				return {
					success: false,
					error: {
						code: 400,
						message: error
					},
				};
			})
		})
	},

	addDocumentToLocker = function (data) {
		console.log("11 == ", data)
		return getUniqueCodeForDocForUser(data.owner).then(function (code) {
			data.code = code
			let pages = data.pages
			delete data.pages

			console.log("12 == ", data)

			return LockerDocuments.create(data).then(function (dl) {
				console.log("dl == ", dl)
				return LockerDocumentPages.update({ id: { $in: pages } }, { document: dl.id }).then(function (allPages) {
					console.log("allPages == ", allPages)

					dl.pages = pages
					return {
						success: true,
						code: 200,
						data: {
							document: dl,
							message: "Document added successfully",
							key: 'SUCCESSFULLY_CREATED_LOCKER',
						}
					};
				})
			}).fail(function (error) {
				console.log("error == ", error)
				return {
					success: false,
					error: {
						code: 400,
						message: error
					},
				};
			})
		})
	}