const { pipeline } = require('stream');
const http = require('http');
const https = require('https');

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
	let url = obj.url;
	if (url.indexOf("/media/_uploaded/orig/") >= 0) {
		url = url.replace("/media/_uploaded/orig/", "/media/_uploaded/804x/");
	}
	if (url.startsWith('http://')) {
		url = 'https' + url.slice(4);
	}
	return {
		url,
		type: 'image'
	};
}

function getBody(rstream) {
	return new Promise((resolve) => {
		const chunks = [];
		rstream.setEncoding('utf8');
		rstream.on('data', (chunk) => {
			chunks.push(chunk);
		});
		rstream.on('end', () => {
			resolve(chunks.join(""));
		});
	});
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
			req.body = normalizeResponse(JSON.parse(body));
			next();
		} catch (err) {
			next(err);
		}
	});
	pipeline(req, proxyReq, function (err) {
		if (err) next(err);
	});
}
