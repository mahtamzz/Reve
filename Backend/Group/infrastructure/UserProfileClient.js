class UserProfileClient {
    constructor({ baseUrl }) {
        this.baseUrl = baseUrl; // e.g. process.env.USER_PROFILE_BASE_URL
    }

    // fetch public profile fields for a set of uids.
    async getPublicProfilesBatch(userAuthHeader, uids) {
        const res = await fetch(`${this.baseUrl}/api/profile/public/batch`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(userAuthHeader ? { Authorization: userAuthHeader } : {})
            },
            body: JSON.stringify({ uids })
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`UserProfile getPublicProfilesBatch failed: ${res.status} ${text}`);
        }

        const data = await res.json();

        // Expecting { items: [...] }
        if (!data || !Array.isArray(data.items)) return [];

        return data.items;
    }
}

module.exports = UserProfileClient;
