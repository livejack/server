const path = require('path');
const readFileSync = require('fs').readFileSync;
const serveStatic = require('serve-static');
const ModuleServer = require("esmoduleserve/moduleserver");

/* ES Modules path resolution for browsers */
/* uses fields in package.json (exports,module,jsnext:main,main) */
/* mount is the base path, and it needs a whitelist of modules names */

module.exports = function(mount) {
	const node_path = path.join('.', 'node_modules');
	const serveHandler = serveStatic(path.resolve(node_path), {
		index: false,
		redirect: false,
		dotfiles: 'ignore',
		fallthrough: false
	});

	const moduleServer = new ModuleServer({
		root: node_path,
		prefix: mount.substring(1)
	});

	const modules = {};

	return function serveModule(req, res, next) {
		if (!req.path.startsWith(mount + '/')) {
			return next('route');
		}
		if (req.app.settings.env != "development") {
			throw new HttpError.Unauthorized(mount + " is only served in development environment");
		}
		const extname = path.extname(req.path);
		if (extname && extname == ".js") {
			if (!moduleServer.handleRequest(req, res)) res.sendStatus(404);
			return;
		}
		const [moduleName, rest] = pathInfo(req.path.substring(mount.length + 1));
		let mod = modules[moduleName];

		if (!mod) {
			const modulePath = path.join(node_path, moduleName);
			const pkg = JSON.parse(readFileSync(path.join(modulePath, 'package.json')));
			const paths = exportedPaths(pkg);
			const exp = paths["."];

			const objExp = path.parse(exp);
			mod = modules[moduleName] = {
				dir: objExp.dir,
				base: objExp.base,
				name: moduleName
			};
		}

		const objRest = path.parse(path.join('.', rest));
		let redir = true;
		let restBase = objRest.base;
		if (restBase == "" || restBase == ".") {
			restBase = mod.base;
		}	else if (!objRest.ext) {
			restBase += ".js";
		} else {
			redir = false;
		}
		let restDir = objRest.dir;
		if (!restDir.startsWith(mod.dir) && objRest.ext != ".css") {
			restDir = mod.dir + '/' + objRest.dir;
			redir = true;
		}
		if (redir) {
			res.redirect(path.join(mount, moduleName, restDir, restBase));
		} else {
			req.url = '/' + path.join(mod.name, rest);
			serveHandler(req, res, next);
		}
	};
};

function exportedPaths(pkg) {
	const paths = {};
	if (pkg.exports) {
		for (let key in pkg.exports) {
			const exp = pkg.exports[key];
			if (key == "import") {
				paths['.'] = exp;
			} else if (key.startsWith(".")) {
				if (typeof exp == "object" && exp.import) {
					paths[key] = exp.import;
				} else {
					paths[key] = exp;
				}
			}
		}
	} else {
		let fallback = pkg.module || pkg['jsnext:main'] || pkg.main;
		if (fallback) {
			if (!fallback.startsWith('.')) fallback = './' + fallback;
			paths["."] = fallback;
		}
	}
	return paths;
}

function pathInfo(reqPath) {
	const list = reqPath.split('/');
	if (!list.length) return [null, null];
	let name = list.shift();
	if (name.charAt(0) == "@") name += "/" + list.shift();
	return [name, list.join('/')];
}
