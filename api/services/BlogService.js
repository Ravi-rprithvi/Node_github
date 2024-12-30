var Promise = require('bluebird'),
    promisify = Promise.promisify;
var constantObj = sails.config.constants;


	slugify = function(string) {
	  return string
	    .toString()
	    .trim()
	    .toLowerCase()
	    .replace(/\s+/g, "-")
	    .replace(/[^\w\-]+/g, "")
	    .replace(/\-\-+/g, "-")
	    .replace(/^-+/, "")
	    .replace(/-+$/, "");
	}


module.exports = {
    
    saveBlog: function(data,context){

    	if((!data.title) || typeof data.title == undefined){ 
            return {"success": false, "error": {"code": 404,"message": constantObj.blogs.TITLE_REQUIRED, key: 'TITLE_REQUIRED'} };
        }

        if((!data.description) || typeof data.description == undefined){ 
            return {"success": false, "error": {"code": 404,"message": constantObj.blogs.DESCRIPTION_REQUIRED, key: 'DESCRIPTION_REQUIRED' } };
        }
      	
		data.slug = slugify(data.title);
		data.createdBy = context.identity.id;
		
		let query = {}
	
      	query.title = data.title;
		query.isDeleted = false;

      	return Blogs.findOne(query).then(function(blog) {
            
            if(blog) {
            	return {
                  	success: false,
                  	error: {
	                    code: 400,
	                    message: constantObj.blogs.BLOG_ALREADY_EXIST,
	                    key: 'BLOG_ALREADY_EXIST',
                    },
                };

            } else {
		        return Blogs.create(data).then(function(blog) {
	                return {
	                    success: true,
	                    code:200,
	                    data: {
	                        blog: blog,
	                        message: constantObj.blogs.SAVED_BLOGS,
	                        key: 'SAVED_BLOGS',
	                    },
	                };
		        })
		        .fail(function(err){
	        		return {
                  		success: false,
                  		error: {
                    		code: 400,
                    		message: err
                        },
              		};   
		    	});
           	}
     	}).fail(function(err){ 
		        return {
                  	success: false,
                  	error: {
                    	code: 400,
                    	message: err
                    },
                };   
		});
    },
    updateBlog: function(data,context){

		data.slug = slugify(data.title);
		data.createdBy = context.identity.id;
      	let _id = data.id;
	        return Blogs.update({id:_id}, data).then(function(blog) {

	                return {
	                    success: true,
	                    code:200,
	                    data: {
	                        blog: blog,
	                        message: constantObj.blogs.UPDATED_BLOGS,
	                        key: 'UPDATED_BLOGS',
	                    },
	                };
	        })
	        .fail(function(err){
	        		return {
	              success: false,
	              error: {
	                code: 400,
	                message: err
	                
	              },
	          };   
	    	});
    },

};