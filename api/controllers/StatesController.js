/**
 * LandController
 *
 * @description :: Server-side logic for managing lands
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	
    getAllStates: function(req, res) {

		var sortBy = req.param('sortBy');
			
        if (sortBy) {
            sortBy = sortBy.toString();
        } else {
            sortBy = 'stateName asc';
        }	

       	States.find().sort(sortBy).exec(function(err, states) {
            if (err) {
                return res.status(400).jsonx({
                   success: false,
                   error: err
                });
            } else {
                return res.jsonx({
                    success: true,
                    data: states
                });
            }
		})
	}
};