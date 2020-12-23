import Live from './live.js';
import { ready, visible } from './doc-events.js';
import { fromScript } from "./template.js";
import parseHTML from './fragment-parser.js';
import { LiveJack } from "../modules/@livejack/client";

class LiveSetup extends Live {
	constructor() {
		super();
		this.observer = this.createObserver();
	}

	nodeFilter(node, iter, data, scope) {
		if (node.templates) {
			node.templates.forEach(({ mode, content, index }) => {
				if (mode == "replace") {
					node.replaceChild(content.cloneNode(true), node.children[index]);
				} else {
					node.insertBefore(content.cloneNode(true), node.children[index]);
				}
			});
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
			const tmpl = fromScript(script);
			const parent = tmpl.parentNode;
			const index = parent.children.indexOf(tmpl);
			if (!parent.templates) parent.templates = [];
			parent.templates.push({ mode: tmpl.dataset.mode, content: tmpl.content, index });
			parent.removeChild(tmpl);
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
	position(id, node) {
		const prev = document.getElementById(id);
		if (prev) prev.parentNode.replaceChild(node, prev);
	}
}

LiveSetup.filters.position = (val, what) => {
	setTimeout(() => {
		live.position(val, what.parent);
	});
	return val;
};
LiveSetup.filters.trackUi = (val, what) => {
	live.trackUi(what.parent);
	setTimeout(() => {
		what.parent.classList.remove('hidden');
	});
	return `${val || ''} hidden`;
};
const live = new LiveSetup();

export default live;

ready(async () => {
	await visible();
	live.init();
	await live.setup();
}).catch((err) => {
	console.error(err); // eslint-disable-line
});
