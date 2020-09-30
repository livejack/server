const Toml = require('toml');
const read = require('fs').readFileSync;
const Path = require('path');
const xdg = require('xdg-basedir');
const fs = require('fs').promises;

module.exports = function(app) {
	app.enable('trust proxy', 1);
	app.enable('strict routing');
	app.disable('x-powered-by');

	const pkg = require('../package.json');
	const env = app.settings.env;
	const name = app.settings.name = pkg.name.replace('@', '');
	app.settings.version = pkg.version;
	app.settings.dirs = {
		data: Path.join(xdg.data, name)
	};
	const conf = Toml.parse(read(Path.join(xdg.config, name, `${env}.toml`), 'utf-8'));
	Object.assign(app.settings, conf);
	return app.settings;
};

module.exports.async = async function(config) {
	await fs.mkdir(config.dirs.data, {recursive: true});
};

