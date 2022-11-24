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
		const data = Object.assign(url && this.live.get(url) || {}, this.dataset);
		const {
			type, html, script, width, height
		} = data;

		if (type == "image") {
			this.appendChild(this.live.merge(`<figure class="fig-media" itemscope="" itemprop="associatedMedia image" itemtype="http://schema.org/ImageObject">
				<meta itemprop="width" content="[width]">
				<meta itemprop="height" content="[height]">
				<meta itemprop="url" content="[url]">
				<img width="[width]" height="[height]" style="max-width:[width|else:at:-]px" />
				<figcaption class="fig-media__legend">[title] <span class="fig-media__credits">[author|else:at:*]</span></figcaption>
			</figure>`, data));
		} else if (type == "picto") {
			this.appendChild(
				this.live.merge('<img width="[width|or:64]" height="[height|or:64]" />', data)
			);
		} else {
			if (script) this.dataset.script = script;
			if (html) {
				this.dataset.html = html;
				if (width) this.dataset.width = width;
				if (height) this.dataset.height = height;
			} else {
				this.appendChild(
					this.live.merge('<iframe width="[width]" height="[height]" />', data)
				);
			}
		}
	}
	reveal() {
		const { url, script, html, width, height } = this.dataset;
		const doc = this.ownerDocument;
		if (html) {
			this.textContent = '';
			this.appendChild(this.live.merge(html.trim()));
			const iframe = this.querySelector('iframe');
			if (iframe) {
				if (width) iframe.width = width;
				if (height) iframe.height = height;
			}
		} else if (url) {
			this.querySelector('img,iframe').src = url;
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
		if (script) {
			const once = html && html.startsWith('<') && /^<\w+-\w+/.test(html);
			const target = once ? doc.head : this;

			if (!once || !doc.querySelector(`script[src="${script}"]`)) {
				const node = target.appendChild(doc.createElement('script'));
				node.setAttribute('defer', '');
				node.setAttribute('src', script);
			}
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
		this.appendChild(
			this.live.merge('<img width="[width|or:64]" height="[height|or:64]" />', this.dataset)
		);
	}
	reveal() {
		this.querySelector('img').src = this.dataset.url;
	}
}
