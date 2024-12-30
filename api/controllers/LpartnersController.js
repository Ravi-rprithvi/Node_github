	var constantObj = sails.config.constants;
// var ObjectId = require('mongodb').ObjectID;
/**
 * LpartnersController
 *
 * @description :: Server-side logic for managing crops
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

    save: function(req, res) {
        API(LpartnerService.saveLpartner, req, res);
    },

    listing: function(req, res) {
        API(LpartnerService.list, req, res);
    },

    update: function(req, res) {
        API(LpartnerService.update, req, res);
    },

    allLogisticPartnerList: function(req, res) {
        API(LpartnerService.allLogisticPartnerList, req, res);
    },    

    allLpartners: function(req, res, next) {
    	let query = {};
        query.isDeleted = false;

    	 Lpartners.find(query).then(function (lpartners) {
			return res.jsonx(lpartners);
    	 });
    },

    getAllLpartners: function(req, res, next) {

		var sortBy    	= req.param('sortBy');
		var page        = req.param('page');
		var count       = req.param('count');
		var search      = req.param('search');
		var skipNo      = (page - 1) * count;
		var query       = {};

		sortBy = sortBy.toString();
        if (sortBy) {
            sortBy = sortBy.toString();
        } else {
            sortBy = 'createdAt desc';
        }	

		query.isDeleted = false;

		if (search) {
		   query.$or = [
		       {
		            contactPerson: {
		                'like': '%' + search + '%'
		            }
		        },
		        {
		            companyName: {
		                'like': '%' + search + '%'
		            }
		        },
		        {
		            district: {
		                'like': '%' + search + '%'
		            }
		        },
		        {
		            state: {
		                'like': '%' + search + '%'
		            }
		        },
		        {
		            speciality: {
		                'like': '%' + search + '%'
		            }
		        },
		        {
		            address: {
		                'like': '%' + search + '%'
		            }
		        },
		        {
		            city: {
		                'like': '%' + search + '%'
		            }
		        },
		        {
		            email: {
		                'like': '%' + search + '%'
		            }
		        },
		        {
		            website: {
		                'like': '%' + search + '%'
		            }
		        },
		        {
                    pincode: parseInt(search)
                },
		        {
                    mobile: parseInt(search)
                },
                {
                    mobile1: parseInt(search)
                }
		   ]
		}

		Lpartners.count(query).exec(function(err, total) {
		   	
		   if (err) {
		       return res.status(400).jsonx({
		           success: false,
		           error: err
		       });
		   } else {
		       Lpartners.find(query).sort(sortBy).skip(skipNo).limit(count).populate('vehicles').populate('drivers').exec(function(err, partners) {
		       	
		            if (err) {
		                return res.status(400).jsonx({
		                   success: false,
		                   error: err
		                });
		            } else {
		                return res.jsonx({
		                    success: true,
		                    data: {
		                        partners: partners,
		                        total: total
		                    },
		                });
		            }
		       })
		   }
		})
	}
    
};