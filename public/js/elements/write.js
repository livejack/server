import EditError from './error.js';
import EditFilter from './filter.js';
import EditControl from './control.js';
import EditLink from './link.js';
import EditUpload from './upload.js';
import EditStatus from './status.js';
import EditArticle from './article.js';
import EditTime from './time.js';
import EditSelect from './select.js';
import { EditTitle, EditMark, EditText } from './html.js';
import { EditAsset } from './asset-edit.js';
import { DiffDOM } from "/node_modules/diff-dom";

export default function register(live) {
	const ce = window.customElements;
	live.LiveAsset = EditAsset;
	live.patchDOM = function (from, to) {
		const dd = new DiffDOM();
		dd.apply(from, dd.diff(from, to));
	};
	live.errorHandler = (detail) => {
		for (const node of document.querySelectorAll('div[is="edit-error"]')) {
			node.handleEvent({
				type: 'ioerror',
				detail
			});
		}
	};
	live.adopt(EditError);
	live.adopt(EditText);
	live.adopt(EditFilter);
	live.adopt(EditAsset);
	live.adopt(EditTime);
	live.adopt(EditControl);

	ce.define('edit-error', EditError, { extends: 'div' });
	ce.define('edit-article', EditArticle, { extends: 'article' });
	ce.define('edit-time', EditTime, { extends: 'time' });
	ce.define('edit-title', EditTitle, { extends: 'h2' });
	ce.define('edit-text', EditText, { extends: 'div' });
	ce.define('edit-select', EditSelect, { extends: 'select' });
	ce.define('edit-mark', EditMark, { extends: 'div' });
	ce.define('edit-link', EditLink, { extends: 'form' });
	ce.define('edit-upload', EditUpload, { extends: 'form' });
	ce.define('edit-status', EditStatus, { extends: 'form' });
	ce.define('edit-control', EditControl, { extends: 'div' });
	ce.define('edit-filter', EditFilter, { extends: 'form' });
}
