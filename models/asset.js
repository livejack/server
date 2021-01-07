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
				meta: {
					type: 'object',
					properties: {
						type: {
							type: 'string'
						},
						title: {
							type: 'string'
						},
						description: {
							type: 'string'
						},
						html: {
							type: 'string'
						},
						icon: {
							type: 'string'
						},
						mime: {
							type: 'string'
						},
						width: {
							type: 'string'
						},
						height: {
							type: 'string'
						},
						duration: {
							type: 'string'
						},
						thumbnail: {
							type: 'string'
						},
						size: {
							type: 'string'
						}
					}
				},
				legende: {
					type: 'string'
				},
				credits: {
					type: 'string'
				},
				tags: {
					type: 'object'
				},
				style: {
					type: 'string'
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

