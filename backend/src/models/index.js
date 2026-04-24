const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const TimeSlot = require('./TimeSlot');

module.exports = {
  sequelize,
  User,
  Product,
  Order,
  OrderItem,
  TimeSlot
};
