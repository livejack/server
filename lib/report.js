module.exports = function (req) {
	const { age, body } = req.body;
	if (!body) {
		console.error("Missing body in report", req.body);
		return 204;
	}
	const ref = ((ref) => {
		try {
			const obj = new URL(ref);
			return obj.pathname + obj.search;
		} catch (err) {
			return ref;
		}
	})(req.get('Referrer'));

	const ua = req.get('User-Agent');
	console.error(
		`Error after ${age} seconds in ${ref}
 ${body.message || 'Empty message'}
 ${ua}`
	);
	return 204;
};
