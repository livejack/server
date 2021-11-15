const DatauriParser = require('datauri/parser');
const sharp = require('sharp');
const pipeline = require('util').promisify(require('stream').pipeline);
const got = require('got');
sharp.simd(true);

module.exports = async function (uri) {
	const pil = sharp().resize({
		fit: "inside",
		height: 64
	}).flatten({
		background: 'white'
	}).toFormat('webp', {
		quality: 50
	});
	const [buf] = await Promise.all([
		pil.toBuffer(),
		pipeline(got.stream(uri, {
			retry: 0,
			headers: {
				"Accept-Encoding": "identity",
				"Accept": "image/webp,*/*"
			}
		}), pil)
	]);
	const parser = new DatauriParser();
	return parser.format('.webp', buf).content;
};
