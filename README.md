# PocketPal (Fintech Dashboard)

**PocketPal** is a professional, high-fidelity Fintech Dashboard application migrated from a legacy SQLite stack to a modern, serverless architecture on **Firebase**. 

## 🚀 Features

### **Frontend (Vite + React)**
- **Modern UI/UX**: Built with Bootstrap and custom CSS for a premium, responsive feel.
- **Dynamic Animations**: Powered by GSAP for smooth transitions and interactive elements.
- **State Management**: Uses Apollo Client for efficient GraphQL data fetching and caching.
- **Live Deployment**: Hosted on **Firebase Hosting** for high availability.

### **Backend (Firebase Cloud Functions V2)**
- **Serverless GraphQL**: The Express/Apollo server runs as a **2nd Gen Cloud Function** (`api_v2`) on **Node.js 22**.
- **Role-Based Access Control (RBAC)**: Secure access for Admins, Analysts, and Viewers.
- **Infrastructure Hardening**: Optimized with `trust proxy` and public invoker permissions for seamless frontend communication.

### **Database (Cloud Firestore)**
- **Global Availability**: Replaced local SQLite with **Google Cloud Firestore**.
- **Optimized Queries**: Includes **Composite Indexes** to support high-performance filtering by `deleted_at` and ordering by `date`.
- **Seeded Data**: Automatically initializes with sample users and transactions upon first run.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Apollo Client, React Router 7, Bootstrap, GSAP, Lucide React.
- **Backend**: Node.js 22, Express, Apollo Server Express, **Firebase Functions V2**, JWT, bcryptjs.
- **Database**: **Google Cloud Firestore**.
- **Hosting**: Firebase Hosting.

---

## 📂 Project Structure

```text
fintechdashboard/
├── backend/                # Firebase Cloud Functions Source
│   ├── index.js            # Express app & Function entry point
│   ├── schema.js           # GraphQL schema & Firestore resolvers
│   ├── db.js               # Firestore initialization & seeding
│   ├── tests/              # Integration tests (Local)
│   └── package.json        # Backend dependencies & Node 22 config
├── frontend/               # Vite + React Client
│   ├── src/                # Source code
│   ├── dist/               # Production build (Target for Hosting)
│   └── package.json        # Frontend dependencies
├── firebase.json           # Firebase CLI configuration (Hosting & Functions)
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Firestore composite index definitions
├── .firebaserc             # Firebase project configuration
└── README.md               # Project documentation (this file)
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v22+)
- Firebase CLI (`npm install -g firebase-tools`)

### 1. Local Development (Emulator Suite)
You can run the entire stack locally using the Firebase Emulator Suite:
```bash
# In the root directory
firebase emulators:start
```
The frontend will be at `http://localhost:5000` (or your configured port) and the GraphQL UI at `http://localhost:4000/graphql`.

### 2. Manual Setup
Alternatively, run components individually:
#### Backend
```bash
cd backend
npm install
node index.js # Runs as a standalone Express server
```
#### Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Deployment
```bash
# Build the frontend
cd frontend && npm run build

# Deploy to Firebase
cd ..
firebase deploy --project pocketpal-28dad
```

---

## 🌐 Live Application
[https://pocketpal-28dad.web.app](https://pocketpal-28dad.web.app)

---

## 🔒 Default Credentials

| Username | Password | Role |
| :--- | :--- | :--- |
| `admin` | `admin123` | Admin |
| `analyst` | `analyst123` | Analyst |
| `viewer` | `viewer123` | Viewer |

---

## 🧪 Testing
To run the local integration tests:
```bash
cd backend
npm test
```

