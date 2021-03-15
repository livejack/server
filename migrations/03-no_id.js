exports.up = async function (knex) {
	if (await knex.schema.hasColumn('pages', '_id')) {
		await knex.schema.table('pages', function (table) {
			table.dropColumn('_id');
		});
	}
	if (await knex.schema.hasColumn('messages', '_id')) {
		await knex.schema.table('messages', function (table) {
			table.dropColumn('_id');
		});
	}
};

exports.down = async function (knex) {
	await knex.schema.table('pages', function (table) {
		table.string('_id');
	});
	await knex.schema.table('messages', function (table) {
		table.string('_id');
	});
};

