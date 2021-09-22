export function toScript(tpl) {
	const doc = tpl.ownerDocument;
	const node = doc.createElement('script');
	node.setAttribute('type', 'text/html');
	const helper = doc.createElement('div');
	helper.textContent = tpl.content.childNodes.map(child => {
		if (child.nodeType == Node.TEXT_NODE) return child.nodeValue;
		else return child.outerHTML;
	}).join('');
	node.textContent = helper.innerHTML;
	node.content = tpl.content; // keep it around
	Object.assign(node.dataset, tpl.dataset);
	tpl.parentNode.replaceChild(node, tpl);
	return node;
}

export function fromScript(node) {
	const doc = node.ownerDocument;
	const helper = doc.createElement('div');
	helper.innerHTML = node.textContent;
	const tpl = doc.createElement('template');
	tpl.innerHTML = helper.textContent;
	Object.assign(tpl.dataset, node.dataset);
	node.parentNode.replaceChild(tpl, node);
	node.textContent = helper.textContent = '';
	return tpl;
}
