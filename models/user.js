const { BaseModel } = require('objection');
const DiffList = require('diff-list');

class User extends BaseModel {
	static get tableName() {
		return 'users';
	}

	static get jsonSchema() {
		return {
			type: 'object',
			required: ['domain', 'token'],
			properties: {
				domain: {
					type: 'string'
				},
				token: {
					type: 'string'
				}
			}
		};
	}

	static async populate(nusers) {
		const users = await this.query();
		const diff = DiffList(users, nusers, {
			key: 'domain',
			equal: function(a, b) {
				return a.token === b.token;
			}
		});
		for (let user of diff.put) {
			await this.query().findOne({
				domain: user.domain
			}).throwIfNotFound().patch(user);
		}
		await this.query().insert(diff.post);
		await this.query().whereIn('domain', diff.del.map((item) => item.domain)).delete();
	}
}

module.exports = User;

