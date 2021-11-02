import req from "../req.js";

export default class EditStatus extends HTMLFormElement {
	#fieldset
	#button
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
		if (e.type == "click") {
			if (e.target.name == "action") this.#button = e.target;
		} else {
			e.preventDefault();
			this.#fieldset.disabled = true;
			try {
				await req("./page", "put", { action: this.#button.value });
			} finally {
				this.#fieldset.disabled = false;
			}
		}
	}
}
