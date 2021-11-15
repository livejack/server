const { Page } = require('objection').Models;

// ouverture de la page
exports.GET = async function(req, res, next) {
	const { domain, key } = req.params;
	try {
		if (!domain) throw new HttpError.BadRequest("No domain");
		await Page.query().findOne({ domain, key }).throwIfNotFound();
		res.prerender('write.html', { render: false });
	} catch (err) {
		next(err);
	}
};

exports.PUT = async function (req) {
	const page = await Page.have(req.params);
	await require('../resources/synchro').syncAssets(page, req.body, 'image');
	return 200;
};

exports.DELETE = async function(req) {
	const {domain, key} = req.params;

	const count = await Page.relatedQuery('messages')
		.for(Page.findOne({ domain, key }).throwIfNotFound())
		.resultSize();

	if (count > 0) {
		console.error("Cannot delete page with messages:", count);
		return 405;
	} else {
		await Page.findOne({ domain, key }).throwIfNotFound().delete();
		return 200;
	}
};
