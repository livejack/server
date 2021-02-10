import req from "../req.js";
import { HTML as parseHTML } from "../../modules/matchdom";

export default class EditAsset extends HTMLElement {
	constructor() {
		super();
	}
	connectedCallback() {
		this.addEventListener('click', this);
		this.addEventListener('dragstart', this);
		this.addEventListener('dragend', this);
		if (this.closest('.live-message')) {
			const html = this.dataset.html;
			if (html != this.innerHTML) {
				this.textContent = '';
				this.appendChild(parseHTML(html));
				this.querySelectorAll('script').forEach(node => {
					const copy = node.ownerDocument.createElement('script');
					copy.src = node.src;
					copy.async = true;
					node.parentNode.replaceChild(copy, node);
				});
			}
		}

	}
	disconnectedCallback() {
		this.removeEventListener('click', this);
		this.removeEventListener('dragstart', this);
		this.removeEventListener('dragend', this);
	}

	handleEvent(e) {
		if (e.type == "dragstart") {
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
