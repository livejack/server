const { Models } = require('objection');

exports.GET = async (req, res) => {
	const { domain, key } = req.params;
	const page = await Models.Page.query()
		.findOne({ domain, key }).select()
		.throwIfNotFound();
	res.header('Last-Modified', new Date(page.update).toUTCString());
	return page;
};
