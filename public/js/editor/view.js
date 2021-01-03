import {
	keymap,
	history,
	baseKeymap,
	EditorState,
	dropCursor,
	gapCursor,
	EditorView,
	Schema, DOMParser, DOMSerializer
} from "../../modules/@livejack/prosemirror";

import { menuBar } from "./menubar.js";
import { buildMenuItems } from "./menuitems.js";
import { buildKeymap } from "./keymap.js";
import { buildInputRules } from "./inputrules.js";

function getPlugins(options) {
	let plugins = [
		buildInputRules(options.schema),
		keymap(buildKeymap(options.schema)),
		keymap(baseKeymap),
		dropCursor(),
		gapCursor()
	];
	if (options.menuBar !== false)
		plugins.push(menuBar({
			floating: options.floatingMenu !== false,
			content: options.menuContent || buildMenuItems(options.schema).fullMenu
		}));
	if (options.history !== false)
		plugins.push(history());

	return plugins;
}

export class CustomEditorView extends EditorView {
	#serializer
	#schema
	constructor(place, { nodes, marks }, callback) {
		const schema = new Schema({
			nodes: nodes, // addListNodes(nodes, "paragraph block*", "block"),			marks: marks
		});
		const parser = DOMParser.fromSchema(schema);
		const copy = place.cloneNode(true);
		place.textContent = '';

		super(place, {
			state: EditorState.create({
				doc: parser.parse(copy),
				plugins: getPlugins({ schema })
			}),
			dispatchTransaction: (tr) => {
				if (tr.docChanged) {
					callback(this);
				}
				this.updateState(this.state.apply(tr));
			},
			domParser: parser
		});
		this.#serializer = DOMSerializer.fromSchema(this.#schema);
	}
	toDOM() {
		return this.#serializer.serializeFragment(this.state.doc.content);
	}
}
