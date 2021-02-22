import { Editor } from '../editor/index.js';

import * as BaseSpec from './schema.js';

class HtmlEditor extends Editor {
	constructor(place, opts) {
		super(place, opts);
	}
	changed() {
		this.dom.dispatchEvent(new Event("change", { "bubbles": true }));
	}
}
class EditHtml {
	connectedCallback() {
		this.defaultValue = this.value;
		this.addEventListener('click', this, true);
		this.addEventListener('focus', this, true);
		this.control = document.querySelector('#control');
	}
	disconnectedCallback() {
		this.removeEventListener('click', this, true);
		this.removeEventListener('focus', this, true);
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
		if (val == "<br>" || val == "<p></p>") return "";
		else return val;
	}
	set value(val) {
		this.innerHTML = val;
	}
	handleEvent(e) {
		if (this.article.active) this.start();
		this.queryAssets();
	}
	queryAssets(name) {
		this.control.start(this.view, name || this.name);
	}
	start() {
		if (this.view) return;
		this.view = new HtmlEditor(this, this.options);
		this.view.focus();
	}
	stop() {
		if (!this.view) return;
		const fragment = this.view.toDOM();
		this.view.destroy();
		delete this.view;
		this.control.stop();
		this.textContent = '';
		this.appendChild(fragment);
	}
}


function extend(A, B) {
	Object.defineProperties(
		A.prototype,
		Object.getOwnPropertyDescriptors(B.prototype)
	);
}

export class EditTitle extends HTMLHeadingElement {
	constructor() {
		super();
		this.setAttribute('is', 'edit-title');
	}
	options = {
		nodes: {
			doc: { content: "text*" },
			text: BaseSpec.nodes.text
		}
	};
}

extend(EditTitle, EditHtml);

export class EditMark extends HTMLDivElement {
	constructor() {
		super();
		this.setAttribute('is', 'edit-mark');
	}
	options = {
		nodes: {
			doc: { content: "image*" },
			text: BaseSpec.nodes.text,
			image: {
				inline: true,
				attrs: {
					src: {},
					alt: { default: null }
				},
				draggable: true,
				parseDOM: [{
					tag: "img[src]", getAttrs(dom) {
						return {
							src: dom.getAttribute("src"),
							alt: dom.getAttribute("alt")
						};
					}
				}],
				toDOM(node) {
					let { src, alt } = node.attrs;
					return ["img", { src, alt }];
				}
			}
		},
		menu: false
	};
}
extend(EditMark, EditHtml);

export class EditText extends HTMLDivElement {
	constructor() {
		super();
		this.setAttribute('is', 'edit-text');
	}
	options = {
		nodes: BaseSpec.nodes,
		marks: BaseSpec.marks,
		list: true,
		menu: true
	};
}
extend(EditText, EditHtml);
