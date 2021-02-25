const { Models } = require('objection');
const { Page, Asset } = Models;
const { promisify } = require('util');
const inspector = promisify(require('url-inspector'));
const thumbnailer = require('../lib/thumbnailer');
const providers = require('../lib/providers');

exports.GET = (req) => {
	const { domain, key } = req.params;
	if (req.params.id) {
		return Page.relatedQuery('assets')
			.for(Page.query().findOne({ domain, key }).throwIfNotFound())
			.findById(req.params.id)
			.throwIfNotFound()
			.select();
	} else {
		const { domain, key } = req.params;
		return Page.query()
			.findOne({ domain, key }).select()
			.throwIfNotFound()
			.withGraphFetched('assets(select,order)');
	}
};

exports.POST = (req) => {
	const { domain, key } = req.params;
	return Page.transaction(async trx => {
		const page = await Page.query().findOne({ domain, key }).throwIfNotFound();
		await prepareAsset(req.body);
		if (req.body.id) delete req.body.id;
		const asset = await page.$relatedQuery('assets').insertAndFetch(req.body);
		await page.$query(trx).patch({
			update: asset.date
		});
		global.livejack.send({
			room: `/${domain}/${key}/assets`,
			mtime: asset.date,
			data: {
				assets: [asset]
			}
		});
		return asset;
	});
};

async function prepareAsset(item) {
	if (!item.url) throw new HttpError.BadRequest("Missing url");
	const meta = await inspector(item.url, {
		nofavicon: false,
		nosource: true,
		file: false,
		providers
	});
	if (meta.type == "image" && meta.mime != "text/html" && !meta.thumbnail) {
		meta.thumbnail = meta.url;
	}
	if (meta.icon && meta.icon.startsWith('data:') && meta.icon.length < 64) delete meta.icon;
	if (meta.thumbnail) meta.thumbnail = await thumbnailer(meta.thumbnail);
	if (!item.meta) item.meta = {};
	Object.keys(Asset.jsonSchema.properties.meta.properties).forEach((name) => {
		if (meta[name] != null) item.meta[name] = meta[name];
	});
}

exports.PUT = (req) => {
	const { domain, key } = req.params;
	const id = req.params.id || req.body.id;
	return Page.transaction(async trx => {
		const page = await Page.query(trx).findOne({ domain, key }).throwIfNotFound();
		await prepareAsset(req.body);
		const asset = await page.$relatedQuery('assets', trx)
			.patchAndFetchById(id, req.body)
			.throwIfNotFound();
		await page.$query(trx).patch({
			update: asset.update
		});
		global.livejack.send({
			room: `/${domain}/${key}/assets`,
			mtime: asset.date,
			data: {
				assets: [asset]
			}
		});
		return asset;
	});
};

exports.DELETE = (req) => {
	const { domain, key } = req.params;
	const id = req.params.id || req.body.id;

	return Page.transaction(async trx => {
		const page = await Page.query(trx).findOne({ domain, key }).throwIfNotFound();
		await page.$relatedQuery('assets', trx).deleteById(id).throwIfNotFound();
		await page.$query(trx).patch({
			update: new Date().toISOString()
		});
		global.livejack.send({
			room: `/${domain}/${key}/assets`,
			mtime: page.update,
			data: {
				assets: [{ id }]
			}
		});
		return { id };
	});
};

