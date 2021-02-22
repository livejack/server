export default class EditFilter extends HTMLFormElement {
	#mode
	#icons
	constructor() {
		super();
		this.setAttribute('is', 'edit-filter');
	}
	connectedCallback() {
		this.addEventListener('change', this);
		this.#icons = this.parentNode;
	}
	disconnectedCallback() {
		this.removeEventListener('change', this);
	}
	handleEvent(e) {
		if (e.type != "change") return;
		if (e.target.name == "mode") {
			this.setMode(e.target.value, true);
		} else if (e.target.name == "tag") {
			this.setMode("search");
		}
	}
	init() {
		const prevMode = this.#mode;
		if (!prevMode && this.setMode("used") == 0) this.setMode("search");
	}
	setMode(mode) {
		this.querySelector(`[name="mode"][value="${mode}"]`).checked = true;
		this.#mode = mode;
		if (mode == "search") {
			this.classList.remove('notags');
			const tags = this.querySelectorAll(
				'input[name="tag"]:checked'
			).map(node => node.value);
			this.parentNode.querySelectorAll('.icon').forEach(icon => {
				const list = icon.dataset.tags.split(' ');
				icon.classList.toggle('hide', !list.some(tag => tags.includes(tag)));
			});
		} else if (mode == "all") {
			this.classList.add('notags');
			this.parentNode.querySelectorAll('.icon').forEach(icon => {
				icon.classList.remove('hide');
			});
		} else if (mode == "used") {
			this.classList.add('notags');
			const marks = document.querySelectorAll(
				'#live-messages > .live-list > article > [name="mark"] img'
			).map(node => node.src);
			let count = 0;
			this.parentNode.querySelectorAll('.icon > img').forEach(icon => {
				const present = marks.includes(icon.src);
				if (present) count++;
				icon.parentNode.classList.toggle('hide', !present);
			});
			return count;
		}
	}
}
