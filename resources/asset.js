const { Models } = require('objection');
const { Page, Href } = Models;
const { promisify } = require('util');
const inspector = promisify(require('url-inspector'));
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
		try {
			await prepareAsset(req.body);
		} catch (ex) {
			if (typeof ex == "number" && ex >= 400) throw new HttpError[ex]("Invalid url");
			else throw ex;
		}
		if (req.body.id) delete req.body.id;
		let asset = await page.$relatedQuery('hrefs').findOne({ url: req.body.url });
		if (asset) {
			asset = await page.$relatedQuery('hrefs', trx)
				.patchAndFetchById(asset.id, req.body)
				.throwIfNotFound();
		} else {
			asset = await page.$relatedQuery('hrefs').insertAndFetch(req.body);
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
	if (meta.thumbnail) try {
		meta.thumbnail = await thumbnailer(meta.thumbnail);
	} catch (err) {
		console.group(item.url);
		console.error("Impossible to generate thumbnail from");
		console.error(meta.thumbnail);
		console.error(err.toString());
		console.groupEnd();
		/* eslint-enable no-console */
		delete meta.thumbnail;
	}
	if (!item.meta) item.meta = {};
	Object.keys(Href.jsonSchema.properties.meta.properties).forEach((name) => {
		if (meta[name] != null) item.meta[name] = meta[name];
	});
	Object.keys(Href.jsonSchema.properties).forEach((name) => {
		// do not change original url with the discovered url
		if (name != "url" && meta[name] != null) item[name] = meta[name];
	});
}

exports.PUT = (req) => {
	const { domain, key } = req.params;
	const id = req.params.id || req.body.id;
	return Page.transaction(async trx => {
		const page = await Page.query(trx).findOne({ domain, key }).throwIfNotFound();
		await prepareAsset(req.body);
		const asset = await page.$relatedQuery('hrefs', trx)
			.patchAndFetchById(id, req.body)
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
		await page.$relatedQuery('hrefs', trx).deleteById(id).throwIfNotFound();
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

