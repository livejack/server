import { Deferred } from "/node_modules/class-deferred";

export default class EditUpload extends HTMLFormElement {
	#input;
	#preview;
	constructor() {
		super();
		this.setAttribute('is', 'edit-upload');
	}
	connectedCallback() {
		this.#input = this.querySelector('input');
		this.#preview = this.querySelector('img');
		this.#preview.addEventListener('error', this);
		this.addEventListener("change", this);
		this.addEventListener("submit", this);
		this.addEventListener("reset", this);
	}
	disconnectedCallback() {
		this.removeEventListener("change", this);
		this.removeEventListener("sbumit", this);
		this.removeEventListener("reset", this);
	}
	handleEvent(e) {
		if (this.#preview.src) {
			URL.revokeObjectURL(this.#preview.src);
		}
		if (!this.#input.value || e.type == "reset") {
			this.querySelector('.buttons').classList.add("hide");
			this.#preview.removeAttribute('src');
			this.classList.remove('error');
			this.#preview.classList.add("hide");
		} else if (e.type == "change") {
			this.querySelector('.buttons').classList.remove("hide");
			this.#preview.src = URL.createObjectURL(this.#input.files[0]);
			this.#preview.classList.remove("hide");
		} else if (e.type == "submit") {
			e.preventDefault();
			this.querySelector('.buttons').classList.add("hide");
			this.#preview.classList.add("hide");
			this.submit();
		} else if (e.type == "error") {
			this.#preview.classList.add("hide");
			this.classList.add('error');
		}
	}
	async submit() {
		this.classList.add('loading');
		try {
			await upload(this, (val) => {
				this.progress = val;
			});
			this.#input.value = "";
		} catch (err) {
			this.classList.add("error");
			setTimeout(() => {
				throw err;
			});
			setTimeout(() => {
				if (this.classList.contains('error')) {
					this.#input.value = "";
					this.classList.remove("error");
				}
			}, 3000);
		} finally {
			this.classList.remove('loading');
		}
	}
	set progress(percent) {
		this.style.setProperty('--width', `${percent}%`);
	}
}


async function upload(form, track) {
	const xhr = new XMLHttpRequest();
	const inputs = form.querySelectorAll('input[type="file"]');
	const defer = new Deferred();

	function toggleDisable(val) {
		for (const node of inputs) node.disabled = val;
	}

	function handleError() {
		const msg = xhr.statusText || xhr.responseText || "Connection error";
		const err = new Error(msg);
		err.statusCode = xhr.status;
		defer.reject(err);
	}

	xhr.upload.addEventListener("progress", (e) => {
		if (e.lengthComputable) {
			let percent = Math.round((e.loaded * 100) / e.total);
			if (percent >= 100) percent = 99; // only load event can reach 100
			track(percent);
		}
	});

	xhr.addEventListener('load', () => {
		track(100);
		if (xhr.status >= 400) return handleError();
		try {
			defer.resolve(JSON.parse(xhr.responseText));
		} catch(ex) {
			defer.reject(ex);
		}
	});

	xhr.addEventListener('error', handleError);

	try {
		xhr.open("POST", "./assets", true);
		xhr.setRequestHeader('Accept', "application/json");
		xhr.send(new FormData(form));
		toggleDisable(true);
	} catch (err) {
		defer.reject(err);
	}
	return defer.finally(() => toggleDisable(false));
}
