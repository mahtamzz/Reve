class IamClient {
    constructor({ baseUrl }) {
        this.baseUrl = baseUrl; // e.g. process.env.IAM_BASE_URL
    }

    async changePassword(userAuthHeader, body) {
        const res = await fetch(`${this.baseUrl}/api/auth/me/password`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: userAuthHeader
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
