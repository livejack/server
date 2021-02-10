const version = require('./package.json').version;
const esbuild = require('esbuild');
const path = require('path');
const rootDir = path.resolve('public');
const Resolver = require('@livejack/moduleserver/resolver');
const pijs = require('postinstall-js');
const picss = require('postinstall-css');

const resolver = new Resolver({
	node_path: path.join('.', 'node_modules'),
	prefix: '/modules'
});

const moduleResolver = {
	name: 'moduleserver',
	setup(build) {
		build.onResolve({ filter: /\/modules\// }, args => {
			const browserPath = path.join(
				'/',
				path.relative(
					rootDir,
					path.join(args.resolveDir, args.path)
				)
			);
			const resolvedPath = path.resolve(resolver.resolve(browserPath).path);
			return { path: resolvedPath };
		});
	},
};


(async () => {

	await Promise.all([
		'js/live-setup.js',
		'js/live-build.js',
	].map(async file => {
		const dest = path.join('builds', version, file);
		await esbuild.build({
			absWorkingDir: rootDir,
			entryPoints: [file],
			bundle: true,
			format: 'iife',
			target: "esnext",
			outfile: path.join('..', dest),
			plugins: [moduleResolver]
		});

		await pijs([dest], dest.replace(/\.js$/, '.min.js'), {

		});
	}));
	await Promise.all([
		'css/live-read.css',
		'css/live-write.css'
	].map(async file => {
		const dest = path.join('builds', version, file);
		await esbuild.build({
			absWorkingDir: rootDir,
			entryPoints: [file],
			bundle: true,
			outfile: path.join('..', dest),
			plugins: [moduleResolver]
		});
		await picss([dest], dest.replace(/\.css$/, '.min.css'), {

		});
	}));
	process.exit();

})();




