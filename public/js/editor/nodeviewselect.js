import { Plugin, NodeSelection } from "/node_modules/@livejack/prosemirror";

export default function nodeViewSelect() {
	return new Plugin({
		props: {
			handleClick(view, pos, e) {
				if (e.ctrlKey) return;
				const dom = e.target;
				const parent = dom.closest('[data-url]');
				if (!parent) return;
				const viewDesc = parent.pmViewDesc;
				if (!viewDesc) return;
				if (viewDesc.contentDOM) {
					if (viewDesc.dom.contains(dom) && viewDesc.contentDOM.contains(dom) == false) {
						const tr = view.state.tr;
						tr.setSelection(NodeSelection.create(tr.doc, viewDesc.spec.getPos()));
						view.dispatch(tr);
						return true;
					}

				}
			}
		}
	});
}
