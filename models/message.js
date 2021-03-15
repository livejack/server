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
			},
			hrefs: {
				relation: BaseModel.ManyToManyRelation,
				modelClass: Models.Href,
				join: {
					from: 'messages.id',
					through: {
						from: "messages_hrefs.message_id",
						to: "messages_hrefs.href_id"
					},
					to: 'hrefs.id'
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
				created_at: {
					type: 'string',
					format: 'date-time'
				},
				updated_at: {
					type: 'string',
					format: 'date-time'
				},
				date: {
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
	$beforeUpdate() {
		this.updated_at = new Date().toISOString();
	}
}

module.exports = Message;

