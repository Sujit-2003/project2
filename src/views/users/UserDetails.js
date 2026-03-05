import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CSpinner,
  CAlert,
  CAvatar,
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilPlus, cilUser } from '@coreui/icons'
import { getUsers } from '../../services/userService'
import { decryptSafe, decryptField } from '../../services/encryptionService'
import { getCountryFromContact } from '../../utils/countryUtils'

const UserDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await getUsers(1)
        let users = []
        if (Array.isArray(res)) users = res
        else if (Array.isArray(res.data)) users = res.data

        const found = users.find((u) => String(u.id) === String(id))
        if (found) {
          setUser(found)
        } else {
          setError('User not found.')
        }
      } catch (err) {
        setError(err?.message || 'Failed to load user details. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [id])

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

  return (
    <CRow className="justify-content-center">
      <CCol lg={8}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>User Details</strong>
            <CButton color="light" size="sm" onClick={() => navigate('/users')}>
              <CIcon icon={cilArrowLeft} className="me-1" />
              Back to Users
            </CButton>
          </CCardHeader>
          <CCardBody>
            <div className="d-flex align-items-center mb-4">
              <CAvatar color="secondary" size="xl" className="me-3">
                <CIcon icon={cilUser} size="xl" />
              </CAvatar>
              <div>
                <h4 className="mb-1">{decryptField(user.username || user.name)}</h4>
                <span className="text-body-secondary">{decryptSafe(user.emailid || user.email)}</span>
              </div>
            </div>

            <CRow className="mb-3">
              <CCol sm={4} className="fw-semibold">Contact</CCol>
              <CCol sm={8}>{decryptField(user.cnumber || user.contactNumber)}</CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol sm={4} className="fw-semibold">Status</CCol>
              <CCol sm={8}>
                <CBadge color={user.ustatus === 'Active' ? 'success' : 'secondary'}>
                  {user.ustatus || user.status || '-'}
                </CBadge>
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol sm={4} className="fw-semibold">Register Date</CCol>
              <CCol sm={8}>{user.cdate || user.creationDate || '-'}</CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol sm={4} className="fw-semibold">Country</CCol>
              <CCol sm={8}>
                {(() => {
                  const country = getCountryFromContact(decryptField(user.cnumber || user.contactNumber))
                  return country?.name || user.countryid || user.country || '-'
                })()}
              </CCol>
            </CRow>

            <div className="mt-4">
              <CButton color="primary" onClick={() => navigate(`/users/${id}/add-patient`)}>
                <CIcon icon={cilPlus} className="me-1" />
                Add Patient
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default UserDetails
