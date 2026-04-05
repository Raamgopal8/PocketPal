const request = require('supertest');
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { typeDefs, resolvers } = require('../schema');
const { initializeDb, getDb } = require('../db');

let server;
let app;

beforeAll(async () => {
  await initializeDb();
  app = express();
  server = new ApolloServer({
    typeDefs,
    resolvers,
    context: () => ({ user: { id: 1, role: 'Admin' } }) // Mock Admin user
  });
  await server.start();
  server.applyMiddleware({ app });
});

afterAll(async () => {
  await server.stop();
});

describe('GraphQL Queries', () => {
  it('fetches transactions with pagination', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
          query {
            transactions(page: 1, limit: 2) {
              transactions {
                id
                amount
                category
              }
              totalCount
              hasMore
            }
          }
        `
      });

    expect(response.status).toBe(200);
    expect(response.body.data.transactions.transactions.length).toBeLessThanOrEqual(2);
    expect(response.body.data.transactions).toHaveProperty('totalCount');
  });

  it('searches for transactions', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
          query {
            transactions(search: "Salary") {
              transactions {
                category
                description
              }
            }
          }
        `
      });

    expect(response.status).toBe(200);
    const transactions = response.body.data.transactions.transactions;
    transactions.forEach(t => {
      expect(t.category + t.description).toMatch(/Salary/i);
    });
  });
});

describe('GraphQL Mutations', () => {
  it('performs soft delete', async () => {
    // 1. Create a transaction
    const createRes = await request(app)
      .post('/graphql')
      .send({
        query: `
          mutation {
            createTransaction(amount: 100, type: "Expense", category: "Test", date: "2026-04-05", description: "Soft Delete Test") {
              id
            }
          }
        `
      });
    
    const id = createRes.body.data.createTransaction.id;

    // 2. Delete it
    const deleteRes = await request(app)
      .post('/graphql')
      .send({
        query: `
          mutation($id: ID!) {
            deleteTransaction(id: $id)
          }
        `,
        variables: { id }
      });
    
    expect(deleteRes.body.data.deleteTransaction).toBe(true);

    // 3. Verify it's not in the regular list
    const listRes = await request(app)
      .post('/graphql')
      .send({
        query: `
          query {
            transactions {
              transactions {
                id
              }
            }
          }
        `
      });
    
    const ids = listRes.body.data.transactions.transactions.map(t => t.id);
    expect(ids).not.toContain(id);

    // 4. Verify it's in the database with deleted_at set (manual DB check)
    const db = getDb();
    const row = await db.get('SELECT deleted_at FROM transactions WHERE id = ?', id);
    expect(row.deleted_at).not.toBeNull();
  });
});
