const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'fintech.db'));

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('Admin', 'Analyst', 'Viewer')) DEFAULT 'Viewer',
    status TEXT CHECK(status IN ('Active', 'Inactive')) DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    type TEXT CHECK(type IN ('Income', 'Expense')) NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Add Initial Data if empty
const userCount = db.prepare('SELECT count(*) as count FROM users').get().count;

if (userCount === 0) {
  const salt = bcrypt.genSaltSync(10);
  const adminPass = bcrypt.hashSync('admin123', salt);
  const analystPass = bcrypt.hashSync('analyst123', salt);
  const viewerPass = bcrypt.hashSync('viewer123', salt);

  const insertUser = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
  insertUser.run('admin', adminPass, 'Admin');
  insertUser.run('analyst', analystPass, 'Analyst');
  insertUser.run('viewer', viewerPass, 'Viewer');

  console.log('Initial users created.');

  const adminId = 1; // Assuming first user is id 1
  const insertTransaction = db.prepare('INSERT INTO transactions (user_id, amount, type, category, date, description) VALUES (?, ?, ?, ?, ?, ?)');

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  insertTransaction.run(adminId, 5000, 'Income', 'Salary', '2026-04-01', 'Monthly Salary');
  insertTransaction.run(adminId, 1200, 'Expense', 'Rent', '2026-04-02', 'April Rent');
  insertTransaction.run(adminId, 150, 'Expense', 'Groceries', today, 'Weekly Groceries');
  insertTransaction.run(adminId, 80, 'Expense', 'Utilities', yesterday, 'Electricity Bill');
  insertTransaction.run(adminId, 200, 'Income', 'Freelance', today, 'Logo Design Project');

  console.log('Initial transactions created.');
}

module.exports = db;
