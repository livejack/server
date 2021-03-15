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

	title: {
		content: "text*",
		isolating: true,
		inline: false,
		context: "asset/",
		marks: "",
		parseDOM: [{ tag: "span" }],
		toDOM(node) {
			return ["span", 0];
		}
	},

	author: {
		content: "text*",
		isolating: true,
		inline: false,
		context: "asset/",
		marks: "",
		parseDOM: [{ tag: "em" }],
		toDOM(node) {
			return ["em", 0];
		}
	},

	/*
	<figure itemscope="" itemprop="associatedMedia image" itemtype="http://schema.org/ImageObject">
	<meta itemprop="height" content="300">
	<meta itemprop="width" content="533">
	<meta itemprop="url" content="https://i.f1g.fr/media/_uploaded/804x/figaro-live/lefigaro.fr/775031f2-fbd2-11ea-8ff0-a0369f91f304/coulibaly.jpg">
	<img src="https://i.f1g.fr/media/_uploaded/804x/figaro-live/lefigaro.fr/775031f2-fbd2-11ea-8ff0-a0369f91f304/coulibaly.jpg" class="">
	<figcaption>
	<span>Amedy Coulibaly </span><em>Frédérick Lopez - Le Figaro</em>
	</figcaption></figure>

	<figure class="fig-media fig-media--type-photo">
		<div class="fig-lazy fig-lazy--16-9 fig-lazy--transparent">
			<img sizes="(min-width: 64em) 616px, (min-width: 48em) and (max-width: 63.99em) 704px, 100vw" class="fig-media-photo fig-lazy--complete" alt="" srcset="https://i.f1g.fr/media/eidos/414x233_cropupscale/2021/02/24/XVM7224cf04-76d2-11eb-8b9f-57fcae1a7c95.jpg 414w, https://i.f1g.fr/media/eidos/616x347_cropupscale/2021/02/24/XVM7224cf04-76d2-11eb-8b9f-57fcae1a7c95.jpg 616w, https://i.f1g.fr/media/eidos/704x396_cropupscale/2021/02/24/XVM7224cf04-76d2-11eb-8b9f-57fcae1a7c95.jpg 704w">
		</div>
		<figcaption class="fig-media__legend">
		Emmanuel Macron pendant une réunion à l’Élysée, début février.
		<span class="fig-media__credits"> POOL/REUTERS</span>
		</figcaption></figure>
	*/
	/*
- les images sont reproduites par live-asset
- les iframes aussi, avec url et script (si besoin)
- les embeds lefigaro-video, dugout, be-op sont souvent un peu comme des iframes
c'est à dire un tag, quelques attributs, une url et un script éventuellement
- les tweets contiennent du contenu html et un script



On va donc faire ceci avec les attributs:
- width, height, url, title, author, script, html

Si html == image ou html == iframe, on utilise un modèle,
sinon on insère directement le html.

Dans tous les cas on conserve:
- width, height, url, script

Pour image on conserve en plus title, author.

En fait les articles ne doivent conserver que <live-asset data-url>
et retrouver les données à partir de là.
Au moment du prérendu, le contenu est récupéré auprès des assets.json,
et live-asset remplit soit avec le prérendu fait pour les assets,
soit avec ce qui est énoncé plus haut.

Chaque message doit être relié à la liste des assets qu'il utilise.

messages
assets
messages_assets


	*/
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
