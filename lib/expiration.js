const { Models } = require('objection');
const got = require('got');

const config = {};
const minute = 60 * 1000;

module.exports = function (cfg) {
	if (!cfg.autoExpire) return;
	Object.assign(config, cfg);
	if (Number.isNaN(config.autoExpire) || config.autoExpire < 10) {
		console.warn("autoExpire too short:", config.autoExpire, "minutes");
		return;
	}
	console.info("lives will expire automatically after", config.autoExpire, "minutes");
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
		const tokens = (config.domains[page.domain] || {}).tokens || [];
		if (!tokens.length) {
			console.error("autoExpire finds no tokens for domain", page.domain);
			continue;
		}
		const token = tokens[tokens.length - 1];
		const base = `${page.domain}/${page.key}`;
		console.info("Expired", base);
		const pageUrl = config.site.href + base + '/page?_token=' + encodeURIComponent(token);
		await got.put(pageUrl, {
			json: {
				action: 'stop'
			},
			retry: false
		}).catch((err) => {
			console.error("Expiration error", base, err);
		});
	}
}
