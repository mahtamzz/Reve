const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUI = require("swagger-ui-express");
const swaggerSpec = require("./infrastructure/docs/swagger"); 

const profileRoutes = require('./interfaces/http/routes/profile.routes');

const app = express();

app.set('trust proxy', 1);

// CORS (adjust origin later when using gateway)
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie']
}));

app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/profile', profileRoutes);

app.use("/api/docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));

// Health check (important for orchestration)
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

module.exports = app;
