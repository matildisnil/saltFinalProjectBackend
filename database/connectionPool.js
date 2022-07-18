require ('dotenv').config();

const { Pool } = require('pg');// const db = require('./db');

const pool = new Pool({  
  user: process.env.DB_USER, 
  host: process.env.DB_HOST, 
  database: process.env.DATABASE, 
  password: process.env.PASSWORD, 
  port: process.env.DB_PORT,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 2000,
});

// export default pool;
module.exports.pool = pool;

// module.exports = {
//   query: async (text, params) => {
//     const { rows } = await pool.query(text, params);
//     return rows;
//   }
// };
 // Put the port in an environment variable later