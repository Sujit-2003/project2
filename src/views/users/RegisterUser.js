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
  CFormSelect,
  CFormCheck,
  CButton,
  CSpinner,
  CAlert,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'
import { registerUser } from '../../services/userService'

const countryCodes = [
  { code: '+91', label: '+91 (India)', countryid: 1 },
  { code: '+1', label: '+1 (USA)', countryid: 2 },
  { code: '+44', label: '+44 (UK)', countryid: 3 },
  { code: '+61', label: '+61 (Australia)', countryid: 4 },
  { code: '+971', label: '+971 (UAE)', countryid: 5 },
  { code: '+65', label: '+65 (Singapore)', countryid: 6 },
  { code: '+49', label: '+49 (Germany)', countryid: 7 },
  { code: '+33', label: '+33 (France)', countryid: 8 },
  { code: '+81', label: '+81 (Japan)', countryid: 9 },
  { code: '+86', label: '+86 (China)', countryid: 10 },
]

const RegisterUser = () => {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [form, setForm] = useState({
    name: '',
    emailId: '',
    countryCodeIndex: '0',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.name || !form.emailId || !form.phone || !form.password) {
      setError('All fields are required.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!termsAccepted) {
      setError('You must accept the Terms and Conditions.')
      return
    }

    setSubmitting(true)
    try {
      const selected = countryCodes[Number(form.countryCodeIndex)]
      const res = await registerUser({
        name: form.name,
        emailId: form.emailId,
        contactNumber: `${selected.code}${form.phone}`,
        password: form.password,
        countryid: selected.countryid,
      })
      if (Number(res.code) === 0) {
        setSuccess(res.message || 'User registered successfully!')
        setTimeout(() => navigate('/users'), 1500)
      } else {
        setError(res.message || 'Registration failed.')
      }
    } catch {
      setError('Network error during registration.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CRow className="justify-content-center">
      <CCol lg={8}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Register User</strong>
          </CCardHeader>
          <CCardBody>
            {error && <CAlert color="danger">{error}</CAlert>}
            {success && <CAlert color="success">{success}</CAlert>}
            <CForm onSubmit={handleSubmit}>
              <CRow>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>Name</CFormLabel>
                    <CFormInput name="name" value={form.name} onChange={handleChange} required />
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>Email</CFormLabel>
                    <CFormInput
                      type="email"
                      name="emailId"
                      value={form.emailId}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </CCol>
              </CRow>
              <CRow>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>Phone</CFormLabel>
                    <CInputGroup>
                      <CFormSelect
                        name="countryCodeIndex"
                        value={form.countryCodeIndex}
                        onChange={handleChange}
                        style={{ maxWidth: '160px' }}
                      >
                        {countryCodes.map((c, i) => (
                          <option key={i} value={i}>
                            {c.label}
                          </option>
                        ))}
                      </CFormSelect>
                      <CFormInput
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="Phone number"
                        required
                      />
                    </CInputGroup>
                  </div>
                </CCol>
              </CRow>
              <CRow>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>Password</CFormLabel>
                    <CFormInput
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>Confirm Password</CFormLabel>
                    <CFormInput
                      type="password"
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </CCol>
              </CRow>
              <div className="mb-3">
                <CFormCheck
                  id="termsCheck"
                  label="I agree to the Terms and Conditions"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
              </div>
              <div className="d-flex gap-2">
                <CButton
                  color="primary"
                  type="submit"
                  disabled={submitting || !termsAccepted}
                >
                  {submitting ? <CSpinner size="sm" /> : 'Register'}
                </CButton>
                <CButton color="secondary" onClick={() => navigate('/users')}>
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

export default RegisterUser
