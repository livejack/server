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
		}],
		toDOM(node) {
			const data = {};
			for (let key in node.attrs) {
				const val = node.attrs[key];
				if (val) data['data-' + key] = val;
			}
			return ["live-asset", data];
		},
		View: class {
			constructor(node, view, getPos) {
				this.node = node;
				this.view = view;
				this.getPos = getPos;
			}
			stopEvent(e) {
				if (e.target.nodeName == "INPUT") {
					if (e.type == "keyup" || e.type == "change") {
						const tr = this.view.state.tr;
						const attrs = Object.assign({}, this.node.attrs, {
							[e.target.name] : e.target.value
						});
						tr.setNodeMarkup(this.getPos(), null, attrs);
						this.view.dispatch(tr);
					}
					return true;
				}
			}
			update({ attrs }) {
				if (attrs.url !== this.node.attrs.url) return;
				this.node.attrs = attrs;
				const domPos = this.view.domAtPos(this.getPos());
				if (!domPos) return;
				const { node, offset } = domPos;
				const dom = node.childNodes[offset];
				if (!dom || dom.nodeName != "LIVE-ASSET") return;
				for (let key in attrs) {
					const val = attrs[key];
					if (val == null) delete dom.dataset[key];
					else dom.dataset[key] = val;
				}
				return true;
			}
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
