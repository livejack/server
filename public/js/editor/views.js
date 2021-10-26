export function createView(tag, is) {
	return class CustomView {
		constructor(node, view, getPos) {
			this.node = node;
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
				Object.assign({}, this.node.attrs, attrs)
			);
			tr.setSelection(sel.constructor.fromJSON(tr.doc, jsel));
			this.view.dispatch(tr);
		}
		stopEvent(e) {
			if (e.target.nodeName == "INPUT") {
				if (e.type == "keyup" || e.type == "change") {
					this.change({
						[e.target.name]: e.target.value
					});
				}
				return true;
			}
		}
		update({ attrs }) {
			if (attrs.url !== this.node.attrs.url) return;
			this.node.attrs = attrs;
			const dom = this.dom;
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
	};
}
