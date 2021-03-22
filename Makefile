
version=$(shell node -p 'require("./package").version')

bundle:
	bundledom --concatenate --modules=/modules --css dist/live-read-${version}.css --js dist/live-read-${version}.js --root public public/live-read.html
	bundledom --concatenate --modules=/modules --css dist/live-write-${version}.css --js dist/live-write-${version}.js --root public public/live-write.html
