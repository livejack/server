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
	Selection, TextSelection, NodeSelection,
	tableNodes, tableEditing
} from "/node_modules/@livejack/prosemirror";

import { menuBar } from "./menubar.js";
import { buildKeymap } from "./keymap.js";
import { buildInputRules } from "./inputrules.js";
import nodeViewSelect from "./nodeviewselect.js";

function getPlugins({ schema, menu, table, quotes }) {
	const plugins = [
		buildInputRules(schema, { quotes }),
		keymap(buildKeymap(schema)),
		keymap(baseKeymap),
		dropCursor(),
		gapCursor(),
		nodeViewSelect(),
		history()
	];
	if (menu !== false) {
		plugins.push(menuBar(schema));
	}
	if (table !== false) {
		plugins.push(
			tableEditing()
		);
	}
	return plugins;
}

export class Editor extends EditorView {
	#parser;
	#content;
	constructor(place, { nodes, marks, list, menu, table, quotes, assets = [] }) {
		const nodeViews = {};
		if (nodes) for (const [name, node] of Object.entries(nodes)) {
			if (node.View) nodeViews[name] = (child, view, getPos) => {
				return new node.View(child, view, getPos);
			};
		}
		if (marks) for (const [name, mark] of Object.entries(marks)) {
			if (mark.View) nodeViews[name] = (node, view) => {
				return new mark.View(node, view);
			};
		}
		const baseSchema = new Schema({ nodes: Object.assign({}, nodes), marks });
		let specNodes = baseSchema.spec.nodes;
		if (list) specNodes = addListNodes(specNodes, "paragraph+", "block");
		if (table !== false) {
			specNodes = specNodes.append(tableNodes({
				tableGroup: "block",
				cellContent: "inline*"
			}));
		}
		const schema = new Schema({
			nodes: specNodes,
			marks: baseSchema.spec.marks
		});
		const parser = DOMParser.fromSchema(schema);

		if (place.firstElementChild && place.firstElementChild.nodeName != "X-EMPTY") {
			place.insertAdjacentHTML('afterBegin', '<x-empty/>');
		}

		super({ mount: place }, {
			state: EditorState.create({
				doc: parser.parse(place),
				plugins: getPlugins({ schema, menu, quotes })
			}),
			dispatchTransaction: (tr) => {
				if (tr.docChanged) {
					this.changed();
				}
				this.updateState(this.state.apply(tr));
			},
			nodeViews,
			domParser: parser,
			domSerializer: DOMSerializer.fromSchema(schema)
		});
		this.#parser = parser;
		this.#content = nodes.doc.content.replace('*', '');
	}

	convertAsset(dom) {
		const sel = this.state.selection;
		if (this.#content == "inline") {
			if (dom.dataset.type == "picto") {
				const icon = document.createElement('live-icon');
				Object.assign(icon.dataset, dom.dataset);
				return icon;
			} else if (dom.favicon) {
				return this.dom.live.md.merge(`<img data-url="[favicon]" alt="[dataset.title|or:]" />`, dom);
			}
		} else if (this.#content == "text" && dom.dataset.title) {
			return this.dom.live.md.merge(`<span>[dataset.title]</span>`, dom);
		} else if (dom.dataset.type == "link" || !sel.empty && !sel.node) {
			return this.dom.live.md.merge(
				`<a href="[dataset.url]">[dataset.title]</a>`, dom
			);
		} else {
			return dom;
		}
	}
	insertAsset(dom) {
		const frag = dom.ownerDocument.createDocumentFragment();
		frag.appendChild(this.convertAsset(dom).cloneNode(true));
		const slice = this.#parser.parseSlice(frag);
		const tr = this.state.tr;
		const sel = tr.selection;
		let { from, to } = sel;

		if (sel.node) {
			if (this.#content == "inline") {
				// insert after
				tr.setSelection(TextSelection.create(tr.doc, to, to));
			}
			tr.replaceSelection(slice);
		} else if (frag.querySelector('a')) {
			// apply marks
			const marks = [];
			slice.content.descendants((node) => {
				if (node.marks.length > 0) marks.push(...node.marks);
			});
			if (marks.length == 1) {
				const mark = marks[0];
				while (tr.doc.rangeHasMark(from - 1, from, mark.type)) from--;
				while (tr.doc.rangeHasMark(to, to + 1, mark.type)) to++;
				tr.addMark(from, to, mark);
			} else {
				for (const mark of marks) tr.addMark(from, to, mark);
			}
			// reselect text
			tr.setSelection(TextSelection.create(tr.doc, from, to));
		} else if (sel.empty) {
			const $pos = sel.$from;
			const parent = $pos.parent;
			if (parent.isTextblock && parent.childCount == 0 && $pos.pos > 0) {
				// select whole empty text block for replacement
				tr.setSelection(NodeSelection.create(tr.doc, $pos.before($pos.depth)));
			}

			tr.replaceSelection(slice);
		} else {
			tr.replaceSelection(slice);
		}
		this.dispatch(tr);
	}
	toDOM(node) {
		if (!node) node = this.state.doc;
		const frag = this.props.domSerializer.serializeFragment(node.content);
		for (const dom of frag.querySelectorAll('x-empty')) dom.remove();
		return frag;
	}
	initCursor({ left, top }) {
		if (!left || !top) return;
		const tr = this.state.tr;
		const pos = this.posAtCoords({ left, top });
		const sel = Selection.near(tr.doc.resolve(pos ? pos.pos : 0));
		this.dispatch(tr.setSelection(sel));
	}
}
