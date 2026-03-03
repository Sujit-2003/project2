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
  CInputGroup,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import { registerUser } from '../../services/userService'
import { getTermsAndConditions } from '../../services/termsService'
import { useToast } from '../../components/ToastContext'

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
  const { showSuccess, showError, showWarning } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Terms modal state
  const [termsVisible, setTermsVisible] = useState(false)
  const [termsContent, setTermsContent] = useState(null)
  const [termsLoading, setTermsLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    emailId: '',
    countryCodeIndex: '0',
    phone: '',
    password: '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleOpenTerms = async () => {
    setTermsVisible(true)
    setTermsLoading(true)
    try {
      const data = await getTermsAndConditions()
      setTermsContent(data)
    } catch {
      setTermsContent({ title: 'Terms and Conditions', content: 'Failed to load terms.' })
    } finally {
      setTermsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name || !form.emailId || !form.phone || !form.password) {
      showWarning('All fields are required.')
      return
    }
    if (!form.emailId.includes('@')) {
      showWarning('Please enter a valid email address.')
      return
    }
    if (form.password.length < 6) {
      showWarning('Password must be at least 6 characters.')
      return
    }
    if (!termsAccepted) {
      showError('You must accept Terms and Conditions to register.')
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
        showSuccess(res.message || 'User registered successfully!')
        setTimeout(() => navigate('/users'), 1500)
      } else {
        showError(res.message || 'Registration failed.')
      }
    } catch {
      showError('Network error during registration.')
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
              </CRow>
              <div className="mb-3">
                <CFormCheck
                  id="termsCheck"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  label={
                    <span>
                      I agree to the{' '}
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          handleOpenTerms()
                        }}
                        style={{ textDecoration: 'underline' }}
                      >
                        Terms and Conditions
                      </a>
                    </span>
                  }
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

      {/* Terms and Conditions Modal */}
      <CModal visible={termsVisible} onClose={() => setTermsVisible(false)} size="lg">
        <CModalHeader>
          <CModalTitle>{termsContent?.title || 'Terms and Conditions'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {termsLoading ? (
            <div className="text-center py-4">
              <CSpinner color="primary" />
            </div>
          ) : (
            <div style={{ whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto' }}>
              {termsContent?.content || 'Loading...'}
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="primary" onClick={() => setTermsVisible(false)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}

export default RegisterUser
