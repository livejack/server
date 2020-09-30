import ready from './ready.js';
import * as live from './live.js';

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

Object.assign(live.filters, {
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
	src: function(asset) {
		if (asset.type != "picto" && asset.url) {
			return editor.thumbnailer.replace('%s', asset.url);
		} else {
			return asset.url;
		}
	},
	caption: function(asset) {
		if (asset.type == "video") return asset.url || "";
		else return "";
	}
});

ready.then(async () => {
	editor.thumbnailer = document.getElementById('thumbnailer').content;
	const data = await live.build();

});

