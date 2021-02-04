module.exports = (express) => {
	express.Router.use = wrap(express.Router.use);
	for (let method of ['get', 'post', 'delete', 'patch', 'put']) {
		express.Route.prototype[method] = wrap(express.Route.prototype[method]);
	}
	return express;
};

function wrap(meth) {
	return function(...list) {
		const nlist = list.map((item) => {
			if (typeof item == "function") {
				if (item.length >= 3) return item;
				return (...args) => {
					const next = args[args.length - 1];
					const res = args[args.length - 2];
					Promise.resolve().then(() => {
						return item(...args);
					}).then((data) => {
						if (res.writableEnded) return;
						if (data === undefined) next();
						else if (typeof data == "number") res.sendStatus(data);
						else if (data === null) res.sendStatus(204);
						else if (Buffer.isBuffer(data) || typeof data != "object") res.send(data);
						else res.json(data);
					}).catch (next);
				};
			} else {
				return item;
			}
		});
		return meth.apply(this, nlist);
	};
}
