import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  CSpinner,
  CAlert,
  CAvatar,
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPeople, cilUser, cilPlus, cilChildFriendly } from '@coreui/icons'
import { getRoleId, getUmId, getAdminId } from '../../services/authService'
import { getUsers } from '../../services/userService'
import { getPatients, getAllPatientsWithParent } from '../../services/patientService'
import { decryptField, decryptSafe } from '../../services/encryptionService'
import { getCountries } from '../../services/countryService'
import { formatPatientContact } from '../../utils/countryUtils'

function calculateAge(dob) {
  if (!dob) return ''
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const StatCard = ({ icon, color, label, count }) => (
  <CCard className="mb-3 border-0 shadow-sm">
    <CCardBody className="d-flex align-items-center gap-3 py-4">
      <div
        className={`rounded-circle d-flex align-items-center justify-content-center bg-${color} bg-opacity-10`}
        style={{ width: 56, height: 56 }}
      >
        <CIcon icon={icon} height={28} className={`text-${color}`} />
      </div>
      <div>
        <div className="fs-3 fw-bold">{count}</div>
        <div className="text-body-secondary small text-uppercase fw-semibold">{label}</div>
      </div>
    </CCardBody>
  </CCard>
)

const Dashboard = () => {
  const navigate = useNavigate()
  const roleId = getRoleId()
  const isAdmin = roleId === 2

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Admin state
  const [users, setUsers] = useState([])
  const [allPatients, setAllPatients] = useState([])

  // Parent state
  const [patients, setPatients] = useState([])
  const [countries, setCountries] = useState([])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')
      try {
        const countryData = await getCountries()
        setCountries(countryData)

        if (isAdmin) {
          const userRes = await getUsers(1)

          let allUsers = []
          if (Array.isArray(userRes)) allUsers = userRes
          else if (Array.isArray(userRes.data)) allUsers = userRes.data

          const adminId = getAdminId()
          const filtered = allUsers.filter((u) => u.id !== adminId)
          setUsers(filtered)

          const pts = await getAllPatientsWithParent(filtered)
          setAllPatients(pts)
        } else {
          const umId = getUmId()
          const res = await getPatients(umId)
          if (Number(res.code) === 0) {
            setPatients(Array.isArray(res.data) ? res.data : [])
          } else {
            setError(res.message || 'Failed to load patients.')
          }
        }
      } catch (err) {
        setError(err?.message || 'Failed to load data.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [isAdmin])

  const renderContact = (contact, countryId) => {
    const countryObj = countries.find((c) => Number(c.country_id) === Number(countryId))
    const { display } = formatPatientContact(contact, countryObj)
    return display
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  if (error) {
    return <CAlert color="danger">{error}</CAlert>
  }

  // ─── Admin Dashboard ───
  if (isAdmin) {
    return (
      <>
        <CRow className="mb-4" xs={{ gutter: 4 }}>
          <CCol sm={6} lg={4}>
            <StatCard icon={cilPeople} color="primary" label="Users" count={users.length} />
          </CCol>
          <CCol sm={6} lg={4}>
            <StatCard icon={cilUser} color="warning" label="Parents" count={users.length} />
          </CCol>
          <CCol sm={6} lg={4}>
            <StatCard icon={cilChildFriendly} color="success" label="Patients" count={allPatients.length} />
          </CCol>
        </CRow>

        <CCard className="mb-4">
          <CCardHeader>
            <strong>Recent Users</strong>
          </CCardHeader>
          <CCardBody>
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>Photo</CTableHeaderCell>
                  <CTableHeaderCell>Username</CTableHeaderCell>
                  <CTableHeaderCell>Email ID</CTableHeaderCell>
                  <CTableHeaderCell>Register Date</CTableHeaderCell>
                  <CTableHeaderCell>Country</CTableHeaderCell>
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
                  users.slice(0, 5).map((user, index) => (
                    <CTableRow key={user.id || index}>
                      <CTableDataCell>{index + 1}</CTableDataCell>
                      <CTableDataCell>
                        <CAvatar color="secondary" size="md">
                          <CIcon icon={cilUser} />
                        </CAvatar>
                      </CTableDataCell>
                      <CTableDataCell>
                        {decryptField(user.username || user.name)}
                      </CTableDataCell>
                      <CTableDataCell>
                        {decryptSafe(user.emailid || user.email)}
                      </CTableDataCell>
                      <CTableDataCell>
                        {user.cdate || user.creationDate || '-'}
                      </CTableDataCell>
                      <CTableDataCell>
                        {user.countryid || user.country || '-'}
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>

        {allPatients.length > 0 && (
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Recent Patients</strong>
            </CCardHeader>
            <CCardBody>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>#</CTableHeaderCell>
                    <CTableHeaderCell>Name</CTableHeaderCell>
                    <CTableHeaderCell>Parent</CTableHeaderCell>
                    <CTableHeaderCell>Relationship</CTableHeaderCell>
                    <CTableHeaderCell>Age</CTableHeaderCell>
                    <CTableHeaderCell>Gender</CTableHeaderCell>
                    <CTableHeaderCell>Contact</CTableHeaderCell>
                    <CTableHeaderCell>Details</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {allPatients.slice(0, 5).map((p, index) => {
                    const contact = p.contact_number || p.contact_numb || ''
                    const parentName = decryptField(p._parent?.username || p._parent?.name || '')
                    return (
                      <CTableRow key={p.id || index}>
                        <CTableDataCell>{index + 1}</CTableDataCell>
                        <CTableDataCell>
                          {p.patient_fname} {p.patient_lname}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CButton
                            color="link"
                            size="sm"
                            className="p-0 text-decoration-none"
                            onClick={() => navigate(`/users/${p.um_id}`)}
                          >
                            {parentName || '-'}
                          </CButton>
                        </CTableDataCell>
                        <CTableDataCell>{p.p_relationship}</CTableDataCell>
                        <CTableDataCell>{calculateAge(p.p_dob)}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={p.user_gender === 'Male' ? 'info' : 'warning'}>
                            {p.user_gender}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>{renderContact(contact, p.country_id)}</CTableDataCell>
                        <CTableDataCell>
                          <CButton
                            color="primary"
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/patients/${p.id}`)}
                            title="View Details"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        )}
      </>
    )
  }

  // ─── Parent Dashboard ───
  return (
    <>
      <CRow className="mb-4" xs={{ gutter: 4 }}>
        <CCol sm={6} lg={4}>
          <StatCard icon={cilChildFriendly} color="primary" label="Patients" count={patients.length} />
        </CCol>
      </CRow>

      <CCard className="mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>My Patients</strong>
          <CButton color="primary" size="sm" onClick={() => navigate('/patients/add')}>
            <CIcon icon={cilPlus} className="me-1" />
            Add Patient
          </CButton>
        </CCardHeader>
        <CCardBody>
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Name</CTableHeaderCell>
                <CTableHeaderCell>Relationship</CTableHeaderCell>
                <CTableHeaderCell>DOB</CTableHeaderCell>
                <CTableHeaderCell>Age</CTableHeaderCell>
                <CTableHeaderCell>Gender</CTableHeaderCell>
                <CTableHeaderCell>Contact</CTableHeaderCell>
                <CTableHeaderCell>Details</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {patients.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={8} className="text-center text-muted">
                    No patients found.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                patients.map((p, index) => {
                  const contact = p.contact_number || p.contact_numb || ''
                  return (
                    <CTableRow key={p.id || index}>
                      <CTableDataCell>{index + 1}</CTableDataCell>
                      <CTableDataCell>
                        {p.patient_fname} {p.patient_lname}
                      </CTableDataCell>
                      <CTableDataCell>{p.p_relationship}</CTableDataCell>
                      <CTableDataCell>{p.p_dob?.split(' ')[0]}</CTableDataCell>
                      <CTableDataCell>{calculateAge(p.p_dob)}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={p.user_gender === 'Male' ? 'info' : 'warning'}>
                          {p.user_gender}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>{renderContact(contact, p.country_id)}</CTableDataCell>
                      <CTableDataCell>
                        <CButton
                          color="primary"
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/patients/${p.id}`)}
                          title="View Details"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </>
  )
}

export default Dashboard
