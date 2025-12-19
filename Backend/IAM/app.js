const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const swaggerUI = require("swagger-ui-express");
const swaggerSpec = require("./infrastructure/docs/swagger");

require("./config/passport");

const app = express();

app.set("trust proxy", 1); 

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"]
}));

app.use(cookieParser());

app.use(express.json());

app.use(passport.initialize());

app.use("/api/auth", require("./interfaces/http/routes/auth.routes"));

app.get("/api/docs/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});

app.use("/api/docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));

module.exports = app;
