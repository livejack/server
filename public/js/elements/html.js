import { Editor } from '../editor/index.js';

import * as BaseSpec from './schema.js';

class HtmlEditor extends Editor {
	constructor(place, opts) {
		super(place, opts);
	}
	changed() {
		this.dom.dispatchEvent(new Event("article:update", { "bubbles": true }));
	}
	async prompt(url) {
		return await EditHtml.assetManager.choose(url);
	}
}
class EditHtml {
	connectedCallback() {
		this.defaultValue = this.value;
		this.addEventListener('click', this, true);
		this.addEventListener('focus', this);
	}
	disconnectedCallback() {
		this.removeEventListener('click', this, true);
		this.removeEventListener('focus', this);
		this.stop();
	}
	get article() {
		return this.closest('[is="edit-article"]');
	}
	changed() {
		this.dispatchEvent(new Event("article:update", { "bubbles": true }));
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
		if (e.type == "click") {
			if (this.article.active) this.start();
		} else if (e.type == "focus") {
			document.querySelector('#resources [is="edit-filter"]').start(this.view, this.options.assets);
		}
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
		document.querySelector('#resources [is="edit-filter"]').stop();
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
		menu: false,
		assets: ['icon']
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
		menu: true,
		assets: ['link', 'image', 'video', 'embed']
	};
}
extend(EditText, EditHtml);
