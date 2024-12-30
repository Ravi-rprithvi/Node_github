/**
 * PriceCollectorController
 *
 * @description :: Server-side logic for managing wishlists
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

    // price collector api
    add: function (req, res) {
        return API(PriceCollectorService.save, req, res)
    },

    update: function (req, res) {
        return API(PriceCollectorService.update, req, res)
    },
    activeInactive: function (req, res) {
        return API(PriceCollectorService.activeInactive, req, res)
    },
    getAll: function (req, res) {
        return API(PriceCollectorService.list, req, res)
    },

    get: function (req, res) {
        return API(PriceCollectorService.get, req, res)
    },
    getAllSave: function (req, res) {
        return API(PriceCollectorService.getallsave, req, res)
    },

    availableCitiesForPrices: function (req, res) {
        return API(PriceCollectorService.availableCitiesForPrices, req, res)
    },

    //for pricing api
    pcLogin: (req, res) => {
        return API(PriceCollectorService.pclogin, req, res)
    },

    savePrice: (req, res) => {
        return API(PriceCollectorService.saveprice, req, res)
    },
    allPrice: (req, res) => {
        return API(PriceCollectorService.allprices, req, res)
    },

    verifyPrice: (req, res) => {
        return API(PriceCollectorService.verifyPrice, req, res)
    },

    updatePrice: (req, res) => {
        return API(PriceCollectorService.updateprice, req, res)
    },
    getPrice: function (req, res) {
        return API(PriceCollectorService.getprice, req, res)
    },
    getAddedBy: (req, res) => {
        return API(PriceCollectorService.getaddedby, req, res)
    },
    getAllMarketList: (req, res) => {
        return API(PriceCollectorService.getAllMarket, req, res)
    },
    frontendpricecategorylist: (req, res) => {
        return API(PriceCollectorService.frontendpricelistCategoryWise, req, res)
    },
    frontendpricemarketlist: (req, res) => {
        return API(PriceCollectorService.frontendpricelistMarketWise, req, res)
    }
};