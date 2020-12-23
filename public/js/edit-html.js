import { EditorState } from "../modules/prosemirror-state";
import { EditorView } from "../modules/prosemirror-view";
import { Schema, DOMParser } from "../modules/prosemirror-model";
import { schema } from "../modules/prosemirror-schema-basic";
import { addListNodes } from "../modules/prosemirror-schema-list";
import { exampleSetup } from "../modules/prosemirror-example-setup";

const mySchema = new Schema({
	nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
	marks: schema.spec.marks
});

export default class EditHtml extends HTMLDivElement {
	constructor() {
		super();
		this.setAttribute('is', 'edit-html');
		this.tabIndex = 12;
	}
	connectedCallback() {
		this.addEventListener('focusin', this, true);
		this.addEventListener('focusout', this, true);
	}
	disconnectedCallback() {
		this.removeEventListener('focusin', this, true);
		this.removeEventListener('focusout', this, true);
	}
	get articleProp() {
		return this.getAttribute('name');
	}
	get articleValue() {
		return this.innerHTML.trim(); // well actually will call prosemirror serializer
	}
	handleEvent(e) {
		if (e.type == "focusin") {
			this.start();
		} else if (e.type == "focusout") {
			this.stop();
		}
	}
	start() {
		this.view = new EditorView(this.parentNode, {
			state: EditorState.create({
				doc: DOMParser.fromSchema(mySchema).parse(this),
				plugins: exampleSetup({ schema: mySchema })
			})
		});
	}
	stop() {
		this.view.destroy();
		delete this.view;
	}
}
