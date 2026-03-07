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
  CFormInput,
  CPagination,
  CPaginationItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilUser } from '@coreui/icons'
import { getUsers } from '../../services/userService'
import { getAdminId } from '../../services/authService'
import { decryptSafe, decryptField } from '../../services/encryptionService'
import { getCountryFromContact } from '../../utils/countryUtils'
import useTableControls from '../../hooks/useTableControls'

function timeAgo(dateStr) {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'N/A'
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

const Doctors = () => {
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const {
    paginatedData,
    currentPage,
    totalPages,
    searchTerm,
    setCurrentPage,
    setSearchTerm,
  } = useTableControls(doctors, ['username', 'name', 'emailid', 'email', 'cnumber'])

  const loadDoctors = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getUsers(3)
      let allDoctors = []
      if (Array.isArray(res)) {
        allDoctors = res
      } else if (Number(res.code) === 0 && Array.isArray(res.data)) {
        allDoctors = res.data
      } else if (Array.isArray(res.data)) {
        allDoctors = res.data
      } else {
        setError(res.message || 'Failed to load doctors.')
        setLoading(false)
        return
      }
      const adminId = getAdminId()
      const filtered = allDoctors.filter((u) => u.id !== adminId)
      setDoctors(filtered)
    } catch (err) {
      setError(err?.message || 'Failed to load doctors. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDoctors()
  }, [])

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Doctors</strong>
            <CButton color="primary" size="sm" onClick={() => navigate('/doctors/add')}>
              <CIcon icon={cilPlus} className="me-1" />
              Add Doctor
            </CButton>
          </CCardHeader>
          <CCardBody>
            <CFormInput
              type="text"
              placeholder="Search doctors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-3"
              style={{ maxWidth: '300px' }}
            />

            {loading && (
              <div className="suji-loading">
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
                      <CTableHeaderCell>Photo</CTableHeaderCell>
                      <CTableHeaderCell>Username</CTableHeaderCell>
                      <CTableHeaderCell>Email ID</CTableHeaderCell>
                      <CTableHeaderCell>Register Date</CTableHeaderCell>
                      <CTableHeaderCell>Country</CTableHeaderCell>
                      <CTableHeaderCell>Activity</CTableHeaderCell>
                      <CTableHeaderCell>Details</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {paginatedData.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={8} className="text-center">
                          <div className="suji-empty-state">No doctors found.</div>
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      paginatedData.map((doctor, index) => {
                        const decryptedCnumber = decryptField(doctor.cnumber || doctor.contactNumber)
                        const country = getCountryFromContact(decryptedCnumber)
                        return (
                          <CTableRow key={doctor.id || index}>
                            <CTableDataCell>{(currentPage - 1) * 10 + index + 1}</CTableDataCell>
                            <CTableDataCell>
                              <CAvatar color="secondary" size="md">
                                <CIcon icon={cilUser} />
                              </CAvatar>
                            </CTableDataCell>
                            <CTableDataCell className="fw-semibold">{decryptField(doctor.username || doctor.name)}</CTableDataCell>
                            <CTableDataCell>{decryptSafe(doctor.emailid || doctor.email)}</CTableDataCell>
                            <CTableDataCell>{doctor.cdate || doctor.creationDate || '-'}</CTableDataCell>
                            <CTableDataCell>
                              {country?.name || doctor.countryid || doctor.country || '-'}
                            </CTableDataCell>
                            <CTableDataCell>{timeAgo(doctor.lastLogin || doctor.last_login)}</CTableDataCell>
                            <CTableDataCell>
                              <CButton
                                color="primary"
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/doctors/${doctor.id}`)}
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
                  <CPagination className="justify-content-center mt-3">
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

export default Doctors
