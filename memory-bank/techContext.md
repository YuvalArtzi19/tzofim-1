# Tech Context: ScoutsTribe

## 💻 Technologies Recommended

Based on the `productbrief.md`, the following technologies are recommended for the MVP:

- **Frontend:** React / Next.js
- **Backend:** Node.js with Express framework
- **Database:** PostgreSQL or Firebase
- **Authentication:** Firebase Auth or Auth0
- **File Storage:** AWS S3 or Firebase Storage

## 🛠️ Development Setup

- **Local Environment:** The application must be runnable locally for development and debugging.
- **Execution Command:** The standard command to start the local development server should be `npm run dev`.
- **Initial Focus:** Development will initially focus on local execution without immediate concern for external deployment infrastructure.

## ⚙️ Technical Constraints & Considerations

- **Web Application:** The MVP is explicitly defined as a web application.
- **Node.js Ecosystem:** The backend relies on the Node.js runtime and npm/yarn for package management.
- **Year-Based Data:** The database schema and backend logic must support the "Annual Group Transition Engine," allowing data to be segmented by year and making prior years read-only.
- **Role-Based Access:** Implementation requires careful handling of roles and permissions throughout the stack (frontend UI, backend API, potentially database rules).
- **Scalability (Future):** While the MVP focuses on local development, the chosen technologies (React/Next.js, Node.js, cloud databases/storage) generally support scaling for future deployment.