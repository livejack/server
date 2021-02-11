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
		if (art) this.options.forEach((opt) => {
			if (art.classList.contains(opt.value)) opt.selected = true;
		});
		this.addEventListener('change', this);
	}
	disconnectedCallback() {
		this.removeEventListener('change', this);
	}
	handleEvent(e) {
		if (e.type == "change") {
			const art = this.article;
			this.options.forEach((opt) => {
				if (opt.value) art.classList.toggle(opt.value, opt.selected);
			});
		}
	}
	start() {}
	stop() {}
}
