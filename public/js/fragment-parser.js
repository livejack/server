export default function parseHTML(html, {doc, ns, frag}={}) {
	FragmentParser.init();
	return FragmentParser.parse(html, {doc, ns, frag});
}

function resultStr(html, doc, frag) {
	const el = doc.createTextNode(html);
	let ret = el;
	if (frag) {
		ret = doc.createDocumentFragment();
		ret.appendChild(el);
	}
	return ret;
}

function result(el, doc, frag) {
	let ret;
	if (!frag && el.firstChild == el.lastChild) {
		// one element
		ret = el.removeChild(el.firstChild);
	} else {
		// several elements
		ret = doc.createDocumentFragment();
		while (el.firstChild) {
			ret.appendChild(el.firstChild);
		}
	}
	return ret;
}

let initialized = false;
let domParser;

const map = {
	legend: [1, '<fieldset>', '</fieldset>'],
	tr: [2, '<table><tbody>', '</tbody></table>'],
	th: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
	col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
	optgroup: [1, '<select multiple="multiple">', '</select>'],
	thead: [1, '<table>', '</table>']
};

const nsUris = {
	xml: 'http://www.w3.org/XML/1998/namespace',
	svg: 'http://www.w3.org/2000/svg',
	xlink: 'http://www.w3.org/1999/xlink',
	html: 'http://www.w3.org/1999/xhtml',
	mathml: 'http://www.w3.org/1998/Math/MathML'
};

export class FragmentParser {
	static init() {
		if (initialized) return;
		initialized = true;
		domParser = new DOMParser();
		let innerHTMLBug = false;
		let bugTestDiv;
		if (typeof document !== 'undefined') {
			bugTestDiv = document.createElement('div');
			// Setup
			bugTestDiv.innerHTML = '	<link/><table></table><a href="/a">a</a><input type="checkbox"/>';
			// Make sure that link elements get serialized correctly by innerHTML
			// This requires a wrapper element in IE
			innerHTMLBug = !bugTestDiv.getElementsByTagName('link').length;
			bugTestDiv = undefined;
		}
		// for script/link/style tags to work in IE6-8, you have to wrap
		// in a div with a non-whitespace character in front, ha!
		Object.assign(map, {
			_default: innerHTMLBug ? [1, 'X<div>', '</div>'] : [0, '', ''],
			td: map.th,
			option: map.optgroup,
			tbody: map.thead,
			colgroup: map.thead,
			caption: map.thead,
			tfoot: map.thead
		});
	}

	/**
	 * Parse `html` and return a DOM Node instance, which could be a TextNode,
	 * HTML DOM Node of some kind (<div> for example), or a DocumentFragment
	 * instance, depending on the contents of the `html` string.
	 *
	 * @param {String} html - HTML string to "domify"
	 * @param {Document} doc - The `document` instance to create the Node for
	 * @param {String} namespace
	 * @return {DOMNode} the TextNode, DOM Node, or DocumentFragment instance
	 * @api private
	 */
	static parse(html, {doc, ns, frag}) {
		if ('string' != typeof html) throw new TypeError('String expected');

		// default to the global `document` object
		if (!doc) doc = document;

		// tag name
		const m = /<([\w:]+)/.exec(html);
		if (!m) {
			return resultStr(html, doc, frag);
		}

		html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

		const tag = m[1];
		let el;
		if (tag == "html") {
			el = domParser.parseFromString(html, 'text/html');
			return doc.adoptNode(el.documentElement);
		} else if (tag == 'body') {
			el = doc.createElement('html');
			el.innerHTML = html;
			return el.removeChild(el.lastChild);
		}

		// wrap map
		const wrap = map[tag] || map._default;
		let [depth, prefix, suffix] = wrap;

		if (ns) {
			el = doc.createElementNS(nsUris[ns] || ns, 'div');
		} else {
			el = doc.createElement('div');
		}
		el.innerHTML = prefix + html + suffix;
		while (depth--) el = el.lastChild;

		return result(el, doc, frag);
	}
}

