module.exports = {

    savePages: function (req, res, next) {
        API(Pages.savePages, req, res);
    },
    
    'updatepage/:slug': function (req, res, next) {
        Pages.update({ "slug_name": req.body.slug_name }, { "title": req.body.title, "description": req.body.description }).exec(function (err, data) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                return res.jsonx({
                    success: true,
                    data: data,
                });
            }
        })
    },

    'getpages/:id': function (req, res, next) {
        var pid = req.param('id')
        var query = {};
        query.id = pid;
        Pages.find(query).exec(function (err, data) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                return res.jsonx({
                    success: true,
                    data: data,
                });
            }
        })
    },

    getfixTitle: function (req, res, next) {
        var pagename = req.param('slug_name');
        var query = { 'slug_name': pagename };
        Pages.findOne(query).exec(function (err, data) {
            if (err) {
                return res.status(400).json({
                    success: false,
                    error: err
                });
            } else {
                return res.jsonx({
                    success: true,
                    data: data
                });
            }
        })
    },

    getstatic_pages: function (req, res, next) {
        var search = req.param('search');
        var sortBy = req.param('sortBy');
        var page = req.param('page');
        var count = req.param('count');
        var skipNo = (page - 1) * count;
        var query = {};
        if (sortBy) {
            sortBy = sortBy.toString();
        } else {
            sortBy = 'createdAt desc';
        }
        if (search) {
            query.$or = [{
                title: {
                    'like': '%' + search + '%'
                }
            }
            ]
        }
        Pages.count(query).exec(function (err, total) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                Pages.find(query).sort(sortBy).skip(skipNo).limit(count).exec(function (err, data) {
                    if (err) {
                        return res.status(400).jsonx({
                            success: false,
                            error: err
                        });
                    } else {
                        return res.jsonx({
                            success: true,
                            data: {
                                data: data,
                                total: total
                            },
                        });
                    }
                })
            }
        })
    },

    getStaticPageNamelist: function (req, res, next) {
        var searchname = req.param('searchterm');
        var query = {}
        query.$or = [{
            title: {
                'like': '%' + searchname + '%'
            }
        }]
        Pages.find({ 'where': query }, { 'select': ["id", "title"] }).exec(function (err, pages) {
            if (err) {
                return res.status(400).jsonx({
                    success: false,
                    error: err
                });
            } else {
                return res.jsonx({
                    success: true,
                    data: pages
                });
            }
        })
    }
};