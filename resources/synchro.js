const {Models} = require('objection');
const {Page} = Models;
const DiffList = require('diff-list');
const got = require('got');

exports.GET = async (req, res, next) => {
	const {domain, key} = req.params;
	await Page.have({
		domain, key,
		view: req.domain.view
	}).throwIfNotFound();

	await exports.syncAssets(req, req.domain.export, 'image');
	res.sendStatus(200);
};

exports.pictos = async (req, res, next) => {
	await exports.syncAssets(req, req.domain.pictos, 'picto');
	res.sendStatus(200);
};

// TODO rate limit this ?
exports.syncAssets = async (req, remoteUrl, type) => {
	const {domain, key} = req.params;
	const page = await Page.query().findOne({ domain, key }).throwIfNotFound();
	let obj = req.body;
	if (Object.keys(obj).length > 0) {
		// use obj
	} else if (remoteUrl) {
		obj = await got(remoteUrl.replace('%s', page.key)).json();
	}
	const npage = {};
	if (obj.titre != null && page.title != obj.titre) {
		npage.title = obj.titre;
	}
	if (obj.url != null && page.backtrack != obj.url) {
		npage.backtrack = obj.url;
	}
	if (Object.keys(npage).length > 0) {
		await page.$query().patch(npage);
	}

	let nassets = [];
	if (obj.categorie) {
		obj.categorie.forEach(function(categorie) {
			var titre = categorie.titre ? categorie.titre.toString() : null;
			if (categorie.media) categorie.media.forEach(function (asset) {
				if (titre && !asset.tags) asset.tags = [titre];
				nassets.push(asset);
			});
		});
	} else if (obj.media && Array.isArray(obj.media)) {
		nassets.push(...obj.media);
	} else {
		return;
	}

	nassets = nassets.map(function (item) {
		const asset = {
			url: item.url,
			origin: 'external',
			type: type
		};
		if (item.legende) asset.meta.title = item.legende;
		if (item.credits) asset.meta.author = item.credits;
		if (item.tags) asset.meta.keywords = item.tags;
		return asset;
	});

	const assets = await page.$relatedQuery('assets').where({
		origin: 'external'
	});
	const diff = DiffList(assets, nassets, {
		key: 'url',
		equal: function(a, b) {
			var isEqual = a.meta.title == b.meta.title && a.meta.author == b.meta.author && a.type == b.type;
			b.id = a.id; // we compared on url, but id is missing
			return isEqual;
		}
	});
	for (let asset of diff.put) {
		await page.$relatedQuery('hrefs').patchById(asset.id, asset);
	}
	for (let asset of diff.post) {
		await page.$relatedQuery('hrefs').insert(asset);
	}
	for (let asset of diff.del) {
		await page.$relatedQuery('hrefs').deleteById(asset.id);
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

