import {
	keymap,
	history,
	baseKeymap,
	EditorState,
	dropCursor,
	gapCursor,
	EditorView,
	Schema, DOMParser, DOMSerializer,
	addListNodes,
	Selection, TextSelection, NodeSelection
} from "../../modules/@livejack/prosemirror";

import { HTML as parseHTML } from "../../modules/matchdom";

import { menuBar } from "./menubar.js";
import { buildMenuItems } from "./menuitems.js";
import { buildKeymap } from "./keymap.js";
import { buildInputRules } from "./inputrules.js";
import nodeViewSelect from "./nodeviewselect.js";

function getPlugins({ schema, menu }) {
	let plugins = [
		buildInputRules(schema),
		keymap(buildKeymap(schema)),
		keymap(baseKeymap),
		dropCursor(),
		gapCursor(),
		nodeViewSelect(),
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
		const nodeViews = {};
		if (nodes) Object.keys(nodes).forEach(name => {
			if (nodes[name].View) nodeViews[name] = (node, view, getPos) => {
				return new nodes[name].View(node, view, getPos);
			};
		});
		if (marks) Object.keys(marks).forEach(name => {
			if (marks[name].View) nodeViews[name] = (node, view) => {
				return new marks[name].View(node, view);
			};
		});
		const baseSchema = new Schema({ nodes: Object.assign({}, nodes), marks });
		let specNodes = baseSchema.spec.nodes;
		if (list) specNodes = addListNodes(specNodes, "paragraph+", "block");
		const schema = new Schema({
			nodes: specNodes,
			marks: baseSchema.spec.marks
		});
		const parser = DOMParser.fromSchema(schema);

		super({ mount: place }, {
			state: EditorState.create({
				doc: parser.parse(place),
				plugins: getPlugins({ schema, menu })
			}),
			dispatchTransaction: (tr) => {
				if (tr.docChanged) {
					this.changed();
				}
				this.updateState(this.state.apply(tr));
			},
			nodeViews,
			domParser: parser,
			transformPastedHTML: (str) => {
				let frag = parseHTML(str);
				if (frag.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
					for (let i = frag.children.length - 1; i >= 0; i--) {
						if (frag.children[i].nodeName == "META") frag.removeChild(frag.children[i]);
					}
					if (frag.children.length == 1) frag = frag.children[0];
				}
				if (frag.matches && frag.matches('[data-url]')) {
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
		const sel = this.state.selection;
		if (this.#content == "inline") {
			if (dom.favicon) {
				dom = parseHTML(
					`<img data-url="${dom.favicon}" alt="${dom.dataset.title || ''}" />`
				);
			}
		} else if (this.#content == "text" && dom.dataset.title) {
			dom = parseHTML(
				`<span>${dom.dataset.title}</span>`
			);
		} else if (dom.dataset.type == "link" || !sel.empty && !sel.node) {
			dom = parseHTML(
				`<a href="${dom.dataset.url}">${dom.dataset.title}</a>`
			);
		}
		return dom;
	}
	insertAsset(dom) {
		const frag = dom.ownerDocument.createDocumentFragment();
		frag.appendChild(this.convertAsset(dom).cloneNode(true));
		const node = this.#parser.parse(frag);
		const tr = this.state.tr;
		const sel = tr.selection;

		if (sel.node) {
			if (this.#content == "inline") {
				// insert after
				tr.setSelection(TextSelection.create(tr.doc, sel.to, sel.to));
			}
			tr.replaceSelectionWith(node);
		} else if (sel.empty) {
			const $pos = sel.$from;
			const parent = $pos.parent;
			if (parent.isTextblock && parent.childCount == 0 && $pos.pos > 0) {
				// select whole empty text block for replacement
				tr.setSelection(NodeSelection.create(tr.doc, $pos.before($pos.depth)));
			}
			tr.replaceSelectionWith(node);
		} else if (frag.querySelector('a')) {
			// apply marks
			const marks = [];
			node.descendants((node) => {
				if (node.marks.length > 0) marks.push(...node.marks);
			});
			marks.forEach(mark => tr.addMark(sel.from, sel.to, mark));
			// reselect text
			tr.setSelection(TextSelection.create(tr.doc, sel.from, sel.to));
		}
		this.dispatch(tr);
	}
	toDOM() {
		return this.#serializer.serializeFragment(this.state.doc.content);
	}
	initCursor({ left, top }) {
		if (!left || !top) return;
		const tr = this.state.tr;
		const pos = this.posAtCoords({ left, top });
		let sel = Selection.near(tr.doc.resolve(pos ? pos.pos : 0));
		this.dispatch(tr.setSelection(sel));
	}
}
