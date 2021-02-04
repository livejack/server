import Live from './live.js';
import { ready, visible } from './doc-events.js';
import { fromScript } from "./template.js";
import { LiveJack } from "../modules/@livejack/client";
import { HTML as parseHTML } from "../modules/matchdom";

class LiveSetup extends Live {
	constructor() {
		super();
		this.observer = this.createObserver();
	}

	visitor(node, iter, data, scope) {
		if (node.nodeName == "TEMPLATE") {
			let mode = node.dataset.mode;
			let parent = node.parentNode;
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
		root.querySelectorAll('article').forEach((node) => this.trackUi(node));
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

	createObserver() {
		return new IntersectionObserver((entries, observer) => {
			entries.forEach((entry) => {
				var target = entry.target;
				var ratio = entry.intersectionRatio || 0;
				if (ratio <= 0) return;
				observer.unobserve(target);
				this.reveal(target);
			});
		}, {
			threshold: [0.0001, 0.2],
			rootMargin: "30px"
		});
	}
	reveal(node) {
		if (node.matches('.tweet')) {
			node.classList.remove('lazy');
			node.classList.remove('tweet');
			node.classList.add('twitter-tweet');
			if (window.twttr) window.twttr.widgets.load(node);
			return;
		}

		const src = node.dataset.src;
		if (src) {
			node.setAttribute('src', src);
			node.removeAttribute('data-src');
			node.removeAttribute('title');
			node.classList.remove('lazy');
			return;
		}
		const html = node.dataset.html;
		if (html) {
			const frag = parseHTML(html);
			var withoutScript = frag.querySelectorAll('script').length == 0;
			if (withoutScript) frag.classList.add('lazy');
			node.parentNode.replaceChild(frag, node);
			if (withoutScript) setTimeout(function () {
				frag.classList.remove('lazy');
			}, 20);
		}
	}
	trackUi(node) {
		node.querySelectorAll('.lazy').forEach((node) => {
			this.observer.observe(node);
		});
		const time = node.querySelector('time');
		if (time) {
			// time.textContent = live.moment(time.dataset.datetime).fromNow();
		}
		return 'hidden';
	}
}

const live = new LiveSetup();
live.matchdom.extend({
	filters: {
		trackUi(ctx, val) {
			const node = ctx.dest.node;
			live.trackUi(node);
			setTimeout(() => {
				node.classList.remove('hidden');
			});
			return 'hidden';
		}
	}
});

export default live;

ready(async () => {
	await visible();
	live.init();
	await live.setup();
}).catch((err) => {
	console.error(err); // eslint-disable-line
});
