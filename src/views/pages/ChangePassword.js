import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CForm,
  CFormInput,
  CFormLabel,
  CButton,
  CSpinner,
  CAlert,
} from '@coreui/react'

const ChangePassword = () => {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      setError('All fields are required.')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirm password do not match.')
      return
    }
    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }

    setSubmitting(true)
    // Mock submit — no backend endpoint yet
    setTimeout(() => {
      setSubmitting(false)
      setSuccess('Password changed successfully! (mock)')
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
    }, 1000)
  }

  return (
    <CRow className="justify-content-center">
      <CCol lg={6}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Change Password</strong>
          </CCardHeader>
          <CCardBody>
            {error && <CAlert color="danger">{error}</CAlert>}
            {success && <CAlert color="success">{success}</CAlert>}
            <CForm onSubmit={handleSubmit}>
              <div className="mb-3">
                <CFormLabel>Old Password</CFormLabel>
                <CFormInput
                  type="password"
                  name="oldPassword"
                  value={form.oldPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <CFormLabel>New Password</CFormLabel>
                <CFormInput
                  type="password"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <CFormLabel>Confirm New Password</CFormLabel>
                <CFormInput
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="d-flex gap-2">
                <CButton color="primary" type="submit" disabled={submitting}>
                  {submitting ? <CSpinner size="sm" /> : 'Change Password'}
                </CButton>
                <CButton color="secondary" onClick={() => navigate(-1)}>
                  Cancel
                </CButton>
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default ChangePassword
