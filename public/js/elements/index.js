import cePolyfill from '../../modules/@webreflection/custom-elements';
cePolyfill(window);

import EditAsset from './asset.js';
import EditArticle from './article.js';
import EditTime from './time.js';
import EditTitle from './title.js';
import EditHtml from './html.js';

export default function register(live) {
	const ce = window.customElements;
	EditHtml.assetManager = live.assetManager;
	EditTime.matchdom = live.matchdom;
	ce.define('edit-asset', EditAsset, { extends: 'a' });
	ce.define('edit-article', EditArticle, { extends: 'article' });

	ce.define('edit-time', EditTime, { extends: 'time' });
	ce.define('edit-text', EditTitle, { extends: 'h2' });
	ce.define('edit-html', EditHtml, { extends: 'div' });
}
