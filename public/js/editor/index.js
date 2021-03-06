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

import { HTML as parseHTML } from "/node_modules/matchdom";

import { menuBar } from "./menubar.js";
import { buildMenuItems } from "./menuitems.js";
import { buildKeymap } from "./keymap.js";
import { buildInputRules } from "./inputrules.js";
import nodeViewSelect from "./nodeviewselect.js";

function getPlugins({ schema, menu, table }) {
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
	if (table !== false) {
		plugins.push(
			tableEditing()
		);
	}
	return plugins;
}

export class Editor extends EditorView {
	#serializer
	#parser
	#content
	constructor(place, { nodes, marks, list, menu, table, assets = [] }) {
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
				if (str.startsWith('<') && str.endsWith('>')) {
					let frag = parseHTML(str);
					if (frag.nodeType == Node.DOCUMENT_FRAGMENT_NODE) {
						if (frag.childNodes.length == 2 && frag.firstChild.nodeName == "META" && frag.lastChild.nodeName == "SPAN") {
							frag = parseHTML(frag.lastChild.textContent);
						}
					}
					frag = this.convertSnippets(frag);
					const div = frag.ownerDocument.createElement('div');
					div.appendChild(frag);
					return div.innerHTML;
				}
				return str;
			},
			clipboardTextParser: (str, $pos) => {
				if (str.startsWith('<') && str.endsWith('>')) {
					const frag = this.convertSnippets(parseHTML(str));
					return this.props.domParser.parseSlice(frag, {
						context: $pos
					});
				}
			}
		});
		this.#content = nodes.doc.content.replace('*', '');
		this.#parser = parser;
		this.#serializer = DOMSerializer.fromSchema(schema);
	}
	convertSnippets(frag) {
		if (frag.nodeType == Node.ELEMENT_NODE) {
			// use fragment
			frag = frag.parentNode;
		}
		const data = { html: "" };
		const copy = document.createDocumentFragment();

		for (let child of frag.childNodes) {
			if (child.nodeType == Node.TEXT_NODE && child.nodeValue.trim().length == 0) {
				continue;
			} else if (child.nodeType != Node.ELEMENT_NODE) {
				copy.appendChild(child.cloneNode(true));
				continue;
			}
			if (child.nodeName == "SCRIPT") {
				if (data.node) {
					if (child.src) {
						data.script = child.src;
						// this finishes the sequence
						const dom = document.createElement('live-asset');
						if (data.node) data.html = data.node.outerHTML + data.html;
						Object.assign(dom.dataset, data);
						data.node = null;
						data.html = "";
						data.script = "";
						copy.appendChild(dom);
					} else {
						data.html += child.outerHTML;
					}
				} else {
					// do not copy lone script
				}
			} else {
				if (data.node) {
					// previous node was an element, let it be parsed
					copy.appendChild(data.node.cloneNode(true));
				}
				data.node = child;
			}
		}
		if (data.node) copy.appendChild(data.node.cloneNode(true));
		return copy;
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
		const slice = this.#parser.parseSlice(frag);
		const tr = this.state.tr;
		const sel = tr.selection;

		if (sel.node) {
			if (this.#content == "inline") {
				// insert after
				tr.setSelection(TextSelection.create(tr.doc, sel.to, sel.to));
			}
			tr.replaceSelection(slice);
		} else if (sel.empty) {
			const $pos = sel.$from;
			const parent = $pos.parent;
			if (parent.isTextblock && parent.childCount == 0 && $pos.pos > 0) {
				// select whole empty text block for replacement
				tr.setSelection(NodeSelection.create(tr.doc, $pos.before($pos.depth)));
			}

			tr.replaceSelection(slice);
		} else if (frag.querySelector('a')) {
			// apply marks
			const marks = [];
			slice.content.descendants((node) => {
				if (node.marks.length > 0) marks.push(...node.marks);
			});
			marks.forEach(mark => tr.addMark(sel.from, sel.to, mark));
			// reselect text
			tr.setSelection(TextSelection.create(tr.doc, sel.from, sel.to));
		} else {
			tr.replaceSelection(slice);
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
