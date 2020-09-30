let called = false, bound = false;

const p = new Promise((resolve) => {
	function readyLsn() {
		if (called) return;
		called = true;
		if (bound) {
			document.removeEventListener('DOMContentLoaded', readyLsn, false);
			window.removeEventListener('load', readyLsn, false);
		}
		resolve();
	}
	if (document.readyState == "complete") {
		readyLsn();
	} else {
		bound = true;
		document.addEventListener('DOMContentLoaded', readyLsn, false);
		window.addEventListener('load', readyLsn, false);
	}
});

export default p;

