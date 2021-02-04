import SlimSelect from "../../modules/slim-select";
export default class AssetManager {
	constructor() {
		this.root = document.body.querySelector('[data-live="assets"]');
		this.root.addEventListener('click', this);
		this.zone = this.root.querySelector('.new');
		this.zone.placeholder = this.zone.getAttribute('placeholder');
		this.zone.textContent = this.zone.placeholder;
		this.zone.addEventListener('paste', this);
		this.zone.addEventListener('focus', this);
		this.zone.addEventListener('blur', this);
		this.zone.addEventListener('keydown', this);
		this.select = new SlimSelect({
			select: this.root.querySelector('.filter[name="type"]'),
			allowDeselect: true,
			showSearch: false
		});
	}
	async handleEvent(e) {
		if (e.type == "click") {
			e.preventDefault();
			if (e.target == this.zone) {
				this.zone.value = "";
				this.zone.parentNode.classList.remove("error");
				return;
			}
			const asset = e.target.closest('a[href]');
			if (asset) {
				if (this.resolve) {
					const meta = Object.assign({}, asset.dataset);
					meta.url = asset.href;
					this.resolve(meta);
				} else {
					this.open(asset);
				}
			}
		} else if (e.type == "paste") {
			e.preventDefault();
			const str = (e.clipboardData || window.clipboardData).getData('text');
			if (str) {
				const result = await this.add(str);
				if (result && this.resolve) this.resolve(result);
			}
		} else if (e.type == "focus") {
			this.zone.textContent = "";
		} else if (e.type == "blur") {
			this.zone.textContent = this.zone.placeholder;
		} else if (e.type == "keydown") {
			//e.preventDefault();
		}
	}
	async choose(data = {}) {
		let resolve;
		const p = new Promise((r) => { resolve = r; });
		if (this.asset) {
			this.close();
		}
		const node = data.url && this.root.querySelector(`a[href="${data.url}"]`);
		if (node) {
			// edit attributes
			const result = await this.open(node, data);
			resolve(result);
		} else {
			this.resolve = (data) => {
				delete this.resolve;
				this.root.classList.remove('active');
				resolve(data);
			};
		}
		this.root.classList.add('active');
		return p;
	}
	async open(asset, data = {}) {
		this.asset = asset;

	}
	close() {
		delete this.asset;
	}
	async add(str) {
		this.zone.textContent = str;
		this.zone.parentNode.classList.add('loading');
		this.zone.disabled = true;
		str = str.trim();
		let asset;
		try {
			if (str.startsWith('<')) {
				console.warn("implement adding html");
			} else {
				if (!/^[a-zA-Z]+:\/\//.test(str)) str = 'https://' + str;
				const anchor = document.createElement("a");
				anchor.setAttribute("href", str);
				const href = anchor.href;
				asset = await fetch("./assets", {
					method: "post",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						url: href
					})
				}).then(res => res.json());
			}
			this.zone.textContent = this.zone.placeholder;
		} catch (err) {
			this.zone.parentNode.classList.add("error");
		}
		this.zone.disabled = false;
		this.zone.parentNode.classList.remove('loading');
		return asset;
	}
}
