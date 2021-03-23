module.exports = [{
	provider_name: "figaro cdn",
	endpoints: [{
		schemes: ["https?:\\/\\/i\\.f1g\\.fr\\/*"],
		builder(urlObj, obj) {
			obj.icon = "https://www.lefigaro.fr/favicon.ico";
			obj.site = "Figaro CDN";
		}
	}]
}, {
	provider_name: "brightcove videos",
	endpoints: [{
		schemes: [
			"https?:\\/\\/players\\.brightcove\\.net\\/*\\/*\\/index\\.html\\?videoId=*"
		],
		redirect(obj) {
			// https://players.brightcove.net/610043537001/Hkpn3htbg_default/index.html?videoId=6231192462001
			// https://playback.brightcovecdn.com/playback/v1/accounts/610043537001/videos/6231192462001
			// to do things right, we need to grab policyKey:" field sitting in the index.html page, then do the request :()
			const videoId = new URLSearchParams(obj.search).get("videoId");
			if (videoId) {
				const accountId = obj.pathname.split('/')[1];
				const bcPolicyKeys = {
					"610043537001": "BCpkADawqM2xuJsXaB2RuHdqCOlX1qWL6BnaPiIWZxb_5VZr8AOCHRoMixAy7weiaTeQ6z6YuN7KbZfm8rp39vwCffRWvAXGVFXd-DRzL2mb8VhAehfXACjM2zE"
				};
				const pk = bcPolicyKeys[accountId];
				if (pk) {
					delete obj.pathname;
					delete obj.search;
					delete obj.query;
					obj.headers.Accept = "application/json;pk=" + pk;
					obj.path = `/playback/v1/accounts/${accountId}/videos/${videoId}`;
					obj.hostname = "playback.brightcovecdn.com";
					obj.protocol = "https:";
					return true;
				} else {
					console.group("brightcove");
					console.warn("Unknown accountId", accountId);
					console.warn("The policyKey can be obtained directly from", obj.href);
					console.groupEnd("brightcove");
				}
			}
			return false;
		},
		builder(urlObj, obj, tags) {
			obj.type = "video";
			obj.ext = "html";
			obj.mime = "text/html";
			obj.html = `<iframe src="${obj.url}"></iframe>`;
			obj.thumbnail = tags.thumbnail;
			obj.title = tags.name;
			obj.description = tags.long_description;
			obj.date = tags.published_at;
			obj.keywords = tags.tags;
			delete obj.size;
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
				obj.html = `<figaro-video accountId="${account}" playerId="${player}" videoId="${videoId}"></figaro-video>`;
				obj.script = 'https://static.lefigaro.fr/widget-video/short-ttl/index.js';
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
			obj.width = 640;
			obj.height = 360;
			obj.site = "Dugout CDN";
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
