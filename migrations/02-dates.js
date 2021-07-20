exports.up = async function (knex) {
	await knex.schema.table('pages', function (table) {
		table.timestamps(true, true);
	});
	await knex('pages').update('created_at', knex.ref('date'));
	await knex('pages').update('updated_at', knex.ref('update')).whereNotNull('update');
	await knex.schema.table('pages', function (table) {
		table.dropColumn('date');
		table.dropColumn('update');
	});
	await knex.schema.table('pages', function (table) {
		table.renameColumn('start', 'start_noz');
		table.renameColumn('stop', 'stop_noz');
	});

	await knex.schema.table('pages', function (table) {
		table.timestamp('start', { useTz: true });
		table.timestamp('stop', { useTz: true });
	});

	await knex('pages').update('start', knex.ref('start_noz'));
	await knex('pages').update('stop', knex.ref('stop_noz'));

	await knex.schema.table('pages', function (table) {
		table.dropColumn('start_noz');
		table.dropColumn('stop_noz');
	});

	await knex.schema.table('messages', function (table) {
		table.timestamps(true, true);
	});
	await knex('messages').update('created_at', knex.ref('date'));
	await knex('messages').update('updated_at', knex.ref('update')).whereNotNull('update');

	await knex.schema.table('messages', function (table) {
		table.renameColumn('date', 'date_noz');
	});
	await knex('messages').update('date', knex.ref('date_noz'));
	await knex.schema.table('messages', function (table) {
		table.dropColumn('date_noz');
	});

	await knex.schema.table('messages', function (table) {
		table.dropColumn('update');
	});
};

exports.down = async function (knex) {
	await knex.schema.table('pages', function (table) {
		table.dropTimestamps();
	});
	await knex.schema.table('messages', function (table) {
		table.dropTimestamps();
	});
};


