/**
 * SettingController
 *
 * @description :: Server-side logic for managing settings
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var constantObj = sails.config.constants;
module.exports = {

	setting: function (req, res) {

		let type = req.param('type');

		Settings.find({ type: type }).exec(function (err, data) {

			if (err) {
				return res.jsonx({
					success: false
				})
			} else {
				return res.jsonx({
					success: true,
					data: data
				})
			}
		})
	},
	saveSetting: function (req, res) {
		let id = req.body.id;
		let data = req.body;

		if (req.body.id) {
			id = data.id;
		}

		Settings.findOne({ id: id }).then(function (already) {

			if (already && already != undefined) {

				Settings.update({ id: id }, data).then(function (setting) {
					return res.status(200).jsonx({
						success: true,
						code: 200,
						data: setting,
						message: constantObj.setting.UPDATED_SETITING,
						key: 'UPDATED_SETITING',

					});
				})
					.fail(function (err) {
						return res.status(400).jsonx({
							success: false,
							error: {
								code: 400,
								message: err
							},
						});
					});

			} else {

				Settings.create(data).then(function (setting) {
					return res.status(200).jsonx({
						success: true,
						code: 200,
						data: setting,
						message: constantObj.setting.SAVED_SETITING,
						key: 'SAVED_SETITING',
					});
				})
					.fail(function (err) {
						return res.status(400).jsonx({
							success: false,
							error: {
								code: 400,
								message: err
							},
						});
					});
			}

		});

	},

};

