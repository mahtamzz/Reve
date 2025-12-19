class BcryptHasher {
    async hash(password) {
        return bcrypt.hash(password, 10);
    }

    async compare(password, hash) {
        return bcrypt.compare(password, hash);
    }
}

module.exports = new BcryptHasher();
