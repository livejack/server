import req from "../req.js";

export default class EditPaste extends HTMLFormElement {
	#input
	#anchor
	constructor() {
		super();
		this.setAttribute('is', 'edit-paste');
	}
	connectedCallback() {
		this.addEventListener('click', this);
		this.addEventListener('mouseenter', this);
		this.addEventListener('mouseleave', this);
		this.#input = this.querySelector('input');
		this.#anchor = document.createElement("a");
	}
	disconnectedCallback() {
		this.removeEventListener('click', this);
		this.removeEventListener('mouseenter', this);
		this.removeEventListener('mouseleave', this);
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
	async paste() {
		try {
			const txt = await navigator.clipboard.readText();
			if (!this.validateUrl(txt) || txt.length > 2048) return;
			this.#input.value = txt.trim();
		} catch {
			// do nothing
		}
	}
	async handleEvent(e) {
		const node = this.#input;
		if (node.disabled) return;
		if (e.type == "mouseenter") {
			this.paste();
		} else if (e.type == "mouseleave") {
			node.value = "";
		} else if (e.type == "click") {
			e.preventDefault();
			node.blur();
			if (node.value.length == 0) await this.paste();
			if (node.value.length > 0) this.submit();
		}
	}
	async create(url) {
		this.#input.value = url;
		return this.submit();
	}
	async submit() {
		this.classList.add('loading');
		this.#input.disabled = true;
		let item;
		try {
			item = await req("./assets", "post", { url: this.#input.value });
			this.#input.value = "";
		} catch (err) {
			this.classList.add("error");
			setTimeout(() => {
				if (this.classList.contains('error')) {
					this.#input.value = "";
					this.classList.remove("error");
				}
			}, 3000);
		}
		this.#input.disabled = false;
		this.classList.remove('loading');
		return item;
	}
}
