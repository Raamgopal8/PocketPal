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
      const db = getDb().firestore;
      const doc = await db.collection('users').doc(user.id.toString()).get();
      if (!doc.exists) return null;
      const data = doc.data();
      return { ...data, id: doc.id, createdAt: data.created_at?.toDate?.()?.toISOString() || data.created_at };
    },
    users: async (_, __, { user }) => {
      if (!user || user.role !== 'Admin') throw new AuthenticationError('Unauthorized');
      const db = getDb().firestore;
      const snapshot = await db.collection('users').get();
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return { ...data, id: doc.id, createdAt: data.created_at?.toDate?.()?.toISOString() || data.created_at };
      });
    },
    transactions: async (_, { type, category, startDate, endDate, search, page = 1, limit = 10 }, { user }) => {
      if (!user || (user.role !== 'Admin' && user.role !== 'Analyst')) throw new AuthenticationError('Unauthorized');
      
      const db = getDb().firestore;
      let query = db.collection('transactions').where('deleted_at', '==', null);

      if (type) query = query.where('type', '==', type);
      if (category) query = query.where('category', '==', category);
      if (startDate) query = query.where('date', '>=', startDate);
      if (endDate) query = query.where('date', '<=', endDate);

      // Firestore doesn't support LIKE. We'll fetch and filter if search is provided.
      // Or we can use a simpler approach for now.
      const snapshot = await query.orderBy('date', 'desc').get();
      let transactions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

      if (search) {
        const s = search.toLowerCase();
        transactions = transactions.filter(t => 
          (t.description && t.description.toLowerCase().includes(s)) || 
          (t.category && t.category.toLowerCase().includes(s))
        );
      }

      const totalCount = transactions.length;
      const offset = (page - 1) * limit;
      const paginatedTransactions = transactions.slice(offset, offset + limit).map(t => ({
        ...t,
        userId: t.user_id,
        createdAt: t.created_at?.toDate?.()?.toISOString() || t.created_at
      }));

      return {
        transactions: paginatedTransactions,
        totalCount,
        page,
        limit,
        hasMore: offset + paginatedTransactions.length < totalCount
      };
    },
    dashboardSummary: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Unauthorized');
      const db = getDb().firestore;
      const snapshot = await db.collection('transactions').where('deleted_at', '==', null).get();
      const transactions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      
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
          createdAt: t.created_at?.toDate?.()?.toISOString() || t.created_at
        })),
        categoryBreakdown: Object.values(categories)
      };
    }
  },
  Mutation: {
    login: async (_, { username, password }) => {
      const db = getDb().firestore;
      const snapshot = await db.collection('users').where('username', '==', username).get();
      const userDoc = snapshot.docs[0];
      
      if (!userDoc) throw new AuthenticationError('User Not Found or Access Blocked. Please contact admin');
      
      const user = userDoc.data();
      const valid = bcrypt.compareSync(password, user.password_hash);
      if (!valid) throw new AuthenticationError('Invalid password');
      
      if (user.status !== 'Active') {
        throw new AuthenticationError('Your account has been deactivated. Please contact support.');
      }
      
      const token = jwt.sign({ id: userDoc.id, username: user.username, role: user.role }, SECRET, { expiresIn: '1d' });
      
      return {
        token,
        user: {
          ...user,
          id: userDoc.id,
          createdAt: user.created_at?.toDate?.()?.toISOString() || user.created_at
        }
      };
    },
    createTransaction: async (_, args, { user }) => {
      if (!user || user.role !== 'Admin') throw new AuthenticationError('Unauthorized');
      const db = getDb().firestore;
      const newTransaction = {
        user_id: user.id,
        ...args,
        created_at: new Date().toISOString(), // Use ISO string for simplicity or FieldValue
        deleted_at: null
      };
      const docRef = await db.collection('transactions').add(newTransaction);
      const doc = await docRef.get();
      return { ...doc.data(), id: doc.id, userId: user.id, createdAt: newTransaction.created_at };
    },
    updateTransaction: async (_, { id, ...args }, { user }) => {
      if (!user || user.role !== 'Admin') throw new AuthenticationError('Unauthorized');
      
      const db = getDb().firestore;
      const docRef = db.collection('transactions').doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) throw new Error('Transaction not found');
      
      const updateData = {};
      Object.keys(args).forEach(key => {
        if (args[key] !== undefined) updateData[key] = args[key];
      });
      
      if (Object.keys(updateData).length > 0) {
        await docRef.update(updateData);
      }
      
      const updatedDoc = await docRef.get();
      const data = updatedDoc.data();
      return { ...data, id: updatedDoc.id, userId: data.user_id, createdAt: data.created_at };
    },
    deleteTransaction: async (_, { id }, { user }) => {
      if (!user || user.role !== 'Admin') throw new AuthenticationError('Unauthorized');
      const db = getDb().firestore;
      await db.collection('transactions').doc(id).update({ deleted_at: new Date().toISOString() });
      return true;
    },
    updateUserStatus: async (_, { id, status }, { user }) => {
      if (!user || user.role !== 'Admin') throw new AuthenticationError('Unauthorized');
      const db = getDb().firestore;
      await db.collection('users').doc(id).update({ status });
      const doc = await db.collection('users').doc(id).get();
      const data = doc.data();
      return { ...data, id: doc.id, createdAt: data.created_at };
    }
  }
};

module.exports = { typeDefs, resolvers };
