const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.use(session({
  secret: "super-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", maxAge: 1000*60*60*2 }
}));

const db = new sqlite3.Database("./database.sqlite", (err) => {
  if(err) console.error(err);
  else console.log("Connected to SQLite database.");
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS admin (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, service TEXT, date TEXT, time TEXT)`);

  const defaultUser = "admin";
  const defaultPass = "password123";

  db.get(`SELECT * FROM admin WHERE username = ?`, [defaultUser], (err, row) => {
    if(!row){
      const hashed = bcrypt.hashSync(defaultPass, 10);
      db.run(`INSERT INTO admin (username, password) VALUES (?, ?)`, [defaultUser, hashed]);
      console.log("Default admin created → admin | password123");
    }
  });
});

function mustBeLoggedIn(req,res,next){
  if(!req.session.admin) return res.status(401).json({error:"Not authorized"});
  next();
}

app.post("/api/admin-login", (req,res)=>{
  const {username,password} = req.body;
  db.get(`SELECT * FROM admin WHERE username=?`, [username], (err, admin)=>{
    if(!admin) return res.json({success:false});
    const valid = bcrypt.compareSync(password, admin.password);
    if(!valid) return res.json({success:false});
    req.session.admin = admin.id;
    res.json({success:true});
  });
});

app.get("/api/bookings", mustBeLoggedIn, (req,res)=>{
  db.all(`SELECT * FROM bookings ORDER BY id DESC`, [], (err, rows)=>{
    res.json(rows);
  });
});

app.get("/api/bookings/:date", (req,res)=>{
  const {date} = req.params;
  db.all(`SELECT time FROM bookings WHERE date=?`, [date], (err, rows)=>{
    const times = rows.map(r=>r.time);
    res.json({bookedTimes: times});
  });
});

app.post("/api/book", (req,res)=>{
  const {name,email,service,date,time} = req.body;
  db.get(`SELECT * FROM bookings WHERE date=? AND time=?`, [date,time], (err,row)=>{
    if(row) return res.status(400).json({error:"Time already booked"});
    db.run(`INSERT INTO bookings (name,email,service,date,time) VALUES (?,?,?,?,?)`, [name,email,service,date,time], function(err){
      if(err) return res.status(500).json({error:err.message});
      res.json({success:true,id:this.lastID});
    });
  });
});

app.post("/api/logout",(req,res)=>{
  req.session.destroy();
  res.json({success:true});
});

app.listen(PORT, ()=>{console.log(`Server running → http://localhost:${PORT}`)});
