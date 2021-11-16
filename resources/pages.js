const {Models} = require('objection');
const {Page} = Models;

exports.GET = async (req, res, next) => {
	const { domain } = req.params;
	const pages = await Page.query().where({ domain }).orderBy('updated_at', 'desc').limit(20);
	res.json(pages);
};

exports.PUT = async (req, res, next) => {
	const {domain, key, view} = req.params;
	await Page.have({ domain, key, view });
	res.sendStatus(204);
};
