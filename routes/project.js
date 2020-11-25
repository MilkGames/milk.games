module.exports = function(app, db) {
	app.get('/project/:url', function(req, res) {
		var project = app.locals.projects[req.params.url];
		if (!project) { return res.sendStatus(404); }
		res.render('project', {project: project});
	});
};