import { reportError } from "../reports.js";

export default class EditError extends HTMLDivElement {
	#tob;
	constructor() {
		super();
		this.setAttribute('is', 'edit-error');
	}
	connectedCallback() {
		this.addEventListener('click', this);
		window.addEventListener('error', this);
		window.addEventListener('unhandledrejection', this);
		this.hidden = true;
	}
	disconnectedCallback() {
		this.removeEventListener('click', this);
		window.removeEventListener('error', this);
		window.removeEventListener('unhandledrejection', this);
	}
	handleEvent(e) {
		this.classList.remove('ok');
		if (e.type == "click") {
			this.hidden = true;
		} else if (e.type == "unhandledrejection" || e.type == "error") {
			this.hidden = false;
			const err = e.error ?? e.reason ?? e;
			let msg = err.message;
			const code = Number.parseInt(err.statusCode ?? msg);
			if (Number.isInteger(code)) {
				if (code >= 500 && code < 600) {
					msg = this.dataset.server.replace('%d', code);
				} else if (code == 401 || code == 403) {
					msg = this.dataset.auth;
				} else if (code == 404) {
					msg = this.dataset.notfound;
				} else if (code == 409) {
					msg = this.dataset.conflict;
				} else if (code == 413) {
					msg = `${this.dataset.toolarge} (${msg})`;
				} else {
					reportError(err);
					msg = this.dataset.other.replace('%d', code);
				}
			} else {
				reportError(err);
			}
			this.live.merge(this, { error: msg });
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
		}, 5000);
	}
}
