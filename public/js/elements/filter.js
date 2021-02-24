export default class EditFilter extends HTMLFormElement {
	#mode
	constructor() {
		super();
		this.setAttribute('is', 'edit-filter');
	}
	connectedCallback() {
		this.addEventListener('change', this);
	}
	disconnectedCallback() {
		this.removeEventListener('change', this);
	}
	handleEvent(e) {
		if (e.type != "change") return;
		if (e.target.name == "mode") {
			this.setMode(e.target.value, true);
		} else if (e.target.name == "filter") {
			this.setMode("search");
		}
	}
	update(name) {
		const prevMode = this.#mode;
		if (name == 'link') {
			this.setMode('unused', true);
		} else if (!prevMode && this.setMode(this.dataset.default) == 0) {
			this.setMode("search");
		} else if (prevMode) {
			this.setMode(prevMode);
		}
	}
	getItems() {
		return this.parentNode.querySelectorAll('[data-url]');
	}
	setMode(mode, temp) {
		this.querySelector(`[name="mode"][value="${mode}"]`).checked = true;
		if (!temp) this.#mode = mode;
		const isFor = this.dataset.for;
		if (mode == "search") {
			this.classList.remove('notags');
			const tags = this.querySelectorAll(
				'input[name="filter"]:checked'
			).map(node => node.value);
			this.getItems().forEach(node => {
				const list = node.dataset[isFor == "mark" ? "tags" : "type"].split(' ');
				node.classList.toggle('hide', !list.some(tag => tags.includes(tag)));
			});
		} else {
			this.classList.add('notags');
			const urls = document.querySelectorAll([
				`#live-messages > .live-list > article > [name="${isFor}"] [data-url]`,
				`#live-messages > .live-list > article > [name="${isFor}"] [src]`,
				`#live-messages > .live-list > article > [name="${isFor}"] [href]`
			].join(',')).map(node => {
				return node.dataset.url || node.src || node.href;
			});
			let count = 0;
			this.getItems().forEach(node => {
				const present = urls.includes(node.dataset.url);
				if (present) count++;
				node.classList.toggle('hide', mode == "used" ? !present : present);
			});
			return count;
		}
	}
}
