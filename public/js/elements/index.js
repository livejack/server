import cePolyfill from '../../modules/@webreflection/custom-elements';
cePolyfill(window);

import EditAsset from './asset.js';
import EditIcon from './icon.js';
import EditFilter from './filter.js';
import EditControl from './control.js';
import EditPaste from './paste.js';
import EditUpload from './upload.js';
import EditStatus from './status.js';
import EditArticle from './article.js';
import EditTime from './time.js';
import EditSelect from './select.js';
import { EditTitle, EditMark, EditText } from './html.js';


export default function register(live) {
	const ce = window.customElements;
	EditTime.prototype.mergeDate = function(str) {
		this.innerHTML = '[date|date:rel|as:text]';
		return live.matchdom.merge(this, { date: str });
	};
	EditControl.prototype.merge = function(dom, data) {
		return live.matchdom.merge(dom, data);
	};
	const revealer = {
		observe() {
			return live.observer.observe(this);
		},
		unobserve() {
			return live.observer.unobserve(this);
		}
	};
	Object.assign(EditIcon.prototype, revealer);
	Object.assign(EditAsset.prototype, revealer);

	ce.define('edit-article', EditArticle, { extends: 'article' });
	ce.define('edit-time', EditTime, { extends: 'time' });
	ce.define('edit-title', EditTitle, { extends: 'h2' });
	ce.define('edit-text', EditText, { extends: 'div' });
	ce.define('edit-select', EditSelect, { extends: 'select' });
	ce.define('edit-mark', EditMark, { extends: 'div' });
	ce.define('edit-paste', EditPaste, { extends: 'form' });
	ce.define('edit-upload', EditUpload, { extends: 'form' });
	ce.define('edit-status', EditStatus, { extends: 'form' });
	ce.define('edit-control', EditControl, { extends: 'div' });
	ce.define('edit-filter', EditFilter, { extends: 'form' });
	ce.define('live-asset', EditAsset);
	ce.define('live-icon', EditIcon);
}
