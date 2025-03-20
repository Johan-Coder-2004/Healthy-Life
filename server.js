require('dotenv').config(); // Load environment variables
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2'); // Use mysql2 for better performance

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins (update this for production)
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', // Replace with your MySQL username
  password: 'johan@2004', // Replace with your MySQL password
  database: 'summa', // Replace with your database name
  connectionLimit: 10,
});

// Test database connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL Connection Failed:', err.message);
    return;
  }
  console.log('✅ MySQL Connected Successfully!');
  connection.release(); // Release the connection back to the pool
});

// Create messages table if it doesn't exist
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    message TEXT NOT NULL
  )
`;
pool.query(createTableQuery, (err) => {
  if (err) throw err;
  console.log('Messages table is ready');
});

// Sign-Up Route - Store New User with Plain Text Password
app.post('/signup', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const checkQuery = 'SELECT * FROM users WHERE email = ?';
  const insertQuery = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';

  pool.query(checkQuery, [email], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database query error' });

    if (results.length > 0) {
      return res.json({ success: false, message: 'Email already exists, please login' });
    } else {
      pool.query(insertQuery, [username, email, password], (err) => {
        if (err) return res.status(500).json({ error: 'Error inserting user' });
        res.json({ success: true, message: 'User registered successfully' });
      });
    }
  });
});

// Login Route - Verify Email & Password
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM users WHERE email = ?';

  pool.query(query, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database query error' });
    }

    if (results.length > 0) {
      const user = results[0];

      if (user.password === password) {
        return res.json({ success: true, message: 'Login successful', username: user.username });
      } else {
        return res.json({ success: false, message: 'Incorrect password' });
      }
    } else {
      return res.json({ success: false, message: 'Email not found, please sign up first' });
    }
  });
});

// Fetch all users from the database
app.get('/users', (req, res) => {
  const query = 'SELECT username FROM users'; // Fetch only usernames
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).send('Error fetching users');
    }
    res.json(results); // Send the list of usernames to the frontend
  });
});

// Socket.IO for real-time chat
const onlineUsers = new Map(); // Use a Map to store online users (socket.id -> username)

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for a new user joining
  socket.on('userJoined', (username) => {
    // Add the user to the onlineUsers Map
    onlineUsers.set(socket.id, username);

    // Broadcast the updated list of online users to all clients
    io.emit('updateOnlineUsers', Array.from(onlineUsers.values()));
  });

  // Load previous messages from the database
  const loadMessagesQuery = 'SELECT * FROM messages ORDER BY id ASC'; // Order by id instead of timestamp
  pool.query(loadMessagesQuery, (err, results) => {
    if (err) throw err;
    socket.emit('loadMessages', results); // Send previous messages to the client
  });

  // Listen for new messages
  socket.on('sendMessage', (data) => {
    const { username, message } = data;

    // Save message to the database
    const insertQuery = 'INSERT INTO messages (username, message) VALUES (?, ?)';
    pool.query(insertQuery, [username, message], (err, result) => {
      if (err) throw err;

      // Broadcast the message to all connected clients
      io.emit('newMessage', { username, message });
    });
  });

  // Listen for user disconnection
  socket.on('disconnect', () => {
    const username = onlineUsers.get(socket.id); // Get the username of the disconnected user
    if (username) {
      onlineUsers.delete(socket.id); // Remove the user from the onlineUsers Map

      // Broadcast the updated list of online users to all clients
      io.emit('updateOnlineUsers', Array.from(onlineUsers.values()));

      // Notify other users that this user has left
      io.emit('userLeft', username);
    }
    console.log('A user disconnected:', socket.id);
  });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});