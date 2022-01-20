export function createView(tag, is) {
	return class CustomView {
		#attrs;
		#type;
		constructor(node, view, getPos) {
			this.#type = node.type.name;
			this.#attrs = Object.assign({}, node.attrs);
			this.view = view;
			this.getPos = getPos;
			this.dom = view.root.createElement(tag, { is: is });
			if (!node.type.isAtom) {
				this.contentDOM = this.dom.content;
			}
			this.update(node);
		}
		change(attrs) {
			const tr = this.view.state.tr;
			const sel = tr.selection;
			const jsel = sel.toJSON();
			tr.setNodeMarkup(
				this.getPos(),
				null,
				Object.assign({}, this.#attrs, attrs)
			);
			tr.setSelection(sel.constructor.fromJSON(tr.doc, jsel));
			this.view.dispatch(tr);
		}
		stopEvent(e) {
			if (["TEXTAREA", "INPUT"].includes(e.target.nodeName)) {
				if (e.type == "keyup" || e.type == "paste") {
					if (e.target.name) this.change({
						[e.target.name]: e.target.value
					});
				}
				return true;
			}
		}
		update(node) {
			const { attrs } = node;
			// workaround https://github.com/ProseMirror/prosemirror/issues/1208
			if (node.type.name != this.#type) return;
			const dom = this.dom;
			this.#attrs = Object.assign({}, attrs);
			for (const key in attrs) {
				const val = attrs[key];
				if (val == null) delete dom.dataset[key];
				else dom.dataset[key] = val;
			}
			if (dom.update) dom.update();
			return true;
		}
		ignoreMutation(record) {
			if (record.type == "selection") return true;
			if (record.addedNodes && record.addedNodes.length && record.addedNodes.some((node) => {
				return !node.isContentEditable;
			})) return true;
			else if (record.target == this.dom && (record.type == "attributes" && record.attributeName.startsWith('data-'))) {
				return false;
			} else {
				return true;
			}
		}
		selectNode() {
			const { dom } = this;
			dom.classList.add("ProseMirror-selectednode");
			dom.select?.();
		}
		deselectNode() {
			const { dom } = this;
			dom.deselect?.();
			dom.classList.remove("ProseMirror-selectednode");
		}
	};
}
