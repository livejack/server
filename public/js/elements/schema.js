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

	image: {
		inline: true,
		attrs: {
			src: {},
			alt: { default: null },
			title: { default: null }
		},
		group: "inline",
		draggable: true,
		parseDOM: [{
			tag: "img[src]", getAttrs(dom) {
				return {
					src: dom.getAttribute("src"),
					title: dom.getAttribute("title"),
					alt: dom.getAttribute("alt")
				};
			}
		}],
		toDOM(node) {
			let { src, alt, title } = node.attrs;
			return ["img", { src, alt, title }];
		}
	},

	asset: {
		group: "block",
		defining: true,
		draggable: true,
		attrs: {
			url: {},
			ratio: {
				default: null
			},
			title: {
				default: null
			}
		},
		parseDOM: [{ // TODO add more logic for various asset types
			tag: "live-asset",
			getAttrs(dom) {
				return {
					url: dom.getAttribute("url"),
					title: dom.getAttribute("title"),
					ratio: dom.getAttribute("ratio")
				};
			}
		}],
		toDOM(node) {
			return ["live-asset", node.attrs];
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
			href: {},
			title: { default: null }
		},
		inclusive: false,
		parseDOM: [{
			tag: "a[href]", getAttrs(dom) {
				return {
					href: dom.getAttribute("href"),
					title: dom.getAttribute("title")
				};
			}
		}],
		toDOM(node) {
			let { href, title } = node.attrs;
			return ["a", { href, title }, 0];
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


