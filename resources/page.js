const { Models } = require('objection');
const { Page } = Models;

exports.GET = async (req, res) => {
	const { domain, key } = req.params;
	return Page.query()
		.findOne({ domain, key }).select()
		.throwIfNotFound()
		.withGraphFetched('[messages(select,order).hrefs(minimalSelect)]');
};

exports.PUT = async (req) => {
	const { domain, key } = req.params;
	return Page.transaction(async trx => {
		const data = req.body;
		switch (data.action) {
			case 'reset':
				data.start = null;
				data.stop = null;
				break;
			case 'start':
				data.start = new Date().toISOString();
				data.updated_at = data.start;
				data.stop = null;
				break;
			case 'continue':
				data.stop = null;
				break;
			case 'stop':
				data.stop = new Date().toISOString();
				data.updated_at = data.stop;
				break;
			default:
				throw new HttpError.BadRequest("Bad action parameter");
		}
		delete data.action;

		const page = await Page.query(trx)
			.findOne({ domain, key })
			.throwIfNotFound()
			.patch(data)
			.returning('*');
		global.livejack.send({
			room: `/${domain}/${key}/page`,
			mtime: page.updated_at,
			data: {
				start: page.start,
				updated_at: page.updated_at,
				stop: page.stop
			}
		});
		return page;
	});
};

exports.DELETE = async (req) => {
	const { domain, key } = req.params;

	return Page.transaction(async trx => {
		const count = await Page.query(trx).findOne({ domain, key }).delete().throwIfNotFound();
		global.livejack.send({
			room: `/${domain}/${key}/page`,
			data: null
		});
		return { count };
	});
};
