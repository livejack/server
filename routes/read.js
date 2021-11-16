const {Models} = require('objection');

exports.GET = async function(req, res, next) {
	const { domain, key, view } = req.params;
	try {
		if (!req.domain) throw new HttpError.BadRequest("No domain");
		await Models.Page.have({ domain, key, view });
		res.prerender('read.html');
	} catch (err) {
		next(err);
	}
};
