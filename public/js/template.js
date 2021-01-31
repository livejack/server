export function toScript(node) {
	const doc = node.ownerDocument;
	let tmpl = node;
	let helper;
	node = doc.createElement('script');
	node.setAttribute('type', 'text/html');
	if (!helper) helper = doc.createElement('div');
	helper.textContent = tmpl.content.childNodes.map(child => {
		if (child.nodeType == Node.TEXT_NODE) return child.nodeValue;
		else return child.outerHTML;
	}).join('');
	node.textContent = helper.innerHTML;
	node.content = tmpl.content;
	Object.assign(node.dataset, tmpl.dataset);
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
	tmpl.innerHTML = helper.textContent;
	Object.assign(tmpl.dataset, node.dataset);
	node.replaceWith(tmpl);
	node.textContent = helper.textContent = '';
	return tmpl;
}
