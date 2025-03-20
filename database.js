const { createPool } = require("mysql2");

const pool = createPool({
  host: "localhost",
  user: "root",
  password: "johan@2004", // Change to your MySQL password
  database: "summa",        // Change to your actual database name
  connectionLimit: 10
});

// Check MySQL connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL Connection Failed:", err.message);
    return;
  }
  console.log("✅ MySQL Connected Successfully!");
  connection.release(); // Release the connection back to the pool
});

module.exports = pool;
