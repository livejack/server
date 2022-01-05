const { Models } = require('objection');
const got = require('got');

const config = {};
const minute = 60 * 1000;

module.exports = function(cfg) {
	Object.assign(config, cfg);
	const tenMn = 10;
	if (Number.isNaN(config.autoExpire) || config.autoExpire < tenMn) {
		console.warn("autoExpire interval too short, setting %s minutes", tenMn);
		config.autoExpire = tenMn;
	}
	setInterval(autoExpire, config.autoExpire * minute);
};

async function autoExpire() {
	const now = new Date();
	const pages = await Models.Page.query()
		.where('start', '<', now)
		.whereNull('stop')
		.select('domain', 'key', 'updated_at')
		.orderBy('updated_at', 'desc');
	for (const page of pages) {
		const date = Date.parse(page.updated_at);
		if (!date || (date + config.autoExpire * minute) > Date.now()) {
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

