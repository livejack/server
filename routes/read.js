const {Models} = require('objection');
const prerender = require('../lib/prerender');

exports.GET = async function(req, res, next) {
	const { domain, key } = req.params;
	if (!req.domain) throw new HttpError.BadRequest("No domain");

	await Models.Page.have({
		domain, key,
		view: req.domain.view
	});

	prerender(`live-read`)(req, res, next);
};

