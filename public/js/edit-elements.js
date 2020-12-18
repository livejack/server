import './custom-elements.js';

export default function register() {
	const ce = window.customElements;
	ce.define('edit-article', EditArticle, { extends: 'article' });
	ce.define('edit-time', EditTime, { extends: 'time' });
	ce.define('edit-text', EditTitle, { extends: 'h2' });
	ce.define('edit-html', EditHtml, { extends: 'div' });
}

class EditArticle extends HTMLElement {
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

	}
	start() {
		const prev = this.constructor.current;
		if (prev && prev != this) {
			if (prev.unsaved) {
				prev.focus();
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
	}
	get unsaved() {
		return !!this.changes;
	}
}

class EditTime extends HTMLTimeElement {
	constructor() {
		super();
		this.setAttribute('is', 'edit-time');
		this.tabIndex = 10;
	}
	connectedCallback() {
		this.addEventListener('click', this);
	}
	disconnectedCallback() {
		this.removeEventListener('click', this);
	}
	handleEvent(e) {
		switch (e.type) {
			case "click":
				this.start();
				break;
		}
	}
	start() {
		if (this.helperInput) return this.stop();
		this.helperInput = document.createElement('input');
		this.helperInput.setAttribute('data-input', '');
		this.helperInput.style.display = 'none';
		this.appendChild(this.helperInput);
		this.picker = window.flatpickr(this, {
			clickOpens: false,
			noCalendar: true,
			enableTime: true,
			dateFormat: "Z",
			time_24hr: true,
			defaultDate: this.dateTime || new Date().toISOString(),
			onClose: () => {
				this.stop();
			},
			onChange: (sel, dateStr) => {
				this.dateTime = dateStr;
				this.dispatchEvent(new Event("article:update", { "bubbles": true }));
			}
		});
		this.picker.open();
	}
	stop() {
		if (this.picker) {
			this.picker.destroy();
			delete this.picker;
		}
		if (this.helperInput) {
			this.removeChild(this.helperInput);
			delete this.helperInput;
		}
	}
}

class EditTitle extends HTMLHeadingElement {
	constructor() {
		super();
		this.setAttribute('is', 'edit-text');
		this.tabIndex = 11;
	}
}

class EditHtml extends HTMLDivElement {
	constructor() {
		super();
		this.setAttribute('is', 'edit-html');
		this.tabIndex = 12;
	}
}
