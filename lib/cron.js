const got = require('got');

module.exports = function init(opts) {
	if (Array.isArray(opts) == false) opts = [opts];
	opts.forEach(initCron);
};

function initCron(opts) {
	if (!opts) return;
	const interval = parseInt(opts.interval) * 1000;
	if (interval < 10000) {
		console.warn("cron ignored, interval too short", opts.title, interval);
		return;
	}
	console.info("cron", opts.title, "every", interval);
	setInterval(() => {
		got(opts.url, {
			timeout: Math.min(15000, Math.round(interval / 2))
		}).catch(console.error);
	}, interval);
}

