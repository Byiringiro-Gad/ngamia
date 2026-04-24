const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  max_per_customer: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5
  },
  image_url: {
    type: DataTypes.TEXT,   // TEXT to store base64 encoded images
    allowNull: true
  }
});

module.exports = Product;
