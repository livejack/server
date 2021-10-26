import { Plugin } from "/node_modules/@livejack/prosemirror";

import { renderGrouped } from "./menu.js";

import { buildMenuItems } from "./menuitems.js";

class MenuBarView {
	#ticking = false
	#keep = false
	#left;
	constructor(view, schema) {
		this.view = view;
		this.menu = document.createElement('div');
		this.menu.className = "prosemirror-menu";
		this.items = document.createElement('div');
		this.menu.append(this.items);
		const { dom, update } = renderGrouped(
			view, this.menu,
			buildMenuItems(schema).fullMenu
		);
		this.items.append(dom);

		this.contentUpdate = update;
		view.dom.parentNode.querySelector('.toolbar').prepend(this.menu);

		view.dom.addEventListener('focusin', this);
		view.dom.addEventListener('focusout', this);
		this.menu.addEventListener('mousedown', this);
		document.documentElement.addEventListener('scroll', this, true);
		window.addEventListener('resize', this);
	}

	handleEvent(e) {
		if (e.type == "scroll") {
			this.#reposition();
		} else if (e.type == "resize") {
			this.#left = null;
			this.#reposition();
		} else if (e.type == "mousedown") {
			this.#keep = true;
		} else if (this.#keep) {
			this.#keep = false;
		} else {
			this.#reposition();
		}
	}

	update() {
		const focused = this.view.hasFocus();
		this.menu.classList.toggle('disabled', !focused);
		this.contentUpdate(this.view.state, this.view);
		this.#reposition();
	}

	#reposition() {
		if (this.#ticking) return;
		window.requestAnimationFrame(() => {
			this.#position();
			this.#ticking = false;
		});
		this.#ticking = true;
	}

	#position() {
		const focused = this.view.hasFocus();
		this.menu.classList.toggle('disabled', !focused);
		const sel = this.view.state.selection;
		const style = this.menu.style;
		if (this.#left == null) {
			let parent = this.menu.parentNode;
			this.#left = 0;
			do {
				this.#left += parent.offsetLeft || 0;
			} while ((parent = parent.offsetParent));
		}
		if (!this.view.docView || !focused || sel.node) {
			this.menu.classList.remove('floating');
			style.top = null;
			style.left = null;
		} else {
			const aft = this.view.coordsAtPos(sel.to, 1);
			this.menu.classList.add('floating');
			style.top = `calc(${parseInt(aft.top)}px + 1.5em)`;
			style.left = `calc(${this.#left}px + 0.2em)`;
			style.maxWidth = `calc(${this.view.dom.offsetWidth}px - 0.4em)`;
		}
	}

	destroy() {
		document.documentElement.removeEventListener('scroll', this, true);
		window.removeEventListener('resize', this);
		this.view.dom.removeEventListener('focusin', this);
		this.view.dom.removeEventListener('focusout', this);
		this.menu.removeEventListener('mousedown', this);
		this.menu.remove();
	}
}

export function menuBar(schema) {
	return new Plugin({
		view(editorView) {
			return new MenuBarView(editorView, schema);
		}
	});
}
