# 🛠️ PRD: Scouts Tribe Management Application

## 🧭 Overview

**Product Name:** ScoutsTribe  
**Target Users:** Scouts leaders, grade-level managers, counselors  
**Purpose:** Centralize communication, streamline documentation, and reduce organizational overhead for scouts group leaders and counselors.

---

## 🎯 Problem Statement

The current coordination and communication system for managing a scouts group is fragmented and inefficient:
- Critical messages are dispersed across multiple group chats, making them hard to find.
- Important spreadsheets are manually shared and maintained in different places.
- No unified platform exists to manage operations and streamline reporting.
- Organizational transitions between years are cumbersome, with no built-in mechanism to handle changes in group composition, leadership, or responsibilities.

---

## 🌟 Goals & Objectives

- Centralize communication, forms, and documents in a single platform.
- Enable easy and flexible assignment of roles and group compositions each year.
- Archive and separate prior year data while keeping it accessible for review.
- Provide a structured, searchable environment for operational continuity.
- Ensure messages and tasks reach the right users with minimal friction.

---

## 🧩 Key Features

### 1. 📢 Central Communication Hub
- Channel-based communication by grade, event, or topic
- Support for @mentions by role (e.g., @AllGrade5 or @Counselors)
- Pin important messages
- Searchable chat with filters (by person, grade, date, tags)

### 2. 📄 Smart Forms & Weekly Submissions
- Weekly reporting templates per grade
- Form reminders via app notifications
- Dashboard for leaders to track submissions
- Version history and audit trail for each form

### 3. 📅 Events & Task Management
- Event creation with role/grade assignments
- Task creation with deadlines, reminders, and status tracking
- Shared calendar view for all users (role-filtered)

### 4. 🗂️ Document Center
- Shared document space by grade and topic
- Ability to tag documents (e.g., [2023][Trip][Permission Slip])
- Archive support per year
- File versioning and access control

### 5. 🔔 Announcement System
- Broadcast feature for high-importance messages
- Read receipt tracking
- Push notifications based on relevance

### 6. 👥 Role-based Access & Dashboards
- Roles: Scout Leader, Grade Manager, Counselor
- Custom dashboard views by role
- Admin dashboard for assignments and platform setup

### 7. 🔄 Annual Group Transition Engine
- **Static User Registration**: Once-registered users persist year to year
- **Role/Group Assignment Tool** for yearly reset:
  - Leaders assign members to groups each year
  - Assign managers and counselors to each grade
- **Year-based Workspace Isolation**:
  - Current year data is active and editable
  - Prior years’ data is **read-only archive**, viewable but not editable
- **Archive Navigation** for historical data, messaging, and reports

---

## 🧪 MVP Scope

The MVP will be developed as a **modern web application** using **Node.js** and contemporary front-end technologies. It will initially run **locally** for debugging and development (e.g., via `npm run dev`), with flexibility for later deployment.

### MVP Characteristics:
- Grade-based messaging and search
- Weekly form submission and tracker
- Role-based login system and group assignment interface
- Year switcher and archive viewer
- Document upload and tagging
- Task creation and notification engine

### Local Development Environment:
- Run with `npm run dev`
- No external deployment during initial iteration
- Designed to run fully in local machine during development and debugging

---

## 🚀 Future Enhancements

- Mobile app with offline access
- AI assistant for weekly summaries or missed message recap
- Integration with Google Workspace (Drive, Calendar)
- PDF report exports per week or event
- SMS fallback notifications for urgent messages

---

## 🔐 Security & Privacy

- Secure login (email/password or SSO)
- Role-based access control (RBAC)
- Annual permission scope isolation
- GDPR-compliant user and data handling
- Admin access logging and audit trail

---

## 📊 Success Metrics

- >85% of forms submitted weekly by all groups
- 90% read rate for announcements
- 100% user assignment completed within 1 week of new year
- >75% user satisfaction from counselors and leaders

---

## 🧑‍💼 Stakeholders

| Stakeholder           | Role                                         |
|-----------------------|----------------------------------------------|
| Product Owner         | Scouts Leadership Board                      |
| Grade Managers        | Middle management per grade                  |
| Counselors            | Day-to-day coordinators for scout groups     |
| Technical Team        | Developers, Designer, QA                     |

---

## 📅 Timeline (MVP Estimate)

| Milestone                         | Time Estimate |
|----------------------------------|---------------|
| Requirements Finalization        | 1 week        |
| Wireframing & Design             | 2 weeks       |
| Core Development (Backend + UI)  | 5 weeks       |
| QA Testing & Feedback            | 2 weeks       |
| Deployment & Training            | 1 week        |

---

## ⚙️ Tech Stack Recommendations

- **Frontend:** React / Next.js  
- **Backend:** Node.js with Express  
- **Database:** PostgreSQL or Firebase  
- **Authentication:** Firebase Auth or Auth0  
- **Storage:** AWS S3 or Firebase Storage  
- **Local Development:** `npm run dev`  
- **Deployment (optional later):** Vercel, Firebase Hosting, or Docker
