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

// Global Rate Limiter: 100 requests per 15 minutes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});

// Stricter limiter for order creation: 5 orders per 30 minutes per IP
const orderLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  message: { error: 'Order limit exceeded. Please wait before placing another order.' },
});

app.use(globalLimiter);
app.use('/api/orders', orderLimiter);

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
