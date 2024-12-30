/**
  * #DESC:  In this class/files crops related functions
  * #Request param: Crops add form data values
  * #Return : Boolen and sucess message
  * #Author: Rohitk.kumar
  */

var Promise = require('bluebird'),
    promisify = Promise.promisify;

module.exports = {

    deleteManufacturer: function (data, context) {
       
      return API.Model(Manufacturer).update(data.id,data)
        .then(function (manufacturers) {
            var result;
            if(manufacturers){
              result =  {"sucess": {
                        "Code": 200,
                        "Message": "Deleted"
                      }}
            } else {
              result =  {"error": {
                        "Code": 301,
                        "Message": "Failed"
                      }}
            }
      return {
                "Status": true,
                  result
                };
      });
    }

}; // End Crops service class