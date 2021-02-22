import req from "../req.js";

export default class EditControl extends HTMLDivElement {
	#view
	#assets
	#icons
	#mode
	#loaded
	constructor() {
		super();
		this.setAttribute('is', 'edit-control');
	}
	connectedCallback() {
		this.#assets = this.querySelector('#resources');
		this.#icons = this.querySelector('#icons');
		this.addEventListener('click', this);
	}
	disconnectedCallback() {
		this.removeEventListener('click', this);
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
	get mode() {
		return this.#mode;
	}
	set mode(name) {
		this.className = "";
		if (name) this.classList.add(name);
		this.#mode = name;
	}
	async start(view, name) {
		this.#view = view;
		this.mode = name;
		if (name == "mark") {
			if (!this.#loaded) {
				this.#loaded = true;
				const icons = await req('../pictos/assets.json');
				this.merge(this.#icons, icons);
				this.querySelector('[is="edit-filter"]').init();
			}
		}
	}
	stop() {
		this.mode = null;
		this.#view = null;
	}
}
