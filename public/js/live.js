import { Matchdom } from "../modules/matchdom";
import "./array-like.js";
import { DateTime, Interval } from '../modules/luxon';

const types = {
	date(ctx, val) {
		if (val == null) return val;
		if (val === "") val = DateTime.local();
		else val = DateTime.fromISO(val);
		if (val.invalid) return null;
		else return val.setLocale("fr");
	}
};
const filters = {
	place(ctx, item, pos) {
		const node = ctx.dest.node;
		const parent = node.parentNode;
		const old = ctx.src.node.parentNode.querySelector(`[id="${item.id}"]`);
		if (!item.date) {
			ctx.dest.node = null;
			ctx.dest.attr = null;
		}

		if (old) {
			if (item.date) {
				old.parentNode.replaceChild(node, old);
			} else {
				old.parentNode.removeChild(old);
			}
		} else {
			// insertion
			if (pos == "before") {
				parent.insertBefore(node, parent.querySelector('[id]'));
			} else if (pos == "after") {
				parent.insertBefore(node, parent.querySelector('[id] + :not([id])'));
			}
		}
		return item;
	},
	date: ['date?', 'string', (ctx, date, fmt) => {
		if (fmt == "iso") {
			return date.toISO();
		} else if (fmt == "cal") {
			return date.toFormat("DDD 'à' T");
		} else if (fmt == "rel") {
			let inter = 1;
			const live = ctx.scope.live;
			if (live && live.rooms && live.rooms.page) {
				const ref = DateTime.fromISO(live.rooms.page);
				inter = Interval.fromDateTimes(date, ref).length('days');
			}
			if (inter == 0) return date.toFormat('T');
			else return date.toFormat("D '\nà' T");
		}
	}],
	procrastify(ctx, frag) {
		if (!frag || !frag.querySelector) return frag;
		const objects = ['object', 'iframe', 'embed', 'opta', '.dugout-video'];
		const list = frag.querySelectorAll([
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
		return frag;
	},
	when(ctx, page, param) {
		const now = Date.now();
		const start = page.start && Date.parse(page.start);
		const stop = page.stop && Date.parse(page.stop);
		let when = '';
		if (!start || now < start) when = 'before';
		else if (!stop || now <= stop) when = 'during';
		else when = 'after';
		return when == param;
	}
};

export default class Live {
	static get plugins() {
		return { filters, types };
	}

	constructor() {
		this.matchdom = new Matchdom({
			visitor: this.visitor
		}).extend(this.constructor.plugins);
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
