export default class EditError extends HTMLDivElement {
	constructor() {
		super();
		this.setAttribute('is', 'edit-error');
	}
	connectedCallback() {
		this.addEventListener('click', this);
		window.addEventListener('unhandledrejection', this);
	}
	disconnectedCallback() {
		this.removeEventListener('click', this);
		window.removeEventListener('unhandledrejection', this);
	}
	handleEvent(e) {
		if (e.type == "click") {
			this.hidden = true;
		} else if (e.type == "unhandledrejection") {
			this.hidden = false;
			this.live.matchdom.merge(this, { error: e.reason });
		}
	}
}
