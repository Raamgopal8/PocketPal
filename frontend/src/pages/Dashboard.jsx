import React, { useEffect, useRef } from 'react'
import { useQuery, useMutation } from '@apollo/client/index.js'
import { GET_TRANSACTIONS, DELETE_TRANSACTION, GET_DASHBOARD_SUMMARY } from '../graphql/queries'
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { gsap } from 'gsap'

const Dashboard = () => {
  const { loading, error, data } = useQuery(GET_DASHBOARD_SUMMARY)
  const cardsRef = useRef([])

  useEffect(() => {
    if (!loading && data) {
      gsap.fromTo(cardsRef.current, 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
      )
    }
  }, [loading, data])

  if (loading) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>
  if (error) return <div className="alert alert-danger">Error fetching dashboard data</div>

  const { dashboardSummary: summary } = data

  const stats = [
    { label: 'Total Income', value: `$${summary.totalIncome.toLocaleString()}`, icon: <TrendingUp className="text-success" />, color: 'bg-success-subtle' },
    { label: 'Total Expenses', value: `$${summary.totalExpenses.toLocaleString()}`, icon: <TrendingDown className="text-danger" />, color: 'bg-danger-subtle' },
    { label: 'Net Balance', value: `$${summary.netBalance.toLocaleString()}`, icon: <Wallet className="text-primary" />, color: 'bg-primary-subtle' },
  ]

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold">Overview</h2>
        <p className="text-muted">Welcome back! Here's what's happening with your finances.</p>
      </div>

      <div className="row g-4 mb-5">
        {stats.map((stat, i) => (
          <div key={i} className="col-md-4" ref={el => cardsRef.current[i] = el}>
            <div className="card stat-card h-100 shadow-sm border-0">
              <div className={`stat-icon ${stat.color}`}>
                {stat.icon}
              </div>
              <p className="text-muted mb-1">{stat.label}</p>
              <h3 className="fw-bold mb-0">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-8" ref={el => cardsRef.current[3] = el}>
          <div className="card shadow-sm h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Recent Transactions</h5>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th className="text-end">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentTransactions.map(t => (
                      <tr key={t.id}>
                        <td className="text-muted small">{t.date}</td>
                        <td><span className="badge bg-light text-dark border">{t.category}</span></td>
                        <td>{t.description}</td>
                        <td className={`text-end fw-bold ${t.type === 'Income' ? 'text-success' : 'text-danger'}`}>
                          {t.type === 'Income' ? '+' : '-'}${Math.abs(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4" ref={el => cardsRef.current[4] = el}>
          <div className="card shadow-sm h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Category Breakdown</h5>
              {summary.categoryBreakdown.map((cat, i) => (
                <div key={i} className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="small fw-medium">{cat.category}</span>
                    <span className="small text-muted">${cat.total}</span>
                  </div>
                  <div className="progress" style={{height: 6}}>
                    <div 
                      className={`progress-bar ${cat.type === 'Income' ? 'bg-success' : 'bg-primary'}`} 
                      role="progressbar" 
                      style={{width: `${(cat.total / summary.totalIncome) * 100}%`}}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
