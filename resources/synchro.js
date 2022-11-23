const { Page } = require('objection').Models;
const DiffList = require('diff-list');
const got = require('got');
const { prepareAsset, normalizeMeta } = require('./asset');

exports.GET = async (req) => {
	if (!req.domain) throw new HttpError.BadRequest("No domain");
	const page = await Page.have(req.params);
	const data = await fetchExport(req.domain.export, page.key);
	await exports.syncAssets(page, data, 'image');
	return 200;
};

exports.syncAssets = async (page, body, type) => {
	if (!body || Object.keys(body).length == 0) return;
	const npage = {};
	if (body.titre != null && page.title != body.titre) {
		npage.title = body.titre;
	}
	if (body.url != null && page.backtrack != body.url) {
		npage.backtrack = body.url;
	}
	if (Object.keys(npage).length > 0) {
		await page.$query().patch(npage);
	}

	let nassets = [];
	if (body.categorie) {
		body.categorie.forEach((categorie) => {
			const titre = categorie.titre ? categorie.titre.toString() : null;
			if (categorie.media) categorie.media.forEach((asset) => {
				if (titre && !asset.tags) asset.tags = [titre];
				nassets.push(asset);
			});
		});
	} else if (body.media) {
		const media = body.media;
		if (Array.isArray(media)) nassets.push(...media);
		else nassets.push(media);
	} else {
		return;
	}

	nassets = nassets.filter(item => {
		return item && typeof item.url == "string" && item.url;
	}).map(item => {
		const meta = {
			url: item.url
		};
		if (item.legende) {
			meta.description = item.legende;
		}
		if (item.credits || item.credit) {
			meta.author = item.credits || item.credit;
		}
		if (item.tags) {
			meta.keywords = item.tags;
		}
		normalizeMeta(meta);
		const asset = {
			url: meta.url,
			origin: 'external',
			type,
			meta
		};
		delete meta.url;
		return asset;
	});

	const assets = await page.$relatedQuery('hrefs').where({
		origin: 'external'
	});
	const diff = DiffList(assets, nassets, {
		key: 'url',
		equal: function (a, b) {
			let isEqual = true;
			for (const key in ['description', 'author', 'keywords']) {
				if (b.meta[key] != a.meta[key]) {
					a.meta[key] = b.meta[key];
					isEqual = false;
				}
			}
			Object.assign(b, a);
			return isEqual;
		}
	});

	for (const asset of diff.put) {
		await page.$relatedQuery('hrefs').findById(asset.id).patch(asset);
	}
	for (const item of diff.post) {
		if (type != "picto") {
			const asset = await prepareAsset(item.url);
			asset.origin = item.origin;
			await page.$relatedQuery('hrefs').insert(asset);
		} else {
			await page.$relatedQuery('hrefs').insert(item);
		}
	}
	for (const asset of diff.del) {
		await page.$relatedQuery('hrefs').findById(asset.id).delete();
	}
};

exports.now = function(req, res, next) {
	require('../lib/cache-notify').job();
	next(200);
};

exports.all = function(req, res, next) {
	require('../lib/cache-notify').all(req.params.domain);
	next(200);
};

async function fetchExport(remote, key) {
	if (!remote) return;
	try {
		return got(remote.replace('%s', key)).json();
	} catch (err) {
		if (err && err.code != 404) console.error(err);
	}
}
