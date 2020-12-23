export default class EditArticle extends HTMLElement {
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
	handleEvent(e) {
		switch (e.type) {
			case "focusin":
				this.start();
				break;
			case "click":
				if (!this.toolbar) {
					e.stopPropagation();
				} else if (e.target.closest('.toolbar') == this.toolbar && e.target.matches('button')) {
					this[e.target.name]();
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
				this.update();
				break;
		}
	}
	cancel() {
		this.unsaved = false;
		this.changes = null;
		this.stop();
	}
	del() {

	}
	save() {
		// collect changes in time, icons, title, html and fetch({method: 'put'}) or post
		const data = {
			id: this.id
		};
		this.children.forEach((node) => {
			if (node.articleProp) data[node.articleProp] = node.articleValue;
		});
		console.log(data);
	}
	start() {
		const prev = this.constructor.current;
		if (prev && prev != this) {
			if (prev.unsaved) {
				return;
			} else {
				prev.stop();
			}
		}
		this.constructor.current = this;
		if (this.toolbar) return;
		this.toolbar = document.querySelector('#gui > .article.toolbar').cloneNode(true);
		this.unsaved = false;
		this.appendChild(this.toolbar);
	}
	stop() {
		this.classList.remove('unsaved');
		if (this.toolbar) {
			this.removeChild(this.toolbar);
			delete this.toolbar;
		}
	}
	update() {
		this.unsaved = true;
		this.changes = {

		};
		console.log("check changed");
	}
	set unsaved(val) {
		if (this.toolbar) this.toolbar.querySelector('[name="save"]').disabled = !val;
		this.classList.toggle('unsaved', val);
	}
	get unsaved() {
		return !!this.changes;
	}
}
