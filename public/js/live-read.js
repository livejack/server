import Live from './live.js';
import req from "./req.js";
import { ready, visible } from './doc-events.js';
import { fromScript, toScript } from "./template.js";
import { LiveJack } from "/node_modules/@livejack/client";

class LiveRead extends Live {
	#lastError
	static #persistProps = ['title', 'backtrack', 'start', 'stop'];

	constructor() {
		super();
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
			if (data.page) {
				// persist minimal page data from build to setup
				for (const str of LiveRead.#persistProps) {
					if (data.page[str] != null) node.dataset[str] = data.page[str];
					else node.removeAttribute('data-' + str);
				}
			}
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
			if (!data.page) data.page = {};
			for (const str of LiveRead.#persistProps) {
				if (data.page[str] === undefined && node.dataset[str] != null) {
					data.page[str] = node.dataset[str];
				}
			}
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
		await Promise.all(roots.map(async ({ node, names }) => {
			const datas = {};
			await Promise.all(names.map(async (name) => {
				if (!this.rooms[name]) {
					const data = await this.fetch(name);
					datas[name] = data;
					if (data.updated_at) this.rooms[name] = data.updated_at;
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
				'	<meta name="live-update-[rooms|as:entries|repeat:*|.key]" content="[.value]">\n'
			);
			this.merge(document.head, { rooms: this.rooms });
		}
	}

	#redispatch(type) {
		this.dispatchEvent(new CustomEvent("io", {
			view: window,
			bubbles: true,
			cancelable: true,
			detail: type
		}));
	}

	async setup() {
		this.matchdom.visitor = this.visitorSetup;
		const jack = new LiveJack(this.vars);
		await jack.init();
		jack.io.on('disconnect', (e) => {
			this.#lastError = e;
			this.#redispatch('disconnect');
		});
		jack.io.on('connect', (e) => {
			if (this.#lastError) {
				this.#redispatch('reconnect');
				this.#lastError = null;
			}
		});

		const roots = this.findAll();
		for (const root of roots) this.setupRoot(root.node);
		for (const [room, mtime] of Object.entries(this.rooms)) {
			jack.join(this.vars.base + '/' + room, mtime, (e) => {
				if (!e.detail) return; // ignore
				const data = e.detail.data;
				if (!data) {
					// eslint-disable-next-line no-console
					console.warn("ignoring message without data", e.detail);
					return;
				}
				if (data.updated_at) this.rooms[room] = data.updated_at;
				else console.info("missing updated_at in", data);
				for (const { node, names } of roots) {
					if (names.includes(room)) {
						this.merge(node, { [room]: data });
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

export default live;

ready(async () => {
	live.init();
	await live.build();
	await visible();
	await live.setup();
}).catch((err) => {
	console.error(err); // eslint-disable-line
});
