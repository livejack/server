export default class EditArticle extends HTMLElement {
	#active
	constructor() {
		super();
		this.setAttribute('is', 'edit-article');
	}
	connectedCallback() {
		this.addEventListener('focusin', this, true);
		this.addEventListener('click', this, true);
		this.addEventListener('change', this);
		this.addEventListener('article:update', this);
	}
	disconnectedCallback() {
		this.removeEventListener('focusin', this, true);
		this.removeEventListener('click', this, true);
		this.removeEventListener('change', this);
		this.removeEventListener('article:update', this);
	}
	get active() {
		return this.#active;
	}
	handleEvent(e) {
		switch (e.type) {
			case "focusin":
				this.start();
				break;
			case "click":
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
				this.update(e.target);
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
	submit() {
		// collect changes in time, icons, title, html and fetch({method: 'put'}) or post
		const data = {
			id: this.id
		};
		this.editables.forEach((node) => {
			data[node.name] = node.value;
		});
		// await fetch put/post then node.defaultValue = node.value;

		console.log(data);
		this.unsaved = false;
		this.stop();
	}
	start() {
		const prev = this.constructor.current;
		if (prev && prev != this) {
			if (prev.unsaved) {
				return;
			} else if (prev.active) {
				prev.stop();
			}
		}
		this.constructor.current = this;
		if (this.active) return;
		this.#active = true;
		this.toolbar = document.querySelector('#gui > .article.toolbar').cloneNode(true);
		this.unsaved = false;
		this.appendChild(this.toolbar);
	}
	stop() {
		this.unsaved = false;
		this.removeChild(this.toolbar);
		delete this.toolbar;
		this.#active = false;
		this.editables.forEach((node) => node.stop());
	}
	update(node) {
		this.unsaved = true;
	}
	get editables() {
		return this.querySelectorAll('[name][is^="edit-"]');
	}
	set unsaved(val) {
		if (this.toolbar) this.toolbar.querySelector('[type="submit"]').disabled = !val;
		this.classList.toggle('unsaved', val);
	}
	get unsaved() {
		return this.editables.some((node) => {
			return node.value != node.defaultValue;
		});
	}
}
