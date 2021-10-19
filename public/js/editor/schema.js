import { createView } from './views.js';

export const nodes = {
	doc: {
		content: "empty block+"
	},

	empty: {
		// work around
		// https://bugs.chromium.org/p/chromium/issues/detail?id=1233054
		// however prosemirror may try to implement it
		// https://github.com/ProseMirror/prosemirror/issues/1191
		atom: true,
		selectable: false,
		parseDOM: [{ tag: "x-empty" }],
		toDOM() { return ["x-empty"]; }
	},

	paragraph: {
		content: "inline*",
		group: "block",
		parseDOM: [{ tag: "p" }],
		toDOM() { return ["p", 0]; }
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
			script: {
				default: null
			},
			width: {
				default: null
			},
			height: {
				default: null
			},
			title: {
				default: null
			},
			author: {
				default: null
			},
			html: {
				default: null
			}
		},
		parseDOM: [{
			tag: 'live-asset',
			getAttrs(dom) {
				return Object.assign({}, dom.dataset);
			}
		}, {
			tag: 'iframe[src]',
			getAttrs(dom) {
				return {
					url: dom.src
				};
			}
		}, {
			tag: 'blockquote.twitter-tweet',
			getAttrs(dom) {
				const node = dom.lastElementChild;
				if (node && node.nodeName == "A") return {
					url: node.href
				};
			}
		}, {
			tag: 'opta',
			getAttrs(dom) {
				return {
					html: dom.outerHTML
				};
			}
		}, {
			tag: 'figure',
			getAttrs(dom) {
				const srcNode = dom.querySelector('img,iframe');
				if (!srcNode || !srcNode.src) return false;
				const attrs = {
					url: srcNode.src
				};
				const caption = dom.querySelector('figcaption');
				if (caption) {
					const title = caption.firstChild;
					const author = caption.lastChild;
					if (title) {
						if (title.nodeType == Node.TEXT_NODE) attrs.title = title.nodeValue;
						else attrs.title = title.textContent;
					}
					if (author && author != title) {
						if (author.nodeType == Node.TEXT_NODE) attrs.author = author.nodeValue;
						else attrs.author = author.textContent;
					}
				}
				return attrs;
			}
		}],
		toDOM(node) {
			const data = {};
			for (const key in node.attrs) {
				const val = node.attrs[key];
				if (val) data['data-' + key] = val;
			}
			return ["live-asset", data];
		},
		View: createView('live-asset')
	},

	hard_break: {
		inline: true,
		group: "inline",
		selectable: false,
		parseDOM: [{ tag: "br" }],
		toDOM() { return ["br"]; }
	},

	link: {
		inline: true,
		group: "inline",
		atom: true,
		attrs: {
			title: {
				default: null
			},
			url: {
				default: null
			}
		},
		parseDOM: [{
			tag: 'a',
			getAttrs(dom) {
				return {
					url: dom.getAttribute('href'),
					title: dom.textContent
				};
			}
		}],
		toDOM(node) {
			const { url, title } = node.attrs;
			const dom = document.createElement('a');
			dom.setAttribute('href', url);
			dom.textContent = title;
			return dom;
		},
		View: createView('a', 'edit-anchor')
	}
};

export const marks = {
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
	},

	sup: {
		parseDOM: [{ tag: "sup" }, { style: "vertical-align=super" }],
		toDOM() { return ["sup", 0]; }
	},

	sub: {
		parseDOM: [{ tag: "sub" }, { style: "vertical-align=sub" }],
		toDOM() { return ["sub", 0]; }
	}
};


export const icons = {
	doc: {
		content: "inline*"
	},
	text: {
		group: "inline"
	},
	icon: {
		inline: true,
		group: "inline",
		draggable: true,
		attrs: {
			url: {
				default: null
			}
		},
		parseDOM: [{
			tag: 'live-icon',
			getAttrs(dom) {
				return {
					url: dom.getAttribute('data-url')
				};
			}
		}, {
			tag: 'img',
			getAttrs(dom) {
				return {
					url: dom.getAttribute('src')
				};
			}
		}],
		toDOM(node) {
			return ["live-icon", {
				"data-url": node.attrs.url
			}];
		}
	}
};
