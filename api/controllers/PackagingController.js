/**
 * PackagingController
 *
 * @description :: Server-side logic for managing packaging
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

    add: function(req, res){
        return API(PackagingService.save, req, res)
    },

    getAll: function(req, res){
        return API(PackagingService.list, req, res)
    },

    update:function(req,res) {
        return API(PackagingService.update, req, res)
    },

    get: function(req, res){
        return API(PackagingService.get, req, res)
    },	

    getList: function(req, res){
        return API(PackagingService.getListAll, req, res)
    },  
    getPackagingCategoryById: function(req, res){
        return API(PackagingService.getPackagingCategoryById, req, res)
    },
    
     bidsPackaging: function(req, res){
        return API(PackagingService.bidsPackaging, req, res)
    },  
    
     getPackagingType: function(req, res){
        return API(PackagingService.getPackagingType, req, res)
    },  
    getPackagingTypeCropDetail: function(req, res){
        return API(PackagingService.getPackagingTypeCropDetail, req, res)
    },  

    
};

