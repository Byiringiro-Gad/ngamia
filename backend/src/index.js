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
// Global: 500 requests per 15 minutes — supports 20+ concurrent users comfortably
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Admin login: 10 attempts per 15 minutes per IP (brute-force protection only)
// Order creation has NO per-IP limit — the duplicate-order business logic already
// prevents a single customer from placing more than one active order.
// A per-IP limit would block all users sharing the same network/NAT.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please wait 15 minutes.' },
});

app.use(globalLimiter);

// Allow requests from your frontend
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL.replace(/\/$/, ''), 'http://localhost:5173', 'http://localhost:4173']
  : ['http://localhost:5173', 'http://localhost:4173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // curl, Postman, mobile
    if (allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

// ── Request timeout: abort slow requests after 15s ─────────────────────────────
// PDF export is excluded — it streams and can legitimately take longer.
app.use((req, res, next) => {
  if (req.path.includes('/export/')) return next(); // skip for streaming PDF
  res.setTimeout(15000, () => {
    if (!res.headersSent) {
      res.status(503).json({ error: 'Request timed out. Please try again.' });
    }
  });
  next();
});

// Basic test route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Ngamia API is running' });
});

// Import routes
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
// Apply login rate limiter specifically to the login endpoint
app.use('/api/admin/login', loginLimiter);

// Sync Database and Start Server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    
    // Migrations are now handled via Sequelize CLI.
    // Run `npx sequelize-cli db:migrate` to apply changes.
    console.log('Database ready for operations.');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();
