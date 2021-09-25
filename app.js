// always resolve paths relative to app.js directory
process.chdir(__dirname);
const cors = require('cors');
const morgan = require('morgan');
const rewrite = require('express-urlrewrite');
const URL = require('url');
const Path = require('path');
const serveStatic = require('serve-static');
const got = require('got');

const serveModule = require("@webmodule/serve");
const LiveJack = require('@livejack/client/node');

const Upcache = require('upcache');
const tag = {
	page: Upcache.tag('app', 'data-:domain-:key'),
	domain: Upcache.tag('app', 'data-:domain'),
	all: Upcache.tag('app', 'data')
};

const ini = require('./lib/express-ini');

global.HttpError = require('http-errors');

const express = require('express');
const upload = require('./lib/upload');
const app = require('./lib/express-async')(express)();
const jsonParser = express.json({
	limit: "100kb"
});
const config = ini(app);

config.live.version = require('@livejack/client/package.json').version;

(async () => {

	process.title = config.name + '-' + config.version;
	process.on('uncaughtException', (err) => {
		console.error(err); // eslint-disable-line
		process.exit(1);
	});

	app.set('statics', Path.resolve('public'));

	config.site = URL.parse(config.site);
	config.site.port = config.site.port || 80;
	config.listen = config.listen || config.site.port;

	global.livejack = new LiveJack({
		servers: config.live.servers.split(' '),
		namespace: config.live.namespace,
		token: config.live.token
	});

	const prerender = require('./lib/prerender');
	prerender.configure(config);

	const objection = require('./models')(app);
	await objection.BaseModel.knex().migrate.latest({
		directory: "migrations/"
	});
	const resources = require('./resources/*');
	const routes = require('./routes/*');

	app.use((req, res) => {
		res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
		res.setHeader('X-XSS-Protection', '1;mode=block');
		res.setHeader('X-Frame-Options', 'sameorigin');
		res.setHeader('X-Content-Type-Options', 'nosniff');
		res.setHeader('Content-Security-Policy', [
			// "default-src 'self'",
			// "style-src 'self' 'unsafe-inline'",
			// "font-src 'self' data:",
			// "img-src 'self' data:"
		].join('; '));
	});

	app.get('/.well-known/status', (req) => {
		return 204;
	});

	app.post('/.well-known/upcache', Upcache.tag('app'), (req) => {
		return 204;
	});

	const auth = require('./lib/auth');
	const domainLock = auth.lock('write-:domain');
	auth.init(app);

	app.route("/robots.txt").get(
		Upcache.tag('app'),
		(req, res) => {
			res.type('text/plain').send("User-agent: *\nDisallow: /\n");
		}
	);

	app.route("/favicon.ico").get(
		Upcache.tag('app'),
		() => 404
	);

	app.use("/node_modules/", Upcache.tag('app'), serveModule());

	app.route(/\/js|css|img|dist\//).get(
		Upcache.tag('app'),
		serveStatic(app.get('statics'), {
			index: false,
			redirect: false,
			dotfiles: 'ignore',
			fallthrough: false
		})
	);

	app.options('*', cors());

	app.use(morgan(':method :status :response-time ms :url - :res[content-length]'));

	app.get('/lives.json', Upcache.tag('data'), routes.lives.GET);

	app.param('domain', (req, res, next, domain) => {
		req.domain = req.app.settings.domains[req.params.domain];
		next();
	});

	app.get('/:domain/:key', (req, res, next) => {
		if (req.query.write !== undefined || req.legacyHost) {
			delete req.query.write;
			return res.redirect(URL.format({
				protocol: config.site.protocol,
				host: config.site.host,
				pathname: req.path + '/write',
				query: req.query
			}));
		} else {
			next('route');
		}
	});

	// envoi des notifications de mise à jour vers BO-site qui en retour appelle Front-Live
	app.get('/:domain/synchro/now', auth.lock('admin'), resources.synchro.now);
	// appelé par BO site pour synchroniser les pictos
	app.get('/:domain/:key(pictos)/synchro', domainLock, resources.synchro.pictos);
	// appelé par BO site pour synchroniser un live
	app.get('/:domain/:key/synchro', domainLock, resources.synchro.GET);

	// this route needs its own extension
	app.get('/:domain/:key/messages.html', rewrite('/:domain/:key/read?fragment=.live-messages'));

	// below all routes can be .json or .html or nothing
	app.use(require('express-extension-to-accept')(['html', 'json']));

	app.get('/:domain/:key', (req, res, next) => {
		let mw;
		if (req.query.maxresults != undefined) {
			let indir = '/:domain/:key/page?limit=:maxresults';
			if (!req.query.text || req.query.text == "false" || req.query.text == "0") {
				indir += '&omit=text';
			}
			delete req.query.text;
			mw = rewrite('/:domain/:key\\?maxresults=:maxresults', indir);
		} else {
			mw = rewrite('/:domain/:key/read');
		}
		if (mw) mw(req, res, next);
		else next('route');
	});

	app.put('/:domain/:key', rewrite('/:domain/:key/write'));

	app.get('/:domain/:key/read', tag.page, routes.read.GET);

	app.get('/:domain/:key/status', tag.page, resources.status.GET);

	app.route('/:domain/:key/page')
		.get(tag.page, resources.page.GET)
		.put(tag.page, tag.domain, tag.all, domainLock, jsonParser, resources.page.PUT);

	app.route('/:domain/:key/messages/:id?')
		.get(tag.page, resources.message.GET)
		.put(domainLock, tag.page, jsonParser, resources.message.PUT)
		.post(domainLock, tag.page, jsonParser, resources.message.POST)
		.delete(domainLock, tag.page, jsonParser, resources.message.DELETE);

	app.route('/:domain/:key/assets/:id?')
		.get(domainLock, tag.page, resources.asset.GET)
		.put(domainLock, tag.page, jsonParser, resources.asset.PUT)
		.post(domainLock, tag.page, upload, jsonParser, resources.asset.POST)
		.delete(domainLock, tag.page, jsonParser, resources.asset.DELETE);

	app.route('/:domain/:key/write')
		.get(domainLock, tag.page, routes.write.GET)
		.put(domainLock, tag.page, tag.domain, jsonParser, routes.write.PUT)
		.delete(domainLock, tag.page, jsonParser, routes.write.DELETE);

	app.get('/:domain', domainLock, tag.domain, prerender('domain'));

	app.use((err, req, res, next) => {
		let code;
		if (err instanceof HttpError) {
			code = err.status;
		} else {
			code = objection.errorStatus(err);
		}
		if (typeof code != 'number' || code == 500) {
			console.error(err); // eslint-disable-line
			code = 500;
		}
		res.status(code).send(err.toString());
	});

	if (config.cron) require('./lib/cron')(config.cron);
	if (config.autoExpire) require('./lib/expiration')(config);

	await ini.async(config);

	await objection.Models.User.populate(
		Object.entries(config.domains).map(([domain, obj]) => {
			return { domain, token: obj.password };
		})
	);
	await auth.keygen(config);
	require('http').createServer(app).listen(config.listen, async () => {
		console.info("Listening on port", config.listen); // eslint-disable-line
		await got.post(`${config.site.href}.well-known/upcache`, {
			retry: {
				limit: Math.Infinity,
				methods: ["POST"]
			}
		});
		console.info("Cache invalidated");
	});

})().catch((err) => {
	console.error(err);
	process.exit(1);
});

