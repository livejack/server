export default class EditSelect extends HTMLSelectElement {
	constructor() {
		super();
		this.setAttribute('is', 'edit-select');
	}
	get article() {
		return this.closest('[is="edit-article"]');
	}
	connectedCallback() {
		const art = this.article;
		if (art) for (const opt of this.options) {
			if (art.classList.contains(opt.value)) opt.selected = true;
		}
		this.defaultValue = this.value;
		this.addEventListener('change', this);
	}
	disconnectedCallback() {
		this.removeEventListener('change', this);
	}
	handleEvent(e) {
		if (e.type == "change") {
			this.update();
		}
	}
	update() {
		const art = this.article;
		for (const opt of this.options) {
			if (opt.value) art.classList.toggle(opt.value, opt.selected);
		}
	}
	reset() {
		this.value = this.defaultValue;
		this.update();
	}
	start() {}
	stop() {}
}
