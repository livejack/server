export default {
	template(ctx, data, mode) {
		const { node } = ctx.dest;
		const parent = node.parentNode;
		if (mode == "replace") {
			const frag = ctx.matchdom.merge(node.content.cloneNode(true), data, ctx.scope);
			while (node.nextSibling) parent.removeChild(node.nextSibling);
			parent.appendChild(frag);
		} else if (mode == "insert") {
			ctx.matchdom.merge(
				node.content.cloneNode(true),
				data,
				{ template: node }
			);
		}
	},
	place(ctx, item, incursor, frag) {
		const cursor = ctx.scope.template;
		const list = cursor.parentNode;
		const old = list.querySelector(`[data-id="${item.id}"]`);
		const date = item.date || item.created_at;
		const refTime = new Date(date).getTime() || 0;
		const refPin = item.style == "pinned";
		const next = (() => {
			if (!refTime) return null;
			const first = list.firstElementChild;
			let child = first;
			while (child) {
				let time = child.querySelector('time');
				if (!time) {
					return (old || first);
				}
				time = new Date(time.getAttribute('datetime')).getTime();
				const pin = child.classList.contains('pinned');
				if (refPin && (!pin || refTime > time) || !pin && (refTime > time)) {
					return child;
				}
				child = child.nextElementSibling;
			}
			return (old || first);
		})();
		const node = frag.firstElementChild;
		if (!item.id) {
			// special case
			list.parentNode.insertBefore(node, list);
		} else if (old) {
			if (old.nextElementSibling == next && refTime) {
				old.parentNode.replaceChild(node, old);
			} else {
				old.classList.add('hidden');
				setTimeout(() => {
					if (old.parentNode == list) list.removeChild(old);
				}, 500);
				if (date) list.insertBefore(node, next);
			}
		} else if (date) {
			list.insertBefore(node, next);
		}
		return item;
	},
	when(ctx, page, param) {
		const now = Date.now();
		const start = page.start && new Date(page.start).getTime();
		const stop = page.stop && new Date(page.stop).getTime();
		let when = '';
		if (!start || now < start) when = 'before';
		else if (!stop || now <= stop) when = 'during';
		else when = 'after';
		return when == param;
	}
};
