class ThenEvent {
	constructor() {
		this.p = new Promise((resolve) => {
			this.go = resolve;
		});
		this.q = this.q.bind(this);
	}
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
	constructor(doc) {
		super();
		if (!doc) doc = document;
		this.doc = doc;
		if (doc.readyState == "complete") {
			this.go();
		} else {
			doc.addEventListener('DOMContentLoaded', this, false);
			doc.defaultView.addEventListener('load', this, false);
		}
	}
	destroy() {
		this.doc.removeEventListener('DOMContentLoaded', this, false);
		this.doc.defaultView.removeEventListener('load', this, false);
	}
}
const ready = new DocReady().q;

class DocVisible extends ThenEvent {
	constructor(doc) {
		super();
		if (!doc) doc = document;
		this.doc = doc;
		let hidden;
		if (typeof doc.hidden !== "undefined") {
			hidden = "hidden";
			this.evt = "visibilitychange";
		} else if (typeof doc.msHidden !== "undefined") {
			hidden = "msHidden";
			this.evt = "msvisibilitychange";
		} else if (typeof doc.webkitHidden !== "undefined") {
			hidden = "webkitHidden";
			this.evt = "webkitvisibilitychange";
		}
		if (!hidden || !doc[hidden]) {
			this.go();
		} else {
			doc.addEventListener(this.evt, this, false);
		}
	}
	destroy() {
		this.doc.removeEventListener(this.evt, this, false);
	}
}

const visible = new DocVisible().q;

export { ready, visible };
