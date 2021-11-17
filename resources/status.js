const { Models } = require('objection');

exports.GET = async (req, res) => {
	const { domain, key } = req.params;
	const page = await Models.Page.query()
		.findOne({ domain, key }).select()
		.throwIfNotFound();
	res.header('Last-Modified', new Date(page.updated_at).toUTCString());
	const item = Object.assign({}, page);
	item.last = page.updated_at;
	item.when = page.when;
	return item;
};
