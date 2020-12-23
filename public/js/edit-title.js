export default class EditTitle extends HTMLHeadingElement {
	constructor() {
		super();
		this.setAttribute('is', 'edit-text');
		this.tabIndex = 11;
	}
	get articleProp() {
		return this.getAttribute('name');
	}
	get articleValue() {
		return this.innerText.trim();
	}
}
