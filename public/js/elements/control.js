import req from "../req.js";

export default class EditControl extends HTMLDivElement {
	#view
	#assets
	#icons
	#loaded
	constructor() {
		super();
		this.setAttribute('is', 'edit-control');
	}
	connectedCallback() {
		this.#assets = this.querySelector('#assets');
		this.#icons = this.querySelector('#icons');
		this.addEventListener('click', this);
	}
	disconnectedCallback() {
		this.removeEventListener('click', this);
	}
	handleEvent(e) {
		if (e.type == "click" && this.#view) {
			let asset = e.target.closest('[data-url]');
			if (asset) {
				e.preventDefault();
				this.#view.focus();
				setTimeout(() => this.#view.insertAsset(asset));
			}
		}
	}
	get mode() {
		return this.dataset.mode;
	}
	set mode(name) {
		//this.setAttribute('data-mode', name);
		this.dataset.mode = name;
	}
	async start(view, name) {
		this.#view = view;
		this.mode = name;
		if (name == "mark") {
			if (!this.#loaded) {
				this.#loaded = true;
				const icons = await req('../pictos/assets.json');
				this.merge(this.#icons, icons);
			}
			this.querySelector('#icons > [is="edit-filter"]').update();
		} else {
			this.querySelector('#assets > [is="edit-filter"]').update(name);
		}

	}
	stop() {
		this.mode = null;
		this.#view = null;
	}
}
