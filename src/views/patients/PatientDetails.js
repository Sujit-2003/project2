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
  CFormSelect,
  CFormTextarea,
  CFormLabel,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilPlus, cilCalendar, cilPencil, cilTrash, cilSave, cilNotes, cilMedicalCross, cilUserFollow } from '@coreui/icons'
import { SchedulerForm } from './ActivityScheduler'
import { getPatients, getAllPatientsWithParent } from '../../services/patientService'
import { getUsers } from '../../services/userService'
import { getActivities, deleteActivity } from '../../services/activityService'
import { getRoleId, getUmId, getAdminId } from '../../services/authService'
import { decryptField, decryptSafe } from '../../services/encryptionService'
import { getCountries } from '../../services/countryService'
import { formatPatientContact } from '../../utils/countryUtils'
import { assignDoctorToPatient, assignTemplateToPatient, submitDoctorReview, getPatientProfile } from '../../services/patientProfileService'
import { getTemplates } from '../../services/questionnaireService'
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
  const isDoctor = roleId === 3
  const isParent = roleId === 1
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [countries, setCountries] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editActivity, setEditActivity] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Activities state
  const [activities, setActivities] = useState([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)

  // Admin: Doctor assignment
  const [doctors, setDoctors] = useState([])
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [assigningDoctor, setAssigningDoctor] = useState(false)

  // Doctor: Template assignment
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [assigningTemplate, setAssigningTemplate] = useState(false)

  // Doctor: Review
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    health_analysis: '',
    prescription_summary: '',
  })
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    const loadPatient = async () => {
      try {
        const countryData = await getCountries()
        setCountries(countryData)

        let allPatients = []

        if (isAdmin || isDoctor) {
          const userRes = await getUsers(1)
          let allUsers = []
          if (Array.isArray(userRes)) allUsers = userRes
          else if (Array.isArray(userRes.data)) allUsers = userRes.data

          if (isAdmin) {
            const adminId = getAdminId()
            allUsers = allUsers.filter((u) => u.id !== adminId)
          }
          allPatients = await getAllPatientsWithParent(allUsers)
        } else {
          const umId = getUmId()
          const res = await getPatients(umId)
          if (Number(res.code) === 0 && Array.isArray(res.data)) {
            allPatients = res.data
          }
        }

        const found = allPatients.find((p) => String(p.id) === String(id))
        if (found) {
          // Fetch profile data (doctor, template, analysis) from separate endpoint
          let enriched = { ...found }
          try {
            const profileRes = await getPatientProfile(found.id)
            if (Number(profileRes.code) === 0 && profileRes.data) {
              const prof = profileRes.data
              enriched = {
                ...enriched,
                profile_id: prof.profile_id || prof.id || null,
                doctor_id: prof.doctor_id || null,
                doctor_name: prof.doctor_name ? decryptField(prof.doctor_name) : null,
                template_id: prof.template_id || null,
                template_name: prof.template_name || null,
                template_status: prof.template_status || null,
                health_analysis: prof.health_analysis || null,
                prescription_summary: prof.prescription_summary || null,
              }
            }
          } catch {
            // No profile yet — that's fine
          }
          setPatient(enriched)
          if (enriched.health_analysis || enriched.prescription_summary) {
            setReviewForm({
              health_analysis: enriched.health_analysis || '',
              prescription_summary: enriched.prescription_summary || '',
            })
          }
        } else {
          setError('Patient not found.')
        }

        // Admin: load doctors for assignment
        if (isAdmin) {
          const docRes = await getUsers(3)
          const docList = Array.isArray(docRes) ? docRes : Array.isArray(docRes.data) ? docRes.data : []
          setDoctors(docList.map((d) => ({
            id: d.id,
            name: decryptField(d.username || d.name || ''),
          })))
        }
      } catch (err) {
        setError(err?.message || 'Failed to load patient details.')
      } finally {
        setLoading(false)
      }
    }
    loadPatient()
  }, [id, isAdmin, isDoctor])

  // ─── Activities ───

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

  // ─── Admin: Assign Doctor (one-time only) ───

  const handleAssignDoctor = async () => {
    if (!selectedDoctorId) return
    setAssigningDoctor(true)
    try {
      const res = await assignDoctorToPatient({
        doctor_id: Number(selectedDoctorId),
        patient_id: Number(patient.id),
      })
      if (Number(res.code) === 0) {
        showSuccess('Doctor assigned successfully!')
        const doc = doctors.find((d) => d.id === Number(selectedDoctorId))
        const newProfileId = res.data?.profile_id || res.data?.id || null
        setPatient((prev) => ({
          ...prev,
          doctor_id: Number(selectedDoctorId),
          doctor_name: doc?.name || '',
          profile_id: newProfileId || prev.profile_id,
        }))
        setSelectedDoctorId('')
      } else {
        showError(res.message || 'Failed to assign doctor.')
      }
    } catch {
      showError('Network error assigning doctor.')
    } finally {
      setAssigningDoctor(false)
    }
  }

  // ─── Doctor: Assign Template ───

  const handleOpenTemplateModal = async () => {
    setShowTemplateModal(true)
    try {
      const res = await getTemplates()
      if (Number(res.code) === 0 && Array.isArray(res.data)) {
        setTemplates(res.data)
      }
    } catch {
      // templates remain empty
    }
  }

  const handleAssignTemplate = async () => {
    if (!selectedTemplateId) return
    setAssigningTemplate(true)
    try {
      const profileId = patient.profile_id || patient.id
      const res = await assignTemplateToPatient({
        profile_id: profileId,
        template_id: Number(selectedTemplateId),
      })
      if (Number(res.code) === 0) {
        showSuccess('Template assigned to patient successfully!')
        const tpl = templates.find((t) => String(t.id) === String(selectedTemplateId))
        setPatient((prev) => ({
          ...prev,
          template_id: Number(selectedTemplateId),
          template_name: tpl?.template_name || '',
          template_status: 'pending',
        }))
        setShowTemplateModal(false)
        setSelectedTemplateId('')
      } else {
        showError(res.message || 'Failed to assign template.')
      }
    } catch {
      showError('Network error assigning template.')
    } finally {
      setAssigningTemplate(false)
    }
  }

  // ─── Doctor: Submit Review ───

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!reviewForm.health_analysis.trim() && !reviewForm.prescription_summary.trim()) {
      showError('Please enter at least a summary or precautions.')
      return
    }
    setSubmittingReview(true)
    try {
      const profileId = patient.profile_id || patient.id
      const res = await submitDoctorReview({
        profile_id: profileId,
        health_analysis: reviewForm.health_analysis.trim(),
        prescription_summary: reviewForm.prescription_summary.trim(),
      })
      if (Number(res.code) === 0) {
        showSuccess('Review submitted successfully!')
        setPatient((prev) => ({
          ...prev,
          health_analysis: reviewForm.health_analysis.trim(),
          prescription_summary: reviewForm.prescription_summary.trim(),
          template_status: 'reviewed',
        }))
        setShowReviewForm(false)
      } else {
        showError(res.message || 'Failed to submit review.')
      }
    } catch {
      showError('Network error submitting review.')
    } finally {
      setSubmittingReview(false)
    }
  }

  // ─── Render ───

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

  const templateStatus = patient.template_status || (patient.template_id ? 'pending' : null)
  const hasDoctorAssigned = !!(patient.doctor_id || patient.doctor_name)

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
                  {templateStatus && (
                    <CBadge
                      color={
                        templateStatus === 'reviewed' ? 'success'
                          : templateStatus === 'submitted' ? 'info'
                            : 'warning'
                      }
                      shape="rounded-pill"
                    >
                      Template: {templateStatus.charAt(0).toUpperCase() + templateStatus.slice(1)}
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
            {(isAdmin || isDoctor) && parentName && (
              <div className="suji-detail-row">
                <div className="detail-label">Parent Name</div>
                <div className="detail-value">
                  {isAdmin ? (
                    <CButton
                      color="link"
                      size="sm"
                      className="p-0 text-decoration-none"
                      onClick={() => navigate(`/users/${patient.um_id}`)}
                    >
                      {parentName}
                    </CButton>
                  ) : (
                    <span>{parentName}</span>
                  )}
                  {parentEmail && (
                    <div className="small text-body-secondary">{parentEmail}</div>
                  )}
                </div>
              </div>
            )}
            <div className="suji-detail-row">
              <div className="detail-label">Age</div>
              <div className="detail-value">{age || '-'}</div>
            </div>
            <div className="suji-detail-row">
              <div className="detail-label">Gender</div>
              <div className="detail-value">{patient.user_gender || '-'}</div>
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
            <div className="suji-detail-row">
              <div className="detail-label">Health History</div>
              <div className="detail-value">
                {patient.health_history
                  ? <div dangerouslySetInnerHTML={{ __html: patient.health_history }} />
                  : <span className="text-body-secondary">No health history recorded</span>}
              </div>
            </div>
            <div className="suji-detail-row">
              <div className="detail-label">Assigned Doctor</div>
              <div className="detail-value">
                {hasDoctorAssigned ? (
                  <CBadge color="success" shape="rounded-pill">
                    {patient.doctor_name || doctors.find((d) => d.id === patient.doctor_id)?.name || 'Assigned'}
                  </CBadge>
                ) : (
                  <span className="text-body-secondary">Not assigned</span>
                )}
              </div>
            </div>
            {patient.template_name && (
              <div className="suji-detail-row">
                <div className="detail-label">Assigned Template</div>
                <div className="detail-value">
                  <CBadge color="primary" shape="rounded-pill">{patient.template_name}</CBadge>
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

        {/* ── ADMIN: Doctor Assignment Section ── */}
        {isAdmin && (
          <CCard className="mb-4">
            <CCardHeader>
              <div className="d-flex align-items-center gap-2">
                <CIcon icon={cilUserFollow} height={18} className="text-primary" />
                <strong>Doctor Assignment</strong>
              </div>
            </CCardHeader>
            <CCardBody>
              {hasDoctorAssigned ? (
                <div>
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <span className="fw-semibold">Assigned Doctor:</span>
                    <CBadge color="success" shape="rounded-pill" style={{ fontSize: '0.9rem', padding: '6px 16px' }}>
                      {patient.doctor_name || doctors.find((d) => d.id === patient.doctor_id)?.name || 'Doctor'}
                    </CBadge>
                  </div>
                  <div className="text-body-secondary small">
                    Doctor already assigned. A patient can only be assigned to one doctor.
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-body-secondary mb-3">
                    Select a doctor to assign to <strong>{patient.patient_fname} {patient.patient_lname}</strong>.
                    Once assigned, this cannot be changed.
                  </p>
                  <div className="d-flex align-items-end gap-3">
                    <div style={{ minWidth: '250px' }}>
                      <CFormLabel className="small fw-semibold">Select Doctor</CFormLabel>
                      <CFormSelect
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                      >
                        <option value="">-- Choose a Doctor --</option>
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </CFormSelect>
                    </div>
                    <CButton
                      color="primary"
                      disabled={!selectedDoctorId || assigningDoctor}
                      onClick={handleAssignDoctor}
                    >
                      {assigningDoctor ? <CSpinner size="sm" /> : (
                        <>
                          <CIcon icon={cilUserFollow} className="me-1" />
                          Assign Doctor
                        </>
                      )}
                    </CButton>
                  </div>
                </div>
              )}
            </CCardBody>
          </CCard>
        )}

        {/* ── DOCTOR: Actions Card ── */}
        {isDoctor && (
          <CCard className="mb-4 border-primary">
            <CCardHeader>
              <div className="d-flex align-items-center gap-2">
                <CIcon icon={cilMedicalCross} height={18} className="text-primary" />
                <strong>Doctor Actions</strong>
              </div>
            </CCardHeader>
            <CCardBody>
              <div className="d-flex flex-wrap gap-3">
                <CButton color="primary" onClick={handleOpenTemplateModal}>
                  <CIcon icon={cilNotes} className="me-1" />
                  {patient.template_name ? 'Change Template' : 'Assign Template'}
                </CButton>
                <CButton
                  color="success"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                >
                  <CIcon icon={cilPencil} className="me-1" />
                  {patient.health_analysis ? 'Update Review' : 'Write Review'}
                </CButton>
              </div>

              {/* Current Review Display */}
              {(patient.health_analysis || patient.prescription_summary) && !showReviewForm && (
                <div className="mt-4">
                  <h6 className="fw-bold mb-3">Current Review</h6>
                  {patient.health_analysis && (
                    <div className="mb-3">
                      <div className="text-body-secondary small mb-1">Health Analysis / Summary</div>
                      <div className="p-3 rounded border" style={{ backgroundColor: 'var(--suji-bg, #f8f9fa)', whiteSpace: 'pre-line' }}>
                        {patient.health_analysis}
                      </div>
                    </div>
                  )}
                  {patient.prescription_summary && (
                    <div>
                      <div className="text-body-secondary small mb-1">Prescription / Precautions</div>
                      <div className="p-3 rounded border" style={{ backgroundColor: 'var(--suji-bg, #f8f9fa)', whiteSpace: 'pre-line' }}>
                        {patient.prescription_summary}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CCardBody>
          </CCard>
        )}

        {/* ── DOCTOR: Review Form ── */}
        {isDoctor && showReviewForm && (
          <CCard className="mb-4 border-success">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Doctor Review &amp; Summary</strong>
              <CButton color="light" size="sm" onClick={() => setShowReviewForm(false)}>
                Close
              </CButton>
            </CCardHeader>
            <CCardBody>
              <form onSubmit={handleSubmitReview}>
                <div className="mb-3">
                  <CFormLabel>Doctor Summary</CFormLabel>
                  <CFormTextarea
                    value={reviewForm.health_analysis}
                    onChange={(e) => setReviewForm({ ...reviewForm, health_analysis: e.target.value })}
                    rows={4}
                    placeholder="Enter your health analysis, observations, and summary..."
                  />
                </div>
                <div className="mb-3">
                  <CFormLabel>Precautions &amp; Recommendations</CFormLabel>
                  <CFormTextarea
                    value={reviewForm.prescription_summary}
                    onChange={(e) => setReviewForm({ ...reviewForm, prescription_summary: e.target.value })}
                    rows={4}
                    placeholder="Enter precautions, recommendations, and prescriptions..."
                  />
                </div>
                <div className="d-flex gap-2">
                  <CButton type="submit" color="success" disabled={submittingReview}>
                    {submittingReview ? <CSpinner size="sm" /> : (
                      <>
                        <CIcon icon={cilSave} className="me-1" />
                        Submit Review
                      </>
                    )}
                  </CButton>
                  <CButton color="secondary" variant="outline" onClick={() => setShowReviewForm(false)}>
                    Cancel
                  </CButton>
                </div>
              </form>
            </CCardBody>
          </CCard>
        )}

        {/* ── PARENT: Doctor Review Display ── */}
        {isParent && (patient.health_analysis || patient.prescription_summary) && (
          <CCard className="mb-4 border-success">
            <CCardHeader>
              <div className="d-flex align-items-center gap-2">
                <CIcon icon={cilMedicalCross} height={18} className="text-success" />
                <strong>Doctor&apos;s Review</strong>
              </div>
            </CCardHeader>
            <CCardBody>
              {patient.health_analysis && (
                <div className="mb-3">
                  <div className="text-body-secondary small mb-1">Doctor Summary</div>
                  <div className="p-3 rounded border" style={{ backgroundColor: 'var(--suji-bg, #f8f9fa)', whiteSpace: 'pre-line' }}>
                    {patient.health_analysis}
                  </div>
                </div>
              )}
              {patient.prescription_summary && (
                <div>
                  <div className="text-body-secondary small mb-1">Precautions &amp; Recommendations</div>
                  <div className="p-3 rounded border" style={{ backgroundColor: 'var(--suji-bg, #f8f9fa)', whiteSpace: 'pre-line' }}>
                    {patient.prescription_summary}
                  </div>
                </div>
              )}
            </CCardBody>
          </CCard>
        )}

        {/* ── Template Assignment Modal (Doctor) ── */}
        <CModal visible={showTemplateModal} onClose={() => setShowTemplateModal(false)}>
          <CModalHeader>
            <CModalTitle>Assign Template</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <p className="text-body-secondary mb-3">
              Select a questionnaire template to assign to <strong>{patient.patient_fname} {patient.patient_lname}</strong>.
            </p>
            {templates.length === 0 ? (
              <div className="text-center py-3">
                <CSpinner size="sm" color="primary" />
                <div className="small text-body-secondary mt-2">Loading templates...</div>
              </div>
            ) : (
              <CFormSelect
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
              >
                <option value="">-- Select Template --</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.template_name} ({t.no_of_questions || 0} questions)
                  </option>
                ))}
              </CFormSelect>
            )}
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" variant="outline" onClick={() => setShowTemplateModal(false)}>
              Cancel
            </CButton>
            <CButton
              color="primary"
              disabled={!selectedTemplateId || assigningTemplate}
              onClick={handleAssignTemplate}
            >
              {assigningTemplate ? <CSpinner size="sm" /> : 'Send Template'}
            </CButton>
          </CModalFooter>
        </CModal>

        {/* ── Activities Section ── */}
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
                        <CBadge color={(activity.actity_status_text || '').toLowerCase() === 'active' || activity.actity_status === 1 ? 'success' : 'secondary'} shape="rounded-pill">
                          {activity.actity_status_text || (activity.actity_status === 1 ? 'Active' : 'Inactive')}
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
