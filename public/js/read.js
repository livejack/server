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
				if (data.page[key] !== undefined) this.page[key] = data.page[key];
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
		const roots = this.findAll();
		let first = false;
		const datas = {};
		await Promise.all(roots.map(async (root) => {
			await Promise.all(root.names.map(async (name) => {
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
				this.merge(root.node, datas);
				if (root.node.nodeName == "TEMPLATE" && root.node.content) {
					root.node = toScript(root.node);
				}
			}
			return root;
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
		await this.init(this.vars);

		const roots = this.findAll();
		for (const root of roots) {
			if (root.node.nodeName == "SCRIPT" && root.node.type == "text/html") {
				root.node = fromScript(root.node);
			}
		}

		const controls = document.querySelector('#live-messages .live-controls');
		if (controls) controls.addEventListener('change', this, false);

		for (const [room, mtime] of Object.entries(this.rooms)) {
			this.join(room, mtime, (e) => {
				if (!e.detail) return; // ignore
				const data = e.detail.data;
				if (!data) {
					console.warn("ignoring message without data", e.detail);
					return;
				}
				this.rooms[room] ??= data.updated_at ?? e.detail.mtime;
				const name = this.roomName(room);
				for (const { node, names } of roots) {
					if (names.includes(name)) {
						this.merge(node, { [name]: data });
					}
				}
			});
		}
	}

	handleEvent(e) {
		const node = e.target;
		const root = node.closest('.live-messages');
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
