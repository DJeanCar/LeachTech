
exports.up = function(knex) {
    return knex.schema.createTable('product', table => {
      table.increments('id');
      table.string('productId').notNullable().unique();
      table.string('name').notNullable();
      table.timestamp("createdAt").defaultTo(knex.fn.now());
      table.timestamp("updatedAt").defaultTo(knex.fn.now());
    })
    .createTable('history', table => {
      table.increments('id');
      table.string('product').notNullable();
      table.timestamp('date').notNullable();
      table.integer('amount').notNullable();
      table.string('operation').notNullable();
      table.timestamp("createdAt").defaultTo(knex.fn.now());
      table.timestamp("updatedAt").defaultTo(knex.fn.now());
  
      table.foreign('product').references('productId').inTable('product');
    })
    .createTable('stock', table => {
      table.increments('id');
      table.string('product').notNullable().unique();;
      table.integer('amount').defaultTo(0);
      table.timestamp("createdAt").defaultTo(knex.fn.now());
      table.timestamp("updatedAt").defaultTo(knex.fn.now());
  
      table.foreign('product').references('productId').inTable('product');
    })
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('stock').dropTable('history').dropTable('product');
  };
  