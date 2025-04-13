const express = require('express');
const cors = require('cors');
const app = express();

// Middleware to parse JSON bodies
// Enable CORS for frontend requests
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies
app.use(express.json());
const PORT = process.env.PORT || 3001; // Use port 3001 as a common alternative to 3000 (often used by client dev servers)

// --- Mock Data Store (Replace with actual DB later) ---
const mockUsers = [
  // Pre-defined admin user for testing
  {
    id: 1,
    email: 'admin@scoutstribe.com',
    password: 'admin123', // In a real app, this would be hashed
    roles: ['Admin'],
    grade: 'operations'
  },
  // Pre-defined Scout Leader for testing
  {
    id: 2,
    email: 'leader@scoutstribe.com',
    password: 'leader123', // In a real app, this would be hashed
    roles: ['Tribe Leader'],
    grade: '9'
  },
  // Pre-defined Counselor for testing
  {
    id: 3,
    email: 'counselor@scoutstribe.com',
    password: 'counselor123', // In a real app, this would be hashed
    roles: ['Counselor'],
    grade: '8'
  }
];
let nextUserId = 4; // Start after our pre-defined users
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
  req.user = { id: user.id, email: user.email, roles: user.roles, grade: user.grade };
  next(); // Proceed to the next middleware or route handler
};

// Middleware factory to check if the authenticated user has one of the allowed roles
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      // Should have been caught by checkAuth, but good practice to check
      return res.status(401).json({ message: 'Unauthorized: No user authenticated' });
    }

    // Check if user has any of the allowed roles
    const hasAllowedRole = req.user.roles.some(role => allowedRoles.includes(role));
    
    if (!hasAllowedRole) {
      return res.status(403).json({ message: `Forbidden: User roles (${req.user.roles.join(', ')}) not authorized` });
    }

    next(); // User has at least one of the required roles
  };
};

// --- End Mock RBAC Middleware ---

// --- Authentication Routes (Using Mock Data) ---

// POST /api/auth/signup
app.post('/api/auth/signup', (req, res) => {
  const { email, password, roles, grade } = req.body;

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
    roles: roles || ['Counselor'], // Default role if not provided
    grade: grade || '' // Default empty grade if not provided
  };
  mockUsers.push(newUser);

  console.log('Signup successful:', { id: newUser.id, email: newUser.email, roles: newUser.roles, grade: newUser.grade });
  console.log('Current Mock Users:', mockUsers); // Log for debugging

  // Don't send password back
  res.status(201).json({
    message: 'Signup successful',
    user: {
      id: newUser.id,
      email: newUser.email,
      roles: newUser.roles,
      grade: newUser.grade
    }
  });
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

  console.log('Login successful:', { id: user.id, email: user.email, roles: user.roles, grade: user.grade });

  // Don't send password back
  res.status(200).json({
    message: 'Login successful',
    token: `fake-jwt-token-for-user-${user.id}`, // Simple mock token
    user: { id: user.id, email: user.email, roles: user.roles, grade: user.grade }
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
  checkRole(['Admin', 'Tribe Leader']), // Then, check if user has the required role
  (req, res) => {
    console.log(`User ${req.user.email} (Roles: ${req.user.roles.join(', ')}) accessed /api/admin/users`);
    // Return users without passwords
    const usersForAdmin = mockUsers.map(u => ({
      id: u.id,
      email: u.email,
      roles: u.roles,
      grade: u.grade
    }));
    res.status(200).json(usersForAdmin);
  }
);

// Get users by grade
app.get(
  '/api/admin/users/by-grade',
  checkAuth,
  checkRole(['Admin', 'Tribe Leader']),
  (req, res) => {
    console.log(`User ${req.user.email} (Roles: ${req.user.roles.join(', ')}) accessed users by grade`);
    
    // Group users by grade
    const usersByGrade = {};
    
    mockUsers.forEach(user => {
      if (!user.grade) return;
      
      if (!usersByGrade[user.grade]) {
        usersByGrade[user.grade] = [];
      }
      
      usersByGrade[user.grade].push({
        id: user.id,
        email: user.email,
        roles: user.roles
      });
    });
    
    res.status(200).json(usersByGrade);
  }
);

// Get counselors and leads by grade
app.get(
  '/api/admin/grades/leadership',
  checkAuth,
  checkRole(['Admin', 'Tribe Leader']),
  (req, res) => {
    console.log(`User ${req.user.email} (Roles: ${req.user.roles.join(', ')}) accessed leadership by grade`);
    
    // Group counselors and leads by grade
    const leadershipByGrade = {};
    
    mockUsers.forEach(user => {
      if (!user.grade) return;
      
      if (!leadershipByGrade[user.grade]) {
        leadershipByGrade[user.grade] = {
          counselors: [],
          leads: []
        };
      }
      
      // Check if user is a counselor
      if (user.roles.includes('Counselor')) {
        leadershipByGrade[user.grade].counselors.push({
          id: user.id,
          email: user.email
        });
      }
      
      // Check if user is a lead (Tribe Leader)
      if (user.roles.includes('Tribe Leader')) {
        leadershipByGrade[user.grade].leads.push({
          id: user.id,
          email: user.email
        });
      }
    });
    
    res.status(200).json(leadershipByGrade);
  }
);

// Update user roles
app.put(
  '/api/admin/users/:userId/roles',
  checkAuth,
  checkRole(['Admin', 'Tribe Leader']),
  (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const { roles } = req.body;
    
    if (!roles || !Array.isArray(roles)) {
      return res.status(400).json({ message: 'Roles must be provided as an array' });
    }
    
    const userToUpdate = mockUsers.find(u => u.id === userId);
    
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check permissions for role assignment
    const isAdmin = req.user.roles.includes('Admin');
    const isTribeLeader = req.user.roles.includes('Tribe Leader');
    
    // Only admins can assign admin role
    if (roles.includes('Admin') && !isAdmin) {
      return res.status(403).json({ message: 'Only admins can assign admin role' });
    }
    
    // Only admins and tribe leaders can assign tribe leader role
    if (roles.includes('Tribe Leader') && !isAdmin && !isTribeLeader) {
      return res.status(403).json({ message: 'Only admins and tribe leaders can assign tribe leader role' });
    }
    
    // Update user roles
    userToUpdate.roles = roles;
    
    console.log(`User ${req.user.email} updated roles for user ${userToUpdate.email} to ${roles.join(', ')}`);
    
    res.status(200).json({
      message: 'User roles updated successfully',
      user: {
        id: userToUpdate.id,
        email: userToUpdate.email,
        roles: userToUpdate.roles,
        grade: userToUpdate.grade
      }
    });
  }
);

// Update user grade
app.put(
  '/api/admin/users/:userId/grade',
  checkAuth,
  checkRole(['Admin', 'Tribe Leader']),
  (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    const { grade } = req.body;
    
    if (!grade) {
      return res.status(400).json({ message: 'Grade must be provided' });
    }
    
    const userToUpdate = mockUsers.find(u => u.id === userId);
    
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user grade
    userToUpdate.grade = grade;
    
    console.log(`User ${req.user.email} updated grade for user ${userToUpdate.email} to ${grade}`);
    
    res.status(200).json({
      message: 'User grade updated successfully',
      user: {
        id: userToUpdate.id,
        email: userToUpdate.email,
        roles: userToUpdate.roles,
        grade: userToUpdate.grade
      }
    });
  }
);

// Delete a user
app.delete(
  '/api/admin/users/:userId',
  checkAuth,
  checkRole(['Admin']), // Only admins can delete users
  (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    
    // Find the user to delete
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't allow deleting the current user
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    // Remove the user
    const deletedUser = mockUsers.splice(userIndex, 1)[0];
    
    console.log(`User ${req.user.email} deleted user ${deletedUser.email}`);
    
    res.status(200).json({
      message: 'User deleted successfully',
      user: {
        id: deletedUser.id,
        email: deletedUser.email
      }
    });
  }
);

// Add a new user (admin only)
app.post(
  '/api/admin/users',
  checkAuth,
  checkRole(['Admin']),
  (req, res) => {
    const { email, password, roles, grade } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Check if user already exists
    const existingUser = mockUsers.find(user => user.email === email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    
    // Create new user
    const newUser = {
      id: nextUserId++,
      email,
      password, // In a real app, this would be hashed
      roles: roles || ['Counselor'],
      grade: grade || ''
    };
    
    mockUsers.push(newUser);
    
    console.log(`User ${req.user.email} created new user:`, {
      id: newUser.id,
      email: newUser.email,
      roles: newUser.roles,
      grade: newUser.grade
    });
    
    // Don't send password back
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        roles: newUser.roles,
        grade: newUser.grade
      }
    });
  }
);

// Remove user from grade assignment
app.delete(
  '/api/admin/users/:userId/grade',
  checkAuth,
  checkRole(['Admin', 'Tribe Leader']),
  (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    
    const userToUpdate = mockUsers.find(u => u.id === userId);
    
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Store the previous grade for logging
    const previousGrade = userToUpdate.grade;
    
    // Remove grade assignment
    userToUpdate.grade = '';
    
    console.log(`User ${req.user.email} removed grade assignment (${previousGrade}) for user ${userToUpdate.email}`);
    
    res.status(200).json({
      message: 'User grade assignment removed successfully',
      user: {
        id: userToUpdate.id,
        email: userToUpdate.email,
        roles: userToUpdate.roles,
        grade: userToUpdate.grade
      }
    });
  }
);

// --- End Sample Protected Route ---

// --- Messaging Channel Routes (Mock Data) ---

// GET /api/channels - List all channels (requires auth)
app.get('/api/channels', checkAuth, (req, res) => {
  console.log(`User ${req.user.email} requested channel list`);
  
  // Filter channels based on user access
  const accessibleChannels = mockChannels.filter(channel => canAccessChannel(req.user, channel));
  
  res.status(200).json(accessibleChannels);
});

// POST /api/channels - Create a new channel (requires Admin, Scout Leader, or Counselor for their grade)
app.post(
  '/api/channels',
  checkAuth,
  (req, res) => {
    const { name, grade } = req.body;
    if (!name || !grade) {
      return res.status(400).json({ message: 'Channel name and grade are required' });
    }

    // Check permissions:
    // 1. Admins and Tribe Leaders can create channels for any grade
    // 2. Counselors can only create channels for their assigned grade
    const isAdmin = req.user.roles.includes('Admin');
    const isTribeLeader = req.user.roles.includes('Tribe Leader');
    const isCounselor = req.user.roles.includes('Counselor');
    
    if (!isAdmin && !isTribeLeader && !isCounselor) {
      return res.status(403).json({ message: 'You do not have permission to create channels' });
    }
    
    // If counselor, check if they're creating a channel for their grade
    if (isCounselor && !isAdmin && !isTribeLeader && req.user.grade !== grade) {
      return res.status(403).json({
        message: `Counselors can only create channels for their assigned grade (${req.user.grade})`
      });
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

// Helper function to check if user can access a channel
const canAccessChannel = (user, channel) => {
  // Admins and Tribe Leaders can access all channels
  if (user.roles.includes('Admin') || user.roles.includes('Tribe Leader')) {
    return true;
  }
  
  // Counselors can only access channels for their assigned grade
  if (user.roles.includes('Counselor')) {
    return user.grade === channel.grade;
  }
  
  return false;
};

// GET /api/channels/:channelId/messages - List messages for a channel (requires auth)
app.get('/api/channels/:channelId/messages', checkAuth, (req, res) => {
  const channelId = parseInt(req.params.channelId, 10);
  const channel = mockChannels.find(c => c.id === channelId);

  if (!channel) {
    return res.status(404).json({ message: 'Channel not found' });
  }
  
  // Check if user has access to this channel
  if (!canAccessChannel(req.user, channel)) {
    return res.status(403).json({ message: 'You do not have access to this channel' });
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
  
  // Check if user has access to this channel
  if (!canAccessChannel(req.user, channel)) {
    return res.status(403).json({ message: 'You do not have access to this channel' });
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

// PUT /api/channels/:channelId/messages/:messageId - Edit a message (requires auth)
app.put('/api/channels/:channelId/messages/:messageId', checkAuth, (req, res) => {
  const channelId = parseInt(req.params.channelId, 10);
  const messageId = parseInt(req.params.messageId, 10);
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ message: 'Message text is required' });
  }
  
  const channel = mockChannels.find(c => c.id === channelId);
  if (!channel) {
    return res.status(404).json({ message: 'Channel not found' });
  }
  
  // Check if user has access to this channel
  if (!canAccessChannel(req.user, channel)) {
    return res.status(403).json({ message: 'You do not have access to this channel' });
  }
  
  const messageIndex = mockMessages.findIndex(m => m.id === messageId && m.channelId === channelId);
  if (messageIndex === -1) {
    return res.status(404).json({ message: 'Message not found' });
  }
  
  const message = mockMessages[messageIndex];
  
  // Only the message author or an admin can edit the message
  if (message.userId !== req.user.id && !req.user.roles.includes('Admin')) {
    return res.status(403).json({ message: 'You do not have permission to edit this message' });
  }
  
  // Update the message
  mockMessages[messageIndex] = {
    ...message,
    text,
    edited: true
  };
  
  console.log(`User ${req.user.email} edited message ${messageId} in channel ${channelId}`);
  res.status(200).json(mockMessages[messageIndex]);
});

// DELETE /api/channels/:channelId/messages/:messageId - Delete a message (requires auth)
app.delete('/api/channels/:channelId/messages/:messageId', checkAuth, (req, res) => {
  const channelId = parseInt(req.params.channelId, 10);
  const messageId = parseInt(req.params.messageId, 10);
  
  const channel = mockChannels.find(c => c.id === channelId);
  if (!channel) {
    return res.status(404).json({ message: 'Channel not found' });
  }
  
  // Check if user has access to this channel
  if (!canAccessChannel(req.user, channel)) {
    return res.status(403).json({ message: 'You do not have access to this channel' });
  }
  
  const messageIndex = mockMessages.findIndex(m => m.id === messageId && m.channelId === channelId);
  if (messageIndex === -1) {
    return res.status(404).json({ message: 'Message not found' });
  }
  
  const message = mockMessages[messageIndex];
  
  // Only the message author or an admin can delete the message
  if (message.userId !== req.user.id && !req.user.roles.includes('Admin')) {
    return res.status(403).json({ message: 'You do not have permission to delete this message' });
  }
  
  // Remove the message
  const deletedMessage = mockMessages.splice(messageIndex, 1)[0];
  
  console.log(`User ${req.user.email} deleted message ${messageId} from channel ${channelId}`);
  res.status(200).json({ message: 'Message deleted successfully', id: deletedMessage.id });
});

// --- End Messaging Channel Routes ---

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});