import Live from './live.js';

import { ready, visible } from './doc-events.js';
import registerEditElements from "./edit-elements.js";
import "../modules/flatpickr/dist/flatpickr.js"; // window.flatpickr
import "../modules/flatpickr/dist/l10n/fr.js"; // window.flatpickr
window.flatpickr.localize(window.flatpickr.l10ns.fr);
import "../modules/slim-select/dist/slimselect.js"; // window.SlimSelect


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

Object.assign(Live.filters, {
	store: function(asset, what) {
		if (!asset.type) asset.type = "none";
		if (!asset.origin) asset.origin = "internal";
		for (let key in asset) {
			if (typeof asset[key] != "object") what.node.setAttribute(`data-${key}`, asset[key]);
		}
		if (asset.tags) {
			what.node.dataset.tags = asset.tags
				.map((tag) => tag.toLowerCase().replace(/ /g, '\u00A0'))
				.join(' ');
		} else {
			what.node.removeAttribute('data-tags');
		}
	},
	className: function(type) {
		return editor.assetType[type];
	},
	src: function(asset, what) {
		if (asset.type != "picto" && asset.url) {
			return what.scope.live.vars.thumbnailer.replace('%s', asset.url);
		} else {
			return asset.url;
		}
	},
	caption: function(asset) {
		if (asset.type == "video") return asset.url || "";
		else return "";
	}
});


ready(async () => {
	await visible();
	registerEditElements(live);
});
