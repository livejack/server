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
		gapCursor()
	];
	if (menu !== false)
		plugins.push(menuBar({
			content: buildMenuItems(schema).fullMenu
		}));
	if (history !== false)
		plugins.push(history());

	return plugins;
}

export class Editor extends EditorView {
	#serializer
	constructor(place, { nodes, marks, list, menu }) {
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

		super(place, {
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
			domParser: parser
		});
		this.#serializer = DOMSerializer.fromSchema(schema);
	}
	async prompt(url) {
		// virtual
	}
	toDOM() {
		return this.#serializer.serializeFragment(this.state.doc.content);
	}
}
