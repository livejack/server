const {Models} = require('objection');
const got = require('got');

let config;
module.exports = function(cfg) {
	config = cfg;
	const tenMn = 10 * 60;
	let interval = parseInt(config.autoExpire);
	if (Number.isNaN(interval) || interval < tenMn) {
		console.warn("autoExpire interval too short, setting %s seconds", tenMn);
		interval = tenMn;
	}

	config.autoExpire = interval * 1000;
	setInterval(autoExpire, tenMn * 1000);
};

async function autoExpire() {
	const now = new Date();
	const pages = await Models.Page.query()
		.where('start', '<', now)
		.whereNull('stop')
		.select('domain', 'key', 'date', 'update', 'start')
		.orderBy('update', 'desc');
	for (let page of pages) {
		const date = (page.update || page.start);
		if (!date || date.getTime() + config.autoExpire > Date.now()) {
			continue;
		}
		const token = config.credentials[page.domain];
		if (!token) {
			console.error("Ignoring unknown domain", page.domain);
			continue;
		}
		console.info("Expired live", page.domain, page.key);
		const pageUrl = config.site.href + page.domain + '/' + page.key + '/page?_token=' + encodeURIComponent(token);
		await got.put(pageUrl, {
			json: true,
			body: {
				stop: now.toISOString()
			}
		}).catch((err) => {
			console.error("Could not expire page", page.domain, page.key, err);
		});
	}
}

