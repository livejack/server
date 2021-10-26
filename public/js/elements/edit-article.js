import req from "../req.js";
export default class EditArticle extends HTMLElement {
	#active
	#unsaved
	constructor() {
		super();
		this.setAttribute('is', 'edit-article');
	}
	connectedCallback() {
		this.addEventListener('click', this, true);
		this.addEventListener('change', this);
	}
	disconnectedCallback() {
		this.removeEventListener('click', this, true);
		this.removeEventListener('change', this);
	}
	get active() {
		return this.#active;
	}
	handleEvent(e) {
		if (e.target.closest('form')) return; // not for us
		switch (e.type) {
			case "click":
				e.preventDefault();
				if (e.target.name == "preview") {
					// let edit-asset preview button be handled independently
					return;
				}
				if (!this.start()) {
					e.stopPropagation();
					return;
				}
				if (!this.toolbar) {
					e.stopPropagation();
				} else if (e.target.closest('.toolbar') == this.toolbar && e.target.matches('button')) {
					if (e.target.name) this[e.target.name]();
					else this[e.target.type]();
				}
				break;
			case "change":
				this.unsaved = true;
				break;
		}
	}
	reset() {
		this.unsaved = false;
		this.stop(true);
	}
	del() {
		this.stop();
		return req("./messages/" + this.dataset.id, "delete");
	}
	async submit() {
		// collect changes in time, icons, title, html and fetch({method: 'put'}) or post
		const data = {};
		for (const node of this.editables) {
			data[node.name] = node.value;
		}
		data.hrefs = this.hrefs;
		// await req put/post then node.defaultValue = node.value;
		if (this.dataset.id) {
			data.id = this.dataset.id;
			await req("./messages", "put", data);
			this.stop();
		} else {
			await req("./messages", "post", data);
			this.reset();
		}
	}
	start() {
		const prev = EditArticle.current;
		if (prev && prev != this) {
			if (prev.unsaved) {
				prev.blink();
				return false;
			} else if (prev.active) {
				prev.stop();
			}
		}
		EditArticle.current = this;
		if (!this.active) {
			this.#active = true;
			this.classList.add('active');
			this.toolbar = document.querySelector('#gui > .article.toolbar').cloneNode(true);
			this.unsaved = false;
			this.appendChild(this.toolbar);
		}
		return true;
	}
	stop(reset) {
		this.unsaved = false;
		this.classList.remove('active');
		this.#active = false;
		for (const node of this.editables) {
			node.stop();
			if (reset) {
				if (node.reset) node.reset();
				else node.value = node.defaultValue;
			}
		}
		this.removeChild(this.toolbar);
		delete this.toolbar;
	}
	get editables() {
		return this.querySelectorAll('[name][is^="edit-"]');
	}
	get unsaved() {
		return this.#unsaved;
	}
	set unsaved(val) {
		if (this.toolbar) {
			const submit = this.toolbar.querySelector('[type="submit"]');
			submit.disabled = !val;
			if (submit.disabled) {
				submit.tabIndex = "";
			} else {
				submit.tabIndex = (this.dataset.id || '') + "9";
			}
		}
		this.classList.toggle('unsaved', val);
		this.#unsaved = val;
	}
	blink() {
		this.scrollIntoView({ behavior: 'smooth' });
		this.classList.add('blink');
		setTimeout(() => {
			this.classList.remove('blink');
		}, 1000);
	}
}
