import { Matchdom } from "../modules/matchdom";
import "./array-like.js";
import moment from '../modules/moment';
import momentFr from '../modules/moment/locale/fr';
moment.locale('fr', momentFr._config);

const filters = {
	iconclass(val, what) {
		what.parent.closest('.live-message').classList.toggle('no-live-icons', !val);
		return val;
	},
	isoDate(val, what) {
		if (!val) return val;
		return new Date(val).toISOString();
	},
	timeAgo(val, what) {
		// TODO mettre à jour les dates relativement à la date du dernier message.
		return moment(val || new Date()).format("ll [à] LT");
	},
	sandbox(val, what) {
		if (val && val.nodeType == Node.ELEMENT_NODE) {
			val.querySelectorAll('iframe').forEach((node) => {
				node.setAttribute('sandbox', '');
			});
		}
	},
	procrastify(node, what) {
		if (!node || node.nodeType != Node.ELEMENT_NODE) return node;
		const objects = ['object', 'iframe', 'embed', 'opta', '.dugout-video'];
		const list = node.querySelectorAll([
			'img', 'be-op', '.twitter-tweet'
		].concat(objects).join(','));
		list.forEach((node) => {
			if (node.matches('be-op')) {
				node.classList.add('lazy');
				return;
			}
			if (node.matches('.twitter-tweet')) {
				node.classList.add('lazy');
				node.classList.remove('twitter-tweet');
				node.classList.add('tweet');
				return;
			}
			if (node.matches('.lazy') || node.parentNode.closest('object')) {
				return true;
			}
			const url = node.matches(objects.join(','))
				&& node.getAttribute('title') || node.getAttribute('src');
			const frag = node.ownerDocument.createElement('span');
			frag.classList.add('lazy');
			frag.dataset.html = node.outerHTML;
			if (url) frag.setAttribute('title', url);
			node.parentNode.replaceChild(frag, node);
		});
		return node;
	},
	when(page, what, param) {
		const now = Date.now();
		const start = page.start && (new Date(page.start)).getTime();
		const stop = page.stop && (new Date(page.stop)).getTime();
		let when = '';
		if (!start || now < start) when = 'before';
		else if (!stop || now <= stop) when = 'during';
		else when = 'after';
		return when == param ? 'enabled' : '';
	}
};

export default class Live {
	static get filters() {
		return filters;
	}

	constructor() {
		this.matchdom = new Matchdom({
			nodeFilter: this.nodeFilter,
			filters: this.constructor.filters
		});
		const vars = {};
		const pre = "live";
		document.querySelectorAll(`meta[name^="${pre}-"]`).forEach((meta) => {
			vars[meta.name.substring(pre.length + 1)] = meta.content;
		});
		this.vars = vars;
	}

	findAll() {
		const rooms = {};
		const roots = document.querySelectorAll('[data-live]').map((node) => {
			const names = node.dataset.live.split(' ').map((pair) => {
				let [name, mtime] = pair.split(':');
				mtime = parseInt(mtime) || 0;
				rooms[name] = Math.min(rooms[name] || Infinity, mtime);
				return name;
			});
			return { node, names };
		});
		return {rooms, roots};
	}

	merge(node, data) {
		return this.matchdom.merge(node, data);
	}
}
