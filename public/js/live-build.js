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
				return await res.json();
			})(name);
		}
		return chan;
	}

	async build() {
		const roots = this.findAll();
		let first = false;
		await Promise.all(roots.map(async ({ node, names }) => {
			const datas = {};
			const mtimes = {};
			await Promise.all(names.map(async (name) => {
				if (!this.rooms[name]) {
					const data = await this.fetch(name);
					datas[name] = data;
					mtimes[name] = this.rooms[name] = data.update;
				}
			}));
			const keys = Object.keys(mtimes);
			if (keys.length > 0) {
				this.merge(node, datas);
				first = true;
			}
			return node;
		}));
		if (first) document.head.insertAdjacentHTML(
			'beforeEnd',
			'	<meta name="live-update-[rooms+.key|repeat:*]" content="[rooms.val]">\n'
		);
		this.merge(document.head, { rooms: this.rooms });
	}
}

ready(async () => {
	const live = new LiveBuild();
	await live.build();
});
