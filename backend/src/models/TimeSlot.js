const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TimeSlot = sequelize.define('TimeSlot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 20
  },
  current_usage: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
});

module.exports = TimeSlot;
