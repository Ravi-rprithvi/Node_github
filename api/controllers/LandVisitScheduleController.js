module.exports = {

    reschedule: function (req, res) {
        API(LandVisitService.reschedule, req, res);
    },
    dealVisitStatus: function (req, res) {
        API(LandVisitService.dealVisitStatus, req, res);
    },
    dealVisitCancel: function (req, res) {
        API(LandVisitService.dealVisitCancel, req, res);
    },
    allVisits: function (req, res) {
        API(LandVisitService.allVisits, req, res);
    },
    dealWiseVisits: function (req, res) {
        API(LandVisitService.dealWiseVisits, req, res);
    },
    scheduleNewVisit: function (req, res) {
        API(LandVisitService.scheduleNewVisit, req, res);
    },
    assignCoordinatorVisit: function(req, res) {
        API(LandVisitService.assignCoordinatorVisit, req, res);
    }
}