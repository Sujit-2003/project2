import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
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
import { cilArrowLeft, cilPlus, cilNotes, cilPencil, cilSave, cilX } from '@coreui/icons'
import {
  getTemplateById,
  getQuestions,
  addQuestion,
  addQuestionOptions,
  getQuestionOptions,
  updateQuestion,
  updateQuestionOption,
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
  const [searchParams] = useSearchParams()
  const { showSuccess, showError, showWarning } = useToast()

  const [template, setTemplate] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  // Auto-open question form if navigated with ?edit=true
  useEffect(() => {
    if (searchParams.get('edit') === 'true' && !loading && template) {
      setShowQuestionForm(true)
    }
  }, [searchParams, loading, template])

  const handleQuestionChange = (e) => {
    setQuestionForm({ ...questionForm, [e.target.name]: e.target.value })
  }

  const handleOptionChange = (index, field, value) => {
    const updated = [...questionForm.options]
    updated[index] = { ...updated[index], [field]: field === 'opt_weightge' ? Number(value) : value }
    setQuestionForm({ ...questionForm, options: updated })
  }

  const resetForm = () => {
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
      options: Array(5)
        .fill(null)
        .map(() => ({ ...EMPTY_OPTION })),
    }))

    // Load existing options from backend
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
        while (padded.length < 5) {
          padded.push({ ...EMPTY_OPTION })
        }
        if (padded.length > 5) {
          padded.length = 5
        }

        setQuestionForm((prev) => ({
          ...prev,
          question: q.question || '',
          description: q.description || '',
          options: padded,
        }))
      }
    } catch {
      // If options fail to load, keep the question text but leave options empty
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
        const qRes = await updateQuestion({
          question_id: editingQuestionId,
          ...payload,
        })

        if (Number(qRes.code) === 0) {
          const hasExistingIds = questionForm.options.every((o) => o.id)

          if (hasExistingIds) {
            const updatePromises = questionForm.options.map((o) =>
              updateQuestionOption({
                option_id: o.id,
                opt_text: o.opt_text.trim(),
                opt_hint: o.opt_hint.trim(),
                opt_weightge: Number(o.opt_weightge) || 0,
              }),
            )
            await Promise.all(updatePromises)
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
              showSuccess('Question updated and options saved successfully!')
            } else {
              showSuccess('Question updated but options may have failed: ' + (optRes.message || ''))
            }
          }

          resetForm()
          const qListRes = await getQuestions(id)
          if (Number(qListRes.code) === 0 && Array.isArray(qListRes.data)) {
            setQuestions(qListRes.data)
          }
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
              const newest = reloadRes.data[reloadRes.data.length - 1]
              questionId = newest?.id
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

            if (Number(optRes.code) === 0) {
              showSuccess('Question and options saved successfully!')
            } else {
              showSuccess('Question saved but options may have failed: ' + (optRes.message || ''))
            }
          } else {
            showSuccess(qRes.message || 'Question added (options need question ID).')
          }

          resetForm()
          const qListRes = await getQuestions(id)
          if (Number(qListRes.code) === 0 && Array.isArray(qListRes.data)) {
            setQuestions(qListRes.data)
          }
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

  return (
    <CRow className="justify-content-center">
      <CCol lg={10}>
        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-2">
            <CIcon icon={cilNotes} height={22} className="text-primary" />
            <h5 className="mb-0 fw-bold">{template.template_name}</h5>
          </div>
          <div className="d-flex gap-2">
            {!showQuestionForm && (
              <CButton
                color="primary"
                size="sm"
                onClick={() => { resetForm(); setShowQuestionForm(true) }}
              >
                <CIcon icon={cilPlus} className="me-1" />
                Add Question
              </CButton>
            )}
            <CButton color="light" size="sm" onClick={() => navigate('/questionnaire')}>
              <CIcon icon={cilArrowLeft} className="me-1" />
              Back
            </CButton>
          </div>
        </div>

        {/* Template Details Card */}
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Template Information</strong>
          </CCardHeader>
          <CCardBody>
            <CRow>
              <CCol md={6}>
                <div className="mb-3">
                  <div className="text-body-secondary small mb-1">Template Name</div>
                  <div className="fw-semibold">{template.template_name}</div>
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <div className="text-body-secondary small mb-1">Number of Questions</div>
                  <CBadge color="primary" shape="rounded-pill">{template.no_of_questions || 0}</CBadge>
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <div className="text-body-secondary small mb-1">Description</div>
                  <div>{template.template_desc || '-'}</div>
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <div className="text-body-secondary small mb-1">Keywords</div>
                  <div>
                    {template.key_words ? (
                      template.key_words.split(',').map((kw, i) => (
                        <CBadge key={i} color="light" textColor="dark" className="me-1" shape="rounded-pill">
                          {kw.trim()}
                        </CBadge>
                      ))
                    ) : '-'}
                  </div>
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {/* Add/Edit Question Form */}
        {showQuestionForm && (
          <CCard className="mb-4 border-primary">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>{editingQuestionId ? 'Edit Question' : 'New Question'}</strong>
              <CButton color="light" size="sm" onClick={resetForm}>
                <CIcon icon={cilX} size="sm" className="me-1" />
                Close
              </CButton>
            </CCardHeader>
            <CCardBody>
              {optionsLoading ? (
                <div className="suji-loading">
                  <CSpinner color="primary" size="sm" />
                  <span className="ms-2 text-body-secondary">Loading options...</span>
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

                  <div className="fw-semibold mb-3 mt-2" style={{ fontSize: '0.9rem' }}>
                    Options (all 5 required)
                  </div>
                  {questionForm.options.map((opt, idx) => (
                    <CCard key={idx} className="mb-2 border" style={{ backgroundColor: 'var(--suji-bg)' }}>
                      <CCardBody className="py-2 px-3">
                        <CRow className="align-items-center">
                          <CCol xs="auto">
                            <CBadge color="primary" shape="rounded-pill" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {idx + 1}
                            </CBadge>
                          </CCol>
                          <CCol md={5}>
                            <CFormInput
                              size="sm"
                              value={opt.opt_text}
                              onChange={(e) => handleOptionChange(idx, 'opt_text', e.target.value)}
                              placeholder={`Option ${idx + 1} text *`}
                              required
                            />
                          </CCol>
                          <CCol md={4}>
                            <CFormInput
                              size="sm"
                              value={opt.opt_hint}
                              onChange={(e) => handleOptionChange(idx, 'opt_hint', e.target.value)}
                              placeholder="Hint (optional)"
                            />
                          </CCol>
                          <CCol md>
                            <CFormInput
                              size="sm"
                              type="number"
                              value={opt.opt_weightge}
                              onChange={(e) => handleOptionChange(idx, 'opt_weightge', e.target.value)}
                              placeholder="Weight"
                              min="0"
                            />
                          </CCol>
                        </CRow>
                      </CCardBody>
                    </CCard>
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
                    <CButton color="secondary" variant="outline" onClick={resetForm}>
                      Cancel
                    </CButton>
                  </div>
                </CForm>
              )}
            </CCardBody>
          </CCard>
        )}

        {/* Questions Section — hidden when adding/editing a question */}
        {!showQuestionForm && (
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Questions ({questions.length})</strong>
            </CCardHeader>
            <CCardBody>
              {questions.length === 0 ? (
                <div className="suji-empty-state">
                  No questions added yet. Click &quot;Add Question&quot; to create one.
                </div>
              ) : (
                <CTable hover responsive align="middle">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell style={{ width: '50px' }}>#</CTableHeaderCell>
                      <CTableHeaderCell>Question</CTableHeaderCell>
                      <CTableHeaderCell>Description</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: '80px' }}>Options</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: '100px' }}>Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {questions.map((q, idx) => (
                      <CTableRow key={q.id || idx}>
                        <CTableDataCell>{idx + 1}</CTableDataCell>
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
                        <CTableDataCell>
                          <CBadge color="primary" shape="rounded-pill">
                            {q.options ? q.options.length : 5}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
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
