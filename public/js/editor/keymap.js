import {
	chainCommands,
	toggleMark,
	joinUp,
	joinDown,
	lift,
	selectParentNode
} from "/node_modules/prosemirror-commands";
import { undo, redo } from "/node_modules/prosemirror-history";
import { undoInputRule } from "/node_modules/prosemirror-inputrules";
import { canSplit } from "/node_modules/prosemirror-transform";

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
		bind("Enter", chainCommands(
			removeHardBreakAndInsertParagraph(type, schema.nodes.paragraph),
			insertHardBreak(type, schema.nodes.paragraph)
		));
	}
	// if ((type = schema.nodes.list_item)) {
	// 	bind("Enter", splitListItem(type));
	// }

	return keys;
}


function removeHardBreakAndInsertParagraph(hardBreak, paragraph) {
	return (state, dispatch) => {
		const { $from } = state.selection;

		if (!$from.parent.isTextblock) {
			return false;
		}

		if ($from.parent.type !== paragraph) {
			return false;
		}

		if ($from.nodeBefore && $from.nodeBefore.type !== hardBreak) {
			return false;
		}
		if (!canSplit(state.tr.doc, $from.pos)) {
			return false;
		}

		if (dispatch) {
			dispatch(
				state.tr
					.delete($from.pos - $from.nodeBefore.nodeSize, $from.pos)
					.split($from.pos)
					.scrollIntoView()
			);
		}

		return true;
	};
}

function insertHardBreak(hardBreak, paragraph) {
	return (state, dispatch) => {
		const { $from } = state.selection;

		if (!$from.parent.isTextblock) {
			return false;
		}

		if ($from.parent.type !== paragraph) {
			return false;
		}

		if (dispatch) {
			dispatch(state.tr.replaceSelectionWith(hardBreak.create()).scrollIntoView());
		}

		return true;
	};
}
