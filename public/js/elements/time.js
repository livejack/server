import flatpickr from "../../modules/flatpickr";
import { French } from "../../modules/flatpickr/l10n/fr";
flatpickr.localize(French);
export default class EditTime extends HTMLTimeElement {
	#defaultValue
	constructor() {
		super();
		this.setAttribute('is', 'edit-time');
		this.tabIndex = 10;
	}
	get name() {
		return this.getAttribute('name');
	}
	get value() {
		if (this.dateTime) {
			const date = new Date(this.dateTime);
			date.setMilliseconds(0);
			date.setSeconds(0);
			if (Number.isNaN(date.getTime())) return "";
			else return date.toISOString();
		} else {
			return "";
		}
	}
	set value(val) {
		this.dateTime = val;
		this.textContent = this.mergeDate(val);
	}
	get defaultValue() {
		return this.#defaultValue;
	}
	set defaultValue(val) {
		this.#defaultValue = val;
	}
	get article() {
		return this.closest('[is="edit-article"]');
	}
	connectedCallback() {
		this.#defaultValue = this.value;
		this.addEventListener('click', this);
	}
	disconnectedCallback() {
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
				this.stop();
			},
			onChange: (sel, dateStr) => {
				this.value = dateStr;
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
