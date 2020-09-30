export default function createObserver(cb) {
	return new IntersectionObserver((entries, observer) => {
		entries.forEach((entry) => {
			var target = entry.target;
			var ratio = entry.intersectionRatio || 0;
			if (ratio <= 0) return;
			observer.unobserve(target);
			cb(target);
		});
	}, {
		threshold: [0.0001, 0.2],
		rootMargin: "30px"
	});
}

