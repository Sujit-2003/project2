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
import { decryptSafe } from '../../services/encryptionService'
import { getCountryFromContact, getFlagUrl } from '../../utils/countryUtils'
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

const Users = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const {
    paginatedData,
    currentPage,
    totalPages,
    searchTerm,
    setCurrentPage,
    setSearchTerm,
  } = useTableControls(users, ['username', 'name', 'emailid', 'email', 'cnumber'])

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
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
      const adminId = getAdminId()
      const filtered = allUsers.filter((u) => u.id !== adminId)
      setUsers(filtered)
    } catch (err) {
      setError(err?.message || 'Failed to load users. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Users</strong>
            <CButton color="primary" size="sm" onClick={() => navigate('/users/register')}>
              <CIcon icon={cilPlus} className="me-1" />
              Register User
            </CButton>
          </CCardHeader>
          <CCardBody>
            <CFormInput
              type="text"
              placeholder="Search users..."
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
                        <CTableDataCell colSpan={8} className="text-center text-muted">
                          No users found.
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      paginatedData.map((user, index) => {
                        const country = getCountryFromContact(user.cnumber || user.contactNumber)
                        return (
                          <CTableRow key={user.id || index}>
                            <CTableDataCell>{(currentPage - 1) * 10 + index + 1}</CTableDataCell>
                            <CTableDataCell>
                              <CAvatar color="secondary" size="md">
                                <CIcon icon={cilUser} />
                              </CAvatar>
                            </CTableDataCell>
                            <CTableDataCell>{user.username || user.name || '-'}</CTableDataCell>
                            <CTableDataCell>{decryptSafe(user.emailid || user.email)}</CTableDataCell>
                            <CTableDataCell>{user.cdate || user.creationDate || '-'}</CTableDataCell>
                            <CTableDataCell>
                              {country ? (
                                <span className="d-flex align-items-center gap-1">
                                  <img
                                    src={getFlagUrl(country.code)}
                                    alt={country.name}
                                    width="24"
                                    height="16"
                                    style={{ objectFit: 'cover', borderRadius: '2px' }}
                                  />
                                  {country.name}
                                </span>
                              ) : (
                                user.countryid || user.country || '-'
                              )}
                            </CTableDataCell>
                            <CTableDataCell>{timeAgo(user.lastLogin || user.last_login)}</CTableDataCell>
                            <CTableDataCell>
                              <CButton
                                color="primary"
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/users/${user.id}`)}
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

export default Users
