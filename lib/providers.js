module.exports = [{
	provider_name: "figaro cdn",
	endpoints: [{
		schemes: ["https?:\\/\\/i\\.f1g\\.fr\\/*"],
		builder(urlObj, obj) {
			obj.icon = "https://www.lefigaro.fr/favicon.ico";
		}
	}]
}, {
	provider_name: "video.lefigaro.fr",
	endpoints: [{
		schemes: ["https?:\\/\\/video\\.lefigaro\\.fr\\/*"],
		builder(urlObj, obj) {
			if (!obj.source) return;
			// https://players.brightcove.net/610043537001/Hkpn3htbg_default/index.html?videoId=6231192462001
			const source = new URL(obj.source);
			const match = /\/(?<account>\d+)\/(?<player>\w+)_default\/index\.html/.exec(source.pathname);
			if (!match) return;
			const { account, player } = match.groups;
			const videoId = source.searchParams.get('videoId');
			if (account && player && videoId) {
				obj.html = `<figaro-video accountId="${account}" playerId="${player}" videoId="${videoId}"></figaro-video><script defer src="https://static.lefigaro.fr/widget-video/short-ttl/index.js"></script>`;
				obj.width = 300;
				obj.height = 150;
			}
		}
	}]
}, {
	provider_name: "embed.dugout.com",
	endpoints: [{
		schemes: ["https?:\\/\\/embed\\.dugout\\.com\\/*"],
		builder(urlObj, obj) {
			obj.icon = "https://dugout.com/assets/images/favi/favicon-32x32.png";
			obj.html = `<iframe src="${urlObj.href}"></iframe>`;
			obj.width = 640;
			obj.height = 360;
		},
		redirect(obj) {
			try {
				const opts = JSON.parse(
					Buffer.from(new URLSearchParams(obj.search).get("p"), 'base64').toString('binary')
				);
				if (opts.key) {
					delete obj.pathname;
					delete obj.search;
					delete obj.query;
					obj.path = `/previews/${opts.key}`;
					obj.hostname = "cdn.jwplayer.com";
					return true;
				}
			} catch (ex) {
				console.error("dugout not recognized", obj);
			}
		}
	}]
}];
