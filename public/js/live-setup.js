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

	nodeFilter(node, iter) {
		if (node.templates) {
			node.templates.forEach(({ content, index }) => {
				node.insertBefore(content.cloneNode(true), node.children[index]);
			});
			return false;
		} else {
			return true;
		}
	}
	async setup() {
		const jack = new LiveJack(this.vars);
		await jack.init();
		const { rooms, roots } = this.findAll();
		roots.forEach((root) => this.setupRoot(root.node));
		Object.keys(rooms).forEach((room) => {
			jack.join(this.vars.base + '/' + room, rooms[room], (e) => {
				if (!e.detail) return; // ignore
				roots.forEach(({ node, names }) => {
					if (names.includes(room)) {
						this.merge(node, { [room]: e.detail });
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
			parent.templates.push({ content: tmpl.content, index });
			parent.removeChild(tmpl);
		});

		root.querySelectorAll('article').forEach((node) => this.trackUi(node));
		root.querySelectorAll('.live-controls').forEach((node) => {
			node.addEventListener('change', this, false);
		});
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
	}
}

// const live = {
// 	subscribe: (channel, stamp) => {
// 		if (channel == "messages") setTimeout(function() {
// 			listener({
// 				messages: [{
// 					date: "2016-01-14T05:59:44.021Z",
// 					id: 711225,
// 					mark: null,
// 					style: null,
// 					text: "Test update",
// 					title: "Où ont eu lieu les attaques ?" + gGa++,
// 					update: "2016-01-14T10:03:54.208Z"
// 				}]
// 			});
// 		}, 1000);
// 	}
// };
ready(async () => {
	await visible();
	const live = new LiveSetup();
	await live.setup();
}).catch((err) => {
	console.error(err); // eslint-disable-line
});
