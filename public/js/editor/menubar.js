import { Plugin } from "../../modules/@livejack/prosemirror";

import { renderGrouped } from "./menu.js";

export function menuBar(options) {
	return new Plugin({
		view(editorView) {
			return new MenuBarView(editorView, options);
		}
	});
}

class MenuBarView {
	#hidden
	constructor(view, options) {
		this.view = view;
		this.options = options;

		let { dom, update } = renderGrouped(view, this.options.content);
		this.menu = document.createElement('div');
		this.menu.className = "prosemirror-menu";
		this.menu.append(dom);

		this.contentUpdate = update;
		view.dom.before(this.menu);

		this.ticking = false;
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
		if (e.type == "mousedown" && this.view.dom.contains(e.target)) this.#hidden = true;
		else if (e.type == "mouseup") this.#hidden = false;
		this.requestMove();
	}

	requestMove() {
		if (this.ticking) return;
		window.requestAnimationFrame(() => {
			this.move();
			this.ticking = false;
		});
		this.ticking = true;
	}
	move() {
		const sel = this.view.state.selection;
		const style = this.menu.style;
		if (!this.view.docView || sel.empty || sel.node && sel.node.type.name == "asset" || this.#hidden) {
			style.display = "none";
		} else {
			const aft = this.view.coordsAtPos(sel.to, 1);
			style.display = null;
			style.position = "fixed";
			style.top = `calc(${parseInt(aft.top)}px + 1.5em)`;
			style.left = Math.round(Math.max(
				aft.left - this.menu.offsetWidth / 2,
				this.view.dom.offsetLeft
			)) + 'px';
			style.right = "auto";
		}
	}


	destroy() {
		document.removeEventListener('mousedown', this);
		document.removeEventListener('mouseup', this);
		document.getElementById('live').removeEventListener('scroll', this);
		this.menu.remove();
	}
}
