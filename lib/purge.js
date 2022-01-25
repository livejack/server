const util = require('util');
const exec = util.promisify(require('child_process').exec);

const queues = {};

class Bounce {
	constructor(fn, ms) {
		this.id = setTimeout(() => {
			this.id = null;
			fn();
		}, ms);
	}
	cancel() {
		if (this.id) {
			clearTimeout(this.id);
			this.id = null;
		}
	}
}

module.exports = function (cmd, ms = 5000) {
	if (queues[cmd]) queues[cmd].cancel();
	queues[cmd] = new Bounce(() => {
		exec(cmd).catch(err => {
			console.error(err, "running", cmd);
		}).finally(() => {
			delete queues[cmd];
		});
	}, ms);
	return exec(cmd);
};

