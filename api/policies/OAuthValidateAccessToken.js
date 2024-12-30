module.exports = function (req, res, next) {
    OAuth.authenticator.authenticate('bearer', { session: false }, function(err,identity,authorization) {
        if (!identity ) {
        	
        	var response = {
                          	success: false,
                          	error: {
                              code: 401,
                              message: 'authorization'
                              
                          	},
                      	}
        	return res.send(response);
        }

        req.identity = identity;
        req.authorization = authorization;

        next();
    })(req,res);
};