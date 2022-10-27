export class LiveAsset extends HTMLElement {
	static observer;
	static async init() {
		LiveAsset.observer = new IntersectionObserver((entries, observer) => {
			for (const entry of entries) {
				const target = entry.target;
				const ratio = entry.intersectionRatio || 0;
				if (ratio <= 0) continue;
				observer.unobserve(target);
				target.reveal();
			}
		}, {
			threshold: [0.0001, 0.2],
			rootMargin: "30px"
		});
	}
	static ratio(w, h) {
		const width = parseInt(w);
		const height = parseInt(h);

		if (Number.isNaN(width) || Number.isNaN(height)) return null;
		const ratio = 100 * width / height;

		const pair = [[21, 9], [2, 1], [16, 9], [16, 10], [3, 2], [4, 3], [1, 1], [9, 16]]
			.find(([a, b]) => {
				const r = ratio / a * b;
				return r >= 99;
			});
		if (!pair) return null;
		return `${pair[0]}-${pair[1]}`;
	}
	connectedCallback() {
		this.update();
		LiveAsset.observer.observe(this);
	}
	disconnectedCallback() {
		LiveAsset.observer.unobserve(this);
	}
	update() {
		if (this.children.length) return;
		const { url } = this.dataset;
		const {
			type, html, script,
			width, height
		} = Object.assign(url && this.live.get(url) || {}, this.dataset);

		if (type == "image") {
			this.appendChild(this.live.merge(`<figure class="fig-media" itemscope="" itemprop="associatedMedia image" itemtype="http://schema.org/ImageObject">
				<meta itemprop="width" content="[width]">
				<meta itemprop="height" content="[height]">
				<meta itemprop="url" content="[url]">
				<img width="[width]" height="[height]" style="max-width:[width|else:at:-]px" />
				<figcaption class="fig-media__legend">[title] <span class="fig-media__credits">[author|else:at:*]</span></figcaption>
			</figure>`, Object.assign({}, { width, height }, this.dataset)));
		} else if (type == "picto") {
			this.dataset.ratio = '1-1';
			this.insertAdjacentHTML('afterbegin', `<img />`);
		} else {
			let ratio;
			if (width && height) {
				ratio = LiveAsset.ratio(width, height);
			}
			if (script) this.dataset.script = script;
			if (html) {
				this.dataset.html = html;
			} else {
				if (!ratio && !height) ratio = "16-9";
				this.insertAdjacentHTML('afterbegin', '<iframe />');
			}
			if (ratio) this.dataset.ratio = ratio;
		}
	}
	reveal() {
		const { url, script, html, width, height } = this.dataset;
		const doc = this.ownerDocument;
		if (html) {
			this.textContent = '';
			this.appendChild(this.live.merge(html.trim()));
		} else if (url) {
			this.querySelector('img,iframe').src = url;
		}
		if (script) {
			const once = html && html.startsWith('<') && /^<\w+-\w+/.test(html);
			if (!once || !doc.querySelector(`script[src="${script}"]`)) {
				this.insertAdjacentHTML('beforeEnd', '<script defer=""></script>');
				this.lastElementChild.setAttribute('src', script);
			}
		}
		if (!width && height && !this.dataset.ratio) {
			const iframe = this.querySelector('iframe');
			if (iframe) iframe.height = height;
		}

		for (const node of this.querySelectorAll('script')) {
			const copy = doc.createElement('script');
			copy.textContent = node.textContent;
			for (const att of node.attributes) {
				copy.setAttribute(att.name, att.value);
			}
			copy.onerror = () => {
				copy.parentNode?.removeChild(copy);
			};
			node.parentNode.replaceChild(copy, node);
		}
	}
}

export class LiveIcon extends HTMLElement {
	connectedCallback() {
		this.update();
		LiveAsset.observer.observe(this);
	}
	disconnectedCallback() {
		LiveAsset.observer.unobserve(this);
	}
	update() {
		if (this.children.length) return;
		this.dataset.ratio = '1-1';
		this.insertAdjacentHTML('afterbegin', `<img />`);
	}
	reveal() {
		this.querySelector('img').src = this.dataset.url;
	}
}
