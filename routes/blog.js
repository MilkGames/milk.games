const rateLimit = require("express-rate-limit")({
  windowMs: 10 * 60 * 1000,
  max: 100
});

const md = require('markdown-it')()
.use(require('markdown-it-highlightjs'))
.use(require('markdown-it-imsize', {autofill: true}));

module.exports = function(app, db) {
	app.get('/blog', rateLimit, function(req, res) {
		db.query('SELECT * FROM blog WHERE password = "" ORDER BY id DESC', function (error, results, fields) { 
			if (error) throw error;
			res.render('blog', {blog: results});
		});
	});

	app.get('/blog/post/:id', rateLimit, function(req, res) {
		db.query('SELECT * FROM blog WHERE id = ?', [req.params.id], function (error, results, fields) { 
			if (results.length == 0) { return res.sendStatus(404); }
			if (results[0].password && results[0].password !== req.query.password) { return res.sendStatus(404); }
			if (error) throw error;
			res.render('blogpost', {blog: results[0], bodyParsed: md.render(results[0].body)});
		});
	});
};