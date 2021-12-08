/* eslint-env browser */
const dom = require('express-dom');
const Path = require('path');

dom.clear();

module.exports = function (name, opts = {}) {
	return dom((mw, settings, req) => {
		if (req.query.develop !== undefined || opts.render === false) {
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
	dom.settings.views = config.views;
	dom.settings.prepare.plugins = [
		mergeConfig,
		dom.plugins.hide,
		dom.plugins.noreq,
		dom.plugins.html
	];
	dom.settings.load.plugins = [
		dom.plugins.hide,
		dom.plugins.nomedia,
		dom.plugins.cookies({
			bearer: true
		}),
		dom.plugins.prerender,
		fragmentHtml,
		dom.plugins.html
	];
};


function fragmentHtml(page, settings, req, res) {
	const frag = req.query.fragment;
	if (!frag) return; // let it be
	page.when('idle', () => {
		return page.run((fragment, done) => {
			const frag = document.body.querySelector(fragment);
			if (!frag) return done(400);
			const metas = document.head.querySelectorAll(`meta[name^="live-"]`);
			for (const meta of metas) {
				frag.insertBefore(meta, frag.firstElementChild);
			}
			done(null, frag.outerHTML);
		}, frag).then((str) => {
			settings.output = str;
		});
	});
}

function mergeConfig(page, settings, req) {
	page.when('ready', () => {
		const conf = req.app.settings;
		let bundle;
		if (conf.bundle) {
			bundle = conf.version;
			if (conf.bundle == "minify") bundle += ".min";
		}

		const vars = Object.assign({}, conf.live, conf.parameters, req.params);

		return page.run((vars, bundle) => {
			for (const node of document.querySelectorAll('[prerender]')) {
				node.removeAttribute('prerender');
				for (const attr of Array.from(node.attributes)) {
					if (!attr.value) continue;
					const val = attr.value.replaceAll(/\[([^[\]]+)\]/g, (m, key) => {
						return vars[key] || "";
					});
					if (val == "") node.removeAttribute(attr.name);
					else node.setAttribute(attr.name, val);
				}
			}
			if (bundle) {
				document.querySelectorAll('script[src]').forEach(node => {
					const src = node.getAttribute('src')
						.replace(/^\/js\/(.*)\.js/, `/dist/$1-${bundle}.js`);
					node.setAttribute('src', src);
					node.removeAttribute('type');
					node.defer = true;
				});
				document.querySelectorAll('link[href][rel="stylesheet"]').forEach(node => {
					const href = node.getAttribute('href')
						.replace(/^\/css\/(.*)\.css/, `/dist/$1-${bundle}.css`);
					node.setAttribute('href', href);
				});
			}
		}, vars, bundle).catch((err) => {
			console.error(err);
		});
	});
}

