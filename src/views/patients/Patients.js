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
  CBadge,
  CFormInput,
  CPagination,
  CPaginationItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus } from '@coreui/icons'
import { getPatients, getAllPatientsWithParent } from '../../services/patientService'
import { getUsers } from '../../services/userService'
import { getRoleId, getUmId, getAdminId } from '../../services/authService'
import { decryptField, decryptSafe } from '../../services/encryptionService'
import { getCountries } from '../../services/countryService'
import { formatPatientContact } from '../../utils/countryUtils'
import useTableControls from '../../hooks/useTableControls'

function calculateAge(dob) {
  if (!dob) return ''
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const Patients = () => {
  const navigate = useNavigate()
  const roleId = getRoleId()
  const isAdmin = roleId === 2
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [countries, setCountries] = useState([])

  const {
    paginatedData,
    currentPage,
    totalPages,
    searchTerm,
    setCurrentPage,
    setSearchTerm,
  } = useTableControls(patients, ['patient_fname', 'patient_lname', 'p_relationship', 'contact_number', '_parentName'])

  useEffect(() => {
    const loadPatients = async () => {
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
          const pts = await getAllPatientsWithParent(filtered)
          const enriched = pts.map((p) => ({
            ...p,
            _parentName: decryptField(p._parent?.username || p._parent?.name || ''),
            _parentEmail: decryptSafe(p._parent?.emailid || p._parent?.email || ''),
          }))
          setPatients(enriched)
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
        setError(err?.message || 'Failed to load patients. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    loadPatients()
  }, [isAdmin])

  const renderContact = (contact, countryId) => {
    const countryObj = countries.find((c) => Number(c.country_id) === Number(countryId))
    const { display } = formatPatientContact(contact, countryObj)
    return display
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Patients</strong>
            {!isAdmin && (
              <CButton color="primary" size="sm" onClick={() => navigate('/patients/add')}>
                <CIcon icon={cilPlus} className="me-1" />
                Add Patient
              </CButton>
            )}
          </CCardHeader>
          <CCardBody>
            <CFormInput
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-3"
              style={{ maxWidth: '300px' }}
            />

            {loading && (
              <div className="text-center py-4">
                <CSpinner color="primary" />
              </div>
            )}
            {error && <CAlert color="danger">{error}</CAlert>}
            {!loading && !error && (
              <>
                <CTable hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>#</CTableHeaderCell>
                      <CTableHeaderCell>Name</CTableHeaderCell>
                      {isAdmin && <CTableHeaderCell>Parent</CTableHeaderCell>}
                      <CTableHeaderCell>Relationship</CTableHeaderCell>
                      <CTableHeaderCell>DOB</CTableHeaderCell>
                      <CTableHeaderCell>Age</CTableHeaderCell>
                      <CTableHeaderCell>Gender</CTableHeaderCell>
                      <CTableHeaderCell>Contact</CTableHeaderCell>
                      <CTableHeaderCell>Details</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {paginatedData.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={isAdmin ? 9 : 8} className="text-center text-muted">
                          No patients found.
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      paginatedData.map((p, index) => {
                        const contact = p.contact_number || p.contact_numb || ''
                        return (
                          <CTableRow key={p.id || index}>
                            <CTableDataCell>{(currentPage - 1) * 10 + index + 1}</CTableDataCell>
                            <CTableDataCell>
                              {p.patient_fname} {p.patient_lname}
                            </CTableDataCell>
                            {isAdmin && (
                              <CTableDataCell>
                                <CButton
                                  color="link"
                                  size="sm"
                                  className="p-0 text-decoration-none"
                                  onClick={() => navigate(`/users/${p.um_id}`)}
                                >
                                  {p._parentName || '-'}
                                </CButton>
                                <div className="small text-body-secondary">{p._parentEmail}</div>
                              </CTableDataCell>
                            )}
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

                {totalPages > 1 && (
                  <CPagination className="justify-content-center">
                    <CPaginationItem
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </CPaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <CPaginationItem
                        key={i + 1}
                        active={currentPage === i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </CPaginationItem>
                    ))}
                    <CPaginationItem
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </CPaginationItem>
                  </CPagination>
                )}
              </>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Patients
