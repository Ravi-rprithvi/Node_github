/**
 * BlogsController
 *
 * @description :: Server-side logic for managing Blog
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */




module.exports = {
	
	save: function(req, res) {
		API(CpartnerService.saveCpartner,req,res);
	
	},

    update: function(req, res) {
        API(CpartnerService.editCpartner,req,res);
    },

	getAllCPartners: function(req, res, next) {
		
		var page        = req.param('page');
		var count       = req.param('count');
		var skipNo      = (page - 1) * count;
		var search      = req.param('search');
		var query       = {};

		var sortBy    	= req.param('sortBy');
		
		if (sortBy) {
            sortBy = sortBy.toString();
        } else {
            sortBy = 'createdAt desc';
        }
		
		query.isDeleted = 'false';

		if (search) {
            query.$or = [{
                name: {
                        'like': '%' + search + '%'
                    }
                },{
                    email: {
                        'like': '%' + search + '%'
                    }
                }
            ]
        }
        
		Cpartners.count(query).exec(function(err, total) {
		    if (err) {
		       return res.status(400).jsonx({
		           success: false,
		           error: err
		       });
		    } else {
		       Cpartners.find(query).sort(sortBy).skip(skipNo).limit(count).exec(function(err, cpartners) {
		            if (err) {
		                return res.status(400).jsonx({
		                   success: false,
		                   error: err
		                });
		            } else {
		                return res.jsonx({
		                    success: true,
		                    data: {
		                        cpartners: cpartners,
		                        total: total
		                    },
		                });
		            }
		       })
		    }
		})
	}
};