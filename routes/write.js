const {Models} = require('objection');

// ouverture de la page
exports.GET = async function(req, res, next) {
	const { domain, key } = req.params;
	try {
		if (!domain) throw new HttpError.BadRequest("No domain");
		await Models.Page.query().findOne({ domain, key }).throwIfNotFound();
		res.prerender('write.html', { render: false });
	} catch (err) {
		next(err);
	}
};

// TODO: move this to pages collection resource
// création de la page à partir de l'URL
exports.PUT = async function(req, res, next) {
	const { domain, key } = req.params;
	await Models.Page.query().findOne({ domain, key }).throwIfNotFound().patch(req.body);
	try {
		await require('../resources/synchro').syncAssets(
			req,
			req.domain.export,
			'image'
		);
	} catch(err) {
		if (err && err.code != 503) {
			console.error(err);
		}
	}
	res.sendStatus(200);
};

// TODO: move this to pages collection resource
// suppression de la page, 200, ou 405 + nombre de messages dans le body
exports.DELETE = async function(req, res, next) {
	const {domain, key} = req.params;

	const count = await Models.Page.relatedQuery('messages')
		.for(Models.Page.findOne({ domain, key }).throwIfNotFound())
		.resultSize();

	if (count > 0) {
		res.status(405).send(count.toString());
	} else {
		await Models.Page.findOne({ domain, key }).throwIfNotFound().delete();
		res.send(200);
	}
};

