import registerWrite from "./elements/write.js";
import liveRead from './live-read.js';
registerWrite(liveRead);

import { ready, visible } from './doc-events.js';

import xbytes from '/node_modules/xbytes';

let blanked = false;

const assetPlugin = {
	filters: {
		units: ['num?', (ctx, val) => {
			if (val == null) return null;
			return xbytes(val);
		}],
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
		filters: ['array', 'path', (ctx, list, path) => {
			const uniques = [];
			list.forEach((item, i) => {
				let data = ctx.expr.get(item, path) || [];
				if (Array.isArray(data) == false) data = [data];
				if (data.length > 0 && uniques.indexOf(data[0]) < 0) uniques.push(data[0]);
			});
			uniques.sort((a, b) => a.localeCompare(b));
			return uniques;
		}]
	}
};

liveRead.matchdom.extend(assetPlugin);

ready(async () => {
	await visible();
	document.querySelector('#assets > [is="edit-filter"]').setMode('unused');
	document.querySelector('#live').hidden = false;
	document.querySelector('#control').hidden = false;
});
