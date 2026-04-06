require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const { typeDefs, resolvers } = require('./schema');
const { initializeDb } = require('./db');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const functions = require('firebase-functions');
const { onRequest } = require('firebase-functions/v2/https');

const SECRET = process.env.JWT_SECRET || 'fint3ch_s3cr3t';

const app = express();
app.set('trust proxy', true);
app.use(cors());

// Temporarily disabled to resolve IPv6/Proxy validation errors in Cloud Functions
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, 
//   max: 100, 
//   standardHeaders: true, 
//   legacyHeaders: false, 
//   keyGenerator: (req) => req.ip || req.get('X-Forwarded-For') || 'default',
//   message: 'Too many requests from this IP, please try again after 15 minutes',
// });

// App hosting / Firebase Functions might have different pathing
// app.use(['/graphql', '/api/graphql'], limiter);

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
  // Ensure we use the correct path for the middleware
  server.applyMiddleware({ app, path: '/graphql' });
  serverStarted = true;
}

// Specifically for Firebase Functions v2
// Explicitly set invoker: 'public' to ensure accessibility
const api_v2 = onRequest({ cors: true, invoker: 'public' }, async (req, res) => {
  await startApolloServer();
  return app(req, res);
});

// Locally
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  startApolloServer().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    });
  });
}

// Export the function name defined in firebase.json
// Migrated to api_v2 to resolve direct upgrade restriction
exports.api_v2 = api_v2;
