export default async function req(url, method = "get", params = {}) {
	method = method.toLowerCase();
	const opts = {
		method,
		credentials: 'same-origin'
	};
	if (method == "get") {
		const queryStr = Object.keys(params).map(k => {
			const val = params[k] == null ? "" : params[k];
			return encodeURIComponent(k) + '=' + encodeURIComponent(val);
		}).join('&');
		if (queryStr) url += "?" + queryStr;
	} else {
		const bodyStr = JSON.stringify(params);
		if (bodyStr != "{}") {
			opts.headers = {
				"Content-Type": "application/json"
			};
			opts.body = bodyStr;
		}
	}
	return window.fetch(url, opts).then(res => {
		if (res.status == 200) return res.json();
		else if (res.status >= 400) throw new Error(res.status);
		else return {};
	});
}
