import req from "../req.js";
export default class EditAsset extends HTMLElement {
	constructor() {
		super();
		this.draggable = true;
	}
	connectedCallback() {
		this.addEventListener('click', this);
		this.addEventListener('dragstart', this);

	}
	disconnectedCallback() {
		this.removeEventListener('click', this);
		this.removeEventListener('dragstart', this);
	}

	handleEvent(e) {
		if (e.type == "dragstart") {
			e.dataTransfer.setData("text/html", e.target.outerHTML);
		} else if (e.type == "click") {
			if (e.target.name == "del") {
				this.del();
			}
		}
	}
	del() {
		return req("./assets/" + this.id, "delete");
	}
}
