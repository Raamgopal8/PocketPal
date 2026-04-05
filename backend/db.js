const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initializeDb() {
  const client = await pool.connect();
  try {
    // Create Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('Admin', 'Analyst', 'Viewer')) DEFAULT 'Viewer',
        status TEXT CHECK(status IN ('Active', 'Inactive')) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        amount REAL NOT NULL,
        type TEXT CHECK(type IN ('Income', 'Expense')) NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP DEFAULT NULL
      );
    `);

    // Add Initial Data if empty
    const { rows } = await client.query('SELECT count(*) as count FROM users');
    const userCount = parseInt(rows[0].count);

    if (userCount === 0) {
      const salt = bcrypt.genSaltSync(10);
      const adminPass = bcrypt.hashSync('admin123', salt);
      const analystPass = bcrypt.hashSync('analyst123', salt);
      const viewerPass = bcrypt.hashSync('viewer123', salt);

      await client.query('INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)', ['admin', adminPass, 'Admin']);
      await client.query('INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)', ['analyst', analystPass, 'Analyst']);
      await client.query('INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)', ['viewer', viewerPass, 'Viewer']);

      console.log('Initial users created.');

      const { rows: userRows } = await client.query('SELECT id FROM users WHERE username = $1', ['admin']);
      const adminId = userRows[0].id;
      
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      const insertTransaction = 'INSERT INTO transactions (user_id, amount, type, category, date, description) VALUES ($1, $2, $3, $4, $5, $6)';
      await client.query(insertTransaction, [adminId, 5000, 'Income', 'Salary', '2026-04-01', 'Monthly Salary']);
      await client.query(insertTransaction, [adminId, 1200, 'Expense', 'Rent', '2026-04-02', 'April Rent']);
      await client.query(insertTransaction, [adminId, 150, 'Expense', 'Groceries', today, 'Weekly Groceries']);
      await client.query(insertTransaction, [adminId, 80, 'Expense', 'Utilities', yesterday, 'Electricity Bill']);
      await client.query(insertTransaction, [adminId, 200, 'Income', 'Freelance', today, 'Logo Design Project']);

      console.log('Initial transactions created.');
    }
  } finally {
    client.release();
  }
}

module.exports = {
  initializeDb,
  getDb: () => pool
};
