class AdminRepository {
    findByEmail(email) {
        throw new Error("AdminRepository.findByEmail not implemented");
    }

    findById(id) {
        throw new Error("AdminRepository.findById not implemented");
    }

    create(admin) {
        throw new Error("AdminRepository.create not implemented");
    }

    updatePassword(email, hashedPassword) {
        throw new Error("AdminRepository.updatePassword not implemented");
    }
}

module.exports = AdminRepository;
