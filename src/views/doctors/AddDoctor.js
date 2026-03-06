import React, { useEffect, useState } from 'react'
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
import { registerDoctor } from '../../services/userService'
import { getTermsAndConditions } from '../../services/termsService'
import { getCountries } from '../../services/countryService'
import { useToast } from '../../components/ToastContext'

const AddDoctor = () => {
  const navigate = useNavigate()
  const { showSuccess, showError, showWarning } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [countries, setCountries] = useState([])

  // Terms modal state
  const [termsVisible, setTermsVisible] = useState(false)
  const [termsContent, setTermsContent] = useState(null)
  const [termsLoading, setTermsLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    emailId: '',
    countryId: '',
    phone: '',
    password: '',
  })

  useEffect(() => {
    getCountries().then((data) => setCountries(data))
  }, [])

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

  const getSelectedCountry = () => {
    if (!form.countryId) return null
    return countries.find(
      (c) => String(c.country_id ?? c.id ?? c.countryid) === String(form.countryId),
    )
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
      const selected = getSelectedCountry()
      const countryCode = selected?.isd_code ?? selected?.code ?? selected?.country_code ?? ''
      const countryid = selected
        ? Number(selected.country_id ?? selected.id ?? selected.countryid ?? 1)
        : 1
      const contactNumber = countryCode ? `${countryCode}${form.phone}` : form.phone

      const res = await registerDoctor({
        name: form.name,
        emailId: form.emailId,
        contactNumber,
        password: form.password,
        countryid,
      })
      if (Number(res.code) === 0) {
        showSuccess(res.message || 'Doctor registered successfully!')
        setTimeout(() => navigate('/doctors'), 1500)
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
            <strong>Add Doctor</strong>
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
                      {countries.length > 0 ? (
                        <CFormSelect
                          name="countryId"
                          value={form.countryId}
                          onChange={handleChange}
                          style={{ maxWidth: '180px' }}
                        >
                          <option value="">Select</option>
                          {countries.map((c) => (
                            <option key={c.country_id} value={c.country_id}>
                              {c.isd_code} ({c.country_name})
                            </option>
                          ))}
                        </CFormSelect>
                      ) : (
                        <CFormInput
                          name="countryCode"
                          placeholder="+91"
                          style={{ maxWidth: '80px' }}
                          onChange={(e) =>
                            setForm({ ...form, countryCode: e.target.value })
                          }
                        />
                      )}
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
                <CButton color="secondary" onClick={() => navigate('/doctors')}>
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

export default AddDoctor
