import { Matchdom } from "../modules/matchdom";
import * as DatePlugin from "./date-plugin.js";
import "./array-like.js";


const filters = {
	place(ctx, item) {
		const cursor = ctx.src.node;
		const node = ctx.dest.node;
		const old = cursor.parentNode.querySelector(`[id="${item.id}"]`);

		if (old) {
			if (item.date) {
				old.parentNode.replaceChild(node, old);
			} else {
				old.classList.add('hidden');
				setTimeout(() => {
					old.parentNode.removeChild(old);
				}, 700);
			}
		} else if (item.date) {
			// insert before first node with [id]
			cursor.parentNode.insertBefore(node, cursor.parentNode.querySelector('[id]'));
		}
		return item;
	},

	importAssets(ctx, frag) {
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
		return [DatePlugin, { filters }];
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
