const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const { typeDefs, resolvers } = require('./schema');
const { initializeDb } = require('./db');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'fint3ch_s3cr3t';

const app = express();
app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true, 
  legacyHeaders: false, 
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

app.use(['/graphql', '/_/backend/graphql'], limiter);

// Rewriting for Vercel experimentalServices routing
app.use((req, res, next) => {
  if (req.url.startsWith('/_/backend')) {
    req.url = req.url.replace('/_/backend', '');
  }
  next();
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.headers.authorization || '';
    if (token) {
      try {
        const user = jwt.verify(token.replace('Bearer ', ''), SECRET);
        return { user };
      } catch (err) {
        console.error('Invalid token');
      }
    }
    return { user: null };
  }
});

let serverStarted = false;

async function startApolloServer() {
  if (serverStarted) return;
  await initializeDb();
  await server.start();
  server.applyMiddleware({ app });
  serverStarted = true;
}

// Handler for Vercel
const handler = async (req, res) => {
  await startApolloServer();
  return app(req, res);
};

// Locally
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  startApolloServer().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    });
  });
}

module.exports = handler;
