const express = require('express');
const { pool } = require('../database/connectionPool');

const router = express.Router();

router.get('/', async (req, res) => {

  // const { rows } = await pool.query('SELECT username FROM "Users" WHERE username = $1', [name]);

  try {
    const { rows } = await pool.query('SELECT * FROM "Hobbies"');
    if (rows.length === 0) {
      res.status(400).json({ error: 'DB has no hobbies' });
      return;
    }
    // console.log(rows);
    res.json({ hobbies: rows });
  } catch (caughtError) {
    res.status(500).json({ error: caughtError.message });
  }
});

router.get('/:hobbyname', async (req, res) => {
  const hobbyName = req.params.hobbyname;
  try {
    const { rows } = await pool.query('SELECT * FROM "Hobbies" WHERE hobbyname ILIKE  $1', [hobbyName]);
    if (rows.length === 0) {
      res.status(400).json({ error: 'No such hobby in our DB' });
      return;
    }
    res.json({ hobby: rows[0] });
  } catch (caughtError) {
    res.status(500).json({ error: caughtError.message });
  }
})

module.exports = router;
