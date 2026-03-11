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
  CFormCheck,
  CProgress,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilSave, cilNotes } from '@coreui/icons'
import { getPatients } from '../../services/patientService'
import { getPatientProfile } from '../../services/patientProfileService'
import { getQuestions, getQuestionOptions } from '../../services/questionnaireService'
import { getUmId } from '../../services/authService'
import { submitAnswers, getAnswers } from '../../services/answerService'
import { useToast } from '../../components/ToastContext'

const FillTemplate = () => {
  const { id } = useParams() // patient id
  const navigate = useNavigate()
  const { showSuccess, showError, showWarning } = useToast()

  const [patient, setPatient] = useState(null)
  const [templateName, setTemplateName] = useState('')
  const [templateDesc, setTemplateDesc] = useState('')
  const [templateId, setTemplateId] = useState(null)
  const [questions, setQuestions] = useState([]) // [{ id, question, description, options: [] }]
  const [selectedAnswers, setSelectedAnswers] = useState({}) // { question_id: option_id }
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [previousAnswers, setPreviousAnswers] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        // Load patient
        const umId = getUmId()
        const patsRes = await getPatients(umId)
        if (Number(patsRes.code) !== 0 || !Array.isArray(patsRes.data)) {
          setError('Failed to load patient data.')
          return
        }
        const found = patsRes.data.find((p) => String(p.id) === String(id))
        if (!found) {
          setError('Patient not found.')
          return
        }
        setPatient(found)

        // Load profile to get template_id
        const profileRes = await getPatientProfile(found.id)
        if (Number(profileRes.code) !== 0 || !profileRes.data || !profileRes.data.template_id) {
          setError('No template has been assigned to this patient yet.')
          return
        }
        const tId = profileRes.data.template_id
        setTemplateId(tId)

        // Check if already submitted
        const existing = getAnswers(found.id)
        if (existing && existing.status === 'submitted') {
          setAlreadySubmitted(true)
          setPreviousAnswers(existing)
        }

        // Load questions for the template
        const qRes = await getQuestions(tId)
        if (Number(qRes.code) !== 0 || !Array.isArray(qRes.data) || qRes.data.length === 0) {
          setError('No questions found for the assigned template.')
          return
        }

        // Load options for each question
        const questionsWithOptions = await Promise.all(
          qRes.data.map(async (q) => {
            try {
              const optRes = await getQuestionOptions(q.id)
              const options = (Number(optRes.code) === 0 && Array.isArray(optRes.data)) ? optRes.data : []
              return { ...q, options }
            } catch {
              return { ...q, options: [] }
            }
          }),
        )
        setQuestions(questionsWithOptions)

        // Find template name from the questions response or profile
        // Use import to get templates
        try {
          const { getTemplates } = await import('../../services/questionnaireService')
          const tplRes = await getTemplates()
          if (Number(tplRes.code) === 0 && Array.isArray(tplRes.data)) {
            const tpl = tplRes.data.find((t) => t.id === tId)
            if (tpl) {
              setTemplateName(tpl.template_name)
              setTemplateDesc(tpl.template_desc)
            }
          }
        } catch { /* ignore */ }

        // Pre-fill answers if already submitted
        if (existing && existing.answers) {
          const prefill = {}
          existing.answers.forEach((a) => {
            prefill[a.question_id] = a.option_id
          })
          setSelectedAnswers(prefill)
        }
      } catch (err) {
        setError(err?.message || 'Failed to load template.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleSelectOption = (questionId, optionId) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }))
  }

  const answeredCount = Object.keys(selectedAnswers).length
  const totalQuestions = questions.length
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0

  const handleSubmit = () => {
    if (answeredCount < totalQuestions) {
      showWarning(`Please answer all questions. ${totalQuestions - answeredCount} remaining.`)
      return
    }

    setSubmitting(true)
    try {
      // Build answers array
      const answers = questions.map((q) => {
        const selectedOptId = selectedAnswers[q.id]
        const selectedOpt = q.options.find((o) => o.id === selectedOptId)
        return {
          question_id: q.id,
          question: q.question,
          option_id: selectedOptId,
          answer: selectedOpt?.opt_text || '',
          weightage: selectedOpt?.opt_weightge || 0,
        }
      })

      const result = submitAnswers(patient.id, templateId, answers)
      if (Number(result.code) === 0) {
        showSuccess('Template answers submitted successfully!')
        setTimeout(() => navigate(`/patients/${patient.id}`), 1000)
      } else {
        showError(result.message || 'Failed to submit answers.')
      }
    } catch {
      showError('Error submitting answers.')
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
    return (
      <CRow className="justify-content-center">
        <CCol lg={8}>
          <CAlert color="danger">{error}</CAlert>
          <CButton color="light" onClick={() => navigate(`/patients/${id}`)}>
            <CIcon icon={cilArrowLeft} className="me-1" />
            Back to Patient
          </CButton>
        </CCol>
      </CRow>
    )
  }

  return (
    <CRow className="justify-content-center">
      <CCol lg={8}>
        {/* Header Card */}
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <div>
              <strong>{templateName || 'Questionnaire'}</strong>
              <div className="small text-body-secondary mt-1">
                Patient: {patient.patient_fname} {patient.patient_lname}
              </div>
            </div>
            <CButton color="light" size="sm" onClick={() => navigate(`/patients/${id}`)}>
              <CIcon icon={cilArrowLeft} className="me-1" />
              Back
            </CButton>
          </CCardHeader>
          <CCardBody>
            {templateDesc && (
              <p className="text-body-secondary mb-3">{templateDesc}</p>
            )}
            <div className="d-flex align-items-center gap-3 mb-2">
              <span className="small fw-semibold">Progress: {answeredCount}/{totalQuestions}</span>
              <CBadge color={progress === 100 ? 'success' : 'warning'} shape="rounded-pill">
                {progress}%
              </CBadge>
            </div>
            <CProgress value={progress} color={progress === 100 ? 'success' : 'primary'} className="mb-0" />
          </CCardBody>
        </CCard>

        {alreadySubmitted && (
          <CAlert color="info" className="d-flex align-items-center gap-2">
            <CIcon icon={cilNotes} height={18} />
            You have already submitted answers for this template. You can update your responses below.
          </CAlert>
        )}

        {/* Questions */}
        {questions.map((q, qIndex) => {
          const selectedOptId = selectedAnswers[q.id]
          return (
            <CCard key={q.id} className="mb-3">
              <CCardBody>
                <div className="d-flex align-items-start gap-3 mb-3">
                  <CBadge
                    color={selectedOptId ? 'success' : 'secondary'}
                    shape="rounded-pill"
                    style={{ minWidth: '28px', textAlign: 'center', marginTop: '2px' }}
                  >
                    {qIndex + 1}
                  </CBadge>
                  <div>
                    <div className="fw-semibold" style={{ fontSize: '1rem' }}>{q.question}</div>
                    {q.description && (
                      <div className="small text-body-secondary mt-1">{q.description}</div>
                    )}
                  </div>
                </div>
                <div className="ms-4">
                  {q.options.length > 0 ? (
                    q.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`p-2 px-3 mb-2 rounded border cursor-pointer ${selectedOptId === opt.id ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSelectOption(q.id, opt.id)}
                      >
                        <CFormCheck
                          type="radio"
                          name={`question_${q.id}`}
                          id={`opt_${opt.id}`}
                          label={
                            <span>
                              <strong>{opt.opt_text}</strong>
                              {opt.opt_hint && (
                                <span className="text-body-secondary ms-2">— {opt.opt_hint}</span>
                              )}
                            </span>
                          }
                          checked={selectedOptId === opt.id}
                          onChange={() => handleSelectOption(q.id, opt.id)}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-body-secondary small">No options available for this question.</div>
                  )}
                </div>
              </CCardBody>
            </CCard>
          )
        })}

        {/* Submit */}
        <CCard className="mb-4">
          <CCardBody className="d-flex justify-content-between align-items-center">
            <div className="text-body-secondary small">
              {answeredCount < totalQuestions
                ? `${totalQuestions - answeredCount} question(s) remaining`
                : 'All questions answered — ready to submit!'}
            </div>
            <CButton
              color="success"
              disabled={submitting || answeredCount < totalQuestions}
              onClick={handleSubmit}
              style={{ minWidth: '160px' }}
            >
              {submitting ? (
                <CSpinner size="sm" />
              ) : (
                <>
                  <CIcon icon={cilSave} className="me-1" />
                  {alreadySubmitted ? 'Update Answers' : 'Submit Answers'}
                </>
              )}
            </CButton>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default FillTemplate
