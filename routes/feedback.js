const {verify} = require('hcaptcha');
const rateLimit = require("express-rate-limit")({
  windowMs: 15 * 60 * 1000,
  max: 15
});

module.exports = function(app, db) {
	app.get('/feedback', function(req, res) {
		res.render('feedback');
	});

	app.post('/feedback', rateLimit, function(req, res) {
		if (req.body.feedback.length < 5) { return res.end("Feedback must be longer than 5 characters."); }
		if (!config.debug) {
			verify(config.cap, req.body["h-captcha-response"]).then(function(info){
				if (!info.success) { return res.end("Invalid Captcha"); } 
				db.query('INSERT INTO feedback SET feedback = ?', [req.body.feedback], function (error, results, fields) { 
					if (error) throw error;
				});
				res.redirect("/");
			})
			.catch(function(err){
				res.end("Invalid Captcha");
			});
		} else {
			db.query('INSERT INTO feedback SET feedback = ?', [req.body.feedback], function (error, results, fields) { 
				if (error) throw error;
			});
			res.redirect("/");
		}
	});
};