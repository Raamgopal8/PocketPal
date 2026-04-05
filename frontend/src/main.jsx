import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client/index.js'
import { setContext } from '@apollo/client/link/context/index.js'

const API_URI = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/_/backend/graphql' : 'http://localhost:4000/graphql');

const httpLink = createHttpLink({
  uri: API_URI,
})

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token')
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
})

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>,
)
