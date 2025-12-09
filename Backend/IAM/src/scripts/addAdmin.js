const bcrypt = require('bcrypt');
const pool = require('../infrastructure/db/postgres'); 

async function addAdmin(username, email, plainPassword) {
    const hashed = await bcrypt.hash(plainPassword, 10);
    const result = await pool.query(
        `INSERT INTO Admins (username, email, password) VALUES ($1, $2, $3) RETURNING *`,
        [username, email, hashed]
    );
    console.log('Admin created:', result.rows[0]);
    process.exit(0);
}

addAdmin('superadmin', 'admin@gmail.com', '123123')
    .catch(err => {
        console.error(err);
        process.exit(1);
    });






    
// docker compose exec backend node src/scripts/addAdmin.js