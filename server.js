const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(__dirname));

// Store bookings in JSON file
const bookingsFile = path.join(__dirname, "bookings.json");

// Helper to read bookings
function readBookings() {
    try {
        const data = fs.readFileSync(bookingsFile);
        return JSON.parse(data);
    } catch {
        return [];
    }
}

// Helper to write bookings
function writeBookings(bookings) {
    fs.writeFileSync(bookingsFile, JSON.stringify(bookings, null, 2));
}

// API to receive bookings
app.post("/api/bookings", (req, res) => {
    const bookings = readBookings();
    bookings.push(req.body);
    writeBookings(bookings);
    res.status(200).json({ message: "Booking saved" });
});

// API to get bookings for admin
app.get("/api/bookings", (req, res) => {
    const bookings = readBookings();
    res.json(bookings);
});

// Admin login (basic example)
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "password123";

app.post("/api/admin-login", (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        res.status(200).json({ message: "Login successful" });
    } else {
        res.status(401).json({ message: "Invalid credentials" });
    }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
