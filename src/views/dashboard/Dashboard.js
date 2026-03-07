import React, { useEffect, useState, useCallback } from 'react'
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
  CAvatar,
  CBadge,
  CCloseButton,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPeople,
  cilUser,
  cilPlus,
  cilChildFriendly,
  cilTask,
  cilBell,
  cilCheckCircle,
  cilClock,
  cilMediaPlay,
  cilUserFollow,
} from '@coreui/icons'
import { CChartBar, CChartDoughnut } from '@coreui/react-chartjs'
import { getRoleId, getUmId, getAdminId } from '../../services/authService'
import { getUsers } from '../../services/userService'
import { getPatients, getAllPatientsWithParent } from '../../services/patientService'
import { getActivities } from '../../services/activityService'
import { getReminders } from '../../services/reminderService'
import { decryptField, decryptSafe } from '../../services/encryptionService'
import { getCountries } from '../../services/countryService'
import { formatPatientContact } from '../../utils/countryUtils'

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

function getTodayDayNumber() {
  const day = new Date().getDay()
  return day === 0 ? 7 : day
}

function formatTime12h(timeStr) {
  if (!timeStr) return '-'
  const parts = timeStr.split(':')
  if (parts.length < 2) return timeStr
  let h = parseInt(parts[0], 10)
  const m = parts[1]
  const ampm = h >= 12 ? 'PM' : 'AM'
  if (h > 12) h -= 12
  if (h === 0) h = 12
  return `${h}:${m} ${ampm}`
}

function isTaskForToday(daysFlag) {
  const today = getTodayDayNumber()
  if (!daysFlag || daysFlag === '0') return true
  return daysFlag.split(',').map(Number).includes(today)
}

function isDueSoon(timeStr) {
  if (!timeStr) return false
  const now = new Date()
  const parts = timeStr.split(':')
  if (parts.length < 2) return false
  const taskDate = new Date()
  taskDate.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0)
  const diffMs = taskDate.getTime() - now.getTime()
  return diffMs > 0 && diffMs <= 30 * 60 * 1000
}

function isTaskPast(timeStr) {
  if (!timeStr) return false
  const now = new Date()
  const parts = timeStr.split(':')
  if (parts.length < 2) return false
  const taskDate = new Date()
  taskDate.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0)
  return taskDate.getTime() < now.getTime()
}

const StatCard = ({ icon, color, label, count }) => (
  <CCard className="mb-3 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
    <CCardBody className="d-flex align-items-center gap-3 py-4">
      <div
        className={`rounded-circle d-flex align-items-center justify-content-center bg-${color} bg-opacity-10`}
        style={{ width: 56, height: 56 }}
      >
        <CIcon icon={icon} height={28} className={`text-${color}`} />
      </div>
      <div>
        <div className="fs-3 fw-bold">{count}</div>
        <div className="text-body-secondary small text-uppercase fw-semibold">{label}</div>
      </div>
    </CCardBody>
  </CCard>
)

const Dashboard = () => {
  const navigate = useNavigate()
  const roleId = getRoleId()
  const isAdmin = roleId === 2

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Admin state
  const [users, setUsers] = useState([])
  const [allPatients, setAllPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [adminActivityCount, setAdminActivityCount] = useState(0)

  // Parent state
  const [patients, setPatients] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [reminders, setReminders] = useState([])
  const [activeAlert, setActiveAlert] = useState(null)
  const [dismissedAlerts, setDismissedAlerts] = useState([])

  const [countries, setCountries] = useState([])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')
      try {
        const countryData = await getCountries()
        setCountries(countryData)

        if (isAdmin) {
          const userRes = await getUsers(1)
          let allUsers = []
          if (Array.isArray(userRes)) allUsers = userRes
          else if (Array.isArray(userRes.data)) allUsers = userRes.data
          const adminId = getAdminId()
          const filtered = allUsers.filter((u) => u.id !== adminId)
          setUsers(filtered)
          const pts = await getAllPatientsWithParent(filtered)
          setAllPatients(pts)

          // Fetch doctors
          const doctorRes = await getUsers(3)
          let doctorList = []
          if (Array.isArray(doctorRes)) doctorList = doctorRes
          else if (Array.isArray(doctorRes.data)) doctorList = doctorRes.data
          setDoctors(doctorList)

          // Fetch activities for all patients
          let totalActivities = 0
          for (const p of pts) {
            try {
              const actRes = await getActivities(p.id)
              if (Number(actRes.code) === 0 && Array.isArray(actRes.data)) {
                totalActivities += actRes.data.length
              }
            } catch {}
          }
          setAdminActivityCount(totalActivities)
        } else {
          const umId = getUmId()
          const [patientRes, reminderRes] = await Promise.all([
            getPatients(umId),
            getReminders(umId, 1),
          ])

          let patientList = []
          if (Number(patientRes.code) === 0 && Array.isArray(patientRes.data)) {
            patientList = patientRes.data
          }
          setPatients(patientList)

          if (Number(reminderRes.code) === 0 && Array.isArray(reminderRes.data)) {
            setReminders(reminderRes.data)
          }

          // Fetch activities for all patients in parallel
          const activityPromises = patientList.map(async (p) => {
            try {
              const res = await getActivities(p.id)
              const activities = Number(res.code) === 0 && Array.isArray(res.data)
                ? res.data
                : Array.isArray(res.data) ? res.data : []
              return activities.map((a) => ({
                ...a,
                _patientName: `${p.patient_fname} ${p.patient_lname}`,
                _patientId: p.id,
              }))
            } catch {
              return []
            }
          })
          const results = await Promise.all(activityPromises)
          setAllTasks(results.flat())
        }
      } catch (err) {
        setError(err?.message || 'Failed to load data.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [isAdmin])

  // Check for due-soon alerts
  useEffect(() => {
    if (isAdmin || allTasks.length === 0) return
    const interval = setInterval(() => {
      const todayTasks = allTasks.filter((t) => isTaskForToday(t.days_flag))
      const dueSoon = todayTasks.find(
        (t) => isDueSoon(t.actity_datetime) && !dismissedAlerts.includes(t.id),
      )
      if (dueSoon) setActiveAlert(dueSoon)
    }, 30000)
    // Check immediately
    const todayTasks = allTasks.filter((t) => isTaskForToday(t.days_flag))
    const dueSoon = todayTasks.find(
      (t) => isDueSoon(t.actity_datetime) && !dismissedAlerts.includes(t.id),
    )
    if (dueSoon) setActiveAlert(dueSoon)
    return () => clearInterval(interval)
  }, [allTasks, isAdmin, dismissedAlerts])

  const dismissAlert = useCallback(() => {
    if (activeAlert) {
      setDismissedAlerts((prev) => [...prev, activeAlert.id])
      setActiveAlert(null)
    }
  }, [activeAlert])

  const renderContact = (contact, countryId) => {
    const countryObj = countries.find((c) => Number(c.country_id) === Number(countryId))
    const { display } = formatPatientContact(contact, countryObj)
    return display
  }

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

  // ─── Admin Dashboard ───
  if (isAdmin) {
    const maleCount = allPatients.filter((p) => p.user_gender === 'Male').length
    const femaleCount = allPatients.filter((p) => p.user_gender === 'Female').length
    const otherCount = allPatients.length - maleCount - femaleCount

    const adminStatCards = [
      {
        icon: cilPeople,
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        label: 'Parents',
        count: users.length,
      },
      {
        icon: cilChildFriendly,
        gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        label: 'Patients',
        count: allPatients.length,
      },
      {
        icon: cilUserFollow,
        gradient: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
        label: 'Doctors',
        count: doctors.length,
      },
      {
        icon: cilTask,
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        label: 'Activities',
        count: adminActivityCount,
      },
    ]

    return (
      <>
        {/* ─── Gradient Stat Cards ─── */}
        <CRow className="mb-4" xs={{ gutter: 4 }}>
          {adminStatCards.map((card, idx) => (
            <CCol sm={6} lg={3} key={idx}>
              <CCard
                className="mb-3 border-0"
                style={{
                  borderRadius: '16px',
                  background: card.gradient,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  transition: 'transform 0.3s ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <CCardBody className="d-flex align-items-center gap-3 py-4 px-4">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: 56,
                      height: 56,
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      flexShrink: 0,
                    }}
                  >
                    <CIcon icon={card.icon} height={28} style={{ color: '#fff' }} />
                  </div>
                  <div>
                    <div className="fs-2 fw-bold" style={{ color: '#fff' }}>{card.count}</div>
                    <div className="small text-uppercase fw-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      {card.label}
                    </div>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          ))}
        </CRow>

        {/* ─── Charts Section ─── */}
        <CRow className="mb-4" xs={{ gutter: 4 }}>
          <CCol md={7}>
            <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
              <CCardHeader className="bg-transparent border-bottom-0 pt-3">
                <strong>Registration Overview</strong>
              </CCardHeader>
              <CCardBody>
                <CChartBar
                  data={{
                    labels: ['Parents', 'Patients', 'Doctors'],
                    datasets: [
                      {
                        label: 'Count',
                        backgroundColor: ['#667eea', '#38ef7d', '#a855f7'],
                        data: [users.length, allPatients.length, doctors.length],
                        borderRadius: 8,
                        barThickness: 48,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                      },
                    },
                  }}
                />
              </CCardBody>
            </CCard>
          </CCol>
          <CCol md={5}>
            <CCard className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
              <CCardHeader className="bg-transparent border-bottom-0 pt-3">
                <strong>Gender Distribution</strong>
              </CCardHeader>
              <CCardBody className="d-flex align-items-center justify-content-center">
                {allPatients.length === 0 ? (
                  <p className="text-body-secondary mb-0">No patient data available.</p>
                ) : (
                  <CChartDoughnut
                    data={{
                      labels: ['Male', 'Female', 'Other'],
                      datasets: [
                        {
                          data: [maleCount, femaleCount, otherCount],
                          backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56'],
                          hoverBackgroundColor: ['#2b8ad4', '#e8577a', '#e6b94d'],
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      cutout: '70%',
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                      },
                    }}
                  />
                )}
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>

        {/* ─── Recent Users ─── */}
        <CCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
          <CCardHeader className="bg-transparent border-bottom-0 pt-3"><strong>Recent Users</strong></CCardHeader>
          <CCardBody>
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>Photo</CTableHeaderCell>
                  <CTableHeaderCell>Username</CTableHeaderCell>
                  <CTableHeaderCell>Email ID</CTableHeaderCell>
                  <CTableHeaderCell>Register Date</CTableHeaderCell>
                  <CTableHeaderCell>Country</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {users.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={6} className="text-center text-muted">No users found.</CTableDataCell>
                  </CTableRow>
                ) : (
                  users.slice(0, 5).map((user, index) => (
                    <CTableRow key={user.id || index}>
                      <CTableDataCell>{index + 1}</CTableDataCell>
                      <CTableDataCell>
                        <CAvatar color="secondary" size="md"><CIcon icon={cilUser} /></CAvatar>
                      </CTableDataCell>
                      <CTableDataCell>{decryptField(user.username || user.name)}</CTableDataCell>
                      <CTableDataCell>{decryptSafe(user.emailid || user.email)}</CTableDataCell>
                      <CTableDataCell>{user.cdate || user.creationDate || '-'}</CTableDataCell>
                      <CTableDataCell>{user.countryid || user.country || '-'}</CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>

        {/* ─── Recent Patients ─── */}
        {allPatients.length > 0 && (
          <CCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <CCardHeader className="bg-transparent border-bottom-0 pt-3"><strong>Recent Patients</strong></CCardHeader>
            <CCardBody>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>#</CTableHeaderCell>
                    <CTableHeaderCell>Name</CTableHeaderCell>
                    <CTableHeaderCell>Parent</CTableHeaderCell>
                    <CTableHeaderCell>Relationship</CTableHeaderCell>
                    <CTableHeaderCell>Age</CTableHeaderCell>
                    <CTableHeaderCell>Gender</CTableHeaderCell>
                    <CTableHeaderCell>Contact</CTableHeaderCell>
                    <CTableHeaderCell>Details</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {allPatients.slice(0, 5).map((p, index) => {
                    const contact = p.contact_number || p.contact_numb || ''
                    const parentName = decryptField(p._parent?.username || p._parent?.name || '')
                    return (
                      <CTableRow key={p.id || index}>
                        <CTableDataCell>{index + 1}</CTableDataCell>
                        <CTableDataCell>{p.patient_fname} {p.patient_lname}</CTableDataCell>
                        <CTableDataCell>
                          <CButton color="link" size="sm" className="p-0 text-decoration-none" onClick={() => navigate(`/users/${p.um_id}`)}>
                            {parentName || '-'}
                          </CButton>
                        </CTableDataCell>
                        <CTableDataCell>{p.p_relationship}</CTableDataCell>
                        <CTableDataCell>{calculateAge(p.p_dob)}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={p.user_gender === 'Male' ? 'info' : 'warning'}>{p.user_gender}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>{renderContact(contact, p.country_id)}</CTableDataCell>
                        <CTableDataCell>
                          <CButton color="primary" variant="ghost" size="sm" onClick={() => navigate(`/patients/${p.id}`)} title="View Details">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        )}
      </>
    )
  }

  // ─── Parent Dashboard ───
  const todayTasks = allTasks.filter((t) => isTaskForToday(t.days_flag))
  const todayTasksSorted = [...todayTasks].sort((a, b) =>
    (a.actity_datetime || '').localeCompare(b.actity_datetime || ''),
  )
  const completedTasks = allTasks.filter((t) => t.actity_status === 0)
  const upcomingTasks = allTasks
    .filter((t) => t.actity_status === 1)
    .sort((a, b) => (a.actity_datetime || '').localeCompare(b.actity_datetime || ''))

  return (
    <>
      {/* ─── Top Alert Bar ─── */}
      {activeAlert && (
        <CAlert
          color="danger"
          className="d-flex align-items-center justify-content-between mb-3 shadow-sm"
          style={{ borderRadius: '10px' }}
        >
          <div className="d-flex align-items-center gap-2">
            <CIcon icon={cilBell} height={20} />
            <strong>Reminder:</strong>
            <span>
              Patient {activeAlert._patientName} — {activeAlert.actity_name} now ({formatTime12h(activeAlert.actity_datetime)})
            </span>
          </div>
          <div className="d-flex gap-2">
            <CButton
              color="danger"
              size="sm"
              variant="outline"
              onClick={() => navigate(`/patients/${activeAlert._patientId}`)}
            >
              View Task
            </CButton>
            <CCloseButton onClick={dismissAlert} />
          </div>
        </CAlert>
      )}

      {/* ─── Reminder Notifications ─── */}
      {reminders.length > 0 && reminders.slice(0, 3).map((r, i) => (
        <CAlert
          key={i}
          color="warning"
          className="d-flex align-items-center justify-content-between mb-2"
          style={{ borderRadius: '10px' }}
        >
          <div>
            <strong>Reminder:</strong>{' '}
            {r.activity || r.message} — {r.activity_type || r.type} at {formatTime12h(r.time)}
            {r.patient_id && <span className="text-muted ms-2">(Patient #{r.patient_id})</span>}
          </div>
          <CButton
            color="warning"
            size="sm"
            variant="outline"
            onClick={() => r.patient_id && navigate(`/patients/${r.patient_id}`)}
          >
            View
          </CButton>
        </CAlert>
      ))}

      {/* ─── 1. Summary Cards ─── */}
      <CRow className="mb-4" xs={{ gutter: 3 }}>
        <CCol xs={6} lg={3}>
          <StatCard icon={cilChildFriendly} color="primary" label="Total Patients" count={patients.length} />
        </CCol>
        <CCol xs={6} lg={3}>
          <StatCard icon={cilTask} color="info" label="Today's Tasks" count={todayTasks.length} />
        </CCol>
        <CCol xs={6} lg={3}>
          <StatCard icon={cilBell} color="warning" label="Upcoming Reminders" count={reminders.length} />
        </CCol>
        <CCol xs={6} lg={3}>
          <StatCard icon={cilCheckCircle} color="success" label="Completed Tasks" count={completedTasks.length} />
        </CCol>
      </CRow>

      {/* ─── 2. Today's Schedule (Timeline) ─── */}
      <CCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
        <CCardHeader className="bg-transparent border-bottom-0 pt-3">
          <div className="d-flex align-items-center gap-2">
            <CIcon icon={cilClock} height={20} className="text-primary" />
            <strong>Today&apos;s Patient Schedule</strong>
          </div>
        </CCardHeader>
        <CCardBody>
          {todayTasksSorted.length === 0 ? (
            <p className="text-body-secondary mb-0">No tasks scheduled for today.</p>
          ) : (
            <div className="position-relative" style={{ paddingLeft: '40px' }}>
              {/* Vertical line */}
              <div
                className="position-absolute bg-primary bg-opacity-25"
                style={{ left: '18px', top: '8px', bottom: '8px', width: '2px' }}
              />
              {todayTasksSorted.map((task, idx) => {
                const dueSoon = isDueSoon(task.actity_datetime)
                const past = isTaskPast(task.actity_datetime)
                return (
                  <div key={task.id || idx} className="d-flex align-items-start mb-3 position-relative">
                    {/* Timeline dot */}
                    <div
                      className={`position-absolute rounded-circle ${
                        dueSoon ? 'bg-warning' : past ? 'bg-secondary' : 'bg-primary'
                      }`}
                      style={{
                        left: '-28px',
                        top: '6px',
                        width: '12px',
                        height: '12px',
                        border: '2px solid white',
                        boxShadow: '0 0 0 2px ' + (dueSoon ? '#f9b115' : past ? '#9da5b1' : '#321fdb'),
                      }}
                    />
                    <div
                      className={`flex-grow-1 p-3 rounded-3 ${
                        dueSoon ? 'bg-warning bg-opacity-10 border border-warning border-opacity-25' :
                        past ? 'bg-light' : 'bg-primary bg-opacity-10'
                      }`}
                    >
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                          <span className="fw-semibold">{formatTime12h(task.actity_datetime)}</span>
                          <span className="mx-2">—</span>
                          <span>{task.actity_name}</span>
                          <span className="text-body-secondary ms-2">
                            · Patient: {task._patientName}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          {dueSoon && (
                            <CBadge color="warning" shape="rounded-pill" className="text-dark">
                              DUE SOON
                            </CBadge>
                          )}
                          <CBadge color={task.actity_type === 'Food' ? 'success' : 'info'} shape="rounded-pill">
                            {task.actity_type}
                          </CBadge>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* ─── 3. Upcoming Patient Tasks ─── */}
      <CCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
        <CCardHeader className="bg-transparent border-bottom-0 pt-3">
          <div className="d-flex align-items-center gap-2">
            <CIcon icon={cilTask} height={20} className="text-info" />
            <strong>Upcoming Patient Tasks</strong>
          </div>
        </CCardHeader>
        <CCardBody>
          {upcomingTasks.length === 0 ? (
            <p className="text-body-secondary mb-0">No upcoming tasks.</p>
          ) : (
            <CTable hover responsive align="middle">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Patient Name</CTableHeaderCell>
                  <CTableHeaderCell>Task Name</CTableHeaderCell>
                  <CTableHeaderCell>Task Type</CTableHeaderCell>
                  <CTableHeaderCell>Scheduled Time</CTableHeaderCell>
                  <CTableHeaderCell>Days</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {upcomingTasks.slice(0, 10).map((task) => {
                  const dueSoon = isDueSoon(task.actity_datetime) && isTaskForToday(task.days_flag)
                  return (
                    <CTableRow key={task.id}>
                      <CTableDataCell className="fw-semibold">{task._patientName}</CTableDataCell>
                      <CTableDataCell>
                        {task.actity_name}
                        {dueSoon && (
                          <CBadge color="warning" className="ms-2 text-dark" shape="rounded-pill">
                            DUE SOON
                          </CBadge>
                        )}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={task.actity_type === 'Food' ? 'success' : task.actity_type === 'Exercise' ? 'info' : 'primary'} shape="rounded-pill">
                          {task.actity_type}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>{formatTime12h(task.actity_datetime)}</CTableDataCell>
                      <CTableDataCell>
                        {task.days_flag === '0'
                          ? 'Every Day'
                          : task.days_flag
                              ?.split(',')
                              .map((d) => DAY_MAP[Number(d)] || d)
                              .join(', ')}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={task.actity_status === 1 ? 'primary' : 'secondary'} shape="rounded-pill">
                          {task.actity_status === 1 ? 'Active' : 'Inactive'}
                        </CBadge>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* ─── 4. Patients Overview ─── */}
      <CCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: '12px' }}>
        <CCardHeader className="bg-transparent border-bottom-0 pt-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <CIcon icon={cilChildFriendly} height={20} className="text-primary" />
            <strong>Patients Overview</strong>
          </div>
          <CButton color="primary" size="sm" onClick={() => navigate('/patients/add')}>
            <CIcon icon={cilPlus} className="me-1" />
            Add Patient
          </CButton>
        </CCardHeader>
        <CCardBody>
          {patients.length === 0 ? (
            <p className="text-body-secondary mb-0">No patients found. Add your first patient.</p>
          ) : (
            <CRow xs={{ gutter: 3 }}>
              {patients.map((p) => {
                const age = calculateAge(p.p_dob)
                const patientTasks = allTasks.filter(
                  (t) => t._patientId === p.id && isTaskForToday(t.days_flag),
                )
                const nextTask = patientTasks
                  .filter((t) => !isTaskPast(t.actity_datetime))
                  .sort((a, b) => (a.actity_datetime || '').localeCompare(b.actity_datetime || ''))[0]

                return (
                  <CCol sm={6} lg={4} xl={3} key={p.id}>
                    <CCard
                      className="h-100 border-0 shadow-sm"
                      style={{ borderRadius: '12px', transition: 'transform 0.2s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                      <CCardBody className="text-center py-4">
                        <CAvatar
                          color={p.user_gender === 'Male' ? 'info' : 'warning'}
                          size="xl"
                          className="mb-3"
                          style={{ width: '64px', height: '64px', fontSize: '24px' }}
                        >
                          {(p.patient_fname || '')[0]?.toUpperCase()}
                          {(p.patient_lname || '')[0]?.toUpperCase()}
                        </CAvatar>
                        <h6 className="mb-1">{p.patient_fname} {p.patient_lname}</h6>
                        <div className="text-body-secondary small mb-2">
                          {age ? `${age} yrs` : '-'} · {p.user_gender}
                        </div>
                        <div className="small mb-1">
                          <CBadge color="light" textColor="dark" className="me-1">
                            {p.p_relationship || '-'}
                          </CBadge>
                        </div>
                        {nextTask ? (
                          <div
                            className="small mt-2 p-2 rounded-2 bg-primary bg-opacity-10"
                            style={{ fontSize: '0.8rem' }}
                          >
                            <CIcon icon={cilClock} height={12} className="me-1 text-primary" />
                            Next: {nextTask.actity_name} at {formatTime12h(nextTask.actity_datetime)}
                          </div>
                        ) : (
                          <div className="small mt-2 text-body-secondary" style={{ fontSize: '0.8rem' }}>
                            No tasks today
                          </div>
                        )}
                        <CButton
                          color="primary"
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => navigate(`/patients/${p.id}`)}
                        >
                          View Details
                        </CButton>
                      </CCardBody>
                    </CCard>
                  </CCol>
                )
              })}
            </CRow>
          )}
        </CCardBody>
      </CCard>
    </>
  )
}

export default Dashboard
