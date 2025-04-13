const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname);

// Initial data structure
const initialData = {
  users: [
    {
      id: 1,
      email: 'admin@scoutstribe.com',
      password: 'admin123',
      roles: ['Admin'],
      grade: 'operations'
    },
    {
      id: 2,
      email: 'leader@scoutstribe.com',
      password: 'leader123',
      roles: ['Tribe Leader'],
      grade: '9'
    },
    {
      id: 3,
      email: 'counselor@scoutstribe.com',
      password: 'counselor123',
      roles: ['Counselor'],
      grade: '8'
    }
  ],
  channels: [],
  messages: [],
  members: [],
  events: [],
  attendance: []
};

// File paths for each data type
const dataFiles = {
  users: path.join(DATA_DIR, 'users.json'),
  channels: path.join(DATA_DIR, 'channels.json'),
  messages: path.join(DATA_DIR, 'messages.json'),
  members: path.join(DATA_DIR, 'members.json'),
  events: path.join(DATA_DIR, 'events.json'),
  attendance: path.join(DATA_DIR, 'attendance.json')
};

// Load data from file or return initial data if file doesn't exist
async function loadData(type) {
  try {
    const data = await fs.readFile(dataFiles[type], 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, save and return initial data
      await saveData(type, initialData[type]);
      return initialData[type];
    }
    throw error;
  }
}

// Save data to file
async function saveData(type, data) {
  await fs.writeFile(dataFiles[type], JSON.stringify(data, null, 2));
}

// Initialize all data files if they don't exist
async function initializeData() {
  for (const type in dataFiles) {
    try {
      await loadData(type);
    } catch (error) {
      console.error(`Error initializing ${type} data:`, error);
    }
  }
}

// Get the next ID for a given type
async function getNextId(type) {
  const data = await loadData(type);
  return data.length > 0 ? Math.max(...data.map(item => item.id)) + 1 : 1;
}

module.exports = {
  loadData,
  saveData,
  initializeData,
  getNextId
};