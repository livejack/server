const { Models } = require('objection');
const { Page, Href } = Models;
const thumbnailer = require('../lib/thumbnailer');
const Inspector = require('url-inspector');
const providers = require('../lib/providers');

const inspector = new Inspector({ providers, nosource: true });

exports.GET = (req) => {
	const { domain, key } = req.params;
	if (req.params.id) {
		return Page.relatedQuery('hrefs')
			.for(Page.query().findOne({ domain, key }).throwIfNotFound())
			.findById(req.params.id)
			.throwIfNotFound()
			.select();
	} else {
		const { domain, key } = req.params;
		return Page.query()
			.findOne({ domain, key }).select()
			.throwIfNotFound()
			.withGraphFetched('hrefs(select,order)');
	}
};

exports.POST = (req) => {
	const { domain, key } = req.params;
	return Page.transaction(async trx => {
		const page = await Page.query(trx).findOne({ domain, key }).throwIfNotFound();
		const item = await exports.prepareAsset(req.body.url);
		let asset = await page.$relatedQuery('hrefs', trx).findOne({ url: item.url });
		if (asset) {
			asset = await page.$relatedQuery('hrefs', trx)
				.patchAndFetchById(asset.id, item)
				.throwIfNotFound();
		} else {
			if (req.body.width && !item.width) item.width = req.body.width;
			if (req.body.height && !item.height) item.height = req.body.height;
			asset = await page.$relatedQuery('hrefs', trx).insertAndFetch(item);
		}
		await page.$query(trx).patch({
			updated_at: asset.updated_at
		});
		global.livejack.send({
			room: `/${domain}/${key}/assets`,
			mtime: asset.updated_at,
			data: {
				updated_at: asset.updated_at,
				hrefs: [asset]
			}
		});
		return asset;
	});
};

exports.normalizeMeta = function (meta) {
	try {
		return inspector.norm(meta);
	} catch (ex) {
		console.error("normalizeMeta error", meta, ex);
	}
};

exports.prepareAsset = async function(url) {
	if (!url) throw new HttpError.BadRequest("Missing url");
	const item = { url, meta: {} };
	try {
		const meta = await inspector.look(url);
		// second condition is no longer necessary with url-inspector 5
		if (meta.type == "image") {
			if (meta.width > 256) {
				if (!meta.thumbnail) {
					meta.thumbnail = meta.url;
				}
			} else {
				meta.type = 'picto';
			}
		}
		if (meta.icon && meta.icon.startsWith('data:') && meta.icon.length < 64) {
			delete meta.icon;
		}
		if (meta.thumbnail) {
			meta.thumbnail = await thumbnailer(meta.thumbnail);
		}

		Object.keys(Href.jsonSchema.properties.meta.properties).forEach((name) => {
			if (meta[name] != null) item.meta[name] = meta[name];
		});
		Object.keys(Href.jsonSchema.properties).forEach((name) => {
			if (meta[name] != null) item[name] = meta[name];
		});
	} catch (err) {
		console.error("Error inspecting url: " + url);
	}
	return item;
};

exports.PUT = (req) => {
	const { domain, key } = req.params;
	const id = req.params.id || req.body.id;
	return Page.transaction(async trx => {
		const page = await Page.query(trx).findOne({ domain, key }).throwIfNotFound();
		const item = await exports.prepareAsset(req.body.url);
		const asset = await page.$relatedQuery('hrefs', trx)
			.patchAndFetchById(id, item)
			.throwIfNotFound();
		await page.$query(trx).patch({
			updated_at: asset.updated_at
		});
		global.livejack.send({
			room: `/${domain}/${key}/assets`,
			mtime: asset.updated_at,
			data: {
				hrefs: [asset]
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
		await page.$relatedQuery('hrefs', trx).findById(id).throwIfNotFound().delete();
		await page.$query(trx).patch({
			updated_at: new Date().toISOString()
		});
		global.livejack.send({
			room: `/${domain}/${key}/assets`,
			mtime: page.updated_at,
			data: {
				hrefs: [{ id }]
			}
		});
		return { id };
	});
};

