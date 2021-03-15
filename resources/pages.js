const {Models} = require('objection');
const {Page} = Models;

exports.GET = async (req, res, next) => {
	const {domain} = req.params;
	const pages = await Page.query().find({ domain }).orderBy('updated_at', 'desc').limit(10);
	res.json(pages);
};

exports.PUT = async (req, res, next) => {
	const {domain, key} = req.params;
	await Page.have({domain, key, view: req.domain.view});
	res.sendStatus(204);
};

