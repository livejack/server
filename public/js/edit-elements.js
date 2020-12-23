import '../lib/custom-elements.js';
import EditArticle from './edit-article.js';
import EditTime from './edit-time.js';
import EditTitle from './edit-title.js';
import EditHtml from './edit-html.js';

export default function register(live) {
	const ce = window.customElements;
	EditTime.matchdom = live.matchdom;
	ce.define('edit-article', EditArticle, { extends: 'article' });
	ce.define('edit-time', EditTime, { extends: 'time' });
	ce.define('edit-text', EditTitle, { extends: 'h2' });
	ce.define('edit-html', EditHtml, { extends: 'div' });
}
