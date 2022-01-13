const { Models: { Page } } = require('objection');

exports.GET = async (req, res, next) => {
	let domains = req.query.domains || [];
	if (typeof domains == "string") domains = domains.split(',').map((val) => {
		return val.trim();
	});
	const now = new Date();

	const pages = await Page.query()
		.select('domain', 'key', 'updated_at AS last', 'title', 'backtrack', 'start', 'stop')
		.orderBy('updated_at', 'desc')
		.whereNotNull('title')
		.whereNotNull('backtrack')
		.whereNotNull('start')
		.where('start', '<', now.toISOString())
		.where(function() {
			this.whereNull('stop').orWhere('stop', '>', now.toISOString());
		})
		.whereRaw('length(title) > 0');
	if (domains.length) pages.whereIn('domain', domains);
	const items = pages.map(page => {
		const item = Object.assign({}, page);
		delete item.stop;
		return item;
	});

	res.json({ domains, items });
};
