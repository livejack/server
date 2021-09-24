const pg = require('pg');

// convert SQL timestamp to ISO8601 timestamp
// 2004-10-19 10:23:54.210+02 becomes 2004-10-19T10:23:54.210+02:00
pg.types.setTypeParser(
	pg.types.builtins.TIMESTAMPTZ,
	str => str.split(' ').join('T') + ":00"
);

const objection = require('objection');
objection.Models = {};

const {
	// DBError,
	ValidationError,
	NotFoundError,
	ConstraintViolationError,
	UniqueViolationError,
	NotNullViolationError,
	ForeignKeyViolationError,
	CheckViolationError,
	DataError
} = objection;

const BaseModel = require('./base');
const Knex = require('knex');
const Path = require('path');

module.exports = function (app) {
	const knex = Knex({
		client: 'pg',
		connection: app.settings.database,
		pool: {
			min: 2,
			max: 10
		}
	});

	BaseModel.knex(knex);
	objection.BaseModel = BaseModel;
	['href', 'message', 'page', 'user'].forEach((name) => {
		const model = require(Path.join('..', 'models', name));
		objection.Models[model.name] = model;
	});

	objection.tr = (fn) => {
		if (fn) return knex.transaction(fn);
		else return objection.transaction.start(knex);
	};
	objection.errorStatus = (err) => {
		if (err instanceof ValidationError
			|| err instanceof NotNullViolationError
			|| err instanceof CheckViolationError
			|| err instanceof DataError) {
			return 400;
		} else if (err instanceof NotFoundError) {
			return 404;
		} else if (err instanceof UniqueViolationError
			|| err instanceof ForeignKeyViolationError
			|| err instanceof ConstraintViolationError) {
			return 409;
		} else {
			return err.statusCode || err.code || 500;
		}
	};
	return objection;
};

