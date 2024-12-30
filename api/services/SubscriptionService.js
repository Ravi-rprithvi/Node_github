var Promise = require('bluebird'),
    promisify = Promise.promisify;
var constantObj = sails.config.constants;
var commonServiceObj = require('./commonService');

module.exports = {

    viewLandPlanInfo: function (data, context) {

        let landId = data.id;
        return Lands.findOne({ id: landId }).populate("subscriptionId").then(function (landInfo) {
            // console.log(landInfo, '=====')
            const myDate = new Date();
            if (landInfo.subscriptionExpiredDate > myDate) {
                let today = new Date();
                let ddstring = today.getDate().toString() + ''
                let mmstring = (today.getMonth() + 1).toString() + ''
                let dd = ddstring//.padStart(2, '0');
                let mm = mmstring//.padStart(2, '0');

                let yyyy = today.getFullYear();
                const oneDay = 24 * 60 * 60 * 1000;
                const firstDate = new Date(yyyy, mm, dd);
                let planDate = landInfo.subscriptionExpiredDate;
                let ddstring1 = planDate.getDate().toString() + ''
                let mmstring1 = (planDate.getMonth() + 1).toString() + ''

                let dd1 = ddstring1//.padStart(2, '0');
                let mm1 = mmstring1//.padStart(2, '0'); //January is 0!
                let yyyy1 = planDate.getFullYear();
                const secondDate = new Date(yyyy1, mm1, dd1);

                const diffDays = Math.round(Math.abs((secondDate - firstDate) / oneDay)); //console.log(diffDays);
                let previousAmount = 0;
                let previousDiscount = 0;
                // console.log(landInfo.subscriptionInfo.paymentType, '===')
                if (landInfo.subscriptionInfo && landInfo.subscriptionInfo.paymentType !== undefined) {
                    previousAmount = landInfo.subscriptionInfo.paymentType.price;
                    previousDiscount = landInfo.subscriptionInfo.paymentType.discount;
                    if (previousDiscount == 0) {
                        previousDiscount = 1
                    }
                } else {
                    if (landInfo.subscriptionInfo && landInfo.subscriptionInfo.price !== undefined) {
                        previousAmount = landInfo.subscriptionInfo.price;
                        previousDiscount = landInfo.subscriptionInfo.discount;
                        if (previousDiscount == 0) {
                            previousDiscount = 1
                        }
                    }
                }

                let planStartDate = landInfo.subscriptionStartDate;

                let ddstring2 = planStartDate.getDate().toString() + ''
                let mmstring2 = (planStartDate.getMonth() + 1).toString() + ''

                let dd2 = ddstring2//.padStart(2, '0');
                let mm2 = mmstring2//.padStart(2, '0'); //January is 0!
                let yyyy2 = planStartDate.getFullYear();
                const startDate = new Date(yyyy2, mm2, dd2);
                const toalDiffDays = Math.round(Math.abs((secondDate - startDate) / oneDay));
                let dayWiseAdjustAmount = 0;
                console.log(previousAmount, '-==', diffDays);
                // if (landInfo.subscriptionInfo.paymentScheme == "Monthly" && toalDiffDays <= 30) {
                //console.log(previousAmount, '-==', toalDiffDays);
                let preAmount = previousAmount - (previousAmount * previousDiscount / 100);
                let adjustAmount = preAmount / toalDiffDays;
                console.log(adjustAmount, 'adjustAmount upar')
                //let dayWiseAdjustAmount = adjustAmount * diffDays;
                dayWiseAdjustAmount = previousAmount - adjustAmount;
                //  }
                console.log(dayWiseAdjustAmount, 'dayWiseAdjustAmount')
                landInfo.adjustAmount = Math.round(dayWiseAdjustAmount);
                landInfo.noOfRemaingDays = diffDays;

                return {
                    success: true,
                    data: landInfo
                }

            } else {
                landInfo.adjustAmount = 0;
                landInfo.noOfRemaingDays = 0;
                return {
                    success: true,
                    data: landInfo
                }
            }

        })
    },
    updatePlandInLand: function (data, context) {
        let landId = data.id;
        let planId = data.planId;
        let paymentScheme = data.paymentScheme;
        if (planId) {
            return Subscriptions.findOne({ id: planId }).then(function (planInfo) {
                if (planInfo) {
                    return Lands.findOne({ id: landId }).then(function (landInfo) {
                        if (landInfo) {
                            let landData = {};
                            landData.subscriptionId = planId;
                            let index = planInfo.paymentType.findIndex(x => x.label === paymentScheme);

                            planInfo.paymentType = planInfo.paymentType[index];
                            landData.subscriptionInfo = planInfo;

                            landData.subscriptionStartDate = new Date();

                            if (paymentScheme == 'Hourly') {
                                let today = new Date();
                                let validity = planInfo.validity;
                                if (landInfo.subscriptionExpiredDate >= today) {
                                    let planExpiredDate = new Date(landInfo.subscriptionExpiredDate);
                                    planExpiredDate.setHours(planExpiredDate.getHours() + validity);
                                    landData.subscriptionExpiredDate = planExpiredDate;
                                } else {
                                    today.setHours(today.getHours() + validity);
                                    landData.subscriptionExpiredDate = today;

                                }

                            }
                            if (paymentScheme == 'Weekly') {
                                let week = new Date();

                                if (landInfo.subscriptionExpiredDate >= week) {
                                    let planExpiredDate = new Date(landInfo.subscriptionExpiredDate);
                                    planExpiredDate.setDate(planExpiredDate.getDate() + 7);
                                    landData.subscriptionExpiredDate = planExpiredDate;
                                } else {
                                    week.setDate(week.getDate() + 7);
                                    landData.subscriptionExpiredDate = week;

                                }

                            }
                            if (paymentScheme == 'Monthly') {
                                let month = new Date();
                                if (landInfo.subscriptionExpiredDate >= month) {
                                    let planExpiredDate = new Date(landInfo.subscriptionExpiredDate);
                                    planExpiredDate.setMonth(planExpiredDate.getMonth() + 1);
                                    landData.subscriptionExpiredDate = planExpiredDate;
                                    console.log("monthly aaya", landData.subscriptionExpiredDate)
                                } else {

                                    month.setMonth(month.getMonth() + 1);
                                    landData.subscriptionExpiredDate = month;
                                    // console.log("monthly else aaya", landData.subscriptionExpiredDate)

                                }

                            }
                            if (paymentScheme == 'Quarterly') {
                                let month = new Date();
                                if (landInfo.subscriptionExpiredDate >= month) {
                                    let planExpiredDate = landInfo.subscriptionExpiredDate;
                                    planExpiredDate.setMonth(planExpiredDate.getMonth() + 3);
                                    landData.subscriptionExpiredDate = planExpiredDate;
                                } else {

                                    month.setMonth(month.getMonth() + 3);
                                    landData.subscriptionExpiredDate = month;

                                }

                            }
                            if (paymentScheme == 'Half Yearly') {
                                let month = new Date();
                                if (landInfo.subscriptionExpiredDate >= month) {
                                    let planExpiredDate = landInfo.subscriptionExpiredDate;
                                    planExpiredDate.setMonth(planExpiredDate.getMonth() + 6);
                                    landData.subscriptionExpiredDate = planExpiredDate;
                                } else {

                                    month.setMonth(month.getMonth() + 6);
                                    landData.subscriptionExpiredDate = month;

                                }


                            } if (paymentScheme == 'Yearly') {
                                let year = new Date();
                                if (landInfo.subscriptionExpiredDate >= year) {
                                    let planExpiredDate = landInfo.subscriptionExpiredDate;
                                    planExpiredDate.setFullYear(planExpiredDate.getFullYear() + 1);
                                    landData.subscriptionExpiredDate = planExpiredDate;
                                } else {

                                    year.setFullYear(year.getFullYear() + 1);
                                    landData.subscriptionExpiredDate = year;

                                }

                            }

                            return Lands.update({ id: landId }, landData).then(function (land) {
                                if (land) {
                                    return {
                                        success: true,
                                        code: 200,
                                        data: land
                                    };
                                } else {
                                    return {
                                        success: false,
                                        error: {
                                            code: 400,
                                            message: "land not updated"
                                        },
                                    };
                                }

                            })
                        } else {
                            return {
                                success: false,
                                error: {
                                    code: 400,
                                    message: "please send valid land id"
                                },
                            };
                        }
                    })
                }
                else {
                    return {
                        success: false,
                        error: {
                            code: 400,
                            message: "plan not found"
                        },
                    };
                }

            })
        } else {
            return {
                success: false,
                error: {
                    code: 400,
                    message: "please enter valid plan id"
                },
            };
        }

    },
    addFreePlanInLand: function (data, context) {
        // console.log(data, 'data===');
        let landId = data.id;
        let planQry = {};
        planQry.isActive = true;
        planQry.price = 0;

        return Subscriptions.find(planQry).sort('createdAt DESC').then(function (planInfoData) {
            // console.log(planInfoData, "planInfoData=====");
            if (planInfoData && planInfoData.length > 0) {
                let planInfo = planInfoData[0];
                let landData = {};
                landData.subscriptionId = planInfo.id;
                let paymentScheme = planInfo.validityType;//data.paymentScheme;
                let index = planInfo.paymentType.findIndex(x => x.label === paymentScheme);
                landData.subscriptionInfo = planInfo.paymentType[index];
                planInfo.paymentType = planInfo.paymentType[index];
                landData.subscriptionInfo = planInfo;
                const myDate = new Date();
                const newDate = new Date(myDate);
                landData.subscriptionStartDate = myDate;
                if (paymentScheme == 'Hourly') {
                    let today = new Date();
                    let validity = planInfo.validity;

                    today.setHours(today.getHours() + validity);
                    landData.subscriptionExpiredDate = today;


                }
                if (paymentScheme == 'Weekly') {
                    let week = new Date();


                    week.setDate(week.getDate() + 7);
                    landData.subscriptionExpiredDate = week;



                }
                if (paymentScheme == 'Monthly') {
                    let month = new Date();

                    month.setMonth(month.getMonth() + 1);
                    landData.subscriptionExpiredDate = month;



                }
                if (paymentScheme == 'Quarterly') {
                    let month = new Date();


                    month.setMonth(month.getMonth() + 3);
                    landData.subscriptionExpiredDate = month;



                }
                if (paymentScheme == 'Half Yearly') {
                    let month = new Date();

                    month.setMonth(month.getMonth() + 6);
                    landData.subscriptionExpiredDate = month;




                } if (paymentScheme == 'Yearly') {
                    let year = new Date();


                    year.setFullYear(year.getFullYear() + 1);
                    landData.subscriptionExpiredDate = year;



                }



                return Lands.update({ id: landId }, landData).then(function (land) {
                    if (land) {
                        return {
                            success: true,
                            code: 200,
                            data: land
                        };
                    } else {
                        return {
                            success: false,
                            error: {
                                code: 400,
                                message: "land not updated"
                            },
                        };
                    }

                })

            }
            else {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: "plan not found"
                    },
                };
            }
        })
    },
    transectionCreate: function (reqData, context) {
        return Transactions.create(reqData).then(function (res) {
            return res;
        });
    },

    updatePlan: function (data, context) {
        let id = data.id;
        return Subscriptions.update({ id: id }, data).then(function (subs) {

            return {
                success: true,
                code: 200,
                data: subs
            };
        })
            .fail(function (err) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: err

                    },
                };
            });
    },
    getPlan: function (data, context) {
        let fndQuery = {};
        fndQuery.id = data.id;
        // console.log('meess==', fndQuery)
        return Subscriptions.findOne(fndQuery).then(function (subs) {
            return {
                success: true,
                code: 200,
                data: subs
            };


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
    planList: function (data, context) {
        let fndQuery = {};
        // console.log("====", data.isActive)
        if (data.isActive == 'true' || data.isActive == true) {
            fndQuery.isActive = true;

        }
        var sortBy = data.sortBy;
        if (sortBy) {
            sortBy = sortBy.toString();
        } else {
            sortBy = 'price Asc';
        }

        // fndQuery.isVerified = true;
        // console.log('meess==', fndQuery)
        return Subscriptions.find(fndQuery).sort(sortBy).then(function (subs) {

            return {
                success: true,
                code: 200,
                data: subs
            };


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
    createPlan: function (data, context) {
        let fndQuery = {};
        fndQuery.name = data.name;
        return Subscriptions.findOne(fndQuery).then(function (subs) {
            if (subs) {
                return {
                    success: false,
                    error: {
                        code: 400,
                        message: 'Plan already exist',

                    },
                };

            } else {
                return Subscriptions.create(data).then(function (subs) {
                    return {
                        success: true,
                        code: 200,
                        data: subs
                    };
                })
                    .fail(function (err) {
                        return {
                            success: false,
                            error: {
                                code: 400,
                                message: err
                            },
                        };
                    });
            }
        })

    },

}