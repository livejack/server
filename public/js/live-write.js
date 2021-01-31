import live from './live-setup.js';

import { ready, visible } from './doc-events.js';
import registerEditElements from "./elements/index.js";

import flatpickr from "../modules/flatpickr";
import { French } from "../modules/flatpickr/dist/esm/l10n/fr.js";
flatpickr.localize(French);

import xbytes from '../modules/xbytes';

import AssetManager from "./editor/asset-manager.js";

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

Object.assign(live.constructor.plugins.filters, {
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
	}
});


ready(async () => {
	await visible();
	live.assetManager = new AssetManager();
	registerEditElements(live);
});
