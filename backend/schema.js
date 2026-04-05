const { gql, AuthenticationError } = require('apollo-server-express');
const { getDb } = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'fint3ch_s3cr3t';

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    role: String!
    status: String!
    createdAt: String!
  }

  type Transaction {
    id: ID!
    userId: ID!
    amount: Float!
    type: String!
    category: String!
    date: String!
    description: String
    createdAt: String!
    deletedAt: String
  }

  type TransactionResponse {
    transactions: [Transaction!]!
    totalCount: Int!
    page: Int!
    limit: Int!
    hasMore: Boolean!
  }

  type DashboardSummary {
    totalIncome: Float!
    totalExpenses: Float!
    netBalance: Float!
    recentTransactions: [Transaction!]!
    categoryBreakdown: [CategoryTotal!]!
  }

  type CategoryTotal {
    category: String!
    total: Float!
    type: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
    users: [User!]!
    transactions(
      type: String, 
      category: String, 
      startDate: String, 
      endDate: String,
      search: String,
      page: Int,
      limit: Int
    ): TransactionResponse!
    dashboardSummary: DashboardSummary!
  }

  type Mutation {
    login(username: String!, password: String!): AuthPayload
    createTransaction(amount: Float!, type: String!, category: String!, date: String!, description: String): Transaction
    updateTransaction(id: ID!, amount: Float, type: String, category: String, date: String, description: String): Transaction
    deleteTransaction(id: ID!): Boolean
    updateUserStatus(id: ID!, status: String!): User
  }
`;

const resolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) return null;
      const db = getDb();
      return await db.get('SELECT id, username, role, status, created_at as createdAt FROM users WHERE id = ?', user.id);
    },
    users: async (_, __, { user }) => {
      if (!user || user.role !== 'Admin') throw new AuthenticationError('Unauthorized');
      const db = getDb();
      return await db.all('SELECT id, username, role, status, created_at as createdAt FROM users');
    },
    transactions: async (_, { type, category, startDate, endDate, search, page = 1, limit = 10 }, { user }) => {
      if (!user || (user.role !== 'Admin' && user.role !== 'Analyst')) throw new AuthenticationError('Unauthorized');
      
      const db = getDb();
      let query = 'SELECT id, user_id as userId, amount, type, category, date, description, created_at as createdAt, deleted_at as deletedAt FROM transactions WHERE deleted_at IS NULL';
      const params = [];

      if (type) {
        query += ' AND type = ?';
        params.push(type);
      }
      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }
      if (startDate) {
        query += ' AND date >= ?';
        params.push(startDate);
      }
      if (endDate) {
        query += ' AND date <= ?';
        params.push(endDate);
      }
      if (search) {
        query += ' AND (description LIKE ? OR category LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      // Get total count for pagination
      const countQuery = query.replace('id, user_id as userId, amount, type, category, date, description, created_at as createdAt, deleted_at as deletedAt', 'COUNT(*) as count');
      const countResult = await db.get(countQuery, ...params);
      const totalCount = countResult.count;

      // Apply pagination
      const offset = (page - 1) * limit;
      query += ' ORDER BY date DESC LIMIT ? OFFSET ?';
      const transactions = await db.all(query, ...params, limit, offset);

      return {
        transactions,
        totalCount,
        page,
        limit,
        hasMore: offset + transactions.length < totalCount
      };
    },
    dashboardSummary: async () => {
      const db = getDb();
      const transactions = await db.all('SELECT * FROM transactions WHERE deleted_at IS NULL');
      const income = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);

      const categories = {};
      transactions.forEach(t => {
        if (!categories[t.category]) {
          categories[t.category] = { category: t.category, total: 0, type: t.type };
        }
        categories[t.category].total += t.amount;
      });

      return {
        totalIncome: income,
        totalExpenses: expenses,
        netBalance: income - expenses,
        recentTransactions: transactions.slice(0, 5).map(t => ({
          ...t,
          userId: t.user_id,
          createdAt: t.created_at
        })),
        categoryBreakdown: Object.values(categories)
      };
    }
  },
  Mutation: {
    login: async (_, { username, password }) => {
      const db = getDb();
      const user = await db.get('SELECT * FROM users WHERE username = ?', username);
      if (!user) throw new AuthenticationError('User Not Found or Access Blocked. Please contact admin');
      
      const valid = bcrypt.compareSync(password, user.password_hash);
      if (!valid) throw new AuthenticationError('Invalid password');
      
      if (user.status !== 'Active') {
        throw new AuthenticationError('Your account has been deactivated. Please contact support.');
      }
      
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '1d' });
      
      return {
        token,
        user: {
          ...user,
          createdAt: user.created_at
        }
      };
    },
    createTransaction: async (_, args, { user }) => {
      if (!user || user.role !== 'Admin') throw new AuthenticationError('Unauthorized');
      const db = getDb();
      const result = await db.run('INSERT INTO transactions (user_id, amount, type, category, date, description) VALUES (?, ?, ?, ?, ?, ?)', 
        user.id, args.amount, args.type, args.category, args.date, args.description);
      
      const finalResult = await db.get('SELECT id, user_id as userId, amount, type, category, date, description, created_at as createdAt FROM transactions WHERE id = ?', result.lastID);
      return finalResult;
    },
    updateTransaction: async (_, { id, ...args }, { user }) => {
      if (!user || user.role !== 'Admin') throw new AuthenticationError('Unauthorized');
      
      const db = getDb();
      const fields = [];
      const params = [];
      
      Object.keys(args).forEach(key => {
        if (args[key] !== undefined) {
          fields.push(`${key} = ?`);
          params.push(args[key]);
        }
      });
      
      if (fields.length === 0) return await db.get('SELECT id, user_id as userId, amount, type, category, date, description, created_at as createdAt FROM transactions WHERE id = ?', id);
      
      params.push(id);
      const query = `UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`;
      await db.run(query, ...params);
      
      return await db.get('SELECT id, user_id as userId, amount, type, category, date, description, created_at as createdAt FROM transactions WHERE id = ?', id);
    },
    deleteTransaction: async (_, { id }, { user }) => {
      if (!user || user.role !== 'Admin') throw new AuthenticationError('Unauthorized');
      const db = getDb();
      const info = await db.run('UPDATE transactions SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', id);
      return info.changes > 0;
    },
    updateUserStatus: async (_, { id, status }, { user }) => {
      if (!user || user.role !== 'Admin') throw new AuthenticationError('Unauthorized');
      const db = getDb();
      await db.run('UPDATE users SET status = ? WHERE id = ?', status, id);
      return await db.get('SELECT id, username, role, status, created_at as createdAt FROM users WHERE id = ?', id);
    }
  }
};

module.exports = { typeDefs, resolvers };
