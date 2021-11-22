const start = Date.now();

export async function reportError(err) {
	let msg;
	if (err.stack) {
		msg = err.stack;
	} else {
		msg = `${err.type || err.name}: ${err.message}\n   at ${err.filename || 'window'} ${err.lineno}:${err.colno}`;
	}
	const body = {
		age: Math.round((Date.now() - start) / 1000),
		type: "javascript-error",
		body: {
			message: msg
		}
	};

	return fetch("/.well-known/reports", {
		method: 'post',
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(body)
	});
}
