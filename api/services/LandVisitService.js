
var Promise = require('bluebird'),
    promisify = Promise.promisify;
var constantObj = sails.config.constants;
var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
var LandInterestService = require('./LandInterestService');
var pushService = require('../services/PushService.js');


module.exports = {
    scheduleNewVisit: function (data, context, req, res) {
        let qry = {};
        qry.id = data.landInterestId;

        let now = new Date()
        let visittime = new Date(data.visitTime)

        if (visittime < now) {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: 'Visit date can not be past date and time'
                }
            });
        } else {
            Landinterests.findOne(qry).populate('landId').then(function (lndInterestInfo) {
                if (lndInterestInfo.status == 'canceled') {
                    return res.jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: "Deal is canceled, can not revisit. Please book and pay again for this land"
                        },
                    });
                } else if (lndInterestInfo.status == 'failed') {
                    return res.jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: "Deal is fail, can not revisit. Please book and pay again for this land"
                        },
                    });
                } else if (lndInterestInfo.status == 'transferred') {
                    return res.jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: "Land already transferred to buyer. Can not schedule visit with franchisee."
                        },
                    });
                } else {
                    LandVisitSchedules.count({ landInterestId: lndInterestInfo.id, visitStatus: 'scheduled' }).then(function (scheviisiits) {
                        if (scheviisiits > 0) {
                            return res.jsonx({
                                success: false,
                                error: {
                                    code: 400,
                                    message: "Visit is already scheduled."
                                },
                            });
                        } else {
                            LandVisitSchedules.count({ landInterestId: lndInterestInfo.id }).then(function (allVisists) {
                                let sv = {}
                                sv.landId = lndInterestInfo.landId.id
                                sv.landInterestId = lndInterestInfo.id
                                sv.buyerId = lndInterestInfo.buyerId
                                sv.sellerId = lndInterestInfo.sellerId
                                sv.franchiseeId = lndInterestInfo.franchiseeId
                                sv.market = lndInterestInfo.marketId
                                sv.visitTime = new Date(data.visitTime)
                                sv.visitType = allVisists + 1
                                sv.dealDateTime = lndInterestInfo.createdAt
                                if (lndInterestInfo.coordinator) {
                                    sv.coordinator = lndInterestInfo.coordinator
                                }
                                LandVisitSchedules.create(sv).exec(function (error, reVisit) {
                                    if (error) {
                                        return res.jsonx({
                                            success: false,
                                            error: error
                                        });
                                    } else {
                                        var msg = "A visit for land id " + lndInterestInfo.landId.code + " is scheduled at " + commonService.longDateFormatWithTime(reVisit.visitTime)

                                        var notificationData = {};
                                        notificationData.productId = lndInterestInfo.landId.id;
                                        notificationData.land = lndInterestInfo.landId.id;
                                        notificationData.buyerId = lndInterestInfo.buyerId;
                                        notificationData.user = lndInterestInfo.buyerId;
                                        notificationData.productType = "lands";
                                        //notificationData.transactionOwner = u[0].id;
                                        // notificationData.transactionOwner = land.transactionOwner;
                                        notificationData.message = msg;
                                        notificationData.messageKey = "LAND_DEAL_VISIT_SCHEDULED_NOTIFICATION"
                                        notificationData.readBy = [];
                                        notificationData.messageTitle = 'Visit scheduled'
                                        let pushnotreceiver = [lndInterestInfo.buyerId]
                                        if (lndInterestInfo.franchiseeId != undefined) {
                                            pushnotreceiver.push(lndInterestInfo.franchiseeId)
                                        }

                                        Notifications.create(notificationData).then(function (notificationResponse) {

                                            if (notificationResponse) {
                                                commonService.notifyUsersFromNotification(notificationResponse, undefined)
                                                pushService.sendPushToUsersWithNotificationInfo(pushnotreceiver, notificationResponse)
                                            }

                                            if (lndInterestInfo.status == 'interested' || lndInterestInfo.status == 'deal_requested') {
                                                let interestUpdate = {};
                                                interestUpdate.status = 'revisit';

                                                Landinterests.update({ id: lndInterestInfo.id }, interestUpdate).then(function (lndInterestUpdae) {
                                                    return res.jsonx({
                                                        success: true,
                                                        data: {
                                                            deal: lndInterestUpdae,
                                                            message: "New visit is scheduled."
                                                        }
                                                    })
                                                })
                                            } else {
                                                return res.jsonx({
                                                    success: true,
                                                    data: {
                                                        deal: lndInterestInfo,
                                                        message: "New visit is scheduled."
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            })
                        }
                    })
                }
            })
        }
    },

    reschedule: function (data, context, req, res) {
        let visitId = data.id;
        let now = new Date()
        let visittime = new Date(data.visitTime)

        if (visittime < now) {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: 'Visit date can not be past date and time'
                }
            });
        } else {
            LandVisitSchedules.findOne({ id: visitId }).populate('landId').populate('market').populate('landInterestId').then(function (visitInfo) {
                if (visitInfo.visitStatus == 'scheduled') {
                    if (visitInfo) {
                        let visitTimeHistory = [];
                        if (visitInfo.visitTimeHistory) {
                            visitTimeHistory = visitInfo.visitTimeHistory
                        }
                        visitTimeHistory.push(
                            {
                                // visitDate: visitInfo.visitDate,
                                visitTime: visitInfo.visitTime,
                                scheduledBy: context.identity.id
                            }
                        );
                        let fndQry = {};
                        fndQry.id = visitInfo.id;
                        //data.visitStatus = 'scheduled';
                        data.visitTimeHistory = visitTimeHistory;
                        data.visitTime = visittime

                        LandVisitSchedules.update(fndQry, data).exec(function (error, updateVisit) {
                            if (error) {
                                return res.jsonx({
                                    success: false,
                                    error: err,

                                });
                            } else {
                                var msg = "Visit for land id " + visitInfo.landId.code + " is rescheduled at " + commonService.longDateFormatWithTime(updateVisit[0].visitTime)

                                var notificationData = {};
                                notificationData.productId = visitInfo.landId.id;
                                notificationData.land = visitInfo.landId.id;
                                notificationData.buyerId = visitInfo.buyerId;
                                notificationData.user = visitInfo.buyerId;
                                notificationData.productType = "lands";
                                //notificationData.transactionOwner = u[0].id;
                                // notificationData.transactionOwner = land.transactionOwner;
                                notificationData.message = msg;
                                notificationData.messageKey = "LAND_DEAL_VISIT_RESCHEDULED_NOTIFICATION"
                                notificationData.readBy = [];
                                notificationData.messageTitle = 'Visit rescheduled'
                                let pushnotreceiver = [visitInfo.buyerId]
                                if (visitInfo.franchiseeId != undefined) {
                                    pushnotreceiver.push(visitInfo.franchiseeId)
                                }

                                Notifications.create(notificationData).then(function (notificationResponse) {

                                    if (context.identity.id == visitInfo.franchiseeId) {
                                        let usersToSend = []
                                        usersToSend.push(visitInfo.buyerId)
                                        if (visitInfo.coordinator) {
                                            usersToSend.push(visitInfo.coordinator)
                                        }
                                        let landfor = visitInfo.landInterestId.dealType
                                        if (landfor == "Sell") {
                                            landfor = "Buy"
                                        }
                                        let sendSMSToFranchisee = {}
                                        sendSMSToFranchisee.variables = { "{#BB#}": landfor, "{#CC#}": visitInfo.landId.code, "{#DD#}": visitInfo.market.name }
                                        sendSMSToFranchisee.templateId = "42800"
                                        commonService.sendGeneralSMSToUsersWithId(sendSMSToFranchisee, usersToSend)
                                    }

                                    return res.jsonx({
                                        success: true,
                                        data: updateVisit,
                                        message: 'Visit rescheduled successfully.'
                                    })
                                })
                            }
                        })
                    } else {
                        return res.jsonx({
                            success: false,
                            error: 'not found',

                        });
                    }
                } else if (visitInfo.visitStatus == 'scheduled') {
                    return res.jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: 'please enter valid status'
                        }
                    });
                } else if (visitInfo.visitStatus == 'visited') {
                    return res.jsonx({
                        success: false,
                        error: {
                            code: 200,
                            message: 'You can not reschedule, since you have already visited there'
                        }
                    });
                } else if (visitInfo.visitStatus == 'not_visited') {
                    return res.jsonx({
                        success: false,
                        error: {
                            code: 200,
                            message: 'You have not visited there, you can only schedule new visit but can not reschedule this visit.'
                        }
                    });
                } else if (visitInfo.visitStatus == 'canceled') {
                    return res.jsonx({
                        success: false,
                        error: {
                            code: 200,
                            message: 'This visit was canceled, you can schedule a new visit.'
                        }
                    });
                }
            })
        }
    },

    dealVisitStatus: function (data, context, req, res) {
        if (data.visitStatus == "undefined" && data.visitStatus == null) {
            return res.jsonx({
                success: false,
                error: {
                    code: 200,
                    message: 'please enter valid status'
                }
            });
        }
        let visitId = data.id;
        LandVisitSchedules.findOne({ id: visitId }).populate('landId').populate('landInterestId').then(function (visitInfo) {
            if (visitInfo) {
                let now = new Date()
                let visittime = new Date(visitInfo.visitTime)
                if (data.visitStatus == 'not_visited' && (visittime > now)) {
                    return res.jsonx({
                        success: false,
                        error: {
                            code: 400,
                            message: 'Can not decide visit status as not visited before visit time'
                        }
                    });
                } else {
                    let lndQry = {};
                    lndQry.id = visitInfo.landInterestId;
                    let msg = ''
                    /*if (data.visitStatus == 'deal_requested' && visitInfo.visitStatus == 'visited') {
                        Landinterests.update(lndQry, { status: 'deal_requested' }).then(function (lndInterestInfo) {
                            //send sms to to buyer
                            let uniqueId = Date.now();
                            Landinterests.update(lndQry, { uniqueId: uniqueId }).then(function (lndInterestInfo) {
                                sendEmailForDeal(lndInterestInfo, data, context, req, res)
                            })
                            // return res.jsonx({
                            //     success: true,
                            //     data: 'message sent to user successfully'
                            // })
                        })*/

                    if (data.visitStatus == 'visited') {
                        msg = 'A visit took place for deal id ' + visitInfo.landInterestId.code
                    } else if (data.visitStatus == 'not_visited') {
                        msg = 'Visit did not happen for deal id ' + visitInfo.landInterestId.code
                    } else {
                        msg = 'Visit status updated'
                    }

                    let fndQry = {};
                    fndQry.id = visitInfo.id;
                    let visitData = {};
                    if (data.franchiseeFeedback) {
                        visitData.franchiseeFeedback = data.franchiseeFeedback
                    }
                    if (data.buyerFeedback) {
                        visitData.buyerFeedback = data.buyerFeedback
                    }
                    if (data.franchiseeQA) {
                        visitData.franchiseeQA = data.franchiseeQA
                    }
                    if (data.buyerQA) {
                        visitData.buyerQA = data.buyerQA
                    }

                    visitData.visitStatus = data.visitStatus;

                    LandVisitSchedules.update(fndQry, visitData).exec(function (error, updateVisit) {
                        if (error) {
                            return res.jsonx({
                                success: false,
                                error: err,

                            });
                        } else {
                            if (data.visitStatus == visitInfo.visitStatus) {
                                return res.jsonx({
                                    success: true,
                                    data: updateVisit,
                                    message: "Visit status updated"
                                })
                            } else {
                                var notificationData = {};
                                notificationData.productId = visitInfo.landId.id;
                                notificationData.land = visitInfo.landId.id;
                                notificationData.buyerId = visitInfo.buyerId;
                                notificationData.user = visitInfo.buyerId;
                                notificationData.productType = "lands";
                                //notificationData.transactionOwner = u[0].id;
                                // notificationData.transactionOwner = land.transactionOwner;
                                notificationData.message = msg;
                                notificationData.messageKey = "LAND_DEAL_VISIT_STATUS_UPDATE_NOTIFICATION"
                                notificationData.readBy = [];
                                notificationData.messageTitle = 'Visit info updated'
                                let pushnotreceiver = [visitInfo.buyerId]
                                if (visitInfo.franchiseeId != undefined) {
                                    pushnotreceiver.push(visitInfo.franchiseeId)
                                }

                                Notifications.create(notificationData).then(function (notificationResponse) {
                                    return res.jsonx({
                                        success: true,
                                        data: updateVisit,
                                        message: "Visit status updated"
                                    })
                                })
                            }
                        }
                    })
                }
            } else {
                return res.jsonx({
                    success: false,
                    error: {
                        code: 200,
                        message: 'Visit nof found'
                    }
                });
            }
        })
    },

    dealVisitCancel: function (data, context, req, res) {
        let visitId = data.id;
        LandVisitSchedules.findOne({ id: visitId }).populate('landId').populate('landInterestId').then(function (visitInfo) {
            if (visitInfo) {
                if (data.cancelReason == undefined || data.cancelReason == null) {
                    return res.jsonx({
                        success: false,
                        error: 'please enter cancel reason',

                    });
                }
                data.canceledBy = context.identity.id;
                let fndQry = {};
                fndQry.id = visitInfo.id;
                let visitData = {};
                visitData.cancelReason = data.cancelReason;
                visitData.cancelComment = data.cancelComment;
                visitData.canceledBy = context.identity.id;
                visitData.visitStatus = 'canceled';
                LandVisitSchedules.update(fndQry, visitData).exec(function (error, updateVisit) {
                    if (error) {
                        return res.jsonx({
                            success: false,
                            error: err,

                        });
                    } else {
                        // let lnddata = {};
                        // lnddata.cancelReason = data.cancelReason;
                        // lnddata.cancelComment = data.cancelComment;
                        // lnddata.canceledBy = context.identity.id;
                        // lnddata.status = 'canceled';
                        // Landinterests.update({ id: visitInfo.landInterestId }, lnddata).then(function (lndIn) {
                        //     if (lndIn) {
                        var msg = "Visit for land id " + visitInfo.landId.code + " is canceled due to " + data.cancelReason;

                        var notificationData = {};
                        notificationData.productId = visitInfo.landId.id;
                        notificationData.land = visitInfo.landId.id;
                        notificationData.buyerId = visitInfo.buyerId;
                        notificationData.user = visitInfo.buyerId;
                        notificationData.productType = "lands";
                        notificationData.message = msg;
                        notificationData.messageKey = "LAND_DEAL_VISIT_CANCELED_NOTIFICATION"
                        notificationData.readBy = [];
                        notificationData.messageTitle = 'Visit canceled'
                        let pushnotreceiver = [visitInfo.buyerId]
                        if (visitInfo.franchiseeId != undefined) {
                            pushnotreceiver.push(visitInfo.franchiseeId)
                        }
                        Notifications.create(notificationData).then(function (notificationResponse) {
                            return res.jsonx({
                                success: true,
                                message: 'Visit Canceled'
                            })
                        })
                    }
                })

            } else {
                return res.jsonx({
                    success: false,
                    error: 'not found',

                });
            }
        })
    },

    dealWiseVisits: function (data, context, req, res) {
        let page = data.page
        let count = parseInt(data.count)
        let skipNo = (page - 1) * count;
        let query = {}
        var search = data.search;
        if (data.franchiseeId) {
            query.franchiseeId = data.franchiseeId;
        }
        if (data.market) {
            query.market = data.market;
        }
        if (data.markets) {
            query.market = { $in: data.markets };
        }
        if (data.coordinator) {
            query.coordinator = data.coordinator;
        }
        if (data.dealId) {
            query.landInterestId = data.dealId;
        }
        if (data.visitStatus) {
            query.visitStatus = data.visitStatus;
        }

        if (data.dealType) {
            query.dealType = data.dealType;
        }

        if (data.from && data.to) {
            query.$and = [{ visitTime: { $gte: new Date(data.from) } }, { visitTime: { $lte: new Date(data.to) } }]
        }

        if (search) {
            query.$or = [
                { code: parseInt(search) },
                { khasraNo: { $regex: search, '$options': 'i' } },
                { pincode: { $regex: search, '$options': 'i' } },
                { price: parseFloat(search) },
                { area: parseFloat(search) },
                { seller: { $regex: search, '$options': 'i' } },
                { city: { $regex: search, '$options': 'i' } },
            ]
        }

        LandVisitSchedules.count(query).then(function (total) {
            LandVisitSchedules.find(query, { fields: ['dealDateTime', 'landInterestId'] }).sort({ 'dealDateTime': -1, 'landInterestId': -1 }).then(function (visits) {
                var a = [];
                visits.forEach(function (obj) {
                    if (a.includes(obj.landInterestId, 0) == false) {
                        a.push(obj.landInterestId);
                    }
                })

                Landinterests.find({ id: { $in: a }, }, { fields: ['visits', 'buyerId', 'sellerId', 'franchiseeId', 'landId', 'code', 'id', 'title', 'dealType', 'displayPrice', 'status', 'buyerCancelDeductionPercentage', 'registryDate', 'transferDate'] })
                    .populate('visits', { where: query, sort: { 'visitType': -1, 'visitTime': -1 }, select: ['visitTime', 'visitStatus', 'visitType', 'createdAt', 'dealDateTime', 'cancelReason', 'cancelComment', 'coordinator'] })
                    .populate('buyerId', { select: ['fullName', 'mobile', 'email', 'id'] })
                    .populate('sellerId', { select: ['fullName', 'mobile', 'email', 'id'] })
                    .populate('franchiseeId', { select: ['fullName', 'mobile', 'email', 'id'] })
                    .populate('landId', { select: ['code', 'id', 'pincode'] })
                    .skip(skipNo).limit(count)
                    .sort({ 'createdAt': -1 })
                    .then(function (interests) {
                        return res.status(200).jsonx({
                            success: true,
                            data: {
                                deals: interests,
                                total: a.length,
                                totalvisits: total
                            }
                        })
                    })
            })
        })
        /*LandVisitSchedules.count(query).then(function (total) {
            LandVisitSchedules.find(query).populate('buyerId', { select: ['fullName', 'mobile', 'email', 'id'] }).populate('sellerId', { select: ['fullName', 'mobile', 'email', 'id'] }).populate('franchiseeId', { select: ['fullName', 'mobile', 'email', 'id'] }).populate('landId', { select: ['code', 'id'] }).populate('landInterestId', { select: ['code', 'id', 'title', 'dealType', 'displayPrice', 'status'] }).sort({ 'visitTime': -1 }).skip(skipNo).limit(count).then(function (visits) {
                if (visits) {
                    // console.log(visits, 'visits=====')
                    var grouped = _.groupBy(visits, function (visit) {
                        if (visit.landInterestId && typeof visit.landInterestId.id != 'undefined') {
                            return visit.landInterestId.id;
                        }
                    });
                    let visitDataArrayFianl = []
                    for (dealId in grouped) {
                        let visitData = []
                        let buyerId = {};
                        let franchiseeId = {}
                        let sellerId = {}
                        let landId = {}
                        for (let i = 0; i < grouped[dealId].length; i++) {
                            if (i == 0) {
                                buyerId = grouped[dealId][i].buyerId;
                                franchiseeId = grouped[dealId][i].franchiseeId;
                                sellerId = grouped[dealId][i].sellerId;
                                landId = grouped[dealId][i].landId;
                                landInterestId = grouped[dealId][i].landInterestId;
                            }
                            // console.log(grouped[dealId][i])
                            delete grouped[dealId][i].landId;
                            delete grouped[dealId][i].buyerId;
                            delete grouped[dealId][i].sellerId;
                            delete grouped[dealId][i].franchiseeId;
                            delete grouped[dealId][i].landInterestId;
                            visitData.push(grouped[dealId][i]);
                        }
                        visitDataArrayFianl.push({ buyerId, franchiseeId, sellerId, landId, landInterestId, visits: visitData });

                    }

                    return res.status(200).jsonx({
                        success: true,
                        data: visitDataArrayFianl,
                        total: total
                    })
                } else {
                    return res.jsonx({
                        success: false,
                        error: 'not found',
                    });
                }
            })
        })*/
    },

    allVisits: function (data, context, req, res) {

        let page = data.page
        let count = parseInt(data.count)
        let skipNo = (page - 1) * count;
        let query = {}
        if (data.franchiseeId) {
            query.franchiseeId = data.franchiseeId;
        }
        if (data.coordinator) {
            query.coordinator = data.coordinator;
        }

        var search = data.search;
        if (data.dealId) {
            query.landInterestId = data.dealId;
        }
        if (data.market) {
            query.market = data.market;
        }
        if (data.markets) {
            query.market = { $in: data.markets };
        }
        if (data.visitStatus) {
            query.visitStatus = data.visitStatus;
        }

        if (data.dealType) {
            query.dealType = data.dealType;
        }

        if (data.from && data.to) {
            query.$and = [{ visitTime: { $gte: new Date(data.from) } }, { visitTime: { $lte: new Date(data.to) } }]
        }

        if (search) {
            query.$or = [
                { code: parseInt(search) },
                { khasraNo: { $regex: search, '$options': 'i' } },
                { pincode: { $regex: search, '$options': 'i' } },
                { price: parseFloat(search) },
                { area: parseFloat(search) },
                { seller: { $regex: search, '$options': 'i' } },
                { city: { $regex: search, '$options': 'i' } },
            ]
        }

        LandVisitSchedules.count(query).then(function (total) {
            LandVisitSchedules.find(query).populate('buyerId', { select: ['fullName', 'mobile', 'email', 'id'] }).populate('sellerId', { select: ['fullName', 'mobile', 'email', 'id'] }).populate('franchiseeId', { select: ['fullName', 'mobile', 'email', 'id'] }).populate('landId', { select: ['code', 'id'] }).populate('landInterestId', { select: ['code', 'id', 'title', 'dealType', 'displayPrice', 'status'] }).sort({ 'visitTime': -1 }).skip(skipNo).limit(count).then(function (visits) {
                return res.status(200).jsonx({
                    success: true,
                    data: {
                        visits: visits,
                        total: total
                    }
                })
            })
        })
    },

    assignCoordinatorVisit: function (data, context, req, res) {
        if (data.id && data.coordinator) {
            LandVisitSchedules.findOne({ id: data.id }).exec(function (error, deal) {
                if (error) {
                    return res.jsonx({
                        success: false,
                        error: error
                    })
                } else {
                    if (deal) {
                        if (deal.coordinator == data.coordinator) {
                            return res.jsonx({
                                success: false,
                                error: {
                                    code: 400,
                                    message: 'This user is already coordinator of this visit'
                                }
                            })
                        } else {
                            Users.findOne({ id: data.coordinator }).exec(function (error, cu) {
                                if (cu && (cu.roles == 'A' || cu.roles == 'SA')) {
                                    LandVisitSchedules.update({ id: data.id }, { coordinator: data.coordinator }).exec(function (error, li) {
                                        return res.jsonx({
                                            success: true,
                                            code: 200,
                                            data: {
                                                deal: li[0],
                                                message: 'Cordinator assigned'
                                            }
                                        })
                                    })
                                } else {
                                    return res.jsonx({
                                        success: false,
                                        error: {
                                            code: 400,
                                            message: 'Not a valid cordinator. Only admin user can be coordinator'
                                        }
                                    })
                                }
                            })
                        }
                    } else {
                        return res.jsonx({
                            success: false,
                            error: {
                                code: 400,
                                message: 'Visit not found'
                            }
                        })
                    }
                }
            })
        } else {
            return res.jsonx({
                success: false,
                error: {
                    code: 400,
                    message: 'Please provide visit and coordinator'
                }
            })
        }
    }
}