import {
	keymap,
	history,
	baseKeymap,
	EditorState,
	dropCursor,
	gapCursor,
	EditorView,
	Schema, DOMParser, DOMSerializer,
	addListNodes
} from "../../modules/@livejack/prosemirror";

import { HTML as parseHTML } from "../../modules/matchdom";

import { menuBar } from "./menubar.js";
import { buildMenuItems } from "./menuitems.js";
import { buildKeymap } from "./keymap.js";
import { buildInputRules } from "./inputrules.js";

function getPlugins({schema, menu}) {
	let plugins = [
		buildInputRules(schema),
		keymap(buildKeymap(schema)),
		keymap(baseKeymap),
		dropCursor(),
		gapCursor(),
		history()
	];
	if (menu !== false) {
		plugins.push(menuBar({
			content: buildMenuItems(schema).fullMenu
		}));
	}
	return plugins;
}

export class Editor extends EditorView {
	#serializer
	#parser
	#content
	constructor(place, { nodes, marks, list, menu, assets = [] }) {
		const baseSchema = new Schema({ nodes, marks });
		let specNodes = baseSchema.spec.nodes;
		if (list) specNodes = addListNodes(specNodes, "paragraph+", "block");
		const schema = new Schema({
			nodes: specNodes,
			marks: baseSchema.spec.marks
		});
		const parser = DOMParser.fromSchema(schema);
		const copy = place.cloneNode(true);
		place.textContent = '';

		super({ mount: place }, {
			state: EditorState.create({
				doc: parser.parse(copy),
				plugins: getPlugins({ schema, menu })
			}),
			dispatchTransaction: (tr) => {
				if (tr.docChanged) {
					this.changed();
				}
				this.updateState(this.state.apply(tr));
			},
			domParser: parser,
			transformPastedHTML(str) {
				const frag = parseHTML(str);
				if (frag.matches && frag.matches('live-asset')) {
					return this.convertAsset(frag).outerHTML;
				}
				return str;
			}
		});
		this.#content = nodes.doc.content.replace('*', '');
		this.#parser = parser;
		this.#serializer = DOMSerializer.fromSchema(schema);
	}
	convertAsset(dom) {
		const empty = this.state.selection.empty;
		if (this.#content == "image" && dom.favicon) {
			return parseHTML(`<img src="${dom.favicon}">`);
		} else if (this.#content == "text" && dom.dataset.title) {
			return parseHTML(dom.dataset.title);
		} else if (dom.dataset.type == "link" || !empty) {
			return parseHTML(`<a href="${dom.dataset.url}">${dom.dataset.title}</a>`);
		} else return dom;
	}
	insertAsset(dom) {
		const frag = dom.ownerDocument.createDocumentFragment();
		frag.appendChild(this.convertAsset(dom).cloneNode(true));
		const node = this.#parser.parse(frag);
		const tr = this.state.tr;
		const sel = tr.selection;
		const marks = [];
		node.descendants((node) => {
			if (node.marks.length > 0) marks.push(...node.marks);
		});
		if (marks.length) {
			marks.forEach(mark => tr.addMark(sel.from, sel.to, mark));
		} else {
			tr.replaceSelectionWith(node);
		}
		this.dispatch(tr);
	}
	toDOM() {
		return this.#serializer.serializeFragment(this.state.doc.content);
	}
}
