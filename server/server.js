const express = require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
const PORT = process.env.PORT || 3001; // Use port 3001 as a common alternative to 3000 (often used by client dev servers)

// --- Mock Data Store (Replace with actual DB later) ---
const mockUsers = []; // Stores { id, email, password, role }
let nextUserId = 1;
const mockChannels = []; // Stores { id, name, grade }
let nextChannelId = 1;
const mockMessages = []; // Stores { id, channelId, userId, userName, text, timestamp }
let nextMessageId = 1;
// --- End Mock Data Store ---

// Basic route for testing
app.get('/', (req, res) => {
  res.send('ScoutsTribe Server is running!');
});

// --- Mock RBAC Middleware ---

// Middleware to check for a valid mock token and attach user to request
const checkAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Missing or invalid token format' });
  }

  const token = authHeader.split(' ')[1];
  // Extremely basic mock token parsing: "fake-jwt-token-for-user-<id>"
  const match = token.match(/^fake-jwt-token-for-user-(\d+)$/);

  if (!match) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token content' });
  }

  const userId = parseInt(match[1], 10);
  const user = mockUsers.find(u => u.id === userId);

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized: User not found for token' });
  }

  // Attach user to request object (excluding password)
  req.user = { id: user.id, email: user.email, role: user.role };
  next(); // Proceed to the next middleware or route handler
};

// Middleware factory to check if the authenticated user has one of the allowed roles
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      // Should have been caught by checkAuth, but good practice to check
      return res.status(401).json({ message: 'Unauthorized: No user authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: `Forbidden: User role (${req.user.role}) not authorized` });
    }

    next(); // User has the required role
  };
};

// --- End Mock RBAC Middleware ---

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

// --- Sample Protected Route ---

// Example: Get all users (requires Admin or Scout Leader role)
app.get(
  '/api/admin/users',
  checkAuth, // First, ensure user is authenticated
  checkRole(['Admin', 'Scout Leader']), // Then, check if user has the required role
  (req, res) => {
    console.log(`User ${req.user.email} (Role: ${req.user.role}) accessed /api/admin/users`);
    // Return users without passwords
    const usersForAdmin = mockUsers.map(u => ({ id: u.id, email: u.email, role: u.role }));
    res.status(200).json(usersForAdmin);
  }
);

// --- End Sample Protected Route ---

// --- Messaging Channel Routes (Mock Data) ---

// GET /api/channels - List all channels (requires auth)
app.get('/api/channels', checkAuth, (req, res) => {
  console.log(`User ${req.user.email} requested channel list`);
  res.status(200).json(mockChannels);
});

// POST /api/channels - Create a new channel (requires Admin or Scout Leader)
app.post(
  '/api/channels',
  checkAuth,
  checkRole(['Admin', 'Scout Leader']),
  (req, res) => {
    const { name, grade } = req.body;
    if (!name || !grade) {
      return res.status(400).json({ message: 'Channel name and grade are required' });
    }

    const newChannel = {
      id: nextChannelId++,
      name,
      grade
    };
    mockChannels.push(newChannel);
    console.log(`User ${req.user.email} created channel:`, newChannel);
    console.log('Current Mock Channels:', mockChannels);
    res.status(201).json(newChannel);
  }
);

// GET /api/channels/:channelId/messages - List messages for a channel (requires auth)
app.get('/api/channels/:channelId/messages', checkAuth, (req, res) => {
  const channelId = parseInt(req.params.channelId, 10);
  const channel = mockChannels.find(c => c.id === channelId);

  if (!channel) {
    return res.status(404).json({ message: 'Channel not found' });
  }

  const messagesInChannel = mockMessages.filter(m => m.channelId === channelId);
  console.log(`User ${req.user.email} requested messages for channel ${channelId}`);
  res.status(200).json(messagesInChannel);
});

// POST /api/channels/:channelId/messages - Post a message to a channel (requires auth)
app.post('/api/channels/:channelId/messages', checkAuth, (req, res) => {
  const channelId = parseInt(req.params.channelId, 10);
  const { text } = req.body;
  const channel = mockChannels.find(c => c.id === channelId);

  if (!channel) {
    return res.status(404).json({ message: 'Channel not found' });
  }
  if (!text) {
    return res.status(400).json({ message: 'Message text is required' });
  }

  const newMessage = {
    id: nextMessageId++,
    channelId,
    userId: req.user.id,
    userName: req.user.email, // Use email as name for mock simplicity
    text,
    timestamp: new Date().toISOString()
  };
  mockMessages.push(newMessage);
  console.log(`User ${req.user.email} posted message to channel ${channelId}:`, newMessage);
  console.log('Current Mock Messages:', mockMessages);

  // In a real app, you might broadcast this message via WebSockets
  res.status(201).json(newMessage);
});

// --- End Messaging Channel Routes ---

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});