/**
 * Development environment settings
 *
 * This file can include shared settings for a development team,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

module.exports = {

	/***************************************************************************
	 * Set the default database connection for models in the development       *
	 * environment (see config/connections.js and config/models.js )           *
	 ***************************************************************************/

	// models: {
	//   connection: 'someMongodbServer'
	// }

	/*PAYTM_FRONT_WEB_URL: "https://farmx.co.in",
	PAYTM_ADMIN_WEB_URL: "https://farmx.co.in:4067",
	PAYTM_API_URL: "https://farmx.co.in:4068"*/


	hookTimeout: 4000000,

	PAYTM_FRONT_WEB_URL: "http://192.168.0.65:4400",
	PAYTM_ADMIN_WEB_URL: "http://demoadmin.farmx.co.in:4300/",
	// PAYTM_API_URL: "http://192.168.0.65:1337" 
	PAYTM_API_URL: "http://192.168.0.137:1337"
};
