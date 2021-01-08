import {
	toggleMark,
	wrapInList
} from "../../modules/@livejack/prosemirror";

import {
	wrapItem, blockTypeItem, icons, MenuItem, liftItem
} from "./menu.js";

// Helpers to create specific types of items

function canInsert(state, nodeType) {
	let $from = state.selection.$from;
	for (let d = $from.depth; d >= 0; d--) {
		let index = $from.index(d);
		if ($from.node(d).canReplaceWith(index, index, nodeType)) return true;
	}
	return false;
}

function insertAssetItem(nodeType) {
	return new MenuItem({
		title: "Insert asset",
		icon: icons.asset,
		enable(state) { return canInsert(state, nodeType); },
		run(state, _, view) {
			view.prompt().then((meta) => {
				// nodeType depends on meta.type
				const node = nodeType.createAndFill({
					url: meta.href
				});
				view.dispatch(view.state.tr.replaceSelectionWith(node));
				view.focus();
			});
		}
	});
}

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

function linkItem(markType) {
	return new MenuItem({
		title: "Add or remove link",
		icon: icons.link,
		active(state) { return markActive(state, markType); },
		enable(state) { return !state.selection.empty; },
		run(state, dispatch, view) {
			if (markActive(state, markType)) {
				toggleMark(markType)(state, dispatch);
				return true;
			}
			view.prompt().then((meta) => {
				toggleMark(markType, {
					url: meta.href
				})(view.state, view.dispatch);
				view.focus();
			});
		}
	});
}

function wrapListItem(nodeType, options) {
	return cmdItem(wrapInList(nodeType, options.attrs), options);
}

// :: (Schema) → Object
// Given a schema, look for default mark and node types in it and
// return an object with relevant menu items relating to those marks:
//
// **`toggleStrong`**`: MenuItem`
//   : A menu item to toggle the [strong mark](#schema-basic.StrongMark).
//
// **`toggleEm`**`: MenuItem`
//   : A menu item to toggle the [emphasis mark](#schema-basic.EmMark).
//
// **`toggleCode`**`: MenuItem`
//   : A menu item to toggle the [code font mark](#schema-basic.CodeMark).
//
// **`toggleLink`**`: MenuItem`
//   : A menu item to toggle the [link mark](#schema-basic.LinkMark).
//
// **`insertImage`**`: MenuItem`
//   : A menu item to insert an [image](#schema-basic.Image).
//
// **`wrapBulletList`**`: MenuItem`
//   : A menu item to wrap the selection in a [bullet list](#schema-list.BulletList).
//
// **`wrapOrderedList`**`: MenuItem`
//   : A menu item to wrap the selection in an [ordered list](#schema-list.OrderedList).
//
// **`wrapBlockQuote`**`: MenuItem`
//   : A menu item to wrap the selection in a [block quote](#schema-basic.BlockQuote).
//
// **`makeParagraph`**`: MenuItem`
//   : A menu item to set the current textblock to be a normal
//     [paragraph](#schema-basic.Paragraph).
//
// **`makeCodeBlock`**`: MenuItem`
//   : A menu item to set the current textblock to be a
//     [code block](#schema-basic.CodeBlock).
//
// **`makeHead[N]`**`: MenuItem`
//   : Where _N_ is 1 to 6. Menu items to set the current textblock to
//     be a [heading](#schema-basic.Heading) of level _N_.
//
// **`insertHorizontalRule`**`: MenuItem`
//   : A menu item to insert a horizontal rule.
//
// The return value also contains some prefabricated menu elements and
// menus, that you can use instead of composing your own menu from
// scratch:
//
// **`insertMenu`**`: Dropdown`
//   : A dropdown containing the `insertImage` and
//     `insertHorizontalRule` items.
//
// **`typeMenu`**`: Dropdown`
//   : A dropdown containing the items for making the current
//     textblock a paragraph, code block, or heading.
//
// **`fullMenu`**`: [[MenuElement]]`
//   : An array of arrays of menu elements for use as the full menu
//     for, for example the [menu bar](https://github.com/prosemirror/prosemirror-menu#user-content-menubar).
export function buildMenuItems(schema, promptUrl) {
	let r = {}, type;
	if ((type = schema.marks.strong)) {
		r.toggleStrong = markItem(type, { title: "Toggle strong style", icon: icons.strong });
	}
	if ((type = schema.marks.em)) {
		r.toggleEm = markItem(type, { title: "Toggle emphasis", icon: icons.em });
	}
	if ((type = schema.marks.link)) {
		r.toggleLink = linkItem(type, promptUrl);
	}

	if ((type = schema.nodes.asset)) {
		r.insertAsset = insertAssetItem(type, promptUrl);
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
	r.inlineMenu = [cut([r.toggleStrong, r.toggleEm, r.toggleCode, r.toggleLink])];
	r.blockMenu = [cut([r.insertAsset, r.wrapBulletList, r.wrapOrderedList, liftItem, r.wrapBlockQuote])];
	r.fullMenu = r.inlineMenu.concat(r.blockMenu);

	return r;
}
