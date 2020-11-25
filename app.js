const createError = require('http-errors');
const express = require('express'),
session  = require('cookie-session');
const path = require('path');
const logger = require('morgan');
const fs = require('fs');
const routePath = './routes/';
const mysql = require('mysql');

const app = express();

app.locals.config = require('./config/config');
app.locals.projects = require('./projects.json');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: app.locals.config.session.secret,
  resave: true,
  saveUninitialized: false,
  cookie: { secure: true }
}));
app.set('view engine', 'ejs');
app.set('trust prozxy', true);
app.set('views', __dirname + '/views');
app.set('json spaces', 2); // creds https://stackoverflow.com/a/48062695

var connection = mysql.createPool(app.locals.config.connection);

fs.readdirSync(routePath).forEach(function(file) {
    var route = routePath + file;
    require(route)(app, connection);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;