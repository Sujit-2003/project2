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
} from '@coreui/react'
import { useToast } from '../../components/ToastContext'
import { getAuthHeaders, getAdminId, safeJson } from '../../services/authService'
import { encrypt } from '../../services/encryptionService'
import environment from '../../config/environment'

const API_URL = environment.apiBaseUrl

const ChangePassword = () => {
  const navigate = useNavigate()
  const { showSuccess, showError, showWarning } = useToast()
  const [submitting, setSubmitting] = useState(false)
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

    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      showWarning('All fields are required.')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      showError('New password and confirm password do not match.')
      return
    }
    if (form.newPassword.length < 6) {
      showWarning('New password must be at least 6 characters.')
      return
    }

    setSubmitting(true)
    try {
      const userId = getAdminId()

      // Try with plain passwords first (legacy admin), then encrypted
      let res = await safeJson(
        await fetch(`${API_URL}/change-password/${userId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            old_password: form.oldPassword,
            new_password: form.newPassword,
            confirm_password: form.confirmPassword,
          }),
        }),
      )

      if (Number(res.code) !== 0) {
        // Retry with encrypted passwords
        res = await safeJson(
          await fetch(`${API_URL}/change-password/${userId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              old_password: encrypt(form.oldPassword),
              new_password: encrypt(form.newPassword),
              confirm_password: encrypt(form.confirmPassword),
            }),
          }),
        )
      }

      if (Number(res.code) === 0) {
        showSuccess(res.message || 'Password changed successfully!')
        setForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        showError(res.message || 'Failed to change password.')
      }
    } catch {
      showError('Failed to change password. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CRow className="justify-content-center">
      <CCol lg={6}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Change Password</strong>
          </CCardHeader>
          <CCardBody>
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
