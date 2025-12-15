const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// ------------------ Middleware ------------------
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.use(session({
  secret: "super-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 * 2 }
}));

// ------------------ Database ------------------
const db = new sqlite3.Database("./database.sqlite");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      service TEXT,
      date TEXT,
      time TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS blocked_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      time TEXT
    )
  `);

  // Create default admin ONCE
  const hashed = bcrypt.hashSync("password123", 10);
  db.get("SELECT * FROM admin WHERE username = 'admin'", (err, row) => {
    if (!row) {
      db.run("INSERT INTO admin (username, password) VALUES (?, ?)", ["admin", hashed]);
      console.log("Admin created: admin | password123");
    }
  });
});

// ------------------ Auth Middleware ------------------
function mustBeLoggedIn(req, res, next) {
  if (!req.session.admin) return res.status(401).json({ error: "Unauthorized" });
  next();
}

// ------------------ Routes ------------------
app.post("/api/admin-login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM admin WHERE username = ?", [username], (err, admin) => {
    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.json({ success: false });
    }
    req.session.admin = admin.id;
    res.json({ success: true });
  });
});

app.get("/api/bookings", mustBeLoggedIn, (req, res) => {
  db.all("SELECT * FROM bookings ORDER BY date, time", [], (err, rows) => {
    res.json(rows);
  });
});

// New endpoint to fetch booked and blocked times for a specific date
app.get("/api/bookings/:date", (req, res) => {
  const date = req.params.date;

  db.all("SELECT time FROM bookings WHERE date = ?", [date], (err, rows) => {
    const bookedTimes = rows.map(r => r.time);

    db.all("SELECT time FROM blocked_slots WHERE date = ?", [date], (err2, rows2) => {
      const blockedTimes = rows2.map(r => r.time).filter(Boolean); // remove nulls
      res.json({ bookedTimes, blockedTimes });
    });
  });
});

app.post("/api/book", (req, res) => {
  const { name, email, service, date, time } = req.body;

  db.run(
    "INSERT INTO bookings (name, email, service, date, time) VALUES (?, ?, ?, ?, ?)",
    [name, email, service, date, time],
    function(err) {
      if (err) return res.json({ success: false, error: "Failed to book" });
      res.json({ success: true });
    }
  );
});

app.post("/api/delete-booking", mustBeLoggedIn, (req, res) => {
  db.run("DELETE FROM bookings WHERE id = ?", [req.body.id], () => {
    res.json({ success: true });
  });
});

app.post("/api/block", mustBeLoggedIn, (req, res) => {
  db.run(
    "INSERT INTO blocked_slots (date, time) VALUES (?, ?)",
    [req.body.date, req.body.time],
    () => res.json({ success: true })
  );
});

app.get("/api/blocked", mustBeLoggedIn, (req, res) => {
  db.all("SELECT * FROM blocked_slots ORDER BY date, time", [], (err, rows) => {
    res.json(rows);
  });
});

app.post("/api/unblock", mustBeLoggedIn, (req, res) => {
  db.run("DELETE FROM blocked_slots WHERE id = ?", [req.body.id], () => {
    res.json({ success: true });
  });
});

app.post("/api/change-password", mustBeLoggedIn, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  db.get("SELECT * FROM admin WHERE id = ?", [req.session.admin], (err, admin) => {
    if (!bcrypt.compareSync(currentPassword, admin.password)) {
      return res.json({ success: false, error: "Incorrect current password" });
    }

    const hashed = bcrypt.hashSync(newPassword, 10);
    db.run("UPDATE admin SET password = ? WHERE id = ?", [hashed, admin.id]);
    res.json({ success: true });
  });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
