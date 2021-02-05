import req from "../req.js";

export default class EditPaste extends HTMLFormElement {
	#input
	constructor() {
		super();
		this.setAttribute('is', 'edit-paste');
	}
	connectedCallback() {
		this.addEventListener('click', this);
		this.#input = this.querySelector('input');
	}
	disconnectedCallback() {
		this.removeEventListener('click', this);
	}
	handleEvent(e) {
		navigator.clipboard.readText().then(txt => {
			this.add(txt);
		});
	}
	async add(str) {
		this.classList.add('loading');
		this.#input.disabled = true;
		str = str.trim();
		let asset;
		try {
			if (str.startsWith('<')) {
				// TODO implement html snippets
			} else {
				if (!/^[a-zA-Z]+:\/\//.test(str)) str = 'https://' + str;
				const anchor = document.createElement("a");
				anchor.setAttribute("href", str);
				const url = anchor.href;
				asset = await req("./assets", "post", { url });
			}
			this.#input.value = "";
		} catch (err) {
			this.classList.add("error");
		}
		this.#input.disabled = false;
		this.classList.remove('loading');
		return asset;
	}
}
