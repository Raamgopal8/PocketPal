const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function initializeDb() {
  const usersCol = db.collection('users');
  const snapshot = await usersCol.limit(1).get();
  
  if (snapshot.empty) {
    console.log('Initializing Firestore with seed data...');
    
    // Seed Users
    const salt = bcrypt.genSaltSync(10);
    const users = [
      { id: '1', username: 'admin', password_hash: bcrypt.hashSync('admin123', salt), role: 'Admin', status: 'Active', created_at: admin.firestore.FieldValue.serverTimestamp() },
      { id: '2', username: 'analyst', password_hash: bcrypt.hashSync('analyst123', salt), role: 'Analyst', status: 'Active', created_at: admin.firestore.FieldValue.serverTimestamp() },
      { id: '3', username: 'viewer', password_hash: bcrypt.hashSync('viewer123', salt), role: 'Viewer', status: 'Active', created_at: admin.firestore.FieldValue.serverTimestamp() }
    ];

    const batch = db.batch();
    users.forEach(u => {
      const ref = usersCol.doc(u.id);
      batch.set(ref, u);
    });

    // Seed Transactions
    const transCol = db.collection('transactions');
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const initialTransactions = [
      { user_id: '1', amount: 5000, type: 'Income', category: 'Salary', date: '2026-04-01', description: 'Monthly Salary', created_at: admin.firestore.FieldValue.serverTimestamp(), deleted_at: null },
      { user_id: '1', amount: 1200, type: 'Expense', category: 'Rent', date: '2026-04-02', description: 'April Rent', created_at: admin.firestore.FieldValue.serverTimestamp(), deleted_at: null },
      { user_id: '1', amount: 150, type: 'Expense', category: 'Groceries', date: today, description: 'Weekly Groceries', created_at: admin.firestore.FieldValue.serverTimestamp(), deleted_at: null },
      { user_id: '1', amount: 80, type: 'Expense', category: 'Utilities', date: yesterday, description: 'Electricity Bill', created_at: admin.firestore.FieldValue.serverTimestamp(), deleted_at: null },
      { user_id: '1', amount: 200, type: 'Income', category: 'Freelance', date: today, description: 'Logo Design Project', created_at: admin.firestore.FieldValue.serverTimestamp(), deleted_at: null }
    ];

    initialTransactions.forEach(t => {
      const ref = transCol.doc();
      batch.set(ref, t);
    });

    await batch.commit();
    console.log('Firestore initialization complete.');
  }
}

function getDb() {
  return {
    // Firestore native access
    firestore: db,
    // Compatibility wrapper for SQL-like queries (limited)
    query: async (sql, params = []) => {
      // Very crude SQL-to-Firestore mapping for simple cases
      // This is mainly to keep some legacy compatibility if needed, 
      // but it's better to update resolvers to use .firestore directly.
      if (sql.includes('FROM users WHERE id = ?')) {
        const doc = await db.collection('users').doc(params[0].toString()).get();
        return { rows: doc.exists ? [{ ...doc.data(), id: doc.id }] : [] };
      }
      if (sql.includes('FROM users WHERE username = ?')) {
        const snapshot = await db.collection('users').where('username', '==', params[0]).get();
        return { rows: snapshot.docs.map(d => ({ ...d.data(), id: d.id })) };
      }
      if (sql.includes('UPDATE users SET status = ? WHERE id = ?')) {
        await db.collection('users').doc(params[1].toString()).update({ status: params[0] });
        return { rowCount: 1 };
      }
      // For more complex queries, the resolvers should be updated.
      throw new Error(`Legacy SQL query not implemented in Firestore wrapper: ${sql}`);
    }
  };
}

module.exports = { initializeDb, getDb };
