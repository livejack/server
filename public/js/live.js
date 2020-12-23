import { Matchdom } from "../modules/matchdom";
import "./array-like.js";
import { DateTime, Interval } from '../modules/luxon';

const filters = {
	iconclass(val, what) {
		what.parent.closest('.live-message').classList.toggle('no-live-icons', !val);
		return val;
	},
	isoDate(val, what) {
		if (!val) return val;
		return DateTime.fromISO(val).toISO();
	},
	datetime(val, what) {
		const dt = val ? DateTime.fromISO(val) : DateTime.local();
		return dt.setLocale("fr").toFormat("DDD 'à' T");
	},
	reldatetime(val, what) {
		const dt = DateTime.fromISO(val).setLocale("fr");
		let inter = 1;
		const live = what.scope.live;
		if (live && live.rooms && live.rooms.page) {
			const ref = DateTime.fromISO(live.rooms.page);
			inter = Interval.fromDateTimes(dt, ref).length('days');
		}
		if (inter == 0) return dt.toFormat('T');
		else return dt.toFormat("D '\nà' T");
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
		const start = page.start && Date.parse(page.start);
		const stop = page.stop && Date.parse(page.stop);
		let when = '';
		if (!start || now < start) when = 'before';
		else if (!stop || now <= stop) when = 'during';
		else when = 'after';
		return when == param;
	},
	sort(id, what) {

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
	}

	init() {
		const vars = {};
		const pre = "live";
		document.querySelectorAll(`meta[name^="${pre}-"]`).forEach((meta) => {
			vars[meta.name.substring(pre.length + 1)] = meta.content;
		});
		this.vars = vars;
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
		return this.matchdom.merge(node, data, {live: this});
	}
}
