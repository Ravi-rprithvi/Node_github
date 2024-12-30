var Promise = require('bluebird'),
    promisify = Promise.promisify;
module.exports = {
	
	getAllQuestions: function ( data, context ) {
    	return getAllQuestions( data );
    },
    myQuestions: function ( data, context ) {
    	return myQuestions( data );
    },
};


getAllQuestions = function (data, context ) {
	return Qa.find({}).populate("postedBy", {select: ['fullName','email']}).then(function( questions ) {
		return success( questions );
	}).fail(function(err){
        return error(err);
    });
}

myQuestions = function(data, context ) {
	let userID = data.userID;
	return Qa.find({'postedBy': userID}).then(function( questions ) {
		return success( questions );
	}).fail(function(err){
        return error(err);
    });
}


// ==============================================
error = function( err ) {
	return {
          	success: false,
          	error: {
            	code: 400,
            	message: err
            },
        };   
}

success = function ( data ) {
	return {
            success: true,
            code:200,
            data: data,
        };  	
}