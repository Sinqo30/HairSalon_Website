// Force South African Timezone
process.env.TZ = "Africa/Johannesburg";

// -------------------------------
// Hair Salon Backend Server
// -------------------------------

const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.use(
  session({
    secret: "super-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 2
    }
  })
);

// -------------------------------
// SQLite
// -------------------------------
const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) console.error(err);
  else console.log("Connected to SQLite database.");
});

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

  const defaultUser = "admin";
  const defaultPass = "password123";
  const hashed = bcrypt.hashSync(defaultPass, 10);

  db.get(`SELECT * FROM admin WHERE username = ?`, [defaultUser], (err, row) => {
    if (!row) {
      db.run(
        `INSERT INTO admin (username, password) VALUES (?, ?)`,
        [defaultUser, hashed]
      );
      console.log("Default admin created → admin | password123");
    } else {
      db.run(`UPDATE admin SET password = ? WHERE username = ?`, [
        hashed,
        defaultUser
      ]);
      console.log("Admin password reset → admin | password123");
    }
  });
});

// -------------------------------
// AUTOMATIC CLEANUP
// -------------------------------
function cleanOldBookings() {
  const today = new Date().toISOString().split("T")[0];
  db.run(`DELETE FROM bookings WHERE date < ?`, [today]);
  db.run(`DELETE FROM blocked_slots WHERE date < ?`, [today]);
  console.log("Cleaned past bookings + blocked slots.");
}

cleanOldBookings();
setInterval(cleanOldBookings, 24 * 60 * 60 * 1000);

// -------------------------------
// Middleware
// -------------------------------
function mustBeLoggedIn(req, res, next) {
  if (!req.session.admin)
    return res.status(401).json({ error: "Not authorized" });
  next();
}

// -------------------------------
// API ROUTES
// -------------------------------

// LOGIN
app.post("/api/admin-login", (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM admin WHERE username = ?`, [username], (err, admin) => {
    if (!admin) return res.json({ success: false });

    const valid = bcrypt.compareSync(password, admin.password);
    if (!valid) return res.json({ success: false });

    req.session.admin = admin.id;
    res.json({ success: true });
  });
});

// BOOKING TIMES FOR DATE
app.get("/api/bookings/:date", (req, res) => {
  const { date } = req.params;

  db.all(`SELECT time FROM bookings WHERE date = ?`, [date], (err, bookedRows) => {
    const bookedTimes = bookedRows.map((r) => r.time);

    db.all(
      `SELECT time FROM blocked_slots WHERE date = ?`,
      [date],
      (err, blockedRows) => {
        const blockedTimes = blockedRows.map((r) => r.time);
        res.json({ bookedTimes, blockedTimes });
      }
    );
  });
});

// CREATE BOOKING
app.post("/api/book", (req, res) => {
  const { name, email, service, date, time } = req.body;

  const today = new Date().toISOString().split("T")[0];
  if (date < today)
    return res.status(400).json({ error: "Cannot book past dates" });

  db.get(
    `SELECT * FROM bookings WHERE date = ? AND time = ?`,
    [date, time],
    (err, exists1) => {
      db.get(
        `SELECT * FROM blocked_slots WHERE date = ? AND time = ?`,
        [date, time],
        (err, exists2) => {
          if (exists1 || exists2)
            return res.status(400).json({ error: "Time slot unavailable" });

          db.run(
            `INSERT INTO bookings (name, email, service, date, time)
             VALUES (?, ?, ?, ?, ?)`,
            [name, email, service, date, time],
            function (err) {
              if (err) return res.json({ success: false, error: err.message });
              res.json({ success: true });
            }
          );
        }
      );
    }
  );
});

// START SERVER
app.listen(PORT, () => {
  console.log(`SERVER RUNNING → http://localhost:${PORT}`);
});
