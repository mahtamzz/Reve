const express = require("express");
const bodyParser = require("body-parser");

const groupRoutes = require("./interfaces/http/routes/groupRoutes");
const groupMemberRoutes = require("./interfaces/http/routes/groupMemberRoutes");

function createApp({ controllers }) {
    const app = express();

    app.use(bodyParser.json());

    app.use("/groups", groupRoutes(controllers.groupController));
    app.use(
        "/groups/:groupId/members",
        groupMemberRoutes(controllers.groupMemberController)
    );

    app.use((err, req, res, next) => {
        console.error(err);
        res.status(400).json({ error: err.message });
    });

    return app;
}

module.exports = createApp;
