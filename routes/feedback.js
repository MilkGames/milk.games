const Recaptcha = require('express-recaptcha').RecaptchaV2;
const rateLimit = require("express-rate-limit")({
	windowMs: 15 * 60 * 1000,
	max: 15
});

module.exports = function(app, db) {
	const recaptcha = new Recaptcha('6LcN7MgUAAAAAK2SJAy3eg-zTqtC4Pfylq6me7lG', app.locals.config.cap);
	app.get('/feedback', recaptcha.middleware.render, function(req, res) {
		res.render('feedback', {captcha:res.recaptcha});
	});

	app.post('/feedback', recaptcha.middleware.verify, rateLimit, function(req, res) {
		if (req.body.feedback.length < 5) { return res.end("Feedback must be longer than 5 characters."); }
		if (!app.locals.config.debug) {
			if (!req.recaptcha.error) { return res.end("Invalid Captcha"); } 
			db.query('INSERT INTO feedback SET feedback = ?', [req.body.feedback], function (error, results, fields) { 
				if (error) throw error;
			});
			res.redirect("/");
		} else {
			db.query('INSERT INTO feedback SET feedback = ?', [req.body.feedback], function (error, results, fields) { 
				if (error) throw error;
			});
			res.redirect("/");
		}
	});
};