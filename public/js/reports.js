const start = Date.now();

export async function reportError(err) {
	return fetch("/.well-known/reports", {
		method: 'post',
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			age: Math.round((Date.now() - start) / 1000),
			body: {
				message: err.message,
				filename: err.filename,
				colno: err.colno,
				lineno: err.lineno,
				type: err.type
			},
			type: "javascript-error",
			url: document.location.toString()
		})
	});
}
