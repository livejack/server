import Live from './live.js';
import { ready, visible } from './doc-events.js';
import { fromScript } from "./template.js";
import { LiveJack } from "../modules/@livejack/client";

class LiveSetup extends Live {
	constructor() {
		super();
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

	visitor(node, iter, data, scope) {
		if (node.nodeName == "TEMPLATE") {
			// see live-build visitor
			let mode = node.dataset.mode;
			let parent = node.parentNode;
			if (!data.page) data.page = {};
			['title', 'backtrack', 'start', 'stop'].forEach(str => {
				if (data.page[str] === undefined && node.dataset[str] != null) {
					data.page[str] = node.dataset[str];
				}
			});
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
	async setup() {
		const jack = new LiveJack(this.vars);
		await jack.init();
		const roots = this.findAll();
		roots.forEach((root) => this.setupRoot(root.node));
		Object.keys(this.rooms).forEach((room) => {
			jack.join(this.vars.base + '/' + room, this.rooms[room], (e) => {
				if (!e.detail) return; // ignore
				const data = e.detail.data;
				if (!data) {
					// eslint-disable-next-line no-console
					console.warn("ignoring message without data", e.detail);
					return;
				}
				this.rooms[room] = data.update;
				roots.forEach(({ node, names }) => {
					if (names.includes(room)) {
						this.merge(node, { [room]: data });
					}
				});
			});
		});
	}

	setupRoot(root) {
		root.querySelectorAll('script[type="text/html"]').forEach((script) => {
			fromScript(script);
		});
		root.querySelectorAll('.live-controls').forEach((node) => {
			node.addEventListener('change', this, false);
		});
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

const live = new LiveSetup();

export default live;

ready(async () => {
	live.init();
	await visible();
	await live.setup();
}).catch((err) => {
	console.error(err); // eslint-disable-line
});
