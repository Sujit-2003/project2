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
import { cilArrowLeft, cilPlus, cilNotes, cilPencil, cilSave, cilX } from '@coreui/icons'
import { getTemplateById, getQuestions, addQuestion, addQuestionOptions } from '../../services/questionnaireService'
import { useToast } from '../../components/ToastContext'

const EMPTY_OPTION = { opt_text: '', opt_hint: '', opt_weightge: 0 }
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

  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [questionForm, setQuestionForm] = useState({ ...INITIAL_QUESTION })
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

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

  const handleEditQuestion = (q) => {
    // Pre-fill question fields (options may not be available from GET)
    setQuestionForm({
      question: q.question || '',
      description: q.description || '',
      options: q.options && q.options.length === 5
        ? q.options.map((o) => ({
            opt_text: o.opt_text || o.text || '',
            opt_hint: o.opt_hint || o.hint || '',
            opt_weightge: o.opt_weightge || o.weightage || 0,
          }))
        : Array(5).fill(null).map(() => ({ ...EMPTY_OPTION })),
    })
    setEditingQuestionId(q.id)
    setShowQuestionForm(true)
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
      // Step 1: Create/update the question
      // Note: No PUT endpoint exists, so for edit we create a new question
      const qRes = await addQuestion({
        question: questionForm.question.trim(),
        description: questionForm.description.trim(),
        template_id: Number(id),
      })

      if (Number(qRes.code) === 0) {
        // Step 2: Get the question ID and add options
        // The q_id may come from the response data, or we reload questions to find it
        let questionId = qRes.data?.id || qRes.data?.q_id

        if (!questionId) {
          // Reload questions to find the newly created one
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
        // Reload questions list
        const qListRes = await getQuestions(id)
        if (Number(qListRes.code) === 0 && Array.isArray(qListRes.data)) {
          setQuestions(qListRes.data)
        }
      } else {
        showError(qRes.message || 'Failed to save question.')
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
        {/* Template Details Card */}
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <CIcon icon={cilNotes} height={18} className="text-primary" />
              <strong>Template Details</strong>
            </div>
            <CButton color="light" size="sm" onClick={() => navigate('/questionnaire')}>
              <CIcon icon={cilArrowLeft} className="me-1" />
              Back to Templates
            </CButton>
          </CCardHeader>
          <CCardBody>
            <div className="suji-detail-row">
              <div className="detail-label">Template Name</div>
              <div className="detail-value fw-semibold">{template.template_name}</div>
            </div>
            <div className="suji-detail-row">
              <div className="detail-label">Description</div>
              <div className="detail-value">{template.template_desc || '-'}</div>
            </div>
            <div className="suji-detail-row">
              <div className="detail-label">Number of Questions</div>
              <div className="detail-value">
                <CBadge color="primary" shape="rounded-pill">{template.no_of_questions || 0}</CBadge>
              </div>
            </div>
            <div className="suji-detail-row">
              <div className="detail-label">Keywords</div>
              <div className="detail-value">
                {template.key_words ? (
                  template.key_words.split(',').map((kw, i) => (
                    <CBadge key={i} color="light" textColor="dark" className="me-1" shape="rounded-pill">
                      {kw.trim()}
                    </CBadge>
                  ))
                ) : '-'}
              </div>
            </div>
          </CCardBody>
        </CCard>

        {/* Add/Edit Question Form */}
        {showQuestionForm && (
          <CCard className="mb-4">
            <CCardHeader>
              <strong>{editingQuestionId ? 'Edit Question' : 'Add Question'}</strong>
            </CCardHeader>
            <CCardBody>
              <CForm onSubmit={handleSubmitQuestion}>
                <div className="mb-3">
                  <CFormLabel>Question Text *</CFormLabel>
                  <CFormInput
                    name="question"
                    value={questionForm.question}
                    onChange={handleQuestionChange}
                    placeholder="e.g. How are you feeling today?"
                    required
                  />
                </div>
                <div className="mb-3">
                  <CFormLabel>Question Description</CFormLabel>
                  <CFormTextarea
                    name="description"
                    value={questionForm.description}
                    onChange={handleQuestionChange}
                    rows={2}
                    placeholder="Describe the purpose of this question..."
                  />
                </div>
                <div className="mb-3">
                  <CFormLabel>Template ID</CFormLabel>
                  <CFormInput value={id} disabled />
                </div>

                <h6 className="fw-bold mb-3 mt-4">Question Options (5 required)</h6>
                {questionForm.options.map((opt, idx) => (
                  <CCard key={idx} className="mb-3 border" style={{ backgroundColor: 'var(--suji-bg)' }}>
                    <CCardBody className="py-3">
                      <div className="fw-semibold mb-2" style={{ fontSize: '0.85rem', color: 'var(--suji-primary)' }}>
                        Option {idx + 1}
                      </div>
                      <CRow>
                        <CCol md={5}>
                          <CFormLabel className="small">Option Text *</CFormLabel>
                          <CFormInput
                            value={opt.opt_text}
                            onChange={(e) => handleOptionChange(idx, 'opt_text', e.target.value)}
                            placeholder={`Option ${idx + 1} text`}
                            required
                          />
                        </CCol>
                        <CCol md={4}>
                          <CFormLabel className="small">Option Hint</CFormLabel>
                          <CFormInput
                            value={opt.opt_hint}
                            onChange={(e) => handleOptionChange(idx, 'opt_hint', e.target.value)}
                            placeholder="Hint for this option"
                          />
                        </CCol>
                        <CCol md={3}>
                          <CFormLabel className="small">Weightage</CFormLabel>
                          <CFormInput
                            type="number"
                            value={opt.opt_weightge}
                            onChange={(e) => handleOptionChange(idx, 'opt_weightge', e.target.value)}
                            placeholder="0"
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
                        Save Question
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

        {/* Questions Section */}
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Questions ({questions.length})</strong>
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
          </CCardHeader>
          <CCardBody>
            {questions.length === 0 ? (
              <div className="suji-empty-state">
                No questions added yet. Click "Add Question" to create one.
              </div>
            ) : (
              <CTable hover responsive align="middle">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>#</CTableHeaderCell>
                    <CTableHeaderCell>Question</CTableHeaderCell>
                    <CTableHeaderCell>Description</CTableHeaderCell>
                    <CTableHeaderCell>Options</CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
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
      </CCol>
    </CRow>
  )
}

export default TemplateDetails
