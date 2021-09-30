const prerender = require('../lib/prerender');

// ouverture de la page
exports.GET = async function(req, res, next) {
	const { domain } = req.params;
	try {
		if (!domain) throw new HttpError.BadRequest("No domain");
		// never do a full prerendering - it's simple this way and useless to do otherwise
		// req.query.develop = null;
		prerender(`domain`)(req, res, next);
	} catch (err) {
		next(err);
	}
};
