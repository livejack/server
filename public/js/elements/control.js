import req from "../req.js";

export default class EditControl extends HTMLDivElement {
	#view;
	#icons;
	#loaded;
	constructor() {
		super();
		this.setAttribute('is', 'edit-control');
		this.mode = null;
	}
	connectedCallback() {
		this.#icons = this.querySelector('#icons');
		this.addEventListener('click', this);
	}
	disconnectedCallback() {
		this.removeEventListener('click', this);
	}
	handleEvent(e) {
		if (e.type == "click" && this.#view) {
			const asset = e.target.closest('[data-url]');
			if (asset) {
				e.preventDefault();
				this.#view.focus();
				const item = this.live.get(asset.dataset.url);
				const node = asset.cloneNode(false);
				if (item.meta.title) node.dataset.title = item.meta.title;
				if (item.meta.author) node.dataset.author = item.meta.author;
				node.dataset.type = item.type;
				setTimeout(() => this.#view.insertAsset(node));
			}
		}
	}
	get mode() {
		return this.dataset.mode;
	}
	set mode(name) {
		if (name == null) name = "default";
		this.dataset.mode = name;
		if (name == "link") {
			this.querySelector('form[is="edit-link"] input').focus();
		}
	}
	async start(view, name) {
		this.#view = view;
		this.mode = name;
		if (name == "mark") {
			if (!this.#loaded) {
				this.#loaded = true;
				const icons = await req('../pictos/assets');
				this.live.merge(this.#icons, icons);
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
