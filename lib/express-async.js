module.exports = (express) => {
	express.Router.use = wrap(express.Router.use);
	for (let method of ['get', 'post', 'del', 'patch', 'put']) {
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
						if (data === undefined) next();
						else if (data === null) res.sendStatus(204);
						else res.send(data);
					}).catch (next);
				};
			} else {
				return item;
			}
		});
		return meth.apply(this, nlist);
	};
}
