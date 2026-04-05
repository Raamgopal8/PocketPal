import React, { useEffect, useRef } from 'react'
import { LayoutDashboard, ReceiptText, Users, LogOut } from 'lucide-react'
import { gsap } from 'gsap'

const Sidebar = ({ activePage, setActivePage, user }) => {
  const sidebarRef = useRef(null)
  const role = user?.role || 'Viewer'
  const username = user?.username || 'User'

  useEffect(() => {
    gsap.fromTo(sidebarRef.current, 
      { x: -100, opacity: 0 }, 
      { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    )
  }, [])

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['Admin', 'Analyst', 'Viewer'] },
    { id: 'transactions', label: 'Transactions', icon: <ReceiptText size={20} />, roles: ['Admin', 'Analyst'] },
    { id: 'users', label: 'User Management', icon: <Users size={20} />, roles: ['Admin'] },
  ]

  const filteredNav = navItems.filter(item => item.roles.includes(role))

  return (
    <div className="sidebar shadow-sm d-flex flex-column" ref={sidebarRef}>
      <div className="p-4 mb-4">
        <h4 className="text-primary fw-bold">FinDashboard</h4>
      </div>
      
      <nav className="flex-grow-1">
        {filteredNav.map(item => (
          <a
            key={item.id}
            href="#"
            className={`nav-link ${activePage === item.id ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setActivePage(item.id); }}
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </nav>

      <div className="p-4 mt-auto border-top">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-primary-subtle rounded-circle p-2 text-primary fw-bold" style={{width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            {username[0]?.toUpperCase()}
          </div>
          <div>
            <div className="small fw-bold">{username}</div>
            <div className="small text-muted">{role}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
