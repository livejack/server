import req from "../req.js";

export default class EditPaste extends HTMLFormElement {
	#input
	#anchor
	constructor() {
		super();
		this.setAttribute('is', 'edit-paste');
	}
	connectedCallback() {
		this.addEventListener('submit', this);
		this.addEventListener('reset', this);
		this.addEventListener('input', this);
		this.addEventListener('change', this);
		this.addEventListener('focusin', this);
		this.#input = this.querySelector('input');
		this.#input.addEventListener('focus', this);
		this.#anchor = document.createElement("a");
	}
	disconnectedCallback() {
		this.removeEventListener('submit', this);
		this.removeEventListener('reset', this);
		this.removeEventListener('input', this);
		this.removeEventListener('change', this);
		this.removeEventListener('focusin', this);
		this.#input.removeEventListener('focus', this);
		this.#input = null;
		this.#anchor = null;
	}
	validateUrl(url) {
		if (!url || !/^https?:\/\//.test(url)) {
			return false;
		}
		const p = this.#anchor;
		p.href = url;
		return !p.username && !p.password
			&& /\.[^0-9.]/.test(p.hostname)
			&& !/(\s|^\.|\.$)/.test(p.hostname);
	}
	handleEvent(e) {
		if (e.type == "submit") {
			e.preventDefault();
			this.#input.blur();
			this.create(this.#input.value).catch((err) => {
				this.classList.add('error');
			});
		} else if (e.type == "focusin") {
			if (this.classList.contains('error')) {
				this.classList.remove('error');
				this.#input.value = "";
				this.update();
			}
		} else if (e.type == "input" || e.type == "change" || e.type == "reset") {
			window.requestAnimationFrame(() => {
				this.update();
			});
		} else if (e.type == "focus") {
			this.#input.select();
		}
	}
	async create(url) {
		this.#input.value = url;
		if (this.validateUrl(url)) {
			return this.submit();
		} else {
			throw new Error("Invalid url");
		}
	}
	async submit() {
		this.classList.add('loading');
		this.#input.disabled = true;
		let item;
		const url = this.#input.value;
		try {
			item = await req("./assets", "post", { url });
			this.#input.value = "";
		} catch (err) {
			this.classList.add("error");
		}
		this.#input.disabled = false;
		this.classList.remove('loading');
		this.update();
		if (item) this.change(item.url);
		return item;
	}
	update() {
		if (this.#input) this.querySelector('.buttons')
			.classList.toggle('hide', !this.#input.value);
	}
	change(url) {
		// do nothing
	}
}
