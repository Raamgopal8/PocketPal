const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'fintech.db');
let db;

async function initializeDb() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, async (err) => {
      if (err) {
        console.error('Error opening database', err.message);
        return reject(err);
      }
      
      try {
        // Promisify run and get for initialization
        const run = (sql) => new Promise((res, rej) => db.run(sql, (err) => err ? rej(err) : res()));
        const get = (sql) => new Promise((res, rej) => db.get(sql, (err, row) => err ? rej(err) : res(row)));

        // Create Tables
        await run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT CHECK(role IN ('Admin', 'Analyst', 'Viewer')) DEFAULT 'Viewer',
            status TEXT CHECK(status IN ('Active', 'Inactive')) DEFAULT 'Active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        await run(`
          CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            amount REAL NOT NULL,
            type TEXT CHECK(type IN ('Income', 'Expense')) NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            deleted_at DATETIME DEFAULT NULL
          );
        `);

        // Add Initial Data if empty
        const userCountRow = await get('SELECT count(*) as count FROM users');
        if (userCountRow.count === 0) {
          const salt = bcrypt.genSaltSync(10);
          const adminPass = bcrypt.hashSync('admin123', salt);
          const analystPass = bcrypt.hashSync('analyst123', salt);
          const viewerPass = bcrypt.hashSync('viewer123', salt);

          await run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['admin', adminPass, 'Admin']);
          await run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['analyst', analystPass, 'Analyst']);
          await run('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['viewer', viewerPass, 'Viewer']);

          console.log('Initial users created.');

          const adminRow = await get('SELECT id FROM users WHERE username = ?', ['admin']);
          const adminId = adminRow.id;
          
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

          await run('INSERT INTO transactions (user_id, amount, type, category, date, description) VALUES (?, ?, ?, ?, ?, ?)', [adminId, 5000, 'Income', 'Salary', '2026-04-01', 'Monthly Salary']);
          await run('INSERT INTO transactions (user_id, amount, type, category, date, description) VALUES (?, ?, ?, ?, ?, ?)', [adminId, 1200, 'Expense', 'Rent', '2026-04-02', 'April Rent']);
          await run('INSERT INTO transactions (user_id, amount, type, category, date, description) VALUES (?, ?, ?, ?, ?, ?)', [adminId, 150, 'Expense', 'Groceries', today, 'Weekly Groceries']);
          run('INSERT INTO transactions (user_id, amount, type, category, date, description) VALUES (?, ?, ?, ?, ?, ?)', [adminId, 80, 'Expense', 'Utilities', yesterday, 'Electricity Bill']);
          run('INSERT INTO transactions (user_id, amount, type, category, date, description) VALUES (?, ?, ?, ?, ?, ?)', [adminId, 200, 'Income', 'Freelance', today, 'Logo Design Project']);

          console.log('Initial transactions created.');
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
}

function getDb() {
  if (!db) throw new Error('Database not initialized.');
  
  // Return a compatibility wrapper for .query()
  return {
    query: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        // Convert $1, $2, etc. to ? if they still exist (migration bridge)
        const normalizedSql = sql.replace(/\$\d+/g, '?');
        
        if (normalizedSql.trim().toUpperCase().startsWith('SELECT')) {
          db.all(normalizedSql, params, (err, rows) => {
            if (err) return reject(err);
            resolve({ rows });
          });
        } else {
          db.run(normalizedSql, params, function(err) {
            if (err) return reject(err);
            resolve({ 
              rows: [], 
              rowCount: this.changes, 
              lastID: this.lastID 
            });
          });
        }
      });
    }
  };
}

module.exports = { initializeDb, getDb };
