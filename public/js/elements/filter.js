import req from "../req.js";

export default class EditFilter extends HTMLFormElement {
	#view
	#control
	#assets
	#icons
	#mode
	constructor() {
		super();
		this.setAttribute('is', 'edit-filter');
	}
	connectedCallback() {
		this.#control = this.closest('#control');
		this.#assets = this.#control.querySelector('#resources');
		this.#icons = this.#control.querySelector('#icons');
		this.#control.addEventListener('click', this);
	}
	disconnectedCallback() {
		this.#control.removeEventListener('click', this);
	}
	handleEvent(e) {
		if (e.type == "click" && this.#view) {
			let asset;
			if (this.#assets.contains(e.target)) {
				asset = e.target.closest('live-asset');
				if (asset && this.mode == "link") {
					const link = document.createElement('a');
					link.setAttribute('href', asset.dataset.url);
					link.textContent = "-";
					asset = link;
				}
			} else if (this.#icons.contains(e.target)) {
				asset = e.target;
				if (asset.nodeName == "DIV") asset = asset.firstElementChild;
				if (asset.nodeName != "IMG") asset = null;
			}
			if (asset) this.#view.insertAsset(asset);
		}
	}
	get mode() {
		return this.#mode;
	}
	set mode(name) {
		const control = this.closest('#control');
		control.className = "";
		control.classList.add(name);
		this.#mode = name;
	}
	async start(view, name) {
		this.#view = view;
		this.mode = name;
		if (name == "mark") {
			const root = document.getElementById('icons');
			if (root.children.length > 1) return;
			const icons = await req('../pictos/assets.json');
			this.merge(root, icons);
		}
	}
	stop() {
		this.#view = null;
	}
}
