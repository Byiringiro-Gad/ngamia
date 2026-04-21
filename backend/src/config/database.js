const { Sequelize } = require('sequelize');
require('dotenv').config({ override: false });

let sequelize;

if (process.env.DATABASE_URL) {
  // Use full connection URL if provided
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mariadb',
    logging: false,
    dialectOptions: {
      allowPublicKeyRetrieval: true,
      connectTimeout: 60000,
    },
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'ngamia_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      dialect: 'mariadb',
      logging: false,
      dialectOptions: {
        allowPublicKeyRetrieval: true,
        connectTimeout: 60000,
      },
    }
  );
}

module.exports = sequelize;
