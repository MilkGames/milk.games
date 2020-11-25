const rateLimit = require("express-rate-limit")({
  windowMs: 30 * 60 * 1000,
  max: 10
});

const md = require('markdown-it')()
.use(require('markdown-it-highlightjs'))
.use(require('markdown-it-imsize', {autofill: true}));

const multer  = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'files/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

module.exports = function(app, db) {
	app.get('/admin', function(req, res) {
		if (req.session.authed == true) {
			db.query('SELECT * FROM feedback', function (error, results, fields) { 
				if (error) throw error;
				res.render('admin', {authed: true, feedback: results});
			})
		} else {
			res.redirect("/admin/login");
		}
	});

	app.get('/admin/login', rateLimit, function(req, res) {
		if (req.session.authed == true) {
			res.redirect("/admin");
		} else {
			res.render('admin', {authed: false});
		}
	});

	app.post('/admin/login', function(req, res) {
		if (req.body.password == app.locals.config.session.key) {
			req.session.authed = true
			res.redirect("/admin");
		} else {
			res.redirect("/")
		}
	});

	app.post('/admin/file/upload', upload.single('file'), function(req, res) {
		if (!req.session.authed) { return res.sendStatus(401); }
		res.redirect('/file/' + req.file.originalname);
	});

	app.post('/admin/blog/preview', function(req, res) {
		if (!req.session.authed) { return res.sendStatus(401); }
		if (!req.body.body) { return res.sendStatus(400); }
		res.send(md.render(req.body.body));
	});

	app.post('/admin/blog/post', function(req, res) {
		if (!req.session.authed) { return res.sendStatus(401); }
		if (!req.body.title || !req.body.body) { return res.sendStatus(400); }
		db.query('INSERT INTO blog SET title = ?, body = ?, img = ?, password = ?, time = UNIX_TIMESTAMP()', [req.body.title, req.body.body, req.body.img, req.body.password], function (error, results, fields) { 
			if (error) throw error;
			res.redirect("/blog/post/" + results.insertId + (req.body.password ? '?password='+req.body.password : ''))
		})
	});
};