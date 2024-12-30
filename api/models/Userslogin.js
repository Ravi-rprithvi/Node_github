module.exports = {
	autoCreatedAt: true,
    autoUpdatedAt: true,
	attributes: {
		device_type: {
			type: 'string',
			enum: ["ANDROID", "IOS", "WEB"],
		},
		
		device_token: {
			type: 'string',
			maxLength: 200,
		},

		fcm_token: {
			type: 'string',
			maxLength: 200,
		},

		user: {
			model: 'users'
		},

		access_token: {
			type: 'string',
			maxLength: 200
		},

		loggedIn: {
            type: 'boolean',
            defaultsTo:true,
            required: true            
        },

        applicationtype: {
            type: 'string',
            enum:["farmx", "fieldtransaction"],
            defaultsTo: 'farmx'            
        },
	}	
}