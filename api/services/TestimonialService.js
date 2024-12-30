/**
  * #DESC:  In this class/files crops related functions
  * #Request param: Crops add form data values
  * #Return : Boolen and sucess message
  * #Author: Sumit.kumar
  */

var Promise = require('bluebird'),
    promisify = Promise.promisify;
var constantObj = sails.config.constants;
var commonServiceObj = require('./commonService');


module.exports = {

    save: function (data, context) {
    	if (data.channel == undefined || data.channel == null) {
    		return {
                success: false,
                error: {
                    code: 400,
                    message: "Please provide channel of post"
                },
            };
    	}

    	if (data.channel != 'Farmx' && (data.postId == undefined || data.postId == null)) {
    		return {
                success: false,
                error: {
                    code: 400,
                    message: "Please provide postId of post"
                },
            };
    	}

    	if (data.channel != 'Farmx' && (data.publicLink == undefined || data.publicLink == null)) {
    		return {
                success: false,
                error: {
                    code: 400,
                    message: "Please provide publicLink of post"
                },
            };
    	}

    	if ((data.text == undefined || data.text == null) && (data.image == undefined || data.image == null) && (data.video == undefined || data.video == null)) {
    		return {
                success: false,
                error: {
                    code: 400,
                    message: "Please provide either post text or post image or post video."
                },
            };
    	}

    	if (data.postedOn == undefined || data.postedOn == null) {
    		return {
                success: false,
                error: {
                    code: 400,
                    message: "Please provide date when it was posted"
                },
            };
    	}

    	let postedDate = new Date(data.postedOn)
    	let now = new Date()

    	if (postedDate == undefined || postedDate == null || postedDate > now) {
    		return {
                success: false,
                error: {
                    code: 400,
                    message: "Please provide valid date of post"
                },
            };
    	}

    	data.addedBy = context.identity.id
		data.addedOn = new Date()

		let qry = {}
		qry.channel = data.channel
		qry.postId = data.postId

		return Testimonial.findOne(qry).then(function(testimonial) {
			if (testimonial && (testimonial.postId != undefined || testimonial.postId != null)) {
                return {
	                success: false,
	                error: {
	                    code: 400,
	                    message: "This was already added on " + commonService.longDateFormat((new Date(testimonial.addedOn)))
	                },
	            };
			} else {
				return Testimonial.create(data).then(function (fc) {                    
					return {
	                    success: true,
	                    data: fc.id,
                        message: 'Testimonial added successfully'
	                }
				}).fail(function(error) {
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
    },

    delete: function (data, context) {
    	let query = {id:data.id}

    	return Testimonial.destroy(query).then(function(result) {
            if( !_.isEmpty(result) ){
                return {
                    success: true,
                    message: "Price deleted"
                }
            } else {
                return {
                    success: false,
                    message: "some error occured"
                }
            }
        }).fail(function(error){
            return {
                success: false,
                error: error
            }
        })
    },

    list: function (data, context, req, res) {
        let page = req.param('page');
        let count = parseInt(req.param('count'));
        let skipNo = (page - 1) * count;

    	let query = {}

        let channel = req.param('channel')
        if (channel) {
        	query.channel = channel
        }

        let user = req.param('user')
        if (user) {
        	query.user = user
        }
    	
    	let category = req.param('category')
        if (category) {
        	query.category = category
        }

        let bidId = req.param('bidId')
        if (bidId) {
        	query.bidId = bidId
        }

		let addedBy = req.param('addedBy')
        if (addedBy) {
        	query.addedBy = addedBy
        }

        let selectedFields = req.param('fields')
        if (selectedFields) {
        	selectedFields = JSON.parse(selectedFields)
        } else {
         	selectedFields = ['channel', 'publicLink', 'postId', 'user', 'category', 'bidId', 'text', 'image', 'video', 'postedOn', 'addedBy', 'addedOn', 'socialMediaUserName', 'socialMediaUserImage',]
        }

        if (page) {
	    	Testimonial.find(query, { fields: selectedFields }).populate('addedBy', {
	                select: ['name', 'email']
	            })
	            .populate('category', {
	                select: ['name']
	            })
	            .populate('bidId', {
	                select: ['code']
	            }).populate('user', {
                    select: ['fullName', 'image', 'userType']
                }).skip(skipNo).limit(count).exec(function(err, result) {
	            if (err) {
	                return res.jsonx({
	                    success: false,
	                    error: err
	                });
	            }
				Testimonial.count(query).exec((cer, count) => {
	                if (cer) {
	                    return res.jsonx({
	                        success: false,
	                        error: cer
	                    });
	                }
	                return res.jsonx({
	                    success: true,
	                    data: {
	                        testimonials: result,
	                        total: count
	                    }
	                });
	            })            
	        })
    	} else {
    		Testimonial.find(query, { fields: selectedFields }).populate('addedBy', {
	                select: ['name', 'email']
	            })
	            .populate('category', {
	                select: ['name']
	            })
	            .populate('bidId', {
	                select: ['code']
	            }).populate('user', {
                    select: ['fullName', 'image', 'userType']
                }).exec(function(err, result) {
	            if (err) {
	                return res.jsonx({
	                    success: false,
	                    error: err
	                });
	            }

	            return res.jsonx({
	                success: true,
	                data: {
	                    testimonials: result,
	                    total: result.length
	                }
	            });
	        })
    	}
    },

    get: function (data, context) {
    	return Testimonial.findOne({id:data.id}).populate('category', {select: ['name']})
    		.populate('addedBy', {
    			select: ['fullName', 'email']
    		})
    		.populate('bidId', {
                select: ['code']
            }).then(function(updatedfc) {
            if (updatedfc) {
                return {
                    success: true,
                    data: updatedfc
                }
            } else {
                return {
                    success: false,
                    error: {
                      code: 400,
                      message: "No data found"
                    }
                };
            }
        }).fail(function(error) {
            return {
                success: false,
                error: {
                  code: 400,
                  message: error
                }
            };
        })    	
    }
}