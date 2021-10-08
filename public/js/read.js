import req from "./req.js";
import { ready, visible } from './doc-events.js';
import { fromScript, toScript } from "./template.js";
import { LiveJack } from "/node_modules/@livejack/client";

import { Matchdom } from "/node_modules/matchdom";
import * as DatePlugin from "./date-plugin.js";
import "./array-like.js";
import '/node_modules/@ungap/custom-elements';

import { LiveAsset, LiveIcon } from "./elements/live-asset.js";

import filters from "./filters.js";

const refs = {};

class LiveRead extends LiveJack {
	static metas = ['start', 'stop'];

	constructor() {
		super();
		this.hrefs = {};
		this.matchdom = new Matchdom({
			hooks: {
				beforeEach: (ctx, val) => {
					if (val && val.hrefs && Array.isArray(val.hrefs)) {
						// FIXME those should just go to live-article (the parent merging msg)
						this.set(val.hrefs);
					}
					return val;
				}
			}
		}).extend([DatePlugin, { filters }]);
		this.adopt(LiveAsset);

		this.channels = {};
		this.matchdom.extend({
			filters: {
				unhide(ctx, val) {
					const node = ctx.dest.node;
					setTimeout(() => {
						node.classList.remove('hidden');
					});
					return 'hidden';
				}
			}
		});
	}

	visitorBuild(node, iter, data, scope) {
		if (node.nodeName == "TEMPLATE" && node.content) {
			// jump to next node so we can insert before
			iter.nextNode();
			let sub = node.content.cloneNode(true);
			sub = scope.live.merge(sub, data, scope);
			node.parentNode.insertBefore(sub, node.nextSibling);
			toScript(node);
			return false;
		} else {
			return true;
		}
	}
	visitorSetup(node, iter, data, scope) {
		if (node.nodeName == "TEMPLATE") {
			// see live-build visitor
			const mode = node.dataset.mode;
			const parent = node.parentNode;
			if (mode == "replace") {
				while (node.nextSibling) parent.removeChild(node.nextSibling);
				parent.appendChild(node.content.cloneNode(true));
			} else if (mode == "insert") {
				parent.insertBefore(node.content.cloneNode(true), node.nextSibling);
			}
			return false;
		} else {
			return true;
		}
	}

	get(url) {
		return refs[url];
	}
	set(list) {
		if (!Array.isArray(list)) list = [list];
		for (const item of list) {
			if (refs[item.url]) Object.assign(refs[item.url], item);
			else refs[item.url] = item;
		}
	}

	roomPath(name) {
		return `${this.vars.base}/${name}`;
	}

	roomName(room) {
		return room.split('/').pop();
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
		const vars = {};
		const pre = "live";
		this.page = {};
		for (const meta of document.querySelectorAll(`meta[name^="${pre}-"]`)) {
			const key = meta.name.substring(pre.length + 1);
			const prop = key.startsWith('page-') ? key.substring(5) : null;
			if (prop) this.page[prop] = meta.content;
			else vars[key] = meta.content;
		}
		this.page.updated_at ??= vars['update-page'];
		this.vars = vars;
		this.rooms = {};
		const roots = document.querySelectorAll('[data-live]').map((node) => {
			const names = node.dataset.live.split(' ');
			for (const name of names) {
				const mtime = this.vars[`update-${name}`];
				if (mtime) this.rooms[this.roomPath(name)] = mtime;
			}
			return { node, names };
		});
		return roots;
	}

	merge(node, data = {}) {
		if (data.assets && data.assets.hrefs) {
			// we need these before the ones in each message
			this.set(data.assets.hrefs);
		}
		if (data.page) {
			for (const key of Object.keys(this.page)) {
				if (data.page[key] != null) this.page[key] = data.page[key];
				else data.page[key] = this.page[key];
			}
		} else {
			data.page = this.page;
		}
		return this.matchdom.merge(node, data, { live: this });
	}

	async fetch(name) {
		let chan = this.channels[name];
		if (!chan) {
			chan = this.channels[name] = (async () => {
				return req('./' + name);
			})(name);
		}
		return chan;
	}

	async build() {
		this.matchdom.visitor = this.visitorBuild;
		const roots = this.findAll();
		let first = false;
		const datas = {};
		await Promise.all(roots.map(async ({ node, names }) => {
			await Promise.all(names.map(async (name) => {
				const room = this.roomPath(name);
				if (!this.rooms[room]) {
					const data = await this.fetch(name);
					datas[name] = data;
					if (data.updated_at) this.rooms[room] = data.updated_at;
					else console.info("missing updated_at in", data);
					first = true;
				}
			}));
			if (first) {
				this.merge(node, datas);
			}
			return node;
		}));
		if (first) {
			document.head.insertAdjacentHTML(
				'beforeEnd',
				'	<meta name="[metas|repeat:|.name]" content="[.val]">\n'
			);
			const metas = Object.keys(this.rooms).map((room) => {
				return { name: `live-update-${this.roomName(room)}`, val: this.rooms[room] };
			});
			const page = datas.page;
			for (const name of LiveRead.metas) {
				if (page[name]) metas.push({name: `live-page-${name}`, val: page[name] });
			}
			this.merge(document.head, { metas });
		}
	}

	async setup() {
		this.matchdom.visitor = this.visitorSetup;

		await this.init(this.vars);

		const roots = this.findAll();
		for (const root of roots) this.setupRoot(root.node);

		for (const [room, mtime] of Object.entries(this.rooms)) {
			this.join(room, mtime, (e) => {
				if (!e.detail) return; // ignore
				const data = e.detail.data;
				if (!data) {
					console.warn("ignoring message without data", e.detail);
					return;
				}
				if (data.updated_at) this.rooms[room] = data.updated_at;
				else console.info("missing updated_at in", data);
				const name = this.roomName(room);
				for (const { node, names } of roots) {
					if (names.includes(name)) {
						this.merge(node, { [name]: data });
					}
				}
			});
		}
	}

	setupRoot(root) {
		for (const script of root.querySelectorAll('script[type="text/html"]')) {
			fromScript(script);
		}
		for (const node of root.querySelectorAll('.live-controls')) {
			node.addEventListener('change', this, false);
		}
	}

	handleEvent(e) {
		const node = e.target;
		const root = node.closest('[data-live]');
		if (node.name == "filter") {
			root.classList.toggle("essentiel", node.value == "essentiel");
		} else if (node.name == "reverse") {
			root.classList.toggle("reverse", node.checked);
		}
	}
}

const live = new LiveRead();
live.LiveAsset = LiveAsset;

export default live;

ready(async () => {
	if (!window.customElements.get('live-asset')) {
		window.customElements.define('live-asset', live.LiveAsset);
	}
	if (!window.customElements.get('live-icon')) {
		window.customElements.define('live-icon', LiveIcon);
	}
	await live.build();
	await visible();
	live.setup();
}).catch((err) => {
	console.error(err);
});
