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
} from '@coreui/react'
import { addSymptom } from '../../services/symptomService'
import { useToast } from '../../components/ToastContext'

const AddSymptom = () => {
  const navigate = useNavigate()
  const { showSuccess, showError, showWarning } = useToast()
  const [submitting, setSubmitting] = useState(false)
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

    if (!form.symptom_name || !form.severity_level) {
      showWarning('Symptom name and severity level are required.')
      return
    }

    setSubmitting(true)
    try {
      const res = await addSymptom(form)
      if (Number(res.code) === 0) {
        showSuccess(res.message || 'Symptom added successfully!')
        setTimeout(() => navigate('/symptoms'), 1500)
      } else {
        showError(res.message || 'Failed to add symptom.')
      }
    } catch {
      showError('Network error adding symptom.')
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
