
version=$(shell node -p 'require("./package").version')

transpiled:
	bundledom --concatenate --modules=/modules --css dist/live-read-${version}.css --js dist/live-read-${version}.js --root public public/live-read.html
	bundledom --concatenate --modules=/modules --css dist/live-write-${version}.css --js dist/live-write-${version}.js --root public public/live-write.html

minified:
	bundledom --modules=/modules --css dist/live-read-${version}.min.css --js dist/live-read-${version}.min.js --root public public/live-read.html
	bundledom --modules=/modules --css dist/live-write-${version}.min.css --js dist/live-write-${version}.min.js --root public public/live-write.html

bundles: transpiled minified
