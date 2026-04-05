import React, { useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client/index.js'
import { GET_USERS, UPDATE_USER_STATUS } from '../graphql/queries'
import { UserCheck, UserX, ShieldCheck } from 'lucide-react'
import { gsap } from 'gsap'

const UserManagement = () => {
  const { loading, error, data } = useQuery(GET_USERS)
  const [updateStatus] = useMutation(UPDATE_USER_STATUS, {
    refetchQueries: [{ query: GET_USERS }]
  })

  useEffect(() => {
    if (!loading && data) {
      gsap.fromTo(".user-row", 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.05 }
      )
    }
  }, [loading, data])

  if (loading) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>
  if (error) return <div className="alert alert-danger">Error fetching users</div>

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold">User Management</h2>
        <p className="text-muted">Control access levels and manage system users.</p>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map(user => (
                  <tr key={user.id} className="user-row">
                    <td className="ps-4">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-light rounded-circle p-2 text-primary">
                          <ShieldCheck size={18} />
                        </div>
                        <span className="fw-medium">{user.username}</span>
                      </div>
                    </td>
                    <td><span className="badge bg-primary-subtle text-primary border border-primary-subtle">{user.role}</span></td>
                    <td>
                      <span className={`badge ${user.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="text-muted small">{new Date(parseInt(user.createdAt)).toLocaleDateString()}</td>
                    <td className="text-center">
                      <button 
                        className={`btn btn-sm ${user.status === 'Active' ? 'btn-outline-danger' : 'btn-outline-success'} d-flex align-items-center gap-1 mx-auto`}
                        onClick={() => updateStatus({ variables: { id: user.id, status: user.status === 'Active' ? 'Inactive' : 'Active' } })}
                      >
                        {user.status === 'Active' ? <UserX size={14} /> : <UserCheck size={14} />}
                        {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserManagement
