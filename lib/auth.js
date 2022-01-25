const qs = require('qs');
const Upcache = require('upcache');
const { Models } = require('objection');
const Keygen = require('../lib/keygen');
const Lock = Upcache.lock({
	maxAge: 60 * 60 * 48,
	userProperty: 'user',
	keysize: 2048
});

exports.keygen = async (config) => {
	const keys = await Keygen(config);
	Object.assign(Lock.config, keys);
};

exports.lock = (str) => {
	return [
		Lock.init,
		queryLogin,
		queryLogout,
		lockMw(str)
	];
};

function lockMw(str) {
	return function (req, res) {
		const grants = req.user.grants || [];
		const lock = str.replace(':domain', req.params.domain);
		const locked = grants.includes(lock) == false;
		Lock.headers(res, [lock]);
		if (locked) {
			const code = grants.length == 0 ? 401 : 403;
			if (req.accepts('json', 'html') == 'html') {
				res.status(code);
				res.prerender('login.html');
			} else {
				res.sendStatus(code);
			}
		}
	};
}

async function queryLogin(req, res) {
	// passing a _token is like login in, so redirect without the token and log in !
	const domain = req.params.domain;
	// eslint-disable-next-line no-underscore-dangle
	const token = req.query._token;

	if (token) {
		const user = await Models.User.query().findOne({ domain, token });
		if (user) {
			const grant = 'write-' + user.domain;
			const grants = req.user.grants || [];
			if (!grants.includes(grant)) grants.push(grant);
			Lock.login(res, { grants });
		} else {
			throw new HttpError.Unauthorized();
		}
	}
	cleanQueryParameters(['_token'], req, res);
}

async function queryLogout(req, res) {
	const logout = req.query.logout !== undefined;
	if (logout) {
		Lock.logout(res);
	}
	cleanQueryParameters(['logout'], req, res);
}

function cleanQueryParameters(names, req, res) {
	if (req.method != "GET" || req.accepts('json', 'html') != 'html') return;
	let any = false;
	for (const name of names) {
		if (name in req.query) {
			delete req.query[name];
			any = true;
		}
	}
	if (!any) return;
	let redirUrl = (req.baseUrl || '') + req.path;
	if (Object.keys(req.query).length > 0) {
		redirUrl += '?' + qs.stringify(req.query);
	}
	res.redirect(redirUrl);
}
