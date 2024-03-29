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
			hrefs: {
				relation: BaseModel.HasManyRelation,
				modelClass: Models.Href,
				join: {
					from: 'pages.id',
					to: 'hrefs.page_id'
				}
			}
		};
	}

	static get jsonSchema() {
		return {
			type: 'object',
			required: ['domain', 'key'],
			properties: {
				created_at: {
					type: 'string',
					format: 'date-time'
				},
				updated_at: {
					type: 'string',
					format: 'date-time'
				},
				start: {
					type: 'string',
					format: 'date-time',
					nullable: true
				},
				stop: {
					type: 'string',
					format: 'date-time',
					nullable: true
				},
				title: {
					type: 'string',
					nullable: true
				},
				view: {
					type: 'string'
				},
				backtrack: {
					type: 'string',
					format: 'uri-reference',
					nullable: true
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

	get when() {
		const now = Date.parse(this.updated_at);
		const start = Date.parse(this.start);
		if (!start || !now || now < start) return 'before';
		// start is defined and now >= start
		const stop = Date.parse(this.stop);
		if (!stop || now < stop) return 'during';
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

