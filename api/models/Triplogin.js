module.exports = {
	autoCreatedAt: true,
    autoUpdatedAt: true,
	attributes: {
		gcm_id: {
			type: 'string',
			// maxLength: 513,
		},
		device_type: {
			type: 'string',
			enum: ["ANDROID", "IOS"],
		},
		device_token: {
			type: 'string',
			maxLength: 200,
		},
		trip: {
			model: 'LogisticTrip'
		},
		access_token: {
			type: 'string',
			maxLength: 200
		}
	}	
}