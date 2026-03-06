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
import { cilArrowLeft, cilUser } from '@coreui/icons'
import { getUsers } from '../../services/userService'
import { decryptSafe, decryptField } from '../../services/encryptionService'
import { getCountryFromContact } from '../../utils/countryUtils'

const DoctorDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDoctor = async () => {
      try {
        const res = await getUsers(3)
        let doctors = []
        if (Array.isArray(res)) doctors = res
        else if (Array.isArray(res.data)) doctors = res.data

        const found = doctors.find((u) => String(u.id) === String(id))
        if (found) {
          setDoctor(found)
        } else {
          setError('Doctor not found.')
        }
      } catch (err) {
        setError(err?.message || 'Failed to load doctor details. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    loadDoctor()
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
            <strong>Doctor Details</strong>
            <CButton color="light" size="sm" onClick={() => navigate('/doctors')}>
              <CIcon icon={cilArrowLeft} className="me-1" />
              Back to Doctors
            </CButton>
          </CCardHeader>
          <CCardBody>
            <div className="d-flex align-items-center mb-4">
              <CAvatar color="secondary" size="xl" className="me-3">
                <CIcon icon={cilUser} size="xl" />
              </CAvatar>
              <div>
                <h4 className="mb-1">{decryptField(doctor.username || doctor.name)}</h4>
                <span className="text-body-secondary">{decryptSafe(doctor.emailid || doctor.email)}</span>
              </div>
            </div>

            <CRow className="mb-3">
              <CCol sm={4} className="fw-semibold">Contact</CCol>
              <CCol sm={8}>{decryptField(doctor.cnumber || doctor.contactNumber)}</CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol sm={4} className="fw-semibold">Status</CCol>
              <CCol sm={8}>
                <CBadge color={doctor.ustatus === 'Active' ? 'success' : 'secondary'}>
                  {doctor.ustatus || doctor.status || '-'}
                </CBadge>
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol sm={4} className="fw-semibold">Register Date</CCol>
              <CCol sm={8}>{doctor.cdate || doctor.creationDate || '-'}</CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol sm={4} className="fw-semibold">Country</CCol>
              <CCol sm={8}>
                {(() => {
                  const country = getCountryFromContact(decryptField(doctor.cnumber || doctor.contactNumber))
                  return country?.name || doctor.countryid || doctor.country || '-'
                })()}
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default DoctorDetails
