const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'ngamia_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mariadb',
    logging: false,
    dialectOptions: {
      allowPublicKeyRetrieval: true
    }
  }
);

module.exports = sequelize;
