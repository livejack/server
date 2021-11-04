import { Editor } from '../editor/index.js';

import * as BaseSpec from '../editor/schema.js';

class HtmlEditor extends Editor {
	constructor(place, opts) {
		super(place, opts);
	}
	changed() {
		this.dom.dispatchEvent(new Event("change", { "bubbles": true }));
	}
}
class EditHtml {
	static options = {
		quotes: [`’`, `‹`, `›`, `«`, `»`]
	}
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
			parent = this.cloneNode(true);
			// cleanup temp view
			for (const node of parent.querySelectorAll('live-asset')) {
				node.textContent = '';
			}
		}
		const hrefs = [];
		for (const node of parent.querySelectorAll('live-asset')) {
			const url = node.dataset.url;
			if (!url) continue;
			const asset = this.live.get(url);
			if (!asset) continue;
			if (!hrefs.find((obj) => obj.id == asset.id)) {
				hrefs.push({ id: asset.id });
			}
		}
		this.article.hrefs = hrefs;
		const val = parent.innerHTML.trim();
		if (val == "<br>" || val == "<p></p>") return "";
		else return val;
	}
	set value(val) {
		this.innerHTML = val;
	}
	handleEvent(e) {
		if (e.target.name != "preview" && (e.type == "click" || e.type == "focus")) {
			if (this.article.active) {
				this.start({ left: e.pageX, top: e.pageY, node: e.target });
			}
			this.queryAssets();
		}
	}
	queryAssets(name) {
		this.control.start(this.view, name || this.name);
	}
	start(coords) {
		if (!this.view) {
			this.view = new HtmlEditor(
				this, Object.assign({}, EditHtml.options, this.options)
			);
			if (coords.node.nodeName == "INPUT") {
				coords.node.select();
				// const asset = coords.node.closest('live-asset');
				// const input = this.querySelector(`live-asset[data-url="${asset.dataset.url}"] input[name="${coords.node.name}"]`);
				// if (input) input.select();
			} else {
				this.view.initCursor(coords);
			}
		}
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
	const desc = Object.getOwnPropertyDescriptors(B.prototype);
	if (desc.constructor) {
		// one cannot redefine constructor, especially when transpiled
		delete desc.constructor;
	}
	Object.defineProperties(
		A.prototype,
		desc
	);
}

export class EditTitle extends HTMLHeadingElement {
	constructor() {
		super();
		this.setAttribute('is', 'edit-title');
	}
	options = {
		menu: false,
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
		nodes: BaseSpec.icons,
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
	}
}
extend(EditText, EditHtml);
