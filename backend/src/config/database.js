const { Sequelize } = require('sequelize');
require('dotenv').config({ override: false });

let sequelize;

const poolConfig = {
  max: 10,          // max connections in pool — enough for 20 concurrent users
  min: 2,           // keep 2 warm connections always
  acquire: 10000,   // max ms to wait for a connection before throwing
  idle: 10000,      // ms a connection can sit idle before being released
};

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    pool: poolConfig,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // needed for Neon
      },
      statement_timeout: 8000,      // kill any query running > 8s
      idle_in_transaction_session_timeout: 10000,
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
      pool: poolConfig,
      dialectOptions: {
        ssl: process.env.DB_SSL === 'true'
          ? { require: true, rejectUnauthorized: false }
          : false,
        statement_timeout: 8000,
        idle_in_transaction_session_timeout: 10000,
      },
    }
  );
}

module.exports = sequelize;
