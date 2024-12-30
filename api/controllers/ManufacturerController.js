/**
 * ManufacturerController
 *
 * @description :: Server-side logic for managing manufacturers
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	delete: function (req, res) {
		API(ManufacturerService.deleteManufacturer, req, res);
	},
	allManufacturer: function (req, res, next) {

		var query = {};
		query.type = req.param('type');

		Manufacturer.find(query).sort("name ASC").exec(function (err, manufacturers) {

			return res.jsonx({
				success: true,
				data: manufacturers
			});

		});
	},

	getAllManufacturer: function (req, res, next) {

		var page = req.param('page');
		var count = req.param('count');
		var skipNo = (page - 1) * count;
		var search = req.param('search');
		var query = {};

		var sortBy = req.param('sortBy');

		if (sortBy) {
			sortBy = sortBy.toString();
		} else {
			sortBy = 'createdAt desc';
		}

		// query.isDeleted = 'false';

		if (search) {
			query.$or = [{
				name: {
					'like': '%' + search + '%'
				}
			}, {
				email: {
					'like': '%' + search + '%'
				}
			}, {
				description: {
					'like': '%' + search + '%'
				}
			}, {
				mobile: parseInt(search)
			}

			]
		}

		Manufacturer.count(query).exec(function (err, total) {
			if (err) {
				return res.status(400).jsonx({
					success: false,
					error: err
				});
			} else {
				Manufacturer.find(query).sort(sortBy).skip(skipNo).limit(count).exec(function (err, manufacturers) {
					if (err) {
						return res.status(400).jsonx({
							success: false,
							error: err
						});
					} else {
						return res.jsonx({
							success: true,
							data: {
								manufacturers: manufacturers,
								total: total
							},
						});
					}
				})
			}
		})
	}


};
