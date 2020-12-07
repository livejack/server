class ThenEvent {
	constructor() {
		this.p = new Promise((resolve) => {
			this.go = resolve;
		});
		this.q = this.q.bind(this);
		this.init();
	}
	init() {}
	destroy() {}
	handleEvent() {
		this.destroy();
		this.go();
	}
	q(fn) {
		if (fn != null) this.p = this.p.then(fn);
		return this.p;
	}
}

class DocReady extends ThenEvent {
	init() {
		if (document.readyState == "complete") {
			this.go();
		} else {
			document.addEventListener('DOMContentLoaded', this, false);
			window.addEventListener('load', this, false);
		}
	}
	destroy() {
		document.removeEventListener('DOMContentLoaded', this, false);
		window.removeEventListener('load', this, false);
	}
}
const ready = new DocReady().q;

class DocVisible extends ThenEvent {
	init() {
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
			this.go();
		} else {
			document.addEventListener(this.evt, this, false);
		}
	}
	destroy() {
		document.removeEventListener(this.evt, this, false);
	}
}

const visible = new DocVisible().q;

export { ready, visible };
