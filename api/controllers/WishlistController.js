/**
 * WishlistController
 *
 * @description :: Server-side logic for managing wishlists
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

    add: function(req, res){
        return API(WishlistService.save, req, res)
    },

    get: function(req, res){
        return API(WishlistService.list, req, res)
    },

    remove: function(req, res){
        return API(WishlistService.delete, req, res)
    },

    wishlistsWithUserId:function(req,res) {
        return API(WishlistService.getUserWishlist, req, res)
    }
	
};

