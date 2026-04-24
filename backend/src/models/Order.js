const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customer_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  customer_phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  queue_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  pickup_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'ready', 'picked_up', 'missed'),
    defaultValue: 'pending',
    allowNull: false
  }
});

module.exports = Order;
