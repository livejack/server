// always resolve paths relative to app.js directory
process.chdir(__dirname);
const { once } = require('events');
const cors = require('cors');
const morgan = require('morgan');
const rewrite = require('express-urlrewrite');
const Path = require('path');
const serveStatic = require('serve-static');
const got = require('got');

const serveModule = require("@webmodule/serve");
const LiveJack = require('@livejack/client/node');
const Upcache = require('upcache');
const WellKnownUpcache = "/.well-known/upcache";

const ini = require('./lib/express-ini');

global.HttpError = require('http-errors');

const express = require('express');
const upload = require('./lib/upload');
const purge = require('./lib/purge');

const app = require('./lib/express-async')(express)();
const jsonParser = express.json({
	limit: "100kb"
});
const config = ini(app);

if (!config.site.startsWith('https://')) config.site = 'https://' + config.site;
config.site = new URL(config.site);

if (config.proxy) {
	process.env.all_proxy = config.proxy;
	console.info("inspector proxy", new URL(config.proxy).hostname);
}

app.post('/.well-known/reports', jsonParser, require('./lib/report'));

const apiCall = process.argv.length == 3 ? process.argv[2] : null;

config.live.version = require('@livejack/client/package.json').version;

const tag = {
	app: Upcache.tag('app'),
	page: Upcache.tag('app', 'data-:domain-:key'),
	domain: Upcache.tag('app', 'data-:domain'),
	all: Upcache.tag('app', 'data')
};
if (config.cache === false && !apiCall) {
	console.info("Cache disabled");
	tag.app = tag.page = tag.domain = tag.all = Upcache.tag.disable();
}

async function start(objection) {
	global.livejack = new LiveJack({
		servers: config.live.servers.split(' '),
		namespace: config.live.namespace,
		token: config.live.token
	});

	process.title = config.name + '-' + config.version;
	process.on('uncaughtException', (err) => {
		console.error(err);
		process.exit(1);
	});

	app.set('views', Path.resolve('public'));

	const prerender = require('./lib/prerender');
	prerender.configure(config);

	express.response.prerender = function (path, opts) {
		prerender(path, opts)(this.req, this, this.req.next);
	};

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

	app.post(WellKnownUpcache, tag.app, (req) => {
		return 204;
	});

	const auth = require('./lib/auth');
	await auth.keygen(config);
	const domainLock = auth.lock('write-:domain');

	app.route("/robots.txt").get(
		tag.app,
		(req, res) => {
			res.type('text/plain').send("User-agent: *\nDisallow: /\n");
		}
	);

	app.route("/favicon.ico").get(
		tag.app,
		() => 404
	);

	app.use("/node_modules/", tag.app, serveModule());

	app.get("/favicons/:base64url", tag.app.for('1y'), require('./lib/favicons'));

	app.route(/\/js|css|dist\//).get(
		tag.app,
		serveStatic(app.get('views'), {
			index: false,
			redirect: false,
			dotfiles: 'ignore',
			fallthrough: false
		})
	);

	app.use(cors());

	app.use(morgan(':method :status :response-time ms :url - :res[content-length]'));

	app.get('/lives.json', tag.all, routes.lives.GET);

	app.param('domain', (req, res, next, domain) => {
		req.domain = req.app.settings.domains[req.params.domain];
		if (req.domain) {
			req.params.view = req.domain.view;
			if (req.domain.icon) {
				req.params.icon = "/favicons/" + Buffer.from(req.domain.icon).toString('base64').replace(/=*$/, '');
			}
		}
		next();
	});

	app.get('/', tag.app, (req, res, next) => {
		res.prerender("index.html", { render: false });
	});
	app.get('/frame', tag.app, (req, res, next) => {
		res.prerender("frame.html", { render: false });
	});

	// appelé par BO site pour synchroniser les pictos
	app.get('/:domain/:key(pictos)/synchro', async (req) => {
		// do an internal post
		if (!req.domain) throw new HttpError.BadRequest("No domain");
		const sameUrl = new URL(config.site);
		sameUrl.pathname = req.path;
		await got.post(sameUrl, {
			retry: 0
		});
		return 200;
	});
	app.post('/:domain/:key(pictos)/synchro', tag.page, resources.synchro.pictos);
	// appelé par BO site pour synchroniser un live
	app.get('/:domain/:key/synchro', resources.synchro.GET);

	// this route needs its own extension
	app.get('/:domain/:key/messages.html', rewrite('/:domain/:key/read?fragment=.live-messages'));

	app.get('/:domain', domainLock, tag.domain, routes.domain.GET);
	app.get('/.api/:domain/pages', domainLock, tag.domain, jsonParser, resources.pages.GET);

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

	app.get('/:domain/:key/status', tag.page, (req, res, next) => {
		// see put ./page, see below
		res.set('xkey', `live-texte|${req.params.key}`);
		next();
	}, resources.status.GET);

	app.route('/:domain/:key/page')
		.get(tag.page, resources.page.GET)
		.put(tag.page, (req, res, next) => {
			next();
			const domain = config.domains[req.params.domain];
			if (domain && domain.purge) {
				purge(domain.purge
					.replace('%h', config.site.hostname)
					.replace('%d', req.params.domain)
					.replace('%k', req.params.key)
				);
			}
		}, tag.domain, tag.all, domainLock, jsonParser, resources.page.PUT)
		.delete(domainLock, tag.page, tag.domain, tag.all, jsonParser, resources.page.DELETE);

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

	app.use((err, req, res, next) => {
		let code;
		if (err instanceof HttpError) {
			code = err.status;
		} else {
			code = objection.errorStatus(err);
		}
		if (typeof code != 'number' || code == 500) {
			console.error(err);
			code = 500;
		} else if (process.env.NODE_ENV != "production") {
			console.error(err);
		}
		res.status(code).send(err.toString());
	});

	require('./lib/cron')(config.cron);
	require('./lib/expiration')(config);

	const server = require('http').createServer(app).listen(config.listen);
	await once(server, 'listening');
	console.info("Listening on port", config.listen);
	const upcacheUrl = new URL(config.site);
	upcacheUrl.pathname = WellKnownUpcache;
	try {
		await got.post(upcacheUrl, {
			retry: {
				limit: Math.Infinity,
				methods: ["POST"]
			}
		});
		console.info("Cache invalidated");
	} catch (err) {
		console.error(upcacheUrl.href, err);
	}
}

const objection = require('./models')(config.database);
(async () => {
	await ini.async(config);

	switch (apiCall) {
		case "migrate":
			await objection.BaseModel.knex().migrate.latest({
				directory: "migrations/"
			});
			await objection.BaseModel.knex().destroy();
			break;
		case "populate":
			await objection.Models.User.populate(
				Object.entries(config.domains).map(([domain, obj]) => {
					return { domain, token: obj.password };
				})
			);
			await objection.BaseModel.knex().destroy();
			break;
		case null:
			await start(objection);
			break;
		default:
			throw new Error(`Unknown api call: ${apiCall}`);
	}
})().catch(err => {
	console.error(err);
	process.exit(1);
});
