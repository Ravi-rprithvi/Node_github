/**
./ngrok http 1337
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#!/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` (or `views/homepage.jade`, *
  * etc. depending on your default view engine) your home page.              *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  /*'/': {
    view: 'homepage'
  },*/

  /***************************************************************************
  *                                                                          *
  * Custom routes here...                                                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the custom routes above, it   *
  * is matched against Sails route blueprints. See `config/blueprints.js`    *
  * for configuration options and examples.                                  *
  *                                                                          *
  ***************************************************************************/
  //Authorization Routes

  //'get /readorderemailfile': 'CommonController.readOrderEmailFile',
  'get /cronfunction': 'CommonController.cronfunc',
  'get /sellercron': 'CommonController.sellerCron',
  'get /expired': 'CropsController.expiredCrops',
  'post /sendGeneralSMS': 'CommonController.sendGeneralSMS',


  'post /authorisation': 'OAuthController.token',
  'post /pushnotify': 'UsersController.notifi',
  'get /user/verify/:username': 'UsersController.verify/:username',
  'get /user/verification/:code': 'UsersController.verification/:code',
  'get /user/otp/:number': 'UsersController.otp/:number',

  'get /user/testotp/:number': 'UsersController.testotp/:number',

  'get /verify/:email': 'UsersController.verify/:email',
  'get /transectionOwner/:pincode': 'UsersController.transectionOwner',

  //Routes for common functions which will use for every module.
  'get /common': 'CommonController.getdetails',
  'post /upload': 'CommonController.uploadImages',
  'post /uploadcsv': 'CommonController.uploadCSVFiles', // form data upload image
  'delete /deletefile': 'CommonController.deleteUploadedCSVFile', // form data upload image
  'post /uploadpackaging': 'CommonController.uploadImagesPackaging',
  'post /uploadfile/:type': 'CommonController.uploadFiles', // form data upload image
  'post /uploadpodfile/:type': 'CommonController.uploadPODFiles', // form data upload image
  'post /uploadvideo/:type': 'CommonController.uploadVideoFile', // form data upload image
  'post /uploadfilegif/:type': 'CommonController.uploadFilesGif', // form data upload image
  'post /uploadgif': 'CommonController.uploadGif',
  'post /uploaddoc': 'CommonController.uploadDocument',
  'get /assets': 'CommonController.getAssets',
  'delete /deleteRecord': 'CommonController.delete',
  'put /changestatus': 'CommonController.changeStatus',
  'put /contactusmail': 'CommonController.contactUsFormMail',
  'get /hash': 'CommonController.hashGenerator',
  'post /googleaddress': 'CommonController.googleAddress',
  'get /latlong': 'CommonController.getLatLong',

  //'get /latlong' : 'CommonController.getLatLong',
  'post /cart-distance-address': 'CommonController.cartDistanceAddress',
  'post /hashpaytm': 'CommonController.postPayTm',
  'post /paytmresponse/:id': 'CommonController.responsePayTm',
  'post /hashpaytmbidpayment': 'CommonController.postPayTmForBidPayment',
  'post /paytmbidpaymentresponse/:id/:bidid': 'CommonController.bidPaymentResponsePayTm',
  'post /hashpaytmsellerpayment': 'CommonController.postPayTmForSellerPayment',
  'post /paytmsellerpaymentresponse/:id/:cropid': 'CommonController.sellerPaymentResponsePayTm',
  'post /getTotalDistanceAndTime': 'CommonController.getTotalDistanceAndTime',
  'post /direction': 'CommonController.getDirections',

  // Setting
  'get /setting/:type': 'SettingController.setting',
  'post /setting/add': 'SettingController.saveSetting',


  //exotel routes
  'post /exotel-callback': 'ExotelController.exotelcallback',
  'post /exotelLandDealCallBuyer': 'ExotelController.exotel',
  'post /exotelLandDealCallFranchisee': 'ExotelController.exotelFromFranchisee',
  'post /exotelLandDealCallCoordinator': 'ExotelController.exotelFromAdmin',

  //Lands Routes
  'get /mylands': 'LandController.getMyLands',
  'get /land/:id': 'LandController.show',
  'get /landdetail/:id': 'LandController.landDetail',
  'get /land': 'LandController.getAll',
  'get /landall': 'LandController.getAllLands',
  'get /visibilityLands': 'LandController.getVisibilityOfLands',

  'get /lands': 'LandController.frontLands',
  'get /landsfilter': 'LandController.frontLandsFilter',
  'get /franchiseelands': 'LandController.franchiseeLands',
  'post /land': 'LandController.add',
  'put /land/:id': 'LandController.update',
  'put /updateBannerLand/:id': 'LandController.updateBannerLand',
  'put /updatefinance/:id': 'LandController.updateFinance',
  'put /approve/land/:id': 'LandController.approveLand',
  'put /reject/land/:id': 'LandController.frnRejectLand',
  // 'put /verify/land/:id': 'LandController.verifyLand',
  'put /disapproveLand/:id': 'LandController.disapproveLand',
  'put /landemail/:id': 'LandController.landMail',
  'get /timeslot': 'LandController.timeSlot',
  'put /franchiseeapprove/:id': 'LandController.franchiseeApprove',
  'get /homeland': 'LandController.getHomeLand',
  'get /homelandpastorder': 'LandController.getHomeLandPastOrder',
  'get /relatedland': 'LandController.relatedLand',
  'get /adminlanddetail/:id': 'LandController.adminLandDetail',
  'get /canceltimeslot': 'LandController.cancelTimeSlot',
  'get /landsformap': 'LandController.landsInfoForMap',
  'delete /deleteLand/:id': 'LandController.delete',
  'get /compareland': 'LandController.compareLand',
  'get /featuredland': 'LandController.getFeaturedLand',
  'get /recentViewLand': 'LandController.getRecentViewLand',
  'get /mostPopularLand': 'LandController.getMostPopularLand',




  // Visit Schedule Routes
  'put /reschedule/:id': 'LandVisitScheduleController.reschedule',
  'put /deal-visit-status/:id': 'LandVisitScheduleController.dealVisitStatus',
  'put /deal-visit-cancel/:id': 'LandVisitScheduleController.dealVisitCancel',
  // 'get /scheduledvisits': 'LandVisitScheduleController.scheduledVisits',
  'get /dealwisevisits': 'LandVisitScheduleController.dealWiseVisits',
  'get /visits': 'LandVisitScheduleController.allVisits',
  'post /schedulenewvisit': 'LandVisitScheduleController.scheduleNewVisit',
  'put /assignCoordinatorToVisit/:id': 'LandVisitScheduleController.assignCoordinatorVisit',


  //Land Intrest Routes
  'put /landintereststatus/:id': 'LandInterestController.landInterestStatus',
  'post /land-hashpaytm': 'LandInterestController.postPayTm',
  'post /land-paytmresponse/:id': 'LandInterestController.landResponsePayTm',
  'post /land/place': 'LandInterestController.placeLand',
  'get /franchiseelandinterest': 'LandInterestController.franchiseeLandInterest',
  'get /mylandinterest': 'LandInterestController.myLandInterest',
  'get /sellerlandinterest/:landId': 'LandInterestController.sellerLandInterest',
  'get /getalllandinterest': 'LandInterestController.getAllLandInterest',
  'put /deal-status-change/:id': 'LandInterestController.dealStatusChange',
  'put /land-deal-cancel/:id': 'LandInterestController.LandDealCancel',
  'put /verify-deal-payments': 'LandInterestController.verifyDealPayments',
  'get /dealcompletedetails/:id': 'LandInterestController.getCompleteDetails',
  'put /assignCoordinatorToDeal/:id': 'LandInterestController.assignCoordinator',
  'put /addRegistryDateToDeal/:id': 'LandInterestController.addRegistryDate',
  'get /land/franchiseepayments': 'LandInterestController.landFranchiseePaymentList',
  'get /sellerLandDealPayments': 'LandInterestController.landSellerBidPayments',
  //land dashboard api
  'get /dashboard/land': 'LandInterestController.dashboardLand',
  'get /dashboard/totallands': 'LandInterestController.totalLandOfFranchisee',
  'get /dashboard/totalvisits': 'LandInterestController.totalVisitsOfFranchisee',
  'get /dashboard/totalfranchiseeamount': 'LandInterestController.totalFranchiseeAmount',
  'get /dashboard/totalRevenueDayWeekMonthWise': 'LandInterestController.totalRevenueDayWeekMonthWise',
  'get /dashboard/totalFranchiseeCommisionDayWeekMonthWise': 'LandInterestController.totalFranchiseeCommisionDayWeekMonthWise',
  'get /dashboard/totalRevenuePieChart': 'LandInterestController.totalRevenuePieChart',
  'get /dashboard/totalRevenueDuePaidPieChart': 'LandInterestController.totalRevenueDuePaidPieChart',
  'get /dashboard/topFranchiseeLands': 'LandInterestController.topFranchiseeLands',
  'get /dashboard/topDealFranchiseeLands': 'LandInterestController.topDealFranchiseeLands',
  'get /dashboard/topPerformanceFranchiseeLands': 'LandInterestController.topPerformanceFranchiseeLands',
  'get /dashboard/todayDeals': 'LandInterestController.todayDeals',
  'get /dashboard/todayMeetings': 'LandInterestController.todayMeetings',
  'get /dashboard/totalCall': 'LandInterestController.totalCall',



  //Equipments Routes
  'post /newequip': 'EquipmentController.save',

  'get /equipment': 'EquipmentController.getAllEquipments',
  'get /frontEquipment': 'EquipmentController.frontequipments',
  'put /equipment': 'EquipmentController.update',
  //'get /equipment/:id' : { model: 'equipment', blueprint: 'find'},
  'get /equipment/:id': 'EquipmentController.getEquipmentDetail',
  //'post /equipment' : 'EquipmentController.add',

  'post /equipment': 'EquipmentController.save',
  'get /myequipments': 'EquipmentController.myEquipments',
  'get /expiredEquipments': 'EquipmentController.expiredEquipments',
  'put /expire/equipment': 'EquipmentController.expire',
  'put /approve/equipment': 'EquipmentController.approveEquipment',
  'put /verify/equipment': 'EquipmentController.verifyEquipment',
  'put /elogistic': 'EquipmentController.logistic',
  'post /interested': 'EquipmentController.minterested',
  'get /interests': 'EquipmentController.interestedBuyers',
  'post /lastpayment': 'EquipmentController.lastpayment',
  'get /lowcapex': 'EquipmentController.requestedBuyers',
  'post /lowcapex': 'EquipmentController.buyNowLowCapex',
  'post /lowcapexpay': 'EquipmentController.payLow',
  'post /paylogistics': 'EquipmentController.payLogisticPayment',
  'post /sold': 'EquipmentController.soldOutEquipment',
  'get /buyer': 'EquipmentController.buyNowUserDetail',
  'post /rent': 'EquipmentController.rentEquipment',
  'delete /deleteRequests/:id': { model: 'rentequipment', blueprint: 'destroy' },
  'get /bookings': 'EquipmentController.listRentRequests',
  'get /mybookings': 'EquipmentController.mybookings',
  'get /acceptrequests': 'EquipmentController.acceptRentEquipmentRequests',
  'get /myrentbookings': 'EquipmentController.myrentbookings',
  'get /lowcapexbuyer': 'EquipmentController.lowCapexBuyerInfo',
  'post /rentPay': 'EquipmentController.payRent',
  'get /transactionDetails': 'EquipmentController.transactionDetails',
  'post /ordernow': 'EquipmentController.ordernow',
  'post /mark': 'EquipmentController.markApp',
  'delete /deleteOrder': 'EquipmentController.deleteOrder',
  'post /logisticPreference': 'EquipmentController.logisticPreference',
  'post /finance': 'EquipmentController.financeManagement',
  'post /highcapexpayment': 'EquipmentController.cpexpaymentstatus',
  'get /highcapexpayment': 'EquipmentController.cpexpaymentstatus',
  'post /buyerdelivery': 'EquipmentController.markDeliveredByBuyer',
  'get /equipmentfilter': 'EquipmentController.getEquipmentFilters',

  //User Routes
  'get /searchusers': 'UsersController.searchUsers',


  //User Routes
  'get /user': 'UsersController.getAllUsers',
  'get /activeuser': 'UsersController.activeUsers',
  'get /userinfo': 'UsersController.userProfile',
  'get /user/:id': 'UsersController.userProfileData',
  'get /userDetails': 'UsersController.userDetails',
  'put /updateFarmerFranchisee': 'UsersController.updateFarmerFranchisee',
  'get /alladminusers': 'UsersController.getAdminAndSuperAdminUsersBasicDetails',
  'get /dealerdeliverables': 'UsersController.dealerDeliverableFranchisee',
  //'get /user/:id' :{ model: 'users', blueprint: 'find'},
  'put /user/:id': { model: 'users', blueprint: 'update' },
  'delete /user/:id': { model: 'users', blueprint: 'destroy' },
  'post /user': 'UsersController.index',
  'post /adddealer': 'UsersController.addDealer',
  'put /updatedealer/:id': 'UsersController.updateDealerUser',
  'post /addfranchisee': 'UsersController.addFranchisee',
  'post /addchannelpartner': 'UsersController.addCP',
  'post /forgotpassword': 'UsersController.forgotPassword',
  'post /userForgotPassword': 'UsersController.userForgotPassword',
  'put /changepassword': 'UsersController.changePassword',
  'put /setpassword/:id': 'UsersController.setpassword',
  'get /register/resendotp/:id': 'UsersController.resendRegisterationOTP',
  'put /register/changenumber/:id': 'UsersController.changeRegisterationNumberForOTP',
  'put /user/changenumber/:id': 'UsersController.changeMobileNumber',
  'get /register/verifyotp/:id': 'UsersController.verifyOTPForRegistration',
  'get /signin/requestotp': 'UsersController.requestOTPForLogin',
  'get /signin/verifyotp/:id': 'UsersController.verifyOTPForLogin',
  'get /signin/resendotp/:id': 'UsersController.resendLoginOTP',
  'get /franchiseUsers': 'UsersController.usersInFranchisee',
  'put /updateFranchiseeUser/:id': 'UsersController.updateFranchiseeUser',
  'put /updatechannelpartneruser/:id': 'UsersController.updateCPUser',

  'get /users/dashboard': 'UsersController.userDashboardData',
  'get /users/newUsersdashboard': 'UsersController.userNewRegisteredData',

  //'get /user/:id' :{ model: 'users', blueprint: 'find'},
  'put /user/:id': 'UsersController.updateUser',//{ model: 'users', blueprint: 'update' },
  'delete /user/:id': { model: 'users', blueprint: 'destroy' },
  'post /user': 'UsersController.index',
  'post /addfranchisee': 'UsersController.addFranchisee',
  'post /addchannelpartner': 'UsersController.addCP',
  'post /forgotpassword': 'UsersController.forgotPassword',
  'post /userForgotPassword': 'UsersController.userForgotPassword',
  'put /changepassword': 'UsersController.changePassword',
  'put /setpassword/:id': 'UsersController.setpassword',
  'get /register/resendotp/:id': 'UsersController.resendRegisterationOTP',
  'get /resendemailverificatioinlink/:id': 'UsersController.resendEmailVerificationLink',
  'put /register/changenumber/:id': 'UsersController.changeRegisterationNumberForOTP',
  'put /user/changenumber/:id': 'UsersController.changeMobileNumber',
  'get /register/verifyotp/:id': 'UsersController.verifyOTPForRegistration',
  'get /signin/requestotp': 'UsersController.requestOTPForLogin',
  'get /signin/verifyotp/:id': 'UsersController.verifyOTPForLogin',
  'get /signin/resendotp/:id': 'UsersController.resendLoginOTP',
  'get /franchiseUsers': 'UsersController.usersInFranchisee',
  'put /updateFranchiseeUser/:id': 'UsersController.updateFranchiseeUser',
  'put /updatechannelpartneruser/:id': 'UsersController.updateCPUser',
  'delete /logout': 'UsersController.logout',

  'get /users/dashboard': 'UsersController.userDashboardData',
  'get /users/newUsersdashboard': 'UsersController.userNewRegisteredData',
  'get /users/usertypefieldofficerdata': 'UsersController.userTypeFieldOfficerData',
  //Crops Routes
  'get /crop/conditions/:id': 'CropsController.getConditions',
  'get /admin/crops': 'CropsController.getAllCrops',
  'get /crops': 'CropsController.getCrops',
  'get /crops/sellerposted': 'CropsController.sellerPosetdCrops',
  'get /crops/categorycrops': 'CropsController.categoryOtherCrops',
  'get /crops/:id': 'CropsController.show',
  'get /admin/crops/:id': 'CropsController.adminCropDetail',
  'get /mycrops': 'CropsController.mycrops',
  'get /crops/verify/:id': 'CropsController.verify',
  'post /crops-change-status': 'CropsController.cropChangeStatus',
  'get /crops/approve/:id': 'CropsController.approve',
  'put /crops/disapprove/:id': 'CropsController.disapprove',
  'get /crops/expire/:id': 'CropsController.expire',
  'get /crops/lcharges/:distance/:quantities': 'CropsController.logisticCharges',
  'get /crpland': 'CropsController.cropLanding',
  'get /cropsearch': 'CropsController.cropSearch',
  'get /featuredcrop': 'CropsController.featuredCrop',
  'get /othersellers': 'CropsController.othersellers',
  'get /frontCategory': 'CategoryController.frontFilterCategory',
  'get /homepageCategory': 'CategoryController.homepagecategory',
  'get /farmerCrops': 'CropsController.farmersSoldCrops',
  'get /prices': 'CropsController.getPricesOfAllCrops',
  'get /franchiseeCrops': 'CropsController.franchiseeCrops',

  'get /crop/approvedDashboard': 'CropsController.approvedDashboard',
  'get /crop/statusDashboard': 'CropsController.statusDashboard',
  'get /crop/categoryDashboard': 'CropsController.categoryDashboard',
  'get /verification/dashboard': 'CropsController.verificationDashboard',
  'get /cropbids/:id': 'CropsController.cropBids',
  'post /bulkUploadProduct': 'CropsController.bulkUploadProduct',
  'get /getPublicCrops': 'CropsController.getPublicCrops',


  // CROPS AGGREGATIOn
  'post /startaggregation': 'CropsController.aggregateFromCropId',
  'get /aggregationsuggestion': 'CropsController.sugggestedCropForAggregation',
  'put /addaggregation': 'CropsController.addCropAggregation',
  'put /removeaggreationcrop': 'CropsController.removeAggreationCrop',
  'put /publishaggregation': 'CropsController.publishAggregation',
  'get /cropsInAggregation/:id': 'CropsController.cropsInAggregation',

  //'get /closing' : 'CropsController.closing', 


  //Manufacturer Routes
  'get /allmanufacturer': 'ManufacturerController.getAllManufacturer',
  'get /manufacturer': 'ManufacturerController.allManufacturer',

  //Category Routse
  //Category Routes
  'post /category': 'CategoryController.save',
  'put /category': 'CategoryController.update',
  'get /allcategory': 'CategoryController.getAllCategory',
  'get /typecategory': 'CategoryController.categories',
  'get /category': 'CategoryController.allCategories',
  'get /category/list': 'CategoryController.categorieslist',
  'get /parentcat': 'CategoryController.parentCategories',
  'get /subcat/:id': 'CategoryController.subCategories',
  'get /subcatbyid/:id': 'CategoryController.subCategoriesbyid',


  //Roles & Permission Routes
  'post /permission': { model: 'roles', blueprint: 'create' },
  'get /permission': 'RolesController.getAllRoles',
  'get /permission/:id': { model: 'roles', blueprint: 'find' },
  'put /permission/:id': { model: 'roles', blueprint: 'update' },
  // 'delete /permission/:id' :{ model: 'roles', blueprint: 'destroy'},
  'delete /permission/:id': 'RolesController.deleteSeletectedRole',

  //Languages Routes
  'post /lang': { model: 'languages', blueprint: 'create' },
  'get /lang': 'LanguagesController.getLanguage',
  'get /loginuserlang': 'LanguagesController.getLoginUserLanguage',
  'put /languageupdatefromcsv': 'LanguagesController.updateKeysInLanguagage',

  'get /alllang': 'LanguagesController.getAllLang',

  //Blogs Routes
  'post /blogs': 'BlogsController.save',
  'get /blogs': 'BlogsController.getAllBlog',
  'put /blogs/:id': 'BlogsController.edit',

  //Channel Partner Routes
  // 'post /cpartners' : 'CpartnersController.save',
  // 'put /cpartners' : 'CpartnersController.update',


  /********************Start Input Module****************************/

  //Inputs Routes fron end and admin apis
  'get /inputCategoriesAndProducts': 'InputsController.InputCategoriesAndProducts',
  'get /similarInput': 'InputsController.similarInput',
  'get /inputs': 'InputsController.getAllInputs',
  'get /all-inputs': 'InputsController.allInputs',
  'post /inputs': 'InputsController.saveInput',
  'put /inputs': 'InputsController.editInput',
  'get /inputsdetail/:id': 'InputsController.detailInputs',
  'put /inputs/:id': 'InputsController.putInput',
  'post /input-bid': 'InputsController.placeBid',
  'get /my-inputs': 'InputsController.myInputs',
  'get /my-inputs-franchisee': 'InputsController.myInputsFranchisee',
  'get /inputland': 'InputsController.inputLanding',
  'get /input-search': 'InputsController.inputSearch',
  'get /frontinput': 'InputsController.frontInputs',
  'get /featured-input': 'InputsController.featuredInput',
  'get /userInputs': 'InputsController.inputsByUser',
  'post /input-hashpaytm': 'InputsController.inputPostPayTm',
  'post /input-paytmresponse/:id': 'InputsController.inputResponsePayTm',
  'get /inputs/:id': 'InputsController.show',
  'get /inputs-verify/:id': 'InputsController.verify',
  'get /inputs-approve/:id': 'InputsController.approve',
  'get /inputs-feature/:id': 'InputsController.feature',
  'post /input-change-status': 'InputsController.inputChangeStatus',
  // input bids API
  'get /input-mybids/:id': 'InputsController.myBids',
  'get /franchiseeinputs/:marketId': 'InputsController.inputsAtFranchisee',
  'get /inputorderrefund/:id': 'PaymentController.inputOrderRefund',
  'get /order/invoice/:id': 'InvoiceController.orderInvoice',

  // input bids API
  //'get /input-mybids/:id' : 'InputsController.myBids',
  // 'get /input-bidpayments/:id' : 'InputsController.franchiseeInput',
  'put /input-bid-accept/:id': 'InputsController.inputBidAccept',
  'get /input-bid-complete-details/:id': 'InputsController.getCompleteInputBidDetails',
  // paymemnt list for user
  'get /input-payments-list/:id': 'InputsController.inputPaymentsList',
  'put /input-update-deposit': 'InputsController.inputUpdateDeposit',

  'put /input-bid-reject/:id/:env': 'InputpaymentsController.inputBidReject', // bid id env for reject bid. refund

  'put /input-bid-dispatched/:id': 'InputpaymentsController.inputBidDispatched',
  'put /input-bid-delivered/:id': 'InputpaymentsController.inputDeliverBid',
  'put /input-bid-received/:id': 'InputpaymentsController.inputBidRecieved',



  // franchisee / seller dashboard
  'get /input-franchisee-delivery-bids': 'InputpaymentsController.inputFranchiseeDeliveryBids',
  'put /input-bid-add-etd/:id': 'InputpaymentsController.inputBidAssignETD',
  'get /input-franchisee-mymoney': 'InputpaymentsController.inputFranchiseeMoneyList',
  'get /input-bids-transactions/:id': 'InputpaymentsController.bidsInputsTransactions',
  'get /input-seller-money-status': 'InputpaymentsController.inputSellerMoneyStatus',
  'get /input-seller-money-status-wise': 'InputpaymentsController.inputSellerMoneyListStatusWise',
  'get /input-franchisee-money-status': 'InputpaymentsController.inputFranchiseeMoneyStatus',
  'get /input-franchisee-money-status-wise': 'InputpaymentsController.inputFranchiseeMoneyListStatusWise',

  // Dashboards APIs
  // Finance board APIs form input counts
  'get /input-buyer-finance-board': 'InputfinancedashboardController.inputBuyerfinanceDashboard',
  'get /input-financerefund': 'InputfinancedashboardController.inputFinanceRefundDashboard',
  'get /input-logistic-finance': 'InputfinancedashboardController.inputFinanceLogistic',
  'get /input-finance-logistic-dashboard': 'InputfinancedashboardController.inputFinanceLogisticDashboard',
  'get /input-sellerfinanceboard': 'InputfinancedashboardController.inputFinanceSellerDashboard',
  'get /input-franchisee-financeboard': 'InputfinancedashboardController.inputFinanceFranchiseeDashboard',
  'get /input-seller-bidpayments': 'InputfinancedashboardController.inputSellerBidPayments',
  // 'post /transactioncreate' : 'BidsController.createTransaction',

  // Details listing payment API
  'get /input-detail-payment': 'InputfinancedashboardController.inputPaymentListDetail',
  // 'get /paymentslist' : 'BidsController.paymentsList',
  // 'get /refundPayment' : 'BidsController.refundListDetail',
  // 'put /refundEarnest/:id' : 'BidsController.refundByFinance',
  // 'get /buyerrefundpayment/:id' : 'BidsController.getBuyerPayment',
  'put /input-verify-buyer-payments': 'InputfinancedashboardController.inputVerifyBuyerPayments',
  'put /input-verify-franchisee-payments': 'InputfinancedashboardController.inputVerifyFranchiseePayments',

  'get /input-seller-payment-list': 'InputfinancedashboardController.inputPaymentSellerListDetail',
  'put /input-verifysellerpayments': 'InputfinancedashboardController.verifyInputSellerPayments',
  'get /input-detail-logistic-payment': 'InputfinancedashboardController.inputPaymentLogisticListDetail',

  // Field Officer Bid buyer record API for buyer dashboard
  'get /input-fieldOfficerBid/allboard': 'InputfinancedashboardController.inputFieldOfficerBidAllDashboard',
  'get /input-fieldOfficerBid/board': 'InputfinancedashboardController.inputFieldOfficerBidInputDashboard',
  'get /field-officer-input-all-bids': 'InputfinancedashboardController.inputFieldOfficerBids',
  'get /input-fieldOfficerPayment/buyerBoard': 'InputfinancedashboardController.inputFieldOfficerPaymentsBuyerDashboard',
  'get /input-fieldOfficerPayment/sellerBoard': 'InputfinancedashboardController.inputFieldOfficerPaymentsSellerDashboard',
  'get /input-buyer/bidboard': 'InputfinancedashboardController.inputBuyerBidDashboard',
  'get /input-buyer/paymentboard': 'InputfinancedashboardController.inputBuyerPaymentsBuyerDashboard',
  // field Officer API for dahboard input order
  'get /field-officer-order-inputboard': 'InputfinancedashboardController.fieldOfficerOrderInputDashboard',
  'get /field-officer-order-allinput-board': 'InputfinancedashboardController.fieldOfficerOrderAllInputDashboard',
  'get /field-officer-input-all-order': 'InputfinancedashboardController.fieldOfficerInputOrders',


  // Logistics dashboard APIs form input
  'get /input-logistics-all': 'InputpaymentsController.inputLogisticAllDashboard',
  'get /input-logistics-active': 'InputpaymentsController.inputLogisticActiveDashboard',
  'get /input-logistics-confirmed': 'InputpaymentsController.inputLogisticConfirmedDashboard',
  'get /input-logistics-enroute': 'InputpaymentsController.inputLogisticEnrouteDashboard',
  'get /input-logistics-completed': 'InputpaymentsController.inputLogisticCompletedDashboard',
  'get /input-logistics-confirmedlist': 'InputpaymentsController.inputLogisticDashboardConfirmedListings',
  'get /input-logistics-activelist': 'InputpaymentsController.logisticInputDashboardActiveListings',
  'get /input-logistics-enroutelist': 'InputpaymentsController.inputLogisticDashboardEnrouteListings',
  'get /input-logistics-completedlist': 'InputpaymentsController.inputLogisticDashboardCompletedListings',

  'put /input-refund-initiate/:id': 'InputpaymentsController.initiateInputRefund',
  'put /input-bid-update/:id': 'InputsController.putBid',
  'get /input-refund-payment/:id/:env': 'InputpaymentsController.refundInputBidAmount', // withdrawl bid and refund payment
  // input bid APIs
  'get /input-bids/:id': 'InputpaymentsController.getBidInfo',
  'put /input-bid-assignlogistic/:id': 'InputpaymentsController.assignLogisticAndDeliveryTimeBid',

  // Field officer dashboard
  'get /input/approvedDashboard': 'InputfieldofficerdashboardController.approvedInputDashboard',
  'get /input/statusDashboard': 'InputfieldofficerdashboardController.statusInputDashboard',
  'get /input/categoryDashboard': 'InputfieldofficerdashboardController.categoryInputDashboard',


  /********************Input Module****************************/

  //payment cart Routes checkout 
  'get /multiple-crop': 'PaymentController.updatemultipleCrop',
  'post /save-cart-bulk': 'PaymentController.saveBulk',
  'post /save-cart': 'PaymentController.saveCart', // crop and input
  'put /update-cart/:id': 'PaymentController.updateCart',// crop and input
  'get /mycart': 'PaymentController.getMyCarts',// crop and input
  'get /user-cart': 'PaymentController.getUserCarts',// crop and input
  'post /destroy/carts': 'PaymentController.deletCarts',// crop and input
  'post /create-order': 'PaymentController.createOrder',// crop and input
  'post /paytm-hash': 'PaymentController.paytmHash',// crop and input order paytm
  'post /paytm-input-hash': 'PaymentController.paytmHashInput',// input order paytm
  'post /response-paytm-payment/:id': 'PaymentController.orderPlaceResponse',// crop and input
  'post /transaction-paytm-response': 'PaymentController.orderTransectionResponse', // Mobile trnsection after paytm// crop and input
  'get /buyer-cart-payment/:order': 'PaymentController.buyerCartPayments',// crop and input
  'put /buyer-cart-payment/:id': 'PaymentController.updateBuyerCartPayments',// crop and input

  'put /updatebuyerpaymentstatus/:id': 'PaymentController.updatebuyerpaymentstatus',//update buyer payment status
  'put /updatesellerpaymentstatus/:id': 'PaymentController.updatesellerpaymentstatus',//update seller payment status

  'get /user-order/:id': 'OrderController.getUserOrder',// crop and input
  'get /get-seller-sub-orders': 'OrderController.getSellerSubOrders',// crop and input
  'get /sub-order/:id': 'OrderController.getSubOrder',// crop and input
  'get /my-orders': 'OrderController.myOrders',// crop and input
  'put /update-suborder/:id': 'OrderController.updateSubOdrer',// crop and input
  'put /order-assignlogistic/:id': 'OrderController.assignLogisticAndDeliveryTimeSubOrder',// crop and input
  'get /crop-sub-orders-list/:crop': 'OrderController.getCropSubOrder',// crop

  'get /order-details/:id': 'OrderController.getOrderDetails',// crop and input
  'get /user-order': 'OrderController.getUserOrder',// crop and input
  'get /get-seller-sub-orders': 'OrderController.getSellerSubOrders',// crop and input
  'get /sub-order/:id': 'OrderController.getSubOrder',// crop and input
  'get /sub-order-detail/:id': 'OrderController.getSubOrderDetail',// crop and input
  'get /my-orders': 'OrderController.myOrders',// crop and input
  'get /userorders/:id': 'OrderController.userOrder',// crop and input
  'put /dealer-etd/:id': 'OrderController.createETD',// crop and input
  //'put /update-suborder/:id': 'OrderController.updateSubOdrer',// crop and input
  'put /update-suborder/:id': {
    controller: 'OrderController',
    action: 'updateSubOdrer',
    skipAssets: 'true',
    //swagger path object
    swagger: {
      methods: ['PUT', 'POST'],
      summary: ' Get Groups ',
      description: 'Get Groups Description',
      produces: [
        'application/json'
      ],
      tags: [
        'Groups'
      ],
      responses: {
        '200': {
          description: 'List of Groups',
          schema: 'Group', // api/model/Group.js,
          type: 'array'
        }
      },
      parameters: [],
      body: {
        status: { type: 'string', required: true },
      },

    }
  },
  'put /order-assignlogistic/:id': 'OrderController.assignLogisticAndDeliveryTimeSubOrder',// crop and input
  'get /crop-sub-orders-list/:crop': 'OrderController.getCropSubOrder',// crop
  'get /input-sub-orders-list/:input': 'OrderController.getInputSubOrder',// input
  'get /franchiseewise-sub-orders-count': 'OrderController.dealerOrderAtFranchiseeLevel',// input
  'get /dealer-sub-orders-franchisee/:id': 'OrderController.dealerOrdersAtSelectedFranchisee',// input
  'get /franchisee-input-wise-order': 'OrderController.FranchiseeInputOrders',// input
  'get /dealer-products-markets': 'OrderController.dealerMarketsAndProducts',// input
  'get /dealer-franchiseeproducts-order': 'OrderController.dealerOrderFranchiseeProductCombination',// input
  'get /dealer-productfranchisees-order': 'OrderController.dealerOrderProductFranchiseeCombination',// input
  'get /dealer-user-stats': 'OrderController.dealerDashboardUserStats',// dealer dashboard total order and total amount


  'post /hashpaytmorderpayment': 'OrderController.payTMHashForStepAndCod',// input
  'post /paytmorderpaymentresponse/:id/:sordid': 'OrderController.orderPaymentResponsePayTm',// input

  'get /dealer-dashboard-total-order-status': 'OrderController.totalOrderStatusCount',// input order status count
  'get /dealer-dashboard-total-products': 'OrderController.totalOrderProductsCount',// input product count

  'get /dealer-dashboard-today-sales-products': 'OrderController.totalTodaySalesProductsCount',// input product count
  'get /dealer-dashboard-top-sale-products': 'OrderController.topSalesProduct',// input product count

  'get /total-active-input': 'OrderController.totalActiveInput',// total active input product count
  'get /dealer-dashboard-top-sale-franchisee': 'OrderController.topFranchisee',// input product count
  'get /dealer-dashboard-total-franchisee-deliver': 'OrderController.totalFranchiseeSale',// input order total franchasiee delivery sale 

  'get /dealer-dashboard-total-sale': 'OrderController.totalSale',// input order total sale 
  'get /dealer-dashboard-top-received': 'OrderController.totalRecived',// input order total received amount sale 

  'get /franchisee-orders/:id': 'OrderController.franchiseeOrders',// crop and input
  'get /franchisee-delivery-order': 'OrderController.franchiseeDeliveryCropOrders',// crop
  'get /franchisee-delivery-input-order': 'OrderController.franchiseeDeliveryInputOrders', // input
  'get /dispatch-suborder/:id': 'OrderController.dispatchSubOdrer', // crop 
  'get /receive-suborder/:id': 'OrderController.receiveSubOdrer', // crop
  'put /deliver-suborder/:id': 'OrderController.deliverOrder', // crop
  'get /input-dispatch-suborder/:id': 'OrderController.dispatchInputSubOdrer', // input 
  'get /input-receive-suborder/:id': 'OrderController.receiveInputSubOdrer', // input
  'put /input-deliver-suborder/:id': 'OrderController.deliverInputOrder', // input
  'get /seller-suborder-payments': 'OrderController.sellerOrderPayments',// crop
  'get /seller-aggregation-suborder-payments': 'OrderController.sellerAggregationOrderPayments',// crop
  'get /seller-input-suborder-payments': 'OrderController.sellerInputOrderPayments',// input


  'get /cancel-order-refund/:id/:env': 'PaymentController.refundOrderAmount', // withdrawl bid and refund payment
  // 'put /cancel-suborder/:suborderId': 'PaymentController.CancelOrderPayments',// For crop and input CancelOrderPayments
  'get /seller-input-suborder-payments': 'OrderController.sellerInputOrderPayments',// input

  'get /franchiseepaymentdashboard': 'PaymentController.franchiseePaymentDashboard', //franchisee payment dashboard
  'get /franchiseemoneylist': 'PaymentController.franchiseeMoneyList',
  'get /cancel-order-refund/:id/:env': 'PaymentController.refundOrderAmount', // withdrawl bid and refund payment
  'put /cancel-suborder/:suborderId': 'PaymentController.CancelOrderPayments',// For crop and input CancelOrderPayments
  'put /updatecartmarket/:cartId': 'PaymentController.updateSelectedMarket',// For crop and input CancelOrderPayments

  // For Crop logistic Pending , Dispatched // logistics API for order and sub orders
  'get /logistics-order-count': 'OrderController.logisticOrderCountDashboard',
  'get /logistics-completed-order-count': 'OrderController.logisticOrderCompletedDashboard',
  'get /logistics-order-pending-list': 'OrderController.logisticPendingOrderListing',
  'get /logistics-order-enroute-list': 'OrderController.logisticDispatchedOrderListing',
  'get /logistics-order-completed-list': 'OrderController.logisticCompletedOrderListing',

  // For Input logistic Pending , Dispatched // logistics API for order and sub orders
  'get /logistics-input-order-count': 'OrderController.logisticInputOrderCountDashboard',
  'get /logistics-completed-input-order-count': 'OrderController.logisticInputOrderCompletedDashboard',
  'get /logistics-input-order-pending-list': 'OrderController.logisticPendingInputOrderListing',
  'get /logistics-input-order-enroute-list': 'OrderController.logisticDispatchedInputOrderListing',
  'get /logistics-input-order-completed-list': 'OrderController.logisticCompletedInputOrderListing',

  // field Officer API for dahboard
  'get /field-officer-order-cropboard': 'OrderController.fieldOfficerOrderCropDashboard',
  'get /field-officer-order-all-board': 'OrderController.fieldOfficerOrderAllDashboard',
  'get /field-officer-crop-all-order': 'OrderController.fieldOfficerOrders',

  // Logistic panel routes
  'put /logistic-payments-verify/:id': 'LogisticController.verifyPayments',
  'get /logistic-partner-payments': 'LogisticController.paymentLogisticListDetail',

  //Bids Routes
  'post /bids/place': 'BidsController.add',
  'post /bids/placemanually': 'BidsController.addManually',
  'put /bids/place/:id': 'BidsController.bidUpdate',
  'put /updatePendingBid/:id': 'BidsController.bidUpdatePending',
  'put /bid/assignETD/:id': 'BidsController.bidAssignETD',

  'put /bids/place/:id': 'BidsController.bidUpdate',
  'put /updatePendingBid/:id': 'BidsController.bidUpdatePending',
  'put /bid/assignETD/:id': 'BidsController.bidAssignETD',
  'put /bids/assignlogistic/:id': 'BidsController.bidAssignLogistic',
  'put /bids/update/:id': 'BidsController.putBid',
  'put /bid-update/:id': 'BidsController.putBidUpdate',
  'get /mybids/:id': 'BidsController.sellerBids',
  'get /mybids': 'BidsController.myBids',
  'put /bids/updatepackagingsize/:id': 'BidsController.updatepackagingsize',
  'get /bid/:id': 'BidsController.getBid',
  'get /bid/history/:id': 'BidsController.getBidsHistory',
  'put /bid/update/:id': 'BidsController.bidUpdate',
  'put /refundInitiate/:id': 'BidsController.initiateRefund',
  'put /bid/uploaddoc/:id': 'BidsController.uploadDocuments',
  'put /bid/reject/:id/:env': 'BidsController.bidReject', // seller reject bid and refund payments

  'put /bid/accept/:id': 'BidsController.bidAccept',
  'put /bid/dispatched/:id': 'BidsController.bidDispatched',
  'put /bid/delivered/:id': 'BidsController.bidDelivered',
  'put /bid/received/:id': 'BidsController.bidRecieved',
  'get /bid/historyAll/:cropid/:userid': 'BidsController.getBidsHistoryAll',
  'get /input-bid-historyAll/:inputid/:userid': 'BidsController.getInputBidsHistoryAll',
  'put /bid/logistic/:id': 'BidsController.saveLogistic',
  'get /refund/payment/:id/:env': 'BidsController.refundBidAmount', // withdrawl bid and refund payment
  'get /withdrawal/:id/:env': 'BidsController.withdrawalBid', // withdrawalBid by buyer
  'post /bids/payment': 'BidsController.payment',
  'get /crop/bids/transactions/:id': 'BidsController.bidsTransactions',
  'get /invoice/:id': 'InvoiceController.paymentInvoice',
  'get /invoicetransaction/:id': 'InvoiceController.fieldtransactionpaymentInvoice',
  'get /invoiceOrder/:id': 'InvoiceController.paymentOrderInvoice',
  'get /invoiceLandDeal/:id': 'InvoiceController.paymentLandDeaInvoice',
  'get /financeboard': 'BidsController.financeDashboard',
  'get /financerefund': 'BidsController.financeRefundDashboard',
  'get /financesellertake': 'BidsController.financeSellerRefundDashboard',
  'get /logisticfinance': 'BidsController.financeLogistic',
  'get /finance/logisticDashboard': 'BidsController.financeLogisticDashboard',
  'get /sellerfinanceboard': 'BidsController.financeSellerDashboard',
  'get /franchiseefinanceboard': 'BidsController.financeFranchiseeDashboard',
  'get /sellerBidPayments': 'BidsController.sellerBidPayments',

  'get /sellerAggregationBidPayments': 'BidsController.sellerBidPaymentsAggregatedCrops',
  'get /finance/input/paymentmethodcount': 'OrderController.financeBoardPaymentMethodCount',
  'get /sellerfinanceboard': 'BidsController.financeSellerDashboard',
  'get /sellerBidPayments': 'BidsController.sellerBidPayments',
  'get /bid/completeDetails/:id': 'BidsController.getCompleteBidDetails',
  'post /transactioncreate': 'BidsController.createTransaction',

  'put /paymentApproval': 'BidsController.paymentApproval',
  'put /updateDeposit': 'BidsController.updateDeposit',
  'put /updateSellerDeposit/:id': 'BidsController.updateSellerDeposit',

  'put /updateBuyerRefund/:id': 'BidsController.updateBuyerDeposit',

  'put /updateLogisticPayment/:id': 'BidsController.updateLogisticPayment',
  'put /updateFranchiseDeposit/:id': 'BidsController.updateFranchiseDeposit',

  'get /differentQuantityList': 'BidsController.receivedDifferentQuantityList',
  'get /paymentslist': 'BidsController.paymentsList',
  'get /detailPayment': 'BidsController.paymentListDetail',
  'get /detailPaymentland': 'BidsController.paymentListDetailLand',

  'get /refundPayment': 'BidsController.refundListDetail',
  'get /refundPaymentland': 'BidsController.refundListDetailLand',
  'get /sellerToTakePayments': 'BidsController.sellerRefundList',
  'get /sellerToTakePaymentsland': 'BidsController.sellerRefundListLand',

  'put /refundEarnest/:id': 'BidsController.refundByFinance',
  'get /buyerrefundpayment/:id': 'BidsController.getBuyerPayment',
  'get /detailSellerPayment': 'BidsController.paymentSellerListDetail',
  'get /detailSellerPaymentland': 'BidsController.paymentSellerListDetailLand',
  'get /detailLogisticPayment': 'BidsController.paymentLogisticListDetail',
  'put /updateLogisticRemarkPayment/:id': 'BidsController.updateRemarkLogisticPayment',
  'get /detailFranchiseePayment': 'BidsController.paymentFranchiseeListDetail',
  'get /detailFranchiseePaymentLand': 'BidsController.paymentFranchiseeListDetailLand',

  'get /franchiseemoneylist': 'BidsController.franchiseeMoneyList',
  'get /refundPayment': 'BidsController.refundListDetail',
  'get /sellerToTakePayments': 'BidsController.sellerRefundList',
  'put /refundEarnest/:id': 'BidsController.refundByFinance',
  'get /buyerrefundpayment/:id': 'BidsController.getBuyerPayment',
  'get /detailSellerPayment': 'BidsController.paymentSellerListDetail',
  'get /detailLogisticPayment': 'BidsController.paymentLogisticListDetail',
  'put /updateLogisticRemarkPayment/:id': 'BidsController.updateRemarkLogisticPayment',
  'get /detailFranchiseePayment': 'BidsController.paymentFranchiseeListDetail',//crop detail franchiess payment
  'get /inputdetailFranchiseePayment': 'BidsController.inputPaymentFranchiseeListDetail',//input detail franchiess payment

  'put /verifypayments': 'BidsController.verifyPayments',
  'put /verifysellerpayments': 'BidsController.verifySellerPayments',
  'put /verifyFranchiseePayments': 'BidsController.verifyFranchiseePayments',
  'get /sellerpayment/:id': 'BidsController.getSellerPayment',
  // 'get /buyerpayment/:id': 'BidsController.getBuyerPayment',

  'get /franchiseepayment/:id': 'BidsController.getFranchiseePayment',
  'get /logisticpayment/:id': 'BidsController.getLogisticPayment',
  'post /addProofOfProduct': 'BidsController.addProofOfProduct',
  'get /proofOfProduct': 'BidsController.getProofOfProduct',
  'put /verifyProofOfProduct/:id': 'BidsController.verifyProofOfProduct',
  'get /canAddProofOfProduct': 'BidsController.canAddProofOfProduct',
  'get /franchiseeBids': 'BidsController.franchiseeBids',
  'get /addedProofOfProduct': 'BidsController.addedProofOfProduct',
  'get /bidsToAddProofOfProduct': 'BidsController.bidsToAddProofOfProduct',
  'get /franchiseeDeliveryBids': 'BidsController.franchiseeDeliveryBids',

  'get /logistics/all': 'BidsController.logisticAllDashboard',


  'get /logistics/active': 'BidsController.logisticActiveDashboard',
  'get /logistics/confirmed': 'BidsController.logisticConfirmedDashboard',
  'get /logistics/enroute': 'BidsController.logisticEnrouteDashboard',
  'get /logistics/completed': 'BidsController.logisticCompletedDashboard',
  'get /logistics/confirmedlist': 'BidsController.logisticDashboardConfirmedListings',
  'get /logistics/enroutelist': 'BidsController.logisticDashboardEnrouteListings',
  'get /logistics/completedlist': 'BidsController.logisticDashboardCompletedListings',
  'get /logistics/activelist': 'BidsController.logisticDashboardActiveListings',

  'get /fieldOfficerBid/cropboard': 'BidsController.fieldOfficerBidCropDashboard',
  'get /fieldOfficerBid/allboard': 'BidsController.fieldOfficerBidAllDashboard',
  'get /all-crop-bids': 'BidsController.publicFieldOfficerBids',
  'get /field-officer-crop-all-bids': 'BidsController.fieldOfficerBids',
  'get /field-officer-crop-all-bids-download': 'BidsController.fieldOfficerBidsDownloadIntoXls',

  'get /field-officer-crop-all-bids': 'BidsController.fieldOfficerBids',

  'get /fieldOfficerPayment/buyerBoard': 'BidsController.fieldOfficerPaymentsBuyerDashboard',
  'get /fieldOfficerPayment/sellerBoard': 'BidsController.fieldOfficerPaymentsSellerDashboard',

  'get /buyer/bidboard': 'BidsController.buyerBidDashboard',
  'get /buyer/paymentboard': 'BidsController.buyerPaymentsBuyerDashboard',
  'get /buyer/verificationboard': 'BidsController.buyerVerificationDashboard',

  'put /changeReceiveQuantityStatus/:id': 'BidsController.changeReceiveQuantityStatus',

  //Message
  'post /message/send': 'MessageController.add',
  'get /message/get': 'MessageController.getAllMessages',
  'get /message/conversation': 'MessageController.getConversation',
  'put /message/read': 'MessageController.read',
  'get /message/relatedmessages': 'MessageController.getRelatedMessages',
  'get /message/unreadcount': 'MessageController.unreadMessagesCount',
  'get /message/unreadmessages': 'MessageController.unreadMessages',
  'get /communicationDashboard': 'MessageController.communicationDashboardRepliedReceived',

  //QualityCheck
  'post /quality/add': "QualitycheckController.add",
  'get /quality/all': "QualitycheckController.getAllQuality",
  'get /qualitydetail': 'QualitycheckController.getQualityDetail',
  'get /quality/dashboard': 'QualitycheckController.qualitiesDashboard',


  //Group Routes
  'post /groups': 'GroupsController.save',
  'get /groups': 'GroupsController.getAllGroup',
  'get /groups/:id': 'GroupsController.groupMembers',
  //'put /groups/' : { model: 'Groups', blueprint: 'update'},
  'put /addmember/:id': 'GroupsController.addUser/:id',

  //Sms Groups
  'post /sms': 'SmsController.groupMsg',

  //Logistics Partner Routes
  'post /lpartners': 'LpartnersController.save',
  'get /lpartners': 'LpartnersController.getAllLpartners',
  'put /lpartners': 'LpartnersController.update',
  'get /alllpartners': 'LpartnersController.allLpartners',
  'get /lpartnerslist': 'LpartnersController.allLogisticPartnerList',


  //Drivers Routes
  'post /driver': 'DriversController.add',
  'get /driver/:id': 'DriversController.get',
  'put /driver': 'DriversController.update',
  'get /drivers': 'DriversController.getAll',

  //Vehicles Routes
  'post /vehicle': 'VehiclesController.add',
  'get /vehicle/:id': 'VehiclesController.get',
  'put /vehicle': 'VehiclesController.update',
  'get /vehicles': 'VehiclesController.getAll',

  // LogisticTrip

  'get /readLocation/:id': 'LogisticTripController.readLocation',
  'get /resendtripmessage/:id': 'LogisticTripController.resendTripOTTC',
  'get /tripinfofromOTTC/:OTTC': 'LogisticTripController.tripInfoFromOTTC',
  'put /changetriporderstatus': 'LogisticTripController.changeStatusOfOrder',
  'get /tripinfo/:id': 'LogisticTripController.tripInfo',
  'put /updatetriplocations/:id': 'LogisticTripController.updateLocations',
  'put /changedestinationsequence': 'LogisticTripController.changeDestinationSequence',
  'get /trips': 'LogisticTripController.getAllTrips',
  'delete /removeorderfromtrip/:id': 'LogisticTripController.removeOrderFromTrip',
  'put /updatetriplogistic': 'LogisticTripController.updateTripLogisticInfo',
  'put /updatetimefactor': 'LogisticTripController.updateTimeFactor',
  'put /addpod/:id': 'LogisticTripController.addPODInOrder',
  'get /requestOTTC/:id': 'LogisticTripController.requestOTTC',
  // 'put /unexpireOTTC/:id' : 'LogisticTripController.unexpireOTTC',

  //Wishlists Rotues
  'get /wishlist': 'WishlistController.get',
  'post /wishlist': 'WishlistController.add',
  'post /delete/wishlist': 'WishlistController.remove',
  'get /userwishlist': 'WishlistController.wishlistsWithUserId',

  //rating Rotues
  //'get /rating' : 'RatingController.get',
  'post /rating': 'RatingController.saveRating',
  'get /ratingUserModal': 'RatingController.getRatingOnModal',
  'post /input-rating': 'RatingController.saveInputRating',
  'get /ratingUserModal': 'RatingController.getRatingOnModal',
  'get /inputRatingUserModal': 'RatingController.getInputRatingOnModal',
  'get /ratingUserModalUser': 'RatingController.getRatingOnModalToUser',
  //'put /rating/:id' : 'RatingController.updateRating',  
  'get /averating/:id': 'RatingController.getAverageUserRating',
  'get /myRatings': 'RatingController.getMyRatings',

  'delete /wishlist/remove': 'WishlistController.remove',

  // Market API Routes
  'post /market': 'MarketController.addMarket',
  'get /getmarketall': 'MarketController.getAllMarket',
  'put /market/:id': 'MarketController.updateMarket',
  'get /franchiseesWithouGM': 'MarketController.franchiseesWithouGM',
  'get /franchiseesWithouCP': 'MarketController.franchiseesWithouCP',
  'get /marketWithPincodes': 'MarketController.marketContainingPincodes',
  'get /marketContainingPincodesGM': 'MarketController.marketContainingPincodesGM',
  'get /assign-market-crop/:crop/:pincode': 'MarketController.assignMarketCrop',
  'get /assign-market-land/:land/:pincode': 'MarketController.assignMarketLand',
  'get /franchiseeswithgm': 'MarketController.franchiseesWithGM',


  'get /filters': 'CropsController.getFilters',
  'post /spush': 'CommonController.sendpush',
  'get /suggestions': 'CropsController.cropSuggestion',

  //moderntrader api
  'get /readorderemail': 'CropsController.readOrderEmails',

  'get /cropmodernationorder': 'CropsController.cropModernationOrders',// crops modernation user order
  'get /croporder/:id': 'CropsController.croporder',// crops modernation user order
  'get /croporderitem/:id/:userid': 'CropsController.croporderitem',//order item crop user
  'get /croporderitemnotfound/:id/:userid': 'CropsController.croporderitemnotfound',//order item crop not found
  'get /relatedItem/:cat/:variety': 'CropsController.relatedItems',
  'put /updateOrderItem/:id': 'CropsController.updateOrderItem',
  'get /relateditemnotfound': 'CropsController.relatedItemsnotfound',
  'post /saveorderitem': 'CropsController.saveOrderItem',//save modernatrader order
  'put /placedStatus/:id': 'CropsController.modernTraderPlacedStatus',
  'get /cropmodernationplacedorder/:id': 'CropsController.cropmodernationplacedorder',// crops modernation user order
  'get /gerpremoderntraderoder': 'CropsController.gerpremoderntraderoder',
  'get /getPreOrderItems/:id': 'CropsController.getpreorderitems',
  'get /getPreOrderItemsUser/:id': 'CropsController.getpreorderitemsuser',
  'get /sendemailaftertwohour': 'CropsController.sendEmailAfterTwoHour',
  'delete /deleteorderitem/:id': 'CropsController.deleteOrderItem',




  // States API Routes
  'get /states': 'StatesController.getAllStates',

  // States API Routes
  //'get /states': 'StatesController.getAllStates',

  'get /swagger.json': (_, res) => {
    const swaggerJson = require('../swagger/swagger.json')
    if (!swaggerJson) {
      res
        .status(404)
        .set('content-type', 'application/json')
        .send({ message: 'Cannot find swagger.json, has the server generated it?' })
    }
    return res
      .status(200)
      .set('content-type', 'application/json')
      .send(swaggerJson)
  },
  'get /states': {
    controller: 'StatesController',
    action: 'getAllStates',
    skipAssets: 'true',
    //swagger path object
    swagger: {
      methods: ['GET', 'POST'],
      summary: ' Get Groups ',
      description: 'Get Groups Description',
      produces: [
        'application/json'
      ],
      tags: [
        'Groups'
      ],
      responses: {
        '200': {
          description: 'List of Groups',
          schema: 'Group', // api/model/Group.js,
          type: 'array'
        }
      },
      parameters: []

    }
  },


  //Notification API Routes
  'get /notifications': 'NotificationController.getAllNotification',
  'get /notificationDetail': 'NotificationController.getNotificationDetail',

  'get /notifications/adminNotifications': 'NotificationController.adminNotifications',

  'get /notifications/my': 'NotificationController.myNotifications',
  'put /notifications/read': 'NotificationController.read',
  'get /notifications/unreadcount': 'NotificationController.unreadNotificationsCount',
  'post /notification/send': 'NotificationController.notifyUser',

  /*question answer module*/
  'get /myquestions/:userID': 'QaController.myQuestions',
  'get /getallquestions': 'QaController.getAllQuestions',

  'post /search': 'CommonController.mainSearch',

  /*API for static pages start*/
  'get  /Pages/fixTitle/:slug_name': 'PagesController.getfixTitle',
  'post /Pages/savePages': 'PagesController.savePages',
  'get  /allstatic_pages': 'PagesController.getstatic_pages',
  'get  /Pages/:id': 'PagesController.getpages/:id',
  'put  /Pages/:slug': 'PagesController.updatepage/:slug',
  'get  /getStaticPageNamelist': 'PagesController.getStaticPageNamelist',
  /*API for static pages end*/

  'post labourrequest/save': 'LabourRequestController.save',
  'put labourrequest/update': 'LabourRequestController.update',
  'delete labourrequest/delete': 'LabourRequestController.delete',
  'get labourrequest/list': 'LabourRequestController.list',



  //PriceCollector Routes
  'post /pricecollector': 'PriceCollectorController.add',
  'get /pricecollector/:id': 'PriceCollectorController.get',
  'put /pricecollector/:id': 'PriceCollectorController.update',
  'get /pricecollectors': 'PriceCollectorController.getAll',
  'get /pricecollectorssave': 'PriceCollectorController.getAllSave',

  'post /pricecollectorlogin': 'PriceCollectorController.pcLogin',
  'post /price': 'PriceCollectorController.savePrice',
  'put /verifyprice/:id': 'PriceCollectorController.verifyPrice',
  'put /pc/activeinactive/:id': 'PriceCollectorController.activeinactive',

  'get /allprices': 'PriceCollectorController.allPrice',
  'put /price/:id': 'PriceCollectorController.updatePrice',
  'get /price/:id': 'PriceCollectorController.getPrice',
  'get /added_by': 'PriceCollectorController.getAddedBy',
  'get /getmarketlist': 'PriceCollectorController.getAllMarketList',
  'get /categoryprices': 'PriceCollectorController.frontendpricecategorylist',
  'get /marketprices': 'PriceCollectorController.frontendpricemarketlist',
  'get /pricesavailablecities': 'PriceCollectorController.availableCitiesForPrices',

  //Packaging API Routes
  'post /packaging': 'PackagingController.add',
  'get /packaging/:id': 'PackagingController.get',
  'put /packaging': 'PackagingController.update',
  'get /packaging': 'PackagingController.getAll',
  'get /packaginginfo': 'PackagingController.getList',
  'get /packagingcategory/:id': 'PackagingController.getPackagingCategoryById',
  'get /bidspackaging/:id': 'PackagingController.bidsPackaging',
  'get /getpackagingtype': 'PackagingController.getPackagingType',
  'get /packagingcropdetail/:id': 'PackagingController.getPackagingTypeCropDetail',


  //Facilitation charges
  'post /facilitationcharges': 'FacilitationChargesController.add',
  'get /facilitation-market-list': 'FacilitationChargesController.listingMarket',
  'get /facilitation-user-list': 'FacilitationChargesController.listingUser',
  'put /facilitationcharges/:id': 'FacilitationChargesController.edit',
  'get /facilitationcharges/:id': 'FacilitationChargesController.get',
  'delete /facilitationcharges/:id': 'FacilitationChargesController.delete',




  //Logistic prices
  'get /assignedLogisticPriceCategory': 'LogisticpriceController.assignedLogisticPriceCategory',
  'post /logisticprice': 'LogisticpriceController.add',
  'post /logisticpricebulk/:category': 'LogisticpriceController.addBulk',
  'put /logisticprice/:id': 'LogisticpriceController.update',
  'delete /logisticprice/:id': 'LogisticpriceController.delete',
  'delete /logisticpricebulk': 'LogisticpriceController.deleteMultiple',
  'get /carryloadcapacities': 'LogisticpriceController.categoryWiseCarrryLoadCapacity',
  'get /destinationpricesfromsource': 'LogisticpriceController.getListForLoadSectionsSourceWise',
  'get /sourcepricesfromdestination': 'LogisticpriceController.getListForLoadSectionsDestinationWise',
  'get /logisticprice/:id': 'LogisticpriceController.get',
  'post /cropsrouteprice': 'LogisticpriceController.cropsrouteprice',
  // 'post /cropsroutepricecalculate': 'LogisticpriceController.cropsroutepricecalculate',

  //Testimonial
  'post /testimonial': 'TestimonialController.add',
  'delete /testimonial': 'TestimonialController.delete',
  'get /testimonials': 'TestimonialController.list',
  'get /testimonial/:id': 'TestimonialController.get',

  //ReverseBidding
  'post /reversebidding/add': 'BuyerRequirementController.add',
  'post /reversebidding/addForLand': 'BuyerRequirementController.addForLand',
  'put /reversebidding/update/:id': 'BuyerRequirementController.update',

  'put /reversebidding/submitotp': 'BuyerRequirementController.submitotp',
  'get /reversebidding/updatesubscribe': 'BuyerRequirementController.updatesubscribe',
  'get /reversebidding/list': 'BuyerRequirementController.list',
  'get /reversebidding/verifyuser': 'BuyerRequirementController.verifyuser',
  'get /reversebidding/get/:id': 'BuyerRequirementController.get',
  'get /reversebidding/categoryWiseRequirements': 'BuyerRequirementController.categoryWiseRequirements',

  'get /reversebidding/LandRequirements': 'BuyerRequirementController.LandRequirements',
  'get /reversebidding/statesWiseRequirements': 'BuyerRequirementController.statesWiseRequirements',
  'get /reversebidding/search': 'BuyerRequirementController.search',


  'get /categoriesAndProducts': 'CropsController.topCategoriesAndProducts',

  'get /cropsfrompastorder': 'CropsController.cropsFromPastOrder',
  'get /categorycompleteinfo': 'CategoryController.categoryInformationWithProducts',

  'get /updateusertype': 'BlogsController.updateUserType',
  'get /updatecode': 'BlogsController.updateCode',
  'get /uploadfarmer': 'BlogsController.uploadFarmer',

  // 'get /uploadFarmerWithoutPincode': 'BlogsController.uploadFarmerWithoutPincode',

  //transaction report
  'get /transactionreport': 'CommonController.TransactionReport',
  'get /bidtransactionreport': 'CommonController.BidTransactionReport',
  'get /cropreport': 'CommonController.CropReport',
  'get /userreport': 'CommonController.UserReport',

  //digilocker
  'post /digilocker/create': 'DigitalLockersController.createLocker',
  'get /digilocker/list': 'DigitalLockersController.listLocker',
  'get /singledigilocker/:id': 'DigitalLockersController.getLocker',
  'post /digilocker/adddocument': 'DigitalLockersController.addDocument',
  'put /digilocker/verifydocument': 'DigitalLockersController.verifyDocument',
  'get /digilocker/documents-datewise': 'DigitalLockersController.allDocumentsDateWise',
  'get /digilocker/documents-typewise': 'DigitalLockersController.allDocumentsTypeWise',
  'get /digilocker/singledocument/:id': 'DigitalLockersController.getDocument',
  'put /digilocker/document/move/:id': 'DigitalLockersController.moveDocument',
  'delete /digilocker/document/delete/:id': 'DigitalLockersController.deleteDocument',
  'delete /digilocker/document/removepage/:id': 'DigitalLockersController.removePage',
  'delete /digilocker/document/deletepage/:id': 'DigitalLockersController.deletePage',
  'post /digilocker/document/uploadpage': 'DigitalLockersController.uploadPage',

  //Subscription


  'get /subscription/viewlandplan/:id': 'SubscriptionController.viewLandPlanInfo',
  'get /subscription/plan': 'SubscriptionController.planList',
  'post /subscription/add': 'SubscriptionController.createPlan',
  'get /subscription/get/:id': 'SubscriptionController.getPlan',
  'put /subscription/update/:id': 'SubscriptionController.updatePlan',
  'post /subscription/hashpaytm': 'SubscriptionController.postPayTm',
  'post /subscription/paytmresponse/:id': 'SubscriptionController.ResponsePayTm',
  'post /subscription/land': 'SubscriptionController.addFreePlanInLand',


  //Field Transactions:
  'put /assignlogisticfortransaction/:id': 'FieldTransactionsController.assignLogisticAndDeliveryTimeForTransaction',
  'post /fieldtransaction/addrequirement': 'FieldTransactionsController.addRequirement',
  'put /fieldtransaction/updaterequirement/:id': 'FieldTransactionsController.updateRequirement',
  'put /fieldtransaction/approve/:id': 'FieldTransactionsController.approve',
  'put /fieldtransaction/fulfill/:id': 'FieldTransactionsController.fulfill',
  'put /fieldtransaction/cancel/:id': 'FieldTransactionsController.cancel',
  'put /fieldtransaction/receive/:id': 'FieldTransactionsController.receive',
  'get /fieldtransaction/list': 'FieldTransactionsController.list',
  'get /fieldtransaction/get/:id': 'FieldTransactionsController.get',
  'put /fieldtransaction/receivebuyerpayment/:id': 'FieldTransactionsController.receiveBuyerPayment',
  'put /fieldtransaction/receivesellerpayment/:id': 'FieldTransactionsController.receiveSellerPayment',
  'put /fieldtransaction/receivelogisticpayment/:id': 'FieldTransactionsController.receiveLogisticPayment',
  'put /fieldtransaction/changefotsm/:id': 'FieldTransactionsController.changestakeholders',
  'put /fieldtransaction/complete/:id': 'FieldTransactionsController.complete',
  'put /fieldtransaction/createchild/:id': 'FieldTransactionsController.createchild',
  'put /fieldtransaction/selleramountmodify/:id': 'FieldTransactionsController.selleramountmodify',
  'put /fieldtransaction/addfranchiseelogistics/:id': 'FieldTransactionsController.addFranchiseeLogistics',
  'put /fieldtransaction/addfarmxlogistics/:id': 'FieldTransactionsController.addFarmxLogistics',
  'put /fieldtransaction/updategrnimage/:id': 'FieldTransactionsController.updateGRN',
  'put /fieldtransaction/fulfillWithAdvance/:id': 'FieldTransactionsController.fulfillWithAdvance',
  'put /fieldtransaction/fulfillAfterAdvance/:id': 'FieldTransactionsController.fulfillAfterAdvance',
  'put /fieldtransaction/verifybuyerpayment/:id': 'FieldTransactionsController.verifyBuyerPayment',
  'delete /fieldtransaction/delete/:id': 'FieldTransactionsController.deleteTransaction',

  //transaction logistic dashboard api
  'get /logistics/transaction/confirmed': 'FieldTransactionsController.transactionlogisticConfirmedDashboard',
  'get /logistics/transaction/confirmedlist': 'FieldTransactionsController.transactionlLogisticDashboardConfirmedListings',
  'get /logistics/transaction/enroute': 'FieldTransactionsController.transactionlogisticEnrouteDashboard',
  'get /logistics/transaction/enroutelist': 'FieldTransactionsController.transactionlogisticDashboardEnrouteListings',
  'get /logistics/transaction/completed': 'FieldTransactionsController.transactionlogisticCompletedDashboard',
  'get /logistics/transaction/completedlist': 'FieldTransactionsController.transactionlogisticDashboardCompletedListings',
  'get /logistics/transaction/active': 'FieldTransactionsController.transactionlogisticActiveDashboard',
  'get /logistics/transaction/activelist': 'FieldTransactionsController.transactionlogisticDashboardActiveListings',


  //Become Franchisee
  'post /becomefranchisee/add': 'BecomeFranchiseeController.save',
  'get /becomefranchisee/list': 'BecomeFranchiseeController.getAll',
  'get labourrequest/list': 'LabourRequestController.list'

};