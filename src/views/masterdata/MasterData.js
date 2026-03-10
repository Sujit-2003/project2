import React, { useEffect, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CForm,
  CFormInput,
  CFormTextarea,
  CFormLabel,
  CButton,
  CSpinner,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPencil,
  cilSave,
  cilX,
  cilBuilding,
  cilInfo,
  cilFile,
  cilBan,
  cilDollar,
  cilLockLocked,
  cilSettings,
} from '@coreui/icons'
import { getMasterData, updateMasterData } from '../../services/masterdataService'
import { useToast } from '../../components/ToastContext'

const MasterData = () => {
  const { showSuccess, showError } = useToast()
  const [data, setData] = useState({
    company_name: '',
    contact_number: '',
    email: '',
    about: '',
    terms: '',
    cancellation: '',
    reimbursement: '',
    privacy: '',
  })
  const [original, setOriginal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getMasterData()
      let master = null
      if (res.code === 0 && res.data) {
        master = Array.isArray(res.data) ? res.data[0] : res.data
      } else if (Array.isArray(res)) {
        master = res[0]
      } else if (res && !res.code) {
        master = res
      }

      if (master) {
        const formatted = {
          company_name: master.company_name || master.companyname || '',
          contact_number: master.contact_number || master.contactnumber || '',
          email: master.email || master.emailid || '',
          about: master.about || '',
          terms: master.terms || '',
          cancellation: master.cancellation || '',
          reimbursement: master.reimbursment || master.reimbursement || '',
          privacy: master.privacy || '',
        }
        setData(formatted)
        setOriginal(formatted)
      }
    } catch (err) {
      setError(err?.message || 'Failed to load master data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value })
  }

  const handleCancel = () => {
    if (original) setData({ ...original })
    setEditing(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await updateMasterData({
        companyname: data.company_name,
        contactnumber: data.contact_number,
        emailid: data.email,
        about: data.about,
        terms: data.terms,
        cancellation: data.cancellation,
        reimbursment: data.reimbursement,
        privacy: data.privacy,
      })
      if (Number(res.code) === 0) {
        showSuccess('Master Data Updated Successfully')
        setOriginal({ ...data })
        setEditing(false)
      } else {
        showError(res.message || 'Failed to update master data.')
      }
    } catch {
      showError('Network error updating master data.')
    } finally {
      setSaving(false)
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
    return (
      <CRow>
        <CCol xs={12}>
          <CAlert color="danger">{error}</CAlert>
        </CCol>
      </CRow>
    )
  }

  const sections = [
    { key: 'about', label: 'About Us', icon: cilInfo, iconColor: 'text-info', rows: 5 },
    { key: 'terms', label: 'Terms & Conditions', icon: cilFile, iconColor: 'text-primary', rows: 6 },
    { key: 'cancellation', label: 'Cancellation Policy', icon: cilBan, iconColor: 'text-warning', rows: 5 },
    { key: 'reimbursement', label: 'Reimbursement Policy', icon: cilDollar, iconColor: 'text-success', rows: 6 },
    { key: 'privacy', label: 'Privacy Policy', icon: cilLockLocked, iconColor: 'text-danger', rows: 6 },
  ]

  return (
    <CRow className="justify-content-center">
      <CCol lg={8}>
        {/* Page Header with Single Edit Button */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-2">
            <CIcon icon={cilSettings} height={22} className="text-primary" />
            <h5 className="mb-0 fw-bold">Master Data</h5>
          </div>
          {!editing ? (
            <CButton color="primary" onClick={() => setEditing(true)}>
              <CIcon icon={cilPencil} className="me-1" />
              Edit All
            </CButton>
          ) : (
            <div className="d-flex gap-2">
              <CButton color="primary" onClick={handleSave} disabled={saving}>
                {saving ? <CSpinner size="sm" /> : (
                  <>
                    <CIcon icon={cilSave} className="me-1" />
                    Save
                  </>
                )}
              </CButton>
              <CButton color="secondary" variant="outline" onClick={handleCancel}>
                <CIcon icon={cilX} className="me-1" />
                Cancel
              </CButton>
            </div>
          )}
        </div>

        {/* Company Profile Card */}
        <CCard className="mb-4">
          <CCardHeader>
            <div className="d-flex align-items-center gap-2">
              <CIcon icon={cilBuilding} height={18} className="text-primary" />
              <strong>Company Profile</strong>
            </div>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <div className="mb-3">
                <CFormLabel>Company Name</CFormLabel>
                <CFormInput
                  name="company_name"
                  value={data.company_name}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter company name"
                />
              </div>
              <div className="mb-3">
                <CFormLabel>Contact Number</CFormLabel>
                <CFormInput
                  name="contact_number"
                  value={data.contact_number}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter contact number"
                />
              </div>
              <div className="mb-3">
                <CFormLabel>Email</CFormLabel>
                <CFormInput
                  name="email"
                  type="email"
                  value={data.email}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter email address"
                />
              </div>
            </CForm>
          </CCardBody>
        </CCard>

        {/* Content Sections */}
        {sections.map(({ key, label, icon, iconColor, rows }) => (
          <CCard key={key} className="mb-4">
            <CCardHeader>
              <div className="d-flex align-items-center gap-2">
                <CIcon icon={icon} height={18} className={iconColor} />
                <strong>{label}</strong>
              </div>
            </CCardHeader>
            <CCardBody>
              {editing ? (
                <CFormTextarea
                  name={key}
                  value={data[key]}
                  onChange={handleChange}
                  rows={rows}
                  placeholder={`Enter ${label.toLowerCase()} content...`}
                />
              ) : data[key] ? (
                <div
                  style={{ lineHeight: '1.7', fontSize: '0.9rem', color: 'var(--suji-text-secondary)', whiteSpace: 'pre-line' }}
                  dangerouslySetInnerHTML={{ __html: data[key] }}
                />
              ) : (
                <div className="suji-empty-state">No {label.toLowerCase()} content available.</div>
              )}
            </CCardBody>
          </CCard>
        ))}

        {/* Bottom Save/Cancel for long pages */}
        {editing && (
          <div className="d-flex justify-content-end gap-2 mb-4">
            <CButton color="primary" onClick={handleSave} disabled={saving}>
              {saving ? <CSpinner size="sm" /> : (
                <>
                  <CIcon icon={cilSave} className="me-1" />
                  Save
                </>
              )}
            </CButton>
            <CButton color="secondary" variant="outline" onClick={handleCancel}>
              <CIcon icon={cilX} className="me-1" />
              Cancel
            </CButton>
          </div>
        )}
      </CCol>
    </CRow>
  )
}

export default MasterData
