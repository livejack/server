const { Models } = require('objection');
const { Page, Asset } = Models;
const got = require('got');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);
const inspector = promisify(require('url-inspector'));
const thumbnailer = require('../lib/thumbnailer');

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
		let assetBody = req.body;
		if (req.is('multipart/form-data')) {
			if (!req.domain.asset) {
				throw new HttpError.BadRequest("Unsupported upload for that domain");
			}
			const remoteUrl = req.domain.asset.replace('%s', encodeURIComponent(`/${domain}/${key}`));

			await pipeline(req, got.stream.post({
				url: remoteUrl,
				responseType: 'json'
			}).on('response', ({ body }) => {
				if (!body || !body.url) {
					throw new HttpError.BadRequest("Empty response from remote url");
				} else {
					// http://api.fidji.lefigaro.fr
					// /media/_uploaded/orig/figaro-live/<domain>/<key>/name.jpg
					let replyUrl = body.url;
					if (replyUrl.indexOf("/media/_uploaded/orig/") >= 0) {
						replyUrl = replyUrl.replace("/media/_uploaded/orig/", "/media/_uploaded/804x/");
					}
					if (replyUrl.indexOf("api.fidji.lefigaro.fr") >= 0) {
						replyUrl = replyUrl.replace("api.fidji.lefigaro.fr", "i.f1g.fr");
					}
					if (replyUrl.startsWith('http://')) {
						replyUrl = 'https' + replyUrl.slice(4);
					}
					assetBody = {
						url: replyUrl,
						type: 'image'
					};
				}
			}));
		}
		const asset = await createAsset(page, assetBody);
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

async function createAsset(page, body = {}) {
	const item = Object.assign({}, body);
	if (item.id !== undefined) delete item.id;
	const meta = await inspector(item.url, {
		nofavicon: false,
		nosource: true,
		file: false
	});
	if (meta.type == "image" && meta.mime != "text/html" && !meta.thumbnail) {
		meta.thumbnail = meta.url;
	}
	if (meta.icon == "data:/,") delete meta.icon;
	if (meta.thumbnail) meta.thumbnail = await thumbnailer(meta.thumbnail);
	if (!item.meta) item.meta = {};
	Object.keys(Asset.jsonSchema.properties.meta.properties).forEach((name) => {
		if (meta[name] != null) item.meta[name] = meta[name];
	});
	return page.$relatedQuery('assets').insertAndFetch(item);
}

exports.PUT = (req) => {
	const { domain, key } = req.params;
	const id = req.params.id || req.body.id;
	return Page.transaction(async trx => {
		const page = await Page.query(trx).findOne({ domain, key }).throwIfNotFound();
		const asset = await page.$relatedQuery('assets', trx)
			.patchAndFetchById(id, req.body)
			.throwIfNotFound();
		await page.$query(trx).patch({
			update: asset.update
		});
		global.livejack.send({
			room: `/${domain}/${key}/page`,
			mtime: page.update,
			data: {
				start: page.start,
				stop: page.stop,
				update: page.update,
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
				start: page.start,
				stop: page.stop,
				update: page.update,
				assets: [{ id }]
			}
		});
		return { id };
	});
};
