const { BaseModel, Models } = require('objection');

class Asset extends BaseModel {
	static get tableName() {
		return 'assets';
	}

	static get relationMappings() {
		return {
			page: {
				relation: BaseModel.BelongsToOneRelation,
				modelClass: Models.Page,
				join: {
					from: 'assets.page_id',
					to: 'pages.id'
				}
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
				origin: {
					anyOf: [{
						const: 'internal'
					}, {
						const: 'external'
					}],
					default: 'internal'
				},
				date: {
					type: 'string',
					format: 'date-time'
				},
				url: {
					type: 'string',
					format: 'uri-reference'
				},
				type: {
					type: 'string'
				},
				title: {
					type: 'string'
				},
				legende: {
					type: 'string'
				},
				credits: {
					type: 'string'
				},
				description: {
					type: 'string'
				},
				thumbnail: {
					type: 'string'
				},
				tags: {
					type: 'object'
				},
				width: {
					type: 'string'
				},
				height: {
					type: 'string'
				},
				style: {
					type: 'string'
				},
				allowfullscreen: {
					type: 'boolean'
				}
			}
		};
	}
	$beforeInsert() {
		this.date = new Date().toISOString();
	}
	$beforeUpdate() {
		if (this.date == null) this.date = new Date().toISOString();
	}
}

module.exports = Asset;

