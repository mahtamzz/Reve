const env = require('./config/env');
const app = require('./app');

app.listen(env.PORT, () => {
    console.log(
        `[${env.SERVICE_NAME}] running on port ${env.PORT}`
    );
});
