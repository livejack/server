import * as live from './live.js';
import ready from './ready.js';
import createObserver from './observer.js';
import { fromScript } from "./template.js";
import matchdom from "../modules/matchdom";
import { LiveJack } from "../modules/@livejack/client";


const observer = createObserver(function(node) {
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
		const frag = live.parse(html);
		var withoutScript = frag.querySelectorAll('script').length == 0;
		if (withoutScript) frag.classList.add('lazy');
		node.parentNode.replaceChild(frag, node);
		if (withoutScript) setTimeout(function() {
			frag.classList.remove('lazy');
		}, 20);
	}
});

function uiNode(node) {
	node.querySelectorAll('.lazy').forEach((node) => {
		observer.observe(node);
	});
	const time = node.querySelector('time');
	if (time) {
		// time.textContent = live.moment(time.dataset.datetime).fromNow();
	}
}

function control(node, root) {
	if (node.name == "filter") {
		root.classList.toggle("essentiel", node.value == "essentiel");
	} else if (node.name == "reverse") {
		root.classList.toggle("reverse", node.checked);
	}
}

matchdom.check = function(node, iter) {
	if (node.templates) {
		node.templates.forEach(({ content, index }) => {
			node.insertBefore(content.cloneNode(true), node.children[index]);
		});
		return false;
	} else {
		return true;
	}
};

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

function dataHandler(root, data) {
	matchdom(root, data, live.filters);
}

ready.then(async () => {
	const params = {};
	const prefix = "live";
	document.querySelectorAll(`meta[name^="${prefix}-"]`).forEach((meta) => {
		params[meta.name.substring(prefix.length + 1)] = meta.content;
	});
	const live = new LiveJack(params);
	await live.init();
	document.querySelectorAll('[data-live]').forEach((root) => {
		root.querySelectorAll('script[type="text/html"]').forEach((script) => {
			const tmpl = fromScript(script);
			const parent = tmpl.parentNode;
			const index = parent.children.indexOf(tmpl);
			if (!parent.templates) parent.templates = [];
			parent.templates.push({ content: tmpl.content, index });
			parent.removeChild(tmpl);
		});
		root.dataset.live.split(' ').forEach((name) => {
			if (!channels[name]) channels[name] = live.subscribe(name);
			root.addEventListener(name, function(e) {
				if (e.detail) dataHandler(e.target, e.detail);
			}, false);
		});

		root.querySelectorAll('article').forEach((node) => uiNode(node));
		root.querySelectorAll('.live-controls').forEach((node) => {
			node.addEventListener('change', (e) => {
				control(e.target, root);
			}, false);
		});
	});
}).catch((err) => {
	console.error(err); // eslint-disable-line
});
