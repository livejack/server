import req from "../req.js";

class ElementForm extends HTMLFormElement {
	constructor() {
		super();
		this.setAttribute('is', 'element-form');
	}
	connectedCallback() {
		this.addEventListener('submit', this);
	}
	disconnectedCallback() {
		this.removeEventListener('submit', this);
	}
	async handleEvent(e) {
		if (e.type != "submit") return;
		e.preventDefault();
		const node = e.target;
		await req(node.action, node.dataset.method);
		return document.body.reload();
	}
}

window.customElements.define('element-form', ElementForm, { extends: 'form' });
