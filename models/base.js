const { Model, AjvValidator } = require('objection');
const AjvKeywords = require('ajv-keywords');

class BaseQueryBuilder extends Model.QueryBuilder {
	sortBy(list) {
		if (!Array.isArray(list)) list = [list];
		list.forEach(str => {
			let dir = 'asc';
			if (str.startsWith('-')) {
				str = str.slice(1);
				dir = 'desc';
			}
			this.orderBy(str, dir);
		});
		return this;
	}
	select(...args) {
		if (args.length == 0) {
			const model = this.modelClass();
			const table = this.tableRefFor(model);
			args = model.columns.map(col => `${table}.${col}`);
		}
		return super.select(...args);
	}
	limit(num) {
		if (num == Infinity || num == null) return this;
		else return super.limit(num);
	}
}

module.exports = class BaseModel extends Model {
	static get QueryBuilder() {
		return BaseQueryBuilder;
	}
	static get columns() {
		return Object.keys(this.jsonSchema.properties);
	}
	static get modifiers() {
		return {
			select(builder) {
				builder.select();
			},
			order(builder) {
				builder.orderBy('created_at');
			}
		};
	}
	static createValidator() {
		return new AjvValidator({
			onCreateAjv: (ajv) => {
				AjvKeywords(ajv);
			},
			options: {
				$data: true,
				allErrors: true,
				validateSchema: false,
				ownProperties: true,
				coerceTypes: 'array',
				removeAdditional: "all",
				nullable: true,
				formats: {
					singleline: /^[^\n\r]*$/,
					pathname: /^(\/[\w-.]*)+$/,
					id: /^[\w-]+$/
				}
			}
		});
	}
};