import React, { useEffect, useRef } from 'react'
import { useQuery, useMutation } from '@apollo/client/index.js'
import { GET_TRANSACTIONS, DELETE_TRANSACTION, GET_DASHBOARD_SUMMARY, CREATE_TRANSACTION, UPDATE_TRANSACTION } from '../graphql/queries'
import { Trash2, Plus, Filter, X, Pencil } from 'lucide-react'
import { gsap } from 'gsap'

const Transactions = ({ role }) => {
  const [search, setSearch] = React.useState('')
  const [page, setPage] = React.useState(1)
  const limit = 10

  const { loading, error, data, refetch } = useQuery(GET_TRANSACTIONS, {
    variables: { search, page, limit }
  })
  const [deleteTransaction] = useMutation(DELETE_TRANSACTION, {
    onCompleted: () => refetch()
  })
  const [createTransaction] = useMutation(CREATE_TRANSACTION, {
    onCompleted: () => refetch()
  })
  const [updateTransaction] = useMutation(UPDATE_TRANSACTION, {
    onCompleted: () => refetch()
  })
  
  const [showModal, setShowModal] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [editId, setEditId] = React.useState(null)
  const [formData, setFormData] = React.useState({
    amount: '',
    type: 'Expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  })
  
  const tableRef = useRef(null)

  useEffect(() => {
    if (!loading && data) {
      gsap.fromTo("tbody tr", 
        { x: -20, opacity: 0 }, 
        { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'back.out(1.7)' }
      )
    }
  }, [loading, data])

  const handleOpenAdd = () => {
    setIsEditing(false)
    setEditId(null)
    setFormData({
      amount: '',
      type: 'Expense',
      category: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    })
    setShowModal(true)
  }

  const handleEdit = (t) => {
    setIsEditing(true)
    setEditId(t.id)
    setFormData({
      amount: t.amount.toString(),
      type: t.type,
      category: t.category,
      date: t.date,
      description: t.description || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (isEditing) {
        await updateTransaction({
          variables: {
            id: editId,
            ...formData,
            amount: parseFloat(formData.amount)
          }
        })
      } else {
        await createTransaction({
          variables: {
            ...formData,
            amount: parseFloat(formData.amount)
          }
        })
      }
      setShowModal(false)
      setIsEditing(false)
      setEditId(null)
      setFormData({
        amount: '',
        type: 'Expense',
        category: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      })
    } catch (err) {
      console.error("Error creating transaction:", err)
    }
  }

  if (loading) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>
  if (error) return <div className="alert alert-danger">Error fetching transactions</div>

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">Transactions</h2>
          <p className="text-muted">Manage and track all your financial entries.</p>
        </div>
        {role === 'Admin' && (
          <button 
            className="btn btn-primary d-flex align-items-center gap-2 shadow-sm py-2 px-3"
            onClick={handleOpenAdd}
          >
            <Plus size={18} /> Add Entry
          </button>
        )}
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-0 py-3 px-4 d-flex justify-content-between align-items-center">
          <div className="d-flex gap-3">
            <div className="input-group input-group-sm" style={{width: 300}}>
              <span className="input-group-text bg-light border-0"><Filter size={14} /></span>
              <input 
                type="text" 
                className="form-control bg-light border-0" 
                placeholder="Search description or category..." 
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                  setPage(1) // Reset to first page on search
                }}
              />
            </div>
          </div>
          <span className="badge bg-primary-subtle text-primary">{data?.transactions?.totalCount || 0} Total</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" ref={tableRef}>
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th className="text-end">Amount</th>
                  {role === 'Admin' && <th className="text-center">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {data.transactions.transactions.map(t => (
                  <tr key={t.id}>
                    <td className="ps-4 text-muted">{t.date}</td>
                    <td><span className="badge bg-light text-dark border">{t.category}</span></td>
                    <td>{t.description}</td>
                    <td>
                      <span className={`small fw-bold ${t.type === 'Income' ? 'text-success' : 'text-danger'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="text-end fw-bold">${t.amount}</td>
                    {role === 'Admin' && (
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <button 
                            className="btn btn-link link-primary p-1" 
                            onClick={() => handleEdit(t)}
                            title="Edit Entry"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            className="btn btn-link link-danger p-1" 
                            onClick={() => deleteTransaction({ variables: { id: t.id } })}
                            title="Delete Entry"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer bg-white border-0 py-3 px-4 d-flex justify-content-between align-items-center">
          <div className="small text-muted">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data.transactions.totalCount)} of {data.transactions.totalCount} entries
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-sm btn-outline-secondary px-3" 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <button 
              className="btn btn-sm btn-outline-primary px-3" 
              disabled={!data.transactions.hasMore}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 bg-light">
                <h5 className="modal-title fw-bold">{isEditing ? 'Edit Entry' : 'Add New Entry'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Amount</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input 
                          type="number" 
                          step="0.01" 
                          className="form-control" 
                          required 
                          value={formData.amount}
                          onChange={e => setFormData({...formData, amount: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Type</label>
                      <select 
                        className="form-select" 
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value})}
                      >
                        <option value="Expense">Expense</option>
                        <option value="Income">Income</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold">Category</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="e.g. Rent, Salary, Food" 
                        required 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold">Date</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        required 
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold">Description</label>
                      <textarea 
                        className="form-control" 
                        rows="2"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 bg-light p-3">
                  <button type="button" className="btn btn-link text-muted text-decoration-none" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 shadow-sm">
                    {isEditing ? 'Update Transaction' : 'Save Transaction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transactions
