/**
  * #DESC:  In this class/files inputs related functions
  * #Request param: inputs add form data values
  * #Return : Boolen and sucess message
  * #Author: Rohitk.kumar
  */

var Promise = require('bluebird'),
    promisify = Promise.promisify
    ;
var constantObj = sails.config.constants;
var commonServiceObj = require('./commonService');
var pushService = require('./PushService');
let payments = {};
let sellerData = {};
var distance = require('google-distance-matrix');
var ObjecttId = require('mongodb').ObjectID;
var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;



let updateSellerCodeFirstTime = function (sellerId, indo) {
    console.log("first time update seller code", sellerId, "indoindoindo", indo);

    let sellerCode = commonServiceObj.getOrderCode("FRC");
    if (indo == "yes") {
        return Users.update({ id: sellerId }, { sellerCode: sellerCode }).then(function (res) {
            return res;
        });
    } else {
        return true;
    }
};


let getSellerInfo = function (inputId) {

    return Inputs.findOne({ id: inputId }).then(function (res) {

        return res;
    });
};

let inputBidTransectionCreate = function (reqData) {

    // reqData.transectionId
    // reqData.amount
    // reqData.paymentType
    // reqData.status

    if (!reqData.transectionId & !reqData.status) {
        return true;
    } else {
        return Transactions.create(reqData).then(function (res) {
            return res;
        });
    }
};

module.exports = {



    similarInput: function (data, context, req, res) {
        let query = {};
        query.isApproved = true;
        query.category = data.category;
        query.pincode = data.pincode;
        query.isExpired = false;

        let datetime = new Date()

        var count = 5;
        var skipNo = 0;
        // console.log(query)
        Inputs.find(query).sort({ createdAt: -1 }).skip(skipNo).limit(count).exec(function (err, input) {

            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {

                return res.jsonx({
                    success: true,
                    data: input
                });
            }
        })
    },


    inputSearch: function (markets, req, res) {

        var pincode = req.param('pincode');

        var search = req.param('search');
        var minprice = req.param('minprice');
        var maxprice = req.param('maxprice');
        var minquantity = req.param('minquantity');
        var maxquantity = req.param('maxquantity');
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var sortBy = req.param('sortBy');
        var inputId = req.param('inputId');

        count = parseInt(count);
        var catgIds;
        var varieties;

        let ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
        if (req.param('categoryIds')) {
            let parsedcatgIds = JSON.parse(req.param('categoryIds'));
            catgIds = []

            parsedcatgIds.forEach((obj, i) => {
                catgIds.push(ObjectId(obj))
            })
        }
        if (req.param('variety')) {
            varieties = JSON.parse(req.param('variety'));
        }

        var qry = {};
        qry.isDeleted = false;
        qry.isApproved = true;
        qry.isExpired = false;
        qry.isActive = true
        if (inputId) {
            qry.id = { "$nin": [ObjectId(inputId)] };
        }

        if (markets != undefined && markets.length > 0) {
            qry.availableForFranchisees = { "$in": markets }
        }

        var sortquery = {};

        if (sortBy) {
            var typeArr = new Array();
            typeArr = sortBy.split(" ");
            var sortType = typeArr[1];
            var field = typeArr[0];
            if (field == 'userRating') {
                field = 'users.avgRating'
            }
        }
        sortquery[field ? field : "createdAt"] = sortType ? (sortType == 'desc' ? -1 : 1) : -1;

        var qryArray = []

        if (search) {
            qryArray.push({ code: parseInt(search) })
            qryArray.push({ name: { $regex: search, '$options': 'i' } })
            // qryArray.push({ parentcategory:{$regex: search, '$options' : 'i'}})
            qryArray.push({ category: { $regex: search, '$options': 'i' } })
            qryArray.push({ variety: { $regex: search, '$options': 'i' } })
        }

        if (minprice != undefined && minprice != "" && maxprice != undefined && maxprice != "") {
            qry.price = { $gte: parseFloat(minprice), $lte: parseFloat(maxprice) };
        }

        if (minquantity != undefined && maxquantity != undefined && minquantity != "" && maxquantity != "") {
            qry.$and = [{ quantity: { $gte: parseFloat(minquantity) } }, { quantity: { $lte: parseFloat(maxquantity) } }];
        } else if (minquantity != undefined && minquantity != "") {
            qry.availableQuantity = { $gte: parseFloat(minquantity) }
        } else if (maxquantity != undefined && maxquantity != "") {
            qry.availableQuantity = { $lte: parseFloat(maxquantity) }
        }

        if (catgIds != undefined && catgIds.length > 0) {
            qryArray.push({ categoryId: { "$in": catgIds } });
            qryArray.push({ parentcategoryId: { "$in": catgIds } });
        }
        if (varieties != undefined && varieties.length > 0) {
            qryArray.push({ variety: { "$in": varieties } })
        }

        if (qryArray.length > 0) {
            qry.$or = qryArray
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
                    $unwind: '$category'
                },

                {
                    $lookup: {
                        from: 'category',
                        localField: 'category.parentId',
                        foreignField: '_id',
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
                        as: 'users'
                    }
                },
                {
                    $unwind: '$users'
                },

                {
                    $project: {
                        id: "$_id",
                        variety: "$variety",
                        upfrontPercent: "$upfrontPercent",
                        taxRate: "$taxRate",
                        state: "$state",
                        price: "$price",
                        highestBid: "$highestBid",
                        name: "$name",
                        City: "$city",
                        State: "$state",
                        District: "$district",
                        Address: "$address",
                        bidEndDate: "$bidEndDate",
                        images: "$images",
                        isDeleted: "$isDeleted",
                        isExpired: "$isExpired",
                        isApproved: "$isApproved",
                        isActive: "$isActive",
                        createdAt: "$createdAt",
                        viewed: "$viewed",
                        verified: "$verified",
                        userFullname: "$users.fullName",
                        userFirstname: "$users.firsname",
                        userImage: "$users.image",
                        userId: "$users._id",
                        userEmail: "$users.username",
                        userState: "$users.state",
                        userCity: "$users.city",
                        userDistricts: "$users.district",
                        userRating: "$users.avgRating",
                        userPincode: "$users.pincode",
                        workingUnit: "$workingUnit",
                        quantity: "$quantity",
                        leftAfterAcceptanceQuantity: "$leftAfterAcceptanceQuantity",
                        leftAfterDeliveryQuantity: "$leftAfterDeliveryQuantity",
                        category: "$category.name",
                        categoryId: "$category._id",
                        soldOut: "$soldOut",
                        parentcategory: "$parentCategory.name",
                        parentcategoryId: "$parentCategory._id",
                        availableForFranchisees: "$availableForFranchisees",
                    }
                },
                {
                    $match: qry
                }
            ], function (err, totalresults) {

                var finalResult = totalresults.slice(skipNo, skipNo + count)
                
                return res.status(200).jsonx({
                    success: true,
                    data: {
                        inputs: finalResult,
                        total: totalresults.length
                    }
                });              
            })
        })
    },

    categoryBased: function (markets, category, req, res) {
        var query = {};
        query.isDeleted = false;
        query.isApproved = true;
        query.isExpired = false;
        query.isActive = true

        let cropcount = parseInt(req.param('inputscount'))
        let croppage = parseInt(req.param('inputspage'))
        var cropskipNo = (croppage - 1) * cropcount;


        if (markets != undefined && markets.length > 0) {
            query.availableForFranchisees = { "$in": markets }
        }        
        
        if (category.parentId == undefined || category.parentId == null) {
            query.parentCategoryId = ObjectId(category.id)
        } else {
            query.categoryId = ObjectId(category.id)
        }
        query.availableQuantity = { $gt: 0 }
                                            
        Inputs.native(function (err, allcrops) {
            allcrops.aggregate([
                {
                    $lookup: {
                        from: 'category',
                        localField: 'category',
                        foreignField: '_id',
                        as: "category"
                    }
                },
                {
                    $unwind: '$category'
                },
                {
                    $lookup: {
                        from: 'category',
                        localField: 'category.parentId',
                        foreignField: '_id',
                        as: "parentCategory"
                    }
                },
                {
                    $unwind: '$parentCategory'
                },
                {
                    $project: {
                        category: "$category.name",
                        parentCategory: "$parentCategory.name",
                        parentCategoryId: "$parentCategory._id",
                        categoryId: "$category._id",
                        id: "$_id",
                        variety: "$variety",
                        upfrontPercent: "$upfrontPercent",
                        taxRate: "$taxRate",
                        state: "$state",
                        price: "$price",
                        highestBid: "$highestBid",
                        name: "$name",
                        City: "$city",
                        State: "$state",
                        District: "$district",
                        Address: "$address",
                        bidEndDate: "$bidEndDate",
                        images: "$images",
                        isDeleted: "$isDeleted",
                        isExpired: "$isExpired",
                        isApproved: "$isApproved",
                        isActive: "$isActive",
                        createdAt: "$createdAt",
                        viewed: "$viewed",
                        verified: "$verified",
                        workingUnit: "$workingUnit",
                        quantity: "$quantity",
                        leftAfterAcceptanceQuantity: "$leftAfterAcceptanceQuantity",
                        availableQuantity: "$availableQuantity",
                        availableForFranchisees: "$availableForFranchisees"                        
                    }
                },
                {
                    $match: query
                }
            ], function (err, crops) {
                if (err) {
                    return res.status(200).jsonx({
                        success: true,
                        data: category
                    });
                } else {
                    var finalResult = crops.slice(cropskipNo, cropskipNo + cropcount)
                    category.inputs = finalResult
                    category.totalInputs = crops.length
                                                    
                    return res.status(200).jsonx({
                        success: true,
                        data: category
                    });
                }
            })
        });
    },

    InputCategoriesAndProducts: function (markets, req, res) {
        var query = {}
        query.isDeleted = false
        query.isApproved = true
        query.isExpired = false
        query.isActive = true

        // query.leftAfterAcceptanceQuantity = { $gte: 10 }
        if (markets != undefined && markets.length > 0) {
            query.availableForFranchisees = { "$in": markets }
        }

        let catcount = parseInt(req.param('categoryCount'));
        let inputcount = parseInt(req.param('inputCount'));

        let pincode = req.param('pincode')

        Inputs.native(function (error, inputsList) {
            inputsList.aggregate([
                {
                    $match: query
                },
                {
                    $lookup: {
                        from: "category",
                        localField: "category",
                        foreignField: "_id",
                        as: "category"
                    }
                },
                {
                    $unwind: "$category"
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
                    $project: {
                        parentcategory: "$parentCategory.name",
                        parentcategoryId: "$parentCategory._id",
                        categoryName: "$category.name",
                        categoryId: "$category._id",
                        categoryimage: "$category.image",
                        categorybannerImage: "$category.bannerImage",
                        categoryiconImage: "$category.iconImage",
                        parentCategoryimage: "$parentCategory.image",
                        parentCategorybannerImage: "$parentCategory.bannerImage",
                        parentCategoryiconImage: "$parentCategory.iconImage",
                        parentCategoryprimaryColor: "$parentCategory.primaryColor",
                        parentCategorysecondaryColor: "$parentCategory.secondaryColor",
                        categoryprimaryColor: "$category.primaryColor",
                        categorysecondaryColor: "$category.secondaryColor",
                        id: "$_id",
                        price: "$price",
                        name: "$name",
                        code: "$code",
                        endDate: "$endDate",
                        quantity: "$quantity",
                        quantityUnit: "$quantityUnit",
                        district: "$district",
                        availableFrom: "$availableFrom",
                        leftAfterAcceptanceQuantity: "$leftAfterAcceptanceQuantity",
                        leftAfterDeliveryQuantity: "$leftAfterDeliveryQuantity",
                        images: "$images",
                        coverImage: "$coverImage",
                        bidEndDate: "$bidEndDate",
                        isFeatured: "$isFeatured",
                        variety: "$variety",
                        workingUnit: "$workingUnit",
                        availableForFranchisees: "$availableForFranchisees"
                    }
                },
                {
                    $sort: { 'price': 1 }
                },
                {
                    $group: {
                        _id: {
                            parentcategory: "$parentcategory",
                            parentcategoryId: "$parentcategoryId",
                            categoryName: "$categoryName",
                            categoryId: "$categoryId",
                            categoryimage: "$categoryimage",
                            categorybannerImage: "$categorybannerImage",
                            categoryiconImage: "$categoryiconImage",
                            parentCategoryimage: "$parentCategoryimage",
                            parentCategorybannerImage: "$parentCategorybannerImage",
                            parentCategoryiconImage: "$parentCategoryiconImage",
                            parentCategoryprimaryColor: "$parentCategoryprimaryColor",
                            parentCategorysecondaryColor: "$parentCategorysecondaryColor",
                            categoryprimaryColor: "$categoryprimaryColor",
                            categorysecondaryColor: "$categorysecondaryColor"
                        },
                        totalAvailableQuantity: {
                            $sum: "$leftAfterAcceptanceQuantity"
                        },
                        inputs: {
                            $push: {
                                $cond: [
                                    { $ne: ['$isFeatured', false] },
                                    {
                                        id: "$id",
                                        price: "$price",
                                        name: "$name",
                                        categoryId: "$categoryId",
                                        categoryimage: "$categoryimage",
                                        categoryName: "$categoryName",
                                        code: "$code",
                                        endDate: "$endDate",
                                        quantity: "$quantity",
                                        quantityUnit: "$quantityUnit",
                                        district: "$district",
                                        availableFrom: "$availableFrom",
                                        leftAfterAcceptanceQuantity: "$leftAfterAcceptanceQuantity",
                                        leftAfterDeliveryQuantity: "$leftAfterDeliveryQuantity",
                                        images: "$images",
                                        coverImage: "$coverImage",
                                        bidEndDate: "$bidEndDate",
                                        isFeatured: "$isFeatured",
                                        variety: "$variety",
                                        workingUnit: "$workingUnit"
                                    },
                                    null
                                ]
                            }
                        },
                        unfeaturedInputs: {
                            $push: {
                                $cond: [
                                    { $ne: ['$isFeatured', false] },
                                    null,
                                    {
                                        id: "$id",
                                        price: "$price",
                                        name: "$name",
                                        categoryId: "$categoryId",
                                        categoryimage: "$categoryimage",
                                        categoryName: "$categoryName",
                                        code: "$code",
                                        endDate: "$endDate",
                                        quantity: "$quantity",
                                        quantityUnit: "$quantityUnit",
                                        district: "$district",
                                        availableFrom: "$availableFrom",
                                        leftAfterAcceptanceQuantity: "$leftAfterAcceptanceQuantity",
                                        leftAfterDeliveryQuantity: "$leftAfterDeliveryQuantity",
                                        images: "$images",
                                        coverImage: "$coverImage",
                                        bidEndDate: "$bidEndDate",
                                        isFeatured: "$isFeatured",
                                        pincode: "$pincode",
                                        market: "$market",
                                        efarmxComission: "$efarmxComission",
                                        taxRate: "$taxRate",
                                        variety: "$variety",
                                        workingUnit: "$workingUnit"
                                    }
                                ]
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: "$_id",
                        totalAvailableQuantity: '$totalAvailableQuantity',
                        inputs: { "$setDifference": ["$inputs", [null]] },
                        unfeaturedInputs: { "$setDifference": ["$unfeaturedInputs", [null]] },
                        inputsCount: { $size: "$inputs" }
                    }
                },
                {
                    $sort: { 'inputsCount': -1 }
                },
                {
                    $group: {
                        _id: {
                            parentcategory: "$_id.parentcategory",
                            parentcategoryId: "$_id.parentcategoryId",
                            parentCategoryimage: "$_id.parentCategoryimage",
                            parentCategorybannerImage: "$_id.parentCategorybannerImage",
                            parentCategoryiconImage: "$_id.parentCategoryiconImage",
                            parentCategoryprimaryColor: "$_id.parentCategoryprimaryColor",
                            parentCategorysecondaryColor: "$_id.parentCategorysecondaryColor"
                        },
                        subcategories: {
                            $push: {
                                categoryName: "$_id.categoryName",
                                categoryId: "$_id.categoryId",
                                categoryimage: "$_id.categoryimage",
                                categorybannerImage: "$_id.categorybannerImage",
                                categoryiconImage: "$_id.categoryiconImage",
                                inputsCount: "$inputsCount",
                                categoryprimaryColor: "$_id.categoryprimaryColor",
                                categorysecondaryColor: "$_id.categorysecondaryColor",
                                totalAvailableQuantity: '$totalAvailableQuantity'
                            }
                        },
                        featuredInputsCount: { $sum: { $size: "$inputs" } },
                        inputs: {
                            $push: "$inputs"
                        },
                        unfeaturedInputs: {
                            $push: "$unfeaturedInputs"
                        },
                        totalInputs: { $sum: "$inputsCount" }
                    }
                },
                {
                    $project: {
                        parentcategory: "$_id.parentcategory",
                        parentcategoryId: "$_id.parentcategoryId",
                        parentCategoryimage: "$_id.parentCategoryimage",
                        parentCategorybannerImage: "$_id.parentCategorybannerImage",
                        parentCategoryiconImage: "$_id.parentCategoryiconImage",
                        parentCategoryprimaryColor: "$_id.parentCategoryprimaryColor",
                        parentCategorysecondaryColor: "$_id.parentCategorysecondaryColor",
                        _id: 0,
                        categories: { $slice: ["$subcategories", 0, catcount] },
                        categoriesCount: { $size: "$subcategories" },

                        inputs: {
                            $slice: [{
                                $reduce: {
                                    input: "$inputs",
                                    initialValue: {
                                        $cond: [{ $lt: ["$featuredInputCount", inputcount] }, /*{ $slice: [*/{
                                            $reduce: {
                                                input: "$unfeaturedInputs",
                                                initialValue: [],
                                                in: { $concatArrays: ["$$value", "$$this"] }
                                            }
                                        }/*, 0, cropcount - "$featuredCropCount"] }*/, []]
                                    },
                                    in: { $concatArrays: ["$$this", "$$value"] }
                                }
                            }, 0, inputcount]
                        },
                        featuredInputCount: "$featuredInputCount",
                        totalInputs: "$totalInputs"
                    }
                },
                {
                    $sort: { 'categoriesCount': -1 }
                },
            ], function (err, data) {
                if (err) {
                    return res.status(400).jsonx({
                        success: false,
                        error: err
                    });
                } else {
                    return res.status(200).jsonx({
                        success: true,
                        data: data
                    });
                }
            });
        })
    },

    saveInput: function (data, context, req, res) {
        // console.log("1====");
        Settings.find({ type: 'input' }).then(function (settingsAry) {
            // console.log("2====");
            if (settingsAry && settingsAry.length > 0) {
                // console.log("3====");
                data.taxRate = settingsAry[0].input.taxRate
                data.taxes = settingsAry[0].input.taxes
                data.franchiseePercentage = settingsAry[0].input.franchiseePercentage
                data.efarmxComission = settingsAry[0].input.efarmxComission

                data.earnestPercent = settingsAry[0].buyerPayment.stepPaymentEarnestparcentage
                data.depositPayment = settingsAry[0].buyerPayment.stepDepositePayment
                data.finalPaymentDays = settingsAry[0].buyerPayment.stepFinalPaymentDays
                data.finalPaymentPercentage = settingsAry[0].buyerPayment.stepFinalPaymentPercentage
                data.buyergeneralTerms = settingsAry[0].buyerPayment.terms
                data.buyerpaymentTerms = settingsAry[0].buyerPayment.paymentTerms
                data.buyerlogisticTerms = settingsAry[0].buyerPayment.logisticsTerms

                data.sellergeneralTerms = settingsAry[0].sellerPayment.terms
                data.sellerpaymentTerms = settingsAry[0].sellerPayment.paymentTerms
                data.sellerlogisticTerms = settingsAry[0].sellerPayment.logisticsTerms

                data.sellerUpfrontPercentage = settingsAry[0].sellerPayment.upfrontPercentage
                data.sellerUpfrontDays = settingsAry[0].sellerPayment.upfrontDays
                data.sellerFinalPercentage = settingsAry[0].sellerPayment.finalPercentage
                data.sellerFinalDays = settingsAry[0].sellerPayment.finalDays
                data.sellerDepositPayment = settingsAry[0].sellerPayment.depositPayment

            } else {
                // console.log("4====");
                data.taxRate = 18
                data.franchiseePercentage = 1
                data.efarmxComission = 2

                data.earnestPercent = 1
                data.depositPayment = null
                data.finalPaymentDays = 5
                data.finalPaymentPercentage = 99
                data.buyergeneralTerms = ''
                data.buyerpaymentTerms = ''
                data.buyerlogisticTerms = ''

                data.sellergeneralTerms = ''
                data.sellerpaymentTerms = ''
                data.sellerlogisticTerms = ''

                data.sellerUpfrontPercentage = 10
                data.sellerUpfrontDays = 5
                data.sellerFinalPercentage = 90
                data.sellerFinalDays = 15
                data.sellerDepositPayment = null
            }

            data.isApproved = false
            data.isFeatured = false
            data.viewed = 0
            data.isDeleted = false

            data.soldQuantity = 0
            data.leftAfterAcceptanceQuantity = data.availableQuantity;
            code = commonServiceObj.getUniqueCode();
            data.code = code;
            // console.log("5====");
            if (!data.coverPageImage && data.images && data.images.length > 0) {
                data.coverPageImage = data.images[0]
            }

            let franchiseePart = data.price * (data.franchiseePercentage / 100)
            let efarmxComission = data.price * (data.efarmxComission / 100)
            let facilitationTaxes = efarmxComission * (data.taxRate / 100)
            var finalPrice = parseFloat(parseFloat(data.price) + parseFloat(franchiseePart) + parseFloat(efarmxComission) + parseFloat(facilitationTaxes))
            let productTaxes = parseFloat(finalPrice * (data.productTaxRate / 100))

            finalPrice = parseFloat(finalPrice) + parseFloat(productTaxes)

            data.finalPrice = parseFloat((finalPrice).toFixed(2))

            // console.log("6====");
            if (data.availableForFranchisees && data.availableForFranchisees.length > 0) {
                // console.log("7====");
                var markets = []
                for (var i = 0; i < data.availableForFranchisees.length; i++) {
                    // console.log("8====");
                    markets.push((String(data.availableForFranchisees[i])))
                }

                Users.findOne({ id: data.dealer, select: ['address', 'city', 'pincode', 'state', 'district'] }).then(function (dealerinfo) {
                    // console.log("9====", markets);
                    Market.find({ id: { "$in": markets } }).populate('GM').then(function (availableFor) {
                        // console.log("10====", availableFor);
                        var destinations = []
                        var origins = []
                        var origin = dealerinfo.address + ", " + dealerinfo.city + ", " + dealerinfo.district + ", " + dealerinfo.state + ", " + dealerinfo.pincode
                        origins.push(origin)
                        for (var i = 0; i < availableFor.length; i++) {
                            if (availableFor[i].GM) {
                                // console.log("11====");
                                let destination = availableFor[i].GM.address + ", " + availableFor[i].GM.city + ", " + availableFor[i].GM.district + ", " + availableFor[i].GM.state + ", " + availableFor[i].GM.pincode

                                destinations.push(destination)
                                // origins.push(origin)
                            } else {
                                // console.log("12====");
                                destinations.push(availableFor[i].pincode[0])
                                // origins.push(origin)
                            }
                        }

                        let googleApiKey = constantObj.googlePlaces.key;

                        distance.key(googleApiKey);
                        distance.units('metric');

                        let dist = [];
                        let errorMessage = "Input address not valid";
                        let errorFlag = false;

                        distance.matrix(origins, destinations, (err, distances) => {
                            // console.log("13====");
                            // var origin = distances.origin_addresses[i];                            
                            if (!errorFlag) {
                                var destinations = distances.destination_addresses;
                                for (var j = 0; j < destinations.length; j++) {
                                    // console.log("14====");
                                    let mktId = data.availableForFranchisees[j];

                                    var distObj = {}
                                    distObj.productType = 'INPUT'
                                    distObj.market = mktId
                                    distObj.productPriceWithoutMarket = parseFloat((finalPrice).toFixed(2))
                                    if (distances.rows[0].elements[j].status == 'OK') {
                                        // console.log("15====");

                                        let ele = distances.rows[0].elements[j]
                                        let mktShippingPrice = data.shippingPrice * (ele.distance.value / 1000)
                                        let mktFinalPrice = finalPrice + mktShippingPrice

                                        distObj.price = parseFloat((mktFinalPrice).toFixed(2))
                                        distObj.marketDistanceInMeters = ele.distance.value
                                        distObj.travelDurationInSec = ele.duration.value
                                        // distObj.productId = 
                                        // distObj.input = 

                                        //dist[mktId] = parseFloat((mktFinalPrice).toFixed(2))

                                        // errorFlag = false;
                                    } else {
                                        distObj.price = parseFloat((finalPrice).toFixed(2))
                                        // errorFlag = true;
                                    }

                                    dist.push(distObj)
                                }
                            }

                            data.pincode = dealerinfo.pincode;

                            // console.log("16====");
                            Inputs.create(data).then(function (input) {
                                var newDists = []
                                for (var i = 0; i < dist.length; i++) {
                                    var pmp = dist[i]
                                    pmp.productId = input.id
                                    pmp.input = input.id

                                    newDists.push(pmp)
                                }

                                ProductMarketPrice.create(newDists).then(function (newDists) {
                                    return res.jsonx({
                                        success: true,
                                        code: 200,
                                        message: constantObj.input.ADDED_INPUT,
                                        key: "ADDED_INPUT",
                                        data: input,
                                    })
                                })
                            }).fail(function (err) {
                                // console.log("17====");
                                return res.jsonx({
                                    success: false,
                                    error: err
                                });
                            });
                        });
                    })
                })
            } else {
                // console.log("18====");
                Inputs.create(data).then(function (input) {
                    // console.log("19====");
                    return res.jsonx({
                        success: true,
                        code: 200,
                        message: constantObj.input.ADDED_INPUT,
                        key: "ADDED_INPUT",
                        data: input,
                    })
                }).fail(function (err) {
                    return res.jsonx({
                        success: false,
                        error: err
                    });
                });
            }
        })
    },

    updateInput: function (data, context, req, res) {

        var findinputQry = {}
        findinputQry.id = data.id

        var goAhead = false

        if (data.availableQuantity < 0.1) {
            goAhead = false
            return {
                success: false,
                error: {
                    code: 4042222,
                    message: "Quantity can not be zero.",
                    key: 'NOT_FOUND'
                }
            };
        } else {
            goAhead = true
        }

        let today = new Date()

        if (Date(data.availableTill) > today) {
            goAhead = true
        } else {
            goAhead = false
            return {
                success: false,
                error: {
                    code: 4042222,
                    message: "Available date should be a future date.",
                    key: 'NOT_FOUND'
                }
            };
        }

        if (goAhead) {

            return Inputs.findOne(findinputQry).then(function (inputInfo) {
                if (inputInfo.availableQuantity != data.availableQuantity) {
                    data.leftAfterAcceptanceQuantity = data.availableQuantity;
                }

                data.isExpired = false
                data.isApproved = false
                // new changes according to final prices
                // console.log('inputInfo',data);

                if (data.availableForFranchisees && data.availableForFranchisees.length > 0) {

                    var markets = []
                    for (var i = 0; i < data.availableForFranchisees.length; i++) {
                        markets.push(ObjectId(data.availableForFranchisees[i]))

                    }
                    let franchiseePart = data.price ? data.price : inputInfo.price * (data.franchiseePercentage ? data.franchiseePercentag : inputInfo.franchiseePercentag / 100)
                    let efarmxComission = data.price ? data.price : inputInfo.price * (data.efarmxComission ? data.efarmxComission : inputInfo.efarmxComissio / 100)

                    let facilitationTaxes = efarmxComission * (data.taxRate ? data.taxRate : inputInfo.taxRate / 100)
                    var finalPrice = parseFloat(parseFloat(data.price ? data.price : inputInfo.price) + parseFloat(franchiseePart) + parseFloat(efarmxComission) + parseFloat(facilitationTaxes))
                    // console.log(finalPrice)
                    // return 1
                    let productTaxes = parseFloat(finalPrice * (data.productTaxRate ? data.productTaxRate : inputInfo.productTaxRate / 100))

                    finalPrice = parseFloat(finalPrice) + parseFloat(productTaxes)

                    data.finalPrice = parseFloat((finalPrice).toFixed(2))

                    Users.findOne({ id: data.dealer, select: ['address', 'city', 'pincode', 'state', 'district'] }).then(function (dealerinfo) {
                        Market.find({ id: { "$in": markets } }).populate('GM').then(function (availableFor) {
                            var destinations = []
                            var origins = []
                            var origin = dealerinfo.address + ", " + dealerinfo.city + ", " + dealerinfo.district + ", " + dealerinfo.state + ", " + dealerinfo.pincode
                            origins.push(origin)
                            for (var i = 0; i < availableFor.length; i++) {
                                if (availableFor[i].GM) {
                                    let destination = availableFor[i].GM.address + ", " + availableFor[i].GM.city + ", " + availableFor[i].GM.district + ", " + availableFor[i].GM.state + ", " + availableFor[i].GM.pincode

                                    destinations.push(destination)
                                    // origins.push(origin)
                                } else {
                                    destinations.push(availableFor[i].pincode[0])
                                    // origins.push(origin)
                                }
                            }

                            let googleApiKey = constantObj.googlePlaces.key;

                            distance.key(googleApiKey);
                            distance.units('metric');

                            let dist = [];
                            let errorMessage = "Input address not valid";
                            let errorFlag = false;

                            distance.matrix(origins, destinations, (err, distances) => {
                                // var origin = distances.origin_addresses[i];                            
                                if (!errorFlag) {
                                    var destinations = distances.destination_addresses;
                                    for (var j = 0; j < destinations.length; j++) {

                                        let mktId = data.availableForFranchisees[j];

                                        var distObj = {}
                                        distObj.productType = 'INPUT'
                                        distObj.market = mktId
                                        distObj.productPriceWithoutMarket = parseFloat((finalPrice).toFixed(2))
                                        distObj.productId = inputInfo.id
                                        distObj.input = inputInfo.id

                                        if (distances.rows[0].elements[j].status == 'OK') {
                                            let ele = distances.rows[0].elements[j]
                                            let mktShippingPrice = data.shippingPrice * (ele.distance.value / 1000)
                                            let mktFinalPrice = finalPrice + mktShippingPrice

                                            distObj.price = parseFloat((mktFinalPrice).toFixed(2))
                                            distObj.marketDistanceInMeters = ele.distance.value
                                            distObj.travelDurationInSec = ele.duration.value


                                            // errorFlag = false;
                                        } else {
                                            distObj.price = parseFloat((finalPrice).toFixed(2))
                                            distObj.marketDistanceInMeters = NaN
                                            // errorFlag = true;
                                        }

                                        dist.push(distObj)
                                    }
                                }

                                // data.pricesAtMarkets = dist

                                ProductMarketPrice.destroy({ input: inputInfo.id }).then(function (deleted) {
                                    Inputs.update({ id: data.id }, data).then(function (input) {
                                        console.log('updateinput', input)
                                        if (input) {
                                            console.log("if input", dist)
                                            ProductMarketPrice.create(dist).then(function (newDists) {
                                                var msg = "Input " + input[0].name + " with id " + input[0].code + " is updated. ";
                                                console.log("new dist", newDists)
                                                var notificationData = {};
                                                notificationData.productId = input[0].id;
                                                notificationData.input = input[0].id;
                                                notificationData.sellerId = input[0].dealer;
                                                notificationData.user = input[0].dealer;
                                                notificationData.productType = "inputs";
                                                notificationData.message = msg;
                                                notificationData.messageKey = "INPUT_UPDATED_NOTIFICATION"
                                                notificationData.readBy = [];

                                                Notifications.create(notificationData).then(function (notificationResponse) {

                                                    if (notificationResponse) {

                                                        commonService.notifyUsersFromNotification(notificationResponse, input[0])
                                                    }

                                                    return res.jsonx({
                                                        success: true,
                                                        code: 200,
                                                        message: "Input Updated",
                                                        key: 'UPDATED_INPUT',
                                                        data: input
                                                    })
                                                })
                                            })
                                        } else {
                                            return res.jsonx({
                                                success: false,
                                                error: {
                                                    code: 4042222,
                                                    message: constantObj.messages.NOT_FOUND,
                                                    key: 'NOT_FOUND'
                                                }
                                            });
                                        }
                                    }).fail(function (err) {

                                        return res.jsonx({
                                            success: false,
                                            error: err
                                        });
                                    })
                                })
                            });
                        })
                    })
                } else {
                    console.log(data, 'else')
                    Inputs.update({ id: data.id }, data).then(function (input) {

                        if (input) {
                            console.log(input, 'input')
                            var msg = "Input " + input[0].name + " with id " + input[0].code + " is updated. ";

                            var notificationData = {};
                            notificationData.productId = input[0].id;
                            notificationData.input = input[0].id;
                            notificationData.sellerId = input[0].dealer;
                            notificationData.user = input[0].dealer;
                            notificationData.productType = "inputs";
                            notificationData.message = msg;
                            notificationData.messageKey = "INPUT_UPDATED_NOTIFICATION"
                            notificationData.readBy = [];

                            return Notifications.create(notificationData).then(function (notificationResponse) {
                                if (notificationResponse) {
                                    commonService.notifyUsersFromNotification(notificationResponse, input[0])
                                }
                                return res.jsonx({
                                    success: true,
                                    code: 200,
                                    message: "input updated",
                                    key: 'UPDATED_INPUT',
                                    data: input
                                })
                            })
                        } else {
                            console.log('elseerror')
                            return res.jsonx({
                                success: false,
                                error: {
                                    code: 4042222,
                                    message: constantObj.messages.NOT_FOUND,
                                    key: 'NOT_FOUND'
                                }
                            });
                        }
                    }).fail(function (err) {

                        return res.jsonx({
                            success: false,
                            error: err
                        });
                    });
                }

                // end of new changes according to final prices
                /* return Inputs.update({id: data.id},data).then(function (input) {
                     if(input){
                         var msg = "Input " + input[0].name + " with id " + input[0].code + " is updated. ";
 
                         var notificationData = {};
                         notificationData.productId = input[0].id;
                         notificationData.input = input[0].id;
                         notificationData.sellerId = input[0].dealer;
                         notificationData.user = input[0].dealer;
                         notificationData.productType = "inputs";
                         notificationData.message = msg;
                         notificationData.messageKey = "INPUT_UPDATED_NOTIFICATION"
                         notificationData.readBy = []; 
                   
                         return Notifications.create(notificationData).then(function(notificationResponse){
                             if (notificationResponse) {
                                 commonService.notifyUsersFromNotification(notificationResponse, input[0])                                   
                             }
                             return {
                                 success: true,
                                 code: 200,
                                 message: constantObj.inputs.UPDATED_input,
                                 key: 'UPDATED_INPUT',
                                 data: input                        
                             }     
                         })
                     } else {
                         return {
                             success: false,
                             error: {
                               code: 4042222,
                                 message: constantObj.messages.NOT_FOUND,
                                 key: 'NOT_FOUND'
                             }
                         };
                     }
                 })
                 
                 .fail(function(error){
                     return {
                         success: false,
                         error: {
                           code: 4042,
                           message: error
                         }
                     };
                 });
             }).fail(function(err){
                 return {
                     success: false,
                     error: {
                       code: 4043,
                         message: err
                     }
                 };*/
            });
        } else {
            return {
                success: false,
                error: {
                    code: 4042222,
                    message: "Unknown error occurred.",
                    key: 'NOT_FOUND'
                }
            }
        }
    },

    putInput: function (data, context) {
        return Inputs.update({ id: data.id }, data).then(function (input) {
            if (input) {
                return {
                    success: true,
                    code: 200,
                    message: constantObj.input.UPDATED_INPUT,
                    key: 'UPDATED_INPUT',
                    data: input
                }
            } else {
                return {
                    success: false,
                    error: {
                        code: 4042222,
                        message: constantObj.messages.NOT_FOUND,
                        key: 'NOT_FOUND'
                    }
                };
            }
            return result;
        }).fail(function (error) {
            return {
                success: false,
                error: {
                    code: 4042,
                    message: error
                }
            };
        });
    },

    inputAcceptBid: function (data, context) {
        data.status = 'Accepted'
        data.acceptedAt = new Date();
        return acceptInputBid(data, context);
    },

    inputAssignETD: function (data, context) {
        return bidCheckPost(updateETA, data, context, null);
    },
    inputDispatchBid: function (data, context) {
        data.status = 'Dispatched'
        data.ATD = new Date()
        return bidCheckPost(inputDispatchBid, data, context, null);
    },

    inputReceivedBid: function (data, context) {
        data.status = 'Received'
        data.receivedDate = new Date()
        return bidCheckPost(inputReceivedBid, data, context, null);
    },
    inputDeliverBid: function (data, context) {
        data.status = 'Delivered'
        data.ATA = new Date()
        return bidCheckPost(inputDeliverBid, data, context, null);
    },

    /*assignLogisticAndDeliveryTime: function(data, context) {
      return bidCheckPost(assignLogisticAndDeliveryTime, data, context, null)
    },

    deliverBid: function(data,context) {
      data.status = 'Delivered'
      data.ATA = new Date()
      return bidCheckPost(deliverBid,data,context, null);
    },

    withdrawBid: function(data,context) {
      data.status = 'Withdrawal'
      data.withdrawalAt = new Date()
      return bidCheckPost(withdrawalBid,data,context, null);
    },

    failedBid: function(data,context) {
        data.status = 'Failed'
        data.withdrawalAt = new Date()
        return bidCheckPost(failedBid,data,context, null);
    },
    
    */

    deleteInput: function (data, context) {

        return API.Model(Inputs).update(data.id, data)
            .then(function (inputs) {
                var report;
                if (inputs) {
                    report = {
                        "sucess": {
                            "Code": 200,
                            "Message": "Deleted"
                        }
                    }
                } else {
                    report = {
                        "error": {
                            "Code": 301,
                            "Message": "Faild"
                        }
                    }
                }
                return {
                    "Status": true,
                    report
                };
            });
    },

    inputPaymentslist: function (data, context) {

        return Bidspayment.find({ bidId: data.id }).populate(["input"])
            .sort({ sequenceNumber: 1 }).then(function (bidPaymentsList) {
                return { success: true, code: 200, data: bidPaymentsList }
            })
            .fail(function (error) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: error
                    }
                }
            });
    },
    makeVerifyInput: function (data, context) {

        return Inputs.update({ id: data.id }, { verified: "Yes", verifyBy: context.identity.id })
            .then(function (input) {

                return Users.findOne(input[0].user).then(function (userinfo) {

                    let fieldOfficerContact = context.identity.mobile;

                    var msg = "Input " + input[0].name + " with id " + input[0].code + " is verified by eFarmX. ";

                    var notificationData = {};
                    notificationData.productId = input[0].id;
                    notificationData.input = input[0].id;
                    notificationData.sellerId = input[0].user;
                    notificationData.user = input[0].user;
                    notificationData.productType = "inputs";
                    notificationData.message = msg;
                    notificationData.messageKey = "INPUT_VERIFIED_NOTIFICATION"
                    notificationData.readBy = [];

                    return Notifications.create(notificationData)
                        .then(function (notificationResponse) {
                            // if (notificationResponse) {
                            //     commonService.notifyUsersFromNotification(notificationResponse, input[0])                                   
                            // }
                            return {
                                success: true,
                                code: 200,
                                data: {
                                    message: constantObj.input.VERIFIED_INPUT
                                }
                            };
                        })
                });
            }).fail(function (err) {
                return {
                    success: false,
                    error: {
                        code: 404,
                        message: constantObj.messages.NOT_FOUND,
                        key: 'NOT_FOUND',
                    }
                };
            });

    },
    makeFeatureInput: function (data, context) {

        return Inputs.findOne({ id: data.id }).then(function (inputinfo) {
            var dataToUpdate = {}

            if (inputinfo.isFeatured == true) {
                dataToUpdate.isFeatured = false;
            } else {
                dataToUpdate.isFeatured = true;
            }

            return Inputs.update({ id: data.id }, dataToUpdate).then(function (input) {
                return {
                    success: true,
                    code: 200,
                    data: {
                        message: constantObj.input.FEATURED_INPUT
                    }
                };
            }).fail(function (err) {
                return {
                    success: false,
                    error: {
                        code: 404,
                        message: constantObj.messages.NOT_FOUND,
                        key: 'NOT_FOUND',
                    }
                };
            });
        }).fail(function (err) {
            return {
                success: false,
                error: {
                    code: 404,
                    message: constantObj.messages.NOT_FOUND,
                    key: 'NOT_FOUND',
                }
            };
        });
    },

    makeApproveInput: function (data, context) {
        var approvedBy = context.identity.id;
        var findInputQry = {}
        findInputQry.id = data.id
        return Inputs.findOne(findInputQry).then(function (inputInfo) {

            var dataToUpdate = {}
            dataToUpdate.isApproved = true
            dataToUpdate.approvedBy = approvedBy
            dataToUpdate.approvedOn = new Date()

            return Inputs.update({ id: data.id }, dataToUpdate).then(function (input) {
                return Users.findOne(input[0].dealer).then(function (userinfo) {

                    var addedInput = input;
                    addedInput.seller = userinfo;
                    sails.sockets.blast('Input_added', addedInput);

                    let fieldOfficerContact = context.identity.mobile;

                    var msg = "Input " + input[0].name + " with id " + input[0].code + " is approved by eFarmX. ";
                    var notificationData = {};
                    notificationData.productId = input[0].id;
                    notificationData.input = input[0].id;
                    notificationData.sellerId = input[0].dealer;
                    notificationData.user = input[0].dealer;
                    notificationData.productType = "inputs";
                    notificationData.message = msg;
                    notificationData.messageKey = "INPUT_APPROVED_NOTIFICATION"
                    notificationData.readBy = [];
                    return Notifications.create(notificationData).then(function (notificationResponse) {
                        // if (notificationResponse) {
                        //     commonService.notifyUsersFromNotification(notificationResponse, input[0])                                   
                        // }
                        return {
                            success: true,
                            code: 200,
                            data: {
                                message: constantObj.input.APPROVED_INPUT
                            }
                        };
                    })
                });
            }).fail(function (err) {
                return {
                    success: false,
                    error: {
                        code: 404,
                        message: constantObj.messages.NOT_FOUND,
                        key: 'NOT_FOUND',
                    }
                };
            });
        }).fail(function (err) {
            return {
                success: false,
                error: {
                    code: 404,
                    message: constantObj.messages.NOT_FOUND,
                    key: 'NOT_FOUND',
                }
            };
        });
    },

    inputLanding: function (markets, req, res) {
        let mostviewed = {};
        mostviewed.viewed = { "$gt": 0 };
        mostviewed.isDeleted = false;
        mostviewed.isApproved = true;
        mostviewed.isExpired = false;
        mostviewed.isActive = true
        if (markets.length > 0) {
            mostviewed.availableForFranchisees = { "$in": markets }
        }

        let featured = {};
        featured.isFeatured = true;
        featured.isDeleted = false;
        featured.isApproved = true;
        featured.isExpired = false;
        featured.isActive = true
        if (markets.length > 0) {
            featured.availableForFranchisees = { "$in": markets }
        }

        let bestSelling = {};
        bestSelling.isDeleted = false;
        bestSelling.isApproved = true;
        bestSelling.isExpired = false;
        bestSelling.isActive = true
        if (markets.length > 0) {
            bestSelling.availableForFranchisees = { "$in": markets }
        }

        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;

        let priceMarketQuery = { select: ['price'], sort: 'price asc', limit: 1 }
        if (markets.length > 0) {
            priceMarketQuery.where = { market: markets }
        }

        Inputs.find(bestSelling).populate('category', {
            select: ['name']
        }).skip(skipNo).limit(count).populate("pricesAtMarkets", priceMarketQuery).exec(function (err, inputs) {
            if (inputs) {
                inputs.sort(function (a, b) {
                    return b.allOrders.length - a.allOrders.length
                })
                Inputs.find(mostviewed).populate('category', {
                    select: ['name']
                }).skip(skipNo).limit(count).sort('viewed DESC').populate("pricesAtMarkets", priceMarketQuery).then(function (mostlyViewed) {
                    Inputs.find(featured).populate('category', {
                        select: ['name']
                    }).skip(skipNo).limit(count).sort('createdAt DESC').populate("pricesAtMarkets", priceMarketQuery).then(function (feature) {
                        return res.jsonx({
                            success: true,
                            data: {
                                bestSelling: inputs,
                                mostlyViewed: mostlyViewed,
                                feature: feature,
                                markets: markets
                            },
                        });
                    })
                })
            }
        })
    },

    findFeaturedInputs: function (query, markets, req, res) {
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;

        let selection = ['name', 'code', 'category', 'variety', 'company', 'price', 'finalPrice', 'pricesAtMarkets', 'availableQuantity', 'minimumQuantityToPurchase', 'workingUnit', 'isCODAvailable', 'isStepsPaymentAvailable', 'isAdvancePaymentAvailable', 'description', 'coverPageImage', 'images', 'availableFrom', 'availableTill', 'averageRating', 'createdAt']

        query.select = selection

        let priceMarketQuery = { select: ['price'], sort: 'price asc', limit: 1 }
        if (query.availableForFranchisees != undefined && query.availableForFranchisees.length > 0) {
            priceMarketQuery.where = { market: query.availableForFranchisees }
        }

        Inputs.count(query).then(function (total) {
            Inputs.find(query).populate('category', {
                select: ['name']
            }).skip(skipNo).limit(count).sort('createdAt DESC').populate("pricesAtMarkets", priceMarketQuery).then(function (feature) {
                if (feature.length > 0) {
                    return res.jsonx({
                        success: true,
                        data: {
                            feature: feature,
                            total: total,
                            markets: markets
                        },
                    });
                } else {
                    query.isFeatured = false;
                    query.isDeleted = false;
                    query.isApproved = true;
                    query.isExpired = false;
                    query.isActive = true;

                    Inputs.count(query).then(function (totalNormal) {
                        Inputs.find(query).populate('category', {
                            select: ['name']
                        }).skip(skipNo).limit(count).sort('createdAt DESC').populate("pricesAtMarkets", priceMarketQuery).then(function (normalInputs) {
                            if (normalInputs) {
                                return res.jsonx({
                                    success: true,
                                    data: {
                                        feature: normalInputs,
                                        total: totalNormal,
                                        markets: markets
                                    }
                                });
                            } else {
                                return res.jsonx({
                                    success: false,
                                    err: "There are no inputs."
                                });
                            }
                        })
                    })
                }
            })
        })
    },

    inputsAtFranchisee: function (query, req, res) {
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;

        let selection = ['name', 'code', 'category', 'variety', 'company', 'price', 'finalPrice', 'pricesAtMarkets', 'availableQuantity', 'minimumQuantityToPurchase', 'workingUnit', 'isCODAvailable', 'isStepsPaymentAvailable', 'isAdvancePaymentAvailable', 'description', 'coverPageImage', 'images', 'availableFrom', 'availableTill', 'averageRating', 'createdAt']

        query.select = selection

        let priceMarketQuery = { select: ['price'], sort: 'price asc', limit: 1 }
        if (query.availableForFranchisees != undefined && query.availableForFranchisees.length > 0) {
            priceMarketQuery.where = { market: query.availableForFranchisees }
        }

        Inputs.count(query).then(function (total) {
            Inputs.find(query).populate('category', {
                select: ['name']
            }).skip(skipNo).limit(count).sort('createdAt DESC').populate("pricesAtMarkets", priceMarketQuery).then(function (feature) {
                return res.jsonx({
                    success: true,
                    data: {
                        inputs: feature,
                        total: total,
                    },
                });
            }).fail(function (err) {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 404,
                        message: constantObj.messages.NOT_FOUND,
                        key: 'NOT_FOUND',
                    }
                });
            });
        }).fail(function (err) {
            return res.jsonx({
                success: false,
                error: {
                    code: 404,
                    message: constantObj.messages.NOT_FOUND,
                    key: 'NOT_FOUND',
                }
            });
        });
    },

    saveInputBid: function (data, context) {

        console.log("placed bid  datadatadatadata==========", data);

        let code = commonServiceObj.getUniqueCode();
        data.code = code;
        let bidData = {};
        let history = {};
        let transactionData = {};
        var bidpayment = {};

        var txnId = data.transactionId;
        var payments;
        var context = context.identity;

        if (typeof data.payments == 'string') {
            payments = JSON.parse(data.payments);
        } else {
            payments = JSON.parse(JSON.stringify(data.payments));
        }

        data.bidRate = parseFloat(data.amount / data.quantity);
        data.productType = "input";

        delete data.transactionId;
        delete data.payments;

        return getSellerInfo(data.input).then(function (sellerData) {

            return Bids.create(data).then(function (bid) {

                transactionData.buyerId = bid.user;
                transactionData.input = data.input;
                transactionData.productType = "input";
                transactionData.bidId = bid.id;
                transactionData.amount = data.earnestAmount;
                transactionData.sellerId = sellerData.sellerID;
                transactionData.paymentType = "PayTm";

                console.log("bid============", bid);

                console.log("--------------", txnId);

                return Transactions.update({ id: txnId }, transactionData)
                    .then(function (paymentsData) {
                        console.log("txanData============", paymentsData);

                        bidpayment.input = paymentsData[0].input;
                        bidpayment.bidId = bid.id;
                        bidpayment.sellerId = paymentsData[0].sellerId;
                        bidpayment.buyerId = paymentsData[0].buyerId;
                        bidpayment.transactionId = paymentsData[0].id;
                        bidpayment.amount = paymentsData[0].amount;
                        bidpayment.type = "Earnest";
                        bidpayment.paymentDate = paymentsData[0].createdAt;
                        bidpayment.status = 'Verified';
                        bidpayment.depositedOn = paymentsData[0].createdAt;
                        bidpayment.amountPercent = data.amountPercent;
                        bidpayment.paymentMode = "PayTm";
                        bidpayment.paymentDueDate = new Date()
                        bidpayment.sequenceNumber = 0;
                        bidpayment.isVerified = true;
                        console.log("bidpayment============", bidpayment);
                        return Bidspayment.create(bidpayment).then(function (bidpayments) {

                            console.log("Payments+++++", typeof payments)
                            console.log("payments[0].type123456", payments[0])
                            if (payments) {
                                //console.log("payments[0].type",typeof payments[0]['type'])
                                //console.log("Payments",payments[0].type)

                                var bidQuery = {};
                                bidQuery.input = bidpayments.input;
                                bidQuery.type = "Earnest";
                                bidQuery.buyerId = context.id;

                                var dataQuery = {};
                                dataQuery.pincode = payments[0].pincode;
                                dataQuery.percentage = payments[0].percentage;
                                dataQuery.name = payments[0].name;
                                dataQuery.days = payments[0].days;

                                return Bidspayment.update(bidQuery, dataQuery).then(function (updatep) {
                                    delete payments[0];

                                    payments.forEach((obj, i) => {
                                        payments[i]["bidId"] = bid.id;
                                        payments[i]['buyerId'] = bid.user;
                                        payments[i]['sellerId'] = sellerData.sellerID;
                                        payments[i]['sequenceNumber'] = i + 1;
                                    });


                                    return Bidspayment.create(payments).then(function (bidpayments) {
                                        history.bid = bid.id;
                                        history.amount = bid.amount;
                                        history.input = bid.input;
                                        history.productType = "input";
                                        history.bidBy = bid.user;
                                        history.bidStatus = bid.status;
                                        history.quantity = bid.quantity;
                                        history.quantityUnit = bid.quantityUnit;
                                        history.bidRejectReason = bid.reason == undefined ? "" : bid.reason;
                                        history.bidsPayment = payments;
                                        history.pincode = bid.pincode;
                                        history.comment = "Bid placed"

                                        return Bidshistory.create(history).then(function (historyRes) {

                                            return Inputs.findOne({ id: data.input })
                                                .populate("user")
                                                .then(function (inputInfo) {

                                                    var inputQry = {};
                                                    inputQry.totalBids = inputInfo.totalBids + 1;

                                                    if (inputInfo.highestBid < bid.bidRate) {
                                                        inputQry.highestBid = bid.bidRate;
                                                    }

                                                    return Inputs.update({ id: data.input }, inputQry)
                                                        .then(function (updatedInput) {

                                                            sails.sockets.blast('bid_placed', bid);

                                                            var msg = "A bid (" + bid.code + ") is placed on " + updatedInput[0].name + " (" + updatedInput[0].code + "). ";

                                                            var notificationData = {};
                                                            notificationData.productId = updatedInput[0].id;
                                                            notificationData.Input = updatedInput[0].id;
                                                            notificationData.sellerId = updatedInput[0].user;
                                                            notificationData.user = bid.user;
                                                            notificationData.buyerId = bid.user;
                                                            notificationData.productType = "Inputs";
                                                            notificationData.message = msg;
                                                            notificationData.messageKey = "BID_PLACED_NOTIFICATION"
                                                            notificationData.readBy = [];

                                                            return Notifications.create(notificationData).then(function (notificationResponse) {
                                                                // if (notificationResponse) {
                                                                //     commonService.notifyUsersFromNotification(notificationResponse, updatedInput[0])                                   
                                                                // }
                                                                // push notification by rohitk
                                                                /*   console.log("InputInfo.user222", InputInfo.user);
                                                               if(InputInfo.user && InputInfo.user.deviceToken){
                                                                   let pushObj = {};
                                                                   pushObj.device_token = InputInfo.user.deviceToken ;
                                                                   pushObj.device_type = InputInfo.user.device_type ;
                                                                   pushObj.message = msg ;
                                                                   pushService.sendPush(pushObj) ;
                                                               }*/

                                                                return {
                                                                    success: true,
                                                                    code: 200,
                                                                    data: {
                                                                        bid: bid,
                                                                        message: constantObj.bids.SUCCESSFULLY_SAVED_BID,
                                                                        key: 'SUCCESSFULLY_SAVED_BID',
                                                                    }
                                                                };


                                                            })
                                                        })
                                                })
                                        });
                                    }).fail(function (error) {
                                        return {
                                            success: false,
                                            error: {
                                                code: 400,
                                                message: error
                                            },
                                        };
                                    });

                                    ///////
                                });
                            }
                        });



                    });
            }).fail(function (err) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: err
                    },
                };
            });
        });
    },

    completeInputBidDetails: function (data, context) {
        var bidId = data.id

        var query = {}
        query.id = bidId
        return Bids.findOne(query)
            .populate('user')
            .populate('logisticId')
            .populate('input')
            .then(function (response) {
                response.buyer = response.user
                delete response.user

                var paymentquery = {}
                paymentquery.bidId = bidId
                return Bidspayment.find(paymentquery)
                    .populate('sellerId')
                    .then(function (buyerPayments) {
                        if (buyerPayments) {
                            response.buyerPayments = buyerPayments
                            if (buyerPayments.length > 0) {
                                response.seller = buyerPayments[0].sellerId
                            }
                        }

                        return Sellerpayment.find(paymentquery)
                            .populate('paymentBy')
                            .then(function (sellerPayments) {
                                if (sellerPayments) {
                                    response.sellerPayments = sellerPayments
                                }

                                return FranchiseePayments.find(paymentquery)
                                    .populate('paymentBy')
                                    .populate('franchiseeUserId')
                                    .then(function (franchiseePayments) {
                                        if (franchiseePayments) {
                                            response.franchiseePayments = franchiseePayments
                                        }

                                        if (response.input.market) {
                                            return Market.findOne({ id: response.input.market })
                                                .populate('GM')
                                                .then(function (market) {
                                                    if (market) {
                                                        response.market = market
                                                    }
                                                    if (!(response.seller)) {
                                                        return Users.findOne({ id: response.input.seller }).then(function (seller) {
                                                            response.seller = seller
                                                            return {
                                                                code: 200,
                                                                data: response,
                                                                success: true,
                                                            };
                                                        }).fail(function (err) {
                                                            return {
                                                                code: 200,
                                                                data: response,
                                                                success: true,
                                                            };
                                                        })
                                                    } else {
                                                        return {
                                                            code: 200,
                                                            data: response,
                                                            success: true,
                                                        };
                                                    }
                                                }).fail(function (err) {
                                                    return {
                                                        code: 200,
                                                        data: response,
                                                        success: true,
                                                    };
                                                })
                                        } else {
                                            return {
                                                code: 200,
                                                data: response,
                                                success: true,
                                            };
                                        }
                                    }).fail(function (err) {
                                        return {
                                            code: 200,
                                            data: response,
                                            success: true,
                                        };
                                    })
                            }).fail(function (err) {
                                return {
                                    code: 200,
                                    data: response,
                                    success: true,
                                };
                            })
                    }).fail(function (err) {
                        return {
                            data: response,
                            success: true,
                            code: 200
                        };
                    })

            }).fail(function (error) {
                return {
                    code: 400,
                    success: false,
                    error: error
                };
            });
    },
    updateInputDepositInfo: function (data, context) {
        data.depositedOn = new Date(data.depositedOn);
        console.log("datadatadatarrrrrrrrrrrrrr", data);
        return Bidspayment.update({ id: data.id }, data).then(function (bidpayment) {
            return {
                success: true,
                code: 200,
                data: {
                    bid: bidpayment,
                    message: constantObj.bids.DEPOSIT_PAYMENT,
                    key: 'DEPOSIT_PAYMENT',
                },
            };
        })
    },
    updateInitiate: function (data, context) {
        console.log("data infopr requesiiiiiii", data)
        var paymentId = data.id;
        var buyerId = data.buyer;

        delete data.id;
        delete data.buyer;
        let updateData = {};
        updateData = data
        updateData.refundStatus = "Pending";
        updateData.refundDate = new Date();
        //console.log("dat is",data);
        var message = 'Refund Initiated.'
        return Bidspayment.update({ id: paymentId }, updateData).then(function (refund) {

            // var transactionQuery={};
            // transactionQuery.

            console.log("refund of bid", refund);
            if (refund) {
                return {
                    success: true,
                    code: 200,
                    data: {
                        refund: refund[0],
                        message: constantObj.order.SUCCESSFULLY_REFUNDED_AMOUNT,
                        key: 'SUCCESSFULLY_REFUNDED_AMOUNT',
                    },
                }
            } else {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: "Unknow Error Occurred"
                    },
                };
            }
        }).fail(function (error) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: error
                },
            };
        });
    },
    putBid: function (data, context) {

        var history = {};
        let bidData = {};
        let transactionData = {};


        var transactionSatus = data.transactionSatus; // 'EA', 'UA', 'LA', 'BA', 'FA'
        var transactionId = data.transactionId;
        var transactionAmount = data.transactionAmount;
        var paymentType = data.paymentType;  // DD, Wire
        var historyComment = "Bid Updated"
        if (data.historyComment) {
            historyComment = data.historyComment
        }

        delete data.transactionSatus;
        delete data.transactionId;
        delete data.transactionAmount;
        delete data.paymentType;
        delete data.historyComment

        return Bids.update({ id: data.id }, data).then(function (bid) {

            return Bids.findOne({ id: data.id }).populate("user").populate("input")
                .then(function (bidInfo) {


                    let inputId = bidInfo.input.id;
                    let bidAmount = bidInfo.amount;
                    let bidReason = bidInfo.reason == undefined ? "" : bidInfo.reason;
                    let buyer = bidInfo.user.username;

                    transactionData.buyerId = bidInfo.user.id;
                    transactionData.input = inputId;
                    transactionData.bidId = bidInfo.id;
                    transactionData.transactionId = transactionId;
                    transactionData.amount = transactionAmount;
                    transactionData.paymentType = paymentType;
                    transactionData.status = transactionSatus;
                    transactionData.sellerId = bidInfo.input.seller;


                    return Transactions.create(transactionData).then(function (paymentsData) {

                        history.bid = bidInfo.id;
                        history.amount = bidAmount;
                        history.input = inputId;
                        history.bidBy = bidInfo.user;
                        history.bidStatus = bidInfo.status;
                        history.quantity = bidInfo.quantity;
                        history.quantityUnit = bidInfo.quantityUnit;
                        history.bidRejectReason = bidReason;

                        if (historyComment) {
                            history.comment = historyComment
                        }

                        return Bidshistory.create(history).then(function (res) {

                            return {
                                success: true,
                                code: 200,
                                data: {
                                    bid: bid[0],
                                    message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                    key: 'SUCCESSFULLY_UPDATED_BID',
                                },
                            };
                        }); // Create bid history
                    }); // Create transection bids
                });// bid info query
        }).fail(function (err) {
            return {
                success: false,
                error: {
                    code: 400,
                    message: err
                },
            };
        });
    },

    deliverInput: function (data, context) {
        data.status = 'Delivered'
        data.ATA = new Date()
        var d = new Date();
        var month = d.getMonth();
        var year = d.getFullYear();

        var yrStore = ""
        if (month < 3) {
            yrStore = (year - 1).toString().substr(-2) + "-" + year.toString().substr(-2)
        } else {
            yrStore = year.toString().substr(-2) + "-" + (year + 1).toString().substr(-2)
        }

        return Invoice.find({ financialYear: yrStore }).sort('number DESC').then(function (invoices) {

            let numberToAssign = 1
            if (invoices.length > 0) {
                let invoice = invoices[0]
                numberToAssign = invoice.number + 1
            }

            let createInvoiceData = {}
            createInvoiceData.type = "order"
            createInvoiceData.orderId = data.order
            createInvoiceData.suborder = data.id
            createInvoiceData.number = numberToAssign
            createInvoiceData.financialYear = yrStore
            // console.log(createInvoiceData, "created");
            // console.log(invoices);
            // return 1
            return Invoice.create(createInvoiceData).then(function (createdInvoice) {
                data.invoice = createdInvoice.id
                // console.log(createInvoiceData, "created");
                // console.log(invoices);
                return Orderedcarts.update({ id: data.id }, data).then(function (order) {
                    // console.log("invoice updated", order)
                    // var callFunction = createBidHistory(data, order[0], "Order Delivered")

                    var findInputQuery = {}
                    findInputQuery.id = order[0].input

                    return Inputs.findOne(findInputQuery).then(function (input) {
                        console.log("input is", input)
                        var msg = "Item (" + order[0].id + ") is delivered. ";

                        var notificationData = {};
                        notificationData.productId = input.id;
                        notificationData.input = input.id;
                        notificationData.user = input.dealer;
                        notificationData.buyerId = order[0].user;
                        notificationData.productType = "input";
                        notificationData.message = msg;
                        notificationData.messageKey = "INPUT_DELIVERED_NOTIFICATION"
                        notificationData.readBy = [];

                        return Notifications.create(notificationData).then(function (notificationResponse) {
                            console.log("notificationResponse is", notificationResponse)
                            if (input.efarmxLogisticPercentage >= 0) {
                                var lpQuery = {}
                                lpQuery.inputId = order[0].input
                                lpQuery.suborder = order[0].id
                                lpQuery.sellerId = input.seller
                                lpQuery.buyerId = order[0].user
                                lpQuery.amount = parseFloat(order[0].logisticPayment) * parseFloat((100 - input.efarmxLogisticPercentage) / 100)
                                lpQuery.pincode = input.pincode
                                lpQuery.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString()
                                lpQuery.logisticPartner = order[0].logisticId
                                lpQuery.status = 'Due'
                                console.log("lpQuery", lpQuery)
                                return LogisticPayment.create(lpQuery).then(function (fp) {
                                    console.log("LogisticPayment is", fp)
                                    return {
                                        success: true,
                                        code: 200,
                                        data: {
                                            order: order[0],
                                            message: "Order updated successfully",
                                            key: 'SUCCESSFULLY_UPDATED_ORDER',
                                        },
                                    }
                                }).fail(function (error) {
                                    return {
                                        success: true,
                                        code: 200,
                                        data: {
                                            order: order[0],
                                            message: "Order item updated successfylly",
                                            key: 'SUCCESSFULLY_UPDATED_ORDER',
                                        },
                                    }
                                })
                            } else {
                                return {
                                    success: true,
                                    code: 200,
                                    data: {
                                        order: order[0],
                                        message: "Order item updated successfylly",
                                        key: 'SUCCESSFULLY_UPDATED_ORDER',
                                    },
                                }
                            }
                        })
                    })

                }).fail(function (error) {
                    return {
                        success: false,
                        error: {
                            code: 400,
                            message: error
                        },
                    };
                });
            })
        })
    }

}; // End Inputs service class
// by pass checkpost for all function to verify 

saveTheInput = function (data, context, req, res) {
    Settings.find({ type: 'input' }).then(function (settingsAry) {
        if (settingsAry && settingsAry.length > 0) {

            data.taxRate = settingsAry[0].input.taxRate
            data.taxes = settingsAry[0].input.taxes
            data.franchiseePercentage = settingsAry[0].input.franchiseePercentage
            data.efarmxComission = settingsAry[0].input.efarmxComission

            data.earnestPercent = settingsAry[0].buyerPayment.stepPaymentEarnestparcentage
            data.depositPayment = settingsAry[0].buyerPayment.stepDepositePayment
            data.finalPaymentDays = settingsAry[0].buyerPayment.stepFinalPaymentDays
            data.finalPaymentPercentage = settingsAry[0].buyerPayment.stepFinalPaymentPercentage
            data.buyergeneralTerms = settingsAry[0].buyerPayment.terms
            data.buyerpaymentTerms = settingsAry[0].buyerPayment.paymentTerms
            data.buyerlogisticTerms = settingsAry[0].buyerPayment.logisticsTerms

            data.sellergeneralTerms = settingsAry[0].sellerPayment.terms
            data.sellerpaymentTerms = settingsAry[0].sellerPayment.paymentTerms
            data.sellerlogisticTerms = settingsAry[0].sellerPayment.logisticsTerms

            data.sellerUpfrontPercentage = settingsAry[0].sellerPayment.upfrontPercentage
            data.sellerUpfrontDays = settingsAry[0].sellerPayment.upfrontDays
            data.sellerFinalPercentage = settingsAry[0].sellerPayment.finalPercentage
            data.sellerFinalDays = settingsAry[0].sellerPayment.finalDays
            data.sellerDepositPayment = settingsAry[0].sellerPayment.depositPayment

        } else {
            data.taxRate = 18
            data.franchiseePercentage = 1
            data.efarmxComission = 2

            data.earnestPercent = 1
            data.depositPayment = null
            data.finalPaymentDays = 5
            data.finalPaymentPercentage = 99
            data.buyergeneralTerms = ''
            data.buyerpaymentTerms = ''
            data.buyerlogisticTerms = ''

            data.sellergeneralTerms = ''
            data.sellerpaymentTerms = ''
            data.sellerlogisticTerms = ''

            data.sellerUpfrontPercentage = 10
            data.sellerUpfrontDays = 5
            data.sellerFinalPercentage = 90
            data.sellerFinalDays = 15
            data.sellerDepositPayment = null
        }

        data.isApproved = false
        data.isFeatured = false
        data.viewed = 0
        data.isDeleted = false

        data.soldQuantity = 0

        code = commonServiceObj.getUniqueCode();
        data.code = code;

        if (!data.coverPageImage && data.images && data.images.length > 0) {
            data.coverPageImage = data.images[0]
        }

        let franchiseePart = data.price * (data.franchiseePercentage / 100)
        let efarmxComission = data.price * (data.efarmxComission / 100)
        let facilitationTaxes = efarmxComission * (data.taxRate / 100)
        var finalPrice = data.price + franchiseePart + efarmxComission + facilitationTaxes
        let productTaxes = finalPrice * (data.productTaxRate / 100)

        finalPrice = finalPrice + productTaxes

        data.finalPrice = finalPrice


        if (data.availableForFranchisees && data.availableForFranchisees.length > 0) {
            var markets = []
            for (var i = 0; i < data.availableForFranchisees.length; i++) {
                markets.push(ObjectId(data.availableForFranchisees[i]))
            }

            Users.findOne({ id: data.dealer, select: ['address', 'city', 'pincode', 'state', 'district'] }).then(function (dealerinfo) {
                Market.find({ id: { "$in": markets } }).populate('GM').then(function (availableFor) {
                    var destinations = []
                    var origins = []
                    var origin = dealerinfo.address + ", " + dealerinfo.city + ", " + dealerinfo.district + ", " + dealerinfo.state + ", " + dealerinfo.pincode
                    origins.push(origin)
                    for (var i = 0; i < availableFor.length; i++) {
                        if (availableFor[i].GM) {
                            let destination = availableFor[i].GM.address + ", " + availableFor[i].GM.city + ", " + availableFor[i].GM.district + ", " + availableFor[i].GM.state + ", " + availableFor[i].GM.pincode

                            destinations.push(destination)
                            // origins.push(origin)
                        } else {
                            destinations.push(availableFor[i].pincode[0])
                            // origins.push(origin)
                        }
                    }

                    let googleApiKey = constantObj.googlePlaces.key;

                    distance.key(googleApiKey);
                    distance.units('metric');

                    let dist = {};
                    let errorMessage = "Input address not valid";
                    let errorFlag = false;

                    distance.matrix(origins, destinations, (err, distances) => {
                        console.log("dist == ", distances)
                        // var origin = distances.origin_addresses[i];                            
                        if (!errorFlag) {
                            var destinations = distances.destination_addresses;
                            for (var j = 0; j < destinations.length; j++) {
                                console.log("0.5")
                                if (distances.rows[0].elements[j].status == 'OK') {
                                    console.log("0.6")
                                    let mktId = data.availableForFranchisees[j];
                                    let ele = distances.rows[0].elements[j]
                                    let mktShippingPrice = data.shippingPrice * (ele.distance.value / 1000)
                                    let mktFinalPrice = finalPrice + mktShippingPrice

                                    dist[mktId] = mktFinalPrice

                                    console.log("0.7")
                                    // errorFlag = false;
                                } else {
                                    dist[mktId] = finalPrice
                                    // errorFlag = true;
                                }
                            }
                        }

                        data.pricesAtMarkets = dist

                        console.log("1 == ", data)

                        Inputs.create(data).then(function (input) {
                            console.log("2")
                            return res.jsonx({
                                success: true,
                                code: 200,
                                message: constantObj.input.ADDED_INPUT,
                                key: "ADDED_INPUT",
                                data: input,
                            })
                        }).fail(function (err) {
                            return res.jsonx({
                                success: false,
                                error: err
                            });
                        });
                    });
                })
            })
        } else {
            console.log("3")
            Inputs.create(data).then(function (input) {
                console.log("4")
                return res.jsonx({
                    success: true,
                    code: 200,
                    message: constantObj.input.ADDED_INPUT,
                    key: "ADDED_INPUT",
                    data: input,
                })
            }).fail(function (err) {
                return res.jsonx({
                    success: false,
                    error: err
                });
            });
        }
    })
},

    bidCheckPost = function (callBackPipe, data, context, message) {
        if (message) {
            data.historyComment = message
        }
        return callBackPipe(data, context);
    }

updateETA = function (data, context) {
    return Bids.findOne({ id: data.id }).then(function (bid) {
        if (bid) {
            var message = 'ETD assigned'
            if (bid.ETD) {
                message = 'ETD Updated'
            }
            var dataToUpdate = {}
            dataToUpdate.id = data.id
            if (bid.deliveryTime) {
                var availObj = data.ETD;
                var availableRange = bid.deliveryTime;
                var dateChanged = new Date(availObj);
                dateChanged.setDate(dateChanged.getDate() + availableRange);
                data.ETA = dateChanged
                dataToUpdate.ETA = dateChanged
            }
            dataToUpdate.ETD = new Date(data.ETD)
            return bidCheckPost(updateBid, dataToUpdate, context, message);
        } else {
            return {
                success: false,
                error: {
                    code: 400,
                    message: "Unknow Error Occurred"
                },
            };
        }
    }).fail(function (error) {
        return {
            success: false,
            error: {
                code: 400,
                message: error
            },
        };
    });
}
//  input dispatch Bid
inputDispatchBid = function (data, context) {
    return Bids.update({ id: data.id }, data).then(function (bid) {
        var callFunction = createBidHistory(data, bid[0], 'Order dispatched')
        if (callFunction) {
            var findInputQuery = {}
            findInputQuery.id = bid[0].input

            return Inputs.findOne(findInputQuery).then(function (input) {
                var inputUpdateQry = {}
                inputUpdateQry.leftAfterDeliveryQuantity = input.leftAfterDeliveryQuantity - bid[0].quantity
                return Inputs.update(findInputQuery, inputUpdateQry).then(function (updatedInput) {
                    var msg = "Bid (" + bid[0].code + ") is dispatched.";

                    var notificationData = {};
                    notificationData.productId = bid[0].input;
                    notificationData.input = bid[0].input;
                    notificationData.user = bid[0].user;
                    notificationData.buyerId = bid[0].user;
                    notificationData.sellerId = input.seller
                    notificationData.productType = "inputs";
                    notificationData.message = msg;
                    notificationData.messageKey = "BID_DISPATCHED_NOTIFICATION"
                    notificationData.readBy = [];

                    return Notifications.create(notificationData).then(function (notificationResponse) {
                        return {
                            success: true,
                            code: 200,
                            data: {
                                bid: bid[0],
                                message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                key: 'SUCCESSFULLY_UPDATED_BID',
                            },
                        }
                    })
                })
            })
        } else {
            return {
                success: false,
                error: {
                    code: 400,
                    message: "Unknow Error Occurred"
                },
            };
        }
    }).fail(function (error) {
        return {
            success: false,
            error: {
                code: 400,
                message: error
            },
        };
    });
}

inputReceivedBid = function (data, context) {
    console.log("datadatadatadata---", data);
    return Bids.update({ id: data.id }, data).then(function (bid) {

        console.log("bid", bid)
        var callFunction = createBidHistory(data, bid[0], "Order Received")
        if (callFunction) {
            var findInputQuery = {}
            findInputQuery.id = bid[0].input

            console.log("findInputQuery", findInputQuery)
            return Inputs.findOne(findInputQuery)
                .populate('market').then(function (input) {

                    console.log("input123@@@@@@@@@@@@@@@@@@@@@@@", input)
                    var fpQuery = {}
                    fpQuery.inputId = input.id
                    fpQuery.bidId = bid[0].id
                    fpQuery.sellerId = input.user
                    fpQuery.buyerId = bid[0].user
                    fpQuery.amount = parseFloat(bid[0].amount) * parseFloat(input.franchiseePercentage / 100)
                    fpQuery.pincode = input.pincode
                    fpQuery.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString()
                    fpQuery.status = 'Due'

                    console.log("fpQuery11111!!!!!!!!!!!!!!!!!!!!", fpQuery)

                    if (input.market) {
                        fpQuery.marketId = input.market.id;
                    }
                    fpQuery.franchiseeUserId = input.user;

                    return FranchiseePayments.create(fpQuery).then(function (fp) {
                        console.log("fp1234@@@@@@@@@@@@@@@@@@@", fp)
                        var msg = "Bid (" + bid[0].code + ") is Received. ";

                        var notificationData = {};
                        notificationData.productId = bid[0].input;
                        notificationData.input = bid[0].input;
                        notificationData.user = bid[0].user;
                        notificationData.buyerId = bid[0].user;
                        notificationData.productType = "inputs";
                        //notificationData.transactionOwner = u[0].id;
                        notificationData.message = msg;
                        notificationData.messageKey = "BID_RECEIVED_NOTIFICATION"
                        notificationData.readBy = [];
                        console.log("notificationData______________________", notificationData)

                        return Notifications.create(notificationData).then(function (notificationResponse) {
                            console.log("notificationResponse++++++++++++++++++++++", notificationResponse)
                            return {
                                success: true,
                                code: 200,
                                data: {
                                    bid: bid[0],
                                    message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                    key: 'SUCCESSFULLY_UPDATED_BID',
                                },
                            }
                        })
                    }).fail(function (error) {
                        console.log("error----3", error);
                        return {
                            success: false,
                            error: {
                                code: 400,
                                message: error
                            },
                        };
                    })
                })
        } else {
            console.log("error----2", error);
            return {
                success: false,
                error: {
                    code: 400,
                    message: "Unknow Error Occurred"
                },
            };
        }
    }).fail(function (error) {
        console.log("error----1", error);
        return {
            success: false,
            error: {
                code: 400,
                message: error
            },
        };
    });
}

inputDeliverBid = function (data, context) {
    return Bids.update({ id: data.id }, data).then(function (bid) {
        console.log("bid is", bid)
        var callFunction = createBidHistory(data, bid[0], "Order Delivered")
        if (callFunction) {
            var findInputQuery = {}
            findInputQuery.id = bid[0].input

            return Inputs.findOne(findInputQuery).then(function (input) {
                console.log("input is", input)
                var msg = "Bid (" + bid[0].code + ") is delivered. ";

                var notificationData = {};
                notificationData.productId = bid[0].input;
                notificationData.input = bid[0].input;
                notificationData.user = bid[0].user;
                notificationData.buyerId = bid[0].user;
                notificationData.productType = "inputs";
                notificationData.message = msg;
                notificationData.messageKey = "BID_DELIVERED_NOTIFICATION"
                notificationData.readBy = [];

                console.log("notificationData is", notificationData)
                return Notifications.create(notificationData).then(function (notificationResponse) {
                    console.log("notificationResponse is", notificationResponse)
                    if (input.efarmxLogisticPercentage >= 0) {
                        var lpQuery = {}
                        lpQuery.input = bid[0].input
                        lpQuery.bidId = bid[0].id
                        lpQuery.sellerId = input.seller
                        lpQuery.buyerId = bid[0].user
                        lpQuery.amount = parseFloat(bid[0].logisticPayment) * parseFloat((100 - input.efarmxLogisticPercentage) / 100)
                        lpQuery.pincode = input.pincode
                        lpQuery.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString()
                        lpQuery.logisticPartner = bid[0].logisticId
                        lpQuery.status = 'Due'
                        lpQuery.productType = 'input'
                        console.log("lpQuery", lpQuery)
                        return LogisticPayment.create(lpQuery).then(function (fp) {
                            console.log("LogisticPayment is", fp)
                            return {
                                success: true,
                                code: 200,
                                data: {
                                    bid: bid[0],
                                    message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                    key: 'SUCCESSFULLY_UPDATED_BID',
                                },
                            }
                        }).fail(function (error) {
                            return {
                                success: true,
                                code: 200,
                                data: {
                                    bid: bid[0],
                                    message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                    key: 'SUCCESSFULLY_UPDATED_BID',
                                },
                            }
                        })
                    } else {
                        return {
                            success: true,
                            code: 200,
                            data: {
                                bid: bid[0],
                                message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                key: 'SUCCESSFULLY_UPDATED_BID',
                            },
                        }
                    }
                })
            })
        } else {
            return {
                success: false,
                error: {
                    code: 400,
                    message: "Unknow Error Occurred"
                },
            };
        }
    }).fail(function (error) {
        return {
            success: false,
            error: {
                code: 400,
                message: error
            },
        };
    });

}


// accept bid
acceptInputBid = function (data, context) {

    let bidData = {};
    console.log("datadatadataeeeeeeeeeeeeeeeeeeeeeeeee", data);

    return Bids.update({ id: data.id }, data)
        .then(function (bid) {

            var bidAcceptDate = bid.acceptedAt;

            var inputFindQry = {}
            inputFindQry.id = bid[0].input

            return Inputs.findOne(inputFindQry).then(function (input) {
                if (input) {
                    console.log("inputinfo", input);
                    var inputUpdateQry = {}
                    inputUpdateQry.leftAfterAcceptanceQuantity = input.leftAfterAcceptanceQuantity - bid[0].quantity
                    return Inputs.update(inputFindQry, inputUpdateQry)
                        .then(function (input) {
                            return Bidspayment.find({ bidId: data.id, type: { "$ne": "Earnest" } })
                                .then(function (bidpayDetail) {

                                    var count = 0;
                                    _.each(bidpayDetail, function (bidpay, index) {
                                        console.log("bidpayrrrrrrrrrrrr", bidpay);

                                        var query = {};
                                        query.paymentDueDate = new Date(new Date().setDate(new Date().getDate() + bidpay.days)).toISOString();
                                        query.bidStatus = 'Accepted';
                                        console.log("queryrrrrrrrrrrrr", query);
                                        return Bidspayment.update({ id: bidpay.id }, query)
                                            .then(function (bidpaymentStatus) {
                                                if (bidpaymentStatus) {
                                                    if (count == bidpayDetail.length - 1) {
                                                        var callFunction = updateAndSellerPaymentCreated(data, bid)
                                                        if (callFunction) {
                                                            return {
                                                                data: {
                                                                    bid: bid[0]
                                                                },
                                                                success: true,
                                                                code: 200,
                                                                message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                                                key: 'SUCCESSFULLY_UPDATED_BID'
                                                            }
                                                        }
                                                    }
                                                }
                                                count++;
                                            })
                                    })
                                    var msg = "Bid (" + bid[0].code + ") is accepted by seller. ";

                                    var notificationData = {};
                                    notificationData.productId = bid[0].input;
                                    notificationData.input = bid[0].input;
                                    notificationData.user = bid[0].user;
                                    notificationData.buyerId = bid[0].user;
                                    notificationData.productType = "inputs";
                                    //notificationData.transactionOwner = u[0].id;
                                    notificationData.message = msg;
                                    notificationData.messageKey = "BID_ACCEPTED_NOTIFICATION"
                                    notificationData.readBy = [];

                                    return Notifications.create(notificationData).then(function (notificationResponse) {
                                        if (notificationResponse) {
                                            commonService.notifyUsersFromNotification(notificationResponse, input[0])
                                        }
                                        return {
                                            data: {
                                                bid: bid[0]
                                            },
                                            success: true,
                                            code: 200,
                                            message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                                            key: 'SUCCESSFULLY_UPDATED_BID'
                                        }
                                    })
                                })
                        })
                } else {
                    return {
                        success: false,
                        error: {
                            code: 400,
                            message: constantObj.bids.ERROR_FINDING_input,
                            key: 'input_Not_Available'
                        }
                    }
                }
            }).fail(function (error) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: error
                    }
                }
            })
        })

}
updateBid = function (data, context) {
    var message = 'Bid Updated'
    if (data.historyComment) {
        message = data.historyComment

        delete data.historyComment
    }

    return Bids.update({ id: data.id }, data).then(function (bid) {
        var callFunction = createBidHistory(data, bid[0], message)
        if (callFunction) {
            return {
                success: true,
                code: 200,
                data: {
                    bid: bid[0],
                    message: constantObj.bids.SUCCESSFULLY_UPDATED_BID,
                    key: 'SUCCESSFULLY_UPDATED_BID',
                },
            }
        } else {
            return {
                success: false,
                error: {
                    code: 400,
                    message: "Unknow Error Occurred"
                },
            };
        }
    }).fail(function (error) {
        return {
            success: false,
            error: {
                code: 400,
                message: error
            },
        };
    });
};

// createBidHistory = function(data,bid,message) {
//   return Bids.findOne({id:bid.id})
//          .populate("user")
//          .populate("input").then(function(bidInfo){
//     var history = {};
//       let inputId = bidInfo.input.id;
//       let bidAmount = bidInfo.amount;
//       let bidReason = bidInfo.reason == undefined ? "" : bidInfo.reason;
//       let buyer = bidInfo.user.username;

//     history.bid = bidInfo.id;
//         history.amount  = bidInfo.amount;
//         history.input = inputId;
//         history.bidBy = bidInfo.user;
//         history.bidStatus = bidInfo.status;
//         history.quantity = bidInfo.quantity;
//         history.quantityUnit = bidInfo.quantityUnit;
//         history.bidRejectReason =  bidInfo.reason == undefined ? "" : bidInfo.reason;
//         if (message) {
//           history.comment = message
//         } else {
//               history.comment = "Bid Updated"
//           }

//         return Bidshistory.create(history).then(function(res) {
//           return true
//       }).fail(function(error) {
//         console.log("error111=======history", error);
//         return false
//       });
//   }).fail(function(error) {
//     console.log("error-========= history", error);
//     return false
//   });
// },


updateAndSellerPaymentCreated = function (data, bid, callbackF) {
    var history = {};
    console.log("opopopopopopopopopopopopopopopopopopop")
    return Bids.findOne({ id: data.id })
        .populate("user")
        .populate("input")
        .then(function (bidInfo) {

            console.log("ddddddddddbidInfo.input.id", bidInfo.input.id);

            let inputId = bidInfo.input.id;
            let bidAmount = bidInfo.amount;
            let bidReason = bidInfo.reason == undefined ? "" : bidInfo.reason;
            let buyer = bidInfo.user.username;

            history.bid = bidInfo.id;
            history.amount = bidInfo.amount;
            history.input = bidInfo.input;
            history.bidBy = bidInfo.user;
            history.bidStatus = bidInfo.status;
            history.quantity = bidInfo.quantity;
            history.quantityUnit = bidInfo.quantityUnit;
            history.bidRejectReason = bidInfo.reason == undefined ? "" : bidInfo.reason;
            history.comment = "Bid Accepted"

            return Bidshistory.create(history).then(function (res) {
                var inputQuery = {};

                return Inputs.findOne({ id: bidInfo.input.id }).then(function (inputinfo) {
                    var sellerPayments = [];
                    var sequenceNumber = 1;

                    var days = 0
                    days = days + inputinfo.sellerUpfrontDays

                    let upfrontObject = {
                        input: inputinfo.id,
                        bidId: bidInfo.id,
                        sellerId: inputinfo.user,
                        buyerId: bidInfo.user.id,
                        depositPercentage: inputinfo.sellerUpfrontPercentage,
                        depositLabel: "Upfront",
                        depositDays: inputinfo.sellerUpfrontDays,
                        pincode: inputinfo.pincode,
                        paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
                        type: "Upfront",
                        status: "Due",
                        productType: 'input',
                        sequenceNumber: sequenceNumber,
                        amount: parseFloat(bidInfo.amount * parseFloat(inputinfo.sellerUpfrontPercentage / 100))
                    }

                    sellerPayments.push(upfrontObject);

                    days = days + inputinfo.sellerFinalDays
                    let SequenceNumber = ++sequenceNumber;
                    let finalObject = {
                        input: inputinfo.id,
                        bidId: bidInfo.id,
                        sellerId: inputinfo.seller,
                        buyerId: bidInfo.user.id,
                        depositPercentage: inputinfo.sellerFinalPercentage,
                        depositLabel: "Final",
                        depositDays: inputinfo.sellerFinalDays,
                        pincode: inputinfo.pincode,
                        paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
                        type: "Final",
                        status: "Due",
                        productType: 'input',
                        sequenceNumber: SequenceNumber,
                        amount: parseFloat(bidInfo.amount * parseFloat(inputinfo.sellerFinalPercentage / 100))
                    }
                    sellerPayments.push(finalObject);

                    console.log("sellerPaymentssellerPayments", sellerPayments);

                    return Sellerpayment.create(sellerPayments)
                        .then(function (responseSellerPayment) {
                            console.log("responseSellerPayment**", responseSellerPayment);
                            // Save payments
                            return callbackF(true);
                        }).fail(function (error) {
                            return {
                                success: false,
                                error: {
                                    code: 400,
                                    message: error
                                }
                            }
                        });
                }).fail(function (error) {
                    return {
                        success: false,
                        error: {
                            code: 400,
                            message: error
                        }
                    }
                });
            }); // Create bid history
        });
}


createBidHistory = function (data, bid, message) {
    return Bids.findOne({ id: bid.id })
        .populate("user")
        .populate("input").then(function (bidInfo) {
            var history = {};
            let inputId = bidInfo.input.id;
            let bidAmount = bidInfo.amount;
            let bidReason = bidInfo.reason == undefined ? "" : bidInfo.reason;
            let buyer = bidInfo.user.username;

            history.bid = bidInfo.id;
            history.amount = bidInfo.amount;
            history.input = inputId;
            history.bidBy = bidInfo.user;
            history.bidStatus = bidInfo.status;
            history.quantity = bidInfo.quantity;
            history.quantityUnit = bidInfo.quantityUnit;
            history.bidRejectReason = bidInfo.reason == undefined ? "" : bidInfo.reason;
            if (message) {
                history.comment = message
            } else {
                history.comment = "Bid Updated"
            }

            return Bidshistory.create(history).then(function (res) {
                return true
            }).fail(function (error) {
                console.log("error111=======history", error);
                return false
            });
        }).fail(function (error) {
            console.log("error-========= history", error);
            return false
        });
},


    updateAndSellerPaymentCreated = function (data, bid, callbackF) {
        var history = {};
        console.log("opopopopopopopopopopopopopopopopopopop")
        return Bids.findOne({ id: data.id })
            .populate("user")
            .populate("input")
            .then(function (bidInfo) {

                console.log("ddddddddddbidInfo.input.id", bidInfo.input.id);

                let inputId = bidInfo.input.id;
                let bidAmount = bidInfo.amount;
                let bidReason = bidInfo.reason == undefined ? "" : bidInfo.reason;
                let buyer = bidInfo.user.username;

                history.bid = bidInfo.id;
                history.amount = bidInfo.amount;
                history.input = bidInfo.input;
                history.bidBy = bidInfo.user;
                history.bidStatus = bidInfo.status;
                history.quantity = bidInfo.quantity;
                history.quantityUnit = bidInfo.quantityUnit;
                history.bidRejectReason = bidInfo.reason == undefined ? "" : bidInfo.reason;
                history.comment = "Bid Accepted"

                return Bidshistory.create(history).then(function (res) {
                    var inputQuery = {};

                    return Inputs.findOne({ id: bidInfo.input.id }).then(function (inputinfo) {
                        var sellerPayments = [];
                        var sequenceNumber = 1;

                        var days = 0
                        days = days + inputinfo.sellerUpfrontDays

                        let upfrontObject = {
                            input: inputinfo.id,
                            bidId: bidInfo.id,
                            sellerId: inputinfo.user,
                            buyerId: bidInfo.user.id,
                            depositPercentage: inputinfo.sellerUpfrontPercentage,
                            depositLabel: "Upfront",
                            depositDays: inputinfo.sellerUpfrontDays,
                            pincode: inputinfo.pincode,
                            paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
                            type: "Upfront",
                            status: "Due",
                            productType: 'input',
                            sequenceNumber: sequenceNumber,
                            amount: parseFloat(bidInfo.amount * parseFloat(inputinfo.sellerUpfrontPercentage / 100))
                        }

                        sellerPayments.push(upfrontObject);

                        days = days + inputinfo.sellerFinalDays
                        let SequenceNumber = ++sequenceNumber;
                        let finalObject = {
                            input: inputinfo.id,
                            bidId: bidInfo.id,
                            sellerId: inputinfo.seller,
                            buyerId: bidInfo.user.id,
                            depositPercentage: inputinfo.sellerFinalPercentage,
                            depositLabel: "Final",
                            depositDays: inputinfo.sellerFinalDays,
                            pincode: inputinfo.pincode,
                            paymentDueDate: new Date(new Date().setDate(new Date().getDate() + days)).toISOString(),
                            type: "Final",
                            status: "Due",
                            productType: 'input',
                            sequenceNumber: SequenceNumber,
                            amount: parseFloat(bidInfo.amount * parseFloat(inputinfo.sellerFinalPercentage / 100))
                        }
                        sellerPayments.push(finalObject);

                        console.log("sellerPaymentssellerPayments", sellerPayments);

                        return Sellerpayment.create(sellerPayments)
                            .then(function (responseSellerPayment) {
                                console.log("responseSellerPayment**", responseSellerPayment);
                                // Save payments
                                return callbackF(true);
                            }).fail(function (error) {
                                return {
                                    success: false,
                                    error: {
                                        code: 400,
                                        message: error
                                    }
                                }
                            });
                    }).fail(function (error) {
                        return {
                            success: false,
                            error: {
                                code: 400,
                                message: error
                            }
                        }
                    });
                }); // Create bid history
            });
    }
