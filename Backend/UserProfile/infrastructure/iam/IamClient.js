class IamClient {
    constructor({ baseUrl }) {
        this.baseUrl = baseUrl;
    }

    async changePassword(userAuthHeader, body) {
        if (!userAuthHeader) {
            throw new Error("Missing Authorization header when calling IAM");
        }

        const auth =
            userAuthHeader.startsWith("Bearer ")
                ? userAuthHeader
                : `Bearer ${userAuthHeader}`;

        const res = await fetch(`${this.baseUrl}/api/auth/me/password`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": auth
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`IAM changePassword failed: ${res.status} ${text}`);
        }
    }
}

module.exports = IamClient;
