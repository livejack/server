/* eslint-env browser */
const dom = require('express-dom');
const Path = require('path');

dom.clear();

module.exports = function(name) {
	return dom((mw, settings, req) => {
		if (req.query.develop !== undefined) {
			delete req.query.develop;
			settings.load.disable = true;
		}
		settings.view = name;
	}).prepare().load();
};

module.exports.configure = function (config) {
	dom.settings.cacheDir = Path.join(config.dirs.cache, 'prerender');
	dom.settings.allow = 'same-origin';
	dom.settings.display = config.display;
	dom.settings.max = 8;
	dom.settings.stall = 10000;
	dom.settings.views = config.statics;
	dom.settings.prepare.plugins = [
		mergeConfig,
		dom.plugins.mount,
		dom.plugins.hide,
		dom.plugins.noreq,
		dom.plugins.html
	];
	dom.settings.load.plugins = [
		dom.plugins.hide,
		dom.plugins.nomedia,
		dom.plugins.prerender,
		fragmentHtml,
		dom.plugins.html
	];
};


function fragmentHtml(page, settings, req, res) {
	const frag = req.query.fragment;
	if (!frag) return; // let it be
	page.when('idle', function() {
		return page.run((fragment, done) => {
			const root = document.documentElement;
			const result = [];
			const config = document.getElementById('live');
			if (config) result.push(config.outerHTML);
			const frag = root.querySelector(fragment);
			if (!frag) return done(400);
			result.push(frag.outerHTML);
			done(null, result.join('\n'));
		}, frag).then((str) => {
			settings.output = str;
		});
	});
}

function mergeConfig(page, settings, req) {
	page.when('ready', function () {
		const conf = req.app.settings;
		const metas = Object.assign({
			servers: conf.live.servers,
			namespace: conf.live.namespace,
			version: conf.live.version,
			base: `/${req.params.domain}/${req.params.key}`
		}, conf.parameters);

		let bundle;
		if (conf.bundle) {
			bundle = conf.version;
			if (conf.bundle == "minify") bundle += ".min";
		}

		return page.run(function(params, view, bundle) {
			const icon = document.querySelector('head > link[rel="shortcut icon"]');
			if (icon) icon.href = `/img/${view}.ico`;

			for (let key in params) {
				document.head.insertAdjacentHTML('beforeEnd',
					`\t<meta name="live-${key}" content="${params[key]}">\n`
				);
			}
			if (bundle) {
				document.querySelectorAll('script[src]').forEach(node => {
					const src = node.getAttribute('src')
						.replace(/^js\/(.*)\.js/, `dist/$1-${bundle}.js`);
					node.setAttribute('src', src);
					node.removeAttribute('type');
					node.defer = true;
				});
				document.querySelectorAll('link[href][rel="stylesheet"]').forEach(node => {
					const href = node.getAttribute('href')
						.replace(/^css\/(.*)\.css/, `dist/$1-${bundle}.css`);
					node.setAttribute('href', href);
				});
			}
		}, metas, req.domain.view, bundle).catch(function(err) {
			console.error(err); // eslint-disable-line
		});
	});
}

