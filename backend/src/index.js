require('dotenv').config({ override: false });
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const sequelize = require('./config/database');
const models = require('./models');

const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ── Rate Limiters ──────────────────────────────────────────────────────────────
// Global: 500 requests per 15 minutes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Admin login: 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please wait 15 minutes.' },
});

app.use(globalLimiter);

// ── CORS ───────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL.replace(/\/$/, ''), 'http://localhost:5173', 'http://localhost:4173']
  : ['http://localhost:5173', 'http://localhost:4173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

// ── Request timeout ────────────────────────────────────────────────────────────
// PDF export streams so it's excluded. Everything else gets 15s.
app.use((req, res, next) => {
  if (req.path.includes('/export/')) return next();
  res.setTimeout(15000, () => {
    if (!res.headersSent) res.status(503).json({ error: 'Request timed out. Please try again.' });
  });
  next();
});

// ── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Ngamia API is running' });
});

// ── Routes ─────────────────────────────────────────────────────────────────────
const productRoutes  = require('./routes/productRoutes');
const orderRoutes    = require('./routes/orderRoutes');
const adminRoutes    = require('./routes/adminRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

app.use('/api/products',  productRoutes);
app.use('/api/orders',    orderRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/settings',  settingsRoutes);

// Login rate limiter applied after route registration (still works — Express applies middleware in order)
app.use('/api/admin/login', loginLimiter);

// ── Start ──────────────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // Keep the Neon serverless connection warm so the first real request
    // doesn't pay the cold-start penalty (~3-5s). Ping every 4 minutes.
    const keepAlive = () => {
      sequelize.query('SELECT 1').catch(() => {}); // silent — just warming the pool
    };
    keepAlive();
    setInterval(keepAlive, 4 * 60 * 1000);

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();
