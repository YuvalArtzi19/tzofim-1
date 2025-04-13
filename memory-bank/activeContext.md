# Active Context: ScoutsTribe - Backend Setup & Auth Placeholders

## 🎯 Current Focus

- **Memory Bank Initialization:** Establishing the core documentation files (`productContext.md`, `systemPatterns.md`, `techContext.md`, `activeContext.md`, `progress.md`) based on the initial `productbrief.md`.
- **Backend Setup:** Establishing the basic Express server, including dependencies (`express`, `nodemon`), scripts (`dev`), and initial file structure (`server.js`).
- **Authentication Foundation:** Creating placeholder API endpoints for core authentication actions (signup, login, logout).

## 📝 Recent Changes

- Initialized core Memory Bank files (`productContext.md`, `systemPatterns.md`, `techContext.md`, `activeContext.md`, `progress.md`).
- Created `.gitignore` file.
- Initialized Git repository.
- Created `client/` and `server/` directories.
- Initialized `package.json` in `server/` using `npm init -y`.
- Initialized Next.js project in `client/` using `npx create-next-app`.
- Attempted initial Git push (failed due to connection issue).
- Corrected client project location (moved from `server/client` to `client/`).
- Installed `express` and `nodemon` in `server/`.
- Added `dev` script to `server/package.json`.
- Updated `progress.md` to reflect server setup.
- Committed server setup changes to Git.
- Added placeholder authentication routes (`/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`) to `server/server.js`.

## 🚀 Next Steps

1.  Update `progress.md` to reflect the addition of auth placeholders.
2.  Commit documentation updates (activeContext, progress) to Git.
3.  Decide on and set up the database (e.g., PostgreSQL or Firebase).
4.  Define the initial database schema, focusing on users and roles first.
5.  Implement actual authentication logic (hashing passwords, user creation/lookup).
6.  Implement basic Role-Based Access Control (RBAC) middleware.
7.  Address the Git push connection issue when possible.

## 🤔 Active Decisions & Considerations

- **Technology Choices:** Confirming the specific libraries/frameworks within the recommended stack (e.g., choosing between PostgreSQL and Firebase, deciding on specific React state management). For now, proceeding with the recommendations: React/Next.js, Node.js/Express. Database choice TBD, potentially starting with a simpler setup or mock data.
- **Directory Structure:** Deciding on the optimal monorepo or separate repo structure. Starting with a simple top-level `client` and `server` directory structure within this workspace.