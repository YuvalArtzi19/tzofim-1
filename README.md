# ScoutsTribe

A comprehensive platform for managing scout troops, events, and communication.

## Features

### User Management
- Role-based access control (Admin, Tribe Leader, Counselor)
- Grade assignment and tracking
- User profile management

### Event Management
- Create and manage events (global or grade-specific)
- Track attendance by grade
- Support for special groups (Operations, Shachbag)
- Total attendance statistics

### Messaging System
- Grade-based channels
- Message editing and deletion
- Role-based channel access

### Data Persistence
- JSON file-based storage
- Automatic data loading and saving
- Separate storage for:
  * Users and roles
  * Members and grades
  * Events and attendance
  * Messages and channels

## Project Structure

```
.
├── client/               # Next.js frontend
│   ├── src/
│   │   ├── app/         # Next.js app directory
│   │   ├── components/  # React components
│   │   └── api/        # API client
│   └── public/          # Static assets
├── server/              # Express backend
│   ├── data/           # JSON data storage
│   │   ├── users.json       # User accounts and roles
│   │   ├── members.json     # Scout members and grades
│   │   ├── events.json      # Events and their types
│   │   ├── attendance.json  # Event attendance records
│   │   ├── channels.json    # Communication channels
│   │   └── messages.json    # Channel messages
│   └── server.js       # Main server file
└── memory-bank/        # Project documentation
```

## Development Setup

1. Install dependencies:
```bash
# In client directory
cd client
npm install

# In server directory
cd server
npm install
```

2. Start development servers:
```bash
# Start frontend (in client directory)
npm run dev

# Start backend (in server directory)
npm run dev
```

## Grade System

- Regular grades: 1-12
- Special grades:
  * Operations: Admin access to all grades
  * Shachbag: Special group for counselors and leaders

## Access Control

- Admins: Full access to all features
- Tribe Leaders: Can manage users, events, and view all grades
- Counselors: Limited to their assigned grade
- Regular members: Access only to their grade's content

## Data Persistence

The system uses JSON files for data persistence, located in the `server/data/` directory:

- `users.json`: User accounts, roles, and grade assignments
- `members.json`: Scout members with their grades and registration info
- `events.json`: Event details including type (global/grade) and dates
- `attendance.json`: Event attendance records with timestamps
- `channels.json`: Communication channels with grade assignments
- `messages.json`: Channel messages with author and timestamp info

Features:
- Automatic data loading on server start
- Immediate saving after any data modification
- Consistent data format across restarts
- Grade-based access control preserved in storage
- Timestamp tracking for all relevant operations

## Contributing

1. Create a feature branch
2. Make changes
3. Submit a pull request

## License

MIT