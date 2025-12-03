const { Pool } = require('pg');

const pool = new Pool({
    user: 'nafasrezaei',
    host: 'localhost',
    database: 'Reve',
    password: '',
    port: 5432,
});

module.exports = pool;
