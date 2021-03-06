const qs = require('qs');
const Upcache = require('upcache');
const {Models} = require('objection');
const Keygen = require('../lib/keygen');
const Lock = Upcache.lock({
	maxAge: 60 * 60 * 48,
	userProperty: 'user',
	keysize: 2048
});

exports.init = (app) => {
	app.use(['/:domain', '/:domain/*'], Lock.init, queryLogin, queryLogout);
};

exports.keygen = async (config) => {
	const keys = await Keygen(config);
	Object.assign(Lock.config, keys);
};

exports.lock = (str) => {
	return (req, res, next) => {
		const grants = req.user.grants || [];
		const lock = str.replace(':domain', req.params.domain);
		const locked = grants.includes(lock) == false;
		Lock.headers(res, [lock]);
		if (locked) {
			res.sendStatus(grants.length == 0 ? 401 : 403);
		} else {
			next();
		}
	};
};

async function queryLogin(req, res) {
	// passing a _token is like login in, so redirect without the token and log in !
	const domain = req.params.domain;
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
	cleanQueryParameter('_token', req, res);
}

async function queryLogout(req, res) {
	const logout = req.query.logout;
	if (logout) {
		Lock.logout(res);
	}
	cleanQueryParameter('logout', req, res);
}

function cleanQueryParameter(name, req, res) {
	if (name in req.query && req.method == "GET" && req.accepts('json', 'html') == 'html') {
		var redirUrl = (req.baseUrl || '') + req.path;
		delete req.query[name];
		if (Object.keys(req.query).length > 0) {
			redirUrl += '?' + qs.stringify(req.query);
		}
		res.redirect(redirUrl);
	}
}
