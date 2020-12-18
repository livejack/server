const { Models } = require('objection');
const { Page } = Models;

exports.GET = async (req, res) => {
	const { domain, key } = req.params;
	return await Page.query()
		.findOne({ domain, key }).select()
		.throwIfNotFound()
		.withGraphFetched('messages(select,order)');
};

exports.PUT = async (req) => {
	const { domain, key } = req.params;
	return await Page.transaction(async trx => {
		const page = await Page.query(trx)
			.findOne({ domain, key })
			.throwIfNotFound()
			.patch(req.body)
			.returning('*');
		global.livejack.send({
			room: `/${domain}/${key}/page`,
			mtime: page.update,
			data: {
				start: page.start,
				update: page.update,
				stop: page.stop,
				title: page.title
			}
		});
		return page;
	});
};
