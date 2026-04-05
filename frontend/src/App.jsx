import React, { useState, useEffect } from 'react'
import { useQuery } from '@apollo/client/index.js'
import { GET_DASHBOARD_SUMMARY } from './graphql/queries'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import UserManagement from './pages/UserManagement'
import Login from './pages/Login'
import { Settings, LogOut, User as UserIcon } from 'lucide-react'

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  const { loading, data, client } = useQuery(GET_DASHBOARD_SUMMARY, {
    skip: !localStorage.getItem('token'),
    onCompleted: (data) => {
    }
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setAuthChecked(true)
    } else {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser(payload)
      } catch (e) {
        localStorage.removeItem('token')
      }
      setAuthChecked(true)
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setActivePage('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    client.clearStore()
  }

  if (!authChecked) return null

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />
      case 'transactions': return (user.role === 'Admin' || user.role === 'Analyst') ? <Transactions role={user.role} /> : <Dashboard />
      case 'users': return user.role === 'Admin' ? <UserManagement /> : <Dashboard />
      default: return <Dashboard />
    }
  }

  return (
    <div className="d-flex bg-light min-vh-100">
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        user={user} 
      />
      
      <main className="content flex-grow-1 p-4">
        {/* Top Header */}
        <div className="d-flex justify-content-end mb-4 gap-3 align-items-center bg-white p-3 rounded-4 shadow-sm border-0">
          <div className="d-flex align-items-center gap-2 pe-3 border-end">
            <div className="bg-primary-subtle p-2 rounded-circle">
              <UserIcon size={18} className="text-primary" />
            </div>
            <div>
              <p className="mb-0 small fw-bold">{user.username}</p>
              <p className="mb-0 text-muted" style={{fontSize: '10px'}}>{user.role}</p>
            </div>
          </div>
          
          <button 
            className="btn btn-light btn-sm rounded-circle p-2 border-0 bg-transparent text-danger hover-bg-danger-subtle"
            title="Logout"
            onClick={handleLogout}
          >
            <LogOut size={18} />
          </button>
        </div>

        <div className="fade-in">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}

export default App
