const DatauriParser = require('datauri/parser');
const sharp = require('sharp');
const pipeline = require('util').promisify(require('stream').pipeline);
const got = require('got');
sharp.simd(true);

module.exports = async function (url) {
	try {
		const pil = sharp().resize({
			fit: "inside",
			height: 64
		}).flatten({
			background: 'white'
		}).toFormat('webp', {
			quality: 70
		});
		const [buf] = await Promise.all([
			pil.toBuffer(),
			pipeline(got.stream(url, {
				retry: 0,
				headers: {
					"Accept-Encoding": "identity",
					"Accept": "image/webp,*/*"
				}
			}), pil)
		]);
		const parser = new DatauriParser();
		return parser.format('.webp', buf).content;
	} catch (err) {
		console.error("Error generating thumbnail: " + url);
	}
};
