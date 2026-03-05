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
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft } from '@coreui/icons'
import { getPatients, getAllPatients } from '../../services/patientService'
import { getUsers } from '../../services/userService'
import { getRoleId, getUmId, getAdminId } from '../../services/authService'
import { getCountryById, getCountryFromContact, getFlagUrl } from '../../utils/countryUtils'

function calculateAge(dob) {
  if (!dob) return ''
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const PatientDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const roleId = getRoleId()
  const isAdmin = roleId === 2
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadPatient = async () => {
      try {
        let allPatients = []

        if (isAdmin) {
          const userRes = await getUsers(1)
          let allUsers = []
          if (Array.isArray(userRes)) allUsers = userRes
          else if (Array.isArray(userRes.data)) allUsers = userRes.data

          const adminId = getAdminId()
          const userIds = allUsers.filter((u) => u.id !== adminId).map((u) => u.id)
          allPatients = await getAllPatients(userIds)
        } else {
          const umId = getUmId()
          const res = await getPatients(umId)
          if (Number(res.code) === 0 && Array.isArray(res.data)) {
            allPatients = res.data
          }
        }

        const found = allPatients.find((p) => String(p.id) === String(id))
        if (found) {
          setPatient(found)
        } else {
          setError('Patient not found.')
        }
      } catch (err) {
        setError(err?.message || 'Failed to load patient details.')
      } finally {
        setLoading(false)
      }
    }
    loadPatient()
  }, [id, isAdmin])

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

  const contact = patient.contact_number || patient.contact_numb || ''
  const country = getCountryById(patient.country_id) || getCountryFromContact(contact)
  const displayContact = contact
    ? contact.startsWith('+') ? contact : country ? `${country.prefix} ${contact}` : contact
    : '-'

  return (
    <CRow className="justify-content-center">
      <CCol lg={8}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Patient Details</strong>
            <CButton color="light" size="sm" onClick={() => navigate('/patients')}>
              <CIcon icon={cilArrowLeft} className="me-1" />
              Back to Patients
            </CButton>
          </CCardHeader>
          <CCardBody>
            <div className="d-flex align-items-center mb-4">
              <div>
                <h4 className="mb-1">
                  {patient.patient_fname} {patient.patient_lname}
                </h4>
                <CBadge color={patient.user_gender === 'Male' ? 'info' : 'warning'}>
                  {patient.user_gender}
                </CBadge>
              </div>
            </div>

            <CRow className="mb-3">
              <CCol sm={4} className="fw-semibold">Relationship</CCol>
              <CCol sm={8}>{patient.p_relationship || '-'}</CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol sm={4} className="fw-semibold">Date of Birth</CCol>
              <CCol sm={8}>{patient.p_dob?.split(' ')[0] || '-'}</CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol sm={4} className="fw-semibold">Age</CCol>
              <CCol sm={8}>{calculateAge(patient.p_dob) || '-'}</CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol sm={4} className="fw-semibold">Contact</CCol>
              <CCol sm={8}>
                {country ? (
                  <span className="d-flex align-items-center gap-2">
                    <img
                      src={getFlagUrl(country.code)}
                      alt={country.name}
                      width="24"
                      height="16"
                      style={{ objectFit: 'cover', borderRadius: '2px' }}
                    />
                    {displayContact}
                  </span>
                ) : (
                  displayContact
                )}
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol sm={4} className="fw-semibold">Country</CCol>
              <CCol sm={8}>
                {country ? (
                  <span className="d-flex align-items-center gap-2">
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
                  '-'
                )}
              </CCol>
            </CRow>
            {patient.about_patient && (
              <CRow className="mb-3">
                <CCol sm={4} className="fw-semibold">About</CCol>
                <CCol sm={8}>{patient.about_patient}</CCol>
              </CRow>
            )}
            {patient.health_history && (
              <CRow className="mb-3">
                <CCol sm={4} className="fw-semibold">Health History</CCol>
                <CCol sm={8}>{patient.health_history}</CCol>
              </CRow>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default PatientDetails
