import req from "../req.js";

export default class EditStatus extends HTMLFormElement {
	#fieldset
	constructor() {
		super();
		this.setAttribute('is', 'edit-status');
	}
	connectedCallback() {
		this.addEventListener('click', this);
		this.addEventListener('submit', this);
		this.#fieldset = this.querySelector('fieldset');
	}
	disconnectedCallback() {
		this.removeEventListener('click', this);
		this.removeEventListener('submit', this);
	}
	async handleEvent(e) {
		e.preventDefault();
		if (e.type == "submit") return;
		const btn = e.target.closest('button');
		if (btn?.name != "action") return;
		this.#fieldset.disabled = true;
		try {
			await req("./page", "put", { action: btn.value });
		} finally {
			this.#fieldset.disabled = false;
		}
	}
}
