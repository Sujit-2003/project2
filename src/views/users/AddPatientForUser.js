import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  CButton,
  CSpinner,
  CInputGroup,
} from '@coreui/react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { addPatient } from '../../services/patientService'
import { getCountries } from '../../services/countryService'
import { useToast } from '../../components/ToastContext'

const AddPatientForUser = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showSuccess, showError, showWarning } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [countries, setCountries] = useState([])
  const [dobError, setDobError] = useState('')

  useEffect(() => {
    getCountries().then((data) => setCountries(data))
  }, [])

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    relationship: '',
    contactNumber: '',
    about: '',
    healthHistory: '',
    country_id: '',
  })

  const todayStr = new Date().toISOString().split('T')[0]

  const quillModules = useMemo(() => ({
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'bullet' }, { list: 'ordered' }],
    ],
  }), [])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'dob') {
      if (value > todayStr) {
        setDobError('Please enter a valid Date of Birth.')
      } else {
        setDobError('')
      }
    }
    setForm({ ...form, [name]: value })
  }

  const getSelectedCountry = () => {
    if (!form.country_id) return null
    return countries.find((c) => String(c.country_id) === String(form.country_id))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.firstName || !form.lastName || !form.dob || !form.gender) {
      showWarning('First name, last name, date of birth, and gender are required.')
      return
    }

    if (form.dob > todayStr) {
      setDobError('Please enter a valid Date of Birth.')
      return
    }

    setSubmitting(true)
    try {
      const selected = getSelectedCountry()
      const isdCode = selected?.isd_code || ''
      const contactWithCode = isdCode && form.contactNumber
        ? `${isdCode}${form.contactNumber}`
        : form.contactNumber

      const payload = {
        patient_fname: form.firstName,
        patient_lname: form.lastName,
        p_dob: `${form.dob} 00:00:00`,
        user_gender: form.gender,
        p_relationship: form.relationship,
        about_patient: form.about,
        health_history: form.healthHistory,
        um_id: Number(id),
        contact_numb: contactWithCode,
        contact_number: contactWithCode,
        country_id: Number(form.country_id) || 1,
      }
      const res = await addPatient(payload)
      if (Number(res.code) === 0) {
        showSuccess(res.message || 'Patient added successfully!')
        setTimeout(() => navigate(`/users/${id}`), 1500)
      } else {
        showError(res.message || 'Failed to add patient.')
      }
    } catch {
      showError('Network error adding patient.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CRow className="justify-content-center">
      <CCol lg={10}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Add Patient for User #{id}</strong>
            <div className="d-flex gap-2">
              <CButton color="primary" type="submit" form="addPatientForUserForm" disabled={submitting}>
                {submitting ? <CSpinner size="sm" /> : 'Add Patient'}
              </CButton>
              <CButton color="secondary" onClick={() => navigate(`/users/${id}`)}>
                Cancel
              </CButton>
            </div>
          </CCardHeader>
          <CCardBody>
            <CForm id="addPatientForUserForm" onSubmit={handleSubmit}>
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
                    <CFormInput
                      type="date"
                      name="dob"
                      value={form.dob}
                      onChange={handleChange}
                      max={todayStr}
                      required
                      style={dobError ? { border: '1px solid red' } : {}}
                    />
                    {dobError && (
                      <div style={{ color: 'red', fontSize: '0.875em', marginTop: '4px' }}>
                        {dobError}
                      </div>
                    )}
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
                    <CFormSelect name="relationship" value={form.relationship} onChange={handleChange}>
                      <option value="">Select Relationship</option>
                      <option value="Self">Self</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Husband">Husband</option>
                      <option value="Wife">Wife</option>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                      <option value="Grandfather">Grandfather</option>
                      <option value="Grandmother">Grandmother</option>
                      <option value="Grandson">Grandson</option>
                      <option value="Granddaughter">Granddaughter</option>
                      <option value="Uncle">Uncle</option>
                      <option value="Aunt">Aunt</option>
                      <option value="Nephew">Nephew</option>
                      <option value="Niece">Niece</option>
                      <option value="Cousin">Cousin</option>
                      <option value="Friend">Friend</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Other">Other</option>
                    </CFormSelect>
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>Contact Number</CFormLabel>
                    <CInputGroup>
                      {countries.length > 0 ? (
                        <CFormSelect
                          name="country_id"
                          value={form.country_id}
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
                          placeholder="+91"
                          style={{ maxWidth: '80px' }}
                          disabled
                        />
                      )}
                      <CFormInput
                        name="contactNumber"
                        value={form.contactNumber}
                        onChange={handleChange}
                        placeholder="Phone number"
                      />
                    </CInputGroup>
                  </div>
                </CCol>
              </CRow>
              <CRow>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>About Patient</CFormLabel>
                    <ReactQuill
                      theme="snow"
                      value={form.about}
                      onChange={(value) => setForm({ ...form, about: value })}
                      modules={quillModules}
                      style={{ minHeight: '150px' }}
                    />
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel>Health History</CFormLabel>
                    <ReactQuill
                      theme="snow"
                      value={form.healthHistory}
                      onChange={(value) => setForm({ ...form, healthHistory: value })}
                      modules={quillModules}
                      style={{ minHeight: '150px' }}
                    />
                  </div>
                </CCol>
              </CRow>
              {/* Buttons are in the card header */}
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default AddPatientForUser
