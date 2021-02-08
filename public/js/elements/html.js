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
	}
	disconnectedCallback() {
		this.removeEventListener('click', this, true);
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
			doc: { content: "inline*" },
			image: BaseSpec.nodes.image,
			hard_break: BaseSpec.nodes.hard_break,
			text: BaseSpec.nodes.text
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
