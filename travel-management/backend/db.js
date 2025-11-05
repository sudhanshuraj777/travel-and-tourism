// backend/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',            // 👈 your MySQL username
  password: '1234',  // 👈 replace with your MySQL password
  database: 'ttms',        // 👈 the database you just created
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
