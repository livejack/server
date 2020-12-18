const {Models} = require('objection');
const {Page} = Models;
const got = require('got');
const {promisify} = require('util');
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

exports.POST = async (req, res, next) => {
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
	res.send(asset);
};

async function createAsset(page, body = {}) {
	const item = Object.assign({}, body);
	if (item.id !== undefined) delete item.id;
	try {
		const meta = await inspector(item.url, {
			nofavicon: true,
			nosource: true,
			file: false
		});
		if (meta.title) item.title = meta.title;
		if (meta.description) item.description = meta.description;
		if (meta.thumbnail) item.thumbnail = meta.thumbnail;
	} catch(err) {
		console.error("inspector fail", item.url, err);
	}
	return await page.$relatedQuery('assets').insertAndFetch(item);
}

exports.PUT = async (req, res, next) => {
	const {domain, key} = req.params;
	const page = await Page.query().findOne({ domain, key }).throwIfNotFound();
	const id = req.params.id || req.body.id;
	return await page.$relatedQuery('assets').patchAndFetchById(id, req.body).throwIfNotFound();
};

exports.DELETE = async (req, res, next) => {
	const {domain, key} = req.params;
	const page = await Page.query().findOne({ domain, key }).throwIfNotFound();
	const id = req.params.id || req.body.id;
	await page.$relatedQuery('assets').deleteById(id).throwIfNotFound();
};
