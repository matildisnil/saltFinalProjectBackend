const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const argon2 = require('argon2');
const { pool } = require('./database/connectionPool');
require('dotenv').config();
const asyncHandler = require('express-async-handler');
const PORT = process.env.PORT || 3001;

const memoryStore = require('memorystore')(session);
const store = new memoryStore({checkPeriod: 86400000});

const app = express();

app.use(express.json());

app.use(cors({
  origin: [process.env.ORIGIN],
  methods: ['GET', 'POST'],
  credentials: true,
}));

// use the more modern express bodyparser later here instead
app.use('/login', bodyParser.json());
app.use('/register', bodyParser.json());


app.use(session({
  // Randomly generating a session secret causes all sessions to become invalid
  // when the server restarts. We are ok with this.
  secret: require('crypto').randomBytes(64).toString('hex'),
  secure: false,
  saveUninitialized: false,
  resave: false,
  cookie: {maxAge: 60 * 60 * 24 * 1000, secure: false},
  store
}));

app.post('/register', async (req, res) => {
  const name = req.body.name;
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
    // const { rows } = await pool.query('SELECT "username" FROM public."Users" WHERE "username" = $1', [name]);
  // console.log('rowgate', rows);
  if (rows.length > 0) {
    res.status(409).json({ error: 'That name is already taken' });
	  return;
  }} catch (caughtError) {
    //res.status(500).json({ error: 'Internal server error1' });
    res.status(500).json({ error: caughtError.message });
    return;
  };

  try {
  await pool.query('INSERT INTO "Users" (username, password) VALUES ($1, $2)', [name, password]);
  } catch (caughtError) {
    res.status(500).json({ error: caughtError.message });
    return;
  };
  
  res.json({ message: 'You have registered' });
  return;
});

// Used for the client to check if it's logged in
app.get('/login', (req, res) => {
  if (!req.session.user) {
    res.json({ loggedIn: false });
	return;
  }
  
  res.json({ loggedIn: true, user: req.session.user.user });
});

app.post('/login', asyncHandler(async (req, res, next) => {

  const  { name, password } = req.body;
  
  if (!name || !password) {
    res.status(422).json({ error: 'You must submit a non empty name and password!'});
	return;
  }

  const { rows } = await pool.query('SELECT username, id, password FROM "Users" WHERE username = $1', [name]);
  let verification = false;
  const hash = await argon2.hash(password);
  // If the supplied name was found in the database
  if (rows.length > 0) {
    // Checks that the supplied password is correct and sets verification to true if it is
    verification = await argon2.verify(rows[0].password, password);
  }

  if (!verification) {
    res.status(403).json({ error: 'Invalid name/password combination!' }); 
  }

  const returnObject = {};
  
  ({username: returnObject.user, id: returnObject.id} = rows[0]);
    req.session.user = returnObject;
    res.json(returnObject);
  return;

}));

app.use((error, req, res, next) => {
  res.status(500).json({ error: error.message});
});

app.post('/logout', (req, res) => {
  if (!req.session.user) {
    res.status(400).send('You are not logged in and can therefore not log out');
	return;
  }
  
  req.session.destroy();
  res.send('You have logged out');
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
