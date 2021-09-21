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
		this.addEventListener('paste', this);
		this.addEventListener('focusin', this);
		this.#input = this.querySelector('input');
		this.#anchor = document.createElement("a");
	}
	disconnectedCallback() {
		this.removeEventListener('submit', this);
		this.removeEventListener('paste', this);
		this.removeEventListener('focusin', this);
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
	async handleEvent(e) {
		if(e.type == "submit") {
			e.preventDefault();
			this.#input.blur();
			try {
				await this.create(this.#input.value);
			} catch (e) {
				this.classList.add('error');
			}
		} else if (e.type == "focusin") {
			this.classList.remove('error');
			this.#input.value = "";
		} else if (e.type == "paste") {
			this.#input.blur();
			try {
				await this.create(e.clipboardData.getData('text'));
			} catch (e) {
				this.classList.add('error');
			}
		}
	}
	async create(url) {
		this.#input.value = url;
		if (this.validateUrl(url)) {
			return this.submit();
		} else {
			throw new Error("Invalid url")
		}
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
		}
		this.#input.disabled = false;
		this.classList.remove('loading');
		return item;
	}
}
