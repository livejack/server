
version=$(shell node -p 'require("./package").version')
bundler=npx webmodule-bundle --root public

transpiled:
	$(bundler) --concatenate --css dist/live-read-${version}.css --js dist/live-read-${version}.js public/live-read.html
	$(bundler) --concatenate --css dist/live-write-${version}.css --js dist/live-write-${version}.js public/live-write.html

minified:
	$(bundler) --css dist/live-read-${version}.min.css --js dist/live-read-${version}.min.js public/live-read.html
	$(bundler) --css dist/live-write-${version}.min.css --js dist/live-write-${version}.min.js public/live-write.html

bundles: transpiled minified
