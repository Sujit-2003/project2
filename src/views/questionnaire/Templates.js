import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CSpinner,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CForm,
  CFormInput,
  CFormTextarea,
  CFormLabel,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilNotes, cilX, cilSave } from '@coreui/icons'
import { getTemplates, addTemplate } from '../../services/questionnaireService'
import { useToast } from '../../components/ToastContext'

const INITIAL_FORM = {
  template_name: '',
  template_description: '',
  num_questions: '',
  keywords: '',
}

const Templates = () => {
  const navigate = useNavigate()
  const { showSuccess, showError, showWarning } = useToast()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...INITIAL_FORM })
  const [submitting, setSubmitting] = useState(false)

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const res = await getTemplates()
      if (Number(res.code) === 0 && Array.isArray(res.data)) {
        setTemplates(res.data)
      } else {
        setTemplates([])
      }
    } catch {
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.template_name.trim()) {
      showWarning('Template name is required.')
      return
    }
    if (!form.num_questions || Number(form.num_questions) < 1) {
      showWarning('Number of questions must be at least 1.')
      return
    }

    setSubmitting(true)
    try {
      const res = await addTemplate({
        template_name: form.template_name.trim(),
        template_description: form.template_description.trim(),
        num_questions: Number(form.num_questions),
        keywords: form.keywords.trim(),
      })
      if (Number(res.code) === 0) {
        showSuccess(res.message || 'Template created successfully!')
        setForm({ ...INITIAL_FORM })
        setShowForm(false)
        await loadTemplates()
      } else {
        showError(res.message || 'Failed to create template.')
      }
    } catch {
      showError('Network error creating template.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CRow className="justify-content-center">
      <CCol lg={10}>
        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-2">
            <CIcon icon={cilNotes} height={22} className="text-primary" />
            <h5 className="mb-0 fw-bold">Questionnaire Templates</h5>
          </div>
          <CButton
            color="primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? (
              <>
                <CIcon icon={cilX} className="me-1" />
                Close Form
              </>
            ) : (
              <>
                <CIcon icon={cilPlus} className="me-1" />
                Add Template
              </>
            )}
          </CButton>
        </div>

        {/* Add Template Form */}
        {showForm && (
          <CCard className="mb-4">
            <CCardHeader>
              <strong>New Template</strong>
            </CCardHeader>
            <CCardBody>
              <CForm onSubmit={handleSubmit}>
                <CRow className="mb-3">
                  <CCol md={6}>
                    <CFormLabel htmlFor="template_name">Template Name *</CFormLabel>
                    <CFormInput
                      id="template_name"
                      name="template_name"
                      value={form.template_name}
                      onChange={handleChange}
                      placeholder="e.g. Mental Health Assessment"
                      required
                    />
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel htmlFor="num_questions">Number of Questions *</CFormLabel>
                    <CFormInput
                      type="number"
                      id="num_questions"
                      name="num_questions"
                      value={form.num_questions}
                      onChange={handleChange}
                      placeholder="e.g. 20"
                      min="1"
                      required
                    />
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel htmlFor="keywords">Keywords</CFormLabel>
                    <CFormInput
                      id="keywords"
                      name="keywords"
                      value={form.keywords}
                      onChange={handleChange}
                      placeholder="e.g. mood, anxiety"
                    />
                  </CCol>
                </CRow>
                <div className="mb-3">
                  <CFormLabel htmlFor="template_description">Template Description</CFormLabel>
                  <CFormTextarea
                    id="template_description"
                    name="template_description"
                    value={form.template_description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe the purpose of this template..."
                  />
                </div>
                <div className="d-flex gap-2">
                  <CButton type="submit" color="primary" disabled={submitting}>
                    {submitting ? <CSpinner size="sm" /> : (
                      <>
                        <CIcon icon={cilSave} className="me-1" />
                        Save
                      </>
                    )}
                  </CButton>
                  <CButton
                    color="secondary"
                    variant="outline"
                    onClick={() => {
                      setForm({ ...INITIAL_FORM })
                      setShowForm(false)
                    }}
                  >
                    Cancel
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        )}

        {/* Template List */}
        <CCard>
          <CCardHeader>
            <strong>Template List</strong>
          </CCardHeader>
          <CCardBody>
            {loading ? (
              <div className="suji-loading">
                <CSpinner color="primary" />
              </div>
            ) : templates.length === 0 ? (
              <div className="suji-empty-state">
                No templates found. Click "Add Template" to create one.
              </div>
            ) : (
              <CTable hover responsive align="middle">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>#</CTableHeaderCell>
                    <CTableHeaderCell>Template Name</CTableHeaderCell>
                    <CTableHeaderCell>Description</CTableHeaderCell>
                    <CTableHeaderCell>Questions</CTableHeaderCell>
                    <CTableHeaderCell>Keywords</CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {templates.map((t, idx) => (
                    <CTableRow key={t.id || idx}>
                      <CTableDataCell>{idx + 1}</CTableDataCell>
                      <CTableDataCell className="fw-semibold">{t.template_name}</CTableDataCell>
                      <CTableDataCell>
                        <span className="text-body-secondary" style={{ fontSize: '0.85rem' }}>
                          {t.template_description
                            ? t.template_description.length > 60
                              ? t.template_description.slice(0, 60) + '...'
                              : t.template_description
                            : '-'}
                        </span>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="primary" shape="rounded-pill">
                          {t.num_questions || 0}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        {t.keywords ? (
                          t.keywords.split(',').map((kw, i) => (
                            <CBadge key={i} color="light" textColor="dark" className="me-1" shape="rounded-pill">
                              {kw.trim()}
                            </CBadge>
                          ))
                        ) : '-'}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton
                          color="primary"
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/questionnaire/${t.id}`)}
                        >
                          View
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Templates
