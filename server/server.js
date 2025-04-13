const express = require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
const PORT = process.env.PORT || 3001; // Use port 3001 as a common alternative to 3000 (often used by client dev servers)

// --- Mock Data Store (Replace with actual DB later) ---
const mockUsers = []; // Stores { id, email, password, role }
let nextUserId = 1;
// --- End Mock Data Store ---

// Basic route for testing
app.get('/', (req, res) => {
  res.send('ScoutsTribe Server is running!');
});

// --- Authentication Routes (Using Mock Data) ---

// POST /api/auth/signup
app.post('/api/auth/signup', (req, res) => {
  const { email, password, role } = req.body; // Assuming role is provided during signup for simplicity

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Check if user already exists
  const existingUser = mockUsers.find(user => user.email === email);
  if (existingUser) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  // TODO: Implement proper password hashing here! Storing plain text is insecure.
  const newUser = {
    id: nextUserId++,
    email,
    password: password, // Storing plain text for mock purposes ONLY
    role: role || 'Counselor' // Default role if not provided
  };
  mockUsers.push(newUser);

  console.log('Signup successful:', { id: newUser.id, email: newUser.email, role: newUser.role });
  console.log('Current Mock Users:', mockUsers); // Log for debugging

  // Don't send password back
  res.status(201).json({ message: 'Signup successful', user: { id: newUser.id, email: newUser.email, role: newUser.role } });
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Find user by email
  const user = mockUsers.find(user => user.email === email);

  // TODO: Replace plain text comparison with hashed password verification
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  console.log('Login successful:', { id: user.id, email: user.email, role: user.role });

  // Don't send password back
  res.status(200).json({
    message: 'Login successful',
    token: `fake-jwt-token-for-user-${user.id}`, // Simple mock token
    user: { id: user.id, email: user.email, role: user.role }
  });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  // In a real app, you'd invalidate a token/session here.
  // For mock, we just acknowledge the request.
  console.log('Logout attempt received');
  res.status(200).json({ message: 'Logout successful (mock)' });
});

// --- End Authentication Routes ---

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});