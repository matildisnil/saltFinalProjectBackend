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
const fs = require('fs')
const PORT = process.env.PORT || 3001;

const store = new MemoryStore({ checkPeriod: 86400000 });

const app = express();

app.use(express.static('static'))

// const myLogger = (req, res, next) => {
//   console.log('LOGGED')
//   next()
// }

// const isLoggedIn = (reqSession) =>

// {
//   if (!reqSession.user) {
//     return false;
//   }
//   return true;
// };

app.use(express.json());

// const whitelist = ['http://localhost:3000', 'http://salt-final-project-frontend.herokuapp.com', 'https://salt-final-project-frontend.herokuapp.com'];
// const corsOptions = {
//   origin(origin, callback) {
//     if (!origin || whitelist.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
// };
// app.use(cors(corsOptions));

// use the more modern express bodyparser later here instead
app.use('/login', bodyParser.json());
app.use('/register', bodyParser.json());

app.use(session({
  // Randomly generating a session secret causes all sessions to become invalid
  // when the server restarts. We are ok with this.
  secret: crypto.randomBytes(64).toString('hex'),
  secure: false,
  saveUninitialized: false,
  resave: false,
  cookie: { maxAge: 60 * 60 * 24 * 1000, secure: false },
  store,
}));

app.use('/api/hobbies', (req, res, next) => (!req.session.user ? res.status(403).json({ loggedIn: false }) : next()));

app.use('/api/hobbies', hobbies);

app.post('/register', async (req, res) => {
  const { name } = req.body;
  let password;
  try {
    password = await argon2.hash(req.body.password);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
    return;
  }

  try {
    const { rows } = await pool.query('SELECT username FROM "Users" WHERE username = $1', [name]);
    if (rows.length > 0) {
      res.status(409).json({ error: 'That name is already taken' });
      return;
    }
  } catch (caughtError) {
    res.status(500).json({ error: caughtError.message });
    return;
  }

  try {
    await pool.query('INSERT INTO "Users" (username, password) VALUES ($1, $2)', [name, password]);
  } catch (caughtError) {
    res.status(500).json({ error: caughtError.message });
    return;
  }

  res.json({ message: 'You have registered' });
});

// Used for the client to check if it's logged in
app.get('/login', (req, res) => {
  if (!req.session.user) {
    res.json({ loggedIn: false });
    return;
  };
  res.json({ loggedIn: true, user: req.session.user.user });
});

app.post('/login', asyncHandler(async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    res.status(422).json({ error: 'You must submit a non empty name and password!' });
    return;
  }

  const { rows } = await pool.query('SELECT username, id, password FROM "Users" WHERE username = $1', [name]);
  let verification = false;
  // If the supplied name was found in the database
  if (rows.length > 0) {
    // Checks that the supplied password is correct and sets verification to true if it is
    verification = await argon2.verify(rows[0].password, password);
  }

  if (!verification) {
    res.status(403).json({ error: 'Invalid name/password combination!' });
  }

  const returnObject = {};

  returnObject.user = rows[0].username;
  returnObject.id = rows[0].id;
  req.session.user = returnObject;
  res.json(returnObject);
}));

app.use((error, req, res, next) => {
  res.status(500).json({ error: error.message });
  next();
});

app.post('/logout', (req, res) => {
  if (!req.session.user) {
    res.status(400).send('You are not logged in and can therefore not log out');
    return;
  }

  req.session.destroy();
  res.send('You have logged out');
});

app.get('*', (_, res) => {
  // res.type('.html')
  //   .render()
  // fs.readFileSync('./static/index.html')
  res.sendFile(__dirname + '/static/index.html')
});
// app.get('*', express.static('/static/index.html'));

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
