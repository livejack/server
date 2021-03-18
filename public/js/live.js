import { Matchdom } from "../modules/matchdom";
import * as DatePlugin from "./date-plugin.js";
import "./array-like.js";
import '../modules/@ungap/custom-elements';

import { LiveAsset, LiveIcon } from "./elements/live-asset.js";


const filters = {
	place(ctx, item) {
		const cursor = ctx.src.node;
		const node = ctx.dest.node;
		const list = cursor.parentNode;
		const old = list.querySelector(`[data-id="${item.id}"]`);
		const date = item.date || item.created_at;
		const refTime = Date.parse(date) || 0;
		const refPin = item.style == "pinned";
		const next = (() => {
			if (!refTime) return null;
			let child = cursor;
			while ((child = child.nextElementSibling)) {
				let time = child.querySelector('time');
				if (!time) return (old || cursor).nextElementSibling;
				time = Date.parse(time.getAttribute('datetime'));
				const pin = child.classList.contains('pinned');
				if (refPin && (!pin || refTime > time) || !pin && refTime > time) {
					return child;
				}
			}
			return (old || cursor).nextElementSibling;
		})();
		if (!item.id) {
			// special case
			const list = document.querySelector('#live-messages > .live-list');
			list.parentNode.insertBefore(node, list);
		} else if (old) {
			if (old.nextElementSibling == next && refTime) {
				old.parentNode.replaceChild(node, old);
			} else {
				old.classList.add('hidden');
				setTimeout(() => {
					if (old.parentNode == list) list.removeChild(old);
				}, 500);
				if (date) list.insertBefore(node, next);
			}
		} else if (date) {
			list.insertBefore(node, next);
		}
		return item;
	},
	when(ctx, page, param) {
		const now = Date.now();
		const start = page.start && Date.parse(page.start);
		const stop = page.stop && Date.parse(page.stop);
		let when = '';
		if (!start || now < start) when = 'before';
		else if (!stop || now <= stop) when = 'during';
		else when = 'after';
		return when == param;
	}
};

const refs = {};

export default class Live {
	constructor() {
		this.hrefs = {};
		this.LiveAsset = LiveAsset;
		this.matchdom = new Matchdom({
			visitor: this.visitor,
			hooks: {
				beforeEach: (val) => {
					if (val && val.hrefs && Array.isArray(val.hrefs)) {
						// FIXME those should just go to live-article (the parent merging msg)
						this.set(val.hrefs);
					}
				}
			}
		}).extend([DatePlugin, { filters }]);
		this.adopt(this.LiveAsset);
	}

	init() {
		const vars = {};
		const pre = "live";
		document.querySelectorAll(`meta[name^="${pre}-"]`).forEach((meta) => {
			vars[meta.name.substring(pre.length + 1)] = meta.content;
		});
		this.vars = vars;
		if (!window.customElements.get('live-asset')) {
			window.customElements.define('live-asset', this.LiveAsset);
		}
		if (!window.customElements.get('live-icon')) {
			window.customElements.define('live-icon', LiveIcon);
		}
	}

	get(url) {
		return refs[url];
	}
	set(list) {
		if (!Array.isArray(list)) list = [list];
		list.forEach(item => {
			if (refs[item.url]) Object.assign(refs[item.url], item);
			else refs[item.url] = item;
		});
	}

	adopt(Class) {
		if (Object.getOwnPropertyDescriptor(Class.prototype, "live")) return;
		Object.defineProperty(Class.prototype, "live", {
			value: this,
			writable: false,
			enumerable: false,
			configurable: false
		});
	}

	findAll() {
		this.rooms = {};
		const roots = document.querySelectorAll('[data-live]').map((node) => {
			const names = node.dataset.live.split(' ');
			names.forEach((name) => {
				this.rooms[name] = this.vars[`update-${name}`];
			});
			return { node, names };
		});
		return roots;
	}

	merge(node, data) {
		if (!data) console.trace("no data", node, data);
		if (data && data.assets && data.assets.hrefs) {
			// we need these before the ones in each message
			this.set(data.assets.hrefs);
		}
		return this.matchdom.merge(node, data, {live: this});
	}
}
