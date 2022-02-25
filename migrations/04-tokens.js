exports.up = async function (knex) {
	if (!await knex.schema.hasColumn('users', 'tokens')) {
		await knex.schema.table('users', (table) => {
			table.jsonb('tokens');
		});
	}
};

exports.down = async function (knex) {
	if (await knex.schema.hasColumn('users', 'tokens')) {
		await knex.schema.table('users', (table) => {
			table.dropColumn('tokens');
		});
	}
};

