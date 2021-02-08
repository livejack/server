import req from "../req.js";

/* TODO
État du live: commencé - terminé
- on veut pouvoir commencer le live
- on veut pouvoir reprendre
- et terminer


Présentation

|  Commencer  |  _Terminer_ |


|  Débuté le xx à xx | Terminer |
|  Débuté le xx à xx | Terminé le xx à xx |
-> quand on termine le live, la date de fin indiquée est celle du dernier message non épinglé
-> on ne peut pas changer la date de début une fois le début commencé
-> reprendre == supprimer la date de fin

Messages antidatés:
- on peut décider de décaler un message d'une heure max
*/

export default class EditStatus extends HTMLFormElement {
	#input
	constructor() {
		super();
		this.setAttribute('is', 'edit-status');
	}
	connectedCallback() {
		this.addEventListener('change', this);
	}
	disconnectedCallback() {
		this.removeEventListener('change', this);
	}
	handleEvent(e) {
		this.toggle();
	}
	async toggle() {
		this.#input.disabled = true;
		const status = !this.#input.checked;
		try {
			await req("./page", "put", {});
			this.#input.checked = status;
		} catch (err) {
			// TODO global notification
		}
		this.#input.disabled = false;
	}
}
