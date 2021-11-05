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
import { splitListItem } from "/node_modules/prosemirror-schema-list";


const mac = typeof navigator != "undefined" ? /Mac/.test(navigator.platform) : false;

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
			splitListItem(schema.nodes.list_item),
			hardBreakHotel(type)
		));
	}

	return keys;
}


function hardBreakHotel(hardBreak) {
	return (state, dispatch) => {
		const { $from: {
			nodeBefore, parent, pos, depth
		} } = state.selection;

		let insert = false;

		if (!parent.isTextblock) {
			return false;
		}

		if (nodeBefore && nodeBefore.type !== hardBreak) {
			insert = true;
		}
		const { tr } = state;

		if (!canSplit(tr.doc, pos)) {
			insert = true;
		}

		if (dispatch) {
			if (insert) {
				tr.replaceSelectionWith(hardBreak.create());
			} else {
				const size = nodeBefore ? nodeBefore.nodeSize : 0;
				tr.delete(pos - size, pos);
				tr.split(pos - size, depth);
			}
			dispatch(tr.scrollIntoView());
		}

		return true;
	};
}

function insertHardBreak(hardBreak) {
	return (state, dispatch) => {
		const { $from } = state.selection;

		if (!$from.parent.isTextblock) {
			return false;
		}

		if (dispatch) {
			dispatch(state.tr.replaceSelectionWith(hardBreak.create()).scrollIntoView());
		}

		return true;
	};
}
