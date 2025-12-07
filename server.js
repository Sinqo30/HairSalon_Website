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
const PORT = process.env.PORT || 5000; // 🔹 Use Railway port if available

// -------------------------------
// Middleware
// -------------------------------
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname))); // serve HTML/CSS/JS files

app.use(
  session({
    secret: "super-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 2,
    },
  })
);

// -------------------------------
// SQLite Database
// -------------------------------
const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) console.error(err);
  else console.log("Connected to SQLite database.");
});

db.serialize(() => {
  // Admin table
  db.run(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  // Bookings table
  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      service TEXT,
      date TEXT,
      time TEXT
    )
  `);

  // Blocked slots table
  db.run(`
    CREATE TABLE IF NOT EXISTS blocked_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      time TEXT
    )
  `);

  // Ensure default admin exists and reset password
  const defaultUser = "admin";
  const defaultPass = "password123";
  const hashed = bcrypt.hashSync(defaultPass, 10);
  db.get(`SELECT * FROM admin WHERE username = ?`, [defaultUser], (err, row) => {
    if (!row) {
      db.run(`INSERT INTO admin (username, password) VALUES (?, ?)`, [defaultUser, hashed]);
      console.log("Default admin created → admin | password123");
    } else {
      db.run(`UPDATE admin SET password = ? WHERE username = ?`, [hashed, defaultUser]);
      console.log("Admin password reset to default → admin | password123");
    }
  });
});

// -------------------------------
// Remove past bookings & blocked slots
// -------------------------------
function cleanOldBookings() {
  const today = new Date().toISOString().split("T")[0];
  db.run(`DELETE FROM bookings WHERE date < ?`, [today]);
  db.run(`DELETE FROM blocked_slots WHERE date < ?`, [today]);
  console.log("Old bookings and blocked slots cleaned.");
}

// Run cleanup on server start and every 24h
cleanOldBookings();
setInterval(cleanOldBookings, 1000 * 60 * 60 * 24);

// -------------------------------
// Login Middleware
// -------------------------------
function mustBeLoggedIn(req, res, next) {
  if (!req.session.admin) return res.status(401).json({ error: "Not authorized" });
  next();
}

// -------------------------------
// API ROUTES
// -------------------------------

// Admin Login
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

// Get all bookings (admin only)
app.get("/api/bookings", mustBeLoggedIn, (req, res) => {
  db.all(`SELECT * FROM bookings ORDER BY date, time`, [], (err, rows) => {
    res.json(rows);
  });
});

// Get booked & blocked times for a specific date
app.get("/api/bookings/:date", (req, res) => {
  const { date } = req.params;
  db.all(`SELECT time FROM bookings WHERE date = ?`, [date], (err, bookedRows) => {
    const bookedTimes = bookedRows.map(r => r.time);
    db.all(`SELECT time FROM blocked_slots WHERE date = ?`, [date], (err, blockedRows) => {
      const blockedTimes = blockedRows.map(r => r.time);
      res.json({ bookedTimes, blockedTimes });
    });
  });
});

// Create Booking
app.post("/api/book", (req, res) => {
  const { name, service, date, time } = req.body;
  const today = new Date().toISOString().split("T")[0];
  if (date < today) return res.status(400).json({ error: "Cannot book past dates" });

  db.get(`SELECT * FROM bookings WHERE date = ? AND time = ?`, [date, time], (err, row1) => {
    db.get(`SELECT * FROM blocked_slots WHERE date = ? AND time = ?`, [date, time], (err, row2) => {
      if (row1 || row2) return res.status(400).json({ error: "Time already unavailable" });
      db.run(
        `INSERT INTO bookings (name, service, date, time) VALUES (?, ?, ?, ?)`,
        [name, service, date, time],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true, id: this.lastID });
        }
      );
    });
  });
});

// Admin blocks a date/time
app.post("/api/block", mustBeLoggedIn, (req, res) => {
  const { date, time } = req.body;
  const today = new Date().toISOString().split("T")[0];
  if (date < today) return res.status(400).json({ error: "Cannot block past dates" });

  db.get(`SELECT * FROM blocked_slots WHERE date = ? AND time = ?`, [date, time], (err, row) => {
    if (row) return res.status(400).json({ error: "Already blocked" });
    db.run(`INSERT INTO blocked_slots (date, time) VALUES (?, ?)`, [date, time], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    });
  });
});

// Get blocked slots (admin)
app.get("/api/blocked", mustBeLoggedIn, (req, res) => {
  db.all(`SELECT * FROM blocked_slots ORDER BY date, time`, [], (err, rows) => {
    res.json(rows);
  });
});

// Unblock slot
app.post("/api/unblock", mustBeLoggedIn, (req, res) => {
  const { id } = req.body;
  db.run(`DELETE FROM blocked_slots WHERE id = ?`, [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Delete booking
app.post("/api/delete-booking", mustBeLoggedIn, (req, res) => {
  const { id } = req.body;
  db.run(`DELETE FROM bookings WHERE id = ?`, [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Change password
app.post("/api/change-password", mustBeLoggedIn, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  db.get("SELECT * FROM admin WHERE id = ?", [req.session.admin], (err, admin) => {
    if (err || !admin) return res.json({ success: false, error: "Admin not found" });

    const valid = bcrypt.compareSync(currentPassword, admin.password);
    if (!valid) return res.json({ success: false, error: "Current password incorrect" });

    const hashed = bcrypt.hashSync(newPassword, 10);
    db.run("UPDATE admin SET password = ? WHERE id = ?", [hashed, admin.id], (err) => {
      if (err) return res.json({ success: false, error: "Failed to update password" });
      res.json({ success: true });
    });
  });
});

// Logout
app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// -------------------------------
// START SERVER
// -------------------------------
app.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT} | Railway PORT: ${PORT}`);
});
