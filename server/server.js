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

// Member and event management data structures
const mockMembers = []; // Stores { id, firstName, lastName, grade, year }
let nextMemberId = 1;

const mockEvents = []; // Stores { id, name, date, type: 'global'|'grade', grade?, createdBy }
let nextEventId = 1;

let mockAttendance = []; // Stores { eventId, memberId, attended, grade, year }
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
  // Normalize and format grade consistently
  const formattedGrade = grade ? normalizeGrade(grade) : '';
  
  const newUser = {
    id: nextUserId++,
    email,
    password: password, // Storing plain text for mock purposes ONLY
    roles: roles || ['Counselor'], // Default role if not provided
    grade: formattedGrade // Store normalized grade
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
    
    // Normalize grade format
    const normalizedGrade = normalizeGrade(grade);
    
    // Update user grade
    userToUpdate.grade = normalizedGrade;
    
    console.log(`User ${req.user.email} updated grade for user ${userToUpdate.email} to ${normalizedGrade}`);
    
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
    
    // Normalize grades for comparison
    const normalizedRequestGrade = normalizeGrade(grade);
    const normalizedUserGrade = normalizeGrade(req.user.grade);
    
    // If counselor, check if they're creating a channel for their grade
    if (isCounselor && !isAdmin && !isTribeLeader && normalizedUserGrade !== normalizedRequestGrade) {
      return res.status(403).json({
        message: `Counselors can only create channels for their assigned grade (${req.user.grade})`
      });
    }

    // Store grade in a consistent format: number + "th" (e.g., "7th")
    const formattedGrade = normalizedRequestGrade + 'th';
    
    const newChannel = {
      id: nextChannelId++,
      name,
      grade: formattedGrade
    };
    mockChannels.push(newChannel);
    console.log(`User ${req.user.email} created channel:`, newChannel);
    console.log('Current Mock Channels:', mockChannels);
    res.status(201).json(newChannel);
  }
);

// Helper function to normalize grade format (e.g., "7" and "7th" are treated the same)
const normalizeGrade = (grade) => {
  if (!grade) return '';
  // Remove any non-digit characters and trim
  return grade.replace(/[^\d]/g, '').trim();
};

// Helper function to check if user can access a channel
const canAccessChannel = (user, channel) => {
  // Admins and Tribe Leaders can access all channels
  if (user.roles.includes('Admin') || user.roles.includes('Tribe Leader')) {
    return true;
  }
  
  // Counselors can access channels for their assigned grade
  if (user.roles.includes('Counselor')) {
    // Allow access if the channel grade matches the counselor's assigned grade
    const normalizedUserGrade = normalizeGrade(user.grade);
    const normalizedChannelGrade = normalizeGrade(channel.grade);
    return normalizedUserGrade === normalizedChannelGrade;
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

// --- Member Management Routes ---

// GET /api/grade/members - Get members for counselor's grade
app.get('/api/grade/members', checkAuth, (req, res) => {
  // Only counselors, admins, and tribe leaders can access members
  if (!req.user.roles.some(role => ['Counselor', 'Admin', 'Tribe Leader'].includes(role))) {
    return res.status(403).json({ message: 'Access denied' });
  }

  let gradeMembers;
  if (req.user.roles.includes('Admin') || req.user.roles.includes('Tribe Leader')) {
    // Admins and tribe leaders can see all members, grouped by grade
    const membersByGrade = {};
    mockMembers.forEach(member => {
      if (!membersByGrade[member.grade]) {
        membersByGrade[member.grade] = [];
      }
      membersByGrade[member.grade].push(member);
    });
    gradeMembers = membersByGrade;
  } else {
    // Counselors can only see their grade's members
    gradeMembers = mockMembers.filter(member => normalizeGrade(member.grade) === normalizeGrade(req.user.grade));
  }

  res.status(200).json(gradeMembers);
});

// POST /api/grade/members - Add a new member to counselor's grade
app.post('/api/grade/members', checkAuth, (req, res) => {
  const { firstName, lastName, grade } = req.body;

  // Only counselors, admins, and tribe leaders can add members
  if (!req.user.roles.some(role => ['Counselor', 'Admin', 'Tribe Leader'].includes(role))) {
    return res.status(403).json({ message: 'Access denied' });
  }

  if (!firstName) {
    return res.status(400).json({ message: 'First name is required' });
  }

  // For counselors, enforce using their assigned grade
  const memberGrade = req.user.roles.includes('Counselor') ? req.user.grade : grade;
  
  if (!memberGrade) {
    return res.status(400).json({ message: 'Grade is required' });
  }

  const currentYear = new Date().getFullYear().toString();
  
  const newMember = {
    id: nextMemberId++,
    firstName,
    lastName: lastName || '',
    grade: memberGrade,
    registrationYear: currentYear,
    initialGrade: memberGrade // Store initial grade for future grade advancement
  };

  mockMembers.push(newMember);
  console.log(`User ${req.user.email} added new member:`, newMember);

  res.status(201).json(newMember);
});

// POST /api/members/advance-grades - Advance member grades based on registration year
app.post('/api/members/advance-grades', checkAuth, (req, res) => {
  // Only admins and tribe leaders can advance grades
  if (!req.user.roles.some(role => ['Admin', 'Tribe Leader'].includes(role))) {
    return res.status(403).json({ message: 'Only admins and tribe leaders can advance grades' });
  }

  const currentYear = new Date().getFullYear().toString();
  const updatedMembers = [];
  const errors = [];

  mockMembers.forEach(member => {
    if (!member.registrationYear || !member.initialGrade) return;

    try {
      // Calculate years passed since registration
      const yearsPassed = parseInt(currentYear) - parseInt(member.registrationYear);
      const initialGradeNum = parseInt(normalizeGrade(member.initialGrade));
      
      if (isNaN(yearsPassed) || isNaN(initialGradeNum)) {
        errors.push(`Invalid grade or year format for member ${member.id}`);
        return;
      }

      // Advance grade by years passed
      const newGrade = (initialGradeNum + yearsPassed).toString();
      member.grade = newGrade;
      updatedMembers.push(member);
    } catch (err) {
      errors.push(`Failed to advance grade for member ${member.id}: ${err.message}`);
    }
  });

  console.log(`User ${req.user.email} advanced grades for ${updatedMembers.length} members`);
  
  res.status(200).json({
    message: 'Grades advanced successfully',
    updatedMembers,
    errors: errors.length > 0 ? errors : undefined
  });
});

// PUT /api/grade/members/:memberId - Update a member's information
app.put('/api/grade/members/:memberId', checkAuth, (req, res) => {
  const memberId = parseInt(req.params.memberId, 10);
  const { firstName, lastName } = req.body;

  const member = mockMembers.find(m => m.id === memberId);
  if (!member) {
    return res.status(404).json({ message: 'Member not found' });
  }

  // Check if user has permission to modify this member
  if (req.user.roles.includes('Counselor') &&
      normalizeGrade(member.grade) !== normalizeGrade(req.user.grade)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  if (!firstName) {
    return res.status(400).json({ message: 'First name is required' });
  }

  member.firstName = firstName;
  member.lastName = lastName || '';

  console.log(`User ${req.user.email} updated member:`, member);
  res.status(200).json(member);
});

// DELETE /api/grade/members/:memberId - Remove a member
app.delete('/api/grade/members/:memberId', checkAuth, (req, res) => {
  const memberId = parseInt(req.params.memberId, 10);

  const memberIndex = mockMembers.findIndex(m => m.id === memberId);
  if (memberIndex === -1) {
    return res.status(404).json({ message: 'Member not found' });
  }

  const member = mockMembers[memberIndex];

  // Check if user has permission to delete this member
  if (req.user.roles.includes('Counselor') &&
      normalizeGrade(member.grade) !== normalizeGrade(req.user.grade)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  mockMembers.splice(memberIndex, 1);
  console.log(`User ${req.user.email} deleted member:`, member);
  res.status(200).json({ message: 'Member deleted successfully' });
});

// --- End Member Management Routes ---

// --- Member Search and Transfer Routes ---

// GET /api/members/search - Search members across all grades and years
app.get('/api/members/search', checkAuth, (req, res) => {
  const { query, year, grade } = req.query;
  
  if (!req.user.roles.some(role => ['Counselor', 'Admin', 'Tribe Leader'].includes(role))) {
    return res.status(403).json({ message: 'Access denied' });
  }

  let filteredMembers = [...mockMembers];
  
  // Filter by year if provided
  if (year) {
    filteredMembers = filteredMembers.filter(member => member.year === year);
  }

  // Filter by grade if provided
  if (grade) {
    filteredMembers = filteredMembers.filter(member =>
      normalizeGrade(member.grade) === normalizeGrade(grade)
    );
  }

  // Filter by search query if provided
  if (query) {
    const searchQuery = query.toLowerCase();
    filteredMembers = filteredMembers.filter(member =>
      member.firstName.toLowerCase().includes(searchQuery) ||
      member.lastName.toLowerCase().includes(searchQuery)
    );
  }

  // For counselors, only return members from their grade
  if (req.user.roles.includes('Counselor') && !req.user.roles.some(role => ['Admin', 'Tribe Leader'].includes(role))) {
    filteredMembers = filteredMembers.filter(member =>
      normalizeGrade(member.grade) === normalizeGrade(req.user.grade)
    );
  }

  res.status(200).json(filteredMembers);
});

// POST /api/members/transfer - Transfer members to new grades
app.post('/api/members/transfer', checkAuth, (req, res) => {
  const { members, newGrade, year } = req.body;

  if (!Array.isArray(members) || !newGrade) {
    return res.status(400).json({ message: 'Members array and new grade are required' });
  }

  // Only admins and tribe leaders can transfer members
  if (!req.user.roles.some(role => ['Admin', 'Tribe Leader'].includes(role))) {
    return res.status(403).json({ message: 'Only admins and tribe leaders can transfer members' });
  }

  const currentYear = new Date().getFullYear().toString();
  const transferYear = year || currentYear;

  const updatedMembers = [];
  const errors = [];
  
  members.forEach(memberId => {
    const member = mockMembers.find(m => m.id === memberId);
    if (member) {
      member.grade = newGrade;
      member.year = transferYear;
      updatedMembers.push(member);
    } else {
      errors.push(`Member with ID ${memberId} not found`);
    }
  });

  console.log(`User ${req.user.email} transferred members to grade ${newGrade} for year ${transferYear}:`, updatedMembers);
  
  res.status(200).json({
    message: 'Members transferred successfully',
    updatedMembers,
    errors: errors.length > 0 ? errors : undefined
  });
});

// --- Event Management Routes ---

// GET /api/events - Get events (filtered by grade for counselors)
app.get('/api/events', checkAuth, (req, res) => {
  let accessibleEvents;
  
  if (req.user.roles.includes('Admin') || req.user.roles.includes('Tribe Leader')) {
    // Admins and tribe leaders can see all events
    accessibleEvents = mockEvents;
  } else {
    // Counselors can see global events and their grade's events
    accessibleEvents = mockEvents.filter(event =>
      event.type === 'global' ||
      (event.type === 'grade' && normalizeGrade(event.grade) === normalizeGrade(req.user.grade))
    );
  }

  res.status(200).json(accessibleEvents);
});

// POST /api/events - Create a new event
app.post('/api/events', checkAuth, (req, res) => {
  const { name, date, type, grade } = req.body;

  if (!name || !date || !type) {
    return res.status(400).json({ message: 'Name, date, and type are required' });
  }

  // Validate event type permissions
  if (type === 'global' &&
      !req.user.roles.some(role => ['Admin', 'Tribe Leader'].includes(role))) {
    return res.status(403).json({ message: 'Only admins and tribe leaders can create global events' });
  }

  if (type === 'grade') {
    if (!grade) {
      return res.status(400).json({ message: 'Grade is required for grade events' });
    }

    // For grade events, counselors can only create for their grade
    if (req.user.roles.includes('Counselor') &&
        normalizeGrade(grade) !== normalizeGrade(req.user.grade)) {
      return res.status(403).json({ message: 'Counselors can only create events for their grade' });
    }
  }

  const newEvent = {
    id: nextEventId++,
    name,
    date,
    type,
    grade: type === 'grade' ? grade : null,
    createdBy: req.user.id
  };

  mockEvents.push(newEvent);
  console.log(`User ${req.user.email} created new event:`, newEvent);

  res.status(201).json(newEvent);
});

// POST /api/events/:eventId/attendance - Record attendance for an event
app.post('/api/events/:eventId/attendance', checkAuth, (req, res) => {
  const eventId = parseInt(req.params.eventId, 10);
  const { attendees } = req.body; // Array of member IDs who attended

  if (!Array.isArray(attendees)) {
    return res.status(400).json({ message: 'Attendees must be an array of member IDs' });
  }

  const event = mockEvents.find(e => e.id === eventId);
  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  // Get members being marked for attendance
  const attendingMembers = mockMembers.filter(m => attendees.includes(m.id));

  // Verify members are from the correct grade
  if (event.type === 'grade') {
    const invalidMembers = attendingMembers.filter(member => {
      // Allow operations grade (admin) to attend any event
      if (member.grade === 'operations') return false;
      // Allow Shachbag members (counselors and tribe leaders) to attend Shachbag events
      if (event.grade === 'shachbag') {
        const user = mockUsers.find(u => u.email === member.email);
        return !user?.roles.some(role => ['Counselor', 'Tribe Leader'].includes(role));
      }
      // For regular grade events, members must match the event grade
      return normalizeGrade(member.grade) !== normalizeGrade(event.grade);
    });

    if (invalidMembers.length > 0) {
      return res.status(400).json({
        message: 'Some members cannot attend this event due to grade mismatch',
        invalidMembers: invalidMembers.map(m => `${m.firstName} ${m.lastName} (Grade ${m.grade})`)
      });
    }
  }

  // Clear previous attendance records for this event
  mockAttendance = mockAttendance.filter(a => a.eventId !== eventId);

  // Record new attendance
  const newAttendance = attendees.map(memberId => {
    const member = mockMembers.find(m => m.id === memberId);
    return {
      eventId,
      memberId,
      attended: true,
      grade: member.grade
    };
  });

  mockAttendance.push(...newAttendance);

  // Calculate attendance statistics
  const gradeAttendance = {};
  let totalAttendees = 0;

  newAttendance.forEach(record => {
    if (!gradeAttendance[record.grade]) {
      gradeAttendance[record.grade] = 0;
    }
    gradeAttendance[record.grade]++;
    totalAttendees++;
  });

  const stats = {
    eventId,
    eventName: event.name,
    gradeAttendance,
    totalAttendees
  };

  console.log(`User ${req.user.email} recorded attendance for event ${eventId}:`, stats);
  res.status(200).json(stats);
});

// GET /api/events/stats - Get attendance statistics
app.get('/api/events/stats', checkAuth, (req, res) => {
  // Only admins and tribe leaders can view overall stats
  if (!req.user.roles.some(role => ['Admin', 'Tribe Leader'].includes(role))) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const stats = mockEvents.map(event => {
    const eventAttendance = mockAttendance.filter(a => a.eventId === event.id);
    const gradeAttendance = {};

    eventAttendance.forEach(record => {
      const grade = record.grade;
      if (!gradeAttendance[grade]) {
        gradeAttendance[grade] = 0;
      }
      gradeAttendance[grade]++;
    });

    return {
      eventId: event.id,
      eventName: event.name,
      type: event.type,
      date: event.date,
      gradeAttendance
    };
  });

  res.status(200).json(stats);
});

// --- End Event Management Routes ---

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});