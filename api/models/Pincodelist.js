/**
 * LandVisitSchedule.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
    autoCreatedAt: true,
    autoUpdatedAt: true,

    attributes: {
        officename: {
            type: 'string'
        },
        pincode: {
            type: 'integer'
        },
        officeType: {
            type: 'string'
        },
        Deliverystatus: {
            type: 'string'
        },
        divisionname: {
            type: 'string'
        },
        regionname: {
            type: 'string'
        },
        circlename: {
            type: 'string'
        },
        Taluk: {
            type: 'string'
        },
        Districtname: {
            type: 'string'
        },
        statename: {
            type: 'string'
        },
        Telephone: {
            type: 'integer'
        },


    }
};
