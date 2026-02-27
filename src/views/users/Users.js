import React, { useEffect, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormLabel,
  CSpinner,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus } from '@coreui/icons'
import { getUsers, registerUser } from '../../services/userService'

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [form, setForm] = useState({
    name: '',
    emailId: '',
    contactNumber: '',
    password: '',
    confirmPassword: '',
  })

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getUsers(2)
      if (res.code === 0) {
        setUsers(Array.isArray(res.data) ? res.data : [])
      } else {
        setError(res.message || 'Failed to load users.')
      }
    } catch {
      setError('Network error loading users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')

    if (!form.name || !form.emailId || !form.contactNumber || !form.password) {
      setFormError('All fields are required.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setFormError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const res = await registerUser({
        username: form.name,
        emailid: form.emailId,
        upassword: form.password,
        cnumber: form.contactNumber,
      })
      if (res.code === 0) {
        setFormSuccess(res.message || 'User registered successfully!')
        setForm({ name: '', emailId: '', contactNumber: '', password: '', confirmPassword: '' })
        setTimeout(() => {
          setModalVisible(false)
          setFormSuccess('')
          loadUsers()
        }, 1500)
      } else {
        setFormError(res.message || 'Registration failed.')
      }
    } catch {
      setFormError('Network error during registration.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Users</strong>
            <CButton color="primary" size="sm" onClick={() => setModalVisible(true)}>
              <CIcon icon={cilPlus} className="me-1" />
              Register User
            </CButton>
          </CCardHeader>
          <CCardBody>
            {loading && (
              <div className="text-center py-4">
                <CSpinner color="primary" />
              </div>
            )}
            {error && <CAlert color="danger">{error}</CAlert>}
            {!loading && !error && (
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>#</CTableHeaderCell>
                    <CTableHeaderCell>Name</CTableHeaderCell>
                    <CTableHeaderCell>Email</CTableHeaderCell>
                    <CTableHeaderCell>Contact</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Created</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {users.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={6} className="text-center text-muted">
                        No users found.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    users.map((user, index) => (
                      <CTableRow key={user.id || index}>
                        <CTableDataCell>{index + 1}</CTableDataCell>
                        <CTableDataCell>{user.username}</CTableDataCell>
                        <CTableDataCell>{user.emailid}</CTableDataCell>
                        <CTableDataCell>{user.cnumber}</CTableDataCell>
                        <CTableDataCell>{user.ustatus}</CTableDataCell>
                        <CTableDataCell>{user.cdate}</CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>
            )}
          </CCardBody>
        </CCard>
      </CCol>

      <CModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <CModalHeader>
          <CModalTitle>Register User</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleRegister}>
          <CModalBody>
            {formError && <CAlert color="danger">{formError}</CAlert>}
            {formSuccess && <CAlert color="success">{formSuccess}</CAlert>}
            <div className="mb-3">
              <CFormLabel>Name</CFormLabel>
              <CFormInput name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <CFormLabel>Email</CFormLabel>
              <CFormInput
                type="email"
                name="emailId"
                value={form.emailId}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Contact Number</CFormLabel>
              <CFormInput
                name="contactNumber"
                value={form.contactNumber}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Password</CFormLabel>
              <CFormInput
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Confirm Password</CFormLabel>
              <CFormInput
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setModalVisible(false)}>
              Cancel
            </CButton>
            <CButton color="primary" type="submit" disabled={submitting}>
              {submitting ? <CSpinner size="sm" /> : 'Register'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </CRow>
  )
}

export default Users
