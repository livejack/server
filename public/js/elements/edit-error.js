export default class EditError extends HTMLDivElement {
	#tob
	constructor() {
		super();
		this.setAttribute('is', 'edit-error');
	}
	connectedCallback() {
		this.addEventListener('click', this);
		this.live?.addEventListener('ioerror', this);
		window.addEventListener('error', this);
		window.addEventListener('unhandledrejection', this);
		this.hidden = true;
	}
	disconnectedCallback() {
		this.removeEventListener('click', this);
		this.live?.removeEventListener('ioerror', this);
		window.removeEventListener('error', this);
		window.removeEventListener('unhandledrejection', this);
	}
	handleEvent(e) {
		if (e.type == "click") {
			this.hidden = true;
		} else if (e.type == "unhandledrejection" || e.type == "error") {
			this.hidden = false;
			let error = e.reason?.message ?? e.message;
			const code = Number.parseInt(error);
			if (Number.isInteger(code)) {
				if (code >= 500 && code < 600) {
					error = this.dataset.server.replace('%d', code);
				} else if (code == 401 || code == 403) {
					error = this.dataset.auth;
				} else if (code == 404) {
					error = this.dataset.notfound;
				} else if (code == 409) {
					error = this.dataset.conflict;
				} else {
					error = this.dataset.other.replace('%d', code);
				}
			}
			this.live.merge(this, { error });
		} else if (e.type == "ioerror") {
			this.hidden = false;
			const msg = e.detail?.message;
			if (msg) {
				this.live.merge(this, { error: this.dataset[msg] });
				if (msg == "reconnect") {
					this.classList.add('ok');
					this.#autohide();
				}
			}
		}
	}
	#autohide(seconds = 5000) {
		if (this.#tob) {
			window.clearTimeout(this.#tob);
		}
		this.#tob = window.setTimeout(() => {
			this.hidden = true;
			this.classList.remove('ok');
		}, 5000);
	}
}
