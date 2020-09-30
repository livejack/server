const fs = require('fs');
const path = require('path');

(function requireAll(dirname) {
	const files = fs.readdirSync(dirname);
	const modules = {};

	files.forEach((file) => {
		var filepath = path.join(dirname, file);
		if (fs.statSync(filepath).isDirectory()) {
			modules[file] = requireAll(filepath);
		} else {
			const extname = path.extname(filepath);
			const basename = path.basename(filepath, extname);
			if (extname != '.js' || basename == '*') return;
			exports[basename] = require(filepath);
		}
	});
})(__dirname);
