/**
 * LandController
 *
 * @description :: Server-side logic for managing lands
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var path = require('path');

var constantObj = sails.config.constants;
var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

module.exports = {
    exotelcallback: function (req, res) {
        console.log("yes getting callback == ", req.body)
        // API(ExotelService.exotelCallback, req, res);

        let data = req.body

        let updateData = {};
        updateData.mediaCallStatus = data.Status;
        updateData.startTime = data.StartTime;
        updateData.endTime = data.EndTime;
        updateData.recordingUrl = data.RecordingUrl;
        updateData.conversationDuration = data.ConversationDuration;
        updateData.mediaResponseType = 'terminate';
        updateData.mediaResponse = data;
        console.log(data, '1====response data of callback');
        ExotelCall.findOne({ mediaId: data['CallSid'] }).then(function (callInfo) {
            console.log(callInfo, '2===callInfo data of callback');

            if (callInfo) {
                ExotelCall.update({ id: callInfo.id }, updateData).then(function (callInfoUpdated) {
                    console.log(callInfo, '3==callInfo data of updated data===');
                    if (callInfoUpdated) {
                        return res.jsonx({
                            success: true,
                            data: "thanks we have saved it"
                        });
                    } else {
                        return res.jsonx({
                            success: false,
                            error: 'not updated'
                        });
                    }
                })
            } else {
                return res.jsonx({
                    success: false,
                    error: 'not found'
                });
            }
        })
    },

    exotel: function (req, res) {
        let landIntrestId = req.param('id');
        // console.log('sdfdsfa===', visitId)

        Landinterests.findOne({ id: landIntrestId })
            .populate('buyerId', { select: ['fullName', 'mobile', 'email', 'id'] }).populate('franchiseeId').populate('coordinator')
            .then(function (landVisitInfo) {
                if (landVisitInfo) {
                    // console.log(frnchiseeUserInfo, 'frncissinfo==')
                    let firstNumber = landVisitInfo.buyerId.mobile;
                    let secondNumber = undefined
                    if (landVisitInfo.franchiseeId && landVisitInfo.franchiseeId.mobile) {
                        secondNumber = landVisitInfo.franchiseeId.mobile;
                        console.log("secondNumberfranchisee")                        
                    } else if (landVisitInfo.coordinator && landVisitInfo.coordinator.mobile) {
                        secondNumber = landVisitInfo.coordinator.mobile;
                        console.log("secondNumbercoordinator")                        
                    }
                    console.log("firstNumber == ", firstNumber)
                    console.log("secondNumber == ", secondNumber)
                    // return 1;
                    if (secondNumber != undefined && firstNumber != undefined) {
                        exotelService.connectCall(firstNumber, secondNumber, function (error, response) {
                            if (!error) {
                                if (response) {
                                    let landId = landVisitInfo.landId;
                                    let landInterestId = landVisitInfo.id;
                                    // let landVisitId = landVisitInfo.id;
                                    let fromUserId = landVisitInfo.franchiseeId.id;
                                    let toUserId = landVisitInfo.buyerId.id;

                                    let data = {};
                                    data.landId = landId;
                                    data.landInterestId = landInterestId;
                                    // data.landVisitId = landVisitId;
                                    data.mediaCallStatus = response.Status;
                                    data.mediaCallStatus = response.Status;
                                    data.to = response.To;
                                    data.from = response.From;
                                    data.startTime = response.StartTime;
                                    data.endTime = response.EndTime;
                                    data.toUserId = toUserId;
                                    data.fromUserId = fromUserId;
                                    data.recordingUrl = '';
                                    data.conversationDuration = '';
                                    data.media = 'exotel';
                                    data.mediaResponse = response;
                                    data.mediaId = response.Sid;
                                    data.callSid = response.Sid;
                                    data.mediaResponseType = 'start';
                                    ExotelCall.create(data).then(function (exotelRes) {
                                        res.jsonx({
                                            success: true,
                                            data: exotelRes,
                                            message: 'Your call is connecting.'
                                        })
                                    })
                                } else {
                                    res.jsonx({
                                        success: false,
                                        error: error,
                                        errormsg: 'call not connected plz try again'
                                    })
                                }

                            } else {
                                res.jsonx({
                                    success: false,
                                    error: error
                                })
                            }
                        });
                    } else if (secondNumber != undefined) {
                        res.jsonx({
                            success: false,
                            error: {code: 400,message: 'FarmX coordinator number is not available'}
                        })
                    }  else if (firstNumber != undefined) {
                        res.jsonx({
                            success: false,
                            error: {code: 400,message: 'Your number is not available'}
                        })
                    }
                }
            })
    },

    exotelFromFranchisee: function (req, res) {
        let landIntrestId = req.param('id');
        // console.log('sdfdsfa===', visitId)

        Landinterests.findOne({ id: landIntrestId })
            .populate('buyerId', { select: ['fullName', 'mobile', 'email', 'id'] }).populate('franchiseeId')
            .then(function (landVisitInfo) {


                if (landVisitInfo) {
                    // console.log(frnchiseeUserInfo, 'frncissinfo==')
                    let firstNumber = landVisitInfo.buyerId.mobile;
                    let secondNumber = undefined
                    if (landVisitInfo.franchiseeId && landVisitInfo.franchiseeId.mobile) {
                        secondNumber = landVisitInfo.franchiseeId.mobile;
                    }
                    console.log("firstNumber == ", firstNumber)
                    console.log("secondNumber == ", secondNumber)
                    if (secondNumber != undefined && firstNumber != undefined) {
                        exotelService.connectCall(secondNumber, firstNumber, function (error, response) {
                            if (!error) {
                                if (response) {
                                    let landId = landVisitInfo.landId;
                                    let landInterestId = landVisitInfo.id;
                                    // let landVisitId = landVisitInfo.id;
                                    let fromUserId = landVisitInfo.franchiseeId.id;
                                    let toUserId = landVisitInfo.buyerId.id;

                                    let data = {};
                                    data.landId = landId;
                                    data.landInterestId = landInterestId;
                                    // data.landVisitId = landVisitId;
                                    data.mediaCallStatus = response.Status;
                                    data.mediaCallStatus = response.Status;
                                    data.to = response.To;
                                    data.from = response.From;
                                    data.startTime = response.StartTime;
                                    data.endTime = response.EndTime;
                                    data.toUserId = toUserId;
                                    data.fromUserId = fromUserId;
                                    data.recordingUrl = '';
                                    data.conversationDuration = '';
                                    data.media = 'exotel';
                                    data.mediaResponse = response;
                                    data.mediaId = response.Sid;
                                    data.callSid = response.Sid;
                                    data.mediaResponseType = 'start';
                                    ExotelCall.create(data).then(function (exotelRes) {
                                        res.jsonx({
                                            success: true,
                                            data: exotelRes,
                                            message: 'Your call is connecting.'
                                        })
                                    })
                                } else {
                                    res.jsonx({
                                        success: false,
                                        error: error,
                                        errormsg: 'call not connected plz try again'
                                    })
                                }

                            } else {
                                res.jsonx({
                                    success: false,
                                    error: error
                                })
                            }
                        });
                    } else if (secondNumber != undefined) {
                        res.jsonx({
                            success: false,
                            error: {code: 400,message: 'Your number is not available'}
                        })
                    }  else if (firstNumber != undefined) {
                        res.jsonx({
                            success: false,
                            error: {code: 400,message: 'Buyer number is not available'}
                        })
                    }
                }
            })
    },

    exotelFromAdmin: function (req, res) {
        let landIntrestId = req.param('id');

        Landinterests.findOne({ id: landIntrestId })
            .populate('buyerId', { select: ['fullName', 'mobile', 'email', 'id'] }).populate('coordinator')
            .then(function (landVisitInfo) {
                if (landVisitInfo) {
                    // console.log(frnchiseeUserInfo, 'frncissinfo==')
                    let firstNumber = landVisitInfo.buyerId.mobile;
                    let secondNumber = undefined
                    if (req.identity && req.identity.mobile) {
                        secondNumber = req.identity.mobile;
                        console.log("secondNumberFromidentity")
                    } else if (landVisitInfo.coordinator && landVisitInfo.coordinator.mobile) {
                        secondNumber = landVisitInfo.coordinator.mobile;
                    }
                    
                    console.log("firstNumber == ", firstNumber)
                    console.log("secondNumber == ", secondNumber)

                    if (secondNumber != undefined && firstNumber != undefined) {
                        exotelService.connectCall(secondNumber, firstNumber, function (error, response) {
                            console.log("error22 == ", error)
                            console.log("response22 == ", response)

                            if (!error) {
                                if (response) {
                                    let landId = landVisitInfo.landId;
                                    let landInterestId = landVisitInfo.id;
                                    // let landVisitId = landVisitInfo.id;
                                    let fromUserId = landVisitInfo.franchiseeId.id;
                                    let toUserId = landVisitInfo.buyerId.id;

                                    let data = {};
                                    data.landId = landId;
                                    data.landInterestId = landInterestId;
                                    // data.landVisitId = landVisitId;
                                    data.mediaCallStatus = response.Status;
                                    data.mediaCallStatus = response.Status;
                                    data.to = response.To;
                                    data.from = response.From;
                                    data.startTime = response.StartTime;
                                    data.endTime = response.EndTime;
                                    data.toUserId = toUserId;
                                    data.fromUserId = fromUserId;
                                    data.recordingUrl = '';
                                    data.conversationDuration = '';
                                    data.media = 'exotel';
                                    data.mediaResponse = response;
                                    data.mediaId = response.Sid;
                                    data.callSid = response.Sid;
                                    data.mediaResponseType = 'start';
                                    ExotelCall.create(data).then(function (exotelRes) {
                                        res.jsonx({
                                            success: true,
                                            data: exotelRes,
                                            message: 'Your call is connecting.'
                                        })
                                    })
                                } else {
                                    res.jsonx({
                                        success: false,
                                        error: error,
                                        errormsg: 'call not connected plz try again'
                                    })
                                }
                            } else {
                                res.jsonx({
                                    success: false,
                                    error: error
                                })
                            }
                        });
                    } else if (secondNumber != undefined) {
                        res.jsonx({
                            success: false,
                            error: {code: 400,message: 'Your/coordinator number is not available'}
                        })
                    }  else if (firstNumber != undefined) {
                        res.jsonx({
                            success: false,
                            error: {code: 400,message: 'Buyer number is not available'}
                        })
                    }
                }
            })
    },
};