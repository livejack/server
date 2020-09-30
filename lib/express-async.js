module.exports = (express) => {

	const use = express.Router.prototype.use;

	express.Router.prototype.use = function(...list) {
		const nlist = list.map((item) => {
			if (typeof item == "function") {
				return (...args) => {
					const next = args[args.length - 1];
					Promise.resolve().then(() => {
						item(...args);
					}).catch(next);
				};
			} else {
				return item;
			}
		});
		return use.apply(this, nlist);
	};
	return express;

};

