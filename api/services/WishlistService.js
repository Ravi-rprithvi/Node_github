var Promise = require('bluebird');
    promisify = Promise.promisify;
var constantObj = sails.config.constants;

module.exports = {

    save: function(data, context, req, res){
        let qry = {};
            qry.product_id = data.product_id;
            qry.user_id = data.user_id;
        Wishlist.findOne(qry).then(function(resData){

            if(resData){
                return res.jsonx({
                success: true,
                data: {
                    message: "Wishlist already saved",
                    key: 'SUCCESSFULLY_SAVED_WISHLIST',
                },
            })
            }

        Wishlist.create(data).then(function(data){
            return res.jsonx({
                success: true,
                data: {
                    message: "Wishlist saved",
                    key: 'SUCCESSFULLY_SAVED_WISHLIST',
                },
            })
        }).fail(function(error){
            return res.jsox({
                success: false,
                error: error
            });
        });

    }).fail(function(error){
            return res.jsox({
                success: false,
                error: error
            });
        });

    },  

    list: function(data, context,req,res){
        
        var id   = context.identity.id;
        var query = { user_id: id };
        var product = {}

        Wishlist.find(query).populate('user_id').sort('createdAt desc').then(function(data){
            async.each(data, function(product, callback) {
                var Model = sails.models[product.product_type];

                Model.findOne({id:product.product_id, isDeleted:false/*, select: ['name', 'images', 'code', 'isExpired']*/}).then(function(productdata){
                    product.productdata = productdata;
                    callback();
                }).fail(function(error){
                    callback();
                })
                        
            },function(error){
                if(error){ 
                    return res.jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: error
                        }
                    });
                } else {
                    return res.jsonx({
                        success: true,
                        data: {
                            data: data,
                            key: 'USER_WISHLIST' 
                        }
                    });
                }
            });
         })
    },

    getUserWishlist: function(data, context, req, res){
        
        var id   = context.identity.id;
        if (data.userId) {
            id = data.userId
        }

        var query = { user_id: id };
        if (data.type) {
            query.product_type = data.type
        }

        Wishlist.find(query).exec(function(err,list) {
            if (err) {
                return res.jsonx({
                    success: false,
                    error: {
                      code: 404,
                      message: err
                    }
                });
            } else {
                return res.jsonx({
                    success: true,
                    data: list
                });
            }
        })
    },

    delete: function(data, context, req, res){
        let query = {user_id:data.user_id,product_id:data.product_id};

        Wishlist.destroy(query).then(function(result){
            if( !_.isEmpty(result) ){
                return res.jsonx({
                    success: true,
                    message: "Wishlist deleted"
                })
            } else {
                return res.jsonx({
                    success: false,
                    message: "some error occured"
                })
            }
        }).fail(function(error){
            return res.jsonx({
                success: false,
                error: error
            })
        })
    }
}