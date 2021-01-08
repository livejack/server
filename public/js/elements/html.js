import { Editor } from '../editor/index.js';

import * as BaseSpec from './schema.js';

class HtmlEditor extends Editor {
	constructor(place, opts, assetManager) {
		super(place, opts);
		this.assetManager = assetManager;
	}
	changed() {
		this.dispatchEvent(new Event("article:update", { "bubbles": true }));
	}
	async prompt(url) {
		return await this.assetManager.choose(url);
	}
}
export default class EditHtml extends HTMLDivElement {
	#defaultValue
	constructor() {
		super();
		this.setAttribute('is', 'edit-html');
		this.tabIndex = 12;
	}
	connectedCallback() {
		this.#defaultValue = this.value;
		this.addEventListener('focusin', this, true);
	}
	disconnectedCallback() {
		this.removeEventListener('focusin', this, true);
		this.stop();
	}
	get article() {
		return this.closest('[is="edit-article"]');
	}
	get name() {
		return this.getAttribute('name');
	}
	get value() {
		let parent;
		if (this.view) {
			const frag = this.view.toDOM();
			parent = frag.ownerDocument.createElement("div");
			parent.appendChild(frag);
		} else {
			parent = this;
		}
		const val = parent.innerHTML.trim();
		if (val == "<p></p>") return "";
		else return val;
	}
	set value(val) {
		this.innerHTML = val;
	}
	get defaultValue() {
		return this.#defaultValue;
	}
	set defaultValue(val) {
		this.#defaultValue = val;
	}
	handleEvent(e) {
		if (e.type == "focusin") {
			if (this.article.active) this.start();
		}
	}
	start() {
		if (this.view) return;
		const spec = this.name == "mark" ? {
			nodes: {
				doc: { content: "inline*" },
				image: BaseSpec.nodes.image,
				hard_break: BaseSpec.nodes.hard_break,
				text: BaseSpec.nodes.text
			}
		} : {
			nodes: BaseSpec.nodes,
			marks: BaseSpec.marks,
			list: true
		};
		this.view = new HtmlEditor(this, spec);
		this.view.focus();
	}
	stop() {
		if (!this.view) return;
		const fragment = this.view.toDOM();
		this.view.destroy();
		delete this.view;
		this.textContent = '';
		this.appendChild(fragment);
	}
}
