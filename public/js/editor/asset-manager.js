export default class AssetManager {
	constructor() {
		this.root = document.body.querySelector('[data-live="assets"]');
		this.root.addEventListener('click', this);
		this.zone = this.root.querySelector('textarea');
		this.zone.addEventListener('paste', this);
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
				if (this.resolve) this.resolve(asset.dataset);
				this.open(asset);
			}
		} else if (e.type == "paste") {
			const str = (e.clipboardData || window.clipboardData).getData('text');
			if (str) {
				const result = await this.add(str);
				if (result && this.resolve) this.resolve(result);
			}
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
				resolve(data);
			};
		}
		return p;
	}
	async open(asset, data = {}) {
		this.asset = asset;

	}
	close() {
		delete this.asset;
	}
	del() {

	}
	async add(str) {
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
			this.zone.value = "";
		} catch (err) {
			this.zone.parentNode.classList.add("error");
		}
		this.zone.disabled = false;
		this.zone.parentNode.classList.remove('loading');
		return asset;
	}
}
