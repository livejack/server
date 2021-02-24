export default class EditIcon extends HTMLElement {
	connectedCallback() {
		this.observe();
	}
	disconnectedCallback() {
		this.unobserve();
	}
}
