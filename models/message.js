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

	static get jsonSchema() {
		return {
			type: 'object',
			required: ['title'],
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
		if (this.date == null) {
			// fix bad record
			this.date = this.update;
		}
	}
}

module.exports = Message;

