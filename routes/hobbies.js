const express = require('express');
const { pool } = require('../database/connectionPool');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM "Hobbies"');
    if (rows.length === 0) {
      res.status(404).json({ error: 'DB has no hobbies' });
      return;
    }
    res.json({ hobbies: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (pool != null) {
        try { pool.close(); } catch {}
    }
  }
});

router.get('/:hobbyname', async (req, res) => {
  const hobbyName = req.params.hobbyname;
  try {
    const { rows } = await pool.query(`
      SELECT * FROM "Hobbies" 
      WHERE hobbyname ILIKE  $1`, 
      [hobbyName]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'No such hobby in our DB' });
      return;
    }
    res.json({ hobby: rows[0] });
  } catch (caughtError) {
    res.status(500).json({ error: caughtError.message });
  } finally {
    if (pool != null) {
        try { pool.close(); } catch {}
    }
  }
});

module.exports = router;
