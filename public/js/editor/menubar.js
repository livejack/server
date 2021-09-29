import { Plugin } from "/node_modules/@livejack/prosemirror";

import { renderGrouped } from "./menu.js";

class MenuBarView {
	#ticking = false
	constructor(view, options) {
		this.view = view;
		this.options = options;

		const { dom, update } = renderGrouped(view, this.options.content);
		this.menu = document.createElement('div');
		this.menu.className = "prosemirror-menu";
		this.menu.append(dom);

		this.contentUpdate = update;
		view.dom.parentNode.querySelector('.toolbar').prepend(this.menu);

		document.addEventListener('mousedown', this);
		document.addEventListener('mouseup', this);
		document.getElementById('live').addEventListener('scroll', this);

		this.update();
	}

	update() {
		this.contentUpdate(this.view.state, this.view);
		this.requestMove();
	}

	handleEvent(e) {
		this.requestMove();
	}

	requestMove() {
		if (this.#ticking) return;
		window.requestAnimationFrame(() => {
			this.move();
			this.#ticking = false;
		});
		this.#ticking = true;
	}

	move() {
		const sel = this.view.state.selection;
		const style = this.menu.style;
		const dom = this.view.dom;
		// floating if !sel.empty
		// else show at bottom
		if (!this.view.docView || !this.view.focused || sel.empty || sel.node && sel.node.type.name == "asset") {
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
		document.removeEventListener('mousedown', this);
		document.removeEventListener('mouseup', this);
		document.getElementById('live').removeEventListener('scroll', this);
		this.menu.remove();
	}
}

export function menuBar(options) {
	return new Plugin({
		view(editorView) {
			return new MenuBarView(editorView, options);
		}
	});
}
