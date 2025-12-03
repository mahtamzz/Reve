require("dotenv").config();
const cors = require("cors");
const express = require("express");
const passport = require("passport");
const session = require("express-session");

require("./config/passport");

const app = express();

app.use(cors({
    origin: "http://localhost:5173",   
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
}));

app.use(session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }   // set secure: true only if using HTTPS
}));

// Middleware
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/users", require("./routes/users"));
app.use("/api/auth", require("./routes/auth"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
