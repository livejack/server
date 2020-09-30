const { BaseModel, Models } = require('objection');

class Message extends BaseModel {
	static get tableName() {
		return 'messages';
	}

	static get relationMappings() {
		return {
			page: {
				relation: BaseModel.BelongsToOneRelation,
				modelClass: Models.Page,
				join: {
					from: 'messages.page_id',
					to: 'pages.id'
				}
			}
		};
	}

	static get modifiers() {
		return {
			select(builder) {
				builder.select();
			},
			order(builder) {
				builder.orderBy('date');
			}
		};
	}

	static get jsonSchema() {
		return {
			type: 'object',
			required: ['url'],
			properties: {
				id: {
					type: 'integer'
				},
				date: {
					type: 'string',
					format: 'date-time'
				},
				update: {
					type: 'string',
					format: 'date-time'
				},
				title: {
					type: 'string'
				},
				text: {
					type: 'string'
				},
				style: {
					type: 'string'
				},
				mark: {
					type: 'string'
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
	async $afterUpdate(opt, queryContext) {
		await super.$afterUpdate(opt, queryContext);
		await this.updatePage(queryContext);
	}
	async $afterRemove(opt, queryContext) {
		await super.$afterUpdate(opt, queryContext);
		await this.updatePage(queryContext);
	}

	async updatePage(queryContext) {
		const page = await this.$relatedQuery('page', queryContext.transaction);
		if (page) await page.patch({
			update: this.update
		});
	}

}

module.exports = Message;

