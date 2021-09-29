import req from "../req.js";

export default class EditStatus extends HTMLFormElement {
	#input
	constructor() {
		super();
		this.setAttribute('is', 'edit-status');
		this.#input = this.querySelector('[name="status"]');
	}
	connectedCallback() {
		this.addEventListener('change', this);
	}
	disconnectedCallback() {
		this.removeEventListener('change', this);
	}
	async handleEvent(e) {
		this.#input.disabled = true;
		const started = this.#input.checked;
		try {
			await req("./page", "put", { started });
		} catch(err) {
			this.#input.checked = !started;
			throw err;
		} finally {
			this.#input.disabled = false;
		}
	}
}
