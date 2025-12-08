const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'postgres',
    database: process.env.PGDATABASE || 'mydb',
    password: process.env.PGPASSWORD || 'postgres',
    port: process.env.PGPORT || 5432,
});

module.exports = pool;


// const { Pool } = require('pg');

// const pool = new Pool({
//     user: 'nafasrezaei',
//     host: 'localhost',
//     database: 'Reve',
//     password: '1415',
//     port: 5432,
// });

// module.exports = pool;


