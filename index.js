const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const argon2 = require('argon2');
const MemoryStore = require('memorystore')(session);
require('dotenv').config();
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const { pool } = require('./database/connectionPool');
const hobbies = require('./routes/hobbies');
const events = require('./routes/events');
const PORT = process.env.PORT || 3001;

const store = new MemoryStore({ checkPeriod: 86400000 });

const app = express();

app.use(express.static('static'))
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
 };
  console.log('Running in development environment');
  app.use(cors(corsOptions));
}

app.use('/login', bodyParser.json());
app.use('/register', bodyParser.json());

app.use(session({
  secret: crypto.randomBytes(64).toString('hex'),
  secure: false,
  saveUninitialized: false,
  resave: false,
  cookie: { maxAge: 60 * 60 * 24 * 1000, secure: false },
  store,
}));

app.use('/api', (req, res, next) => !req.session.user ? res.status(403).json({ loggedIn: false }) : next());

app.use('/api/hobbies', hobbies);
app.use('/api/events', events);

app.post('/register', async (req, res) => {
  const { name } = req.body;
  let password;
  try {
    password = await argon2.hash(req.body.password);
  } catch (error) {
    return res.status(500).json({ error });
  }

  try {
    const { rows } = await pool.query('SELECT username FROM "Users" WHERE username = $1', [name]);
    if (rows.length > 0) return res.status(409).json({ error: 'That name is already taken' });
  } catch (caughtError) {
    return res.status(500).json({ error: caughtError.message });
  } finally {
    if (pool != null) {
        try { pool.close(); } catch (caughtError) {}
    }
}

  try {
    await pool.query('INSERT INTO "Users" (username, password) VALUES ($1, $2)', [name, password]);
  } catch (caughtError) {
    return res.status(500).json({ error: caughtError.message });
  } finally {
    if (pool != null) {
        try { pool.close(); } catch (caughtError) {}
    }
  } 
  res.json({ message: 'You have registered' });
});

// Used for the client to check if it's logged in
app.get('/login', (req, res) => {
  try{
    if (!req.session.user) return res.json({ loggedIn: false });
    res.json({ loggedIn: true, user: req.session.user.user });
  } catch(caughtError){
    res.status(500).send({error: caughtError.message});
  }
});

app.post('/login', async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) return res.status(422).json({ error: 'You must submit a non empty name and password!' });
  try {
    const { rows } = await pool.query('SELECT username, id, password FROM "Users" WHERE username = $1', [name]);
    let verification = false;
    if (rows.length > 0) verification = await argon2.verify(rows[0].password, password);
  
    if (!verification) return res.status(403).json({ error: 'Invalid name/password combination!' });
  
    req.session.user = {
      user: rows[0].username,
      id: rows[0].id
    };
    
    res.json(req.session.user);
  } catch (e){
    res.status(500).send({error: e.message});
  } finally {
    if (pool != null) {
        try { pool.close(); } catch (caughtError) {}
    }
  }
});

app.use((error, _, res, next) => {
  res.status(500).json({ error: error.message });
  next();
});

app.post('/logout', (req, res) => {
  if (!req.session.user) return res.status(400).send('You are not logged in and can therefore not log out');
  req.session.destroy();
  res.send('You have logged out');
});

app.get('*', (_, res) => res.sendFile(__dirname + '/static/index.html'));

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));