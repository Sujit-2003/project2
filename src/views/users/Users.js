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
import { addPatient } from '../../services/patientService'
import { getAdminId, getUmId } from '../../services/authService'

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
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    about: '',
    contactNumber: '',
    healthHistory: '',
    relationship: '',
  })

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      // API stores all registered users under role 1
      // Fetch role 1 users and filter out the admin
      const res = await getUsers(1)
      let allUsers = []
      if (Array.isArray(res)) {
        allUsers = res
      } else if (Number(res.code) === 0 && Array.isArray(res.data)) {
        allUsers = res.data
      } else if (Array.isArray(res.data)) {
        allUsers = res.data
      } else {
        setError(res.message || 'Failed to load users.')
        setLoading(false)
        return
      }
      // Filter out the logged-in admin from the list
      const adminId = getAdminId()
      const filtered = allUsers.filter((u) => u.id !== adminId)
      setUsers(filtered)
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
      const res = await registerUser({
        name: regForm.name,
        emailId: regForm.emailId,
        contactNumber: regForm.contactNumber,
        password: regForm.password,
      })
      if (Number(res.code) === 0) {
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

    if (!patForm.firstName || !patForm.lastName || !patForm.dob || !patForm.gender || !patForm.contactNumber || !patForm.relationship) {
      setPatError('Please fill all required fields.')
      return
    }

    setPatSubmitting(true)
    try {
      const res = await addPatient({
        first_name: patForm.firstName,
        last_name: patForm.lastName,
        dob: patForm.dob + ' 00:00:00',
        gender: patForm.gender,
        about: patForm.about,
        contact_numb: patForm.contactNumber,
        contact_number: patForm.contactNumber,
        health_history: patForm.healthHistory,
        relationship: patForm.relationship,
        um_id: getUmId(),
      })
      if (Number(res.code) === 0) {
        setPatSuccess(res.message || 'Patient added successfully!')
        setPatForm({ firstName: '', lastName: '', dob: '', gender: '', about: '', contactNumber: '', healthHistory: '', relationship: '' })
        setTimeout(() => {
          setPatientVisible(false)
          setPatSuccess('')
          loadUsers()
        }, 1500)
      } else {
        setPatError(res.message || 'Failed to add patient.')
      }
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
                    <CTableHeaderCell>Email</CTableHeaderCell>
                    <CTableHeaderCell>Contact</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Created</CTableHeaderCell>
                    <CTableHeaderCell>Details</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {users.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="text-center text-muted">
                        No users found.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    users.map((user, index) => (
                      <CTableRow key={user.id || index}>
                        <CTableDataCell>{index + 1}</CTableDataCell>
                        <CTableDataCell>{user.username || user.name || '-'}</CTableDataCell>
                        <CTableDataCell>{user.emailid || user.email || '-'}</CTableDataCell>
                        <CTableDataCell>{user.cnumber || user.contactNumber || '-'}</CTableDataCell>
                        <CTableDataCell>{user.ustatus || user.status || '-'}</CTableDataCell>
                        <CTableDataCell>{user.cdate || user.creationDate || '-'}</CTableDataCell>
                        <CTableDataCell>
                          <CIcon
                            icon={cilSearch}
                            className="text-primary"
                            style={{ cursor: 'pointer' }}
                          />
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
      <CModal size="lg" visible={patientVisible} onClose={() => setPatientVisible(false)}>
        <CModalHeader>
          <CModalTitle>Add Patient</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleAddPatient}>
          <CModalBody>
            {patError && <CAlert color="danger">{patError}</CAlert>}
            {patSuccess && <CAlert color="success">{patSuccess}</CAlert>}
            <CRow>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel>First Name *</CFormLabel>
                  <CFormInput
                    name="firstName"
                    value={patForm.firstName}
                    onChange={handlePatChange}
                    required
                  />
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel>Last Name *</CFormLabel>
                  <CFormInput
                    name="lastName"
                    value={patForm.lastName}
                    onChange={handlePatChange}
                    required
                  />
                </div>
              </CCol>
            </CRow>
            <CRow>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel>Date of Birth *</CFormLabel>
                  <CFormInput
                    type="date"
                    name="dob"
                    value={patForm.dob}
                    onChange={handlePatChange}
                    required
                  />
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel>Gender *</CFormLabel>
                  <select
                    className="form-select"
                    name="gender"
                    value={patForm.gender}
                    onChange={handlePatChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </CCol>
            </CRow>
            <CRow>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel>Contact Number *</CFormLabel>
                  <CFormInput
                    name="contactNumber"
                    value={patForm.contactNumber}
                    onChange={handlePatChange}
                    required
                  />
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel>Relationship *</CFormLabel>
                  <CFormInput
                    name="relationship"
                    value={patForm.relationship}
                    onChange={handlePatChange}
                    placeholder="e.g. Parent, Guardian"
                    required
                  />
                </div>
              </CCol>
            </CRow>
            <div className="mb-3">
              <CFormLabel>About</CFormLabel>
              <textarea
                className="form-control"
                name="about"
                rows={2}
                value={patForm.about}
                onChange={handlePatChange}
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Health History</CFormLabel>
              <textarea
                className="form-control"
                name="healthHistory"
                rows={2}
                value={patForm.healthHistory}
                onChange={handlePatChange}
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
