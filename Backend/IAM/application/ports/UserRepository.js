class UserRepository {
    findByEmail(email) {
        throw new Error("UserRepository.findByEmail not implemented");
    }

    findById(id) {
        throw new Error("UserRepository.findById not implemented");
    }

    create(user) {
        throw new Error("UserRepository.create not implemented");
    }

    updatePassword(email, hashedPassword) {
        throw new Error("UserRepository.updatePassword not implemented");
    }

    findByGoogleIdOrEmail(googleId, email) {
        throw new Error("UserRepository.findByGoogleIdOrEmail not implemented");
    }

    createGoogleUser(user) {
        throw new Error("UserRepository.createGoogleUser not implemented");
    }
}

module.exports = UserRepository;
