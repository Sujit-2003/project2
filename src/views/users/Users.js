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
import { cilPlus, cilSearch } from '@coreui/icons'
import { getUsers, registerUser } from '../../services/userService'

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Register User modal
  const [registerVisible, setRegisterVisible] = useState(false)
  const [regSubmitting, setRegSubmitting] = useState(false)
  const [regError, setRegError] = useState('')
  const [regSuccess, setRegSuccess] = useState('')
  const [regForm, setRegForm] = useState({
    name: '',
    emailId: '',
    contactNumber: '',
    password: '',
    confirmPassword: '',
  })

  // Add Patient modal
  const [patientVisible, setPatientVisible] = useState(false)
  const [patSubmitting, setPatSubmitting] = useState(false)
  const [patError, setPatError] = useState('')
  const [patSuccess, setPatSuccess] = useState('')
  const [patForm, setPatForm] = useState({
    parentName: '',
    patientName: '',
    patientAge: '',
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

  const handleRegChange = (e) => {
    setRegForm({ ...regForm, [e.target.name]: e.target.value })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setRegError('')
    setRegSuccess('')

    if (!regForm.name || !regForm.emailId || !regForm.contactNumber || !regForm.password) {
      setRegError('All fields are required.')
      return
    }
    if (regForm.password !== regForm.confirmPassword) {
      setRegError('Passwords do not match.')
      return
    }

    setRegSubmitting(true)
    try {
      const adminId = Number(sessionStorage.getItem('adminId'))
      const res = await registerUser({
        name: regForm.name,
        emailId: regForm.emailId,
        contactNumber: regForm.contactNumber,
        password: regForm.password,
        createdby: adminId,
      })
      if (res.code === 0) {
        setRegSuccess(res.message || 'User registered successfully!')
        setRegForm({ name: '', emailId: '', contactNumber: '', password: '', confirmPassword: '' })
        setTimeout(() => {
          setRegisterVisible(false)
          setRegSuccess('')
          loadUsers()
        }, 1500)
      } else {
        setRegError(res.message || 'Registration failed.')
      }
    } catch {
      setRegError('Network error during registration.')
    } finally {
      setRegSubmitting(false)
    }
  }

  const handlePatChange = (e) => {
    setPatForm({ ...patForm, [e.target.name]: e.target.value })
  }

  const handleAddPatient = async (e) => {
    e.preventDefault()
    setPatError('')
    setPatSuccess('')

    if (!patForm.parentName || !patForm.patientName || !patForm.patientAge) {
      setPatError('All fields are required.')
      return
    }

    setPatSubmitting(true)
    try {
      // Placeholder: POST to add-patient API when backend is ready
      setPatSuccess('Patient added successfully!')
      setPatForm({ parentName: '', patientName: '', patientAge: '' })
      setTimeout(() => {
        setPatientVisible(false)
        setPatSuccess('')
        loadUsers()
      }, 1500)
    } catch {
      setPatError('Network error adding patient.')
    } finally {
      setPatSubmitting(false)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Users</strong>
            <div className="d-flex gap-2">
              <CButton color="primary" size="sm" onClick={() => setRegisterVisible(true)}>
                <CIcon icon={cilPlus} className="me-1" />
                Register User
              </CButton>
              <CButton color="success" size="sm" onClick={() => setPatientVisible(true)}>
                <CIcon icon={cilPlus} className="me-1" />
                Add Patient
              </CButton>
            </div>
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
                    <CTableHeaderCell>Parent Name</CTableHeaderCell>
                    <CTableHeaderCell>Patient Name</CTableHeaderCell>
                    <CTableHeaderCell>Patient Age</CTableHeaderCell>
                    <CTableHeaderCell>Details</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {users.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={5} className="text-center text-muted">
                        No users found.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    users.map((user, index) => (
                      <CTableRow key={user.id || index}>
                        <CTableDataCell>{index + 1}</CTableDataCell>
                        <CTableDataCell>{user.username}</CTableDataCell>
                        <CTableDataCell>{user.patient_name || '-'}</CTableDataCell>
                        <CTableDataCell>{user.patient_age || '-'}</CTableDataCell>
                        <CTableDataCell>
                          <CIcon icon={cilSearch} className="text-primary" style={{ cursor: 'pointer' }} />
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>
            )}
          </CCardBody>
        </CCard>
      </CCol>

      {/* Register User Modal */}
      <CModal visible={registerVisible} onClose={() => setRegisterVisible(false)}>
        <CModalHeader>
          <CModalTitle>Register User</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleRegister}>
          <CModalBody>
            {regError && <CAlert color="danger">{regError}</CAlert>}
            {regSuccess && <CAlert color="success">{regSuccess}</CAlert>}
            <div className="mb-3">
              <CFormLabel>Name</CFormLabel>
              <CFormInput name="name" value={regForm.name} onChange={handleRegChange} required />
            </div>
            <div className="mb-3">
              <CFormLabel>Email</CFormLabel>
              <CFormInput
                type="email"
                name="emailId"
                value={regForm.emailId}
                onChange={handleRegChange}
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Contact Number</CFormLabel>
              <CFormInput
                name="contactNumber"
                value={regForm.contactNumber}
                onChange={handleRegChange}
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Password</CFormLabel>
              <CFormInput
                type="password"
                name="password"
                value={regForm.password}
                onChange={handleRegChange}
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Confirm Password</CFormLabel>
              <CFormInput
                type="password"
                name="confirmPassword"
                value={regForm.confirmPassword}
                onChange={handleRegChange}
                required
              />
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setRegisterVisible(false)}>
              Cancel
            </CButton>
            <CButton color="primary" type="submit" disabled={regSubmitting}>
              {regSubmitting ? <CSpinner size="sm" /> : 'Register'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      {/* Add Patient Modal */}
      <CModal visible={patientVisible} onClose={() => setPatientVisible(false)}>
        <CModalHeader>
          <CModalTitle>Add Patient</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleAddPatient}>
          <CModalBody>
            {patError && <CAlert color="danger">{patError}</CAlert>}
            {patSuccess && <CAlert color="success">{patSuccess}</CAlert>}
            <div className="mb-3">
              <CFormLabel>Parent Name</CFormLabel>
              <CFormInput
                name="parentName"
                value={patForm.parentName}
                onChange={handlePatChange}
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Patient Name</CFormLabel>
              <CFormInput
                name="patientName"
                value={patForm.patientName}
                onChange={handlePatChange}
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Patient Age</CFormLabel>
              <CFormInput
                type="number"
                name="patientAge"
                value={patForm.patientAge}
                onChange={handlePatChange}
                required
              />
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setPatientVisible(false)}>
              Cancel
            </CButton>
            <CButton color="success" type="submit" disabled={patSubmitting}>
              {patSubmitting ? <CSpinner size="sm" /> : 'Save'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </CRow>
  )
}

export default Users
