import { Plugin } from "../../modules/@livejack/prosemirror";

import { renderGrouped } from "./menu.js";

export function menuBar(options) {
	return new Plugin({
		view(editorView) { return new MenuBarView(editorView, options); }
	});
}

class MenuBarView {
	constructor(editorView, options) {
		this.editorView = editorView;
		this.options = options;

		this.maxHeight = 0;
		this.widthForMaxHeight = 0;

		let { dom, update } = renderGrouped(this.editorView, this.options.content);
		this.menu = document.createElement('div');
		this.menu.className = "prosemirror-menu";
		this.menu.append(dom);
		this.contentUpdate = update;
		editorView.dom.before(this.menu);
		this.update();
	}

	update() {
		this.contentUpdate(this.editorView.state);

		if (this.menu.offsetWidth != this.widthForMaxHeight) {
			this.widthForMaxHeight = this.menu.offsetWidth;
			this.maxHeight = 0;
		}
		if (this.menu.offsetHeight > this.maxHeight) {
			this.maxHeight = this.menu.offsetHeight;
			this.menu.style.minHeight = this.maxHeight + "px";
		}
	}


	destroy() {
		this.menu.remove();
	}
}
