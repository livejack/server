import req from "../req.js";
import { LiveAsset } from "./live-asset.js";
import { DiffDOM } from "../../modules/diff-dom";

function updateDOM(from, to) {
	const dd = new DiffDOM();
	dd.apply(from, dd.diff(from, to));
}

let dragImage;
const searchTemplate = `<div class="header">
	<span class="favicon">🔍</span>
	<a href="url">[url]</a>
</div>`;
const iframeTemplate = `<div class="header">
	<span class="favicon">❮❯</span>
	<a>[title]</a>
	<button name="del">✕</button>
</div>
<iframe class="content" sandbox="allow-scripts allow-same-origin"></iframe>`;

const assetTemplate = `<div class="header" title="[meta.site]">
	<img src="[meta.icon|orAt:*]" class="favicon" />
	<a href="[url]">[meta.title]</a>
	<button name="save">🗘</button>
	<button name="del">✕</button>
</div>
<div class="meta">
	<p>
		<strong>[type]</strong>
		<em>[meta.date|else:get:date|date:date]</em>
		<span><br>[meta.author|or:&nbsp;]</span>
	</p>
	<p>[meta.description|orAt:*]</p>
</div>
<div class="thumbnail">
	<img src="[meta.thumbnail|orAt:**]" />
</div>
<form data-type="[type|eq:image|ifAt:*]" autocomplete="off" draggable="false">
	<label>
		<span>Title</span>
		<input name="title" value="[title]">
	</label>
	<label>
		<span>Author</span>
		<input name="author" value="[author]">
	</label>
</form>`;

const docTemplate = `<html>
<head>
	<style>html,body {margin:0;}</style>
	<script src="[script|orAt:*]" defer></script>
</head>
<body>[html|as:html]</body>
</html>`;

export default class EditAsset extends LiveAsset {
	#editable
	#watchFrame
	#adding
	connectedCallback() {
		super.connectedCallback();
		this.addEventListener('click', this);
		this.addEventListener('dragstart', this);
		this.addEventListener('dragend', this);
		this.addEventListener('mousedown', this);
		this.addEventListener('mouseup', this);
		this.addEventListener('mousemove', this);
		this.addEventListener('mouseleave', this);
		this.#editable = !!this.closest(".live-article");
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
				dragImage = document.createElement("div");
				dragImage.innerText = this.querySelector('.header > a').textContent;
				dragImage.className = 'handle';
				document.body.appendChild(dragImage);
				this.classList.add('dragging');
				e.dataTransfer.setDragImage(dragImage, 0, 0);
			}
		} else if (e.type == "dragend") {
			this.classList.remove('dragging');
			if (dragImage) document.body.removeChild(dragImage);
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
		if (this.#adding) return;
		let asset = this.live.get(url);
		if (!asset) {
			this.#adding = true;
			this.appendChild(this.live.merge(searchTemplate, {url}));
			try {
				asset = await document.querySelector('form[is="edit-paste"]').create(url);
				this.live.set(asset);
				this.#adding = false;
			} catch (err) {
				console.error(err);
			}
			this.textContent = '';
		}
		if (asset) {
			this.dataset.url = url;
			this.populate();
		} else {
			this.remove();
		}
	}
	findUrl() {
		const dom = this.live.merge('<div>[html|as:html]</div>', this.dataset);
		let wid = dom.querySelector('blockquote.twitter-tweet');
		if (wid) {
			const node = wid.lastElementChild;
			if (node && node.matches('a')) {
				return node.protocol + '//' + node.host + node.pathname;
			} else {
				return;
			}
		}
		wid = dom.querySelector('iframe');
		if (wid) return wid.src;
	}

	populate() {
		let url = this.dataset.url;
		if (!url && this.dataset.html) {
			url = this.findUrl();
			if (url) this.dataset.url = url;
		}
		const data = {};
		if (url) {
			const asset = this.live.get(url);
			if (!asset) {
				delete this.dataset.html;
				return this.add(url);
			}
			Object.assign(data, asset);
		}
		Object.assign(data, this.dataset);
		const node = this.live.merge(url ? assetTemplate : iframeTemplate, data);
		const frag = this.cloneNode(false);
		frag.appendChild(node);
		updateDOM(this, frag);
	}
	reveal() {
		if (this.#adding) return;
		const { url, script, html } = this.dataset;
		if (url || !html && !script) return;
		const iframe = this.lastElementChild;
		if (!iframe || iframe.nodeName != "IFRAME") return;
		const doc = this.live.merge(docTemplate, { html, script });
		if (iframe.srcdoc == doc.outerHTML) return;
		iframe.srcdoc = doc.outerHTML;
		this.#watchFrame = setInterval(() => {
			const h = iframe.contentDocument.documentElement.scrollHeight;
			iframe.style.height = h + 'px';
		}, 1000);
	}
}

