const observer = new IntersectionObserver((entries, observer) => {
	entries.forEach((entry) => {
		var target = entry.target;
		var ratio = entry.intersectionRatio || 0;
		if (ratio <= 0) return;
		observer.unobserve(target);
		target.reveal();
	});
}, {
	threshold: [0.0001, 0.2],
	rootMargin: "30px"
});

export class LiveAsset extends HTMLElement {
	static ratio(w, h) {
		const width = parseInt(w);
		const height = parseInt(h);

		if (Number.isNaN(width) || Number.isNaN(height)) return null;
		const ratio = 100 * width / height;

		const pair = [[21, 9], [2, 1], [16, 9], [16, 10], [3, 2], [4, 3], [1, 1], [9, 16]]
			.find(([a, b]) => {
				const r = ratio / a * b;
				return 99 <= r;
			});
		if (!pair) return null;
		return `${pair[0]}-${pair[1]}`;
	}
	connectedCallback() {
		this.populate();
		observer.observe(this);
	}
	disconnectedCallback() {
		observer.unobserve(this);
	}
	populate() {
		if (this.children.length) return;
		const { url } = this.dataset;
		const {
			type, html, script,
			width, height
		} = Object.assign(url && this.live.get(url) || {}, this.dataset);

		if (type == "image") {
			this.appendChild(this.live.merge(`<figure itemscope="" itemprop="associatedMedia image" itemtype="http://schema.org/ImageObject">
				<meta itemprop="width" content="[width]">
				<meta itemprop="height" content="[height]">
				<meta itemprop="url" content="[url]">
				<img width="[width]" height="[height]" style="max-width:[width|orAt:*]px" />
				<figcaption><span>[title|orAt:*]</span><em>[author|orAt:*]</em></figcaption>
			</figure>`, Object.assign({}, { width, height }, this.dataset)));
		} else if (type == "picto") {
			this.dataset.ratio = '1-1';
			this.insertAdjacentHTML('afterbegin', `<img />`);
		} else {
			if (width && height) {
				const ratio = LiveAsset.ratio(width, height);
				if (ratio) this.dataset.ratio = ratio;
			}
			if (script) this.dataset.script = script;
			if (html) {
				this.dataset.html = html;
			} else {
				this.insertAdjacentHTML('afterbegin', '<iframe />');
			}
		}
	}
	reveal() {
		const { url, script, html } = this.dataset;
		if (html) {
			this.textContent = '';
			this.appendChild(this.live.merge(html, {}));
			this.querySelectorAll('script:not([src])').forEach(node => {
				const copy = document.createElement('script');
				copy.textContent = node.textContent;
				node.parentNode.replaceChild(copy, node);
			});
		} else if (url) {
			this.querySelector('img,iframe').src = url;
		}
		if (script && !document.head.querySelector(`script[src="${script}"]`)) {
			const copy = document.createElement('script');
			copy.setAttribute('src', script);
			copy.setAttribute('defer', '');
			document.head.appendChild(copy);
		}
	}
}

export class LiveIcon extends HTMLElement {
	connectedCallback() {
		this.populate();
		observer.observe(this);
	}
	disconnectedCallback() {
		observer.unobserve(this);
	}
	populate() {
		if (this.children.length) return;
		this.dataset.ratio = '1-1';
		this.insertAdjacentHTML('afterbegin', `<img />`);
	}
	reveal() {
		this.querySelector('img').src = this.dataset.url;
	}
}
