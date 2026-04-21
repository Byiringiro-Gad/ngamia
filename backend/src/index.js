require('dotenv').config({ override: false });
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const models = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

// Allow requests from your frontend (update FRONTEND_URL in env)
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
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
    
    // Sync models (In production, use migrations)
    await sequelize.sync({ force: false });
    console.log('Database synced.');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();
