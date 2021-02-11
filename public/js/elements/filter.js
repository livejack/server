import req from "../req.js";

export default class EditFilter extends HTMLFormElement {
	#view
	constructor() {
		super();
		this.setAttribute('is', 'edit-filter');
	}
	connectedCallback() {
		document.querySelector('#resources').addEventListener('click', this);
	}
	disconnectedCallback() {
		document.querySelector('#resources').removeEventListener('click', this);
	}
	handleEvent(e) {
		if (e.type == "click" && this.#view) {
			const asset = e.target.closest('live-asset');
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
