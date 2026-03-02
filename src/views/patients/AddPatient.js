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
  CFormTextarea,
  CButton,
  CSpinner,
  CAlert,
} from '@coreui/react'
import { addPatient } from '../../services/patientService'
import { getUmId } from '../../services/authService'

const AddPatient = () => {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    relationship: '',
    contactNumber: '',
    about: '',
    healthHistory: '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.firstName || !form.lastName || !form.dob || !form.gender) {
      setError('First name, last name, date of birth, and gender are required.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        patient_fname: form.firstName,
        patient_lname: form.lastName,
        p_dob: `${form.dob} 00:00:00`,
        user_gender: form.gender,
        p_relationship: form.relationship,
        about_patient: form.about,
        health_history: form.healthHistory,
        um_id: getUmId(),
        contact_numb: form.contactNumber,
        contact_number: form.contactNumber,
      }
      const res = await addPatient(payload)
      if (Number(res.code) === 0) {
        setSuccess(res.message || 'Patient added successfully!')
        setTimeout(() => navigate('/patients'), 1500)
      } else {
        setError(res.message || 'Failed to add patient.')
      }
    } catch {
      setError('Network error adding patient.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Add Patient</strong>
          </CCardHeader>
          <CCardBody>
            {error && <CAlert color="danger">{error}</CAlert>}
            {success && <CAlert color="success">{success}</CAlert>}
            <CForm onSubmit={handleSubmit}>
              <CRow>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>First Name</CFormLabel>
                    <CFormInput name="firstName" value={form.firstName} onChange={handleChange} required />
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>Last Name</CFormLabel>
                    <CFormInput name="lastName" value={form.lastName} onChange={handleChange} required />
                  </div>
                </CCol>
              </CRow>
              <CRow>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>Date of Birth</CFormLabel>
                    <CFormInput type="date" name="dob" value={form.dob} onChange={handleChange} required />
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>Gender</CFormLabel>
                    <CFormSelect name="gender" value={form.gender} onChange={handleChange} required>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </CFormSelect>
                  </div>
                </CCol>
              </CRow>
              <CRow>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>Relationship</CFormLabel>
                    <CFormInput name="relationship" value={form.relationship} onChange={handleChange} />
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>Contact Number</CFormLabel>
                    <CFormInput name="contactNumber" value={form.contactNumber} onChange={handleChange} />
                  </div>
                </CCol>
              </CRow>
              <CRow>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>About Patient</CFormLabel>
                    <CFormTextarea name="about" value={form.about} onChange={handleChange} rows={2} />
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>Health History</CFormLabel>
                    <CFormTextarea name="healthHistory" value={form.healthHistory} onChange={handleChange} rows={2} />
                  </div>
                </CCol>
              </CRow>
              <div className="d-flex gap-2 mt-2">
                <CButton color="primary" type="submit" disabled={submitting}>
                  {submitting ? <CSpinner size="sm" /> : 'Add Patient'}
                </CButton>
                <CButton color="secondary" onClick={() => navigate('/patients')}>
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

export default AddPatient
