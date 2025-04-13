const express = require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
const PORT = process.env.PORT || 3001; // Use port 3001 as a common alternative to 3000 (often used by client dev servers)

// Basic route for testing
app.get('/', (req, res) => {
  res.send('ScoutsTribe Server is running!');
});

// --- Authentication Routes (Placeholders) ---

// POST /api/auth/signup
app.post('/api/auth/signup', (req, res) => {
  console.log('Signup attempt:', req.body);
  // TODO: Implement actual signup logic (validation, hashing, DB interaction)
  res.status(201).json({ message: 'Signup successful (placeholder)' });
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  console.log('Login attempt:', req.body);
  // TODO: Implement actual login logic (validation, DB check, session/token generation)
  res.status(200).json({ message: 'Login successful (placeholder)', token: 'fake-jwt-token' });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  console.log('Logout attempt');
  // TODO: Implement actual logout logic (e.g., invalidate token/session)
  res.status(200).json({ message: 'Logout successful (placeholder)' });
});

// --- End Authentication Routes ---

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});