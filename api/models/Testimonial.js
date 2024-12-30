/**
 * Testimonial.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */


module.exports = {
    autoCreatedAt: true,
    autoUpdatedAt: true,
    attributes: {
  		
        channel: {
        	type: 'string',
            enum: ['Facebook', 'Twitter', 'Instagram', 'Farmx'],
            required: true,
            defaultsTo:'Farmx'
        }, //Farmx, FB , instaa or twitter

        publicLink: {
        	type: 'string',
        }, //Public link of feed, in case farmx navigate to farmx.co.in

        postId: {
        	type: 'string',
        }, //POST ID: ID of social media post

        user: {
	      model:'users'
	    }, //user: id of user

	    category: {
            model: 'category'        
        }, //category: category of dealing product

        bidId: {
        	model: 'bids'
        }, //bid id: id of bid

        text: {
        	type: 'string',
        }, //post text

		image: {
			type: 'string',
		}, //post image link

		video: {
			type: 'string',
		}, //post video link

		postedOn: {
			type: 'date'
		}, //testimonial posted on: date

		addedBy: {
	      	model:'users'
	    }, //user

		addedOn: {
			type: 'date'
		},//testimonial added date: datetime

		socialMediaUserName: {
			type: 'string',
		}, //social media username: name of user on social media

		socialMediaUserImage: {
			type: 'string',
		}, //social media user image: image URL of user of social media
    }
}