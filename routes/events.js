const express = require('express');
const { pool } = require('../database/connectionPool');

const router = express.Router();

router.get('/', async (req, res) => {
   try {
    const { rows } = await pool.query('SELECT * FROM "Events"');
    if (rows.length === 0) {
      res.status(400).json({ error: 'No events in our DB' });
      return;
    }
    console.log(rows);
    res.json({ events: rows });
  } catch (caughtError) {
    res.status(500).json({ error: caughtError.message });
  }
})

router.get('/:hobbyname', async (req, res) => {
    console.log('hello');
    const hobbyName = req.params.hobbyname;
    console.log(hobbyName);
     try {
      const { rows } = await pool.query('SELECT * FROM "Events" WHERE hobbyname ILIKE $1', [hobbyName]);
      if (rows.length === 0) {
        res.status(400).json({ error: 'No events in our DB' });
        return;
      }
      console.log(rows);
      res.json({ events: rows });
    } catch (caughtError) {
      res.status(500).json({ error: caughtError.message });
    }
  });

router.post('/:hobbyname', async (req, res) => {
    const hobbyName = req.params.hobbyname;
    const inputObject = req.body;
    console.log(inputObject);
  
    try {
      await pool.query('INSERT INTO "Users" (username, password) VALUES ($1, $2)', [name, password]);
    } catch (caughtError) {
      res.status(500).json({ error: caughtError.message });
      return;
    }
  
    res.json({ message: 'You have registered' });
  });

module.exports = router;
