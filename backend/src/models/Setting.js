const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Single-row settings table — always has exactly one row (id=1).
// Use Setting.getSetting() / Setting.setSetting() helpers.
const Setting = sequelize.define('Setting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  is_open: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true, // platform open by default
  },
  closed_message: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
});

// Returns the single settings row, creating it if it doesn't exist yet.
Setting.getSetting = async () => {
  const [row] = await Setting.findOrCreate({
    where: { id: 1 },
    defaults: { is_open: true, closed_message: null },
  });
  return row;
};

module.exports = Setting;
