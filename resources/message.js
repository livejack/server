const {Models} = require('objection');
const {Page} = Models;

exports.GET = async (req, res, next) => {
	const {domain, key} = req.params;
	if (req.params.id) {
		const message = await Page.relatedQuery('messages')
			.for(Page.query().findOne({ domain, key }).throwIfNotFound())
			.findById(req.params.id)
			.throwIfNotFound()
			.select();
		res.json(message);
	} else {
		const messages = await Page.relatedQuery('messages')
			.for(Page.query().findOne({ domain, key }).throwIfNotFound())
			.select()
			.sortBy(req.query.sort || 'date')
			.limit(parseInt(req.query.limit) || Infinity)
			.offset(parseInt(req.query.offset) || 0);
		res.json(messages);
	}
};

exports.POST = async (req, res, next) => {
	const {domain, key} = req.params;
	return await Page.relatedQuery('messages').for(
		Page.query().findOne({ domain, key }).throwIfNotFound()
	).insertAndFetch(req.body);
};

exports.PUT = async (req, res, next) => {
	const {domain, key} = req.params;
	const id = req.params.id || req.body.id;

	return await Page.relatedQuery('messages').for(
		Page.query().findOne({ domain, key }).throwIfNotFound()
	).patchAndFetchById(id, req.body).throwIfNotFound();
};

exports.DELETE = async (req, res, next) => {
	const {domain, key} = req.params;
	const id = req.params.id || req.body.id;

	return await Page.relatedQuery('messages').for(
		Page.query().findOne({ domain, key }).throwIfNotFound()
	).deleteById(id, req.body);
};

