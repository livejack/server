const { pipeline } = require('stream');
const http = require('http');
const https = require('https');
const { Deferred } = require('class-deferred');

module.exports = agentProxy;

function getRemoteUrl(req) {
	const { domain, key } = req.params;
	const url = req.domain.asset;
	if (!url) {
		throw new HttpError.BadRequest("Unsupported upload for that domain");
	}
	return url.replace('%s', encodeURIComponent(`/${domain}/${key}`));
}

function normalizeResponse(obj) {
	if (!obj || !obj.success) {
		throw new HttpError.BadRequest(obj.message);
	}
	return {
		url: obj.url,
		type: 'image'
	};
}

function getBody(rstream) {
	const defer = new Deferred();
	const chunks = [];
	rstream.setEncoding('utf8');
	rstream.on('data', chunk => {
		chunks.push(chunk);
	});
	rstream.on('end', () => {
		defer.resolve(chunks.join(""));
	});
	return defer;
}

async function waitURL(url) {
	const obj = new URL(url);
	const maxTries = 10;

	let tries = -1;
	let ok = false;
	while (tries++ < maxTries) {
		ok = await statURL(obj);
		if (ok) break;
		console.warn("waiting for url", tries, url);
	}
	if (!ok) throw new new HttpError[408]("Upload took too long");
	return;
}

async function statURL(obj) {
	const d = new Deferred();
	const agent = obj.protocol == "https:" ? https : http;
	const req = agent.request(obj, {
		method: 'HEAD',
		timeout: 2000,
		rejectUnauthorized: false
	}, ({ statusCode }) => {
		d.resolve(statusCode >= 200 && statusCode < 300);
	});
	req.on('error', e => {
		d.resolve(false);
	});
	req.end();
	return d;
}

function agentProxy(req, res, next) {
	if (!req.is('multipart/form-data')) return next();
	const url = new URL(getRemoteUrl(req));
	const agent = url.protocol == "https:" ? https : http;
	const proxyReq = agent.request({
		host: url.host,
		path: url.pathname + url.search,
		headers: {
			'Content-Type': req.get('Content-Type'),
			'Content-Length': req.get('Content-Length')
		},
		method: 'POST'
	}, async (proxyRes) => {
		const code = proxyRes.statusCode;
		if (code < 200) {
			return next(new HttpError[code || 500](proxyRes.statusMessage || "Unknown error"));
		}
		try {
			const body = await getBody(proxyRes);
			if (code >= 300) throw new HttpError[code](body);
			const ret = normalizeResponse(JSON.parse(body));
			await waitURL(ret.url);
			req.body = ret;
			next();
		} catch (err) {
			next(err);
		}
	});
	pipeline(req, proxyReq, (err) => {
		if (err) next(err);
	});
}
