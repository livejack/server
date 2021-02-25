import req from "../req.js";

export default class EditAsset extends HTMLElement {
	#editable
	connectedCallback() {
		this.addEventListener('click', this);
		this.addEventListener('dragstart', this);
		this.addEventListener('dragend', this);
		this.addEventListener('mousemove', this);
		this.addEventListener('mouseleave', this);
		this.#editable = !!this.closest(".live-article");
		if (this.children.length == 0) {
			const asset = document.querySelector(`#assets > live-asset[data-url="${this.dataset.url}"]`);
			if (asset) {
				this.innerHTML = asset.innerHTML;
			} else {
				// TODO ask "paste" form to insert that asset
			}
		}
	}
	disconnectedCallback() {
		this.removeEventListener('click', this);
		this.removeEventListener('dragstart', this);
		this.removeEventListener('dragend', this);
		this.removeEventListener('mousemove', this);
		this.removeEventListener('mouseleave', this);
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
			if (e.target.name == "save") {
				e.stopPropagation();
				this.save();
			} else if (e.target.name == "del") {
				e.stopPropagation();
				this.del();
			} else if (e.target.closest('a[href]')) {
				e.preventDefault();
			}
		} else if (e.type == "mousemove") {
			this.classList.toggle('ctrl', !this.#editable && e.ctrlKey);
		} else if (e.type == "mouseleave") {
			this.classList.remove('ctrl');
		}
	}
	del() {
		if (this.#editable) {
			this.parentNode.removeChild(this);
		} else {
			return req("./assets/" + this.dataset.id, "delete");
		}
	}
	save() {
		return req("./assets/" + this.dataset.id, "put", { url: this.dataset.url });
	}
	get favicon() {
		const img = this.querySelector('.header > img');
		if (img) return img.src;
		else return null;
	}
}
