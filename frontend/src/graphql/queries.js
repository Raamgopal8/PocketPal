import { gql } from '@apollo/client';

export const GET_DASHBOARD_SUMMARY = gql`
  query GetDashboardSummary {
    dashboardSummary {
      totalIncome
      totalExpenses
      netBalance
      recentTransactions {
        id
        amount
        type
        category
        date
        description
      }
      categoryBreakdown {
        category
        total
        type
      }
    }
  }
`;

export const GET_TRANSACTIONS = gql`
  query GetTransactions($type: String, $category: String, $startDate: String, $endDate: String, $search: String, $page: Int, $limit: Int) {
    transactions(type: $type, category: $category, startDate: $startDate, endDate: $endDate, search: $search, page: $page, limit: $limit) {
      transactions {
        id
        amount
        type
        category
        date
        description
      }
      totalCount
      page
      limit
      hasMore
    }
  }
`;

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      username
      role
      status
      createdAt
    }
  }
`;

export const CREATE_TRANSACTION = gql`
  mutation CreateTransaction($amount: Float!, $type: String!, $category: String!, $date: String!, $description: String) {
    createTransaction(amount: $amount, type: $type, category: $category, date: $date, description: $description) {
      id
      amount
    }
  }
`;

export const DELETE_TRANSACTION = gql`
  mutation DeleteTransaction($id: ID!) {
    deleteTransaction(id: $id)
  }
`;

export const UPDATE_TRANSACTION = gql`
  mutation UpdateTransaction($id: ID!, $amount: Float, $type: String, $category: String, $date: String, $description: String) {
    updateTransaction(id: $id, amount: $amount, type: $type, category: $category, date: $date, description: $description) {
      id
      amount
      type
      category
      date
      description
    }
  }
`;

export const UPDATE_USER_STATUS = gql`
  mutation UpdateUserStatus($id: ID!, $status: String!) {
    updateUserStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

export const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      user {
        id
        username
        role
        status
      }
    }
  }
`;
