module.exports = function(app, db) {
	app.get('/projects', function(req, res) {
		res.render('projects', {filter: req.query.filter});
	});
};