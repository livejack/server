const { BaseModel, transaction } = require('objection');
const DiffList = require('diff-list');

class User extends BaseModel {
	static get tableName() {
		return 'users';
	}

	static get jsonSchema() {
		return {
			type: 'object',
			required: ['domain', 'tokens'],
			properties: {
				domain: {
					type: 'string'
				},
				tokens: {
					type: 'array',
					items: {
						type: 'string'
					}
				}
			}
		};
	}

	static async populate(nusers) {
		const trx = await transaction.start(this);
		try {
			const users = await this.query(trx);
			const diff = DiffList(users, nusers, {
				key: 'domain',
				equal: function (a, b) {
					return (a.tokens || []).join(',') == (b.tokens || []).join(',');
				}
			});
			for (const user of diff.put) {
				await this.query(trx).findOne({
					domain: user.domain
				}).throwIfNotFound().patch(user);
			}
			if (diff.post.length) {
				await this.query(trx).insert(diff.post);
			}
			if (diff.del.length) {
				await this.query(trx)
					.whereIn('domain', diff.del.map((item) => item.domain))
					.delete();
			}
			await trx.commit();
		} catch (err) {
			await trx.rollback();
			throw err;
		}
	}
}

module.exports = User;

