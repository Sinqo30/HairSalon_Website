const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 10000;

// ----------------------
// DATABASE
// ----------------------
const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) console.error("Database error:", err.message);
  else console.log("Connected to SQLite database.");
});

// ----------------------
// MIDDLEWARE
// ----------------------
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve ALL static files since you have no folders
app.use(express.static(__dirname));

// Session store
app.use(
  session({
    store: new SQLiteStore({ db: "sessions.sqlite" }),
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: false,
  })
);

// ----------------------
// SITEMAP ROUTE
// ----------------------
app.get("/sitemap.xml", (req, res) => {
  const filePath = path.join(__dirname, "sitemap.xml");

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Sitemap not found");
  }

  res.setHeader("Content-Type", "application/xml");
  res.sendFile(filePath);
});

// ----------------------
// HTML ROUTES
// ----------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "about.html"));
});

app.get("/services", (req, res) => {
  res.sendFile(path.join(__dirname, "services.html"));
});

app.get("/book", (req, res) => {
  res.sendFile(path.join(__dirname, "book.html"));
});

app.get("/contact", (req, res) => {
  res.sendFile(path.join(__dirname, "contact.html"));
});

// ----------------------
// START SERVER
// ----------------------
app.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}`);
});
