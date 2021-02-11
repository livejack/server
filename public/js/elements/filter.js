import req from "../req.js";

export default class EditFilter extends HTMLFormElement {
	#view
	#control
	#assets
	#icons
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
			} else if (this.#icons.contains(e.target)) {
				asset = e.target;
				if (asset.nodeName == "DIV") asset = asset.firstElementChild;
				if (asset.nodeName != "IMG") asset = null;
			}
			if (asset) this.#view.insertAsset(asset);
		}
	}
	async start(view, name) {
		this.#view = view;
		const control = this.closest('#control');
		if (name == "mark") {
			control.classList.add('icons');
			const root = document.getElementById('icons');
			if (root.children.length > 1) return;
			const icons = await req('../pictos/assets.json');
			this.merge(root, icons);
		} else {
			control.classList.remove('icons');
		}
	}
	stop() {
		this.#view = null;
	}
}
