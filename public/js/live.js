import matchdom from "../modules/matchdom";
import "./array-like.js";
import parseHTML from './fragment-parser.js';
import {toScript} from "./template.js";
import moment from '../modules/moment';
import momentFr from '../modules/moment/locale/fr';
moment.locale('fr', momentFr._config);

export {moment};

matchdom.check = function(node, iter) {
	if (node.nodeName == "TEMPLATE" && node.content) {
		node.after(node.content.cloneNode(true));
		toScript(node);
		iter.nextNode(); // jump above script and its content
		iter.nextNode();
		return false;
	} else {
		return true;
	}
};

function pageWhen(page) {
	var now = Date.now();
	var start = page.start && (new Date(page.start)).getTime();
	if (!start || now < start) return 'before';
	// start is defined and now >= start
	var stop = page.stop && (new Date(page.stop)).getTime();
	if (!stop || now <= stop) return 'during';
	// stop is defined and now > stop
	return 'after';
}

export function patch() {

}

export async function build() {
	const nodes = document.querySelectorAll('[data-live]');
	const channels = {};
	const data = {};
	const roots = [];
	nodes.forEach((root) => {
		const names = root.dataset.live.split(' ');
		const list = names.map((name) => {
			let chan = channels[name];
			if (!chan) {
				chan = channels[name] = fetch('./' + name + '.json')
					.then((res) => res.json());
			}
			return chan;
		});
		roots.push(Promise.all(list).then((values) => {
			const rdata = {};
			values.forEach((val, i) => {
				rdata[names[i]] = val;
			});
			matchdom(root, rdata, filters);
			Object.assign(data, rdata);
		}));
	});
	return Promise.all(roots).then(() => data);
}

export const filters = {
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
		procrastify(node);
	},
	when(val, what, param) {
		return pageWhen(val) == param ? 'enabled' : '';
	}
};

export function parse(html) {
	return parseHTML(html);
}

export function procrastify(node) {
	node.querySelectorAll('object,img,iframe,embed,opta,.dugout-video,be-op,.twitter-tweet').forEach((node) => {
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
		if (node.matches('.lazy') || node.parentNode.closest('object')) return true;
		const url = node.matches('object,iframe,embed,opta,.dugout-video') && node.getAttribute('title') || node.getAttribute('src');
		const frag = node.ownerDocument.createElement('span');
		frag.classList.add('lazy');
		frag.dataset.html = node.outerHTML;
		if (url) frag.setAttribute('title', url);
		node.parentNode.replaceChild(frag, node);
	});
	return node;
}
