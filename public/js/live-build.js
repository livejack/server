import Live from './live.js';
import {ready} from './doc-events.js';
import { toScript } from "./template.js";
import req from "./req.js";

class LiveBuild extends Live {
	constructor() {
		super();
		this.matchdom.extend({
			filters: {
				// keep it for now
				trackUi: (c, v) => v,
				unhide: (c, v) => v
			},
		});
		this.channels = {};
	}
	visitor(node, iter, data, scope) {
		if (node.nodeName == "TEMPLATE" && node.content) {
			if (data.page) {
				// persist minimal page data from build to setup
				['title', 'backtrack', 'start', 'stop'].forEach(str => {
					if (data.page[str] != null) node.dataset[str] = data.page[str];
					else node.removeAttribute('data-' + str);
				});
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

	async fetch(name) {
		let chan = this.channels[name];
		if (!chan) {
			chan = this.channels[name] = (async () => {
				return req('./' + name + '.json');
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
					mtimes[name] = this.rooms[name] = data.updated_at;
				}
			}));
			const keys = Object.keys(mtimes);
			if (keys.length > 0) {
				this.merge(node, datas);
				first = true;
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
}
const live = new LiveBuild();
export default live;

ready(async () => {
	live.init();
	await live.build();
});
