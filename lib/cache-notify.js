const {Models} = require('objection');
const notify = require('./notify');

let gConfig;
let gUntil;
let gTimeout;

exports.init = function(config, until) {
	gConfig = config;
	gUntil = (until || 172800) * 1000; // deux jours
	return exports;
};

exports.job = function() {
	if (gTimeout) {
		clearTimeout(gTimeout);
		cron();
	} else {
		sched();
	}
};

async function cron() {
	gTimeout = null;
	const pages = await Models.Page.query()
		.whereIn('domain', Object.keys(gConfig))
		.where('update', '>=', new Date(Date.now() - gUntil))
		.select('key', 'domain', 'update');
	for (let page of pages) {
		try {
			await notify(gConfig[page.domain], page.key);
			console.log("notified %s", page.key);
		} catch(err) {
			console.error(err);
		}
	}
	sched();
}

function nextTime() {
	const midnight = new Date();
	const now = midnight.getTime();
	midnight.setHours(24);
	midnight.setMinutes(0);
	midnight.setSeconds(0);
	return Math.max(midnight.getTime() - now, 0);
}

function sched() {
	if (gTimeout) clearTimeout(gTimeout);
	gTimeout = setTimeout(cron, nextTime());
}

