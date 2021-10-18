import req from "../req.js";

const searchTemplate = `<div class="header">
	<span class="favicon">🔍</span>
	<a href="url">[url]</a>
</div>`;

const linkTemplate = `<div class="header"><img src="[meta.icon|else:at:*]" class="favicon" />
	<span class="title">[meta.title]</span>
	<button name="preview">⯈</button>
	<button name="del">✕</button>
</div>
<form class="asset" autocomplete="off" draggable="false">
	<label>
		<span>Titre</span>
		<input name="title" value="[title]">
	</label>
	<label>
		<span>URL</span>
		<input name="url" value="[url]">
	</label>
</form>`;

export default class EditAnchor extends HTMLAnchorElement {
	#added
	#preview
	constructor() {
		super();
		this.setAttribute('is', 'edit-anchor');
	}
	connectedCallback() {
		this.addEventListener('click', this);
		this.populate();
	}
	disconnectedCallback() {
		this.removeEventListener('click', this);
	}

	handleEvent(e) {
		if (e.type == "click") {
			e.preventDefault();
			if (e.target.name == "save") {
				e.stopPropagation();
				this.save();
			} else if (e.target.name == "del") {
				e.stopPropagation();
				this.del();
			}
		}
	}
	del() {
		this.parentNode.removeChild(this);
	}
	save() {
		return req("./assets/" + this.dataset.id, "put", { url: this.dataset.url });
	}
	get favicon() {
		const img = this.querySelector('.header > img');
		if (img) return img.src;
		else return null;
	}
	async add(url) {
		if (this.#added) return;
		let asset = this.live.get(url);
		if (!asset) {
			this.#added = true;
			this.appendChild(this.live.merge(searchTemplate, {url}));
			try {
				asset = await document.querySelector('form[is="edit-paste"]').create(url);
				this.live.set(asset);
			} catch (err) {
				console.error(err);
			}
			this.textContent = '';
		}
		if (asset) {
			delete this.dataset.html;
			// keep dataset.script
			this.dataset.url = url;
			this.populate();
		} else {
			this.remove();
		}
	}

	populate() {
		const url = this.dataset.url;
		const data = {};
		if (url) {
			const asset = this.live.get(url);
			if (!asset) {
				if (this.parentNode && this.parentNode.isContentEditable) {
					return this.add(url);
				}
			} else {
				Object.assign(data, asset);
			}
		}
		Object.assign(data, this.dataset);
		if (this.#preview) {
			this.classList.remove('asset');
			this.textContent = data.title;
			this.setAttribute('href', data.url);
		} else {
			this.classList.add('asset');
			const node = this.live.merge(linkTemplate, data);
			this.textContent = '';
			this.appendChild(node);
		}
	}
}
