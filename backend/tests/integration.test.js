const request = require('supertest');
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { typeDefs, resolvers } = require('../schema');
const { getDb } = require('../db');

jest.mock('../db');

let server;
let app;
let mockDb;

beforeAll(async () => {
  mockDb = {
    query: jest.fn()
  };
  getDb.mockReturnValue(mockDb);

  app = express();
  server = new ApolloServer({
    typeDefs,
    resolvers,
    context: () => ({ user: { id: 1, role: 'Admin' } })
  });
  await server.start();
  server.applyMiddleware({ app });
});

afterAll(async () => {
  await server.stop();
});

describe('GraphQL Queries', () => {
  it('fetches transactions with pagination', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ count: '5' }] }); // totalCount
    mockDb.query.mockResolvedValueOnce({
      rows: [
        { id: 1, amount: 100, category: 'Food', type: 'Expense', date: '2026-04-05' },
        { id: 2, amount: 200, category: 'Salary', type: 'Income', date: '2026-04-05' }
      ]
    });

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
    expect(response.body.data.transactions.transactions.length).toBe(2);
    expect(response.body.data.transactions.totalCount).toBe(5);
  });

  it('searches for transactions', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ count: '1' }] }); // totalCount
    mockDb.query.mockResolvedValueOnce({
      rows: [
        { id: 2, amount: 5000, category: 'Salary', type: 'Income', date: '2026-04-01', description: 'Monthly Salary' }
      ]
    });

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
    expect(transactions[0].category).toBe('Salary');
  });
});

describe('GraphQL Mutations', () => {
  it('performs soft delete', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [{ id: '10' }] }); // Insert returning id
    mockDb.query.mockResolvedValueOnce({ 
      rows: [{ id: 10, amount: 100, type: 'Expense', category: 'Test', date: '2026-04-05' }] 
    }); // Select after insert

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

    mockDb.query.mockResolvedValueOnce({ rowCount: 1 }); // Update delete_at

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
  });
});
