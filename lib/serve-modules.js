const path = require('path');
const readFile = require('fs').promises.readFile;
const serveStatic = require('serve-static');

/* ES Modules path resolution for browsers */
/* uses fields in package.json (exports,module,jsnext:main,main) */
/* mount is the base path, and it needs a whitelist of modules names */

module.exports = async function(mount, whitelist = []) {
	const node_path = path.join('.', 'node_modules');
	const serveHandler = serveStatic(path.resolve(node_path), {
		index: false,
		redirect: false,
		dotfiles: 'ignore',
		fallthrough: false
	});

	const modules = {};
	const bases = [];
	for (let name of whitelist) {
		const modulePath = path.join(node_path, name);
		const pkg = JSON.parse(await readFile(path.join(modulePath, 'package.json')));
		const paths = exportedPaths(pkg);
		const exp = paths["."];

		const objExp = path.parse(exp);
		const base = mount + '/' + name;
		modules[base] = {
			dir: objExp.dir,
			base: objExp.base,
			name: name
		};
		bases.push(base);
	}

	return function serveModules(req, res, next) {
		if (!req.path.startsWith(mount + '/')) {
			return next('route');
		}
		const base = bases.find((base) => req.path.startsWith(base));
		if (!base) throw new HttpError.NotFound("No such module");

		const mod = modules[base];

		let rest = "./" + req.path.substring(base.length + 1);
		const objRest = path.parse(rest);
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
			res.redirect(path.join(base, restDir, restBase));
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
