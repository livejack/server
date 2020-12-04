import Live from './live.js';
import {ready} from './doc-events.js';
import {toScript} from "./template.js";

class LiveBuild extends Live {
	constructor() {
		super();
		this.channels = {};
	}
	nodeFilter(node, iter) {
		if (node.nodeName == "TEMPLATE" && node.content) {
			node.after(node.content.cloneNode(true));
			toScript(node);
			iter.nextNode(); // jump above script and its content
			iter.nextNode();
			return false;
		} else {
			return true;
		}
	}

	async fetch(name) {
		let chan = this.channels[name];
		if (!chan) {
			chan = this.channels[name] = fetch('./' + name + '.json')
				.then(async (res) => {
					const data = await res.json();
					const mtime = Date.parse(res.headers.get('date'));
					return { data, mtime };
				});
		}
		return chan;
	}

	async build() {
		const roots = document.querySelectorAll('[data-live]');
		await Promise.all(roots.map(async (root) => {
			const data = {};
			const mtimes = {};
			const lives = [];
			root.dataset.live.split(' ').forEach((pair) => {
				let [name, mtime] = pair.split(':');
				if (mtime != null) {
					mtimes[name] = mtime;
					return;
				}
				lives.push(this.fetch(name).then((obj) => {
					mtimes[name] = obj.mtime;
					data[name] = obj.data;
				}));
			});
			if (lives.length) {
				await Promise.all(lives);
				root.setAttribute('data-live', Object.entries(mtimes)
					.map(([key, val]) => `${key}:${val}`)
					.join(' '));
				this.merge(root, data);
			}
		}));
	}
}

ready.then(async () => {
	const live = new LiveBuild();
	await live.build();
});
