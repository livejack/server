export default class EditTitle extends HTMLHeadingElement {
	#defaultValue
	constructor() {
		super();
		this.setAttribute('is', 'edit-text');
		this.tabIndex = 11;
	}
	connectedCallback() {
		this.#defaultValue = this.value;
	}
	start() {

	}
	stop() {

	}
	get name() {
		return this.getAttribute('name');
	}
	get value() {
		return this.innerText.trim();
	}
	set value(val) {
		this.innerText = val;
	}
	get defaultValue() {
		return this.#defaultValue;
	}
	set defaultValue(val) {
		this.#defaultValue = val;
	}
	get article() {
		return this.closest('[is="edit-article"]');
	}
}
