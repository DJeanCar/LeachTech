import knex from 'knex';
import knexFile from './knexfile.cjs';

let db = null;

console.log('>>>>envv', process.env.NODE_ENV);
if (process.env.NODE_ENV === "test") {
  db = knex(knexFile.test); 
} else {
  db = knex(knexFile.development);
}

export default db;
