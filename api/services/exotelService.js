var request = require('request');
var parseString = require('xml2js').parseString;
var constantObj = sails.config.constants;

var exotel_sid = constantObj.exotel.production.exotel_sid;
var exotel_token = constantObj.exotel.production.exotel_token;
var exophone = constantObj.exotel.production.exophone;
var api_key = constantObj.exotel.production.api_key;
var exotelUrl = 'https://' + api_key + ':' + exotel_token + '@api.exotel.com/v1/Accounts/' + exotel_sid + '/Calls/';
var exotelCallBackUrl = sails.config.PAYTM_API_URL;

module.exports = {
    exotelCallback: function (data, context, req, res) {
        // if (data.callSid != null || data.callSid != undefined) {

            console.log("data == ", data)
        let updateData = {};
        updateData.mediaCallStatus = data.Status;
        updateData.startTime = data.StartTime;
        updateData.endTime = data.EndTime;
        updateData.recordingUrl = data.RecordingUrl;
        updateData.conversationDuration = data.ConversationDuration;
        updateData.mediaResponseType = 'terminate';
        updateData.mediaResponse = data;
        console.log(data, '1====response data of callback');
        ExotelCall.findOne({ mediaId: data['callSid'] }).then(function (callInfo) {
            console.log(callInfo, '2===callInfo data of callback');

            if (callInfo) {
                ExotelCall.update({ id: callInfo.id }, updateData).then(function (callInfoUpdated) {
                    console.log(callInfo, '3==callInfo data of updated data===');
                    if (callInfoUpdated) {
                        return res.jsonx({
                            success: true,
                            data: callInfoUpdated
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

        // }
    },

    connectCall: function (firstNumber, secondNumber, callback) {
        let exourl = exotelUrl + 'connect';
        // console.log(url, 'url')
        var params = {
            From: "" + firstNumber,
            To: "" + secondNumber,
            CallerId: exophone,
            CallType: 'trans',
            StatusCallback: exotelCallBackUrl + '/exotel-callback',
            StatusCallbackEvents: ['terminal'],
        }
        console.log("params == ", params)
        console.log("exourl == ", exourl)
        makeRequest(exourl, params, function (error, response) {
            console.log("error == ", error)
            console.log("response == ", response)
            if (error) {
                callback(error, null);
            } else {
                callback(null, response.TwilioResponse.Call);
            }
        });




        // var request = require('request');
        
        // var options = {
        //     url: exourl,
        //     method: 'POST',
        //     // headers: {
        //     //     "authorization": constantObj.fast2SMS.key
        //     // },
        //     json: params
        // }

        // function reqcallback(error, response, body) {
        //     console.log("body", body)
        //     // console.log("exourl response == ", response)
        //     if (!error && response.statusCode == 200) {
        //             console.log("success")
        //         parseString(body, { explicitArray: false }, function (err, result) {
        //             console.log("result == ", result)
        //             callback(null, result);
        //         });
        //     } else {
        //             console.log("exourl failure == ", error)
        //         callback(error, null);
        //     }
        // }

        // request(options, reqcallback);
    },

    getCallDetails: function (id, callback) {
        let exourl = exotelUrl + id;
        request.get(exourl, function (error, response, body) {
            if (error) {
                callback(error, response);
            } else {
                parseString(response.body, { explicitArray: false }, function (err, result) {
                    callback(null, result.TwilioResponse.Call);
                });
            }
        });
    }
}

function makeRequest(url, params, callback) {
    request.post(url, { form: params }, function (error, response, body) {
        if (error) {
            callback(error, response);
        } else {
            parseString(response.body, { explicitArray: false }, function (err, result) {
                callback(null, result);
            });
        }
    });
}