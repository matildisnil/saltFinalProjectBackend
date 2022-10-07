require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.DB_PORT,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

module.exports.pool = pool;
