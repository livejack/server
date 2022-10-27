const { BaseModel, Models } = require('objection');

class Href extends BaseModel {
	static get tableName() {
		return 'hrefs';
	}

	static get relationMappings() {
		return {
			page: {
				relation: BaseModel.BelongsToOneRelation,
				modelClass: Models.Page,
				join: {
					from: 'hrefs.page_id',
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
				created_at: {
					type: 'string',
					format: 'date-time'
				},
				updated_at: {
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
				html: {
					type: 'string'
				},
				script: {
					type: 'string'
				},
				width: {
					type: 'string'
				},
				height: {
					type: 'string'
				},
				meta: {
					type: 'object',
					properties: {
						title: {
							type: 'string'
						},
						description: {
							type: 'string'
						},
						what: {
							type: 'string'
						},
						author: {
							type: 'string'
						},
						icon: {
							type: 'string'
						},
						mime: {
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
						},
						date: {
							type: 'string'
						},
						site: {
							type: 'string'
						},
						keywords: {
							type: 'array',
							nullable: true,
							items: {
								type: 'string'
							}
						}
					}
				}
			}
		};
	}
	static get modifiers() {
		return Object.assign({
			minimalSelect(builder) {
				builder.select("url", "width", "height", "type", "html", "script");
			}
		}, super.modifiers);
	}
	$beforeUpdate() {
		this.updated_at = new Date().toISOString();
	}
}

module.exports = Href;

