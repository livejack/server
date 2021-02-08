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
		this.addEventListener('article:update', this);
	}
	disconnectedCallback() {
		this.removeEventListener('click', this, true);
		this.removeEventListener('change', this);
		this.removeEventListener('article:update', this);
	}
	get active() {
		return this.#active;
	}
	handleEvent(e) {
		switch (e.type) {
			case "click":
				if (!this.start()) {
					e.preventDefault();
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
				if (e.target.matches('[name="style"]')) {
					e.target.options.forEach((opt) => {
						if (opt.value) this.classList.toggle(opt.value, opt.selected);
					});
				}
				break;
			case "article:update":
				this.unsaved = true;
				break;
		}
	}
	reset() {
		this.unsaved = false;
		this.stop();
		this.editables.forEach((node) => {
			node.value = node.defaultValue;
		});
	}
	del() {
		this.stop();
		return req("./messages/" + this.id, "delete");
	}
	async submit() {
		// collect changes in time, icons, title, html and fetch({method: 'put'}) or post
		const data = {};
		this.editables.forEach((node) => {
			data[node.name] = node.value;
		});
		// await req put/post then node.defaultValue = node.value;
		if (this.id) {
			data.id = this.id;
			await req("./messages", "put", data);
			this.stop();
		} else {
			await req("./messages", "post", data);
			this.reset();
		}
	}
	start() {
		const prev = this.constructor.current;
		if (prev && prev != this) {
			if (prev.unsaved) {
				prev.blink();
				return false;
			} else if (prev.active) {
				prev.stop();
			}
		}
		this.constructor.current = this;
		if (!this.active) {
			this.#active = true;
			this.classList.add('active');
			this.toolbar = document.querySelector('#gui > .article.toolbar').cloneNode(true);
			this.unsaved = false;
			this.appendChild(this.toolbar);
		}
		return true;
	}
	stop() {
		this.unsaved = false;
		this.classList.remove('active');
		this.removeChild(this.toolbar);
		delete this.toolbar;
		this.#active = false;
		this.editables.forEach((node) => node.stop());
	}
	get editables() {
		return this.querySelectorAll('[name][is^="edit-"]');
	}
	get unsaved() {
		return this.#unsaved;
	}
	set unsaved(val) {
		if (this.toolbar) this.toolbar.querySelector('[type="submit"]').disabled = !val;
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
