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
		this.menu.addEventListener('focusin', this);
		this.menu.addEventListener('focusout', this);
		document.documentElement.addEventListener('scroll', this, true);
		window.addEventListener('resize', this);
	}

	handleEvent(e) {
		if (e.type == "resize") {
			this.#left = null;
		} else if (this.menu.contains(e.target)) {
			this.#keep = e.type == "focusin";
		} else if (e.relatedTarget?.closest('.list > live-asset')) {
			this.#keep = e.type == "focusout";
		}
		this.#reposition();
	}

	update() {
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
		const focused = this.view.hasFocus() || this.#keep;
		const sel = this.view.state.selection;
		const style = this.menu.style;
		if (this.#left == null) {
			let parent = this.menu.parentNode;
			this.#left = 0;
			do {
				this.#left += parent.offsetLeft || 0;
			} while ((parent = parent.offsetParent));
		}
		if (!focused || sel.node || sel.empty) {
			this.menu.classList.remove('floating');
			style.top = null;
			style.left = null;
			style.maxWidth = null;
		} else {
			const aft = this.view.coordsAtPos(sel.to, 1);
			this.menu.classList.add('floating');
			if (this.menu.classList.contains('menutool')) {
				style.maxWidth = `calc(${this.view.dom.offsetWidth}px - 0.4em)`;
			} else {
				style.maxWidth = null;
			}
			style.top = `calc(${parseInt(aft.top)}px + 1.5em)`;
			style.left = `calc(${this.#left}px + 0.2em)`;
		}
	}

	destroy() {
		document.documentElement.removeEventListener('scroll', this, true);
		window.removeEventListener('resize', this);
		this.view.dom.removeEventListener('focusin', this);
		this.view.dom.removeEventListener('focusout', this);
		this.menu.removeEventListener('focusin', this);
		this.menu.removeEventListener('focusout', this);
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
