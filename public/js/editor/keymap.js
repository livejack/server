import {
	chainCommands,
	toggleMark,
	exitCode,
	joinUp,
	joinDown,
	lift,
	selectParentNode,
	splitListItem,
	undo, redo,
	undoInputRule
} from "/node_modules/@livejack/prosemirror";

// eslint-disable-next-line no-undef
const mac = typeof navigator != "undefined" ? /Mac/.test(navigator.platform) : false;

// :: (Schema, ?Object) → Object
//
// You can suppress or map these bindings by passing a `mapKeys`
// argument, which maps key names (say `"Mod-B"` to either `false`, to
// remove the binding, or a new key name string.
export function buildKeymap(schema, mapKeys) {
	const keys = {};
	let type;
	function bind(key, cmd) {
		if (mapKeys) {
			const mapped = mapKeys[key];
			if (mapped === false) return;
			if (mapped) key = mapped;
		}
		keys[key] = cmd;
	}


	bind("Mod-z", undo);
	bind("Shift-Mod-z", redo);
	bind("Backspace", undoInputRule);
	if (!mac) bind("Mod-y", redo);

	bind("Alt-ArrowUp", joinUp);
	bind("Alt-ArrowDown", joinDown);
	bind("Mod-BracketLeft", lift);
	bind("Escape", selectParentNode);

	if ((type = schema.marks.strong)) {
		bind("Mod-b", toggleMark(type));
		bind("Mod-B", toggleMark(type));
	}
	if ((type = schema.marks.em)) {
		bind("Mod-i", toggleMark(type));
		bind("Mod-I", toggleMark(type));
	}

	if ((type = schema.nodes.hard_break)) {
		const br = type, cmd = chainCommands(exitCode, (state, dispatch) => {
			dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView());
			return true;
		});
		bind("Mod-Enter", cmd);
		bind("Shift-Enter", cmd);
		if (mac) bind("Ctrl-Enter", cmd);
	}
	if ((type = schema.nodes.list_item)) {
		bind("Enter", splitListItem(type));
	}

	return keys;
}
