exports.GET = async function(req, res, next) {
	const { domain } = req.params;
	try {
		if (!domain) throw new HttpError.BadRequest("No domain");
		res.prerender('domain.html');
	} catch (err) {
		next(err);
	}
};
