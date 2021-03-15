const { Models } = require('objection');
const { Page, Message } = Models;

exports.GET = async (req) => {
	const { domain, key } = req.params;
	if (req.params.id) {
		return Page.relatedQuery('messages').withGraphFetched('[hrefs(minimalSelect)]')
			.for(Page.query().findOne({ domain, key }).throwIfNotFound())
			.findById(req.params.id)
			.throwIfNotFound()
			.select();
	} else {
		return Page.relatedQuery('messages').withGraphFetched('[hrefs(minimalSelect)]')
			.for(Page.query().findOne({ domain, key }).throwIfNotFound())
			.select()
			.sortBy(req.query.sort || 'date')
			.limit(parseInt(req.query.limit) || Infinity)
			.offset(parseInt(req.query.offset) || 0);
	}
};

exports.POST = (req) => {
	const { domain, key } = req.params;
	return Page.transaction(async trx => {
		const page = await Page.query(trx).findOne({ domain, key }).throwIfNotFound();
		req.body.page = { id: page.id };
		const msg = await Message.query(trx).upsertGraphAndFetch(req.body, {
			relate: true
		});
		await page.$query(trx).patch({
			update: msg.date
		});

		global.livejack.send({
			room: `/${domain}/${key}/page`,
			mtime: page.update,
			data: {
				update: page.update,
				messages: [msg]
			}
		});
		return msg;
	});
};

exports.PUT = (req) => {
	const { domain, key } = req.params;
	return Page.transaction(async trx => {
		const page = await Page.query(trx).findOne({ domain, key }).throwIfNotFound();
		req.body.page = { id: page.id };
		const msg = await Message.query(trx).upsertGraphAndFetch(req.body, {
			relate: true,
			unrelate: true
		}).throwIfNotFound();
		await page.$query(trx).patch({
			update: msg.update
		});
		global.livejack.send({
			room: `/${domain}/${key}/page`,
			mtime: page.update,
			data: {
				update: page.update,
				messages: [msg]
			}
		});
		return msg;
	});
};

exports.DELETE = (req) => {
	const { domain, key } = req.params;
	const id = req.params.id || req.body.id;

	return Page.transaction(async trx => {
		const page = await Page.query(trx).findOne({ domain, key }).throwIfNotFound();
		await page.$relatedQuery('messages', trx).deleteById(id).throwIfNotFound();
		await page.$query(trx).patch({
			update: new Date().toISOString()
		});
		global.livejack.send({
			room: `/${domain}/${key}/page`,
			mtime: page.update,
			data: {
				update: page.update,
				messages: [{ id: id }]
			}
		});
		return { id };
	});
};

