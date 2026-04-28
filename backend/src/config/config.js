require('dotenv').config({ path: '../../.env' });

const commonConfig = {
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'ngamia_db',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  dialect: 'postgres',
  dialectOptions: {
    ssl: (process.env.DB_SSL === 'true' || process.env.DATABASE_URL)
      ? { require: true, rejectUnauthorized: false }
      : false,
  },
};

if (process.env.DATABASE_URL) {
  commonConfig.url = process.env.DATABASE_URL;
  commonConfig.use_env_variable = 'DATABASE_URL';
}

module.exports = {
  development: commonConfig,
  test: commonConfig,
  production: commonConfig,
};
