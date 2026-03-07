import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CFormCheck,
  CButton,
  CSpinner,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilTrash } from '@coreui/icons'
import { addActivity, getActivities, updateActivity, deleteActivity } from '../../services/activityService'
import { useToast } from '../../components/ToastContext'

const DAY_MAP = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
}

const INITIAL_FORM = {
  activityName: '',
  description: '',
  taskType: '',
  scheduleType: '0',
  selectedDays: [],
  time: '',
  status: 'Active',
}

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

// ─── Activities List (table only) ───
export const ActivitiesList = ({ patientId, refreshKey = 0, onEdit }) => {
  const { showSuccess, showError } = useToast()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const loadActivities = async () => {
    setLoading(true)
    try {
      const res = await getActivities(patientId)
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
      setLoading(false)
    }
  }

  useEffect(() => {
    if (patientId) loadActivities()
  }, [patientId, refreshKey])

  const handleDelete = async (id) => {
    try {
      const res = await deleteActivity(id)
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

  return (
    <CCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
      <CCardHeader className="bg-transparent border-bottom-0 pt-3">
        <strong>Scheduled Activities</strong>
      </CCardHeader>
      <CCardBody>
        {loading ? (
          <div className="text-center py-3">
            <CSpinner color="primary" />
          </div>
        ) : activities.length === 0 ? (
          <p className="text-body-secondary mb-0">No activities scheduled yet.</p>
        ) : (
          <CTable hover responsive align="middle">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Activity Name</CTableHeaderCell>
                <CTableHeaderCell>Task Type</CTableHeaderCell>
                <CTableHeaderCell>Days</CTableHeaderCell>
                <CTableHeaderCell>Time</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell>Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {activities.map((activity) => (
                <CTableRow key={activity.id || activity.activity_id}>
                  <CTableDataCell>{activity.actity_name}</CTableDataCell>
                  <CTableDataCell>{activity.actity_type}</CTableDataCell>
                  <CTableDataCell>{formatDays(activity.days_flag)}</CTableDataCell>
                  <CTableDataCell>{formatTime(activity.actity_datetime)}</CTableDataCell>
                  <CTableDataCell>
                    <CBadge color={activity.actity_status === 1 ? 'success' : 'secondary'} shape="rounded-pill">
                      {activity.actity_status === 1 ? 'Active' : 'Inactive'}
                    </CBadge>
                  </CTableDataCell>
                  <CTableDataCell>
                    <CButton
                      color="info"
                      variant="outline"
                      size="sm"
                      className="me-2"
                      onClick={() => onEdit && onEdit(activity)}
                    >
                      <CIcon icon={cilPencil} size="sm" /> Edit
                    </CButton>
                    <CButton
                      color="danger"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(activity.id || activity.activity_id)}
                    >
                      <CIcon icon={cilTrash} size="sm" /> Delete
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        )}
      </CCardBody>
    </CCard>
  )
}

// ─── Scheduler Form (form only) ───
export const SchedulerForm = ({ patientId, editActivity, onSaved, onCancel }) => {
  const { showSuccess, showError, showWarning } = useToast()
  const [form, setForm] = useState({ ...INITIAL_FORM })
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (editActivity) {
      const daysRaw = editActivity.days_flag || '0'
      const daysArr = Array.isArray(daysRaw) ? daysRaw : String(daysRaw).split(',')
      const isEveryDay = daysArr.length === 1 && daysArr[0] === '0'
      const timeRaw = editActivity.actity_datetime || ''
      const timeParts = timeRaw.split(':')
      const timeVal = timeParts.length >= 2 ? `${timeParts[0]}:${timeParts[1]}` : timeRaw

      setForm({
        activityName: editActivity.actity_name || '',
        description: editActivity.actity_desc || '',
        taskType: editActivity.actity_type || '',
        scheduleType: isEveryDay ? '0' : 'custom',
        selectedDays: isEveryDay ? [] : daysArr.map(Number).filter(Boolean),
        time: timeVal,
        status: editActivity.actity_status === 1 ? 'Active' : 'Inactive',
      })
      setEditingId(editActivity.id || editActivity.activity_id)
    } else {
      setForm({ ...INITIAL_FORM })
      setEditingId(null)
    }
  }, [editActivity])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleScheduleTypeChange = (e) => {
    const value = e.target.value
    setForm((prev) => ({
      ...prev,
      scheduleType: value,
      selectedDays: value === '0' ? [] : prev.selectedDays,
    }))
  }

  const handleDayToggle = (dayValue) => {
    setForm((prev) => {
      const days = prev.selectedDays.includes(dayValue)
        ? prev.selectedDays.filter((d) => d !== dayValue)
        : [...prev.selectedDays, dayValue].sort((a, b) => a - b)
      return { ...prev, selectedDays: days }
    })
  }

  const buildDaysFlag = () => {
    if (form.scheduleType === '0') return ['0']
    return form.selectedDays.map(String)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.activityName.trim() || !form.taskType || !form.time) {
      showWarning('Activity name, task type, and time are required.')
      return
    }

    if (form.scheduleType === 'custom' && form.selectedDays.length === 0) {
      showWarning('Please select at least one day.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        actity_name: form.activityName.trim(),
        actity_type: form.taskType,
        actity_datetime: `${form.time}:00`,
        actity_desc: form.description.trim(),
        days_flag: buildDaysFlag(),
      }

      let res
      if (editingId) {
        res = await updateActivity(editingId, payload)
      } else {
        res = await addActivity({ ...payload, patient_id: patientId })
      }

      if (Number(res.code) === 0) {
        showSuccess(res.message || (editingId ? 'Activity updated!' : 'Activity created!'))
        setForm({ ...INITIAL_FORM })
        setEditingId(null)
        onSaved && onSaved()
      } else {
        showError(res.message || 'Failed to save activity.')
      }
    } catch {
      showError('Network error saving activity.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
      <CCardHeader className="bg-transparent border-bottom-0 pt-3">
        <strong>{editingId ? 'Edit Activity' : 'Add Activity'}</strong>
      </CCardHeader>
      <CCardBody>
        <CForm onSubmit={handleSubmit}>
          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel htmlFor="activityName">Activity Name</CFormLabel>
              <CFormInput
                id="activityName"
                name="activityName"
                placeholder="Enter activity name"
                value={form.activityName}
                onChange={handleChange}
                required
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel htmlFor="taskType">Task Type</CFormLabel>
              <CFormSelect
                id="taskType"
                name="taskType"
                value={form.taskType}
                onChange={handleChange}
                required
              >
                <option value="">Select task type</option>
                <option value="Exercise">Exercise</option>
                <option value="Food">Food</option>
              </CFormSelect>
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={12}>
              <CFormLabel htmlFor="description">Activity Description</CFormLabel>
              <CFormTextarea
                id="description"
                name="description"
                rows={3}
                placeholder="Enter activity description"
                value={form.description}
                onChange={handleChange}
              />
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={12}>
              <CFormLabel>Schedule Type</CFormLabel>
              <div className="d-flex gap-4">
                <CFormCheck
                  type="radio"
                  id="scheduleEveryDay"
                  name="scheduleType"
                  label="Every Day"
                  value="0"
                  checked={form.scheduleType === '0'}
                  onChange={handleScheduleTypeChange}
                />
                <CFormCheck
                  type="radio"
                  id="scheduleSelectDays"
                  name="scheduleType"
                  label="Select Days"
                  value="custom"
                  checked={form.scheduleType === 'custom'}
                  onChange={handleScheduleTypeChange}
                />
              </div>
            </CCol>
          </CRow>

          {form.scheduleType === 'custom' && (
            <CRow className="mb-3">
              <CCol md={12}>
                <CFormLabel>Select Days</CFormLabel>
                <div className="d-flex flex-wrap gap-3">
                  {Object.entries(DAY_MAP).map(([value, label]) => (
                    <CFormCheck
                      key={value}
                      id={`day-${value}`}
                      label={label}
                      checked={form.selectedDays.includes(Number(value))}
                      onChange={() => handleDayToggle(Number(value))}
                    />
                  ))}
                </div>
              </CCol>
            </CRow>
          )}

          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel htmlFor="time">Time</CFormLabel>
              <CFormInput
                type="time"
                id="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                required
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel htmlFor="status">Activity Status</CFormLabel>
              <CFormSelect
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </CFormSelect>
            </CCol>
          </CRow>

          <div className="d-flex gap-2">
            <CButton type="submit" color="primary" disabled={submitting}>
              {submitting ? <CSpinner size="sm" /> : editingId ? 'Update Activity' : 'Save Activity'}
            </CButton>
            <CButton type="button" color="secondary" variant="outline" onClick={() => {
              setForm({ ...INITIAL_FORM })
              setEditingId(null)
              onCancel && onCancel()
            }}>
              Cancel
            </CButton>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

// Default export for backward compatibility
const ActivityScheduler = ({ patientId }) => {
  const [refreshKey, setRefreshKey] = useState(0)
  const [editActivity, setEditActivity] = useState(null)
  const [showForm, setShowForm] = useState(false)

  return (
    <>
      {showForm && (
        <SchedulerForm
          patientId={patientId}
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
      <ActivitiesList
        patientId={patientId}
        refreshKey={refreshKey}
        onEdit={(activity) => {
          setEditActivity(activity)
          setShowForm(true)
        }}
      />
    </>
  )
}

export default ActivityScheduler
