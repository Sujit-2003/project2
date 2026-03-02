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
      } catch {
        setError('Network error loading patients.')
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
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {patients.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="text-center text-muted">
                        No patients found.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    patients.map((p, index) => (
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
                        <CTableDataCell>{p.contact_number}</CTableDataCell>
                      </CTableRow>
                    ))
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
