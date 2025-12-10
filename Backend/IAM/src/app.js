const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const swaggerUI = require("swagger-ui-express");
const swaggerSpec = require("./infrastructure/docs/swagger");

require("./config/passport");

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false
}));

app.set('trust proxy', true);

app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", require("./interfaces/http/routes/auth.routes"));
app.use("/api/users", require("./interfaces/http/routes/user.routes"));

app.get("/api/docs/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});

app.use("/api/docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));


module.exports = app;
