async function withRetry(fn, retries = 3, delay = 200) {
    try {
        return await fn();
    } catch (err) {
        if (retries <= 0) throw err;

        console.warn(`DB error, retrying...`, err.message);
        await new Promise(res => setTimeout(res, delay));

        return withRetry(fn, retries - 1, delay * 2); // exponential backoff
    }
}

module.exports = withRetry;