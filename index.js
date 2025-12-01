require("dotenv").config();
require("./config/passport");

const express = require("express");
const passport = require("passport");

const app = express();

// Middleware
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use("/api/users", require("./routes/users"));
app.use("/api/auth", require("./routes/auth"));
// app.use("/api/groups", require("./routes/groups"));
// app.use("/api/sessions", require("./routes/sessions"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));