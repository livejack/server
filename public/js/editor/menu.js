import {
	undo,
	redo,
	crel,
	joinUp,
	lift,
	selectParentNode,
	wrapIn,
	setBlockType
} from "/node_modules/@livejack/prosemirror";

import { getIcon } from "./icons.js";

const prefix = "ProseMirror-menu";

export class MenuItem {
	constructor(spec) {
		this.spec = spec;
	}

	render(view, menu) {
		const spec = this.spec;
		const dom = (() => {
			if (spec.render) return spec.render(view);
			if (spec.icon) return getIconState(spec.icon);
			if (spec.label) return crel("div", null, spec.label);
		})();
		if (!dom) throw new RangeError("MenuItem without icon or label property");
		if (spec.title) {
			const title = (typeof spec.title === "function" ? spec.title(view.state) : spec.title);
			dom.setAttribute("title", title);
		}
		if (spec.class) dom.classList.add(spec.class);
		if (spec.css) dom.style.cssText += spec.css;

		dom.addEventListener("mousedown", e => {
			e.preventDefault();
			if (!dom.classList.contains(prefix + "-disabled"))
				spec.run(view.state, view.dispatch, view, e);
		});

		function update(state, view) {
			if (spec.select) {
				const selected = spec.select(state);
				dom.style.display = selected ? "" : "none";
				if (!selected) return false;
			}
			let enabled = true;
			if (spec.enable) {
				enabled = spec.enable(state, view) || false;
				dom.classList.toggle(prefix + "-disabled", !enabled);
			}
			let active = enabled;
			if (spec.active) {
				active = enabled && spec.active(state, view) || false;
				dom.classList.toggle(prefix + "-active", active);
			}
			if (spec.menu) {
				const marks = (state.selection.$from.marksAcross(state.selection.$to) || []).filter((mark) => mark.type.name == spec.type);
				const mark = marks.length == 1 ? marks[0] : null;
				spec.menu(menu, view, mark);
			}
			return true;
		}

		return { dom, update };
	}
}

function getIconState(icon) {
	if (icon.active && icon.inactive) {
		const dom = getIcon(icon.inactive);
		const alt = getIcon(icon.active);
		dom.appendChild(alt.firstElementChild);
		dom.classList.add(prefix + '-toggle');
		return dom;
	} else {
		return getIcon(icon);
	}
}

function combineUpdates(updates, nodes) {
	return (state, view) => {
		let something = false;
		for (let i = 0; i < updates.length; i++) {
			const up = updates[i](state, view);
			nodes[i].style.display = up ? "" : "none";
			if (up) something = true;
		}
		return something;
	};
}

export function renderGrouped(view, menu, content) {
	const result = document.createDocumentFragment();
	const updates = [], separators = [];
	for (let i = 0; i < content.length; i++) {
		const items = content[i], localUpdates = [], localNodes = [];
		for (let j = 0; j < items.length; j++) {
			const { dom, update } = items[j].render(view, menu);
			const span = crel("span", { class: prefix + "item" }, dom);
			result.appendChild(span);
			localNodes.push(span);
			localUpdates.push(update);
		}
		if (localUpdates.length) {
			updates.push(combineUpdates(localUpdates, localNodes));
			if (i < content.length - 1) {
				separators.push(result.appendChild(separator()));
			}
		}
	}

	function update(state, view) {
		let something = false, needSep = false;
		for (let i = 0; i < updates.length; i++) {
			const hasContent = updates[i](state, view);
			if (i) {
				separators[i - 1].style.display = needSep && hasContent ? "" : "none";
			}
			needSep = hasContent;
			if (hasContent) {
				something = true;
			}
		}
		return something;
	}
	return { dom: result, update };
}

function separator() {
	return crel("span", { class: prefix + "separator" });
}

export const icons = {
	join: {
		width: 800, height: 900,
		path: "M0 75h800v125h-800z M0 825h800v-125h-800z M250 400h100v-100h100v100h100v100h-100v100h-100v-100h-100z"
	},
	lift: {
		width: 1024, height: 1024,
		path: "M219 310v329q0 7-5 12t-12 5q-8 0-13-5l-164-164q-5-5-5-13t5-13l164-164q5-5 13-5 7 0 12 5t5 12zM1024 749v109q0 7-5 12t-12 5h-987q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h987q7 0 12 5t5 12zM1024 530v109q0 7-5 12t-12 5h-621q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h621q7 0 12 5t5 12zM1024 310v109q0 7-5 12t-12 5h-621q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h621q7 0 12 5t5 12zM1024 91v109q0 7-5 12t-12 5h-987q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h987q7 0 12 5t5 12z"
	},
	selectParentNode: { text: "\u2b1a", css: "font-weight: bold" },
	undo: {
		width: 1024, height: 1024,
		path: "M761 1024c113-206 132-520-313-509v253l-384-384 384-384v248c534-13 594 472 313 775z"
	},
	redo: {
		width: 1024, height: 1024,
		path: "M576 248v-248l384 384-384 384v-253c-446-10-427 303-313 509-280-303-221-789 313-775z"
	},
	strong: {
		width: 805, height: 1024,
		path: "M317 869q42 18 80 18 214 0 214-191 0-65-23-102-15-25-35-42t-38-26-46-14-48-6-54-1q-41 0-57 5 0 30-0 90t-0 90q0 4-0 38t-0 55 2 47 6 38zM309 442q24 4 62 4 46 0 81-7t62-25 42-51 14-81q0-40-16-70t-45-46-61-24-70-8q-28 0-74 7 0 28 2 86t2 86q0 15-0 45t-0 45q0 26 0 39zM0 950l1-53q8-2 48-9t60-15q4-6 7-15t4-19 3-18 1-21 0-19v-37q0-561-12-585-2-4-12-8t-25-6-28-4-27-2-17-1l-2-47q56-1 194-6t213-5q13 0 39 0t38 0q40 0 78 7t73 24 61 40 42 59 16 78q0 29-9 54t-22 41-36 32-41 25-48 22q88 20 146 76t58 141q0 57-20 102t-53 74-78 48-93 27-100 8q-25 0-75-1t-75-1q-60 0-175 6t-132 6z"
	},
	em: {
		width: 585, height: 1024,
		path: "M0 949l9-48q3-1 46-12t63-21q16-20 23-57 0-4 35-165t65-310 29-169v-14q-13-7-31-10t-39-4-33-3l10-58q18 1 68 3t85 4 68 1q27 0 56-1t69-4 56-3q-2 22-10 50-17 5-58 16t-62 19q-4 10-8 24t-5 22-4 26-3 24q-15 84-50 239t-44 203q-1 5-7 33t-11 51-9 47-3 32l0 10q9 2 105 17-1 25-9 56-6 0-18 0t-18 0q-16 0-49-5t-49-5q-78-1-117-1-29 0-81 5t-69 6z"
	},
	code: {
		width: 896, height: 1024,
		path: "M608 192l-96 96 224 224-224 224 96 96 288-320-288-320zM288 192l-288 320 288 320 96-96-224-224 224-224-96-96z"
	},
	link: {
		width: 928, height: 929,
		path: "M819 683q0-22-16-38L685 527q-16-16-38-16-24 0-41 18l10 10 12 12 8 10q5 7 7 14t2 15q0 22-16 38t-38 16q-8 0-15-2t-14-7l-10-8-12-12-10-10q-18 17-18 41 0 22 16 38l117 118q15 15 38 15 22 0 38-14l84-83q16-16 16-38zM417 281q0-22-16-38L284 125q-16-16-38-16t-38 15l-84 83q-16 16-16 38t16 38l118 118q15 15 38 15 24 0 41-17l-10-10-12-12-8-10q-5-7-7-14t-2-15q0-22 16-38t38-16q8 0 15 2t14 7l10 8 12 12 10 10q18-17 18-41zm511 402q0 68-48 116l-84 83q-47 47-116 47t-116-48L447 763q-47-47-47-116 0-70 50-119l-50-50q-49 50-118 50-68 0-116-48L48 362Q0 314 0 246t48-116l84-83Q179 0 248 0t116 48l117 118q47 47 47 116 0 70-50 119l50 50q49-50 118-50 68 0 116 48l118 118q48 48 48 116z"
	},
	unlink: {
		width: 928, height: 929,
		path: "M819 683c0-15-5-27-16-38L685 527a52 52 0 00-38-16c-48-2-145 96-135 135 0 15 5 27 16 38l117 118c10 10 23 15 38 15s27-5 38-14l84-83c11-11 16-23 16-38zM417 281c0-15-5-27-16-38L284 125a52 52 0 00-38-16c-15 0-27 5-38 15l-84 83a52 52 0 00-16 38c0 15 5 27 16 38l118 118c10 10 23 15 38 15 63-9 122-78 135-134zm511 402c0 45-16 84-48 116l-84 83c-31 31-70 47-116 47s-85-16-116-48L447 763c-31-31-47-70-47-116 0-47 64-127 97-160l-54-50c-32 33-115 91-161 91-45 0-84-16-116-48L48 362C16 330 0 291 0 246s16-84 48-116l84-83c31-31 70-47 116-47s85 16 116 48l117 118c31 31 47 70 47 116 0 47-51 122-85 155l54 50c33-33 103-86 149-86 45 0 84 16 116 48l118 118c32 32 48 71 48 116z"
	},
	bulletList: {
		width: 768, height: 896,
		path: "M0 512h128v-128h-128v128zM0 256h128v-128h-128v128zM0 768h128v-128h-128v128zM256 512h512v-128h-512v128zM256 256h512v-128h-512v128zM256 768h512v-128h-512v128z"
	},
	orderedList: {
		width: 768, height: 896,
		path: "M320 512h448v-128h-448v128zM320 768h448v-128h-448v128zM320 128v128h448v-128h-448zM79 384h78v-256h-36l-85 23v50l43-2v185zM189 590c0-36-12-78-96-78-33 0-64 6-83 16l1 66c21-10 42-15 67-15s32 11 32 28c0 26-30 58-110 112v50h192v-67l-91 2c49-30 87-66 87-113l1-1z"
	},
	blockquote: {
		width: 640, height: 896,
		path: "M0 448v256h256v-256h-128c0 0 0-128 128-128v-128c0 0-256 0-256 256zM640 320v-128c0 0-256 0-256 256v256h256v-256h-128c0 0 0-128 128-128z"
	},
	asset: {
		width: 16, height: 16,
		path: "M14 16v-11l-1 1v9h-12v-12h9l1-1h-11v14z M16 1.4l-1.4-1.4-6.8 6.8-1.8-1.8v5h5l-1.8-1.8z"
	},
	sup: {
		width: 492, height: 492,
		path: "M211 282l132 148h-81l-92-109-91 109H0l131-148L6 142h80l87 101 88-101h76zm181-101l54-40c19-12 31-24 37-35s8-23 8-35c0-21-6-37-20-50a77 77 0 00-54-19c-22 0-39 7-52 19-13 13-19 32-19 58h41c0-15 3-26 8-32 6-6 13-9 23-9 9 0 17 3 22 9 6 6 9 14 9 23 0 8-3 16-8 24s-20 19-43 36c-20 14-47 28-55 41v48h149v-38z"
	},
	sub: {
		width: 492, height: 492,
		path: "M211 262l132 148h-81l-92-109-91 109H0l131-148L6 122h80l87 101 88-101h76zm181 193l54-40c19-12 31-24 37-35s8-23 8-35c0-21-6-37-20-50a77 77 0 00-54-19c-22 0-39 7-52 19-13 13-19 32-19 58h41c0-15 3-26 8-32 6-6 13-9 23-9 9 0 17 3 22 9 6 6 9 14 9 23 0 8-3 16-8 24s-20 19-43 36c-20 14-47 28-55 41v48h149v-38z"
	}
};

export const joinUpItem = new MenuItem({
	title: "Join with above block",
	run: joinUp,
	select: state => joinUp(state),
	icon: icons.join
});

export const liftItem = new MenuItem({
	title: "Lift out of enclosing block",
	run: lift,
	select: state => lift(state),
	icon: icons.lift
});

export const selectParentNodeItem = new MenuItem({
	title: "Select parent node",
	run: selectParentNode,
	select: state => selectParentNode(state),
	icon: icons.selectParentNode
});

export const undoItem = new MenuItem({
	title: "Undo last change",
	run: undo,
	enable: state => undo(state),
	icon: icons.undo
});

export const redoItem = new MenuItem({
	title: "Redo last undone change",
	run: redo,
	enable: state => redo(state),
	icon: icons.redo
});

export function wrapItem(nodeType, options) {
	const passedOptions = {
		run(state, dispatch) {
			// FIXME if (options.attrs instanceof Function) options.attrs(state, attrs => wrapIn(nodeType, attrs)(state))
			return wrapIn(nodeType, options.attrs)(state, dispatch);
		},
		select(state) {
			return wrapIn(nodeType, options.attrs instanceof Function ? null : options.attrs)(state);
		}
	};
	for (const prop in options) passedOptions[prop] = options[prop];
	return new MenuItem(passedOptions);
}

export function blockTypeItem(nodeType, options) {
	const command = setBlockType(nodeType, options.attrs);
	const passedOptions = {
		run: command,
		enable(state) { return command(state); },
		active(state) {
			const { $from, to, node } = state.selection;
			if (node) return node.hasMarkup(nodeType, options.attrs);
			return to <= $from.end() && $from.parent.hasMarkup(nodeType, options.attrs);
		}
	};
	for (const prop in options) passedOptions[prop] = options[prop];
	return new MenuItem(passedOptions);
}

function canInsert(state, nodeType) {
	const $from = state.selection.$from;
	for (let d = $from.depth; d >= 0; d--) {
		const index = $from.index(d);
		if ($from.node(d).canReplaceWith(index, index, nodeType)) return true;
	}
	return false;
}
export function insertTypeItem(nodeType, options) {
	const passedOptions = {
		run(state, dispatch) {
			dispatch(state.tr.replaceSelectionWith(nodeType.createAndFill({})));
		},
		enable(state) {
			return canInsert(state, nodeType);
		},
		active(state) {
			const { $from, to, node } = state.selection;
			if (node) return node.hasMarkup(nodeType, options.attrs);
			return to <= $from.end() && $from.parent.hasMarkup(nodeType, options.attrs);
		}
	};
	return new MenuItem(Object.assign(passedOptions, options));
}

