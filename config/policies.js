/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect
 * its actions individually.
 *
 * Any policy file (e.g. `api/policies/authenticated.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "authenticated")
 *
 * For more information on how policies work, see:
 * http://sailsjs.org/#!/documentation/concepts/Policies
 *
 * For more information on configuring policies, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.policies.html
 */


module.exports.policies = {

  /***************************************************************************
  *                                                                          *
  * Default policy for all controllers and actions (`true` allows public     *
  * access)                                                                  *
  *                                                                          *
  ***************************************************************************/

  '*': 'OAuthValidateAccessToken',

  OAuthController: {
    '*': 'OAuthValidateAccessToken',
    token: 'OAuthPublicClient'
  },
  StatesController: {
    '*': true,
  },
  UsersController: {
    '*': 'OAuthValidateAccessToken',
    //'index' : true,
    'forgotPassword': true,
    'signup': true,
    'signin': true,
    'register': true,
    'verify/:username': true,
    'verification/:code': true,
    'testotp/:number': true,
    'otp/:number': true,
    'userForgotPassword': true,
    'changePassword/:id': true,
    'userProfile': true,
    'setpassword': true,
    'notifi': true,
    'verifyOTPForRegistration': true,
    'resendRegisterationOTP': true,
    'changeRegisterationNumberForOTP': true,
    'requestOTPForLogin': true,
    'verifyOTPForLogin': true,
    'resendLoginOTP': true,
    'updateUser': true,
    'signUpPublicUser': true,
    'signUpBulkPublicUser': true,
    'signindealer': true,
    'signinCP': true,

  },
  ClientsController: {
    '*': 'OAuthValidateAccessToken',
    'register': true,
    'verify/:email': true
  },
  QualitycheckController: {
    '*': 'OAuthValidateAccessToken',
    'getQualityDetail': true,
    'getAllQuality': true
  },
  CropsController: {
    '*': 'OAuthValidateAccessToken',
    //'getAllCrops' : true,
    'getCrops': true,
    'show': true,
    'getFilters': true,
    'logisticCharges': true,
    "sellerPosetdCrops": true,
    "categoryOtherCrops": true,
    "cropSearch": true,
    "featuredCrop": true,
    "cropLanding": true,
    "othersellers": true,
    "farmersSoldCrops": true,
    "getPricesOfAllCrops": true,
    "cropSuggestion": true,
    "frontLands": true,
    "getConditions": true,
    'cropBids': true,
    'topCategoriesAndProducts': true,
    "cropModernationOrders": true,
    "sendEmailAfterTwoHour": true,
    "bulkUploadProduct": true,
    "getPublicCrops": true,
    'ttt': true
  },

  InputsController: {
    '*': 'OAuthValidateAccessToken',
    'getAllInputs': true,
    'show': true,
    'inputsByUser': true,
    'inputSearch': true,
    'frontInputs': true,
    'inputResponsePayTm': true,
    'featuredInput': true,
    'inputLanding': true,
    'InputCategoriesAndProducts': true,
    'similarInput': true

  },

  EquipmentController: {
    '*': 'OAuthValidateAccessToken',
    //'getAllEquipments' : true,
    'equipment/:id': true,
    'payHigh': true,
    'lastpayment': true,
    'frontequipments': true,
    'getEquipmentDetail': true,
    'cpexpaymentstatus': true,
    'getEquipmentFilters': true

  },
  ManufacturerController: {
    '*': 'OAuthValidateAccessToken',
    'getAllManufacturer': true,
  },
  LanguagesController: {
    '*': 'OAuthValidateAccessToken',
    'getLanguage': true,
    'getAllLang': true
  },
  GroupsController: {
    '*': 'OAuthValidateAccessToken',
    'getAllGroup': true,
  },
  LpartnersController: {
    '*': 'OAuthValidateAccessToken',
    'getAllLpartners': true
  },
  LogisticTripController: {
    '*': 'OAuthValidateAccessToken',
    'tripInfoFromOTTC': true,
    'requestOTTC': true,
    'readLocation': true
    // 'changeStatusOfOrder': true,
    // 'tripInfo': true,
    // 'updateLocations': true,
    // 'unexpireOTTC': true,
    // 'addPODInOrder' : true
  },
  LogisticpriceController: {
    'cropsroutepricecalculate': true
  },
  ExotelController: {
    '*': 'OAuthValidateAccessToken',
    //'exotel': true,
    'exotelcallback': true
  },
  LandInterestController: {
    '*': 'OAuthValidateAccessToken',
    'landResponsePayTm': true,
    //'totalCall': true
  },
  BecomeFranchiseeController: {
    '*': 'OAuthValidateAccessToken',
    'save': true
  },
  LandController: {
    '*': 'OAuthValidateAccessToken',
    'frontLands': true,
    'frontLandsFilter': true,
    'getHomeLand': true,
    'getHomeLandPastOrder': true,
    'landDetail': true,
    'relatedLand': true,
    'exotel': true,
    'exotelcallback': true,
    'getAllLands': true,
    'landsInfoForMap': true,
    'compareLand': true,
    'getVisibilityOfLands': true,
    'getFeaturedLand': true,
    'getRecentViewLand': true,
    'getMostPopularLand': true

  },
  CommonController: {
    '*': 'OAuthValidateAccessToken',
    'setting': true,
    'googleaddress': true,
    'generateHashCode': true,
    'getLatLong': true,
    'success': true,
    'failure': true,
    "deleteOrders": true,
    "sendpush": true,
    "mainSearch": true,
    "responsePayTm": true,
    "getDirections": true,
    "uploadPODFiles": true,
    "bidPaymentResponsePayTm": true,
    "sellerPaymentResponsePayTm": true,
    "contactUsFormMail": true,
    "readOrderEmailFile": true,
    'sendGeneralSMS': true
  },
  CategoryController: {
    '*': 'OAuthValidateAccessToken',
    'categories': true,
    'setting': true,
    'categorieslist': true,
    'frontFilterCategory': true,
    'subCategories': true,
    'allCategories': true,
    'categoryInformationWithProducts': true,
    'homepagecategory': true
  },
  RatingController: {
    'getAverageUserRating': true,
    'getAllRatings': true
  },
  SettingController: {
    'setting': true,
  },
  PaymentController: {
    'orderPlaceResponse': true,
    'frontFilterCategory': true
  },
  RatingController: {
    'getAverageUserRating': true,
    'getAllRatings': true
  },
  SettingController: {
    'setting': true,
  },
  PaymentController: {
    'orderPlaceResponse': true,
  },
  OrderController: {
    'orderPaymentResponsePayTm': true
  },
  PagesController: {
    'getfixTitle': true
  },
  NotificationController: {
    'getAllNotification': true,
    'getNotificationDetail': true
  },
  QaController: {
    '*': true,
  },
  PriceCollectorController: {
    '*': 'OAuthValidateAccessToken',
    'allPrice': true,
    'savePrice': true,
    'pcLogin': true,
    'updatePrice': true,
    'getPrice': true,
    'getAddedBy': true,
    'getAllMarketList': true,
    'frontendpricecategorylist': true,
    'frontendpricemarketlist': true,
    'availableCitiesForPrices': true
  },
  PackagingController: {
    '*': 'OAuthValidateAccessToken',
    'getPackagingTypeCropDetail': true,
    'getPackagingCategoryById': true
  },
  TestimonialController: {
    '*': 'OAuthValidateAccessToken',
    'list': true
  },

  BuyerRequirementController: {
    '*': 'OAuthValidateAccessToken',
    'list': true,
    'add': true,
    'addForLand': true,
    'submitotp': true,
    'updatesubscribe': true,
    'list': true,
    'verifyuser': true,
    'get': true,
    'categoryWiseRequirements': true,
    'statesWiseRequirements': true,
    'search': true,
    'LandRequirements': true
  },
  BlogsController: {
    '*': 'OAuthValidateAccessToken',
    'updateUserType': true,
    'updateCode': true,
    'uploadFarmer': true,
    'uploadFarmerWithoutPincode': true
  },

  SubscriptionController: {
    '*': 'OAuthValidateAccessToken',
    'ResponsePayTm': true,
    'planList': true
  },


  BidsController: {
    '*': 'OAuthValidateAccessToken',
    'fieldOfficerBidsDownloadIntoXls': true,
    'publicFieldOfficerBids': true
  },
  /*,
  BidsController:{
    '*' : true,
  },*/

  /***************************************************************************
  *                                                                          *
  * Here's an example of mapping some policies to run before a controller    *
  * and its actions                                                          *
  *                                                                          *
  ***************************************************************************/
  // RabbitController: {

  // Apply the `false` policy as the default for all of RabbitController's actions
  // (`false` prevents all access, which ensures that nothing bad happens to our rabbits)
  // '*': false,

  // For the action `nurture`, apply the 'isRabbitMother' policy
  // (this overrides `false` above)
  // nurture  : 'isRabbitMother',

  // Apply the `isNiceToAnimals` AND `hasRabbitFood` policies
  // before letting any users feed our rabbits
  // feed : ['isNiceToAnimals', 'hasRabbitFood']
  // }
};