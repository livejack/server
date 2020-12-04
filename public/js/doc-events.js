class DocReady {
	constructor() {
		this.promise = new Promise((resolve) => {
			this.resolve = resolve;
		});
		if (document.readyState == "complete") {
			this.resolve();
		} else {
			document.addEventListener('DOMContentLoaded', this, false);
			window.addEventListener('load', this, false);
		}
	}
	handleEvent() {
		document.removeEventListener('DOMContentLoaded', this, false);
		window.removeEventListener('load', this, false);
		this.resolve();
	}
}
const ready = new DocReady().promise;

class DocVisible {
	constructor() {
		this.promise = new Promise((resolve) => {
			this.resolve = resolve;
		});
		let hidden;
		if (typeof document.hidden !== "undefined") {
			hidden = "hidden";
			this.evt = "visibilitychange";
		} else if (typeof document.msHidden !== "undefined") {
			hidden = "msHidden";
			this.evt = "msvisibilitychange";
		} else if (typeof document.webkitHidden !== "undefined") {
			hidden = "webkitHidden";
			this.evt = "webkitvisibilitychange";
		}
		if (!hidden || !document[hidden]) {
			this.resolve();
		} else {
			document.addEventListener(this.evt, this, false);
		}
	}
	handleEvent() {
		document.removeEventListener(this.evt, this, false);
		this.resolve();
	}
}

const visible = ready.then(() => new DocVisible().promise);

export { ready, visible };
