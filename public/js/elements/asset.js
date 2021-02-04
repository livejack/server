import req from "../req.js";
export default class EditAsset extends HTMLAnchorElement {
	constructor() {
		super();
		this.setAttribute('is', 'edit-asset');
	}
	connectedCallback() {
		this.addEventListener('click', this, true);
	}
	disconnectedCallback() {
		this.removeEventListener('click', this, true);
	}
	handleEvent(e) {
		if (e.target.name == "del") {
			e.preventDefault();
			e.stopPropagation();
			this.del();
		}
	}
	del() {
		return req("./assets/" + this.id, "delete");
	}
}
