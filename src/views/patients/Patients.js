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
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus } from '@coreui/icons'
import { getPatients } from '../../services/patientService'
import { getUmId } from '../../services/authService'
import { getCountryFromContact, getFlagUrl } from '../../utils/countryUtils'

function calculateAge(dob) {
  if (!dob) return ''
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

const Patients = () => {
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true)
      setError('')
      try {
        const umId = getUmId()
        const res = await getPatients(umId)
        if (Number(res.code) === 0) {
          setPatients(Array.isArray(res.data) ? res.data : [])
        } else {
          setError(res.message || 'Failed to load patients.')
        }
      } catch (err) {
        setError(err?.message || 'Failed to load patients. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    loadPatients()
  }, [])

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Patients</strong>
            <CButton color="primary" size="sm" onClick={() => navigate('/patients/add')}>
              <CIcon icon={cilPlus} className="me-1" />
              Add Patient
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
                      const country = getCountryFromContact(contact)
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
                                {contact}
                              </span>
                            ) : (
                              contact || '-'
                            )}
                          </CTableDataCell>
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
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Patients
