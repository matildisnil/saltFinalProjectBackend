const express = require('express');
const { pool } = require('../database/connectionPool');

const router = express.Router();

router.get('/', async (req, res) => {
  console.log(req.session);

  // const { rows } = await pool.query('SELECT username FROM "Users" WHERE username = $1', [name]);

  try {
    const { rows } = await pool.query('SELECT * FROM "Hobbies"');
    if (rows.length === 0) {
      res.status(400).json({ error: 'DB has no hobbies' });
      return;
    }
    console.log(rows);
    res.json({ hobbies: rows });
  } catch (caughtError) {
    res.status(500).json({ error: caughtError.message });
  }
});

module.exports = router;
