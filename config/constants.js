// var constantObj = sails.config.constants;


var prices = [
    {
        minprice: 0,
        maxprice: 5000,
        label: "0 to 5000"
    },
    {
        minprice: 5001,
        maxprice: 10000,
        label: "5001 to 10000"
    },
    {
        minprice: 10001,
        maxprice: 25000,
        label: "10001 to 25000"
    },
    {
        minprice: 25001,
        maxprice: 50000,
        label: "25001 to 50000"
    },
    {
        minprice: 50001,
        maxprice: 100000,
        label: "50001 to 100000"
    },
    {
        minprice: 100001,
        maxprice: 1000000,
        label: "More Than 100001"
    },
];
var quantity = [
    {
        minquantity: 0,
        maxquantity: 10,
        label: "0 to 10"
    },
    {
        minquantity: 11,
        maxquantity: 50,
        label: "11 to 50"
    },
];


module.exports.constants = {

    code: {
        "COUNTRY": "+91",
    },

    pushEnv: {
        //"env": "prod"
        "env": "sandbox"

    },

    googlePlaces: {
        "key": "AIzaSyB84_b3sz-C67ERkmEnQXAu_EglmB-AG1g",
        "options": {
            "provider": "google",

            // httpAdapter: 'https', // Default
            "apiKey": "AIzaSyB84_b3sz-C67ERkmEnQXAu_EglmB-AG1g", // for Mapquest, OpenCage, Google Premier
            "formatter": null         // 'gpx', 'string', ...
        }
    },

    appUrls: {
        "FRONT_WEB_URL": "http://52.34.207.5:4073",
        //"FRONT_WEB_URL": "http://localhost:4200",
        // "ADMIN_WEB_URL": "http://52.34.207.5:4072",
        "ADMIN_WEB_URL": "http://localhost:4300",
        // "API_URL": "http://52.34.207.5:4071",
        //"API_URL": "http://172.24.2.247:1337",
        "API_URL": "http://192.168.0.141:1337",
        "PAYU_TEST_URL": "https://test.payumoney.com",
        "PAYU_PROD_URL": "https://www.payumoney.com",
        "API_WEB_URL": "https://lands-farmx-api.herokuapp.com"
    },

    payu: {
        "SALT": "e5iIg1jwi8",
        "KEY": "rjQUPktU",
        "Authorization": "y8tNAC1Ar0Sd8xAHGjZ817UGto5jt37zLJSX/NHK3ok=",
        "Refund_URL": "https://test.payumoney.com/treasury/merchant/refundPayment",
        "Refund_Status_TXNID": "https://test.payumoney.com/treasury/ext/merchant/getRefundDetailsByPayment",
        "Refund_Status_RFNDID": "https://test.payumoney.com/treasury/ext/merchant/getRefundDetails"
    },

    paytm_config: {
        //"MID": 'EFARME26455955393151',
        //"INDUSTRY_TYPE_ID": 'Retail',
        //"PAYTM_MERCHANT_KEY" : 'M4v9YSeDNSdgZpGO',
        // "MID": 'EFARME78610588610733',
        // "INDUSTRY_TYPE_ID": 'Retail109',
        // "PAYTM_MERCHANT_KEY" : 'Aqxbxxa1bfOSTmxU',
        // "PAYTM_EMAIL" : 'shakul.singh@efarmexchange.com',
        // "PAYTM_MOBILE" : '9810325211',
        // "SUCCESS_URI" : "common/success",
        // "FAILURE_URI" : "common/failure",
        // //"REFUND_URL" : "https://securegw-stage.paytm.in/refund/HANDLER_INTERNAL/REFUND"
        //"REFUND_URL" : "https://pguat.paytm.com/oltp/HANDLER_INTERNAL/REFUND"
        // "REFUND_URL":"https://business.paytm.com/developers/integration/paymentgateway/documentation#refundAPI"
        development: {
            "MID": 'EFARME26455955393151',
            "INDUSTRY_TYPE_ID": 'Retail',
            "PAYTM_MERCHANT_KEY": 'M4v9YSeDNSdgZpGO',
            "PAYTM_EMAIL": 'shakul.singh@efarmexchange.com',
            "PAYTM_MOBILE": '9810325211',
            "SUCCESS_URI": "common/success",
            "FAILURE_URI": "common/failure",
            "REFUND_URL": "https://securegw-stage.paytm.in/refund/HANDLER_INTERNAL/REFUND"
            //"REFUND_URL" : "https://pguat.paytm.com/oltp/HANDLER_INTERNAL/REFUND"    
        },
        production: {
            "MID": 'EFARME78610588610733',
            "INDUSTRY_TYPE_ID": 'Retail109',
            "PAYTM_MERCHANT_KEY": 'Aqxbxxa1bfOSTmxU',
            "PAYTM_EMAIL": 'shakul.singh@efarmexchange.com',
            "PAYTM_MOBILE": '9810325211',
            "SUCCESS_URI": "common/success",
            "FAILURE_URI": "common/failure",
            "REFUND_URL": "https://securegw.paytm.in/refund/HANDLER_INTERNAL/REFUND"
            // "REFUND_URL":"https://business.paytm.com/developers/integration/paymentgateway/documentation#refundAPI"
        }

        // production:{
        // "MID": 'EFARME78610588610733',
        // "INDUSTRY_TYPE_ID": 'Retail109',
        // "PAYTM_MERCHANT_KEY" : 'Aqxbxxa1bfOSTmxU',
        // "PAYTM_EMAIL" : 'shakul.singh@efarmexchange.com',
        // "PAYTM_MOBILE" : '9810325211',
        // "SUCCESS_URI" : "common/success",
        // "FAILURE_URI" : "common/failure",
        // "REFUND_URL":"https://business.paytm.com/developers/integration/paymentgateway/documentation#refundAPI"
        // }

    },

    terms_and_condition: {
        text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod",

    },

    messages: {
        //Registration and Login
        "FIRSTNAME_REQUIRED": "Firstname is required",
        "LASTNAME_REQUIRED": "Lastname is required",
        "USERNAME_REQUIRED": "Username is required",
        "MOBILE_REQUIRED": "Mobile is required",
        "PASSWORD_REQUIRED": "Password is required",
        "USER_EXIST": "Email or Mobile already exists. Please login.",
        "SOCIAL_USER_EXIST": "Social user Logged In",
        "SOCIAL_USER_LOGGED_IN": "Social user Logged In",
        "USERNAME_INACTIVE": "You are not authorize user.",
        "USERNAME_NOT_VERIFIED": "You are not yet verified your email Id.",
        "PHONE_NUMBER": "Phone number should contain 10 digit",
        "PHONE_INVALID": "Not a valid number",
        "REQUIRED_FIELD": "Fields required",
        "SUCCESSFULLY_REGISTERED": "Successfully registered",
        "SUCCESSFULLY_REGISTERED_NEEDS_OTP": "Please verify your account by entering OTP received in SMS.",
        "SUCCESSFULLY_LOGGEDIN": "Successfully logged in",
        "WRONG_USERNAME": "User does not exists",
        "WRONG_PASSWORD": "Password is wrong!",
        "CURRENT_PASSWORD": "Current Password is wrong!",
        "WRONG_OTP": "Wrong OTP! Please try again",
        "INVALID_USER": "Invalid User. Your email does not exist to our system.",
        "ALREADY_VERIFIED": "You have already verified your email. Please login to website.",
        "INVALID_IMAGE": "Invalid file format selected. Please select JPEG, JPG and PNG.",
        "NOT_UPLOADED": "There is some problem to upload thumbnail.",
        "INVALID_DOC": "Invalid type of document",
        "DATABASE_ISSUE": "There is some problem to fetch the record.",
        "DELETE_RECORD": "Record deleted successfully.",
        "STATUS_CHANGED": "Status has been changed successfully.",
        "INVALID_STATUS": "Invalid Status",
        "ADDED_SUCCESSFULL": "Congratulations! User has been added successfully. Login credential has been sent to registered email.",
        "SPACE_NOT_ALLOWED": "Space is not allowed",
        "INVAILD_MOMENT": "Faild: Invaild Moment object",
        "NOT_FOUND": "Not Found",
        "YOUR_ACCOUNT": "Your account has been",
        "CONTACT_ADMINISTRATOR": "Please contact to Administrator.",
        "SEND_MAIL_ISSUE": "There is some issue to send email.",
        "HIGH_CAPEX_PAYMENT_MAIL": "Equipment added by you is high capex equipment. So you need to pay to put advertise your equipment on our site. You have to pay a minimal amount of Rs.",
        "HIGH_CAPEX_PAYMENT_PART": "to display your equipment. Please click the link given below for the payment and follow the instructions:",
        "MAIL_SENT": "Your request send successfully.",
        "FROM": "from",
        "INTERESTED_MAIL": "is interested in buying your product. To know his contact details. Please follow the link given below:",
        "ERROR_MAIL": "There is some error to send mail to your email id.",
        "LINK_MAIL": "Link for reset passwork has been sent to your email id.",
        "INVALID_USER": "No such user exist",
        "PASSWORD_CHANGED": "Password has been changed",
        "RENT_SELECTED_BUYER_NOTIFICATION": "You request is accepted for",
        "RENT_SELECTED_BUYER_NOTIFICATION_PART": "Proceed soon with further step to get the equipment on rent.",
        "UNKNOW_ERROR_OCCURRED": "Unknow Error Occurred",
        "NOT_AUTHORIZED": "You are not authorized. Please contact to Administrator.",
    },

    twillio: {
        outboundPhoneNumber: "+18508055679",
        accountSid: "AC2a6215830a3cff90a47cdc3d8fafd364",
        authToken: "88fc29ca0a4d673232888c1ecf1bd806",
    },

    fast2SMS: {
        key: "A6vGXNSCUpganjEtfbscrV9W2DwYo0TBemKxZ7dPR13uiklLFHOVIRZYz1EeXBf2Pw7p3qhMD0Gbrukm",
        sender_id: "EFARMX",
        OTTC_TEMPLATED_ID: "12342",
        TRIPCANCELED_TEMPLATED_ID: "10627",
        VERIFYNUMBER_OTP_TEMPLATED_ID: "16186",
        LOGIN_OTP_TEMPLATED_ID: "16187",
        host: "https://www.fast2sms.com",
        sendSMSPath: "/dev/bulk"
    },

    pushNotificationInfo: {
        development: {
            serverKey: 'AAAAzGYI-II:APA91bGqID7cwu5Cj3_oPXoikmDyDVNcMQogInvlf58vODSFR9p1BKjxQzYCFP6_y6tleIYQ71gLz4OhW4rWqlmHc9QDNJeemGe9GEQuxchTDkDDI_qsLsOaL1olrQwFbFNlxDuDoUTb'
        },
        production: {
            serverKey: 'AAAAzGYI-II:APA91bGqID7cwu5Cj3_oPXoikmDyDVNcMQogInvlf58vODSFR9p1BKjxQzYCFP6_y6tleIYQ71gLz4OhW4rWqlmHc9QDNJeemGe9GEQuxchTDkDDI_qsLsOaL1olrQwFbFNlxDuDoUTb'
        }
    },

    pushNotificationFieldTransactionInfo: {
        development: {
            serverKey: 'AAAA0IIDSHw:APA91bG1sQJto0UFTnYdu5FRK8mHf5ywo-HNuJ-iIbPrbYJW_2SSHyPj628CrcDIveCaf1ZktX8kzKXxWpOhhG0ZEA-8Da_yG0wZeqfF8VkuCcnK1o8K8G_zNgTNQAncjo-Al3SUJchl'
        },
        production: {
            serverKey: 'AAAA0IIDSHw:APA91bG1sQJto0UFTnYdu5FRK8mHf5ywo-HNuJ-iIbPrbYJW_2SSHyPj628CrcDIveCaf1ZktX8kzKXxWpOhhG0ZEA-8Da_yG0wZeqfF8VkuCcnK1o8K8G_zNgTNQAncjo-Al3SUJchl'
        }
    },

    franchisee: {
        "FRANCHISEE_ADDED": "Congratulations! Franchisee User has been added successfully.",
        "UPDATED_SUCCESSFULLY": "User is successfully updated."
    },


    staticRoles: {
        ADMIN_CROP: "598c42bed820da2881c07329"
    },


    setting: {
        "SAVED_SETITING": "Setting saved successfully.",
        "UPDATED_SETITING": "Setting updated successfully.",
    },

    crops: {
        "ADDED_CROP": "Crop saved successfully.",
        "UPDATED_CROP": "Crop updated successfully.",
        "APPROVED_CROP": "Crop approved successfully.",
        "VERIFIED_CROP": "Crop verified successfully.",
        "EXPIRED_CROP": "Crop expired successfully.",
        "USER_NOT_FOUND": "User not found.",
    },

    input: {
        "ADDED_INPUT": "Input saved successfully.",
        "UPDATED_INPUT": "INPUT updated successfully.",
        "APPROVED_INPUT": "INPUT approved successfully.",
        "VERIFIED_INPUT": "INPUT verified successfully.",
        "FEATURED_INPUT": "INPUT featured successfully.",
        "EXPIRED_INPUT": "INPUT expired successfully.",
        "USER_NOT_FOUND": "User not found.",
    },


    equipment: {

        "ADDED_EQUIPMENT": "Equipment saved successfully",
        "UPDATED_EQUIPMENT": "Equipment updated successfully",
        "SUCCESSFULLY_DELETED": "Equipment has been successfully deleted",
        "ISSUE_ON_BID": "There is some problem",
        "ALREADY_PAID": "Someone has already paid amount for this product. Sorry for the inconvenience.",
        "ALREADY_REQUESTED": "You have already requested for this equipment",
        "RENT_REQUEST_SUCCESS": "Your request for renting equipment has been successfully done.",
        "EQUIPMENT_NOT_FOUND": "There are no requests for this equipment.",
        "UNABLE_TO_SAVE_PAYMENT": "Payment has been successfully done, but there is some problem to connect with the database.",
        "ACCESS_ON_FRONTEND": "Your Payment has been successfully done.Your posted equipment is available to the site now.",
        "VIEW_BUYER_REQ": "Your Payment has been successfully done for Buyer.Now you can view the buyer's detail.",


    },
    land: {
        "LAND_APPROVED": "Land Approved Successfully.",
        "LAND_REJECT": "Land Rejected.",
        "LAND_VERIFIED": "Land verified successfully.",
        "ADDED_LAND": "LAND saved successfully",
        "UPDATED_LAND": "LAND updated successfully",
        "EXISTED_LAND": "LAND allready existed",
        "ALREADY_REQUESTED_LAND": "You have already requested for this land",
        "RENT_REQUEST_SUCCESS_LAND": "There are no requests for this land.",
        "ALREADY_PAID_LAND": "Someone has already paid amount for this product. Sorry for the inconvenience.",
        "COMMON_ERROR": "Something wrong",
        "WORKING_START": '10:00:00',
        "WORKING_END": '19:00:00'
    },
    exotel: {
        development: {
            "exotel_sid": 'efarmexchange1',
            "exotel_token": '20efa62967e489662bd23353180566c6205883c37e8325fd',
            "exophone": '09513886363',
            "api_key": '4f517ce00810db6ca87067a54e9a76cef670e36b9e51d978'
        },
        production: {
            "exotel_sid": 'imperialholding1',
            "exotel_token": '375a2c2ef0dcedcf78607b54c3d7d05bfa70d901ead7b202',
            "exophone": '09513886363',
            "api_key": 'f8a21236781bf8df9a335304bde0975481f25fd249a73775    '
        }
    },

    languages: {
        "LANGUAGE_NOT_FOUND": "Language not found.",
        "ISSUE_ON_LANGUAGE": "There is some problem on language selection.",
    },

    blogs: {
        "SAVED_BLOGS": "Blog saved successfully.",
        "BLOG_ALREADY_EXIST": "Blog already exists.",
        "DATABASE_ISSUE": "There is some problem to fetch the blog detail.",
        "UPDATED_BLOG": "Blog updated successfully.",
        "UPDATED_BLOG_ISSUE": "There is some issue with updating blog.",
        "NOTHING_TO_UPDATE": "There is no changes to update.",
        "TITLE_REQUIRED": "Blog title required.",
        "DESCRIPTION_REQUIRED": "Blog description required.",
    },

    rating: {
        "SAVED_RATING": "Rating saved successfully.",
        "RATING_ALREADY_EXIST": "Rating already exists.",
        "UPDATED_RATING": "Rating updated successfully.",
        "UPDATED_RATING_ISSUE": "There is some issue with Rating.",
        "PARAM_ISSUE": "Parameters issue in your request.",
    },

    cpartners: {
        "SAVED_PARTNERS": "Channel Partner saved successfully.",
        "NAME_REQUIRED": "Name of Channel partner required.",
        "EMAIL_REQUIRED": "Channel partner's email required.",
        "MOBILE_REQUIRED": "Channel partner's mobile no. required.",
        "COMPANY_NAME_REQUIRED": "Comapny name required.",
        "ADDRESS_REQUIRED": "Address required.",
        "CPARTNER_ALREADY_EXIST": "Channel partner already exist.",
        "PINCODE_REQUIRED": "Pincode required.",
        "CITY_REQUIRED": "City required.",
        "DISTRICT_REQUIRED": "District required.",
        "STATE_REQUIRED": "State required.",
        "UPDATED_CPARTNER": "Channel partner updated successfully.",
        "ISSUE_IN_UPDATE": "There is some issue with updating channel partner.",
    },

    bids: {
        "Accepted_Bids": "Accepted",
        "Pending_Bids": "Pending",
        "Rejected_Bids": "Rejected",
        "Confirmed_Bids": "Confirmed",
        "SUCCESSFULLY_SAVED_BID": "Your bid has been successfully placed",
        "SUCCESSFULLY_LOGISTIC_SAVE": "Logistic partner and vehicles have been successfully",
        "SUCCESSFULLY_UPDATED_BID": "Your bid has been updated successfully",
        "SUCCESSFULLY_EXIST_BID": "Your bid is already exists",
        "BID_STOPPED": "Bid can not place, So Bid quantity is up to crop quantity.",
        "ISSUE_ON_BID": "There is some problem to bid on this crop.",
        "Refund_Payment": "Payment has been refunded successfully.",
        "DEPOSIT_PAYMENT": "Successfully updated the payment.",
        "REFUND_PAYMENT": "Amount refunded successfully.",
        "SUCCESSFULLY_APPROVED": "Bid has been successfully approved.",
        "STEPS_ADDED": "Payment steps added successfully.",
        "PAYMENT_APPROVE": "Your payment has been added successfully.",
        "SUCCESSFULLY_VERIFIED": "Payment has been successfully verified.",
        "ERROR_FINDING_CROP": "Crop is not available",
        "ERROR_FINDING_INPUT": "Input is not available",
        "SUCCESSFULLY_WITHDRAWAL_BID": "Your bid has been successfully withdrawal",
        "SUCCESSFULLY_REFUNDED_BID": "This bid has been successfully refunded",
        "SUCCESSFULLY_REJECTED_BID": "Bid is rejected",
    },

    proofOfProduct: {
        "SUCCESSFULLY_SAVED_POP": "Your proof of product is successfully saved.",
        "ALREADY_EXIST_POP": "Proof of product for this product already exists.",
        "VARIFIED_SUCCESSFULLY": "Proof of product is updated successfully.",
    },

    cart: {
        "SAVED_CART": "Cart saved successfully.",
        "CART_ALREADY_EXIST": "Cart already exists.",
        "DATABASE_ISSUE": "There is some problem to fetch the Cart detail.",
        "UPDATED_CART": "Cart updated successfully.",
        "DELETED_CART": "Cart deleted successfully.",
        "UPDATED_CART_ISSUE": "There is some issue with updating Cart.",
    },

    order: {

        "SUCCESSFULLY_REFUNDED_AMOUNT": "Your amount has been initiated successfully",
        "SAVED_ORDER": "Order saved successfully.",
        "ORDER_ALREADY_EXIST": "Order already exists.",
        "DATABASE_ISSUE": "There is some problem to fetch the Order detail.",
        "UPDATED_ORDER": "Order updated successfully.",
        "DELETED_ORDER": "Order deleted successfully.",
        "UPDATED_ORDER_ISSUE": "There is some issue with updating Order.",
    },
    market: {
        "SAVE_MARKET": "Market saved successfully.",
        "ALREADY_EXIST_MARKET": "Market already exists with same pincodes.",
        "EXIST_MARKET": "Market already exists. PLease use another name.",
        "DATABASE_ISSUE": "There is some problem to fetch the Market detail.",
        "UPDATE_MARKET": "Market updated successfully."
    },
    groups: {
        "CREATE_GROUP": "Group created Successfully",
        "GROUP_ALREADY_EXIST": "Group already exist",
        "GROUPNAME_REQUIRED": "Group name required",
        "USERS_REQUIRED": "Users required",
        "FAILED": "Not found",
        "SUCCESS": "Successfully add new member"
    },

    category: {
        "NAME_REQUIRED": "Category name required.",
        "TYPE_REQUIRED": "Category type required.",
        "VARIETY_REQUIRED": "Variety of Category required.",
        "CATEGORY_ALREADY_EXIST": "Category already exist.",
        "CATEGORY_SAVED": "Category saved successfully.",
        "UPDATED_CATEGORY": "Category updated successfully.",
        "ISSUE_IN_UPDATE": "There is some issue with updating category.",
    },

    sms: {
        "SMS_SENT": "SMS sent successfully.",
        "SMS_ERROR": "There is some issue to send message to user."
    },

    lpartner: {
        "LPARTNER_ALREADY_EXIST": "Logistic Partner already exist.",
        "LPARTNER_SAVED": "Logistic Partner saved successfully.",
        "CONTACT_PERSON_REQUIRED": "Contact persone for logistic partner is required.",
        "LPARTNER_PHONE_REQUIRED": "Mobile number is required for logistic Partner.",
        "LPARTNER_ISSUE": "There is some issue to save data.",
        "VEHICLE_REQUIRED": "Vehicle for logistic partner is required.",
        "NATIONAL_PERMIT_REQUIRED": "National permit for logistic partner is required.",
        "ISSUE_UPDATE_LPARTNER": "There is some issue with updating logistics partner.",
        "UPDATED_LPARTNER": "Logistic partner updated successfully.",
    },

    notification: {
        "UNABLE_TO_GET": "System is unable to get the details of Notification",
    },

    drivers: {
        "DRIVER_INFO_SAVED": "Driver info saved",
        "DRIVERS_UPDATED": "Driver information updated successfully",
        "DRIVER_NOT_FOUND": "Driver not found",
    },

    vehicles: {
        "VEHICLE_INFO_SAVED": "Vehicle info saved",
        "VEHICLE_UPDATED": "Vehicle information updated successfully",
        "VEHICLE_NOT_FOUND": "Vehicle not found",
    },

    filter: {
        "price": prices,
        "quantity": quantity,
        "type": ["all", "rent", "sell"]
    },
    price_collector: {
        "PRICE_COLLECTOR_INFO_SAVED": "Price collector info saved",
        "PRICE_COLLECTOR_UPDATED": "Price collector information updated successfully",
        "PRICE_COLLECTOR_NOT_FOUND": "Price collector not found",
        "PRICE_COLLECTOR_INFO_DELETED": "Price collector info deleted successfully",
        "PRICE_INFO_SAVED": "Price info saved",
    },
    S3_BUCKET: {
        dev_bucket: 'farmx-dev',
        pro_bucket: 'farmx',
        stag_bucket: 'farmx-staging',

    }



    /*const gmailSMTPCredentials : {
        "service": "gmail",
        "host": "smtp.gmail.com",
        "username": "osgroup.sdei@gmail.com",
        "password": "mohali2378"
    }
    const userTypes : {
        "superAdmin": "SA",
        "Admin": "A",
        "User": "U"
    };*/

}