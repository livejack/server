export default class EditUpload extends HTMLFormElement {
	#input
	constructor() {
		super();
		this.setAttribute('is', 'edit-upload');
	}
	connectedCallback() {
		this.#input = this.querySelector('input');
	}
	disconnectedCallback() {
	}
	handleEvent(e) {

	}
	async upload() {
		this.classList.add('loading');
		this.#input.disabled = true;
		// await form submit
		this.#input.disabled = false;
		this.classList.remove('loading');
	}
}
