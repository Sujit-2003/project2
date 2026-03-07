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
import { cilPencil, cilSave, cilX, cilBuilding, cilInfo } from '@coreui/icons'
import { getMasterData, updateMasterData } from '../../services/masterdataService'
import { useToast } from '../../components/ToastContext'

const MasterData = () => {
  const { showSuccess, showError } = useToast()
  const [data, setData] = useState({
    company_name: '',
    contact_number: '',
    email: '',
    about: '',
  })
  const [original, setOriginal] = useState(null)
  const [rawMaster, setRawMaster] = useState(null)
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
        setRawMaster(master)
        const formatted = {
          company_name: master.company_name || master.companyname || '',
          contact_number: master.contact_number || master.contactnumber || '',
          email: master.email || master.emailid || '',
          about: master.about || '',
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
    if (original) {
      setData({ ...original })
    }
    setEditing(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await updateMasterData(data)
      if (Number(res.code) === 0) {
        showSuccess(res.message || 'Master data updated successfully!')
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

  return (
    <CRow className="justify-content-center">
      <CCol lg={8}>
        {/* Company Profile Card */}
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <CIcon icon={cilBuilding} height={18} className="text-primary" />
              <strong>Company Profile</strong>
            </div>
            {!editing ? (
              <CButton color="primary" size="sm" onClick={() => setEditing(true)}>
                <CIcon icon={cilPencil} className="me-1" />
                Edit
              </CButton>
            ) : (
              <CButton color="secondary" size="sm" variant="outline" onClick={handleCancel}>
                <CIcon icon={cilX} className="me-1" />
                Cancel
              </CButton>
            )}
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={handleSave}>
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
              {editing && (
                <div className="d-flex gap-2">
                  <CButton color="primary" type="submit" disabled={saving}>
                    {saving ? <CSpinner size="sm" /> : (
                      <>
                        <CIcon icon={cilSave} className="me-1" />
                        Save
                      </>
                    )}
                  </CButton>
                  <CButton color="secondary" variant="outline" onClick={handleCancel}>
                    Cancel
                  </CButton>
                </div>
              )}
            </CForm>
          </CCardBody>
        </CCard>

        {/* About Us Section */}
        <CCard className="mb-4">
          <CCardHeader>
            <div className="d-flex align-items-center gap-2">
              <CIcon icon={cilInfo} height={18} className="text-info" />
              <strong>About Us</strong>
            </div>
          </CCardHeader>
          <CCardBody>
            {data.about ? (
              <div
                style={{ lineHeight: '1.7', fontSize: '0.9rem', color: 'var(--suji-text-secondary)' }}
                dangerouslySetInnerHTML={{ __html: data.about }}
              />
            ) : (
              <div className="suji-empty-state">
                No "About Us" content available. {editing ? 'Add content using the About field above.' : 'Click "Edit" to add content.'}
              </div>
            )}
            {editing && (
              <div className="mt-3">
                <CFormLabel>Edit About Content</CFormLabel>
                <CFormTextarea
                  name="about"
                  value={data.about}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Enter about section content"
                />
              </div>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default MasterData
