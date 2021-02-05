import SlimSelect from "../../modules/slim-select";
export default class AssetManager {
	constructor() {
		this.root = document.body.querySelector('[data-live="assets"]');
		this.select = new SlimSelect({
			select: this.root.querySelector('.filter[name="type"]'),
			allowDeselect: true,
			showSearch: false
		});
	}
	async handleEvent(e) {
		if (e.type == "click") {
			const asset = e.target.closest('[is="edit-asset"]');
			if (asset) {
				if (this.resolve) {
					const meta = Object.assign({}, asset.dataset);
					meta.url = asset.href;
					this.resolve(meta);
				} else {
					this.open(asset);
				}
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
}
