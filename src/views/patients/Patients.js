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
  CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilChildFriendly } from '@coreui/icons'
import { getPatients, getAllPatientsWithParent } from '../../services/patientService'
import { getUsers } from '../../services/userService'
import { getRoleId, getUmId, getAdminId } from '../../services/authService'
import { decryptField, decryptSafe } from '../../services/encryptionService'
import { getCountries } from '../../services/countryService'
import { formatPatientContact } from '../../utils/countryUtils'
import { getDoctorPatients, getPatientProfile } from '../../services/patientProfileService'
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
  const isDoctor = roleId === 3
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
  } = useTableControls(patients, ['patient_fname', 'patient_lname', 'p_relationship', 'contact_number', '_parentName', '_doctorName'])

  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true)
      setError('')
      try {
        const countryData = await getCountries()
        setCountries(countryData)

        if (isAdmin) {
          // Load doctors for name resolution
          const docRes = await getUsers(3)
          const docList = Array.isArray(docRes) ? docRes : Array.isArray(docRes.data) ? docRes.data : []
          const doctorMap = {}
          docList.forEach((d) => {
            doctorMap[d.id] = decryptField(d.username || d.name || '')
          })

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
            _doctorName: p.doctor_id ? (doctorMap[p.doctor_id] || (p.doctor_name ? decryptField(p.doctor_name) : '') || '') : '',
          }))
          setPatients(enriched)
        } else if (isDoctor) {
          // Doctor sees only assigned patients via dedicated endpoint
          const umId = getUmId()
          const docPtsRes = await getDoctorPatients(umId)
          if (Number(docPtsRes.code) === 0 && Array.isArray(docPtsRes.data)) {
            // Load parent info for each patient
            const userRes = await getUsers(1)
            let allUsers = []
            if (Array.isArray(userRes)) allUsers = userRes
            else if (Array.isArray(userRes.data)) allUsers = userRes.data
            const userMap = {}
            allUsers.forEach((u) => { userMap[u.id] = u })

            // Fetch profile for each patient to get doctor_id and template status
            const profilesEnriched = await Promise.all(
              docPtsRes.data.map(async (p) => {
                // p could be { patient_id: ... } or { id: ... } based on the new API format
                const pId = p.patient_id || p.id
                try {
                  const profileRes = await getPatientProfile(pId)
                  if (Number(profileRes.code) === 0 && profileRes.data) {
                    return {
                      ...p,
                      id: pId, // normalize id for the table and click action
                      profile_id: profileRes.data.profile_id || profileRes.data.id,
                      doctor_id: profileRes.data.doctor_id,
                      doctor_name: profileRes.data.doctor_name ? decryptField(profileRes.data.doctor_name) : null,
                      template_id: profileRes.data.template_id,
                      template_name: profileRes.data.template_name,
                      template_status: profileRes.data.template_status,
                      health_analysis: profileRes.data.health_analysis,
                      prescription_summary: profileRes.data.prescription_summary,
                      assigned_date: profileRes.data.created_at || profileRes.data.updated_at || null,
                    }
                  }
                } catch { /* no profile yet */ }
                return { ...p, id: pId }
              })
            )

            // Explicitly filter to show only this doctor's patients
            const assignedPatients = profilesEnriched.filter((p) => Number(p.doctor_id) === Number(umId))

            const finalEnriched = assignedPatients.map((p) => {
              const parent = userMap[p.um_id] || userMap[p.parent_id]
              return {
                ...p,
                _parentName: parent ? decryptField(parent.username || parent.name || '') : '',
                _parentEmail: parent ? decryptSafe(parent.emailid || parent.email || '') : '',
              }
            })
            setPatients(finalEnriched)
          } else {
            setPatients([])
          }
        } else {
          // Parent: show own patients + enrich with profile data
          const umId = getUmId()
          const res = await getPatients(umId)
          if (Number(res.code) === 0 && Array.isArray(res.data)) {
            // Fetch profile for each patient to get template status
            const enriched = await Promise.all(
              res.data.map(async (p) => {
                try {
                  const profileRes = await getPatientProfile(p.id)
                  if (Number(profileRes.code) === 0 && profileRes.data) {
                    return {
                      ...p,
                      profile_id: profileRes.data.profile_id || profileRes.data.id,
                      doctor_id: profileRes.data.doctor_id,
                      doctor_name: profileRes.data.doctor_name,
                      template_id: profileRes.data.template_id,
                      template_name: profileRes.data.template_name,
                      template_status: profileRes.data.template_status,
                      health_analysis: profileRes.data.health_analysis,
                      prescription_summary: profileRes.data.prescription_summary,
                    }
                  }
                } catch { /* no profile yet */ }
                return p
              }),
            )
            setPatients(enriched)
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

  // Calculate column count for empty state
  let colCount = isDoctor ? 7 : (isAdmin ? 10 : 9)

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
                      <CTableHeaderCell>Patient Name</CTableHeaderCell>
                      {isDoctor ? (
                        <>
                          <CTableHeaderCell>Parent Name</CTableHeaderCell>
                          <CTableHeaderCell>Age</CTableHeaderCell>
                          <CTableHeaderCell>Assigned Date</CTableHeaderCell>
                          <CTableHeaderCell>Template Status</CTableHeaderCell>
                        </>
                      ) : (
                        <>
                          {isAdmin && <CTableHeaderCell>Parent</CTableHeaderCell>}
                          <CTableHeaderCell>Relationship</CTableHeaderCell>
                          <CTableHeaderCell>DOB</CTableHeaderCell>
                          <CTableHeaderCell>Age</CTableHeaderCell>
                          <CTableHeaderCell>Gender</CTableHeaderCell>
                          <CTableHeaderCell>Contact</CTableHeaderCell>
                          {isAdmin && <CTableHeaderCell>Assigned Doctor</CTableHeaderCell>}
                          {!isAdmin && <CTableHeaderCell>Template</CTableHeaderCell>}
                        </>
                      )}
                      <CTableHeaderCell style={{ width: '80px', textAlign: 'center' }}>Action</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {paginatedData.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={colCount} className="text-center">
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
                            {isDoctor ? (
                              <>
                                <CTableDataCell>
                                  <span>{p._parentName || '-'}</span>
                                </CTableDataCell>
                                <CTableDataCell>{calculateAge(p.p_dob) || '-'}</CTableDataCell>
                                <CTableDataCell>
                                  {p.assigned_date ? new Date(p.assigned_date).toLocaleDateString() : '-'}
                                </CTableDataCell>
                                <CTableDataCell>
                                  {p.template_status ? (
                                    <CBadge
                                      color={
                                        p.template_status === 'reviewed' ? 'success'
                                          : p.template_status === 'submitted' ? 'info'
                                            : 'warning'
                                      }
                                      shape="rounded-pill"
                                    >
                                      {p.template_status.charAt(0).toUpperCase() + p.template_status.slice(1)}
                                    </CBadge>
                                  ) : (
                                    <span className="text-body-secondary small">No template</span>
                                  )}
                                </CTableDataCell>
                              </>
                            ) : (
                              <>
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

                                {isAdmin && (
                                  <CTableDataCell>
                                    {p._doctorName ? (
                                      <CBadge color="success" shape="rounded-pill">
                                        {p._doctorName}
                                      </CBadge>
                                    ) : (
                                      <span className="text-body-secondary small">Not assigned</span>
                                    )}
                                  </CTableDataCell>
                                )}
                                
                                {!isAdmin && (
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
                              </>
                            )}

                            <CTableDataCell className="text-center">
                              <CTooltip content="View Patient Details">
                                <CButton
                                  color="primary"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/patients/${p.id || p.patient_id}`)}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                  </svg>
                                </CButton>
                              </CTooltip>
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
