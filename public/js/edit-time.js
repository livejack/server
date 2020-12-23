export default class EditTime extends HTMLTimeElement {
	constructor() {
		super();
		this.setAttribute('is', 'edit-time');
		this.tabIndex = 10;
	}
	get articleProp() {
		return this.getAttribute('name');
	}
	get articleValue() {
		return this.dateTime;
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
		this.insertAdjacentElement('afterEnd', this.helperInput);
		this.picker = window.flatpickr(this, {
			clickOpens: false,
			noCalendar: true,
			enableTime: true,
			position: "above",
			dateFormat: "Z",
			time_24hr: true,
			defaultDate: this.dateTime || new Date().toISOString(),
			onClose: () => {
				this.stop();
			},
			onChange: (sel, dateStr) => {
				this.dateTime = dateStr;
				this.textContent = this.constructor.matchdom.merge('[message.date|reldatetime]', {
					message: { date: dateStr }
				});
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
			this.helperInput.remove();
			delete this.helperInput;
		}
	}
}
