const { Sequelize } = require('sequelize');
require('dotenv').config({ override: false });

let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // needed for Neon
      },
    },
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'ngamia_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: process.env.DB_SSL === 'true'
          ? { require: true, rejectUnauthorized: false }
          : false,
      },
    }
  );
}

module.exports = sequelize;
