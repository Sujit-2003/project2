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
import { cilPlus, cilNotes, cilX, cilSave, cilPencil, cilClipboard } from '@coreui/icons'
import { getTemplates, addTemplate, updateTemplate } from '../../services/questionnaireService'
import { useToast } from '../../components/ToastContext'

const INITIAL_FORM = {
  template_name: '',
  template_desc: '',
  no_of_questions: '',
  key_words: '',
}

const Templates = () => {
  const navigate = useNavigate()
  const { showSuccess, showError, showWarning } = useToast()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...INITIAL_FORM })
  const [submitting, setSubmitting] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState(null)

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

  const resetForm = () => {
    setForm({ ...INITIAL_FORM })
    setEditingTemplateId(null)
    setShowForm(false)
  }

  const handleEditTemplate = (t) => {
    setEditingTemplateId(t.id)
    setForm({
      template_name: t.template_name || '',
      template_desc: t.template_desc || '',
      no_of_questions: t.no_of_questions || '',
      key_words: t.key_words || '',
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.template_name.trim()) {
      showWarning('Template name is required.')
      return
    }
    if (!form.no_of_questions || Number(form.no_of_questions) < 1) {
      showWarning('Number of questions must be at least 1.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        template_name: form.template_name.trim(),
        template_desc: form.template_desc.trim(),
        no_of_questions: Number(form.no_of_questions),
        key_words: form.key_words.trim(),
      }

      let res
      if (editingTemplateId) {
        res = await updateTemplate({ template_id: editingTemplateId, ...payload })
      } else {
        res = await addTemplate(payload)
      }

      if (Number(res.code) === 0) {
        showSuccess(res.message || (editingTemplateId ? 'Template updated successfully!' : 'Template added successfully!'))
        resetForm()
        await loadTemplates()
      } else {
        showError(res.message || (editingTemplateId ? 'Failed to update template.' : 'Failed to create template.'))
      }
    } catch {
      showError('Network error. Please try again.')
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
            <CIcon icon={cilClipboard} height={24} className="text-primary" />
            <h4 className="mb-0 fw-bold">Questionnaire Templates</h4>
          </div>
          {!showForm && (
            <CButton color="primary" onClick={() => { resetForm(); setShowForm(true) }}>
              <CIcon icon={cilPlus} className="me-1" />
              Add Template
            </CButton>
          )}
        </div>

        {/* Add / Edit Template Form */}
        {showForm && (
          <CCard className="mb-4 border-primary">
            <CCardHeader className="d-flex justify-content-between align-items-center bg-light">
              <div className="d-flex align-items-center gap-2">
                <CIcon icon={editingTemplateId ? cilPencil : cilPlus} height={16} className="text-primary" />
                <strong>{editingTemplateId ? 'Edit Template' : 'New Template'}</strong>
              </div>
              <CButton color="light" size="sm" onClick={resetForm}>
                <CIcon icon={cilX} size="sm" />
              </CButton>
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
                    <CFormLabel htmlFor="no_of_questions">No. of Questions *</CFormLabel>
                    <CFormInput
                      type="number"
                      id="no_of_questions"
                      name="no_of_questions"
                      value={form.no_of_questions}
                      onChange={handleChange}
                      placeholder="e.g. 20"
                      min="1"
                      required
                    />
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel htmlFor="key_words">Keywords</CFormLabel>
                    <CFormInput
                      id="key_words"
                      name="key_words"
                      value={form.key_words}
                      onChange={handleChange}
                      placeholder="e.g. mood, anxiety"
                    />
                  </CCol>
                </CRow>
                <div className="mb-3">
                  <CFormLabel htmlFor="template_desc">Description</CFormLabel>
                  <CFormTextarea
                    id="template_desc"
                    name="template_desc"
                    value={form.template_desc}
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
                        {editingTemplateId ? 'Update Template' : 'Save Template'}
                      </>
                    )}
                  </CButton>
                  <CButton color="secondary" variant="outline" onClick={resetForm}>
                    Cancel
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        )}

        {/* Template List */}
        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <CIcon icon={cilNotes} height={16} className="text-primary" />
              <strong>All Templates</strong>
            </div>
            {templates.length > 0 && (
              <CBadge color="primary" shape="rounded-pill">{templates.length}</CBadge>
            )}
          </CCardHeader>
          <CCardBody>
            {loading ? (
              <div className="suji-loading">
                <CSpinner color="primary" />
              </div>
            ) : templates.length === 0 ? (
              <div className="suji-empty-state">
                No templates found. Click &quot;Add Template&quot; to create one.
              </div>
            ) : (
              <CTable hover responsive align="middle" className="mb-0">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell style={{ width: '50px' }}>#</CTableHeaderCell>
                    <CTableHeaderCell>Template Name</CTableHeaderCell>
                    <CTableHeaderCell>Description</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '100px', textAlign: 'center' }}>Questions</CTableHeaderCell>
                    <CTableHeaderCell>Keywords</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '160px', textAlign: 'center' }}>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {templates.map((t, idx) => (
                    <CTableRow key={t.id || idx}>
                      <CTableDataCell className="text-body-secondary">{idx + 1}</CTableDataCell>
                      <CTableDataCell className="fw-semibold">{t.template_name}</CTableDataCell>
                      <CTableDataCell>
                        <span className="text-body-secondary" style={{ fontSize: '0.85rem' }}>
                          {t.template_desc
                            ? t.template_desc.length > 60
                              ? t.template_desc.slice(0, 60) + '...'
                              : t.template_desc
                            : '-'}
                        </span>
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <CBadge color="primary" shape="rounded-pill">
                          {t.no_of_questions || 0}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        {t.key_words ? (
                          t.key_words.split(',').map((kw, i) => (
                            <CBadge key={i} color="light" textColor="dark" className="me-1" shape="rounded-pill">
                              {kw.trim()}
                            </CBadge>
                          ))
                        ) : '-'}
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="d-flex gap-1 justify-content-center">
                          <CButton
                            color="primary"
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/questionnaire/${t.id}`)}
                          >
                            View
                          </CButton>
                          <CButton
                            color="info"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTemplate(t)}
                          >
                            <CIcon icon={cilPencil} size="sm" className="me-1" />
                            Edit
                          </CButton>
                        </div>
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
