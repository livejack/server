import flatpickr from "/node_modules/flatpickr";
import flatLocale from "/node_modules/flatpickr/dist/l10n/fr";

flatpickr.localize(flatLocale.French);

export default class EditTime extends HTMLTimeElement {
	#defaultValue;
	#tick;
	#changed;
	constructor() {
		super();
		this.setAttribute('is', 'edit-time');
	}
	get name() {
		return this.getAttribute('name');
	}
	get value() {
		if (this.dateTime) {
			const date = new Date(this.dateTime);
			date.setMilliseconds(0);
			if (Number.isNaN(date.getTime())) return "";
			else return date.toISOString();
		} else {
			return "";
		}
	}
	set value(val) {
		if (val == this.#defaultValue) this.#changed = false;
		this.dateTime = val;
		this.innerHTML = '[date|date:rel]';
		this.live.merge(this, { date: val });
	}
	get defaultValue() {
		return this.#defaultValue;
	}
	set defaultValue(val) {
		this.#changed = false;
		this.#defaultValue = val;
	}
	get article() {
		return this.closest('[is="edit-article"]');
	}
	connectedCallback() {
		this.#defaultValue = this.value;
		this.addEventListener('click', this);
		const art = this.article;
		if (art && !art.dataset.id) {
			// blank node, update time
			this.#tick = setInterval(() => {
				if (!this.#changed) this.value = (new Date()).toISOString();
			}, 1000);
		}
	}
	disconnectedCallback() {
		if (this.#tick) {
			clearInterval(this.#tick);
			this.#tick = null;
		}
		this.removeEventListener('click', this);
	}
	handleEvent(e) {
		switch (e.type) {
			case "click":
				if (this.article.active) this.start();
				break;
		}
	}
	start() {
		if (this.helperInput) return this.stop();
		this.helperInput = document.createElement('input');
		this.helperInput.style.display = 'none';
		this.insertAdjacentElement('afterEnd', this.helperInput);
		this.picker = flatpickr(this, {
			clickOpens: true,
			noCalendar: true,
			enableTime: true,
			position: "above",
			dateFormat: "Z",
			time_24hr: true,
			defaultDate: this.value || new Date().toISOString(),
			onClose: () => {
				setTimeout(() => this.stop());
			},
			onChange: (sel, dateStr) => {
				this.#changed = true;
				this.value = dateStr;
				if (this.#changed) {
					this.article.dispatchEvent(new Event("change"));
				}
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
			this.helperInput.remove();
			delete this.helperInput;
		}
	}
}
