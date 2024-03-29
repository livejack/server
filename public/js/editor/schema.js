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
				let url = dom.getAttribute('src');
				if (url && url.startsWith('//')) url = 'https:' + url;
				const width = dom.getAttribute('width');
				const height = dom.getAttribute('height');
				return { url, width, height };
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
			tag: 'opta-widget,opta',
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
				let caption = dom.querySelector('figcaption');
				if (caption) {
					let author = caption.lastElementChild;
					if (author) {
						caption = caption.cloneNode(true);
						caption.removeChild(author);
						author = author.textContent.trim();
					}
					const title = caption.textContent.trim();
					if (title) attrs.title = title;
					if (title != author) attrs.author = author;
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
	}
};
const linkTpl = `<form is="edit-link" method="post" action="assets" class="asset">
<label>
	<input class="tiled" placeholder="Coller une URL..." value="[url]">
</label>
<div class="buttons hide">
	<button type="reset">Annuler</button>
	<button type="submit">Valider</button>
</div>
<live-asset data-type="link" data-url="[url]"></live-asset>
</form>`;

export const marks = {
	link: {
		inclusive: false,
		attrs: {
			url: {
				default: null
			}
		},
		parseDOM: [{
			tag: 'a',
			getAttrs(dom) {
				return {
					url: dom.getAttribute('href')
				};
			}
		}],
		toDOM({attrs}) {
			return ['a', { href: attrs.url || "#" }, 0];
		},
		menu(menu, view, mark) {
			let form = menu.querySelector('form');
			if (!mark) {
				form?.remove();
				return;
			}
			if (!form) {
				form = view.dom.live.merge(linkTpl, mark.attrs);
				menu.append(form);
			}
			form.change = function (url) {
				const { tr } = view.state;
				let { from, to } = tr.selection;
				while (tr.doc.rangeHasMark(from - 1, from, mark)) from--;
				while (tr.doc.rangeHasMark(to, to + 1, mark)) to++;
				tr.removeMark(from, to, mark);
				const copy = mark.type.create(Object.assign({}, mark.attrs, { url }));
				tr.addMark(from, to, copy);
				const sel = tr.selection.constructor.fromJSON(tr.doc, {
					type: 'text',
					anchor: to,
					head: to
				});
				tr.setSelection(sel);
				view.dispatch(tr);
				view.focus();
			};
			const url = mark.attrs.url || "";
			form.set?.(url);
			const asset = form.querySelector('live-asset');
			if (asset) {
				asset.dataset.url = url;
				asset.update();
			}
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
