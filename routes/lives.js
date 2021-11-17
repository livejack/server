const {Models} = require('objection');

exports.GET = async (req, res, next) => {
	let domains = req.query.domains || [];
	if (typeof domains == "string") domains = domains.split(',').map((val) => {
		return val.trim();
	});
	const now = new Date();

	const pages = await Models.Page.query()
		.select('domain', 'key', 'updated_at', 'title', 'backtrack')
		.orderBy('updated_at', 'desc')
		.whereNotNull('title')
		.whereNotNull('backtrack')
		.where('start', '<', now)
		.where(function() {
			this.whereNull('stop').orWhere('stop', '>', now);
		})
		.whereRaw('length(title) > 0');
	if (domains.length) pages.whereIn('domain', domains);
	const items = pages.map((page) => {
		// keep legacy API
		const item = Object.assign({}, page);
		item.last = page.updated_at;
		item.when = page.when;
		return item;
	});

	res.json({
		domains: domains,
		items: items
	});
};
