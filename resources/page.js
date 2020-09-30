const {Models} = require('objection');
const {Page} = Models;

exports.GET = async (req, res, next) => {
	const {domain, key} = req.params;
	const page = await Page.query().findOne({ domain, key }).throwIfNotFound();
	res.json(page);
};

exports.PUT = async (req, res, next) => {
	const {domain, key} = req.params;
	await Page.query().findOne({domain, key}).patch(req.body);
	res.sendStatus(204);
};

