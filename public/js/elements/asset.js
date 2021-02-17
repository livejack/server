import req from "../req.js";

export default class EditAsset extends HTMLElement {
	constructor() {
		super();
	}
	connectedCallback() {
		this.addEventListener('click', this);
		this.addEventListener('dragstart', this);
		this.addEventListener('dragend', this);
		this.observe();
	}
	disconnectedCallback() {
		this.removeEventListener('click', this);
		this.removeEventListener('dragstart', this);
		this.removeEventListener('dragend', this);
	}

	handleEvent(e) {
		if (e.type == "dragstart") {
			if (!this.closest('.live-message')) {
				e.preventDefault();
				return;
			}
			const div = document.createElement("div");
			div.innerText = this.dataset.title;
			div.className = 'handle';
			document.body.appendChild(div);
			this.classList.add('dragging');
			e.dataTransfer.setDragImage(div, 0, 0);
		} else if (e.type == "dragend") {
			this.classList.remove('dragging');
		} else if (e.type == "click") {
			if (e.target.name == "del") {
				e.stopPropagation();
				this.del();
			} else if (e.target.closest('a[href]')) {
				e.preventDefault();
			}
		}
	}
	del() {
		return req("./assets/" + this.id, "delete");
	}
	get favicon() {
		const img = this.querySelector('.header > img');
		if (img) return img.src;
		else return null;
	}
}
