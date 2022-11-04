module.exports = [{
	provider_name: "brightcove videos",
	endpoints: [{
		schemes: [
			/^https?:\/\/players\.brightcove\.net\/.*\/.*\/index\.html\?videoId=.*/
		],
		rewrite(obj) {
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
		schemes: [
			/^https?:\/\/video\.lefigaro\.fr\/.*/
		],
		builder(urlObj, obj) {
			obj.html = `<figaro-video videoUrl="${urlObj.href}"></figaro-video>`;
			obj.script = 'https://static.lefigaro.fr/widget-video/short-ttl/video/index.js';
			obj.width = 300;
			obj.height = 150;
		}
	}]
}, {
	provider_name: "idalgo-hosting",
	endpoints: [{
		schemes: [
			/^https?:\/\/lefigaro\.idalgo-hosting\.com\/.*/
		],
		builder(urlObj, obj) {
			obj.type = "iframe";
			obj.ext = "html";
			obj.mime = "text/html";
			obj.icon = "https://www.idalgo.fr/favicon.ico";
			obj.site = "Idalgo";
			obj.html = `<iframe src="${urlObj.href}"></iframe>`;
		}
	}]
}, {
	provider_name: "embed.dugout.com",
	endpoints: [{
		schemes: [
			/^https?:\/\/embed\.dugout\.com\/.*/
		],
		builder(urlObj, obj) {
			obj.icon = "https://dugout.com/assets/images/favi/favicon-32x32.png";
			obj.width = 640;
			obj.height = 360;
			obj.site = "Dugout CDN";
		},
		rewrite(obj) {
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
}, {
	provider_name: "fidji",
	endpoints: [{
		schemes: [
			/^http?:\/\/(re7|api)\.fidji\.lefigaro\.fr\/media\/.*/,
			/^http?:\/\/i\.f1g\.fr\/media\/.*/,
		],
		ua: "curl/7.79.1",
		builder(urlObj, obj) {
			obj.icon = "https://www.lefigaro.fr/favicon.ico";
			obj.site = "Figaro CDN";
		},
		redirect(obj) {
			if (obj.hostname.startsWith("re7.")) return;
			let changed = false;
			if (obj.protocol == "http:") {
				obj.protocol = "https:";
				changed = true;
			}
			// https://i.f1g.fr/media/cms/orig/2022/11/04/0a44ea05fcef5a7e4bf8f9f3bb2678eb94d492fad8a97122dfaa59a32aafc090.jpg
			// https://i.f1g.fr/media/cms/616x347_crop/2022/11/04/0a44ea05fcef5a7e4bf8f9f3bb2678eb94d492fad8a97122dfaa59a32aafc090.jpg
			const str = obj.pathname.replace(/\/\w+_crop\//, '/804x/');
			if (str != obj.pathname) {
				obj.pathname = str;
				changed = true;
			} else if (obj.pathname.includes("/orig/")) {
				obj.pathname = obj.pathname.replace('/orig/', '/804x/');
				changed = true;
			}
			return changed;
		}
	}]
}];
