import {
	toggleMark,
	wrapInList
} from "../../modules/@livejack/prosemirror";

import {
	wrapItem, blockTypeItem, icons, MenuItem, liftItem
} from "./menu.js";

function cmdItem(cmd, options) {
	let passedOptions = {
		label: options.title,
		run: cmd
	};
	for (let prop in options) passedOptions[prop] = options[prop];
	if ((!options.enable || options.enable === true) && !options.select)
		passedOptions[options.enable ? "enable" : "select"] = state => cmd(state);

	return new MenuItem(passedOptions);
}

function markActive(state, type) {
	let { from, $from, to, empty } = state.selection;
	if (empty) return type.isInSet(state.storedMarks || $from.marks());
	else return state.doc.rangeHasMark(from, to, type);
}

function markItem(markType, options) {
	let passedOptions = {
		active(state) { return markActive(state, markType); },
		enable: true
	};
	for (let prop in options) passedOptions[prop] = options[prop];
	return cmdItem(toggleMark(markType), passedOptions);
}

function wrapListItem(nodeType, options) {
	return cmdItem(wrapInList(nodeType, options.attrs), options);
}

function linkItem(markType) {
	return new MenuItem({
		title: "Add or remove link",
		icon: {
			active: icons.unlink,
			inactive: icons.link
		},
		active(state) {
			return markActive(state, markType);
		},
		enable(state, view) {
			const sel = state.selection;
			if (sel.empty) return false;
			let can = false;
			state.doc.nodesBetween(sel.from, sel.to, function (node, pos) {
				if (can) return false;
				can = node.inlineContent && node.type.allowsMarkType(markType);
			});
			if (!can) return false;
			view.dom.queryAssets();
			return true;
		},
		run(state, dispatch, view) {
			if (markActive(state, markType)) {
				toggleMark(markType)(state, dispatch);
				return true;
			}
			view.dom.queryAssets('link');
		}
	});
}

export function buildMenuItems(schema, promptUrl) {
	let r = {}, type;
	if ((type = schema.marks.link)) {
		r.toggleLink = linkItem(type, promptUrl);
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

	let cut = arr => arr.filter(x => x);
	r.inlineMenu = [cut([r.toggleLink, r.toggleStrong, r.toggleEm, r.toggleSup, r.toggleSub])];
	r.blockMenu = [cut([r.wrapBulletList, r.wrapOrderedList, liftItem, r.wrapBlockQuote])];
	r.fullMenu = r.inlineMenu.concat(r.blockMenu);

	return r;
}
