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
import { addSymptom } from '../../services/symptomService'

const AddSymptom = () => {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    symptom_name: '',
    severity_level: '',
    description: '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.symptom_name || !form.severity_level) {
      setError('Symptom name and severity level are required.')
      return
    }

    setSubmitting(true)
    try {
      const res = await addSymptom(form)
      if (Number(res.code) === 0) {
        setSuccess(res.message || 'Symptom added successfully!')
        setTimeout(() => navigate('/symptoms'), 1500)
      } else {
        setError(res.message || 'Failed to add symptom.')
      }
    } catch {
      setError('Network error adding symptom.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CRow className="justify-content-center">
      <CCol lg={8}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Add Symptom</strong>
          </CCardHeader>
          <CCardBody>
            {error && <CAlert color="danger">{error}</CAlert>}
            {success && <CAlert color="success">{success}</CAlert>}
            <CForm onSubmit={handleSubmit}>
              <div className="mb-3">
                <CFormLabel>Symptom Name</CFormLabel>
                <CFormInput
                  name="symptom_name"
                  value={form.symptom_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <CFormLabel>Severity Level</CFormLabel>
                <CFormSelect
                  name="severity_level"
                  value={form.severity_level}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Severity</option>
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                </CFormSelect>
              </div>
              <div className="mb-3">
                <CFormLabel>Description</CFormLabel>
                <CFormTextarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
              <div className="d-flex gap-2">
                <CButton color="primary" type="submit" disabled={submitting}>
                  {submitting ? <CSpinner size="sm" /> : 'Add Symptom'}
                </CButton>
                <CButton color="secondary" onClick={() => navigate('/symptoms')}>
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

export default AddSymptom
