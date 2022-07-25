const express = require('express');
const { pool } = require('../database/connectionPool');
const asyncHandler = require('express-async-handler')

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
    const hobbyName = req.params.hobbyname;
     try {
      const { rows } = await pool.query('SELECT * FROM "Events" WHERE hobbyname ILIKE $1', [hobbyName]);
      if (rows.length === 0) {
        res.status(400).json({ error: 'No events in our DB' });
        return;
      }
      res.json({ events: rows });
    } catch (caughtError) {
      res.status(500).json({ error: caughtError.message });
    }
  });

router.post('/:hobbyname', async (req, res) => {
    const hobbyName = req.params.hobbyname;
    const inputObject = req.body;
    console.log(req.body);
    try {
      await pool.query('INSERT INTO "Events" (hobbyname, eventname, eventdescription, eventlocation, eventtime, creator) VALUES ($1, $2, $3, $4, $5, $6)', [hobbyName, inputObject.eventName, inputObject.eventDescription, inputObject.eventLocation, inputObject.eventTime, req.session.user.user]);
      // await pool.query('INSERT INTO "Events" (hobbyname, eventname, eventdescription, eventlocation, eventtime) VALUES ($1, $2, $3, $4, $5)', [hobbyName, inputObject.eventName, inputObject.eventDescription, inputObject.eventLocation, inputObject.eventTime]);
    } catch (caughtError) {
      return res.status(500).json({ error: caughtError.message }); 
    }
    res.json({ message: 'You have added the event' });
    // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  });

router.put('/:hobbyname/:id', asyncHandler(async (req, res) => {
  const inputObject = req.body;
  if(inputObject.creator !== req.session.user.user) return res.status(401).json({ error: 'You can only edit your own events.'})
  // await pool.query('DELETE FROM "Events" WHERE id = $1', [+req.params.id]);
  await pool.query('UPDATE "Events" SET eventname = $1, eventdescription = $2, eventlocation = $3, eventtime = $4 WHERE id = $5', [inputObject.eventName, inputObject.eventDescription, inputObject.eventLocation, inputObject.eventTime, +req.params.id]);
  res.json({message: 'You might have updated the event'});
}));

router.delete('/:hobbyname/:id', asyncHandler(async (req, res) => {
  if(req.body.creator !== req.session.user.user) return res.status(401).json({ error: 'You can only delete your own events.'})
  await pool.query('DELETE FROM "Events" WHERE id = $1', [+req.params.id]);
  res.json({message: 'Successfully deleted'});
}));

module.exports = router;
