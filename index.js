const express = require('express'),
bodyParser = require('body-parser'), 
session  = require('express-session');

const {verify} = require('hcaptcha');
const md = require('markdown-it')()
.use(require('markdown-it-highlightjs'))
.use(require('markdown-it-imsize', {autofill: true}));
const rateLimit = require("express-rate-limit");
const fileLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 110
});
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15
});
const config = require('./config.json');
const mysql = require('mysql');
var db = mysql.createPool({
	host: config.dbhost,
	user: config.dbuser,
	password: config.dbpass,
	database: "site"
});

db.query("CREATE TABLE IF NOT EXISTS feedback (id INTEGER AUTO_INCREMENT PRIMARY KEY, feedback TEXT)", function (err, result) {
	if (err) throw err;
});
db.query("CREATE TABLE IF NOT EXISTS blog (id INTEGER AUTO_INCREMENT PRIMARY KEY, title TEXT, body TEXT, img TEXT, password TEXT, time INT)", function (err, result) {
	if (err) throw err;
});

function findItem(arr, key, value) {
	for (var i = 0; i < arr.length; i++) {
		if (arr[i][key] === value) {
			return(i);
		}
	}
	return(-1);
}

const app = express();
const path = require('path');
app.locals.projects = require('./projects.json');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(session({ secure: true, secret: config.secret, resave: true, saveUninitialized: false}))

app.set('view engine', 'ejs');
app.set('trust proxy', true)
app.set('views', __dirname + '/views');

app.get('/', function(req, res) {
	res.render('index');
});

app.get('/projects', function(req, res) {
	res.render('projects', {filter: req.query.filter});
});

app.get('/project/:url', function(req, res) {
	if (findItem(app.locals.projects, "url", req.params.url) == -1) {
		res.sendStatus(404)
	}
	res.render('project', {project: app.locals.projects[findItem(app.locals.projects, "url", req.params.url)]});
});

app.get('/blog/post/:id', fileLimiter, function(req, res) {
	db.query('SELECT * FROM blog WHERE id = ?', [req.params.id], function (error, results, fields) { 
		if (results.length == 0) { return res.sendStatus(404); }
		if (results[0].password && results[0].password !== req.query.password) { return res.sendStatus(404); }
		if (error) throw error;
		res.render('blogpost', {blog: results[0], bodyParsed: md.render(results[0].body)});
	});
});

app.get('/feedback', function(req, res) {
	res.render('feedback');
});

app.get('/api/projects.json', function(req, res) {
	res.json(app.locals.projects)
});

app.post('/feedback', submitLimiter, function(req, res) {
	if (req.body.feedback.length < 5) { return res.end("Feedback must be longer than 5 characters."); }
	if (!config.debug) {
		verify(config.cap, req.body["h-captcha-response"])
		.then(function(info){
			if (info.success == false) { return res.end("Invalid Captcha"); } 
			db.query('INSERT INTO feedback SET feedback = ?', [req.body.feedback], function (error, results, fields) { 
				if (error) throw error;
			})
			res.redirect("/")
		})
		.catch(function(err){
			res.end("Invalid Captcha")
		});
	} else {
		db.query('INSERT INTO feedback SET feedback = ?', [req.body.feedback], function (error, results, fields) { 
			if (error) throw error;
		})
		res.redirect("/")
	}
});

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

app.get('/admin/login', submitLimiter, function(req, res) {
	if (req.session.authed == true) {
		res.redirect("/admin");
	} else {
		res.render('admin', {authed: false});
	}
});

app.get('/blog', fileLimiter, function(req, res) {
	db.query('SELECT * FROM blog WHERE password = "" ORDER BY id DESC', function (error, results, fields) { 
		if (error) throw error;
		res.render('blog', {blog: results});
	});
});

app.use(express.static(__dirname + 'videos/'));

const multer  = require('multer')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'files/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})
const upload = multer({ storage: storage })

app.post('/file/upload', upload.single('file'), function(req, res) {
	if (!req.session.authed) { return res.sendStatus(401); }
	res.redirect('/file/' + req.file.originalname)
});

app.get('/file/:name', fileLimiter, function(req, res) {
	var fileName = req.params.name
	res.sendFile(fileName, {
		root: path.join(__dirname, 'files'),
		dotfiles: 'deny',
	}, function (err) {
		if (err) {
			res.sendStatus(404);
		} else {
			console.log('Sent:', fileName)
		}
	})
});

app.post('/blog/preview', function(req, res) {
	if (!req.session.authed) { return res.sendStatus(401); }
	if (!req.body.body) { return res.sendStatus(400); }
	res.send(md.render(req.body.body));
});

app.post('/blog/post', function(req, res) {
	if (!req.session.authed) { return res.sendStatus(401); }
	if (!req.body.title || !req.body.body) { return res.sendStatus(400); }
	db.query('INSERT INTO blog SET title = ?, body = ?, img = ?, password = ?, time = UNIX_TIMESTAMP()', [req.body.title, req.body.body, req.body.img, req.body.password], function (error, results, fields) { 
		if (error) throw error;
		res.redirect("/blog/post/" + results.insertId + (req.body.password ? '?password='+req.body.password : ''))
	})
});

app.post('/admin/login', function(req, res) {
	if (req.body.password == config.key) {
		req.session.authed = true
		res.redirect("/admin");
	} else {
		res.redirect("https://google.com")
	}
});

if (config.debug) {
	app.listen(8000);
} else {
	app.listen(80);
}