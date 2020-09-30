const Path = require('path');
const fs = require('fs').promises;
const pify = require('util').promisify;
const generateKeyPair = pify(require('crypto').generateKeyPair);

module.exports = function(opts) {
	var keysPath = Path.join(opts.dirs.data, `${opts.env}-keys.json`);
	return fs.readFile(keysPath).then(function(buf) {
		return JSON.parse(buf.toString());
	}).catch(function() {
		return generateKeyPair('rsa', {
			modulusLength: 4096,
			publicKeyEncoding: {
				type: 'pkcs1',
				format: 'pem'
			},
			privateKeyEncoding: {
				type: 'pkcs1',
				format: 'pem'
			}
		}).then(function(keys) {
			return fs.writeFile(keysPath, JSON.stringify(keys)).then(function() {
				return fs.chmod(keysPath, 0o600);
			}).then(function() {
				return keys;
			});
		});
	});
};

