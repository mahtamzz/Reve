class GroupClient {
    constructor({ baseUrl }) {
        this.baseUrl = baseUrl.replace(/\/$/, "");
    }

    async getMyMembership({ groupId, cookieHeader }) {
        const res = await fetch(
            `${this.baseUrl}/api/groups/${groupId}/members/me`,
            {
                method: "GET",
                headers: {
                    // 🔐 forward browser cookies verbatim
                    Cookie: cookieHeader
                }
            }
        );

        if (res.status === 401) {
            const err = new Error("Unauthorized");
            err.code = "UNAUTHORIZED";
            throw err;
        }

        if (res.status === 403) {
            return { isMember: false, role: null };
        }

        if (!res.ok) {
            const err = new Error(`Group service error (${res.status})`);
            err.code = "GROUP_SERVICE_ERROR";
            throw err;
        }

        return res.json();
    }
}

module.exports = GroupClient;
