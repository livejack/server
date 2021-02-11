const { Models } = require('objection');
const { Page } = Models;

exports.GET = async (req, res) => {
	const { domain, key } = req.params;
	return Page.query()
		.findOne({ domain, key }).select()
		.throwIfNotFound()
		.withGraphFetched('messages(select,order)');
};

exports.PUT = async (req) => {
	const { domain, key } = req.params;
	return Page.transaction(async trx => {
		const data = req.body;
		const started = data.started;
		if (started !== undefined) {
			delete data.started;
			if (started) {
				data.stop = null;
				data.start = new Date().toISOString();
			} else {
				data.stop = new Date().toISOString();
			}
		}

		const page = await Page.query(trx)
			.findOne({ domain, key })
			.throwIfNotFound()
			.patch(data)
			.returning('*');
		global.livejack.send({
			room: `/${domain}/${key}/page`,
			mtime: page.update,
			data: {
				start: page.start,
				update: page.update,
				stop: page.stop
			}
		});
		return page;
	});
};
