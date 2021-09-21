for (const name of ['filter', 'some', 'map', 'forEach', 'indexOf', 'find', 'includes']) {
	NodeList.prototype[name] ??= Array.prototype[name];
	HTMLCollection.prototype[name] ??= Array.prototype[name];
}
