module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: `${__dirname}/dev.sqlite3`,
    },
    pool: { min: 1, max: 10 },
    migrations: {
      directory: `${__dirname}/migrations`,
    },
    useNullAsDefault: true,
  },
  test: {
    client: "sqlite3",
    connection: ":memory:",
    useNullAsDefault: true,
    migrations: {
      directory: `${__dirname}/migrations`,
    },
  },
};
