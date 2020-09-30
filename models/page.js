const { BaseModel, Models } = require('objection');

class Page extends BaseModel {
	static get tableName() {
		return 'pages';
	}

	static get relationMappings() {
		return {
			messages: {
				relation: BaseModel.HasManyRelation,
				modelClass: Models.Message,
				join: {
					from: 'pages.id',
					to: 'messages.page_id'
				}
			},
			assets: {
				relation: BaseModel.HasManyRelation,
				modelClass: Models.Asset,
				join: {
					from: 'pages.id',
					to: 'assets.page_id'
				}
			}
		};
	}

	static get jsonSchema() {
		return {
			type: 'object',
			required: ['domain', 'key'],
			properties: {
				date: {
					type: 'string',
					format: 'date-time'
				},
				update: {
					type: 'string',
					format: 'date-time'
				},
				start: {
					type: 'string',
					format: 'date-time'
				},
				stop: {
					type: 'string',
					format: 'date-time'
				},
				title: {
					type: 'string'
				},
				view: {
					type: 'string'
				},
				backtrack: {
					type: 'string',
					format: 'uri-reference'
				},
				domain: {
					type: 'string'
				},
				key: {
					type: 'string'
				},
				stamp: {
					type: 'integer'
				}
			}
		};
	}
	$beforeInsert() {
		this.date = new Date().toISOString();
	}
	$beforeUpdate() {
		this.update = new Date().toISOString();
		if (this.date == null) this.date = this.update;
	}

	get when() {
		const now = Date.now();
		const start = Date.parse(this.start);
		if (!start || now < start) return 'before';
		// start is defined and now >= start
		const stop = Date.parse(this.stop);
		if (!stop || now <= stop) return 'during';
		// stop is defined and now > stop
		return 'after';
	}

	static async have({domain, key, view}) {
		const page = await this.query().findOne({domain, key});
		if (page) return page;
		else if (!view) throw new HttpError.BadRequest("Unknown domain");
		else return this.query().insertAndFetch({domain, key, view});
	}
}

module.exports = Page;

