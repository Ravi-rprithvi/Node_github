/**
 * InputsController
 *
 * @description :: Server-side logic for managing inputs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var ObjectId = require('mongodb').ObjectID;
var constantObj = sails.config.constants;
var commonService = require('./../services/commonService');

module.exports = {

    //exists
    similarInput: function (req, res) {
        API(InputService.similarInput, req, res);
    },
    delete: function (req, res) {
        API(InputService.deleteInput, req, res);
    },

    placeBid: function (req, res) {
        API(InputService.saveInputBid, req, res);
    },
    getCompleteInputBidDetails: function (req, res) {
        return API(InputService.completeInputBidDetails, req, res)
    },
    inputBidAccept: function (req, res) {
        return API(InputService.inputAcceptBid, req, res);
    },
    inputPaymentsList: function (req, res) {
        //
        return API(InputService.inputPaymentslist, req, res);
    },
    verify: function (req, res) {
        API(InputService.makeVerifyInput, req, res);
    },

    //exists
    approve: function (req, res) {
        return API(InputService.makeApproveInput, req, res);
    },

    //exists  
    feature: function (req, res) {
        return API(InputService.makeFeatureInput, req, res);
    },
    // Payment Through DD, Cheque, bank transfer
    inputUpdateDeposit: function (req, res) {
        return API(InputService.updateInputDepositInfo, req, res);
    },
    putBid: function (req, res) {
        return API(InputService.putBid, req, res);
    },

    //exists
    putInput: function (req, res) {
        return API(InputService.putInput, req, res);
    },
    deliverInput: function (req, res) {
        API(InputService.deliverInput, req, res);
    },
    
    InputCategoriesAndProducts: function (req, res) {
         var pincode = req.param('pincode');

        if (pincode) {
            Market.find({ select: ['id'], where: { pincode: { "$in": [JSON.parse(pincode)] } } }).then(function (markesId) {
                if (markesId.length > 0) {
                    let markets = []
                    // let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
                    for (var i = 0; i < markesId.length; i++) {
                        markets.push(markesId[i].id)
                    }
                    InputService.InputCategoriesAndProducts(markets, req, res)
                } else {
                    InputService.InputCategoriesAndProducts([], req, res)
                }
            })
        } else {
            InputService.InputCategoriesAndProducts([], req, res)
        }
    },
    //exists
    inputChangeStatus: function (req, res) {

        var itemId = req.param('id');
        var updated_status = req.param('isActive');
        let query = {};
        query.id = itemId;

        Inputs.findOne(query).exec(function (err, data) {
            if (err) {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: constantObj.messages.DATABASE_ISSUE
                    }
                });
            } else {
                Inputs.update({ id: itemId }, { isActive: updated_status }, function (err, response) {
                    if (err) {
                        return res.status(400).jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: constantObj.messages.DATABASE_ISSUE
                            }
                        });
                    } else {
                        return res.jsonx({
                            success: true,
                            data: {
                                message: constantObj.messages.STATUS_CHANGED
                            }
                        });
                    }
                });
            }
        });
    },

    //exists
    saveInput: function (req, res) {
        API(InputService.saveInput, req, res);
    },

    //exists
    editInput: function (req, res) {
        API(InputService.updateInput, req, res);
    },

    //exists
    myInputs: function (req, res) {

        var search = req.param('search');
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var sortBy = req.param('sortBy');
        var seller = req.identity.id;
        var isExpired = req.param('expire');
        var isApproved = req.param('approved');
        var query = {};

        query.dealer = seller;
        if (isApproved) {
            query.isApproved = true;
        }
        if (isExpired) {
            query.isExpired = isExpired;
        }

        if (sortBy) {
            sortBy = sortBy.toString();
        } else {
            sortBy = 'createdAt desc';
        }

        if (search) {
            query.$or = [
                {
                    name: {
                        'like': '%' + search + '%'
                    }
                }, {
                    variety: {
                        'like': '%' + search + '%'
                    }
                }, {
                    company: {
                        'like': '%' + search + '%'
                    }
                }, {
                    code: parseInt(search)
                }
            ]
        }
        // console.log(query, "query")

        Inputs.find(query).sort(sortBy).populate('category').sort(sortBy).skip(skipNo).limit(count).then(function (inputresponse) {
            // var x = _.pluck(inputresponse, 'category.parentId')
            console.log("input")
            var parentcategory = Category.find({ id: _.pluck(inputresponse, 'category.parentId') }).then(function (parentcategory) {
                return parentcategory
            });
            // console.log(parentcategory);
            return [inputresponse, parentcategory]
        }).spread(function (inputresponse, parentcategory) {
            parentcategory = _.indexBy(parentcategory, 'id');

            inputresponse = _.map(inputresponse, function (inputs) {
                inputs.parentcategory = parentcategory[inputs.category.parentId]
                return inputs
            })
            Inputs.count(query).then(function (countinput) {
                return res.jsonx({
                    success: true,
                    data: {
                        inputs: inputresponse,
                        total: countinput
                    },
                });
            }).fail(function (err) {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 400,
                        message: err
                    }
                })
            })
        }).fail(function (err) {
            return res.status(400).jsonx({
                success: false,
                error: err
            })
        });
    },
    myInputsFranchisee: function (req, res) {
        var seller = req.identity.id;
        // console.log(seller)

        Inputs.find({ dealer: seller }).then(function (input) {
            // console.log("inputlist", input)
            var markets = []
            for (var i = 0; i < input.length; i++) {
                if (input[i].availableForFranchisees != undefined) {
                    for (j = 0; j < input[i].availableForFranchisees.length; j++) {
                        markets.push((input[i].availableForFranchisees[j]))
                    }
                }
            }

            //console.log(markets, "cartsSelectedMarkets");
            var frnMarket = Market.find({ id: { "$in": markets } }).then(function (frnMarket) {
                return frnMarket;
            })
            //frnMarket = _.indexBy(frnMarket, 'id');

            return [input, frnMarket];
        }).spread(function (input, frnMarket) {
            frnMarket = _.indexBy(frnMarket, 'id');
            var fk = Object.keys(frnMarket);
            //console.log(fk)
            // console.log(frnMarket, "frnMarket")
            for (var i = 0; i < input.length; i++) {
                var franchisee = []
                if (input[i].availableForFranchisees != undefined) {
                    for (j = 0; j < input[i].availableForFranchisees.length; j++) {
                        for (k = 0; k < fk.length; k++) {
                            console.log("dsds", frnMarket[fk[k]])
                            if (fk[k] == input[i].availableForFranchisees[j]) {
                                console.log(k, "kkkk")
                                franchisee.push(frnMarket[fk[k]])
                            }
                        }

                    }
                    input[i].franchisseList = franchisee
                }
            }
            //console.log("input", input)


            return res.jsonx({
                success: true,
                code: 200,
                data: input
            });
        })
    },
    //exists
    inputLanding: function (req, res) {
        var pincode = req.param('pincode');

        if (pincode) {
            Market.find({ select: ['id'], where: { pincode: { "$in": [JSON.parse(pincode)] } } }).then(function (markesId) {
                if (markesId.length > 0) {
                    let markets = []
                    // let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
                    for (var i = 0; i < markesId.length; i++) {
                        markets.push(markesId[i].id)
                    }
                    InputService.inputLanding(markets, req, res)
                } else {
                    InputService.inputLanding([], req, res)
                }
            })
        } else {
            InputService.inputLanding([], req, res)
        }
    },

    //exists
    show: function (req, res) {
        let Id = req.param('id');
        // let IP = req.ip

        if (req.param('pincode')) {
            Market.find({ select: ['id'], where: { pincode: { "$in": [req.param('pincode')] } } }).then(function (markesId) {
                if (markesId.length > 0) {
                    let markets = []
                    //  let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
                    for (var i = 0; i < markesId.length; i++) {
                        markets.push(markesId[i].id)
                    }

                    Inputs.findOne({ id: Id }).populate('dealer', { select: ['fullName'] }).populate('category')
                        .populate("pricesAtMarkets", { where: { market: markets }, select: ['price'], sort: 'price asc', limit: 1 })
                        .then(function (inputInf) {
                            if (inputInf === undefined || (inputInf.pricesAtMarkets.length === 0 && inputInf.availableForFranchisees.length > 0)) {
                                Inputs.findOne({ id: Id }).populate('dealer', { select: ['fullName'] }).populate('category').populate("pricesAtMarkets", { select: ['price', 'market'], sort: 'price asc' }).populate('allOrders').then(function (inputInfo) {
                                    if (inputInfo === undefined) {
                                        return res.status(400).jsonx({
                                            success: false,
                                            message: "Input does not exists with this id."
                                        });
                                    } else {

                                        var markets = Market.find({ id: _.pluck(inputInfo.pricesAtMarkets, 'market'), select: ['GM', 'name', 'pincode'] }).populate('GM', { select: ['fullName', 'address', 'city', 'district', 'state', 'pincode'] }).then(function (markets) {
                                            return markets
                                        });
                                        return [inputInfo, markets]
                                    }
                                }).spread(function (inputInfo, markets) {
                                    markets = _.indexBy(markets, 'id');

                                    inputInfo.pricesAtMarkets = _.map(inputInfo.pricesAtMarkets, function (maket) {
                                        maket.market = markets[maket.market]
                                        return maket
                                    });

                                    if (inputInfo.pricesAtMarkets != undefined && inputInfo.pricesAtMarkets.length > 0) {
                                        inputInfo.displayPrice = inputInfo.pricesAtMarkets[0].price
                                    } else {
                                        inputInfo.displayPrice = inputInfo.finalPrice
                                    }

                                    let viewed = inputInfo.viewed
                                    viewed = viewed + 1
                                    Inputs.update({ id: Id }, { viewed: viewed }, function (err, response) {
                                        if (err) {
                                            return res.jsonx({
                                                success: false,
                                                error: {
                                                    code: 400,
                                                    message: constantObj.messages.DATABASE_ISSUE
                                                }
                                            });

                                        } else {
                                            return res.jsonx({
                                                success: true,
                                                data: inputInfo
                                            });
                                        }
                                    });
                                });
                            } else {
                                Inputs.findOne({ id: Id }).populate('dealer', { select: ['fullName'] }).populate('category').populate("pricesAtMarkets").then(function (inputInfo) {
                                    if (inputInfo === undefined) {
                                        return res.status(400).jsonx({
                                            success: false,
                                            message: "Input does not exists with this id."
                                        });
                                    } else {
                                        var markets = Market.find({ id: _.pluck(inputInfo.pricesAtMarkets, 'market'), select: ['GM', 'name', 'pincode'] }).populate('GM', { select: ['fullName', 'address', 'city', 'district', 'state', 'pincode'] }).then(function (markets) {
                                            return markets
                                        });
                                        return [inputInfo, markets]
                                    }
                                }).spread(function (inputInfo, markets) {
                                    markets = _.indexBy(markets, 'id');

                                    inputInfo.pricesAtMarkets = _.map(inputInfo.pricesAtMarkets, function (maket) {
                                        maket.market = markets[maket.market]
                                        return maket
                                    });

                                    let viewed = inputInfo.viewed
                                    viewed = viewed + 1

                                    inputInfo.displayPrice = inputInf.pricesAtMarkets[0].price

                                    Inputs.update({ id: Id }, { viewed: viewed }, function (err, response) {
                                        if (err) {
                                            return res.jsonx({
                                                success: false,
                                                error: {
                                                    code: 400,
                                                    message: constantObj.messages.DATABASE_ISSUE
                                                }
                                            });

                                        } else {
                                            return res.jsonx({
                                                success: true,
                                                data: inputInfo
                                            });
                                        }
                                    });
                                })
                            }
                        });
                } else {
                    Inputs.findOne({ id: Id }).populate('dealer', { select: ['fullName'] }).populate('category').populate("pricesAtMarkets", { select: ['price', 'market'], sort: 'price asc' }).then(function (inputInfo) {
                        if (inputInfo === undefined) {
                            return res.status(400).jsonx({
                                success: false,
                                message: "Input does not exists with this id."
                            });
                        } else {

                            var markets = Market.find({ id: _.pluck(inputInfo.pricesAtMarkets, 'market'), select: ['GM', 'name', 'pincode'] }).populate('GM', { select: ['fullName', 'address', 'city', 'district', 'state', 'pincode'] }).then(function (markets) {
                                return markets
                            });
                            return [inputInfo, markets]
                        }
                    }).spread(function (inputInfo, markets) {
                        markets = _.indexBy(markets, 'id');

                        inputInfo.pricesAtMarkets = _.map(inputInfo.pricesAtMarkets, function (maket) {
                            maket.market = markets[maket.market]
                            return maket
                        });

                        if (inputInfo.pricesAtMarkets != undefined && inputInfo.pricesAtMarkets.length > 0) {
                            inputInfo.displayPrice = inputInfo.pricesAtMarkets[0].price
                        } else {
                            inputInfo.displayPrice = inputInfo.finalPrice
                        }

                        let viewed = inputInfo.viewed
                        viewed = viewed + 1
                        Inputs.update({ id: Id }, { viewed: viewed }, function (err, response) {
                            if (err) {
                                return res.jsonx({
                                    success: false,
                                    error: {
                                        code: 400,
                                        message: constantObj.messages.DATABASE_ISSUE
                                    }
                                });

                            } else {
                                return res.jsonx({
                                    success: true,
                                    data: inputInfo
                                });
                            }
                        });
                    });
                }
            })
        } else {
            Inputs.findOne({ id: Id }).populate('dealer', { select: ['fullName'] }).populate('category').populate("pricesAtMarkets", { select: ['price', 'market'], sort: 'price asc' }).then(function (inputInfo) {
                if (inputInfo === undefined) {
                    return res.status(400).jsonx({
                        success: false,
                        message: "Input does not exists with this id."
                    });
                } else {

                    var markets = Market.find({ id: _.pluck(inputInfo.pricesAtMarkets, 'market'), select: ['GM', 'name', 'pincode'] }).populate('GM', { select: ['fullName', 'address', 'city', 'district', 'state', 'pincode'] }).then(function (markets) {
                        return markets
                    });
                    return [inputInfo, markets]
                }
            }).spread(function (inputInfo, markets) {
                markets = _.indexBy(markets, 'id');

                inputInfo.pricesAtMarkets = _.map(inputInfo.pricesAtMarkets, function (maket) {
                    maket.market = markets[maket.market]
                    return maket
                });

                if (inputInfo.pricesAtMarkets != undefined && inputInfo.pricesAtMarkets.length > 0) {
                    inputInfo.displayPrice = inputInfo.pricesAtMarkets[0].price
                } else {
                    inputInfo.displayPrice = inputInfo.finalPrice
                }

                let viewed = inputInfo.viewed
                viewed = viewed + 1
                Inputs.update({ id: Id }, { viewed: viewed }, function (err, response) {
                    if (err) {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: constantObj.messages.DATABASE_ISSUE
                            }
                        });

                    } else {
                        return res.jsonx({
                            success: true,
                            data: inputInfo
                        });
                    }
                });
            });
        }
    },

    //exists
    detailInputs: function (req, res) {
        let Id = req.param('id');
        let IP = req.ip

        Inputs.findOne({ id: Id }).populate('category', { select: ['name'] }).populate("pricesAtMarkets", { select: ['market', 'price', 'marketDistanceInMeters', 'travelDurationInSec'] }).then(function (inputInfo) {
            if (inputInfo === undefined) {
                return res.status(400).jsonx({
                    success: false,
                    message: "Input does not exists with this id."
                });
            } else {
                var markets = Market.find({ id: _.pluck(inputInfo.pricesAtMarkets, 'market'), select: ['GM', 'name', 'pincode'] }).populate('GM', { select: ['fullName', 'address', 'city', 'district', 'state', 'pincode'] }).then(function (markets) {
                    return markets
                });
                return [inputInfo, markets]
            }
        }).spread(function (inputInfo, markets) {
            markets = _.indexBy(markets, 'id');

            inputInfo.pricesAtMarkets = _.map(inputInfo.pricesAtMarkets, function (maket) {
                maket.market = markets[maket.market]
                return maket
            });

            return res.jsonx({
                success: true,
                code: 200,
                data: inputInfo
            });
        })
    },

    //exists
    inputSearch: function (req, res) {
        var pincode = req.param('pincode');

        if (pincode) {
            Market.find({ select: ['id'], where: { pincode: { "$in": [JSON.parse(pincode)] } } }).then(function (markesId) {
                if (markesId.length > 0) {
                    let markets = []
                    // let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
                    for (var i = 0; i < markesId.length; i++) {
                        markets.push(markesId[i].id)
                    }
                    InputService.inputSearch(markets, req, res)
                } else {
                    InputService.inputSearch([], req, res)
                }
            })
        } else {
            InputService.inputSearch([], req, res)
        }

    },
    // inputSearch: function(req,res) {

    //     var pincode = req.param('pincode');



    //     // marketsForPincode(pincode).then(function(markets) {

    //         var search = req.param('search');
    //         var minprice = req.param('minprice');
    //         var maxprice = req.param('maxprice');
    //         var minquantity = req.param('minquantity');
    //         var maxquantity = req.param('maxquantity');
    //         var page = req.param('page');
    //         var count = req.param('count');
    //         var skipNo = (page - 1) * count;
    //         var sortBy = req.param('sortBy');
    //         var inputId = req.param('inputId');

    //         count = parseInt(count);
    //         var catgIds;
    //         var varieties;

    //         let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
    //         if(req.param('categoryIds')){
    //             let parsedcatgIds = JSON.parse(req.param('categoryIds'));
    //             catgIds = []

    //             parsedcatgIds.forEach((obj,i)=> {
    //                 catgIds.push(ObjectId(obj))
    //             })
    //         }
    //         if(req.param('variety')){
    //             varieties = JSON.parse(req.param('variety'));
    //         }

    //         var qry = {};
    //         qry.isDeleted = false;
    //         qry.approved = true;
    //         qry.isExpired = false;
    //         qry.isActive = true
    //         if(inputId) {
    //             qry.id = {"$nin" : [ObjectId(inputId)] };
    //         }  

    //         // if (markets != undefined && markets.length > 0) {
    //         //     qry.availableForFranchisees = {"$in":markets}
    //         // }      

    //         var sortquery ={};

    //         if (sortBy) {
    //             var typeArr = new Array();
    //             typeArr = sortBy.split(" ");
    //             var sortType = typeArr[1];
    //             var field = typeArr[0];
    //             if (field == 'userRating') {
    //                 field = 'users.avgRating'
    //             }
    //         } 
    //         sortquery[field?field:"createdAt"] = sortType?(sortType=='desc'?-1:1):-1;

    //         var qryArray = []

    //         if (search) {
    //             qryArray.push({ code: parseInt(search) })
    //             qryArray.push({ name: {$regex: search, '$options' : 'i'}})
    //             // qryArray.push({ parentcategory:{$regex: search, '$options' : 'i'}})
    //             qryArray.push({ category:{$regex: search, '$options' : 'i'}})
    //             qryArray.push({ variety:{$regex: search, '$options' : 'i'}})
    //         }

    //         if(minprice != undefined && minprice  != "" && maxprice != undefined && maxprice  != ""){
    //             qry.price =  { $gte :  parseFloat( minprice ), $lte : parseFloat( maxprice ) } ;
    //         }

    //         if(minquantity  != undefined && maxquantity != undefined && minquantity  != "" && maxquantity  != ""){
    //             qry.$and =  [{quantity:{ $gte :  parseFloat( minquantity )}}, {quantity:{ $lte : parseFloat( maxquantity ) }}] ;
    //         } else if(minquantity  != undefined && minquantity != "") {
    //             qry.availableQuantity = { $gte :  parseFloat( minquantity )}
    //         } else if(maxquantity != undefined && maxquantity  != "") {
    //             qry.availableQuantity = { $lte : parseFloat( maxquantity ) }
    //         }

    //         if(catgIds != undefined && catgIds.length > 0){
    //             qryArray.push({categoryId : {"$in" : catgIds }});
    //             qryArray.push({parentcategoryId : {"$in" : catgIds }});    
    //         }
    //         if(varieties != undefined && varieties.length > 0){
    //             qryArray.push({variety : {"$in" : varieties }})
    //         }

    //         if (qryArray.length > 0) {
    //             qry.$or = qryArray
    //         }

    //         Inputs.native(function(err, inputlist) {
    //             inputlist.aggregate([                

    //                 {
    //                     $lookup: {
    //                         from: "category",
    //                         localField: "category",
    //                         foreignField: "_id",
    //                         as: "category"
    //                     }
    //                 },
    //                 {
    //                     $unwind: '$category'
    //                 },

    //                 {
    //                     $lookup: {
    //                         from: 'users',
    //                         localField: 'dealer',
    //                         foreignField: '_id',
    //                         as: 'users'
    //                     }
    //                 },
    //                 {
    //                     $unwind: '$users'
    //                 },

    //                 {
    //                     $project: {
    //                         id: "$_id",
    //                         variety:"$variety",
    //                         upfrontPercent:"$upfrontPercent",
    //                         taxRate:"$taxRate",
    //                         state:"$state",
    //                         price:"$price",
    //                         highestBid:"$highestBid",
    //                         name: "$name",
    //                         City:"$city",
    //                         State:"$state",
    //                         District:"$district",
    //                         Address:"$address",
    //                         bidEndDate:"$bidEndDate",
    //                         images:"$images",
    //                         isDeleted: "$isDeleted",
    //                         isExpired: "$isExpired",
    //                         approved: "$approved",
    //                         isActive: "$isActive",
    //                         createdAt:"$createdAt",
    //                         viewed: "$viewed",
    //                         verified: "$verified",
    //                         userFullname: "$users.fullName",
    //                         userFirstname: "$users.firsname",
    //                         userImage: "$users.image",
    //                         userId:"$users._id",
    //                         userEmail:"$users.username",
    //                         userState:"$users.state",
    //                         userCity:"$users.city",
    //                         userDistricts:"$users.district",
    //                         userRating:"$users.avgRating",
    //                         userPincode:"$users.pincode",
    //                         quantityUnit:"$quantityUnit",
    //                         quantity:"$quantity",
    //                         leftAfterAcceptanceQuantity: "$leftAfterAcceptanceQuantity",
    //                         leftAfterDeliveryQuantity: "$leftAfterDeliveryQuantity",
    //                         category:"$category.name",
    //                         categoryId:"$category._id",
    //                         soldOut: "$soldOut",
    //                         // parentcategory: "$parentcategory.name",
    //                         // parentcategoryId: "$parentcategory._id",
    //                         availableForFranchisees:"$availableForFranchisees",
    //                     }                    
    //                 },
    //                 {
    //                    $match:qry
    //                 }
    //             ],function (err, totalresults) {
    //                 inputlist.aggregate([
    //                     {
    //                         $lookup: {
    //                             from: "category",
    //                             localField: "category",
    //                             foreignField: "_id",
    //                             as: "category"
    //                         }
    //                     },
    //                     {
    //                         $unwind: '$category'
    //                     },

    //                     {
    //                         $lookup: {
    //                             from: 'users',
    //                             localField: 'dealer',
    //                             foreignField: '_id',
    //                             as: 'users'
    //                         }
    //                     },
    //                     {
    //                         $unwind: '$users'
    //                     },

    //                     {
    //                         $sort: sortquery
    //                     },
    //                     {
    //                         $project: {
    //                             id: "$_id",
    //                             variety:"$variety",
    //                             upfrontPercent:"$upfrontPercent",
    //                             taxRate:"$taxRate",
    //                             state:"$state",
    //                             price:"$price",
    //                             highestBid:"$highestBid",
    //                             name: "$name",
    //                             City:"$city",
    //                             State:"$state",
    //                             District:"$district",
    //                             Address:"$address",
    //                             bidEndDate:"$bidEndDate",
    //                             images:"$images",
    //                             isDeleted: "$isDeleted",
    //                             isExpired: "$isExpired",
    //                             approved: "$approved",
    //                             isActive: "$isActive",
    //                             createdAt:"$createdAt",
    //                             viewed: "$viewed",
    //                             verified: "$verified",
    //                             userFullname: "$users.fullName",
    //                             userFirstname: "$users.firsname",
    //                             userImage: "$users.image",
    //                             userId:"$users._id",
    //                             userEmail:"$users.username",
    //                             userState:"$users.state",
    //                             userCity:"$users.city",
    //                             userDistricts:"$users.district",
    //                             userRating:"$users.avgRating",
    //                             userPincode:"$users.pincode",
    //                             quantityUnit:"$quantityUnit",
    //                             quantity:"$quantity",
    //                             leftAfterAcceptanceQuantity: "$leftAfterAcceptanceQuantity",
    //                             leftAfterDeliveryQuantity: "$leftAfterDeliveryQuantity",
    //                             category:"$category.name",
    //                             categoryId:"$category._id",
    //                             soldOut: "$soldOut",
    //                             // parentcategory: "$parentcategory.name",
    //                             // parentcategoryId: "$parentcategory._id",
    //                             availableForFranchisees:"$availableForFranchisees",
    //                         }                
    //                     },

    //                     {
    //                        $match:qry
    //                     },
    //                     {
    //                         $skip: skipNo
    //                     },
    //                     {
    //                         $limit: count
    //                     }              
    //                 ],function (err, results) {
    //                     if (err){
    //                         return res.status(400).jsonx({
    //                             success: false,
    //                             error: err
    //                         }); 
    //                     } else {
    //                         return res.status(200).jsonx({
    //                             success: true,
    //                             data: {
    //                                 inputs:results,
    //                                 total:totalresults.length
    //                             }
    //                         });
    //                     }
    //                 });
    //             })
    //         })
    //     // })
    // },

    allInputs: function (req, res, next) {

        var search = req.param('search');

        var query = {};

        query.isDeleted = false;

        var qryArray = []
        if (search) {
            qryArray.push({ name: { $regex: search, '$options': 'i' } })
            query.name = { $regex: search, $options: 'i' }
        }

        Inputs.find().sort("createdAt desc")
            .populate('category')
            .populate('user')
            .populate('allbids')
            .populate('inputbuyerpayments')
            .populate('inputsellerpayments')
            .exec(function (err, inputs) {
                if (err) {
                    res.status(400).jsonx({
                        success: false,
                        error: err
                    })
                } else {
                    return res.jsonx({
                        success: true,
                        data: inputs
                    })
                }
            })



    },
    myBids: function (req, res) {
        var Id = req.param('id');
        Bids.find({
            user: Id,
            productType: 'input'
        }).sort('createdAt DESC')
            .populate('input')
            .populate('buyerpayments', { status: 'Due', type: "Final" })
            .then(function (bids) {
                async.each(bids, function (bid, callback) {
                    // console.log("bid-----", bid);
                    if (bid.input && bid.input.category) {
                        let query = {};
                        query.id = bid.input.category;
                        Category.findOne(query).then(function (categoty) {
                            bid.input.category = categoty;

                            if (bid.status == 'Withdrawal') {
                                bid.tab = 'Failed'
                                if (bid.withdrawalAt) {
                                    bid.currentcomment = 'You have withdrawal your bid on ' + commonService.longDateFormat((new Date(bid.withdrawalAt)))
                                } else {
                                    bid.currentcomment = 'You have withdrawal your bid'
                                }
                                bid.commentIn = 'Red'
                            } else if (bid.status == 'Failed') {
                                bid.tab = 'Failed'
                                bid.currentcomment = 'Your bid was failed.'
                                bid.commentIn = 'Red'
                            } else if (bid.status == 'Pending') {
                                bid.tab = 'Active'
                                bid.currentcomment = 'Your bid is successfully placed. Waiting for seller to accept it.'
                                bid.commentIn = 'Yellow'
                            } else if (bid.status == 'Rejected') {
                                bid.tab = 'Failed'
                                if (bid.rejectedAt) {
                                    //bid.currentcomment = 'Your bid is Rejected on ' + commonService.longDateFormat((new Date(bid.rejectedAt)))
                                    bid.currentcomment = 'Your bid is Rejected on ' + commonService.longDateFormat((new Date(bid.rejectedAt)))
                                } else {
                                    bid.currentcomment = 'Your bid is Rejected'
                                }
                                bid.commentIn = 'Red'
                            } else if (bid.status == 'Accepted') {
                                bid.tab = 'Active'
                                var acceptComment = ''

                                var payqry = {}
                                payqry.bidId = bid.id
                                payqry.type = {
                                    $ne: 'Earnest'
                                }

                                Bidspayment.find(payqry).sort('paymentDueDate ASC').then(function (payments) {

                                    var commentsecondpart = '';
                                    var toAdd = false;
                                    var breakLoop = false;
                                    payments.forEach((payment, i) => {
                                        if (breakLoop == false) {
                                            if (toAdd == false) {
                                                commentsecondpart = ''
                                            } else {
                                                commentsecondpart = commentsecondpart + ' '
                                            }
                                            if (payment.status == 'Verified') {
                                                toAdd = true
                                                commentsecondpart = commentsecondpart + 'Your ' + payment.name + ' is Verified.'

                                                if (i == payments.length - 1) {
                                                    if (bid.popId) {
                                                        if (bid.popId.allApprovedByBuyer == false) {
                                                            commentsecondpart = 'All your payments are verified. Please look into acceptance of your product.'
                                                            bid.commentIn = 'Yellow'
                                                        } else {
                                                            if (bid.ETD) {
                                                                commentsecondpart = 'All your process is done. Estimate date for dispatch of your product is ' + commonService.longDateFormat((new Date(bid.ETD)))
                                                                bid.commentIn = 'Green'
                                                                if (bid.ETA) {
                                                                    commentsecondpart = commentsecondpart + ' and estimate time for arrival of your product is ' + commonService.longDateFormat((new Date(bid.ETA)))
                                                                }
                                                            } else {
                                                                bid.commentIn = 'Green'
                                                                commentsecondpart = 'All your process is done. We will dispatch your product soon.'
                                                            }
                                                        }
                                                    }
                                                }
                                            } else if (payment.status == 'Overdue') {
                                                toAdd = false
                                                commentsecondpart = commentsecondpart + 'Your ' + payment.name + ' is Overdue. Please pay it soon to avoid cancellation of bid.'
                                                bid.commentIn = 'Red'

                                                breakLoop = true

                                            } else if (payment.status == 'Paid') {
                                                toAdd = true
                                                commentsecondpart = commentsecondpart + 'Thank You for paying ' + payment.name + '. We will verify this soon.'
                                                bid.commentIn = 'Green'
                                            } else if (payment.status == 'Due') {
                                                console.log("payment.type", payment.type);
                                                console.log("payment.paymentDueDate  ", payment.paymentDueDate);
                                                toAdd = false
                                                if (i == 0) {
                                                    acceptComment = 'Congratulations! Your bid is Accepted by Franchisee on ' + commonService.longDateFormat((new Date(bid.acceptedAt)))
                                                }
                                                if (payment.type == "Deposit") {
                                                    console.log("payment.paymentDueDate  ", payment.paymentDueDate);
                                                    if (payment.paymentDueDate) {
                                                        commentsecondpart = commentsecondpart + 'Your ' + payment.name + ' consisting of ₹' + payment.amount + ' is Due on ' + commonService.longDateFormat((new Date(payment.paymentDueDate)))
                                                        breakLoop = true;
                                                    } else {
                                                        commentsecondpart = commentsecondpart + " Your product is ready to dispatch and you will be informed once its dispatched";
                                                        breakLoop = true;
                                                    }
                                                } else if (payment.type == "Final") {
                                                    // console.log("payment.type  == final");
                                                    if (payment.paymentDueDate) {
                                                        commentsecondpart = commentsecondpart + 'Your ' + payment.name + ' consisting of ₹' + payment.amount + ' is Due on ' + commonService.longDateFormat((new Date(payment.paymentDueDate)))
                                                    }
                                                }

                                                // console.log("bid.acceptedAt", bid.acceptedAt);
                                                // console.log("payment.paymentDueDate",payment.paymentDueDate);
                                                bid.commentIn = 'Green'

                                            }
                                        }
                                    })
                                    if (acceptComment.length > 0) {
                                        acceptComment = acceptComment + ". "
                                    }
                                    acceptComment = acceptComment + commentsecondpart
                                    bid.currentcomment = acceptComment
                                    bid.afterEtdComment = "";
                                    if (bid.ETD) {
                                        bid.afterEtdComment = " Your product estimated shipping date is " + commonService.longDateFormat((new Date(bid.ETD))) + " and ready to dispatch and you will be informed once its dispatched";
                                    }

                                    // console.log("bid===",bid)
                                    callback()
                                }).fail(function (err) {
                                    callback()
                                })
                            } else if (bid.status == 'Dispatched') {
                                bid.tab = 'Active'
                                if (bid.ATD) {
                                    bid.currentcomment = 'Your input order is Dispatched on ' + commonService.longDateFormat((new Date(bid.ATD))) + "."
                                } else {
                                    bid.currentcomment = 'Your input order is Dispatched.'
                                }

                                if (bid.logisticsOption == 'self') {
                                    //bid.currentcomment = bid.currentcomment + ' Please accept it within 48 hours or else it will be considered as Received.'
                                    bid.currentcomment = ' Your product is handed over to you, please accept it as received within 48 hours of handed over'
                                }
                                bid.commentIn = 'Green'
                            } else if (bid.status == 'Delivered') {
                                bid.tab = 'Delivered'
                                if (bid.ATA) {
                                    bid.currentcomment = 'Your input order is Delivered on ' + commonService.longDateFormat((new Date(bid.ATA))) + '. Please accept it within 48 hours or else it will be considered as Received.'
                                } else {
                                    bid.currentcomment = 'Your input order is Delivered' + '. Please accept it within 48 hours or else it will be considered as Received.'
                                }
                                bid.commentIn = 'Green'
                            } else if (bid.status == 'Received') {

                                // console.log("bid.bid.bid.", bid.id)
                                // Bidspayment.find({ bidId: bid.id, status: { $in: ['Due','Overdue']} ,type: "Final" })
                                bid.tab = 'Delivered'
                                if (bid.receivedDate) {
                                    bid.currentcomment = 'You received your input on ' + commonService.longDateFormat((new Date(bid.receivedDate))) + '.';
                                } else {
                                    bid.currentcomment = 'You have received your input.'
                                }

                                if (bid.buyerpayments.length > 0) {
                                    let bidsInputpaymentsReceived = bid.buyerpayments;
                                    bid.currentcomment = bid.currentcomment + ' Your ' + bidsInputpaymentsReceived[0].name + 'payment is ' + bidsInputpaymentsReceived[0].status + ' amount ' + bidsInputpaymentsReceived[0].amount + '.';
                                    bid.currentcomment = bid.currentcomment + 'Please pay on time.';
                                }
                                // Bidspayment.findOne({ bidId: bid.id, status: 'Due', type: "Final" })
                                //             .then(function(bidsInputpaymentsReceived) {
                                // var toAdd = false ;
                                // var breakLoop = false ;
                                // // BY romy
                                // console.log("bidsInputpaymentsReceived", bidsInputpaymentsReceived) ;


                                // if(breakLoop == false){
                                //     bid.currentcomment = bid.currentcomment + ' Your '+bidsInputpaymentsReceived.name +'payment is '+ bidsInputpaymentsReceived.status + ' amount ' + bidsInputpaymentsReceived.amount+'.';
                                //     bid.currentcomment = bid.currentcomment + 'Please pay on time.' ;
                                //     breakLoop = true ;
                                // }
                                // // console.log("bidbidbidbid", bid) ;
                                // // callback() ;
                                // }); 

                                bid.commentIn = 'Green';
                            } else {
                                bid.tab = 'Failed'
                                bid.currentcomment = ' '
                                bid.commentIn = 'Red'
                            }
                            if (bid.tab == 'Failed') {
                                var findTransactionQry = {}
                                findTransactionQry.bidId = bid.id
                                findTransactionQry.paymentType = "PayTm"
                                Transactions.findOne(findTransactionQry).then(function (bidTransactions) {
                                    if (bidTransactions) {
                                        bid.transactionStatus = bidTransactions
                                    }
                                    callback();
                                }).fail(function (transErr) {
                                    callback();
                                })
                            } else if (bid.status != 'Accepted') {
                                callback();
                            }
                        }).fail(function (error) {
                            callback(error);
                        });
                    }
                    else {
                        callback();
                    }
                }, function (error) {
                    console.log("error", error);
                    if (error) {
                        return res.status(400).jsonx({
                            success: false,
                            error: error,
                        });
                    } else {
                        return res.status(200).jsonx({
                            success: true,
                            data: bids,
                        });
                    }
                });
            }).fail(function (err) {
                console.log("error", err);
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            });
    },

    //exists
    getAllInputs: function (req, res, next) {

        var list = req.param('list');
        var search = req.param('search');
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var sortBy = req.param('sortBy');
        var approve = req.param('approve');

        var query = {};
        var sortquery = {};

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
        }
        count = parseInt(count);

        sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        query.isDeleted = false;

        if (search) {
            query.$or = [
                { name: { $regex: search, '$options': 'i' } },
                { code: parseInt(search) },
                { dealer: { $regex: search, '$options': 'i' } },
                { dealerCode: { $regex: search, '$options': 'i' } },
                { category: { $regex: search, '$options': 'i' } },
                { parentCategory: { $regex: search, '$options': 'i' } },
                { company: { $regex: search, '$options': 'i' } },
                { variety: { $regex: search, '$options': 'i' } },
                { price: parseFloat(search) }
            ]
        }

        if (req.param('createdAtFrom') && req.param('createdAtTo')) {
            query.$and = [{
                createdAt: {
                    $gte: new Date(req.param('createdAtFrom'))
                }
            }, {
                createdAt: {
                    $lte: new Date(req.param('createdAtTo'))
                }
            }]
        }

        if (approve) {
            if (approve == 'true') {
                query.isApproved = true;
                query.isExpired = false;
            } else if (approve == 'false') {
                query.isApproved = false;
                query.isExpired = false;
            }
        }

        Inputs.native(function (err, inputlist) {
            inputlist.aggregate([
                {
                    $lookup: {
                        from: "category",
                        localField: "category",
                        foreignField: "_id",
                        as: "category"
                    }
                },
                {
                    $unwind: {
                        path: '$category',
                        preserveNullAndEmptyArrays: true
                    },
                },
                {
                    $lookup: {
                        from: "category",
                        localField: "category.parentId",
                        foreignField: "_id",
                        as: "parentCategory"
                    }
                },
                {
                    $unwind: '$parentCategory'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'dealer',
                        foreignField: '_id',
                        as: "dealer"
                    }
                },
                {
                    $unwind: '$dealer'
                },
                {
                    $project: {
                        id: "$_id",
                        code: "$code",
                        name: "$name",
                        dealer: "$dealer.fullName",
                        dealerId: "$dealer._id",
                        dealerCode: "$dealer.sellerCode",
                        company: "$company",
                        category: "$category.name",
                        parentCategory: "$parentCategory.name",
                        variety: "$variety",
                        price: "$price",
                        images: "$images",
                        isDeleted: "$isDeleted",
                        createdAt: "$createdAt",
                        isFeatured: "$isFeatured",
                        isApproved: "$isApproved",
                        isExpired: "$isExpired",
                        isActive: "$isActive",
                        availableQuantity: "$availableQuantity",
                        minimumQuantityToPurchase: "$minimumQuantityToPurchase",
                        workingUnit: "$workingUnit",
                        soldQuantity: "$soldQuantity",
                        availableTill: "$availableTill"
                    }
                },
                {
                    $match: query
                }
            ], function (err, totalresults) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {

                    var results = totalresults.slice(skipNo, skipNo + count)

                    async.each(results, function (input, callback) {
                        let query = {};
                        query = { input: { $in: [input.id] } };
                        Orderedcarts.find(query).then(function (suborders) {
                            input["subOrdersLenght"] = suborders.length;
                            callback();
                        }).fail(function (error) {
                            callback(error);
                        });
                    }, function (error) {
                        if (error) {
                            return res.status(400).jsonx({
                                success: false,
                                error: error,
                            });
                        } else {
                            return res.jsonx({
                                success: true,
                                data: {
                                    inputs: results,
                                    total: totalresults.length
                                },
                            });
                        }
                    });
                }
            });
        })
    },

    //exists
    inputsByUser: function (req, res) {
        var query = {};
        query.isDeleted = false;
        query.isApproved = true;
        query.isActive = true;
        query.isExpired = false;
        // var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        query.dealer = req.param('user');

        if (req.param('inputId')) {
            query.id = { "$nin": [req.param('inputId')] };
        }

        Inputs.find(query).sort("createdAt desc").populate('category').exec(function (err, inputs) {
            if (err) {
                res.status(400).jsonx({
                    success: false,
                    error: err
                })
            } else {
                return res.jsonx({
                    success: true,
                    data: inputs
                })
            }
        })
    },

    frontInputs: function (req, res, next) {
        //const {ObjectId} = require('mongodb');

        var list = req.param('list');
        var search = req.param('search');
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var sortBy = req.param('sortBy');
        var user = req.param('user');
        //var catgIds = req.param('categories');
        var district = req.param('district');
        var state = req.param('state');
        var verified = req.param('verified');
        var minprice = req.param('minPrice');
        var maxprice = req.param('maxPrice');
        var type = req.param('type');
        var catgIds;
        var districtName;
        let categories = [];
        var varieties;
        if (req.param('categoryIds')) catgIds = JSON.parse(req.param('categoryIds'));
        // if(req.param('district')) districtName = JSON.parse(req.param('district')); 
        // districtName = req.param('district');
        let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        if (req.param('categoryIds')) {
            let parsedcatgIds = JSON.parse(req.param('categoryIds'));
            catgIds = []

            parsedcatgIds.forEach((obj, i) => {
                catgIds.push(obj)
            })
        }
        if (req.param('variety')) {
            varieties = JSON.parse(req.param('variety'));
        }

        var query = {};
        var sortquery = {};

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];

            sortquery[field ? field : field] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        } else {
            sortquery[field ? field : 'createdAt'] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;
        }
        count = parseInt(count);
        query.isDeleted = false;
        // query.isApproved = true;
        // query.soldOut = false;
        // query.paymentId = null;

        if (search) {
            query.$or = [
                { name: { $regex: search, '$options': 'i' } },
                { user: { $regex: search, '$options': 'i' } },
                { category: { $regex: search, '$options': 'i' } },
                { manufacturer: { $regex: search, '$options': 'i' } },
                // { district:{$regex: search, '$options' : 'i'}},
                // { state:{$regex: search, '$options' : 'i'}},
                { city: { $regex: search, '$options': 'i' } },
                { variety: { $regex: search, '$options': 'i' } },
                { priceUnit: parseFloat(search) },
                { price: parseFloat(search) }
            ]
        }
        // Filter on Category
        if (catgIds != undefined && catgIds.length > 0) {
            query.categoryID = { "$in": catgIds };   //['hskhfs','hsflh']
            // if(!query.$or) query.$or = [];
            // query.$or.push({category:{"$in" : catgIds}})
        }
        //  if(catgIds != undefined && catgIds.length > 0){
        //     query.categoryID = {"$in" : catgIds};   //['hskhfs','hsflh']
        // }
        console.log("districtName", districtName);
        if (districtName != "") {
            /* && districtName.length > 0*/
            // query.district = {"$in" : districtName}; //['hskhfs','hsflh']  
            // query.district = districtName; // 'hsflh'

        }

        if (state != undefined && state != '') { //state  != '' added by Rahul sharma
            query.state = state
        }

        if (verified == 'yes') {
            query.isVerified = true;
        } // in case of else both true and false data is showing at frontend. 

        if (minprice != '' && maxprice != '') {
            query.totalPrice = { $gte: parseInt(minprice), $lte: parseInt(maxprice) };
        }

        if (minprice != '' && maxprice == '') {
            query.totalPrice = { $gte: parseInt(minprice) };
        }

        if (maxprice != '' && minprice == '') {
            query.totalPrice = { $lte: parseInt(maxprice) };
        }

        let qryArray = [];
        if (varieties != undefined && varieties.length > 0) {
            qryArray.push({ variety: { "$in": varieties } });
        }

        if (qryArray.length > 0) {
            query.$or = qryArray
        }

        if (type != '') {
            query.type = type;
        }

        Inputs.native(function (err, inputlist) {
            inputlist.aggregate([
                {
                    $lookup: {
                        from: "category",
                        localField: "category",
                        foreignField: "_id",
                        as: "category"
                    }
                },
                {
                    $unwind: {
                        path: '$category',
                        preserveNullAndEmptyArrays: true
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user',
                        foreignField: '_id',
                        as: "user"
                    }
                },
                {
                    $unwind: '$user'
                },
                {
                    $lookup: {
                        from: 'manufacturer',
                        localField: 'manufacturer',
                        foreignField: '_id',
                        as: "manufacturer"
                    }
                },
                {
                    $unwind: {
                        path: '$manufacturer',
                        preserveNullAndEmptyArrays: true
                    },
                },
                {
                    $project: {
                        id: "$_id",
                        name: "$name",
                        user: "$user.fullName",
                        userId: "$user._id",
                        manufacturer: "$manufacturer.name",
                        district: "$district",
                        city: "$city",
                        state: "$state",
                        category: "$category.name",
                        categoryID: "$categoryID",
                        variety: "$variety",
                        price: "$price",
                        priceUnit: "$priceUnit",
                        images: "$images",
                        isDeleted: "$isDeleted",
                        createdAt: "$createdAt"
                    }
                },
                {
                    $match: query
                }
            ], function (err, totalresults) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {

                    inputlist.aggregate([
                        {
                            $lookup: {
                                from: "category",
                                localField: "category",
                                foreignField: "_id",
                                as: "category"
                            }
                        },
                        {
                            $unwind: {
                                path: '$category',
                                preserveNullAndEmptyArrays: true
                            },
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'user',
                                foreignField: '_id',
                                as: "user"
                            }
                        },
                        {
                            $unwind: '$user'
                        },
                        {
                            $lookup: {
                                from: 'manufacturer',
                                localField: 'manufacturer',
                                foreignField: '_id',
                                as: "manufacturer"
                            }
                        },
                        {
                            $unwind: {
                                path: '$manufacturer',
                                preserveNullAndEmptyArrays: true
                            },
                        },
                        {
                            $project: {
                                id: "$_id",
                                name: "$name",
                                user: "$user.fullName",
                                userId: "$user._id",
                                manufacturer: "$manufacturer.name",
                                district: "$district",
                                city: "$city",
                                state: "$state",
                                category: "$category.name",
                                categoryID: "$categoryID",
                                variety: "$variety",
                                price: "$price",
                                priceUnit: "$priceUnit",
                                images: "$images",
                                isDeleted: "$isDeleted",
                                createdAt: "$createdAt"
                            }
                        },
                        {
                            $match: query
                        },
                        {
                            $sort: sortquery
                        },
                        {
                            $skip: skipNo
                        },
                        {
                            $limit: count
                        }
                    ], function (err, results) {
                        if (err) {
                            return res.status(400).jsonx({
                                success: false,
                                error: err
                            });
                        } else {
                            return res.jsonx({
                                success: true,
                                data: {
                                    inputs: results,
                                    total: totalresults.length
                                },
                            });
                        }
                    });
                }
            });

        })
    },
    inputPostPayTm: function (req, res) {
        // console.log("arun=====");
        // return 1;
        const reqHOst = req.headers.origin;
        var paramlist = req.body;
        /*return res.json({
                success: true,
                data: { "MID" : "EFARME78610588610733",
                        "ORDER_ID" : "ORDS82731829",
                        "CUST_ID" : "CUST001",
                        "INDUSTRY_TYPE_ID" : "Retail109" ,
                        "CHANNEL_ID" : "WAP",
                        "TXN_AMOUNT" : 1,
                        "WEBSITE" : "APPPROD",
                        "CALLBACK_URL" : "https://securegw.paytm.in/theia/paytmCallback?ORDER_ID=ORDS82731829",
                        "CHECKSUMHASH" : "R5arTsbaEXFt+6BEn3VuEl9L7aLahWaOyxyyASyb44OyUgKYlG0mAdK/6jsVjIF83t/3NYMtfhZ2LJS1Bj67b+CdOd4jza+++fP7v1EdnoQ="
                        }
            });*/

        var paramarray = new Array();
        var code = commonService.getUniqueCode();
        code = "ORD_" + code;
        if (req.body.ENV == "" && req.body.ENV == undefined) {
            return res.json({
                success: false,
                msg: "ENV is required"
            });
        }

        let envPaytm = req.body.ENV;

        paramlist['ORDER_ID'] = code;
        paramlist['CUST_ID'] = req.identity.id;
        paramlist['INDUSTRY_TYPE_ID'] = constantObj.paytm_config[envPaytm].INDUSTRY_TYPE_ID;
        //paramlist['PAYTM_MERCHANT_KEY'] = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;
        paramlist['MID'] = constantObj.paytm_config[envPaytm].MID;
        if (paramlist['CHANNEL_ID'] == 'WEB') {
            paramlist['MOBILE_NO'] = constantObj.paytm_config[envPaytm].PAYTM_MOBILE;
            paramlist['EMAIL'] = constantObj.paytm_config[envPaytm].PAYTM_EMAIL;
        }

        var itemId = paramlist['ITEM_ID'];
        delete paramlist['ITEM_ID'];
        delete paramlist['ENV'];

        var paramArray = {};
        for (name in paramlist) {
            console.log("name", name)
            if (name == 'PAYTM_MERCHANT_KEY') {
                var PAYTM_MERCHANT_KEY = paramlist[name];
            } else {
                paramarray[name] = paramlist[name];
            }
            paramArray[name] = paramlist[name];
        }

        if (paramlist['CHANNEL_ID'] == 'WEB') {
            paramarray['CALLBACK_URL'] = sails.config.PAYTM_API_URL + '/input-paytmresponse/' + itemId + '?origin=' + reqHOst + '&env=' + envPaytm; // in case if you want to send callback
        } else {
            if (envPaytm == "production") {
                paramarray['CALLBACK_URL'] = "https://securegw.paytm.in/theia/paytmCallback?ORDER_ID=" + code;
            } else {
                paramarray['CALLBACK_URL'] = "https://securegw-stage.paytm.in/theia/paytmCallback?ORDER_ID=" + code;
            }
        }

        let paytm_key = constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY;
        Payments.genchecksum(paramarray, paramArray, paytm_key, function (err, result) {
            return res.json({
                success: true,
                data: result.paramArray
            });
        });
    },

    inputResponsePayTm: function (req, res) {
        var request = require('request');
        var itemID = req.param("id");
        var origin = req.query.origin;
        var envPaytm = req.query.env;
        var paramlist = req.body;
        var transactId = paramlist.TXNID;
        var paramarray = new Array();
        var paramArray = {};
        Bidspayment.findOne({ id: itemID }).then(function (bid) {
            if (paramlist.STATUS == 'TXN_SUCCESS') {

                if (Payments.verifychecksum(paramlist, constantObj.paytm_config[envPaytm].PAYTM_MERCHANT_KEY)) {

                    var transactionData = {};
                    transactionData.transactionId = transactId;
                    transactionData.paymentjson = paramlist;
                    transactionData.processStatus = paramlist.STATUS
                    transactionData.productType = "input";
                    transactionData.input = itemID;


                    let bidpayment = {};
                    BidService.transectionCreate(transactionData).then(function (paymentsData) {

                        let txnId = paymentsData.id;

                        let paymentData = {}
                        paymentData.paymentDate = new Date()
                        paymentData.depositedOn = new Date()
                        paymentData.isVerified = true
                        paymentData.transactionId = paymentsData.id
                        paymentData.paymentMode = 'PayTm'
                        paymentData.status = 'Verified';
                        Bidspayment.update({ id: itemID }, paymentData).then(function (bidpayment) {

                            let url = origin + '/inputs/orderpayments/' + bid.suborder;

                            return res.redirect(url);
                        });
                    });

                } else {
                    let url = origin + '/inputs/orderpayments/' + bid.suborder
                    return res.redirect(url);
                };
            } else {
                let url = origin + '/inputs/orderpayments/' + bid.suborder
                return res.redirect(url);
            }
        })
    },

    //exists
    featuredInput: function (req, res) {

        var pincode = req.param('pincode');

        var featured = {}
        featured.isFeatured = true;
        featured.isDeleted = false;
        featured.isApproved = true;
        featured.isExpired = false;
        featured.isActive = true;

        if (pincode) {
            Market.find({ select: ['id'], where: { pincode: { "$in": [JSON.parse(pincode)] } } }).then(function (markesId) {
                if (markesId.length > 0) {
                    let markets = []
                    //  let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
                    for (var i = 0; i < markesId.length; i++) {
                        markets.push(markesId[i].id)
                    }
                    featured.availableForFranchisees = { "$in": markets }
                    InputService.findFeaturedInputs(featured, markets, req, res)
                } else {
                    InputService.findFeaturedInputs(featured, [], req, res)
                }
            })
        } else {
            InputService.findFeaturedInputs(featured, [], req, res)
        }
    },

    //exists
    inputsAtFranchisee: function (req, res) {
        var featured = {}
        featured.isDeleted = false;
        featured.isApproved = true;
        featured.isExpired = false;
        featured.isActive = true;

        let mktId = req.param('marketId')

        if (mktId) {
            featured.availableForFranchisees = { "$in": [mktId] }
            InputService.inputsAtFranchisee(featured, req, res)
        } else {
            return {
                success: false,
                error: {
                    code: 404,
                    message: 'Market id not available',
                    key: 'NOT_FOUND',
                }
            };
        }
    }
};