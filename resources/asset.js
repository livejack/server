const { Models } = require('objection');
const { Page, Href } = Models;
const inspector = require('url-inspector');
const thumbnailer = require('../lib/thumbnailer');
const providers = require('../lib/providers');

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
		const page = await Page.query().findOne({ domain, key }).throwIfNotFound();
		const item = await prepare(req.body.url);
		let asset = await page.$relatedQuery('hrefs').findOne({ url: item.url });
		if (asset) {
			asset = await page.$relatedQuery('hrefs', trx)
				.patchAndFetchById(asset.id, item)
				.throwIfNotFound();
		} else {
			asset = await page.$relatedQuery('hrefs').insertAndFetch(item);
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

async function tryInspect(url) {
	return inspector(url, {
		nofavicon: false,
		nosource: true,
		file: false,
		providers
	}).catch((ex) => {
		if (typeof ex == "number" && ex >= 400) throw new HttpError[ex]("Cannot process url: \n" + url);
		else throw ex;
	});
}

async function prepare(url) {
	if (!url) throw new HttpError.BadRequest("Missing url");
	const item = { url };
	const meta = await tryInspect(url);

	if (meta.type == "image" && meta.mime != "text/html") {
		if (meta.width >= 256) {
			if (!meta.thumbnail) {
				meta.thumbnail = meta.url;
			}
		} else {
			meta.type = 'picto';
		}
	}
	if (meta.icon && meta.icon.startsWith('data:') && meta.icon.length < 64) delete meta.icon;
	if (meta.thumbnail) try {
		meta.thumbnail = await thumbnailer(meta.thumbnail);
	} catch (err) {
		console.group(url);
		console.error("Impossible to generate thumbnail from");
		console.error(meta.thumbnail);
		console.error(err.toString());
		console.groupEnd();
		delete meta.thumbnail;
	}
	if (!item.meta) item.meta = {};
	Object.keys(Href.jsonSchema.properties.meta.properties).forEach((name) => {
		if (meta[name] != null) item.meta[name] = meta[name];
	});
	Object.keys(Href.jsonSchema.properties).forEach((name) => {
		if (meta[name] != null) item[name] = meta[name];
	});
	return item;
}
exports.prepareAsset = prepare;

exports.PUT = (req) => {
	const { domain, key } = req.params;
	const id = req.params.id || req.body.id;
	return Page.transaction(async trx => {
		const page = await Page.query(trx).findOne({ domain, key }).throwIfNotFound();
		const item = await prepare(req.body.url);
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

