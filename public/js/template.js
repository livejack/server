import parseHTML from "./fragment-parser.js";

export function toScript(node) {
	const doc = node.ownerDocument;
	let tmpl = node;
	let helper;
	node = parseHTML(`<script type="text/html"></script>`, {doc});
	if (!helper) helper = doc.createElement('div');
	helper.textContent = tmpl.content.childNodes.map(child => {
		if (child.nodeType == Node.TEXT_NODE) return child.nodeValue;
		else return child.outerHTML;
	}).join('');
	node.textContent = helper.innerHTML;
	node.content = tmpl.content;
	tmpl.replaceWith(node);
	return node;
}

export function fromScript(node) {
	const doc = node.ownerDocument;
	let tmpl = node;
	let helper;
	helper = doc.createElement('div');
	helper.innerHTML = node.textContent;
	tmpl = doc.createElement('template');
	if (!tmpl.content) {
		tmpl.content = doc.createDocumentFragment();
		tmpl.content.appendChild(parseHTML(helper.textContent, {doc}));
	} else {
		tmpl.innerHTML = helper.textContent;
	}
	node.replaceWith(tmpl);
	node.textContent = helper.textContent = '';
	return tmpl;
}
