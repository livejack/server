const DatauriParser = require('datauri/parser');
const sharp = require('sharp');
const got = require('got');
sharp.simd(true);

module.exports = async function (uri) {
	const pil = sharp({
		failOnError: true
	}).resize({
		fit: "inside",
		height: 64
	}).flatten({
		background: 'white'
	}).toFormat('webp', {
		quality: 50
	});


	got.stream(uri, {	headers: {
		"User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
		"Accept-Encoding": "identity",
		"Accept": "image/webp,*/*"
	}}).pipe(pil);

	const buf = await pil.toBuffer();
	const parser = new DatauriParser();
	return parser.format('.webp', buf).content;
};
