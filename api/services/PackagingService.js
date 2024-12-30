var Promise = require('bluebird');
promisify = Promise.promisify;
var constantObj = sails.config.constants;

module.exports = {

    bidsPackaging: function (data, context, req, res) {
        let query = { id: data.id };
        Bids.findOne(query)
            .populate("packaging")
            .then(function (result) {
                return res.jsonx({
                    success: true,
                    data: result
                })
            })

    },

    save: function (data, context, req, res) {
        if (data.sizes.length > 0) {
            for (var i = 0; i < data.sizes.length; i++) {
                var __id = require('mongodb').ObjectID;
                if (data.sizes[i]["_id"] == undefined) data.sizes[i]["_id"] = new __id();
                data.sizes[i]["_id"] = String(data.sizes[i]["_id"]);
            }
        }
        Packaging.create(data).then(function (data) {
            return res.jsonx({
                success: true,
                data: {
                    message: "Data saved successfully"
                },
            })
        }).fail(function (error) {
            return res.jsonx({
                success: false,
                error: error
            });
        });
    },

    list: function (data, context, req, res) {
        var sortBy = req.param('sortBy');
        var page = req.param('page');
        var count = req.param('count');
        var search = req.param('search');
        var skipNo = (page - 1) * count;
        var query = {};


        if (sortBy) {
            sortBy = sortBy.toString();
        } else {
            sortBy = 'createdAt desc';
        }

        if (search) {
            query.$or = [
                {
                    type: {
                        'like': '%' + search + '%'
                    }
                },
                {
                    material: {
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

        Packaging.count(query).exec(function (err, total) {

            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                Packaging.find(query).sort(sortBy).skip(skipNo).limit(count).exec(function (err, plist) {
                    if (err) {
                        return res.status(400).jsonx({
                            success: false,
                            error: err
                        });
                    } else {
                        return res.jsonx({
                            success: true,
                            data: {
                                packaging: plist,
                                total: total
                            },
                        });
                    }
                });
            }
        });
    },

    get: function (data, context, req, res) {
        let query = { id: data.id };

        // console.log(query,'===')
        Packaging.findOne(query).then(function (result) {
            if (result != undefined && result != null) {
                return res.jsonx({
                    success: true,
                    code: 200,
                    data: result,
                });
            } else {
                return res.jsonx({
                    success: false,
                    message: "Data not found"
                });
            }
        }).fail(function (error) {
            return res.jsonx({
                success: false,
                error: error
            })
        });
    },


    update: function (data, context, req, res) {
        let query = { id: data.id };
        if (data.sizes.length > 0) {
            for (var i = 0; i < data.sizes.length; i++) {
                var __id = require('mongodb').ObjectID;
                if (data.sizes[i]["_id"] == undefined) data.sizes[i]["_id"] = new __id();
                data.sizes[i]["_id"] = String(data.sizes[i]["_id"]);
            }
        }
        Packaging.findOne(query).then(function (result) {
            if (result != undefined && result != null) {
                return Packaging.update(data.id, data).then(function (cats) {
                    cats = cats[0];
                    return res.jsonx({
                        success: true,
                        code: 200,
                        data: {
                            vehicle: cats,
                            message: "Data updated successfully"
                        },
                    });
                })
            } else {
                return res.jsonx({
                    success: false,
                    message: "Data not found"
                })
            }
        }).fail(function (error) {
            return res.jsonx({
                success: false,
                error: error
            })
        })
    },

    getListAll: function (data, context, req, res) {

        //console.log("====arun")
        sortBy = 'createdAt desc';
        let query = {}
        query.status = "active";
        Packaging.find(query).sort(sortBy).then(function (plist) {
            return res.jsonx({
                success: true,
                data: {
                    packaging: plist,

                },
            });
        });
    },
    getPackagingType: function (data, context, req, res) {
        let query = JSON.parse(data.type);
        console.log(query, "====")
        Packaging.find({ id: query }).then(function (packagingData) {
            console.log(packagingData, '++++')
            return res.jsonx({
                success: true,
                code: 200,
                data: packagingData,
            });
        })
    },
    getPackagingCategoryById: function (data, context, req, res) {
        let query = { id: data.id };

        Category.findOne(query).then(function (result) {
            // console.log(result, 'cropid')
            if (result) {
                let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
                //console.log(result,'===result')

                let packagingId = result.packaging;
                let PackagingArray = []
                for (i = 0; i < packagingId.length; i++) {
                    PackagingArray.push(ObjectId(packagingId[i].type));
                }
                //console.log("packaging",PackagingArray)
                Packaging.find({ id: PackagingArray }).then(function (packagingData) {
                    if (packagingData) {
                        let cropId = data.cropId;
                        // console.log(cropId,'++++')
                        // console.log("packaging", packagingData)
                        var packagingArray = []
                        if (cropId) {


                            Crops.findOne({ id: cropId, select: ['packaging'] }).then(function (crop) {
                                let cropPackaging = crop.packaging;
                                if (crop != undefined & crop != null && cropPackaging != undefined && cropPackaging != null) {

                                    console.log(cropPackaging, 'crop')
                                    let typeArr = [];
                                    let arrarSize = []
                                    for (var i = 0; i < packagingId.length; i++) {

                                        for (var j = 0; j < cropPackaging.length; j++) {

                                            if (packagingId[i].type == cropPackaging[j].type) {
                                                typeArr.push(packagingId[i].type)
                                                for (var k = 0; k < packagingId[i].sizes.length; k++) {

                                                    for (var l = 0; l < cropPackaging[j].sizes.length; l++) {
                                                        // console.log(packagingId[i].sizes[k].id,'====',cropPackaging[j].sizes[l].id);
                                                        if (packagingId[i].sizes[k].id == cropPackaging[j].sizes[l].id) {


                                                            let newSize = []
                                                            let groupSize = _.groupBy(packagingData[i].sizes, '_id');
                                                            //  console.log(groupSize, 'groupof size==');
                                                            for (let p = 0; p < packagingId[i].sizes.length; p++) {
                                                                newSize.push({ id: packagingId[i].sizes[p].id, itemName: packagingId[i].sizes[p].itemName, image: groupSize[packagingId[i].sizes[p].id][0].image })
                                                            }


                                                            arrarSize.push({ type: packagingId[i].type, id: packagingId[i].sizes[k].id, sizes: newSize })

                                                            // arrarSize[packagingId[i].type]=packagingId[i].sizes;
                                                        }
                                                    }
                                                }
                                            }

                                        }
                                    }
                                    const key = "type";

                                    const arrayUniqueByKey = [...new Map(arrarSize.map(item =>
                                        [item[key], item])).values()];

                                    for (var i = 0; i < packagingData.length; i++) {
                                        for (var j = 0; j < arrayUniqueByKey.length; j++) {
                                            if (packagingData[i].id == arrayUniqueByKey[j].type) {
                                                packagingArray.push({ id: arrayUniqueByKey[j].type, type: packagingData[i].type, sizes: arrayUniqueByKey[j].sizes })
                                            }
                                        }
                                    }
                                    // console.log(JSON.stringify(packagingArray));

                                    return res.jsonx({
                                        success: true,
                                        code: 200,
                                        data: packagingArray,
                                    });
                                }

                                else {

                                    let typeArr = [];
                                    let arrarSize = []
                                    //console.log(packagingData,'packaginginfo')
                                    for (var i = 0; i < packagingData.length; i++) {
                                        for (var j = 0; j < packagingId.length; j++) {
                                            // console.log(packagingId[j].type)
                                            if (packagingData[i].id == packagingId[j].type) {
                                                typeArr.push(packagingId[j].type)
                                                for (var k = 0; k < packagingData[i].sizes.length; k++) {

                                                    for (var l = 0; l < packagingId[j].sizes.length; l++) {
                                                        // console.log(packagingData[i].sizes[k]._id,'====',packagingId[j].sizes[l].id);

                                                        if (packagingData[i].sizes[k]._id == packagingId[j].sizes[l].id) {


                                                            let newSize = []
                                                            let groupSize = _.groupBy(packagingData[i].sizes, '_id');
                                                            //  console.log(groupSize, 'groupof size==');
                                                            for (let p = 0; p < packagingId[j].sizes.length; p++) {
                                                                newSize.push({ id: packagingId[j].sizes[p].id, itemName: packagingId[j].sizes[p].itemName, image: groupSize[packagingId[j].sizes[p].id][0].image })
                                                            }

                                                            arrarSize.push({ type: packagingId[j].type, id: packagingId[j].sizes[l].id, sizes: newSize })
                                                            // arrarSize[packagingId[i].type]=packagingId[i].sizes;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    const key = "type";

                                    const arrayUniqueByKey = [...new Map(arrarSize.map(item =>
                                        [item[key], item])).values()];

                                    for (var i = 0; i < packagingData.length; i++) {
                                        for (var j = 0; j < arrayUniqueByKey.length; j++) {
                                            if (packagingData[i].id == arrayUniqueByKey[j].type) {
                                                packagingArray.push({ id: packagingData[i].id, type: packagingData[i].type, sizes: arrayUniqueByKey[j].sizes })
                                            }
                                        }
                                    }
                                    // console.log(JSON.stringify(packagingArray));
                                    return res.jsonx({
                                        success: true,
                                        code: 200,
                                        data1: packagingArray,
                                    });

                                }


                            })


                        } else {
                            let typeArr = [];
                            let arrarSize = []
                            // console.log(packagingData,'packaginginfo')
                            for (var i = 0; i < packagingData.length; i++) {
                                for (var j = 0; j < packagingId.length; j++) {
                                    // console.log(packagingId[j].type)
                                    if (packagingData[i].id == packagingId[j].type) {
                                        typeArr.push(packagingId[j].type)
                                        for (var k = 0; k < packagingData[i].sizes.length; k++) {
                                            // console.log(packagingData[i].sizes, 'siezess===')
                                            if (packagingId[j].sizes) {
                                                for (var l = 0; l < packagingId[j].sizes.length; l++) {
                                                    // console.log(packagingData[i].sizes[k]._id,'====',packagingId[j].sizes[l].id);

                                                    if (packagingData[i].sizes[k]._id == packagingId[j].sizes[l].id) {
                                                        let newSize = []
                                                        let groupSize = _.groupBy(packagingData[i].sizes, '_id');
                                                        //  console.log(groupSize, 'groupof size==');
                                                        for (let p = 0; p < packagingId[j].sizes.length; p++) {
                                                            newSize.push({ id: packagingId[j].sizes[p].id, itemName: packagingId[j].sizes[p].itemName, image: groupSize[packagingId[j].sizes[p].id][0].image })
                                                        }

                                                        arrarSize.push({ type: packagingId[j].type, id: packagingId[j].sizes[l].id, sizes: newSize })
                                                        // arrarSize[packagingId[i].type]=packagingId[i].sizes;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            const key = "type";

                            const arrayUniqueByKey = [...new Map(arrarSize.map(item =>
                                [item[key], item])).values()];

                            for (var i = 0; i < packagingData.length; i++) {
                                for (var j = 0; j < arrayUniqueByKey.length; j++) {
                                    if (packagingData[i].id == arrayUniqueByKey[j].type) {
                                        packagingArray.push({
                                            id: packagingData[i].id, type: packagingData[i].type, sizes: arrayUniqueByKey[j].sizes,

                                        })
                                    }
                                }
                            }
                            return res.jsonx({
                                success: true,
                                code: 200,
                                data: packagingArray,
                            });
                        }
                    } else {
                        return res.jsonx({
                            success: false,
                            message: "Data not found"
                        });
                    }

                })

            }
            else {
                return res.jsonx({
                    success: false,
                    message: "Data not found"
                });
            }
        }).fail(function (error) {
            return res.jsonx({
                success: false,
                error: error
            })
        });
    },
    getPackagingTypeCropDetail: function (data, context, req, res) {

        var packagingArray = []
        let cropId = data.id
        if (cropId) {
            Crops.findOne({ id: cropId, select: ['packaging'] }).then(function (crop) {
                if (crop) {
                    let cropPackaging = crop.packaging;
                    if (crop != undefined & crop != null && cropPackaging != undefined && cropPackaging != null) {
                        // let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
                        let PackagingArray = []
                        for (i = 0; i < cropPackaging.length; i++) {
                            PackagingArray.push(cropPackaging[i].type);
                        }

                        Packaging.find({ id: PackagingArray }).then(function (packagingData) {
                            if (packagingData) {
                                let typeArr = [];
                                let arrarSize = []
                                // console.log(packagingData,'packaginginfo')
                                for (var i = 0; i < packagingData.length; i++) {
                                    for (var j = 0; j < cropPackaging.length; j++) {
                                        // console.log(packagingId[j].type)
                                        if (packagingData[i].id == cropPackaging[j].type) {
                                            //typeArr.push(packagingId[j].type)
                                            var sizes = [];
                                            for (var k = 0; k < packagingData[i].sizes.length; k++) {


                                                for (var l = 0; l < cropPackaging[j].sizes.length; l++) {
                                                    // console.log(packagingData[i].sizes[k]._id,'====',cropPackaging[j].sizes[l].id);

                                                    if (packagingData[i].sizes[k]._id == cropPackaging[j].sizes[l].id) {
                                                        // console.log(cropPackaging[j].sizes[l].id,'===',packagingData[i].sizes[k]._id)
                                                        sizes.push({
                                                            id: cropPackaging[j].sizes[l].id,
                                                            itemName: cropPackaging[j].sizes[l].itemName,
                                                            image: packagingData[i].sizes[k].image,
                                                            width: packagingData[i].sizes[k].width,
                                                            height: packagingData[i].sizes[k].height,
                                                            length: packagingData[i].sizes[k].length,
                                                            dimensionalimage: packagingData[i].sizes[k].dimensionalimage

                                                        })

                                                        // arrarSize[packagingId[i].type]=packagingId[i].sizes;
                                                    }
                                                }
                                                arrarSize.push({
                                                    type: cropPackaging[j].type,

                                                    material: packagingData[i].material,
                                                    features: packagingData[i].features,
                                                    description: packagingData[i].description,
                                                    sizes: sizes
                                                })
                                            }
                                        }
                                    }
                                }
                                const key = "type";

                                const arrayUniqueByKey = [...new Map(arrarSize.map(item =>
                                    [item[key], item])).values()];

                                for (var i = 0; i < packagingData.length; i++) {
                                    for (var j = 0; j < arrayUniqueByKey.length; j++) {
                                        if (packagingData[i].id == arrayUniqueByKey[j].type) {
                                            packagingArray.push({
                                                id: packagingData[i].id,
                                                type: packagingData[i].type,
                                                material: packagingData[i].material,
                                                features: packagingData[i].features,
                                                description: packagingData[i].description,
                                                sizes: arrayUniqueByKey[j].sizes
                                            })
                                        }
                                    }
                                }

                                return res.jsonx({
                                    success: true,
                                    code: 200,
                                    data: packagingArray,
                                });
                            } else {
                                return res.jsonx({
                                    success: false,
                                    message: "Data not found"
                                });
                            }
                        })
                    }
                    else {
                        return res.jsonx({
                            success: false,
                            message: "Data not found"
                        });
                    }
                } else {
                    return res.jsonx({
                        success: false,
                        message: "Data not found"
                    });
                }
            })
        }

    },

}