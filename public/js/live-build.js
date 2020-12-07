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
			chan = this.channels[name] = (async () => {
				const res = await fetch('./' + name + '.json');
				const mtime = Date.parse(res.headers.get('date'));
				const data = await res.json();
				return { mtime, data };
			})(name);
		}
		return chan;
	}

	async build() {
		const { rooms, roots } = this.findAll();
		await Promise.all(roots.map(async ({ node, names }) => {
			const datas = {};
			const mtimes = {};
			await Promise.all(names.map(async (name) => {
				if (!rooms[name]) {
					const {mtime, data} = await this.fetch(name);
					datas[name] = data;
					mtimes[name] = mtime;
				}
			}));
			const keys = Object.keys(mtimes);
			if (keys.length > 0) {
				node.setAttribute('data-live', keys
					.map((name) => `${name}:${mtimes[name]}`)
					.join(' '));
				this.merge(node, datas);
			}
			return node;
		}));
	}
}

ready(async () => {
	const live = new LiveBuild();
	await live.build();
});
