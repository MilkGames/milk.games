var express = require('express'),
bodyParser = require('body-parser'), 
session  = require('express-session')

const {verify} = require('hcaptcha');

const config = require('./config.json');
const mysql = require('mysql');
var db = mysql.createConnection({
	host: config.dbhost,
	user: config.dbuser,
	password: config.dbpass,
	database: "site"
});

db.connect(function(err) {
	if (err) throw err;
	console.log("Connected to DB.");
  // Prepare DB
  db.query("CREATE TABLE IF NOT EXISTS feedback (id INTEGER AUTO_INCREMENT PRIMARY KEY, feedback TEXT, ip TEXT)", function (err, result) {
  	if (err) throw err;
  });
  db.query("CREATE TABLE IF NOT EXISTS blog (id INTEGER AUTO_INCREMENT PRIMARY KEY, title TEXT, body TEXT, img TEXT, time INT)", function (err, result) {
  	if (err) throw err;
  });
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
var path = require('path');
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
	res.render('projects');
});

app.get('/project/:url', function(req, res) {
	if (findItem(app.locals.projects, "url", req.params.url) == -1) {
		res.sendStatus(404)
	}
	res.render('project', {project: app.locals.projects[findItem(app.locals.projects, "url", req.params.url)]});
});

app.get('/blog/post/:id', function(req, res) {
	db.query('SELECT * FROM blog WHERE id = ?', [req.params.id], function (error, results, fields) { 
		if (results.length == 0) { res.sendStatus(404); return; }
		if (error) throw error;
		res.render('blogpost', {blog: results[0]});
	});
});

app.get('/feedback', function(req, res) {
	res.render('feedback');
});

app.get('/api/projects.json', function(req, res) {
	res.json(app.locals.projects)
});

app.post('/feedback', function(req, res) {
	if (req.body.feedback.length < 5) { res.end("Feedback must be longer than 5 characters."); return; }
	if (!config.debug) {
		verify(config.cap, req.body["h-captcha-response"])
		.then(function(info){
			if (info.success == false) { res.end("Invalid Captcha"); return; } 
			db.query('INSERT INTO feedback SET feedback = ?, ip = ?', [req.body.feedback, req.ip], function (error, results, fields) { 
				if (error) throw error;
			})
			res.redirect("/")
		})
		.catch(function(err){
			res.end("Invalid Captcha")
		});
	} else {
		db.query('INSERT INTO feedback SET feedback = ?, ip = ?', [req.body.feedback, req.ip], function (error, results, fields) { 
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

app.get('/admin/login', function(req, res) {
	if (req.session.authed == true) {
		res.redirect("/admin");
	} else {
		res.render('admin', {authed: false});
	}
});

app.get('/blog', function(req, res) {
	db.query('SELECT * FROM blog ORDER BY id DESC', function (error, results, fields) { 
		if (error) throw error;
		res.render('blog', {blog: results});
	});
});

app.post('/blog/post', function(req, res) {
	if (!req.session.authed) { res.sendStatus(401); return; }
	if (!req.body.title || !req.body.body) { res.sendStatus(400); return; }
	db.query('INSERT INTO blog SET title = ?, body = ?, img = ?, time = UNIX_TIMESTAMP()', [req.body.title, req.body.body, req.body.img], function (error, results, fields) { 
		if (error) throw error;
		res.redirect("/blog/post/" + results.insertId)
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
