const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

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

app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/users", require("./interfaces/http/routes/user.routes"));
app.use("/api/auth", require("./interfaces/http/routes/auth.routes"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = app;
