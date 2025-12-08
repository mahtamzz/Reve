const pool = require("../db/postgres");

class UserRepository {
    async findByEmail(email) {
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        return result.rows[0];
    }

    async create(user) {
        const result = await pool.query(
            `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3) RETURNING *`,
            [user.username, user.email, user.password]
        );
        return result.rows[0];
    }

    async updatePassword(email, hashedPassword) {
        await pool.query(
            "UPDATE users SET password = $1 WHERE email = $2",
            [hashedPassword, email]
        );
    }

    async findById(id) {
        const result = await pool.query(
            "SELECT id, username, email FROM users WHERE id = $1",
            [id]
        );
        return result.rows[0];
    }

    async findByGoogleIdOrEmail(googleId, email) {
        const result = await pool.query(
            "SELECT * FROM users WHERE googleid = $1 OR email = $2",
            [googleId, email]
        );
        return result.rows[0];
    }

    async createGoogleUser({ googleid, email, username }) {
        const result = await pool.query(
            `INSERT INTO users (googleid, email, username)
     VALUES ($1, $2, $3) RETURNING *`,
            [googleid, email, username]
        );
        return result.rows[0];
    }

}

module.exports = new UserRepository();
