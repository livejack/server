import { Plugin } from "/node_modules/@livejack/prosemirror";

import { renderGrouped } from "./menu.js";

import { buildMenuItems } from "./menuitems.js";

class MenuBarView {
	#ticking = false
	constructor(view, schema) {
		this.view = view;
		const { dom, update } = renderGrouped(view, buildMenuItems(schema).fullMenu);
		this.menu = document.createElement('div');
		this.menu.className = "prosemirror-menu";
		this.menu.append(dom);

		this.contentUpdate = update;
		view.dom.parentNode.querySelector('.toolbar').prepend(this.menu);

		view.dom.addEventListener('focus', this);
		view.dom.addEventListener('blur', this);
	}

	handleEvent(e) {
		this.update();
	}

	update() {
		if (this.#ticking) return;
		window.requestAnimationFrame(() => {
			this.doUpdate();
			this.#ticking = false;
		});
		this.#ticking = true;
	}

	doUpdate() {
		const focused = this.view.hasFocus();
		this.menu.classList.toggle('disabled', !focused);
		this.contentUpdate(this.view.state, this.view);
		const sel = this.view.state.selection;

		const style = this.menu.style;
		const dom = this.view.dom;
		if (!this.view.docView || !focused || sel.node) {
			this.menu.classList.remove('floating');
			style.top = null;
			style.left = null;
		} else {
			const aft = this.view.coordsAtPos(sel.to, 1);
			this.menu.classList.add('floating');
			style.top = `calc(${parseInt(aft.top)}px + 1.5em)`;
			style.left = Math.round(Math.max(
				aft.left - this.menu.offsetWidth / 2,
				dom.offsetLeft
			)) + 'px';
		}
	}

	destroy() {
		this.view.dom.removeEventListener('focus', this);
		this.view.dom.removeEventListener('blur', this);
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
