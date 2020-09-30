const {Models} = require('objection');
const prerender = require('../lib/prerender');

exports.GET = function(req, res, next) {
	res.format(exports.GET);
};

// ouverture de la page
exports.GET.default = exports.GET.html = async function(req, res, next) {
	const {domain, key} = req.params;

	const page = await Models.Page.have({
		domain, key,
		view: req.domain.view
	});

	prerender(`${page.view}-read`)(req, res, next);
};

exports.GET.json = async function(req, res, next) {
	const {domain, key} = req.params;
	const page = await Models.Page.query().findOne({domain, key}).select().throwIfNotFound()
		.withGraphFetched('messages(select,order)');
	res.send(page);
};

