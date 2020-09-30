const {Models} = require('objection');

exports.GET = async (req, res, next) => {
	let domains = req.query.domains || [];
	if (typeof domains == "string") domains = domains.split(',').map(function(val) {
		return val.trim();
	});
	const now = new Date();

	const pages = await Models.Page.query()
		.select('domain', 'key', 'update', 'title', 'backtrack')
		.orderBy('update', 'desc')
		.whereNotNull('title')
		.whereNotNull('backtrack')
		.where('start', '<', now)
		.where(function() {
			this.whereNull('stop').orWhere('stop', '>', now);
		})
		.whereRaw('length(title) > 0');
	if (domains.length) pages.whereIn('domain', domains);
	const items = pages.map(function(page) {
		// keep legacy API
		page.last = page.update;
		delete page.update;
		return page;
	});

	res.json({
		domains: domains,
		items: items
	});
};
