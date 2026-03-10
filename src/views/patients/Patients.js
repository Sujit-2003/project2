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
  CFormSelect,
  CPagination,
  CPaginationItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilChildFriendly } from '@coreui/icons'
import { getPatients, getAllPatientsWithParent } from '../../services/patientService'
import { getUsers } from '../../services/userService'
import { getRoleId, getUmId, getAdminId } from '../../services/authService'
import { decryptField, decryptSafe } from '../../services/encryptionService'
import { getCountries } from '../../services/countryService'
import { formatPatientContact } from '../../utils/countryUtils'
import { assignDoctorToPatient } from '../../services/patientProfileService'
import { useToast } from '../../components/ToastContext'
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
  const { showSuccess, showError } = useToast()
  const roleId = getRoleId()
  const isAdmin = roleId === 2
  const isDoctor = roleId === 3
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [countries, setCountries] = useState([])
  const [doctors, setDoctors] = useState([])
  const [assigningDoctor, setAssigningDoctor] = useState({}) // { patientId: true }

  const {
    paginatedData,
    currentPage,
    totalPages,
    searchTerm,
    setCurrentPage,
    setSearchTerm,
  } = useTableControls(patients, ['patient_fname', 'patient_lname', 'p_relationship', 'contact_number', '_parentName', '_doctorName'])

  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true)
      setError('')
      try {
        const countryData = await getCountries()
        setCountries(countryData)

        if (isAdmin) {
          // Load doctors list for assignment dropdown
          const docRes = await getUsers(3)
          const docList = Array.isArray(docRes) ? docRes : Array.isArray(docRes.data) ? docRes.data : []
          setDoctors(docList.map((d) => ({
            id: d.id,
            name: decryptField(d.username || d.name || ''),
            email: decryptSafe(d.emailid || d.email || ''),
          })))

          // Load all patients with parent info
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
            _doctorName: p.doctor_name ? decryptField(p.doctor_name) : '',
            _doctorId: p.doctor_id || null,
          }))
          setPatients(enriched)
        } else if (isDoctor) {
          // Doctor sees only assigned patients
          const umId = getUmId()
          // Try to get patients assigned to this doctor
          // For now, get all patients and filter by doctor_id
          const userRes = await getUsers(1)
          let allUsers = []
          if (Array.isArray(userRes)) allUsers = userRes
          else if (Array.isArray(userRes.data)) allUsers = userRes.data

          const pts = await getAllPatientsWithParent(allUsers)
          const enriched = pts
            .filter((p) => Number(p.doctor_id) === umId)
            .map((p) => ({
              ...p,
              _parentName: decryptField(p._parent?.username || p._parent?.name || ''),
              _parentEmail: decryptSafe(p._parent?.emailid || p._parent?.email || ''),
            }))
          setPatients(enriched)
        } else {
          // Parent: show own patients
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
  }, [isAdmin, isDoctor])

  const renderContact = (contact, countryId) => {
    const countryObj = countries.find((c) => Number(c.country_id) === Number(countryId))
    const { display } = formatPatientContact(contact, countryObj)
    return display
  }

  const handleAssignDoctor = async (patient, doctorId) => {
    if (!doctorId) return
    setAssigningDoctor((prev) => ({ ...prev, [patient.id]: true }))
    try {
      const res = await assignDoctorToPatient({
        doctor_id: Number(doctorId),
        patient_id: Number(patient.id),
      })
      if (Number(res.code) === 0) {
        showSuccess('Doctor assigned successfully!')
        // Update local state
        const doc = doctors.find((d) => d.id === Number(doctorId))
        setPatients((prev) =>
          prev.map((p) =>
            p.id === patient.id
              ? { ...p, _doctorId: Number(doctorId), _doctorName: doc?.name || '', doctor_id: Number(doctorId) }
              : p,
          ),
        )
      } else {
        showError(res.message || 'Failed to assign doctor.')
      }
    } catch {
      showError('Network error assigning doctor.')
    } finally {
      setAssigningDoctor((prev) => ({ ...prev, [patient.id]: false }))
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <CIcon icon={cilChildFriendly} height={18} className="text-primary" />
              <strong>
                {isDoctor ? 'My Assigned Patients' : 'Patients'}
              </strong>
              {patients.length > 0 && (
                <CBadge color="primary" shape="rounded-pill">{patients.length}</CBadge>
              )}
            </div>
            {!isAdmin && !isDoctor && (
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
              <div className="suji-loading">
                <CSpinner color="primary" />
              </div>
            )}
            {error && <CAlert color="danger">{error}</CAlert>}
            {!loading && !error && (
              <>
                <CTable hover responsive align="middle" className="mb-0">
                  <CTableHead color="light">
                    <CTableRow>
                      <CTableHeaderCell style={{ width: '50px' }}>#</CTableHeaderCell>
                      <CTableHeaderCell>Name</CTableHeaderCell>
                      {(isAdmin || isDoctor) && <CTableHeaderCell>Parent</CTableHeaderCell>}
                      <CTableHeaderCell>Relationship</CTableHeaderCell>
                      <CTableHeaderCell>DOB</CTableHeaderCell>
                      <CTableHeaderCell>Age</CTableHeaderCell>
                      <CTableHeaderCell>Gender</CTableHeaderCell>
                      <CTableHeaderCell>Contact</CTableHeaderCell>
                      {isAdmin && <CTableHeaderCell>Assigned Doctor</CTableHeaderCell>}
                      {isDoctor && <CTableHeaderCell>Template Status</CTableHeaderCell>}
                      {/* Parent sees template info */}
                      {!isAdmin && !isDoctor && <CTableHeaderCell>Template</CTableHeaderCell>}
                      <CTableHeaderCell style={{ width: '100px', textAlign: 'center' }}>Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {paginatedData.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={isAdmin ? 10 : 9} className="text-center">
                          <div className="suji-empty-state">
                            {isDoctor ? 'No patients assigned to you yet.' : 'No patients found.'}
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      paginatedData.map((p, index) => {
                        const contact = p.contact_number || p.contact_numb || ''
                        return (
                          <CTableRow key={p.id || index}>
                            <CTableDataCell className="text-body-secondary">
                              {(currentPage - 1) * 10 + index + 1}
                            </CTableDataCell>
                            <CTableDataCell className="fw-semibold">
                              {p.patient_fname} {p.patient_lname}
                            </CTableDataCell>
                            {(isAdmin || isDoctor) && (
                              <CTableDataCell>
                                {isAdmin ? (
                                  <CButton
                                    color="link"
                                    size="sm"
                                    className="p-0 text-decoration-none"
                                    onClick={() => navigate(`/users/${p.um_id}`)}
                                  >
                                    {p._parentName || '-'}
                                  </CButton>
                                ) : (
                                  <span>{p._parentName || '-'}</span>
                                )}
                                {p._parentEmail && (
                                  <div className="small text-body-secondary">{p._parentEmail}</div>
                                )}
                              </CTableDataCell>
                            )}
                            <CTableDataCell>{p.p_relationship}</CTableDataCell>
                            <CTableDataCell>{p.p_dob?.split(' ')[0]}</CTableDataCell>
                            <CTableDataCell>{calculateAge(p.p_dob)}</CTableDataCell>
                            <CTableDataCell>
                              <CBadge color={p.user_gender === 'Male' ? 'info' : 'warning'} shape="rounded-pill">
                                {p.user_gender}
                              </CBadge>
                            </CTableDataCell>
                            <CTableDataCell>{renderContact(contact, p.country_id)}</CTableDataCell>

                            {/* Admin: Assign Doctor dropdown */}
                            {isAdmin && (
                              <CTableDataCell>
                                {assigningDoctor[p.id] ? (
                                  <CSpinner size="sm" color="primary" />
                                ) : p._doctorName ? (
                                  <div>
                                    <CBadge color="success" shape="rounded-pill" className="mb-1">
                                      {p._doctorName}
                                    </CBadge>
                                    <div>
                                      <CFormSelect
                                        size="sm"
                                        style={{ width: '160px', fontSize: '0.75rem' }}
                                        value=""
                                        onChange={(e) => handleAssignDoctor(p, e.target.value)}
                                      >
                                        <option value="">Reassign...</option>
                                        {doctors.map((d) => (
                                          <option key={d.id} value={d.id}>
                                            {d.name}
                                          </option>
                                        ))}
                                      </CFormSelect>
                                    </div>
                                  </div>
                                ) : (
                                  <CFormSelect
                                    size="sm"
                                    style={{ width: '160px' }}
                                    value=""
                                    onChange={(e) => handleAssignDoctor(p, e.target.value)}
                                  >
                                    <option value="">Assign Doctor</option>
                                    {doctors.map((d) => (
                                      <option key={d.id} value={d.id}>
                                        {d.name}
                                      </option>
                                    ))}
                                  </CFormSelect>
                                )}
                              </CTableDataCell>
                            )}

                            {/* Doctor: Template status */}
                            {isDoctor && (
                              <CTableDataCell>
                                {p.template_name ? (
                                  <CBadge
                                    color={
                                      p.template_status === 'reviewed' ? 'success'
                                        : p.template_status === 'submitted' ? 'info'
                                          : 'warning'
                                    }
                                    shape="rounded-pill"
                                  >
                                    {p.template_name}
                                    {p.template_status ? ` (${p.template_status})` : ' (Pending)'}
                                  </CBadge>
                                ) : (
                                  <span className="text-body-secondary small">No template</span>
                                )}
                              </CTableDataCell>
                            )}

                            {/* Parent: Template info */}
                            {!isAdmin && !isDoctor && (
                              <CTableDataCell>
                                {p.template_name ? (
                                  <CBadge
                                    color={
                                      p.template_status === 'submitted' ? 'info'
                                        : p.template_status === 'reviewed' ? 'success'
                                          : 'warning'
                                    }
                                    shape="rounded-pill"
                                  >
                                    {p.template_status === 'submitted' ? 'Submitted'
                                      : p.template_status === 'reviewed' ? 'Reviewed'
                                        : 'Pending'}
                                  </CBadge>
                                ) : (
                                  <span className="text-body-secondary small">-</span>
                                )}
                              </CTableDataCell>
                            )}

                            <CTableDataCell className="text-center">
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

export default Patients
