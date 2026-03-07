import React, { useEffect, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CSpinner,
  CAlert,
  CFormInput,
  CFormTextarea,
  CFormLabel,
  CForm,
  CCollapse,
  CAccordion,
  CAccordionItem,
  CAccordionHeader,
  CAccordionBody,
  CPagination,
  CPaginationItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil } from '@coreui/icons'
import { getAllFaqs, createFaq, updateFaq } from '../../services/faqService'
import { useToast } from '../../components/ToastContext'
import useTableControls from '../../hooks/useTableControls'

const FAQs = () => {
  const { showSuccess, showError, showWarning } = useToast()
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ question: '', response: '' })

  const {
    paginatedData,
    currentPage,
    totalPages,
    searchTerm,
    setCurrentPage,
    setSearchTerm,
  } = useTableControls(faqs, ['question', 'response'])

  const loadFaqs = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAllFaqs()
      let data = []
      if (Array.isArray(res)) data = res
      else if (Array.isArray(res.data)) data = res.data
      setFaqs(data)
    } catch (err) {
      setError(err?.message || 'Failed to load FAQs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFaqs()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const resetForm = () => {
    setForm({ question: '', response: '' })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (faq) => {
    setEditingId(faq.faq_id || faq.id)
    setForm({
      question: faq.question || '',
      response: faq.response || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.question.trim()) {
      showWarning('Question is required.')
      return
    }
    if (!form.response.trim()) {
      showWarning('Answer is required.')
      return
    }

    setSubmitting(true)
    try {
      let res
      if (editingId) {
        res = await updateFaq(editingId, form)
      } else {
        res = await createFaq(form)
      }

      if (Number(res.code) === 0) {
        showSuccess(res.message || (editingId ? 'FAQ updated successfully!' : 'FAQ added successfully!'))
        resetForm()
        await loadFaqs()
      } else {
        showError(res.message || 'Failed to save FAQ.')
      }
    } catch {
      showError('Network error saving FAQ.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>FAQs</strong>
            <CButton
              color="primary"
              size="sm"
              onClick={() => {
                if (showForm && !editingId) {
                  resetForm()
                } else {
                  setEditingId(null)
                  setForm({ question: '', response: '' })
                  setShowForm(true)
                }
              }}
            >
              <CIcon icon={cilPlus} className="me-1" />
              {showForm && !editingId ? 'Cancel' : 'Add FAQ'}
            </CButton>
          </CCardHeader>
          <CCardBody>
            {/* Inline Add/Edit Form */}
            <CCollapse visible={showForm}>
              <CCard className="mb-4" style={{ borderLeft: '3px solid var(--suji-primary)' }}>
                <CCardHeader>
                  <strong>{editingId ? 'Edit FAQ' : 'Add New FAQ'}</strong>
                </CCardHeader>
                <CCardBody>
                  <CForm onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <CFormLabel>Question</CFormLabel>
                      <CFormInput
                        name="question"
                        value={form.question}
                        onChange={handleChange}
                        placeholder="Enter the FAQ question"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <CFormLabel>Answer</CFormLabel>
                      <CFormTextarea
                        name="response"
                        value={form.response}
                        onChange={handleChange}
                        rows={5}
                        placeholder="Enter the FAQ answer"
                        required
                      />
                    </div>
                    <div className="d-flex gap-2">
                      <CButton color="primary" type="submit" disabled={submitting}>
                        {submitting ? <CSpinner size="sm" /> : editingId ? 'Update FAQ' : 'Add FAQ'}
                      </CButton>
                      <CButton color="secondary" variant="outline" onClick={resetForm}>
                        Cancel
                      </CButton>
                    </div>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCollapse>

            {/* Search */}
            <CFormInput
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
              style={{ maxWidth: '300px' }}
            />

            {loading && (
              <div className="suji-loading">
                <CSpinner color="primary" />
              </div>
            )}
            {error && <CAlert color="danger">{error}</CAlert>}

            {!loading && !error && (
              <>
                {paginatedData.length === 0 ? (
                  <div className="suji-empty-state">No FAQs found.</div>
                ) : (
                  <CAccordion flush>
                    {paginatedData.map((faq, index) => {
                      const faqId = faq.faq_id || faq.id
                      return (
                        <CAccordionItem key={faqId || index} itemKey={faqId || index + 1}>
                          <CAccordionHeader>
                            <div className="d-flex justify-content-between align-items-center w-100 me-3">
                              <span>
                                <span className="text-body-secondary me-2" style={{ fontSize: '0.8rem' }}>
                                  {(currentPage - 1) * 10 + index + 1}.
                                </span>
                                {faq.question || '-'}
                              </span>
                            </div>
                          </CAccordionHeader>
                          <CAccordionBody>
                            <div
                              className="mb-3"
                              style={{ lineHeight: '1.7' }}
                              dangerouslySetInnerHTML={{ __html: faq.response || '<em>No answer provided.</em>' }}
                            />
                            <CButton
                              color="info"
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(faq)}
                            >
                              <CIcon icon={cilPencil} size="sm" className="me-1" />
                              Edit
                            </CButton>
                          </CAccordionBody>
                        </CAccordionItem>
                      )
                    })}
                  </CAccordion>
                )}

                {totalPages > 1 && (
                  <CPagination className="justify-content-center mt-4">
                    <CPaginationItem
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </CPaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <CPaginationItem
                        key={i + 1}
                        active={currentPage === i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </CPaginationItem>
                    ))}
                    <CPaginationItem
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </CPaginationItem>
                  </CPagination>
                )}
              </>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default FAQs
