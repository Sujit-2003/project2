import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CSpinner,
  CAlert,
  CBadge,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CForm,
  CFormInput,
  CFormTextarea,
  CFormLabel,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilPlus, cilNotes, cilPencil, cilSave, cilX, cilClipboard } from '@coreui/icons'
import {
  getTemplateById,
  getQuestions,
  addQuestion,
  addQuestionOptions,
  getQuestionOptions,
  updateQuestion,
  updateQuestionOption,
  updateTemplate,
} from '../../services/questionnaireService'
import { useToast } from '../../components/ToastContext'

const EMPTY_OPTION = { id: null, opt_text: '', opt_hint: '', opt_weightge: 0 }
const INITIAL_QUESTION = {
  question: '',
  description: '',
  options: [
    { ...EMPTY_OPTION },
    { ...EMPTY_OPTION },
    { ...EMPTY_OPTION },
    { ...EMPTY_OPTION },
    { ...EMPTY_OPTION },
  ],
}

const TemplateDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showSuccess, showError, showWarning } = useToast()

  const [template, setTemplate] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Template editing state
  const [editingTemplate, setEditingTemplate] = useState(false)
  const [templateForm, setTemplateForm] = useState({
    template_name: '',
    template_desc: '',
    no_of_questions: '',
    key_words: '',
  })
  const [savingTemplate, setSavingTemplate] = useState(false)

  // Question editing state
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [questionForm, setQuestionForm] = useState({ ...INITIAL_QUESTION })
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [optionsLoading, setOptionsLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [tplRes, qRes] = await Promise.all([
        getTemplateById(id),
        getQuestions(id),
      ])
      if (Number(tplRes.code) === 0 && tplRes.data) {
        setTemplate(tplRes.data)
      } else {
        setError('Template not found.')
      }
      if (Number(qRes.code) === 0 && Array.isArray(qRes.data)) {
        setQuestions(qRes.data)
      }
    } catch {
      setError('Failed to load template details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  // ─── Template Edit Handlers ───

  const handleStartEditTemplate = () => {
    setEditingTemplate(true)
    setTemplateForm({
      template_name: template.template_name || '',
      template_desc: template.template_desc || '',
      no_of_questions: template.no_of_questions || '',
      key_words: template.key_words || '',
    })
    // Close any open question form
    resetQuestionForm()
  }

  const handleCancelEditTemplate = () => {
    setEditingTemplate(false)
    setTemplateForm({ template_name: '', template_desc: '', no_of_questions: '', key_words: '' })
  }

  const handleTemplateFormChange = (e) => {
    setTemplateForm({ ...templateForm, [e.target.name]: e.target.value })
  }

  const handleSaveTemplate = async (e) => {
    e.preventDefault()
    if (!templateForm.template_name.trim()) {
      showWarning('Template name is required.')
      return
    }
    if (!templateForm.no_of_questions || Number(templateForm.no_of_questions) < 1) {
      showWarning('Number of questions must be at least 1.')
      return
    }

    setSavingTemplate(true)
    try {
      const res = await updateTemplate({
        template_id: Number(id),
        template_name: templateForm.template_name.trim(),
        template_desc: templateForm.template_desc.trim(),
        no_of_questions: Number(templateForm.no_of_questions),
        key_words: templateForm.key_words.trim(),
      })
      if (Number(res.code) === 0) {
        showSuccess('Template updated successfully!')
        setEditingTemplate(false)
        // Reload template data
        const tplRes = await getTemplateById(id)
        if (Number(tplRes.code) === 0 && tplRes.data) {
          setTemplate(tplRes.data)
        }
      } else {
        showError(res.message || 'Failed to update template.')
      }
    } catch {
      showError('Network error updating template.')
    } finally {
      setSavingTemplate(false)
    }
  }

  // ─── Question Handlers ───

  const handleQuestionChange = (e) => {
    setQuestionForm({ ...questionForm, [e.target.name]: e.target.value })
  }

  const handleOptionChange = (index, field, value) => {
    const updated = [...questionForm.options]
    updated[index] = { ...updated[index], [field]: field === 'opt_weightge' ? Number(value) : value }
    setQuestionForm({ ...questionForm, options: updated })
  }

  const resetQuestionForm = () => {
    setQuestionForm({
      ...INITIAL_QUESTION,
      options: Array(5).fill(null).map(() => ({ ...EMPTY_OPTION })),
    })
    setEditingQuestionId(null)
    setShowQuestionForm(false)
  }

  const handleEditQuestion = async (q) => {
    setEditingQuestionId(q.id)
    setShowQuestionForm(true)
    setQuestionForm((prev) => ({
      ...prev,
      question: q.question || '',
      description: q.description || '',
      options: Array(5).fill(null).map(() => ({ ...EMPTY_OPTION })),
    }))

    setOptionsLoading(true)
    try {
      const res = await getQuestionOptions(q.id)
      if (Number(res.code) === 0 && Array.isArray(res.data) && res.data.length > 0) {
        const filled = res.data.map((o) => ({
          id: o.id || o.option_id || null,
          opt_text: o.opt_text || o.text || '',
          opt_hint: o.opt_hint || o.hint || '',
          opt_weightge: o.opt_weightge || o.weightage || 0,
        }))
        const padded = [...filled]
        while (padded.length < 5) padded.push({ ...EMPTY_OPTION })
        if (padded.length > 5) padded.length = 5

        setQuestionForm((prev) => ({
          ...prev,
          question: q.question || '',
          description: q.description || '',
          options: padded,
        }))
      }
    } catch {
      // keep empty options
    } finally {
      setOptionsLoading(false)
    }
  }

  const handleSubmitQuestion = async (e) => {
    e.preventDefault()
    if (!questionForm.question.trim()) {
      showWarning('Question text is required.')
      return
    }
    const hasEmptyOption = questionForm.options.some((o) => !o.opt_text.trim())
    if (hasEmptyOption) {
      showWarning('All 5 option texts are required.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        question: questionForm.question.trim(),
        description: questionForm.description.trim(),
        template_id: Number(id),
      }

      if (editingQuestionId) {
        const qRes = await updateQuestion({ question_id: editingQuestionId, ...payload })
        if (Number(qRes.code) === 0) {
          const hasExistingIds = questionForm.options.every((o) => o.id)
          if (hasExistingIds) {
            await Promise.all(questionForm.options.map((o) =>
              updateQuestionOption({
                option_id: o.id,
                opt_text: o.opt_text.trim(),
                opt_hint: o.opt_hint.trim(),
                opt_weightge: Number(o.opt_weightge) || 0,
              }),
            ))
            showSuccess('Question and options updated successfully!')
          } else {
            const optRes = await addQuestionOptions({
              q_id: Number(editingQuestionId),
              options: questionForm.options.map((o) => ({
                opt_text: o.opt_text.trim(),
                opt_hint: o.opt_hint.trim(),
                opt_weightge: Number(o.opt_weightge) || 0,
              })),
            })
            if (Number(optRes.code) === 0) {
              showSuccess('Question updated and options saved!')
            } else {
              showSuccess('Question updated but options may have failed.')
            }
          }
          resetQuestionForm()
          const qListRes = await getQuestions(id)
          if (Number(qListRes.code) === 0 && Array.isArray(qListRes.data)) setQuestions(qListRes.data)
        } else {
          showError(qRes.message || 'Failed to update question.')
        }
      } else {
        const qRes = await addQuestion(payload)
        if (Number(qRes.code) === 0) {
          let questionId = qRes.data?.id || qRes.data?.q_id
          if (!questionId) {
            const reloadRes = await getQuestions(id)
            if (Number(reloadRes.code) === 0 && Array.isArray(reloadRes.data)) {
              questionId = reloadRes.data[reloadRes.data.length - 1]?.id
            }
          }
          if (questionId) {
            const optRes = await addQuestionOptions({
              q_id: Number(questionId),
              options: questionForm.options.map((o) => ({
                opt_text: o.opt_text.trim(),
                opt_hint: o.opt_hint.trim(),
                opt_weightge: Number(o.opt_weightge) || 0,
              })),
            })
            showSuccess(Number(optRes.code) === 0 ? 'Question and options saved!' : 'Question saved but options may have failed.')
          } else {
            showSuccess('Question added.')
          }
          resetQuestionForm()
          const qListRes = await getQuestions(id)
          if (Number(qListRes.code) === 0 && Array.isArray(qListRes.data)) setQuestions(qListRes.data)
        } else {
          showError(qRes.message || 'Failed to save question.')
        }
      }
    } catch {
      showError('Network error saving question.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Render ───

  if (loading) {
    return (
      <div className="suji-loading">
        <CSpinner color="primary" />
      </div>
    )
  }

  if (error) {
    return <CAlert color="danger">{error}</CAlert>
  }

  // Determine if we're in any edit mode
  const isEditing = editingTemplate || showQuestionForm

  return (
    <CRow className="justify-content-center">
      <CCol lg={10}>
        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-2">
            <CIcon icon={cilClipboard} height={24} className="text-primary" />
            <h4 className="mb-0 fw-bold">{template.template_name}</h4>
          </div>
          <CButton color="light" size="sm" onClick={() => navigate('/questionnaire')}>
            <CIcon icon={cilArrowLeft} className="me-1" />
            Back to Templates
          </CButton>
        </div>

        {/* ── Template Details Card (View Mode) ── */}
        {!editingTemplate && (
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <CIcon icon={cilNotes} height={16} className="text-primary" />
                <strong>Template Information</strong>
              </div>
              {!showQuestionForm && (
                <CButton color="info" variant="outline" size="sm" onClick={handleStartEditTemplate}>
                  <CIcon icon={cilPencil} size="sm" className="me-1" />
                  Edit Template
                </CButton>
              )}
            </CCardHeader>
            <CCardBody>
              <CRow>
                <CCol sm={6} className="mb-3">
                  <div className="text-body-secondary small mb-1">Template Name</div>
                  <div className="fw-semibold fs-6">{template.template_name}</div>
                </CCol>
                <CCol sm={3} className="mb-3">
                  <div className="text-body-secondary small mb-1">No. of Questions</div>
                  <CBadge color="primary" shape="rounded-pill" style={{ fontSize: '0.85rem', padding: '4px 12px' }}>
                    {template.no_of_questions || 0}
                  </CBadge>
                </CCol>
                <CCol sm={3} className="mb-3">
                  <div className="text-body-secondary small mb-1">Keywords</div>
                  <div>
                    {template.key_words ? (
                      template.key_words.split(',').map((kw, i) => (
                        <CBadge key={i} color="light" textColor="dark" className="me-1 mb-1" shape="rounded-pill">
                          {kw.trim()}
                        </CBadge>
                      ))
                    ) : <span className="text-body-secondary">-</span>}
                  </div>
                </CCol>
                <CCol sm={12}>
                  <div className="text-body-secondary small mb-1">Description</div>
                  <div style={{ fontSize: '0.9rem' }}>{template.template_desc || '-'}</div>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        )}

        {/* ── Template Edit Form ── */}
        {editingTemplate && (
          <CCard className="mb-4 border-primary">
            <CCardHeader className="d-flex justify-content-between align-items-center bg-light">
              <div className="d-flex align-items-center gap-2">
                <CIcon icon={cilPencil} height={16} className="text-primary" />
                <strong>Edit Template Details</strong>
              </div>
              <CButton color="light" size="sm" onClick={handleCancelEditTemplate}>
                <CIcon icon={cilX} size="sm" />
              </CButton>
            </CCardHeader>
            <CCardBody>
              <CForm onSubmit={handleSaveTemplate}>
                <CRow className="mb-3">
                  <CCol md={6}>
                    <CFormLabel>Template Name *</CFormLabel>
                    <CFormInput
                      name="template_name"
                      value={templateForm.template_name}
                      onChange={handleTemplateFormChange}
                      placeholder="e.g. Mental Health Assessment"
                      required
                    />
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel>No. of Questions *</CFormLabel>
                    <CFormInput
                      type="number"
                      name="no_of_questions"
                      value={templateForm.no_of_questions}
                      onChange={handleTemplateFormChange}
                      placeholder="e.g. 20"
                      min="1"
                      required
                    />
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel>Keywords</CFormLabel>
                    <CFormInput
                      name="key_words"
                      value={templateForm.key_words}
                      onChange={handleTemplateFormChange}
                      placeholder="e.g. mood, anxiety"
                    />
                  </CCol>
                </CRow>
                <div className="mb-3">
                  <CFormLabel>Description</CFormLabel>
                  <CFormTextarea
                    name="template_desc"
                    value={templateForm.template_desc}
                    onChange={handleTemplateFormChange}
                    rows={3}
                    placeholder="Describe the purpose of this template..."
                  />
                </div>
                <div className="d-flex gap-2">
                  <CButton type="submit" color="primary" disabled={savingTemplate}>
                    {savingTemplate ? <CSpinner size="sm" /> : (
                      <>
                        <CIcon icon={cilSave} className="me-1" />
                        Save Changes
                      </>
                    )}
                  </CButton>
                  <CButton color="secondary" variant="outline" onClick={handleCancelEditTemplate}>
                    Cancel
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        )}

        {/* ── Add/Edit Question Form ── */}
        {showQuestionForm && (
          <CCard className="mb-4 border-primary">
            <CCardHeader className="d-flex justify-content-between align-items-center bg-light">
              <div className="d-flex align-items-center gap-2">
                <CIcon icon={editingQuestionId ? cilPencil : cilPlus} height={16} className="text-primary" />
                <strong>{editingQuestionId ? 'Edit Question' : 'New Question'}</strong>
              </div>
              <CButton color="light" size="sm" onClick={resetQuestionForm}>
                <CIcon icon={cilX} size="sm" />
              </CButton>
            </CCardHeader>
            <CCardBody>
              {optionsLoading ? (
                <div className="text-center py-4">
                  <CSpinner color="primary" size="sm" />
                  <div className="text-body-secondary mt-2 small">Loading question options...</div>
                </div>
              ) : (
                <CForm onSubmit={handleSubmitQuestion}>
                  <CRow className="mb-3">
                    <CCol md={8}>
                      <CFormLabel>Question Text *</CFormLabel>
                      <CFormInput
                        name="question"
                        value={questionForm.question}
                        onChange={handleQuestionChange}
                        placeholder="e.g. How are you feeling today?"
                        required
                      />
                    </CCol>
                    <CCol md={4}>
                      <CFormLabel>Description</CFormLabel>
                      <CFormInput
                        name="description"
                        value={questionForm.description}
                        onChange={handleQuestionChange}
                        placeholder="Brief description..."
                      />
                    </CCol>
                  </CRow>

                  <div className="d-flex align-items-center gap-2 mb-3 mt-2">
                    <strong style={{ fontSize: '0.9rem' }}>Options</strong>
                    <CBadge color="light" textColor="dark" shape="rounded-pill" style={{ fontSize: '0.75rem' }}>All 5 required</CBadge>
                  </div>

                  {questionForm.options.map((opt, idx) => (
                    <div key={idx} className="d-flex align-items-center gap-2 mb-2 p-2 rounded border" style={{ backgroundColor: 'var(--suji-bg, #f8f9fa)' }}>
                      <CBadge
                        color="primary"
                        shape="rounded-pill"
                        className="flex-shrink-0"
                        style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}
                      >
                        {idx + 1}
                      </CBadge>
                      <CFormInput
                        size="sm"
                        value={opt.opt_text}
                        onChange={(e) => handleOptionChange(idx, 'opt_text', e.target.value)}
                        placeholder={`Option ${idx + 1} text *`}
                        required
                        style={{ flex: '2' }}
                      />
                      <CFormInput
                        size="sm"
                        value={opt.opt_hint}
                        onChange={(e) => handleOptionChange(idx, 'opt_hint', e.target.value)}
                        placeholder="Hint"
                        style={{ flex: '1.5' }}
                      />
                      <CFormInput
                        size="sm"
                        type="number"
                        value={opt.opt_weightge}
                        onChange={(e) => handleOptionChange(idx, 'opt_weightge', e.target.value)}
                        placeholder="Wt"
                        min="0"
                        style={{ width: '80px', flex: '0 0 80px' }}
                      />
                    </div>
                  ))}

                  <div className="d-flex gap-2 mt-3">
                    <CButton type="submit" color="primary" disabled={submitting}>
                      {submitting ? <CSpinner size="sm" /> : (
                        <>
                          <CIcon icon={cilSave} className="me-1" />
                          {editingQuestionId ? 'Update Question' : 'Save Question'}
                        </>
                      )}
                    </CButton>
                    <CButton color="secondary" variant="outline" onClick={resetQuestionForm}>
                      Cancel
                    </CButton>
                  </div>
                </CForm>
              )}
            </CCardBody>
          </CCard>
        )}

        {/* ── Questions List — hidden when editing template or question ── */}
        {!isEditing && (
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <strong>Questions</strong>
                <CBadge color="primary" shape="rounded-pill">{questions.length}</CBadge>
              </div>
              <CButton
                color="primary"
                size="sm"
                onClick={() => { resetQuestionForm(); setShowQuestionForm(true) }}
              >
                <CIcon icon={cilPlus} className="me-1" />
                Add Question
              </CButton>
            </CCardHeader>
            <CCardBody>
              {questions.length === 0 ? (
                <div className="suji-empty-state">
                  No questions added yet. Click &quot;Add Question&quot; to create one.
                </div>
              ) : (
                <CTable hover responsive align="middle" className="mb-0">
                  <CTableHead color="light">
                    <CTableRow>
                      <CTableHeaderCell style={{ width: '50px' }}>#</CTableHeaderCell>
                      <CTableHeaderCell>Question</CTableHeaderCell>
                      <CTableHeaderCell>Description</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: '80px', textAlign: 'center' }}>Options</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: '100px', textAlign: 'center' }}>Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {questions.map((q, idx) => (
                      <CTableRow key={q.id || idx}>
                        <CTableDataCell className="text-body-secondary">{idx + 1}</CTableDataCell>
                        <CTableDataCell className="fw-semibold">{q.question}</CTableDataCell>
                        <CTableDataCell>
                          <span className="text-body-secondary" style={{ fontSize: '0.85rem' }}>
                            {q.description
                              ? q.description.length > 50
                                ? q.description.slice(0, 50) + '...'
                                : q.description
                              : '-'}
                          </span>
                        </CTableDataCell>
                        <CTableDataCell className="text-center">
                          <CBadge color="primary" shape="rounded-pill">
                            {q.options ? q.options.length : 5}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="text-center">
                          <CButton
                            color="info"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditQuestion(q)}
                          >
                            <CIcon icon={cilPencil} size="sm" className="me-1" />
                            Edit
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default TemplateDetails
