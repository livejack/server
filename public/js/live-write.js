import liveBuild from './live-build.js';
import liveSetup from './live-setup.js';

import { ready, visible } from './doc-events.js';
import registerEditElements from "./elements/index.js";

import xbytes from '../modules/xbytes';

export const editor = {
	assetType: {
		none: "icon-plus",
		error: "icon-ban-circle",
		image: "icon-picture",
		video: "icon-film",
		iframe: "icon-external-link",
		link: "icon-link",
		tweet: "icon-twitter",
		picto: ""
	}
};

let blanked = false;

const assetPlugin = {
	filters: {
		units: ['num?', (ctx, val) => {
			if (val == null) return null;
			return xbytes(val);
		}],
		store(ctx, asset) {
			if (!asset.type) asset.type = "none";
			if (!asset.origin) asset.origin = "internal";
			const node = ctx.dest.node;
			for (let key in asset) {
				if (typeof asset[key] != "object") node.setAttribute(`data-${key}`, asset[key]);
			}
			if (asset.tags) {
				node.dataset.tags = asset.tags
					.map((tag) => tag.toLowerCase().replace(/ /g, '\u00A0'))
					.join(' ');
			} else {
				node.removeAttribute('data-tags');
			}
		},
		classIcon(ctx, type) {
			return editor.assetType[type];
		},
		subtype: ['str?', (ctx, mime) => {
			return mime.split(';')[0].split('/').pop();
		}],
		blank: ['array?', 'str', '?*', (ctx, list, place, ...params) => {
			if (!list || blanked) return list;
			blanked = true;
			const obj = {};
			params.forEach((param) => {
				const [key, val] = param.split('=').map((str) => decodeURIComponent(str));
				obj[key] = val === "" ? null : val;
			});
			list[place](obj);
			return list;
		}],
		tags: ['array', (ctx, list) => {
			const tags = [];
			list.forEach((item, i) => {
				(item.tags || []).forEach(tag => {
					if (tags.indexOf(tag) < 0) tags.push(tag);
				});
			});
			tags.sort((a, b) => a.localeCompare(b));
			return tags;
		}],
		pretty(ctx, str) {
			if (str == null) return str;
			return str.toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-');
		}
	}
};

liveBuild.matchdom.extend(assetPlugin);
liveSetup.matchdom.extend(assetPlugin);


ready(async () => {
	await visible();
	registerEditElements(liveSetup);
});
