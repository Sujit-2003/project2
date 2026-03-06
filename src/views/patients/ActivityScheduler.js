import React, { useState } from 'react'
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

// TODO: Replace with backend API when available

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

const ActivityScheduler = ({ patientId }) => {
  const [activities, setActivities] = useState([])
  const [form, setForm] = useState({ ...INITIAL_FORM })
  const [editingId, setEditingId] = useState(null)

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

  const resetForm = () => {
    setForm({ ...INITIAL_FORM })
    setEditingId(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!form.activityName.trim() || !form.taskType || !form.time) return

    if (form.scheduleType === 'custom' && form.selectedDays.length === 0) return

    const daysValue = form.scheduleType === '0' ? '0' : form.selectedDays.join(',')

    const activity = {
      id: editingId || Date.now(),
      patientId,
      activityName: form.activityName.trim(),
      description: form.description.trim(),
      taskType: form.taskType,
      days: daysValue,
      time: form.time,
      status: form.status,
    }

    if (editingId) {
      setActivities((prev) => prev.map((a) => (a.id === editingId ? activity : a)))
    } else {
      setActivities((prev) => [...prev, activity])
    }

    resetForm()
  }

  const handleEdit = (activity) => {
    const isEveryDay = activity.days === '0'
    setForm({
      activityName: activity.activityName,
      description: activity.description,
      taskType: activity.taskType,
      scheduleType: isEveryDay ? '0' : 'custom',
      selectedDays: isEveryDay ? [] : activity.days.split(',').map(Number),
      time: activity.time,
      status: activity.status,
    })
    setEditingId(activity.id)
  }

  const handleDelete = (id) => {
    setActivities((prev) => prev.filter((a) => a.id !== id))
    if (editingId === id) resetForm()
  }

  const formatDays = (days) => {
    if (days === '0') return 'Every Day'
    return days
      .split(',')
      .map((d) => DAY_MAP[Number(d)] || d)
      .join(', ')
  }

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader>
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
              <CButton type="submit" color="primary">
                {editingId ? 'Update Activity' : 'Save Activity'}
              </CButton>
              {editingId && (
                <CButton type="button" color="secondary" variant="outline" onClick={resetForm}>
                  Cancel
                </CButton>
              )}
            </div>
          </CForm>
        </CCardBody>
      </CCard>

      <CCard className="mb-4">
        <CCardHeader>
          <strong>Scheduled Activities</strong>
        </CCardHeader>
        <CCardBody>
          {activities.length === 0 ? (
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
                  <CTableRow key={activity.id}>
                    <CTableDataCell>{activity.activityName}</CTableDataCell>
                    <CTableDataCell>{activity.taskType}</CTableDataCell>
                    <CTableDataCell>{formatDays(activity.days)}</CTableDataCell>
                    <CTableDataCell>{activity.time}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={activity.status === 'Active' ? 'success' : 'secondary'}>
                        {activity.status}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CButton
                        color="info"
                        variant="outline"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEdit(activity)}
                      >
                        <CIcon icon={cilPencil} size="sm" /> Edit
                      </CButton>
                      <CButton
                        color="danger"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(activity.id)}
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
    </>
  )
}

export default ActivityScheduler
