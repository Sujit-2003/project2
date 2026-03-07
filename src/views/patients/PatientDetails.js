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
  CAvatar,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilPlus, cilCalendar, cilPencil, cilTrash } from '@coreui/icons'
import { SchedulerForm } from './ActivityScheduler'
import { getPatients, getAllPatientsWithParent } from '../../services/patientService'
import { getUsers } from '../../services/userService'
import { getActivities, deleteActivity } from '../../services/activityService'
import { getRoleId, getUmId, getAdminId } from '../../services/authService'
import { decryptField, decryptSafe } from '../../services/encryptionService'
import { getCountries } from '../../services/countryService'
import { formatPatientContact } from '../../utils/countryUtils'
import { useToast } from '../../components/ToastContext'

function calculateAge(dob) {
  if (!dob) return ''
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const DAY_MAP = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' }

const formatDays = (daysRaw) => {
  const daysArr = Array.isArray(daysRaw) ? daysRaw : String(daysRaw || '0').split(',')
  if (daysArr.length === 1 && daysArr[0] === '0') return 'Every Day'
  return daysArr.map((d) => DAY_MAP[Number(d)] || d).join(', ')
}

const formatTime = (timeRaw) => {
  if (!timeRaw) return '-'
  const parts = timeRaw.split(':')
  if (parts.length < 2) return timeRaw
  let h = parseInt(parts[0], 10)
  const m = parts[1]
  const ampm = h >= 12 ? 'PM' : 'AM'
  if (h > 12) h -= 12
  if (h === 0) h = 12
  return `${h}:${m} ${ampm}`
}

const PatientDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const roleId = getRoleId()
  const isAdmin = roleId === 2
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [countries, setCountries] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editActivity, setEditActivity] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Activities state (inline)
  const [activities, setActivities] = useState([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)

  useEffect(() => {
    const loadPatient = async () => {
      try {
        const countryData = await getCountries()
        setCountries(countryData)

        let allPatients = []

        if (isAdmin) {
          const userRes = await getUsers(1)
          let allUsers = []
          if (Array.isArray(userRes)) allUsers = userRes
          else if (Array.isArray(userRes.data)) allUsers = userRes.data

          const adminId = getAdminId()
          const filtered = allUsers.filter((u) => u.id !== adminId)
          allPatients = await getAllPatientsWithParent(filtered)
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

  const loadActivities = async () => {
    if (!id) return
    setActivitiesLoading(true)
    try {
      const res = await getActivities(id)
      if (Number(res.code) === 0 && Array.isArray(res.data)) {
        setActivities(res.data)
      } else if (Array.isArray(res.data)) {
        setActivities(res.data)
      } else {
        setActivities([])
      }
    } catch {
      setActivities([])
    } finally {
      setActivitiesLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadActivities()
  }, [id, refreshKey])

  const handleDeleteActivity = async (actId) => {
    try {
      const res = await deleteActivity(actId)
      if (Number(res.code) === 0) {
        showSuccess(res.message || 'Activity deleted.')
        await loadActivities()
      } else {
        showError(res.message || 'Failed to delete activity.')
      }
    } catch {
      showError('Network error deleting activity.')
    }
  }

  if (loading) {
    return (
      <div className="suji-loading">
        <CSpinner color="primary" />
      </div>
    )
  }

  if (error) {
    return <CAlert color="danger">{error}</CAlert>
  }

  const contact = patient.contact_number || patient.contact_numb || ''
  const countryObj = countries.find((c) => Number(c.country_id) === Number(patient.country_id))
  const { display: displayContact, countryName } = formatPatientContact(contact, countryObj)

  const parentUser = patient._parent
  const parentName = parentUser ? decryptField(parentUser.username || parentUser.name || '') : ''
  const parentEmail = parentUser ? decryptSafe(parentUser.emailid || parentUser.email || '') : ''

  const age = calculateAge(patient.p_dob)
  const initials = `${(patient.patient_fname || '')[0] || ''}${(patient.patient_lname || '')[0] || ''}`.toUpperCase()

  return (
    <CRow className="justify-content-center">
      <CCol lg={10}>
        {/* Patient Profile Card */}
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Patient Details</strong>
            <CButton color="light" size="sm" onClick={() => navigate('/patients')}>
              <CIcon icon={cilArrowLeft} className="me-1" />
              Back to Patients
            </CButton>
          </CCardHeader>
          <CCardBody>
            {/* Profile Header */}
            <div className="suji-profile-header">
              <CAvatar
                color={patient.user_gender === 'Male' ? 'info' : 'warning'}
                style={{ width: '72px', height: '72px', fontSize: '1.5rem', flexShrink: 0 }}
              >
                {initials}
              </CAvatar>
              <div>
                <h4 className="mb-1" style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
                  {patient.patient_fname} {patient.patient_lname}
                </h4>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <CBadge color={patient.user_gender === 'Male' ? 'info' : 'warning'} shape="rounded-pill">
                    {patient.user_gender}
                  </CBadge>
                  {age && (
                    <CBadge color="light" textColor="dark" shape="rounded-pill">
                      {age} years old
                    </CBadge>
                  )}
                  {patient.p_relationship && (
                    <CBadge color="light" textColor="dark" shape="rounded-pill">
                      {patient.p_relationship}
                    </CBadge>
                  )}
                </div>
              </div>
            </div>

            {/* Detail Rows */}
            <div className="suji-detail-row">
              <div className="detail-label">Patient Name</div>
              <div className="detail-value">{patient.patient_fname} {patient.patient_lname}</div>
            </div>
            <div className="suji-detail-row">
              <div className="detail-label">Age</div>
              <div className="detail-value">{age || '-'}</div>
            </div>
            <div className="suji-detail-row">
              <div className="detail-label">Gender</div>
              <div className="detail-value">{patient.user_gender || '-'}</div>
            </div>
            <div className="suji-detail-row">
              <div className="detail-label">Condition</div>
              <div className="detail-value">
                {patient.health_history
                  ? <span dangerouslySetInnerHTML={{ __html: patient.health_history }} />
                  : <span className="text-body-secondary">No condition recorded</span>}
              </div>
            </div>
            <div className="suji-detail-row">
              <div className="detail-label">Assigned Doctor</div>
              <div className="detail-value">
                {patient.doctor_name || <span className="text-body-secondary">Not assigned</span>}
              </div>
            </div>
            <div className="suji-detail-row">
              <div className="detail-label">Date of Birth</div>
              <div className="detail-value">{patient.p_dob?.split(' ')[0] || '-'}</div>
            </div>
            <div className="suji-detail-row">
              <div className="detail-label">Contact</div>
              <div className="detail-value">{displayContact}</div>
            </div>
            <div className="suji-detail-row">
              <div className="detail-label">Country</div>
              <div className="detail-value">{countryName || '-'}</div>
            </div>

            {isAdmin && parentName && (
              <div className="suji-detail-row">
                <div className="detail-label">Parent</div>
                <div className="detail-value">
                  <CButton
                    color="link"
                    size="sm"
                    className="p-0 text-decoration-none"
                    onClick={() => navigate(`/users/${patient.um_id}`)}
                  >
                    {parentName}
                  </CButton>
                  {parentEmail && (
                    <div className="small text-body-secondary">{parentEmail}</div>
                  )}
                </div>
              </div>
            )}

            {patient.about_patient && (
              <div className="suji-detail-row">
                <div className="detail-label">About</div>
                <div className="detail-value">
                  <div dangerouslySetInnerHTML={{ __html: patient.about_patient }} />
                </div>
              </div>
            )}
          </CCardBody>
        </CCard>

        {/* Activities Section */}
        {!isAdmin && showForm && (
          <SchedulerForm
            patientId={patient.id}
            editActivity={editActivity}
            onSaved={() => {
              setRefreshKey((k) => k + 1)
              setEditActivity(null)
              setShowForm(false)
            }}
            onCancel={() => {
              setEditActivity(null)
              setShowForm(false)
            }}
          />
        )}

        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <CIcon icon={cilCalendar} height={18} className="text-primary" />
              <strong>Scheduled Activities</strong>
            </div>
            {!isAdmin && (
              <CButton
                color="primary"
                size="sm"
                onClick={() => {
                  setEditActivity(null)
                  setShowForm((prev) => !prev)
                }}
              >
                {showForm ? (
                  'Close Form'
                ) : (
                  <>
                    <CIcon icon={cilPlus} className="me-1" />
                    Add Scheduler
                  </>
                )}
              </CButton>
            )}
          </CCardHeader>
          <CCardBody>
            {activitiesLoading ? (
              <div className="text-center py-3">
                <CSpinner color="primary" size="sm" />
              </div>
            ) : activities.length === 0 ? (
              <div className="suji-empty-state">
                No activities scheduled yet.{!isAdmin && ' Click "Add Scheduler" to create one.'}
              </div>
            ) : (
              <CTable hover responsive align="middle">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Activity Name</CTableHeaderCell>
                    <CTableHeaderCell>Task Type</CTableHeaderCell>
                    <CTableHeaderCell>Days</CTableHeaderCell>
                    <CTableHeaderCell>Time</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    {!isAdmin && <CTableHeaderCell>Actions</CTableHeaderCell>}
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {activities.map((activity) => (
                    <CTableRow key={activity.id || activity.activity_id}>
                      <CTableDataCell className="fw-semibold">{activity.actity_name}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge
                          color={activity.actity_type === 'Food' ? 'success' : activity.actity_type === 'Exercise' ? 'info' : 'primary'}
                          shape="rounded-pill"
                        >
                          {activity.actity_type}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>{formatDays(activity.days_flag)}</CTableDataCell>
                      <CTableDataCell>{formatTime(activity.actity_datetime)}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={activity.actity_status === 1 ? 'success' : 'secondary'} shape="rounded-pill">
                          {activity.actity_status === 1 ? 'Active' : 'Inactive'}
                        </CBadge>
                      </CTableDataCell>
                      {!isAdmin && (
                        <CTableDataCell>
                          <CButton
                            color="info"
                            variant="outline"
                            size="sm"
                            className="me-2"
                            onClick={() => {
                              setEditActivity(activity)
                              setShowForm(true)
                            }}
                          >
                            <CIcon icon={cilPencil} size="sm" /> Edit
                          </CButton>
                          <CButton
                            color="danger"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteActivity(activity.id || activity.activity_id)}
                          >
                            <CIcon icon={cilTrash} size="sm" /> Delete
                          </CButton>
                        </CTableDataCell>
                      )}
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default PatientDetails
