export default class EditFilter extends HTMLFormElement {
	#view
	constructor() {
		super();
		this.setAttribute('is', 'edit-filter');
	}
	connectedCallback() {
		document.querySelector('#resources').addEventListener('click', this);
		this.addEventListener('change', this);
	}
	disconnectedCallback() {
		document.querySelector('#resources').removeEventListener('click', this);
		this.removeEventListener('change', this);
	}
	handleEvent(e) {
		if (e.type == "change") {
			this.update();
		} else if (e.type == "click" && this.#view) {
			const asset = e.target.closest('live-asset');
			if (asset) this.#view.insertAsset(asset);
		}
	}
	start(view, types = []) {
		this.#view = view;
		this.querySelectorAll('input[type="checkbox"]').forEach(node => {
			node.disabled = !types.includes(node.name);
			node.checked = !node.disabled;
		});
		this.update();
	}
	update() {
		this.querySelectorAll('input[type="checkbox"]').forEach(node => {
			this.classList.toggle(node.name, node.checked);
		});
	}
	stop() {
		this.#view = null;
		this.querySelectorAll('input[type="checkbox"]').forEach(node => {
			node.disabled = false;
			node.checked = false;
		});
	}
}
