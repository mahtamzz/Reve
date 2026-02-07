class ListUsers {
    constructor({ userRepo }) {
        this.userRepo = userRepo;
    }

    async execute({ page = 1, limit = 20 }) {
        page = Number(page);
        limit = Number(limit);

        if (!Number.isInteger(page) || !Number.isInteger(limit)) {
            throw new Error("INVALID_PAGINATION");
        }

        if (page < 1 || limit < 1 || limit > 100) {
            throw new Error("INVALID_PAGINATION");
        }

        const offset = (page - 1) * limit;

        const { users, total } = await this.userRepo.listUsers({
            limit,
            offset
        });

        return {
            data: users,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
}

module.exports = ListUsers;
