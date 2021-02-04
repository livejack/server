const {Models} = require('objection');
const {Page, Asset} = Models;
const got = require('got');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);
const inspector = promisify(require('url-inspector'));

exports.GET = async (req) => {
	const {domain, key} = req.params;
	if (req.params.id) {
		return await Page.relatedQuery('assets')
			.for(Page.query().findOne({ domain, key }).throwIfNotFound())
			.findById(req.params.id)
			.throwIfNotFound()
			.select();
	} else {
		const { domain, key } = req.params;
		return await Page.query()
			.findOne({ domain, key }).select()
			.throwIfNotFound()
			.withGraphFetched('assets(select,order)');
	}
};

exports.POST = async (req) => {
	const {domain, key} = req.params;
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
		}).on('response', ({body}) => {
			if (!body || !body.url) {
				throw new HttpError.BadRequest("Empty response from remote url");
			} else {
				assetBody = {
					url: body.url,
					type: 'image'
				};
			}
		}));
	}
	const asset = await createAsset(page, assetBody);
	global.livejack.send({
		room: `/${domain}/${key}/assets`,
		mtime: asset.date,
		data: {
			assets: [asset]
		}
	});
	return asset;
};

async function createAsset(page, body = {}) {
	const item = Object.assign({}, body);
	if (item.id !== undefined) delete item.id;
	const meta = await inspector(item.url, {
		nofavicon: false,
		nosource: true,
		file: false
	});
	if (!item.meta) item.meta = {};
	Object.keys(Asset.jsonSchema.properties.meta.properties).forEach((name) => {
		if (meta[name] != null) item.meta[name] = meta[name];
	});
	return page.$relatedQuery('assets').insertAndFetch(item);
}

exports.PUT = async (req, res, next) => {
	const {domain, key} = req.params;
	const page = await Page.query().findOne({ domain, key }).throwIfNotFound();
	const id = req.params.id || req.body.id;
	return await page.$relatedQuery('assets').patchAndFetchById(id, req.body).throwIfNotFound();
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
