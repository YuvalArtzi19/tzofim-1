# System Patterns: ScoutsTribe

## 🏛️ Architecture Overview

ScoutsTribe is envisioned as a modern web application with a distinct frontend and backend.

- **Frontend:** A single-page application (SPA) likely built with React/Next.js, providing a dynamic user interface.
- **Backend:** A Node.js API (likely using Express) responsible for business logic, data management, and serving the frontend.
- **Database:** A relational (PostgreSQL) or NoSQL (Firebase) database to store application data, including users, groups, messages, forms, tasks, and documents.
- **Authentication:** A dedicated service (Firebase Auth or Auth0) to handle user login, session management, and security.
- **Storage:** Cloud-based storage (AWS S3 or Firebase Storage) for handling document uploads.

## 🔑 Key Technical Decisions & Patterns
- **Role-Based Access Control (RBAC):** Access to features and data will be strictly controlled based on user roles (Scout Leader, Grade Manager, Counselor, Admin). This will be implemented both on the frontend (UI visibility) and backend (API authorization). Special groups like Operations and Shachbag have specific access patterns.

- **Grade-Based Access Control:** Members are restricted to their assigned grade's events and channels, with special provisions:
  * Regular members can only access their grade's content
  * Operations grade members can access any grade's content
  * Shachbag group (counselors and tribe leaders) has special access rights
  * Grade validation enforced on both frontend and backend

- **Year-Based Data Isolation:** The "Annual Group Transition Engine" requires a mechanism to partition or scope data (messages, forms, documents, assignments) by year. The active year's data is mutable, while previous years' data becomes read-only archives. This might involve database schema design (e.g., year columns, separate tables/collections per year) or application-level logic.
- **Year-Based Data Isolation:** The "Annual Group Transition Engine" requires a mechanism to partition or scope data (messages, forms, documents, assignments) by year. The active year's data is mutable, while previous years' data becomes read-only archives. This might involve database schema design (e.g., year columns, separate tables/collections per year) or application-level logic.
- **Component-Based UI:** The frontend will utilize a component-based architecture (inherent in React/Next.js) for reusability and maintainability.
- **API-Driven:** The frontend will communicate with the backend via RESTful or GraphQL APIs.
- **Real-time Features (Potential):** The communication hub might require real-time capabilities (e.g., WebSockets via Socket.IO or Firebase Realtime Database/Firestore) for instant message delivery.
- **Task/Notification System:** A background job or scheduling mechanism might be needed for sending reminders for forms and tasks.
- **Modular Design:** Key features (Communication, Forms, Tasks, Documents, Roles, Transitions) should be designed as distinct modules where possible to manage complexity.

## 🧱 Component Relationships (High-Level)

```mermaid
graph TD
    User --> Frontend[React/Next.js SPA]
    Frontend --> Backend[Node.js API (Express)]
    
    Backend --> Auth[Authentication Service (Firebase/Auth0)]
    Backend --> DB[Database (PostgreSQL/Firebase)]
    Backend --> Storage[File Storage (S3/Firebase)]
    
    subgraph Backend Services
        Comm[Communication Module]
        Forms[Forms Module]
        Tasks[Tasks Module]
        Docs[Documents Module]
        Roles[RBAC Module]
        Transition[Annual Transition Engine]
    end

    Backend --> Comm
    Backend --> Forms
    Backend --> Tasks
    Backend --> Docs
    Backend --> Roles
    Backend --> Transition

    Comm --> DB
    Forms --> DB
    Tasks --> DB
    Docs --> DB
    Docs --> Storage
    Roles --> DB
    Transition --> DB