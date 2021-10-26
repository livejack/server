import req from "../req.js";
import { LiveAsset } from "./live-asset.js";

const searchTemplate = `<div class="header">
	<span class="favicon">🔍</span>
	<a href="url" class="title">[url]</a>
</div>`;
const iframeTemplate = `<div class="header">
	<span class="favicon">❮❯</span>
	<a class="title">Embed HTML</a>
	<button name="preview">⯆</button>
	<button name="del">✕</button>
</div>
<iframe class="content" sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>`;
const codeTemplate = `<div class="header">
<span class="favicon">❮❯</span>
<a class="title">Embed HTML</a>
<button name="preview">⯈</button>
<button name="del">✕</button>
</div>
<code class="content">
	[html|as:text]
	<span><br>&lt;script src="[script|else:at:*]"&gt;&lt;/script&gt;</span>
</code>`;

const assetTemplate = `<div class="header" title="[meta.site]">
	<img src="[meta.icon|else:at:*]" class="favicon" />
	<a href="[url|else:at:-]" class="title">[meta.title]</a>
	<button name="save">🗘</button>
	<button name="preview">⯈</button>
	<button name="del">✕</button>
</div>
<div class="meta">
	<p>
		<strong>[type]</strong>
		<em>[meta.date|else:get:date|date:date]</em>
		<span><br>[meta.author|or:&nbsp;]</span>
	</p>
	<p>[meta.description|else:at:*]</p>
</div>
<div class="thumbnail">
	<img src="[meta.thumbnail|else:at:**]" />
</div>
<form class="asset" data-type="[type|eq:image|prune:*]" autocomplete="off" draggable="false">
	<label>
		<span>Titre</span>
		<input name="title" value="[title]">
	</label>
	<label>
		<span>Auteur</span>
		<input name="author" value="[author]">
	</label>
</form>`;
const assetPreviewTemplate = `<div class="header" title="[meta.site]">
	<img src="[meta.icon|else:at:*]" class="favicon" />
	<a href="[url]" class="title">[meta.title]</a>
	<button name="preview">⯆</button>
	<button name="del">✕</button>
</div>
<iframe class="content" sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>`;

const docTemplate = `<html>
	<head>
		<style>html,body {margin:0;overflow:hidden;}</style>
	</head>
	<body>
		<div class="live-messages live-message"></div>
	</body>
</html>`;

export default class EditAsset extends LiveAsset {
	#editable
	#watchFrame
	#added
	#preview
	connectedCallback() {
		super.connectedCallback();
		this.addEventListener('click', this);
		this.addEventListener('dragstart', this);
		this.addEventListener('dragend', this);
		this.addEventListener('mousedown', this);
		this.addEventListener('mouseup', this);
		this.addEventListener('mousemove', this);
		this.addEventListener('mouseleave', this);
		this.#editable = Boolean(this.closest(".live-article"));
	}
	disconnectedCallback() {
		this.removeEventListener('click', this);
		this.removeEventListener('dragstart', this);
		this.removeEventListener('dragend', this);
		this.removeEventListener('mousedown', this);
		this.removeEventListener('mouseup', this);
		this.removeEventListener('mousemove', this);
		this.removeEventListener('mouseleave', this);
		if (this.#watchFrame) {
			clearInterval(this.#watchFrame);
			this.#watchFrame = null;
		}
		super.disconnectedCallback();
	}

	handleEvent(e) {
		if (e.type == "dragstart") {
			if (!this.closest('.live-message')) {
				e.preventDefault();
			} else {
				EditAsset.dragImage = document.createElement("div");
				EditAsset.dragImage.innerText = this.querySelector('.header > a').textContent;
				EditAsset.dragImage.className = 'handle';
				document.body.appendChild(EditAsset.dragImage);
				this.classList.add('dragging');
				e.dataTransfer.setDragImage(EditAsset.dragImage, 0, 0);
			}
		} else if (e.type == "dragend") {
			this.classList.remove('dragging');
			if (EditAsset.dragImage) document.body.removeChild(EditAsset.dragImage);
		} else if (e.type == "click") {
			if (e.target.name == "save") {
				e.stopPropagation();
				this.save();
			} else if (e.target.name == "del") {
				e.stopPropagation();
				this.del();
			} else if (e.target.closest('a[href]')) {
				e.preventDefault();
			} else if (e.target.matches('label > span')) {
				e.target.nextElementSibling.select();
			} else if (e.target.name == "preview") {
				e.stopPropagation();
				e.preventDefault();
				this.#preview = !this.#preview;
				this.update();
				this.reveal();
			}
		} else if (e.type == "mousemove") {
			this.classList.toggle('ctrl', !this.#editable && e.ctrlKey);
		} else if (e.type == "mouseleave") {
			this.classList.remove('ctrl');
		} else if (e.type == "mousedown") {
			if (e.target.closest('form')) this.draggable = false;
		} else if (e.type == "mouseup") {
			this.draggable = true;
		}
	}
	del() {
		if (this.#editable) {
			this.parentNode.removeChild(this);
		} else {
			return req("./assets/" + this.dataset.id, "delete");
		}
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
			this.update();
		} else {
			this.remove();
		}
	}

	update() {
		const { url, type } = this.dataset;
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
		let tpl;
		if (url) {
			if (this.#preview) tpl = assetPreviewTemplate;
			else tpl = assetTemplate;
		} else if (type == "link") {
			tpl = null;
		} else if (this.#preview) {
			tpl = iframeTemplate;
		} else {
			tpl = codeTemplate;
		}

		const frag = this.cloneNode(false);
		if (tpl) {
			const node = this.live.merge(tpl, data);
			frag.appendChild(node);
		}
		this.live.patchDOM(this, frag);
	}
	reveal() {
		if (!this.#preview) return;
		const iframe = this.lastElementChild;
		iframe.onload = () => {
			const doc = iframe.contentDocument;
			// get read.css
			doc.head.appendChild(
				doc.importNode(document.head.querySelector('link[rel="stylesheet"]'))
			);
			const liveAsset = doc.importNode(document.createElement('live-asset'));
			Object.assign(liveAsset.dataset, this.dataset);
			doc.body.firstElementChild.appendChild(liveAsset);
			liveAsset.live = this.live;
			LiveAsset.prototype.update.call(liveAsset);
			LiveAsset.prototype.reveal.call(liveAsset);

			this.#watchFrame = setInterval(() => {
				const iframe = this.lastElementChild;
				if (!iframe || iframe.nodeName != "IFRAME" || !iframe.contentDocument.documentElement) {
					clearInterval(this.#watchFrame);
					this.#watchFrame = null;
				} else if (iframe.contentDocument) {
					const h = iframe.contentDocument.documentElement.scrollHeight;
					iframe.style.height = h + 'px';
				}
			}, 100);
		};
		iframe.srcdoc = docTemplate;
	}
}
