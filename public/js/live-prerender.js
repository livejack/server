import ready from './ready.js';
import * as live from './live.js';

ready.then(async () => {
	const data = await live.build();

	const script = document.head.querySelector('script[type="module"][src="/js/live-prerender.js"');
	let copy = script;
	if (document.visibilityState != "prerender") {
		copy = document.createElement('script');
		copy.type = 'module';
		script.parentNode.replaceChild(copy, script);
	}
	copy.src = "/js/live-setup.js";
});

