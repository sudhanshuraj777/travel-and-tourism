// ===============================
// 🌍 Travel & Tourism Management Backend
// ===============================

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const pool = require('./db'); // Database connection

const app = express();

// ---------------- Middleware setup ----------------
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ---------------- Session setup ----------------
app.use(session({
  secret: 'ttms_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3 * 60 * 60 * 1000 } // 3 hours
}));

// ---------------- Serve frontend files ----------------
app.use('/', express.static('public'));

// ---------------- TEST ROUTE ----------------
app.get('/api', (req, res) => {
  res.send('✅ Travel Management Backend is running and secure!');
});

// ---------------- AUTH ROUTES ----------------

// Register new tourist
app.post('/api/register', async (req, res) => {
  try {
    const { full_name, email, password, contact_no, address } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      `INSERT INTO Tourist (Full_Name, Email, Password, Contact_No, Address)
       VALUES (?, ?, ?, ?, ?)`,
      [full_name, email, hashed, contact_no, address]
    );

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("❌ Register Error:", err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Email already registered' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// Login (Admin or Tourist)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.execute(`SELECT * FROM Tourist WHERE Email = ?`, [email]);

    if (rows.length === 0) return res.status(400).json({ error: 'Invalid email or password' });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.Password) || password === user.Password;

    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

    req.session.user = {
      id: user.Tourist_ID,
      name: user.Full_Name,
      email: user.Email,
      type: user.User_Type || 'Tourist'
    };

    console.log('✅ Logged in:', req.session.user);
    res.json({ success: true, user: req.session.user });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// Check current user session
app.get('/api/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

// ---------------- PACKAGE ROUTES ----------------

// Get all packages
app.get('/api/packages', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Package ORDER BY Package_ID DESC');
    res.json(rows);
  } catch (err) {
    console.error("❌ Package fetch error:", err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get package by ID
app.get('/api/packages/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await pool.execute('SELECT * FROM Package WHERE Package_ID = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Package not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Single package error:", err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ---------------- BOOKING ROUTES ----------------

// Book a package (Tourist)
app.post('/api/book', async (req, res) => {
  try {
    if (!req.session.user) return res.status(401).json({ error: 'Please login first' });

    const { package_id, no_of_people } = req.body;
    if (!package_id || !no_of_people)
      return res.status(400).json({ error: 'Package ID and number of people required' });

    const [pkgRows] = await pool.execute(
      'SELECT Package_Cost FROM Package WHERE Package_ID = ?',
      [package_id]
    );
    if (pkgRows.length === 0) return res.status(404).json({ error: 'Package not found' });

    const packageCost = Number(pkgRows[0].Package_Cost);
    const totalCost = packageCost * no_of_people;

    const [result] = await pool.execute(
      `INSERT INTO Booking (Tourist_ID, Package_ID, No_of_People, Total_Cost)
       VALUES (?, ?, ?, ?)`,
      [req.session.user.id, package_id, no_of_people, totalCost]
    );

    res.json({
      success: true,
      message: 'Booking successful!',
      booking_id: result.insertId,
      total_cost: totalCost
    });
  } catch (err) {
    console.error("❌ Booking Error:", err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Unified booking route (Admin sees all, Tourist sees their own)
app.get('/api/bookings', async (req, res) => {
  try {
    if (!req.session.user) return res.status(401).json({ error: 'Please login first' });

    const user = req.session.user;
    let rows;

    if (user.type === 'Admin') {
      console.log("👑 Admin mode active");
      [rows] = await pool.execute(`
        SELECT 
          b.Booking_ID,
          b.Booking_Date,
          b.No_of_People,
          b.Total_Cost,
          b.Status,
          p.Package_Name,
          p.Destination,
          t.Full_Name AS Tourist_Name,
          t.Email AS Tourist_Email
        FROM Booking b
        INNER JOIN Package p ON b.Package_ID = p.Package_ID
        INNER JOIN Tourist t ON b.Tourist_ID = t.Tourist_ID
        ORDER BY b.Booking_ID DESC
      `);
      console.log("✅ Admin fetched bookings:", rows.length);
    } else {
      console.log("👤 Tourist mode active");
      [rows] = await pool.execute(`
        SELECT 
          b.Booking_ID,
          b.Booking_Date,
          b.No_of_People,
          b.Total_Cost,
          b.Status,
          p.Package_Name,
          p.Destination
        FROM Booking b
        INNER JOIN Package p ON b.Package_ID = p.Package_ID
        WHERE b.Tourist_ID = ?
        ORDER BY b.Booking_ID DESC
      `, [user.id]);
      console.log(`✅ Tourist (${user.email}) fetched bookings:`, rows.length);
    }

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching bookings:", err);
    res.status(500).json({ error: 'Database error while fetching bookings' });
  }
});

// ---------------- ADMIN ROUTES ----------------

// Add package (Admin only)
app.post('/api/admin/package', async (req, res) => {
  try {
    if (!req.session.user || req.session.user.type !== 'Admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, destination, duration, cost, desc } = req.body;
    await pool.execute(
      `INSERT INTO Package (Package_Name, Destination, Duration_Days, Package_Cost, Description)
       VALUES (?, ?, ?, ?, ?)`,
      [name, destination, duration, cost, desc]
    );

    res.json({ success: true, message: 'Package added successfully!' });
  } catch (err) {
    console.error("❌ Add Package Error:", err);
    res.status(500).json({ error: 'Failed to add package' });
  }
});

// Delete a package (Admin only)
app.delete('/api/admin/package/:id', async (req, res) => {
  try {
    if (!req.session.user || req.session.user.type !== 'Admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const id = req.params.id;
    await pool.execute('DELETE FROM Package WHERE Package_ID = ?', [id]);
    res.json({ success: true, message: 'Package deleted successfully' });
  } catch (err) {
    console.error("❌ Error deleting package:", err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ TTMS backend server running at: http://localhost:${PORT}`);
});
