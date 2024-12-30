var Promise = require('bluebird');
    promisify = Promise.promisify;
var constantObj = sails.config.constants;

module.exports = {

    save: function(data, context, req, res){
        Vehicles.create(data).then(function(data){
            return res.jsonx({
                success: true,
                data: {
                    message: constantObj.vehicles.VEHICLE_INFO_SAVED
                },
            })
        }).fail(function(error){
            return res.jsonx({
                success: false,
                error: error
            });
        });
    },

    list: function(data, context,req,res){    
        var sortBy      = req.param('sortBy');
        var page        = req.param('page');
        var count       = req.param('count');
        var search      = req.param('search');
        var skipNo      = (page - 1) * count;
        var query       = {};

        sortBy = sortBy.toString();
        if (sortBy) {
            sortBy = sortBy.toString();
        } else {
            sortBy = 'createdAt desc';
        }   

        if (search) {
           query.$or = [
               {
                    number: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    type: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    description: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    loadCapacity: parseInt(search)
                }
           ]
        }

        Vehicles.count(query).exec(function(err, total) {
            
            if (err) {
               return res.status(400).jsonx({
                   success: false,
                   error: err
               });
            } else {
                Vehicles.find(query).sort(sortBy).skip(skipNo).limit(count).populate('lPartner').exec(function(err, partners) {
                    if (err) {
                        return res.status(400).jsonx({
                           success: false,
                           error: err
                        });
                    } else {
                        return res.jsonx({
                            success: true,
                            data: {
                                vehicles: partners,
                                total: total
                            },
                        });
                    }
                });
            }
        });
    },

    get: function(data, context, req, res){        
        let query = {id:data.id};
        Vehicles.findOne(query).then(function(result){
            if( result != undefined && result != null ) {
                return res.jsonx({
                    success: true,
                    code:200,
                    data: result,
                });
            } else {
                return res.jsonx({
                    success: false,
                    message: constantObj.vehicles.VEHICLE_NOT_FOUND
                });
            }
        }).fail(function(error){
            return res.jsonx({
                success: false,
                error: error
            })
        });
    },

    update: function(data, context, req, res){
        let query = {id:data.id};

        Vehicles.findOne(query).then(function(result){
            if( result != undefined && result != null ) {
                return Vehicles.update(data.id,data).then(function(cats) {
                cats = cats[0];
                    return res.jsonx({
                        success: true,
                        code:200,
                        data: {
                            vehicle:cats,
                            message: constantObj.vehicles.Vehicles_UPDATED
                        },
                    });
                })
            } else {
                return res.jsonx({
                    success: false,
                    message: constantObj.vehicles.VEHICLE_NOT_FOUND
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