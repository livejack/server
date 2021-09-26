exports.up = async function (knex) {
	await knex.schema.createTable('hrefs', (table) => {
		table.increments('id').primary();
		table.enu('origin', null, {
			useNative: true,
			existingType: true,
			enumName: 'assets_enum_origin'
		});
		table.timestamps(true, true);
		table.string('url', 4096).notNullable().index();
		table.string('html', 4096);
		table.string('script', 4096);
		table.string('type', 32);
		table.integer('width');
		table.integer('height');
		table.jsonb('meta').notNullable().defaultTo('{}');
		table.integer('page_id')
			.notNullable().index().unsigned()
			.references('id').inTable('pages')
			.onDelete('CASCADE');
	});
	await knex.schema.createTable('messages_hrefs', (table) => {
		table.primary(['message_id', 'href_id']);
		table.integer('message_id')
			.notNullable().index().unsigned()
			.references('id').inTable('messages')
			.onDelete('CASCADE');
		table.integer('href_id')
			.notNullable().index().unsigned()
			.references('id').inTable('hrefs');
	});

	/* not sure this is a good idea - it's better to import icons and leave the rest empty
	await knex(knex.raw('?? (??, ??, ??, ??)', [
		'hrefs', 'page_id', 'origin', 'created_at', 'url', 'width', 'height', 'type'
	])).insert(function () {
		this.from('assets').select(
			'page_id',
			'origin',
			'date',
			'url',
			'width', 'height', 'type'
		);
	});
	*/

	await knex('hrefs')
		.update('width', knex.raw("(meta->>'width')::integer"))
		.whereRaw("meta->'width' is not null");
	await knex('hrefs')
		.update('meta', knex.raw("meta - 'width'"))
		.whereRaw("meta->'width' is not null");

	await knex('hrefs')
		.update('height', knex.raw("(meta->>'height')::integer"))
		.whereRaw("meta->'height' is not null");
	await knex('hrefs')
		.update('meta', knex.raw("meta - 'height'"))
		.whereRaw("meta->'height' is not null");

	await knex('hrefs')
		.update('html', knex.raw("(meta->>'html')::text"))
		.whereRaw("meta->'html' is not null");
	await knex('hrefs')
		.update('meta', knex.raw("meta - 'html'"))
		.whereRaw("meta->'html' is not null");

	await knex('hrefs')
		.update('script', knex.raw("(meta->>'script')::text"))
		.whereRaw("meta->'script' is not null");
	await knex('hrefs')
		.update('meta', knex.raw("meta - 'script'"))
		.whereRaw("meta->'script' is not null");

	await knex('hrefs')
		.update('type', knex.raw("(meta->>'type')::text"))
		.whereRaw("meta->'type' is not null");
	await knex('hrefs')
		.update('meta', knex.raw("meta - 'type'"))
		.whereRaw("meta->'type' is not null");

	await knex('hrefs')
		.update('meta', knex.raw("jsonb_set(meta, '{keywords}', meta->'tags')"))
		.whereRaw("meta->'tags' is not null");
	await knex('hrefs')
		.update('meta', knex.raw("meta - 'tags'"))
		.whereRaw("meta->'tags' is not null");
};

exports.down = function (knex) {
	return knex.schema.dropTable('messages_hrefs').dropTable('hrefs');
};



