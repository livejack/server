const got = require('got');

module.exports = async (req, res, next) => {
	try {
		const gs = got(req.query.url, {
			retry: false,
			responseType: 'buffer'
		});
		const response = await gs;
		res.set('Content-Type', response.headers['content-type']);
		res.send(await gs.buffer());
	} catch (err) {
		next(err);
	}
};
