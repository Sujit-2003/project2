import React, { useEffect, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CButton,
  CSpinner,
  CAlert,
  CFormInput,
  CFormTextarea,
  CFormLabel,
  CForm,
  CCollapse,
  CPagination,
  CPaginationItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilChevronBottom, cilChevronTop } from '@coreui/icons'
import { getAllFaqs, createFaq, updateFaq } from '../../services/faqService'
import { useToast } from '../../components/ToastContext'
import useTableControls from '../../hooks/useTableControls'

const stripHtml = (html) => {
  if (!html) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

const truncate = (text, maxLen = 80) => {
  if (!text) return '-'
  return text.length > maxLen ? text.substring(0, maxLen) + '...' : text
}

const FAQs = () => {
  const { showSuccess, showError, showWarning } = useToast()
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
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

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
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
              <CCard className="mb-3 border-primary">
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
                      <CButton color="secondary" onClick={resetForm}>
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
              className="mb-3"
              style={{ maxWidth: '300px' }}
            />

            {loading && (
              <div className="text-center py-4">
                <CSpinner color="primary" />
              </div>
            )}
            {error && <CAlert color="danger">{error}</CAlert>}
            {!loading && !error && (
              <>
                <CTable hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell style={{ width: '50px' }}>#</CTableHeaderCell>
                      <CTableHeaderCell>Question</CTableHeaderCell>
                      <CTableHeaderCell>Answer</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: '120px' }}>Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {paginatedData.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={4} className="text-center text-muted">
                          No FAQs found.
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      paginatedData.map((faq, index) => {
                        const faqId = faq.faq_id || faq.id
                        const isExpanded = expandedId === faqId
                        return (
                          <React.Fragment key={faqId || index}>
                            <CTableRow>
                              <CTableDataCell>{(currentPage - 1) * 10 + index + 1}</CTableDataCell>
                              <CTableDataCell>{faq.question || '-'}</CTableDataCell>
                              <CTableDataCell>
                                {truncate(stripHtml(faq.response))}
                                {faq.response && stripHtml(faq.response).length > 80 && (
                                  <CButton
                                    color="link"
                                    size="sm"
                                    className="p-0 ms-1"
                                    onClick={() => toggleExpand(faqId)}
                                  >
                                    <CIcon icon={isExpanded ? cilChevronTop : cilChevronBottom} />
                                  </CButton>
                                )}
                              </CTableDataCell>
                              <CTableDataCell>
                                <CButton
                                  color="info"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(faq)}
                                  title="Edit"
                                >
                                  <CIcon icon={cilPencil} />
                                </CButton>
                              </CTableDataCell>
                            </CTableRow>
                            {isExpanded && (
                              <CTableRow>
                                <CTableDataCell colSpan={4}>
                                  <div
                                    className="p-3 bg-light rounded"
                                    dangerouslySetInnerHTML={{ __html: faq.response }}
                                  />
                                </CTableDataCell>
                              </CTableRow>
                            )}
                          </React.Fragment>
                        )
                      })
                    )}
                  </CTableBody>
                </CTable>

                {totalPages > 1 && (
                  <CPagination className="justify-content-center">
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
