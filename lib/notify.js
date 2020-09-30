const {format} = require('util');
const got = require('got');
const {default: PQueue} = require('p-queue');

const queue = new PQueue({concurrency: 1});

module.exports = async function (url, id) {
	if (!url) throw new Error("notify called without url");
	if (!id) throw new Error("notify called without id");

	await queue.add(() => got(format(url, id), {
		json: true,
		timeout: 30000
	}).catch((err) => {
		console.error("Error in notify", url, id);
	}));
};
