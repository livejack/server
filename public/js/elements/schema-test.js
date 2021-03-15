export const nodes = {
	image: {
		group: "block",
		defining: true,
		draggable: true,
		inline: false,
		marks: "",
		content: "title author",
		attrs: {
			url: {
				default: null
			},
			width: {
				default: null
			},
			height: {
				default: null
			}
		},
		parseDOM: [{
			tag: 'figure',
			getAttrs(dom) {
				const img = dom.querySelector('img');
				if (!img) return false;
				return {
					url: dom.dataset.url || img.src,
					width: img.width,
					height: img.height
				};
			},
			contentElement: 'figcaption'
		}, {
			tag: 'live-asset[data-type="image"]',
			getAttrs(dom) {
				return {
					url: dom.dataset.url,
					width: dom.dataset.width,
					height: dom.dataset.height
				};
			},
			contentElement(dom) {
				const doc = dom.ownerDocument;
				const cont = doc.createElement('figcaption');
				const title = doc.createElement('span');
				const author = doc.createElement('em');
				cont.appendChild(title);
				cont.appendChild(author);
				title.innerText = dom.dataset.title;
				author.innerText = dom.dataset.author;
				return cont;
			}
		}],
		toDOM(node) {
			const attrs = node.attrs;
			return [
				"figure",
				{ is: "live-image", "data-url": attrs.url },
				[
					"img",
					{ width: attrs.width, height: attrs.height },
				],
				[
					"figcaption", 0
				]
			];
		},
		View: class {
			constructor(node, view, getPos) {
				this.getPos = getPos;
				const doc = view.dom.ownerDocument;
				const dom = doc.createElement("figure", { is: "live-image" });
				dom.insertAdjacentHTML('afterBegin', `<img /><figcaption></figcaption>`);
				this.dom = dom;
				this.contentDOM = dom.lastElementChild;
				this.update(node);
				// prevents selection of non-editable content
				this.contentDOM.setAttribute("contenteditable", "true");
				this.dom.setAttribute("contenteditable", "false");
			}
			update(node) {
				const { url, width, height } = node.attrs;
				this.dom.dataset.url = url;
				const img = this.dom.querySelector('img');
				img.setAttribute('width', width);
				img.setAttribute('height', height);
				return true;
			}
			ignoreMutation(record) {
				if (record.target.closest('img')) return true;
			}
		}
	}
};
