const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

const app = express();

// Session setup (SQLite file in project root)
app.use(
  session({
    store: new SQLiteStore({ db: 'sessions.sqlite', dir: '.' }),
    secret: 'your-secret-key', // change this in production
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
  })
);

// Example route
app.get('/', (req, res) => {
  // Count visits
  if (!req.session.views) req.session.views = 1;
  else req.session.views += 1;

  res.send(`Hello Hair Salon! You visited ${req.session.views} times.`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
