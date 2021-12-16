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
			this.setMode(e.target.value);
		} else if (e.target.name == "filter") {
			this.setMode("search");
		}
	}
	update(name) {
		const prevMode = this.#mode;
		if (name == 'link') {
			this.setMode('unused', true);
		} else if (!prevMode) {
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
		this.parentNode.dataset.mode = mode;
		const isFor = this.dataset.for;

		if (mode == "search") {
			this.classList.remove('notags');
			const tags = this.querySelectorAll(
				'input[name="filter"]:checked'
			).map(node => node.value);
			for (const node of this.getItems()) {
				const url = node.dataset.url;
				const item = this.live.get(url);
				if (!item) {
					console.error("Missing item", url);
				} else {
					let words = item.meta.keywords || [];
					if (words.length == 0) words = ['-'];
					const active = words.some(tag => tags.includes(tag));
					node.classList.toggle('hide', !active);
				}
			}
		} else {
			this.classList.add('notags');
			const urls = document.querySelectorAll([
				`#live-messages > .live-list > article > [name="${isFor}"] [data-url]`,
				`#live-messages > .live-list > article > [name="${isFor}"] [src]`,
				`#live-messages > .live-list > article > [name="${isFor}"] [href]`
			].join(',')).map(node => {
				return node.dataset.url || node.src || node.href;
			});
			for (const node of this.getItems()) {
				const present = urls.includes(node.dataset.url);
				node.classList.toggle('hide', mode == "used" ? !present : present);
			}
		}
	}
}
