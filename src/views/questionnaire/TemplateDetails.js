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
import { getTemplateById, getQuestions, addQuestion, updateQuestion } from '../../services/questionnaireService'
import { useToast } from '../../components/ToastContext'

const EMPTY_OPTION = { text: '', hint: '', weightage: 0 }
const INITIAL_QUESTION = {
  question_text: '',
  question_description: '',
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
    updated[index] = { ...updated[index], [field]: field === 'weightage' ? Number(value) : value }
    setQuestionForm({ ...questionForm, options: updated })
  }

  const resetForm = () => {
    setQuestionForm({ ...INITIAL_QUESTION, options: Array(5).fill(null).map(() => ({ ...EMPTY_OPTION })) })
    setEditingQuestionId(null)
    setShowQuestionForm(false)
  }

  const handleEditQuestion = (question) => {
    setQuestionForm({
      question_text: question.question_text || '',
      question_description: question.question_description || '',
      options: question.options && question.options.length === 5
        ? question.options.map((o) => ({ text: o.text || '', hint: o.hint || '', weightage: o.weightage || 0 }))
        : Array(5).fill(null).map(() => ({ ...EMPTY_OPTION })),
    })
    setEditingQuestionId(question.id)
    setShowQuestionForm(true)
  }

  const handleSubmitQuestion = async (e) => {
    e.preventDefault()
    if (!questionForm.question_text.trim()) {
      showWarning('Question text is required.')
      return
    }
    const hasEmptyOption = questionForm.options.some((o) => !o.text.trim())
    if (hasEmptyOption) {
      showWarning('All 5 option texts are required.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        template_id: Number(id),
        question_text: questionForm.question_text.trim(),
        question_description: questionForm.question_description.trim(),
        options: questionForm.options.map((o) => ({
          text: o.text.trim(),
          hint: o.hint.trim(),
          weightage: Number(o.weightage) || 0,
        })),
      }

      let res
      if (editingQuestionId) {
        res = await updateQuestion(editingQuestionId, payload)
      } else {
        res = await addQuestion(payload)
      }

      if (Number(res.code) === 0) {
        showSuccess(res.message || (editingQuestionId ? 'Question updated!' : 'Question added!'))
        resetForm()
        // Reload questions
        const qRes = await getQuestions(id)
        if (Number(qRes.code) === 0 && Array.isArray(qRes.data)) {
          setQuestions(qRes.data)
        }
      } else {
        showError(res.message || 'Failed to save question.')
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
              <div className="detail-value">{template.template_description || '-'}</div>
            </div>
            <div className="suji-detail-row">
              <div className="detail-label">Number of Questions</div>
              <div className="detail-value">
                <CBadge color="primary" shape="rounded-pill">{template.num_questions || 0}</CBadge>
              </div>
            </div>
            <div className="suji-detail-row">
              <div className="detail-label">Keywords</div>
              <div className="detail-value">
                {template.keywords ? (
                  template.keywords.split(',').map((kw, i) => (
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
                    name="question_text"
                    value={questionForm.question_text}
                    onChange={handleQuestionChange}
                    placeholder="e.g. How are you feeling today?"
                    required
                  />
                </div>
                <div className="mb-3">
                  <CFormLabel>Question Description</CFormLabel>
                  <CFormTextarea
                    name="question_description"
                    value={questionForm.question_description}
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
                            value={opt.text}
                            onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                            placeholder={`Option ${idx + 1} text`}
                            required
                          />
                        </CCol>
                        <CCol md={4}>
                          <CFormLabel className="small">Option Hint</CFormLabel>
                          <CFormInput
                            value={opt.hint}
                            onChange={(e) => handleOptionChange(idx, 'hint', e.target.value)}
                            placeholder="Hint for this option"
                          />
                        </CCol>
                        <CCol md={3}>
                          <CFormLabel className="small">Weightage</CFormLabel>
                          <CFormInput
                            type="number"
                            value={opt.weightage}
                            onChange={(e) => handleOptionChange(idx, 'weightage', e.target.value)}
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
                        {editingQuestionId ? 'Update Question' : 'Save Question'}
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
                onClick={() => {
                  resetForm()
                  setShowQuestionForm(true)
                }}
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
                      <CTableDataCell className="fw-semibold">{q.question_text}</CTableDataCell>
                      <CTableDataCell>
                        <span className="text-body-secondary" style={{ fontSize: '0.85rem' }}>
                          {q.question_description
                            ? q.question_description.length > 50
                              ? q.question_description.slice(0, 50) + '...'
                              : q.question_description
                            : '-'}
                        </span>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="primary" shape="rounded-pill">
                          {q.options ? q.options.length : 0}
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
