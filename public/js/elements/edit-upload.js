export default class EditUpload extends HTMLFormElement {
	#input
	constructor() {
		super();
		this.setAttribute('is', 'edit-upload');
	}
	connectedCallback() {
		this.#input = this.querySelector('input');
		this.addEventListener("change", this);
	}
	disconnectedCallback() {
		this.removeEventListener("change", this);
	}
	handleEvent(e) {
		if (e.type == "change") {
			this.submit();
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
				if (this.classList.contains('error')) {
					this.#input.value = "";
					this.classList.remove("error");
				}
			}, 3000);
		}
		this.classList.remove('loading');
	}
	set progress(percent) {
		this.style.setProperty('--width', `${percent}%`);
	}
}


async function upload(form, track) {
	const xhr = new XMLHttpRequest();
	const inputs = form.querySelectorAll('input[type="file"]');
	const { defer, resolve, reject } = Deferred(function () {
		toggleDisable(false);
	});

	function toggleDisable(val) {
		inputs.forEach(node => {
			node.disabled = val;
		});
	}

	xhr.upload.addEventListener("progress", function(e) {
		if (e.lengthComputable) {
			var percent = Math.round((e.loaded * 100) / e.total);
			if (percent >= 100) percent = 99; // only load event can reach 100
			track(percent);
		}
	});

	xhr.addEventListener('load', function() {
		track(100);
		try {
			resolve(JSON.parse(xhr.responseText));
		} catch(ex) {
			reject(ex);
		}
	});

	xhr.addEventListener('error', function(e) {
		const msg = xhr.statusText || "Connection error";
		const err = new Error(msg);
		err.statusCode = xhr.status;
		reject(err);
	});

	try {
		xhr.open("POST", "./assets", true);
		xhr.setRequestHeader('Accept', "application/json");
		xhr.send(new FormData(form));
		toggleDisable(true);
	} catch (err) {
		reject(err);
	}
	return defer;
}

function Deferred(final) {
	let resolve, reject;
	const defer = new Promise(function (pass, fail) {
		resolve = function (obj) {
			final();
			pass(obj);
		};
		reject = function (err) {
			final();
			fail(err);
		};
	});
	return { defer, resolve, reject };
}
