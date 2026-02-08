const bcrypt = require("bcrypt");
const PostgresClient = require("../infrastructure/db/postgres");

function mustGetEnv(name) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;
}

async function main() {
    const username = mustGetEnv("ADMIN_USERNAME");
    const email = mustGetEnv("ADMIN_EMAIL");
    const plainPassword = mustGetEnv("ADMIN_PASSWORD");

    if (plainPassword.length < 8) {
        throw new Error("ADMIN_PASSWORD must be at least 8 characters");
    }

    const db = new PostgresClient({ database: "iam_db" });

    const hashed = await bcrypt.hash(plainPassword, 10);

    const result = await db.query(
        `
    INSERT INTO Admins (username, email, password)
    VALUES ($1, $2, $3)
    ON CONFLICT (email) DO UPDATE
        SET username = EXCLUDED.username,
            password = EXCLUDED.password,
            updated_at = now()
    RETURNING id, username, email, created_at, updated_at
    `,
        [username, email, hashed]
    );

    console.log("Admin upserted:", result.rows[0]);
    process.exit(0);
}

main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
});


// docker compose exec \
//   -e ADMIN_USERNAME=super \
//   -e ADMIN_EMAIL=super@mail.com \
//   -e ADMIN_PASSWORD='aaaaaaaa' \
//   iam_service node scripts/addAdmin.js
