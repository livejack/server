const got = require('got');

module.exports = async (req, res, next) => {
	if (!req.accepts('image/*')) {
		res.sendStatus(400);
		return;
	}
	try {
		const url = Buffer.from(req.params.base64url, 'base64').toString();
		const gs = got(url, {
			headers: {
				accept: req.get('accept')
			},
			retry: false,
			responseType: 'buffer'
		});
		const response = await gs;
		res.set('Content-Type', response.headers['content-type']);
		res.send(await gs.buffer());
	} catch (err) {
		console.error(err.message);
		res.sendStatus(404);
	}
};
