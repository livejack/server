import { HTML as parseHTML } from "../../modules/matchdom";

export default class LiveAsset extends HTMLElement {
	connectedCallback() {
		const html = this.dataset.html;
		if (html != this.innerHTML) {
			this.textContent = '';
			this.appendChild(parseHTML(html));
			this.querySelectorAll('script').forEach(node => {
				node.setAttribute('src', node.getAttribute('src'));
			});
		}
	}
}
