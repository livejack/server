import {
	toggleMark,
	wrapInList
} from "/node_modules/@livejack/prosemirror";

import {
	blockTypeItem, insertTypeItem, icons, MenuItem, liftItem, wrapItem
} from "./menu.js";

function cmdItem(cmd, options) {
	const passedOptions = {
		label: options.title,
		run: cmd
	};
	for (const prop in options) passedOptions[prop] = options[prop];
	if ((!options.enable || options.enable === true) && !options.select) {
		passedOptions[options.enable ? "enable" : "select"] = state => cmd(state);
	}
	return new MenuItem(passedOptions);
}

function markActive(state, type) {
	const { from, $from, to, empty } = state.selection;
	if (empty) return type.isInSet(state.storedMarks || $from.marks());
	else return state.doc.rangeHasMark(from, to, type);
}

function markItem(markType, options) {
	const passedOptions = {
		active(state) {
			return markActive(state, markType);
		},
		enable: true,
		menu: markType.spec.menu,
		type: markType.name
	};
	for (const prop in options) passedOptions[prop] = options[prop];
	return cmdItem(toggleMark(markType), passedOptions);
}

function wrapListItem(nodeType, options) {
	return cmdItem(wrapInList(nodeType, options.attrs), options);
}

function canInsert(state, type) {
	const sel = state.selection;
	if (!sel.empty) return false;
	const $from = state.selection.$from;
	for (let d = $from.depth; d >= 0; d--) {
		const index = $from.index(d);
		if ($from.node(d).canReplaceWith(index, index, type)) return true;
	}
	return false;
}

function assetItem(nodeType) {
	return new MenuItem({
		title: "Insert asset",
		icon: icons[nodeType.name],
		select(state) {
			return state.selection.empty;
		},
		enable(state) {
			return canInsert(state, nodeType);
		},
		run(state, dispatch, view) {
			view.dom.queryAssets('link');
		}
	});
}

export function buildMenuItems(schema) {
	const r = {};
	let type;
	if ((type = schema.marks.link)) {
		r.toggleLink = markItem(type, {
			enable(state) { return !state.selection.empty; },
			icon: {
				active: icons.unlink,
				inactive: icons.link
			}
		});
	}
	if ((type = schema.marks.strong)) {
		r.toggleStrong = markItem(type, { icon: icons.strong });
	}
	if ((type = schema.marks.em)) {
		r.toggleEm = markItem(type, { icon: icons.em });
	}
	if ((type = schema.marks.sup)) {
		r.toggleSup = markItem(type, { icon: icons.sup });
	}
	if ((type = schema.marks.sub)) {
		r.toggleSub = markItem(type, { icon: icons.sub });
	}

	if ((type = schema.nodes.bullet_list)) {
		r.wrapBulletList = wrapListItem(type, {
			title: "Wrap in bullet list",
			icon: icons.bulletList
		});
	}
	if ((type = schema.nodes.ordered_list)) {
		r.wrapOrderedList = wrapListItem(type, {
			title: "Wrap in ordered list",
			icon: icons.orderedList
		});
	}
	if ((type = schema.nodes.blockquote)) {
		r.wrapBlockQuote = wrapItem(type, {
			title: "Wrap in block quote",
			icon: icons.blockquote
		});
	}
	if ((type = schema.nodes.paragraph)) {
		r.makeParagraph = blockTypeItem(type, {
			title: "Change to paragraph",
			label: "Plain"
		});
	}
	if ((type = schema.nodes.asset)) {
		r.insertAsset = assetItem(type);
	}

	const cut = arr => arr.filter(x => x);
	r.inlineMenu = [cut([r.toggleLink, r.toggleStrong, r.toggleEm, r.toggleSup, r.toggleSub])];
	r.blockMenu = [cut([r.wrapBulletList, r.wrapOrderedList, liftItem, r.insertBlockQuote])];
	r.fullMenu = [cut([r.insertAsset])].concat(r.inlineMenu, r.blockMenu);

	return r;
}
