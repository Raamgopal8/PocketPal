# PocketPal (Fintech Dashboard)

**PocketPal** is a professional, high-fidelity Fintech Dashboard application built with React, GraphQL, and Node.js. This project features a robust role-based access control system, real-time data visualization (conceptually), and a sleek, modern UI.

## 🚀 Features

### **Frontend (Vite + React)**
- **Modern UI/UX**: Built with Bootstrap and custom CSS for a premium, responsive feel.
- **Dynamic Animations**: Powered by GSAP for smooth transitions and interactive elements.
- **Role-Based Access Control (RBAC)**: Supports three user roles:
  - **Admin**: Full access (Dashboard, Transactions, User Management).
  - **Analyst**: Access to Dashboard and Transactions.
  - **Viewer**: Read-only access to the Dashboard.
- **State Management**: Uses Apollo Client for efficient GraphQL data fetching and caching.
- **Responsive Layout**: Sidebar navigation that adapts to different screen sizes.

- **Seeded Data**: Automatically initializes with sample users and transactions for testing.
- **Advanced Features**:
  - **Pagination**: Efficient record listing with `page` and `limit` support.
  - **Search**: Real-time filtering of transactions by description or category.
  - **Soft Delete**: Transactions are never permanently removed, instead marked as deleted for audit purposes.
  - **Rate Limiting**: Protects the API from abuse using `express-rate-limit`.
  - **Automated Testing**: Integration tests for core GraphQL functionality using Jest and Supertest.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Apollo Client, React Router 7, Bootstrap, GSAP, Lucide React.
- **Backend**: Node.js, Express, Apollo Server Express, GraphQL, JWT, bcryptjs.
- **Database**: SQLite (better-sqlite3).

---

## 📂 Project Structure

```text
fintechdashboard/
├── backend/                # Node.js GraphQL Server
│   ├── index.js            # Server entry point
│   ├── schema.js           # GraphQL type definitions and resolvers
│   ├── db.js               # SQLite database configuration & initial data
│   ├── fintech.db          # SQLite database file
│   ├── tests/              # Integration tests
│   └── package.json        # Backend dependencies
├── frontend/               # Vite + React Client
│   ├── src/                # Source code
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page-level components
│   │   ├── graphql/        # GraphQL queries and mutations
│   │   ├── App.jsx         # Main application logic
│   │   └── main.jsx        # App entry point
│   ├── public/             # Static assets
│   ├── index.html          # HTML entry point
│   └── package.json        # Frontend dependencies
├── vercel.json             # Vercel monorepo configuration
└── README.md               # Project documentation (this file)
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### 1. Setup Backend
```bash
cd backend
npm install
node index.js
```
The backend server will start at `http://localhost:4000/graphql`.

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend application will be available at `http://localhost:5173`.

### **Default Credentials**

| Username | Password | Role |
| :--- | :--- | :--- |
| `admin` | `admin123` | Admin |
| `analyst` | `analyst123` | Analyst |
| `viewer` | `viewer123` | Viewer |

---

## 🌐 Vercel Deployment

PocketPal is configured for mono-repo deployment on Vercel using `experimentalServices`.

### **Service Configuration**
- **Frontend**: Hosted at the root `/`.
- **Backend**: Proxied via `/_/backend`. The GraphQL endpoint is available at `/_/backend/graphql`.

### Database Setup (Vercel Postgres)

PocketPal uses **Vercel Postgres** for production-grade persistence and compatibility with Vercel Serverless Functions.

1.  **Create a Postgres Store**: In your Vercel Dashboard, go to **Storage** and create a new **Postgres** database.
2.  **Connect to Project**: Link the Postgres store to your PocketPal project. This will automatically inject several environment variables, including `POSTGRES_URL`.
3.  **Local Development**:
    - Use a local PostgreSQL instance or a remote development database.
    - Set `POSTGRES_URL` in a `.env` file in the `backend` directory.
    - Example: `POSTGRES_URL=postgres://user:password@localhost:5432/pocketpal`

### Environment Variables

| Variable | Description | Default (Dev) |
| :--- | :--- | :--- |
| `POSTGRES_URL` | Connection string for PostgreSQL | **Required** |
| `JWT_SECRET` | Secret key for token signing | `fint3ch_s3cr3t` |
| `PORT` | Backend port | `4000` |
| `VITE_API_URL` | (Frontend) Backend API endpoint | Proxied via Vercel |

---

## 🧪 Testing
To run the back-end integration tests:
```bash
cd backend
npm test
```

---

## 🔒 Authentication & Roles

The system uses JSON Web Tokens (JWT) for authentication. Each user role has specific permissions:
- **Admin**: Can create/delete transactions and update user statuses (Active/Inactive).
- **Analyst**: Can view and manage transactions but cannot manage users.
- **Viewer**: Limited to viewing dashboard summaries.

---

## 📄 License
This project is licensed under the ISC License.
