const {Models} = require('objection');
const {Page} = Models;

exports.GET = async (req) => {
	const {domain, key} = req.params;
	return await Page.query().findOne({ domain, key }).throwIfNotFound();
};

exports.PUT = async (req) => {
	const {domain, key} = req.params;
	return await Page.query().findOne({domain, key}).patch(req.body);
};
