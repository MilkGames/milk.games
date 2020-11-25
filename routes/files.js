const rateLimit = require("express-rate-limit")({
	windowMs: 10 * 60 * 1000,
	max: 100
});

const path = require('path');

module.exports = function(app, db) {
	app.get('/file/:name', rateLimit, function(req, res) {
		var fileName = req.params.name;
		res.sendFile(fileName, {
			root: path.join(__dirname, '../files'),
			dotfiles: 'deny',
		}, function (err) {
			if (err) {
				res.sendStatus(404);
			} else {
				console.log('Sent:', fileName);
			}
		})
	});
};