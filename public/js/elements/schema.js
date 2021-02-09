export const nodes = {
	doc: {
		content: "block+"
	},

	paragraph: {
		content: "inline*",
		group: "block",
		parseDOM: [{ tag: "p" }],
		toDOM() { return ["p", 0]; }
	},

	blockquote: {
		content: "block+",
		group: "block",
		defining: true,
		parseDOM: [{ tag: "blockquote" }],
		toDOM() { return ["blockquote", 0]; }
	},

	text: {
		group: "inline"
	},

	asset: {
		group: "block",
		defining: true,
		draggable: true,
		attrs: {
			url: {
				default: null
			},
			ratio: {
				default: null
			},
			title: {
				default: null
			},
			html: {
				default: null
			}
		},
		parseDOM: [{
			tag: 'live-asset',
			getAttrs(dom) {
				return {
					url: dom.dataset.url,
					title: dom.dataset.title,
					ratio: dom.dataset.ratio,
					html: dom.dataset.html
				};
			}
		}],
		toDOM(node) {
			const data = {};
			for (let key in node.attrs) data['data-' + key] = node.attrs[key];
			return ["live-asset", data];
		}
	},

	hard_break: {
		inline: true,
		group: "inline",
		selectable: false,
		parseDOM: [{ tag: "br" }],
		toDOM() { return ["br"]; }
	}
};

export const marks = {
	link: {
		attrs: {
			href: {}
		},
		inclusive: false,
		parseDOM: [{
			tag: "a[href]",
			getAttrs(dom) {
				return {
					href: dom.getAttribute("href")
				};
			}
		}],
		toDOM(node) {
			let { href } = node.attrs;
			return ["a", { href }, 0];
		}
	},

	em: {
		parseDOM: [{ tag: "i" }, { tag: "em" }, { style: "font-style=italic" }],
		toDOM() { return ["em", 0]; }
	},

	strong: {
		parseDOM: [
			{ tag: "strong" },
			// This works around a Google Docs misbehavior where
			// pasted content will be inexplicably wrapped in `<b>`
			// tags with a font-weight normal.
			{
				tag: "b",
				getAttrs: node => node.style.fontWeight != "normal" && null
			},
			{
				style: "font-weight",
				getAttrs: value => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null
			}
		],
		toDOM() { return ["strong", 0]; }
	}
};


