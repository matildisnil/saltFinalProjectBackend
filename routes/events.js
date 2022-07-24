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
    // console.log(rows);
    res.json({ events: rows });

  } catch (caughtError) {
    res.status(500).json({ error: caughtError.message });
  }
})

router.get('/:hobbyname', async (req, res) => {
    const hobbyName = req.params.hobbyname;
     try {
      const { rows } = await pool.query('SELECT * FROM "Events" WHERE hobbyname ILIKE $1', [hobbyName]);
      if (rows.length === 0) {
        res.status(400).json({ error: 'No events in our DB' });
        return;
      }
      // console.log(rows);
      res.json({ events: rows });
    } catch (caughtError) {
      res.status(500).json({ error: caughtError.message });
    }
  });

router.post('/:hobbyname', async (req, res) => {
    const hobbyName = req.params.hobbyname;
    const inputObject = req.body;
    try {
      await pool.query('INSERT INTO "Events" (hobbyname, eventname, eventdescription, eventlocation, eventtime) VALUES ($1, $2, $3, $4, $5)', [hobbyName, inputObject.eventName, inputObject.eventDescription, inputObject.eventLocation, inputObject.eventTime]);
    } catch (caughtError) {
      return res.status(500).json({ error: caughtError.message }); 
    }
    res.json({ message: 'You have added the event' });
    // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  });

module.exports = router;