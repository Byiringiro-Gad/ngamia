const { Sequelize } = require('sequelize');
require('dotenv').config({ override: false });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'ngamia_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mariadb',
    logging: false,
    dialectOptions: {
      allowPublicKeyRetrieval: true
    }
  }
);

module.exports = sequelize;
